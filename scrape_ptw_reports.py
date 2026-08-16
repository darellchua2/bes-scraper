"""Monthly PTW register exporter for service.globalbes.sg (pure HTTP).

Uses the listing page's "PTW Report" button pipeline:
  1. POST license/upload/export {month, program_id} queues an async export task.
  2. POST license/upload/task {program_id} lists tasks; ours is Done when
     status == '1' and a report URL is attached.
  3. GET license/upload/exportdownload&id=<task_id> returns the .xlsx register:
     S/N, location, work type, company, serial no, permit start/end, approver,
     status — the historical permit listing the live grid no longer shows.

Month encoding quirk: the site's JS pre-encodes the space ('Aug 2026' ->
'Aug%202026') and the server urldecodes; sending a plain space drops the year.

Writes downloads/ptwreports/YYYY-MM.xlsx; idempotent (existing files skipped).
Env: PTW_PROGRAM_ID, PTW_REPORT_DIR, PTW_REPORT_FROM (YYYY-MM, default 2018-01).
Usage: .venv/bin/python scrape_ptw_reports.py
"""
import json
import os
import sys
import time
from datetime import date
from pathlib import Path

import requests

sys.path.insert(0, ".")
from ptw_scraper import BASE, PROGRAM_ID, http_login, log  # noqa: E402

OUT_DIR = Path(os.environ.get("PTW_REPORT_DIR", "downloads/ptwreports"))
START = os.environ.get("PTW_REPORT_FROM", "2018-01")
POLL_SECONDS = 300

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def month_labels(start: str) -> list[tuple[str, str]]:
    """(label, key) pairs from start (YYYY-MM) through the current month."""
    y, m = int(start[:4]), int(start[5:7])
    today = date.today()
    out = []
    while (y, m) <= (today.year, today.month):
        out.append((f"{MONTHS[m - 1]} {y}", f"{y:04d}-{m:02d}"))
        m, y = (m % 12) + 1, y + (m == 12)
    return out


def post_json(s, route: str, data: dict) -> dict | list:
    """POST a form and parse the JSON body, retrying timeouts/non-JSON replies."""
    r = None
    for attempt in range(5):
        try:
            r = s.post(f"{BASE}?r={route}", data=data, timeout=60)
            if r.status_code == 200 and r.text.lstrip()[:1] in "{[":
                return json.loads(r.text)
        except requests.RequestException as e:
            log(f"POST {route}: {type(e).__name__} (retry {attempt + 1}/5)")
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"POST {route}: no JSON after retries")


def task_list(s) -> list[dict]:
    """Current export-task rows (newest first) for this program."""
    return post_json(s, "license/upload/task", {"program_id": PROGRAM_ID})


def queue_export(s, label: str) -> int:
    """Queue one monthly export; returns the new task id (0 = not queued).

    The gateway often answers this POST with a 502 *after* the backend has
    already enqueued the task, so the response body is unreliable — success
    is detected by a new row appearing in the task list instead.
    """
    before = max((int(t["id"]) for t in task_list(s)), default=0)
    try:
        s.post(f"{BASE}?r=license/upload/export",
               data={"month": label.replace(" ", "%20"), "program_id": PROGRAM_ID},
               timeout=60)
    except requests.RequestException:
        pass  # response unreliable; the task list is the source of truth
    for _ in range(10):
        for t in task_list(s):
            if int(t["id"]) > before:
                return int(t["id"])
        time.sleep(3)
    return 0


def wait_done(s, task_id: int) -> bool:
    """Poll until the task is Done (True) or errors/times out (False)."""
    deadline = time.time() + POLL_SECONDS
    while time.time() < deadline:
        for t in task_list(s):
            if int(t["id"]) == task_id:
                if t["status"] == "1" and t.get("url"):
                    return True
                if t.get("error_message"):
                    log(f"task {task_id} error: {t['error_message']}")
                    return False
        time.sleep(3)
    log(f"task {task_id}: timed out after {POLL_SECONDS}s")
    return False


def run() -> int:
    """Queue/poll/download every missing monthly register; returns exit code."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    s = http_login()
    failures = 0
    for label, key in month_labels(START):
        dest = OUT_DIR / f"{key}.xlsx"
        if dest.exists():
            continue
        task_id = queue_export(s, label)
        if not task_id:
            log(f"{label}: queue failed")
            failures += 1
            continue
        if not wait_done(s, task_id):
            failures += 1
            continue
        d = s.get(f"{BASE}?r=license/upload/exportdownload&id={task_id}", timeout=120)
        if d.status_code == 200 and d.content[:2] == b"PK":
            dest.write_bytes(d.content)
            log(f"{label}: {len(d.content)} bytes -> {dest.name}")
        else:
            log(f"{label}: bad download (HTTP {d.status_code}, magic {d.content[:8]!r})")
            failures += 1
        time.sleep(1)
    log(f"done: {len(list(OUT_DIR.glob('*.xlsx')))} file(s), {failures} failure(s)")
    return 3 if failures else 0


if __name__ == "__main__":
    sys.exit(run())
