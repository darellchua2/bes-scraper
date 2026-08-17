import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowExplorer } from "@/components/flow-explorer";
import { HowToReadTip } from "@/components/how-to-read-tip";
import { InsightsCard } from "@/components/insights-card";
import { ManpowerChart } from "@/components/manpower-chart";
import { getFlowInsights } from "@/lib/queries";

/**
 * Permit lifecycle page: node-edge diagram of the approval chain with
 * plain-English explainers per stage (SG PTW role model naming). The diagram
 * recomputes client-side for the selected application-date range.
 */
export default async function FlowPage() {
  const insights = await getFlowInsights();
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Permit lifecycle</h1>
        <p className="text-muted-foreground text-sm">
          How a PTW moves through the approval chain — stages, personas, and
          where permits currently sit. Filter by application date.
        </p>
      </header>

      <InsightsCard items={insights} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Approval chain <HowToReadTip />
          </CardTitle>
          <CardDescription>
            Edge counts = observed step-to-step transitions. Dotted edges lead
            to terminal states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlowExplorer />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Declared manpower by company and day</CardTitle>
          <CardDescription>
            Member(s) declared on each PTW, parsed from the permit PDFs — one
            bar per application day, stacked by company. Live window only —
            historical months have no PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManpowerChart />
        </CardContent>
      </Card>
    </main>
  );
}
