"use client";

import { getHolidayNames } from "@hyunbinseo/holidays-kr";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { SiteScheduleScopeSlug, SiteWorkshopSlug } from "@/lib/site-admin/constants";

export type AdminCalendarEvent = {
  applicationFormUrlOverride?: string | null;
  dateKey: string;
  description: string;
  dayLabel?: string;
  end: string;
  endDateKey: string;
  endLabel: string;
  id: string;
  isApplication: boolean;
  linkTargetId?: string;
  linkTargetKind?: "stage" | "session";
  noticePostId?: string | null;
  noticePostIdOverride?: string | null;
  noticePostTitle?: string | null;
  noticePostUrl?: string | null;
  runNumber?: number;
  runLabel?: string;
  runYear?: number;
  stageDisplayName?: string;
  stageName?: string;
  start: string;
  startLabel: string;
  title: string;
  url?: string;
  visibility?: "PUBLIC" | "DRAFT";
  workshop: SiteScheduleScopeSlug;
  workshopName: string;
};

export type AdminCalendarState = {
  applicationUrl?: string;
  error?: string;
  events: AdminCalendarEvent[];
  latestEvent?: AdminCalendarEvent;
  nextEvent?: AdminCalendarEvent;
  status: string;
  title: string;
  workshop: SiteScheduleScopeSlug;
  workshopName: string;
};

type CalendarViewProps = {
  events: AdminCalendarEvent[];
  workshops: AdminCalendarState[];
  initialMonth: string;
  todayDateKey: string;
  linkEditAction?: (formData: FormData) => Promise<void>;
  linkEditReturnTo?: string;
  lockedWorkshop?: SiteWorkshopSlug;
};

