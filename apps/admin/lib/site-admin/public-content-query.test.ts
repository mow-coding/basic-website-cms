import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ posts: vi.fn(), other: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  sitePost: { findMany: mocks.posts },
  siteResource: { findMany: mocks.other },
  generalSchedule: { findMany: mocks.other },
  workshopRun: { findMany: mocks.other },
  authorProfile: { findMany: mocks.other }
} }));
vi.mock("@/lib/env", () => ({ env: {} }));
import { getPublicSiteContent } from "@/lib/site-admin/public-content";

describe("public list database projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.posts.mockResolvedValue([]);
    mocks.other.mockResolvedValue([]);
  });
  it("does not transfer general notice bodies or attachments to build a summary", async () => {
    await getPublicSiteContent({ includeNoticeBodies: false });
    expect(mocks.posts.mock.calls[0][0]).toMatchObject({
      where: { visibility: "PUBLIC", deletedAt: null },
      select: { body: false, attachments: false, relatedLinks: false }
    });
    expect(mocks.posts.mock.calls[1][0].where.AND).toContainEqual({ category: "RESOURCE" });
  });
  it("does not query notices when a caller only needs schedules and programs", async () => {
    await getPublicSiteContent({ includeNotices: false, includeNoticeBodies: false });
    expect(mocks.posts).not.toHaveBeenCalled();
  });
});
