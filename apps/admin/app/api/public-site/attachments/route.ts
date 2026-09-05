import { SiteContentVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { fileError, streamManagedFile } from "@/lib/site-admin/managed-files";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postId = params.get("postId");
  const url = params.get("url");
  if (!postId || postId.length > 128 || !url || url.length > 2048) return fileError(400);
  try {
    const post = await db.sitePost.findFirst({
      where: { id: postId, visibility: SiteContentVisibility.PUBLIC, deletedAt: null },
      select: { attachments: true }
    });
    const attachment = Array.isArray(post?.attachments) ? post.attachments.find((item) =>
      item && typeof item === "object" && !Array.isArray(item) && item.url === url
    ) : null;
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) return fileError(404);
    return streamManagedFile(url, "attachment", typeof attachment.title === "string" ? attachment.title : "attachment");
  } catch {
    return fileError(503);
  }
}
