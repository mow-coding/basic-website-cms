import { env } from "@/lib/env";

const publicSiteRevalidationTimeoutMs = 2000;

export async function revalidatePublicSiteContent() {
  if (!env.SITE_REVALIDATE_URL || !env.SITE_REVALIDATE_SECRET) {
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), publicSiteRevalidationTimeoutMs);

  try {
    const response = await fetch(env.SITE_REVALIDATE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-cms-revalidate-secret": env.SITE_REVALIDATE_SECRET
      },
      body: JSON.stringify({ source: "admin-site-content" }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn("[site-admin] public site revalidation failed", {
        status: response.status
      });
    }
  } catch (error) {
    console.warn("[site-admin] public site revalidation skipped", {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
