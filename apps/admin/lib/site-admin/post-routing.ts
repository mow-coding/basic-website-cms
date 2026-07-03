import { SitePostCategory } from "@prisma/client";
import { siteWorkshopOptions } from "@/lib/site-admin/constants";

export function getPostPublicLocationLabel(category: SitePostCategory, labels: readonly string[]) {
  if (category === SitePostCategory.COUNSELING) {
    return "안내";
  }

  // GENERAL / GREEN_BOARD / RESOURCE use program labels.
  // 프로그램 라벨 2개 이상 = 여러 프로그램을 동등하게 묶은 안내 → 프로그램 개요의 '일반' 탭.
  if (labels.length >= 2) {
    return "프로그램 일반 공지";
  }

  if (category === SitePostCategory.GREEN_BOARD) {
    return labels.length > 0 ? `${getWorkshopDisplayName(labels[0])} 자유게시판` : "소식";
  }

  if (category === SitePostCategory.RESOURCE) {
    return labels.length > 0 ? `${getWorkshopDisplayName(labels[0])} 자료실` : "소식";
  }

  return labels.length > 0 ? `${getWorkshopDisplayName(labels[0])} 프로그램 공지` : "소식";
}

function getWorkshopDisplayName(label: string) {
  return siteWorkshopOptions.find((workshop) => workshop.shortName === label)?.shortName ?? label;
}
