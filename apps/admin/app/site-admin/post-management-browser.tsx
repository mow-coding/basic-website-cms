"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  bulkSitePostAction,
  permanentlyDeleteSitePostAction,
  permanentlyDeleteSiteResourceAction,
  restoreSitePostAction,
  restoreSiteResourceAction
} from "@/app/site-admin/actions";
import { BulkSelectionControls } from "@/app/site-admin/bulk-selection-controls";
import { FormSubmitButton } from "@/app/site-admin/form-submit-button";

type ManagePostCategory = "GENERAL" | "COUNSELING" | "GREEN_BOARD" | "RESOURCE";
type ManagePostStatus = "PUBLIC" | "PRIVATE" | "DELETED";
type ManageDateRange = "all" | "7d" | "30d" | "custom";
type ManageSortField = "created" | "updated";
type ManageSortDirection = "asc" | "desc";

export type ManagePostBrowserFilters = {
  author?: string;
  category: ManagePostCategory;
  direction: ManageSortDirection;
  from?: string;
  label?: string;
  q?: string;
  range: ManageDateRange;
  sort: ManageSortField;
  status: ManagePostStatus;
  to?: string;
};

export type ManagePostBrowserItem = {
  authorName: string;
  authorUserId: string | null;
  category: ManagePostCategory;
  categoryLabel: string;
  createdAtIso: string;
  createdAtText: string;
  id: string;
  labels: string[];
  publicLocationLabel: string;
  publicSiteUrl: string | null;
  statusLabel: string;
  title: string;
  updatedAtIso: string;
  updatedAtText: string;
  visibility: "PUBLIC" | "DRAFT";
};

export type ManageDeletedPostItem = ManagePostBrowserItem & {
  deletedAtIso: string;
  deletedAtText: string;
};

export type ManageDeletedResourceItem = {
  category: "RESOURCE";
  categoryLabel: string;
  createdAtIso: string;
  deletedAtIso: string;
  deletedAtText: string;
  id: string;
  labels: string[];
  meta: string;
  title: string;
  updatedAtIso: string;
};

type PostManagementBrowserProps = {
  authors: string[];
  canManageSystemSettings: boolean;
  currentUserId: string;
  deletedPosts: ManageDeletedPostItem[];
  deletedResources: ManageDeletedResourceItem[];
  initialFilters: ManagePostBrowserFilters;
  posts: ManagePostBrowserItem[];
};

const filterAllValue = "ALL";
const pageSize = 10;
const authorDisplayOrder = ["최고관리자", "관리자", "운영자 1", "운영자 2"];

const categoryOptions: Array<{ label: string; value: ManagePostCategory }> = [
  { label: "공지사항", value: "GENERAL" },
  { label: "안내", value: "COUNSELING" },
  { label: "자유게시판", value: "GREEN_BOARD" },
  { label: "자료실", value: "RESOURCE" }
];

const statusOptions: Array<{ label: string; value: ManagePostStatus }> = [
  { label: "공개", value: "PUBLIC" },
  { label: "비공개", value: "PRIVATE" },
  { label: "삭제", value: "DELETED" }
];

const labelOptions = ["프로그램A", "프로그램B", "프로그램C", "프로그램D"];

const dateRangeOptions: Array<{ label: string; value: ManageDateRange }> = [
  { label: "조회기간 선택", value: "all" },
  { label: "최근 1주일", value: "7d" },
  { label: "최근 30일", value: "30d" },
  { label: "직접 지정", value: "custom" }
];

