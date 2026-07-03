const blobHostSuffix = ".public.blob.vercel-storage.com";
const attachmentPathPrefix = "/site-attachments/";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get("url");
  const filename = sanitizeFilename(searchParams.get("filename"));

  if (!sourceUrl || !filename) {
    return Response.json({ error: "Missing attachment download parameters." }, { status: 400 });
  }

  const parsedSourceUrl = parseAttachmentUrl(sourceUrl);
  if (!parsedSourceUrl) {
    return Response.json({ error: "Invalid attachment download URL." }, { status: 400 });
  }

  const upstream = await fetch(parsedSourceUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "Attachment file was not found." }, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "application/octet-stream");
  headers.set("Content-Disposition", buildAttachmentDisposition(filename));
  headers.set("Cache-Control", "private, no-store");

  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(upstream.body, {
    headers,
    status: 200
  });
}

function parseAttachmentUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(blobHostSuffix) &&
      url.pathname.startsWith(attachmentPathPrefix)
    ) {
      return url;
    }
  } catch {
    // Invalid URLs are rejected by returning null below.
  }

  return null;
}

function sanitizeFilename(value: string | null) {
  const filename = value?.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim();
  return filename ? filename.slice(0, 180) : null;
}

function buildAttachmentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "").slice(0, 120) || "attachment";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeRFC5987Value(filename)}`;
}

function encodeRFC5987Value(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
