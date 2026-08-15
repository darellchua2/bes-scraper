"""Scrape the company-document register into downloads/company/company.jsonl.

Walks document/company/grid pages (20 rows each, newest first), parses row
metadata per schemas/company-document.schema.json, and writes one JSON object
per line. document_id comes from the row's itemDownload("<id>") handler.
Idempotent: re-running refreshes the file from the live grid.

Env: PTW_PROGRAM_ID (default 3021). Exit codes: 0 ok, 2 login fail, 3 parse
mismatch (rows written vs grid total).
"""
import json
import re
import sys
from pathlib import Path

from ptw_scraper import BASE, PROGRAM_ID, connect, log

OUT_FILE = Path("downloads/company/company.jsonl")


def parse_company_rows(html: str) -> list[dict]:
    """Extract company-document rows from one grid page HTML."""
    rows = []
    for _tr_attr, tr_body in re.findall(r"<tr([^>]*)>(.*?)</tr>", html, re.S):
        m = re.search(r'itemDownload\("(\d+)"\)', tr_body)
        if not m:
            continue
        tds = [re.sub(r"<[^>]+>", "", td).strip()
               for td in re.findall(r"<td[^>]*>(.*?)</td>", tr_body, re.S)]
        if len(tds) < 4:
            continue
        # data rows carry an upload date in the 4th column
        if not re.search(r"\d{2}\s+[A-Za-z]{3}\s+\d{4}", tds[3]):
            continue
        rows.append({
            "document_id": m.group(1),
            "document_name": tds[0],
            "favorite": tds[1],
            "label": tds[2],
            "uploaded_on": tds[3],
        })
    return rows


def total_entries(s) -> int:
    """Parse total entry count from the grid info line."""
    g = s.get(f"{BASE}?r=document/company/grid&page=0", timeout=60)
    m = re.search(r"(\d+)\s*entr", g.text)
    return int(m.group(1)) if m else 0


def run() -> int:
    """Main entry: login, walk company grid, write downloads/company/company.jsonl."""
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    s = connect()
    # the company-document list page sets the needed referer
    s.get(f"{BASE}?r=document/company/list&program_id={PROGRAM_ID}", timeout=30)

    total = total_entries(s)
    n_pages = (total + 19) // 20 if total else 1
    log(f"{total} company-document entries; walking {n_pages} page(s)")

    seen: dict[str, dict] = {}
    for page in range(n_pages):
        g = s.get(f"{BASE}?r=document/company/grid&page={page}", timeout=60)
        if g.status_code != 200:
            log(f"page {page + 1}: HTTP {g.status_code}; aborting")
            return 3
        rows = parse_company_rows(g.text)
        if not rows:
            log(f"page {page + 1}: 0 rows parsed; aborting")
            return 3
        for r in rows:
            key = f"{r['document_name']}|{r['uploaded_on']}"
            seen[key] = r
        log(f"page {page + 1}/{n_pages}: cumulative {len(seen)}")

    with open(OUT_FILE, "w") as f:
        for r in seen.values():
            f.write(json.dumps(r) + "\n")
    log(f"wrote {OUT_FILE} ({len(seen)} records)")

    if total and len(seen) != total:
        log(f"warning: parsed {len(seen)} != grid total {total}")
        return 3
    return 0


def main() -> int:
    """Console entry point."""
    return run()


if __name__ == "__main__":
    sys.exit(main())
