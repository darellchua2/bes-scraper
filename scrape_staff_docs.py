"""Scrape per-worker document attachments into downloads/staff/staff_docs.jsonl.

For every staff_id in downloads/staff/staff.jsonl, POSTs comp/staff/attachlist
and parses the document table (Document No. / Type / Issue Date / Expiry Date /
Uploaded On) — this is where BES tracks certificate/passport expiries. One
JSONL line per worker: {"staff_id": ..., "documents": [...]} (nested, mirrors
the staff_documents child table). Idempotent: workers already present in the
output file are skipped, so re-running resumes after an interruption.

Env: PTW_PROGRAM_ID (default 3021). Exit codes: 0 ok, 2 login fail.
"""
import json
import re
import sys
import time
from pathlib import Path

import requests

from ptw_scraper import BASE, http_login, log

STAFF_FILE = Path("downloads/staff/staff.jsonl")
OUT_FILE = Path("downloads/staff/staff_docs.jsonl")
POLITENESS_SECONDS = 0.5

CELL_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
ROW_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S)
TAG_RE = re.compile(r"<[^>]+>")


def parse_attach_rows(html: str) -> list[dict]:
    """Extract document rows from the attachlist table HTML.

    The table interleaves one-cell 'Edit' rows; real rows carry 6+ cells:
    document_no, favorite, doc_type, issue_date, expiry_date, uploaded_on, …
    """
    docs = []
    for tr in ROW_RE.findall(html):
        cells = [TAG_RE.sub("", c).strip() for c in CELL_RE.findall(tr)]
        if len(cells) < 6 or not cells[0]:
            continue
        docs.append({
            "document_no": cells[0],
            "doc_type": cells[2],
            "issue_date": cells[3] or None,
            "expiry_date": cells[4] or None,
            "uploaded_on": cells[5] or None,
        })
    return docs


def fetch_docs(s, staff_id: str) -> list[dict]:
    """Fetch one worker's attachment list, retrying transient failures."""
    for attempt in range(4):
        try:
            r = s.get(f"{BASE}?r=comp/staff/attachlist&user_id={staff_id}",
                      timeout=30)
            if r.status_code == 200:
                return parse_attach_rows(r.text)
        except requests.RequestException:
            pass
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"attachlist failed for staff {staff_id}")


def run() -> int:
    """Scrape document lists for all staff not already in the output file."""
    staff_ids = [json.loads(l)["staff_id"]
                 for l in STAFF_FILE.read_text().splitlines() if l.strip()]
    done = set()
    if OUT_FILE.exists():
        done = {json.loads(l)["staff_id"]
                for l in OUT_FILE.read_text().splitlines() if l.strip()}
    todo = [sid for sid in staff_ids if sid not in done]
    log(f"staff: {len(staff_ids)}, already scraped: {len(done)}, todo: {len(todo)}")
    if not todo:
        log("nothing to do")
        return 0

    s = http_login()
    with OUT_FILE.open("a") as f:
        for i, sid in enumerate(todo, 1):
            docs = fetch_docs(s, sid)
            f.write(json.dumps({"staff_id": sid, "documents": docs}) + "\n")
            f.flush()
            if i % 25 == 0 or i == len(todo):
                log(f"{i}/{len(todo)} workers ({len(docs)} docs in last)")
            time.sleep(POLITENESS_SECONDS)
    log("done")
    return 0


if __name__ == "__main__":
    sys.exit(run())
