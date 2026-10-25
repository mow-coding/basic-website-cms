import { ActionResult, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SiteAdminAccess } from "@/lib/site-admin/access";

type AuditInput = {
  action: string;
  resourceType: string;
  resourceId?: string;
  fields?: string[];
};

export async function recordSiteAdminAudit(tx: Prisma.TransactionClient, access: SiteAdminAccess, input: AuditInput, result: unknown) {
  const record = result && typeof result === "object" ? result as Record<string, unknown> : {};
  await tx.auditLog.create({ data: {
    actorUserId: access.appUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: typeof record.id === "string" ? record.id : input.resourceId,
    result: ActionResult.SUCCESS,
    metaJson: {
      fields: (input.fields ?? []).filter((field) => /^[A-Za-z][A-Za-z0-9]*$/.test(field)).slice(0, 30),
      ...(typeof record.count === "number" ? { count: record.count } : {})
    }
  } });
}

export async function recordSiteAdminFailure(access: SiteAdminAccess | null, input: AuditInput, result: "DENIED" | "ERROR") {
  try {
    await db.auditLog.create({ data: {
      actorUserId: access?.appUserId, action: input.action, resourceType: input.resourceType,
      resourceId: input.resourceId, result
    } });
  } catch {
    console.error("[site-admin] audit failure", { action: input.action, result });
  }
}

export async function withSiteAdminMutation<T>(access: SiteAdminAccess, input: AuditInput, mutate: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await db.$transaction(async (tx) => {
      const result = await mutate(tx);
      await recordSiteAdminAudit(tx, access, input, result);
      return result;
    });
  } catch (error) {
    await recordSiteAdminFailure(access, input, "ERROR");
    throw error;
  }
}
