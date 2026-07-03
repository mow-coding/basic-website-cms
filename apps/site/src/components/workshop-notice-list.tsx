"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  NoticeActivityStamp,
  NoticeDetailModal,
  type NoticeActivityMode,
  type NoticeItem
} from "@/components/notice-browser";
import { noticeQueryParam, updateNoticeUrl } from "@/lib/notice-url";

type WorkshopNoticeListProps = {
  activityMode?: NoticeActivityMode;
  ariaLabel?: string;
  greenBoardEmptyMessage?: string;
  greenBoardPosts?: NoticeItem[];
  greenBoardTabLabel?: string;
  loadMoreAriaLabel?: string;
  noticeEmptyMessage?: string;
  noticePosts?: NoticeItem[];
  noticeTabLabel?: string;
  resourceEmptyMessage?: string;
  notices?: NoticeItem[];
  resourcePosts?: NoticeItem[];
  resourceTabLabel?: string;
  reviewPosts?: NoticeItem[];
  secondaryTabGroupLabel?: string;
  displayMode?: "tabs" | "sections";
  showActivity?: boolean;
  showAuthor?: boolean;
  initialTab?: WorkshopNoticeTabKey;
  tabGroupLabel?: string;
  visibleTabs?: WorkshopNoticeTabKey[];
};

type WorkshopNoticeTabKey = "notice" | "resource" | "greenBoard" | "review";
type WorkshopNoticeTabOption = {
  emptyMessage: string;
  key: WorkshopNoticeTabKey;
  label: string;
  notices: NoticeItem[];
};

const noticePageSize = 10;
const emptyNotices: NoticeItem[] = [];

