"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  bulkScheduleTrashAction,
  createGeneralScheduleAction,
  createWorkshopRunAction,
  toggleGeneralScheduleVisibilityAction,
  toggleWorkshopRunVisibilityAction,
  updateGeneralScheduleAction,
  updateWorkshopScheduleEventLinksAction,
  updateWorkshopRunAction
} from "@/app/site-admin/actions";
import { BulkSelectionControls } from "@/app/site-admin/bulk-selection-controls";
import { CalendarView, type AdminCalendarEvent, type AdminCalendarState } from "@/app/site-admin/calendar-view";
import { NewScheduleForm, type ScheduleFormInitialValue } from "@/app/site-admin/new-schedule-form";
import { useEditorFormDirty } from "@/app/site-admin/unsaved-editor-guard";
import { siteScheduleScopeOptions, siteWorkshopOptions, type SiteScheduleScopeSlug, type SiteWorkshopSlug } from "@/lib/site-admin/constants";
import { getWorkshopShortName, workshopStagePresets } from "@/lib/site-admin/workshop-stage-presets";

type ScheduleVisibility = "PUBLIC" | "DRAFT";
type ScheduleManagementTab = "general" | SiteWorkshopSlug | "trash";
type ScheduleSortMode = "latest" | "oldest";

export type ScheduleManagementGeneralItem = {
  dateIso: string;
  description: string | null;
  endsAtIso: string;
  id: string;
  title: string;
  visibility: ScheduleVisibility;
};

export type ScheduleManagementWorkshopRunItem = {
  applicationFormUrl: string | null;
  description: string | null;
  id: string;
  noticePostId: string | null;
  noticePostTitle: string | null;
  noticePostUrl: string | null;
  runNumber: number;
  stages: ScheduleManagementWorkshopStage[];
  visibility: ScheduleVisibility;
  workshopSlug: string;
  year: number;
};

type ScheduleManagementWorkshopStage = {
  applicationFormUrl: string | null;
  applicationEndsAtIso: string | null;
  applicationStartsAtIso: string | null;
  id: string;
  noticePostId: string | null;
  noticePostTitle: string | null;
  noticePostUrl: string | null;
  sessions: ScheduleManagementWorkshopSession[];
  stageName: string;
};

type ScheduleManagementWorkshopSession = {
  applicationFormUrl: string | null;
  dayIndex: number;
  endTime: string;
  id: string;
  noticePostId: string | null;
  noticePostTitle: string | null;
  noticePostUrl: string | null;
  sessionDateIso: string;
  startTime: string;
};

type ScheduleManagementBrowserProps = {
  canManageSystemSettings: boolean;
  deletedGeneralSchedules: ScheduleManagementGeneralItem[];
  deletedWorkshopRuns: ScheduleManagementWorkshopRunItem[];
  generalSchedules: ScheduleManagementGeneralItem[];
  initialScheduleSort?: string;
  initialScheduleWorkshop?: string;
  nowIso: string;
  workshopRuns: ScheduleManagementWorkshopRunItem[];
};

type EditingSchedule =
  | { kind: "general"; schedule: ScheduleManagementGeneralItem }
  | { kind: "workshop"; run: ScheduleManagementWorkshopRunItem };

const schedulePageSize = 10;

