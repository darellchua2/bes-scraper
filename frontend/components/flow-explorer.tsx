"use client";

import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import { PermitFlow } from "@/components/permit-flow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  computeFlow,
  computeMonthlyFlow,
  type FlowResult,
  type PermitLite,
  type StepLite,
} from "@/lib/flow";
import type { MonthlyTypeStatusCount } from "@/lib/queries";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a 'YYYY-MM' register month as 'Aug 2026'. */
function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

/**
 * Permit lifecycle explorer with two views: the live window (real approval
 * trails, filterable by application date) and any register month since
 * project start (status occupancy only — the register has no trails).
 */
export function FlowExplorer() {
  const [permits, setPermits] = useState<PermitLite[] | null>(null);
  const [steps, setSteps] = useState<StepLite[] | null>(null);
  const [monthly, setMonthly] = useState<MonthlyTypeStatusCount[] | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [month, setMonth] = useState(""); // "" = live trail window
  const [ptype, setPtype] = useState(""); // "" = all permit types
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
      fetch("/data/monthly-type-status").then((r) => {
        if (!r.ok) throw new Error(`monthly-type-status HTTP ${r.status}`);
        return r.json() as Promise<MonthlyTypeStatusCount[]>;
      }),
    ])
      .then(([p, s, m]) => {
        setPermits(p);
        setSteps(s);
        setMonthly(m);
        setRange({ from: p[0]?.applied_on ?? "", to: p[p.length - 1]?.applied_on ?? "" });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const months = useMemo(
    () => [...new Set((monthly ?? []).map((r) => r.month))].sort(),
    [monthly],
  );

  /** Permit types present in the active dataset (register month or live window). */
  const typeOptions = useMemo(() => {
    if (month && monthly) {
      return [...new Set(monthly.filter((r) => r.month === month).map((r) => r.type))].sort();
    }
    return [...new Set((permits ?? []).map((p) => p.ptw_type))].sort();
  }, [month, monthly, permits]);

  // Reset the type filter when it doesn't exist in the newly selected dataset.
  const effType = typeOptions.includes(ptype) ? ptype : "";

  const result: FlowResult | null = useMemo(() => {
    if (!permits || !steps || !range) return null;
    if (month && monthly) return computeMonthlyFlow(monthly, month, effType);
    return computeFlow(permits, steps, range.from, range.to, effType);
  }, [permits, steps, monthly, range, month, effType]);

  if (error) return <pre className="text-sm text-red-600">{error}</pre>;
  if (!result || !range || !permits) {
    return <p className="text-sm text-muted-foreground">Loading approval trails…</p>;
  }

  const { insights } = result;
  const rejectedPct = insights.total
    ? ((insights.rejected / insights.total) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select value={month} onValueChange={(v) => setMonth(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Live window (approval trails)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Live window (approval trails)</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)} (register)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <Select value={effType} onValueChange={(v) => setPtype(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="All permit types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All permit types</SelectItem>
              {typeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!month && (
          <DateRangeFilter
            min={permits[0]?.applied_on ?? ""}
            max={permits[permits.length - 1]?.applied_on ?? ""}
            value={range}
            onChange={setRange}
          />
        )}
        {month && (
          <span className="text-muted-foreground text-xs">
            Register snapshot for {monthLabel(month)} — BES keeps no approval
            trails historically, so nodes show where that month&apos;s permits
            stand and chain edges show structure only.
          </span>
        )}
      </div>

      <PermitFlow definition={result.definition} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Permits</p>
          <p className="text-lg font-semibold">{insights.total.toLocaleString()}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Rejected</p>
          <p className="text-lg font-semibold">
            {insights.rejected.toLocaleString()}
            <span className="text-muted-foreground text-xs"> ({rejectedPct}%)</span>
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Top rejection gate</p>
          <p className="text-sm font-semibold">
            {insights.topReject
              ? `${insights.topReject[0]} (${insights.topReject[1].toLocaleString()})`
              : "—"}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Revoked</p>
          <p className="text-lg font-semibold">{insights.revoked.toLocaleString()}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs">Closed / done</p>
          <p className="text-lg font-semibold">{insights.done.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
