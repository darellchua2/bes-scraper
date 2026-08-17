import { NextResponse } from "next/server";
import { getCompanyManpower } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON endpoint: declared manpower per company from PTW PDF member tables. */
export async function GET() {
  return NextResponse.json(await getCompanyManpower());
}
