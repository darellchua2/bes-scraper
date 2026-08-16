import { query } from "./db";

/** Top-line counts for the overview page. */
export interface OverviewKpis {
  permits: number;
  permitsActive: number;
  permitsTerminal: number;
  companies: number;
  staff: number;
  equipment: number;
  checklists: number;
  attachments: number;
}

/** One bucket in a named-count breakdown (ptw_type, status). */
export interface NameCount {
  name: string;
  count: number;
}

/** Permits created in one calendar month. */
export interface MonthCount {
  month: string;
  count: number;
}

/** Permit lifecycle statuses that no longer change. */
const TERMINAL_STATUSES = [
  "Revoked",
  "Closure Accepted(Approver)",
  "Rejected(In Charge)",
  "Rejected(Inspector)",
  "Rejected(Assessor)",
  "Rejected(Approver)",
];

/**
 * Fetch aggregate KPI counts across permits, registers, and evidence.
 *
 * @returns one row of totals; active/terminal split uses TERMINAL_STATUSES
 */
export async function getOverviewKpis(): Promise<OverviewKpis> {
  const rows = await query<OverviewKpis>(
    `SELECT
       (SELECT count(*) FROM permits)::int AS permits,
       (SELECT count(*) FROM permits WHERE status <> ALL ($1))::int AS "permitsActive",
       (SELECT count(*) FROM permits WHERE status = ANY ($1))::int AS "permitsTerminal",
       (SELECT count(DISTINCT company) FROM permits)::int AS companies,
       (SELECT count(*) FROM staff)::int AS staff,
       (SELECT count(*) FROM equipment)::int AS equipment,
       (SELECT count(DISTINCT check_id) FROM permit_checklists)::int AS checklists,
       (SELECT count(DISTINCT doc_id) FROM permit_attachments)::int AS attachments`,
    [TERMINAL_STATUSES],
  );
  return rows[0];
}

/**
 * Count permits grouped by workflow status, descending.
 *
 * @returns one row per distinct status
 */
export async function getPermitsByStatus(): Promise<NameCount[]> {
  return query<NameCount>(
    `SELECT status AS name, count(*)::int AS count
     FROM permits GROUP BY status ORDER BY count DESC`,
  );
}

/**
 * Count permits grouped by PTW type, descending.
 *
 * @returns one row per distinct type (open vocabulary)
 */
export async function getPermitsByType(): Promise<NameCount[]> {
  return query<NameCount>(
    `SELECT ptw_type AS name, count(*)::int AS count
     FROM permits GROUP BY ptw_type ORDER BY count DESC`,
  );
}

/**
 * Count permits per calendar month by application timestamp.
 *
 * @returns one row per month, ascending (YYYY-MM)
 */
export async function getPermitsByMonth(): Promise<MonthCount[]> {
  return query<MonthCount>(
    `SELECT to_char(date_trunc('month', applied_on), 'YYYY-MM') AS month,
            count(*)::int AS count
     FROM permits
     WHERE applied_on IS NOT NULL
     GROUP BY 1 ORDER BY 1`,
  );
}

/** Observed transition between consecutive approval-chain stages. */
export interface StageTransition {
  from: string;
  to: string;
  count: number;
}

/** Permit count at one lifecycle stage for one current status. */
export interface StageStatusCount {
  stage: string;
  status: string;
  count: number;
}

/**
 * Normalizes a raw BES workflow role to its canonical chain role.
 * Raw values are dirty (19 observed): name-prefixed variants like
 * 'JYB3788 AHMED SAZIM  Applicant' plus junk like '-->' (→ 'Other').
 * Suffix matching per potential_implementation/base-information.md §2.
 */
const CANON_ROLE_SQL = `CASE
  WHEN role LIKE '%Closure Applicant' THEN 'Closure Applicant'
  WHEN role LIKE '%Closure Accept' THEN 'Closure Accept'
  WHEN role LIKE '%Acknowledge' THEN 'Acknowledge'
  WHEN role LIKE '%Assessed' THEN 'Assessed'
  WHEN role LIKE '%Approve' THEN 'Approve'
  WHEN role LIKE '%Applicant' THEN 'Applicant'
  ELSE 'Other'
END`;

