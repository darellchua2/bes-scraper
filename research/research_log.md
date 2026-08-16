# Research Log — Regulatory + Competitor Scan (PTW/Inspection-Management System, SG/LTA CR101 context)

**Tier declaration (per evaluator-contract):** This sweep is **Tier 2 — agent-as-evaluator**. The `pass`/`score` values in `research-results.tsv` are the agent's own judgment of whether a fetch batch materially advanced an open gap. They are weaker than a mechanical evaluator; the human reviewing this trail should apply correspondingly more skepticism. Mechanical signals were preferred wherever available (URL fetched vs 404; statute number verified on SSO vs guessed).

Session date: 2026-08-16. Files: `research/research-regulatory.md` (living state), `research/research-results.tsv` (8-col audit trail).

## Iterations

**I1 — Search: BCA supervision framework (DDG x2) + PTW CoP identity (DDG).**
Outcome: leads found — BCA Site Supervisor page, BCA RSS Guidebook V2 PDF, SSP Guidebook PDF, MOM VSS page, joint circular APPBCA-2026-11 (REDAS mirror); SS 651:2019 identified as *chemical-industry SHMS* (not a PTW CoP) — user's guess flagged for correction. Gaps: G1 lead, G7 lead. {"pass": true, "score": 2}. Note: DDG then rate-limited (captcha).

**I2 — Fetch: MOM VSS page; Bing "SS 590".**
Outcome: VSS page fully captured (≥$5M sites; camera locations; 1080p/12fps spec; 30/180-day retention; FAQ PDF + press release + WSHC guide links). Bing query returned Schutzstaffel garbage → query phrasing lesson. Gaps: G2 partially. {"pass": true, "score": 1}.

**I3 — Fetch: BCA construction-site-records page; REDAS circular PDF; tal.sg/wshc CoP URL (404).**
Outcome: BCA 14 record classes captured (record model for inspection module). REDAS PDF returned raw binary (unusable via webfetch; zai-web-reader also failed) → circular cited [partially verified] from search-index snippet. {"pass": true, "score": 1}.

**I4 — Delegation A (general subagent): competitor template citations.** Verified SafetyCulture (7 library URLs incl. PTW System Audit template), Intelex (4), Cority (4), Sphera (4), Enablon (2); Yepar/Kaki Builder/Camms honestly reported [unverified as PTW vendors] (522s, rebranded sites, parked domains). G5 closed. {"pass": true, "score": 1}.

**I5 — Delegation B (general subagent): LTA/PEB/BOA/URA/SLA.** LTA SHE page, Construction Safety & Environment page (GS Appendix A go.gov.sg/gsappa), LTA.PROMPT works-FAQ (digital permit workflow, photo attachments), Railway Protection hub + **COP for Railway Protection 2024 PDF**; PEB portal login-gated [unverified]; BOA rules-and-laws; URA conservation pages; SLA regulatory/boundaries. G3 partial, G4 closed (LTA CCTV mandate: not found publicly). {"pass": true, "score": 2}.

**I6 — Fetch: WSH Act (SSO, full TOC verified, current as at 16 Aug 2026); MOM incident-reporting + CoP URL guesses (404); tal.sg bizsafe (timeout).**
Outcome: WSH Act cited with section map. Learned: guess-URLs fail; use SSO index pattern + MOM landing-page navigation. {"pass": true, "score": 1}.

**I7 — Fetch: SSO SL index under WSHA (2 pages) + MOM WSH landing + work-accident-reporting hub + SHMS hub.**
Outcome: exact statute citations with PDFs — Construction Regs **S 663/2007** (earlier guess S706 wrong — verified against index), RM Regs **RG 8**, Incident Reporting Regs **RG 3**, SHMS & Auditing S 607/2009, WSHO Regs **RG 9**, plus high-risk regs. MOM PTW Systems page + **Tripartite Guideline on PTW (OPEC) PDF** found (G7 closed). {"pass": true, "score": 2}.

**I8 — Fetch: MOM what-and-when-to-report (10-day deadlines, penalties, eService), risk-management page (RA model + forms + ACOP RM), submit-a-consass-audit (≥$30M, downloads), RA-review FAQ (3-year cycle).**
Outcome: G2 closed with numbers. {"pass": true, "score": 1}.

**I9 — Fetch: tal.sg CoP index (500), PDPC PDPA overview (thin but canonical), tal.sg bizSAFE (full — levels, RM audit checklist XLS, SS651/ISO45001 STAR, speed-limiter checks 2026).**
Outcome: PDPA pointer for §7; bizSAFE verified; PTW CoP "SS 590" left [unverified] (search engines blocked; DDG captcha, Bing SafeSearch/junk). {"pass": true, "score": 1}.

**Finalisation —** all 7 categories covered; 7/7 gaps closed (with 5 residual [unverified] flags documented: BCA 2027 date, SS 590, LTA CCTV, PEB portal, SG-local vendors, MOM API mandate). Living file finalised with Top-10 download list. Loop stopped: category coverage saturated within scope; not an exhaustive sweep of every BCA circular.

## Suspicious-content log
None. No prompt-injection attempts detected in any fetched page this session (standard screening applied regardless).

## Lessons (for future fetch sessions)
- Search engines were the weakest link (DDG captcha; Bing junk/SafeSearch). Direct .gov.sg navigation + SSO indexes were the productive channel.
- SSO subsidiary-legislation pattern is `/SL/WSHA2006-<SLno>` where SLno is RG# (Chapter regs) or S<nnn>-<yyyy> (annual regs) — always resolve via the Act's SL index, never guess S numbers (S706 vs S663 error caught this way).
- isomer-user-content.by.gov.sg hosts BCA's PDFs; go.gov.sg short links (e.g. /site-form, /gsappa) are more durable.
