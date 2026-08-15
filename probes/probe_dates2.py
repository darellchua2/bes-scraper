"""Probe: map record distribution across windows; confirm which column the date filter hits."""
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

    res = page.evaluate(
        """async () => {
            const cases = [
                ['01-07Jul', '01 Jul 2026', '07 Jul 2026'],
                ['08-31Jul', '08 Jul 2026', '31 Jul 2026'],
                ['01-31Jul', '01 Jul 2026', '31 Jul 2026'],
                ['01-30Jun', '01 Jun 2026', '30 Jun 2026'],
                ['01May-31May', '01 May 2026', '31 May 2026'],
                ['01-07Aug', '01 Aug 2026', '07 Aug 2026'],
                ['02-14Aug', '02 Aug 2026', '14 Aug 2026'],
                ['15Aug', '15 Aug 2026', '15 Aug 2026'],
                ['01Jan-31Jul', '01 Jan 2026', '31 Jul 2026'],
                ['01Jan2025-31Dec2025', '01 Jan 2025', '31 Dec 2025'],
            ];
            const out = [];
            for (const [label, s, e] of cases) {
                const cond = '&q[program_id]=3021&q[start_date]=' + s + '&q[end_date]=' + e;
                const r = await fetch(encodeURI('index.php?r=license/licensepdf/grid&page=0' + cond + '&q_order='));
                const t = await r.text();
                const doc = new DOMParser().parseFromString(t, 'text/html');
                const info = (doc.getElementById('example2_info')||{textContent:''}).textContent.trim();
                out.push(label + ': norec=' + t.includes('No record') + ' info=' + info);
            }
            return out;
        }""")
    for r in res:
        print(r)

    # apply 01-07 Jul filter in the live DOM and read the visible date column
    page.evaluate("""() => {
        document.getElementById('q_start_date').value = '01 Jul 2026';
        document.getElementById('q_end_date').value = '07 Jul 2026';
        itemQuery();
    }""")
    page.wait_for_timeout(2500)
    rows = page.evaluate(
        """() => [...document.querySelectorAll('#example2 tbody tr')]
              .slice(0, 5).map(tr => {
                  const tds = [...tr.querySelectorAll('td')].map(td => td.innerText.trim());
                  return tds.filter(t => t).join(' | ');
              })""")
    print("\nfirst 5 rows for 01-07 Jul window:")
    for r in rows:
        print("   ", r[:160])
    browser.close()
