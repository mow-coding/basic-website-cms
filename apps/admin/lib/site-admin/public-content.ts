import { Prisma, SiteContentVisibility, SitePostCategory, type SitePost } from "@prisma/client";
import { db } from "@/lib/db";
import {
  sitePostWorkshopLabelOptions,
  siteWorkshopOptions,
  workshopLabelToSlug
} from "@/lib/site-admin/constants";
import { sanitizePublicPostBody } from "@/lib/site-admin/public-content-sanitize";
import { getWorkshopShortName } from "@/lib/site-admin/workshop-stage-presets";

type PublicWorkshopStatus = "OPEN" | "CLOSED" | "ENDED" | "NO_SCHEDULE";

type PublicSiteContentOptions = {
  includeNotices?: boolean;
  includeNoticeBodies?: boolean;
  noticeCategories?: SitePostCategory[];
  noticeLabels?: string[];
};

const publicWorkshopStatusLabels: Record<PublicWorkshopStatus, string> = {
  OPEN: "신청 중",
  CLOSED: "신청 마감",
  ENDED: "종료된 프로그램입니다",
  NO_SCHEDULE: "등록된 일정 없음"
};

const workshopReviewAuthorEmail = "editor-one@example.com";

const publicWorkshopRunInclude = {
  noticePost: {
    select: { id: true, title: true, labels: true, visibility: true, deletedAt: true }
  },
  stages: {
    orderBy: { orderIndex: "asc" },
    include: {
      noticePost: {
        select: { id: true, title: true, labels: true, visibility: true, deletedAt: true }
      },
      sessions: {
        orderBy: { dayIndex: "asc" },
        include: {
          noticePost: {
            select: { id: true, title: true, labels: true, visibility: true, deletedAt: true }
          }
        }
      }
    }
  }
} satisfies Prisma.WorkshopRunInclude;

const publicSitePostInclude = {
  author: {
    select: {
      email: true,
      authorProfile: {
        select: { displayName: true }
      }
    }
  }
} satisfies Prisma.SitePostInclude;

type WorkshopRunWithRelations = Prisma.WorkshopRunGetPayload<{ include: typeof publicWorkshopRunInclude }>;
type PublicSitePostWithAuthor = Prisma.SitePostGetPayload<{ include: typeof publicSitePostInclude }>;

export async function getPublicSiteContent(options: PublicSiteContentOptions = {}) {
  const includeNotices = options.includeNotices !== false;
  const includeNoticeBodies = options.includeNoticeBodies !== false;
  const noticeWhere = getPublicNoticeWhere(options);
  const [posts, legacyResources, generalSchedules, workshopRuns, authorProfiles] = await Promise.all([
    includeNotices
      ? db.sitePost.findMany({
          where: noticeWhere,
          orderBy: { createdAt: "desc" },
          include: publicSitePostInclude
        })
      : Promise.resolve([]),
    db.siteResource.findMany({
      where: {
        deletedAt: null,
        visibility: SiteContentVisibility.PUBLIC
      },
      orderBy: [{ workshopSlug: "asc" }, { session: "asc" }, { updatedAt: "desc" }]
    }),
    db.generalSchedule.findMany({
      where: {
        deletedAt: null,
        visibility: SiteContentVisibility.PUBLIC
      },
      orderBy: { date: "asc" }
    }),
    db.workshopRun.findMany({
      where: {
        deletedAt: null,
        visibility: SiteContentVisibility.PUBLIC
      },
      orderBy: [{ year: "asc" }, { runNumber: "asc" }],
      include: publicWorkshopRunInclude
    }),
    db.authorProfile.findMany({
      orderBy: { displayName: "asc" },
      select: { displayName: true }
    })
  ]);

  const notices = posts;
  const postResources = posts.flatMap(mapPostToResources);

  const runsByWorkshopSlug = new Map<string, (typeof workshopRuns)[number][]>();
  for (const run of workshopRuns) {
    const list = runsByWorkshopSlug.get(run.workshopSlug) ?? [];
    list.push(run);
    runsByWorkshopSlug.set(run.workshopSlug, list);
  }

  return {
    authors: authorProfiles.map((profile) => profile.displayName),
    notices: notices.map((notice) => mapSitePostToPublicNotice(notice, includeNoticeBodies)),
    resources: [
      ...legacyResources.map((resource) => ({
        id: resource.id,
        workshopSlug: resource.workshopSlug,
        session: resource.session,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString()
      })),
      ...postResources
    ],
    generalSchedules: generalSchedules.map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description ? sanitizePublicPostBody(schedule.description) : null,
      date: schedule.date.toISOString(),
      endsAt: (schedule.endsAt ?? schedule.date).toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString()
    })),
    workshopRuns: workshopRuns.map((run) => mapWorkshopRunToPublic(run)),
    workshops: siteWorkshopOptions.map((workshop) => {
      const runs = runsByWorkshopSlug.get(workshop.slug) ?? [];
      const display = pickDisplayRun(runs);
      const status = resolveWorkshopStatusFromRun(display);
      const applicationFormUrl = status === "OPEN" ? display?.applicationFormUrl ?? null : null;
      const earliestApplication = pickEarliestApplication(display);
      const earliestSession = pickEarliestSession(display);
      const latestSession = pickLatestSession(display);

      return {
        ...workshop,
        status,
        statusLabel: publicWorkshopStatusLabels[status],
        applicationFormUrl,
        applicationStartsAt: earliestApplication?.startsAt ?? null,
        applicationEndsAt: earliestApplication?.endsAt ?? null,
        workshopStartsAt: earliestSession ?? null,
        workshopEndsAt: latestSession ?? earliestSession ?? null
      };
    })
  };
}

