import {
  buildFallbackGeneralSchedules,
  buildFallbackWorkshopRuns,
  notices as fallbackNotices,
  resources as fallbackResources,
  workshops as fallbackWorkshops,
  type NoticeCategory,
  type NoticeLabel,
  type WorkshopSlug,
  type WorkshopStatus,
} from "@/lib/site-data";
import { env } from "@/lib/env";
import { publicSiteContentCacheSeconds, publicSiteContentCacheTag, publicSiteFetchTimeoutMs } from "@/lib/public-cache";

type PublicNoticeCategory = "GENERAL" | "COUNSELING" | "GREEN_BOARD" | "RESOURCE";
type PublicWorkshopStatus = "OPEN" | "CLOSED" | "ENDED" | "NO_SCHEDULE";

type PublicApiLink = {
  title?: unknown;
  url?: unknown;
};

type PublicApiNotice = {
  id: string;
  title: string;
  body: string;
  legacyCreatedAtUnknown?: boolean;
  category: PublicNoticeCategory;
  labels: string[];
  relatedLinks: unknown;
  attachments: unknown;
  authorName: string;
  isWorkshopReview?: boolean;
  createdAt: string;
  updatedAt: string;
};

type PublicApiResource = {
  id: string;
  workshopSlug: WorkshopSlug;
  session: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicGeneralSchedule = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicWorkshopSession = {
  applicationFormUrl: string | null;
  id: string;
  dayIndex: number;
  noticePostId: string | null;
  noticePost: PublicWorkshopRunNotice | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
};

export type PublicWorkshopStage = {
  id: string;
  stageName: string;
  orderIndex: number;
  applicationStartsAt: string | null;
  applicationEndsAt: string | null;
  applicationFormUrl: string | null;
  noticePostId: string | null;
  noticePost: PublicWorkshopRunNotice | null;
  sessions: PublicWorkshopSession[];
};

export type PublicWorkshopRunNotice = {
  id: string;
  title: string;
  labels: string[];
};

export type PublicWorkshopRun = {
  id: string;
  workshopSlug: WorkshopSlug;
  year: number;
  runNumber: number;
  runLabel: string;
  applicationFormUrl: string | null;
  description: string | null;
  noticePost: PublicWorkshopRunNotice | null;
  stages: PublicWorkshopStage[];
  createdAt: string;
  updatedAt: string;
};

type PublicApiWorkshop = {
  slug: WorkshopSlug;
  status: PublicWorkshopStatus;
  applicationFormUrl: string | null;
  applicationStartsAt?: string | null;
  applicationEndsAt?: string | null;
  workshopStartsAt?: string | null;
  workshopEndsAt?: string | null;
};

type PublicApiContent = {
  authors?: string[];
  notices: PublicApiNotice[];
  resources: PublicApiResource[];
  generalSchedules?: PublicGeneralSchedule[];
  workshopRuns?: PublicWorkshopRun[];
  workshops: PublicApiWorkshop[];
};

type LoadPublicSiteContentOptions = {
  includeNotices?: boolean;
  includeNoticeBodies?: boolean;
  noticeCategories?: PublicNoticeCategory[];
  noticeLabels?: string[];
};

export type PublicSiteContentSource = "fallback" | "admin-api";
type PublicSiteFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export type PublicSiteWorkshop = (typeof fallbackWorkshops)[number] & {
  applicationFormUrl: string | null;
  applicationStartsAt?: string | null;
  applicationEndsAt?: string | null;
  workshopStartsAt?: string | null;
  workshopEndsAt?: string | null;
};

const categoryLabels: Record<PublicNoticeCategory, NoticeCategory> = {
  GENERAL: "전체 공지",
  COUNSELING: "안내",
  GREEN_BOARD: "자유게시판",
  RESOURCE: "자료실",
};

const statusLabels: Record<PublicWorkshopStatus, WorkshopStatus> = {
  OPEN: "신청 중",
  CLOSED: "신청 마감",
  ENDED: "종료",
  NO_SCHEDULE: "등록된 일정 없음",
};

const allowedLabels = new Set<NoticeLabel>(["프로그램A", "프로그램B", "프로그램C", "프로그램D", "상담", "자료실"]);

export async function loadPublicSiteContent(options: LoadPublicSiteContentOptions = {}) {
  const apiUrl = env.SITE_ADMIN_API_URL;

  if (!apiUrl) {
    return getFallbackContent(options);
  }

  try {
    const response = await fetchWithTimeout(buildPublicSiteContentUrl(apiUrl, options), {
      headers: { Accept: "application/json" },
      next: { revalidate: publicSiteContentCacheSeconds, tags: [publicSiteContentCacheTag] },
    });

    if (!response.ok) {
      return getFallbackContent(options);
    }

    const payload = (await response.json()) as PublicApiContent;
    return normalizePublicApiContent(payload);
  } catch {
    return getFallbackContent(options);
  }
}

function buildPublicSiteContentUrl(apiUrl: string, options: LoadPublicSiteContentOptions) {
  const url = new URL(apiUrl);

  if (options.includeNotices === false) {
    url.searchParams.set("notices", "0");
  }

  if (options.includeNoticeBodies === false) {
    url.searchParams.set("body", "0");
  }

  for (const category of options.noticeCategories ?? []) {
    url.searchParams.append("category", category);
  }

  for (const label of options.noticeLabels ?? []) {
    url.searchParams.append("label", label);
  }

  return url.toString();
}

export async function loadPublicSiteNotice(id: string) {
  const apiUrl = env.SITE_ADMIN_API_URL;

  if (!apiUrl) {
    return getFallbackNotice(id);
  }

  try {
    const response = await fetchWithTimeout(buildPublicSiteNoticeUrl(apiUrl, id), {
      headers: { Accept: "application/json" },
      next: { revalidate: publicSiteContentCacheSeconds, tags: [publicSiteContentCacheTag] },
    });

    if (!response.ok) {
      return getFallbackNotice(id);
    }

    const payload = (await response.json()) as PublicApiNotice;
    return normalizePublicApiNotice(payload);
  } catch {
    return getFallbackNotice(id);
  }
}

async function fetchWithTimeout(input: string, init: PublicSiteFetchInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), publicSiteFetchTimeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPublicSiteNoticeUrl(apiUrl: string, id: string) {
  const url = new URL(apiUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/notices/${encodeURIComponent(id)}`;
  url.search = "";
  return url.toString();
}

function getFallbackContent(options: LoadPublicSiteContentOptions = {}) {
  const fallbackNoticeItems = fallbackNotices
    .map((notice) => ({ ...notice, isWorkshopReview: getFallbackReviewFlag(notice) }))
    .filter((notice) => isFallbackNoticeIncluded(notice, options));

  return {
    source: "fallback" as const,
    authors: getFallbackAuthors(),
    notices: fallbackNoticeItems,
    resources: fallbackResources,
    generalSchedules: buildFallbackGeneralSchedules() as PublicGeneralSchedule[],
    workshopRuns: buildFallbackWorkshopRuns() as PublicWorkshopRun[],
    workshops: fallbackWorkshops.map((workshop) => ({
      ...workshop,
      applicationFormUrl: null,
      applicationStartsAt: null,
      applicationEndsAt: null,
      workshopStartsAt: null,
      workshopEndsAt: null,
    })),
  };
}

function isFallbackNoticeIncluded(
  notice: (typeof fallbackNotices)[number],
  options: LoadPublicSiteContentOptions
) {
  if (options.includeNotices === false) {
    return false;
  }

  if (options.noticeCategories?.length) {
    const allowedCategories = new Set(options.noticeCategories.map((category) => categoryLabels[category]));
    if (!allowedCategories.has(notice.category)) {
      return false;
    }
  }

  if (options.noticeLabels?.length) {
    const allowedNoticeLabels = new Set(options.noticeLabels);
    if (!notice.labels.some((label) => allowedNoticeLabels.has(label))) {
      return false;
    }
  }

  return true;
}

function getFallbackNotice(id: string) {
  const notice = fallbackNotices.find((item) => String(item.id) === id);
  return notice ? { ...notice, isWorkshopReview: getFallbackReviewFlag(notice) } : null;
}

function getFallbackReviewFlag(notice: (typeof fallbackNotices)[number]) {
  return "isWorkshopReview" in notice && notice.isWorkshopReview === true;
}

function normalizePublicApiContent(payload: PublicApiContent) {
  const dynamicWorkshopBySlug = new Map(payload.workshops.map((workshop) => [workshop.slug, workshop]));

  return {
    source: "admin-api" as const,
    authors: normalizeAuthors(payload.authors),
    notices: payload.notices.map(normalizePublicApiNotice),
    resources: payload.resources.map((resource) => ({
      id: resource.id,
      workshop: resource.workshopSlug,
      session: resource.session,
      title: resource.title,
      description: resource.description ?? "",
      url: resource.url,
      author: "관리자",
      createdAt: formatDateTime(resource.createdAt),
      updatedAt: resource.updatedAt === resource.createdAt ? "-" : formatDateTime(resource.updatedAt),
    })),
    generalSchedules: payload.generalSchedules ?? [],
    workshopRuns: (payload.workshopRuns ?? []).filter((run) => isKnownWorkshopSlug(run.workshopSlug)),
    workshops: fallbackWorkshops.map((workshop) => {
      const dynamicWorkshop = dynamicWorkshopBySlug.get(workshop.slug);

      return {
        ...workshop,
        status: dynamicWorkshop ? statusLabels[dynamicWorkshop.status] : workshop.status,
        applicationFormUrl: dynamicWorkshop?.applicationFormUrl ?? null,
        applicationStartsAt: dynamicWorkshop?.applicationStartsAt ?? null,
        applicationEndsAt: dynamicWorkshop?.applicationEndsAt ?? null,
        workshopStartsAt: dynamicWorkshop?.workshopStartsAt ?? null,
        workshopEndsAt: dynamicWorkshop?.workshopEndsAt ?? null,
      };
    }),
  };
}

function normalizePublicApiNotice(notice: PublicApiNotice) {
  const category = categoryLabels[notice.category] ?? categoryLabels.GENERAL;
  const legacyCreatedAtUnknown = notice.legacyCreatedAtUnknown === true;

  return {
    id: notice.id,
    title: notice.title,
    category,
    labels: notice.labels.filter((label): label is NoticeLabel => allowedLabels.has(label as NoticeLabel)),
    author: notice.authorName,
    isWorkshopReview: notice.isWorkshopReview === true,
    createdAt: legacyCreatedAtUnknown ? "작성일 미상" : formatDateTime(notice.createdAt),
    updatedAt: legacyCreatedAtUnknown || notice.updatedAt !== notice.createdAt ? formatDateTime(notice.updatedAt) : "-",
    createdAtIso: notice.createdAt,
    updatedAtIso: notice.updatedAt,
    official: category !== categoryLabels.GREEN_BOARD,
    body: splitBody(notice.body),
    bodyHtml: notice.body,
    relatedLinks: normalizeLinks(notice.relatedLinks).slice(0, 3),
    attachments: normalizeLinks(notice.attachments).slice(0, 5),
  };
}

function getFallbackAuthors() {
  return normalizeAuthors(fallbackNotices.map((notice) => notice.author));
}

function normalizeAuthors(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)));
}

function isKnownWorkshopSlug(value: string): value is WorkshopSlug {
  return fallbackWorkshops.some((workshop) => workshop.slug === value);
}

function splitBody(body: string) {
  return body
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: PublicApiLink) => ({
      title: typeof item.title === "string" ? item.title : "",
      url: typeof item.url === "string" ? item.url : "",
    }))
    .filter((item) => item.title && item.url);
}

function formatDateTime(value: string) {
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
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = parts.year ?? "0000";
  const month = parts.month ?? "01";
  const day = parts.day ?? "01";
  const hours = parts.hour ?? "00";
  const minutes = parts.minute ?? "00";

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
