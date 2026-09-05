import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({ env: {
  SITE_ADMIN_API_URL: "https://admin.example.com/api/public-site"
} }));
import { GET } from "@/app/api/attachments/download/route";

describe("site download boundary", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("rejects the old unaffiliated URL-only download contract", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await GET(new Request("https://site.example.com/api/attachments/download?url=https://other.example/a.pdf&filename=a.pdf"));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends only an authorization request to the configured admin, never the supplied source", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("missing", { status: 404 }));
    vi.stubGlobal("fetch", fetch);
    const response = await GET(new Request("https://site.example.com/api/attachments/download?" +
      new URLSearchParams({ postId: "p1", url: "http://127.0.0.1/private" })));
    expect(response.status).toBe(404);
    const [url, options] = fetch.mock.calls[0];
    expect(url.origin).toBe("https://admin.example.com");
    expect(url.pathname).toBe("/api/public-site/attachments");
    expect(options).toMatchObject({ cache: "no-store", redirect: "manual" });
  });
  it("does not follow a redirect from the upstream service", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { Location: "https://other.example/a" } }));
    vi.stubGlobal("fetch", fetch);
    expect((await GET(new Request("https://site.example.com/api/attachments/download?postId=p1&url=file"))).status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("forces download and no-store headers on approved files", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("document", {
      headers: { "Content-Type": "text/html", "Content-Disposition": "attachment; filename=approved.pdf" }
    })));
    const response = await GET(new Request("https://site.example.com/api/attachments/download?postId=p1&url=file"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toBe("document");
  });
});
