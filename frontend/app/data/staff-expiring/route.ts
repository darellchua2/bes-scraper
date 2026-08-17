import { NextResponse } from "next/server";
import { getExpiringStaffDocuments } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON export of expired / soon-expiring staff documents. */
export async function GET() {
  return NextResponse.json(await getExpiringStaffDocuments());
}
