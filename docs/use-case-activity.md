# Use case & activity diagrams — per user story

Companion to [`user-stories.md`](user-stories.md). Mermaid approximates UML:
**use case diagrams** = flowchart with actors (`[box]`) → use cases (`((ellipse))`);
**activity diagrams** = flowchart TD with start/end stadiums, decisions `{}`,
actions in rectangles.

Story → diagram map:

| Stories | Use case diagram | Activity diagram |
|---------|------------------|------------------|
| US-01…05, 08 | [UC-1 PTW lifecycle](#uc-1--ptw-lifecycle) | [AC-1 PTW workflow](#ac-1--ptw-approval-activity) |
| US-06, 07 | [UC-1 PTW lifecycle](#uc-1--ptw-lifecycle) | [AC-1 PTW workflow](#ac-1--ptw-approval-activity) |
| US-09…12 | [UC-2 Checklists & attachments](#uc-2--checklists--attachments) | [AC-2 Checklist/attachment flow](#ac-2--checklist--attachment-activity) |
| US-13…16 | [UC-3 Registers](#uc-3--registers) | [AC-3 Register maintenance](#ac-3--register-maintenance-activity) |
| US-17…20 | [UC-4 Field activities](#uc-4--field-activities) | [AC-4 TBM session](#ac-4--toolbox-meeting-activity) |
| US-21…24 | [UC-5 Statistics & reporting](#uc-5--statistics--reporting) | [AC-5 Report generation](#ac-5--statistics-report-activity) |
| US-25…28 | [UC-6 Migration](#uc-6--migration-tooling) | [AC-6 Scrape run](#ac-6--scraper-run-activity) |

---

## UC-1 — PTW lifecycle

Covers US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08.

```mermaid
flowchart LR
    subgraph actors
        AP[Applicant<br/>contractor]
        AS[Assessor]
        SV[Site supervisor]
        AP2[Approver<br/>LTA / main-con]
        SO[Safety officer]
        AU[Auditor]
    end
    AP  --> UC1((Submit PTW<br/>US-01))
    AS  --> UC2((Assess PTW<br/>US-02))
    SV  --> UC3((Acknowledge PTW<br/>US-03))
    AP2 --> UC4((Approve / Reject<br/>US-04))
    AP  --> UC5((Close PTW<br/>US-05))
    AP  --> UC6((Download PTW PDF<br/>US-06))
    SO  --> UC7((Scan QR sticker<br/>US-07))
    AU  --> UC8((View audit trail<br/>US-08))
    UC1 -.includes.-> UC9((Attach documents<br/>US-11))
    UC7 -.includes.-> UC8
    UC4 -.extends.-> UC10((Revoke permit))
```

## AC-1 — PTW approval activity

State-accurate to the scraped workflow trails (6 steps, `Revoked` branch).

```mermaid
flowchart TD
    S([Start]) --> T[Choose PTW type<br/>e.g. Working At Height]
    T --> D[Describe work + dates<br/>attach docs]
    D --> SUB[Submit application]
    SUB --> ASS1{Assessor 1<br/>passes?}
    ASS1 -->|no| REJ[Revoked]
    ASS1 -->|yes| ASS2{Assessor 2<br/>passes?}
    ASS2 -->|no| REJ
    ASS2 -->|yes| ACK[Supervisor<br/>acknowledges]
    ACK --> APR{Approver<br/>decision}
    APR -->|reject| REJ
    APR -->|approve| ACT[Work proceeds<br/>QR sticker issued]
    ACT --> CLO[Applicant requests<br/>closure]
    CLO --> E([Closed])
    REJ --> E2([End - Revoked])
```

---

## UC-2 — Checklists & attachments

Covers US-09, US-10, US-11, US-12.

```mermaid
flowchart LR
    subgraph actors
        IN[Inspector]
        AP[Applicant]
        RV[Reviewer]
    end
    IN --> UC1((Run routine inspection<br/>US-09))
    IN --> UC2((Upload checklist report<br/>US-10))
    AP --> UC3((Attach documents<br/>US-11))
    RV --> UC4((Download all evidence<br/>US-12))
    UC1 -.includes.-> UC5((Generate CHK pdf))
    UC3 -.includes.-> UC6((Upload ATT file))
    UC4 -.includes.-> UC5 & UC6
```

## AC-2 — Checklist / attachment activity

```mermaid
flowchart TD
    S([Start]) --> Q{Artifact<br/>type?}
    Q -->|inspection done| CI[Complete checklist<br/>form on site]
    CI --> CU[Submit report against<br/>apply_id]
    Q -->|supporting doc| AU[Upload attachment<br/>method stmt / cert]
    CU --> ID1[check_id assigned]
    AU --> ID2[doc_id assigned]
    ID1 --> ST[Stored under PTW]
    ID2 --> ST
    ST --> RV{Reviewer<br/>wants evidence?}
    RV -->|single PTW| DL[downloadpreview /<br/>downloadattachment list]
    RV -->|bulk offline| BL[Batch download<br/>all CHK + ATT files]
    DL --> E([End])
    BL --> E
```

---

## UC-3 — Registers

Covers US-13, US-14, US-15, US-16.

```mermaid
flowchart LR
    subgraph actors
        PA[Project admin]
        PC[Plant coordinator]
        DC[Document controller]
    end
    PA --> UC1((Maintain staff register<br/>US-13))
    PA --> UC2((View staff projects<br/>US-14))
    PC --> UC3((Maintain equipment register<br/>US-15))
    DC --> UC4((Maintain doc register<br/>US-16))
    UC1 -.includes.-> UC5((Enforce induction<br/>status))
    UC3 -.includes.-> UC6((Track registration<br/>+ status))
    UC4 -.includes.-> UC7((Label + date docs))
```

## AC-3 — Register maintenance activity

```mermaid
flowchart TD
    S([Start]) --> O{Operation}
    O -->|add| EN[Enter record fields<br/>name/NRIC/type/status]
    O -->|edit| FI[Find by row id]
    FI --> EN
    O -->|review| BR[Browse grid 20/page]
    BR --> DT{Detail<br/>needed?}
    DT -->|yes| MOD[POST detail id<br/>e.g. Project: The Landmark,LTA CR101]
    DT -->|no| OUT
    MOD --> OUT[Record current]
    EN --> VAL{Fields valid?}
    VAL -->|no| EN
    VAL -->|yes| OUT
    OUT --> E([End])
```

---

## UC-4 — Field activities

Covers US-17, US-18, US-19, US-20. (TBM/training are mobile-app in BES — web exposes only counters.)

```mermaid
flowchart LR
    subgraph actors
        SV[Supervisor]
        SOf[Safety officer]
        HR[HR / admin]
        RP[Reporter]
    end
    SV --> UC1((Conduct TBM + capture attendees<br/>US-17))
    SOf --> UC2((Record training<br/>US-18))
    HR --> UC3((Face-rec attendance<br/>US-19))
    RP --> UC4((Report incident<br/>US-20))
    UC1 -.includes.-> UC5((Attendee check-in))
    UC3 -.includes.-> UC6((Swipe / face match))
    UC4 -.extends.-> UC7((Corrective action))
```

## AC-4 — Toolbox meeting activity

```mermaid
flowchart TD
    S([Start]) --> PRE[Prepare agenda from<br/>today's PTWs / hazards]
    PRE --> GAT[Gather work crew]
    GAT --> BC[Brief topics]
    BC --> CHK{Each worker<br/>checked in?}
    CHK -->|no| GAT
    CHK -->|yes| SIG[Capture attendance<br/>mobile app]
    SIG --> UP[Sync to server<br/>TBM + participant counters]
    UP --> ESC{Escalation<br/>raised?}
    ESC -->|yes| INC[Incident / RA entry]
    ESC -->|no| E([End])
    INC --> E
```

---

## UC-5 — Statistics & reporting

Covers US-21, US-22, US-23, US-24.

```mermaid
flowchart LR
    subgraph actors
        SM[Safety manager]
        MG[Manager]
    end
    SM --> UC1((View monthly counters<br/>US-21))
    SM --> UC2((Drill down by company/day<br/>US-22))
    MG --> UC3((Export monthly xlsx<br/>US-23))
    MG --> UC4((Export PTW register<br/>US-24 - broken))
    UC1 -.includes.-> UC5((moduledaycnt window)]
```

## AC-5 — Statistics report activity

```mermaid
flowchart TD
    S([Start]) --> SEL[Pick month window<br/>dd MMM yyyy]
    SEL --> SUM[POST moduledaycnt<br/>12 counters]
    SEL --> DR[GET dateappgrid<br/>per-company/day rows]
    DR --> P{More pages<br/>20/page?}
    P -->|yes| DR
    P -->|no| AGG
    SUM --> AGG[Aggregate + trend]
    AGG --> W{Window<br/>> 1 year?}
    W -->|yes| SP[Split into yearly<br/>windows - server 500s]
    W -->|no| XL
    SP --> XL[monthexport xlsx:<br/>accidents/AFR/categories/companies]
    XL --> E([End])
```

---

## UC-6 — Migration tooling

Covers US-25, US-26, US-27, US-28.

```mermaid
flowchart LR
    subgraph actors
        ME[Migration engineer]
        DA[Data analyst]
        OE[Ops engineer]
        CR[Cron scheduler]
    end
    ME --> UC1((Full archive export<br/>US-25))
    CR --> UC2((Nightly incremental sync<br/>US-26))
    DA --> UC3((Query JSONL by schema<br/>US-27))
    OE --> UC4((Captcha-solved login<br/>US-28))
    UC1 -.includes.-> UC4
    UC2 -.includes.-> UC4
    UC1 -.includes.-> UC5((Walk grid newest-first<br/>stop at known page))
    UC3 -.includes.-> UC6((export.py consolidate))
```

## AC-6 — Scraper run activity

```mermaid
flowchart TD
    S([Start]) --> L[Login: fetch captcha,<br/>solve via vision API]
    L --> LS{Login<br/>ok?}
    LS -->|no| R6{Attempts<br/>< 6?}
    R6 -->|yes| L
    R6 -->|no| X2([Exit 2])
    LS -->|yes| W[Walk grid pages<br/>newest-first]
    W --> KN{Page fully<br/>known?}
    KN -->|no| DL[Download new PTW PDFs<br/>4 workers, retry]
    DL --> NX[More pages?]
    KN -->|yes| FIN
    NX -->|yes| W
    NX -->|no| FIN[Rebuild index.xlsx<br/>update .state.json]
    FIN --> F{Any download<br/>failed?}
    F -->|yes| X3([Exit 3 - resumable])
    F -->|no| X0([Exit 0])
```

---

## Re-render SVGs

```bash
for f in docs/diagrams/uc-*.mmd docs/diagrams/ac-*.mmd; do
  npx -y @mermaid-js/mermaid-cli -i "$f" -o "${f%.mmd}.svg" -b white
done
```
