"""Probe statistics daylist page for program ids + test grid with program 212."""
import re

from ptw_scraper import BASE, http_login

s = http_login()
d = s.get(f"{BASE}?r=statistics/module/daylist", timeout=30)
html = d.text
print("== daylist options ==")
for m in re.finditer(r"<option[^>]*value=\"([^\"]+)\"[^>]*>([^<]+)</option>", html):
    print("option:", m.group(1), m.group(2).strip())
print("program ids:", sorted(set(re.findall(r"program(?:_id|Id)?[=:'\"/)]+(\d+)", html))))
for kw in ("TBM", "Toolbox"):
    for m in re.finditer(kw, html):
        print(f"{kw} ctx:", re.sub(r"\s+", " ", html[max(0, m.start()-100):m.end()+100]))
        break

# try the grid under other program ids
for pid in ("212", "0", "1", ""):
    g = s.get(f"{BASE}?r=license/licensepdf/grid&page=0&q%5Bprogram_id%5D={pid}&q_order=",
              headers={"X-Requested-With": "XMLHttpRequest"}, timeout=60)
    m = re.search(r"(\d+)\s*entries", g.text)
    print(f"grid program_id={pid!r}: HTTP {g.status_code}, entries={m.group(1) if m else '?'}")
