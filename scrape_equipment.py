"""Scrape the equipment register into data/equipment.jsonl.

Walks device/equipment/grid pages (20 rows each, newest first), parses row
metadata per schemas/equipment-record.schema.json, and writes one JSON object
per line. Idempotent: re-running refreshes the file from the live grid.

Env: PTW_PROGRAM_ID (default 3021). Exit codes: 0 ok, 2 login fail, 3 parse
mismatch (rows written vs grid total).
"""
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

from ptw_scraper import BASE, PROGRAM_ID, connect, log

OUT_FILE = Path("data/equipment.jsonl")


def parse_equipment_rows(html: str) -> list[dict]:
    """Extract equipment metadata rows from one grid page HTML."""
    rows = []
    for tr_attr, tr_body in re.findall(r"<tr([^>]*)>(.*?)</tr>", html, re.S):
        m = re.search(r"getDetail\(this,'(\d+)'\)", tr_attr)
        if not m:
            continue
        tds = [re.sub(r"<[^>]+>", "", td).strip()
               for td in re.findall(r"<td[^>]*>(.*?)</td>", tr_body, re.S)]
        if len(tds) < 6:
            continue
        rows.append({
            "equipment_id": m.group(1),
            "equipment_type": tds[1],
            "registration_no": tds[2],
            "equipment_name": tds[3],
            "status": tds[4],
            "created_on": tds[5],
        })
    return rows


def total_entries(s) -> int:
    """Parse total entry count from the grid info line."""
    g = s.get(f"{BASE}?r=device/equipment/grid&page=0", timeout=60)
    m = re.search(r"(\d+)\s*entr", g.text)
    return int(m.group(1)) if m else 0


def run() -> int:
    """Main entry: login, walk equipment grid, write data/equipment.jsonl."""
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    s = connect()
    # the equipment list page sets the needed referer
    s.get(f"{BASE}?r=device/equipment/list&program_id={PROGRAM_ID}", timeout=30)

    total = total_entries(s)
    n_pages = (total + 19) // 20 if total else 1
    log(f"{total} equipment entries; walking {n_pages} page(s)")

    seen: dict[str, dict] = {}
    for page in range(n_pages):
        g = s.get(f"{BASE}?r=device/equipment/grid&page={page}", timeout=60)
        if g.status_code != 200:
            log(f"page {page + 1}: HTTP {g.status_code}; aborting")
            return 3
        rows = parse_equipment_rows(g.text)
        if not rows:
            log(f"page {page + 1}: 0 rows parsed; aborting")
            return 3
        for r in rows:
            seen[r["equipment_id"]] = r
        if page % 20 == 0 or page == n_pages - 1:
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