export function WorkshopNoticeList({
  activityMode = "default",
  ariaLabel = "프로그램 게시물 구분",
  greenBoardEmptyMessage = "아직 연결된 자유게시판 게시물이 없습니다.",
  greenBoardPosts,
  greenBoardTabLabel = "자유게시판",
  loadMoreAriaLabel = "프로그램 게시물 더 불러오기",
  noticeEmptyMessage = "아직 연결된 공지글이 없습니다.",
  noticePosts,
  noticeTabLabel = "공지사항",
  resourceEmptyMessage = "아직 연결된 자료실 게시물이 없습니다.",
  notices,
  resourcePosts,
  resourceTabLabel = "자료실",
  reviewPosts,
  secondaryTabGroupLabel,
  displayMode = "tabs",
  showActivity = true,
  showAuthor = true,
  initialTab = "notice",
  tabGroupLabel,
  visibleTabs
}: WorkshopNoticeListProps) {
  const safeGreenBoardPosts = greenBoardPosts ?? emptyNotices;
  const safeNoticePosts = noticePosts ?? notices ?? emptyNotices;
  const safeResourcePosts = resourcePosts ?? emptyNotices;
  const safeReviewPosts = reviewPosts ?? emptyNotices;
  const tabOptions = useMemo(
    () => {
      const options: WorkshopNoticeTabOption[] = [
        {
          emptyMessage: noticeEmptyMessage,
          key: "notice" as const,
          label: noticeTabLabel,
          notices: safeNoticePosts
        },
        {
          emptyMessage: resourceEmptyMessage,
          key: "resource" as const,
          label: resourceTabLabel,
          notices: safeResourcePosts
        },
        {
          emptyMessage: greenBoardEmptyMessage,
          key: "greenBoard" as const,
          label: greenBoardTabLabel,
          notices: safeGreenBoardPosts
        }
      ];

      if (reviewPosts !== undefined) {
        options.push({
          emptyMessage: "아직 등록된 후기/리뷰가 없습니다.",
          key: "review",
          label: "후기 · 리뷰",
          notices: safeReviewPosts
        });
      }

      return visibleTabs ? options.filter((option) => visibleTabs.includes(option.key)) : options;
    },
    [
      greenBoardEmptyMessage,
      greenBoardTabLabel,
      noticeEmptyMessage,
      noticeTabLabel,
      resourceEmptyMessage,
      resourceTabLabel,
      reviewPosts,
      safeGreenBoardPosts,
      safeNoticePosts,
      safeResourcePosts,
      safeReviewPosts,
      visibleTabs
    ]
  );
  const defaultActiveTab = tabOptions.some((option) => option.key === initialTab) ? initialTab : tabOptions[0]?.key ?? "notice";
  const [activeTab, setActiveTab] = useState<WorkshopNoticeTabKey>(defaultActiveTab);
  const [visibleCount, setVisibleCount] = useState(noticePageSize);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const activeOption = tabOptions.find((option) => option.key === activeTab) ?? tabOptions[0];
  const visibleNotices = activeOption.notices.slice(0, visibleCount);
  const hasMoreNotices = visibleCount < activeOption.notices.length;
  const shouldShowRowMeta = showAuthor || showActivity;
  const isSectionMode = displayMode === "sections";

  useEffect(() => {
    const syncNoticeFromUrl = () => {
      const selectedId = new URL(window.location.href).searchParams.get(noticeQueryParam);

      if (!selectedId) {
        setSelectedNotice(null);
        return;
      }

      const nextTab = tabOptions.find((option) => option.notices.some((notice) => String(notice.id) === selectedId));
      const nextNoticeIndex = nextTab?.notices.findIndex((notice) => String(notice.id) === selectedId) ?? -1;
      const nextNotice = nextNoticeIndex >= 0 ? nextTab?.notices[nextNoticeIndex] ?? null : null;

      if (nextTab) {
        setActiveTab(nextTab.key);
        setVisibleCount(Math.max(noticePageSize, Math.ceil((nextNoticeIndex + 1) / noticePageSize) * noticePageSize));
      }

      setSelectedNotice(nextNotice);
    };

    syncNoticeFromUrl();
    window.addEventListener("popstate", syncNoticeFromUrl);

    return () => {
      window.removeEventListener("popstate", syncNoticeFromUrl);
    };
  }, [tabOptions]);

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
    <>
      <div className="workshop-notice-panel">
        <div
          className={[
            "notice-category-tabs",
            secondaryTabGroupLabel ? "has-secondary-tab-group" : "",
            isSectionMode ? "is-heading-only" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          role={isSectionMode ? undefined : "tablist"}
          aria-label={ariaLabel}
        >
          {tabGroupLabel ? (
            <span className="notice-tab-group-label notice-tab-group-heading" role="presentation">
              {tabGroupLabel}
            </span>
          ) : null}
          {isSectionMode
            ? tabOptions.map((option, index) => (
                <span className={`notice-section-tab-summary section-${index + 1}`} key={option.key}>
                  <span>{option.label}</span>
                  <small>{option.notices.length}</small>
                </span>
              ))
            : tabOptions.map((option) => {
            const shouldShowGroupLabel = secondaryTabGroupLabel && option.key === "resource";
            const isActive = activeTab === option.key;

            return (
              <Fragment key={option.key}>
                {shouldShowGroupLabel ? (
                  <span className="notice-tab-group-label" role="presentation">
                    {secondaryTabGroupLabel}
                  </span>
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? "active" : ""}
                  onClick={() => {
                    setActiveTab(option.key);
                    setVisibleCount(noticePageSize);
                  }}
                >
                  <span>{option.label}</span>
                  <small>{option.notices.length}</small>
                </button>
              </Fragment>
            );
          })}
        </div>

        {isSectionMode ? (
          <div className="workshop-notice-sections" aria-live="polite">
            {tabOptions.map((option) => (
              <section className="workshop-notice-subsection" key={option.key} aria-label={option.label}>
                <div className="notice-list">
                  {option.notices.map((notice) => renderNoticeRow(notice))}
                  {option.notices.length === 0 ? <p className="empty-state">{option.emptyMessage}</p> : null}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="notice-list" aria-live="polite">
            {visibleNotices.map((notice) => renderNoticeRow(notice))}
            {activeOption.notices.length === 0 ? <p className="empty-state">{activeOption.emptyMessage}</p> : null}
          </div>
        )}

        {!isSectionMode && hasMoreNotices ? (
          <nav className="notice-load-more-pager" aria-label={loadMoreAriaLabel}>
            <span>
              {Math.min(visibleCount, activeOption.notices.length)} / {activeOption.notices.length}
            </span>
            <button type="button" onClick={() => setVisibleCount((current) => current + noticePageSize)}>
              더 불러오기
            </button>
          </nav>
        ) : null}
      </div>

      {selectedNotice ? <NoticeDetailModal activityMode={activityMode} notice={selectedNotice} onClose={closeNotice} /> : null}
    </>
  );

  function openNotice(notice: NoticeItem) {
    setSelectedNotice(notice);
    updateNoticeUrl(String(notice.id), "push");
  }

  function closeNotice() {
    setSelectedNotice(null);
    updateNoticeUrl(null, "replace");
  }

  function renderNoticeRow(notice: NoticeItem) {
    return (
      <button className="notice-row notice-browser-row notice-row-button" key={notice.id} type="button" onClick={() => openNotice(notice)}>
        <span className="notice-row-main">
          <strong>{notice.title}</strong>
        </span>
        {shouldShowRowMeta ? (
          <span className="notice-row-dates">
            {showAuthor ? <span className="notice-author-badge">{notice.author}</span> : null}
            {showActivity ? <NoticeActivityStamp activityMode={activityMode} notice={notice} /> : null}
          </span>
        ) : null}
      </button>
    );
  }
}
