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

interface FunnelRow {
  submitted: number;
  approved: number;
  closed: number;
  resubmitted: number;
}

interface ApproverLoadRow {
  actor_name: string;
  steps: number;
  total: number;
}

interface StepsSplitRow {
  rejected_avg: number | null;
  clean_avg: number | null;
}

/**
 * Approval-chain insight lines for the permit lifecycle page, derived from
 * approval_steps + permits at build time.
 */
export async function getFlowInsights(): Promise<Insight[]> {
  const [funnel, approver, split, pace] = await Promise.all([
    query<FunnelRow>(
      `SELECT count(DISTINCT apply_id) FILTER (WHERE stage = 'Applicant')::int AS submitted,
              count(DISTINCT apply_id) FILTER (WHERE stage = 'Approve')::int AS approved,
              count(DISTINCT apply_id) FILTER (WHERE stage = 'Closure Accept')::int AS closed,
              count(DISTINCT apply_id) FILTER (WHERE stage = 'Applicant' AND n > 1)::int AS resubmitted
       FROM (SELECT apply_id, ${CANON_ROLE_SQL} AS stage,
                    count(*) OVER (PARTITION BY apply_id, ${CANON_ROLE_SQL}) AS n
             FROM approval_steps) t`,
    ),
    query<ApproverLoadRow>(
      `SELECT actor_name, steps, total FROM (
         SELECT actor_name, count(*)::int AS steps,
                sum(count(*)) OVER ()::int AS total
         FROM approval_steps
         WHERE ${CANON_ROLE_SQL} = 'Approve' AND actor_name <> ''
         GROUP BY actor_name ORDER BY steps DESC LIMIT 1) t`,
    ),
    query<StepsSplitRow>(
      `SELECT avg(n) FILTER (WHERE rej)::float8 AS rejected_avg,
              avg(n) FILTER (WHERE NOT rej)::float8 AS clean_avg
       FROM (SELECT s.apply_id, count(*) AS n,
                    bool_or(p.status LIKE 'Rejected%') AS rej
             FROM approval_steps s JOIN permits p USING (apply_id)
             GROUP BY s.apply_id, p.status) t`,
    ),
    query<{ per_day: number; days: number }>(
      `SELECT (count(*)::float8 / GREATEST(1, max(applied_on)::date - min(applied_on)::date)) AS per_day,
              (max(applied_on)::date - min(applied_on)::date)::int AS days
       FROM permits`,
    ),
  ]);

  const f = funnel[0];
  const a = approver[0];
  const s = split[0];
  const p = pace[0];
  const lines: Insight[] = [];
  if (f) {
    lines.push(
      `Approval funnel: of ${f.submitted.toLocaleString("en-SG")} permits submitted, ` +
        `${pct(f.approved, f.submitted)} reached approval and ${pct(f.closed, f.submitted)} reached closure acceptance.`,
    );
    if (f.resubmitted > 0) {
      lines.push(`${f.resubmitted.toLocaleString("en-SG")} permits (${pct(f.resubmitted, f.submitted)}) were submitted more than once — resubmission after rejection.`);
    }
  }
  if (a) {
    lines.push(`Approval workload is concentrated: ${a.actor_name} signed off ${a.steps.toLocaleString("en-SG")} of ${a.total.toLocaleString("en-SG")} Approve steps (${pct(a.steps, a.total)}).`);
  }
  if (s && s.rejected_avg !== null && s.clean_avg !== null) {
    lines.push(`Rejected permits accumulate ${s.rejected_avg.toFixed(1)} trail steps on average vs ${s.clean_avg.toFixed(1)} for never-rejected ones — each rejection costs a rework loop.`);
  }
  if (p) {
    lines.push(`Live-window pace: ${p.per_day.toFixed(0)} applications/day on average over ${p.days} days.`);
  }
  return lines;
}

/**
 * Company-trends insight lines, derived from company_daily_stats at build time.
 */
