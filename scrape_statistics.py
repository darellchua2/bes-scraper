"""Scrape statistics counters (moduledaycnt) into downloads/statistics/.

POST statistics/module/moduledaycnt {id, start_date, end_date} returns a
JSON list of 12 counters {label, label_table, data} aggregated over the
window (dd MMM yyyy format). modulemonthcnt (monlist sibling) returns HTTP
500 server-side and is skipped.

Writes one JSONL record per calendar month since 2017 (site's earliest data)
plus a year-to-date record:
  {window: "YYYY-MM"|"YTD-YYYY", start_date, end_date,
   counters: {label: data, ...}}

Idempotent: re-running refreshes the file. Exit codes: 0 ok, 2 login fail.
"""
import json
import sys
from datetime import date
from pathlib import Path

from ptw_scraper import BASE, http_login, log

OUT_FILE = Path("downloads/statistics/statistics.jsonl")
MONTH_FMT = "%d %b %Y"


def month_windows(start_year: int, today: date) -> list[tuple[str, str, str]]:
    """Yield (label, start, end) for each month start_year..current + YTD."""
    windows = []
    for y in range(start_year, today.year + 1):
        for m in range(1, 13):
            first = date(y, m, 1)
            if first > today:
                break
            nxt = date(y + (m == 12), (m % 12) + 1, 1)
            last = min(nxt, today)
            windows.append((f"{y}-{m:02d}", first.strftime(MONTH_FMT),
                            last.strftime(MONTH_FMT)))
        windows.append((f"YTD-{y}", date(y, 1, 1).strftime(MONTH_FMT),
                        min(date(y, 12, 31), today).strftime(MONTH_FMT)))
    return windows


def main() -> int:
    """Entry: login, fetch counters per month window, write JSONL."""
    try:
        s = http_login()
    except RuntimeError as e:
        log(str(e))
        return 2
    s.headers.update({"X-Requested-With": "XMLHttpRequest",
                      "Referer": f"{BASE}?r=statistics/module/daylist&program_id=3021"})

    today = date.today()
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w") as f:
        for label, sd, ed in month_windows(2017, today):
            r = s.post(f"{BASE}?r=statistics/module/moduledaycnt",
                       data={"id": "3021", "start_date": sd, "end_date": ed},
                       timeout=60)
            if r.status_code != 200:
                log(f"{label}: HTTP {r.status_code}, skipping")
                continue
            payload = r.json()
            if not payload:  # windows before project start return null
                continue
            counters = {c["label"]: c["data"] for c in payload}
            f.write(json.dumps({"window": label, "start_date": sd,
                                "end_date": ed, "counters": counters}) + "\n")
            log(f"{label}: {counters.get('PTW', '?')} PTWs")
    log(f"written: {OUT_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
