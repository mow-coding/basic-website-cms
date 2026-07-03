import { WorkshopCardCarousel, type WorkshopCardCarouselItem } from "@/components/workshop-card-carousel";
import { loadAllWorkshopCalendars, type CalendarEvent, type WorkshopCalendarState } from "@/lib/calendar";
import { loadPublicSiteContent } from "@/lib/public-site-content";
import { WorkshopOverviewNotices, type WorkshopOverviewGroup } from "@/components/workshop-overview-notices";
import { WORKSHOP_NOTICE_LABELS, workshopNoticeLabelSet as workshopLabelSet } from "@/lib/workshop-labels";

export const revalidate = 60;

export const metadata = {
  title: "중첩",
  description: "프로그램 A, B, C, D 안내와 일정을 확인합니다.",
};

const seoulDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function WorkshopsPage() {
  const content = await loadPublicSiteContent({ includeNoticeBodies: false });
  const calendars = await loadAllWorkshopCalendars(content.workshops, content.generalSchedules, content.workshopRuns);
  const calendarByWorkshop = new Map(calendars.map((calendar) => [calendar.workshop, calendar]));
  const todayKey = toSeoulDateKey(new Date());
  const carouselItems: WorkshopCardCarouselItem[] = content.workshops.map((workshop) => {
    const calendar = calendarByWorkshop.get(workshop.slug);
    const latestSession = getLatestSessionEvent(calendar);

    return {
      href: `/nested/${workshop.slug}`,
      slug: workshop.slug,
      shortName: workshop.shortName,
      title: workshop.title,
      cardImage: workshop.cardImage,
      introParagraphs: workshop.introParagraphs,
      latestSessionLabel: formatLatestSession(latestSession, workshop.slug),
      todaySummary: getTodayScheduleSummary(calendar, todayKey),
    };
  });

  const workshopLabelsOf = (notice: (typeof content.notices)[number]) =>
    notice.labels.filter((label) => workshopLabelSet.has(label));
  const createdSortValue = (notice: (typeof content.notices)[number]) =>
    "createdAtIso" in notice && typeof notice.createdAtIso === "string" ? notice.createdAtIso : notice.createdAt;
  const byCreatedDesc = (a: (typeof content.notices)[number], b: (typeof content.notices)[number]) =>
    createdSortValue(b).localeCompare(createdSortValue(a), "ko-KR");
  const labeledNotices = content.notices.filter((notice) => workshopLabelsOf(notice).length >= 1);
  const noticeGroups: WorkshopOverviewGroup[] = [
    {
      key: "general",
      label: "일반",
      notices: labeledNotices.filter((notice) => workshopLabelsOf(notice).length >= 2).sort(byCreatedDesc)
    },
    ...WORKSHOP_NOTICE_LABELS.map((label) => ({
      key: label.toLowerCase(),
      label,
      notices: labeledNotices
        .filter((notice) => {
          const workshopLabels = workshopLabelsOf(notice);
          return workshopLabels.length === 1 && workshopLabels[0] === label;
        })
        .sort(byCreatedDesc)
    }))
  ];

  return (
    <>
      <section className="page-hero">
        <h1>중첩</h1>
        <p>여기에 프로그램 목록의 안내 문구가 들어갑니다</p>
      </section>
      <WorkshopCardCarousel items={carouselItems} />
      <section className="section workshop-post-section" aria-label="프로그램 게시물">
        <WorkshopOverviewNotices groups={noticeGroups} />
      </section>
    </>
  );
}

function getLatestSessionEvent(calendar?: WorkshopCalendarState) {
  return calendar?.events
    .filter((event) => !event.isApplication)
    .sort((left, right) => left.start.localeCompare(right.start))
    .at(-1);
}

function getTodayScheduleSummary(calendar: WorkshopCalendarState | undefined, todayKey: string) {
  const todayEvents =
    calendar?.events.filter((event) => event.dateKey <= todayKey && todayKey <= event.endDateKey) ?? [];
  if (todayEvents.length === 0) {
    return "오늘 일정 없음";
  }

  const applicationNames = uniqueEventNames(todayEvents.filter((event) => event.isApplication));
  const sessionNames = uniqueEventNames(todayEvents.filter((event) => !event.isApplication));
  const lines: string[] = [];

  if (applicationNames.length > 0) {
    lines.push(`${applicationNames.join(", ")} [신청기간]`);
  }
  if (sessionNames.length > 0) {
    lines.push(...sessionNames);
  }

  return lines.join(" / ");
}

function formatLatestSession(event: CalendarEvent | undefined, workshopSlug: string) {
  if (!event) {
    return "마지막 일정이 조회되지 않습니다";
  }

  if (!shouldShowLatestSessionName(workshopSlug)) {
    return formatDateKey(event.dateKey);
  }

  return `${formatDateKey(event.dateKey)} · ${formatEventName(event)}`;
}

function shouldShowLatestSessionName(workshopSlug: string) {
  return workshopSlug === "program-c" || workshopSlug === "program-d";
}

function uniqueEventNames(events: CalendarEvent[]) {
  return Array.from(new Set(events.map((event) => (event.isApplication ? formatEventName(event) : formatSessionStatus(event)))));
}

function formatEventName(event: CalendarEvent) {
  const baseName = event.stageDisplayName ?? event.title;
  return event.dayLabel ? `${baseName} ${event.dayLabel}` : baseName;
}

function formatSessionStatus(event: CalendarEvent) {
  const baseName = event.stageDisplayName ?? event.title;
  const statusLabel = event.dayLabel ? `본강의 ${event.dayLabel}` : "본강의";
  return `${baseName} [${statusLabel}]`;
}

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}.${month}.${day}`;
}

function toSeoulDateKey(date: Date) {
  const parts = seoulDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}
