import type { Prisma, SiteContentVisibility } from "@prisma/client";

type SessionInput = { id: string | null; sessionDate: Date; startTime: string; endTime: string };
type StageInput = {
  id: string | null;
  stageName: string;
  applicationStartsAt: Date | null;
  applicationEndsAt: Date | null;
  sessions: SessionInput[];
};
export type WorkshopRunUpdate = {
  workshopSlug: string;
  applicationFormUrl: string | null;
  noticePostId: string | null;
  description: string | null;
  visibility: SiteContentVisibility;
  stages: StageInput[];
};

export class ScheduleConflictError extends Error {
  constructor() { super("Schedule was changed by another request"); this.name = "ScheduleConflictError"; }
}

export async function saveWorkshopRun(tx: Prisma.TransactionClient, id: string, expectedRevision: number, payload: WorkshopRunUpdate) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new ScheduleConflictError();
  const claimed = await tx.workshopRun.updateMany({
    where: { id, deletedAt: null, revision: expectedRevision, workshopSlug: payload.workshopSlug },
    data: { revision: { increment: 1 } }
  });
  if (claimed.count !== 1) throw new ScheduleConflictError();
  // Claim the parent first: concurrent saves and link edits serialize on this row.
  const existing = await tx.workshopRun.findUniqueOrThrow({ where: { id }, include: { stages: { include: { sessions: true } } } });
  const stageIds = payload.stages.flatMap((stage) => stage.id ? [stage.id] : []);
  const sessionIds = payload.stages.flatMap((stage) => stage.sessions.flatMap((session) => session.id ? [session.id] : []));
  if (new Set(stageIds).size !== stageIds.length || new Set(sessionIds).size !== sessionIds.length) throw new Error("Duplicate schedule IDs");
  for (const stage of payload.stages) {
    const oldStage = stage.id ? existing.stages.find((item) => item.id === stage.id) : null;
    if (stage.id && !oldStage) throw new Error("Invalid schedule stage ID");
    for (const session of stage.sessions) {
      if (session.id && !oldStage?.sessions.some((item) => item.id === session.id)) throw new Error("Invalid schedule session ID");
    }
  }
  await tx.workshopRun.update({ where: { id }, data: {
    applicationFormUrl: payload.applicationFormUrl, noticePostId: payload.noticePostId,
    description: payload.description, visibility: payload.visibility
  } });
  await tx.scheduleStage.deleteMany({ where: { workshopRunId: id, id: { notIn: stageIds } } });
  for (const [orderIndex, stage] of payload.stages.entries()) {
    const data = { stageName: stage.stageName, orderIndex, applicationStartsAt: stage.applicationStartsAt, applicationEndsAt: stage.applicationEndsAt };
    const saved = stage.id
      ? await tx.scheduleStage.update({ where: { id: stage.id }, data })
      : await tx.scheduleStage.create({ data: { ...data, workshopRunId: id } });
    const keep = stage.sessions.flatMap((session) => session.id ? [session.id] : []);
    await tx.scheduleSession.deleteMany({ where: { scheduleStageId: saved.id, id: { notIn: keep } } });
    for (const [dayIndex, session] of stage.sessions.entries()) {
      const data = { dayIndex, sessionDate: session.sessionDate, startTime: session.startTime, endTime: session.endTime };
      if (session.id) await tx.scheduleSession.update({ where: { id: session.id }, data });
      else await tx.scheduleSession.create({ data: { ...data, scheduleStageId: saved.id } });
    }
  }
  return { id, revision: expectedRevision + 1 };
}
