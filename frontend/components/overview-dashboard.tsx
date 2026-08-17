"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PermitsByStatusChart,
  PermitsByTypeChart,
} from "@/components/charts";
import { ActivityHistory } from "@/components/activity-history";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import { ExportHtmlButton } from "@/components/export-html-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NameCount, PermitListRow } from "@/lib/queries";

/** Mirror of TERMINAL_STATUSES in lib/queries.ts (client-safe copy). */
const TERMINAL_STATUSES = new Set([
  "Revoked",
  "Closure Accepted(Approver)",
  "Rejected(Assessor)",
  "Rejected(Inspector)",
  "Rejected(In Charge)",
  "Rejected(Approver)",
]);

/** Static register totals that date filtering does not affect. */
export interface RegisterTotals {
  staff: number;
  equipment: number;
  checklists: number;
  attachments: number;
}

/**
 * Client-side overview dashboard: loads the static permits JSON once, then
 * recomputes KPIs and chart aggregations for the selected date range.
 *
 * @param props.totals - build-time register totals (staff/equipment/evidence)
 */
export function OverviewDashboard({ totals }: { totals: RegisterTotals }) {
  const [permits, setPermits] = useState<PermitListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);

  useEffect(() => {
    fetch("/data/permits")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PermitListRow[]>;
      })
      .then((rows) => {
        setPermits(rows);
        setRange({ from: rows[0]?.applied_on ?? "", to: rows[rows.length - 1]?.applied_on ?? "" });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const filtered = useMemo(() => {
    if (!permits || !range) return [];
    return permits.filter((p) => p.applied_on >= range.from && p.applied_on <= range.to);
  }, [permits, range]);

  const agg = useMemo(() => {
    let terminal = 0;
    const companies = new Set<string>();
    const byType = new Map<string, number>();
    const byStatus = new Map<string, number>();
    for (const p of filtered) {
      if (TERMINAL_STATUSES.has(p.status)) terminal++;
      companies.add(p.company);
      byType.set(p.ptw_type, (byType.get(p.ptw_type) ?? 0) + 1);
      byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
    }
    const toNameCount = (m: Map<string, number>): NameCount[] =>
      [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    return { terminal, companies: companies.size, types: toNameCount(byType), statuses: toNameCount(byStatus) };
  }, [filtered]);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!permits || !range) return <p className="text-sm text-muted-foreground">Loading permits…</p>;

  const cards: [string, string][] = [
    ["Permits", filtered.length.toLocaleString()],
    ["Active / Terminal", `${(filtered.length - agg.terminal).toLocaleString()} / ${agg.terminal.toLocaleString()}`],
    ["Companies", agg.companies.toLocaleString()],
    ["Staff", totals.staff.toLocaleString()],
    ["Equipment", totals.equipment.toLocaleString()],
    ["Evidence", `${totals.checklists.toLocaleString()} CHK / ${totals.attachments.toLocaleString()} ATT`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          min={permits[0]?.applied_on ?? ""}
          max={permits[permits.length - 1]?.applied_on ?? ""}
          value={range}
          onChange={setRange}
        />
        <ExportHtmlButton targetId="dashboard-export" />
      </div>

      <div id="dashboard-export" className="flex flex-col gap-6 bg-background p-1">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Activity history</CardTitle>
            <CardDescription>
              Historical permits per month by status (from the monthly PTW
              register exports, keyed by permit start month) plus the
              all-companies daily-report comparison — one shared date range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHistory />
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Permits by type</CardTitle>
              <CardDescription>
                Permits applied {range.from} → {range.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitsByTypeChart data={agg.types} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Permits by status</CardTitle>
              <CardDescription>
                Permits applied {range.from} → {range.to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermitsByStatusChart data={agg.statuses} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
