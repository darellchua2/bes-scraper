import { NextResponse } from "next/server";
import { getApprovalSteps } from "@/lib/queries";

export const dynamic = "force-static";

/** Static JSON endpoint: every approval trail step (~15254 rows). */
export async function GET() {
  return NextResponse.json(await getApprovalSteps());
}
