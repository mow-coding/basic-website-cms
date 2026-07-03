"use client";

import { useRef, useState, type FormEvent } from "react";

import { RichTextEditor } from "@/app/site-admin/rich-text-editor";
import { UnsavedEditorGuard, useEditorFormDirty } from "@/app/site-admin/unsaved-editor-guard";
import { selectableSiteVisibilityOptions, siteVisibilityLabels } from "@/lib/site-admin/constants";
import {
  scheduleApplicationFormUrlPlaceholder,
  scheduleNoticePostIdPlaceholder,
  validateScheduleApplicationFormUrlInput,
  validateScheduleNoticePostFieldInput,
  type ScheduleLinkFieldValidation
} from "@/lib/site-admin/schedule-link-inputs";
import { SiteContentVisibility } from "@prisma/client";

type WorkshopOption = {
  slug: "program-a" | "program-b" | "program-c" | "program-d";
  label: string;
};

type StagePreset = {
  name: string;
  defaultActive: boolean;
  defaultDayCount: number;
  group?: string;
};

type FormSession = {
  id?: string;
  uid: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
};

type FormStage = {
  id?: string;
  uid: string;
  name: string;
  group?: string;
  active: boolean;
  applicationStartsAt: string;
  applicationEndsAt: string;
  sessions: FormSession[];
};

type SessionDateConflict = {
  canSwap: boolean;
  conflictDate: string;
  conflictSessionIndex: number;
  conflictSessionUid: string;
  relation: "next" | "previous";
  requestedDate: string;
  sessionIndex: number;
  sessionUid: string;
  stageName: string;
  stageUid: string;
};

type Props = {
  workshopOptions: WorkshopOption[];
  workshopStagePresets: Record<WorkshopOption["slug"], StagePreset[]>;
  createGeneralAction: (formData: FormData) => Promise<void>;
  createWorkshopRunAction: (formData: FormData) => Promise<void>;
  editTitleLabel?: string;
  formId?: string;
  initialValue?: ScheduleFormInitialValue;
  mode?: "create" | "edit";
  returnTo?: string;
  submitLabel?: string;
  updateGeneralAction?: (formData: FormData) => Promise<void>;
  updateWorkshopRunAction?: (formData: FormData) => Promise<void>;
};

type ScheduleKind = "general" | "workshop";
type GeneralDateScope = "single" | "range";
type GeneralTimeScope = "allDay" | "timed";
type ScheduleVisibilityValue = SiteContentVisibility | "PUBLIC" | "DRAFT" | "";
type InitialScheduleVisibility = Exclude<ScheduleVisibilityValue, "">;

export type ScheduleFormInitialValue =
  | {
      description: string | null;
      endsAtIso: string;
      id: string;
      kind: "general";
      startsAtIso: string;
      title: string;
      visibility: InitialScheduleVisibility;
    }
  | {
      applicationFormUrl: string | null;
      description: string | null;
      id: string;
      kind: "workshop";
      noticePostId: string | null;
      stages: Array<{
        applicationEndsAtIso: string | null;
        applicationStartsAtIso: string | null;
        id: string;
        sessions: Array<{
          endTime: string;
          id: string;
          sessionDateIso: string;
          startTime: string;
        }>;
        stageName: string;
      }>;
      visibility: InitialScheduleVisibility;
      workshopSlug: WorkshopOption["slug"];
      year: number;
    };

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "17:00";
const MAX_WORKSHOP_SESSION_COUNT = 6;
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const seoulDateTimePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

