"""Debug probe: monitor userbatch/compress traffic during Batch Download click."""
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from ptw_scraper import login, set_filter_and_refresh, BASE, PROGRAM_ID, OUT_DIR  # noqa

load_dotenv()

def ts():
    return datetime.now().strftime("%H:%M:%S")

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    ctx = browser.new_context(accept_downloads=True)
    page = ctx.new_page()
    page.on("dialog", lambda d: print(f"[{ts()}][dialog] {d.type}: {d.message[:80]}") or d.accept())

    def on_req(req):
        if "userbatch" in req.url or "compress" in req.url:
            print(f"[{ts()}][req] {req.method} {req.url[:120]} post={req.post_data[:200] if req.post_data else ''}")

    def on_resp(resp):
        if "userbatch" in resp.url or "compress" in resp.url:
            hdrs = resp.headers
            print(f"[{ts()}][resp] {resp.status} {resp.url[:100]} cd={hdrs.get('content-disposition','-')[:60]} ct={hdrs.get('content-type','-')[:40]} len={hdrs.get('content-length','-')}")

    page.on("request", on_req)
    page.on("response", on_resp)
    page.on("download", lambda d: print(f"[{ts()}][download] {d.suggested_filename}"))

    assert login(page), "login failed"
    page.goto(f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}", wait_until="domcontentloaded")
    page.wait_for_selector("#_query_form", timeout=30000)
    from datetime import date, timedelta
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=6)
    set_filter_and_refresh(page, start, end)
    # same fix as ptw_scraper: set row checkboxes directly (post-refresh #checkAll has no handler)
    n = page.evaluate("""() => {
        const boxes = document.querySelectorAll('#example2 input[name=checkItem]');
        boxes.forEach(c => { c.checked = true; });
        return boxes.length;
    }""")
    print(f"[{ts()}][probe] checked {n} checkItem boxes")
    page.wait_for_timeout(300)
    print(f"[{ts()}][probe] clicking Batch Download...")
    page.locator("button:has-text('Batch Download')").click()
    # watch for up to 8 minutes
    for i in range(96):
        page.wait_for_timeout(5000)
        if i % 6 == 5:
            print(f"[{ts()}][probe] t={i*5+5}s still waiting; url={page.url[:80]}")
    browser.close()
