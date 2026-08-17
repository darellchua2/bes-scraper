"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CompanyManpowerRow } from "@/lib/queries";

const manpowerConfig = {
  manpower: { label: "Member rows declared", color: "var(--chart-1)" },
  unique_workers: { label: "Unique workers", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Metric = keyof typeof manpowerConfig;

/**
 * Horizontal bar chart of manpower declared on PTWs per company, parsed from
 * the permit PDFs (live window only). Toggle between raw member rows and
 * distinct workers (by ID number).
 */
export function ManpowerChart() {
  const [rows, setRows] = useState<CompanyManpowerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("manpower");

  useEffect(() => {
    fetch("/data/company-manpower")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CompanyManpowerRow[]>;
      })
      .then(setRows)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading manpower…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {(Object.keys(manpowerConfig) as Metric[]).map((m) => (
          <Button
            key={m}
            variant={metric === m ? "default" : "outline"}
            size="sm"
            onClick={() => setMetric(m)}
          >
            {manpowerConfig[m].label}
          </Button>
        ))}
      </div>
      <ChartContainer
        config={manpowerConfig}
        className="w-full"
        style={{ height: Math.max(320, rows.length * 26) }}
      >
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
          <YAxis
            type="category"
            dataKey="company"
            width={200}
            fontSize={10}
            tickLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
