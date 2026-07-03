import { describe, expect, it } from "vitest";
import { canManageSiteSystemSettings, isAllowedSiteAdminEmail } from "@/lib/site-admin/allowed-users";

describe("site admin account permissions", () => {
  it("keeps only the manager account at system-manager level", () => {
    expect(canManageSiteSystemSettings("admin@example.com")).toBe(true);
    expect(canManageSiteSystemSettings("editor-one@example.com")).toBe(false);
    expect(canManageSiteSystemSettings("editor-two@example.com")).toBe(false);
  });

  it("still allows non-manager admin accounts to sign in", () => {
    expect(isAllowedSiteAdminEmail("editor-one@example.com")).toBe(true);
    expect(isAllowedSiteAdminEmail("editor-two@example.com")).toBe(true);
  });
});
