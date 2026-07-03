import { describe, expect, it } from "vitest";
import { resolveUploadPolicy, SiteAdminUploadPolicyError } from "@/lib/site-admin/upload-policy";

describe("resolveUploadPolicy", () => {
  it("allows supported public attachment files", () => {
    const policy = resolveUploadPolicy("site-attachments/application.pdf");

    expect(policy.maximumSizeInBytes).toBe(30 * 1024 * 1024);
    expect(policy.allowedContentTypes).toContain("application/pdf");
  });

  it("allows supported body images", () => {
    const policy = resolveUploadPolicy("site-body-images/editor-image.png");

    expect(policy.maximumSizeInBytes).toBe(10 * 1024 * 1024);
    expect(policy.allowedContentTypes).toContain("image/png");
  });

  it("rejects unsupported attachment extensions", () => {
    expect(() => resolveUploadPolicy("site-attachments/malware.exe")).toThrow("허용되지 않는 업로드");
    expect(() => resolveUploadPolicy("site-attachments/malware.exe")).toThrow(SiteAdminUploadPolicyError);
  });

  it("rejects supported extensions outside allowed upload folders", () => {
    expect(() => resolveUploadPolicy("other-folder/application.pdf")).toThrow("허용되지 않는 업로드");
  });

  it("rejects SVG body images", () => {
    expect(() => resolveUploadPolicy("site-body-images/vector.svg")).toThrow("허용되지 않는 업로드");
  });
});
