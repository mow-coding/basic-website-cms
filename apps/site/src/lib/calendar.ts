import type {
  PublicGeneralSchedule,
  PublicWorkshopRun,
  PublicWorkshopRunNotice,
  PublicWorkshopStage,
  PublicWorkshopSession,
} from "@/lib/public-site-content";
import { workshops, type CalendarScopeSlug, type WorkshopSlug, type WorkshopStatus } from "@/lib/site-data";

export type CalendarEvent = {
  id: string;
  workshop: CalendarScopeSlug;
  workshopName: string;
  title: string;
  description: string;
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  dateKey: string;
  endDateKey: string;
  isApplication: boolean;
  url?: string;
  runLabel?: string;
  runYear?: number;
  runNumber?: number;
  stageName?: string;
  stageDisplayName?: string;
  dayLabel?: string;
  noticePostId?: string;
  noticePost?: PublicWorkshopRunNotice;
};

export type WorkshopCalendarState = {
  workshop: CalendarScopeSlug;
  workshopName: string;
  title: string;
  status: WorkshopStatus;
  applicationUrl?: string;
  nextEvent?: CalendarEvent;
  latestEvent?: CalendarEvent;
  events: CalendarEvent[];
  error?: string;
};

type CalendarSourceWorkshop = Pick<(typeof workshops)[number], "shortName" | "title" | "status"> & {
  slug: CalendarScopeSlug;
  applicationFormUrl?: string | null;
};

const instituteCalendar: CalendarSourceWorkshop = {
  slug: "general",
  shortName: "전체",
  title: "기관 기본 일정",
  status: "등록된 일정 없음",
  applicationFormUrl: null,
};

const koreanShortNameByWorkshopSlug: Record<WorkshopSlug, string> = {
  "program-a": "프로그램A",
  "program-b": "프로그램B",
  "program-c": "프로그램C",
  "program-d": "프로그램D",
};

const seoulDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const seoulDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const seoulDateOnlyDisplayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getInitialCalendarMonth() {
  return toSeoulDateKey(new Date()).slice(0, 7);
}

export async function loadAllWorkshopCalendars(
  sourceWorkshops: CalendarSourceWorkshop[] = workshops,
  generalSchedules: PublicGeneralSchedule[] = [],
  workshopRuns: PublicWorkshopRun[] = [],
): Promise<WorkshopCalendarState[]> {
  return [instituteCalendar, ...sourceWorkshops].map((workshop) =>
    buildWorkshopCalendar(workshop, generalSchedules, workshopRuns),
  );
}

function buildWorkshopCalendar(
  workshop: CalendarSourceWorkshop,
  generalSchedules: PublicGeneralSchedule[],
  workshopRuns: PublicWorkshopRun[],
): WorkshopCalendarState {
  const isInstitute = workshop.slug === "general";
  const events: CalendarEvent[] = [];

  if (isInstitute) {
    for (const schedule of generalSchedules) {
      events.push(buildGeneralEvent(schedule));
    }
  } else {
    const matchingRuns = workshopRuns.filter((run) => run.workshopSlug === workshop.slug);
    for (const run of matchingRuns) {
      events.push(...buildRunEvents(run, workshop.shortName));
    }
  }

  events.sort((a, b) => a.start.localeCompare(b.start));

  return {
    workshop: workshop.slug,
    workshopName: workshop.shortName,
    title: workshop.title,
    status: workshop.status,
    applicationUrl: workshop.applicationFormUrl ?? findApplicationUrl(events),
    nextEvent: events.find((event) => new Date(event.end) >= new Date()),
    latestEvent: events[events.length - 1],
    events,
  };
}

function buildGeneralEvent(schedule: PublicGeneralSchedule): CalendarEvent {
  return toCalendarEvent({
    id: `general-${schedule.id}`,
    workshop: "general",
    workshopName: "전체",
    title: schedule.title,
    description: schedule.description ?? "",
    start: schedule.date,
    end: schedule.endsAt ?? schedule.date,
    isApplication: false,
  });
}

function buildRunEvents(run: PublicWorkshopRun, fallbackShortName: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const koreanShortName = koreanShortNameByWorkshopSlug[run.workshopSlug] ?? fallbackShortName;
  const runLabel = run.runLabel || buildFallbackRunLabel(run.workshopSlug, run.year, run.runNumber, koreanShortName);

  for (const stage of run.stages) {
    const stageDisplayName = stripWorkshopPrefix(stage.stageName, koreanShortName);
    const baseTitle = `${runLabel} │ ${stageDisplayName}`;

    if (stage.applicationStartsAt && stage.applicationEndsAt) {
      const noticePost = getEffectiveNoticePost(stage.noticePostId, stage.noticePost, run.noticePost);
      events.push(
        toCalendarEvent({
          id: `${run.id}-stage-${stage.id}-application`,
          workshop: run.workshopSlug,
          workshopName: koreanShortName,
          title: baseTitle,
          description: run.description ?? "",
          start: stage.applicationStartsAt,
          end: stage.applicationEndsAt,
          isApplication: true,
          url: stage.applicationFormUrl ?? run.applicationFormUrl ?? undefined,
          runLabel,
          runYear: run.year,
          runNumber: run.runNumber,
          stageName: stage.stageName,
          stageDisplayName,
          noticePostId: noticePost?.id,
          noticePost: noticePost ?? undefined,
        }),
      );
    }

    stage.sessions.forEach((session) => {
      events.push(buildSessionEvent({ run, stage, session, runLabel, baseTitle, stageDisplayName, koreanShortName }));
    });
  }

  return events;
}