/**
 * Count observed transitions between consecutive approval-chain steps,
 * canonicalizing the dirty raw role values by suffix.
 *
 * @returns one row per (from_stage, to_stage) pair, descending by count
 */
export async function getStageTransitions(): Promise<StageTransition[]> {
  return query<StageTransition>(
    `WITH steps AS (
       SELECT apply_id, seq, ${CANON_ROLE_SQL} AS stage
       FROM approval_steps
     )
     SELECT a.stage AS "from", b.stage AS "to", count(*)::int AS count
     FROM steps a
     JOIN steps b ON b.apply_id = a.apply_id AND b.seq = a.seq + 1
     WHERE a.stage <> 'Other' AND b.stage <> 'Other'
     GROUP BY 1, 2 ORDER BY 3 DESC`,
  );
}

/**
 * Count permits by (canonical stage of the trail's last step, current status).
 * Locates where in the lifecycle permits currently sit, incl. terminal states.
 *
 * @returns one row per (stage, status) pair
 */
export async function getStageStatusCounts(): Promise<StageStatusCount[]> {
  return query<StageStatusCount>(
    `SELECT stage, status, count(*)::int AS count FROM (
       SELECT DISTINCT ON (p.apply_id)
              p.apply_id, p.status, ${CANON_ROLE_SQL} AS stage
       FROM permits p
       JOIN approval_steps a ON a.apply_id = p.apply_id
       ORDER BY p.apply_id, a.seq DESC
     ) t
     GROUP BY 1, 2 ORDER BY 1, 2`,
  );
}

/** One company's activity counters for one day. */
export interface CompanyDailyRow {
  date: string;
  company: string;
  ptw: number;
  tbm: number;
  checklist: number;
  inspection: number;
  meeting: number;
  training: number;
  ra: number;
  incident: number;
}

/**
 * Fetch every company_daily_stats row (main activity counters only) for
 * build-time baking into a static JSON payload for the trends page.
 *
 * @returns one row per (stat_date, company), ascending by date
 */
export async function getCompanyDailyStats(): Promise<CompanyDailyRow[]> {
  return query<CompanyDailyRow>(
    `SELECT stat_date::text AS date, company,
            ptw_cnt AS ptw, tbm_cnt AS tbm, checklist_cnt AS checklist,
            inspection_cnt AS inspection, meeting_cnt AS meeting,
            training_cnt AS training, ra_cnt AS ra, incident_cnt AS incident
     FROM company_daily_stats
     ORDER BY stat_date`,
  );
}

/**
 * List distinct company names that have daily stats, alphabetically.
 *
 * @returns one row per company
 */
export async function getDailyStatsCompanies(): Promise<string[]> {
  const rows = await query<{ company: string }>(
    `SELECT DISTINCT company FROM company_daily_stats ORDER BY company`,
  );
  return rows.map((r) => r.company);
}

/** One staff register row (constants sn/status dropped per consolidated model). */
export interface StaffRow {
  staff_id: number;
  full_name: string;
  badge_no: string | null;
  mobile_no: string | null;
  nric_fin: string | null;
  id_type: string | null;
  nationality: string | null;
  designation: string | null;
  secondment: boolean;
  created_on: string | null;
}

/**
 * Fetch the full staff register for the static JSON endpoint.
 *
 * @returns all staff rows ordered by name
 */
export async function getStaff(): Promise<StaffRow[]> {
  return query<StaffRow>(
    `SELECT staff_id, full_name, badge_no, mobile_no, nric_fin, id_type,
            nationality, designation, secondment, created_on::text AS created_on
     FROM staff ORDER BY full_name`,
  );
}

/** One equipment register row (constant status dropped per consolidated model). */
export interface EquipmentRow {
  equipment_id: number;
  equipment_type: string;
  registration_no: string | null;
  equipment_name: string;
  created_on: string | null;
}

/**
 * Fetch the full equipment register for the static JSON endpoint.
 *
 * @returns all equipment rows ordered by type then name
 */
export async function getEquipment(): Promise<EquipmentRow[]> {
  return query<EquipmentRow>(
    `SELECT equipment_id, equipment_type, registration_no, equipment_name,
            created_on::text AS created_on
     FROM equipment ORDER BY equipment_type, equipment_name`,
  );
}
