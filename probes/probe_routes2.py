"""Batch-probe guessed routine-module controller/action routes (ajax mode)."""
import sys

from ptw_scraper import BASE, http_login, log

CANDIDATES = [
    "routine/tbm/index",
    "routine/routinetbm/list",
    "routine/routinetbm/index",
    "routine/tbmmanage/list",
    "routine/routinemeeting/list",
    "routine/routinetraining/list",
    "routine/routinera/list",
    "routine/routineincident/list",
    "routine/routine/list",
    "routine/routine/index",
    "license/upload/grid",
    "license/licensepdf/tbmlist",
    "license/licensepdf/tbmgrid",
    "license/licensepdf/tbm",
    "statistics/module/dateappgrid",
]


def main() -> int:
    """Login; probe each route with ajax headers; report status/size."""
    s = http_login()
    s.headers.update({"X-Requested-With": "XMLHttpRequest",
                      "Referer": f"{BASE}?r=license/licensepdf/list&program_id=3021"})
    for r_ in CANDIDATES:
        r = s.get(f"{BASE}?r={r_}&page=0&q_order=", timeout=30)
        note = ""
        if r.status_code == 200 and len(r.text) < 3000:
            note = " (empty/error page?)"
        log(f"{r_}: HTTP {r.status_code}, {len(r.text)} bytes{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
