import type { SiteWorkshopSlug } from "@/lib/site-admin/constants";

export type WorkshopStagePreset = {
  name: string;
  defaultActive: boolean;
  defaultDayCount: number;
  group?: string;
};

export const workshopStagePresets: Record<SiteWorkshopSlug, WorkshopStagePreset[]> = {
  "program-a": [],
  "program-b": [],
  "program-c": [
    {
      name: "1단계",
      defaultActive: false,
      defaultDayCount: 1,
      group: "level-1"
    },
    {
      name: "2단계",
      defaultActive: false,
      defaultDayCount: 1,
      group: "level-1"
    },
    {
      name: "3단계",
      defaultActive: false,
      defaultDayCount: 1,
      group: "level-1"
    },
    {
      name: "4단계",
      defaultActive: true,
      defaultDayCount: 1
    },
    {
      name: "5단계",
      defaultActive: true,
      defaultDayCount: 1
    }
  ],
  "program-d": [
    {
      name: "1단계",
      defaultActive: true,
      defaultDayCount: 1
    },
    {
      name: "2단계",
      defaultActive: true,
      defaultDayCount: 2
    },
    {
      name: "3단계",
      defaultActive: true,
      defaultDayCount: 1
    }
  ]
};

export function getWorkshopStagePresets(slug: SiteWorkshopSlug) {
  return workshopStagePresets[slug];
}

export function getValidStageNamesForWorkshop(slug: SiteWorkshopSlug) {
  return new Set(workshopStagePresets[slug].map((preset) => preset.name));
}

export function getWorkshopShortName(slug: SiteWorkshopSlug) {
  return workshopShortNameMap[slug];
}

const workshopShortNameMap: Record<SiteWorkshopSlug, string> = {
  "program-a": "프로그램A",
  "program-b": "프로그램B",
  "program-c": "프로그램C",
  "program-d": "프로그램D"
};
