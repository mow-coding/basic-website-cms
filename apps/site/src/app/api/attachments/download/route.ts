import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const postId = params.get("postId");
  const sourceUrl = params.get("url");
  if (!postId || postId.length > 128 || !sourceUrl || sourceUrl.length > 2048) {
    return Response.json({ error: "Invalid attachment request." }, { status: 400, headers: noStore });
  }
  if (!env.SITE_ADMIN_API_URL) {
    return Response.json({ error: "Content service unavailable." }, { status: 503, headers: noStore });
  }
  try {
    const endpoint = new URL(env.SITE_ADMIN_API_URL);
    endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/attachments`;
    endpoint.search = new URLSearchParams({ postId, url: sourceUrl }).toString();
    endpoint.hash = "";
    const upstream = await fetch(endpoint, {
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(30_000)
    });
    if (!upstream.ok || !upstream.body) {
      await upstream.body?.cancel();
      return Response.json({ error: "Attachment unavailable." }, {
        status: upstream.status === 404 ? 404 : 503, headers: noStore
      });
    }
    const headers = new Headers(noStore);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", upstream.headers.get("Content-Disposition") || "attachment");
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    return new Response(upstream.body, { headers });
  } catch {
    return Response.json({ error: "Attachment unavailable." }, { status: 503, headers: noStore });
  }
}
