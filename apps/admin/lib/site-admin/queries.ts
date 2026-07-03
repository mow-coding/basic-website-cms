import { Prisma, SiteContentVisibility, SitePostCategory } from "@prisma/client";
import { db } from "@/lib/db";
import type { SiteAdminAccess } from "@/lib/site-admin/access";

export type SiteAdminOverviewSection = "new-post" | "manage-posts" | "schedules" | "manage-schedules" | "profile";
export type SiteAdminPostStatusFilter = "PUBLIC" | "PRIVATE" | "DELETED";
export type SiteAdminDateRangeFilter = "all" | "7d" | "30d" | "custom";
export type SiteAdminSortDirection = "asc" | "desc";

export type SiteAdminOverviewFilters = {
  q?: string;
  category?: SitePostCategory;
  visibility?: SiteContentVisibility;
  label?: string;
  author?: string;
  status?: SiteAdminPostStatusFilter;
  range?: SiteAdminDateRangeFilter;
  from?: string;
  to?: string;
  resourceWorkshop?: string;
  scheduleWorkshop?: string;
  sort?: "created" | "updated";
  direction?: SiteAdminSortDirection;
};

const authorSelect = {
  email: true,
  authorProfile: {
    select: { displayName: true }
  }
} satisfies Prisma.UserSelect;


const postListSelect = {
  id: true,
  authorUserId: true,
  title: true,
  legacyCreatedAtUnknown: true,
  category: true,
  labels: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect
  }
} satisfies Prisma.SitePostSelect;

const deletedPostListSelect = {
  id: true,
  authorUserId: true,
  title: true,
  legacyCreatedAtUnknown: true,
  category: true,
  labels: true,
  visibility: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: authorSelect
  }
} satisfies Prisma.SitePostSelect;

export type SiteAdminOverviewData = {
  authors: string[];
  posts: Awaited<ReturnType<typeof getActivePosts>>;
  deletedPosts: Awaited<ReturnType<typeof getDeletedPosts>>;
  resources: Awaited<ReturnType<typeof getActiveResources>>;
  deletedResources: Awaited<ReturnType<typeof getDeletedResources>>;
  generalSchedules: Awaited<ReturnType<typeof getActiveGeneralSchedules>>;
  deletedGeneralSchedules: Awaited<ReturnType<typeof getDeletedGeneralSchedules>>;
  workshopRuns: Awaited<ReturnType<typeof getActiveWorkshopRuns>>;
  deletedWorkshopRuns: Awaited<ReturnType<typeof getDeletedWorkshopRuns>>;
  workshopNoticeOptions: Awaited<ReturnType<typeof getWorkshopNoticeOptions>>;
};

export async function getSiteAdminOverview(
  access: SiteAdminAccess,
  filters: SiteAdminOverviewFilters = {},
  section?: SiteAdminOverviewSection
): Promise<SiteAdminOverviewData> {
  const result = createEmptyOverview();
  const shouldLoadEverything = !section;
  const tasks: Array<Promise<void>> = [];

  if (shouldLoadEverything || section === "manage-posts") {
    tasks.push(
      getActivePosts(filters).then((posts) => {
        result.posts = posts;
      }),
      getDeletedPosts(access, filters).then((deletedPosts) => {
        result.deletedPosts = deletedPosts;
      }),
      getDeletedResources(access, filters).then((deletedResources) => {
        result.deletedResources = deletedResources;
      }),
      getAuthorDisplayNames().then((authors) => {
        result.authors = authors;
      })
    );
  }

  if (shouldLoadEverything) {
    tasks.push(
      getActiveResources(filters).then((resources) => {
        result.resources = resources;
      })
    );
  }

  if (shouldLoadEverything || section === "schedules" || section === "manage-schedules") {
    tasks.push(
      getActiveGeneralSchedules(filters).then((generalSchedules) => {
        result.generalSchedules = generalSchedules;
      }),
      getActiveWorkshopRuns(filters).then((workshopRuns) => {
        result.workshopRuns = workshopRuns;
      }),
      getDeletedGeneralSchedules().then((deletedGeneralSchedules) => {
        result.deletedGeneralSchedules = deletedGeneralSchedules;
      }),
      getDeletedWorkshopRuns().then((deletedWorkshopRuns) => {
        result.deletedWorkshopRuns = deletedWorkshopRuns;
      }),
      getWorkshopNoticeOptions().then((workshopNoticeOptions) => {
        result.workshopNoticeOptions = workshopNoticeOptions;
      })
    );
  }

  await Promise.all(tasks);
  return result;
}

