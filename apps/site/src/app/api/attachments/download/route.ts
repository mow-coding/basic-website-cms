import { env } from "@/lib/env";

const blobHostSuffix = ".public.blob.vercel-storage.com";
const attachmentPathPrefix = "/site-attachments/";
// 설정되면 이 배포의 blob 스토어 호스트만 정확히 허용(권장). 비면 접미사로 폴백.
const attachmentAllowedHost = env.SITE_ATTACHMENT_BLOB_HOST;

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

  // redirect: "manual" — 허용목록을 통과한 첫 URL만 신뢰하고, 3xx로 다른 호스트로
  // 유도하는 리다이렉트는 따라가지 않는다(!upstream.ok에서 걸러짐).
  const upstream = await fetch(parsedSourceUrl, { cache: "no-store", redirect: "manual" });
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "Attachment file was not found." }, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  // 다운로드 전용 엔드포인트이므로 업스트림이 주장하는 타입을 신뢰하지 않고 항상
  // 옥텟 스트림 + nosniff로 내려보내 브라우저가 파일을 실행/렌더하지 못하게 한다.
  headers.set("Content-Type", "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
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
    const hostAllowed = attachmentAllowedHost
      ? url.hostname === attachmentAllowedHost
      : url.hostname.endsWith(blobHostSuffix);
    if (
      url.protocol === "https:" &&
      hostAllowed &&
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
