"""Probe: headless login + dump authenticated list page HTML/screenshot for selector discovery."""
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv()

BASE = "https://service.globalbes.sg/ctmgr/index.php"
OUT = Path("/tmp/opencode/bes")


def solve_captcha(png_bytes: bytes) -> str:
    key = os.environ.get("ZAI_API_KEY", "")
    if not key:
        try:
            auth = json.load(open(os.path.expanduser("~/.local/share/opencode/auth.json")))
            key = (auth.get("zai") or {}).get("key") or (auth.get("zai-coding-plan") or {}).get("key")
        except Exception:
            pass
    if not key:
        raise RuntimeError("no Z.AI key")
    b64 = base64.b64encode(png_bytes).decode()
    payload = json.dumps({
        "model": "glm-5v-turbo",
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": "This is a captcha image from a login form. Reply with ONLY the exact characters shown in the captcha, no spaces, no quotes, no explanation. If there are math symbols treat them as characters."},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64," + b64}},
        ]}],
        "temperature": 0,
    }).encode()
    req = urllib.request.Request(
        "https://api.z.ai/api/paas/v4/chat/completions",
        data=payload,
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        txt = json.loads(r.read())["choices"][0]["message"]["content"]
    # strip any noise: keep alphanumerics only, cap length 8
    cleaned = "".join(c for c in txt if c.isalnum())
    print(f"[captcha] raw={txt!r} cleaned={cleaned!r}", file=sys.stderr)
    return cleaned[:8]


def login(page, max_attempts=5):
    page.goto(f"{BASE}?r=site/login", wait_until="networkidle")
    for attempt in range(1, max_attempts + 1):
        img = page.locator("#yw0")  # captcha img
        png = img.screenshot()
        code = solve_captcha(png)
        page.fill("#LoginForm_username", os.environ["BES_USERNAME"])
        page.fill("#LoginForm_password", os.environ["BES_PASSWORD"])
        page.fill("#LoginForm_verifyCode", code)
        page.check("#LoginForm_policy") if not page.locator("#LoginForm_policy").is_checked() else None
        page.click("#login_btn")
        page.wait_for_load_state("networkidle")
        if "site/login" not in page.url and "site/login" not in (page.content()[:3000]):
            print(f"[login] ok on attempt {attempt}, url={page.url}", file=sys.stderr)
            return True
        err = page.locator(".errorMessage, .alert-error, .errorSummary")
        print(f"[login] attempt {attempt} failed. url={page.url} err={err.first.text_content() if err.count() else 'n/a'}", file=sys.stderr)
        # refresh captcha
        try:
            page.locator("#yw0").click()
            page.wait_for_timeout(800)
        except Exception:
            page.goto(f"{BASE}?r=site/login", wait_until="networkidle")
    return False


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    ctx = browser.new_context(accept_downloads=True)
    page = ctx.new_page()
    if not login(page):
        page.screenshot(path=str(OUT / "login_fail.png"), full_page=True)
        (OUT / "login_fail.html").write_text(page.content())
        sys.exit("login failed")
    # dump list page
    page.goto(f"{BASE}?r=license/licensepdf/list&program_id=3021", wait_until="networkidle")
    page.wait_for_timeout(2000)
    (OUT / "list.html").write_text(page.content())
    page.screenshot(path=str(OUT / "list.png"), full_page=True)
    print("[probe] list page dumped:", page.url, file=sys.stderr)
    # storage state for reuse
    ctx.storage_state(path=str(OUT / "state.json"))
    browser.close()