export async function getPublicSiteNotice(id: string) {
  const notice = await db.sitePost.findFirst({
    where: {
      id,
      deletedAt: null,
      visibility: SiteContentVisibility.PUBLIC
    },
    include: publicSitePostInclude
  });

  return notice ? mapSitePostToPublicNotice(notice, true) : null;
}

function getPublicNoticeWhere(options: PublicSiteContentOptions): Prisma.SitePostWhereInput {
  return {
    deletedAt: null,
    visibility: SiteContentVisibility.PUBLIC,
    ...(options.noticeCategories?.length ? { category: { in: options.noticeCategories } } : {}),
    ...(options.noticeLabels?.length ? { labels: { hasSome: options.noticeLabels } } : {})
  };
}

function mapSitePostToPublicNotice(notice: PublicSitePostWithAuthor, includeBody: boolean) {
  return {
    id: notice.id,
    title: notice.title,
    body: includeBody ? sanitizePublicPostBody(notice.body) : "",
    legacyCreatedAtUnknown: notice.legacyCreatedAtUnknown,
    category: notice.category,
    labels: getPublicPostLabels(notice),
    relatedLinks: includeBody ? notice.relatedLinks ?? [] : [],
    attachments: includeBody ? notice.attachments ?? [] : [],
    authorName: notice.author?.authorProfile?.displayName ?? "관리자",
    isWorkshopReview: isWorkshopReviewPost(notice),
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString()
  };
}

