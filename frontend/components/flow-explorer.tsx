"use client";

import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import { PermitFlow } from "@/components/permit-flow";
import { computeFlow, type PermitLite, type StepLite } from "@/lib/flow";

/**
 * Date-filterable permit lifecycle diagram: loads the static permits + steps
 * JSON once and recomputes the mermaid definition for the selected range
 * (permits are bucketed by application date).
 */
export function FlowExplorer() {
  const [permits, setPermits] = useState<PermitLite[] | null>(null);
  const [steps, setSteps] = useState<StepLite[] | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/permits").then((r) => {
        if (!r.ok) throw new Error(`permits HTTP ${r.status}`);
        return r.json() as Promise<PermitLite[]>;
      }),
      fetch("/data/steps").then((r) => {
        if (!r.ok) throw new Error(`steps HTTP ${r.status}`);
        return r.json() as Promise<StepLite[]>;
      }),
    ])
      .then(([p, s]) => {
        setPermits(p);
        setSteps(s);
        setRange({ from: p[0]?.applied_on ?? "", to: p[p.length - 1]?.applied_on ?? "" });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const definition = useMemo(
    () => (permits && steps && range ? computeFlow(permits, steps, range.from, range.to) : null),
    [permits, steps, range],
  );

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!definition || !range || !permits) {
    return <p className="text-sm text-muted-foreground">Loading approval trails…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter
        min={permits[0]?.applied_on ?? ""}
        max={permits[permits.length - 1]?.applied_on ?? ""}
        value={range}
        onChange={setRange}
      />
      <PermitFlow definition={definition} />
    </div>
  );
}
