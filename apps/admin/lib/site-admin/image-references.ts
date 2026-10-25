import { env } from "@/lib/env";
import { parseManagedFile } from "@/lib/site-admin/managed-files";
import { sanitizePostBody } from "@/lib/site-admin/sanitize";

function legacyOrigins() {
  return (env.LEGACY_ADMIN_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
    const url = new URL(value);
    if (url.origin !== value || url.username || url.password || url.port ||
        (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "localhost"))) {
      throw new Error("LEGACY_ADMIN_ORIGINS must contain exact HTTPS origins.");
    }
    return url.origin;
  });
}

const allowedOrigins = new Set([...(env.NEXTAUTH_URL ? [new URL(env.NEXTAUTH_URL).origin] : []), ...legacyOrigins()]);

export function resolveManagedImageReference(src: string): string | null {
  if (parseManagedFile(src, "image")) return src;
  try {
    const relative = src.startsWith("/") && !src.startsWith("//");
    const url = new URL(src, relative ? "https://relative.invalid" : undefined);
    if ((!relative && !allowedOrigins.has(url.origin)) || url.username || url.password || url.hash ||
        url.pathname !== "/api/site-admin/files" || url.searchParams.size !== 1 || url.searchParams.getAll("url").length !== 1) return null;
    const blob = url.searchParams.get("url");
    return blob && parseManagedFile(blob, "image") ? blob : null;
  } catch {
    return null;
  }
}

export function canonicalImageSource(src: string) {
  return resolveManagedImageReference(src) ?? src;
}

export function canonicalRichText(html: string) {
  return sanitizePostBody(html, canonicalImageSource);
}

export function adminRichText(html: string) {
  return sanitizePostBody(html, (src) => {
    const blob = resolveManagedImageReference(src);
    return blob ? `/api/site-admin/files?${new URLSearchParams({ url: blob })}` : src;
  });
}
