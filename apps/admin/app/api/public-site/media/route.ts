import { SiteContentVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { bodyReferencesImage } from "@/lib/site-admin/public-media";
import { fileError, parseManagedFile, streamManagedFile } from "@/lib/site-admin/managed-files";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const kind = params.get("kind");
  const url = params.get("url");
  if (!id || id.length > 128 || !url || !parseManagedFile(url, "image")) return fileError(400);
  const where = { id, visibility: SiteContentVisibility.PUBLIC, deletedAt: null };
  try {
    let body: string | null = null;
    if (kind === "post") {
      body = (await db.sitePost.findFirst({ where, select: { body: true } }))?.body ?? null;
    } else if (kind === "schedule") {
      body = (await db.generalSchedule.findFirst({ where, select: { description: true } }))?.description ?? null;
    } else if (kind === "workshop") {
      body = (await db.workshopRun.findFirst({ where, select: { description: true } }))?.description ?? null;
    }
    if (!body || !bodyReferencesImage(body, url)) return fileError(404);
    return streamManagedFile(url, "image");
  } catch {
    return fileError(503);
  }
}