export function ScheduleManagementBrowser({
  canManageSystemSettings,
  deletedGeneralSchedules,
  deletedWorkshopRuns,
  generalSchedules,
  initialScheduleSort,
  initialScheduleWorkshop,
  nowIso,
  workshopRuns
}: ScheduleManagementBrowserProps) {
  const [selectedTab, setSelectedTab] = useState<ScheduleManagementTab>(() => getScheduleManagementTab(initialScheduleWorkshop));
  const [selectedSort, setSelectedSort] = useState<ScheduleSortMode>(() => getScheduleSortMode(initialScheduleSort));
  const [editingSchedule, setEditingSchedule] = useState<EditingSchedule | null>(null);
  const [visibleCount, setVisibleCount] = useState(schedulePageSize);
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const todayDateKey = useMemo(() => toSeoulDateKey(now), [now]);
  const initialMonth = todayDateKey.slice(0, 7);
  const workshopOptions = useMemo(
    () =>
      siteWorkshopOptions.map((workshop) => ({
        slug: workshop.slug as SiteWorkshopSlug,
        label: workshop.shortName
      })),
    []
  );
  const calendarStates = useMemo(
    () => buildCalendarStates(generalSchedules, workshopRuns, now),
    [generalSchedules, now, workshopRuns]
  );
  const calendarEvents = useMemo(() => calendarStates.flatMap((calendar) => calendar.events), [calendarStates]);
  const scheduleTabs = getScheduleManagementTabs(
    generalSchedules.length,
    workshopRuns,
    deletedGeneralSchedules.length + deletedWorkshopRuns.length
  );
  const currentReturnTo = getScheduleManagementTabHref(selectedTab, selectedSort);
  const sortedGeneralSchedules = useMemo(
    () => [...generalSchedules].sort((left, right) => compareScheduleTimes(left.dateIso, right.dateIso, selectedSort)),
    [generalSchedules, selectedSort]
  );
  const activeWorkshopRuns = useMemo(
    () => (isWorkshopTab(selectedTab) ? workshopRuns.filter((run) => run.workshopSlug === selectedTab) : []),
    [selectedTab, workshopRuns]
  );
  const sortedActiveWorkshopRuns = useMemo(
    () =>
      [...activeWorkshopRuns].sort((left, right) =>
        compareScheduleTimes(getWorkshopRunScheduleTime(left), getWorkshopRunScheduleTime(right), selectedSort)
      ),
    [activeWorkshopRuns, selectedSort]
  );
  const sortedDeletedGeneralSchedules = useMemo(
    () => [...deletedGeneralSchedules].sort((left, right) => compareScheduleTimes(left.dateIso, right.dateIso, selectedSort)),
    [deletedGeneralSchedules, selectedSort]
  );
  const sortedDeletedWorkshopRuns = useMemo(
    () =>
      [...deletedWorkshopRuns].sort((left, right) =>
        compareScheduleTimes(getWorkshopRunScheduleTime(left), getWorkshopRunScheduleTime(right), selectedSort)
      ),
    [deletedWorkshopRuns, selectedSort]
  );
  const activeScheduleRows: EditingSchedule[] = [
    ...(selectedTab === "general" ? sortedGeneralSchedules.map((schedule) => ({ kind: "general" as const, schedule })) : []),
    ...(isWorkshopTab(selectedTab) ? sortedActiveWorkshopRuns.map((run) => ({ kind: "workshop" as const, run })) : [])
  ];
  const trashScheduleRows: EditingSchedule[] = [
    ...sortedDeletedGeneralSchedules.map((schedule) => ({ kind: "general" as const, schedule })),
    ...sortedDeletedWorkshopRuns.map((run) => ({ kind: "workshop" as const, run }))
  ];
  const currentScheduleRows = selectedTab === "trash" ? trashScheduleRows : activeScheduleRows;
  const visibleScheduleRows = currentScheduleRows.slice(0, visibleCount);
  const hasMoreScheduleRows = visibleCount < currentScheduleRows.length;

  useEffect(() => {
    if (!editingSchedule) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditingSchedule(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingSchedule]);

  function selectTab(nextTab: ScheduleManagementTab) {
    setSelectedTab(nextTab);
    setVisibleCount(schedulePageSize);
    replaceScheduleUrl(nextTab, selectedSort);
  }

  function selectSort(nextSort: ScheduleSortMode) {
    setSelectedSort(nextSort);
    setVisibleCount(schedulePageSize);
    replaceScheduleUrl(selectedTab, nextSort);
  }

  function replaceScheduleUrl(nextTab: ScheduleManagementTab, nextSort: ScheduleSortMode) {
    if (typeof window === "undefined") {
      return;
    }

    window.history.replaceState(null, "", getScheduleManagementTabHref(nextTab, nextSort));
  }

  return (
    <section className="schedule-management-browser">
      <section className="site-calendar-preview admin-schedule-calendar-preview" aria-label="관리자 일정 달력">
        <CalendarView
          events={calendarEvents}
          workshops={calendarStates}
          initialMonth={initialMonth}
          linkEditAction={updateWorkshopScheduleEventLinksAction}
          linkEditReturnTo={currentReturnTo}
          todayDateKey={todayDateKey}
        />
      </section>

      <section className="admin-schedule-list-section" aria-label="기존 일정 카드 뷰">
        <div className="admin-post-category-tabs admin-schedule-category-tabs" role="tablist" aria-label="일정 구분">
          {scheduleTabs.map((tab) => {
            const isActive = selectedTab === tab.value;

            return (
              <button
                className={isActive ? "active" : ""}
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(tab.value)}
              >
                <span>{tab.label}</span>
                <small>{tab.count}</small>
              </button>
            );
          })}
        </div>

        {selectedTab === "trash" ? (
          <ScheduleTrashManager
            canManageSystemSettings={canManageSystemSettings}
            onSelectSort={selectSort}
            returnTo={currentReturnTo}
            rows={visibleScheduleRows}
            selectedSort={selectedSort}
          />
        ) : (
          <ActiveScheduleList
            onEditSchedule={setEditingSchedule}
            onSelectSort={selectSort}
            returnTo={currentReturnTo}
            rows={visibleScheduleRows}
            selectedSort={selectedSort}
          />
        )}

        {hasMoreScheduleRows ? (
          <nav className="admin-post-load-more-pager" aria-label="일정 더 불러오기">
            <span>
              {Math.min(visibleCount, currentScheduleRows.length)} / {currentScheduleRows.length}
            </span>
            <button type="button" onClick={() => setVisibleCount((current) => current + schedulePageSize)}>
              더 불러오기
            </button>
          </nav>
        ) : null}
      </section>

      {editingSchedule ? (
        <ScheduleEditModal
          editingSchedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          returnTo={currentReturnTo}
          workshopOptions={workshopOptions}
        />
      ) : null}
    </section>
  );
}

