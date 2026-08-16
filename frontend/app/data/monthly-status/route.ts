import { NextResponse } from "next/server";
import { getMonthlyPermitStatus } from "@/lib/queries";

/** Static JSON export of the historical permit register status counts. */
export const dynamic = "force-static";

/** GET handler — emitted as a static file by `output: "export"`. */
export async function GET() {
  return NextResponse.json(await getMonthlyPermitStatus());
}
