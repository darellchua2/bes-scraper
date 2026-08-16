"""Discover all site routes by crawling menu pages after login.

Fetches the post-login landing page plus known menu pages and extracts every
`?r=module/controller/action` reference it can find, printing unique routes
grouped by module. Dev probe only — not part of the scraper suite.
"""
import re
import sys
from collections import defaultdict

from ptw_scraper import BASE, http_login, log

MENU_PAGES = [
    f"{BASE}?r=site/index",
    f"{BASE}?r=site/logout&probe=1",  # never fetched; placeholder
]
SEEDS = [
    "",  # bare index.php post-login redirect
    "?r=site/index",
    "?r=dboard/index",
    "?r=proj/project/list",
    "?r=license/licensepdf/list&program_id=3021",
    "?r=comp/staff/list",
    "?r=statistics/module/daylist",
]


def main() -> int:
    """Login, fetch seed pages, print unique controller routes."""
    s = http_login()
    routes = defaultdict(set)
    for seed in SEEDS:
        try:
            r = s.get(BASE + seed, timeout=30, allow_redirects=True)
        except Exception as e:  # noqa: BLE001
            log(f"{seed or '(root)'}: {e}")
            continue
        found = re.findall(r"[?&]r=([A-Za-z0-9_]+/[A-Za-z0-9_]+)", r.text)
        for f in found:
            routes[f.split("/")[0]].add(f)
        log(f"{seed or '(root)'}: HTTP {r.status_code}, {len(r.text)} bytes, "
            f"final={r.url.split('ctmgr/')[-1][:60]}")
    print("\n== unique routes ==")
    for mod in sorted(routes):
        print(f"[{mod}]")
        for r in sorted(routes[mod]):
            print(f"  {r}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