function ScheduleSortControls({
  onSelectSort,
  selectedSort
}: {
  onSelectSort: (sort: ScheduleSortMode) => void;
  selectedSort: ScheduleSortMode;
}) {
  return (
    <div className="admin-post-sort-control admin-schedule-sort-control" aria-label="일정 정렬">
      <span className="sr-only">정렬</span>
      <div className="admin-post-sort-buttons admin-schedule-sort-buttons">
        <button
          className={selectedSort === "latest" ? "active" : ""}
          type="button"
          aria-pressed={selectedSort === "latest"}
          onClick={() => onSelectSort("latest")}
        >
          최신순
        </button>
        <button
          className={selectedSort === "oldest" ? "active" : ""}
          type="button"
          aria-pressed={selectedSort === "oldest"}
          onClick={() => onSelectSort("oldest")}
        >
          오래된순
        </button>
      </div>
    </div>
  );
}

function ScheduleListHeaderActions({
  bulkControls,
  onSelectSort,
  selectedSort
}: {
  bulkControls: ReactNode;
  onSelectSort: (sort: ScheduleSortMode) => void;
  selectedSort: ScheduleSortMode;
}) {
  return (
    <div className="admin-post-list-header-actions" aria-label="일정 목록 도구">
      {bulkControls}
      <ScheduleSortControls selectedSort={selectedSort} onSelectSort={onSelectSort} />
    </div>
  );
}

