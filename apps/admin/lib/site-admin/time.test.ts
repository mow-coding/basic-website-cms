import { describe, expect, it } from "vitest";
import { getSeoulYear, parseSeoulDateTimeInput } from "@/lib/site-admin/time";

describe("site-admin Seoul time helpers", () => {
  it("uses the Seoul calendar year for dates near the UTC year boundary", () => {
    const seoulNewYear = parseSeoulDateTimeInput("2026-01-01T00:00", "sessionDate");

    expect(seoulNewYear.toISOString()).toBe("2025-12-31T15:00:00.000Z");
    expect(getSeoulYear(seoulNewYear)).toBe(2026);
  });
});
