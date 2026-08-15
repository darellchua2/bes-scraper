"""Probe: pure-HTTP login + single staffdownload PDF fetch (no browser)."""
import re
import sys
import random

import requests
from dotenv import load_dotenv

sys.path.insert(0, ".")
from ptw_scraper import BASE, solve_captcha, log

load_dotenv()
import os

s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"

# 1. login page (session cookie)
r = s.get(f"{BASE}?r=site/login", timeout=30)
log(f"login page: {r.status_code}, cookies={list(s.cookies.keys())}")

# 2. captcha tied to this session
png = s.get(f"{BASE}?r=site/captcha&v={random.random()}", timeout=30).content
log(f"captcha img: {len(png)} bytes")

# 3. solve + submit (few retries like the browser flow)
for attempt in range(1, 7):
    code = solve_captcha(png)
    log(f"captcha attempt {attempt}: {code!r}")
    r = s.post(f"{BASE}?r=site/login", data={
        "LoginForm[username]": os.environ["BES_USERNAME"],
        "LoginForm[password]": os.environ["BES_PASSWORD"],
        "LoginForm[verifyCode]": code,
        "LoginForm[policy]": "1",
        "yt0": "",  # submit button field Yii adds
    }, timeout=30)
    if "LoginForm" not in r.text:
        break
    png = s.get(f"{BASE}?r=site/captcha&v={random.random()}", timeout=30).content
else:
    sys.exit("login failed over HTTP")

log(f"login ok: url={r.url[:80]}, has LoginForm={'LoginForm' in r.text}")

# 4. grid page 0 -> first apply_id
g = s.get(f"{BASE}?r=license/licensepdf/grid&page=0&q%5Bprogram_id%5D=3021&q_order=", timeout=30)
ids = re.findall(r'itemPreview\(&quot;(\d+)&quot;', g.text)
log(f"grid: {g.status_code}, {len(ids)} ids, first={ids[:3]}")

# 5. staffdownload -> PDF?
d = s.get(f"{BASE}?r=license/licensepdf/staffdownload&apply_id={ids[0]}&app_id=PTW", timeout=120)
log(f"staffdownload: {d.status_code} ct={d.headers.get('content-type')} "
    f"cd={d.headers.get('content-disposition')} len={len(d.content)} magic={d.content[:8]!r}")
open("/tmp/opencode/bes/probe_http.pdf", "wb").write(d.content)
