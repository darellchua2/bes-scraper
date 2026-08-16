"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import type { CompanyDailyRow } from "@/lib/queries";

const trendConfig = {
  ptw: { label: "Permits", color: "var(--chart-1)" },
  tbm: { label: "Toolbox meetings", color: "var(--chart-2)" },
  checklist: { label: "Checklists", color: "var(--chart-3)" },
  inspection: { label: "Inspections", color: "var(--chart-4)" },
} satisfies ChartConfig;

/**
 * Interactive daily-activity trend chart for one company at a time.
 * Loads the build-baked static JSON payload once, then filters client-side.
 *
 * @param props.companies - company names available in the daily stats
 */
export function CompanyTrends({ companies }: { companies: string[] }) {
  const [rows, setRows] = useState<CompanyDailyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState(companies[0] ?? "");
  const [range, setRange] = useState<DateRange | null>(null);

  useEffect(() => {
    fetch("/data/company-daily")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CompanyDailyRow[]>;
      })
      .then((loaded) => {
        setRows(loaded);
        setRange({ from: loaded[0]?.date ?? "", to: loaded[loaded.length - 1]?.date ?? "" });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const data = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          r.company === company &&
          (!range || (r.date >= range.from && r.date <= range.to)),
      ),
    [rows, company, range],
  );

  const totals = useMemo(() => {
    const t = { ptw: 0, tbm: 0, checklist: 0, inspection: 0 };
    for (const r of data) {
      t.ptw += r.ptw;
      t.tbm += r.tbm;
      t.checklist += r.checklist;
      t.inspection += r.inspection;
    }
    return t;
  }, [data]);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!rows || !range) return <p className="text-sm text-muted-foreground">Loading daily stats…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <Select value={company} onValueChange={(v) => v !== null && setCompany(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DateRangeFilter
          min={rows[0]?.date ?? ""}
          max={rows[rows.length - 1]?.date ?? ""}
          value={range}
          onChange={setRange}
        />
      </div>
      <ChartContainer config={trendConfig} className="h-[360px] w-full">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" fontSize={11} interval="preserveStartEnd" tickLine={false} />
          <YAxis allowDecimals={false} width={40} fontSize={11} tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="ptw" stroke="var(--color-ptw)" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="tbm" stroke="var(--color-tbm)" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="checklist" stroke="var(--color-checklist)" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="inspection" stroke="var(--color-inspection)" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ChartContainer>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Permits", totals.ptw],
            ["Toolbox meetings", totals.tbm],
            ["Checklists", totals.checklist],
            ["Inspections", totals.inspection],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="text-lg font-semibold">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {data.length.toLocaleString()} days on record for {company} in the
        selected range. Totals are sums over the selection.
      </p>
    </div>
  );
}
