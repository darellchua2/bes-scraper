"""Scrape per-PTW extras (workflow trail, checklist ids, attachment ids).

For every PTW in downloads/ptw/.state.json, fetches three ajax endpoints:
  - preview&apply_id            -> approval workflow steps (Step N NAME Role)
  - downloadpreview&apply_id    -> checklist report apply_ids (downloadcheck)
  - downloadattachment&apply_id -> attachment ids (downloadattachment)

Writes one JSON record per PTW to downloads/ptw/extras.jsonl:
  {apply_id, workflow: [{step, approver_name, role}],
   checklist_report_ids: [], attachment_ids: []}

Idempotent: re-running refreshes the file. Exit codes: 0 ok, 2 login fail,
3 incomplete.
"""
import json
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ptw_scraper import BASE, UA, grid_session, http_login, log

OUT_FILE = Path("downloads/ptw/extras.jsonl")
WORKERS = 4

STEP_RE = re.compile(r"Step\s+(\d+)\s+(.*?)\s\s+(\S.*?)\s*$", re.M)
CHECK_RE = re.compile(r"downloadcheck\(['\"](\d+)['\"]\)")
ATTACH_RE = re.compile(r"downloadattachment\(['\"]?(\d+)['\"]?\s*,\s*['\"]?(\d+)['\"]?\)?")

_tls = threading.local()


def fetch_session(cookies):
    """Thread-local authenticated session for per-PTW endpoint calls."""
    s = getattr(_tls, "s", None)
    if s is None:
        import requests
        s = _tls.s = requests.Session()
        s.headers.update({
            "User-Agent": UA,
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{BASE}?r=license/licensepdf/list",
        })
        s.cookies.update(cookies)
    return s


def parse_steps(html: str) -> list[dict]:
    """Extract workflow steps from a preview timeline fragment."""
    text = re.sub(r"<[^>]+>", "", html)
    return [{"step": int(n), "approver_name": name.strip(), "role": role.strip()}
            for n, name, role in STEP_RE.findall(text)]


def scrape_extras(cookies, apply_id: str) -> dict:
    """Fetch and parse the three per-PTW endpoints for one apply_id."""
    s = fetch_session(cookies)
    rec = {"apply_id": apply_id, "workflow": [],
           "checklist_report_ids": [], "attachment_ids": []}

    p = s.get(f"{BASE}?r=license/licensepdf/preview&apply_id={apply_id}&app_id=PTW",
              timeout=60)
    if p.status_code == 200:
        rec["workflow"] = parse_steps(p.text)

    d = s.get(f"{BASE}?r=license/licensepdf/downloadpreview&apply_id={apply_id}&app_id=PTW",
              timeout=60)
    if d.status_code == 200:
        rec["checklist_report_ids"] = CHECK_RE.findall(d.text)

    a = s.get(f"{BASE}?r=license/licensepdf/downloadattachment&apply_id={apply_id}&app_id=PTW",
              timeout=60)
    if a.status_code == 200:
        rec["attachment_ids"] = [att for att, app in ATTACH_RE.findall(a.text)
                                 if app == apply_id]
    return rec


def main() -> int:
    """Entry: login, scrape extras for all known PTWs, write JSONL."""
    rows = json.loads(Path("downloads/ptw/.state.json").read_text())["rows"]
    ids = list(rows)
    log(f"{len(ids)} PTWs to scrape extras for")

    try:
        s = grid_session(http_login())
    except RuntimeError as e:
        log(str(e))
        return 2
    cookies = s.cookies

    def safe(apply_id):
        try:
            return scrape_extras(cookies, apply_id), None
        except Exception as e:  # noqa: BLE001 - per-record, not fatal
            return None, e

    failures = 0
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w") as f, ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for i, (rec, err) in enumerate(pool.map(safe, ids), 1):
            if err is not None:
                failures += 1
                log(f"error {err}")
                continue
            f.write(json.dumps(rec) + "\n")
            if i % 200 == 0:
                log(f"{i}/{len(ids)}")
    log(f"done: {len(ids) - failures}/{len(ids)} records, {failures} failure(s)")
    return 3 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
