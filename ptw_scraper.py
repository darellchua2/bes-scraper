"""Headless PTW PDF downloader for service.globalbes.sg (pure HTTP, no browser).

Flow:
  1. requests.Session login; image captcha solved by Z.AI vision LLM (glm-5v-turbo).
  2. Walk grid pages newest-first, collecting row metadata until a page is fully
     seen within the previously-walked range (first run = full history).
  3. Download each PTW directly via the staffdownload endpoint (parallel,
     idempotent) into per-day subdirs: downloads/ptw/YYYY-MM-DD/PTW<id>.pdf.
  4. Rebuild downloads/ptw/index.xlsx with all known PTW metadata.

State: downloads/ptw/.state.json {"walked": N, "rows": {id: {...}}}.
Env: PTW_PROGRAM_ID, PTW_OUT_DIR, PTW_WORKERS (default 4), PTW_MAX_PAGES (0=all).
Exit codes: 0 ok, 2 login fail, 3 incomplete.

Modes:
  python ptw_scraper.py                normal incremental run
  python ptw_scraper.py --reorganize   one-time: walk all pages, move legacy
                                        PDFs (flat or month dirs) into day
                                        dirs, rebuild index
"""
import base64
import json
import os
import random
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from openpyxl import Workbook

load_dotenv()

BASE = "https://service.globalbes.sg/ctmgr/index.php"
PROGRAM_ID = os.environ.get("PTW_PROGRAM_ID", "3021")
OUT_DIR = Path(os.environ.get("PTW_OUT_DIR", "downloads/ptw"))
STATE_FILE = OUT_DIR / ".state.json"
INDEX_FILE = OUT_DIR / "index.xlsx"
WORKERS = int(os.environ.get("PTW_WORKERS", "4"))
MAX_PAGES = int(os.environ.get("PTW_MAX_PAGES", "0"))
CAPTCHA_ATTEMPTS = 6
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
DATE_FMT = "%d %b %Y %H:%M:%S"


def log(msg: str) -> None:
    """Timestamped stdout log line."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)


def solve_captcha(png_bytes: bytes) -> str:
    """Solve the login captcha image via Z.AI vision LLM (glm-5v-turbo)."""
    key = os.environ.get("ZAI_API_KEY", "")
    if not key:
        try:
            auth = json.load(open(os.path.expanduser("~/.local/share/opencode/auth.json")))
            key = (auth.get("zai-coding-plan") or {}).get("key") or (auth.get("zai") or {}).get("key")
        except Exception:
            pass
    if not key:
        raise RuntimeError("no Z.AI key (ZAI_API_KEY or opencode auth.json)")
    b64 = base64.b64encode(png_bytes).decode()
    payload = json.dumps({
        "model": "glm-5v-turbo",
        "temperature": 0,
        "messages": [{"role": "user", "content": [
            {"type": "text",
             "text": "This is a captcha image from a login form. Reply with ONLY the exact "
                     "characters shown, no spaces, quotes or explanation."},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64," + b64}},
        ]}],
    }).encode()
    for attempt in range(4):
        req = urllib.request.Request(
            "https://api.z.ai/api/paas/v4/chat/completions",
            data=payload,
            headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                txt = json.loads(r.read())["choices"][0]["message"]["content"]
            return "".join(c for c in txt if c.isalnum())[:8]
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise
    raise RuntimeError("captcha solve retries exhausted")


def http_login() -> requests.Session:
    """Login over plain HTTP; returns an authenticated Session or raises RuntimeError."""
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    s.get(f"{BASE}?r=site/login", timeout=30)
    png = s.get(f"{BASE}?r=site/captcha&v={random.random()}", timeout=30).content
    for attempt in range(1, CAPTCHA_ATTEMPTS + 1):
        code = solve_captcha(png)
        log(f"captcha attempt {attempt}: {code!r}")
        r = s.post(f"{BASE}?r=site/login", data={
            "LoginForm[username]": os.environ["BES_USERNAME"],
            "LoginForm[password]": os.environ["BES_PASSWORD"],
            "LoginForm[verifyCode]": code,
            "LoginForm[policy]": "1",
            "yt0": "",
        }, timeout=30)
        if "LoginForm" not in r.text:
            log("login ok")
            return s
        log(f"login attempt {attempt} failed (url={r.url[:80]})")
        png = s.get(f"{BASE}?r=site/captcha&v={random.random()}", timeout=30).content
    raise RuntimeError("login failed")


def grid_session(s: requests.Session) -> requests.Session:
    """Return a session with ajax headers + list-page referer for grid calls."""
    s.headers.update({
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}",
    })
    return s


def parse_grid_rows(html: str) -> list[dict]:
    """Extract per-row metadata (id, ref, company, desc, type, date, status) from grid HTML."""
    rows = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S):
        if "itemPreview(" not in tr:
            continue
        tds = [re.sub(r"<[^>]+>", "", td).strip()
               for td in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(tds) < 9:
            continue
        rows.append({
            "id": tds[1],
            "ref": tds[3],
            "company": tds[4],
            "desc": tds[5],
            "type": tds[6],
            "date": tds[7],
            "status": tds[8],
        })
    return rows


def grid_page_rows(s: requests.Session, page: int) -> list[dict]:
    """Fetch one grid page (0-based) and return parsed row metadata."""
    g = s.get(f"{BASE}?r=license/licensepdf/grid&page={page}"
              f"&q%5Bprogram_id%5D={PROGRAM_ID}&q_order=", timeout=60)
    if g.status_code != 200:
        raise RuntimeError(f"grid page {page}: HTTP {g.status_code}")
    return parse_grid_rows(g.text)


def grid_total_entries(s: requests.Session) -> int:
    """Parse total entry count from the grid info line."""
    g = s.get(f"{BASE}?r=license/licensepdf/grid&page=0"
              f"&q%5Bprogram_id%5D={PROGRAM_ID}&q_order=", timeout=60)
    m = re.search(r"(\d+)\s*entries", g.text)
    return int(m.group(1)) if m else 0


def day_dir(row: dict) -> Path:
    """Day subdirectory for a row, derived from its application date."""
    try:
        d = datetime.strptime(row["date"], DATE_FMT)
    except ValueError:
        d = datetime.now()
    return OUT_DIR / f"{d:%Y-%m-%d}"


def pdf_path(row: dict) -> Path:
    """Target path of a row's PDF inside its day directory."""
    return day_dir(row) / f"PTW{row['id']}.pdf"