export async function getCompanyInsights(): Promise<Insight[]> {
  const [coverage, topCompany, busiestDay, incidents, ratio] = await Promise.all([
    query<{ from: string; to: string; companies: number; days: number }>(
      `SELECT min(stat_date)::text AS "from", max(stat_date)::text AS "to",
              count(DISTINCT company)::int AS companies, count(DISTINCT stat_date)::int AS days
       FROM company_daily_stats`,
    ),
    query<{ company: string; ptw: number; total: number }>(
      `SELECT company, ptw, total FROM (
         SELECT company, sum(ptw_cnt)::int AS ptw, sum(sum(ptw_cnt)) OVER ()::int AS total
         FROM company_daily_stats GROUP BY company ORDER BY ptw DESC LIMIT 1) t`,
    ),
    query<{ stat_date: string; ptw: number }>(
      `SELECT stat_date::text, sum(ptw_cnt)::int AS ptw
       FROM company_daily_stats GROUP BY stat_date ORDER BY ptw DESC LIMIT 1`,
    ),
    query<{ total: number; company: string; company_total: number }>(
      `SELECT sum(incident_cnt)::int AS total,
              (SELECT company FROM company_daily_stats GROUP BY company
               ORDER BY sum(incident_cnt) DESC LIMIT 1) AS company,
              (SELECT sum(incident_cnt)::int FROM company_daily_stats GROUP BY company
               ORDER BY sum(incident_cnt) DESC LIMIT 1) AS company_total
       FROM company_daily_stats`,
    ),
    query<{ ratio: number }>(
      `SELECT (sum(tbm_cnt)::float8 / NULLIF(sum(ptw_cnt), 0)) AS ratio FROM company_daily_stats`,
    ),
  ]);

  const c = coverage[0];
  const lines: Insight[] = [];
  if (c) {
    lines.push(`Daily-report coverage: ${c.companies} companies over ${c.days.toLocaleString("en-SG")} tracked days (${c.from} → ${c.to}).`);
  }
  if (topCompany[0]) {
    const t = topCompany[0];
    lines.push(`${t.company} accounts for ${t.ptw.toLocaleString("en-SG")} permits (${pct(t.ptw, t.total)} of all tracked) — the largest contractor on record.`);
  }
  if (busiestDay[0]) {
    lines.push(`Busiest single day: ${busiestDay[0].stat_date} with ${busiestDay[0].ptw.toLocaleString("en-SG")} permits across all companies.`);
  }
  if (incidents[0] && incidents[0].total > 0) {
    lines.push(`${incidents[0].total.toLocaleString("en-SG")} incidents recorded in total; ${incidents[0].company} reports the most (${incidents[0].company_total.toLocaleString("en-SG")}).`);
  }
  if (ratio[0]) {
    lines.push(`Toolbox meetings outnumber permits ${ratio[0].ratio.toFixed(1)}:1 — briefing cadence is well above one per permit.`);
  }
  return lines;
}

/**
 * Staff-register insight lines, derived from the staff table at build time.
 */
export async function getStaffInsights(): Promise<Insight[]> {
  const [span, secondment, nationality, designation, recent, expiry] = await Promise.all([
    query<{ from: string; to: string }>(
      `SELECT min(created_on)::text AS "from", max(created_on)::text AS "to" FROM staff`,
    ),
    query<{ seconded: number; total: number }>(
      `SELECT count(*) FILTER (WHERE secondment)::int AS seconded, count(*)::int AS total FROM staff`,
    ),
    query<{ total: number; nationality: string; n: number }>(
      `SELECT (SELECT count(DISTINCT nationality) FROM staff)::int AS total,
              (SELECT nationality FROM staff WHERE nationality <> '' GROUP BY nationality
               ORDER BY count(*) DESC LIMIT 1) AS nationality,
              (SELECT count(*)::int FROM staff WHERE nationality <> '' GROUP BY nationality
               ORDER BY count(*) DESC LIMIT 1) AS n`,
    ),
    query<{ designation: string; n: number }>(
      `SELECT designation, count(*)::int AS n FROM staff
       WHERE designation <> '' GROUP BY designation ORDER BY n DESC LIMIT 1`,
    ),
    query<{ n: number }>(
      `SELECT count(*)::int AS n FROM staff
       WHERE created_on > (SELECT max(created_on) FROM staff) - interval '1 year'`,
    ),
    query<{ expired: number; expiring: number }>(
      `SELECT count(*) FILTER (WHERE expiry_date < CURRENT_DATE)::int AS expired,
              count(*) FILTER (WHERE expiry_date >= CURRENT_DATE
                 AND expiry_date <= CURRENT_DATE + interval '90 days')::int AS expiring
       FROM staff_documents WHERE expiry_date IS NOT NULL`,
    ),
  ]);

  const total = secondment[0]?.total ?? 0;
  const lines: Insight[] = [];
  if (span[0]) lines.push(`${total.toLocaleString("en-SG")} workers on the register, accumulated ${span[0].from} → ${span[0].to}.`);
  if (secondment[0]) lines.push(`${secondment[0].seconded.toLocaleString("en-SG")} workers (${pct(secondment[0].seconded, total)}) are seconded from other companies.`);
  if (nationality[0]) lines.push(`Workforce spans ${nationality[0].total} nationalities; the largest group is ${nationality[0].nationality} (${nationality[0].n.toLocaleString("en-SG")} workers).`);
  if (designation[0]) lines.push(`Most common designation: ${designation[0].designation} (${designation[0].n.toLocaleString("en-SG")} workers).`);
  if (recent[0]) lines.push(`${recent[0].n.toLocaleString("en-SG")} workers were registered in the last 12 months.`);
  if (expiry[0]) lines.push(`${expiry[0].expired.toLocaleString("en-SG")} tracked documents have expired and ${expiry[0].expiring.toLocaleString("en-SG")} expire within 90 days (listed below).`);
  return lines;
}

