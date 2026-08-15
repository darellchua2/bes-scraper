# bes-scraper

Headless scraper for PTW licenses on service.globalbes.sg. Logs in (LLM-solved
captcha), walks the license grid newest-first, downloads new PTW PDFs, and
maintains an Excel index. Built for unattended scheduled runs.

## One script to run

```bash
.venv/bin/python ptw_scraper.py          # daily incremental (the cron entry)
.venv/bin/python ptw_scraper.py --reorganize   # one-time migration (already done)
```

Everything else in `probes/` is debug tooling used during development — do not
schedule or run them.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -e .
```

Requires `.env` in the repo root:

```
BES_USERNAME=...
BES_PASSWORD=...
BES_LOGIN_ENDPOINT=https://service.globalbes.sg/ctmgr/index.php
```

Plus `ZAI_API_KEY` in the environment (used to solve the login captcha via
the Z.AI vision API).

## How it works

1. HTTP login with session cookie + captcha solved by `glm-5v-turbo`.
2. Walks grid pages (`r=license/licensepdf/grid`) newest-first until a page
   is fully known (state in `downloads/ptw/.state.json`).
3. Downloads each new PTW via `r=license/licensepdf/staffdownload&apply_id=…`
   in parallel (thread pool), with retries and `%PDF` validation.
4. Rebuilds `downloads/ptw/index.xlsx` (Date, PTW Ref, Company, Type,
   Status, Description, apply_id, File) newest-first.

First-ever run downloads full history (~2964 PDFs, ~1 h); later runs only
fetch new records.

## Output layout

```
downloads/ptw/
  index.xlsx          # Excel index, rebuilt every run
  .state.json         # walked-pages + per-id metadata (do not delete)
  2026-08-15/         # one dir per day, by PTW date
    PTW<apply_id>.pdf
```

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PTW_PROGRAM_ID` | `3021` | Program to scrape |
| `PTW_OUT_DIR` | `downloads/ptw` | Output root |
| `PTW_WORKERS` | `4` | Parallel download threads |
| `PTW_MAX_PAGES` | `0` (all) | Cap pages per run (smoke tests) |

## Exit codes

- `0` — success
- `2` — login failed
- `3` — run incomplete (some downloads failed; safe to re-run)

## Scheduled task (cron)

```cron
0 6 * * * cd /home/silentx/VSCODE/bes-scraper && .venv/bin/python ptw_scraper.py >> downloads/ptw/cron.log 2>&1
```

`ZAI_API_KEY` must be visible to cron — either export it in `/etc/environment`,
a wrapper script, or add `ZAI_API_KEY=...` to a root-owned `.env`-style source
before the command.
