"use server";

import { SiteContentVisibility, SitePostCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireSiteAdminAccess } from "@/lib/site-admin/access";
import {
  sitePostLabelOptions,
  sitePostLabelOptionsByCategory,
  siteWorkshopOptions,
  workshopSlugToLabel,
  type SiteWorkshopSlug
} from "@/lib/site-admin/constants";
import { normalizeHttpUrl, parseLinkLines } from "@/lib/site-admin/links";
import { revalidatePublicSiteContent } from "@/lib/site-admin/public-site-revalidation";
import { sanitizePostBody } from "@/lib/site-admin/sanitize";
import {
  normalizeScheduleApplicationFormUrlInput,
  normalizeScheduleNoticePostIdInput
} from "@/lib/site-admin/schedule-link-inputs";
import { getSeoulYear, parseSeoulDateTimeInput } from "@/lib/site-admin/time";
import { getValidStageNamesForWorkshop } from "@/lib/site-admin/workshop-stage-presets";

const validCategories = new Set(Object.values(SitePostCategory));
const validVisibilities = new Set(Object.values(SiteContentVisibility));
const validWorkshopSlugs = new Set<string>(siteWorkshopOptions.map((workshop) => workshop.slug));
const validLabels = new Set<string>(sitePostLabelOptions);
type WorkshopRunNumberingClient = Pick<typeof db, "workshopRun">;
type WorkshopRunNumberingGroup = {
  workshopSlug: string;
  year: number;
};
type WorkshopRunNumberingItem = {
  createdAt: Date;
  deletedAt: Date | null;
  id: string;
  runNumber: number;
  stages: Array<{
    applicationEndsAt: Date | null;
    applicationStartsAt: Date | null;
    sessions: Array<{ sessionDate: Date }>;
  }>;
};

export type AuthorDisplayNameActionState = {
  displayName: string;
  message: string;
  status: "error" | "idle" | "success";
  version: number;
};

export async function createSitePostAction(formData: FormData) {
  let postId: string | undefined;

  try {
    const access = await requireSiteAdminAccess();
    const { body, title } = readRichTextPostFields(formData);
    const category = readPostCategory(formData);
    const visibility = readRequiredEnum(formData, "visibility", validVisibilities, "post-required-fields");
    const labels = readRelatedWorkshopLabels(formData, category);
    const relatedLinks = readRelatedLinks(formData);
    const attachments = readAttachments(formData);

    const post = await db.sitePost.create({
      data: {
        authorUserId: access.appUserId,
        title,
        body,
        category,
        visibility,
        labels,
        relatedLinks,
        attachments
      },
      select: {
        id: true
      }
    });

    postId = post.id;
  } catch (error) {
    logSiteAdminActionError("site-post-create", error, { postId, section: "new-post" });
    throw error;
  }

  await revalidateSiteAdminContent();
  redirectWithMessage("created");
}

export async function updateSitePostAction(formData: FormData) {
  let id: string | undefined;
  let returnMode: string | null = null;

  try {
    const access = await requireSiteAdminAccess();
    id = readRequiredString(formData, "id");
    returnMode = readOptionalString(formData, "returnMode");
    const post = await db.sitePost.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!post || (!access.canManageSystemSettings && post.authorUserId !== access.appUserId)) {
      redirectWithError("post-permission");
    }

    const postFields = readRichTextPostFields(formData);
    const category = readPostCategory(formData);
    const labels = readRelatedWorkshopLabels(formData, category);
    const relatedLinks = readRelatedLinks(formData);
    const attachments = readAttachments(formData);

    await db.sitePost.update({
      where: { id },
      data: {
        ...postFields,
        category,
        visibility: readRequiredEnum(formData, "visibility", validVisibilities, "post-required-fields"),
        labels,
        relatedLinks,
        attachments
      }
    });

    console.info("[site-admin] post update saved", {
      action: "site-post-update",
      attachmentsCount: attachments.length,
      postId: id,
      relatedLinksCount: relatedLinks.length,
      returnMode,
      section: "manage-posts"
    });
  } catch (error) {
    logSiteAdminActionError("site-post-update", error, { postId: id, section: "manage-posts" });
    throw error;
  }

  await revalidateSiteAdminContent();
  revalidatePath(`/site-admin/posts/${id}`);
  if (returnMode === "modal") {
    redirect(`/site-admin/posts/${id}?modal=1&saved=1`);
  }

  redirectWithMessage("updated");
}

export async function softDeleteSitePostAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const post = await db.sitePost.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!post || (!access.canManageSystemSettings && post.authorUserId !== access.appUserId)) {
    redirectWithError("post-permission");
  }

  await db.sitePost.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("deleted");
}