/**
 * Equipment-register insight lines, derived from the equipment table at build time.
 */
export async function getEquipmentInsights(): Promise<Insight[]> {
  const [totals, topType, busiestMonth, registered] = await Promise.all([
    query<{ total: number; types: number }>(
      `SELECT count(*)::int AS total, count(DISTINCT equipment_type)::int AS types FROM equipment`,
    ),
    query<{ equipment_type: string; n: number }>(
      `SELECT equipment_type, count(*)::int AS n FROM equipment
       GROUP BY equipment_type ORDER BY n DESC LIMIT 1`,
    ),
    query<{ month: string; n: number }>(
      `SELECT to_char(created_on, 'YYYY-MM') AS month, count(*)::int AS n
       FROM equipment WHERE created_on IS NOT NULL
       GROUP BY month ORDER BY n DESC LIMIT 1`,
    ),
    query<{ with_reg: number; total: number }>(
      `SELECT count(*) FILTER (WHERE registration_no <> '')::int AS with_reg, count(*)::int AS total
       FROM equipment`,
    ),
  ]);

  const t = totals[0];
  const lines: Insight[] = [];
  if (t) lines.push(`${t.total.toLocaleString("en-SG")} equipment items across ${t.types} types on the register.`);
  if (topType[0] && t) lines.push(`Most common type: ${topType[0].equipment_type} (${topType[0].n.toLocaleString("en-SG")} items, ${pct(topType[0].n, t.total)}).`);
  if (busiestMonth[0]) lines.push(`Busiest registration month: ${busiestMonth[0].month} (${busiestMonth[0].n.toLocaleString("en-SG")} items added).`);
  if (registered[0] && t) lines.push(`${pct(registered[0].with_reg, t.total)} of items have a registration number on file.`);
  lines.push("BES tracks no expiry dates for equipment — certificate/passport expiry lives on the staff document attachments instead.");
  return lines;
}

/** One staff document that is expired or expires within 90 days. */
export interface ExpiringDocRow {
  worker: string;
  doc_type: string | null;
  document_no: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  expired: boolean;
}

/**
 * Staff documents expired or expiring within 90 days of the build date,
 * joined to worker names for the register view.
 */
export async function getExpiringStaffDocuments(): Promise<ExpiringDocRow[]> {
  return query<ExpiringDocRow>(
    `SELECT s.full_name AS worker, d.doc_type, d.document_no,
            d.issue_date::text AS issue_date, d.expiry_date::text AS expiry_date,
            (d.expiry_date < CURRENT_DATE) AS expired
     FROM staff_documents d JOIN staff s ON s.staff_id = d.staff_id
     WHERE d.expiry_date IS NOT NULL
       AND d.expiry_date >= DATE '1990-01-01'  -- ponytail: pre-1990 dates are BES "unknown" sentinels (1900, 1950)
       AND d.expiry_date <= CURRENT_DATE + interval '90 days'
     ORDER BY d.expiry_date`,
  );
}
