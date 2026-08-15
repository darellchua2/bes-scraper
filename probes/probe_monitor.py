"""Probe: full network monitor of a Batch Download on a specific grid page.

Logs every userbatch/compress/staffdownload request+response with timing,
every download event (url + suggested filename), and every dialog message.
Reproduces the page-3 timeout under observation.
"""
import sys
from datetime import datetime

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

sys.path.insert(0, ".")
from ptw_scraper import (login, goto_list, goto_grid_page, batch_download_page,  # noqa
                         BASE, PROGRAM_ID, OUT_DIR)

load_dotenv()

TARGET_PAGE = int(sys.argv[1]) if len(sys.argv) > 1 else 3  # 1-based page number
WATCH_SECS = int(sys.argv[2]) if len(sys.argv) > 2 else 600

def ts():
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    ctx = browser.new_context(accept_downloads=True)
    page = ctx.new_page()

    def on_dialog(d):
        print(f"[{ts()}] DIALOG {d.type}: {d.message[:100]}")
        d.accept()

    page.on("dialog", on_dialog)

    def on_req(req):
        u = req.url
        if any(k in u for k in ("userbatch", "compress", "staffdownload", "downloadpreview", "createqrpdf")):
            print(f"[{ts()}] >> {req.method} {u[u.find('r='):][:80]} post={((req.post_data or '')[:120])}")

    def on_resp(resp):
        u = resp.url
        if any(k in u for k in ("userbatch", "compress", "staffdownload", "downloadpreview")):
            hdrs = resp.headers
            print(f"[{ts()}] << {resp.status} {u[u.find('r='):][:70]} "
                  f"ct={hdrs.get('content-type', '-')[:30]} cd={hdrs.get('content-disposition', '-')[:50]}")

    def on_download(dl):
        print(f"[{ts()}] DOWNLOAD url={dl.url[:110]} name={dl.suggested_filename}")

    page.on("request", on_req)
    page.on("response", on_resp)
    page.on("download", on_download)

    assert login(page), "login failed"
    print(f"[{ts()}] login ok; opening list")
    goto_list(page)
    goto_grid_page(page, TARGET_PAGE - 1)
    ids = page.evaluate("""() => [...document.querySelectorAll('#example2 tbody tr')]
        .filter(tr => tr.querySelector('input[name=checkItem]'))
        .map(tr => tr.cells[1].innerText.trim())""")
    print(f"[{ts()}] page {TARGET_PAGE} ids ({len(ids)}): {ids[:5]} ...")

    try:
        batch_download_page(page, TARGET_PAGE - 1, "probe")
        print(f"[{ts()}] BATCH OK")
    except Exception as e:
        print(f"[{ts()}] BATCH FAILED: {type(e).__name__}: {str(e)[:200]}")

    # keep watching a bit for stragglers
    page.wait_for_timeout(5000)
    browser.close()
