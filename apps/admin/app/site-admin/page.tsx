import { redirect } from "next/navigation";
import { SiteContentVisibility, SitePostCategory } from "@prisma/client";
import { AdminSectionNav } from "@/app/site-admin/admin-section-nav";
import { AdminToast } from "@/app/site-admin/admin-toast";
import { InlineAuthorProfileForm } from "@/app/site-admin/inline-author-profile-form";
import { LogoutButton } from "@/app/site-admin/logout-button";
import {
  PostManagementBrowser,
  type ManageDeletedPostItem,
  type ManageDeletedResourceItem,
  type ManagePostBrowserFilters,
  type ManagePostBrowserItem
} from "@/app/site-admin/post-management-browser";
import { PostFormFields } from "@/app/site-admin/post-form-fields";
import { ScheduleManagementBrowser } from "@/app/site-admin/schedule-management-browser";
import { NewScheduleForm } from "@/app/site-admin/new-schedule-form";
import { SiteAdminAutocompleteGuard } from "@/app/site-admin/site-admin-autocomplete-guard";
import {
  createGeneralScheduleAction,
  createSitePostAction,
  createWorkshopRunAction
} from "@/app/site-admin/actions";
import { resolveSiteAdminAccess, type SiteAdminAccess } from "@/lib/site-admin/access";
import {
  sitePostCategoryLabels,
  sitePostLabelOptions,
  siteVisibilityLabels,
  siteWorkshopOptions,
  type SiteWorkshopSlug
} from "@/lib/site-admin/constants";
import { workshopStagePresets } from "@/lib/site-admin/workshop-stage-presets";
import { getPostPublicLocationLabel } from "@/lib/site-admin/post-routing";
import { getPublicHomeNoticePopupUrl, getPublicNoticePopupUrl } from "@/lib/site-admin/public-site-links";
import {
  getAuthorDisplayName,
  getSiteAdminOverview,
  type SiteAdminDateRangeFilter,
  type SiteAdminOverviewSection,
  type SiteAdminPostStatusFilter,
  type SiteAdminSortDirection
} from "@/lib/site-admin/queries";
import { formatSeoulCompactDateTime, formatSeoulDateTime } from "@/lib/site-admin/time";

type SiteAdminPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    q?: string;
    author?: string;
    category?: string;
    visibility?: string;
    label?: string;
    status?: string;
    range?: string;
    from?: string;
    to?: string;
    resourceWorkshop?: string;
    scheduleWorkshop?: string;
    scheduleSort?: string;
    sort?: string;
    sortMode?: string;
    direction?: string;
    section?: string;
  }>;
};

type AdminSection = SiteAdminOverviewSection;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const managePostCategories = [
  SitePostCategory.GENERAL,
  SitePostCategory.COUNSELING,
  SitePostCategory.GREEN_BOARD,
  SitePostCategory.RESOURCE
] as const;

const managePostStatusOptions: Array<{ label: string; value: SiteAdminPostStatusFilter }> = [
  { label: "공개", value: "PUBLIC" },
  { label: "비공개", value: "PRIVATE" },
  { label: "삭제", value: "DELETED" }
];

const managePostDateRangeOptions: Array<{ label: string; value: SiteAdminDateRangeFilter }> = [
  { label: "조회기간 선택", value: "all" },
  { label: "최근 1주일", value: "7d" },
  { label: "최근 30일", value: "30d" },
  { label: "직접 지정", value: "custom" }
];

const adminSections: Array<{ description: string; href: string; key: AdminSection; label: string }> = [
  {
    key: "schedules",
    label: "새 일정 등록",
    description: "기본 일정과 프로그램 일정을 새로 등록",
    href: "/site-admin?section=schedules"
  },
  {
    key: "manage-schedules",
    label: "기존 일정 관리",
    description: "등록된 일정 미리보기, 수정, 삭제, 복구",
    href: "/site-admin?section=manage-schedules"
  },
  {
    key: "new-post",
    label: "새 게시물 작성",
    description: "공지사항, 안내, 자유게시판, 자료실 글을 새로 작성",
    href: "/site-admin?section=new-post"
  },
  {
    key: "manage-posts",
    label: "기존 게시물 관리",
    description: "기존 게시물 검색, 수정, 삭제, 복구",
    href: "/site-admin?section=manage-posts"
  }
];

