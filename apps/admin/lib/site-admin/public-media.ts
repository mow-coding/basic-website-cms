import { env } from "@/lib/env";
import { sanitizePostBody } from "@/lib/site-admin/sanitize";
import { parseManagedFile } from "@/lib/site-admin/managed-files";

export type PublicMediaOwner = { kind: "post" | "schedule" | "workshop"; id: string };

function imageBlobSource(src: string) {
  try {
    const url = new URL(src);
    if (url.origin === new URL(env.NEXTAUTH_URL || "").origin && url.pathname === "/api/site-admin/files") {
      const value = url.searchParams.get("url");
      return value && parseManagedFile(value, "image") ? value : null;
    }
    return parseManagedFile(src, "image") ? src : null;
  } catch {
    return null;
  }
}

export function publicImageSource(owner: PublicMediaOwner) {
  return (src: string) => {
    const blobUrl = imageBlobSource(src);
    if (!blobUrl || !env.NEXTAUTH_URL) return src;
    const url = new URL("/api/public-site/media", env.NEXTAUTH_URL);
    url.search = new URLSearchParams({ kind: owner.kind, id: owner.id, url: blobUrl }).toString();
    return url.toString();
  };
}

export function bodyReferencesImage(body: string, blobUrl: string) {
  let found = false;
  sanitizePostBody(body, (src) => {
    if (imageBlobSource(src) === blobUrl) found = true;
    return src;
  });
  return found;
}