function createEmptyOverview(): SiteAdminOverviewData {
  return {
    authors: [],
    posts: [],
    deletedPosts: [],
    resources: [],
    deletedResources: [],
    generalSchedules: [],
    deletedGeneralSchedules: [],
    workshopRuns: [],
    deletedWorkshopRuns: [],
    workshopNoticeOptions: []
  };
}

function getSortField(filters: SiteAdminOverviewFilters) {
  return filters.sort === "created" ? "createdAt" : "updatedAt";
}

function getSortDirection(filters: SiteAdminOverviewFilters) {
  return filters.direction === "asc" ? "asc" : "desc";
}

function getVisibilityWhere(filters: SiteAdminOverviewFilters) {
  if (filters.status === "PUBLIC") {
    return { visibility: SiteContentVisibility.PUBLIC };
  }

  if (filters.status === "PRIVATE") {
    return { visibility: { not: SiteContentVisibility.PUBLIC } };
  }

  if (filters.visibility) {
    return { visibility: filters.visibility };
  }

  return {};
}

function getAuthorWhere(filters: SiteAdminOverviewFilters) {
  if (!filters.author) {
    return {};
  }

  return {
    author: {
      is: {
        authorProfile: {
          is: {
            displayName: filters.author
          }
        }
      }
    }
  };
}

function parseDateInput(value: string | undefined, boundary: "start" | "end") {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const suffix = boundary === "start" ? "T00:00:00.000+09:00" : "T23:59:59.999+09:00";
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getDateRangeWhere(filters: SiteAdminOverviewFilters): Prisma.DateTimeFilter | undefined {
  if (filters.range === "7d" || filters.range === "30d") {
    const days = filters.range === "7d" ? 7 : 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return { gte: start };
  }

  if (filters.range === "custom") {
    const gte = parseDateInput(filters.from, "start");
    const lte = parseDateInput(filters.to, "end");

    if (gte || lte) {
      return {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {})
      };
    }
  }

  return undefined;
}

