"""Scrape the staff register into downloads/staff/staff.jsonl.

Walks comp/staff/grid pages (20 rows each, newest first), parses row metadata
per schemas/staff-record.schema.json, and writes one JSON object per line.
Badge numbers embedded in the Full Name column (e.g. "( JYB- 2678 ) SARKER
TAPAN") are split into badge_no + clean full_name. Idempotent: re-running
refreshes the file from the live grid.

Env: PTW_PROGRAM_ID (default 3021). Exit codes: 0 ok, 2 login fail, 3 parse
mismatch (rows written vs grid total).
"""
import json
import re
import sys
from pathlib import Path

from ptw_scraper import BASE, PROGRAM_ID, connect, log

OUT_FILE = Path("downloads/staff/staff.jsonl")
BADGE_RE = re.compile(r"^\(\s*([A-Za-z0-9\- ]+?)\s*\)\s*(.*)$")


def split_name(raw: str) -> tuple[str, str]:
    """Split '( BADGE-123 ) FULL NAME' into (badge_no, full_name)."""
    m = BADGE_RE.match(raw)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return "", raw.strip()


def parse_staff_rows(html: str) -> list[dict]:
    """Extract staff metadata rows from one grid page HTML."""
    rows = []
    for tr_attr, tr_body in re.findall(r"<tr([^>]*)>(.*?)</tr>", html, re.S):
        m = re.search(r"getDetail\(this,'(\d+)'\)", tr_attr)
        if not m:
            continue
        tds = [re.sub(r"<[^>]+>", "", td).strip()
               for td in re.findall(r"<td[^>]*>(.*?)</td>", tr_body, re.S)]
        if len(tds) < 10:
            continue
        badge_no, full_name = split_name(tds[2])
        rows.append({
            "staff_id": m.group(1),
            "sn": tds[1],
            "full_name": full_name,
            "badge_no": badge_no,
            "mobile_no": tds[3],
            "nric_fin": tds[4],
            "id_type": tds[5],
            "nationality": tds[6],
            "designation": tds[7],
            "secondment": tds[8],
            "status": tds[9],
            "created_on": tds[10],
        })
    return rows


def total_entries(s) -> int:
    """Parse total entry count from the grid info line."""
    g = s.get(f"{BASE}?r=comp/staff/grid&page=0", timeout=60)
    m = re.search(r"(\d+)\s*entr", g.text)
    return int(m.group(1)) if m else 0


def run() -> int:
    """Main entry: login, walk staff grid, write downloads/staff/staff.jsonl."""
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    s = connect()
    # the staff list page sets the needed referer
    s.get(f"{BASE}?r=comp/staff/list&program_id={PROGRAM_ID}", timeout=30)

    total = total_entries(s)
    n_pages = (total + 19) // 20 if total else 1
    log(f"{total} staff entries; walking {n_pages} page(s)")

    seen: dict[str, dict] = {}
    for page in range(n_pages):
        g = s.get(f"{BASE}?r=comp/staff/grid&page={page}", timeout=60)
        if g.status_code != 200:
            log(f"page {page + 1}: HTTP {g.status_code}; aborting")
            return 3
        rows = parse_staff_rows(g.text)
        if not rows:
            log(f"page {page + 1}: 0 rows parsed; aborting")
            return 3
        for r in rows:
            seen[r["staff_id"]] = r
        if page % 25 == 0 or page == n_pages - 1:
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
