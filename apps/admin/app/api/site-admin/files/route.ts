import { resolveSiteAdminAccess } from "@/lib/site-admin/access";
import { fileError, parseManagedFile, streamManagedFile } from "@/lib/site-admin/managed-files";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await resolveSiteAdminAccess())) return fileError(403);
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return fileError(400);
  const kind = parseManagedFile(url, "image") ? "image" : "attachment";
  if (!parseManagedFile(url, kind)) return fileError(404);
  return streamManagedFile(url, kind, new URL(url).pathname.split("/").pop());
}