type CalendarMode = "days" | "months" | "years";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const workshopDotOrder: SiteScheduleScopeSlug[] = ["general", "program-a", "program-b", "program-c", "program-d"];
const lectureDaySymbols = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];
const seoulTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function CalendarView({
  events,
  workshops,
  initialMonth,
  linkEditAction,
  linkEditReturnTo,
  lockedWorkshop,
  todayDateKey
}: CalendarViewProps) {
  const [month, setMonth] = useState(initialMonth);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("days");
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(null);
  const [pickerYear, setPickerYear] = useState(() => getMonthYear(initialMonth));
  const [holidayNamesByDate, setHolidayNamesByDate] = useState<Record<string, string>>({});
  const [selectedWorkshops, setSelectedWorkshops] = useState<SiteScheduleScopeSlug[]>(
    lockedWorkshop ? [lockedWorkshop] : workshops.map((workshop) => workshop.workshop),
  );

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const weeks = useMemo(() => buildCalendarWeeks(days), [days]);
  const selectedYear = getMonthYear(month);
  const selectedMonthNumber = getMonthNumber(month);
  const todayMonth = todayDateKey.slice(0, 7);
  const todayYear = getMonthYear(todayMonth);
  const todayMonthNumber = getMonthNumber(todayMonth);
  const yearRangeStart = getYearRangeStart(pickerYear);
  const years = Array.from({ length: 12 }, (_, index) => yearRangeStart + index);
  const visibleStartKey = days[0]?.key ?? `${month}-01`;
  const visibleEndKey = days[days.length - 1]?.key ?? `${month}-31`;
  const visibleEvents = events
    .filter(
      (event) =>
        selectedWorkshops.includes(event.workshop) &&
        event.dateKey <= visibleEndKey &&
        event.endDateKey >= visibleStartKey,
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const todayEvents = events
    .filter(
      (event) =>
        selectedWorkshops.includes(event.workshop) && event.dateKey <= todayDateKey && event.endDateKey >= todayDateKey,
    )
    .sort(sortCalendarEvents);

  useEffect(() => {
    let ignore = false;

    async function loadHolidayNames() {
      const dateKeys = Array.from(new Set(days.map((day) => day.key)));
      const entries = await Promise.all(
        dateKeys.map(async (dateKey) => {
          const names = await getOfficialHolidayNames(dateKey);
          return names ? ([dateKey, names.map(formatOfficialHolidayName).join(" · ")] as const) : null;
        }),
      );

      if (!ignore) {
        setHolidayNamesByDate(Object.fromEntries(entries.filter((entry) => entry !== null)));
      }
    }

    void loadHolidayNames();

    return () => {
      ignore = true;
    };
  }, [days]);

  const toolbarLabel =
    calendarMode === "years"
      ? `${yearRangeStart} - ${yearRangeStart + 11}`
      : calendarMode === "months"
        ? `${pickerYear}년`
        : month.replace("-", ".");
  const currentButtonLabel =
    calendarMode === "years"
      ? "월 선택으로 돌아가기"
      : calendarMode === "months"
        ? `${pickerYear}년 연도 선택`
        : `${month.replace("-", ".")} 월 선택`;

  function toggleWorkshop(slug: SiteScheduleScopeSlug) {
    if (lockedWorkshop) {
      return;
    }

    setSelectedWorkshops((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  function stepCalendar(offset: number) {
    if (calendarMode === "years") {
      setPickerYear((current) => current + offset * 12);
      return;
    }

    if (calendarMode === "months") {
      setPickerYear((current) => current + offset);
      return;
    }

    setMonth((current) => shiftMonth(current, offset));
  }

  function handleCurrentButtonClick() {
    if (calendarMode === "days") {
      setPickerYear(getMonthYear(month));
      setCalendarMode("months");
      return;
    }

    setCalendarMode(calendarMode === "months" ? "years" : "months");
  }

  function selectMonth(monthNumber: number) {
    setMonth(formatMonth(pickerYear, monthNumber));
    setCalendarMode("days");
  }

  function selectYear(year: number) {
    setPickerYear(year);
    setCalendarMode("months");
  }

  function goToday() {
    setMonth(todayMonth);
    setPickerYear(todayYear);
    setCalendarMode("days");
  }

  function getMonthLectureEvents(targetMonth: string) {
    return events.filter(
      (event) =>
        !event.isApplication &&
        selectedWorkshops.includes(event.workshop) &&
        event.dateKey.slice(0, 7) <= targetMonth &&
        event.endDateKey.slice(0, 7) >= targetMonth,
    );
  }

  function getYearLectureEvents(year: number) {
    const firstMonth = `${year}-01`;
    const lastMonth = `${year}-12`;
    return events.filter(
      (event) =>
        !event.isApplication &&
        selectedWorkshops.includes(event.workshop) &&
        event.dateKey.slice(0, 7) <= lastMonth &&
        event.endDateKey.slice(0, 7) >= firstMonth,
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <div className="calendar-primary-controls">
          <div className="calendar-month-navigation" aria-label="달력 이동">
            <button className="calendar-step-button" type="button" aria-label="이전으로 이동" onClick={() => stepCalendar(-1)}>
              <ChevronIcon direction="prev" />
            </button>
            <button
              className="calendar-current-button"
              type="button"
              aria-controls="calendar-picker-panel"
              aria-expanded={calendarMode !== "days"}
              aria-label={currentButtonLabel}
              onClick={handleCurrentButtonClick}
            >
              <strong>{toolbarLabel}</strong>
              <span className="calendar-current-icon" aria-hidden="true">
                <ChevronIcon direction={calendarMode === "years" ? "up" : "down"} />
              </span>
            </button>
            <button className="calendar-step-button" type="button" aria-label="다음으로 이동" onClick={() => stepCalendar(1)}>
              <ChevronIcon direction="next" />
            </button>
          </div>
          <button className="calendar-today-button" type="button" onClick={goToday}>
            오늘
          </button>
        </div>

        {!lockedWorkshop ? (
          <div className="calendar-filter calendar-toolbar-filter" aria-label="프로그램 일정 필터">
            {workshops.map((workshop) => (
              <button
                className={[
                  `calendar-filter-${workshop.workshop}`,
                  selectedWorkshops.includes(workshop.workshop) ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={workshop.workshop}
                onClick={() => toggleWorkshop(workshop.workshop)}
              >
                {workshop.workshopName}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {calendarMode === "months" ? (
        <div className="calendar-picker-panel" id="calendar-picker-panel">
          <div className="calendar-picker-grid month-picker-grid" aria-label={`${pickerYear}년 월 선택`}>
            {monthLabels.map((label, index) => {
              const monthNumber = index + 1;
              const targetMonth = formatMonth(pickerYear, monthNumber);
              const lectureEvents = getMonthLectureEvents(targetMonth);
              const workshopDots = getWorkshopDots(lectureEvents);
              const isActive = pickerYear === selectedYear && monthNumber === selectedMonthNumber;
              const isToday = pickerYear === todayYear && monthNumber === todayMonthNumber;
              const optionClassName = [
                "calendar-picker-option",
                isActive ? "active" : "",
                isToday ? "today" : "",
                workshopDots.length > 0 ? "has-lecture-events" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button className={optionClassName} key={label} type="button" onClick={() => selectMonth(monthNumber)}>
                  <CalendarPickerDots workshops={workshopDots} />
                  <strong>{label}</strong>
                  {lectureEvents.length > 0 ? <small>{lectureEvents.length}개 본강의</small> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {calendarMode === "years" ? (
        <div className="calendar-picker-panel" id="calendar-picker-panel">
          <div className="calendar-picker-grid year-picker-grid" aria-label="연도 선택">
            {years.map((year) => {
              const lectureEvents = getYearLectureEvents(year);
              const workshopDots = getWorkshopDots(lectureEvents);
              const optionClassName = [
                "calendar-picker-option",
                year === selectedYear ? "active" : "",
                year === todayYear ? "today" : "",
                workshopDots.length > 0 ? "has-lecture-events" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button className={optionClassName} key={year} type="button" onClick={() => selectYear(year)}>
                  <CalendarPickerDots workshops={workshopDots} />
                  <strong>{year}</strong>
                  {lectureEvents.length > 0 ? <small>{lectureEvents.length}개 본강의</small> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {calendarMode === "days" ? (
        <>
          <div className="calendar-weekdays" aria-hidden="true">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-weeks">
            {weeks.map((week) => {
              const rangeSegments = buildWeekRangeSegments(visibleEvents, week);
              const rangeLaneCount = getRangeLaneCount(rangeSegments);

              return (
                <div
                  className="calendar-week"
                  key={week[0].key}
                  style={{ "--range-lanes": rangeLaneCount } as CSSProperties}
                >
                  {rangeSegments.length > 0 ? (
                    <div className="calendar-week-bars">
                      {rangeSegments.map((segment) => (
                        <button
                          aria-label={segment.accessibleLabel}
                          className={`${getRangeBarClassName(segment)} calendar-event-trigger`}
                          key={`${segment.event.id}-${week[0].key}`}
                          style={{
                            gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}`,
                            gridRow: segment.lane + 1,
                          }}
                          title={segment.accessibleLabel}
                          type="button"
                          onClick={() => setSelectedEvent(segment.event)}
                        >
                          {segment.runLabel ? <span className="calendar-schedule-run">{segment.runLabel}</span> : null}
                          <span className="calendar-schedule-title">{segment.label}</span>
                          {renderScheduleKindLabel(segment.kindLabel)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="calendar-grid real-calendar-grid calendar-week-days">
                    {week.map((day, dayIndex) => {
                      const dayEvents = visibleEvents
                        .filter((event) => !event.isApplication && event.dateKey <= day.key && event.endDateKey >= day.key)
                        .sort(sortCalendarEvents);
                      const isSunday = getDateWeekday(day.key) === 0;
                      const officialHolidayLabel = holidayNamesByDate[day.key];
                      const dayClassName = [
                        "calendar-day",
                        "real-calendar-day",
                        day.inMonth ? "" : "muted",
                        isSunday ? "closed-day" : "",
                        officialHolidayLabel ? "official-holiday" : "",
                        day.key === todayDateKey ? "today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div
                          className={dayClassName}
                          key={day.key}
                          style={{ "--range-lanes": getRangeLaneCountForDay(rangeSegments, dayIndex) } as CSSProperties}
                        >
                          <div className="calendar-day-head">
                            <span>{day.label}</span>
                            {officialHolidayLabel ? <small>{officialHolidayLabel}</small> : null}
                          </div>
                          <div className="day-events">
                            {dayEvents.map((event) => {
                              const accessibleLabel = getCalendarEventTitle(event, day.key);
                              const kindLabel = getVisibleScheduleKindLabel(event, day.key);
                              const runLabel = getCalendarRunBadgeLabel(event);

                              return (
                                <button
                                  aria-label={accessibleLabel}
                                  className={`${getDayEventClassName(event)} calendar-event-trigger`}
                                  key={event.id}
                                  title={accessibleLabel}
                                  type="button"
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  {runLabel ? <span className="calendar-schedule-run">{runLabel}</span> : null}
                                  <span className="calendar-schedule-title">{getCalendarEventVisibleTitle(event)}</span>
                                  {renderScheduleKindLabel(kindLabel)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <section className="calendar-today-list" aria-labelledby="calendar-today-list-title">
            <div className="calendar-today-list-head">
              <h3 id="calendar-today-list-title">오늘의 일정</h3>
              <span>{formatDateKeyLabel(todayDateKey)}</span>
            </div>
            {todayEvents.length > 0 ? (
              <div className="calendar-today-items">
                {todayEvents.map((event) => (
                  <button
                    className={[
                      "calendar-today-item",
                      "calendar-event-trigger",
                      event.visibility === "DRAFT" ? "calendar-event-private" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <span className={`calendar-today-badge calendar-today-badge-${event.workshop}`}>
                      {event.workshopName}
                    </span>
                    <strong>{getCalendarEventListTitle(event, todayDateKey)}</strong>
                    <small>{getCalendarEventRangeLabel(event)}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="calendar-today-empty">등록된 일정이 없습니다.</p>
            )}
          </section>
        </>
      ) : null}

      {selectedEvent ? (
        <AdminCalendarEventModal
          event={selectedEvent}
          linkEditAction={linkEditAction}
          linkEditReturnTo={linkEditReturnTo}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </div>
  );
}

function AdminCalendarEventModal({
  event,
  linkEditAction,
  linkEditReturnTo,
  onClose
}: {
  event: AdminCalendarEvent;
  linkEditAction?: (formData: FormData) => Promise<void>;
  linkEditReturnTo?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const modalTitle = getCalendarEventModalTitle(event);
  const scheduleLabel = getCalendarEventScheduleLabel(event);
  const scheduleValue =
    event.endLabel && event.endLabel !== event.startLabel ? `${event.startLabel} ~ ${event.endLabel}` : event.startLabel;
  const canEditLinks = Boolean(linkEditAction && linkEditReturnTo && event.linkTargetId && event.linkTargetKind);

  return (
    <div className="calendar-event-backdrop" role="presentation">
      <article
        className={[
          "calendar-event-modal",
          `calendar-event-modal-${event.workshop}`,
          event.isApplication ? "is-application" : "is-session",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-calendar-event-modal-title"
      >
        <header className="calendar-event-header">
          <h2 className="calendar-event-title" id="admin-calendar-event-modal-title">
            {modalTitle}
          </h2>
          <button className="calendar-event-close" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <div className="calendar-event-body">
          <div className="calendar-event-info-row">
            <p className="calendar-event-schedule-line">
              <strong>{scheduleLabel}:</strong> {scheduleValue}
            </p>

            {canEditLinks ? null : (
              <div className="calendar-event-actions">
                {event.noticePostUrl ? (
                  <a
                    className="calendar-event-link"
                    href={event.noticePostUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={event.noticePostTitle ?? undefined}
                  >
                    공지
                  </a>
                ) : null}

                {event.url ? (
                  <a className="calendar-event-link" href={event.url} target="_blank" rel="noreferrer">
                    신청
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {canEditLinks && linkEditAction && linkEditReturnTo && event.linkTargetId && event.linkTargetKind ? (
            <form className="calendar-event-link-edit-form" action={linkEditAction}>
              <input type="hidden" name="returnTo" value={linkEditReturnTo} />
              <input type="hidden" name="scheduleEventKind" value={event.linkTargetKind} />
              <input type="hidden" name="scheduleEventId" value={event.linkTargetId} />

              <div className="calendar-event-link-edit-grid">
                <label className="calendar-event-link-edit-field">
                  <span className="sr-only">개별 신청 form URL</span>
                  <input
                    autoComplete="off"
                    className="text-input"
                    defaultValue={event.applicationFormUrlOverride ?? ""}
                    inputMode="url"
                    name="applicationFormUrl"
                    placeholder="신청 form"
                  />
                </label>

                <label className="calendar-event-link-edit-field">
                  <span className="sr-only">개별 관련 공지글</span>
                  <input
                    autoComplete="off"
                    className="text-input"
                    defaultValue={event.noticePostIdOverride ?? ""}
                    inputMode="text"
                    name="noticePostId"
                    placeholder="관련 공지글"
                  />
                </label>
              </div>

              <CalendarEventLinkSaveButton />
            </form>
          ) : null}

          {event.description ? (
            <div className="calendar-event-note calendar-event-note-rich" dangerouslySetInnerHTML={{ __html: event.description }} />
          ) : null}
        </div>
      </article>
    </div>
  );
}

function CalendarEventLinkSaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="calendar-event-link-save-button"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}

function getCalendarEventModalTitle(event: AdminCalendarEvent) {
  const title = getCalendarEventVisibleTitle(event);

  if (event.workshop !== "general" && event.runYear && event.runNumber && event.stageDisplayName) {
    return `${event.runYear}년 제${event.runNumber}차 ${event.workshopName} ${event.stageDisplayName}`;
  }

  if (event.workshop !== "general" && event.runLabel && title) {
    return `${event.runLabel} ${title}`;
  }

  return title || event.title.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
}

function getCalendarEventScheduleLabel(event: AdminCalendarEvent) {
  if (event.workshop === "general") {
    return "일정";
  }

  if (event.isApplication) {
    return "신청기간";
  }

  return event.dayLabel ? `본강의 ${event.dayLabel}` : "본강의";
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const previousMonthDays = new Date(Date.UTC(year, monthNumber - 1, 0)).getUTCDate();
  const cells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: cells }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;

    if (dayNumber < 1) {
      const previousMonth = shiftMonth(month, -1);
      const label = previousMonthDays + dayNumber;
      return { key: `${previousMonth}-${String(label).padStart(2, "0")}`, label, inMonth: false };
    }

    if (dayNumber > daysInMonth) {
      const nextMonth = shiftMonth(month, 1);
      const label = dayNumber - daysInMonth;
      return { key: `${nextMonth}-${String(label).padStart(2, "0")}`, label, inMonth: false };
    }

    return { key: `${month}-${String(dayNumber).padStart(2, "0")}`, label: dayNumber, inMonth: true };
  });
}

type CalendarDay = ReturnType<typeof buildCalendarDays>[number];

type RangeSegment = {
  event: AdminCalendarEvent;
  startIndex: number;
  endIndex: number;
  lane: number;
  label: string;
  runLabel?: string;
  kindLabel: string | null;
  accessibleLabel: string;
  isActualStart: boolean;
  isActualEnd: boolean;
};

function buildCalendarWeeks(days: CalendarDay[]) {
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
}

function CalendarPickerDots({ workshops }: { workshops: SiteScheduleScopeSlug[] }) {
  if (workshops.length === 0) {
    return null;
  }

  return (
    <span className="calendar-picker-dots" aria-hidden="true">
      {workshops.map((workshop) => (
        <span className={`calendar-picker-dot calendar-picker-dot-${workshop}`} key={workshop} />
      ))}
    </span>
  );
}

function getWorkshopDots(events: AdminCalendarEvent[]) {
  const workshopsWithLectures = new Set(events.map((event) => event.workshop));

  return workshopDotOrder.filter((workshop) => workshopsWithLectures.has(workshop));
}

function buildWeekRangeSegments(events: AdminCalendarEvent[], week: CalendarDay[]): RangeSegment[] {
  const weekStartKey = week[0].key;
  const weekEndKey = week[week.length - 1].key;
  const laneEndIndexes: number[] = [];

  return events
    .filter((event) => event.isApplication && event.dateKey <= weekEndKey && event.endDateKey >= weekStartKey)
    .sort(sortCalendarEvents)
    .map((event) => {
      const startIndex = Math.max(
        0,
        week.findIndex((day) => day.key >= event.dateKey),
      );
      const endIndex = findLastWeekDayIndex(week, event.endDateKey);
      const reusableLane = laneEndIndexes.findIndex((laneEndIndex) => laneEndIndex < startIndex);
      const lane = reusableLane === -1 ? laneEndIndexes.length : reusableLane;
      laneEndIndexes[lane] = endIndex;

      return {
        event,
        startIndex,
        endIndex,
        lane,
        label: getCalendarEventVisibleTitle(event),
        runLabel: getCalendarRunBadgeLabel(event),
        kindLabel: getVisibleScheduleKindLabel(event, week[startIndex].key),
        accessibleLabel: getCalendarEventTitle(event, week[startIndex].key),
        isActualStart: week[startIndex].key === event.dateKey,
        isActualEnd: week[endIndex].key === event.endDateKey,
      };
    });
}

function getRangeLaneCount(segments: RangeSegment[]) {
  if (segments.length === 0) {
    return 0;
  }

  return Math.max(...segments.map((segment) => segment.lane)) + 1;
}

function getRangeLaneCountForDay(segments: RangeSegment[], dayIndex: number) {
  const activeSegments = segments.filter((segment) => segment.startIndex <= dayIndex && segment.endIndex >= dayIndex);

  if (activeSegments.length === 0) {
    return 0;
  }

  return Math.max(...activeSegments.map((segment) => segment.lane)) + 1;
}

function findLastWeekDayIndex(week: CalendarDay[], endDateKey: string) {
  for (let index = week.length - 1; index >= 0; index -= 1) {
    if (week[index].key <= endDateKey) {
      return index;
    }
  }

  return week.length - 1;
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthYear(month: string) {
  return Number(month.slice(0, 4));
}

function getMonthNumber(month: string) {
  return Number(month.slice(5, 7));
}

function formatMonth(year: number, monthNumber: number) {
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

function formatDateKeyLabel(dateKey: string) {
  return dateKey.replace(/-/g, ".");
}

function getCalendarEventTitle(event: AdminCalendarEvent, dateKey: string) {
  const runLabel = getCalendarRunBadgeLabel(event);
  const visibleTitle = getCalendarEventVisibleTitle(event);
  const kindLabel = getVisibleScheduleKindLabel(event, dateKey);
  const parts = [runLabel, visibleTitle, kindLabel ? `[${kindLabel}]` : null].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (/\[[^\]]+\]\s*$/.test(event.title)) {
    return event.title;
  }

  if (event.dateKey === event.endDateKey) {
    return `${event.title} [본강의]`;
  }

  return `${event.title} [본강의 ${getLectureDaySymbol(getInclusiveDayNumber(event.dateKey, dateKey))}]`;
}

function getRangeBarClassName(segment: RangeSegment) {
  return [
    "calendar-range-bar",
    `day-event-${segment.event.workshop}`,
    segment.event.visibility === "DRAFT" ? "calendar-event-private" : "",
    segment.isActualStart ? "range-start" : "",
    segment.isActualEnd ? "range-end" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getDayEventClassName(event: AdminCalendarEvent) {
  return [
    "day-event",
    `day-event-${event.workshop}`,
    "day-event-point",
    event.visibility === "DRAFT" ? "calendar-event-private" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getCalendarEventVisibleTitle(event: AdminCalendarEvent) {
  if (event.runYear && event.runNumber && event.stageDisplayName) {
    return event.stageDisplayName;
  }

  const runLabel = event.runLabel ?? "";
  const withoutRun = runLabel ? event.title.replace(runLabel, "").trim() : event.title;

  return withoutRun
    .replace(/^[│|]\s*/, "")
    .replace(/\s*\[[^\]]+\]\s*$/, "")
    .trim();
}

function getCalendarEventListTitle(event: AdminCalendarEvent, dateKey: string) {
  const kindLabel = getVisibleScheduleKindLabel(event, dateKey);

  if (event.runYear && event.runNumber && event.stageDisplayName) {
    return kindLabel
      ? `${event.runYear}년 제${event.runNumber}회 │ ${event.stageDisplayName} │ ${kindLabel}`
      : `${event.runYear}년 제${event.runNumber}회 │ ${event.stageDisplayName}`;
  }

  return kindLabel ? `${getCalendarEventBaseTitle(event)} │ ${kindLabel}` : getCalendarEventBaseTitle(event);
}

function getCalendarRunBadgeLabel(event: AdminCalendarEvent) {
  return event.runLabel;
}

function getCalendarEventBaseTitle(event: AdminCalendarEvent) {
  return event.title.replace(/\s*\[(?:신청기간|본강의(?: [^\]]+)?)\]\s*$/, "");
}

function getVisibleScheduleKindLabel(event: AdminCalendarEvent, dateKey: string) {
  if (event.workshop === "general") {
    return null;
  }

  if (event.isApplication) {
    return "신청기간";
  }

  const daySymbol = getEventLectureDaySymbol(event, dateKey);
  return daySymbol ? `본강의 ${daySymbol}` : "본강의";
}

function getEventLectureDaySymbol(event: AdminCalendarEvent, dateKey: string) {
  const dayMatch = event.dayLabel?.match(/^(\d+)일차$/);
  if (dayMatch) {
    return getLectureDaySymbol(Number(dayMatch[1]));
  }

  if (event.dateKey !== event.endDateKey) {
    return getLectureDaySymbol(getInclusiveDayNumber(event.dateKey, dateKey));
  }

  return null;
}

function renderScheduleKindLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const match = label.match(/^(.*)\s([①②③④⑤⑥⑦⑧⑨⑩⑪⑫]|\d+)$/);
  if (!match) {
    return <span className="calendar-schedule-kind">{label}</span>;
  }

  return (
    <span className="calendar-schedule-kind">
      {match[1]} <span className="calendar-schedule-kind-marker">{match[2]}</span>
    </span>
  );
}

function getCalendarEventRangeLabel(event: AdminCalendarEvent) {
  if (isAllDayRange(event)) {
    return event.dateKey === event.endDateKey
      ? formatDateKeyLabel(event.dateKey)
      : `${formatDateKeyLabel(event.dateKey)} - ${formatDateKeyLabel(event.endDateKey)}`;
  }

  return event.endLabel !== event.startLabel ? `${event.startLabel} - ${event.endLabel}` : event.startLabel;
}

function isAllDayRange(event: AdminCalendarEvent) {
  return getSeoulTimeKey(event.start) === "00:00" && getSeoulTimeKey(event.end) === "23:59";
}

function getSeoulTimeKey(value: string) {
  const parts = seoulTimeFormatter.formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour === "24" ? "00" : hour}:${minute}`;
}

function sortCalendarEvents(left: AdminCalendarEvent, right: AdminCalendarEvent) {
  if (left.isApplication !== right.isApplication) {
    return left.isApplication ? -1 : 1;
  }

  if (left.isApplication && right.isApplication) {
    return left.end.localeCompare(right.end) || left.title.localeCompare(right.title);
  }

  return left.start.localeCompare(right.start) || left.title.localeCompare(right.title);
}

function getInclusiveDayNumber(startDateKey: string, targetDateKey: string) {
  const start = Date.parse(`${startDateKey}T00:00:00Z`);
  const target = Date.parse(`${targetDateKey}T00:00:00Z`);
  const day = Math.floor((target - start) / 86_400_000) + 1;

  return Math.max(day, 1);
}

function getLectureDaySymbol(day: number) {
  return lectureDaySymbols[day - 1] ?? String(day);
}

async function getOfficialHolidayNames(dateKey: string) {
  try {
    return await getHolidayNames(new Date(`${dateKey}T00:00:00+09:00`));
  } catch {
    return null;
  }
}

function formatOfficialHolidayName(name: string) {
  return name.startsWith("대체공휴일") ? "대체공휴일" : name;
}

function getDateWeekday(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function getYearRangeStart(year: number) {
  return Math.floor((year - 2020) / 12) * 12 + 2020;
}

function ChevronIcon({ direction }: { direction: "prev" | "next" | "down" | "up" }) {
  const paths = {
    prev: "M15 6 9 12l6 6",
    next: "m9 6 6 6-6 6",
    down: "m6 9 6 6 6-6",
    up: "m6 15 6-6 6 6",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={paths[direction]} />
    </svg>
  );
}
