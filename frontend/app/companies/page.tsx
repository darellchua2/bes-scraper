import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyTrends } from "@/components/company-trends";
import { getDailyStatsCompanies } from "@/lib/queries";

/**
 * Company trends page: per-company daily activity (permits, toolbox meetings,
 * checklists, inspections) from the frozen BES statistics snapshots.
 */
export default async function CompaniesPage() {
  const companies = await getDailyStatsCompanies();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Company trends</h1>
        <p className="text-muted-foreground text-sm">
          Daily activity per company, 2021-08 to today. Counts are BES daily
          snapshots; participants/ratio fields are omitted here.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Daily activity</CardTitle>
          <CardDescription>
            Permits, toolbox meetings, checklists and inspections per day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyTrends companies={companies} />
        </CardContent>
      </Card>
    </main>
  );
}
