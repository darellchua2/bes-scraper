import { NextResponse } from "next/server";
import { getPermitList } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON endpoint: every permit's filterable fields (~2964 rows). */
export async function GET() {
  return NextResponse.json(await getPermitList());
}
