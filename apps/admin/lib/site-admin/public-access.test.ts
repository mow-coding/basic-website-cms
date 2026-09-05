import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ notice: vi.fn(), content: vi.fn() }));
vi.mock("@/lib/site-admin/public-content", () => ({
  getPublicSiteNotice: mocks.notice, getPublicSiteContent: mocks.content
}));
import { GET as detail } from "@/app/api/public-site/notices/[id]/route";
import { GET as list } from "@/app/api/public-site/route";
const request = new Request("https://admin.example.com/api/public-site?body=1");
const context = { params: Promise.resolve({ id: "p1" }) };

describe("current public content access", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("checks the current source again after a notice is withdrawn", async () => {
    mocks.notice.mockResolvedValue({ id: "p1", body: "public body" });
    expect((await detail(request, context)).status).toBe(200);
    mocks.notice.mockResolvedValue(null);
    const response = await detail(request, context);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("public body");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not serve a last-known copy when the database is unavailable", async () => {
    mocks.notice.mockRejectedValue(new Error("database offline"));
    expect((await detail(request, context)).status).toBe(503);
  });
  it("keeps list payloads bounded and reads current visibility", async () => {
    mocks.content.mockResolvedValue({ notices: [], workshops: [], resources: [] });
    const response = await list(request);
    expect(response.status).toBe(200);
    expect(mocks.content).toHaveBeenCalledWith(expect.objectContaining({ includeNoticeBodies: false }));
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("returns an uncached failure for an unavailable list", async () => {
    mocks.content.mockRejectedValue(new Error("database offline"));
    const response = await list(request);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