export function PostManagementBrowser({
  authors,
  canManageSystemSettings,
  currentUserId,
  deletedPosts,
  deletedResources,
  initialFilters,
  posts
}: PostManagementBrowserProps) {
  const router = useRouter();
  const defaultAuthor = getDefaultAuthorValue(initialFilters.author, authors, posts);
  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [draftQuery, setDraftQuery] = useState(initialFilters.q ?? "");
  const [category, setCategory] = useState<ManagePostCategory>(initialFilters.category);
  const [author, setAuthor] = useState(defaultAuthor);
  const [draftAuthor, setDraftAuthor] = useState(defaultAuthor);
  const [dateRange, setDateRange] = useState<ManageDateRange>(initialFilters.range);
  const [draftDateRange, setDraftDateRange] = useState<ManageDateRange>(initialFilters.range);
  const [customDateFrom, setCustomDateFrom] = useState(initialFilters.from ?? "");
  const [draftCustomDateFrom, setDraftCustomDateFrom] = useState(initialFilters.from ?? "");
  const [customDateTo, setCustomDateTo] = useState(initialFilters.to ?? "");
  const [draftCustomDateTo, setDraftCustomDateTo] = useState(initialFilters.to ?? "");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [label, setLabel] = useState(initialFilters.label ?? filterAllValue);
  const [draftLabel, setDraftLabel] = useState(initialFilters.label ?? filterAllValue);
  const [status, setStatus] = useState<ManagePostStatus>(initialFilters.status);
  const [draftStatus, setDraftStatus] = useState<ManagePostStatus>(initialFilters.status);
  const [sort, setSort] = useState<`${ManageSortField}-${ManageSortDirection}`>(
    `${initialFilters.sort}-${initialFilters.direction}`
  );
  const [editingPost, setEditingPost] = useState<ManagePostBrowserItem | null>(null);
  const [isEditModalSaving, setIsEditModalSaving] = useState(false);
  const [isEditModalDirty, setIsEditModalDirty] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const authorOptions = useMemo(() => getAuthorOptions(authors, posts), [authors, posts]);
  const displayedDateRangeOptions = getDisplayedDateRangeOptions(draftCustomDateFrom, draftCustomDateTo);
  const baseItems = status === "DELETED" ? [...deletedPosts, ...deletedResources] : posts.filter((post) => matchesStatus(post, status));
  const baseFiltered = filterManageItems(baseItems, {
    author,
    customDateFrom,
    customDateTo,
    dateRange,
    label,
    query
  });
  const draftBaseItems =
    draftStatus === "DELETED" ? [...deletedPosts, ...deletedResources] : posts.filter((post) => matchesStatus(post, draftStatus));
  const draftResultCount = filterManageItems(draftBaseItems, {
    author: draftAuthor,
    customDateFrom: draftCustomDateFrom,
    customDateTo: draftCustomDateTo,
    dateRange: draftDateRange,
    label: draftLabel,
    query: draftQuery
  }).length;
  const tabCounts = getCategoryTabCounts(baseFiltered);
  const filtered = baseFiltered
    .filter((item) => item.category === category)
    .sort((left, right) => compareItems(left, right, sort));
  const visibleItems = filtered.slice(0, visibleCount);
  const hasMoreItems = visibleCount < filtered.length;
  const openPostEditModal = useCallback((post: ManagePostBrowserItem) => {
    setIsEditModalSaving(false);
    setIsEditModalDirty(false);
    setEditingPost(post);
  }, []);
  const closePostEditModal = useCallback(() => {
    if (isEditModalSaving) {
      return;
    }

    if (isEditModalDirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 저장하지 않고 닫을까요?")) {
      return;
    }

    setEditingPost(null);
    setIsEditModalSaving(false);
    setIsEditModalDirty(false);
  }, [isEditModalDirty, isEditModalSaving]);
  const handlePostUpdated = useCallback(
    (resultSearch = "") => {
      setIsEditModalSaving(false);
      setIsEditModalDirty(false);
      setEditingPost(null);
      router.replace(getPostUpdatedListUrl(resultSearch));
    },
    [router]
  );

  useEffect(() => {
    if (!editingPost) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isEditModalSaving) {
        closePostEditModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePostEditModal, editingPost, isEditModalSaving]);

  return (
    <section className="admin-post-browser-section" id="notice-list">
      <div className="surface-card admin-post-filter-card">
        <div className="card-body admin-post-filter-body">
          <form autoComplete="off" className="admin-post-filter-form" onSubmit={applyFilters}>
            <div className="admin-post-filter-main-row">
              <label className="admin-post-filter-control admin-post-filter-control-status">
                <span className="sr-only">공개 여부</span>
                <select
                  aria-label="공개 여부"
                  className="select-input"
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as ManagePostStatus)}
                >
                  {statusOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-post-filter-control admin-post-filter-control-author">
                <span className="sr-only">작성자</span>
                <select aria-label="작성자" className="select-input" value={draftAuthor} onChange={(event) => setDraftAuthor(event.target.value)}>
                  {authorOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-post-filter-control admin-post-filter-control-label">
                <span className="sr-only">라벨</span>
                <select aria-label="라벨" className="select-input" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)}>
                  <option value={filterAllValue}>라벨 선택</option>
                  {labelOptions.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-post-filter-control admin-post-date-range-control">
                <span className="sr-only">조회 기간</span>
                <select
                  aria-label="조회 기간"
                  className="select-input"
                  value={draftDateRange}
                  onClick={() => {
                    if (draftDateRange === "custom") {
                      setIsCustomDateOpen(true);
                    }
                  }}
                  onChange={(event) => {
                    const nextRange = event.target.value as ManageDateRange;
                    setDraftDateRange(nextRange);
                    setIsCustomDateOpen(nextRange === "custom");
                  }}
                >
                  {displayedDateRangeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {draftDateRange === "custom" && isCustomDateOpen ? (
                  <div className="admin-post-date-popover">
                    <div className="admin-post-date-popover-grid">
                      <label>
                        <span>시작일</span>
                        <input type="date" value={draftCustomDateFrom} onChange={(event) => setDraftCustomDateFrom(event.target.value)} />
                      </label>
                      <label>
                        <span>종료일</span>
                        <input type="date" value={draftCustomDateTo} onChange={(event) => setDraftCustomDateTo(event.target.value)} />
                      </label>
                    </div>
                    <div className="admin-post-date-popover-actions">
                      <button type="button" onClick={() => setIsCustomDateOpen(false)}>
                        닫기
                      </button>
                    </div>
                  </div>
                ) : null}
              </label>

              <label className="admin-post-search-field">
                <span className="sr-only">게시물 검색</span>
                <input
                  className="text-input"
                  type="search"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="키워드를 입력하세요"
                />
              </label>
            </div>

            <div className="admin-post-filter-footer-row">
              <PostFilterActions resetFilters={resetFilters} resultCount={draftResultCount} />
            </div>
          </form>
        </div>
      </div>

      <div className="admin-post-category-tabs" role="tablist" aria-label="게시물 구분">
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
                replaceManagePostUrl({
                  author,
                  category: option.value,
                  customDateFrom,
                  customDateTo,
                  dateRange,
                  label,
                  query,
                  sort,
                  status
                });
                setVisibleCount(pageSize);
              }}
            >
              <span>{option.label}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>

      {status === "DELETED" ? (
        <DeletedPostList
          canManageSystemSettings={canManageSystemSettings}
          deletedResources={visibleItems.filter(isDeletedResource)}
          posts={visibleItems.filter(isDeletedPost)}
          sort={sort}
          toggleSort={toggleSort}
        />
      ) : (
        <ActivePostList
          currentUserId={currentUserId}
          canManageSystemSettings={canManageSystemSettings}
          onEditPost={openPostEditModal}
          posts={visibleItems.filter(isActivePost)}
          sort={sort}
          toggleSort={toggleSort}
        />
      )}

      {hasMoreItems ? (
        <nav className="admin-post-load-more-pager" aria-label="게시물 더 불러오기">
          <span>
            {Math.min(visibleCount, filtered.length)} / {filtered.length}
          </span>
          <button type="button" onClick={() => setVisibleCount((current) => current + pageSize)}>
            더 불러오기
          </button>
        </nav>
      ) : null}

      {editingPost ? (
        <PostEditModal
          isSaving={isEditModalSaving}
          onClose={closePostEditModal}
          onDirtyChange={setIsEditModalDirty}
          onPostUpdated={handlePostUpdated}
          onSavingChange={setIsEditModalSaving}
          post={editingPost}
        />
      ) : null}
    </section>
  );

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setQuery(draftQuery);
    setAuthor(draftAuthor);
    setDateRange(draftDateRange);
    setCustomDateFrom(draftCustomDateFrom);
    setCustomDateTo(draftCustomDateTo);
    setLabel(draftLabel);
    setStatus(draftStatus);
    setIsCustomDateOpen(false);
    replaceManagePostUrl({
      author: draftAuthor,
      category,
      customDateFrom: draftCustomDateFrom,
      customDateTo: draftCustomDateTo,
      dateRange: draftDateRange,
      label: draftLabel,
      query: draftQuery,
      sort,
      status: draftStatus
    });
    setVisibleCount(pageSize);
  }

  function resetFilters() {
    setQuery("");
    setDraftQuery("");
    setCategory("GENERAL");
    setAuthor(defaultAuthor);
    setDraftAuthor(defaultAuthor);
    setDateRange("all");
    setDraftDateRange("all");
    setCustomDateFrom("");
    setDraftCustomDateFrom("");
    setCustomDateTo("");
    setDraftCustomDateTo("");
    setLabel(filterAllValue);
    setDraftLabel(filterAllValue);
    setStatus("PUBLIC");
    setDraftStatus("PUBLIC");
    setSort("created-desc");
    setIsCustomDateOpen(false);
    replaceManagePostUrl({
      author: defaultAuthor,
      category: "GENERAL",
      customDateFrom: "",
      customDateTo: "",
      dateRange: "all",
      label: filterAllValue,
      query: "",
      sort: "created-desc",
      status: "PUBLIC"
    });
    setVisibleCount(pageSize);
  }

  function toggleSort(field: ManageSortField) {
    setSort((current) => {
      const nextSort = getNextSortMode(current, field);
      replaceManagePostUrl({
        author,
        category,
        customDateFrom,
        customDateTo,
        dateRange,
        label,
        query,
        sort: nextSort,
        status
      });
      return nextSort;
    });
    setVisibleCount(pageSize);
  }
}

