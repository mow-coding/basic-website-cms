import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/site-admin/allowed-users", () => ({
  normalizeEmail: (value: string | null) => value?.trim().toLowerCase() ?? "",
  getSiteAdminAccount: (email: string) => email === "allowed@gmail.com" || email === "owner@workspace.example"
    ? { email, kind: "manager", defaultDisplayName: "Admin" }
    : email === "external@example.com" ? { email, kind: "editor", defaultDisplayName: "Editor", googleSubject: "pinned-sub" } : null
}));
import { verifiedGoogleIdentity } from "@/lib/google-identity";
import { validAuthIdentity } from "@/lib/auth-session";
const profile = { email: "allowed@gmail.com", sub: "subject-1", email_verified: true };

describe("Google identity and session contracts", () => {
  it("requires verified email and the same provider subject", () => {
    expect(verifiedGoogleIdentity(profile, "subject-1")?.subject).toBe("subject-1");
    expect(verifiedGoogleIdentity({ ...profile, email_verified: false }, "subject-1")).toBeNull();
    expect(verifiedGoogleIdentity(profile, "different")).toBeNull();
    expect(verifiedGoogleIdentity({ ...profile, sub: "" }, "")).toBeNull();
  });
  it("requires a pinned subject for third-party email accounts", () => {
    expect(verifiedGoogleIdentity({ ...profile, email: "external@example.com", sub: "pinned-sub" }, "pinned-sub")).not.toBeNull();
    expect(verifiedGoogleIdentity({ ...profile, email: "external@example.com" }, "subject-1")).toBeNull();
    expect(verifiedGoogleIdentity({ ...profile, email: "owner@workspace.example", hd: "workspace.example" }, "subject-1")).not.toBeNull();
    expect(verifiedGoogleIdentity({ ...profile, email: "owner@workspace.example", hd: "primary-workspace.example" }, "subject-1")).not.toBeNull();
    expect(verifiedGoogleIdentity({ ...profile, email: "owner@workspace.example" }, "subject-1")).toBeNull();
  });
  it("rejects legacy tokens and demo tokens after the demo is disabled", () => {
    expect(validAuthIdentity({ email: profile.email })).toBe(false);
    expect(validAuthIdentity({ authVersion: 2, authProvider: "google" })).toBe(false);
    expect(validAuthIdentity({ authVersion: 2, authProvider: "google", userId: "u1", googleSubject: "sub1" })).toBe(true);
    expect(validAuthIdentity({ authVersion: 2, authProvider: "demo" }, true)).toBe(true);
    expect(validAuthIdentity({ authVersion: 2, authProvider: "demo" }, false)).toBe(false);
  });
});