def legacy_paths(row: dict) -> list[Path]:
    """Older layout locations for a row's PDF (pre-month flat, pre-day month)."""
    paths = [OUT_DIR / f"PTW{row['id']}.pdf"]
    try:
        d = datetime.strptime(row["date"], DATE_FMT)
    except ValueError:
        return paths
    return paths + [OUT_DIR / f"{d:%Y-%m}" / f"PTW{row['id']}.pdf"]


_tls = threading.local()


def dl_session(cookies) -> requests.Session:
    """Per-thread session sharing the login cookies (Session isn't thread-safe)."""
    s = getattr(_tls, "s", None)
    if s is None:
        s = _tls.s = requests.Session()
        s.headers.update({"User-Agent": UA, "Referer": f"{BASE}?r=license/licensepdf/list"})
        s.cookies.update(cookies)
    return s


def download_pdf(cookies, row: dict) -> Path:
    """Download one PTW PDF via staffdownload; idempotent (skips existing file)."""
    out = pdf_path(row)
    if out.exists():
        return out
    for leg in legacy_paths(row):  # legacy flat / month-dir layouts
        if leg.exists():
            out.parent.mkdir(parents=True, exist_ok=True)
            leg.replace(out)
            return out
    s = dl_session(cookies)
    for attempt in range(3):
        d = s.get(f"{BASE}?r=license/licensepdf/staffdownload"
                  f"&apply_id={row['id']}&app_id=PTW&tag=1", timeout=300)
        if d.status_code == 200 and d.content[:4] == b"%PDF":
            out.parent.mkdir(parents=True, exist_ok=True)
            tmp = out.with_suffix(".part")
            tmp.write_bytes(d.content)
            tmp.replace(out)
            log(f"downloaded {out.relative_to(OUT_DIR)} ({len(d.content)} bytes)")
            return out
        log(f"{row['id']}: attempt {attempt + 1} bad (HTTP {d.status_code}, "
            f"magic {d.content[:8]!r}); retrying")
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"download failed for {row['id']}")


def load_state() -> tuple[dict, int]:
    """Load (rows metadata by id, pages previously walked) from state file."""
    if STATE_FILE.exists():
        try:
            d = json.loads(STATE_FILE.read_text())
            rows = d.get("rows", {})
            for i in d.get("seen", []):  # migrate legacy seen-only state
                rows.setdefault(i, {"id": i, "ref": "", "company": "", "desc": "",
                                    "type": "", "date": "", "status": ""})
            return rows, int(d.get("walked", 0))
        except Exception:
            pass
    return {}, 0


def save_state(rows: dict, walked: int) -> None:
    """Persist row metadata and walked page count to state file."""
    STATE_FILE.write_text(json.dumps({"walked": walked, "rows": rows}))


