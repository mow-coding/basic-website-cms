import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { publicSiteContentCacheTag, publicSiteRevalidationPaths } from "@/lib/public-cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!env.SITE_REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Revalidation is not configured." }, { status: 503 });
  }

  const providedSecret = request.headers.get("x-cms-revalidate-secret")?.trim() ?? "";
  if (!isMatchingSecret(providedSecret, env.SITE_REVALIDATE_SECRET)) {
    return NextResponse.json({ error: "Invalid revalidation secret." }, { status: 401 });
  }

  revalidateTag(publicSiteContentCacheTag, { expire: 0 });
  for (const target of publicSiteRevalidationPaths) {
    if ("type" in target) {
      revalidatePath(target.path, target.type);
    } else {
      revalidatePath(target.path);
    }
  }

  return NextResponse.json({
    revalidated: true,
    paths: publicSiteRevalidationPaths.map((target) => target.path),
    tag: publicSiteContentCacheTag
  });
}

function isMatchingSecret(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}
