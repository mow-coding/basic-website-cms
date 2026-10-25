import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteAdminAccess } from "@/lib/site-admin/access";
const actorState = vi.hoisted(() => ({ current: null as SiteAdminAccess | null }));
vi.mock("@/lib/site-admin/access", () => ({ requireSiteAdminAccess: async () => {
  if (!actorState.current) throw new Error("Access denied");
  return actorState.current;
} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Object.assign(new Error("redirect"), { digest: `NEXT_REDIRECT;replace;${url};303;` }); } }));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient({ datasourceUrl: process.env.CMS_TEST_DATABASE_URL ?? "postgresql://unused:unused@127.0.0.1:1/unused" }) };
});
import { db } from "@/lib/db";
import { linkGoogleAccount } from "@/lib/google-account";
import { withSiteAdminMutation } from "@/lib/site-admin/audit";
import { saveWorkshopRun, ScheduleConflictError, type WorkshopRunUpdate } from "@/lib/site-admin/save-workshop-run";
import { updateWorkshopRunAction, updateWorkshopScheduleEventLinksAction, toggleWorkshopRunVisibilityAction } from "@/app/site-admin/actions";
import { getValidStageNamesForWorkshop } from "@/lib/site-admin/workshop-stage-presets";

const enabled = Boolean(process.env.CMS_TEST_DATABASE_URL);
let actorId = "";
let runId = "";
let access: SiteAdminAccess;
let payload: WorkshopRunUpdate;

