# Regulatory & reference document library

Supporting documents for the BES CR101 replacement build — every regulator
requirement that touches **permit-to-work, site supervision, inspections,
CCTV/images**, with citation of why each matters. Full analysis:
[`research/research-regulatory.md`](../research/research-regulatory.md) ·
story mapping: [`../docs/consolidated-model.md`](../docs/consolidated-model.md)
· mobile angle: [`../docs/mobile-features.md`](../docs/mobile-features.md).

## Folder layout

```
research/docs/
├── mom/                     Ministry of Manpower
│   ├── circulars/
│   │   ├── annex-b-eptw-specification.pdf            ★ ePTW build spec
│   │   └── circular-20240202-wsh-public-sector-construction.pdf
│   ├── guidelines/
│   │   └── tripartite-guide-permit-to-work-opec.pdf  ★ canonical SG PTW guide
│   └── faqs/
│       └── faqs-for-vss.pdf                          ★ CCTV obligations
├── agc/                     Singapore Statutes Online (Attorney-General)
│   ├── wsh-construction-regulations-2007.pdf         (S 663/2007)
│   ├── wsh-risk-management-regulations.pdf           (RG 8)
│   └── wsh-incident-reporting-regulations.pdf        (RG 3)
├── lta/                     Land Transport Authority
│   └── code-of-practice-railway-protection-2024.pdf  (3.9 MB, 2024 ed.)
└── bca/                     (empty — see manual downloads)
```

★ = primary build drivers.

## Documents & why they matter

### MOM — ePTW mandate (the de-facto product spec)

| File | Why it matters | User stories affected |
|------|----------------|----------------------|
| `annex-b-eptw-specification.pdf` | Official MOM **ePTW specifications template** — functional requirements every public-sector ePTW system must satisfy. Since 1 Apr 2024 public-sector construction tenders ≥ S$3M must use ePTW; **LTA is a public agency**, so CR101's replacement *is* this spec. | All of CS-01…CS-03, CS-07 (verification checklist) |
| `circular-20240202-wsh-public-sector-construction.pdf` | The mandate circular itself: scope, dates, enforcement expectations. Governs why the system must exist in this form. | CS-09 (migration deadline driver) |

### MOM — PTW practice

| File | Why it matters | User stories affected |
|------|----------------|----------------------|
| `tripartite-guide-permit-to-work-opec.pdf` | MOM Tripartite Guideline on PTW (OPEC cluster) — the canonical Singapore PTW lifecycle reference (roles, gates, permit types, closure). Corrects the common misattribution to SS 651 (which is chemical-industry SHMS). | CS-01, CS-02 chain template defaults |

### MOM — CCTV / site imagery (VSS)

| File | Why it matters | User stories affected |
|------|----------------|----------------------|
| `faqs-for-vss.pdf` | Video Surveillance System obligations: sites ≥ S$5M, camera specs (1080p/12fps), retention (30/180 days). Frames the image-capture half of the BCA 2026/27 supervision regime. | CS-03 (evidence), CS-10 candidate |

### AGC — WSH subsidiary legislation

| File | Why it matters | User stories affected |
|------|----------------|----------------------|
| `wsh-construction-regulations-2007.pdf` | WSH (Construction) Regs S 663/2007 — duties that generate the inspection/supervision records the system must keep. | CS-02, CS-03 |
| `wsh-risk-management-regulations.pdf` | RM Regs RG 8 — RA before high-risk work, 3-year review cycle. Anchors RA evidence against permits. | CS-03 (RA as evidence) |
| `wsh-incident-reporting-regulations.pdf` | Incident Reporting Regs RG 3 — 10-day MOM report deadline; defines incident record fields. | deferred CS-10 (incident, currently 0-count) |

### LTA — railway protection

| File | Why it matters | User stories affected |
|------|----------------|----------------------|
| `code-of-practice-railway-protection-2024.pdf` | COP for works in Railway Protection Zones — restricted-activity permit conditions that a CR101 PTW system must encode as constraints/checklists. 2024 edition. | CS-01 (permit conditions), CS-02 |

### BCA — site supervision regime (2026/27)

| Item | Status | Why it matters |
|------|--------|----------------|
| Remote Site Supervision Guidebook V2 | **manual download pending** — hosted on an unguessable isomer hash URL; BCA site is bot-protected | Firm-based Site Supervision regime; remote supervision via CCTV/images; site supervision inspection reports |
| Full site & test records list | **manual link**: <https://go.gov.sg/site-form> (JS redirect) | The record set BCA expects a contractor to maintain |

## What was searched (audit trail)

| Source | Method | Result |
|--------|--------|--------|
| MOM WSH hub, circulars, VSS FAQ | webfetch / curl | ✔ downloaded (4 PDFs) |
| Singapore Statutes Online (AGC) ×3 | curl + browser UA (default curl UA → CloudFront 403) | ✔ downloaded |
| LTA industry resources | curl + browser UA; original research URL truncated (`_Zones` → `_Zone`) — corrected | ✔ downloaded |
| BCA RSS Guidebook V2 | isomer URL contained a session-scoped token (unguessable); BCA site bot-protected (77-byte stub); DuckDuckGo captcha-blocked | ✗ manual download pending |
| go.gov.sg/site-form | JS interstitial, no Location header | manual link |
| WSH Council (`wshc.sg/regulations`, `tal.sg/wshc/...`) | webfetch | 404 — paths stale |
| SafetyCulture templates (`safetyculture.com/templates/`) | webfetch | 404 — library moved; competitor template inventory preserved in `research-regulatory.md` |

Download command pattern (browser UA required):

```bash
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
curl -sL -A "$UA" -o <file> "<url>"
```

## Regulatory duties embedded into the model (from research file)

| Duty | Source | Where it landed |
|------|--------|-----------------|
| Occupier/employer duties (ss 11, 14A, 21, 27, 28, 53 WSH Act) | WSH Act | CS-01/CS-02 role gates |
| ePTW for public tenders ≥ S$3M (since 1 Apr 2024) | MOM circular | product existence driver |
| RA before high-risk work + 3-yr review | RM Regs RG 8 | CS-03 evidence kind |
| Incident report ≤ 10 days | IR Regs RG 3 | deferred incident story |
| ConSASS ≥ S$30M, bizSAFE | MOM SHMS | org profile, not app |
| CCTV 1080p/12fps, 30/180-day retention (≥ S$5M) | MOM VSS | CS-03 media retention |
| Remote/firm-based site supervision (BCA 2026/27) | BCA joint circular | CS-10 candidate: supervision inspection reports w/ image evidence |
| Railway Protection Zone permit conditions | LTA COP 2024 | CS-01 conditional checklists |

**Unverified (flagged, do not build on yet):** BCA 2027 commencement date;
"SS 590:2013" as a PTW standard; any LTA-specific CCTV mandate beyond MOM VSS;
PEB portal contents (login-gated); MOM reporting APIs.
