import { CalendarView } from "@/components/calendar-view";
import { HomeNoticePreview } from "@/components/home-notice-preview";
import { SmoothScrollLink } from "@/components/smooth-scroll-link";
import { getInitialCalendarMonth, loadAllWorkshopCalendars } from "@/lib/calendar";
import { loadPublicSiteContent } from "@/lib/public-site-content";
import { notices as fallbackNotices, siteConfig, type NoticeCategory } from "@/lib/site-data";
import type { NoticeLabel } from "@/lib/site-data";
import { workshopNoticeLabelSet as workshopLabels } from "@/lib/workshop-labels";

export const revalidate = 60;

type HomeNotice = Awaited<ReturnType<typeof loadPublicSiteContent>>["notices"][number];

const previewNoticeCategories: NoticeCategory[] = ["전체 공지", "프로그램 공지", "안내"];

export default async function Home() {
  const content = await loadPublicSiteContent({
    includeNoticeBodies: false,
    noticeCategories: ["GENERAL", "COUNSELING"]
  });
  const calendars = await loadAllWorkshopCalendars(content.workshops, content.generalSchedules, content.workshopRuns);
  const events = calendars.flatMap((calendar) => calendar.events);
  const initialMonth = getInitialCalendarMonth();
  const fallbackHomeNotices: HomeNotice[] = fallbackNotices.map((notice) => ({ ...notice, isWorkshopReview: false }));
  const notices = content.notices.length > 0 ? content.notices : fallbackHomeNotices;
  const officialNoticeGroups = previewNoticeCategories.map((category) => {
    const items = notices
      .filter((item) => isHomePreviewNotice(item, category))
      .sort((a, b) => compareHomePreviewNotices(a, b, category))
      .slice(0, 3);

    return { category, items };
  });
  const calendarNotices = getNoticesForCalendar(events, notices);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="hero-kicker">마음을 이해하는 첫 번째 자리</p>
            <span className="hero-divider" aria-hidden="true" />
            <p className="hero-quote">
              {siteConfig.heroCopy[0]}
              <br />
              {siteConfig.heroCopy[1]}
            </p>
          </div>
          <SmoothScrollLink className="hero-scroll-cue" href="#site-notices" ariaLabel="아래 내용 보기">
            <span aria-hidden="true" />
          </SmoothScrollLink>
        </div>
      </section>

      <section className="section notice-preview" id="site-notices">
        <div className="section-heading">
          <h2 className="schedule-title">모오 임상심리연구소의 소식을 확인하세요</h2>
        </div>
        <HomeNoticePreview groups={officialNoticeGroups} />
      </section>

      <section className="section calendar-section" id="workshop-calendar">
        <div className="section-heading">
          <h2 className="schedule-title">
            상담 휴무일, 워크숍 기간 등
            <br />
            모오 임상심리연구소의 전체 일정을 확인하세요
          </h2>
        </div>
        <div className="calendar-layout">
          <CalendarView events={events} workshops={calendars} initialMonth={initialMonth} notices={calendarNotices} />
        </div>
      </section>
    </>
  );
}

function getNoticesForCalendar(events: Array<{ noticePostId?: string }>, notices: HomeNotice[]) {
  const noticeIds = new Set(events.map((event) => event.noticePostId).filter((id): id is string => Boolean(id)));
  return notices.filter((notice) => noticeIds.has(String(notice.id)));
}

function getNoticeSortValue(notice: HomeNotice) {
  if ("createdAtIso" in notice && typeof notice.createdAtIso === "string") {
    return notice.createdAtIso;
  }

  return notice.createdAt;
}

function compareHomePreviewNotices(a: HomeNotice, b: HomeNotice, category: NoticeCategory) {
  const comparison = getNoticeSortValue(a).localeCompare(getNoticeSortValue(b), "ko-KR");

  return category === "안내" ? comparison : comparison * -1;
}

function isHomePreviewNotice(notice: HomeNotice, category: NoticeCategory) {
  if (!notice.official) {
    return false;
  }

  if (category === "프로그램 공지") {
    return (notice.category === "전체 공지" || notice.category === "프로그램 공지") && hasWorkshopLabel(notice.labels);
  }

  if (category === "전체 공지") {
    return notice.category === category && !hasWorkshopLabel(notice.labels);
  }

  return notice.category === category;
}

function hasWorkshopLabel(labels: NoticeLabel[]) {
  return labels.some((label) => workshopLabels.has(label));
}
