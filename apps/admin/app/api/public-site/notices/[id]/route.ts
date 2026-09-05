import { getPublicSiteNotice } from "@/lib/site-admin/public-content";
import { publicSiteApiCacheHeaders as headers } from "@/lib/site-admin/public-api-cache";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const notice = await getPublicSiteNotice(id);
    return notice ? Response.json(notice, { headers }) :
      Response.json({ error: "Notice not found." }, { status: 404, headers });
  } catch {
    return Response.json({ error: "Content unavailable." }, { status: 503, headers });
  }
}