export function NewScheduleForm({
  workshopOptions,
  workshopStagePresets,
  createGeneralAction,
  createWorkshopRunAction,
  editTitleLabel,
  formId,
  initialValue,
  mode = "create",
  returnTo,
  submitLabel = "일정 저장",
  updateGeneralAction,
  updateWorkshopRunAction
}: Props) {
  const isEditing = mode === "edit";
  const resolvedFormId = formId ?? (isEditing ? "site-schedule-edit-form" : "site-schedule-create-form");
  const isFormDirty = useEditorFormDirty(resolvedFormId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialGeneralRange = initialValue?.kind === "general" ? getInitialGeneralDateRange(initialValue) : null;
  const initialWorkshopStages =
    initialValue?.kind === "workshop" ? buildInitialWorkshopStages(initialValue, workshopStagePresets) : [];
  const [kind, setKind] = useState<ScheduleKind>(initialValue?.kind ?? "workshop");
  const [workshopSlug, setWorkshopSlug] = useState<WorkshopOption["slug"] | "">(
    initialValue?.kind === "workshop" ? initialValue.workshopSlug : ""
  );
  const [stages, setStages] = useState<FormStage[]>(initialWorkshopStages);
  const [activeSessionUidByStage, setActiveSessionUidByStage] = useState<Record<string, string>>(
    () => getInitialActiveSessionMap(initialWorkshopStages)
  );
  const [sessionDateConflict, setSessionDateConflict] = useState<SessionDateConflict | null>(null);
  const [applicationFormUrl, setApplicationFormUrl] = useState(
    initialValue?.kind === "workshop" ? initialValue.applicationFormUrl ?? "" : ""
  );
  const [noticePostId, setNoticePostId] = useState(initialValue?.kind === "workshop" ? initialValue.noticePostId ?? "" : "");
  const [visibility, setVisibility] = useState<ScheduleVisibilityValue>(initialValue?.visibility ?? "");
  const [generalTitle, setGeneralTitle] = useState(initialValue?.kind === "general" ? initialValue.title : "");
  const initialGeneralDescription = initialValue?.kind === "general" ? initialValue.description ?? "" : "";
  const generalDescriptionRef = useRef(initialGeneralDescription);
  const [generalDateScope, setGeneralDateScope] = useState<GeneralDateScope>(
    initialGeneralRange?.isRange ? "range" : "single"
  );
  const [generalTimeScope, setGeneralTimeScope] = useState<GeneralTimeScope>(
    initialGeneralRange?.isTimed ? "timed" : "allDay"
  );
  const [generalStartDate, setGeneralStartDate] = useState(initialGeneralRange?.startDate ?? "");
  const [generalEndDate, setGeneralEndDate] = useState(initialGeneralRange?.endDate ?? "");
  const [generalStartDateInput, setGeneralStartDateInput] = useState(
    initialGeneralRange?.startDate ? formatKoreanDate(initialGeneralRange.startDate) : ""
  );
  const [generalEndDateInput, setGeneralEndDateInput] = useState(
    initialGeneralRange?.endDate ? formatKoreanDate(initialGeneralRange.endDate) : ""
  );
  const [generalStartTime, setGeneralStartTime] = useState(initialGeneralRange?.startTime ?? DEFAULT_START_TIME);
  const [generalEndTime, setGeneralEndTime] = useState(initialGeneralRange?.endTime ?? DEFAULT_END_TIME);
  const [generalStartTimeInput, setGeneralStartTimeInput] = useState(() =>
    formatKoreanTime(initialGeneralRange?.startTime ?? DEFAULT_START_TIME)
  );
  const [generalEndTimeInput, setGeneralEndTimeInput] = useState(() =>
    formatKoreanTime(initialGeneralRange?.endTime ?? DEFAULT_END_TIME)
  );
  const todayDateKey = toDateKey(new Date());
  const [generalCalendarMonth, setGeneralCalendarMonth] = useState(() => toMonthKey(todayDateKey));
  const generalCalendarDays = buildCalendarDays(generalCalendarMonth);
  const applicationFormValidation = validateScheduleApplicationFormUrlInput(applicationFormUrl);
  const noticePostValidation = validateScheduleNoticePostFieldInput(noticePostId);

  function pickWorkshop(slug: WorkshopOption["slug"]) {
    setWorkshopSlug(slug);
    setNoticePostId("");
    const presets = workshopStagePresets[slug];
    const nextStages = presets.map((preset, index) => {
      const sessions = Array.from({ length: preset.defaultDayCount }, (_, dayIdx) => createBlankSession(`${slug}-${index}-${dayIdx}`));

      return {
        uid: `${slug}-${index}`,
        name: preset.name,
        group: preset.group,
        active: preset.defaultActive,
        applicationStartsAt: "",
        applicationEndsAt: "",
        sessions
      };
    });

    setStages(nextStages);
    setActiveSessionUidByStage(
      Object.fromEntries(nextStages.map((stage) => [stage.uid, stage.sessions[0]?.uid ?? ""]))
    );
  }

  function clearWorkshop() {
    setWorkshopSlug("");
    setStages([]);
    setActiveSessionUidByStage({});
    setNoticePostId("");
  }

  function toggleStageActive(stageUid: string) {
    setStages((current) => {
      const target = current.find((stage) => stage.uid === stageUid);
      if (!target) {
        return current;
      }

      if (target.active) {
        return current.map((stage) => (stage.uid === stageUid ? { ...stage, active: false } : stage));
      }

      // Activating a stage. If it has a group, deactivate other stages in that group.
      return current.map((stage) => {
        if (stage.uid === stageUid) {
          return { ...stage, active: true };
        }

        if (target.group && stage.group === target.group) {
          return { ...stage, active: false };
        }

        return stage;
      });
    });
  }

  function updateStage(stageUid: string, updater: (stage: FormStage) => FormStage) {
    setStages((current) => current.map((stage) => (stage.uid === stageUid ? updater(stage) : stage)));
  }

  function addSession(stageUid: string) {
    const stage = stages.find((currentStage) => currentStage.uid === stageUid);
    if (!stage) {
      return;
    }

    if (stage.sessions.length >= MAX_WORKSHOP_SESSION_COUNT) {
      return;
    }

    const nextSession = createBlankSession(`${stageUid}-day-${stage.sessions.length}-${randomSuffix()}`);
    updateStage(stageUid, (stage) => ({
      ...stage,
      sessions: [...stage.sessions, nextSession]
    }));
    setActiveSessionUidByStage((current) => ({ ...current, [stageUid]: nextSession.uid }));
  }

  function removeSession(stageUid: string, sessionUid: string) {
    const stage = stages.find((currentStage) => currentStage.uid === stageUid);
    if (!stage || stage.sessions.length <= 1) {
      return;
    }

    const nextSessions = stage.sessions.filter((session) => session.uid !== sessionUid);
    setStages((current) =>
      current.map((currentStage) => (currentStage.uid === stageUid ? { ...currentStage, sessions: nextSessions } : currentStage))
    );
    setActiveSessionUidByStage((current) =>
      current[stageUid] === sessionUid ? { ...current, [stageUid]: nextSessions[0]?.uid ?? "" } : current
    );
  }

  function updateSession(stageUid: string, sessionUid: string, updater: (session: FormSession) => FormSession) {
    updateStage(stageUid, (stage) => ({
      ...stage,
      sessions: stage.sessions.map((session) => (session.uid === sessionUid ? updater(session) : session))
    }));
  }

  function updateSessionDate(stageUid: string, sessionUid: string, dateKey: string) {
    const stage = stages.find((currentStage) => currentStage.uid === stageUid);
    if (!stage) {
      return false;
    }

    const sessionIndex = stage.sessions.findIndex((session) => session.uid === sessionUid);
    const session = stage.sessions[sessionIndex];
    const previousSession = stage.sessions[sessionIndex - 1];
    const nextSession = stage.sessions[sessionIndex + 1];

    if (!session) {
      updateSession(stageUid, sessionUid, (current) => ({ ...current, sessionDate: dateKey }));
      return true;
    }

    if (previousSession?.sessionDate && dateKey <= previousSession.sessionDate) {
      setSessionDateConflict({
        canSwap: dateKey < previousSession.sessionDate,
        conflictDate: previousSession.sessionDate,
        conflictSessionIndex: sessionIndex - 1,
        conflictSessionUid: previousSession.uid,
        relation: "previous",
        requestedDate: dateKey,
        sessionIndex,
        sessionUid,
        stageName: stage.name,
        stageUid
      });
      return false;
    }

    if (nextSession?.sessionDate && dateKey >= nextSession.sessionDate) {
      setSessionDateConflict({
        canSwap: dateKey > nextSession.sessionDate,
        conflictDate: nextSession.sessionDate,
        conflictSessionIndex: sessionIndex + 1,
        conflictSessionUid: nextSession.uid,
        relation: "next",
        requestedDate: dateKey,
        sessionIndex,
        sessionUid,
        stageName: stage.name,
        stageUid
      });
      return false;
    }

    updateSession(stageUid, sessionUid, (current) => ({ ...current, sessionDate: dateKey }));
    return true;
  }

  function swapConflictingSessionDates() {
    if (!sessionDateConflict?.canSwap) {
      setSessionDateConflict(null);
      return;
    }

    setStages((current) =>
      current.map((stage) => {
        if (stage.uid !== sessionDateConflict.stageUid) {
          return stage;
        }

        return {
          ...stage,
          sessions: stage.sessions.map((session) => {
            if (session.uid === sessionDateConflict.conflictSessionUid) {
              return { ...session, sessionDate: sessionDateConflict.requestedDate };
            }

            if (session.uid === sessionDateConflict.sessionUid) {
              return { ...session, sessionDate: sessionDateConflict.conflictDate };
            }

            return session;
          })
        };
      })
    );
    setSessionDateConflict(null);
  }

  function buildWorkshopPayload(selectedVisibility: Exclude<ScheduleVisibilityValue, "">) {
    if (!workshopSlug) {
      return null;
    }

    const activeStages = stages.filter((stage) => stage.active);
    if (activeStages.length === 0) {
      return null;
    }

    return {
      workshopSlug,
      visibility: selectedVisibility,
      applicationFormUrl: applicationFormValidation.normalizedValue,
      noticePostId: noticePostValidation.normalizedValue,
      description: initialValue?.kind === "workshop" ? initialValue.description : null,
      stages: activeStages.map((stage) => ({
        id: stage.id ?? null,
        stageName: stage.name,
        applicationStartsAt: stage.applicationStartsAt ? `${stage.applicationStartsAt}T00:00` : null,
        applicationEndsAt: stage.applicationEndsAt ? `${stage.applicationEndsAt}T23:59` : null,
        sessions: stage.sessions.map((session) => ({
          id: session.id ?? null,
          // The date input is date-only; the server parser expects a Seoul
          // wall-clock datetime, so anchor it to midnight of that day.
          sessionDate: session.sessionDate ? `${session.sessionDate}T00:00` : "",
          startTime: session.startTime,
          endTime: session.endTime
        }))
      }))
    };
  }

  function buildGeneralScheduleRange() {
    const parsedStartDate = parseKoreanDateInput(generalStartDateInput);
    const parsedEndDate = generalDateScope === "range" ? parseKoreanDateInput(generalEndDateInput) : parsedStartDate;
    const startDate = parsedStartDate ?? generalStartDate;
    const endDate = generalDateScope === "range" ? parsedEndDate ?? generalEndDate : startDate;
    const parsedStartTime = parseKoreanTimeInput(generalStartTimeInput);
    const parsedEndTime = parseKoreanTimeInput(generalEndTimeInput);
    const startTime = generalTimeScope === "timed" ? parsedStartTime : "00:00";
    const endTime = generalTimeScope === "timed" ? parsedEndTime : "23:59";

    if (!parsedStartDate || (generalDateScope === "range" && !parsedEndDate) || !startDate || !endDate || !startTime || !endTime) {
      return null;
    }

    return {
      startsAt: `${startDate}T${startTime}`,
      endsAt: `${endDate}T${endTime}`
    };
  }

  function pickGeneralDate(dateKey: string) {
    setGeneralCalendarMonth(toMonthKey(dateKey));

    if (generalDateScope === "single") {
      setGeneralStartDate(dateKey);
      setGeneralStartDateInput(formatKoreanDate(dateKey));
      setGeneralEndDate("");
      setGeneralEndDateInput("");
      return;
    }

    if (!generalStartDate || generalEndDate) {
      setGeneralStartDate(dateKey);
      setGeneralStartDateInput(formatKoreanDate(dateKey));
      setGeneralEndDate("");
      setGeneralEndDateInput("");
      return;
    }

    if (dateKey < generalStartDate) {
      setGeneralEndDate(generalStartDate);
      setGeneralEndDateInput(formatKoreanDate(generalStartDate));
      setGeneralStartDate(dateKey);
      setGeneralStartDateInput(formatKoreanDate(dateKey));
      return;
    }

    setGeneralEndDate(dateKey);
    setGeneralEndDateInput(formatKoreanDate(dateKey));
  }

  function toggleGeneralEndDate() {
    setGeneralDateScope((current) => {
      if (current === "range") {
        setGeneralEndDate("");
        setGeneralEndDateInput("");
        return "single";
      }

      setGeneralEndDate((currentEndDate) => {
        const nextEndDate = currentEndDate || generalStartDate;
        setGeneralEndDateInput(nextEndDate ? formatKoreanDate(nextEndDate) : "");
        return nextEndDate;
      });
      return "range";
    });
  }

  function toggleGeneralTime() {
    setGeneralTimeScope((current) => {
      if (current === "timed") {
        return "allDay";
      }

      setGeneralStartTimeInput(formatKoreanTime(generalStartTime));
      setGeneralEndTimeInput(formatKoreanTime(generalEndTime));
      return "timed";
    });
  }

  function pickToday() {
    setGeneralCalendarMonth(toMonthKey(todayDateKey));
    pickGeneralDate(todayDateKey);
  }

  function updateGeneralStartDateInput(value: string) {
    setGeneralStartDateInput(value);
    const parsed = parseKoreanDateInput(value);
    if (!parsed) {
      return;
    }

    setGeneralStartDate(parsed);
    setGeneralCalendarMonth(toMonthKey(parsed));
    if (generalDateScope === "single") {
      setGeneralEndDate("");
      setGeneralEndDateInput("");
    }
  }

  function updateGeneralEndDateInput(value: string) {
    setGeneralEndDateInput(value);
    const parsed = parseKoreanDateInput(value);
    if (!parsed) {
      return;
    }

    setGeneralEndDate(parsed);
    setGeneralCalendarMonth(toMonthKey(parsed));
  }

  function updateGeneralStartTimeInput(value: string) {
    setGeneralStartTimeInput(value);
    const parsed = parseKoreanTimeInput(value);
    if (parsed) {
      setGeneralStartTime(parsed);
    }
  }

  function updateGeneralEndTimeInput(value: string) {
    setGeneralEndTimeInput(value);
    const parsed = parseKoreanTimeInput(value);
    if (parsed) {
      setGeneralEndTime(parsed);
    }
  }

  function normalizeGeneralStartTimeInput() {
    const parsed = parseKoreanTimeInput(generalStartTimeInput);
    if (parsed) {
      setGeneralStartTime(parsed);
      setGeneralStartTimeInput(formatKoreanTime(parsed));
    }
  }

  function normalizeGeneralEndTimeInput() {
    const parsed = parseKoreanTimeInput(generalEndTimeInput);
    if (parsed) {
      setGeneralEndTime(parsed);
      setGeneralEndTimeInput(formatKoreanTime(parsed));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();

    if (!visibility) {
      event.currentTarget.reportValidity();
      return;
    }

    if (kind === "general") {
      if (generalTimeScope === "timed" && (!parseKoreanTimeInput(generalStartTimeInput) || !parseKoreanTimeInput(generalEndTimeInput))) {
        alert("시간은 오후 9:00 형식으로 입력해 주세요.");
        return;
      }

      const dateRange = buildGeneralScheduleRange();
      if (!dateRange) {
        alert("날짜는 2026. 6. 1. 형식으로 입력해 주세요.");
        return;
      }

      if (new Date(dateRange.startsAt).getTime() >= new Date(dateRange.endsAt).getTime()) {
        alert("종료 일시는 시작 일시보다 뒤여야 합니다.");
        return;
      }

      formData.set("scheduleTitle", generalTitle.trim());
      formData.set("scheduleDescription", generalDescriptionRef.current.trim());
      formData.set("scheduleStartsAt", dateRange.startsAt);
      formData.set("scheduleEndsAt", dateRange.endsAt);
      formData.set("scheduleVisibility", visibility);
      if (returnTo) {
        formData.set("returnTo", returnTo);
      }
      setIsSubmitting(true);
      try {
        if (isEditing && initialValue?.kind === "general") {
          if (!updateGeneralAction) {
            alert("일정 수정 기능을 불러오지 못했습니다.");
            setIsSubmitting(false);
            return;
          }
          formData.set("id", initialValue.id);
          await updateGeneralAction(formData);
          return;
        }
        await createGeneralAction(formData);
      } catch (error) {
        setIsSubmitting(false);
        throw error;
      }
      return;
    }

    const linkValidationMessage = getWorkshopLinkValidationMessage(applicationFormValidation, noticePostValidation);
    if (linkValidationMessage) {
      alert(linkValidationMessage);
      return;
    }

    const validationMessage = validateWorkshopSchedule(stages);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const payload = buildWorkshopPayload(visibility);
    if (!payload) {
      alert("프로그램을 선택하고 활성화된 강의가 하나 이상 있어야 저장할 수 있습니다.");
      return;
    }

    formData.set("workshopRunPayload", JSON.stringify(payload));
    if (returnTo) {
      formData.set("returnTo", returnTo);
    }
    setIsSubmitting(true);
    try {
      if (isEditing && initialValue?.kind === "workshop") {
        if (!updateWorkshopRunAction) {
          alert("일정 수정 기능을 불러오지 못했습니다.");
          setIsSubmitting(false);
          return;
        }
        formData.set("id", initialValue.id);
        await updateWorkshopRunAction(formData);
        return;
      }
      await createWorkshopRunAction(formData);
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
  }

  return (
    <form autoComplete="off" className="form-grid schedule-form" id={resolvedFormId} onSubmit={handleSubmit}>
      <UnsavedEditorGuard formId={resolvedFormId} />
      <div className={`schedule-create-toolbar ${isEditing ? "schedule-edit-toolbar" : ""}`}>
        {isEditing ? (
          <>
            {editTitleLabel ? <span className="admin-schedule-edit-title-badge">{editTitleLabel}</span> : null}
            <p className="schedule-edit-toolbar-message">기존 일정의 공개 상태 및 날짜 정보만 수정할 수 있습니다</p>
          </>
        ) : (
          <>
            <fieldset className="schedule-kind-fieldset">
              <legend className="sr-only">일정 종류</legend>
              <div className="schedule-kind-toggle" role="radiogroup" aria-label="일정 종류">
                <button
                  type="button"
                  role="radio"
                  aria-checked={kind === "general"}
                  className={`schedule-kind-button ${kind === "general" ? "active" : ""}`}
                  onClick={() => setKind("general")}
                >
                  기본
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={kind === "workshop"}
                  className={`schedule-kind-button ${kind === "workshop" ? "active" : ""}`}
                  onClick={() => setKind("workshop")}
                >
                  프로그램
                </button>
              </div>
            </fieldset>

            <fieldset className="workshop-fieldset schedule-workshop-fieldset">
              <legend className="sr-only">프로그램 선택</legend>
              <div className="workshop-badge-group" role="radiogroup" aria-label="프로그램 선택">
                {workshopOptions.map((workshop) => {
                  const selected = kind === "workshop" && workshopSlug === workshop.slug;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={kind === "general"}
                      key={workshop.slug}
                      className={`workshop-badge-toggle workshop-badge-toggle-${workshop.slug} ${selected ? "active" : ""}`}
                      onClick={() => {
                        if (selected) {
                          clearWorkshop();
                          return;
                        }
                        pickWorkshop(workshop.slug);
                      }}
                    >
                      {workshop.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        <div className="schedule-create-actions">
          <label className="sr-only" htmlFor="schedule-visibility">
            공개 상태
          </label>
          <select
            aria-label="공개 상태"
            className="select-input post-visibility-select"
            id="schedule-visibility"
            required
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as ScheduleVisibilityValue)}
          >
            {!isEditing ? (
              <option value="" disabled>
                공개 상태 선택
              </option>
            ) : null}
            {selectableSiteVisibilityOptions.map((value) => (
              <option key={value} value={value}>
                {siteVisibilityLabels[value]}
              </option>
            ))}
          </select>

          <button type="submit" className="button schedule-submit-button" disabled={!isFormDirty || isSubmitting}>
            {submitLabel}
          </button>
        </div>
      </div>

      <div className="schedule-create-fields">
        {kind === "general" ? (
          <>
            <div className="schedule-general-main-grid">
              <div className="schedule-general-left-stack">
                <div className="form-label">
                  <label className="sr-only" htmlFor="schedule-general-title">
                    일정 제목
                  </label>
                  <input
                    className="text-input"
                    id="schedule-general-title"
                    placeholder="일정의 제목을 입력하세요"
                    required
                    value={generalTitle}
                    onChange={(event) => setGeneralTitle(event.target.value)}
                  />
                </div>
                <div className="schedule-general-memo" aria-label="메모">
                  <RichTextEditor
                    compact
                    height={320}
                    helpText={null}
                    initialValue={initialGeneralDescription}
                    name="scheduleDescription"
                    onChange={(value) => {
                      generalDescriptionRef.current = value;
                    }}
                    placeholder="필요시 메모를 입력하세요"
                  />
                </div>
              </div>

              <section className="schedule-date-editor" aria-label="기본 일정 날짜 선택">
                <div
                  className={[
                    "schedule-date-editor-inputs",
                    generalDateScope === "range" ? "range" : "",
                    generalTimeScope === "timed" ? "timed" : ""
                  ].filter(Boolean).join(" ")}
                >
                  <div className={`schedule-date-editor-input-line ${generalTimeScope === "timed" ? "timed" : ""}`}>
                    <input
                      aria-label="시작일"
                      className="schedule-date-editor-input"
                      placeholder="2026. 6. 1."
                      required
                      value={generalStartDateInput}
                      onBlur={() => setGeneralStartDateInput(generalStartDate ? formatKoreanDate(generalStartDate) : generalStartDateInput)}
                      onChange={(event) => updateGeneralStartDateInput(event.target.value)}
                    />
                    {generalTimeScope === "timed" ? (
                      <input
                        aria-label="시작 시간"
                        className="schedule-date-editor-time-input"
                        placeholder="오후 9:00"
                        required
                        value={generalStartTimeInput}
                        onBlur={normalizeGeneralStartTimeInput}
                        onChange={(event) => updateGeneralStartTimeInput(event.target.value)}
                      />
                    ) : null}
                  </div>
                  {generalDateScope === "range" ? (
                    <div className={`schedule-date-editor-input-line ${generalTimeScope === "timed" ? "timed" : ""}`}>
                      <input
                        aria-label="종료일"
                        className="schedule-date-editor-input"
                        placeholder="2026. 6. 13."
                        required
                        value={generalEndDateInput}
                        onBlur={() => setGeneralEndDateInput(generalEndDate ? formatKoreanDate(generalEndDate) : generalEndDateInput)}
                        onChange={(event) => updateGeneralEndDateInput(event.target.value)}
                      />
                      {generalTimeScope === "timed" ? (
                        <input
                          aria-label="종료 시간"
                          className="schedule-date-editor-time-input"
                          placeholder="오후 9:00"
                          required
                          value={generalEndTimeInput}
                          onBlur={normalizeGeneralEndTimeInput}
                          onChange={(event) => updateGeneralEndTimeInput(event.target.value)}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>

              <div className="schedule-date-editor-monthbar">
                <strong>{formatMonthLabel(generalCalendarMonth)}</strong>
                <button type="button" className="schedule-date-today-button" onClick={pickToday}>
                  오늘
                </button>
                <div className="schedule-date-month-actions">
                  <button
                    type="button"
                    aria-label="이전 달"
                    className="schedule-date-arrow-button"
                    onClick={() => setGeneralCalendarMonth(addMonths(generalCalendarMonth, -1))}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="다음 달"
                    className="schedule-date-arrow-button"
                    onClick={() => setGeneralCalendarMonth(addMonths(generalCalendarMonth, 1))}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="schedule-date-weekdays" aria-hidden="true">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="schedule-date-grid">
                {generalCalendarDays.map((day, dayIndex) => {
                  const selectedStart = day.dateKey === generalStartDate;
                  const selectedEnd = generalDateScope === "range" && day.dateKey === generalEndDate;
                  const inRange = generalDateScope === "range" && isDateInRange(day.dateKey, generalStartDate, generalEndDate);
                  const rangeStartDate = getRangeStartDate(generalStartDate, generalEndDate);
                  const rangeEndDate = getRangeEndDate(generalStartDate, generalEndDate);
                  const isRangeStart = inRange && day.dateKey === rangeStartDate;
                  const isRangeEnd = inRange && day.dateKey === rangeEndDate;
                  const isWeekStart = dayIndex % 7 === 0;
                  const isWeekEnd = dayIndex % 7 === 6;
                  return (
                    <button
                      type="button"
                      key={day.dateKey}
                      className={[
                        "schedule-date-day",
                        day.inMonth ? "" : "muted",
                        day.dateKey === todayDateKey ? "today" : "",
                        inRange ? "in-range" : "",
                        isRangeStart || isWeekStart ? "range-left" : "",
                        isRangeEnd || isWeekEnd ? "range-right" : "",
                        selectedStart || selectedEnd ? "selected" : ""
                      ].filter(Boolean).join(" ")}
                      onClick={() => pickGeneralDate(day.dateKey)}
                    >
                      {day.dayLabel}
                    </button>
                  );
                })}
              </div>

              <div className="schedule-date-settings">
                <button
                  type="button"
                  className="schedule-date-setting-row"
                  onClick={toggleGeneralEndDate}
                >
                  <span>종료일</span>
                  <span className={`schedule-date-switch ${generalDateScope === "range" ? "active" : ""}`} />
                </button>

                <button
                  type="button"
                  className="schedule-date-setting-row"
                  onClick={toggleGeneralTime}
                >
                  <span>시간 포함</span>
                  <span className={`schedule-date-switch ${generalTimeScope === "timed" ? "active" : ""}`} />
                </button>

              </div>
              </section>
            </div>
          </>
        ) : null}

        {kind === "workshop" ? (
          <>
          {!workshopSlug ? <p className="hint">프로그램을 선택하면 단계 목록이 나타납니다.</p> : null}
          {workshopSlug ? (
            <>
              <div className="schedule-workshop-link-grid">
                <div className="form-label">
                  <label className="sr-only" htmlFor="schedule-application-form-url">
                    신청 form 링크
                  </label>
                  <div className={`schedule-link-input-wrap ${applicationFormValidation.error ? "invalid" : ""}`}>
                    <input
                      aria-describedby={applicationFormValidation.error ? "schedule-application-form-url-error" : undefined}
                      aria-invalid={applicationFormValidation.error ? "true" : undefined}
                      className="text-input"
                      id="schedule-application-form-url"
                      inputMode="url"
                      placeholder={scheduleApplicationFormUrlPlaceholder}
                      value={applicationFormUrl}
                      onChange={(event) => setApplicationFormUrl(event.target.value)}
                      onBlur={() => {
                        if (applicationFormValidation.normalizedValue) {
                          setApplicationFormUrl(applicationFormValidation.normalizedValue);
                        }
                      }}
                    />
                    {applicationFormValidation.error ? <span className="schedule-link-warning-icon" aria-hidden="true">!</span> : null}
                  </div>
                  {applicationFormValidation.error ? (
                    <p className="schedule-field-error" id="schedule-application-form-url-error">
                      {applicationFormValidation.error}
                    </p>
                  ) : null}
                </div>

                <div className="form-label">
                  <label className="sr-only" htmlFor="schedule-notice-post-id">
                    관련 프로그램 공지글
                  </label>
                  <div className={`schedule-link-input-wrap ${noticePostValidation.error ? "invalid" : ""}`}>
                    <input
                      aria-describedby={noticePostValidation.error ? "schedule-notice-post-id-error" : undefined}
                      aria-invalid={noticePostValidation.error ? "true" : undefined}
                      className="text-input"
                      id="schedule-notice-post-id"
                      inputMode="text"
                      placeholder={scheduleNoticePostIdPlaceholder}
                      value={noticePostId}
                      onChange={(event) => setNoticePostId(event.target.value)}
                      onBlur={() => {
                        if (noticePostValidation.normalizedValue) {
                          setNoticePostId(noticePostValidation.normalizedValue);
                        }
                      }}
                    />
                    {noticePostValidation.error ? <span className="schedule-link-warning-icon" aria-hidden="true">!</span> : null}
                  </div>
                  {noticePostValidation.error ? (
                    <p className="schedule-field-error" id="schedule-notice-post-id-error">
                      {noticePostValidation.error}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="schedule-stage-list" aria-label="강의 단계">
                {stages.map((stage) => {
                  const selectedSessionUid = activeSessionUidByStage[stage.uid] || stage.sessions[0]?.uid || "";
                  const selectedSessionIndex = Math.max(0, stage.sessions.findIndex((session) => session.uid === selectedSessionUid));
                  const selectedSession = stage.sessions[selectedSessionIndex] ?? stage.sessions[0];

                  return (
                    <article key={stage.uid} className={`schedule-stage-card ${stage.active ? "active" : "inactive"}`}>
                      {stage.active ? (
                        <div className="schedule-stage-body">
                          <div className="schedule-stage-date-layout">
                            <section className="schedule-application-panel" aria-label={`${stage.name} 신청 기간`}>
                              <div className="schedule-application-titlebar">
                                <label className="schedule-application-stage-toggle">
                                  <input
                                    type="checkbox"
                                    checked={stage.active}
                                    onChange={() => toggleStageActive(stage.uid)}
                                  />
                                  <span className="schedule-application-stage-name">{stage.name}</span>
                                </label>
                                <span className="schedule-application-period-label">신청 기간</span>
                              </div>
                              <WorkshopApplicationDatePicker
                                endDate={stage.applicationEndsAt}
                                onEndDateChange={(dateKey) =>
                                  updateStage(stage.uid, (current) => ({
                                    ...current,
                                    applicationEndsAt: dateKey
                                  }))
                                }
                                onStartDateChange={(dateKey) =>
                                  updateStage(stage.uid, (current) => ({
                                    ...current,
                                    applicationStartsAt: dateKey
                                  }))
                                }
                                startDate={stage.applicationStartsAt}
                              />
                            </section>

                            <section className="schedule-session-panel" aria-label={`${stage.name} 본강의 일차`}>
                              <div className="schedule-session-switcher">
                                <div className="schedule-session-tab-list" role="tablist" aria-label="본강의 일차 선택">
                                  {stage.sessions.map((session, sessionIndex) => {
                                    const selected = session.uid === selectedSession?.uid;
                                    return (
                                      <button
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        className={`schedule-session-tab ${selected ? "active" : ""}`}
                                        key={session.uid}
                                        onClick={() =>
                                          setActiveSessionUidByStage((current) => ({
                                            ...current,
                                            [stage.uid]: session.uid
                                          }))
                                        }
                                      >
                                        {sessionIndex + 1}일차
                                      </button>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  className="schedule-session-add-button"
                                  disabled={stage.sessions.length >= MAX_WORKSHOP_SESSION_COUNT}
                                  onClick={() => addSession(stage.uid)}
                                  title={
                                    stage.sessions.length >= MAX_WORKSHOP_SESSION_COUNT
                                      ? "최대 6일차까지만 등록할 수 있습니다."
                                      : "일차 추가"
                                  }
                                >
                                  +
                                </button>
                              </div>

                              {selectedSession ? (
                                <>
                                  <WorkshopSessionDatePicker
                                    key={selectedSession.uid}
                                    endTime={selectedSession.endTime}
                                    onDateChange={(dateKey) => updateSessionDate(stage.uid, selectedSession.uid, dateKey)}
                                    onEndTimeChange={(timeValue) =>
                                      updateSession(stage.uid, selectedSession.uid, (current) => ({
                                        ...current,
                                        endTime: timeValue
                                      }))
                                    }
                                    onStartTimeChange={(timeValue) =>
                                      updateSession(stage.uid, selectedSession.uid, (current) => ({
                                        ...current,
                                        startTime: timeValue
                                      }))
                                    }
                                    sessionDate={selectedSession.sessionDate}
                                    startTime={selectedSession.startTime}
                                  />

                                  {stage.sessions.length > 1 ? (
                                    <button
                                      type="button"
                                      className="button-tertiary schedule-session-remove-button"
                                      onClick={() => removeSession(stage.uid, selectedSession.uid)}
                                    >
                                      현재 일차 제거
                                    </button>
                                  ) : null}
                                </>
                              ) : null}
                            </section>
                          </div>
                        </div>
                      ) : (
                        <div className="schedule-application-titlebar schedule-application-titlebar-inactive">
                          <label className="schedule-application-stage-toggle">
                            <input
                              type="checkbox"
                              checked={stage.active}
                              onChange={() => toggleStageActive(stage.uid)}
                            />
                            <span className="schedule-application-stage-name">{stage.name}</span>
                          </label>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          ) : null}
          </>
        ) : null}
      </div>
      {sessionDateConflict ? (
        <div className="schedule-date-conflict-backdrop" role="presentation">
          <div
            aria-modal="true"
            className="schedule-date-conflict-dialog"
            role="dialog"
            aria-labelledby="schedule-date-conflict-title"
          >
            <h2 id="schedule-date-conflict-title">일정 확인</h2>
            <p>
              <span>
                {sessionDateConflict.sessionIndex + 1}일차 일정은 {sessionDateConflict.conflictSessionIndex + 1}일차 일정보다{" "}
                {sessionDateConflict.relation === "previous" ? "나중" : "앞"}이어야 합니다.
              </span>
              {sessionDateConflict.canSwap
                ? (
                  <span>
                    {Math.min(sessionDateConflict.sessionIndex, sessionDateConflict.conflictSessionIndex) + 1}일차와{" "}
                    {Math.max(sessionDateConflict.sessionIndex, sessionDateConflict.conflictSessionIndex) + 1}일차 일정의 날짜를 바꾸시겠습니까?
                  </span>
                )
                : <span>같은 날짜는 사용할 수 없습니다.</span>}
            </p>
            <div className="schedule-date-conflict-actions">
              <button type="button" className="button-secondary" onClick={() => setSessionDateConflict(null)}>
                취소
              </button>
              <button
                type="button"
                className="button"
                disabled={!sessionDateConflict.canSwap}
                onClick={swapConflictingSessionDates}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function WorkshopApplicationDatePicker({
  endDate,
  onEndDateChange,
  onStartDateChange,
  startDate
}: {
  endDate: string;
  onEndDateChange: (dateKey: string) => void;
  onStartDateChange: (dateKey: string) => void;
  startDate: string;
}) {
  const todayDateKey = toDateKey(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => toMonthKey(startDate || endDate || todayDateKey));
  const [startInput, setStartInput] = useState(() => (startDate ? formatKoreanDate(startDate) : ""));
  const [endInput, setEndInput] = useState(() => (endDate ? formatKoreanDate(endDate) : ""));

  function pickDate(dateKey: string) {
    setCalendarMonth(toMonthKey(dateKey));

    if (!startDate || endDate) {
      onStartDateChange(dateKey);
      onEndDateChange("");
      setStartInput(formatKoreanDate(dateKey));
      setEndInput("");
      return;
    }

    if (dateKey < startDate) {
      onStartDateChange(dateKey);
      onEndDateChange(startDate);
      setStartInput(formatKoreanDate(dateKey));
      setEndInput(formatKoreanDate(startDate));
      return;
    }

    onEndDateChange(dateKey);
    setEndInput(formatKoreanDate(dateKey));
  }

  function updateStartInput(value: string) {
    setStartInput(value);
    const parsed = parseKoreanDateInput(value);
    if (parsed) {
      onStartDateChange(parsed);
      setCalendarMonth(toMonthKey(parsed));
    }
  }

  function updateEndInput(value: string) {
    setEndInput(value);
    const parsed = parseKoreanDateInput(value);
    if (parsed) {
      onEndDateChange(parsed);
      setCalendarMonth(toMonthKey(parsed));
    }
  }

  return (
    <section className="schedule-date-editor schedule-workshop-date-editor" aria-label="프로그램 신청 기간">
      <div className="schedule-date-editor-inputs range">
        <div className="schedule-date-editor-input-line">
          <input
            aria-label="신청 시작일"
            className="schedule-date-editor-input"
            placeholder="2026. 6. 1."
            value={startInput}
            onBlur={() => setStartInput(startDate ? formatKoreanDate(startDate) : startInput)}
            onChange={(event) => updateStartInput(event.target.value)}
          />
        </div>
        <div className="schedule-date-editor-input-line">
          <input
            aria-label="신청 종료일"
            className="schedule-date-editor-input"
            placeholder="2026. 6. 13."
            value={endInput}
            onBlur={() => setEndInput(endDate ? formatKoreanDate(endDate) : endInput)}
            onChange={(event) => updateEndInput(event.target.value)}
          />
        </div>
      </div>

      <ScheduleDateCalendar
        calendarMonth={calendarMonth}
        endDate={endDate}
        onMonthChange={setCalendarMonth}
        onPickDate={pickDate}
        range
        startDate={startDate}
        todayDateKey={todayDateKey}
      />
    </section>
  );
}

function WorkshopSessionDatePicker({
  endTime,
  onDateChange,
  onEndTimeChange,
  onStartTimeChange,
  sessionDate,
  startTime
}: {
  endTime: string;
  onDateChange: (dateKey: string) => boolean;
  onEndTimeChange: (timeValue: string) => void;
  onStartTimeChange: (timeValue: string) => void;
  sessionDate: string;
  startTime: string;
}) {
  const todayDateKey = toDateKey(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => toMonthKey(sessionDate || todayDateKey));
  const [dateInput, setDateInput] = useState(() => (sessionDate ? formatKoreanDate(sessionDate) : ""));

  function pickDate(dateKey: string) {
    if (onDateChange(dateKey)) {
      setCalendarMonth(toMonthKey(dateKey));
      setDateInput(formatKoreanDate(dateKey));
    }
  }

  function updateDateInput(value: string) {
    setDateInput(value);
    const parsed = parseKoreanDateInput(value);
    if (parsed && onDateChange(parsed)) {
      setCalendarMonth(toMonthKey(parsed));
      setDateInput(formatKoreanDate(parsed));
      return;
    }

    if (parsed) {
      setDateInput(sessionDate ? formatKoreanDate(sessionDate) : "");
    }
  }

  return (
    <section className="schedule-date-editor schedule-workshop-date-editor schedule-workshop-session-date-editor" aria-label="본강의 일차 날짜와 시간">
      <div className="schedule-date-editor-inputs timed">
        <div className="schedule-date-editor-input-line workshop-session-timed">
          <input
            aria-label="본강의 날짜"
            className="schedule-date-editor-input"
            placeholder="2026. 6. 1."
            value={dateInput}
            onBlur={() => setDateInput(sessionDate ? formatKoreanDate(sessionDate) : dateInput)}
            onChange={(event) => updateDateInput(event.target.value)}
          />
          <input
            aria-label="본강의 시작 시간"
            className="schedule-date-editor-time-input"
            type="time"
            step={900}
            value={startTime}
            onChange={(event) => onStartTimeChange(event.target.value)}
          />
          <input
            aria-label="본강의 종료 시간"
            className="schedule-date-editor-time-input"
            type="time"
            step={900}
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
          />
        </div>
      </div>

      <ScheduleDateCalendar
        calendarMonth={calendarMonth}
        onMonthChange={setCalendarMonth}
        onPickDate={pickDate}
        startDate={sessionDate}
        todayDateKey={todayDateKey}
      />
    </section>
  );
}

function ScheduleDateCalendar({
  calendarMonth,
  endDate = "",
  onMonthChange,
  onPickDate,
  range = false,
  startDate,
  todayDateKey
}: {
  calendarMonth: string;
  endDate?: string;
  onMonthChange: (monthKey: string) => void;
  onPickDate: (dateKey: string) => void;
  range?: boolean;
  startDate: string;
  todayDateKey: string;
}) {
  const calendarDays = buildCalendarDays(calendarMonth);

  return (
    <>
      <div className="schedule-date-editor-monthbar">
        <strong>{formatMonthLabel(calendarMonth)}</strong>
        <button
          type="button"
          className="schedule-date-today-button"
          onClick={() => {
            onMonthChange(toMonthKey(todayDateKey));
            onPickDate(todayDateKey);
          }}
        >
          오늘
        </button>
        <div className="schedule-date-month-actions">
          <button
            type="button"
            aria-label="이전 달"
            className="schedule-date-arrow-button"
            onClick={() => onMonthChange(addMonths(calendarMonth, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 달"
            className="schedule-date-arrow-button"
            onClick={() => onMonthChange(addMonths(calendarMonth, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="schedule-date-weekdays" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="schedule-date-grid">
        {calendarDays.map((day, dayIndex) => {
          const selectedStart = day.dateKey === startDate;
          const selectedEnd = range && day.dateKey === endDate;
          const inRange = range && isDateInRange(day.dateKey, startDate, endDate);
          const rangeStartDate = getRangeStartDate(startDate, endDate);
          const rangeEndDate = getRangeEndDate(startDate, endDate);
          const isRangeStart = inRange && day.dateKey === rangeStartDate;
          const isRangeEnd = inRange && day.dateKey === rangeEndDate;
          const isWeekStart = dayIndex % 7 === 0;
          const isWeekEnd = dayIndex % 7 === 6;

          return (
            <button
              type="button"
              key={day.dateKey}
              className={[
                "schedule-date-day",
                day.inMonth ? "" : "muted",
                day.dateKey === todayDateKey ? "today" : "",
                inRange ? "in-range" : "",
                isRangeStart || isWeekStart ? "range-left" : "",
                isRangeEnd || isWeekEnd ? "range-right" : "",
                selectedStart || selectedEnd ? "selected" : ""
              ].filter(Boolean).join(" ")}
              onClick={() => onPickDate(day.dateKey)}
            >
              {day.dayLabel}
            </button>
          );
        })}
      </div>
    </>
  );
}

function validateWorkshopSchedule(stages: FormStage[]) {
  const activeStages = stages.filter((stage) => stage.active);

  for (const stage of activeStages) {
    if (!stage.applicationStartsAt || !stage.applicationEndsAt) {
      return `${stage.name} 신청 시작일과 종료일을 모두 선택해 주세요.`;
    }

    if (stage.applicationEndsAt < stage.applicationStartsAt) {
      return `${stage.name} 신청 종료일은 시작일보다 뒤여야 합니다.`;
    }

    for (const [sessionIndex, session] of stage.sessions.entries()) {
      const sessionLabel = `${stage.name} ${sessionIndex + 1}일차`;

      if (!session.sessionDate) {
        return `${sessionLabel} 날짜를 선택해 주세요.`;
      }

      const previousSession = stage.sessions[sessionIndex - 1];
      if (previousSession?.sessionDate && session.sessionDate <= previousSession.sessionDate) {
        return `${sessionLabel} 일정은 ${sessionIndex}일차보다 나중이어야 합니다.`;
      }

      if (!isValidTimeValue(session.startTime) || !isValidTimeValue(session.endTime)) {
        return `${sessionLabel} 시간을 확인해 주세요.`;
      }

      if (timeStringToMinutes(session.startTime) >= timeStringToMinutes(session.endTime)) {
        return `${sessionLabel} 종료 시간은 시작 시간보다 뒤여야 합니다.`;
      }
    }
  }

  return "";
}

function isValidTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeStringToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function createBlankSession(uid: string): FormSession {
  return {
    uid,
    sessionDate: "",
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME
  };
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 9);
}

function getInitialGeneralDateRange(initialValue: Extract<ScheduleFormInitialValue, { kind: "general" }>) {
  const startParts = getSeoulDateTimePartsFromIso(initialValue.startsAtIso);
  const endParts = getSeoulDateTimePartsFromIso(initialValue.endsAtIso);
  const startDate = `${startParts.year}-${startParts.month}-${startParts.day}`;
  const endDate = `${endParts.year}-${endParts.month}-${endParts.day}`;
  const startTime = `${startParts.hour}:${startParts.minute}`;
  const endTime = `${endParts.hour}:${endParts.minute}`;

  return {
    endDate,
    endTime,
    isRange: startDate !== endDate,
    isTimed: startTime !== "00:00" || endTime !== "23:59",
    startDate,
    startTime
  };
}

function buildInitialWorkshopStages(
  initialValue: Extract<ScheduleFormInitialValue, { kind: "workshop" }>,
  workshopStagePresets: Record<WorkshopOption["slug"], StagePreset[]>
) {
  const savedStageByName = new Map(initialValue.stages.map((stage) => [stage.stageName, stage]));
  const presets = workshopStagePresets[initialValue.workshopSlug] ?? [];
  const presetStageNames = new Set(presets.map((preset) => preset.name));

  const presetStages = presets.map((preset, stageIndex) => {
    const savedStage = savedStageByName.get(preset.name);
    const sessions = savedStage?.sessions.length
      ? savedStage.sessions.map((session, sessionIndex) => ({
          id: session.id,
          uid: `${initialValue.id}-${stageIndex}-${session.id || sessionIndex}`,
          sessionDate: getSeoulDateKeyFromIso(session.sessionDateIso),
          startTime: session.startTime,
          endTime: session.endTime
        }))
      : Array.from({ length: preset.defaultDayCount }, (_, dayIndex) =>
          createBlankSession(`${initialValue.id}-${stageIndex}-blank-${dayIndex}`)
        );

    return {
      id: savedStage?.id,
      uid: `${initialValue.id}-${stageIndex}`,
      name: preset.name,
      group: preset.group,
      active: Boolean(savedStage),
      applicationStartsAt: savedStage?.applicationStartsAtIso ? getSeoulDateKeyFromIso(savedStage.applicationStartsAtIso) : "",
      applicationEndsAt: savedStage?.applicationEndsAtIso ? getSeoulDateKeyFromIso(savedStage.applicationEndsAtIso) : "",
      sessions
    };
  });

  const unmatchedSavedStages = initialValue.stages
    .filter((stage) => !presetStageNames.has(stage.stageName))
    .map((savedStage, stageIndex) => ({
      id: savedStage.id,
      uid: `${initialValue.id}-saved-${stageIndex}`,
      name: savedStage.stageName,
      group: undefined,
      active: true,
      applicationStartsAt: savedStage.applicationStartsAtIso ? getSeoulDateKeyFromIso(savedStage.applicationStartsAtIso) : "",
      applicationEndsAt: savedStage.applicationEndsAtIso ? getSeoulDateKeyFromIso(savedStage.applicationEndsAtIso) : "",
      sessions: savedStage.sessions.length
        ? savedStage.sessions.map((session, sessionIndex) => ({
            id: session.id,
            uid: `${initialValue.id}-saved-${stageIndex}-${session.id || sessionIndex}`,
            sessionDate: getSeoulDateKeyFromIso(session.sessionDateIso),
            startTime: session.startTime,
            endTime: session.endTime
          }))
        : [createBlankSession(`${initialValue.id}-saved-${stageIndex}-blank`)]
    }));

  return [...presetStages, ...unmatchedSavedStages];
}

function getInitialActiveSessionMap(stages: FormStage[]) {
  return Object.fromEntries(stages.map((stage) => [stage.uid, stage.sessions[0]?.uid ?? ""]));
}

function getSeoulDateKeyFromIso(value: string) {
  const parts = getSeoulDateTimePartsFromIso(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getSeoulDateTimePartsFromIso(value: string) {
  const parts = Object.fromEntries(
    seoulDateTimePartsFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: parts.year ?? "0000",
    month: parts.month ?? "01",
    day: parts.day ?? "01",
    hour: parts.hour === "24" ? "00" : parts.hour ?? "00",
    minute: parts.minute ?? "00"
  };
}

function getWorkshopLinkValidationMessage(
  applicationFormValidation: ScheduleLinkFieldValidation,
  noticePostValidation: ScheduleLinkFieldValidation
) {
  if (applicationFormValidation.error) {
    return applicationFormValidation.error;
  }

  if (noticePostValidation.error) {
    return noticePostValidation.error;
  }

  return "";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function addMonths(monthKey: string, offset: number) {
  const date = parseMonthKey(monthKey);
  date.setMonth(date.getMonth() + offset);
  return toMonthKey(toDateKey(date));
}

function buildCalendarDays(monthKey: string) {
  const monthStart = parseMonthKey(monthKey);
  const firstGridDay = new Date(monthStart);
  firstGridDay.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return {
      dateKey: toDateKey(date),
      dayLabel: date.getDate(),
      inMonth: date.getMonth() === monthStart.getMonth()
    };
  });
}

function formatMonthLabel(monthKey: string) {
  const date = parseMonthKey(monthKey);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatKoreanDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

function parseKoreanDateInput(value: string) {
  const match = value.trim().match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return toDateKey(date);
}

function formatKoreanTime(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${`${minute}`.padStart(2, "0")}`;
}

function parseKoreanTimeInput(value: string) {
  const trimmed = value.trim();
  const meridiemMatch = trimmed.match(/^(오전|오후)\s*(\d{1,2})(?::\s*(\d{1,2}))?$/);

  if (meridiemMatch) {
    const period = meridiemMatch[1];
    const hour = Number(meridiemMatch[2]);
    const minute = Number(meridiemMatch[3] ?? "0");

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }

    const normalizedHour = period === "오전" ? hour % 12 : (hour % 12) + 12;
    return `${`${normalizedHour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHourMatch) {
    return null;
  }

  const hour = Number(twentyFourHourMatch[1]);
  const minute = Number(twentyFourHourMatch[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
}

function getRangeStartDate(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return "";
  }

  return startDate < endDate ? startDate : endDate;
}

function getRangeEndDate(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return "";
  }

  return startDate < endDate ? endDate : startDate;
}

function isDateInRange(dateKey: string, startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return false;
  }

  const rangeStart = getRangeStartDate(startDate, endDate);
  const rangeEnd = getRangeEndDate(startDate, endDate);
  return dateKey >= rangeStart && dateKey <= rangeEnd;
}
