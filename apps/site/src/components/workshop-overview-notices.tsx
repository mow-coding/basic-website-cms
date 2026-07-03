"use client";

import { useEffect, useState } from "react";
import { NoticeActivityStamp, NoticeDetailModal, type NoticeItem } from "@/components/notice-browser";
import { noticeQueryParam, updateNoticeUrl } from "@/lib/notice-url";

export type WorkshopOverviewGroup = {
  key: string;
  label: string;
  notices: NoticeItem[];
};

const noticePageSize = 10;

export function WorkshopOverviewNotices({ groups }: { groups: WorkshopOverviewGroup[] }) {
  const [activeTab, setActiveTab] = useState<string>(groups[0]?.key ?? "general");
  const [visibleCount, setVisibleCount] = useState(noticePageSize);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const activeGroup = groups.find((group) => group.key === activeTab) ?? groups[0];
  const visibleNotices = activeGroup ? activeGroup.notices.slice(0, visibleCount) : [];
  const hasMoreNotices = activeGroup ? visibleCount < activeGroup.notices.length : false;

  useEffect(() => {
    const syncNoticeFromUrl = () => {
      const selectedId = new URL(window.location.href).searchParams.get(noticeQueryParam);
      if (!selectedId) {
        setSelectedNotice(null);
        return;
      }

      // 딥링크(?notice=<id>)로 들어오면 그 글이 속한 탭으로 전환하고, 그 글까지 페이징해 들여온다.
      const owningGroup = groups.find((group) => group.notices.some((notice) => String(notice.id) === selectedId));
      if (!owningGroup) {
        setSelectedNotice(null);
        return;
      }

      const index = owningGroup.notices.findIndex((notice) => String(notice.id) === selectedId);
      setActiveTab(owningGroup.key);
      setVisibleCount((current) => Math.max(current, Math.ceil((index + 1) / noticePageSize) * noticePageSize));
      setSelectedNotice(owningGroup.notices[index] ?? null);
    };

    syncNoticeFromUrl();
    window.addEventListener("popstate", syncNoticeFromUrl);

    return () => {
      window.removeEventListener("popstate", syncNoticeFromUrl);
    };
  }, [groups]);

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

  if (!activeGroup) {
    return null;
  }

  return (
    <>
      <div className="workshop-notice-panel">
        <div className="notice-category-tabs" role="tablist" aria-label="프로그램 구분">
          {groups.map((group) => {
            const isActive = activeTab === group.key;

            return (
              <button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "active" : ""}
                onClick={() => {
                  setActiveTab(group.key);
                  setVisibleCount(noticePageSize);
                }}
              >
                <span>{group.label}</span>
                <small>{group.notices.length}</small>
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
          {activeGroup.notices.length === 0 ? <p className="empty-state">아직 게시물이 없습니다.</p> : null}
        </div>

        {hasMoreNotices ? (
          <nav className="notice-load-more-pager" aria-label="프로그램 게시물 더 불러오기">
            <span>
              {Math.min(visibleCount, activeGroup.notices.length)} / {activeGroup.notices.length}
            </span>
            <button type="button" onClick={() => setVisibleCount((current) => current + noticePageSize)}>
              더 불러오기
            </button>
          </nav>
        ) : null}
      </div>

      {selectedNotice ? <NoticeDetailModal notice={selectedNotice} onClose={closeNotice} /> : null}
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
}