const messageLabels: Record<string, string> = {
  created: "게시물을 저장했습니다. 공개 상태가 공개인 글은 공개 사이트에 바로 보입니다.",
  updated: "게시물을 수정했습니다. 공개 상태가 공개인 글은 공개 사이트에 바로 보입니다.",
  deleted: "게시물을 휴지통으로 보냈습니다.",
  restored: "게시물을 복구했습니다.",
  "hard-deleted": "게시물을 완전히 삭제했습니다.",
  "resource-created": "자료실 링크를 저장했습니다.",
  "resource-updated": "자료실 링크를 수정했습니다.",
  "resource-deleted": "자료실 링크를 휴지통으로 보냈습니다.",
  "resource-restored": "자료실 링크를 복구했습니다.",
  "resource-hard-deleted": "자료실 링크를 완전히 삭제했습니다.",
  "schedule-created": "일정을 저장했습니다. 공개 상태가 공개인 일정은 공개 사이트 달력에 바로 보입니다.",
  "schedule-updated": "일정을 수정했습니다. 공개 상태가 공개인 일정은 공개 사이트 달력에 바로 보입니다.",
  "schedule-deleted": "일정을 휴지통으로 보냈습니다.",
  "schedule-restored": "일정을 복구했습니다.",
  "schedule-hard-deleted": "일정을 완전히 삭제했습니다.",
  "profile-updated": "별명을 저장했습니다."
};

const errorLabels: Record<string, string> = {
  "post-permission": "이 게시물을 수정하거나 삭제할 권한이 없습니다.",
  "post-required-fields": "제목, 본문, 공개 상태, 카테고리를 확인해 주세요.",
  "related-workshop-not-allowed": "선택한 카테고리에서 사용할 수 없는 라벨입니다.",
  "resource-permission": "이 자료실 링크를 수정하거나 삭제할 권한이 없습니다.",
  "schedule-permission": "이 일정을 수정하거나 삭제할 권한이 없습니다.",
  "schedule-link-invalid": "신청 form 링크 또는 관련 공지글 ID 형식을 확인해 주세요.",
  "schedule-notice-post-unavailable": "관련 공지글을 찾을 수 없거나 공개 상태가 아닙니다. 공개 게시물 ID만 연결해 주세요.",
  "bulk-action-invalid": "알 수 없는 일괄 작업입니다. 다시 선택해 주세요.",
  "bulk-selection-required": "처리할 게시물을 먼저 선택해 주세요.",
  "schedule-bulk-selection-required": "처리할 일정을 먼저 선택해 주세요.",
  "hard-delete-permission": "완전 삭제는 관리자 계정만 사용할 수 있습니다.",
  "display-name-invalid": "별명은 공백 없이 한글, 영문, 숫자만 사용해 2~12자로 입력해 주세요."
};

