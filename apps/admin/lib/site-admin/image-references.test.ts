import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({ env: {
  NODE_ENV: "production", NEXTAUTH_URL: "https://admin.example.com", LEGACY_ADMIN_ORIGINS: "https://previous.example.com",
  PRIVATE_BLOB_HOST: "store.private.blob.vercel-storage.com", PRIVATE_BLOB_READ_WRITE_TOKEN: "test-fixture"
} }));
import { adminRichText, canonicalRichText, resolveManagedImageReference } from "@/lib/site-admin/image-references";
import { bodyReferencesImage, publicImageSource } from "@/lib/site-admin/public-media";
const blob = "https://store.private.blob.vercel-storage.com/site-body-images/photo.png";
const proxy = `/api/site-admin/files?url=${encodeURIComponent(blob)}`;

describe("portable image references", () => {
  it.each([blob, proxy, `https://admin.example.com${proxy}`, `https://previous.example.com${proxy}`])("resolves a verified image: %s", (src) => {
    expect(resolveManagedImageReference(src)).toBe(blob);
    expect(publicImageSource({ kind: "post", id: "post-1" })(src)).toContain("/api/public-site/media?");
  });
  it.each([
    `https://untrusted.example.com${proxy}`, `//untrusted.example.com${proxy}`, `${proxy}&url=${encodeURIComponent(blob)}`,
    `${proxy}&other=1`, `${proxy}#extra`, "https://store.private.blob.vercel-storage.com.evil.test/site-body-images/a.png",
    blob.replace("site-body-images", "site-attachments"), blob.replace("https://", "https://user@"), `${blob}?other=1`
  ])("rejects an ambiguous or unowned image: %s", (src) => { expect(resolveManagedImageReference(src)).toBeNull(); });
  it("round trips editor display without persisting the admin origin", () => {
    const saved = canonicalRichText(`<p>content</p><img alt="photo" src="https://previous.example.com${proxy}">`);
    expect(saved).toContain(blob);
    expect(saved).not.toContain("previous.example.com");
    expect(canonicalRichText(adminRichText(saved))).toBe(saved);
  });
  it("requires an actual image element, not text, alt text or links", () => {
    expect(bodyReferencesImage(`<a href="${blob}">${blob}</a>`, blob)).toBe(false);
    expect(bodyReferencesImage(`<img alt="${blob}" src="https://example.com/other.png">`, blob)).toBe(false);
    expect(bodyReferencesImage(`<img src="https://previous.example.com${proxy}">`, blob)).toBe(true);
  });
});
