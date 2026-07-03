"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getAttachmentHref, type NoticeAttachmentLink } from "@/lib/notice-attachments";
import type { NoticeCategory, NoticeLabel } from "@/lib/site-data";

type NoticeRelatedLink = {
  title: string;
  url: string;
};

export type NoticeItem = {
  id: number | string;
  title: string;
  category: NoticeCategory;
  labels: NoticeLabel[];
  author: string;
  isWorkshopReview?: boolean;
  createdAt: string;
  createdAtIso?: string;
  updatedAt: string;
  updatedAtIso?: string;
  official: boolean;
  body?: string[];
  bodyHtml?: string | null;
  relatedLinks?: NoticeRelatedLink[];
  attachments?: NoticeAttachmentLink[];
};

export type NoticeActivityMode = "default" | "updatedOnly";
type NoticeDateRangeFilter = "all" | "7d" | "30d" | "custom";
type NoticeSortDirection = "asc" | "desc";

const noticePageSize = 10;
const noticeQueryParam = "notice";
const authorDisplayOrder = ["관리자", "운영자 1", "운영자 2"];

const categoryOptions: Array<{ label: string; value: NoticeCategory }> = [
  { label: "공지사항", value: "전체 공지" },
  { label: "자유게시판", value: "자유게시판" },
  { label: "자료실", value: "자료실" }
];

const dateRangeOptions: Array<{ label: string; value: NoticeDateRangeFilter }> = [
  { label: "조회기간 선택", value: "all" },
  { label: "최근 1주일", value: "7d" },
  { label: "최근 30일", value: "30d" },
  { label: "직접 지정", value: "custom" }
];

type NoticeBrowserProps = {
  authors?: string[];
  notices: NoticeItem[];
};