export default async function SiteAdminPage({ searchParams }: SiteAdminPageProps) {
  const access = await loadSiteAdminAccess();
  if (!access) {
    redirect("/signin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = parseFilters(resolvedSearchParams);
  const activeSection = parseSection(resolvedSearchParams?.section);
  const overview = await loadSiteAdminOverview(access, filters, activeSection);
  const displayName = access.displayName;
  const message = resolvedSearchParams?.message ? messageLabels[resolvedSearchParams.message] : "";
  const error = resolvedSearchParams?.error ? errorLabels[resolvedSearchParams.error] : "";
  const previewNowIso = new Date().toISOString();

  return (
    <main className="page-shell admin-page-shell" id="main-content">
      <SiteAdminAutocompleteGuard />
      <header className="admin-topbar">
        <AdminSectionNav activeSection={activeSection} sections={adminSections} />
        <div className="admin-session-actions" aria-label="현재 로그인 계정">
          <InlineAuthorProfileForm displayName={displayName} />
          <span className="admin-session-email" title={access.user.email}>{access.user.email}</span>
          <LogoutButton />
        </div>
      </header>

      {message || error ? (
        <AdminToast key={`${message ? "success" : "error"}:${message || error}`} message={message || error} tone={message ? "success" : "error"} />
      ) : null}

      <div className="admin-workspace section">
        <section className="admin-workspace-panel" aria-label={getSectionLabel(activeSection)}>
          {activeSection === "new-post" ? <NewPostSection /> : null}
          {activeSection === "manage-posts" ? (
            <PostManagementBrowser
              authors={overview.authors}
              canManageSystemSettings={access.canManageSystemSettings}
              currentUserId={access.appUserId}
              deletedPosts={overview.deletedPosts.filter((post) => isManagePostCategory(post.category)).map(toManageDeletedPostItem)}
              deletedResources={overview.deletedResources.map(toManageDeletedResourceItem)}
              initialFilters={toManagePostBrowserFilters(filters)}
              posts={overview.posts.filter((post) => isManagePostCategory(post.category)).map(toManagePostBrowserItem)}
            />
          ) : null}
          {activeSection === "schedules" ? (
            <NewSchedulePanel />
          ) : null}
          {activeSection === "manage-schedules" ? (
            <ManageSchedulesPanel
              access={access}
              deletedGeneralSchedules={overview.deletedGeneralSchedules}
              deletedWorkshopRuns={overview.deletedWorkshopRuns}
              generalSchedules={overview.generalSchedules}
              previewNowIso={previewNowIso}
              selectedScheduleSort={resolvedSearchParams?.scheduleSort}
              selectedScheduleWorkshop={filters.scheduleWorkshop}
              workshopRuns={overview.workshopRuns}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

async function loadSiteAdminAccess() {
  try {
    return await resolveSiteAdminAccess();
  } catch (error) {
    logSiteAdminPageError("access", error);
    throw error;
  }
}

async function loadSiteAdminOverview(
  access: SiteAdminAccess,
  filters: ReturnType<typeof parseFilters>,
  activeSection: AdminSection
) {
  try {
    const overviewFilters =
      activeSection === "manage-posts"
        ? { direction: "desc" as const, sort: "created" as const }
        : activeSection === "manage-schedules"
          ? { ...filters, scheduleWorkshop: undefined }
          : filters;
    return await getSiteAdminOverview(access, overviewFilters, activeSection);
  } catch (error) {
    logSiteAdminPageError("overview", error, { activeSection });
    throw error;
  }
}

function logSiteAdminPageError(stage: "access" | "overview", error: unknown, context: Record<string, string> = {}) {
  console.error("[site-admin] page load failed", {
    stage,
    ...context,
    ...serializeSiteAdminError(error)
  });
}

function serializeSiteAdminError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return {
    message: String(error),
    name: typeof error
  };
}

function NewPostSection() {
  const formId = "site-post-create-form";

  return (
    <section className="admin-editor-shell">
      <form autoComplete="off" className="admin-editor-form" action={createSitePostAction} id={formId}>
        <PostFormFields formId={formId} submitLabel="게시물 저장" />
      </form>
    </section>
  );
}

function toManagePostBrowserFilters(filters: ReturnType<typeof parseFilters>): ManagePostBrowserFilters {
  return {
    author: filters.author,
    category: filters.category,
    direction: filters.direction,
    from: filters.from,
    label: filters.label,
    q: filters.q,
    range: filters.range,
    sort: filters.sort,
    status: filters.status,
    to: filters.to
  };
}

function toManagePostBrowserItem(post: Awaited<ReturnType<typeof getSiteAdminOverview>>["posts"][number]): ManagePostBrowserItem {
  return {
    authorName: getAuthorDisplayName(post.author),
    authorUserId: post.authorUserId,
    category: post.category as ManagePostBrowserItem["category"],
    categoryLabel: sitePostCategoryLabels[post.category],
    createdAtIso: post.createdAt.toISOString(),
    createdAtText: post.legacyCreatedAtUnknown ? "작성일 미상" : formatCompactDateTime(post.createdAt),
    id: post.id,
    labels: post.labels,
    publicLocationLabel: getPostPublicLocationLabel(post.category, post.labels),
    publicSiteUrl: post.visibility === SiteContentVisibility.PUBLIC ? getPublicNoticePopupUrl(post.id) : null,
    statusLabel: siteVisibilityLabels[post.visibility],
    title: post.title,
    updatedAtIso: post.updatedAt.toISOString(),
    updatedAtText: formatCompactDateTime(post.updatedAt),
    visibility: post.visibility
  };
}

function toManageDeletedPostItem(
  post: Awaited<ReturnType<typeof getSiteAdminOverview>>["deletedPosts"][number]
): ManageDeletedPostItem {
  return {
    ...toManagePostBrowserItem(post),
    deletedAtIso: (post.deletedAt ?? post.updatedAt).toISOString(),
    deletedAtText: formatDateTime(post.deletedAt ?? post.updatedAt)
  };
}

function toManageDeletedResourceItem(
  resource: Awaited<ReturnType<typeof getSiteAdminOverview>>["deletedResources"][number]
): ManageDeletedResourceItem {
  return {
    category: "RESOURCE",
    categoryLabel: sitePostCategoryLabels[SitePostCategory.RESOURCE],
    createdAtIso: resource.createdAt.toISOString(),
    deletedAtIso: (resource.deletedAt ?? resource.updatedAt).toISOString(),
    deletedAtText: formatDateTime(resource.deletedAt ?? resource.updatedAt),
    id: resource.id,
    labels: [],
    meta: `${getWorkshopTitle(resource.workshopSlug)} · ${resource.session}`,
    title: resource.title,
    updatedAtIso: resource.updatedAt.toISOString()
  };
}

function isManagePostCategory(category: SitePostCategory): category is ManagePostBrowserItem["category"] {
  return managePostCategories.includes(category as ManagePostBrowserItem["category"]);
}

function NewSchedulePanel() {
  const workshopOptions = siteWorkshopOptions.map((workshop) => ({
    slug: workshop.slug as SiteWorkshopSlug,
    label: workshop.shortName
  }));

  return (
    <article className="surface-card schedule-create-card" id="workshop-schedules">
      <div className="card-body section-stack">
        <NewScheduleForm
          workshopOptions={workshopOptions}
          workshopStagePresets={workshopStagePresets}
          createGeneralAction={createGeneralScheduleAction}
          createWorkshopRunAction={createWorkshopRunAction}
        />
      </div>
    </article>
  );
}

function ManageSchedulesPanel({
  access,
  deletedGeneralSchedules,
  deletedWorkshopRuns,
  generalSchedules,
  previewNowIso,
  selectedScheduleSort,
  selectedScheduleWorkshop,
  workshopRuns
}: {
  access: SiteAdminAccess;
  deletedGeneralSchedules: Awaited<ReturnType<typeof getSiteAdminOverview>>["deletedGeneralSchedules"];
  deletedWorkshopRuns: Awaited<ReturnType<typeof getSiteAdminOverview>>["deletedWorkshopRuns"];
  generalSchedules: Awaited<ReturnType<typeof getSiteAdminOverview>>["generalSchedules"];
  previewNowIso: string;
  selectedScheduleSort?: string;
  selectedScheduleWorkshop?: string;
  workshopRuns: Awaited<ReturnType<typeof getSiteAdminOverview>>["workshopRuns"];
}) {
  return (
    <section id="manage-schedules">
      <ScheduleManagementBrowser
        canManageSystemSettings={access.canManageSystemSettings}
        deletedGeneralSchedules={deletedGeneralSchedules.map(toScheduleManagementGeneralItem)}
        deletedWorkshopRuns={deletedWorkshopRuns.map(toScheduleManagementWorkshopRunItem)}
        generalSchedules={generalSchedules.map(toScheduleManagementGeneralItem)}
        initialScheduleSort={selectedScheduleSort}
        initialScheduleWorkshop={selectedScheduleWorkshop}
        nowIso={previewNowIso}
        workshopRuns={workshopRuns.map(toScheduleManagementWorkshopRunItem)}
      />
    </section>
  );
}

function toScheduleManagementGeneralItem(
  schedule: Awaited<ReturnType<typeof getSiteAdminOverview>>["generalSchedules"][number]
) {
  return {
    dateIso: schedule.date.toISOString(),
    description: schedule.description,
    endsAtIso: (schedule.endsAt ?? schedule.date).toISOString(),
    id: schedule.id,
    title: schedule.title,
    visibility: schedule.visibility === SiteContentVisibility.PUBLIC ? "PUBLIC" as const : "DRAFT" as const
  };
}

function toScheduleManagementWorkshopRunItem(
  run: Awaited<ReturnType<typeof getSiteAdminOverview>>["workshopRuns"][number]
) {
  const linkedNoticePost = getAvailableScheduleNoticePost(run.noticePost);

  return {
    applicationFormUrl: run.applicationFormUrl,
    description: run.description,
    id: run.id,
    noticePostId: linkedNoticePost?.id ?? null,
    noticePostTitle: linkedNoticePost?.title ?? null,
    noticePostUrl: linkedNoticePost ? getPublicHomeNoticePopupUrl(linkedNoticePost.id) : null,
    runNumber: run.runNumber,
    stages: run.stages.map((stage) => ({
      applicationFormUrl: stage.applicationFormUrl,
      applicationEndsAtIso: stage.applicationEndsAt?.toISOString() ?? null,
      applicationStartsAtIso: stage.applicationStartsAt?.toISOString() ?? null,
      id: stage.id,
      noticePostId: stage.noticePostId,
      noticePostTitle: getAvailableScheduleNoticePost(stage.noticePost)?.title ?? null,
      noticePostUrl: getScheduleNoticePostUrl(stage.noticePost),
      sessions: stage.sessions.map((session) => ({
        applicationFormUrl: session.applicationFormUrl,
        dayIndex: session.dayIndex,
        endTime: session.endTime,
        id: session.id,
        noticePostId: session.noticePostId,
        noticePostTitle: getAvailableScheduleNoticePost(session.noticePost)?.title ?? null,
        noticePostUrl: getScheduleNoticePostUrl(session.noticePost),
        sessionDateIso: session.sessionDate.toISOString(),
        startTime: session.startTime
      })),
      stageName: stage.stageName
    })),
    visibility: run.visibility === SiteContentVisibility.PUBLIC ? "PUBLIC" as const : "DRAFT" as const,
    workshopSlug: run.workshopSlug,
    year: run.year
  };
}

type ScheduleNoticePostCandidate = {
  deletedAt: Date | null;
  id: string;
  title: string;
  visibility: SiteContentVisibility;
} | null;

function getAvailableScheduleNoticePost(post: ScheduleNoticePostCandidate) {
  return post && !post.deletedAt && post.visibility === SiteContentVisibility.PUBLIC ? post : null;
}

function getScheduleNoticePostUrl(post: ScheduleNoticePostCandidate) {
  const availablePost = getAvailableScheduleNoticePost(post);
  return availablePost ? getPublicHomeNoticePopupUrl(availablePost.id) : null;
}


function parseFilters(searchParams: Awaited<SiteAdminPageProps["searchParams"]> | undefined) {
  const parsedCategory = Object.values(SitePostCategory).includes(searchParams?.category as SitePostCategory)
    ? (searchParams?.category as SitePostCategory)
    : undefined;
  const category = managePostCategories.includes(parsedCategory as (typeof managePostCategories)[number])
    ? (parsedCategory as (typeof managePostCategories)[number])
    : SitePostCategory.GENERAL;
  const visibility = Object.values(SiteContentVisibility).includes(searchParams?.visibility as SiteContentVisibility)
    ? (searchParams?.visibility as SiteContentVisibility)
    : undefined;
  const label = sitePostLabelOptions.includes(searchParams?.label as (typeof sitePostLabelOptions)[number])
    ? searchParams?.label
    : undefined;
  const author = searchParams?.author?.trim() || undefined;
  const status = parsePostStatus(searchParams?.status) ?? getLegacyStatusFromVisibility(visibility) ?? "PUBLIC";
  const range = parseDateRange(searchParams?.range);
  const from = parseDateInputValue(searchParams?.from);
  const to = parseDateInputValue(searchParams?.to);
  const resourceWorkshop = siteWorkshopOptions.some((workshop) => workshop.slug === searchParams?.resourceWorkshop)
    ? searchParams?.resourceWorkshop
    : undefined;
  const scheduleWorkshop =
    searchParams?.scheduleWorkshop &&
    (searchParams.scheduleWorkshop === "general" ||
      searchParams.scheduleWorkshop === "trash" ||
      siteWorkshopOptions.some((workshop) => workshop.slug === searchParams.scheduleWorkshop))
      ? searchParams.scheduleWorkshop
      : undefined;
  const { direction, sort } = parseSort(searchParams?.sortMode, searchParams?.sort, searchParams?.direction);
  const q = searchParams?.q?.trim() || undefined;

  return {
    q,
    author,
    category,
    visibility,
    label,
    status,
    range,
    from,
    to,
    resourceWorkshop,
    scheduleWorkshop,
    sort,
    direction
  };
}

function parsePostStatus(value: string | undefined): SiteAdminPostStatusFilter | undefined {
  return managePostStatusOptions.some((option) => option.value === value) ? (value as SiteAdminPostStatusFilter) : undefined;
}

function getLegacyStatusFromVisibility(visibility: SiteContentVisibility | undefined): SiteAdminPostStatusFilter | undefined {
  if (visibility === SiteContentVisibility.PUBLIC) {
    return "PUBLIC";
  }

  if (visibility) {
    return "PRIVATE";
  }

  return undefined;
}

function parseDateRange(value: string | undefined): SiteAdminDateRangeFilter {
  return managePostDateRangeOptions.some((option) => option.value === value) ? (value as SiteAdminDateRangeFilter) : "all";
}

function parseDateInputValue(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function parseSort(sortMode: string | undefined, sortValue: string | undefined, directionValue: string | undefined) {
  const [modeSort, modeDirection] = sortMode?.split(":") ?? [];
  const sort = parseSortField(modeSort) ?? parseSortField(sortValue) ?? "created";
  const direction = parseSortDirection(modeDirection) ?? parseSortDirection(directionValue) ?? "desc";

  return { direction, sort };
}

function parseSortField(value: string | undefined): "created" | "updated" | undefined {
  return value === "created" || value === "updated" ? value : undefined;
}

function parseSortDirection(value: string | undefined): SiteAdminSortDirection | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function parseSection(section: string | undefined): AdminSection {
  if (section === "posts" || section === "trash" || section === "resources") {
    return "manage-posts";
  }

  if (section === "profile") {
    return "new-post";
  }

  return adminSections.some((item) => item.key === section) ? (section as AdminSection) : "manage-schedules";
}

function getSectionLabel(section: AdminSection) {
  return adminSections.find((item) => item.key === section)?.label ?? "새 게시물 작성";
}

function getWorkshopTitle(workshopSlug: string) {
  return siteWorkshopOptions.find((workshop) => workshop.slug === workshopSlug)?.title ?? workshopSlug;
}

function formatDateTime(value: Date) {
  return formatSeoulDateTime(value, { timeZoneLabel: true });
}

function formatCompactDateTime(value: Date) {
  return formatSeoulCompactDateTime(value);
}
