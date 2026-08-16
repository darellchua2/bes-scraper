# Research: Regulatory + Competitor Scan — PTW / Inspection-Management System (SG Construction, LTA CR101 Context)

**Research goal:** Cited evidence base (regulations, codes, circulars, competitor report templates) to inform a replacement PTW/inspection-management system for Singapore construction (LTA rail project; contractor China Jingye; incumbent LTA CR101 PTW at service.globalbes.sg).

**Tier:** 2 — web-only literature review, agent-as-evaluator (declare skepticism; see research_log.md)
**Started / last updated:** 2026-08-16
**Method:** fetch → extract structured citation (title / publisher / date / URL / why-it-matters) → keep|discard → update this file.

## Categories covered

| # | Category | Status | Sources kept |
|---|----------|--------|--------------|
| 1 | BCA supervisory framework (2027; CCTV / digital supervision) | covered (2027 date unverified) | 4 |
| 2 | WSH Council + MOM (WSH Act, Construction & RM Regs, PTW CoP, ConSASS, bizSAFE, SnapSAFE, accident reporting, VSS) | covered | 12 |
| 3 | PEB + BOA (RE/RTO/QSS duties, inspection documentation) | covered (PEB portal login-gated) | 3 |
| 4 | LTA contractor safety (codes of practice, railway protection, CCTV/inspections) | covered | 5 |
| 5 | URA + SLA (brief: surveys, conservation, occupation) | covered (brief, as scoped) | 4 |
| 6 | Competitor PTW/inspection report templates (SafetyCulture, Intelex, Cority, Sphera, Enablon, SG-local) | covered | 5 |
| 7 | Startup implementation requirements (PDPA, retention, audit trail, offline, MOM integrations, WSHO workflows) | covered (synthesis over cited sources) | 1 |

## Gaps identified

- G1: BCA circulars naming firm-based supervision — **closed** (APPBCA-2026-11 + RSS Guidebook V2); exact "2027" commencement date still **[unverified]**
- G2: WSH record/retention obligations — **closed** (VSS 30/180-day; RA 3-year review; 10-day incident report; ConSASS ≥$30M; BCA 14 record classes)
- G3: RE/RTO documentation duties — **closed via BCA primary sources** (PEB portal login-gated)
- G4: LTA safety/inspection clauses — **closed** (SHE specs, LTA.PROMPT works-permit workflow, Railway Protection COP 2024); LTA CCTV mandate **[unverified — no public page]**
- G5: Competitor templates — **closed** for SafetyCulture/Intelex/Cority/Sphera/Enablon; Yepar/Kaki Builder/Camms **[unverified as PTW vendors]**
- G6: Minimal compliance feature set — **closed** (§7)
- G7: PTW CoP identity — **closed**: no "SS 651/CP 99" PTW code; SS 651:2019 = chemical SHMS (verified); authoritative SG PTW doc = Tripartite Guideline on PTW (OPEC). "SS 590:2013" **[unverified — check Singapore Standards eShop]**

## Source index

- [MOM] Video surveillance system (VSS) for construction sector — §1/§2
- [MOM] WSH requirements in public sector construction (ePTW mandate) — §2 ★
- [BCA] Site Supervisor requirements (RE/RTO) — §1/§3
- [BCA] Construction site records (14 record classes) — §3
- [BCA] Guidebook for Remote Site Supervision V2 + joint circular — §1
- [BCA] Guide Book for Site Supervision Plan — §1/§3

---

# Findings by section

## §1 BCA supervisory framework (CCTV / digital site supervision)

**1.1 "Site Supervisor requirements" — BCA (Last updated 12 Mar 2026)**
URL: https://www1.bca.gov.sg/safety-and-standards/applications-and-licenses/permit-for-structural-works/requirements-on-site-supervisor-and-framework-for-risk-based-inspection/
Why it matters: statutory supervision laddering that any inspection/PTW system must model — site supervisors appointed by the QP during permit application; all Qualified Site Supervisors must be JAC-accredited (IES/ACES). Contains the RE/RTO minimum-deployment table by contract value (e.g. >$75–150M ⇒ 1 RE + 2 RTO; >$150M ⇒ 2 RE + 3 RTO or 1 RE + 5 RTO, with reduced deployments at stages A/B/C) and links BCA's "Framework for risk-based inspection" (Annex 1 PDF).
Linked download: Annex 1 – Framework for Risk-based Inspection (PDF, 3 MB): https://isomer-user-content.by.gov.sg/338/d84d7718-fd8a-493b-bda5-99348db94d86/annex_1.pdf

