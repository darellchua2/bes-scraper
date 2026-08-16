"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Inclusive date range as YYYY-MM-DD strings. */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Controlled from/to date filter with an "All dates" reset.
 * Native date inputs, bounded by the dataset's [min, max] extent.
 */
export function DateRangeFilter({
  min,
  max,
  value,
  onChange,
}: {
  min: string;
  max: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        aria-label="From date"
        className="w-auto"
        min={min}
        max={max}
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value || min })}
      />
      <span className="text-muted-foreground text-sm">to</span>
      <Input
        type="date"
        aria-label="To date"
        className="w-auto"
        min={min}
        max={max}
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value || max })}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ from: min, to: max })}
      >
        All dates
      </Button>
      <span className="text-muted-foreground text-xs">
        Data spans {min} → {max}
      </span>
    </div>
  );
}
