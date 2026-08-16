import { NextResponse } from "next/server";
import { getStaff } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON endpoint emitting the staff register at build time. */
export async function GET() {
  return NextResponse.json(await getStaff());
}
