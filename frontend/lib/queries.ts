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
