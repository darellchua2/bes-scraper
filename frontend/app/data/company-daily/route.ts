import { getCompanyDailyStats } from "@/lib/queries";

export const dynamic = "force-static";

/**
 * Emit the full company_daily_stats table (~20k rows) as a static JSON
 * file at build time, consumed client-side by the company trends chart.
 *
 * @returns JSON array of CompanyDailyRow
 */
export async function GET() {
  return Response.json(await getCompanyDailyStats());
}
