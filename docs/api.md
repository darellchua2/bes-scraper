# BES ctmgr API reference

Base: `https://service.globalbes.sg/ctmgr/index.php`

Auth: `SHELL_SESSID` session cookie (login below). Ajax actions additionally
require `X-Requested-With: XMLHttpRequest` and a same-page `Referer`, else Yii
returns HTTP 500.

## Auth

| Call | Method | Params | Notes |
|------|--------|--------|-------|
| `r=site/login` | GET | — | Login form; sets session cookie |
| `r=site/captcha&v=<rand>` | GET | — | PNG captcha for current session (no session needed to fetch, but code only validates against the session that fetched it) |
| `r=site/login` | POST | `LoginForm[username]`, `LoginForm[password]`, `LoginForm[verifyCode]`, `LoginForm[policy]=1`, `yt0=` | No CSRF token. Success = response has no `LoginForm` |
| `r=site/logout` | GET | — | |

## PTW (program 3021)

| Call | Method | Params | Returns |
|------|--------|--------|---------|
| `r=license/licensepdf/list&program_id=3021` | GET | — | Page shell (buttons, filter form, JS) |
| `r=license/licensepdf/grid&page=<n>&q[program_id]=3021&q_order=` | GET | page 0-based, 20/page | Grid HTML fragment; total in `N entries`; row key = `apply_id` (2nd column) |
| `r=license/licensepdf/preview&apply_id=<id>&app_id=PTW` | GET | — | Approval-process modal HTML: `Step N <name> <role>` |
| `r=license/licensepdf/staffdownload&apply_id=<id>&app_id=PTW&tag=1` | GET | — | The PTW PDF (`application/pdf`) — **used by the scraper** |
| `r=license/licensepdf/downloadpreview&apply_id=<id>&app_id=PTW` | GET | — | Checklist report list; `downloadcheck(<id>)` buttons |
| `r=license/licensepdf/downloadattachment&apply_id=<id>&app_id=PTW` | GET | — | Attachment list; `downloadattachment(<att_id>,<apply_id>)` |
| `r=license/licensepdf/querytype` | POST | `program_id` | PTW type options |
| `r=license/licensepdf/querystatus` | POST | `ptwmode` | Status options; special-cased for program 3021/212 |
| `r=license/licensepdf/userbatch` | POST | `id`, `tag=id1\|id2\|…`, `startrow`, `per_read_cnt=4` | Server PDF cache fill (4/batch) |
| `r=license/licensepdf/compress&curpage=<n>` | GET | — | ZIP of batched PDFs — flaky (HTTP 500 on stale cache); avoid |
| `r=license/licensepdf/monthreport` | GET | `program_id` | Modal form → real export below |
| `r=license/upload/monthexport` | GET | `program_id`, `month` (`MMM yyyy`) | **Monthly safety report** — gzip-compressed .xlsx (accidents, AFR, mandays, category %, per-company, PTW statuses). Used by `scrape_monthly_reports.py` |
| `r=license/licensepdf/createqrpdf` | POST | `tag` (`id1\|id2\|…`), `startrow`, `per_read_cnt`, `program_id` | Renders QR sticker PDFs server-side; JSON `{file_path}` |
| `r=license/licensepdf/downloadqrzip` | GET | — | ZIP of the rendered QR sticker PDFs (printable labels; no new data) — verified working |
| `r=license/upload/export` | POST/GET | `program_id` (**plain**, not `q[…]`), `month` | Queues async export task → `{"status":"1"}`; month must be pre-encoded (`Aug%202026` — server urldecodes, plain space drops the year) |
| `r=license/upload/task` | POST | `program_id` | Lists export tasks (newest first); Done = status `"1"` + report `url` |
| `r=license/upload/exportdownload&id=<task_id>` | GET | — | Downloads the queued export (.xlsx) — used by `scrape_ptw_reports.py` |

## Statistics drill-down (program 3021)

| Call | Method | Params | Returns |
|------|--------|--------|---------|
| `r=statistics/module/moduledaycnt` | POST | `id`, `start_date`, `end_date` (dd MMM yyyy) | 12 summary counters `{label, data}` (PTW/TBM/Checklist/Inspection/Meeting/Training/RA/Incident + participants) — used by `scrape_statistics.py` |
| `r=statistics/module/dateappgrid` | GET (ajax) | `page`, `q[program_id]`, `q[start_date]`, `q[end_date]` (dd MMM yyyy), `contractor_id`, `operator_id`, `operator_name`, `q_order=` | Paginated (20/page) per-date × per-company rows: date, company, ptw/tbm/meeting/training cnt+staff, inspection, ra, checklist, incident — **the only retrievable TBM data**; used by `scrape_company_stats.py`. Full-range query 500s → use ≤1-year windows |

## Registers

| Call | Method | Grid | Row key | Columns |
|------|--------|------|---------|---------|
| `r=comp/staff/list` | GET | `comp/staff/grid&page=0&q_order=` | `getDetail` id | S/N, Full Name (badge prefix), Mobile, NRIC/FIN, ID Type (WP/IC/…), Nationality, Designation, Secondment Y/N, Status, Created On |
| `r=device/equipment/list` | GET | `device/equipment/grid` | `getDetail` id | Equipment Type, Registration No., Equipment Name, Status, Created On |
| `r=document/company/list` | GET | `document/company/grid` | doc code/name | Document Name, Favorite, Label, Uploaded On |

Known quirk: license grid `q[start_date]/q[end_date]` (`dd MMM yyyy`) filtering
is server-side broken — dates partially applied, program scoping lost. Walk
pages and filter client-side instead.

## Detail modals

| Call | Method | Params | Returns |
|------|--------|--------|---------|
| `r=comp/staff/detail` | POST (ajax) | `id` | JSON `{status, detail:html}` — only adds `Project` field |
| `r=device/equipment/detail` | POST (ajax) | `id` | JSON — only adds `Where The Project` field |

## Verified dead / unusable

- `license/licensepdf/detail`, `dboard/menu` — 404.
- `proj/report/exportepss` (`downloadepss` modal, params `program_id`, `type_id` 1/2/3, `month`) — 500 `CDbException: Table 'cmsdb2.atd_program_attend_YYYYMM' doesn't exist` for all months probed (attendance archive never created).
- Individual TBM/meeting/training/RA/incident record modules — no web route exists (mobile-app only); dozens of guessed `routine/*`, `license/*` routes 404.
- `license/licensepdf/compress` — flaky HTTP 500 (stale cache).
- `statistics/module/modulemonthcnt` (monlist sibling) — HTTP 500 server-side.

Field-level schemas: see `schemas/*.schema.json`.
