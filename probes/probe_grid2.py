"""Probe: capture exact form-built condition + the actual grid XHR during site-native filter."""
import sys
from datetime import date, timedelta

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from ptw_scraper import login, set_filter_and_refresh, BASE, PROGRAM_ID, GRID_URL  # noqa

load_dotenv()

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_context().new_page()

    def on_resp(r):
        if r.url.startswith(GRID_URL):
            t = r.text()
            n = t.count('name=checkItem')
            print(f"[xhr] {r.url}")
            print(f"      len={len(t)} checkItem~{n} norec={t.count('No record')}")

    page.on("response", on_resp)
    assert login(page), "login failed"
    page.goto(f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}", wait_until="domcontentloaded")
    page.wait_for_selector("#_query_form", timeout=30000)

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=6)
    set_filter_and_refresh(page, start, end)

    cond = page.evaluate("""() => {
        const objs = document.getElementById('_query_form').elements;
        let u = '';
        for (let i = 0; i < objs.length; i++) u += '&' + objs.item(i).name + '=' + objs.item(i).value;
        return u;
    }""")
    print("form condition:", cond)
    dom_rows = page.evaluate("() => document.querySelectorAll('#example2 input[name=checkItem]').length")
    print("DOM checkItems after filter:", dom_rows)

    # now fetch page 0 and 1 with the EXACT form-built condition
    res = page.evaluate(
        """async cond => {
            const out = [];
            for (const pg of [0, 1]) {
                const r = await fetch(encodeURI('index.php?r=license/licensepdf/grid&page=' + pg + cond + '&q_order='));
                const t = await r.text();
                const doc = new DOMParser().parseFromString(t, 'text/html');
                out.push({pg, status: r.status, len: t.length,
                          rows: doc.querySelectorAll('input[name=checkItem]').length,
                          norec: t.includes('No record')});
            }
            return out;
        }""", cond)
    print("fetch with form condition:", res)
    browser.close()
