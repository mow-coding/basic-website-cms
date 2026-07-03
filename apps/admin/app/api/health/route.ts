import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "Basic Website CMS Admin",
    timestamp: new Date().toISOString()
  });
}
