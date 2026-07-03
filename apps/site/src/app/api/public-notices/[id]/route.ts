import { NextResponse } from "next/server";
import { loadPublicSiteNotice } from "@/lib/public-site-content";

type PublicNoticeRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: PublicNoticeRouteProps) {
  const { id } = await params;
  const notice = await loadPublicSiteNotice(id);

  if (!notice) {
    return NextResponse.json({ error: "Notice not found." }, { status: 404 });
  }

  return NextResponse.json(notice, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
