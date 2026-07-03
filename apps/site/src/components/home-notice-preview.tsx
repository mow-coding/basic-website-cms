"use client";

import { useEffect, useMemo, useState } from "react";
import { getNoticeSummaryDisplayDate, NoticeDetailModal, type NoticeItem } from "@/components/notice-browser";
import type { NoticeCategory } from "@/lib/site-data";

type HomeNoticeGroup = {
  category: NoticeCategory;
  items: NoticeItem[];
};

type HomeNoticePreviewProps = {
  groups: HomeNoticeGroup[];
};

const noticeQueryParam = "notice";

export function HomeNoticePreview({ groups }: HomeNoticePreviewProps) {
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const notices = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    let cancelled = false;

    const syncNoticeFromUrl = () => {
      const selectedId = new URL(window.location.href).searchParams.get(noticeQueryParam);
      if (!selectedId) {
        setSelectedNotice(null);
        return;
      }

      const nextNotice = notices.find((notice) => String(notice.id) === selectedId);
      if (nextNotice) {
        setSelectedNotice(nextNotice);
        return;
      }

      setSelectedNotice(null);
      void fetch(`/api/public-notices/${encodeURIComponent(selectedId)}`, {
        headers: { Accept: "application/json" }
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load notice detail.");
          }

          return (await response.json()) as NoticeItem;
        })
        .then((notice) => {
          if (!cancelled && String(notice.id) === selectedId) {
            setSelectedNotice(notice);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSelectedNotice(null);
          }
        });
    };

    syncNoticeFromUrl();
    window.addEventListener("popstate", syncNoticeFromUrl);

    return () => {
      cancelled = true;
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
    <>
      <div className="notice-category-grid">
        {groups.map((group) => (
          <section className="notice-category-column" key={group.category}>
            <h3>{group.category}</h3>
            <div className="notice-category-list">
              {group.items.map((notice) => (
                <button
                  className="notice-category-row notice-category-button"
                  key={notice.id}
                  type="button"
                  onClick={() => openNotice(notice)}
                >
                  <strong>{notice.title}</strong>
                  <span className="notice-category-meta">
                    <time>{getNoticeSummaryDisplayDate(notice)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{notice.author}</span>
                  </span>
                </button>
              ))}
              {group.items.length === 0 ? <p className="notice-empty">등록된 공지가 없습니다.</p> : null}
            </div>
          </section>
        ))}
      </div>

      {selectedNotice ? (
        <NoticeDetailModal
          activityMode={selectedNotice.category === "안내" ? "updatedOnly" : "default"}
          notice={selectedNotice}
          onClose={closeNotice}
        />
      ) : null}
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
