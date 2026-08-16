import { NextResponse } from "next/server";
import { getEquipment } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON endpoint emitting the equipment register at build time. */
export async function GET() {
  return NextResponse.json(await getEquipment());
}
