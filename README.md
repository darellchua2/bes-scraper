# bes-scraper

Headless scraper suite for service.globalbes.sg (BES / LTA CR101). Logs in
(LLM-solved captcha), walks the license grid newest-first, downloads new PTW
PDFs, maintains an Excel index, and scrapes the supporting registers and
per-PTW workflow data. Built for unattended scheduled runs and data migration.

## Scripts

| Script | Purpose | Schedule? |
| ------ | ------- | --------- |
| `ptw_scraper.py` | PTW PDFs + metadata + `index.xlsx` (incremental) | **yes — the cron entry** |
| `scrape_ptw_extras.py` | workflow trails, checklist + attachment ids per PTW | optional (re-run before export) |
| `scrape_staff.py` | staff register → `downloads/staff/staff.jsonl` | optional |
| `scrape_equipment.py` | equipment register → `downloads/equipment/equipment.jsonl` | optional |
| `scrape_company.py` | company documents register → `downloads/company/company.jsonl` | optional |
| `export.py` | `.state.json` → `data/ptw.jsonl` (migration export) | before migrating |
| `probes/` | development debug scripts | never |

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
downloads/ptw/          # raw artifacts (gitignored, disposable)
  index.xlsx            # Excel index, rebuilt every run
  .state.json           # walked-pages + per-id metadata (do not delete)
  extras.jsonl          # per-PTW workflow steps + checklist/attachment ids
  YYYY-MM-DD/PTW<apply_id>.pdf
downloads/staff/staff.jsonl            # 4207 records
downloads/equipment/equipment.jsonl    # 2475 records
downloads/company/company.jsonl        # 103 records
data/                   # reusable structured exports (gitignored, regenerate)
  ptw.jsonl             # .venv/bin/python export.py
schemas/                # JSON Schemas — the field contract for migration
docs/api.md             # every callable site endpoint, verified
```

Data reusability order for migrating off BES: `schemas/` defines the field
contract → scrapers emit conforming JSONL into `downloads/` → `export.py`
consolidates → PDFs stay as source-of-truth blobs keyed by `apply_id`.
Current coverage: PTW PDFs + metadata (2964), workflow trails (15 254 steps),
checklist references (6541), attachment references (16 246), and the staff /
equipment / company-docs registers.

## Dashboard

Static Next.js dashboard over the scraped data, in `frontend/` (deploys
nowhere — built and viewed locally).

```bash
# one-time: Postgres container (host port 5435) + python db extra
docker run -d --name bes-postgres -p 5435:5432 \
  -e POSTGRES_USER=bes -e POSTGRES_PASSWORD=bes -e POSTGRES_DB=bes \
  -v bes-pgdata:/var/lib/postgresql/data postgres:16-alpine
.venv/bin/pip install -e ".[db]"
cd frontend && npm install && cd ..

# every refresh: reload the DB from JSONL + rebuild the static site
scripts/build-dashboard.sh

# view
cd frontend/out && python3 -m http.server 8000
```

Pages: Overview (KPIs + charts), Permit lifecycle (stage flow diagram with
explainers), Companies (daily activity trends), Staff and Equipment registers
(filterable tables). Schema: `db/schema.sql`; loader: `db/load.py`
(idempotent, truncate + reload). Model rationale: `docs/consolidated-model.md`.

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
