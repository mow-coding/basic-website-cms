"use client";

import { useEffect } from "react";
import type { NoticeItem } from "@/components/notice-browser";
import type { CalendarEvent } from "@/lib/calendar";

type CalendarEventModalProps = {
  event: CalendarEvent;
  onClose: () => void;
  onOpenNotice?: (notice: NoticeItem) => void;
  relatedNotice?: NoticeItem;
};

const lectureDaySymbols = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];

export function CalendarEventModal({ event, onClose, onOpenNotice, relatedNotice }: CalendarEventModalProps) {
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

  const isApplication = event.isApplication;
  const canOpenNotice = relatedNotice && onOpenNotice;
  const modalTitle = getCalendarEventModalTitle(event);
  const scheduleLabel = getCalendarEventScheduleLabel(event);
  const scheduleValue =
    event.endLabel && event.endLabel !== event.startLabel ? `${event.startLabel} ~ ${event.endLabel}` : event.startLabel;

  return (
    <div className="calendar-event-backdrop" role="presentation">
      <article
        className={[
          "calendar-event-modal",
          `calendar-event-modal-${event.workshop}`,
          isApplication ? "is-application" : "is-session",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-modal-title"
      >
        <header className="calendar-event-header">
          <h2 className="calendar-event-title" id="calendar-event-modal-title">
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

            <div className="calendar-event-actions">
              {canOpenNotice ? (
                <button className="calendar-event-link" type="button" onClick={() => onOpenNotice(relatedNotice)}>
                  공지
                </button>
              ) : null}

              {event.url ? (
                <a className="calendar-event-link" href={event.url} target="_blank" rel="noreferrer">
                  신청
                </a>
              ) : null}
            </div>
          </div>

          {event.description ? (
            <div className="calendar-event-note calendar-event-note-rich" dangerouslySetInnerHTML={{ __html: event.description }} />
          ) : null}
        </div>
      </article>
    </div>
  );
}

function getCalendarEventModalTitle(event: CalendarEvent) {
  if (event.runYear && event.runNumber && event.stageDisplayName) {
    return `${event.runYear}년 제${event.runNumber}차 ${event.workshopName} ${event.stageDisplayName}`;
  }

  return event.title.replace(/\s*\[(?:신청기간|본강의(?: [^\]]+)?)\]\s*$/, "");
}

function getCalendarEventScheduleLabel(event: CalendarEvent) {
  if (event.workshop === "general") {
    return "일정";
  }

  if (event.isApplication) {
    return "신청기간";
  }

  return event.dayLabel ? `본강의 ${getLectureDaySymbol(getDayLabelNumber(event.dayLabel))}` : "본강의";
}

function getLectureDaySymbol(day: number) {
  return lectureDaySymbols[day - 1] ?? String(day);
}

function getDayLabelNumber(dayLabel: string) {
  const match = dayLabel.match(/\d+/);
  return match ? Number(match[0]) : 1;
}
