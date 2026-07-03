import { NextResponse } from "next/server";
import { getPublicSiteNotice } from "@/lib/site-admin/public-content";

export const dynamic = "force-dynamic";

type PublicSiteNoticeRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: PublicSiteNoticeRouteProps) {
  const { id } = await params;
  const notice = await getPublicSiteNotice(id);

  if (!notice) {
    return NextResponse.json({ error: "Notice not found." }, { status: 404 });
  }

  return NextResponse.json(notice, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
