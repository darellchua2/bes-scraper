import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowExplorer } from "@/components/flow-explorer";
import { STAGE_EXPLANATIONS } from "@/lib/flow";

/**
 * Permit lifecycle page: node-edge diagram of the approval chain with
 * plain-English explainers per stage (SG PTW role model naming). The diagram
 * recomputes client-side for the selected application-date range.
 */
export default function FlowPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Permit lifecycle</h1>
        <p className="text-muted-foreground text-sm">
          How a PTW moves through the approval chain — stages, personas, and
          where permits currently sit. Filter by application date.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Approval chain</CardTitle>
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
          <CardTitle>How to read this diagram</CardTitle>
          <CardDescription>
            Each stage maps to the SG PTW role model; every approval gate can
            reject into its own terminal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {STAGE_EXPLANATIONS.map((s) => (
              <li key={s.stage}>
                <span className="font-medium">{s.stage}</span>
                {s.persona !== "—" && (
                  <span className="text-muted-foreground"> ({s.persona})</span>
                )}
                {" — "}
                <span className="text-muted-foreground">{s.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
