"""Probe: which date param format makes the grid return rows? Dump form defaults too."""
import sys

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

    defaults = page.evaluate("""() => {
        const out = [];
        for (const el of document.getElementById('_query_form').elements)
            out.push(el.name + ' = ' + JSON.stringify(el.value));
        return out;
    }""")
    print("form defaults:")
    for d in defaults:
        print("   ", d)

    res = page.evaluate(
        """async () => {
            const b = 'index.php?r=license/licensepdf/grid&page=0';
            const cases = [
                ['ddMMM-both',    '&q[program_id]=3021&q[start_date]=08 Aug 2026&q[end_date]=14 Aug 2026'],
                ['iso-both',      '&q[program_id]=3021&q[start_date]=2026-08-08&q[end_date]=2026-08-14'],
                ['ddMMM-old',     '&q[program_id]=3021&q[start_date]=01 Jul 2026&q[end_date]=07 Jul 2026'],
                ['iso-old',       '&q[program_id]=3021&q[start_date]=2026-07-01&q[end_date]=2026-07-07'],
                ['only-start-iso','&q[program_id]=3021&q[start_date]=2026-07-01'],
                ['only-end-iso',  '&q[program_id]=3021&q[end_date]=2026-07-07'],
                ['no-dates',      '&q[program_id]=3021'],
                ['status-A-old',  '&q[program_id]=3021&q[start_date]=2026-07-01&q[end_date]=2026-07-07&q[status]=A'],
            ];
            const out = [];
            for (const [label, cond] of cases) {
                const r = await fetch(encodeURI(b + cond + '&q_order='));
                const t = await r.text();
                const doc = new DOMParser().parseFromString(t, 'text/html');
                const info = (doc.getElementById('example2_info')||{textContent:''}).textContent.trim();
                out.push({label, status: r.status, rows: doc.querySelectorAll('input[name=checkItem]').length,
                          norec: t.includes('No record'), info});
            }
            return out;
        }""")
    for r in res:
        print(r)
    browser.close()
