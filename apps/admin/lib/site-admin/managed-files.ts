import { get } from "@vercel/blob";
import { env } from "@/lib/env";

export type ManagedFileKind = "attachment" | "image";
export const fileResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Referrer-Policy": "no-referrer"
};

export function fileError(status: number) {
  return Response.json({ error: "File is not available." }, { status, headers: fileResponseHeaders });
}

export function parseManagedFile(value: string, kind: ManagedFileKind) {
  try {
    const url = new URL(value);
    const prefix = kind === "attachment" ? "/site-attachments/" : "/site-body-images/";
    const path = decodeURIComponent(url.pathname);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
        !path.startsWith(prefix) || path.includes("\\") || path.split("/").includes("..")) return null;
    const isPrivate = url.hostname === env.PRIVATE_BLOB_HOST?.trim().toLowerCase() &&
      url.hostname.endsWith(".private.blob.vercel-storage.com");
    const isLegacy = url.hostname === env.LEGACY_PUBLIC_BLOB_HOST?.trim().toLowerCase() &&
      url.hostname.endsWith(".public.blob.vercel-storage.com");
    if (!isPrivate && !isLegacy) return null;
    const token = isPrivate ? env.PRIVATE_BLOB_READ_WRITE_TOKEN : env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;
    return { pathname: path.slice(1), access: isPrivate ? "private" as const : "public" as const, token };
  } catch {
    return null;
  }
}

export async function streamManagedFile(value: string, kind: ManagedFileKind, filename = "attachment") {
  const file = parseManagedFile(value, kind);
  if (!file) return fileError(404);
  try {
    // Only a pathname reaches the SDK. A request can never choose the credential destination.
    const blob = await get(file.pathname, {
      access: file.access, token: file.token, useCache: false, abortSignal: AbortSignal.timeout(30_000)
    });
    if (!blob || blob.statusCode !== 200) return fileError(404);
    const limit = (kind === "image" ? 10 : 30) * 1024 * 1024;
    const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (blob.blob.size > limit || (kind === "image" && !imageTypes.has(blob.blob.contentType))) {
      await blob.stream.cancel();
      return fileError(413);
    }
    return new Response(blob.stream, {
      headers: {
        ...fileResponseHeaders,
        "Content-Type": kind === "image" ? blob.blob.contentType : "application/octet-stream",
        "Content-Length": String(blob.blob.size),
        "Content-Disposition": kind === "image" ? "inline" : attachmentDisposition(filename)
      }
    });
  } catch {
    return fileError(503);
  }
}

function attachmentDisposition(value: string) {
  const name = value.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, " ").trim().slice(0, 180) || "attachment";
  const fallback = name.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
