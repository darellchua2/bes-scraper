"""Probe: fetch grid HTML for page 0/1 with/without condition, count rows in each."""
import sys
from datetime import date, timedelta

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from ptw_scraper import login, BASE, PROGRAM_ID  # noqa

load_dotenv()

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_context().new_page()
    assert login(page), "login failed"
    page.goto(f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}", wait_until="domcontentloaded")
    page.wait_for_selector("#_query_form", timeout=30000)

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=6)
    fmt = lambda d: d.strftime("%d %b %Y")

    result = page.evaluate(
        """async ([start, end]) => {
            const cond = '&q[program_id]=3021&q[con_id]=&q[start_date]=' + start
                       + '&q[end_date]=' + end + '&q[type_id]=&q[status]=';
            const base = 'index.php?r=license/licensepdf/grid&page=';
            const urls = [base+'0'+cond, base+'1'+cond, base+'1', base+'2'+cond, base+'0'];
            const out = [];
            for (const u of urls) {
                const r = await fetch(encodeURI(u), {credentials: 'same-origin'});
                const t = await r.text();
                const doc = new DOMParser().parseFromString(t, 'text/html');
                const rows = doc.querySelectorAll('input[name=checkItem]').length;
                const info = (doc.getElementById('example2_info')||{textContent:''}).textContent.trim();
                const noRec = t.includes('No record');
                out.push({url: u.slice(0, 80), status: r.status, len: t.length, rows, noRec, info});
            }
            return out;
        }""", [fmt(start), fmt(end)])
    for r in result:
        print(r)
    browser.close()
