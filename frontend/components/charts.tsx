"use client";

import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthCount, NameCount } from "@/lib/queries";

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
