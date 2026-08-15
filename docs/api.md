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
| `r=license/licensepdf/monthreport`, `batchmonthreport` | GET | — | Monthly report tables |
| `r=license/licensepdf/createqrpdf` | POST | `tag`, `startrow`, `per_read_cnt`, `program_id` | QR PDF generation |
| `r=license/licensepdf/downloadqrzip` | GET | — | QR ZIP (after createqrpdf) |

Known quirk: grid `q[start_date]/q[end_date]` (`dd MMM yyyy`) filtering is
server-side broken — dates partially applied, program scoping lost. Walk pages
and filter client-side instead.

## Registers

| Call | Method | Grid | Row key | Columns |
|------|--------|------|---------|---------|
| `r=comp/staff/list` | GET | `comp/staff/grid&page=0&q_order=` | `getDetail` id | S/N, Full Name (badge prefix), Mobile, NRIC/FIN, ID Type (WP/IC/…), Nationality, Designation, Secondment Y/N, Status, Created On |
| `r=device/equipment/list` | GET | `device/equipment/grid` | `getDetail` id | Equipment Type, Registration No., Equipment Name, Status, Created On |
| `r=document/company/list` | GET | `document/company/grid` | doc code/name | Document Name, Favorite, Label, Uploaded On |
| `r=statistics/module/daylist`, `monlist` | GET | — | — | Daily/monthly statistics pages |
| `r=proj/project/downloadepss` | GET | — | — | EPSS download |
| `r=license/upload/export` | POST | — | — | Returns `{"status":"1"}` (params required) |

Dead (404): `license/licensepdf/detail`, `dboard/menu`.

Field-level schemas: see `schemas/*.schema.json`.
