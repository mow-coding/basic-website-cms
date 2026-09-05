import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  post: vi.fn(), schedule: vi.fn(), workshop: vi.fn(), get: vi.fn(), access: vi.fn()
}));
vi.mock("@/lib/env", () => ({ env: {
  NEXTAUTH_URL: "https://admin.example.com",
  PRIVATE_BLOB_HOST: "owned.private.blob.vercel-storage.com",
  PRIVATE_BLOB_READ_WRITE_TOKEN: "private-test-token",
  LEGACY_PUBLIC_BLOB_HOST: "legacy.public.blob.vercel-storage.com",
  BLOB_READ_WRITE_TOKEN: "legacy-test-token"
} }));
vi.mock("@/lib/db", () => ({ db: {
  sitePost: { findFirst: mocks.post }, generalSchedule: { findFirst: mocks.schedule },
  workshopRun: { findFirst: mocks.workshop }
} }));
vi.mock("@vercel/blob", () => ({ get: mocks.get }));
vi.mock("@/lib/site-admin/access", () => ({ resolveSiteAdminAccess: mocks.access }));

import { GET as download } from "@/app/api/public-site/attachments/route";
import { GET as image } from "@/app/api/public-site/media/route";
import { GET as preview } from "@/app/api/site-admin/files/route";
import { parseManagedFile } from "@/lib/site-admin/managed-files";
import { getAdminFileHref } from "@/lib/site-admin/file-links";
import { bodyReferencesImage, publicImageSource } from "@/lib/site-admin/public-media";
import { sanitizePublicPostBody } from "@/lib/site-admin/public-content-sanitize";

const attachmentUrl = "https://owned.private.blob.vercel-storage.com/site-attachments/report.pdf";
const imageUrl = "https://owned.private.blob.vercel-storage.com/site-body-images/photo.png";
const request = (path: string, params: Record<string, string>) =>
  new Request("https://admin.example.com" + path + "?" + new URLSearchParams(params));

function blob(contentType = "application/pdf") {
  return { statusCode: 200, stream: new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); c.close(); } }),
    blob: { size: 1, contentType } };
}

describe("managed file access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.access.mockResolvedValue(null);
    mocks.post.mockResolvedValue(null);
    mocks.get.mockImplementation(async () => blob());
  });

  it.each([
    "https://other.private.blob.vercel-storage.com/site-attachments/report.pdf",
    "https://other.public.blob.vercel-storage.com/site-attachments/report.pdf",
    "http://owned.private.blob.vercel-storage.com/site-attachments/report.pdf",
    "https://owned.private.blob.vercel-storage.com:444/site-attachments/report.pdf",
    "https://user@owned.private.blob.vercel-storage.com/site-attachments/report.pdf",
    attachmentUrl + "?download=1",
    "https://owned.private.blob.vercel-storage.com/site-attachments/%2e%2e%2freport.pdf"
  ])("rejects unowned or noncanonical file URL %s", (url) => {
    expect(parseManagedFile(url, "attachment")).toBeNull();
  });

  it("denies anonymous previews before reading storage", async () => {
    expect((await preview(request("/api/site-admin/files", { url: attachmentUrl }))).status).toBe(403);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("denies missing, draft, or deleted posts even with a known file URL", async () => {
    expect((await download(request("/api/public-site/attachments", { postId: "p1", url: attachmentUrl }))).status).toBe(404);
    expect(mocks.post).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "p1", visibility: "PUBLIC", deletedAt: null }
    }));
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("denies files not attached to the requested public post", async () => {
    mocks.post.mockResolvedValue({ attachments: [{ title: "different", url: attachmentUrl + ".other" }] });
    expect((await download(request("/api/public-site/attachments", { postId: "p1", url: attachmentUrl }))).status).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("does not proxy third party storage even if its URL was saved on a post", async () => {
    const url = "https://other.public.blob.vercel-storage.com/site-attachments/a.pdf";
    mocks.post.mockResolvedValue({ attachments: [{ title: "report", url }] });
    expect((await download(request("/api/public-site/attachments", { postId: "p1", url }))).status).toBe(404);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("streams a published owned file with server-owned filename and no caches", async () => {
    mocks.post.mockResolvedValue({ attachments: [{ title: "Official report.pdf", url: attachmentUrl }] });
    const result = await download(request("/api/public-site/attachments", { postId: "p1", url: attachmentUrl }));
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.headers.get("content-type")).toBe("application/octet-stream");
    expect(result.headers.get("content-disposition")).toContain("Official report.pdf");
    expect(mocks.get).toHaveBeenCalledWith("site-attachments/report.pdf", expect.objectContaining({
      access: "private", token: "private-test-token", useCache: false
    }));
    await result.arrayBuffer();
    mocks.post.mockResolvedValue(null);
    expect((await download(request("/api/public-site/attachments", { postId: "p1", url: attachmentUrl }))).status).toBe(404);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("fails closed on a database outage", async () => {
    mocks.post.mockRejectedValue(new Error("offline"));
    expect((await download(request("/api/public-site/attachments", { postId: "p1", url: attachmentUrl }))).status).toBe(503);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("requires an exact image reference in a currently published record", async () => {
    mocks.post.mockResolvedValue({ body: "<p>No image here</p>" });
    expect((await image(request("/api/public-site/media", { kind: "post", id: "p1", url: imageUrl }))).status).toBe(404);
    const src = getAdminFileHref(imageUrl, "https://admin.example.com");
    mocks.post.mockResolvedValue({ body: '<img src="' + src + '">' });
    mocks.get.mockImplementation(async () => blob("image/png"));
    const result = await image(request("/api/public-site/media", { kind: "post", id: "p1", url: imageUrl }));
    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toBe("image/png");
    await result.arrayBuffer();
    mocks.post.mockResolvedValue(null);
    expect((await image(request("/api/public-site/media", { kind: "post", id: "p1", url: imageUrl }))).status).toBe(404);
  });

  it("does not mistake text, attributes, or a lookalike host for an image reference", () => {
    expect(bodyReferencesImage("<p>" + imageUrl + "</p>", imageUrl)).toBe(false);
    expect(bodyReferencesImage('<img alt="' + imageUrl + '">', imageUrl)).toBe(false);
    const src = getAdminFileHref(imageUrl, "https://attacker.example.com");
    expect(bodyReferencesImage('<img src="' + src + '">', imageUrl)).toBe(false);
  });

  it("binds public image URLs to their owner and retains HTML sanitization", () => {
    const src = getAdminFileHref(imageUrl, "https://admin.example.com");
    const html = sanitizePublicPostBody('<img src="' + src + '" onerror="alert(1)">',
      publicImageSource({ kind: "post", id: "p1" }));
    expect(html).toContain("/api/public-site/media?");
    expect(html).toContain("id=p1");
    expect(html).not.toContain("onerror");
  });
});
