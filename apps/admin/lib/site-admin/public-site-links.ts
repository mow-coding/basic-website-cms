import { env } from "@/lib/env";

const fallbackPublicSiteOrigin = env.IS_PRODUCTION ? "https://example.com" : "http://localhost:3000";

export function getPublicNoticePopupUrl(postId: string) {
  const origin = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL ?? fallbackPublicSiteOrigin);
  const url = new URL("/notices", origin);
  url.searchParams.set("notice", postId);
  return url.toString();
}

export function getPublicHomeNoticePopupUrl(postId: string) {
  const origin = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL ?? fallbackPublicSiteOrigin);
  const url = new URL("/", origin);
  url.searchParams.set("notice", postId);
  return url.toString();
}

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/u, "");
}
