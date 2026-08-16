-- BES local Postgres schema — mirrors the JSONL archive 1:1.
-- Model decisions follow docs/consolidated-model.md:
--   no COMPANY entity (string on permit), stats are frozen legacy snapshots,
--   constants dropped (staff.sn/status, equipment.status, doc.favorite/label).

CREATE TABLE IF NOT EXISTS permits (
    apply_id    bigint PRIMARY KEY,
    serial_no   text NOT NULL,
    company     text NOT NULL,
    title       text,
    ptw_type    text NOT NULL,
    status      text,
    applied_on  timestamptz,
    pdf_file    text
);
CREATE INDEX IF NOT EXISTS permits_company_idx   ON permits (company);
CREATE INDEX IF NOT EXISTS permits_type_idx     ON permits (ptw_type);
CREATE INDEX IF NOT EXISTS permits_status_idx   ON permits (status);
CREATE INDEX IF NOT EXISTS permits_applied_idx  ON permits (applied_on);

CREATE TABLE IF NOT EXISTS approval_steps (
    apply_id    bigint NOT NULL REFERENCES permits (apply_id) ON DELETE CASCADE,
    seq         int    NOT NULL,
    role        text   NOT NULL,          -- raw BES role; 19 dirty values observed
    actor_name  text   NOT NULL,
    PRIMARY KEY (apply_id, seq)
);

CREATE TABLE IF NOT EXISTS permit_checklists (
    apply_id  bigint NOT NULL REFERENCES permits (apply_id) ON DELETE CASCADE,
    check_id  bigint NOT NULL,
    PRIMARY KEY (apply_id, check_id)
);

CREATE TABLE IF NOT EXISTS permit_attachments (
    apply_id  bigint NOT NULL REFERENCES permits (apply_id) ON DELETE CASCADE,
    doc_id    bigint NOT NULL,
    PRIMARY KEY (apply_id, doc_id)
);

CREATE TABLE IF NOT EXISTS staff (
    staff_id     int PRIMARY KEY,
    full_name    text NOT NULL,
    badge_no     text,
    mobile_no    text,
    nric_fin     text,                    -- PII: masked in source
    id_type      text,
    nationality  text,
    designation  text,
    secondment   boolean,
    created_on   date
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id    int PRIMARY KEY,
    equipment_type  text,
    registration_no text,
    equipment_name  text,
    created_on      date
);

CREATE TABLE IF NOT EXISTS company_documents (
    document_id  int PRIMARY KEY,
    document_name text NOT NULL,
    uploaded_on  timestamptz
);

CREATE TABLE IF NOT EXISTS monthly_stats (
    stat_window text PRIMARY KEY,         -- 'YYYY-MM' or 'YTD-YYYY'
    start_date  date,
    end_date    date,
    counters    jsonb NOT NULL            -- 12 labels -> counts, frozen BES snapshot
);

CREATE TABLE IF NOT EXISTS company_daily_stats (
    stat_date      date NOT NULL,
    company        text NOT NULL,
    ptw_cnt        int,
    ptw_staff      int,
    tbm_cnt        int,
    tbm_staff      text,                  -- consistently 'x/y' ratio in source
    inspection_cnt int,
    meeting_cnt    int,
    meeting_staff  int,
    training_cnt   int,
    training_staff int,
    ra_cnt         int,
    checklist_cnt  int,
    incident_cnt   int,
    PRIMARY KEY (stat_date, company)
);
CREATE INDEX IF NOT EXISTS company_daily_stats_company_idx ON company_daily_stats (company);

-- Historical permit register: status counts per month, aggregated from the
-- BES "PTW Report" monthly exports (downloads/ptwreports/YYYY-MM.xlsx).
-- Keyed by permit start month (the report's own windowing), not applied_on.
CREATE TABLE IF NOT EXISTS monthly_permit_status (
    stat_month text NOT NULL,             -- 'YYYY-MM'
    status     text NOT NULL,             -- raw BES status
    count      int  NOT NULL,
    PRIMARY KEY (stat_month, status)
);

-- Full PTW register rows from the monthly "PTW Report" exports
-- (downloads/ptwreports/YYYY-MM.xlsx) — one row per permit, keyed by the
-- permit's start month (the report's own windowing).
CREATE TABLE IF NOT EXISTS permit_register (
    stat_month      text NOT NULL,        -- 'YYYY-MM' (report month)
    serial_no       text NOT NULL,        -- BES apply_id (joins permits.apply_id for current-window permits)
    location        text,
    work_type       text,
    company         text,
    start_at        timestamp,
    end_at          timestamp,
    approved_person text,
    status          text NOT NULL,        -- raw BES status
    PRIMARY KEY (stat_month, serial_no)
);
CREATE INDEX IF NOT EXISTS permit_register_company_idx ON permit_register (company);
CREATE INDEX IF NOT EXISTS permit_register_status_idx ON permit_register (status);