function ActiveScheduleList({
  onEditSchedule,
  onSelectSort,
  returnTo,
  rows,
  selectedSort
}: {
  onEditSchedule: (schedule: EditingSchedule) => void;
  onSelectSort: (sort: ScheduleSortMode) => void;
  returnTo: string;
  rows: EditingSchedule[];
  selectedSort: ScheduleSortMode;
}) {
  const formId = "active-schedule-bulk-form";
  const showKindColumn = rows.some((row) => row.kind === "workshop");

  return (
    <article className="surface-card" id="schedule-list">
      <div className="card-body section-stack admin-post-list-card-body">
        <form className="admin-bulk-hidden-form" action={bulkScheduleTrashAction} id={formId}>
          <input type="hidden" name="returnTo" value={returnTo} />
        </form>
        <div className="section-heading admin-post-list-heading">
          <ScheduleListHeaderActions
            bulkControls={
              <BulkSelectionControls
                formId={formId}
                itemName="일정"
                actions={[{ value: "trash", label: "선택 휴지통 이동", tone: "danger" }]}
              />
            }
            selectedSort={selectedSort}
            onSelectSort={onSelectSort}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-schedule-table">
            <colgroup>
              <col className="admin-schedule-table-select-col" />
              {showKindColumn ? <col className="admin-schedule-table-kind-col" /> : null}
              <col className="admin-schedule-table-detail-col" />
              <col className="admin-schedule-table-display-col" />
            </colgroup>
            <thead>
              <tr>
                <th className="select-column">선택</th>
                {showKindColumn ? <th>구분</th> : null}
                <th>세부 정보</th>
                <th className="admin-schedule-display-cell">표시</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="admin-table-empty-row">
                  <td className="select-column">-</td>
                  {showKindColumn ? <td>-</td> : null}
                  <td>-</td>
                  <td className="admin-schedule-display-cell">-</td>
                </tr>
              ) : (
                rows.map((row) =>
                  row.kind === "general" ? (
                    <GeneralScheduleRow
                      formId={formId}
                      key={`general-${row.schedule.id}`}
                      onEditSchedule={onEditSchedule}
                      returnTo={returnTo}
                      schedule={row.schedule}
                      showKindColumn={showKindColumn}
                    />
                  ) : (
                    <WorkshopScheduleRow
                      formId={formId}
                      key={`workshop-${row.run.id}`}
                      onEditSchedule={onEditSchedule}
                      returnTo={returnTo}
                      run={row.run}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function GeneralScheduleRow({
  formId,
  onEditSchedule,
  returnTo,
  schedule,
  showKindColumn
}: {
  formId: string;
  onEditSchedule: (schedule: EditingSchedule) => void;
  returnTo: string;
  schedule: ScheduleManagementGeneralItem;
  showKindColumn: boolean;
}) {
  return (
    <tr
      className="admin-table-editable-row"
      onClick={() => onEditSchedule({ kind: "general", schedule })}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        onEditSchedule({ kind: "general", schedule });
      }}
      tabIndex={0}
    >
      <td className="select-column">
        <input
          aria-label={`${schedule.title} 선택`}
          data-bulk-item
          form={formId}
          name="generalIds"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          type="checkbox"
          value={schedule.id}
        />
      </td>
      {showKindColumn ? (
        <td>
          <span className="table-title-card">
            <span className="table-title">기본 일정</span>
          </span>
        </td>
      ) : null}
      <td>
        <span className="admin-schedule-detail-text">{schedule.title}</span>
      </td>
      <td className="admin-schedule-display-cell">
        <ScheduleVisibilityToggle
          id={schedule.id}
          kind="general"
          label={schedule.title}
          returnTo={returnTo}
          visibility={schedule.visibility}
        />
      </td>
    </tr>
  );
}

function WorkshopScheduleRow({
  formId,
  onEditSchedule,
  returnTo,
  run
}: {
  formId: string;
  onEditSchedule: (schedule: EditingSchedule) => void;
  returnTo: string;
  run: ScheduleManagementWorkshopRunItem;
}) {
  const runLabel = buildRunLabelForAdmin(run.workshopSlug, run.year, run.runNumber);

  return (
    <tr
      className="admin-table-editable-row"
      onClick={() => onEditSchedule({ kind: "workshop", run })}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        onEditSchedule({ kind: "workshop", run });
      }}
      tabIndex={0}
    >
      <td className="select-column">
        <input
          aria-label={`${runLabel} 선택`}
          data-bulk-item
          form={formId}
          name="runIds"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          type="checkbox"
          value={run.id}
        />
      </td>
      <td>
        <span className="table-title-card">
          <span className="table-title">{runLabel}</span>
        </span>
      </td>
      <td>
        <WorkshopRunDetailList run={run} />
      </td>
      <td className="admin-schedule-display-cell">
        <ScheduleVisibilityToggle
          id={run.id}
          kind="workshop"
          label={runLabel}
          returnTo={returnTo}
          visibility={run.visibility}
        />
      </td>
    </tr>
  );
}