function buildSessionEvent({
  run,
  stage,
  session,
  runLabel,
  baseTitle,
  stageDisplayName,
  koreanShortName,
}: {
  run: PublicWorkshopRun;
  stage: PublicWorkshopStage;
  session: PublicWorkshopSession;
  runLabel: string;
  baseTitle: string;
  stageDisplayName: string;
  koreanShortName: string;
}): CalendarEvent {
  const { start, end } = combineSessionTimes(session);
  const dayLabel = stage.sessions.length > 1 ? `${session.dayIndex + 1}일차` : null;
  const noticePost = getEffectiveNoticePost(session.noticePostId, session.noticePost, run.noticePost);

  return toCalendarEvent({
    id: `${run.id}-stage-${stage.id}-session-${session.id}`,
    workshop: run.workshopSlug,
    workshopName: koreanShortName,
    title: baseTitle,
    description: run.description ?? "",
    start: start.toISOString(),
    end: end.toISOString(),
    isApplication: false,
    url: session.applicationFormUrl ?? run.applicationFormUrl ?? undefined,
    runLabel,
    runYear: run.year,
    runNumber: run.runNumber,
    stageName: stage.stageName,
    stageDisplayName,
    dayLabel: dayLabel ?? undefined,
    noticePostId: noticePost?.id,
    noticePost: noticePost ?? undefined,
  });
}

function getEffectiveNoticePost(
  overrideNoticePostId: string | null,
  overrideNoticePost: PublicWorkshopRunNotice | null,
  runNoticePost: PublicWorkshopRunNotice | null,
) {
  if (overrideNoticePostId) {
    return overrideNoticePost;
  }

  return runNoticePost;
}

function combineSessionTimes(session: PublicWorkshopSession) {
  // sessionDate is stored as the instant of Seoul midnight for that day, so the
  // wall-clock startTime/endTime are added as an offset from that base to keep
  // the displayed time in Asia/Seoul (setting UTC hours directly would shift it
  // by +9h).
  const baseDate = new Date(session.sessionDate);
  const [startHour, startMinute] = session.startTime.split(":").map(Number);
  const [endHour, endMinute] = session.endTime.split(":").map(Number);

  const start = new Date(baseDate.getTime() + (startHour * 60 + startMinute) * 60000);
  const end = new Date(baseDate.getTime() + (endHour * 60 + endMinute) * 60000);

  return { start, end };
}

function stripWorkshopPrefix(stageName: string, koreanShortName: string) {
  const prefix = `${koreanShortName} `;
  if (stageName.startsWith(prefix)) {
    return stageName.slice(prefix.length);
  }
  return stageName;
}

function buildFallbackRunLabel(workshopSlug: WorkshopSlug, year: number, runNumber: number, koreanShortName: string) {
  const yy = String(year).slice(-2).padStart(2, "0");
  void workshopSlug;
  return `${yy}-${runNumber} ${koreanShortName}`;
}

function toCalendarEvent(input: {
  id: string;
  workshop: CalendarScopeSlug;
  workshopName: string;
  title: string;
  description: string;
  start: string;
  end: string;
  isApplication: boolean;
  url?: string;
  runLabel?: string;
  runYear?: number;
  runNumber?: number;
  stageName?: string;
  stageDisplayName?: string;
  dayLabel?: string;
  noticePostId?: string;
  noticePost?: PublicWorkshopRunNotice;
}): CalendarEvent {
  const start = new Date(input.start);
  const end = new Date(input.end);
  const labelFormatter = input.isApplication ? formatDate : formatDateTime;

  return {
    ...input,
    start: start.toISOString(),
    end: end.toISOString(),
    startLabel: labelFormatter(start),
    endLabel: labelFormatter(end),
    dateKey: toSeoulDateKey(start),
    endDateKey: toSeoulDateKey(end),
  };
}

function findApplicationUrl(events: CalendarEvent[]) {
  const now = new Date();
  const activeApplication = events.find(
    (event) => event.isApplication && event.url && new Date(event.start) <= now && now <= new Date(event.end),
  );

  return activeApplication?.url ?? events.find((event) => event.isApplication && event.url)?.url;
}

function formatDateTime(date: Date) {
  return seoulDateTimeFormatter.format(date).replace(/\. /g, ".").replace(/\.$/, "");
}

function formatDate(date: Date) {
  return seoulDateOnlyDisplayFormatter.format(date).replace(/\. /g, ".").replace(/\.$/, "");
}

function toSeoulDateKey(date: Date) {
  const parts = seoulDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}
