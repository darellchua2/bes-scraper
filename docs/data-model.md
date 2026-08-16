# Data model — how BES saves data & inferred ERD

> **Optimized ERD:** see [`consolidated-model.md`](consolidated-model.md) — 16→8 entities after YAGNI/SOLID review against measured data.

Reverse-engineered from scraped payloads, grid columns, SQL error messages
(`cmsdb2.export_task`, `cmsdb2.atd_program_attend_YYYYMM`) and JSON shapes in
`downloads/`. **Inferred** = property list is our best model of the server
schema; verify against `schemas/*.schema.json` for the migration contract.

## 1. Storage model — server side (inferred) vs our archive (actual)

```mermaid
flowchart LR
    subgraph BES["BES server (cmsdb2, MySQL/Yii)"]
        direction TB
        PGM[[program<br/>3021=PTW, 1504=container]]
        APP[[license_apply<br/>PTW applications]]
        WF[[workflow steps]]
        CHK[[checklist report<br/>check_id]]
        ATT[[attachment<br/>doc_id]]
        ST[[staff]]
        EQ[[equipment]]
        DOC[[company doc]]
        STAT[[stats tables<br/>+ atd_program_attend_YYYYMM]]
        FB[("cms-filebase/<br/>PDF / QR tmp")]
        PGM --> APP --> WF
        APP --> CHK & ATT
        PGM --> STAT
    end
    subgraph OUR["bes-scraper archive (this repo)"]
        direction TB
        S1[("downloads/ptw/<br/>YYYY-MM-DD/PTW&lt;id&gt;.pdf")]
        S2[("extras.jsonl<br/>workflow + ids")]
        S3[("checklists/CHK&lt;id&gt;<br/>attachments/ATT&lt;id&gt;")]
        S4[("staff / equipment /<br/>company .jsonl")]
        S5[("statistics/<br/>statistics + company_daily.jsonl<br/>monthreports/*.xlsx")]
        S6[("index.xlsx +<br/>.state.json")]
        S7[("data/ptw.jsonl<br/>via export.py")]
    end
    BES -->|HTTP scrape| OUR
```

Key storage facts observed:

| Fact | Evidence |
|------|----------|
| Files live outside the DB under `cms-filebase/` | QR export returned `/cms-filebase/filebase/tmp/<id>.pdf` |
| Attendance is archived into **monthly tables** `atd_program_attend_YYYYMM` | exportepss CDbException |
| Async exports queue into `export_task(file_size, module, sub_module, status, record_time, program_id)` | upload/export CDbException |
| Checklist binaries are typed server-side (PDF/IMG magic bytes) | `downloadpdf&check_id` returns mixed `%PDF`/`%PNG`/`%JPEG` |
| Dedup: 22,787 refs → 4,255 unique CHK + 278 unique ATT | same id referenced by many PTWs |
| Stats drill-down materialised per company/day | `dateappgrid` rows keyed `(date, company)` |

## 2. Inferred ERD

