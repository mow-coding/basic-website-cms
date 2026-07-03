export type SiteAdminKind = "manager" | "editor";

export type SiteAdminAccount = {
  email: string;
  defaultDisplayName: string;
  kind: SiteAdminKind;
};

const accounts: SiteAdminAccount[] = [
  {
    email: "admin@example.com",
    defaultDisplayName: "관리자",
    kind: "manager"
  },
  {
    email: "editor-one@example.com",
    defaultDisplayName: "운영자 1",
    kind: "editor"
  },
  {
    email: "editor-two@example.com",
    defaultDisplayName: "운영자 2",
    kind: "editor"
  }
];

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getSiteAdminAccount(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  return accounts.find((account) => account.email === normalized) ?? null;
}

export function isAllowedSiteAdminEmail(email: string | null | undefined) {
  return Boolean(getSiteAdminAccount(email));
}

export function canManageSiteSystemSettings(email: string | null | undefined) {
  return getSiteAdminAccount(email)?.kind === "manager";
}