function getPostWhere(filters: SiteAdminOverviewFilters): Prisma.SitePostWhereInput {
  const dateRange = getDateRangeWhere(filters);

  return {
    deletedAt: null,
    ...getPostCategoryWhere(filters.category),
    ...getVisibilityWhere(filters),
    ...getAuthorWhere(filters),
    ...(filters.label ? { labels: { has: filters.label } } : {}),
    ...(dateRange ? { updatedAt: dateRange } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { body: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function getDeletedPostWhere(
  access: SiteAdminAccess,
  filters: SiteAdminOverviewFilters
): Prisma.SitePostWhereInput {
  const dateRange = getDateRangeWhere(filters);

  return {
    deletedAt: { not: null },
    ...getTrashOwnershipFilter(access),
    ...getPostCategoryWhere(filters.category),
    ...getAuthorWhere(filters),
    ...(filters.label ? { labels: { has: filters.label } } : {}),
    ...(dateRange ? { deletedAt: { not: null, ...dateRange } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { body: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function getPostCategoryWhere(category: SitePostCategory | undefined): Prisma.SitePostWhereInput {
  if (!category) {
    return {};
  }

  return { category };
}

function getResourceWhere(filters: SiteAdminOverviewFilters): Prisma.SiteResourceWhereInput {
  return {
    deletedAt: null,
    ...(filters.resourceWorkshop ? { workshopSlug: filters.resourceWorkshop } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { session: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { url: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function getWorkshopRunWhere(filters: SiteAdminOverviewFilters): Prisma.WorkshopRunWhereInput {
  return {
    deletedAt: null,
    ...(filters.scheduleWorkshop && filters.scheduleWorkshop !== "general"
      ? { workshopSlug: filters.scheduleWorkshop }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { description: { contains: filters.q, mode: "insensitive" } },
            { applicationFormUrl: { contains: filters.q, mode: "insensitive" } },
            { stages: { some: { stageName: { contains: filters.q, mode: "insensitive" } } } }
          ]
        }
      : {})
  };
}

function getGeneralScheduleWhere(filters: SiteAdminOverviewFilters): Prisma.GeneralScheduleWhereInput {
  if (filters.scheduleWorkshop && filters.scheduleWorkshop !== "general") {
    return { id: "__none__" };
  }

  return {
    deletedAt: null,
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function getTrashOwnershipFilter(access: SiteAdminAccess) {
  return access.canManageSystemSettings ? {} : { authorUserId: access.appUserId };
}

async function getActivePosts(filters: SiteAdminOverviewFilters) {
  if (filters.status === "DELETED") {
    return [];
  }

  const sortField = getSortField(filters);

  return db.sitePost.findMany({
    where: getPostWhere(filters),
    orderBy: { [sortField]: getSortDirection(filters) },
    // The manage-posts browser filters author/category/etc. client-side, so it needs the full
    // active set — a low cap dropped older categories once the post count grew.
    take: 2000,
    select: postListSelect
  });
}

async function getDeletedPosts(access: SiteAdminAccess, filters: SiteAdminOverviewFilters = {}) {
  if (filters.status && filters.status !== "DELETED") {
    return [];
  }

  return db.sitePost.findMany({
    where: getDeletedPostWhere(access, filters),
    orderBy: { deletedAt: "desc" },
    take: 100,
    select: deletedPostListSelect
  });
}

function getActiveResources(filters: SiteAdminOverviewFilters) {
  const sortField = getSortField(filters);

  return db.siteResource.findMany({
    where: getResourceWhere(filters),
    orderBy: { [sortField]: getSortDirection(filters) },
    take: 40
  });
}

async function getDeletedResources(access: SiteAdminAccess, filters: SiteAdminOverviewFilters = {}) {
  if (filters.status && filters.status !== "DELETED") {
    return [];
  }

  if (filters.category && filters.category !== SitePostCategory.RESOURCE) {
    return [];
  }

  return db.siteResource.findMany({
    where: {
      deletedAt: { not: null },
      ...getTrashOwnershipFilter(access)
    },
    orderBy: { deletedAt: "desc" },
    take: 20
  });
}

const workshopRunInclude = {
  author: { select: authorSelect },
  noticePost: {
    select: { id: true, title: true, labels: true, category: true, visibility: true, deletedAt: true }
  },
  stages: {
    orderBy: { orderIndex: "asc" } as const,
    include: {
      noticePost: {
        select: { id: true, title: true, labels: true, category: true, visibility: true, deletedAt: true }
      },
      sessions: {
        orderBy: { dayIndex: "asc" } as const,
        include: {
          noticePost: {
            select: { id: true, title: true, labels: true, category: true, visibility: true, deletedAt: true }
          }
        }
      }
    }
  }
} satisfies Prisma.WorkshopRunInclude;

function getActiveGeneralSchedules(filters: SiteAdminOverviewFilters) {
  return db.generalSchedule.findMany({
    where: getGeneralScheduleWhere(filters),
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
    // Same as workshop runs: the calendar and tab-counts read the full loaded set client-side,
    // so a low take silently hid older general schedules. Load all of them.
    take: 1000,
    include: { author: { select: authorSelect } }
  });
}

function getDeletedGeneralSchedules() {
  return db.generalSchedule.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 20,
    include: { author: { select: authorSelect } }
  });
}

function getActiveWorkshopRuns(filters: SiteAdminOverviewFilters) {
  return db.workshopRun.findMany({
    where: getWorkshopRunWhere(filters),
    orderBy: [{ year: "desc" }, { runNumber: "desc" }, { updatedAt: "desc" }],
    // The schedule manager filters runs by workshop tab CLIENT-SIDE (schedule-management-browser.tsx),
    // and the calendar/tab-counts read the full loaded set. A low take dropped older runs (the whole
    // back catalogue past the newest ~40), so every run must be loaded, not just the most recent page.
    take: 1000,
    include: workshopRunInclude
  });
}

function getDeletedWorkshopRuns() {
  return db.workshopRun.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 20,
    include: workshopRunInclude
  });
}

function getWorkshopNoticeOptions() {
  return db.sitePost.findMany({
    where: {
      deletedAt: null,
      visibility: SiteContentVisibility.PUBLIC,
      category: SitePostCategory.GENERAL,
      labels: { isEmpty: false }
    },
    orderBy: { updatedAt: "desc" },
    // Options for the "linked notice" picker when creating/editing a run. On a site with a
    // large back catalogue a low cap hides older notices from the dropdown, so load enough
    // that any labelled post remains selectable.
    take: 1000,
    select: { id: true, title: true, labels: true }
  });
}

function getAuthorDisplayNames() {
  return db.authorProfile
    .findMany({
      orderBy: { displayName: "asc" },
      select: { displayName: true }
    })
    .then((profiles) => profiles.map((profile) => profile.displayName));
}

export function getAuthorDisplayName(
  author: { email: string; authorProfile: { displayName: string } | null } | null | undefined
) {
  return author?.authorProfile?.displayName ?? author?.email ?? "관리자";
}
