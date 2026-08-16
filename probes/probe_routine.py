"""Probe routine/routineinspection/list with ajax headers; hunt TBM actions."""
import re
import sys

from ptw_scraper import BASE, http_login, log


def main() -> int:
    """Login; fetch routineinspection list + grid with ajax headers."""
    s = http_login()
    s.headers.update({"X-Requested-With": "XMLHttpRequest",
                      "Referer": f"{BASE}?r=routine/routineinspection/list"})
    r = s.get(f"{BASE}?r=routine/routineinspection/list", timeout=30)
    log(f"list: HTTP {r.status_code}, {len(r.text)} bytes")
    if r.status_code == 200:
        routes = sorted(set(re.findall(r"r=([\w/]+)", r.text)))
        log("routes on page: " + ", ".join(routes))
        ids = sorted(set(re.findall(r"(?:program_id|check_id|routine_id)[=:'\"/)]+(\w+)", r.text)))
        log(f"ids: {ids[:20]}")
        for kw in ("TBM", "Toolbox", "Meeting", "Training", "Training"):
            for m in re.finditer(kw, r.text):
                log(f"{kw} ctx: " + re.sub(r"\s+", " ", r.text[max(0, m.start()-100):m.end()+100])[:220])
                break
    g = s.get(f"{BASE}?r=routine/routineinspection/grid&page=0&q_order=", timeout=60)
    m = re.search(r"(\d+)\s*entries", g.text)
    log(f"grid: HTTP {g.status_code}, entries={m.group(1) if m else '?'}, {len(g.text)} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