export async function restoreSitePostAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const post = await db.sitePost.findFirst({
    where: {
      id,
      deletedAt: { not: null }
    }
  });

  if (!post || (!access.canManageSystemSettings && post.authorUserId !== access.appUserId)) {
    redirectWithError("post-permission");
  }

  await db.sitePost.update({
    where: { id },
    data: { deletedAt: null }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("restored");
}

export async function permanentlyDeleteSitePostAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  if (!access.canManageSystemSettings) {
    redirectWithError("hard-delete-permission");
  }

  const id = readRequiredString(formData, "id");
  await db.sitePost.deleteMany({
    where: {
      id,
      deletedAt: { not: null }
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("hard-deleted");
}

export async function bulkSitePostAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const action = readRequiredString(formData, "bulkAction");
  const ids = readSelectedIds(formData, "bulk-selection-required");
  const ownershipFilter = access.canManageSystemSettings ? {} : { authorUserId: access.appUserId };

  if (action === "trash") {
    await db.sitePost.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        ...ownershipFilter
      },
      data: { deletedAt: new Date() }
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("deleted");
  }

  if (action === "restore") {
    await db.sitePost.updateMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
        ...ownershipFilter
      },
      data: { deletedAt: null }
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("restored");
  }

  if (action === "permanent-delete") {
    if (!access.canManageSystemSettings) {
      redirectWithError("hard-delete-permission");
    }

    await db.sitePost.deleteMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null }
      }
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("hard-deleted");
  }

  redirectWithError("bulk-action-invalid");
}

