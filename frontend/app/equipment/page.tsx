import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilterTable, type FilterColumn } from "@/components/filter-table";
import { DataCoverage } from "@/components/data-coverage";
import { getEquipmentCoverage } from "@/lib/queries";

const COLUMNS: FilterColumn[] = [
  { key: "equipment_type", label: "Type" },
  { key: "equipment_name", label: "Name" },
  { key: "registration_no", label: "Registration" },
  { key: "created_on", label: "Registered" },
];

/** Equipment register page: filterable table fed by /data/equipment JSON. */
export default async function EquipmentPage() {
  const coverage = await getEquipmentCoverage();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment register</CardTitle>
          <CardDescription>
            All equipment registered in BES (2,475 records). Type to filter
            across every column.
          </CardDescription>
          <DataCoverage
            from={coverage.from}
            to={coverage.to}
            label="equipment registration dates"
          />
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
