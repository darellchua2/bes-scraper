import { InsightsCard } from "@/components/insights-card";
import { OverviewDashboard } from "@/components/overview-dashboard";
import { getInsights, getOverviewKpis } from "@/lib/queries";

/**
 * Overview page: data-derived key insights, date-filterable permit KPIs +
 * charts, all-company activity comparison, and export-to-HTML. Permit figures
 * compute client-side from the static /data/permits payload; register totals
 * and insights render at build time.
 */
export default async function Home() {
  const [kpis, insights] = await Promise.all([getOverviewKpis(), getInsights()]);
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold">BES Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Permits by application date — use the range filter to zoom into a
        period.
      </p>

      <div className="mt-6">
        <InsightsCard items={insights} />
      </div>

      <div className="mt-6">
        <OverviewDashboard
          totals={{
            staff: kpis.staff,
            equipment: kpis.equipment,
            checklists: kpis.checklists,
            attachments: kpis.attachments,
          }}
        />
      </div>
    </main>
  );
}
