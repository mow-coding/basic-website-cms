import { describe, expect, it } from "vitest";
// @ts-expect-error The standalone operator CLI is JavaScript.
import { classifyBlob, collectReferences } from "../../scripts/inventory-unreferenced-files.mjs";
const url = "https://store.private.blob.vercel-storage.com/site-body-images/a.png";
const now = new Date("2026-10-25T12:00:00Z");

describe("non-destructive file inventory", () => {
  it("protects references in draft, trash and encoded legacy HTML", () => {
    const refs = collectReferences([{ attachments: [{ url }], deletedAt: now }, { body: `<img src="/api/site-admin/files?url=${encodeURIComponent(url)}">` }]);
    expect(refs.has(url)).toBe(true);
    expect(classifyBlob({ url, pathname: "site-body-images/a.png", uploadedAt: "2026-01-01" }, refs, now)).toBe("referenced");
  });
  it("holds new uploads and unknown namespaces; old unused files are only review candidates", () => {
    expect(classifyBlob({ url, pathname: "site-body-images/a.png", uploadedAt: "2026-10-24" }, new Set(), now)).toBe("grace-period");
    expect(classifyBlob({ url, pathname: "legacy/a.png", uploadedAt: "2026-01-01" }, new Set(), now)).toBe("unknown-path");
    expect(classifyBlob({ url, pathname: "site-body-images/a.png", uploadedAt: "2026-01-01" }, new Set(), now)).toBe("review-candidate");
  });
});
