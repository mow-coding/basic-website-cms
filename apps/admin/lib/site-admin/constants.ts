import { SiteContentVisibility, SitePostCategory } from "@prisma/client";

export const sitePostCategoryLabels: Record<SitePostCategory, string> = {
  GENERAL: "공지사항",
  COUNSELING: "안내",
  GREEN_BOARD: "자유게시판",
  RESOURCE: "자료실"
};

export const selectableSitePostCategories = [
  SitePostCategory.GENERAL,
  SitePostCategory.COUNSELING,
  SitePostCategory.GREEN_BOARD,
  SitePostCategory.RESOURCE
] as const;

export const relatedWorkshopEnabledCategories = new Set<SitePostCategory>([
  SitePostCategory.GENERAL,
  SitePostCategory.GREEN_BOARD,
  SitePostCategory.RESOURCE
]);

export const siteVisibilityLabels: Record<SiteContentVisibility, string> = {
  PUBLIC: "공개",
  DRAFT: "비공개"
};

export const selectableSiteVisibilityOptions = [SiteContentVisibility.PUBLIC, SiteContentVisibility.DRAFT] as const;

export const sitePostWorkshopLabelOptions = ["프로그램A", "프로그램B", "프로그램C", "프로그램D"] as const;
export const sitePostLabelOptions = [...sitePostWorkshopLabelOptions] as const;
export const sitePostLabelOptionsByCategory = {
  GENERAL: sitePostWorkshopLabelOptions,
  COUNSELING: [],
  GREEN_BOARD: sitePostWorkshopLabelOptions,
  RESOURCE: sitePostWorkshopLabelOptions
} as const satisfies Record<SitePostCategory, readonly string[]>;
export type SitePostWorkshopLabel = (typeof sitePostWorkshopLabelOptions)[number];

export const siteWorkshopOptions = [
  {
    slug: "program-a",
    shortName: "프로그램A",
    title: "프로그램 A"
  },
  {
    slug: "program-b",
    shortName: "프로그램B",
    title: "프로그램 B"
  },
  {
    slug: "program-c",
    shortName: "프로그램C",
    title: "프로그램 C"
  },
  {
    slug: "program-d",
    shortName: "프로그램D",
    title: "프로그램 D"
  }
] as const;

export type SiteWorkshopSlug = (typeof siteWorkshopOptions)[number]["slug"];

export const generalScheduleSlug = "general";

export const siteScheduleScopeOptions = [
  {
    slug: generalScheduleSlug,
    shortName: "기본",
    title: "기본 일정"
  },
  ...siteWorkshopOptions
] as const;

export type SiteScheduleScopeSlug = (typeof siteScheduleScopeOptions)[number]["slug"];

export const workshopLabelToSlug = {
  프로그램A: "program-a",
  프로그램B: "program-b",
  프로그램C: "program-c",
  프로그램D: "program-d"
} as const satisfies Record<SitePostWorkshopLabel, SiteWorkshopSlug>;

export const workshopSlugToLabel = {
  "program-a": "프로그램A",
  "program-b": "프로그램B",
  "program-c": "프로그램C",
  "program-d": "프로그램D"
} as const satisfies Record<SiteWorkshopSlug, SitePostWorkshopLabel>;
