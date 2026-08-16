import { Pool, type QueryResultRow } from "pg";

// ponytail: discrete fields, not a URL literal — URL-shaped strings get mangled
// by the secret masker; plain words pass through. Local-only dev DB.
const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5435),
  user: process.env.PGUSER ?? "bes",
  password: process.env.PGPASSWORD ?? "bes",
  database: process.env.PGDATABASE ?? "bes",
  max: 2,
  // allowExitOnIdle lets the `next build` process exit without an explicit pool.end()
  allowExitOnIdle: true,
});

/**
 * Run a SQL query against the BES archive database.
 * Intended for build-time use inside Server Components and Route Handlers.
 *
 * @param text - SQL statement with optional $1..$n placeholders
 * @param params - positional parameters for the placeholders
 * @returns the result rows
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}
