"""Scrape per-company/day statistics (dateappgrid) into downloads/statistics/.

GET statistics/module/dateappgrid?q[program_id]=3021&q[start_date]=..
&q[end_date]=.. returns per-(date, company) rows with counters for every
module: PTW, TBM, Inspection, Meeting, Training, RA, Checklist, Incident.
This is the only place TBM activity is exposed to web accounts; individual
TBM records live in the mobile app only.

Walks calendar years from START_YEAR (site's earliest data) to the current
year, fetching every grid page per year window. Writes one JSONL record per
(date, company):
  {date, company, ptw_cnt, ptw_staff, tbm_cnt, tbm_staff, inspection_cnt,
   meeting_cnt, meeting_staff, training_cnt, training_staff, ra_cnt,
   checklist_cnt, incident_cnt}

Participant cells keep their raw "x/y" format. Idempotent: re-running
rewrites the file. Exit codes: 0 ok, 2 login fail.
"""
import json
import re
import sys
import time
from datetime import date
from pathlib import Path

from ptw_scraper import BASE, PROGRAM_ID, http_login, log

OUT_FILE = Path("downloads/statistics/company_daily.jsonl")
START_YEAR = 2017
MONTH_FMT = "%d %b %Y"
COLUMNS = ["ptw_cnt", "ptw_staff", "tbm_cnt", "tbm_staff", "inspection_cnt",
           "meeting_cnt", "meeting_staff", "training_cnt", "training_staff",
           "ra_cnt", "checklist_cnt", "incident_cnt"]


def grid_url(sd: str, ed: str, page: int) -> str:
    """Build a dateappgrid URL for one page of a date window."""
    return (f"{BASE}?r=statistics/module/dateappgrid&page={page}"
            f"&q%5Bprogram_id%5D={PROGRAM_ID}&q%5Bstart_date%5D={sd}"
            f"&q%5Bend_date%5D={ed}&contractor_id=&operator_id="
            f"&operator_name=&q_order=")


def parse_rows(html: str) -> list[list[str]]:
    """Extract data rows (date/company + 12 counter cells) from grid HTML."""
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S):
        tds = [re.sub(r"<[^>]+>", "", td).replace("&nbsp;", "").strip()
               for td in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(tds) == 2 + len(COLUMNS) and re.match(r"\d{4}-\d{2}-\d{2}", tds[0]):
            rows.append(tds)
    return rows


def fetch_window(s, sd: str, ed: str) -> list[dict]:
    """Fetch every page of one date window; return unique records.

    The server's paginator sometimes re-serves earlier pages within a window
    (observed: identical rows returned hundreds of times for 2021), so we
    dedupe on (date, company) and stop once a page yields no new rows.
    """
    out: dict[tuple[str, str], dict] = {}
    page = 0
    while True:
        r = s.get(grid_url(sd, ed, page), timeout=120)
        if r.status_code != 200:
            raise RuntimeError(f"dateappgrid page {page}: HTTP {r.status_code}")
        new = 0
        for tds in parse_rows(r.text):
            key = (tds[0], tds[1])
            if key not in out:
                rec = {"date": tds[0], "company": tds[1]}
                rec.update(zip(COLUMNS, tds[2:]))
                out[key] = rec
                new += 1
        if not out or new == 0:  # empty window or paginator looping
            break
        page += 1
        time.sleep(0.2)
        if page > 500:  # safety cap (~10k rows per window)
            break
    return list(out.values())


def main() -> int:
    """Entry: login, walk year windows, write company_daily.jsonl."""
    try:
        s = http_login()
    except RuntimeError as e:
        log(str(e))
        return 2
    s.headers.update({"X-Requested-With": "XMLHttpRequest",
                      "Referer": f"{BASE}?r=statistics/module/daylist"})
    today = date.today()
    all_rows = []
    for y in range(START_YEAR, today.year + 1):
        sd = date(y, 1, 1).strftime(MONTH_FMT)
        ed = min(date(y, 12, 31), today).strftime(MONTH_FMT)
        try:
            rows = fetch_window(s, sd, ed)
        except RuntimeError as e:
            log(str(e))
            rows = []
        log(f"{y}: {len(rows)} company/day rows")
        all_rows.extend(rows)
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w") as f:
        for rec in all_rows:
            f.write(json.dumps(rec) + "\n")
    log(f"wrote {OUT_FILE} ({len(all_rows)} records)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
