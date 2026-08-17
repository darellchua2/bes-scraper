"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { CompanyManpowerRow } from "@/lib/queries";

/** Metric toggles: raw member rows vs distinct workers (by ID number). */
const METRICS = [
  ["manpower", "Member rows declared"],
  ["unique_workers", "Unique workers"],
] as const;

type MetricKey = (typeof METRICS)[number][0];

/** Deterministic, distinguishable company colours (golden-angle hue steps). */
function companyColor(index: number): string {
  return `hsl(${Math.round(index * 137.508) % 360} 70% 45%)`;
}

/**
 * Stacked bar chart of manpower declared on PTWs: x = application day, stacks
 * = companies. Parsed from the permit PDFs (live window only). Legend entries
 * toggle companies; buttons switch raw member rows / unique workers.
 */
export function ManpowerChart() {
  const [rows, setRows] = useState<CompanyManpowerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("manpower");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    fetch("/data/company-manpower")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CompanyManpowerRow[]>;
      })
      .then(setRows)
      .catch((e) => setError(String(e)));
  }, []);

  const companies = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.company))].sort(),
    [rows],
  );

  /** Pivot to recharts shape: {date, [company]: value}. */
  const data = useMemo(() => {
    const days = new Map<string, Record<string, number | string>>();
    for (const r of rows ?? []) {
      let d = days.get(r.date);
      if (!d) {
        d = { date: r.date };
        days.set(r.date, d);
      }
      d[r.company] = r[metric];
    }
    return [...days.values()];
  }, [rows, metric]);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading manpower…</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {METRICS.map(([key, label]) => (
          <Button
            key={key}
            variant={metric === key ? "default" : "outline"}
            size="sm"
            onClick={() => setMetric(key)}
          >
            {label}
          </Button>
        ))}
        <span className="text-muted-foreground text-xs">
          {companies.length} companies — click legend entries to hide/show
        </span>
      </div>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" fontSize={11} tickLine={false} />
            <YAxis allowDecimals={false} width={44} fontSize={11} tickLine={false} />
            <Tooltip />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              onClick={(e) => {
                const key = String((e as { dataKey?: unknown }).dataKey ?? "");
                if (!key) return;
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                });
              }}
            />
            {companies.map((c, i) => (
              <Bar
                key={c}
                dataKey={c}
                stackId="a"
                fill={companyColor(i)}
                hide={hidden.has(c)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
