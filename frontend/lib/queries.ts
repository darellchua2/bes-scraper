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

/** Minimal permit row for client-side date filtering (static JSON). */
export interface PermitListRow {
  apply_id: number;
  applied_on: string;
  status: string;
  ptw_type: string;
  company: string;
}

/**
 * Fetch every permit's filterable fields for the static JSON endpoint.
 *
 * @returns all permits ordered by application date
 */
export async function getPermitList(): Promise<PermitListRow[]> {
  return query<PermitListRow>(
    `SELECT apply_id, applied_on::date::text AS applied_on, status, ptw_type, company
     FROM permits ORDER BY applied_on`,
  );
}

/** Minimal approval-step row for client-side flow recomputation. */
export interface StepRow {
  apply_id: number;
  seq: number;
  role: string;
}

/**
 * Fetch every approval trail step for the static JSON endpoint.
 *
 * @returns all steps ordered by permit then sequence
 */
export async function getApprovalSteps(): Promise<StepRow[]> {
  return query<StepRow>(
    `SELECT apply_id, seq, role FROM approval_steps ORDER BY apply_id, seq`,
  );
}

/** Inclusive [from, to] date extent of a register table. */
export interface CoverageRange {
  from: string | null;
  to: string | null;
}

/** Registration-date extent of the staff register. */
export async function getStaffCoverage(): Promise<CoverageRange> {
  const rows = await query<CoverageRange>(
    `SELECT min(created_on)::text AS "from", max(created_on)::text AS "to" FROM staff`,
  );
  return rows[0];
}

/** Registration-date extent of the equipment register. */
export async function getEquipmentCoverage(): Promise<CoverageRange> {
  const rows = await query<CoverageRange>(
    `SELECT min(created_on)::text AS "from", max(created_on)::text AS "to" FROM equipment`,
  );
  return rows[0];
}

/** One (month, status) row from the historical permit register aggregate. */
export interface MonthlyStatusCount {
  month: string;
  status: string;
  count: number;
}

/**
 * Historical permit counts per month and status, aggregated from the BES
 * monthly PTW register exports (keyed by permit start month).
 *
 * @returns rows ordered by month then status
 */
export async function getMonthlyPermitStatus(): Promise<MonthlyStatusCount[]> {
  return query<MonthlyStatusCount>(
    `SELECT stat_month AS month, status, count FROM monthly_permit_status
     ORDER BY stat_month, status`,
  );
}

/** One (month, work type, status) row from the historical permit register. */
export interface MonthlyTypeStatusCount {
  month: string;
  type: string;
  status: string;
  count: number;
}

/**
 * Historical permit counts per month, work type, and status, aggregated
 * straight from permit_register (keyed by permit start month).
 *
 * @returns rows ordered by month, type, then status
 */
export async function getMonthlyTypeStatus(): Promise<MonthlyTypeStatusCount[]> {
  return query<MonthlyTypeStatusCount>(
    `SELECT stat_month AS month, work_type AS type, status, count(*)::int AS count
     FROM permit_register
     GROUP BY stat_month, work_type, status
     ORDER BY stat_month, work_type, status`,
  );
}

/** One bullet of the home-page insights list (text fully derived from data). */
export type Insight = string;

const CLOSED_STATUSES = ["Closed", "Closure Accepted(Approver)", "Closure Assessed"];

/** Format part/whole as a one-decimal percentage string. */
function pct(part: number, whole: number): string {
  return whole ? ((part / whole) * 100).toFixed(1) : "0.0";
}

/**
 * Derive the home-page "Key insights" lines from the database at build time.
 * Every number comes from SQL — nothing is hardcoded.
 *
 * @returns insight lines ready to render as list items
 */
