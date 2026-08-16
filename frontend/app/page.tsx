import {
  getOverviewKpis,
  getPermitsByMonth,
  getPermitsByStatus,
  getPermitsByType,
} from "@/lib/queries";
import {
  PermitsByMonthChart,
  PermitsByStatusChart,
  PermitsByTypeChart,
} from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const [kpis, byMonth, byType, byStatus] = await Promise.all([
    getOverviewKpis(),
    getPermitsByMonth(),
    getPermitsByType(),
    getPermitsByStatus(),
  ]);

  const cards: [string, string][] = [
    ["Permits", kpis.permits.toLocaleString()],
    ["Active / Terminal", `${kpis.permitsActive.toLocaleString()} / ${kpis.permitsTerminal.toLocaleString()}`],
    ["Companies", kpis.companies.toLocaleString()],
    ["Staff", kpis.staff.toLocaleString()],
    ["Equipment", kpis.equipment.toLocaleString()],
    ["Evidence", `${kpis.checklists.toLocaleString()} CHK / ${kpis.attachments.toLocaleString()} ATT`],
  ];

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-2xl font-bold">BES Dashboard</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Permits per month</CardTitle>
        </CardHeader>
        <CardContent>
          <PermitsByMonthChart data={byMonth} />
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permits by type</CardTitle>
          </CardHeader>
          <CardContent>
            <PermitsByTypeChart data={byType} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Permits by status</CardTitle>
          </CardHeader>
          <CardContent>
            <PermitsByStatusChart data={byStatus} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
