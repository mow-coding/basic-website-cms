import { Fragment } from "react";
import { notFound } from "next/navigation";
import { CalendarView } from "@/components/calendar-view";
import { NoticeBrowser } from "@/components/notice-browser";
import { getInitialCalendarMonth, loadAllWorkshopCalendars } from "@/lib/calendar";
import { loadPublicSiteContent } from "@/lib/public-site-content";
import { workshops, type NoticeCategory, type NoticeLabel, type WorkshopSlug } from "@/lib/site-data";
import { workshopNoticeLabelSet as workshopLabelSet } from "@/lib/workshop-labels";

export const revalidate = 60;

type WorkshopPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    notice?: string;
  }>;
};

type WorkshopNotice = Awaited<ReturnType<typeof loadPublicSiteContent>>["notices"][number];

const noticeLabelByWorkshop: Record<WorkshopSlug, NoticeLabel> = {
  "program-a": "프로그램A",
  "program-b": "프로그램B",
  "program-c": "프로그램C",
  "program-d": "프로그램D",
};

export function generateStaticParams() {
  return workshops.map((workshop) => ({ slug: workshop.slug }));
}

export async function generateMetadata({ params }: WorkshopPageProps) {
  const { slug } = await params;
  // Metadata only needs the static title; the admin API merge never changes it.
  const workshop = workshops.find((item) => item.slug === slug);
  if (!workshop) {
    return {};
  }

  return {
    title: workshop.title,
    description: `${workshop.title} 안내, 일정, 공지, 자료실을 확인합니다.`,
  };
}

export default async function WorkshopDetailPage({ params, searchParams }: WorkshopPageProps) {
  const { slug } = await params;
  const noticeParams = await searchParams;
  const staticWorkshop = workshops.find((item) => item.slug === slug);

  if (!staticWorkshop) {
    notFound();
  }

  const workshopNoticeLabel = noticeLabelByWorkshop[staticWorkshop.slug];
  const content = await loadPublicSiteContent({ includeNoticeBodies: false, noticeLabels: [workshopNoticeLabel] });
  const workshop = content.workshops.find((item) => item.slug === staticWorkshop.slug);

  if (!workshop) {
    notFound();
  }

  const allCalendars = await loadAllWorkshopCalendars(content.workshops, content.generalSchedules, content.workshopRuns);
  const calendar = allCalendars.find((item) => item.workshop === workshop.slug);
  if (!calendar) {
    notFound();
  }

  const initialMonth = getInitialCalendarMonth();
  const relatedPosts = content.notices.filter(
    (notice) =>
      notice.labels.includes(workshopNoticeLabel) &&
      notice.labels.filter((label) => workshopLabelSet.has(label)).length === 1
  );
  const selectedNotice = noticeParams?.notice
    ? content.notices.find((notice) => String(notice.id) === noticeParams.notice)
    : undefined;
  const browserNotices = (
    selectedNotice && !relatedPosts.some((notice) => notice.id === selectedNotice.id)
      ? [...relatedPosts, selectedNotice]
      : relatedPosts
  ).map(toBrowserNotice);

  const calendarNotices = getNoticesForCalendar(calendar.events, content.notices);

  return (
    <>
      <section className="page-hero">
        <h1>{workshop.title}</h1>
        <p>{workshop.description}</p>
      </section>

      {workshop.courses.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Course</p>
            <h2>세부 과정</h2>
          </div>
          <div className="workshop-grid">
            {workshop.courses.map((course, index) => (
              <article className="surface-panel" key={course}>
                <p className="eyebrow">{index + 1}단계</p>
                <h2>{course}</h2>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section workshop-intro" aria-label={`${workshop.shortName} 소개`}>
        {workshop.introParagraphs.map((paragraphLines) => (
          <p key={paragraphLines.join(" ")}>
            {paragraphLines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        ))}
      </section>

      <section className="section calendar-section workshop-calendar-section">
        <CalendarView
          events={calendar.events}
          workshops={allCalendars}
          initialMonth={initialMonth}
          lockedWorkshop={workshop.slug}
          notices={calendarNotices}
        />
        {calendar.error ? <p className="empty-state">캘린더를 불러오지 못했습니다: {calendar.error}</p> : null}
      </section>

      <NoticeBrowser authors={content.authors} notices={browserNotices} />

    </>
  );
}

// 프로그램 공지는 게시물 브라우저의 "공지사항" 탭에서 보이도록 전체 공지로 매핑한다.
function toBrowserNotice(notice: WorkshopNotice) {
  if (notice.category !== "프로그램 공지") {
    return notice;
  }

  const generalNoticeCategory: NoticeCategory = "전체 공지";

  return { ...notice, category: generalNoticeCategory };
}

function getNoticesForCalendar(events: Array<{ noticePostId?: string }>, notices: WorkshopNotice[]) {
  const noticeIds = new Set(events.map((event) => event.noticePostId).filter((id): id is string => Boolean(id)));
  return notices.filter((notice) => noticeIds.has(String(notice.id)));
}
