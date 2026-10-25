import { getSiteAdminAccount, normalizeEmail } from "@/lib/site-admin/allowed-users";

export function verifiedGoogleIdentity(profile: unknown, providerAccountId: string | undefined) {
  if (!profile || typeof profile !== "object") return null;
  const value = profile as Record<string, unknown>;
  const email = normalizeEmail(typeof value.email === "string" ? value.email : null);
  const account = getSiteAdminAccount(email);
  if (!account || value.email_verified !== true || typeof value.sub !== "string" || !value.sub || value.sub !== providerAccountId) return null;
  // Google documents a verified email + hosted-domain claim as authoritative;
  // Workspace aliases may have a different email domain from that hd claim.
  const googleOwnsEmail = email.endsWith("@gmail.com") || (typeof value.hd === "string" && value.hd.length > 0);
  if (account.googleSubject && account.googleSubject !== value.sub) return null;
  if (!googleOwnsEmail && account.googleSubject !== value.sub) return null;
  return { email, subject: value.sub, name: typeof value.name === "string" ? value.name : account.defaultDisplayName };
}