function mapWorkshopRunToPublic(run: WorkshopRunWithRelations) {
  const noticeAvailable =
    run.noticePost && !run.noticePost.deletedAt && run.noticePost.visibility === SiteContentVisibility.PUBLIC
      ? run.noticePost
      : null;

  return {
    id: run.id,
    workshopSlug: run.workshopSlug,
    year: run.year,
    runNumber: run.runNumber,
    runLabel: buildRunLabel(run.workshopSlug, run.year, run.runNumber),
    applicationFormUrl: run.applicationFormUrl,
    description: run.description ? sanitizePublicPostBody(run.description) : null,
    noticePost: noticeAvailable
      ? {
          id: noticeAvailable.id,
          title: noticeAvailable.title,
          labels: noticeAvailable.labels
        }
      : null,
    stages: run.stages.map((stage) => ({
      id: stage.id,
      stageName: stage.stageName,
      orderIndex: stage.orderIndex,
      applicationStartsAt: stage.applicationStartsAt?.toISOString() ?? null,
      applicationEndsAt: stage.applicationEndsAt?.toISOString() ?? null,
      applicationFormUrl: stage.applicationFormUrl,
      noticePostId: stage.noticePostId,
      noticePost: mapWorkshopRunNotice(stage.noticePost),
      sessions: stage.sessions.map((session) => ({
        id: session.id,
        dayIndex: session.dayIndex,
        sessionDate: session.sessionDate.toISOString(),
        startTime: session.startTime,
        endTime: session.endTime,
        applicationFormUrl: session.applicationFormUrl,
        noticePostId: session.noticePostId,
        noticePost: mapWorkshopRunNotice(session.noticePost)
      }))
    })),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

function mapWorkshopRunNotice(
  notice: { deletedAt: Date | null; id: string; labels: string[]; title: string; visibility: SiteContentVisibility } | null
) {
  if (!notice || notice.deletedAt || notice.visibility !== SiteContentVisibility.PUBLIC) {
    return null;
  }

  return {
    id: notice.id,
    title: notice.title,
    labels: notice.labels
  };
}

function buildRunLabel(workshopSlug: string, year: number, runNumber: number) {
  const shortName = getKnownWorkshopShortName(workshopSlug);
  const yy = String(year).slice(-2).padStart(2, "0");
  return `${yy}-${runNumber} ${shortName}`;
}

function getKnownWorkshopShortName(workshopSlug: string) {
  if (
    workshopSlug === "program-a" ||
    workshopSlug === "program-b" ||
    workshopSlug === "program-c" ||
    workshopSlug === "program-d"
  ) {
    return getWorkshopShortName(workshopSlug);
  }

  return workshopSlug.toUpperCase();
}

function pickDisplayRun(runs: WorkshopRunWithRelations[]) {
  if (runs.length === 0) {
    return null;
  }

  const now = new Date();
  const upcoming = [...runs]
    .sort((a, b) => {
      const aTime = pickRunEndTime(a) ?? 0;
      const bTime = pickRunEndTime(b) ?? 0;
      return aTime - bTime;
    })
    .filter((run) => {
      const end = pickRunEndTime(run);
      return end !== null && end >= now.getTime();
    });

  if (upcoming[0]) {
    return upcoming[0];
  }

  return [...runs]
    .filter((run): run is NonNullable<WorkshopRunWithRelations> => run !== null)
    .sort((a, b) => (pickRunEndTime(b) ?? 0) - (pickRunEndTime(a) ?? 0))[0] ?? null;
}

function pickRunEndTime(run: NonNullable<WorkshopRunWithRelations>) {
  let latest: number | null = null;
  for (const stage of run.stages) {
    for (const session of stage.sessions) {
      const time = session.sessionDate.getTime();
      if (latest === null || time > latest) {
        latest = time;
      }
    }
  }
  return latest;
}

function pickEarliestApplication(run: NonNullable<WorkshopRunWithRelations> | null) {
  if (!run) {
    return null;
  }

  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;

  for (const stage of run.stages) {
    if (stage.applicationStartsAt && (!earliestStart || stage.applicationStartsAt < earliestStart)) {
      earliestStart = stage.applicationStartsAt;
    }

    if (stage.applicationEndsAt && (!latestEnd || stage.applicationEndsAt > latestEnd)) {
      latestEnd = stage.applicationEndsAt;
    }
  }

  if (!earliestStart && !latestEnd) {
    return null;
  }

  return {
    startsAt: earliestStart?.toISOString() ?? null,
    endsAt: latestEnd?.toISOString() ?? null
  };
}

function pickEarliestSession(run: NonNullable<WorkshopRunWithRelations> | null) {
  if (!run) {
    return null;
  }

  let earliest: Date | null = null;
  for (const stage of run.stages) {
    for (const session of stage.sessions) {
      if (!earliest || session.sessionDate < earliest) {
        earliest = session.sessionDate;
      }
    }
  }

  return earliest?.toISOString() ?? null;
}

function pickLatestSession(run: NonNullable<WorkshopRunWithRelations> | null) {
  if (!run) {
    return null;
  }

  let latest: Date | null = null;
  for (const stage of run.stages) {
    for (const session of stage.sessions) {
      if (!latest || session.sessionDate > latest) {
        latest = session.sessionDate;
      }
    }
  }

  return latest?.toISOString() ?? null;
}

function resolveWorkshopStatusFromRun(run: NonNullable<WorkshopRunWithRelations> | null): PublicWorkshopStatus {
  if (!run || run.stages.length === 0) {
    return "NO_SCHEDULE";
  }

  const now = new Date();
  const earliestEnd = pickRunEndTime(run);
  if (earliestEnd !== null && earliestEnd < now.getTime()) {
    return "ENDED";
  }

  const application = pickEarliestApplication(run);
  if (application && application.startsAt && application.endsAt) {
    const start = new Date(application.startsAt).getTime();
    const end = new Date(application.endsAt).getTime();
    if (start <= now.getTime() && now.getTime() <= end) {
      return "OPEN";
    }
    if (end < now.getTime()) {
      return "CLOSED";
    }
  }

  return "CLOSED";
}

function getPublicPostLabels(post: Pick<SitePost, "category" | "labels">) {
  if (post.category === SitePostCategory.COUNSELING) {
    return [];
  }

  return getRelatedWorkshopLabels(post);
}

function getRelatedWorkshopLabels(post: Pick<SitePost, "category" | "labels">) {
  return post.labels.filter((label): label is (typeof sitePostWorkshopLabelOptions)[number] =>
    sitePostWorkshopLabelOptions.includes(label as (typeof sitePostWorkshopLabelOptions)[number])
  );
}

function isWorkshopReviewPost(
  post: Pick<SitePost, "category" | "labels"> & { author?: { email?: string | null } | null }
) {
  return (
    post.category === SitePostCategory.GREEN_BOARD &&
    post.author?.email?.trim().toLowerCase() === workshopReviewAuthorEmail &&
    getRelatedWorkshopLabels(post).length > 0
  );
}

function mapPostToResources(post: SitePost) {
  if (post.category !== SitePostCategory.RESOURCE) {
    return [];
  }

  const url = getFirstLinkUrl(post.relatedLinks);
  if (!url) {
    return [];
  }

  return getRelatedWorkshopLabels(post).map((label) => ({
    id: `${post.id}-${workshopLabelToSlug[label]}`,
    workshopSlug: workshopLabelToSlug[label],
    session: "프로그램 자료실",
    title: post.title,
    description: stripHtml(sanitizePublicPostBody(post.body)),
    url,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  }));
}

function getFirstLinkUrl(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as { url?: unknown };
    if (typeof candidate.url === "string" && candidate.url) {
      return candidate.url;
    }
  }

  return null;
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