export async function getInsights(): Promise<Insight[]> {
  const [live, register, span, peak, topCompany, churn] = await Promise.all([
    query<{ status: string; count: number }>(
      `SELECT status, count(*)::int AS count FROM permits GROUP BY status`,
    ),
    query<{ total: number; done: number; no_approver: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status = ANY($1))::int AS done,
              count(*) FILTER (WHERE approved_person IS NULL)::int AS no_approver
       FROM permit_register`,
      [CLOSED_STATUSES],
    ),
    query<{ from_m: string; to_m: string; months: number }>(
      `SELECT min(stat_month) AS from_m, max(stat_month) AS to_m,
              count(DISTINCT stat_month)::int AS months
       FROM monthly_permit_status`,
    ),
    query<{ stat_month: string; n: number }>(
      `SELECT stat_month, sum(count)::int AS n FROM monthly_permit_status
       GROUP BY stat_month ORDER BY n DESC LIMIT 1`,
    ),
    query<{ company: string; n: number }>(
      `SELECT company, count(*)::int AS n FROM permit_register
       GROUP BY company ORDER BY n DESC LIMIT 1`,
    ),
    query<{ permits: number; avg_steps: number; resubmitted: number }>(
      `WITH s AS (SELECT apply_id, count(*) AS n FROM approval_steps GROUP BY apply_id)
       SELECT count(*)::int AS permits, avg(n)::float8 AS avg_steps,
              count(*) FILTER (WHERE n > 5)::int AS resubmitted FROM s`,
    ),
  ]);

  const liveTotal = live.reduce((a, r) => a + r.count, 0);
  const liveOf = (name: string) => live.find((r) => r.status === name)?.count ?? 0;
  const liveRejected = live
    .filter((r) => r.status.startsWith("Rejected"))
    .reduce((a, r) => a + r.count, 0);
  const topReject = live
    .filter((r) => r.status.startsWith("Rejected"))
    .sort((a, b) => b.count - a.count)[0];
  const backlog = liveOf("Applicant - Works completion");
  const liveClosed = liveOf("Closure Accepted(Approver)");
  const inspector = liveOf("Inspector");
  const reg = register[0];
  const trail = churn[0];

  const n = (x: number) => x.toLocaleString("en-SG");
  const insights: Insight[] = [];

  if (topReject) {
    insights.push(
      `Top rejection gate is ${topReject.status.replace("Rejected(", "").replace(")", "")} ` +
        `(${n(topReject.count)} permits, ${pct(topReject.count, liveRejected)}% of all rejections in the live window).`,
    );
  }
  insights.push(
    `Closure is the bottleneck: ${pct(backlog, liveTotal)}% of live permits (${n(backlog)} of ${n(liveTotal)}) ` +
      `sit at "Applicant - Works completion", while only ${n(liveClosed)} have been closure-accepted. ` +
      `Historically ${pct(reg.done, reg.total)}% of permits (${n(reg.done)} of ${n(reg.total)}) reach a closed state.`,
  );
  insights.push(
    `${n(inspector)} permits carry status "Inspector" — a gate BES never records in approval trails ` +
      `(the monthly reports' "Assessed 2" row).`,
  );
  insights.push(
    `Average approval trail is ${trail.avg_steps.toFixed(1)} steps vs the 5-step happy path; ` +
      `${n(trail.resubmitted)} permits (${pct(trail.resubmitted, trail.permits)}%) needed more than 5 steps (rejection + resubmission).`,
  );
  insights.push(
    `The register spans ${span[0].months} months (${span[0].from_m} → ${span[0].to_m}); ` +
      `peak month is ${peak[0].stat_month} with ${n(peak[0].n)} permits.`,
  );
  insights.push(
    `Most active company: ${topCompany[0].company} with ${n(topCompany[0].n)} permits ` +
      `(${pct(topCompany[0].n, reg.total)}% of all-time).`,
  );
  insights.push(
    `Data hygiene: ${pct(reg.no_approver, reg.total)}% of register rows (${n(reg.no_approver)}) have no Approved Person recorded.`,
  );
  return insights;
}

export interface CompanyManpowerRow {
  date: string;
  company: string;
  manpower: number;
  unique_workers: number;
}

/**
 * Declared manpower per company per application day: Member(s) rows parsed
 * from the PTW PDFs. PDFs exist only for the live permits window (no history).
 */
export async function getCompanyManpower(): Promise<CompanyManpowerRow[]> {
  return query<CompanyManpowerRow>(`
    SELECT p.applied_on::date::text          AS date,
           p.company,
           count(*)::int                     AS manpower,
           count(DISTINCT pm.id_number)::int AS unique_workers
    FROM permit_members pm
    JOIN permits p ON p.apply_id = pm.apply_id
    GROUP BY 1, 2
    ORDER BY 1, 2
  `);
}
