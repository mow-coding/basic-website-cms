import type { NoticeLabel } from "@/lib/site-data";

// Single source of truth for "which labels are workshop labels". Routing/visibility
// across the site depends on this (게시판 exclusion, workshop pages, the /nested 일반 vs
// per-workshop tabs). Add a 5th workshop here and every consumer follows.
export const WORKSHOP_NOTICE_LABELS = ["프로그램A", "프로그램B", "프로그램C", "프로그램D"] as const satisfies readonly NoticeLabel[];

export const workshopNoticeLabelSet = new Set<NoticeLabel>(WORKSHOP_NOTICE_LABELS);