function WorkshopRunDetailList({ run }: { run: ScheduleManagementWorkshopRunItem }) {
  const detailItems = getWorkshopRunDetailItems(run);

  if (detailItems.length === 0) {
    return <span className="admin-schedule-detail-empty">등록된 강의 없음</span>;
  }

  return (
    <span className="admin-schedule-detail-list">
      {detailItems.map((item) => (
        <span className="admin-schedule-detail-chip" key={item.key}>
          <span className="admin-schedule-detail-name">{item.name}</span>
          {item.dateLabel ? (
            <>
              <span className="admin-schedule-detail-divider" aria-hidden="true" />
              <span className="admin-schedule-detail-dates">{item.dateLabel}</span>
            </>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function ScheduleVisibilityToggle({
  id,
  kind,
  label,
  returnTo,
  visibility
}: {
  id: string;
  kind: "general" | "workshop";
  label: string;
  returnTo: string;
  visibility: ScheduleVisibility;
}) {
  return (
    <form
      action={kind === "general" ? toggleGeneralScheduleVisibilityAction : toggleWorkshopRunVisibilityAction}
      className="admin-schedule-visibility-form"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="visibility" value={getNextScheduleVisibility(visibility)} />
      <button
        className="admin-schedule-visibility-button"
        type="submit"
        aria-label={`${label} ${visibility === "PUBLIC" ? "비공개로 전환" : "공개로 전환"}`}
        title={visibility === "PUBLIC" ? "공개 상태입니다. 누르면 비공개로 전환합니다." : "비공개 상태입니다. 누르면 공개로 전환합니다."}
      >
        {visibility === "PUBLIC" ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </form>
  );
}

function ScheduleTrashManager({
  canManageSystemSettings,
  onSelectSort,
  returnTo,
  rows,
  selectedSort
}: {
  canManageSystemSettings: boolean;
  onSelectSort: (sort: ScheduleSortMode) => void;
  returnTo: string;
  rows: EditingSchedule[];
  selectedSort: ScheduleSortMode;
}) {
  const formId = "schedule-trash-bulk-form";
  const bulkActions = canManageSystemSettings
    ? [
        { value: "restore", label: "선택 복구" },
        { value: "permanent-delete", label: "선택 완전 삭제", tone: "danger" as const }
      ]
    : [{ value: "restore", label: "선택 복구" }];

  return (
    <article className="surface-card" id="schedule-trash">
      <div className="card-body section-stack admin-post-list-card-body">
        <form className="admin-bulk-hidden-form" action={bulkScheduleTrashAction} id={formId}>
          <input type="hidden" name="returnTo" value={returnTo} />
        </form>
        <div className="section-heading admin-post-list-heading">
          <ScheduleListHeaderActions
            bulkControls={<BulkSelectionControls formId={formId} itemName="휴지통 일정" actions={bulkActions} />}
            selectedSort={selectedSort}
            onSelectSort={onSelectSort}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-schedule-table admin-schedule-trash-table">
            <colgroup>
              <col className="admin-schedule-table-select-col" />
              <col className="admin-schedule-trash-kind-col" />
              <col className="admin-schedule-trash-detail-col" />
            </colgroup>
            <thead>
              <tr>
                <th className="select-column">선택</th>
                <th>구분</th>
                <th>세부 정보</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="admin-table-empty-row">
                  <td className="select-column">-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ) : (
                rows.map((row) =>
                  row.kind === "general" ? (
                    <DeletedGeneralScheduleRow
                      formId={formId}
                      key={`deleted-general-${row.schedule.id}`}
                      schedule={row.schedule}
                    />
                  ) : (
                    <DeletedWorkshopScheduleRow
                      formId={formId}
                      key={`deleted-workshop-${row.run.id}`}
                      run={row.run}
                    />
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function DeletedGeneralScheduleRow({
  formId,
  schedule
}: {
  formId: string;
  schedule: ScheduleManagementGeneralItem;
}) {
  return (
    <tr>
      <td className="select-column">
        <input aria-label={`${schedule.title} 선택`} data-bulk-item form={formId} name="generalIds" type="checkbox" value={schedule.id} />
      </td>
      <td>
        <span className="table-title-card table-title-card-readonly">
          <strong className="table-title">기본 일정</strong>
        </span>
      </td>
      <td>
        <span className="admin-schedule-detail-text">{schedule.title}</span>
      </td>
    </tr>
  );
}

function DeletedWorkshopScheduleRow({
  formId,
  run
}: {
  formId: string;
  run: ScheduleManagementWorkshopRunItem;
}) {
  const runLabel = buildRunLabelForAdmin(run.workshopSlug, run.year, run.runNumber);

  return (
    <tr>
      <td className="select-column">
        <input aria-label={`${runLabel} 선택`} data-bulk-item form={formId} name="runIds" type="checkbox" value={run.id} />
      </td>
      <td>
        <span className="table-title-card table-title-card-readonly">
          <strong className="table-title">{runLabel}</strong>
        </span>
      </td>
      <td>
        <WorkshopRunDetailList run={run} />
      </td>
    </tr>
  );
}

function ScheduleEditModal({
  editingSchedule,
  onClose,
  returnTo,
  workshopOptions
}: {
  editingSchedule: EditingSchedule;
  onClose: () => void;
  returnTo: string;
  workshopOptions: Array<{ label: string; slug: SiteWorkshopSlug }>;
}) {
  const initialValue = getScheduleFormInitialValue(editingSchedule);
  const title = getScheduleEditModalTitle(editingSchedule);
  const formId = `site-schedule-edit-form-${initialValue.id}`;
  const isDirty = useEditorFormDirty(formId);
  const requestClose = () => {
    if (isDirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 저장하지 않고 닫을까요?")) {
      return;
    }

    onClose();
  };

  return (
    <div className="admin-post-edit-modal-backdrop" role="presentation">
      <section className="admin-post-edit-modal admin-schedule-edit-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-edit-modal-title">
        <header className="admin-post-edit-modal-header">
          <div>
            <h2 className="sr-only" id="schedule-edit-modal-title">{title}</h2>
          </div>
          <button className="admin-post-edit-modal-close" type="button" onClick={requestClose} aria-label="수정 창 닫기">
            ×
          </button>
        </header>
        <div className="admin-edit-modal-document admin-schedule-edit-modal-document">
          <NewScheduleForm
            createGeneralAction={createGeneralScheduleAction}
            createWorkshopRunAction={createWorkshopRunAction}
            editTitleLabel={title}
            formId={formId}
            initialValue={initialValue}
            mode="edit"
            returnTo={returnTo}
            submitLabel="수정 저장"
            updateGeneralAction={updateGeneralScheduleAction}
            updateWorkshopRunAction={updateWorkshopRunAction}
            workshopOptions={workshopOptions}
            workshopStagePresets={workshopStagePresets}
          />
        </div>
      </section>
    </div>
  );
}

function getScheduleFormInitialValue(editingSchedule: EditingSchedule): ScheduleFormInitialValue {
  if (editingSchedule.kind === "general") {
    return {
      description: editingSchedule.schedule.description,
      endsAtIso: editingSchedule.schedule.endsAtIso,
      id: editingSchedule.schedule.id,
      kind: "general",
      startsAtIso: editingSchedule.schedule.dateIso,
      title: editingSchedule.schedule.title,
      visibility: editingSchedule.schedule.visibility
    };
  }

  return {
    applicationFormUrl: editingSchedule.run.applicationFormUrl,
    description: editingSchedule.run.description,
    id: editingSchedule.run.id,
    kind: "workshop",
    noticePostId: editingSchedule.run.noticePostId,
    stages: editingSchedule.run.stages.map((stage) => ({
      applicationEndsAtIso: stage.applicationEndsAtIso,
      applicationStartsAtIso: stage.applicationStartsAtIso,
      id: stage.id,
      sessions: stage.sessions.map((session) => ({
        endTime: session.endTime,
        id: session.id,
        sessionDateIso: session.sessionDateIso,
        startTime: session.startTime
      })),
      stageName: stage.stageName
    })),
    visibility: editingSchedule.run.visibility,
    workshopSlug: editingSchedule.run.workshopSlug as SiteWorkshopSlug,
    year: editingSchedule.run.year
  };
}

function getScheduleEditModalTitle(editingSchedule: EditingSchedule) {
  if (editingSchedule.kind === "general") {
    return "기본 일정";
  }

  const workshopName = isKnownWorkshopSlug(editingSchedule.run.workshopSlug)
    ? getWorkshopShortName(editingSchedule.run.workshopSlug)
    : editingSchedule.run.workshopSlug.toUpperCase();

  return `${editingSchedule.run.year}년 제${editingSchedule.run.runNumber}차 │ ${workshopName}`;
}

function buildCalendarStates(
  generalSchedules: ScheduleManagementGeneralItem[],
  workshopRuns: ScheduleManagementWorkshopRunItem[],
  now: Date
): AdminCalendarState[] {
  return siteScheduleScopeOptions.map((scope) => {
    const events =
      scope.slug === "general"
        ? generalSchedules.map(buildGeneralCalendarEvent)
        : workshopRuns
            .filter((run) => run.workshopSlug === scope.slug)
            .flatMap((run) => buildWorkshopRunCalendarEvents(run));

    events.sort((left, right) => left.start.localeCompare(right.start));

    return {
      workshop: scope.slug,
      workshopName: getScheduleScopeShortName(scope.slug),
      title: scope.title,
      status: events.length > 0 ? "등록된 일정 있음" : "등록된 일정 없음",
      nextEvent: events.find((event) => new Date(event.end) >= now),
      latestEvent: events[events.length - 1],
      events
    };
  });
}

function buildGeneralCalendarEvent(schedule: ScheduleManagementGeneralItem): AdminCalendarEvent {
  return toCalendarEvent({
    id: `general-${schedule.id}`,
    workshop: "general",
    workshopName: "기본",
    title: schedule.title,
    description: schedule.description ?? "",
    start: schedule.dateIso,
    end: schedule.endsAtIso,
    isApplication: false,
    visibility: schedule.visibility
  });
}

function buildWorkshopRunCalendarEvents(run: ScheduleManagementWorkshopRunItem): AdminCalendarEvent[] {
  const events: AdminCalendarEvent[] = [];
  const workshopSlug = toScheduleScopeSlug(run.workshopSlug);
  const shortName = isKnownWorkshopSlug(run.workshopSlug) ? getWorkshopShortName(run.workshopSlug) : run.workshopSlug.toUpperCase();
  const runLabel = buildRunLabelForAdmin(run.workshopSlug, run.year, run.runNumber);

  for (const stage of run.stages) {
    const stageDisplayName = stripWorkshopPrefix(stage.stageName, shortName);

    if (stage.applicationStartsAtIso && stage.applicationEndsAtIso) {
      const noticePost = getEffectiveScheduleNoticePost(stage, run);
      events.push(
        toCalendarEvent({
          id: `${run.id}-stage-${stage.id}-application`,
          workshop: workshopSlug,
          workshopName: shortName,
          title: stageDisplayName,
          description: run.description ?? "",
          start: stage.applicationStartsAtIso,
          end: stage.applicationEndsAtIso,
          isApplication: true,
          url: stage.applicationFormUrl ?? run.applicationFormUrl ?? undefined,
          linkTargetId: stage.id,
          linkTargetKind: "stage",
          runLabel,
          runNumber: run.runNumber,
          runYear: run.year,
          stageDisplayName,
          stageName: stage.stageName,
          applicationFormUrlOverride: stage.applicationFormUrl,
          noticePostId: noticePost?.id ?? null,
          noticePostIdOverride: stage.noticePostId,
          noticePostTitle: noticePost?.title ?? null,
          noticePostUrl: noticePost?.url ?? null,
          visibility: run.visibility
        })
      );
    }

    stage.sessions.forEach((session) => {
      const { start, end } = combineSessionTimes(session);
      const noticePost = getEffectiveScheduleNoticePost(session, run);
      events.push(
        toCalendarEvent({
          id: `${run.id}-stage-${stage.id}-session-${session.id}`,
          workshop: workshopSlug,
          workshopName: shortName,
          title: stageDisplayName,
          description: run.description ?? "",
          start: start.toISOString(),
          end: end.toISOString(),
          isApplication: false,
          url: session.applicationFormUrl ?? run.applicationFormUrl ?? undefined,
          linkTargetId: session.id,
          linkTargetKind: "session",
          runLabel,
          runNumber: run.runNumber,
          runYear: run.year,
          stageDisplayName,
          stageName: stage.stageName,
          dayLabel: stage.sessions.length > 1 ? `${session.dayIndex + 1}일차` : undefined,
          applicationFormUrlOverride: session.applicationFormUrl,
          noticePostId: noticePost?.id ?? null,
          noticePostIdOverride: session.noticePostId,
          noticePostTitle: noticePost?.title ?? null,
          noticePostUrl: noticePost?.url ?? null,
          visibility: run.visibility
        })
      );
    });
  }

  return events;
}

function toCalendarEvent(input: {
  applicationFormUrlOverride?: string | null;
  dayLabel?: string;
  description: string;
  end: string;
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
  title: string;
  url?: string;
  visibility: ScheduleVisibility;
  workshop: SiteScheduleScopeSlug;
  workshopName: string;
}): AdminCalendarEvent {
  const start = new Date(input.start);
  const end = new Date(input.end);
  const labelFormatter = input.isApplication ? formatDate : formatCompactDateTime;

  return {
    ...input,
    start: start.toISOString(),
    end: end.toISOString(),
    startLabel: labelFormatter(start.toISOString()),
    endLabel: labelFormatter(end.toISOString()),
    dateKey: toSeoulDateKey(start),
    endDateKey: toSeoulDateKey(end)
  };
}

function getEffectiveScheduleNoticePost(
  item: {
    noticePostId: string | null;
    noticePostTitle: string | null;
    noticePostUrl: string | null;
  },
  run: ScheduleManagementWorkshopRunItem
) {
  if (item.noticePostId) {
    return item.noticePostUrl
      ? { id: item.noticePostId, title: item.noticePostTitle, url: item.noticePostUrl }
      : null;
  }

  return run.noticePostId
    ? { id: run.noticePostId, title: run.noticePostTitle, url: run.noticePostUrl }
    : null;
}

function getScheduleManagementTab(value: string | undefined): ScheduleManagementTab {
  if (value === "general" || value === "trash" || siteWorkshopOptions.some((workshop) => workshop.slug === value)) {
    return value as ScheduleManagementTab;
  }

  return "general";
}

function getScheduleSortMode(value: string | undefined): ScheduleSortMode {
  return value === "oldest" ? "oldest" : "latest";
}

function getScheduleManagementTabs(
  generalScheduleCount: number,
  workshopRuns: ScheduleManagementWorkshopRunItem[],
  trashCount: number
): Array<{ count: number; label: string; value: ScheduleManagementTab }> {
  return [
    { value: "general", label: "기본 일정", count: generalScheduleCount },
    ...siteWorkshopOptions.map((workshop) => ({
      value: workshop.slug,
      label: getWorkshopShortName(workshop.slug),
      count: workshopRuns.filter((run) => run.workshopSlug === workshop.slug).length
    })),
    { value: "trash", label: "휴지통", count: trashCount }
  ];
}

function getScheduleManagementTabHref(value: ScheduleManagementTab, sort: ScheduleSortMode) {
  const params = new URLSearchParams({ section: "manage-schedules", scheduleWorkshop: value, scheduleSort: sort });
  return `/site-admin?${params.toString()}`;
}

function compareScheduleTimes(left: string, right: string, sort: ScheduleSortMode) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  return sort === "latest" ? rightTime - leftTime : leftTime - rightTime;
}

function getWorkshopRunScheduleTime(run: ScheduleManagementWorkshopRunItem) {
  const times = run.stages.flatMap((stage) => [
    stage.applicationStartsAtIso,
    stage.applicationEndsAtIso,
    ...stage.sessions.map((session) => session.sessionDateIso)
  ]);
  const validTimes = times.map((value) => (value ? new Date(value).getTime() : Number.NaN)).filter(Number.isFinite);

  return validTimes.length > 0 ? new Date(Math.max(...validTimes)).toISOString() : new Date(0).toISOString();
}

function getWorkshopRunDetailItems(run: ScheduleManagementWorkshopRunItem) {
  const shortName = isKnownWorkshopSlug(run.workshopSlug) ? getWorkshopShortName(run.workshopSlug) : run.workshopSlug.toUpperCase();

  return run.stages.map((stage) => {
    const stageDisplayName = stripWorkshopPrefix(stage.stageName, shortName);
    const sessions = [...stage.sessions].sort((left, right) => left.sessionDateIso.localeCompare(right.sessionDateIso));

    if (sessions.length === 0) {
      return { key: stage.id, name: stageDisplayName, dateLabel: "" };
    }

    const dateLabel =
      sessions.length === 1
        ? formatMonthDay(sessions[0].sessionDateIso)
        : sessions
            .map((session) => `${session.dayIndex + 1}회차 ${formatMonthDay(session.sessionDateIso)}`)
            .join(" · ");

    return { key: stage.id, name: stageDisplayName, dateLabel };
  });
}

function getNextScheduleVisibility(visibility: ScheduleVisibility) {
  return visibility === "PUBLIC" ? "DRAFT" : "PUBLIC";
}

function buildRunLabelForAdmin(workshopSlug: string, year: number, runNumber: number) {
  const shortName = isKnownWorkshopSlug(workshopSlug) ? getWorkshopShortName(workshopSlug) : workshopSlug.toUpperCase();
  const yy = String(year).slice(-2).padStart(2, "0");
  return `${yy}-${runNumber} ${shortName}`;
}

function getScheduleScopeShortName(slug: SiteScheduleScopeSlug) {
  return slug === "general" ? "기본" : getWorkshopShortName(slug);
}

function isWorkshopTab(value: ScheduleManagementTab): value is SiteWorkshopSlug {
  return value !== "general" && value !== "trash";
}

function isKnownWorkshopSlug(value: string): value is SiteWorkshopSlug {
  return value === "program-a" || value === "program-b" || value === "program-c" || value === "program-d";
}

function toScheduleScopeSlug(value: string): SiteScheduleScopeSlug {
  return isKnownWorkshopSlug(value) ? value : "general";
}

function combineSessionTimes(session: ScheduleManagementWorkshopSession) {
  const baseDate = new Date(session.sessionDateIso);
  const [startHour, startMinute] = session.startTime.split(":").map(Number);
  const [endHour, endMinute] = session.endTime.split(":").map(Number);

  const start = new Date(baseDate.getTime() + (startHour * 60 + startMinute) * 60000);
  const end = new Date(baseDate.getTime() + (endHour * 60 + endMinute) * 60000);

  return { start, end };
}

function stripWorkshopPrefix(stageName: string, shortName: string) {
  const prefix = `${shortName} `;
  return stageName.startsWith(prefix) ? stageName.slice(prefix.length) : stageName;
}

function formatCompactDateTime(value: string) {
  return seoulDateTimeFormatter.format(new Date(value)).replace(/\. /g, ".").replace(/\.$/, "");
}

function formatDate(value: string) {
  return seoulDateFormatter.format(new Date(value)).replace(/\. /g, ".").replace(/\.$/, "");
}

function formatMonthDay(value: string) {
  const parts = seoulMonthDayFormatter.formatToParts(new Date(value));
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return `${month}/${day}`;
}

function toSeoulDateKey(date: Date) {
  const parts = seoulDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="admin-schedule-eye-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M2.5 12s3.5-6 9.5-6s9.5 6 9.5 6s-3.5 6-9.5 6s-9.5-6-9.5-6Z" />
      <path d="M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="admin-schedule-eye-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M3 3l18 18" />
      <path d="M10.7 5.2A10.2 10.2 0 0 1 12 5c6 0 9.5 7 9.5 7a17.3 17.3 0 0 1-3.1 4.1" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
      <path d="M6.6 6.6A17.2 17.2 0 0 0 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4.1-.9" />
    </svg>
  );
}

const seoulDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const seoulMonthDayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric"
});

const seoulDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});
