"""Download checklist-report and attachment PDFs for all known PTWs.

Reads downloads/ptw/extras.jsonl (from scrape_ptw_extras.py) and fetches:
  - checklists:  r=routine/routineinspection/downloadpdf&check_id=<id>
  - attachments: r=license/licensepdf/downloadptwattachment&doc_id=<id>&apply_id=<aid>

Layout (following the ptw convention):
  downloads/ptw/checklists/CHK<check_id>.<ext>
  downloads/ptw/attachments/ATT<doc_id>.<ext>

Extension by magic bytes (%PDF, PNG, JPG); falls back to .bin. Idempotent:
existing files are skipped, so interrupted runs resume. Exit codes:
0 ok, 2 login fail, 3 incomplete.
"""
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ptw_scraper import BASE, UA, http_login, log

CHECK_DIR = Path("downloads/ptw/checklists")
ATT_DIR = Path("downloads/ptw/attachments")
WORKERS = 4

_tls = threading.local()


def fetch_session(cookies):
    """Thread-local session sharing login cookies for binary downloads."""
    import requests
    s = getattr(_tls, "s", None)
    if s is None:
        s = _tls.s = requests.Session()
        s.headers.update({"User-Agent": UA,
                          "Referer": f"{BASE}?r=license/licensepdf/list"})
        s.cookies.update(cookies)
    return s


def ext_for(content: bytes) -> str:
    """File extension from magic bytes."""
    if content[:4] == b"%PDF":
        return "pdf"
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if content[:3] == b"\xff\xd8\xff":
        return "jpg"
    return "bin"


def fetch_binary(cookies, url: str, out_stem: Path) -> None:
    """Download url to out_stem.<ext>; idempotent, 3 retries, magic validated."""
    for existing in out_stem.parent.glob(f"{out_stem.name}.*"):
        return  # already downloaded (extension unknown until fetch)
    s = fetch_session(cookies)
    for attempt in range(3):
        r = s.get(url, timeout=300)
        if r.status_code == 200 and len(r.content) > 100:
            out = out_stem.with_suffix("." + ext_for(r.content))
            tmp = out_stem.with_suffix(".part")
            tmp.write_bytes(r.content)
            tmp.replace(out)
            return
        log(f"{out_stem.name}: attempt {attempt + 1} bad (HTTP {r.status_code}, "
            f"len {len(r.content)}); retrying")
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"download failed for {out_stem.name}")


def main() -> int:
    """Entry: login, download all checklist + attachment binaries."""
    recs = [json.loads(l) for l in open("downloads/ptw/extras.jsonl")]
    jobs = []  # (url, out_stem)
    for r in recs:
        for cid in r["checklist_report_ids"]:
            jobs.append((f"{BASE}?r=routine/routineinspection/downloadpdf&check_id={cid}",
                         CHECK_DIR / f"CHK{cid}"))
        for did in r["attachment_ids"]:
            jobs.append((f"{BASE}?r=license/licensepdf/downloadptwattachment"
                         f"&doc_id={did}&apply_id={r['apply_id']}",
                         ATT_DIR / f"ATT{did}"))
    CHECK_DIR.mkdir(parents=True, exist_ok=True)
    ATT_DIR.mkdir(parents=True, exist_ok=True)
    log(f"{len(jobs)} binaries ({sum(len(r['checklist_report_ids']) for r in recs)} "
        f"checklists, {sum(len(r['attachment_ids']) for r in recs)} attachments)")

    try:
        s = http_login()
    except RuntimeError as e:
        log(str(e))
        return 2
    cookies = s.cookies

    def safe(job):
        url, stem = job
        try:
            fetch_binary(cookies, url, stem)
            return None
        except Exception as e:  # noqa: BLE001 - per-file, not fatal
            return e

    failures = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for i, err in enumerate(pool.map(safe, jobs), 1):
            if err is not None:
                failures += 1
                log(f"error: {err}")
            if i % 500 == 0:
                log(f"{i}/{len(jobs)}")
    log(f"done: {len(jobs) - failures}/{len(jobs)} binaries, {failures} failure(s)")
    return 3 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
