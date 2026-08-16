import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilterTable, type FilterColumn } from "@/components/filter-table";

const COLUMNS: FilterColumn[] = [
  { key: "equipment_type", label: "Type" },
  { key: "equipment_name", label: "Name" },
  { key: "registration_no", label: "Registration" },
  { key: "created_on", label: "Registered" },
];

/** Equipment register page: filterable table fed by /data/equipment JSON. */
export default function EquipmentPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment register</CardTitle>
          <CardDescription>
            All equipment registered in BES (2,475 records). Type to filter
            across every column.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FilterTable
            url="/data/equipment"
            columns={COLUMNS}
            placeholder="Filter by type, name, registration…"
          />
        </CardContent>
      </Card>
    </main>
  );
}