```mermaid
erDiagram
    PROGRAM ||--o{ PTW_APPLICATION : "scopes"
    COMPANY ||--o{ PTW_APPLICATION : "applicant"
    PTW_APPLICATION ||--|{ WORKFLOW_STEP : "has trail"
    PTW_APPLICATION }o--o{ CHECKLIST_REPORT : "evidenced by"
    PTW_APPLICATION }o--o{ ATTACHMENT : "supported by"
    COMPANY ||--o{ STAFF : "employs"
    STAFF }o--o{ PROGRAM : "assigned (detail modal)"
    PROGRAM ||--o{ EQUIPMENT : "hosts"
    COMPANY ||--o{ COMPANY_DOC : "owns"
    PROGRAM ||--o{ DAILY_COMPANY_STAT : "aggregates"
    PROGRAM ||--o{ MONTHLY_STAT : "aggregates"
    DAILY_COMPANY_STAT }o--|| COMPANY : "per company/day"
    WORKFLOW_STEP }o--|| STAFF : "acted by"

    PROGRAM {
        int program_id PK
        string ptype "MC|SC"
        string name "LTA CR101"
    }
    PTW_APPLICATION {
        bigint apply_id PK
        int program_id FK
        string ptw_ref "LTA CR101/PTW/WAH/50147"
        string company_name
        string description
        string ptw_type "Working At Height"
        datetime created_on
        string status "Submitted|Assessed|Approved|Closure Accepted|Revoked|Closed"
    }
    WORKFLOW_STEP {
        bigint apply_id FK
        int step "1..6"
        string approver_name
        string role "Applicant|Assessed|Acknowledge|Approve|Closure Applicant"
        datetime acted_on "inferred"
    }
    CHECKLIST_REPORT {
        bigint check_id PK
        bigint apply_id FK
        string file "CHK<id>.pdf|jpg|png"
        datetime created_on "inferred"
    }
    ATTACHMENT {
        bigint doc_id PK
        bigint apply_id FK
        string file "ATT<id>.<ext>"
        datetime uploaded_on "inferred"
    }
    STAFF {
        int staff_id PK
        string sn "grid serial no"
        string full_name "SARKER TAPAN"
        string badge_no "CJY/JYB prefix + no"
        string mobile_no "8-digit SG"
        string nric_fin "masked PII"
        string id_type "WP|IC|SP|PR|EP"
        string nationality "11 observed values"
        string designation "40+ role titles"
        bool secondment "Y=203|N=4004"
        string status "Normal (all 4207)"
        datetime created_on
    }
    EQUIPMENT {
        int equipment_id PK
        string equipment_type "13 observed types"
        string registration_no "LP 385248 B"
        string equipment_name "Boomlift 831 A"
        string status "Available (all 2475)"
        string where_project "LTA CR101 - detail modal"
        datetime created_on
    }
    COMPANY_DOC {
        int document_id PK
        string document_name "COS55 doc code"
        bool favorite "always empty"
        string label "Others (all 103)"
        datetime uploaded_on "DD MMM YYYY HH:MM:SS"
    }
    COMPANY {
        int contractor_id PK "140"
        string operator_id "T06FC6884E"
        string name "China Jingye … (SB)"
    }
    DAILY_COMPANY_STAT {
        date stat_date
        int contractor_id FK
        int ptw_cnt
        int ptw_staff
        int tbm_cnt
        int tbm_staff
        int inspection_cnt
        int meeting_cnt
        int meeting_staff
        int training_cnt
        int training_staff
        int ra_cnt
        int checklist_cnt
        int incident_cnt
    }
    MONTHLY_STAT {
        string window "YYYY-MM|YTD-YYYY"
        date start_date
        date end_date
        json counters "12 labels->data"
    }
```

### Mobile-only (counters exist, records not web-exposed)

```mermaid
erDiagram
    PTW_APPLICATION ||--o{ TBM_SESSION : "briefs crew for"
    TBM_SESSION ||--|{ TBM_ATTENDANCE : "captures"
    TBM_SESSION }o--|| STAFF : "led by"
    PTW_APPLICATION ||--o{ INCIDENT : "may log"
    PROGRAM ||--o{ TRAINING_SESSION : "runs"

    TBM_SESSION {
        bigint tbm_id PK
        bigint apply_id FK
        date held_on
        string topic "inferred"
    }
    TBM_ATTENDANCE {
        bigint tbm_id FK
        int staff_id FK
        datetime checked_in "face-rec, inferred"
    }
    TRAINING_SESSION {
        bigint training_id PK
        int program_id FK
        string course
        date held_on
    }
    INCIDENT {
        bigint incident_id PK
        bigint apply_id FK
        string severity
        datetime occurred_on
    }
```

### Notes

- `WORKFLOW_STEP.acted_by → STAFF` is joined on name only (trail shows
  `approver_name`); a production model should key on `staff_id`.
- `CHECKLIST_REPORT`/`ATTACHMENT` are many-to-many in practice (one file
  referenced by several PTWs — observed dedup ratio 5.3:1 for CHK).
- `DAILY_COMPANY_STAT` composite key = `(stat_date, contractor_id)`.
- Our archive adds no new entities — every JSONL maps 1:1 onto this ERD.

## Re-render SVGs

```bash
for f in docs/diagrams/data-*.mmd; do
  npx -y @mermaid-js/mermaid-cli -i "$f" -o "${f%.mmd}.svg" -b white
done
```
