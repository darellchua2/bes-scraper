# PLAN: Static Next.js dashboard with HTML export for BES archive

**Issue:** https://github.com/darellchua2/bes-scraper/issues/1
**Branch:** `GIT-1`

## Overview

Read-only dashboard over the BES Postgres archive using Next.js as a full framework, exported to static HTML/CSS/JS via `output: 'export'`. Server Components query Postgres at build time; interactivity comes from client components fed by baked props or build-emitted static JSON. Output: `frontend/out/`, local viewing only. Data freshness = build-time snapshot; refresh = one chained command.

## Dependency & Consumer Map

| Node (file/module) | Depends on (must precede) | Consumers (who depends on this) | Change risk |
|---------------------|---------------------------|---------------------------------|-------------|
| `frontend/next.config.ts` | — | `next build` output mode | low |
| `frontend/lib/db.ts` | `pg` dep, `DATABASE_URL` (default :5435) | `lib/queries.ts` | low |
| `frontend/lib/queries.ts` | `lib/db.ts`, `db/schema.sql` tables | every page's Server Components + JSON route handlers | med |
| `frontend/components/charts.tsx` | `recharts` | `/`, `/companies` pages | low |
| `frontend/components/permit-flow.tsx` | `mermaid`, transition aggregation query | `/flow` page | med |
| `frontend/app/data/*.json/route.ts` | `lib/queries.ts` | client table/chart components (fetch at runtime) | med |
| `frontend/app/page.tsx` | `queries.ts`, `charts.tsx` | `/` route | low |
| `frontend/app/flow/page.tsx` | `permit-flow.tsx`, explainer content | `/flow` route | low |
| `frontend/app/companies/page.tsx` | `charts.tsx`, `data/companies.json` | `/companies` route | low |
| `frontend/app/staff/page.tsx`, `app/equipment/page.tsx` | `data/*.json`, filter table component | `/staff`, `/equipment` routes | low |
| pipeline script (npm/Makefile) | `db/load.py`, `next build` | user (one-command refresh) | low |

## Implementation Phases

### Phase 1: Static-export plumbing

- [ ] **1.1** Set `output: 'export'` in `frontend/next.config.ts`
    — **Why:** enables the whole static-HTML-export architecture; every later step assumes it
    — **Done when:** `npm run build` emits `frontend/out/` with `.html` per route
    — **Consumers affected:** build pipeline
- [ ] **1.2** Add `pg` + `@types/pg`; create `frontend/lib/db.ts` (pooled connection, `DATABASE_URL` env, default local :5435, JSDoc on exports)
    — **Why:** single build-time DB access point; avoids per-page connection boilerplate
    — **Done when:** `lib/db.ts` exports a query helper and typechecks
    — **Consumers affected:** `lib/queries.ts`
- [ ] **1.3** Create `frontend/lib/queries.ts` (KPI totals, permits-by-month, type/status breakdowns) and smoke-test on `app/page.tsx`
    — **Why:** proves DB→build wiring end-to-end before any view work; cheapest point to catch connection/config errors
    — **Done when:** exported `out/index.html` renders a real DB-derived number (e.g. 2,964 permits)
    — **Consumers affected:** all page Server Components

### Phase 2: Overview (`/`)

- [ ] **2.1** KPI cards on `/` (permits, active vs terminal split, companies, staff, equipment, evidence counts)
    — **Why:** top-line numbers are the primary ask of the overview view
    — **Done when:** all cards render DB-derived values in the export
    — **Consumers affected:** `/` route
- [ ] **2.2** `components/charts.tsx` (recharts client components) + permits-per-month area, ptw_type bar, status donut on `/`
    — **Why:** visual breakdowns requested in overview; recharts is the one chart dep for the whole app
    — **Done when:** three charts render with real data in the export
    — **Consumers affected:** `/` route; `/companies` reuses chart components

### Phase 3: Permit lifecycle flow (`/flow`)

- [ ] **3.1** Build-time aggregation query: consecutive-role transition counts from `approval_steps` + permit count per `status`
    — **Why:** the node-edge diagram's nodes, edge weights, and sizes all come from this one aggregation
    — **Done when:** query returns transition pairs with counts and per-status totals (spot-check sums ≈ 2,964)
    — **Consumers affected:** `/flow` page
