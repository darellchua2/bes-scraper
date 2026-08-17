import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilterTable, type FilterColumn } from "@/components/filter-table";
import { DataCoverage } from "@/components/data-coverage";
import { InsightsCard } from "@/components/insights-card";
import { getStaffCoverage, getStaffInsights } from "@/lib/queries";

const COLUMNS: FilterColumn[] = [
  { key: "full_name", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "badge_no", label: "Badge" },
  { key: "nationality", label: "Nationality" },
  { key: "id_type", label: "ID type" },
  { key: "nric_fin", label: "NRIC/FIN" },
  { key: "mobile_no", label: "Mobile" },
  { key: "secondment", label: "2nd" },
  { key: "created_on", label: "Registered" },
];

/** Staff register page: filterable table fed by the static /data/staff JSON. */
export default async function StaffPage() {
  const [coverage, insights] = await Promise.all([getStaffCoverage(), getStaffInsights()]);
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <InsightsCard items={insights} />
      <Card>
        <CardHeader>
          <CardTitle>Staff register</CardTitle>
          <CardDescription>
            All staff registered in BES (4,207 records). Type to filter across
            every column.
          </CardDescription>
          <DataCoverage
            from={coverage.from}
            to={coverage.to}
            label="staff registration dates"
          />
        </CardHeader>
        <CardContent>
          <FilterTable
            url="/data/staff"
            columns={COLUMNS}
            placeholder="Filter by name, designation, badge…"
          />
        </CardContent>
      </Card>
    </main>
  );
}
