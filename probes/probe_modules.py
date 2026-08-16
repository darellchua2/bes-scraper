"""Probe candidate TBM/safety module list pages under license/upload etc."""
import sys

from ptw_scraper import BASE, http_login, log

CANDIDATES = [
    "license/upload/list",
    "license/upload/index",
    "license/tbm/list",
    "license/tbmlist",
    "license/meeting/list",
    "license/training/list",
    "license/ra/list",
    "license/incident/list",
    "routine/tbm/list",
    "routine/meeting/list",
    "routine/routineinspection/list",
    "safety/tbm/list",
]


def main() -> int:
    """Login, GET each candidate route, report status/size/first marker."""
    s = http_login()
    for r_ in CANDIDATES:
        try:
            r = s.get(f"{BASE}?r={r_}", timeout=30, allow_redirects=False)
        except Exception as e:  # noqa: BLE001
            log(f"{r_}: {e}")
            continue
        marker = "login-redirect" if r.status_code in (301, 302) else (
            "grid" if "grid" in r.text[:5000] else "html")
        log(f"{r_}: HTTP {r.status_code}, {len(r.text)} bytes, {marker}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