**1.2 Joint BCA/ACES/IES/SCAL circular + "Guidebook for Remote Site Supervision (RSS)" V2 (2026)**
Circular ref (from hosting mirror filename): APP BCA-2026-11 — mirror URL: https://redas.com/wp-content/uploads/2026/07/APPBCA-2026-11-RSS-Guidebook-V2-Circular.pdf (hosted by REDAS, uploaded 2026-07)
Guidebook PDF (BCA/IES/ACES/SCAL): https://isomer-user-content.by.gov.sg/338/8c613d5d-1790-4746-86c3-4eed9c23a720/Remote%20Site%20Supervision%20Guidebook%20V2.pdf
Why it matters: per the circular's indexed text (search snippet; PDF body not machine-extracted this session — **[partially verified]**): "the traditional model of individual-based site supervision is no longer sufficient… BCA will be implementing a **firm-based site supervision regime, requiring the appointment of BCA-licensed Site Supervision Firms (SSFs)**". This is the "Enhanced Construction Supervision" family of reforms the replacement system must target; RSS legitimises digitally-mediated supervision (video-link supervision with documentation duties).
Status: exact rollout date ("2027") **[unverified]** — BCA circulars index at www1.bca.gov.sg lists circulars (home page showed a 29 Jul 2026 circular); full-text confirmation pending.

**1.3 "Guide Book for Site Supervision Plan" (BCA/IES/ACES joint, rev 1.1)**
URL (PDF): https://isomer-user-content.by.gov.sg/338/c0e4acad-321d-4ea8-bbaa-41d0446aa899/rev1-1-guide-book-for-ssp---final.pdf
Why it matters: template + guidebook for Site Supervision Plans (piloted Apr 2020 for projects > $7.5M) — the SSP is the upstream document an inspection-management system should digitise and track compliance against.

**1.4 MOM VSS (CCTV) mandate — see §2.1.** The "digital site supervision + site images" obligation currently in force for construction is MOM's, not BCA's; BCA's piece (2026+) is the firm-based SSF regime + RSS guidebook. A PTW/inspection system should attach camera location IDs to permits (VSS mandated at work-at-height >2 m, scaffold/formwork, excavation/shoring, lifting, industrial-truck and vehicular zones, loading/unloading, confined spaces) and preserve footage pointers ≥180 days post-incident.

## §2 WSH Council + MOM

