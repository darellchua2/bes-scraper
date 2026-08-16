import { getOverviewKpis } from "@/lib/queries";

export default async function Home() {
  const kpis = await getOverviewKpis();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">BES Dashboard</h1>
      <ul className="mt-4 space-y-1">
        <li>Permits: {kpis.permits} ({kpis.permitsActive} active / {kpis.permitsTerminal} terminal)</li>
        <li>Companies: {kpis.companies}</li>
        <li>Staff: {kpis.staff}</li>
        <li>Equipment: {kpis.equipment}</li>
        <li>Evidence: {kpis.checklists} checklists / {kpis.attachments} attachments</li>
      </ul>
    </main>
  );
}