type ManagePostUrlState = {
  author: string;
  category: ManagePostCategory;
  customDateFrom: string;
  customDateTo: string;
  dateRange: ManageDateRange;
  label: string;
  query: string;
  sort: `${ManageSortField}-${ManageSortDirection}`;
  status: ManagePostStatus;
};

function replaceManagePostUrl(state: ManagePostUrlState) {
  const params = new URLSearchParams(window.location.search);
  const [sortField, sortDirection] = state.sort.split("-") as [ManageSortField, ManageSortDirection];

  params.set("section", "manage-posts");
  params.set("category", state.category);
  params.set("status", state.status);
  params.set("sortMode", `${sortField}:${sortDirection}`);
  setOptionalParam(params, "author", state.author);
  setOptionalParam(params, "q", state.query.trim());
  setOptionalParam(params, "label", state.label === filterAllValue ? "" : state.label);
  setOptionalParam(params, "range", state.dateRange === "all" ? "" : state.dateRange);
  setOptionalParam(params, "from", state.dateRange === "custom" ? state.customDateFrom : "");
  setOptionalParam(params, "to", state.dateRange === "custom" ? state.customDateTo : "");
  params.delete("message");
  params.delete("error");

  window.history.replaceState(null, "", `/site-admin?${params.toString()}`);
}

function setOptionalParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
    return;
  }

  params.delete(key);
}

function PostFilterActions({
  resultCount,
  resetFilters
}: {
  resultCount: number;
  resetFilters: () => void;
}) {
  return (
    <div className="admin-post-filter-actions">
      <button className="admin-post-filter-reset-button" type="button" onClick={resetFilters}>
        <FilterResetIcon />
        <span>필터 초기화</span>
      </button>
      <button className="admin-post-filter-apply-button" type="submit">
        <CursorButtonIcon />
        <span>현재 조건에 맞는 게시물 {resultCount}개가 표시됩니다.</span>
      </button>
    </div>
  );
}

function PostListHeaderActions({
  bulkControls,
  sort,
  toggleSort
}: {
  bulkControls: ReactNode;
  sort: `${ManageSortField}-${ManageSortDirection}`;
  toggleSort: (field: ManageSortField) => void;
}) {
  return (
    <div className="admin-post-list-header-actions" aria-label="게시물 목록 도구">
      {bulkControls}

      <div className="admin-post-sort-control" aria-label="게시물 정렬">
        <span className="sr-only">정렬</span>
        <div className="admin-post-sort-buttons">
          <button
            className={sort.startsWith("created") ? "active" : ""}
            type="button"
            aria-label={getSortButtonLabel(sort, "created")}
            aria-pressed={sort.startsWith("created")}
            onClick={() => toggleSort("created")}
          >
            작성일 {getSortArrow(sort, "created")}
          </button>
          <button
            className={sort.startsWith("updated") ? "active" : ""}
            type="button"
            aria-label={getSortButtonLabel(sort, "updated")}
            aria-pressed={sort.startsWith("updated")}
            onClick={() => toggleSort("updated")}
          >
            수정일 {getSortArrow(sort, "updated")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterResetIcon() {
  return (
    <svg aria-hidden="true" className="admin-post-action-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M8 4h12v2.172a2 2 0 0 1-.586 1.414l-3.914 3.914m-.5 3.5v4l-6 2v-8.5l-4.48-4.928a2 2 0 0 1-.52-1.345v-2.227" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function CursorButtonIcon() {
  return (
    <svg aria-hidden="true" className="admin-post-action-icon" focusable="false" viewBox="0 0 24 24">
      <path d="M3 12h3" />
      <path d="M12 3v3" />
      <path d="M7.8 7.8l-2.2-2.2" />
      <path d="M16.2 7.8l2.2-2.2" />
      <path d="M7.8 16.2l-2.2 2.2" />
      <path d="M12 12l9 3l-4 2l-2 4l-3-9" />
    </svg>
  );
}

function ActivePostList({
  canManageSystemSettings,
  currentUserId,
  onEditPost,
  posts,
  sort,
  toggleSort
}: {
  canManageSystemSettings: boolean;
  currentUserId: string;
  onEditPost: (post: ManagePostBrowserItem) => void;
  posts: ManagePostBrowserItem[];
  sort: `${ManageSortField}-${ManageSortDirection}`;
  toggleSort: (field: ManageSortField) => void;
}) {
  const formId = "active-post-bulk-form";

  return (
    <article className="surface-card" id="posts-list">
      <div className="card-body section-stack admin-post-list-card-body">
        <form className="admin-bulk-hidden-form" action={bulkSitePostAction} id={formId} />
        <div className="section-heading admin-post-list-heading">
          <PostListHeaderActions
            bulkControls={
              <BulkSelectionControls
                formId={formId}
                itemName="게시물"
                actions={[{ value: "trash", label: "선택 휴지통 이동", tone: "danger" }]}
              />
            }
            sort={sort}
            toggleSort={toggleSort}
          />
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <colgroup>
              <col className="admin-post-table-select-col" />
              <col className="admin-post-table-title-col" />
              <col className="admin-post-table-location-col" />
              <col className="admin-post-table-date-col" />
            </colgroup>
            <thead>
              <tr>
                <th className="select-column">선택</th>
                <th>제목</th>
                <th className="admin-post-public-link-cell">바로가기</th>
                <th className="admin-post-date-heading">작성일/수정일</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr className="admin-table-empty-row">
                  <td className="select-column">-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              ) : (
                posts.map((post) => {
                const manageable = canManageSystemSettings || post.authorUserId === currentUserId;

                return (
                  <tr
                    className={manageable ? "admin-table-editable-row" : undefined}
                    key={post.id}
                    onClick={() => {
                      if (manageable) {
                        onEditPost(post);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!manageable || (event.key !== "Enter" && event.key !== " ")) {
                        return;
                      }

                      event.preventDefault();
                      onEditPost(post);
                    }}
                    tabIndex={manageable ? 0 : undefined}
                  >
                    <td className="select-column">
                      <input
                        aria-label={`${post.title} 선택`}
                        data-bulk-item
                        disabled={!manageable}
                        form={formId}
                        name="ids"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        type="checkbox"
                        value={post.id}
                      />
                    </td>
                    <td>
                      {manageable ? (
                        <span className="table-title-card">
                          <span className="table-title">{post.title}</span>
                        </span>
                      ) : (
                        <span className="table-title-card table-title-card-readonly">
                          <strong className="table-title">{post.title}</strong>
                        </span>
                      )}
                    </td>
                    <td className="admin-post-public-link-cell">
                      {post.publicSiteUrl ? (
                        <a
                          className="admin-post-public-link"
                          href={post.publicSiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          열기
                        </a>
                      ) : post.visibility === "DRAFT" ? (
                        <span className="admin-post-private-tag">비공개</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="admin-post-date-cell">
                      <span className="table-date-primary">{post.createdAtText}</span>
                      {post.updatedAtText !== post.createdAtText ? (
                        <span className="table-date-secondary">수정 {post.updatedAtText}</span>
                      ) : null}
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function PostEditModal({
  isSaving,
  onClose,
  onDirtyChange,
  onPostUpdated,
  onSavingChange,
  post
}: {
  isSaving: boolean;
  onClose: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  onPostUpdated: (resultSearch?: string) => void;
  onSavingChange: (isSaving: boolean) => void;
  post: ManagePostBrowserItem;
}) {
  const [editFrame, setEditFrame] = useState<HTMLIFrameElement | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [isFrameDirty, setIsFrameDirty] = useState(false);
  const [modalTitle, setModalTitle] = useState(post.title);
  const [modalVisibility, setModalVisibility] = useState<ManagePostBrowserItem["visibility"]>(post.visibility);

  useEffect(() => {
    function handleModalMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (isEditorDirtyMessage(event.data)) {
        setIsFrameDirty(event.data.dirty);
        onDirtyChange(event.data.dirty);
        return;
      }

      if (isPostUpdatedMessage(event.data)) {
        onSavingChange(false);
        onDirtyChange(false);
        onPostUpdated();
      }
    }

    window.addEventListener("message", handleModalMessage);
    return () => window.removeEventListener("message", handleModalMessage);
  }, [onDirtyChange, onPostUpdated, onSavingChange]);

  function syncFrameTitle(value: string) {
    setModalTitle(value);
    setIsFrameDirty(true);
    onDirtyChange(true);

    if (!editFrame) {
      return;
    }

    const controls = getPostEditFrameControls(editFrame);
    if (controls?.titleInput) {
      controls.titleInput.value = value;
      controls.titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function syncFrameVisibility(value: ManagePostBrowserItem["visibility"]) {
    setModalVisibility(value);
    setIsFrameDirty(true);
    onDirtyChange(true);

    if (!editFrame) {
      return;
    }

    const controls = getPostEditFrameControls(editFrame);
    if (controls?.visibilitySelect) {
      controls.visibilitySelect.value = value;
      controls.visibilitySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function savePostFromModalHeader() {
    const controls = editFrame ? getPostEditFrameControls(editFrame) : null;
    const trimmedTitle = modalTitle.trim();

    if (!trimmedTitle) {
      alert("게시물 제목을 입력해 주세요.");
      return;
    }

    if (!controls?.form || !controls.titleInput || !controls.visibilitySelect) {
      alert("게시물 수정 화면을 아직 불러오는 중입니다. 잠시 뒤 다시 저장해 주세요.");
      return;
    }

    controls.titleInput.value = trimmedTitle;
    controls.visibilitySelect.value = modalVisibility;
    controls.titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    controls.visibilitySelect.dispatchEvent(new Event("change", { bubbles: true }));
    controls.form.requestSubmit();
  }

  return (
    <div className="admin-post-edit-modal-backdrop" role="presentation">
      <section className="admin-post-edit-modal admin-post-edit-modal-with-controls" role="dialog" aria-modal="true" aria-labelledby="post-edit-modal-title">
        <header className="admin-post-edit-modal-header">
          <h2 className="sr-only" id="post-edit-modal-title">
            게시물 수정
          </h2>
          <div className="admin-post-edit-header-controls">
            <label className="sr-only" htmlFor={`post-edit-modal-title-input-${post.id}`}>
              게시물 제목
            </label>
            <input
              autoComplete="off"
              className="text-input admin-post-edit-header-title"
              disabled={isSaving}
              id={`post-edit-modal-title-input-${post.id}`}
              placeholder="게시물의 제목을 입력하세요"
              value={modalTitle}
              onChange={(event) => syncFrameTitle(event.target.value)}
            />

            <label className="sr-only" htmlFor={`post-edit-modal-visibility-${post.id}`}>
              공개 상태
            </label>
            <select
              aria-label="공개 상태"
              className="select-input admin-post-edit-header-select"
              disabled={isSaving}
              id={`post-edit-modal-visibility-${post.id}`}
              value={modalVisibility}
              onChange={(event) => syncFrameVisibility(event.target.value as ManagePostBrowserItem["visibility"])}
            >
              <option value="PUBLIC">공개</option>
              <option value="DRAFT">비공개</option>
            </select>
            <button
              aria-busy={isSaving}
              className="button admin-post-edit-header-save"
              disabled={isSaving || !isFrameReady || !isFrameDirty}
              type="button"
              onClick={savePostFromModalHeader}
            >
              {isSaving ? "저장 중" : "수정 저장"}
            </button>
          </div>
          <button
            aria-disabled={isSaving}
            aria-label={isSaving ? "저장 중에는 수정 창을 닫을 수 없습니다" : "수정 창 닫기"}
            className="admin-post-edit-modal-close"
            disabled={isSaving}
            onClick={onClose}
            title={isSaving ? "저장 중에는 닫을 수 없습니다" : "수정 창 닫기"}
            type="button"
          >
            ×
          </button>
        </header>
        <iframe
          className="admin-post-edit-modal-frame"
          src={`/site-admin/posts/${post.id}?modal=1&editor=links-v3`}
          title={`${post.title} 수정`}
          onLoad={(event) => {
            const iframe = event.currentTarget;
            onSavingChange(false);

            try {
              const location = iframe.contentWindow?.location;
              if (!location) {
                return;
              }

              if (location.pathname === `/site-admin/posts/${post.id}`) {
                const params = new URLSearchParams(location.search);
                if (params.get("saved") === "1") {
                  onPostUpdated();
                }
                const controls = getPostEditFrameControls(iframe);
                if (controls?.form && controls.titleInput && controls.visibilitySelect && params.get("saved") !== "1") {
                  const { form, titleInput, visibilitySelect } = controls;

                  form.addEventListener("submit", () => onSavingChange(true), { once: true });
                  setEditFrame(iframe);
                  setIsFrameReady(true);
                  setIsFrameDirty(false);
                  onDirtyChange(false);
                  setModalTitle(titleInput.value);
                  if (isManagePostVisibility(visibilitySelect.value)) {
                    setModalVisibility(visibilitySelect.value);
                  }
                  titleInput.addEventListener("input", () => setModalTitle(titleInput.value));
                  visibilitySelect.addEventListener("change", () => {
                    if (isManagePostVisibility(visibilitySelect.value)) {
                      setModalVisibility(visibilitySelect.value);
                    }
                  });
                }
                return;
              }

              if (location.pathname === "/site-admin") {
                onPostUpdated(location.search);
              }
            } catch {
              // The iframe is same-origin in normal use. If access is blocked, keep the modal open.
            }
          }}
        />
      </section>
    </div>
  );
}

function getPostUpdatedListUrl(resultSearch = "") {
  const params = new URLSearchParams(window.location.search);
  const resultParams = new URLSearchParams(resultSearch);
  const error = resultParams.get("error");
  const message = resultParams.get("message") ?? "updated";

  params.set("section", "manage-posts");
  if (error) {
    params.set("error", error);
    params.delete("message");
  } else {
    params.set("message", message);
    params.delete("error");
  }

  return `/site-admin?${params.toString()}`;
}

function isPostUpdatedMessage(value: unknown): value is { type: "site-admin-post-updated" } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      (value as { type?: unknown }).type === "site-admin-post-updated"
  );
}

function isEditorDirtyMessage(value: unknown): value is { dirty: boolean; formId?: string; type: "cms-editor-dirty-change" } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      (value as { type?: unknown }).type === "cms-editor-dirty-change" &&
      typeof (value as { dirty?: unknown }).dirty === "boolean"
  );
}

function DeletedPostList({
  canManageSystemSettings,
  deletedResources,
  posts,
  sort,
  toggleSort
}: {
  canManageSystemSettings: boolean;
  deletedResources: ManageDeletedResourceItem[];
  posts: ManageDeletedPostItem[];
  sort: `${ManageSortField}-${ManageSortDirection}`;
  toggleSort: (field: ManageSortField) => void;
}) {
  const empty = posts.length + deletedResources.length === 0;
  const formId = "post-trash-bulk-form";
  const bulkActions = canManageSystemSettings
    ? [
        { value: "restore", label: "선택 복구" },
        { value: "permanent-delete", label: "선택 완전 삭제", tone: "danger" as const }
      ]
    : [{ value: "restore", label: "선택 복구" }];

  return (
    <article className="surface-card" id="trash">
      <div className="card-body section-stack admin-post-list-card-body">
        <form className="admin-bulk-hidden-form" action={bulkSitePostAction} id={formId} />
        <div className="section-heading admin-post-list-heading">
          <PostListHeaderActions
            bulkControls={posts.length > 0 ? <BulkSelectionControls formId={formId} itemName="휴지통 게시물" actions={bulkActions} /> : null}
            sort={sort}
            toggleSort={toggleSort}
          />
        </div>
        {posts.length > 0 ? (
          <>
            <div className="admin-list">
              {posts.map((post) => (
                <article className="item-card item-card-selectable" key={post.id}>
                  <label className="bulk-checkbox-label">
                    <input aria-label={`${post.title} 선택`} data-bulk-item form={formId} name="ids" type="checkbox" value={post.id} />
                  </label>
                  <div>
                    <p className="item-title">공지: {post.title}</p>
                    <p className="item-subtitle">
                      {post.categoryLabel} · 작성자: {post.authorName} · 삭제일: {post.deletedAtText}
                    </p>
                  </div>
                  <div className="actions-row">
                    <form action={restoreSitePostAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <FormSubmitButton className="button-secondary" label="복구하기" pendingLabel="복구 중..." />
                    </form>
                    {canManageSystemSettings ? (
                      <form action={permanentlyDeleteSitePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <FormSubmitButton className="button-danger" label="완전 삭제" pendingLabel="삭제 중..." />
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
        <div className="admin-list">
          {deletedResources.map((resource) => (
            <article className="item-card" key={resource.id}>
              <div>
                <p className="item-title">자료: {resource.title}</p>
                <p className="item-subtitle">
                  {resource.meta} · 삭제일: {resource.deletedAtText}
                </p>
              </div>
              <div className="actions-row">
                <form action={restoreSiteResourceAction}>
                  <input type="hidden" name="id" value={resource.id} />
                  <FormSubmitButton className="button-secondary" label="복구하기" pendingLabel="복구 중..." />
                </form>
                {canManageSystemSettings ? (
                  <form action={permanentlyDeleteSiteResourceAction}>
                    <input type="hidden" name="id" value={resource.id} />
                    <FormSubmitButton className="button-danger" label="완전 삭제" pendingLabel="삭제 중..." />
                  </form>
                ) : null}
              </div>
            </article>
          ))}
          {empty ? <p className="hint">조건에 맞는 삭제 항목이 없습니다.</p> : null}
        </div>
      </div>
    </article>
  );
}

function getAuthorOptions(authors: string[], posts: ManagePostBrowserItem[]) {
  const authorNames = Array.from(
    new Set([...authors.map((author) => author.trim()).filter(Boolean), ...posts.map((post) => post.authorName.trim()).filter(Boolean)])
  ).sort(compareAuthorNames);

  return authorNames.map((author) => ({
    label: author,
    value: author
  }));
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

function getDefaultAuthorValue(author: string | undefined, authors: string[], posts: ManagePostBrowserItem[]) {
  const authorOptions = getAuthorOptions(authors, posts);

  if (author && authorOptions.some((option) => option.value === author)) {
    return author;
  }

  return authorOptions[0]?.value ?? filterAllValue;
}

function getDisplayedDateRangeOptions(from: string, to: string) {
  return dateRangeOptions.map((option) =>
    option.value === "custom" ? { ...option, label: getCustomDateRangeLabel(from, to) } : option
  );
}

function getCustomDateRangeLabel(from: string, to: string) {
  if (from && to) {
    return `${from} ~ ${to}`;
  }

  if (from) {
    return `${from}부터`;
  }

  if (to) {
    return `${to}까지`;
  }

  return "직접 지정";
}

function filterManageItems(
  items: Array<ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem>,
  filters: {
    author: string;
    customDateFrom: string;
    customDateTo: string;
    dateRange: ManageDateRange;
    label: string;
    query: string;
  }
) {
  return items.filter((item) => {
    const authorMatch =
      filters.author === filterAllValue || ("authorName" in item ? item.authorName === filters.author : true);
    const labelMatch = filters.label === filterAllValue || item.labels.includes(filters.label);
    const dateMatch = isInDateRange(item, filters.dateRange, filters.customDateFrom, filters.customDateTo);
    const queryMatch = matchesQuery(item, filters.query);

    return authorMatch && labelMatch && dateMatch && queryMatch;
  });
}

function getCategoryTabCounts(items: Array<ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem>) {
  const counts = new Map<ManagePostCategory, number>();

  categoryOptions.forEach((option) => counts.set(option.value, 0));
  items.forEach((item) => {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  });

  return counts;
}

function matchesStatus(post: ManagePostBrowserItem, status: ManagePostStatus) {
  if (status === "PUBLIC") {
    return post.visibility === "PUBLIC";
  }

  if (status === "PRIVATE") {
    return post.visibility !== "PUBLIC";
  }

  return false;
}

function matchesQuery(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return getSearchTarget(item).includes(normalizedQuery);
}

function getSearchTarget(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem) {
  return [
    item.title,
    item.categoryLabel,
    "authorName" in item ? item.authorName : "",
    "publicLocationLabel" in item ? item.publicLocationLabel : "",
    "statusLabel" in item ? item.statusLabel : "",
    "meta" in item ? item.meta : "",
    item.labels.join(" ")
  ]
    .join(" ")
    .toLowerCase();
}

function isInDateRange(
  item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem,
  dateRange: ManageDateRange,
  customDateFrom: string,
  customDateTo: string
) {
  if (dateRange === "all") {
    return true;
  }

  const activityTime = getActivityTime(item);
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

function getActivityTime(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem) {
  if ("deletedAtIso" in item) {
    return Date.parse(item.deletedAtIso);
  }

  return Date.parse(item.updatedAtIso);
}

function getDateInputStartTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function getDateInputEndTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setDate(parsed.getDate() + 1);
  return parsed.getTime();
}

function compareItems(
  left: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem,
  right: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem,
  sort: `${ManageSortField}-${ManageSortDirection}`
) {
  const field = sort.startsWith("updated") ? "updated" : "created";
  const direction = sort.endsWith("asc") ? "asc" : "desc";
  const leftValue = field === "updated" ? left.updatedAtIso : left.createdAtIso;
  const rightValue = field === "updated" ? right.updatedAtIso : right.createdAtIso;
  const comparison = leftValue.localeCompare(rightValue);

  return direction === "asc" ? comparison : comparison * -1;
}

function getNextSortMode(current: `${ManageSortField}-${ManageSortDirection}`, field: ManageSortField) {
  if (current === `${field}-desc`) {
    return `${field}-asc` as const;
  }

  return `${field}-desc` as const;
}

function getSortArrow(current: `${ManageSortField}-${ManageSortDirection}`, field: ManageSortField) {
  return current === `${field}-asc` ? "↑" : "↓";
}

function getSortButtonLabel(current: `${ManageSortField}-${ManageSortDirection}`, field: ManageSortField) {
  const fieldLabel = field === "created" ? "작성일" : "수정일";
  const directionLabel = current === `${field}-asc` ? "오래된순" : "최신순";

  return `${fieldLabel} ${directionLabel} 정렬`;
}

function getPostEditFrameControls(iframe: HTMLIFrameElement) {
  try {
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      return null;
    }

    return {
      form: frameDocument.querySelector<HTMLFormElement>("form.admin-editor-form"),
      titleInput: frameDocument.querySelector<HTMLInputElement>('input[name="title"]'),
      visibilitySelect: frameDocument.querySelector<HTMLSelectElement>('select[name="visibility"]')
    };
  } catch {
    return null;
  }
}

function isManagePostVisibility(value: string): value is ManagePostBrowserItem["visibility"] {
  return value === "PUBLIC" || value === "DRAFT";
}

function isActivePost(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem): item is ManagePostBrowserItem {
  return !("deletedAtIso" in item);
}

function isDeletedPost(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem): item is ManageDeletedPostItem {
  return "deletedAtIso" in item && "authorName" in item;
}

function isDeletedResource(item: ManagePostBrowserItem | ManageDeletedPostItem | ManageDeletedResourceItem): item is ManageDeletedResourceItem {
  return "deletedAtIso" in item && "meta" in item;
}