**2.1 "Video surveillance system (VSS) for construction sector" — MOM (Last updated 13 Jun 2024)**
URL: https://www.mom.gov.sg/workplace-safety-and-health/safe-measures/sectoral-level/video-surveillance-system-for-construction-sector
Why it matters: hard requirement that from **1 Jun 2024** all construction worksites with contract value ≥ **$5M** install VSS. Technical spec a system must interoperate with: colour, ≥1920×1080, ≥12 fps, exportable .avi/.mp4, date/time/camera-ID stamps. **Retention: ≥30 days normally; ≥180 days after a reportable WSH incident** — the system should enforce incident-linked retention holds on footage/records.
Companion docs: VSS FAQs PDF (https://www.mom.gov.sg/-/media/mom/documents/safety-health/faqs-for-vss.pdf); press release 27 May 2024 (https://www.mom.gov.sg/newsroom/press-releases/2024/0527-entrenching-wsh-excellence-with-increase-in-maximum-fines-and-mandatory-video-surveillance — also records the WSH max-fine increases); WSH Council "WSH Guide on Video Surveillance Systems" (https://www.tal.sg/wshc/resources/publications/guides-and-handbooks/wsh-guide-on-video-surveillance-systems).

**2.2 "WSH requirements in public sector construction and construction-related projects" — MOM (effective 1 Apr 2024; page Last updated 17 Apr 2026)** ★ core citation for this project
URL: https://www.mom.gov.sg/workplace-safety-and-health/safe-measures/sectoral-level/wsh-requirements-in-public-sector-construction-and-construction-related-projects
Why it matters: LTA is a public agency — these apply to LTA rail contracts. Key obligations:
- **ePTW mandated**: for public-sector construction/construction-related tenders ≥ **$3M**, "mature WSH technology" must be adopted, including an "**Electronic Permit-To-Work System (ePTW)** which allows full visibility of ongoing high-risk activities and identifies conflicting works" + Vehicular Safety Technology.
- Safety Disqualification (SDQ) framework for tenders $90k–$1M (main contractors) and >$1M (all subcontractor levels); compliance via **CheckSafe** (https://www.mom.gov.sg/workplace-safety-and-health/checksafe).
- Standardised Conditions-of-Contract safety clauses >$1M: activity-specific WSH training records, periodic WSH performance reporting, RA + method-statement compliance across all subcontractor tiers — i.e. the exact records a PTW/inspection system must hold.
- Safety tender criteria weightage ≥5% (>15% of Quality under BCA's PQM); WSH Bonus Scheme ≥$50M projects.
Official PDFs (downloadable):
- Circular, 2 Feb 2024: https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/circular-20240202-enhancement-wsh-requirements-in-public-sector-construction.pdf
- Annex A — Summary & implementation guide: https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/annex-a-summary-and-implementation-guide.pdf
- **Annex B — Electronic permit-to-work specifications template** (build-to spec): https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/annex-b-eptw-specification.pdf
- Annex C — Vehicular safety technology specifications template: https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/annex-c-vst-specification.pdf

## §3 PEB + BOA (RE/RTO/QP duties) — completed

**3.1 "Construction site records" — BCA (Last updated 29 Jan 2026)**
URL: https://www1.bca.gov.sg/safety-and-standards/applications-and-licenses/permit-for-structural-works/construction-site-records/
Why it matters: enumerates the 14 classes of site & test records the QP must "keep and maintain at the premises" during construction — the de-facto record model for an inspection-management module: (1) 3-month schedule of structural works; (2) QP + supervisor **attendance records**; (3) **site record book** (time on site, comments/instructions); (4) approved plans/amendments/specifications; (5) **record of inspection & approval for concreting** (who inspected, duration, comments); (6) record of repairs to defective structural works (defect, remedial action, date, supervising officer); (7) site investigation reports (SAC-SINGLAS labs); (8) pile load test records (submitted to Commissioner of Building Control); (9–13) material test records (cement/sand/aggregates, cube tests, rebar mill certs, prestressing); (14) other test records + **site instructions by QP/RE/site supervisors**.
Full list download: https://go.gov.sg/site-form ("full list of typical sites and test records")
**3.2** Explainer (secondary, non-official): "The Triad of Site Supervision in Singapore: QP(S), RE, RTO under BCA Regulations" — structures.com.sg (dated 2026-08-10 in search index): https://structures.com.sg/the-triad-of-site-supervision-in-singapore-demystifying-qps-re-and-rto-roles-under-bca-regulations/ — useful orientation only; cite regulations, not this, in compliance docs.
**3.3 PEB — RE/RTO duties [primary source gated]**: PEB's old site is decommissioned (https://www.peb.gov.sg/secs/index.html states the migration) and **www2.peb.gov.sg is login-gated** — RE/RTO duties could not be cited from PEB primary pages this session **[unverified — portal gated]**. RE/RTO statutory duties sit in the Building Control Act/Regulations framework administered with BCA (see §1.1 and §3.1 — the citable primary sources); PEB handles professional registration/discipline.

**3.4 Board of Architects — "Rules and laws" (Last updated 22 May 2026)**: https://www.boa.gov.sg/who-we-are/rules-and-laws/ — Architects Act + Architects (Professional Conduct and Ethics) Rules (SSO links listed). QP(Supervision)/inspection-documentation duties are under the Building Control Act (BCA), not on BOA's fetched pages — cite BCA sources for duties.

## §2 (continued) WSH Act, regulations, PTW guidance, reporting, ConSASS, bizSAFE

**2.3 Workplace Safety and Health Act 2006 (2020 Rev Ed; current as at 16 Aug 2026) — Singapore Statutes Online**
URL: https://sso.agc.gov.sg/Act/WSHA2006 (PDF: https://sso.agc.gov.sg/Act/WSHA2006?ViewType=Pdf)
Why it matters: the duty map a PTW/inspection system operationalises — s10–19 duties by capacity (s11 occupier, s12 employer, s14/14A principals **including duties over contractors**), s21 remedial/stop-work orders, s27 notification & reporting of accidents/dangerous occurrences/ODs, s28 WSH officers, s40B–40C **approved codes of practice admissible in criminal proceedings** (following / not following an ACOP has evidentiary weight — build checklists to ACOPs).

**2.4 Key subsidiary legislation (verified via SSO Subsidiary Legislation index)**
Index: https://sso.agc.gov.sg/Act/WSHA2006?ViewType=Sl
- **WSH (Construction) Regulations 2007, S 663/2007** — https://sso.agc.gov.sg/SL/WSHA2006-S663-2007 (PDF 335 KB). Construction-specific safe-work controls; the regs a construction PTW module must satisfy (section-level mapping to be done from the PDF text).
- **WSH (Risk Management) Regulations, Cap. 354A RG 8** — https://sso.agc.gov.sg/SL/WSHA2006-RG8 (mirror: /SL/354A-RG8). RA obligations on employers, self-employed and principals **incl. contractors and sub-contractors**; RA for routine + non-routine work. Review: **once every 3 years**, or on significant process/design change, new machinery/substances/procedures, or after any injury/incident (MOM FAQ, verified: https://www.mom.gov.sg/faq/safety-and-health-management-systems/when-should-my-company-review-its-risk-assessment).
- **WSH (Incident Reporting) Regulations, Cap. 354A RG 3** — https://sso.agc.gov.sg/SL/WSHA2006-RG3 (PDF 122 KB).
- **WSH (Safety and Health Management System and Auditing) Regulations 2009, S 607/2009** — https://sso.agc.gov.sg/SL/WSHA2006-S607-2009 (SHMS + audit obligations; legal basis of ConSASS-style audits).
- **WSH (Workplace Safety and Health Officers) Regulations, Cap. 354A RG 9** — https://sso.agc.gov.sg/SL/WSHA2006-RG9 (WSHO appointment/duties — the primary system persona).
- PTW-relevant high-risk regs (URLs on the SL index): Confined Spaces S 462/2009, Work at Heights S 223/2013, Scaffolds S 518/2011, Operation of Cranes S 515/2011, Design for Safety S 428/2015.

**2.5 "Permit-to-Work (PTW) Systems" — MOM (Last updated 14 Mar 2024) + Tripartite Guideline**
Page: https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/permit-to-work-systems
**Tripartite Guideline on Permit-to-Work for the Oil, Petrochemical, Energy and Chemicals (OPEC) Cluster (PDF)**: https://www.mom.gov.sg/-/media/mom/documents/safety-health/tripartite-guide-permit-to-work-opec.pdf
Why it matters: defines the SG-canonical **PTW role model — Occupier / PTW Authority / PTW User** — and the guiding principle that the PTW Authority must (a) be competent and understand the hazards of the permitted work, and (b) have **authority to approve or reject a PTW application without being pressurised**. Implement these three roles + approval independence in workflow permissions.
G7 resolution: **no "SS 651 / CP 99" PTW code of practice exists** — SS 651:2019 = "Safety and health management system for the chemical industry" (verified on Singapore Standards eShop and via MOM's bizSAFE STAR / SS651 audit pages). A possible standalone "SS 590:2013 Code of Practice for Permit-To-Work Systems" is **[unverified — search engines blocked this session; verify at https://www.singaporestandardseshop.sg]**.

**2.6 "Work-related accidents: what and when to report" — MOM (Last updated 17 Dec 2025)**
URL: https://www.mom.gov.sg/workplace-safety-and-health/work-accident-reporting/what-and-when-to-report
Deadlines a system must drive: **notify the Commissioner as soon as reasonably practicable** for any death, Dangerous Occurrence, or hospitalised member of public; **submit an incident report within 10 days** (fatal: 10 days of the accident; non-fatal: 10 days of the employer's first notice of the accident; OD: 10 days of diagnosis). Failure to report: fine up to $10,000 first offence; up to $20,000 and/or 6 months' jail for subsequent offences. Submission eService "WSH Incident Reporting": https://www.mom.gov.sg/eservices/services/wsh-incident-reporting. Related but distinct: **SnapSAFE** (https://www.mom.gov.sg/workplace-safety-and-health/snapsafe---reporting-saves-lives) is MOM's **violation/lapse reporting** tool, not the accident-reporting channel; a "WSH alert service" (iReport/SnapMOM notifications) exists for occupiers.

**2.7 "Risk management" — MOM (Last updated 14 Mar 2024)**
URL: https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/risk-management
Why it matters: the RA content model — 3 basic steps (hazard identification, risk evaluation, risk control) + hierarchy of control; multidisciplinary RA team (management, engineers, technical staff, supervisors, operators, maintenance, safety, **contractors and suppliers**). Downloadable templates a PTW system should mirror/ingest (mom.gov.sg media links on the page): inventory-of-work-activities.pdf, risk-register-cover-sheet.pdf, risk-assessment-form.pdf; "Guide to WSH(RM) Regulations" v2.0 PDF (guidetoriskmgtregver20.pdf); **Approved Code of Practice on WSH Risk Management** — https://www.tal.sg/wshc/resources/publications/codes-of-practice/code-of-practice-on-wsh-risk-management.

**2.8 "Submit a ConSASS audit" — MOM (Last updated 14 Mar 2024)**
URL: https://www.mom.gov.sg/workplace-safety-and-health/safety-and-health-management-systems/submit-a-consass-audit
Why it matters: **construction worksites with contract sum ≥ $30M** must have their SHMS audited and submitted using ConSASS (Construction Safety Audit Scoring System), submitted jointly by the MOM-registered WSH auditor and a company representative via eService (https://www.mom.gov.sg/eservices/services/submit-and-retrieve-consass-audits). The PTW/inspection system should export evidence (permits, RA records, training records, inspection reports) mapped to ConSASS elements. Downloads on page: consass-checklist.xls, consass-score-card.xlsx, consass-interview-sheet.xls, consass-user-guide.pdf, consass-faqs.pdf.

**2.9 "About bizSAFE" — WSH Council (retrieved 16 Aug 2026)**
URL: https://www.tal.sg/wshc/programmes/bizsafe
Why it matters: bizSAFE Levels 1→STAR — Level 3 = Risk Management implementation audited by an MOM-registered Auditing Organisation using the **bizSAFE Level 3 RM audit checklist** (https://www.tal.sg/wshc/-/media/tal/wshc/programmes/files/risk-mgt-audit-checklist-wef1jan2026.xlsx); RM audit report valid 3 years; bizSAFE STAR requires SS 651:2019 or SAC-accredited ISO 45001:2018 certification. From 1 Jan 2026, RM implementation audits add speed-limiter verification checks. Legal hook: CEOs/board directors of higher-risk-sector companies must complete the Top Executive WSH Programme. bizSAFE status is a common tender prerequisite → the system should track bizSAFE/training-certificate expiries for subcontractors.

## §4 LTA contractor safety & railway protection

**4.1 LTA "Safety, Health & Environment" (page footer: last updated 04 Jun 2026)**
URL: https://www.lta.gov.sg/content/ltagov/en/industry_innovations/industry_matters/safety_health_environment.html
Why: top-level mandate — all LTA contractors must comply with legal WSH requirements **plus the LTA Safety, Health and Environment Specifications**, the Project Safety Review (PSR) certification and SHEMS. A PTW/SHE module for LTA work must map to the LTA SHE Specifications, not just the statute book.

**4.2 LTA "Construction Safety & Environment" (page footer: last updated 08 Apr 2026)**
URL: https://www.lta.gov.sg/content/ltagov/en/industry_innovations/industry_matters/safety_health_environment/construction_safety_environment.html
Why: hosts the contract-spec documents — **SHE General Specifications Appendix A (go.gov.sg/gsappa)**, Particular Specifications Appendix B, WSH Good Practices Handbook, and the **Construction Safety Handbook (2019 revision)** — the clause-level basis for permit/inspection controls on LTA CR contracts.

**4.3 LTA.PROMPT "Help & FAQs (Works)" (live portal, no date visible)**
URL: https://prompt.lta.gov.sg/WebUIPWAS/Home/Faq?faqType=Works
Why: LTA already operates a **digital permit-to-carry-out-works workflow** — eligible applicants (PE civil/structural only), registered "Qualified Site Supervisor" criteria, and **mandatory attachments: work method statement, site plans, photos**; links the Code of Practice for Works on Public Streets (Jun 2025 ed. — PDF >5 MB, not fetched). A replacement PTW system should mirror/interoperate with LTA.PROMPT's attachment set.

**4.4 Railway Protection requirements hub (last updated 28 Aug 2025) + Code of Practice**
Hub: https://www.lta.gov.sg/content/ltagov/en/industry_innovations/industry_matters/development_construction_specifications_resources/railway_protection_road_structure_safety_zones/requirements_for_developments_within_railway_protection_and_road_structure_safety_zone.html
**Code of Practice for Railway Protection, 2024 Edition (PDF, 3.7 MB)**: https://www.lta.gov.sg/content/dam/ltagov/industry_innovations/industry_matters/development_construction_resources/Building_Works_Restricted_Activities_in_Railway_Protection_Zone/Codes_of_Practice_Standards_Specifications_Guides_Forms/code_of_practice_for_railway_protection_2024_edition.pdf
Why: for rail-adjacent work (the CR101 context) — **permits to commence works within Railway Protection Zones, restricted-activity permissions, instrument installation certification, undertakings to supervise machinery**, plus submission procedures and instrumentation/monitoring guidelines. Model RPZ permits as a distinct permit class. The hub also carries the "Guide to Carrying Out Restricted Activities within Railway Protection and Safety Zones" and "Handbook on Development & Building Works in Railway Protection Zone" PDFs.

**4.5 LTA worksite CCTV requirement — [unverified — not found]**: no public LTA page mandating worksite CCTV was found. The binding CCTV/VSS mandate is MOM's (§2.1). Any CR-contract-specific CCTV clause lives in contract particular specifications (not public). Closest public evidence: LTA.PROMPT's mandatory photo attachments (§4.3) and Railway Protection instrumentation monitoring (§4.4).

## §5 URA + SLA (brief, as scoped)

**5.1 URA "Conservation" (last updated 17 Jun 2026)** — https://www.ura.gov.sg/conservation/ — all works/new uses in conserved buildings require **Conservation Permission** and guideline compliance → the permission gate an inspection module must evidence.
**5.2 URA "Conservation Resources" (last updated 24 Jun 2026)** — https://www.ura.gov.sg/conservation/conservation-resources/ — technical handbooks (with ICOMOS), technical supplements and "Do-It-Right" guides = the checklist basis for conservation inspections.
**5.3 SLA "Regulatory" (last updated 24 Jul 2025)** — https://www.sla.gov.sg/regulatory/ — SLA is the national land registration and land survey authority; **"Property boundaries" (last updated 04 Sep 2025)** — https://www.sla.gov.sg/regulatory/property-boundaries/ — cadastral/boundary surveys (by Registered Surveyors and owners), Certified Plans, Coordinated Cadastre → the survey-record basis for setting-out/boundary-clearance checks in construction inspections. Temporary Occupation Licence conditions: **[unverified — no standalone page found]**.

## §6 Competitor PTW / inspection report templates (verified catalog pages)

**SafetyCulture (rebranding to "Mitti") — free public template library** (legacy safetyculture.com/templates/ now 404s; library moved to /library):
| Template (exact title) | URL | Relevance |
|---|---|---|
| Permit to Work Template | https://safetyculture.com/library/construction/permit-to-workv8hta | Core PTW form (3,000+ downloads) |
| Permit to Work Template (contractor version) | https://safetyculture.com/library/construction/permit-to-work-template | PTW request → review → authorisation workflow |
| Permit to Work Template for Hot Work and Confined Space | https://safetyculture.com/library/construction/permit-to-work-sensus | Hot-work + confined-space permits |
| Permit to work (PTW) System Audit | https://safetyculture.com/library/construction/permit-to-work-ptw-system-audit | **PTW system audit / register verification** |
| Weekly Site Safety Inspection | https://safetyculture.com/library/construction/weekly-site-safety-inspection-RYVfj | Inspection checklist (46,000+ downloads) |
| Incident Report - First Response | https://safetyculture.com/library/construction/incident-report-first-response | Incident/near-miss first-response report |
| PTW search catalog (2,106 results) | https://safetyculture.com/library/search?q=permit+to+work&type=template | Full PTW template catalog |

**Intelex** (product pages public; demos/brochures form-gated): Permit Management — https://www.intelex.com/products/applications/permits-management-software/ ; Incident Management — https://www.intelex.com/products/applications/incident-management-software/ ; Inspection Management — https://www.intelex.com/products/applications/inspection-management-software/ ; Near Miss Reporting — https://www.intelex.com/products/applications/near-miss-reporting-software
**Cority**: "Electronic Permit to Work Software to Control High-Hazard Work" (mobile-enabled PTW templates) — https://www.cority.com/safety-cloud/permit-to-work/ ; Incident Management Software — https://www.cority.com/corityone/incident-management-software/ ; Audit and Inspection Management — https://www.cority.com/corityone/audit-inspections/ ; EHS Analytics and Reporting (monthly safety reporting layer) — https://www.cority.com/corityone/analytics-reporting/
**Sphera** (ex-Petrotechnics): Permit To Work — "pre-defined templates based on best practices" — https://sphera.com/solutions/process-safety-management/control-of-work/permit-to-work/ ; Isolation Management — https://sphera.com/solutions/process-safety-management/control-of-work/isolation-management/ ; Control of Work suite — https://sphera.com/solutions/process-safety-management/control-of-work/ ; Incident Management Software — https://sphera.com/solutions/environment-health-safety-sustainability/health-and-safety-management-software/incident-management-software/
**Enablon (Wolters Kluwer)**: Control of Work — Permit to Work (AI "Permit Advisor"; page also lists Isolation Management & LOTO, Operational Risk Assessment, Shift Management, SIMOPs) — https://www.wolterskluwer.com/en/solutions/enablon/control-of-work-software ; PTW digitisation case study "How Pfizer digitalized its work permit process…" — https://www.wolterskluwer.com/en/expert-insights/how-pfizer-digitalized-its-work-permit-process-to-reduce-work-related-injuries
**SG-local e-permitting — [unverified as PTW vendors]**: **Yepar** (yepar.com returned HTTP 522; yepar.sg unreachable), **Kaki Builder** (kakibuilder.com resolves but presents a chatbot/marketing agency — no PTW product), **Camms** (cammsgroup.com shows only "Camms Is Now Part of Riskonnect"; no SG PTW offering found). No verifiable Singapore-local PTW product could be confirmed this session.

## §7 Startup implementation requirements (synthesis — grounded in §1–§6 citations; Tier 2 judgment)

**Compliance must-haves (without these you cannot credibly serve an LTA/public-sector contractor):**
1. **ePTW feature baseline = MOM Annex B spec** (§2.2): full permit lifecycle (apply → review → approve → active → close), **visibility of all ongoing high-risk activities**, and **automatic conflicting-works identification** — Annex B is the required-features template for ≥$3M public-sector projects since 1 Apr 2024.
2. **Role model**: Occupier / PTW Authority / PTW User (+ RE/RTO/QP/WSHO personas), with **approval independence** for the PTW Authority (§2.5) and RE/RTO deployment tracking per contract value (§1.1).
3. **RA records attached to permits**: RA per activity (3-step + hierarchy of control), review cycle ≤3 years or triggered; ingest MOM RA / risk-register form shapes (§2.4, §2.7).
4. **Records inventory covering BCA's 14 site/test record classes** — at minimum: attendance records, site record book (time on site + instructions), inspection-and-approval-for-concreting, defect/repair records, site instructions (§3.1).
5. **Incident reporting workflow**: capture → notify-Commissioner-ASAP path (death/dangerous occurrence) → 10-day incident-report deadline tracking → export in WSH Incident Reporting eService field shape (§2.6).
6. **Retention & legal holds**: VSS footage pointers ≥30 days, ≥180 days post-reportable-incident (§2.1); RA audit report 3-year validity (§2.9). **Audit-trail integrity is a legal matter**: WSH Act s53 criminalises false entries/forged certificates — append-only audit logs, no hard deletes, full who/what/when (§2.3).
7. **WSHO workflows**: checklists aligned to ACOPs (evidentiary value, s40C §2.3), stop-work/remedial-order drill-down, monthly WSH performance reporting (public-sector CoC clause §2.2), ConSASS-element evidence export for ≥$30M worksites (§2.8).
8. **PDPA baseline**: PDPC PDPA overview — https://www.pdpc.gov.sg/about/the-legislation/pdpa-overview (published 03 Nov 2023) — consent/notification, protection and **retention-limitation** obligations apply to worker NRIC/training/medical data; incident records are sensitive personal data → access controls, purpose limitation.
9. **LTA-specific permit classes**: RPZ permits / restricted-activity permissions with instrumentation attachments (§4.4); attachments per LTA.PROMPT: method statement, site plans, **photos** (§4.3).

**Nice-to-haves (differentiators, not legal musts):** offline-first site mode (operationally near-essential; not statutorily mandated), VSS camera integration (export .avi/.mp4, timestamp/camera-ID aware — interop spec exists §2.1), CheckSafe/SDQ subcontractor screening lookups (§2.2), bizSAFE/training-certificate expiry tracking (§2.9), AI conflict-detection/analytics (competitive parity with Sphera/Enablon §6), ConSASS checklist pre-population.

**MOM reporting integrations**: no public API mandate found **[unverified]** — integration reality is via MOM eServices portals (WSH Incident Reporting; ConSASS submission by the auditor; CheckSafe) and LTA.PROMPT for works permits. Design for assisted-manual export, not assumed APIs.

---

# Most downloadable key documents (FINAL)

**Top 10:**
1. **MOM Annex B — Electronic permit-to-work specifications template** (PDF) ★ the build-to ePTW spec: https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/annex-b-eptw-specification.pdf
2. **MOM Circular, 2 Feb 2024** — Enhancement of WSH requirements in public sector construction: https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/circular-20240202-enhancement-wsh-requirements-in-public-sector-construction.pdf
3. **Tripartite Guideline on Permit-to-Work for the OPEC Cluster** (PDF): https://www.mom.gov.sg/-/media/mom/documents/safety-health/tripartite-guide-permit-to-work-opec.pdf
4. **WSH (Construction) Regulations 2007 (S 663/2007)** (PDF, SSO): https://sso.agc.gov.sg/SL/WSHA2006-S663-2007?DocDate=20240527&ViewType=Pdf
5. **WSH (Risk Management) Regulations (RG 8)** (PDF, SSO): https://sso.agc.gov.sg/SL/WSHA2006-RG8?DocDate=20241226&ViewType=Pdf
6. **WSH (Incident Reporting) Regulations (RG 3)** (PDF, SSO): https://sso.agc.gov.sg/SL/WSHA2006-RG3?DocDate=20241226&ViewType=Pdf
7. **LTA Code of Practice for Railway Protection, 2024 Edition** (PDF, 3.7 MB): https://www.lta.gov.sg/content/dam/ltagov/industry_innovations/industry_matters/development_construction_resources/Building_Works_Restricted_Activities_in_Railway_Protection_Zone/Codes_of_Practice_Standards_Specifications_Guides_Forms/code_of_practice_for_railway_protection_2024_edition.pdf
8. **MOM — FAQs for VSS** (PDF): https://www.mom.gov.sg/-/media/mom/documents/safety-health/faqs-for-vss.pdf
9. **BCA — Guidebook for Remote Site Supervision V2** (PDF): https://isomer-user-content.by.gov.sg/338/8c613d5d-1790-4746-86c3-4eed9c23a720/Remote%20Site%20Supervision%20Guidebook%20V2.pdf
10. **BCA — full list of typical site and test records**: https://go.gov.sg/site-form

**Also valuable:** MOM Annex A implementation guide (https://www.mom.gov.sg/-/media/mom/documents/safety-health/circulars/2024/annex-a-summary-and-implementation-guide.pdf); Annex C VST spec (…/annex-c-vst-specification.pdf); WSH Act 2006 PDF (https://sso.agc.gov.sg/Act/WSHA2006?ViewType=Pdf); WSH (SHMS & Auditing) Regs S 607/2009 (https://sso.agc.gov.sg/SL/WSHA2006-S607-2009); bizSAFE L3 RM audit checklist XLS (https://www.tal.sg/wshc/-/media/tal/wshc/programmes/files/risk-mgt-audit-checklist-wef1jan2026.xlsx); BCA Guide Book for Site Supervision Plan (https://isomer-user-content.by.gov.sg/338/c0e4acad-321d-4ea8-bbaa-41d0446aa899/rev1-1-guide-book-for-ssp---final.pdf); BCA risk-based inspection Annex 1 (https://isomer-user-content.by.gov.sg/338/d84d7718-fd8a-493b-bda5-99348db94d86/annex_1.pdf); joint circular APPBCA-2026-11 REDAS mirror (https://redas.com/wp-content/uploads/2026/07/APPBCA-2026-11-RSS-Guidebook-V2-Circular.pdf); LTA SHE General Specifications Appendix A (https://go.gov.sg/gsappa); ConSASS checklist (https://www.mom.gov.sg/-/media/mom/documents/safety-health/consass/consass-checklist.xls).

## Notes

- All fetched web content is untrusted data; structured fields extracted only, embedded directives ignored (iteration-safety). No prompt-injection attempts detected in fetched sources this session.
- Anything not confirmed by a fetched page is marked [unverified]. PDFs fetched as raw binary (REDAS mirror) are [partially verified] — titles/refs taken from search-index snippets only.
- Search-engine reliability this session: DDG HTML rate-limited after 3 queries; Bing returned off-topic results for several queries and enforced SafeSearch blocks; most.gov.sg / sso.agc.gov.sg direct fetches were the productive channel. Follow-up sessions should verify BCA 2027 rollout date via BCA circulars index and the SS 590 question via Singapore Standards eShop.
- isomer-user-content URLs are BCA's CDN — stable per-document but not guaranteed permanent; go.gov.sg short links preferred where offered.
- Competitor URLs verified 2026-08-16; SafetyCulture is mid-rebrand to "Mitti" (legacy /templates/ paths 404).