export async function createSiteResourceAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const workshopSlug = readWorkshopSlug(formData);

  await db.siteResource.create({
    data: {
      authorUserId: access.appUserId,
      workshopSlug,
      session: readRequiredString(formData, "session"),
      title: readRequiredString(formData, "title"),
      description: readOptionalString(formData, "description"),
      url: readRequiredHttpUrl(formData, "url"),
      visibility: readEnum(formData, "visibility", validVisibilities, SiteContentVisibility.PUBLIC)
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("resource-created");
}

export async function updateSiteResourceAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const resource = await db.siteResource.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!resource || (!access.canManageSystemSettings && resource.authorUserId !== access.appUserId)) {
    redirectWithError("resource-permission");
  }

  await db.siteResource.update({
    where: { id },
    data: {
      workshopSlug: readWorkshopSlug(formData),
      session: readRequiredString(formData, "session"),
      title: readRequiredString(formData, "title"),
      description: readOptionalString(formData, "description"),
      url: readRequiredHttpUrl(formData, "url"),
      visibility: readEnum(formData, "visibility", validVisibilities, SiteContentVisibility.PUBLIC)
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("resource-updated");
}

export async function softDeleteSiteResourceAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const resource = await db.siteResource.findFirst({
    where: {
      id,
      deletedAt: null
    }
  });

  if (!resource || (!access.canManageSystemSettings && resource.authorUserId !== access.appUserId)) {
    redirectWithError("resource-permission");
  }

  await db.siteResource.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("resource-deleted");
}

export async function restoreSiteResourceAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const resource = await db.siteResource.findFirst({
    where: {
      id,
      deletedAt: { not: null }
    }
  });

  if (!resource || (!access.canManageSystemSettings && resource.authorUserId !== access.appUserId)) {
    redirectWithError("resource-permission");
  }

  await db.siteResource.update({
    where: { id },
    data: { deletedAt: null }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("resource-restored");
}

export async function permanentlyDeleteSiteResourceAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  if (!access.canManageSystemSettings) {
    redirectWithError("hard-delete-permission");
  }

  const id = readRequiredString(formData, "id");
  await db.siteResource.deleteMany({
    where: {
      id,
      deletedAt: { not: null }
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("resource-hard-deleted");
}

export async function createGeneralScheduleAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const title = readRequiredString(formData, "scheduleTitle");
  const description = readOptionalRichTextString(formData, "scheduleDescription");
  const date = readRequiredDate(formData, "scheduleStartsAt", "scheduleDate");
  const endsAt = readRequiredDate(formData, "scheduleEndsAt", "scheduleDate");
  const visibility = readRequiredEnum(formData, "scheduleVisibility", validVisibilities, "schedule-payload-invalid");
  ensureDateRangeOrder(date, endsAt);

  await db.generalSchedule.create({
    data: {
      authorUserId: access.appUserId,
      title,
      description,
      date,
      endsAt,
      visibility
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-created");
}

export async function updateGeneralScheduleAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const date = readRequiredDate(formData, "scheduleStartsAt", "scheduleDate");
  const endsAt = readRequiredDate(formData, "scheduleEndsAt", "scheduleDate");
  ensureDateRangeOrder(date, endsAt);
  const existing = await db.generalSchedule.findFirst({
    where: { id, deletedAt: null }
  });
  if (!existing) {
    redirectWithError("schedule-permission", returnTo);
  }

  await db.generalSchedule.update({
    where: { id },
    data: {
      title: readRequiredString(formData, "scheduleTitle"),
      description: readOptionalRichTextString(formData, "scheduleDescription"),
      date,
      endsAt,
      visibility: readRequiredEnum(formData, "scheduleVisibility", validVisibilities, "schedule-payload-invalid")
    }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-updated", returnTo);
}

export async function toggleGeneralScheduleVisibilityAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const visibility = readRequiredEnum(formData, "visibility", validVisibilities, "schedule-payload-invalid");

  await db.generalSchedule.updateMany({
    where: { id, deletedAt: null },
    data: { visibility }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-updated", returnTo);
}

export async function softDeleteGeneralScheduleAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);

  await db.generalSchedule.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-deleted", returnTo);
}

export async function restoreGeneralScheduleAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);

  await db.generalSchedule.updateMany({
    where: { id, deletedAt: { not: null } },
    data: { deletedAt: null }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-restored", returnTo);
}

export async function permanentlyDeleteGeneralScheduleAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const returnTo = readSafeSiteAdminReturnPath(formData);
  if (!access.canManageSystemSettings) {
    redirectWithError("hard-delete-permission", returnTo);
  }

  const id = readRequiredString(formData, "id");
  await db.generalSchedule.deleteMany({
    where: { id, deletedAt: { not: null } }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-hard-deleted", returnTo);
}

export async function createWorkshopRunAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const payload = parseWorkshopRunPayload(formData);
  await ensureScheduleNoticePostIsPublic(payload.noticePostId);

  const year = pickRunYear(payload);

  await db.$transaction(async (tx) => {
    const runNumber = await pickNextRunNumber(tx, payload.workshopSlug, year);

    await tx.workshopRun.create({
      data: {
        authorUserId: access.appUserId,
        workshopSlug: payload.workshopSlug,
        year,
        runNumber,
        applicationFormUrl: payload.applicationFormUrl,
        noticePostId: payload.noticePostId,
        description: payload.description,
        visibility: payload.visibility,
        stages: {
          create: payload.stages.map((stage, stageIndex) => ({
            stageName: stage.stageName,
            orderIndex: stageIndex,
            applicationStartsAt: stage.applicationStartsAt,
            applicationEndsAt: stage.applicationEndsAt,
            sessions: {
              create: stage.sessions.map((session, sessionIndex) => ({
                dayIndex: sessionIndex,
                sessionDate: session.sessionDate,
                startTime: session.startTime,
                endTime: session.endTime
              }))
            }
          }))
        }
      }
    });

    await renumberWorkshopRunsForYear(tx, payload.workshopSlug, year);
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-created");
}

export async function updateWorkshopRunAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const existing = await db.workshopRun.findFirst({
    where: { id, deletedAt: null },
    include: {
      stages: {
        select: {
          id: true,
          applicationFormUrl: true,
          noticePostId: true,
          stageName: true,
          sessions: {
            select: {
              id: true,
              applicationFormUrl: true,
              noticePostId: true
            }
          }
        }
      }
    }
  });
  if (!existing) {
    redirectWithError("schedule-permission", returnTo);
  }

  const payload = parseWorkshopRunPayload(formData, {
    additionalStageNames: existing.stages.map((stage) => stage.stageName)
  });
  if (payload.workshopSlug !== existing.workshopSlug) {
    redirectWithError("schedule-payload-invalid", returnTo);
  }
  await ensureScheduleNoticePostIsPublic(payload.noticePostId);

  const stageLinkOverrides = new Map(
    existing.stages.map((stage) => [
      stage.id,
      {
        applicationFormUrl: stage.applicationFormUrl,
        noticePostId: stage.noticePostId
      }
    ])
  );
  const sessionLinkOverrides = new Map(
    existing.stages.flatMap((stage) =>
      stage.sessions.map((session) => [
        session.id,
        {
          applicationFormUrl: session.applicationFormUrl,
          noticePostId: session.noticePostId
        }
      ] as const)
    )
  );

  await db.$transaction(async (tx) => {
    await tx.scheduleSession.deleteMany({
      where: { stage: { workshopRunId: id } }
    });
    await tx.scheduleStage.deleteMany({
      where: { workshopRunId: id }
    });

    await tx.workshopRun.update({
      where: { id },
      data: {
        workshopSlug: payload.workshopSlug,
        applicationFormUrl: payload.applicationFormUrl,
        noticePostId: payload.noticePostId,
        description: payload.description,
        visibility: payload.visibility,
        stages: {
          create: payload.stages.map((stage, stageIndex) => {
            const stageOverride = stage.id ? stageLinkOverrides.get(stage.id) : undefined;

            return {
              stageName: stage.stageName,
              orderIndex: stageIndex,
              applicationStartsAt: stage.applicationStartsAt,
              applicationEndsAt: stage.applicationEndsAt,
              applicationFormUrl: stageOverride?.applicationFormUrl ?? null,
              noticePostId: stageOverride?.noticePostId ?? null,
              sessions: {
                create: stage.sessions.map((session, sessionIndex) => {
                  const sessionOverride = session.id ? sessionLinkOverrides.get(session.id) : undefined;

                  return {
                    dayIndex: sessionIndex,
                    sessionDate: session.sessionDate,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    applicationFormUrl: sessionOverride?.applicationFormUrl ?? null,
                    noticePostId: sessionOverride?.noticePostId ?? null
                  };
                })
              }
            };
          })
        }
      }
    });

    await renumberWorkshopRunsForYear(tx, existing.workshopSlug, existing.year);
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-updated", returnTo);
}

export async function toggleWorkshopRunVisibilityAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const visibility = readRequiredEnum(formData, "visibility", validVisibilities, "schedule-payload-invalid");

  await db.workshopRun.updateMany({
    where: { id, deletedAt: null },
    data: { visibility }
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-updated", returnTo);
}

export async function updateWorkshopScheduleEventLinksAction(formData: FormData) {
  await requireSiteAdminAccess();
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const scheduleEventKind = readRequiredString(formData, "scheduleEventKind");
  const scheduleEventId = readRequiredString(formData, "scheduleEventId");
  const applicationFormUrl = readOptionalScheduleApplicationFormUrl(formData, "applicationFormUrl");
  const noticePostId = readOptionalScheduleNoticePostId(formData, "noticePostId");

  await ensureScheduleNoticePostIsPublic(noticePostId);

  const data = {
    applicationFormUrl,
    noticePostId
  };
  const result =
    scheduleEventKind === "stage"
      ? await db.scheduleStage.updateMany({
          where: {
            id: scheduleEventId,
            workshopRun: { deletedAt: null }
          },
          data
        })
      : scheduleEventKind === "session"
        ? await db.scheduleSession.updateMany({
            where: {
              id: scheduleEventId,
              stage: { workshopRun: { deletedAt: null } }
            },
            data
          })
        : null;

  if (!result) {
    redirectWithError("schedule-payload-invalid", returnTo);
  }

  if (result.count === 0) {
    redirectWithError("schedule-permission", returnTo);
  }

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-updated", returnTo);
}

export async function softDeleteWorkshopRunAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);

  await db.$transaction(async (tx) => {
    const groups = await getWorkshopRunNumberingGroups(tx, [id]);

    await tx.workshopRun.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    await renumberWorkshopRunGroups(tx, groups);
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-deleted", returnTo);
}

export async function restoreWorkshopRunAction(formData: FormData) {
  await requireSiteAdminAccess();
  const id = readRequiredString(formData, "id");
  const returnTo = readSafeSiteAdminReturnPath(formData);

  await db.$transaction(async (tx) => {
    const groups = await getWorkshopRunNumberingGroups(tx, [id]);

    await tx.workshopRun.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null }
    });

    await renumberWorkshopRunGroups(tx, groups);
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-restored", returnTo);
}

export async function permanentlyDeleteWorkshopRunAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const returnTo = readSafeSiteAdminReturnPath(formData);
  if (!access.canManageSystemSettings) {
    redirectWithError("hard-delete-permission", returnTo);
  }

  const id = readRequiredString(formData, "id");
  await db.$transaction(async (tx) => {
    const groups = await getWorkshopRunNumberingGroups(tx, [id]);

    await tx.workshopRun.deleteMany({
      where: { id, deletedAt: { not: null } }
    });

    await renumberWorkshopRunGroups(tx, groups);
  });

  await revalidateSiteAdminContent();
  redirectWithMessage("schedule-hard-deleted", returnTo);
}

export async function bulkScheduleTrashAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const action = readRequiredString(formData, "bulkAction");
  const returnTo = readSafeSiteAdminReturnPath(formData);
  const generalIds = Array.from(
    new Set(
      formData
        .getAll("generalIds")
        .map((value) => value.toString().trim())
        .filter(Boolean)
    )
  );
  const runIds = Array.from(
    new Set(
      formData
        .getAll("runIds")
        .map((value) => value.toString().trim())
        .filter(Boolean)
    )
  );

  if (generalIds.length === 0 && runIds.length === 0) {
    redirectWithError("schedule-bulk-selection-required", returnTo);
  }

  if (action === "trash") {
    const deletedAt = new Date();
    await db.$transaction(async (tx) => {
      const groups = await getWorkshopRunNumberingGroups(tx, runIds);

      await Promise.all([
        tx.generalSchedule.updateMany({
          where: { id: { in: generalIds }, deletedAt: null },
          data: { deletedAt }
        }),
        tx.workshopRun.updateMany({
          where: { id: { in: runIds }, deletedAt: null },
          data: { deletedAt }
        })
      ]);

      await renumberWorkshopRunGroups(tx, groups);
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("schedule-deleted", returnTo);
  }

  if (action === "restore") {
    await db.$transaction(async (tx) => {
      const groups = await getWorkshopRunNumberingGroups(tx, runIds);
      const restoreTasks = [];
      if (generalIds.length > 0) {
        restoreTasks.push(
          tx.generalSchedule.updateMany({
            where: { id: { in: generalIds }, deletedAt: { not: null } },
            data: { deletedAt: null }
          })
        );
      }
      if (runIds.length > 0) {
        restoreTasks.push(
          tx.workshopRun.updateMany({
            where: { id: { in: runIds }, deletedAt: { not: null } },
            data: { deletedAt: null }
          })
        );
      }

      await Promise.all(restoreTasks);
      await renumberWorkshopRunGroups(tx, groups);
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("schedule-restored", returnTo);
  }

  if (action === "permanent-delete") {
    if (!access.canManageSystemSettings) {
      redirectWithError("hard-delete-permission", returnTo);
    }

    await db.$transaction(async (tx) => {
      const groups = await getWorkshopRunNumberingGroups(tx, runIds);

      await Promise.all([
        tx.generalSchedule.deleteMany({ where: { id: { in: generalIds }, deletedAt: { not: null } } }),
        tx.workshopRun.deleteMany({ where: { id: { in: runIds }, deletedAt: { not: null } } })
      ]);

      await renumberWorkshopRunGroups(tx, groups);
    });

    await revalidateSiteAdminContent();
    redirectWithMessage("schedule-hard-deleted", returnTo);
  }

  redirectWithError("bulk-action-invalid", returnTo);
}

type WorkshopRunPayload = {
  workshopSlug: SiteWorkshopSlug;
  applicationFormUrl: string | null;
  noticePostId: string | null;
  description: string | null;
  visibility: SiteContentVisibility;
  yearHint?: number;
  stages: Array<{
    id: string | null;
    stageName: string;
    applicationStartsAt: Date | null;
    applicationEndsAt: Date | null;
    sessions: Array<{
      id: string | null;
      sessionDate: Date;
      startTime: string;
      endTime: string;
    }>;
  }>;
};

function parseWorkshopRunPayload(
  formData: FormData,
  options: { additionalStageNames?: readonly string[] } = {}
): WorkshopRunPayload {
  const rawPayload = formData.get("workshopRunPayload");
  if (typeof rawPayload !== "string" || !rawPayload.trim()) {
    redirectWithError("schedule-payload-invalid");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    redirectWithError("schedule-payload-invalid");
  }

  if (!parsed || typeof parsed !== "object") {
    redirectWithError("schedule-payload-invalid");
  }

  const candidate = parsed as Record<string, unknown>;
  const workshopSlug = candidate.workshopSlug;
  if (typeof workshopSlug !== "string" || !validWorkshopSlugs.has(workshopSlug)) {
    redirectWithError("schedule-payload-invalid");
  }

  const stages = candidate.stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    redirectWithError("schedule-stages-required");
  }

  const validStageNames = getValidStageNamesForWorkshop(workshopSlug as SiteWorkshopSlug);
  for (const stageName of options.additionalStageNames ?? []) {
    validStageNames.add(stageName);
  }
  const visibility = parseVisibility(candidate.visibility);
  const applicationFormUrl = normalizeOptionalSurveyFormUrl(candidate.applicationFormUrl);
  const noticePostId = normalizeOptionalNoticePostId(candidate.noticePostId);
  const description = normalizeOptionalString(candidate.description);
  const yearHint = typeof candidate.year === "number" && Number.isFinite(candidate.year) ? candidate.year : undefined;

  const parsedStages = stages.map((stage, stageIndex) => parseStage(stage, stageIndex, validStageNames));

  if (parsedStages.length === 0) {
    redirectWithError("schedule-stages-required");
  }

  return {
    workshopSlug: workshopSlug as SiteWorkshopSlug,
    applicationFormUrl,
    noticePostId,
    description,
    visibility,
    yearHint,
    stages: parsedStages
  };
}

function parseStage(stage: unknown, stageIndex: number, validStageNames: Set<string>) {
  if (!stage || typeof stage !== "object") {
    redirectWithError("schedule-payload-invalid");
  }

  const candidate = stage as Record<string, unknown>;
  const id = normalizeOptionalId(candidate.id);
  const stageName = typeof candidate.stageName === "string" ? candidate.stageName.trim() : "";
  if (!stageName || !validStageNames.has(stageName)) {
    redirectWithError("schedule-payload-invalid");
  }

  const applicationStartsAt = normalizeOptionalDate(
    candidate.applicationStartsAt,
    `stages[${stageIndex}].applicationStartsAt`
  );
  const applicationEndsAt = normalizeOptionalDate(
    candidate.applicationEndsAt,
    `stages[${stageIndex}].applicationEndsAt`
  );

  if (applicationStartsAt && applicationEndsAt && applicationEndsAt <= applicationStartsAt) {
    redirectWithError("schedule-payload-invalid");
  }

  const sessions = candidate.sessions;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    redirectWithError("schedule-sessions-required");
  }

  const parsedSessions = sessions.map((session, sessionIndex) =>
    parseSession(session, stageIndex, sessionIndex)
  );
  ensureWorkshopSessionDateOrder(parsedSessions);

  return {
    id,
    stageName,
    applicationStartsAt,
    applicationEndsAt,
    sessions: parsedSessions
  };
}

function ensureWorkshopSessionDateOrder(sessions: Array<{ sessionDate: Date }>) {
  for (let index = 1; index < sessions.length; index += 1) {
    if (sessions[index].sessionDate <= sessions[index - 1].sessionDate) {
      redirectWithError("schedule-payload-invalid");
    }
  }
}

function parseSession(session: unknown, stageIndex: number, sessionIndex: number) {
  if (!session || typeof session !== "object") {
    redirectWithError("schedule-payload-invalid");
  }

  const candidate = session as Record<string, unknown>;
  const id = normalizeOptionalId(candidate.id);
  const sessionDateField = `stages[${stageIndex}].sessions[${sessionIndex}].sessionDate`;
  const sessionDate = normalizeRequiredDate(candidate.sessionDate, sessionDateField);
  const startTime = normalizeTime(candidate.startTime, `${sessionDateField}.startTime`);
  const endTime = normalizeTime(candidate.endTime, `${sessionDateField}.endTime`);

  if (timeStringToMinutes(startTime) >= timeStringToMinutes(endTime)) {
    redirectWithError("schedule-payload-invalid");
  }

  return {
    id,
    sessionDate,
    startTime,
    endTime
  };
}

function normalizeOptionalId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    redirectWithError("schedule-payload-invalid");
  }

  return trimmed.toLowerCase();
}

function normalizeRequiredDate(value: unknown, fieldName: string) {
  const date = normalizeOptionalDate(value, fieldName);
  if (!date) {
    redirectWithError("schedule-payload-invalid");
  }
  return date;
}

function normalizeOptionalDate(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    redirectWithError("schedule-payload-invalid");
  }

  return parseSeoulDateTimeInput(value, fieldName);
}

function normalizeOptionalSurveyFormUrl(value: unknown) {
  try {
    return normalizeScheduleApplicationFormUrlInput(value);
  } catch {
    redirectWithError("schedule-link-invalid");
  }
}

function normalizeOptionalNoticePostId(value: unknown) {
  const normalizedValue = normalizeScheduleNoticePostIdInput(value);
  if (normalizedValue || typeof value !== "string" || !value.trim()) {
    return normalizedValue;
  }

  redirectWithError("schedule-link-invalid");
}

function readOptionalScheduleNoticePostId(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);
  const normalizedValue = normalizeScheduleNoticePostIdInput(value);
  if (normalizedValue || !value) {
    return normalizedValue;
  }

  redirectWithError("schedule-link-invalid");
}

function readOptionalScheduleApplicationFormUrl(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);
  if (!value) {
    return null;
  }

  try {
    return normalizeScheduleApplicationFormUrlInput(value);
  } catch {
    redirectWithError("schedule-link-invalid");
  }
}

async function ensureScheduleNoticePostIsPublic(noticePostId: string | null) {
  if (!noticePostId) {
    return;
  }

  const publicNoticePost = await db.sitePost.findFirst({
    where: {
      id: noticePostId,
      deletedAt: null,
      visibility: SiteContentVisibility.PUBLIC
    },
    select: { id: true }
  });

  if (!publicNoticePost) {
    redirectWithError("schedule-notice-post-unavailable");
  }
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTime(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value.trim())) {
    redirectWithError("schedule-payload-invalid");
  }
  const trimmed = (value as string).trim();
  const [hour, minute] = trimmed.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    redirectWithError("schedule-payload-invalid");
  }
  return trimmed;
  void fieldName;
}

function timeStringToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function parseVisibility(value: unknown): SiteContentVisibility {
  if (typeof value === "string" && validVisibilities.has(value as SiteContentVisibility)) {
    return value as SiteContentVisibility;
  }
  redirectWithError("schedule-payload-invalid");
}

function pickRunYear(payload: WorkshopRunPayload) {
  if (payload.yearHint && payload.yearHint > 2000) {
    return payload.yearHint;
  }

  let earliest: Date | null = null;
  for (const stage of payload.stages) {
    for (const session of stage.sessions) {
      if (!earliest || session.sessionDate < earliest) {
        earliest = session.sessionDate;
      }
    }
  }

  if (earliest) {
    return getSeoulYear(earliest);
  }

  return getSeoulYear(new Date());
}

async function pickNextRunNumber(client: WorkshopRunNumberingClient, workshopSlug: SiteWorkshopSlug, year: number) {
  const latest = await client.workshopRun.findFirst({
    where: { workshopSlug, year },
    orderBy: { runNumber: "desc" }
  });

  return latest ? latest.runNumber + 1 : 1;
}

async function getWorkshopRunNumberingGroups(client: WorkshopRunNumberingClient, runIds: string[]) {
  if (runIds.length === 0) {
    return [];
  }

  const runs = await client.workshopRun.findMany({
    where: { id: { in: runIds } },
    select: { workshopSlug: true, year: true }
  });
  const seen = new Set<string>();
  const groups: WorkshopRunNumberingGroup[] = [];

  for (const run of runs) {
    const key = `${run.workshopSlug}:${run.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      groups.push({ workshopSlug: run.workshopSlug, year: run.year });
    }
  }

  return groups;
}

async function renumberWorkshopRunGroups(client: WorkshopRunNumberingClient, groups: WorkshopRunNumberingGroup[]) {
  for (const group of groups) {
    await renumberWorkshopRunsForYear(client, group.workshopSlug, group.year);
  }
}

async function renumberWorkshopRunsForYear(client: WorkshopRunNumberingClient, workshopSlug: string, year: number) {
  const runs: WorkshopRunNumberingItem[] = await client.workshopRun.findMany({
    where: { workshopSlug, year },
    select: {
      id: true,
      createdAt: true,
      deletedAt: true,
      runNumber: true,
      stages: {
        select: {
          applicationStartsAt: true,
          applicationEndsAt: true,
          sessions: {
            select: { sessionDate: true }
          }
        }
      }
    }
  });

  if (runs.length <= 1) {
    return;
  }

  const orderedRuns = [...runs].sort(compareWorkshopRunsForNumbering);
  const alreadyOrdered = orderedRuns.every((run, index) => run.runNumber === index + 1);
  if (alreadyOrdered) {
    return;
  }

  const temporaryStart = Math.max(...runs.map((run) => run.runNumber), 0) + runs.length + 1;
  await Promise.all(
    runs.map((run, index) =>
      client.workshopRun.update({
        where: { id: run.id },
        data: { runNumber: temporaryStart + index }
      })
    )
  );

  await Promise.all(
    orderedRuns.map((run, index) =>
      client.workshopRun.update({
        where: { id: run.id },
        data: { runNumber: index + 1 }
      })
    )
  );
}

function compareWorkshopRunsForNumbering(left: WorkshopRunNumberingItem, right: WorkshopRunNumberingItem) {
  const leftDeleted = Boolean(left.deletedAt);
  const rightDeleted = Boolean(right.deletedAt);
  if (leftDeleted !== rightDeleted) {
    return leftDeleted ? 1 : -1;
  }

  const dateCompare = getWorkshopRunNumberingTime(left) - getWorkshopRunNumberingTime(right);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const createdCompare = left.createdAt.getTime() - right.createdAt.getTime();
  return createdCompare !== 0 ? createdCompare : left.id.localeCompare(right.id);
}

function getWorkshopRunNumberingTime(run: WorkshopRunNumberingItem) {
  const sessionTimes = run.stages.flatMap((stage) => stage.sessions.map((session) => session.sessionDate.getTime()));
  if (sessionTimes.length > 0) {
    return Math.min(...sessionTimes);
  }

  const applicationTimes = run.stages.flatMap((stage) =>
    [stage.applicationStartsAt, stage.applicationEndsAt].map((date) => date?.getTime()).filter((time): time is number => typeof time === "number")
  );
  if (applicationTimes.length > 0) {
    return Math.min(...applicationTimes);
  }

  return run.createdAt.getTime();
}

async function revalidateSiteAdminContent() {
  revalidatePath("/site-admin");
  // The public site webhook (up to 2s) runs after the response is sent so
  // every save/redirect doesn't block on the cross-app round-trip.
  after(() => revalidatePublicSiteContent());
}

// Keep a label suffix matching the public site convention.
void workshopSlugToLabel;

export async function updateAuthorProfileAction(formData: FormData) {
  const access = await requireSiteAdminAccess();
  const returnSection = readOptionalString(formData, "section");
  const safeReturnSection = ["new-post", "manage-posts", "schedules", "manage-schedules"].includes(returnSection ?? "")
    ? returnSection
    : "new-post";
  const displayName = readRequiredString(formData, "displayName");

  if (!isValidDisplayName(displayName)) {
    redirect(`/site-admin?section=${safeReturnSection}&error=display-name-invalid`);
  }

  await db.authorProfile.update({
    where: {
      userId: access.appUserId
    },
    data: { displayName }
  });

  await revalidateSiteAdminContent();
  redirect(`/site-admin?section=${safeReturnSection}&message=profile-updated`);
}

export async function saveAuthorDisplayNameAction(
  previousState: AuthorDisplayNameActionState,
  formData: FormData
): Promise<AuthorDisplayNameActionState> {
  const access = await requireSiteAdminAccess();
  const displayName = readOptionalString(formData, "displayName")?.trim() ?? "";
  const nextVersion = previousState.version + 1;

  if (!isValidDisplayName(displayName)) {
    return {
      displayName: previousState.displayName,
      message: "별명은 공백 없이 한글, 영문, 숫자만 사용해 2~12자로 입력해 주세요.",
      status: "error",
      version: nextVersion
    };
  }

  await db.authorProfile.update({
    where: {
      userId: access.appUserId
    },
    data: { displayName }
  });

  await revalidateSiteAdminContent();

  return {
    displayName,
    message: "별명을 저장했습니다.",
    status: "success",
    version: nextVersion
  };
}

function isValidDisplayName(value: string) {
  return /^[0-9A-Za-z가-힣]{2,12}$/u.test(value);
}

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value;
}

function readOptionalString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || null;
}

function readOptionalRichTextString(formData: FormData, key: string) {
  const value = formData.get(key)?.toString() ?? "";
  const sanitized = sanitizePostBody(value).trim();
  return sanitized || null;
}

function readSafeSiteAdminReturnPath(formData: FormData) {
  const returnTo = readOptionalString(formData, "returnTo");
  if (!returnTo) {
    return null;
  }

  try {
    const url = new URL(returnTo, "https://site-admin.local");
    if (url.origin !== "https://site-admin.local" || url.pathname !== "/site-admin") {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function readSelectedIds(formData: FormData, errorKey: string) {
  const ids = Array.from(new Set(formData.getAll("ids").map((value) => value.toString().trim()).filter(Boolean)));

  if (ids.length === 0) {
    redirectWithError(errorKey);
  }

  return ids;
}

function readRichTextPostFields(formData: FormData) {
  const title = readOptionalString(formData, "title");
  const body = formData.get("body")?.toString() ?? "";

  if (!title) {
    redirectWithError("post-required-fields");
  }

  return {
    title,
    body: sanitizePostBody(body)
  };
}

function readEnum<T extends string>(formData: FormData, key: string, validValues: Set<T>, fallback: T) {
  const value = formData.get(key)?.toString();
  return value && validValues.has(value as T) ? (value as T) : fallback;
}

function readRequiredEnum<T extends string>(formData: FormData, key: string, validValues: Set<T>, errorKey: string) {
  const value = formData.get(key)?.toString();
  if (!value || !validValues.has(value as T)) {
    redirectWithError(errorKey);
  }

  return value as T;
}

function readPostCategory(formData: FormData) {
  return readRequiredEnum(formData, "category", validCategories, "post-required-fields");
}

function readRelatedWorkshopLabels(formData: FormData, category: SitePostCategory) {
  const labels = readLabels(formData);
  const labelOptions: readonly string[] = sitePostLabelOptionsByCategory[category];

  if (labels.length === 0) {
    return [];
  }

  const validForCategory = labels.filter((label) => labelOptions.includes(label));
  if (validForCategory.length === 0) {
    redirectWithError("related-workshop-not-allowed");
  }

  // 안내 카테고리는 라벨 1개까지, 프로그램 라벨은 복수 허용.
  return category === SitePostCategory.COUNSELING ? validForCategory.slice(0, 1) : validForCategory;
}

function readLabels(formData: FormData) {
  const labels = formData
    .getAll("labels")
    .map((value) => value.toString().trim())
    .filter((label) => validLabels.has(label));

  return [...new Set(labels)];
}

function readWorkshopSlug(formData: FormData): SiteWorkshopSlug {
  const value = readRequiredString(formData, "workshopSlug");
  if (!validWorkshopSlugs.has(value)) {
    throw new Error(`Invalid workshop slug: ${value}`);
  }

  return value as SiteWorkshopSlug;
}

function readOptionalDate(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);
  if (!value) {
    return null;
  }

  return parseSeoulDateTimeInput(value, key);
}

function readRequiredDate(formData: FormData, key: string, fallbackKey?: string) {
  const date = readOptionalDate(formData, key) ?? (fallbackKey ? readOptionalDate(formData, fallbackKey) : null);
  if (!date) {
    throw new Error(`Missing required date field: ${key}`);
  }

  return date;
}

function ensureDateRangeOrder(startsAt: Date, endsAt: Date) {
  if (startsAt.getTime() >= endsAt.getTime()) {
    redirectWithError("schedule-payload-invalid");
  }
}

function readAttachments(formData: FormData) {
  return mergeLinkItems(
    [
      ...readLinkItems(formData, "attachments", 5),
      ...readLinkItems(formData, "uploadedAttachments", 5)
    ],
    5
  );
}

function readRelatedLinks(formData: FormData) {
  return mergeLinkItems(
    [
      ...readJsonLinkItems(formData, "relatedLinksJson", 3),
      ...readLinkItems(formData, "relatedLinksSerialized", 3),
      ...readLinkItems(formData, "relatedLinks", 3)
    ],
    3
  );
}

function readLinkItems(formData: FormData, key: string, limit: number) {
  const lines = formData
    .getAll(key)
    .map((value) => value.toString().trim())
    .filter(Boolean);

  return parseLinkLines(lines.join("\n"), limit);
}

function readJsonLinkItems(formData: FormData, key: string, limit: number) {
  const rawValue = readOptionalString(formData, key);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .slice(0, limit)
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as { title?: unknown; url?: unknown };
        if (typeof candidate.url !== "string") {
          return null;
        }

        const title = typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : candidate.url;
        return normalizeLinkItem(title, candidate.url);
      })
      .filter((item): item is { title: string; url: string } => Boolean(item));
  } catch {
    return [];
  }
}

function normalizeLinkItem(title: string, url: string) {
  try {
    const normalizedUrl = normalizeHttpUrl(url.trim(), "link");
    return {
      title: title.trim() || normalizedUrl,
      url: normalizedUrl
    };
  } catch {
    return null;
  }
}

function mergeLinkItems(items: Array<{ title: string; url: string }>, limit: number) {
  const seen = new Set<string>();
  const merged: Array<{ title: string; url: string }> = [];

  for (const item of items) {
    if (seen.has(item.url)) {
      continue;
    }

    seen.add(item.url);
    merged.push(item);
  }

  return merged.slice(0, limit);
}

function readRequiredHttpUrl(formData: FormData, key: string) {
  const value = normalizeHttpUrl(readRequiredString(formData, key), key);
  if (!value) {
    throw new Error(`Missing required URL field: ${key}`);
  }

  return value;
}


const messageSectionMap: Record<string, string> = {
  created: "manage-posts",
  updated: "manage-posts",
  deleted: "manage-posts",
  restored: "manage-posts",
  "hard-deleted": "manage-posts",
  "resource-created": "manage-posts",
  "resource-updated": "manage-posts",
  "resource-deleted": "manage-posts",
  "resource-restored": "manage-posts",
  "resource-hard-deleted": "manage-posts",
  "schedule-created": "manage-schedules",
  "schedule-updated": "manage-schedules",
  "schedule-deleted": "manage-schedules",
  "schedule-restored": "manage-schedules",
  "schedule-hard-deleted": "manage-schedules",
  "profile-updated": "new-post"
};

const errorSectionMap: Record<string, string> = {
  "post-permission": "manage-posts",
  "post-required-fields": "new-post",
  "related-workshop-not-allowed": "new-post",
  "resource-permission": "manage-posts",
  "schedule-permission": "manage-schedules",
  "schedule-payload-invalid": "schedules",
  "schedule-link-invalid": "schedules",
  "schedule-notice-post-unavailable": "schedules",
  "schedule-stages-required": "schedules",
  "schedule-sessions-required": "schedules",
  "bulk-action-invalid": "manage-posts",
  "bulk-selection-required": "manage-posts",
  "schedule-bulk-selection-required": "manage-schedules",
  "hard-delete-permission": "manage-posts",
  "display-name-invalid": "new-post"
};

function redirectWithMessage(message: string, returnTo?: string | null): never {
  if (returnTo) {
    const url = new URL(returnTo, "https://site-admin.local");
    url.searchParams.delete("error");
    url.searchParams.set("message", message);
    redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  redirect(`/site-admin?section=${messageSectionMap[message] ?? "manage-posts"}&message=${message}`);
}

function redirectWithError(error: string, returnTo?: string | null): never {
  if (returnTo) {
    const url = new URL(returnTo, "https://site-admin.local");
    url.searchParams.delete("message");
    url.searchParams.set("error", error);
    redirect(`${url.pathname}?${url.searchParams.toString()}`);
  }

  redirect(`/site-admin?section=${errorSectionMap[error] ?? "new-post"}&error=${error}`);
}

function logSiteAdminActionError(action: string, error: unknown, context: Record<string, string | undefined>) {
  if (isNextRedirectError(error)) {
    return;
  }

  console.error("[site-admin] action failed", {
    action,
    ...context,
    ...serializeSiteAdminActionError(error)
  });
}

function isNextRedirectError(error: unknown) {
  const digest = typeof error === "object" && error ? (error as { digest?: unknown }).digest : undefined;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function serializeSiteAdminActionError(error: unknown) {
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