describe.skipIf(!enabled)("actual PostgreSQL preservation and transaction regressions", () => {
  beforeAll(() => {
    const url = new URL(process.env.CMS_TEST_DATABASE_URL!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname) || !/^\/(?:cms_test|ci)$/.test(url.pathname)) {
      throw new Error("Integration tests require the explicitly isolated loopback test database.");
    }
  });
  beforeEach(async () => {
    const actor = await db.user.create({ data: { email: `cms-test-${randomUUID()}@example.invalid`, name: "Test" } });
    actorId = actor.id;
    access = { user: { email: actor.email, authVersion: 2, authProvider: "google", userId: actor.id, googleSubject: "test-sub" }, appUserId: actor.id, displayName: "Test", canManageSystemSettings: true };
    actorState.current = access;
    const notice = await db.sitePost.create({ data: { authorUserId: actor.id, title: "Test notice", body: "body", category: "GENERAL", visibility: "PUBLIC" } });
    const run = await db.workshopRun.create({ data: {
      authorUserId: actor.id, workshopSlug: `test-${randomUUID()}`, year: 2026, runNumber: 1,
      stages: { create: { stageName: "Test stage", orderIndex: 0, applicationFormUrl: "https://example.com/apply", noticePostId: notice.id,
        sessions: { create: { dayIndex: 0, sessionDate: new Date("2026-10-25T00:00:00+09:00"), startTime: "14:00", endTime: "17:00", applicationFormUrl: "https://example.com/session", noticePostId: notice.id } } } }
    }, include: { stages: { include: { sessions: true } } } });
    runId = run.id;
    payload = { workshopSlug: run.workshopSlug, applicationFormUrl: null, noticePostId: null, description: "updated", visibility: "PUBLIC", stages: run.stages.map((stage) => ({
      id: stage.id, stageName: stage.stageName, applicationStartsAt: null, applicationEndsAt: null,
      sessions: stage.sessions.map((session) => ({ id: session.id, sessionDate: session.sessionDate, startTime: "14:00", endTime: "18:00" }))
    })) };
  });
  afterEach(async () => {
    await db.workshopRun.deleteMany({ where: { authorUserId: actorId } });
    await db.sitePost.deleteMany({ where: { authorUserId: actorId } });
    await db.auditLog.deleteMany({ where: { actorUserId: actorId } });
    await db.user.deleteMany({ where: { id: actorId } });
  });
  afterAll(async () => { await db.$disconnect(); });
  const save = (revision: number, value = payload) => withSiteAdminMutation(access, { action: "test-save", resourceType: "workshopRun", resourceId: runId }, (tx) => saveWorkshopRun(tx, runId, revision, value));

  it("preserves stage/session IDs and links, and rejects the second stale tab", async () => {
    await save(0);
    const stored = await db.workshopRun.findUniqueOrThrow({ where: { id: runId }, include: { stages: { include: { sessions: true } } } });
    expect(stored.stages[0].id).toBe(payload.stages[0].id);
    expect(stored.stages[0].sessions[0].id).toBe(payload.stages[0].sessions[0].id);
    expect(stored.stages[0].applicationFormUrl).toBe("https://example.com/apply");
    expect(stored.stages[0].noticePostId).toBeTruthy();
    expect(stored.stages[0].sessions[0].applicationFormUrl).toBe("https://example.com/session");
    expect(stored.stages[0].sessions[0].noticePostId).toBeTruthy();
    await expect(save(0, { ...payload, description: "stale overwrite" })).rejects.toBeInstanceOf(ScheduleConflictError);
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).description).toBe("updated");
    expect(await db.auditLog.count({ where: { actorUserId: actorId, result: "SUCCESS" } })).toBe(1);
  });
  it("allows only one simultaneous revision claim", async () => {
    const results = await Promise.allSettled([save(0), save(0)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).revision).toBe(1);
  });
  it("reconciles added and removed rows and rejects foreign IDs atomically", async () => {
    await expect(save(0, { ...payload, stages: [{ ...payload.stages[0], id: "not-owned" }] })).rejects.toThrow("Invalid schedule stage ID");
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).revision).toBe(0);
    const originalId = payload.stages[0].id;
    await save(0, { ...payload, stages: [{ ...payload.stages[0], id: null, sessions: [{ ...payload.stages[0].sessions[0], id: null }] }] });
    expect(await db.scheduleStage.findUnique({ where: { id: originalId! } })).toBeNull();
  });
  it("rolls the mutation back if its success audit row cannot be written", async () => {
    const badAccess = { ...access, appUserId: "missing-user" };
    await expect(withSiteAdminMutation(badAccess, { action: "test-audit-failure", resourceType: "workshopRun" }, (tx) => saveWorkshopRun(tx, runId, 0, payload))).rejects.toThrow();
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).revision).toBe(0);
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).description).toBeNull();
  });
  it("does not write a SUCCESS record for a failed transaction or store body text", async () => {
    await expect(withSiteAdminMutation(access, { action: "test-failure", resourceType: "workshopRun" }, async (tx) => {
      await saveWorkshopRun(tx, runId, 0, payload); throw new Error("fixture failure");
    })).rejects.toThrow("fixture failure");
    expect(await db.auditLog.count({ where: { actorUserId: actorId, result: "SUCCESS" } })).toBe(0);
    await save(0);
    const logs = await db.auditLog.findMany({ where: { actorUserId: actorId } });
    expect(JSON.stringify(logs)).not.toContain("updated");
  });
  it("links a Google subject without changing an existing author ID, and rejects reassignment", async () => {
    const actor = await db.user.findUniqueOrThrow({ where: { id: actorId } });
    const identity = { email: actor.email, name: "Verified", subject: `subject-${randomUUID()}` };
    expect((await linkGoogleAccount(identity)).id).toBe(actorId);
    await expect(linkGoogleAccount({ ...identity, subject: "other-subject" })).rejects.toThrow("Google identity mismatch");
    expect((await db.user.findUniqueOrThrow({ where: { id: actorId } })).googleSubject).toBe(identity.subject);
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).authorUserId).toBe(actorId);
  });
  it("executes the real form action, preserves links through renumbering and returns a stale-form conflict", async () => {
    const stageName = [...getValidStageNamesForWorkshop("program-c")][0];
    await db.workshopRun.update({ where: { id: runId }, data: { workshopSlug: "program-c", year: 2099 } });
    await db.scheduleStage.update({ where: { id: payload.stages[0].id! }, data: { stageName } });
    const value = { ...payload, workshopSlug: "program-c", stages: [{ ...payload.stages[0], stageName,
      sessions: [{ ...payload.stages[0].sessions[0], sessionDate: "2099-10-25T00:00" }] }] };
    const form = new FormData();
    form.set("id", runId); form.set("expectedRevision", "0"); form.set("workshopRunPayload", JSON.stringify(value));
    await expect(updateWorkshopRunAction(form)).rejects.toMatchObject({ digest: expect.stringContaining("message=schedule-updated") });
    const result = await updateWorkshopRunAction(form);
    expect(result?.status).toBe("conflict");
    const stage = await db.scheduleStage.findUniqueOrThrow({ where: { id: payload.stages[0].id! }, include: { sessions: true } });
    expect(stage.applicationFormUrl).toBe("https://example.com/apply");
    expect(stage.sessions[0].noticePostId).toBeTruthy();
  });
  it("increments the parent revision on a link-only edit and visibility change", async () => {
    const form = new FormData();
    form.set("scheduleEventKind", "session"); form.set("scheduleEventId", payload.stages[0].sessions[0].id!);
    form.set("applicationFormUrl", ""); form.set("noticePostId", "");
    await expect(updateWorkshopScheduleEventLinksAction(form)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).revision).toBe(1);
    const visibility = new FormData(); visibility.set("id", runId); visibility.set("visibility", "DRAFT");
    await expect(toggleWorkshopRunVisibilityAction(visibility)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect((await db.workshopRun.findUniqueOrThrow({ where: { id: runId } })).revision).toBe(2);
    await expect(save(0)).rejects.toBeInstanceOf(ScheduleConflictError);
  });
});