def write_index(rows: dict) -> None:
    """Rebuild the Excel index of all known PTWs, newest first."""
    wb = Workbook()
    ws = wb.active
    ws.title = "PTW"
    ws.append(["Date", "PTW Ref", "Company", "Type", "Status", "Description",
               "apply_id", "File"])
    def sort_key(item):
        try:
            return datetime.strptime(item[1]["date"], DATE_FMT)
        except (ValueError, KeyError):
            return datetime.min
    for _id, r in sorted(rows.items(), key=sort_key, reverse=True):
        p = pdf_path(r)
        ws.append([r["date"], r["ref"], r["company"], r["type"], r["status"],
                   r["desc"], _id,
                   str(p.relative_to(OUT_DIR)) if p.exists() else ""])
    wb.save(INDEX_FILE)
    log(f"index written: {INDEX_FILE} ({len(rows)} rows)")


def connect() -> requests.Session:
    """Login and prepare an authenticated grid session; exits 2 on failure."""
    try:
        s = http_login()
    except RuntimeError as e:
        log(str(e))
        sys.exit(2)
    s = grid_session(s)
    s.get(f"{BASE}?r=license/licensepdf/list&program_id={PROGRAM_ID}", timeout=30)
    return s


def walk(s: requests.Session, rows: dict, walked: int, n_pages: int) -> tuple[list[dict], int]:
    """Walk grid pages newest-first; return (fresh rows, new walked count).

    Early-stop at a fully-seen page is only valid inside the previously-walked
    range; outside it, a seen page just means a partial earlier run.
    """
    todo: list[dict] = []
    pages_done = 0
    for page in range(n_pages):
        page_rows = grid_page_rows(s, page)
        if not page_rows:
            break
        fresh = [r for r in page_rows if r["id"] not in rows]
        rows.update({r["id"]: r for r in page_rows})
        if not fresh:
            if page < walked:
                log(f"page {page + 1}: all {len(page_rows)} seen (previously walked); stopping")
                break
            log(f"page {page + 1}: all {len(page_rows)} seen; continuing (past walked={walked})")
            pages_done = page + 1
            continue
        log(f"page {page + 1}: {len(page_rows)} rows, {len(fresh)} new")
        todo.extend(fresh)
        pages_done = page + 1
    return todo, max(walked, pages_done)


def page_limit(total: int) -> int:
    """Number of grid pages to walk for this run, honoring PTW_MAX_PAGES."""
    n_pages = (total + 19) // 20 if total else 1
    return min(n_pages, MAX_PAGES) if MAX_PAGES else n_pages


def run() -> int:
    """Main entry: login, walk grid, download new PDFs, rebuild index."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows, walked = load_state()
    s = connect()

    total = grid_total_entries(s)
    n_pages = page_limit(total)
    log(f"{total} entries total; walking up to {n_pages} page(s); known={len(rows)}")

    todo, walked = walk(s, rows, walked, n_pages)

    if not todo:
        save_state(rows, walked)
        write_index(rows)
        log("nothing new; done")
        return 0
    log(f"downloading {len(todo)} PDF(s) with {WORKERS} worker(s)")

    cookies = s.cookies

    def safe_download(row: dict):
        """Wrap download_pdf so worker exceptions become return values."""
        try:
            download_pdf(cookies, row)
            return None
        except Exception as e:  # noqa: BLE001 - logged, not fatal per-file
            return e

    failures = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for err in pool.map(safe_download, todo):
            if err is not None:
                failures += 1
                log(f"error: {err}")

    save_state(rows, walked)
    write_index(rows)
    ok = sum(1 for r in todo if pdf_path(r).exists())
    log(f"done: {ok}/{len(todo)} PDFs on disk, {failures} failure(s)")
    return 3 if ok < len(todo) else 0


def reorganize() -> int:
    """One-time migration: walk all pages, move legacy PDFs into day dirs."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows, _ = load_state()
    s = connect()

    total = grid_total_entries(s)
    log(f"reorganize: walking all {page_limit(total)} page(s) for metadata")
    _todo, walked = walk(s, rows, 0, page_limit(total))

    moved = 0
    for r in rows.values():
        for leg in legacy_paths(r):
            if leg.exists():
                out = pdf_path(r)
                out.parent.mkdir(parents=True, exist_ok=True)
                leg.replace(out)
                moved += 1
    log(f"moved {moved} legacy file(s) into day dirs")

    save_state(rows, walked)
    write_index(rows)
    return 0


def main() -> int:
    """Console entry point."""
    if "--reorganize" in sys.argv:
        return reorganize()
    return run()


if __name__ == "__main__":
    sys.exit(main())
