import { PrismaClient } from "@prisma/client";
import { list } from "@vercel/blob";
import { pathToFileURL } from "node:url";

export function collectReferences(records) {
  // Deliberately conservative: include drafts, trash, text URLs and every JSON value.
  // Never use this inventory alone as proof that a file can safely be deleted.
  const text = JSON.stringify(records);
  const decoded = text.replaceAll("&amp;", "&");
  const references = new Set();
  for (const match of decoded.matchAll(/https(?:[^\s<>"'\\]|\\\")*/g)) {
    for (const candidate of [match[0], ...safeDecode(match[0])]) {
      const url = candidate.match(/https:\/\/[^\s<>"'\\&]+/g) ?? [];
      for (const value of url) references.add(value);
    }
  }
  // Percent-encoded legacy proxy URLs and JSON-escaped references are protective too.
  for (const match of decoded.matchAll(/https%3A%2F%2F[^\s<>"'\\&]+/gi)) {
    for (const candidate of safeDecode(match[0])) references.add(candidate);
  }
  return references;
}

function safeDecode(value) { try { return [decodeURIComponent(value)]; } catch { return []; } }

export function classifyBlob(blob, references, now = new Date()) {
  const age = now.getTime() - new Date(blob.uploadedAt).getTime();
  if (references.has(blob.url)) return "referenced";
  if (!Number.isFinite(age) || age < 30 * 86400000) return "grace-period";
  if (!/^(site-attachments|site-body-images)\//.test(blob.pathname)) return "unknown-path";
  return "review-candidate";
}

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== "--dry-run")) throw new Error("Inventory only: deletion/apply options are not supported.");
  const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  const host = process.env.PRIVATE_BLOB_HOST?.trim().toLowerCase();
  if (!token || !host?.endsWith(".private.blob.vercel-storage.com")) throw new Error("A private Blob store must be configured.");
  const db = new PrismaClient();
  try {
    const records = await Promise.all([
      db.sitePost.findMany({ select: { body: true, attachments: true, relatedLinks: true } }),
      db.siteResource.findMany({ select: { url: true, description: true } }),
      db.generalSchedule.findMany({ select: { description: true } }),
      db.workshopRun.findMany({ select: { description: true, applicationFormUrl: true, stages: { include: { sessions: true } } } })
    ]);
    const references = collectReferences(records);
    const counts = {};
    let cursor;
    do {
      const page = await list({ token, cursor, limit: 1000 });
      for (const blob of page.blobs) {
        if (new URL(blob.url).hostname !== host) throw new Error("Unexpected Blob store in listing.");
        const state = classifyBlob(blob, references);
        counts[state] = (counts[state] ?? 0) + 1;
        if (state === "review-candidate") console.log(JSON.stringify({ state, pathname: blob.pathname, uploadedAt: blob.uploadedAt, size: blob.size }));
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    console.log(JSON.stringify({ mode: "dry-run", deletionEnabled: false, graceDays: 30, counts, warning: "Candidates require manual reference review; unknown/legacy use may exist." }));
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Inventory failed; credentials and content are not printed."); process.exitCode = 1; });
}
