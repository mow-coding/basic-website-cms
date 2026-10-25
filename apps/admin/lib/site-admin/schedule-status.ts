type Run = {
  stages: Array<{
    applicationStartsAt: Date | null;
    applicationEndsAt: Date | null;
    sessions: Array<{ sessionDate: Date; endTime: string }>;
  }>;
};

export function sessionEndTime(session: { sessionDate: Date; endTime: string }) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(session.endTime)) return NaN;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(session.sessionDate);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T${session.endTime}:00+09:00`).getTime();
}

export function runEndTime(run: Run) {
  const times = run.stages.flatMap((stage) => stage.sessions.map(sessionEndTime)).filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
}

export function workshopStatus(run: Run | null, now = new Date()): "OPEN" | "CLOSED" | "ENDED" | "NO_SCHEDULE" {
  if (!run || !run.stages.length) return "NO_SCHEDULE";
  const end = runEndTime(run);
  if (end !== null && now.getTime() >= end) return "ENDED";
  return run.stages.some((stage) => stage.applicationStartsAt && stage.applicationEndsAt &&
    stage.applicationStartsAt.getTime() <= now.getTime() && now.getTime() < stage.applicationEndsAt.getTime()) ? "OPEN" : "CLOSED";
}
