import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Line-item list of build-time, data-derived insights at the top of a page. */
export function InsightsCard({ items, note }: { items: string[]; note?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key insights</CardTitle>
        <CardDescription>
          {note ?? "Derived from the database at build time — refresh by rebuilding the export."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
