/**
 * Muted caption stating which date window a page's data covers.
 *
 * @param props.from - earliest date in the dataset (ISO)
 * @param props.to - latest date in the dataset (ISO)
 * @param props.label - optional qualifier (e.g. "staff registration dates")
 */
export function DataCoverage({
  from,
  to,
  label,
}: {
  from: string | null;
  to: string | null;
  label?: string;
}) {
  if (!from || !to) return null;
  return (
    <p className="text-muted-foreground text-xs">
      Data coverage: {from} → {to}
      {label ? ` · ${label}` : ""}
    </p>
  );
}