- [ ] **3.2** `components/permit-flow.tsx` (mermaid client component fed the build-time definition) + per-stage plain-English explainers
    — **Why:** the requested "decision-tree style" lifecycle view with stage explanations
    — **Done when:** diagram renders in the export with edge counts; every stage has an explainer
    — **Consumers affected:** `/flow` route

### Phase 4: Company trends (`/companies`)

- [ ] **4.1** Static JSON route handler for `company_daily_stats` (20.6k rows)
    — **Why:** too large for baked props; static-export route handlers emit fetchable JSON at build time (GET-only, supported)
    — **Done when:** `out/` contains the JSON with all rows (count check = 20,659)
    — **Consumers affected:** `/companies` client component
- [ ] **4.2** Company selector + multi-metric line chart (ptw/tbm/training/inspection over time) + per-company totals table
    — **Why:** the per-company trend view requested
    — **Done when:** switching company updates chart and totals in the exported site
    — **Consumers affected:** `/companies` route

### Phase 5: Staff & equipment registers

- [ ] **5.1** Static JSON route handlers for staff (4,207) and equipment (2,475)
    — **Why:** client-side search/filter needs the full datasets in the browser
    — **Done when:** both JSON files exist in `out/` with correct row counts
    — **Consumers affected:** `/staff`, `/equipment` client components
- [ ] **5.2** Shared search/filter table component + `/staff` and `/equipment` pages
    — **Why:** the registers view; one shared table keeps it to a single implementation
    — **Done when:** text filtering works on both registers in the export
    — **Consumers affected:** `/staff`, `/equipment` routes

### Phase 6: Pipeline + polish

- [ ] **6.1** One-command pipeline script chaining `python db/load.py` (optional) + `next build`
    — **Why:** data freshness = rebuild; a single command is the whole refresh UX
    — **Done when:** one command rebuilds the export from a fresh DB load
    — **Consumers affected:** user workflow
- [ ] **6.2** Shared nav/layout across routes + README note on viewing `out/`
    — **Why:** route discoverability and usage docs
    — **Done when:** nav present on all pages; README documents build + serve steps
    — **Consumers affected:** all routes
- [ ] **6.3** Full verification gate: clean-state chain run, serve `out/`, verify all 5 routes + `npm run lint`
    — **Why:** maps directly to the issue acceptance criteria
    — **Done when:** all acceptance criteria in issue #1 check out
    — **Consumers affected:** issue #1 closure

## Technical Notes

- Next 16 differs from training data — consult `frontend/node_modules/next/dist/docs/` before writing code (static-exports guide verified: Server Components run at build; Route Handlers emit static JSON, GET-only; no cookies/headers/ISR/server actions).
- Deps added: `pg`, `@types/pg`, `recharts`, `mermaid`. Nothing else.
- DB: `DATABASE_URL` env, default local Postgres :5435 (container `bes-postgres`, db/user `bes`).
- JSDoc on all exported lib functions/components (repo docstring rule).
- Dev server port 3001 is taken — use 3000.
- Staff NRIC/FIN already masked at source; render as-is.

## Dependencies

- Blocked by nothing; `db/` schema + loader are complete and verified (2,964 permits / 20,659 daily rows / counts match `docs/consolidated-model.md`).
- External: Docker container `bes-postgres` must be running at build time.

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Next 16 API drift breaks a planned pattern | Docs live in `node_modules/next/dist/docs/`; read before each phase; Phase 1.3 smoke test catches wiring issues early |
| Mermaid bundle bloat (~1 MB) in export | Local viewing only — acceptable; if it bothers, pre-render SVG at build later |
| DB not running at build time | Pipeline script fails fast on connection error with a clear message |
| `approval_steps` roles are dirty (19 raw values) | Aggregate on observed values; map to canonical stages in the explainer, keep raw in tooltip/labels |

## Success Metrics

- `npm run lint` + `npm run build` green from clean state
- `frontend/out/` serves all 5 routes statically with real data
- Row counts in emitted JSON match DB exactly (2,964 / 4,207 / 2,475 / 20,659)
- One command refreshes the dashboard after a re-scrape
