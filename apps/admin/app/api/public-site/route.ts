import { NextResponse } from "next/server";
import { SitePostCategory } from "@prisma/client";
import { getPublicSiteContent } from "@/lib/site-admin/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeNotices = searchParams.get("notices") !== "0";
  const includeNoticeBodies = searchParams.get("body") !== "0";
  const noticeCategories = searchParams.getAll("category").filter(isSitePostCategory);
  const noticeLabels = searchParams.getAll("label").map((label) => label.trim()).filter(Boolean);
  const content = await getPublicSiteContent({
    includeNotices,
    includeNoticeBodies,
    noticeCategories,
    noticeLabels
  });

  return NextResponse.json(content, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function isSitePostCategory(value: string): value is SitePostCategory {
  return Object.values(SitePostCategory).includes(value as SitePostCategory);
}
