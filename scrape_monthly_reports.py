"""Download monthly safety-report Excel files into downloads/monthreports/.

GET license/upload/monthexport&program_id=<id>&month=<MMM yyyy> returns a
gzip-compressed .xlsx (Excel 2007+) monthly report: accident counts, AFR,
mandays, unsafe-act/condition category distribution (% + value), per-company
contributions, and PTW status distribution for the month.

Writes downloads/monthreports/<YYYY-MM>.xlsx for every month from
PTW_MONTH_START (env, default 2018-01) through the current month.
Non-gzip or empty responses are skipped with a warning.

Idempotent: existing non-empty files are kept unless --force. Exit codes:
0 ok, 2 login fail.
"""
import gzip
import sys
import time
from datetime import date
from pathlib import Path

from ptw_scraper import BASE, PROGRAM_ID, http_login, log

OUT_DIR = Path("downloads/monthreports")
START = __import__("os").environ.get("PTW_MONTH_START", "2018-01")


def month_list(start: str, today: date) -> list[tuple[str, str]]:
    """Yield (YYYY-MM, 'MMM yyyy') for each month start..today inclusive."""
    y0, m0 = (int(x) for x in start.split("-"))
    out = []
    y, m = y0, m0
    while (y, m) <= (today.year, today.month):
        out.append((f"{y}-{m:02d}", time.strftime("%b", time.struct_time(
            (0, m, 1, 0, 0, 0, 0, 0, 0))) + f" {y}"))
        m += 1
        if m == 13:
            y, m = y + 1, 1
    return out


def main() -> int:
    """Login and download every monthly report xlsx."""
    force = "--force" in sys.argv
    s = http_login()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = skip = fail = 0
    for label, mm in month_list(START, date.today()):
        dest = OUT_DIR / f"{label}.xlsx"
        if dest.exists() and dest.stat().st_size > 1000 and not force:
            skip += 1
            continue
        r = s.get(f"{BASE}?r=license/upload/monthexport&program_id="
                  f"{PROGRAM_ID}&month={mm.replace(' ', '+')}", timeout=180)
        if r.status_code == 200 and r.content[:2] == b"\x1f\x8b" and len(r.content) > 500:
            dest.write_bytes(gzip.decompress(r.content))
            ok += 1
        else:
            log(f"{label}: no data (HTTP {r.status_code}, {len(r.content)} b)")
            fail += 1
        time.sleep(0.3)
    log(f"done: {ok} downloaded, {skip} kept, {fail} empty")
    return 0


if __name__ == "__main__":
    sys.exit(main())
