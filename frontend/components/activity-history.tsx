"use client";

import { useEffect, useMemo, useState } from "react";
import { CompanyComparison } from "@/components/company-comparison";
import { PermitsByMonthStatusChart } from "@/components/charts";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import type { CompanyDailyRow, MonthlyStatusCount } from "@/lib/queries";

/**
 * Historical activity view with one shared date filter: monthly permit
 * counts stacked by status (from the monthly PTW register exports) plus the
 * all-companies daily-activity comparison chart. The two datasets have
 * different extents; the filter bounds cover both.
 */
export function ActivityHistory() {
  const [daily, setDaily] = useState<CompanyDailyRow[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStatusCount[] | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/company-daily").then((r) => {
        if (!r.ok) throw new Error(`company-daily HTTP ${r.status}`);
        return r.json() as Promise<CompanyDailyRow[]>;
      }),
      fetch("/data/monthly-status").then((r) => {
        if (!r.ok) throw new Error(`monthly-status HTTP ${r.status}`);
        return r.json() as Promise<MonthlyStatusCount[]>;
      }),
    ])
      .then(([d, m]) => {
        setDaily(d);
        setMonthly(m);
        const min = [
          d[0]?.date ?? "9999",
          m[0] ? `${m[0].month}-01` : "9999",
        ].sort()[0];
        const max = [
          d[d.length - 1]?.date ?? "",
          m[m.length - 1] ? `${m[m.length - 1].month}-31` : "",
        ].sort()[1];
        setRange({ from: min, to: max });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const filteredMonthly = useMemo(() => {
    if (!monthly || !range) return [];
    const fromM = range.from.slice(0, 7);
    const toM = range.to.slice(0, 7);
    return monthly.filter((r) => r.month >= fromM && r.month <= toM);
  }, [monthly, range]);

  const filteredDaily = useMemo(() => {
    if (!daily || !range) return [];
    return daily.filter((r) => r.date >= range.from && r.date <= range.to);
  }, [daily, range]);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!range || !daily || !monthly) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  const min = [daily[0]?.date ?? "9999", monthly[0] ? `${monthly[0].month}-01` : "9999"].sort()[0];
  const max = [
    daily[daily.length - 1]?.date ?? "",
    monthly[monthly.length - 1] ? `${monthly[monthly.length - 1].month}-31` : "",
  ].sort()[1];

  return (
    <div className="flex flex-col gap-6">
      <DateRangeFilter min={min} max={max} value={range} onChange={setRange} />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Permits per month by status</h3>
        <p className="text-muted-foreground text-xs">
          Register months {range.from.slice(0, 7)} → {range.to.slice(0, 7)} (keyed by
          permit start month)
        </p>
        <PermitsByMonthStatusChart data={filteredMonthly} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Company activity comparison</h3>
        <p className="text-muted-foreground text-xs">
          Daily-report counts {range.from} → {range.to}
        </p>
        <CompanyComparison rows={filteredDaily} />
      </div>
    </div>
  );
}
