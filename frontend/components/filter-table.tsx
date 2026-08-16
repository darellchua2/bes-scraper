"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Column definition for FilterTable: row key + display label. */
export interface FilterColumn {
  key: string;
  label: string;
}

type Row = Record<string, string | number | boolean | null>;

/**
 * Client-side filterable table that fetches a static JSON register once and
 * filters rows across all columns as the user types.
 *
 * @param url - static JSON endpoint path (e.g. /data/staff)
 * @param columns - columns to render, in order
 * @param placeholder - filter input placeholder text
 */
export function FilterTable({
  url,
  columns,
  placeholder,
}: {
  url: string;
  columns: FilterColumn[];
  placeholder: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setRows);
  }, [url]);

  const visible = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) =>
        String(r[c.key] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, filter, columns]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={placeholder}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    {typeof r[c.key] === "boolean"
                      ? r[c.key]
                        ? "Y"
                        : "N"
                      : (r[c.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-xs">
        {visible.length.toLocaleString()} of {rows.length.toLocaleString()} rows
      </p>
    </div>
  );
}
