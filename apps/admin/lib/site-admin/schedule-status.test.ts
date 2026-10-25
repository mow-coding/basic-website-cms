import { describe, expect, it } from "vitest";
import { runEndTime, workshopStatus } from "@/lib/site-admin/schedule-status";

const session = { sessionDate: new Date("2026-10-25T00:00:00+09:00"), endTime: "17:00" };
const window = (start: string, end: string) => ({ applicationStartsAt: new Date(start), applicationEndsAt: new Date(end), sessions: [session] });
const run = { stages: [window("2026-10-01T09:00:00+09:00", "2026-10-25T13:00:00+09:00")] };

describe("Korean workshop status boundaries", () => {
  it("uses the real class end time instead of midnight", () => {
    expect(runEndTime(run)).toBe(new Date("2026-10-25T17:00:00+09:00").getTime());
    expect(workshopStatus(run, new Date("2026-10-25T10:00:00+09:00"))).toBe("OPEN");
    expect(workshopStatus(run, new Date("2026-10-25T16:59:59+09:00"))).toBe("CLOSED");
    expect(workshopStatus(run, new Date("2026-10-25T17:00:00+09:00"))).toBe("ENDED");
  });
  it("includes the start and excludes the end of an application window", () => {
    expect(workshopStatus(run, new Date("2026-10-01T08:59:59+09:00"))).toBe("CLOSED");
    expect(workshopStatus(run, new Date("2026-10-01T09:00:00+09:00"))).toBe("OPEN");
    expect(workshopStatus(run, new Date("2026-10-25T13:00:00+09:00"))).toBe("CLOSED");
  });
  it("does not open the gap between two application periods", () => {
    const future = { ...session, sessionDate: new Date("2026-12-01T00:00:00+09:00") };
    const periods = { stages: [
      { ...window("2026-09-01", "2026-09-10"), sessions: [future] },
      { ...window("2026-11-01", "2026-11-10"), sessions: [future] }
    ] };
    expect(workshopStatus(periods, new Date("2026-10-25T10:00:00+09:00"))).toBe("CLOSED");
    expect(workshopStatus(periods, new Date("2026-11-05T10:00:00+09:00"))).toBe("OPEN");
  });
  it("handles missing schedules", () => {
    expect(workshopStatus(null)).toBe("NO_SCHEDULE");
    expect(workshopStatus({ stages: [] })).toBe("NO_SCHEDULE");
  });
});
