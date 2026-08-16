# Mobile-native capabilities → user stories mapping

Supplement to [`consolidated-model.md`](consolidated-model.md). Maps
smartphone-specific features to the consolidated stories (CS-01…CS-09) and to
the regulatory drivers found in [`research/research-regulatory.md`](../research/research-regulatory.md)
(ePTW mandate, MOM VSS CCTV regime, BCA Remote Site Supervision, SnapSAFE).
BES itself proves the pattern: TBM/training/incident capture was **mobile-app
only** — the web console just shows counters.

## 1. Capability → story matrix

| Mobile capability | Enables | Links to | Regulatory / evidence driver | Implementation note |
|---|---|---|---|---|
| **Camera photo capture** | Attach geotagged, timestamped site photos as permit evidence (pre-work, during, at closure) | CS-03 (EVIDENCE, media_type already PDF\|PNG\|JPEG), CS-01 closure step | BCA supervisory framework: CCTV/**images**/site supervision inspection reports; ePTW Annex B expects site-condition records | EXIF strip→store (date, GPS) as EVIDENCE metadata; one-tap capture in permit detail screen |
| **Video clips** | Short site-condition/inspection clips (30–60 s) | CS-03 | MOM VSS regime normalises video evidence (1080p/12 fps, 30/180-day retention for fixed CCTV) — mobile clips complement fixed cameras for blind spots | Size-cap + compress client-side; upload resumable |
| **QR / barcode scan** | Scan permit QR at workfront to open the live permit, log "I was here", or file evidence against it | CS-01 (permit ref), CS-02 (acknowledge on site), CS-03 | Replaces BES's print-only QR stickers (US-07 was cut as print-only — mobile makes it a *verification loop*, the original YAGNI risk) | QR encodes serial_no/apply_id; offline-queueable |
| **Offline mode + sync queue** | Workers in basements/tunnels (Railway Protection Zones) capture everything; syncs when back online | CS-01…CS-06 all field actions | LTA CR101 rail-site reality: no connectivity in tunnels | Local encrypted store (SQLite/Realm), idempotent server sync (client-generated UUIDs), conflict rule = server wins on approvals, client wins on evidence |
| **Push notifications** | Next actor in the approval chain is pinged instantly; expiring permits alert holders | CS-02 (chain), CS-01 (expiry) | ePTW Annex B: permit validity windows + renewal flow | FCM/APNs; deep-link into action screen |
| **GPS + geofence** | Verify TBM session / evidence captured inside site polygon; site-register of "who is on site now" | CS-06 (FIELD_SESSION), CS-03 | BCA remote supervision: knowing supervision happened *on site* | Polygon check client-side; store lat/lng ± accuracy on session & evidence |
| **Biometrics (face/fingerprint)** | Fraud-resistant attendance + non-repudiable approval signatures | CS-06 (attendance), CS-02 (actor identity) | WSH accountability (WSH Act duties); replaces BES's dead face-rec export (`atd_program_attend_*` never worked) | Device-level biometric prompt = "possession + biometric" step-up; store method used per action |
| **Digital signature (stylus/finger)** | Assessor/approver signs on device; closure sign-off with photo | CS-02, CS-01 closure | MOM Tripartite PTW Guideline: signature authority per role | Signature PNG as EVIDENCE kind=signature; hash-bound to permit state |
| **NFC / badge scan** | Worker badge tap at TBM = attendance (cheaper than face-rec) | CS-06, CS-04 (badge_no exists on STAFF) | TBM participant counts are the No.1 mobile-only counter (18k+/mo) | Badge QR/NFC id ↔ badge_no |
| **Speech-to-text** | Supervisor dictates TBM topic / incident notes in the field | CS-06 topic, future incident log | Faster capture = better data quality | On-device (no PII to cloud) or via API with consent |
| **Camera OCR** | Scan equipment registration plate / paper permit into structured fields | CS-05 (EQUIPMENT registration_no), CS-09 migration of legacy paper | 2,475 equipment records keyed by registration_no | Client-side ML Kit; human confirm before write |
| **Kiosk/tablet site mode** | Shared site tablet for check-in, TBM capture, permit lookup | CS-01/02/03/06 at site office | Common on SG sites (site office display) | Shared-device profile; PIN per user switch |

## 2. How mobile changes the story set

The consolidated model was built from *web-reachable* BES data — mobile closes
three gaps the old system couldn't expose:

| Gap in BES (web) | Mobile closes via | Story impact |
|---|---|---|
| TBM/training = counters only, no records | FIELD_SESSION capture with headcount, topic, photo, GPS | CS-06 gains *evidence-grade* sessions; stats become derivable (already modeled as views) |
| Approval trail had **no timestamps, no reasons** | Actions taken on-device with time, actor identity, optional reason field | CS-02's `acted_on` + `outcome` become first-class (already added in optimized ERD) |
| QR stickers were print-only (US-07 cut) | Scan-to-verify loop | Re-introduce as CS-02/CS-03 acceptance bullet — *scan → view live permit status → act* — not a separate story |

## 3. Regulatory alignment (from research)

| Upcoming requirement | Mobile feature that satisfies it | Story |
|---|---|---|
| MOM ePTW mandatory for public tenders ≥ S$3M (since Apr 2024) — Annex B spec | The whole field app: apply, assess, approve, monitor, close on device | CS-01/02 |
| MOM VSS (CCTV ≥ S$5M sites, image retention) | Mobile photo/video as *supplementary* roaming coverage; retention policy on EVIDENCE | CS-03 |
| BCA 2026/27 Site Supervision regime — remote supervision, inspection reports with images | Supervisor daily inspection = TBM/session + geotagged photo report generated on device; exportable inspection report | CS-06 + CS-08 (report generator gains inspection-report template) |
| SnapSAFE-style violation reporting | In-app anonymous hazard report with photo | Candidate CS-10 (defer until product decision — mirrors open question on incidents) |
| WSH training records verification | Badge/NFC check-in showing last training date | CS-04 + CS-06 |

## 4. Startup build order (mobile slice)

1. **MVP**: offline permit list + QR scan → view/approve (CS-01/02 read+act)
2. **Evidence**: photo capture w/ GPS+time → EVIDENCE (CS-03)
3. **TBM**: session + NFC/QR headcount (CS-06)
4. **Then**: biometric step-up, OCR, speech, kiosk mode

Rationale: 1–3 are exactly what BES's mobile app already proves field workers
do daily (767 TBM/mo, 18k participants/mo) — no speculative features.
