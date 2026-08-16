"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CompanyDailyRow } from "@/lib/queries";

/** Selectable daily-report counters (the "types of reports"). */
const METRICS = [
  ["ptw", "Permits"],
  ["tbm", "Toolbox meetings"],
  ["checklist", "Checklists"],
  ["inspection", "Inspections"],
  ["meeting", "Meetings"],
  ["training", "Trainings"],
  ["ra", "Risk assessments"],
  ["incident", "Incidents"],
] as const;

type MetricKey = (typeof METRICS)[number][0];

/** Deterministic, distinguishable company colours (golden-angle hue steps). */
function companyColor(index: number): string {
  return `hsl(${Math.round(index * 137.508) % 360} 70% 45%)`;
}

/**
 * All-companies activity comparison — the inverse of the company page: pick
 * one report type and every company is a line. Legend entries toggle lines;
 * granularity switches between daily points and monthly sums.
 *
 * @param props.rows - daily stats rows, already filtered to the active range
 */
export function CompanyComparison({ rows }: { rows: CompanyDailyRow[] }) {
  const [metric, setMetric] = useState<MetricKey>("ptw");
  const [monthly, setMonthly] = useState(true);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  const companies = useMemo(
    () => [...new Set(rows.map((r) => r.company))].sort(),
    [rows],
  );

  /** Pivot rows to recharts shape: {date, [company]: value}. */
  const data = useMemo(() => {
    const points = new Map<string, Record<string, number | string>>();
    for (const r of rows) {
      const k = monthly ? r.date.slice(0, 7) : r.date;
      let p = points.get(k);
      if (!p) {
        p = { date: k };
        points.set(k, p);
      }
      p[r.company] = ((p[r.company] as number) ?? 0) + r[metric];
    }
    return [...points.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [rows, metric, monthly]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-56">
          <Select value={metric} onValueChange={(v) => v !== null && setMetric(v as MetricKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Report type" />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={monthly ? "default" : "outline"}
          size="sm"
          onClick={() => setMonthly(true)}
        >
          Monthly
        </Button>
        <Button
          variant={monthly ? "outline" : "default"}
          size="sm"
          onClick={() => setMonthly(false)}
        >
          Daily
        </Button>
        <span className="text-muted-foreground text-xs">
          {companies.length} companies — click legend entries to hide/show
        </span>
      </div>

      <div className="h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" fontSize={11} interval="preserveStartEnd" tickLine={false} />
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
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={companyColor(i)}
                dot={false}
                strokeWidth={1.5}
                hide={hidden.has(c)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
