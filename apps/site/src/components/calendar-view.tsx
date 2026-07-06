"use client";

import { getHolidayNames } from "@hyunbinseo/holidays-kr";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { CalendarEventModal } from "@/components/calendar-event-modal";
import { NoticeDetailModal, type NoticeItem } from "@/components/notice-browser";
import type { CalendarEvent, WorkshopCalendarState } from "@/lib/calendar";
import type { CalendarScopeSlug, NoticeCategory, NoticeLabel, WorkshopSlug } from "@/lib/site-data";

type CalendarViewProps = {
  events: CalendarEvent[];
  workshops: WorkshopCalendarState[];
  initialMonth: string;
  lockedWorkshop?: WorkshopSlug;
  notices?: NoticeItem[];
};

type CalendarMode = "days" | "months" | "years";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const workshopDotOrder: CalendarScopeSlug[] = ["general", "program-a", "program-b", "program-c", "program-d"];
const lectureDaySymbols = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];
const knownNoticeLabels = new Set<NoticeLabel>(["프로그램A", "프로그램B", "프로그램C", "프로그램D", "상담", "자료실"]);
const workshopNoticeCategory: NoticeCategory = "프로그램 공지";
const seoulTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function CalendarView({ events, workshops, initialMonth, lockedWorkshop, notices = [] }: CalendarViewProps) {
  const [month, setMonth] = useState(initialMonth);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("days");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [pickerYear, setPickerYear] = useState(() => getMonthYear(initialMonth));
  const [holidayNamesByDate, setHolidayNamesByDate] = useState<Record<string, string>>({});
  const [selectedWorkshops, setSelectedWorkshops] = useState<CalendarScopeSlug[]>(
    lockedWorkshop ? [lockedWorkshop] : workshops.map((workshop) => workshop.workshop),
  );

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const weeks = useMemo(() => buildCalendarWeeks(days), [days]);
  const selectedYear = getMonthYear(month);
  const selectedMonthNumber = getMonthNumber(month);
  const todayMonth = getCurrentMonth();
  const todayDateKey = getCurrentDateKey();
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

  useEffect(() => {
    if (!selectedNotice) {
      return;
    }

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") {
        setSelectedNotice(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNotice]);

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

  function toggleWorkshop(slug: CalendarScopeSlug) {
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
                          className={`${getRangeBarClassName(segment)} calendar-event-trigger`}
                          key={`${segment.event.id}-${week[0].key}`}
                          style={{
                            gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}`,
                            gridRow: segment.lane + 1,
                          }}
                          aria-label={segment.accessibleLabel}
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
                        .filter(
                          (event) =>
                            !isRangeSegmentEvent(event) &&
                            event.dateKey <= day.key &&
                            event.endDateKey >= day.key,
                        )
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
                                  className={`day-event day-event-${event.workshop} day-event-point calendar-event-trigger`}
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
                    className="calendar-today-item calendar-event-trigger"
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
        <CalendarEventModal
          event={selectedEvent}
          relatedNotice={getRelatedNotice(selectedEvent, notices)}
          onClose={() => setSelectedEvent(null)}
          onOpenNotice={(notice) => {
            setSelectedEvent(null);
            setSelectedNotice(notice);
          }}
        />
      ) : null}

      {selectedNotice ? (
        <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
      ) : null}
    </div>
  );
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
  event: CalendarEvent;
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

function CalendarPickerDots({ workshops }: { workshops: CalendarScopeSlug[] }) {
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

function getRelatedNotice(event: CalendarEvent, notices: NoticeItem[]) {
  if (!event.noticePostId) {
    return undefined;
  }

  const relatedNotice = notices.find((notice) => String(notice.id) === event.noticePostId);
  if (relatedNotice) {
    return relatedNotice;
  }

  if (!event.noticePost) {
    return undefined;
  }

  return {
    id: event.noticePost.id,
    title: event.noticePost.title,
    category: workshopNoticeCategory,
    labels: event.noticePost.labels.filter((label): label is NoticeLabel => knownNoticeLabels.has(label as NoticeLabel)),
    author: "관리자",
    createdAt: "작성일 미상",
    updatedAt: "-",
    official: true,
    body: [],
    relatedLinks: [],
    attachments: []
  };
}

function getWorkshopDots(events: CalendarEvent[]) {
  const workshopsWithLectures = new Set(events.map((event) => event.workshop));

  return workshopDotOrder.filter((workshop) => workshopsWithLectures.has(workshop));
}

function buildWeekRangeSegments(events: CalendarEvent[], week: CalendarDay[]): RangeSegment[] {
  const weekStartKey = week[0].key;
  const weekEndKey = week[week.length - 1].key;
  const laneEndIndexes: number[] = [];

  return events
    .filter((event) => isRangeSegmentEvent(event) && event.dateKey <= weekEndKey && event.endDateKey >= weekStartKey)
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

function isRangeSegmentEvent(event: CalendarEvent) {
  return event.isApplication || event.dateKey !== event.endDateKey;
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

function getCurrentMonth() {
  const today = new Date();
  return formatMonth(today.getFullYear(), today.getMonth() + 1);
}

function getCurrentDateKey() {
  const today = new Date();
  return `${formatMonth(today.getFullYear(), today.getMonth() + 1)}-${String(today.getDate()).padStart(2, "0")}`;
}

function formatDateKeyLabel(dateKey: string) {
  return dateKey.replace(/-/g, ".");
}

function getScheduleTag(event: CalendarEvent, dateKey: string) {
  if (event.workshop === "general") {
    return "";
  }

  if (event.isApplication) {
    return "[신청기간]";
  }

  if (event.dayLabel) {
    return `[본강의 ${getLectureDaySymbol(getDayLabelNumber(event.dayLabel))}]`;
  }

  if (event.dateKey === event.endDateKey) {
    return "[본강의]";
  }

  return `[본강의 ${getLectureDaySymbol(getInclusiveDayNumber(event.dateKey, dateKey))}]`;
}

function getCalendarEventTitle(event: CalendarEvent, dateKey: string) {
  const scheduleTag = getScheduleTag(event, dateKey);
  if (/\[[^\]]+\]\s*$/.test(event.title)) {
    return event.title;
  }

  return scheduleTag ? `${event.title} ${scheduleTag}` : event.title;
}

function getCalendarEventVisibleTitle(event: CalendarEvent) {
  if (event.runYear && event.runNumber && event.stageDisplayName) {
    return event.stageDisplayName;
  }

  const runLabel = event.runLabel ?? getCalendarRunBadgeLabel(event);

  if (runLabel) {
    return getCalendarEventBaseTitle(event)
      .replace(runLabel, "")
      .replace(/^\s*(?:│|\||-)\s*/, "")
      .trim();
  }

  return getCalendarEventBaseTitle(event).replace(/\s*│\s*/g, " ").trim();
}

function getCalendarRunBadgeLabel(event: CalendarEvent) {
  if (event.runYear && event.runNumber) {
    return `${String(event.runYear).slice(-2)}-${event.runNumber} ${event.workshopName}`;
  }

  if (event.runLabel) {
    return event.runLabel;
  }

  const firstTitleSegment = getCalendarEventBaseTitle(event).split(/[│|]/)[0]?.trim();

  return firstTitleSegment && /^\d{2,4}-\d+/.test(firstTitleSegment) ? firstTitleSegment : undefined;
}

function getVisibleScheduleKindLabel(event: CalendarEvent, dateKey: string) {
  if (event.workshop === "general") {
    return null;
  }

  if (event.isApplication) {
    return "신청기간";
  }

  if (event.dayLabel) {
    return `본강의 ${getLectureDaySymbol(getDayLabelNumber(event.dayLabel))}`;
  }

  if (event.dateKey === event.endDateKey) {
    return "본강의";
  }

  return `본강의 ${getLectureDaySymbol(getInclusiveDayNumber(event.dateKey, dateKey))}`;
}

function renderScheduleKindLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const match = label.match(/^(본강의)\s+(.+)$/);

  if (!match) {
    return <span className="calendar-schedule-kind">{label}</span>;
  }

  return (
    <span className="calendar-schedule-kind">
      {match[1]}
      {"\u00a0"}
      <span className="calendar-schedule-kind-marker">{match[2]}</span>
    </span>
  );
}

function getCalendarEventBaseTitle(event: CalendarEvent) {
  return event.title.replace(/\s*\[(?:신청기간|본강의(?: [^\]]+)?)\]\s*$/, "");
}

function getCalendarEventListTitle(event: CalendarEvent, dateKey: string) {
  const kindLabel = getVisibleScheduleKindLabel(event, dateKey);

  if (event.runYear && event.runNumber && event.stageDisplayName) {
    return kindLabel
      ? `${event.runYear}년 제${event.runNumber}회 │ ${event.stageDisplayName} │ ${kindLabel}`
      : `${event.runYear}년 제${event.runNumber}회 │ ${event.stageDisplayName}`;
  }

  return kindLabel ? `${getCalendarEventBaseTitle(event)} │ ${kindLabel}` : getCalendarEventBaseTitle(event);
}

function getRangeBarClassName(segment: RangeSegment) {
  return [
    "calendar-range-bar",
    `day-event-${segment.event.workshop}`,
    segment.isActualStart ? "range-start" : "",
    segment.isActualEnd ? "range-end" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getCalendarEventRangeLabel(event: CalendarEvent) {
  if (isAllDayRange(event)) {
    return event.dateKey === event.endDateKey
      ? formatDateKeyLabel(event.dateKey)
      : `${formatDateKeyLabel(event.dateKey)} - ${formatDateKeyLabel(event.endDateKey)}`;
  }

  return event.endLabel !== event.startLabel ? `${event.startLabel} - ${event.endLabel}` : event.startLabel;
}

function isAllDayRange(event: CalendarEvent) {
  return getSeoulTimeKey(event.start) === "00:00" && getSeoulTimeKey(event.end) === "23:59";
}

function getSeoulTimeKey(value: string) {
  const parts = seoulTimeFormatter.formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour === "24" ? "00" : hour}:${minute}`;
}

function sortCalendarEvents(left: CalendarEvent, right: CalendarEvent) {
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

function getDayLabelNumber(dayLabel: string) {
  const match = dayLabel.match(/\d+/);
  return match ? Number(match[0]) : 1;
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
