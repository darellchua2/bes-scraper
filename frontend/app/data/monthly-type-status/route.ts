import { NextResponse } from "next/server";
import { getMonthlyTypeStatus } from "@/lib/queries";

/** Static JSON export of register status counts broken down by work type. */
export const dynamic = "force-static";

/** GET handler — emitted as a static file by `output: "export"`. */
export async function GET() {
  return NextResponse.json(await getMonthlyTypeStatus());
}
