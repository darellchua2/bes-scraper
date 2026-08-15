"""Probe: what does the DOM look like after example2.refresh(1)?"""
import sys
from datetime import date, timedelta

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from ptw_scraper import login, set_filter_and_refresh, BASE, PROGRAM_ID, GRID_URL, page_count  # noqa

load_dotenv()


def snapshot(page, label):
    info = page.evaluate("""() => ({
        example2_tables: document.querySelectorAll('#example2').length,
        checkItems: document.querySelectorAll('#example2 input[name=checkItem]').length,
        batch_btns: [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Batch Download')).length,
        info_text: (document.getElementById('example2_info') || {}).textContent || '-',
        max_page: Math.max(-1, ...[...document.querySelectorAll('#datagrid a[page]')].map(a => +a.getAttribute('page'))),
        datagrid_kids: document.getElementById('datagrid') ? document.getElementById('datagrid').children.length : -1,
        title: document.title,
    })""")
    print(f"[{label}] url={page.url[:90]}")
    for k, v in info.items():
        print(f"    {k} = {v!r}" if isinstance(v, str) else f"    {k} = {v}")


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    ctx = browser.new_context(accept_downloads=True)
    page = ctx.new_page()
    page.on("dialog", lambda d: print(f"[dialog] {d.message[:80]}") or d.accept())

    assert login(page), "login failed"
    page.goto(f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}", wait_until="domcontentloaded")
    page.wait_for_selector("#_query_form", timeout=30000)

    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=6)
    set_filter_and_refresh(page, start, end)
    snapshot(page, "after filter p0")

    with page.expect_response(lambda r: r.url.startswith(GRID_URL), timeout=30000) as ri:
        page.evaluate("n => example2.refresh(n)", 1)
    resp = ri.value
    body = resp.text()
    print(f"\n[refresh(1) resp] status={resp.status} len={len(body)}")
    print(f"[refresh(1) resp] url={resp.url[:200]}")
    open("/tmp/opencode/bes/page2_resp.html", "w").write(body)
    page.wait_for_timeout(800)
    snapshot(page, "after refresh(1)")

    dg = page.evaluate("() => document.getElementById('datagrid') ? document.getElementById('datagrid').innerHTML : 'NO DATAGRID'")
    open("/tmp/opencode/bes/page2_datagrid.html", "w").write(dg)
    page.screenshot(path="/tmp/opencode/bes/page2.png", full_page=True)
    print("\ndumped: page2_resp.html, page2_datagrid.html, page2.png")
    browser.close()
