import { db } from "@/lib/db";
import type { verifiedGoogleIdentity } from "@/lib/google-identity";

export async function linkGoogleAccount(identity: NonNullable<ReturnType<typeof verifiedGoogleIdentity>>) {
  return db.$transaction(async (tx) => {
    const existing = await tx.user.upsert({
      where: { email: identity.email }, create: { email: identity.email, name: identity.name }, update: {}
    });
    const claimed = await tx.user.updateMany({
      where: { id: existing.id, OR: [{ googleSubject: null }, { googleSubject: identity.subject }] },
      data: { googleSubject: identity.subject }
    });
    if (claimed.count !== 1) throw new Error("Google identity mismatch");
    return existing;
  });
}