export function NoticeBrowser({ authors = [], notices }: NoticeBrowserProps) {
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("전체 공지");
  const [author, setAuthor] = useState("all");
  const [draftAuthor, setDraftAuthor] = useState("all");
  const [dateRange, setDateRange] = useState<NoticeDateRangeFilter>("all");
  const [draftDateRange, setDraftDateRange] = useState<NoticeDateRangeFilter>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [draftCustomDateFrom, setDraftCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [draftCustomDateTo, setDraftCustomDateTo] = useState("");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<NoticeSortDirection>("desc");
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(noticePageSize);
  const authorOptions = useMemo(() => getAuthorOptions(authors, notices), [authors, notices]);
  const displayedDateRangeOptions = getDisplayedDateRangeOptions(draftCustomDateFrom, draftCustomDateTo);

  const normalizedQuery = query.trim().toLowerCase();
  const baseFiltered = notices.filter((notice) => {
    const authorMatch = author === "all" || notice.author === author;
    const dateRangeMatch = isInDateRange(notice, dateRange, customDateFrom, customDateTo);
    const target = getSearchTarget(notice);
    const queryMatch = !normalizedQuery || target.includes(normalizedQuery);
    return authorMatch && dateRangeMatch && queryMatch;
  });
  const tabCounts = getCategoryTabCounts(baseFiltered);
  const filtered = baseFiltered
    .filter((notice) => {
      return notice.category === category;
    })
    .sort((a, b) => compareNotices(a, b, sortDirection));
  const visibleNotices = filtered.slice(0, visibleCount);
  const hasMoreNotices = visibleCount < filtered.length;

  useEffect(() => {
    const syncNoticeFromUrl = () => {
      const selectedId = new URL(window.location.href).searchParams.get(noticeQueryParam);
      const nextNotice = selectedId ? notices.find((notice) => String(notice.id) === selectedId) ?? null : null;
      setSelectedNotice(nextNotice);
    };

    syncNoticeFromUrl();
    window.addEventListener("popstate", syncNoticeFromUrl);

    return () => {
      window.removeEventListener("popstate", syncNoticeFromUrl);
    };
  }, [notices]);

  useEffect(() => {
    if (!selectedNotice) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNotice();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNotice]);

  return (
    <section className="section notice-browser-section">
      <div className="notice-search-panel">
        <form className="notice-filter-grid" onSubmit={applyFilters}>
          <label className="notice-search-field">
            <span className="sr-only">게시물 검색</span>
            <input
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="키워드를 입력하세요"
            />
          </label>

          <label className="notice-control">
            <span className="sr-only">작성자</span>
            <select aria-label="작성자" value={draftAuthor} onChange={(event) => setDraftAuthor(event.target.value)}>
              {authorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="notice-control notice-date-range-control">
            <span className="sr-only">기간</span>
            <select
              aria-label="기간"
              value={draftDateRange}
              onClick={() => {
                if (draftDateRange === "custom") {
                  setIsCustomDateOpen(true);
                }
              }}
              onChange={(event) => {
                const nextRange = event.target.value as NoticeDateRangeFilter;
                setDraftDateRange(nextRange);
                setIsCustomDateOpen(nextRange === "custom");
              }}
            >
              {displayedDateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {draftDateRange === "custom" && isCustomDateOpen ? (
              <div className="notice-date-popover">
                <div className="notice-date-popover-grid">
                  <label>
                    <span>시작일</span>
                    <input
                      type="date"
                      value={draftCustomDateFrom}
                      onChange={(event) => setDraftCustomDateFrom(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>종료일</span>
                    <input
                      type="date"
                      value={draftCustomDateTo}
                      onChange={(event) => setDraftCustomDateTo(event.target.value)}
                    />
                  </label>
                </div>
                <div className="notice-date-popover-actions">
                  <button type="button" onClick={() => setIsCustomDateOpen(false)}>
                    닫기
                  </button>
                </div>
              </div>
            ) : null}
          </label>

          <div className="notice-sort-control" aria-label="게시물 정렬">
            <span className="sr-only">정렬</span>
            <div className="notice-sort-buttons">
              <button
                className="active"
                type="button"
                aria-label={getSortButtonLabel(sortDirection)}
                aria-pressed="true"
                onClick={toggleSort}
              >
                날짜 {getSortArrow(sortDirection)}
              </button>
            </div>
          </div>

          <div className="notice-filter-actions">
            <button type="button" onClick={resetFilters}>
              초기화
            </button>
            <button type="submit">
              적용
            </button>
          </div>
        </form>
      </div>

      <div className="notice-category-tabs" role="tablist" aria-label="게시물 구분">
        {categoryOptions.map((option) => {
          const isActive = category === option.value;
          const count = tabCounts.get(option.value) ?? 0;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "active" : ""}
              onClick={() => {
                setCategory(option.value);
                setVisibleCount(noticePageSize);
              }}
            >
              <span>{option.label}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>

      <div className="notice-list" aria-live="polite">
        {visibleNotices.map((notice) => (
          <button
            className="notice-row notice-browser-row notice-row-button"
            key={notice.id}
            type="button"
            onClick={() => openNotice(notice)}
          >
            <span className="notice-row-main">
              <strong>{notice.title}</strong>
            </span>
            <span className="notice-row-dates">
              <span className="notice-author-badge">{notice.author}</span>
              <NoticeActivityStamp notice={notice} />
            </span>
          </button>
        ))}
        {filtered.length === 0 ? <p className="empty-state">조건에 맞는 게시물이 없습니다.</p> : null}
      </div>

      {hasMoreNotices ? (
        <nav className="notice-load-more-pager" aria-label="게시물 더 불러오기">
          <span>
            {Math.min(visibleCount, filtered.length)} / {filtered.length}
          </span>
          <button type="button" onClick={() => setVisibleCount((current) => current + noticePageSize)}>
            더 불러오기
          </button>
        </nav>
      ) : null}

      {selectedNotice ? <NoticeDetailModal notice={selectedNotice} onClose={closeNotice} /> : null}
    </section>
  );

  function openNotice(notice: NoticeItem) {
    setSelectedNotice(notice);
    updateNoticeUrl(String(notice.id), "push");
  }

  function closeNotice() {
    setSelectedNotice(null);
    updateNoticeUrl(null, "replace");
  }

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setQuery(draftQuery);
    setAuthor(draftAuthor);
    setDateRange(draftDateRange);
    setCustomDateFrom(draftCustomDateFrom);
    setCustomDateTo(draftCustomDateTo);
    setIsCustomDateOpen(false);
    setVisibleCount(noticePageSize);
  }

  function resetFilters() {
    setQuery("");
    setDraftQuery("");
    setCategory("전체 공지");
    setAuthor("all");
    setDraftAuthor("all");
    setDateRange("all");
    setDraftDateRange("all");
    setCustomDateFrom("");
    setDraftCustomDateFrom("");
    setCustomDateTo("");
    setDraftCustomDateTo("");
    setIsCustomDateOpen(false);
    setSortDirection("desc");
    setVisibleCount(noticePageSize);
  }

  function toggleSort() {
    setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
    setVisibleCount(noticePageSize);
  }
}

export function NoticeDetailModal({
  activityMode = "default",
  notice,
  onClose
}: {
  activityMode?: NoticeActivityMode;
  notice: NoticeItem;
  onClose: () => void;
}) {
  const [detailNotice, setDetailNotice] = useState<NoticeItem | null>(null);
  const [detailLoadState, setDetailLoadState] = useState<{ id: string; status: "error" | "loaded" } | null>(null);
  const noticeId = String(notice.id);
  const activeDetailNotice = detailNotice && String(detailNotice.id) === String(notice.id) ? detailNotice : null;
  const displayNotice = activeDetailNotice ?? notice;
  const relatedLinks = displayNotice.relatedLinks ?? [];
  const attachments = displayNotice.attachments ?? [];
  const bodyParagraphs = displayNotice.body ?? [];
  const hasLinkedItems = relatedLinks.length > 0 || attachments.length > 0;
  const detailStatus = detailLoadState?.id === noticeId ? detailLoadState.status : hasNoticeContent(notice) ? "loaded" : "loading";
  const isDetailLoading = detailStatus === "loading" && !hasNoticeContent(displayNotice);

  useEffect(() => {
    if (!shouldLoadNoticeDetail(notice)) {
      return;
    }

    let cancelled = false;
    const nextNoticeId = String(notice.id);

    void fetch(`/api/public-notices/${encodeURIComponent(String(notice.id))}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load notice detail.");
        }

        return (await response.json()) as NoticeItem;
      })
      .then((payload) => {
        if (!cancelled) {
          setDetailNotice(payload);
          setDetailLoadState({ id: nextNoticeId, status: "loaded" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetailNotice(null);
          setDetailLoadState({ id: nextNoticeId, status: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [notice]);

  return (
    <div className="notice-modal-backdrop" role="presentation">
      <article className="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-modal-title">
        <header className="notice-modal-header">
          <div className="notice-modal-heading">
            <h2 id="notice-modal-title">{displayNotice.title}</h2>
            <p className="notice-modal-meta">
              <span className="notice-author-badge">{displayNotice.author}</span>
              <NoticeModalActivityStamps activityMode={activityMode} notice={displayNotice} />
            </p>
          </div>
          <button className="notice-modal-close" type="button" onClick={onClose} aria-label="게시물 닫기">
            ×
          </button>
        </header>

        <div className="notice-modal-scroll" aria-busy={isDetailLoading}>
          {isDetailLoading ? (
            <NoticeModalLoadingState />
          ) : (
            <>
              <div className="notice-body">
                {displayNotice.bodyHtml ? (
                  <div className="notice-rich-text" dangerouslySetInnerHTML={{ __html: displayNotice.bodyHtml }} />
                ) : (
                  bodyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                )}
              </div>

              {hasLinkedItems ? (
                <section className="notice-modal-link-section" aria-label="첨부 링크와 파일">
                  <div className="link-badge-list">
                    {relatedLinks.slice(0, 3).map((item) =>
                      item.url.startsWith("/") ? (
                        <Link className="link-badge" href={item.url} key={item.url}>
                          <PaperclipIcon />
                          {item.title}
                        </Link>
                      ) : (
                        <a className="link-badge" href={item.url} target="_blank" rel="noreferrer" key={item.url}>
                          <PaperclipIcon />
                          {item.title}
                        </a>
                      )
                    )}
                    {attachments.slice(0, 5).map((item) => {
                      const href = getAttachmentHref(item);
                      const isDownload = href.startsWith("/api/attachments/download");

                      return (
                        <a
                          className="link-badge"
                          href={href}
                          download={isDownload ? item.title : undefined}
                          target={isDownload ? undefined : "_blank"}
                          rel={isDownload ? undefined : "noreferrer"}
                          key={item.url}
                        >
                          <PaperclipIcon />
                          {item.title}
                        </a>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </article>
    </div>
  );
}

function NoticeModalLoadingState() {
  return (
    <div className="notice-modal-loading" role="status" aria-label="게시물 본문을 불러오는 중">
      <span className="notice-modal-loading-line notice-modal-loading-line-title" />
      <span className="notice-modal-loading-line" />
      <span className="notice-modal-loading-line" />
      <span className="notice-modal-loading-line notice-modal-loading-line-short" />
      <span className="notice-modal-loading-block" />
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg className="link-badge-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.9-9.9a4.2 4.2 0 0 1 6 6l-9.9 9.9a2.4 2.4 0 0 1-3.4-3.4l8.9-8.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function shouldLoadNoticeDetail(notice: NoticeItem) {
  return Boolean(notice.id);
}

function hasNoticeContent(notice: NoticeItem) {
  return Boolean(notice.bodyHtml || notice.body?.length);
}

function getAuthorOptions(authors: string[], notices: NoticeItem[]) {
  const authorNames = Array.from(
    new Set([...authors.map((author) => author.trim()).filter(Boolean), ...notices.map((notice) => notice.author.trim()).filter(Boolean)])
  )
    .filter((author) => !isHiddenPublicAuthor(author))
    .sort(compareAuthorNames);

  return [
    { label: "작성자 전체", value: "all" },
    ...authorNames.map((item) => ({
      label: item,
      value: item
    }))
  ];
}

function isHiddenPublicAuthor(author: string) {
  return author.trim().toLowerCase() === "hidden-author";
}

function compareAuthorNames(left: string, right: string) {
  const leftIndex = getAuthorDisplayIndex(left);
  const rightIndex = getAuthorDisplayIndex(right);

  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right, "ko");
}

function getAuthorDisplayIndex(author: string) {
  const index = authorDisplayOrder.findIndex((item) => item.toLowerCase() === author.trim().toLowerCase());
  return index === -1 ? authorDisplayOrder.length : index;
}

function updateNoticeUrl(noticeId: string | null, mode: "push" | "replace") {
  const url = new URL(window.location.href);

  if (noticeId) {
    url.searchParams.set(noticeQueryParam, noticeId);
  } else {
    url.searchParams.delete(noticeQueryParam);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  if (mode === "push") {
    window.history.pushState({}, "", nextUrl);
  } else {
    window.history.replaceState({}, "", nextUrl);
  }
}

function getDisplayedDateRangeOptions(customDateFrom: string, customDateTo: string) {
  return dateRangeOptions.map((option) =>
    option.value === "custom" ? { ...option, label: getCustomDateRangeLabel(customDateFrom, customDateTo) } : option
  );
}

function getCustomDateRangeLabel(customDateFrom: string, customDateTo: string) {
  if (customDateFrom && customDateTo) {
    return `${customDateFrom} ~ ${customDateTo}`;
  }

  if (customDateFrom) {
    return `${customDateFrom}부터`;
  }

  if (customDateTo) {
    return `${customDateTo}까지`;
  }

  return "직접 지정";
}

function getCategoryTabCounts(notices: NoticeItem[]) {
  const counts = new Map<NoticeCategory, number>();

  categoryOptions.forEach((option) => counts.set(option.value, 0));
  notices.forEach((notice) => {
    if (counts.has(notice.category)) {
      counts.set(notice.category, (counts.get(notice.category) ?? 0) + 1);
    }
  });

  return counts;
}

function getSearchTarget(notice: NoticeItem) {
  const bodyText = notice.body?.join(" ") ?? "";
  const htmlText = notice.bodyHtml?.replace(/<[^>]*>/g, " ") ?? "";

  return `${notice.title} ${getCategoryLabel(notice.category)} ${notice.author} ${bodyText} ${htmlText}`.toLowerCase();
}

export function NoticeActivityStamp({ notice }: { activityMode?: NoticeActivityMode; notice: NoticeItem }) {
  const activity = getNoticeSummaryActivityMeta(notice);

  return <NoticeActivityPill activity={activity} />;
}

function NoticeModalActivityStamps({
  activityMode,
  notice
}: {
  activityMode: NoticeActivityMode;
  notice: NoticeItem;
}) {
  const activities = activityMode === "updatedOnly" ? [getNoticeUpdatedActivityMeta(notice)] : getNoticeModalActivityMeta(notice);

  return (
    <>
      {activities.map((activity) => (
        <NoticeActivityPill activity={activity} key={`${activity.label ?? "summary"}-${activity.value}`} />
      ))}
    </>
  );
}

function NoticeActivityPill({ activity }: { activity: NoticeActivityMeta }) {
  return (
    <span className="notice-activity-stamp">
      {activity.label ? <span className="notice-activity-label">{activity.label}</span> : null}
      {activity.dateTime ? (
        <time className="notice-activity-value" dateTime={activity.dateTime}>
          {activity.value}
        </time>
      ) : (
        <span className="notice-activity-value">{activity.value}</span>
      )}
    </span>
  );
}

type NoticeActivityMeta = {
  dateTime: string | undefined;
  label?: string;
  value: string;
};

export function getNoticeSummaryDisplayDate(notice: NoticeItem) {
  if (notice.createdAt === "작성일 미상") {
    return getNoticeUpdatedDisplayDate(notice);
  }

  return notice.createdAt;
}

export function getNoticeUpdatedDisplayDate(notice: NoticeItem) {
  if (notice.updatedAt && notice.updatedAt !== "-") {
    return notice.updatedAt;
  }

  const updatedAt = formatNoticeDateTime(notice.updatedAtIso);
  if (updatedAt) {
    return updatedAt;
  }

  if (notice.createdAt === "작성일 미상") {
    return "미상";
  }

  return notice.createdAt;
}

function getNoticeUpdatedActivityMeta(notice: NoticeItem) {
  return {
    dateTime: notice.updatedAtIso ?? (notice.updatedAt !== "-" ? notice.updatedAt : notice.createdAtIso),
    label: "최종 수정",
    value: getNoticeUpdatedDisplayDate(notice)
  };
}

function getNoticeSummaryActivityMeta(notice: NoticeItem) {
  if (notice.createdAt === "작성일 미상") {
    return {
      dateTime: notice.updatedAtIso ?? (notice.updatedAt !== "-" ? notice.updatedAt : notice.createdAtIso),
      value: getNoticeUpdatedDisplayDate(notice)
    };
  }

  return {
    dateTime: notice.createdAtIso,
    value: notice.createdAt
  };
}

function getNoticeModalActivityMeta(notice: NoticeItem) {
  const activities = [getNoticeCreatedActivityMeta(notice)];

  if (notice.updatedAt !== "-") {
    activities.push(getNoticeUpdatedActivityMeta(notice));
  }

  return activities;
}

function getNoticeCreatedActivityMeta(notice: NoticeItem) {
  if (notice.createdAt === "작성일 미상") {
    return {
      dateTime: undefined,
      label: "작성",
      value: "미상"
    };
  }

  return {
    dateTime: notice.createdAtIso,
    label: "작성",
    value: notice.createdAt
  };
}

function formatNoticeDateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const year = parts.year ?? "0000";
  const month = parts.month ?? "01";
  const day = parts.day ?? "01";
  const hours = parts.hour ?? "00";
  const minutes = parts.minute ?? "00";

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function isInDateRange(notice: NoticeItem, dateRange: NoticeDateRangeFilter, customDateFrom: string, customDateTo: string) {
  if (dateRange === "all") {
    return true;
  }

  const activityTime = getNoticeActivityTime(notice);
  if (!activityTime) {
    return false;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (dateRange === "custom") {
    const fromTime = getDateInputStartTime(customDateFrom);
    const toTime = getDateInputEndTime(customDateTo);

    return (!fromTime || activityTime >= fromTime) && (!toTime || activityTime < toTime);
  }

  const days = dateRange === "7d" ? 7 : 30;
  const rangeStart = new Date(todayStart);
  rangeStart.setDate(todayStart.getDate() - (days - 1));

  return activityTime >= rangeStart.getTime();
}

function getNoticeActivityTime(notice: NoticeItem) {
  if (notice.updatedAt !== "-") {
    return parseNoticeTime(notice.updatedAtIso ?? notice.updatedAt);
  }

  return parseNoticeTime(notice.createdAtIso ?? notice.createdAt);
}

function getCategoryLabel(category: NoticeCategory) {
  if (category === "전체 공지") {
    return "공지사항";
  }

  return category;
}

function getSortArrow(direction: NoticeSortDirection) {
  return direction === "asc" ? "↑" : "↓";
}

function getSortButtonLabel(direction: NoticeSortDirection) {
  const directionLabel = direction === "asc" ? "오래된순" : "최신순";

  return `날짜 ${directionLabel} 정렬`;
}

function compareNotices(a: NoticeItem, b: NoticeItem, direction: NoticeSortDirection) {
  const left = getNoticeSortValue(a);
  const right = getNoticeSortValue(b);
  const comparison = left.localeCompare(right, "ko-KR");

  return direction === "asc" ? comparison : comparison * -1;
}

function getNoticeSortValue(notice: NoticeItem) {
  if (notice.createdAt === "작성일 미상") {
    return notice.updatedAtIso ?? notice.updatedAt;
  }

  return notice.createdAtIso ?? notice.createdAt;
}

function parseNoticeTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedIso = new Date(value).getTime();
  if (Number.isFinite(parsedIso)) {
    return parsedIso;
  }

  const match = value.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour = "0", minute = "0"] = match;
  const parsedLocal = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();

  return Number.isFinite(parsedLocal) ? parsedLocal : null;
}

function getDateInputStartTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  const time = date.getTime();

  return Number.isFinite(time) ? time : null;
}

function getDateInputEndTime(value: string) {
  const startTime = getDateInputStartTime(value);
  if (!startTime) {
    return null;
  }

  const date = new Date(startTime);
  date.setDate(date.getDate() + 1);

  return date.getTime();
}
