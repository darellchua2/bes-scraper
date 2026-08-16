"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthCount, MonthlyStatusCount, NameCount } from "@/lib/queries";

const monthConfig = {
  count: { label: "Permits", color: "var(--chart-1)" },
} satisfies ChartConfig;

const typeConfig = {
  count: { label: "Permits", color: "var(--chart-2)" },
} satisfies ChartConfig;

/**
 * Area chart of permits created per calendar month.
 *
 * @param props.data - monthly permit counts, ascending
 */
export function PermitsByMonthChart({ data }: { data: MonthCount[] }) {
  return (
    <ChartContainer config={monthConfig} className="h-[280px] w-full">
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" fontSize={11} interval="preserveStartEnd" tickLine={false} />
        <YAxis allowDecimals={false} width={40} fontSize={11} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="count" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.25} />
      </AreaChart>
    </ChartContainer>
  );
}

/**
 * Horizontal bar chart of permits per PTW type.
 *
 * @param props.data - type counts, descending
 */
export function PermitsByTypeChart({ data }: { data: NameCount[] }) {
  return (
    <ChartContainer config={typeConfig} className="w-full" style={{ height: Math.max(280, data.length * 26) }}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 24, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
        <YAxis type="category" dataKey="name" width={140} fontSize={11} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}

/**
 * Donut chart of permits per workflow status.
 *
 * @param props.data - status counts, descending
 */
export function PermitsByStatusChart({ data }: { data: NameCount[] }) {
  const config = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: `var(--chart-${(i % 5) + 1})` }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={60} outerRadius={100}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={`var(--chart-${(i % 5) + 1})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}

/** Deterministic, distinguishable series colours (golden-angle hue steps). */
function seriesColor(index: number): string {
  return `hsl(${Math.round(index * 137.508) % 360} 70% 45%)`;
}

/**
 * Stacked bar chart of historical permit counts per month, segmented by
 * status. Plain recharts (no ChartContainer): status names contain
 * parentheses, which break the generated `--color-*` CSS variable keys.
 *
 * @param props.data - (month, status, count) rows from /data/monthly-status
 */
export function PermitsByMonthStatusChart({ data }: { data: MonthlyStatusCount[] }) {
  const { points, statuses } = useMemo(() => {
    const byMonth = new Map<string, Record<string, number | string>>();
    const seen = new Set<string>();
    for (const r of data) {
      seen.add(r.status);
      let p = byMonth.get(r.month);
      if (!p) {
        p = { month: r.month };
        byMonth.set(r.month, p);
      }
      p[r.status] = ((p[r.status] as number) ?? 0) + r.count;
    }
    return {
      points: [...byMonth.values()].sort((a, b) => String(a.month).localeCompare(String(b.month))),
      statuses: [...seen].sort(),
    };
  }, [data]);

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" fontSize={11} interval="preserveStartEnd" tickLine={false} />
          <YAxis allowDecimals={false} width={44} fontSize={11} tickLine={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {statuses.map((s, i) => (
            <Bar key={s} dataKey={s} stackId="a" fill={seriesColor(i)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
