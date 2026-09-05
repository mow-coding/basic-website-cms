import { SitePostCategory } from "@prisma/client";
import { getPublicSiteContent } from "@/lib/site-admin/public-content";
import { publicSiteApiCacheHeaders as headers } from "@/lib/site-admin/public-api-cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const content = await getPublicSiteContent({
      includeNotices: params.get("notices") !== "0",
      includeNoticeBodies: false,
      noticeCategories: params.getAll("category").filter((value): value is SitePostCategory =>
        Object.values(SitePostCategory).includes(value as SitePostCategory)),
      noticeLabels: params.getAll("label").map((label) => label.trim()).filter(Boolean)
    });
    return Response.json(content, { headers });
  } catch {
    return Response.json({ error: "Content unavailable." }, { status: 503, headers });
  }
}
