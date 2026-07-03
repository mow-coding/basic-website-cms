export type WorkshopSlug = "program-a" | "program-b" | "program-c" | "program-d";

export type CalendarScopeSlug = "general" | WorkshopSlug;

export type NoticeCategory = "전체 공지" | "프로그램 공지" | "안내" | "자유게시판" | "자료실";

export type NoticeLabel = "프로그램A" | "프로그램B" | "프로그램C" | "프로그램D" | "상담" | "자료실";

export type WorkshopStatus = "신청 중" | "신청 마감" | "종료" | "등록된 일정 없음";

// Canonical production domain; NEXT_PUBLIC_SITE_URL overrides it per environment.
const defaultSiteDomain = "https://example.com";

function normalizeSiteDomain(domain?: string) {
  return (domain || defaultSiteDomain).replace(/\/+$/, "");
}

export const siteConfig = {
  name: "모오 임상심리연구소",
  title: "마음을 이해하는 임상심리 전문기관",
  domain: normalizeSiteDomain(process.env.NEXT_PUBLIC_SITE_URL),
  email: "admin@example.com",
  description:
    "모오 임상심리연구소는 심리상담과 심리평가, 임상심리 전문가 교육 프로그램을 운영하는 전문기관입니다.",
  heroCopy: ["혼자 감당해온 마음의 무게가 있다면", "이제 전문가와 함께 살펴볼 때입니다"],
  colors: {
    blue: "#4E73AA",
    deepBlue: "#2A5F7F",
    gray: "#777777",
  },
};

export const inquiryLinks = {
  institute: "https://example.com",
  counseling: "https://example.com",
};

export const workshops: Array<{
  slug: WorkshopSlug;
  shortName: string;
  title: string;
  description: string;
  cardImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  introParagraphs: string[][];
  status: WorkshopStatus;
  courses: string[];
}> = [
  {
    slug: "program-a",
    shortName: "프로그램A",
    title: "프로그램 A",
    description: "실무의 기초를 처음부터 차근차근 다지는 입문 과정입니다.",
    cardImage: {
      src: "/program-a.jpg",
      alt: "안개가 낮게 깔린 산과 숲",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["프로그램 A는 임상 현장에 처음 발을 들이는 분들을 위한 입문 과정입니다. 심리평가와 상담의 기본 개념을 이론 강의로 익히고, 간단한 사례로 실제 흐름을 경험합니다."],
      ["매 회차는 강의와 토론, 실습으로 구성되어 배운 내용을 바로 적용해 볼 수 있습니다. 관련 전공생과 초심 실무자 모두에게 열려 있습니다."],
    ],
    status: "신청 중",
    courses: [],
  },
  {
    slug: "program-b",
    shortName: "프로그램B",
    title: "프로그램 B",
    description: "핵심만 짧게 집중해서 다루는 단기 특강 과정입니다.",
    cardImage: {
      src: "/program-b.jpg",
      alt: "옅은 안개에 잠긴 숲",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["프로그램 B는 특정 주제를 짧고 깊게 다루는 단기 특강입니다. 바쁜 일정 속에서도 핵심을 놓치지 않도록 하루나 이틀 과정으로 구성됩니다."],
      ["이론 요약과 사례 중심의 논의를 함께 진행하여, 짧은 시간 안에 실질적인 도움을 얻어 가실 수 있습니다."],
    ],
    status: "등록된 일정 없음",
    courses: [],
  },
  {
    slug: "program-c",
    shortName: "프로그램C",
    title: "프로그램 C",
    description: "여러 단계에 걸쳐 이론과 실습을 함께 쌓아가는 단계별 과정입니다.",
    cardImage: {
      src: "/program-c.jpg",
      alt: "안개가 흐르는 능선",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["프로그램 C는 여러 단계로 진행되는 심화 과정입니다. 단계마다 이론을 다지고 사례 실습을 반복하며 참여자들이 서로의 시선을 나눕니다."],
      ["단계가 올라갈수록 다루는 사례의 난이도가 높아지며, 전 과정을 이수하면 실무에 필요한 흐름을 체계적으로 익히게 됩니다."],
    ],
    status: "신청 중",
    courses: [],
  },
  {
    slug: "program-d",
    shortName: "프로그램D",
    title: "프로그램 D",
    description: "실제 사례를 깊이 있게 다루는 고급 심화 과정입니다.",
    cardImage: {
      src: "/program-d.jpg",
      alt: "안개 낀 잔잔한 호수",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["프로그램 D는 실제 사례를 깊이 있게 검토하는 고급 과정입니다. 이미 실무 경험이 있는 분들이 자신의 사례를 가지고 와 함께 논의합니다."],
      ["소수 인원으로 진행되며, 슈퍼비전과 토론을 통해 각자의 관점을 정교하게 다듬어 갑니다."],
    ],
    status: "신청 중",
    courses: [],
  },
];

// 캐노니컬 데모 게시물 1~5(비자료실). 어드민 시드(seed-demo-content.mjs)와 동일한 세계를
// 정적 폴백으로 재현합니다. 6·7번(자료실)은 아래 resources 배열로 노출합니다.
// 각 게시물은 고유 본문을 가집니다(시드의 <p>…</p> HTML과 문안이 100% 일치).

export const notices = [
  {
    id: 101,
    title: "2026년 상반기 상담·검사 운영 시간 안내",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:30",
    updatedAt: "-",
    official: true,
    body: [
      "3월부터 상담과 심리검사 예약 가능 시간이 일부 조정됩니다.",
      "평일은 오전 10시부터 오후 7시까지, 토요일은 오후 2시까지 운영합니다.",
      "예약과 문의는 홈페이지 문의 양식을 이용해 주시기 바랍니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 102,
    // GENERAL + 프로그램 라벨 → 홈에서 "프로그램 공지" 섹션에 노출됩니다.
    title: "프로그램 A 3기 수강생을 모집합니다",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:20",
    updatedAt: "-",
    official: true,
    body: [
      "심리평가 실무의 기초를 처음부터 다지고자 하는 분들을 위한 프로그램 A 3기 수강생을 모집합니다.",
      "정원은 20명이며 신청은 선착순으로 마감됩니다.",
      "자세한 일정과 신청 방법은 프로그램 안내 페이지에서 확인하실 수 있습니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 103,
    title: "심리상담은 이렇게 진행됩니다",
    category: "안내" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:10",
    updatedAt: "-",
    official: true,
    body: [
      "첫 상담에서는 지금 겪고 계신 어려움과 상담을 통해 바라는 변화를 함께 이야기합니다.",
      "이후 상담자와 협의하여 상담의 방향과 횟수를 정합니다.",
      "상담에서 나눈 내용은 철저히 비밀이 보장됩니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 104,
    title: "연구소 서가에 새 책들을 들였습니다",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.04.26 17:00",
    updatedAt: "-",
    official: false,
    body: [
      "이번 달에는 감정 조절과 애착을 다룬 책 몇 권을 서가에 새로 두었습니다.",
      "상담을 기다리시는 동안 편하게 읽어보실 수 있습니다.",
      "함께 읽고 싶은 책이 있다면 언제든 알려주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 105,
    // 후기: 운영자 1 + GREEN_BOARD + 프로그램C 라벨 → 후기/리뷰 탭에 노출됩니다.
    title: "프로그램 C를 마치며 남기는 기록",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.04.26 16:50",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: [
      "여러 단계를 함께한 프로그램 C가 이번 주로 마무리되었습니다.",
      "매주 사례를 나누며 서로의 시선을 배우는 시간이었습니다.",
      "참여해 주신 모든 분께 감사드리며, 다음 기수에서 다시 뵙기를 바랍니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    // 캐노니컬 자료실 게시물 6·7. 운영 어드민에서는 RESOURCE 게시물도 notices 스트림으로
    // 내려오므로, 워크숍 상세 페이지의 "자료실" 탭이 폴백에서도 동일하게 채워지도록 여기에 둡니다.
    id: 106,
    title: "프로그램 A 1회차 참고자료를 공유합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 16:40",
    updatedAt: "-",
    official: true,
    body: [
      "프로그램 A 1회차에서 다룬 기본 개념 정리 자료를 공유합니다.",
      "수강생 여러분은 아래 링크에서 자료를 내려받으실 수 있습니다.",
      "복습에 참고해 주시기 바랍니다.",
    ],
    relatedLinks: [{ title: "1회차 참고자료 (PDF)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 107,
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 16:30",
    updatedAt: "-",
    official: true,
    body: [
      "프로그램 C에서 사용하는 사례 정리 양식을 배포합니다.",
      "다음 시간까지 각자 맡은 사례를 양식에 맞추어 정리해 오시면 됩니다.",
      "궁금한 점은 담당 운영자에게 문의해 주세요.",
    ],
    relatedLinks: [{ title: "사례 정리 양식 (문서)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
];

// 캐노니컬 자료실 게시물 6·7(RESOURCE + 프로그램 라벨). 어드민 시드와 동일 세계.
export const resources = [
  {
    id: 201,
    workshop: "program-a" as WorkshopSlug,
    session: "제1회 프로그램 A",
    title: "프로그램 A 1회차 참고자료를 공유합니다",
    description: "프로그램 A 1회차에서 다룬 기본 개념 정리 자료를 공유합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.04.26 17:32",
    updatedAt: "-",
  },
  {
    id: 202,
    workshop: "program-c" as WorkshopSlug,
    session: "제1회 프로그램 C",
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    description: "프로그램 C에서 사용하는 사례 정리 양식을 배포합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.04.26 17:33",
    updatedAt: "-",
  },
];

export const researchSurveyHref = "https://github.com/mow-coding/basic-website-cms";

// ---------------------------------------------------------------------------
// 정적 폴백 캘린더 데이터 (SITE_ADMIN_API_URL 미설정 시 사용)
//
// 어드민 시드(seed-demo-content.mjs)와 동일한 캐노니컬 일정/런을 재현합니다.
// 날짜는 요청 시점의 new Date() 기준 상대 오프셋으로 계산하므로 매 배포마다 항상
// 미래로 유지됩니다. 아래 두 빌더는 public-site-content.ts의 getFallbackContent에서
// PublicGeneralSchedule / PublicWorkshopRun 형태로 사용됩니다.
// 서울(UTC+9, DST 없음) 벽시계 기준으로 인스턴트를 계산합니다.

const SEOUL_UTC_OFFSET_MINUTES = 9 * 60;

// 오늘 기준 day 오프셋의 서울 벽시계 hour:minute에 해당하는 UTC 인스턴트를 만듭니다.
function seoulOffsetIso(daysFromNow: number, hour = 0, minute = 0) {
  const now = new Date();
  // 오늘의 서울 날짜(연/월/일)를 구합니다.
  const seoulNow = new Date(now.getTime() + SEOUL_UTC_OFFSET_MINUTES * 60000);
  const year = seoulNow.getUTCFullYear();
  const month = seoulNow.getUTCMonth();
  const day = seoulNow.getUTCDate();
  // 서울 벽시계 시각을 UTC 인스턴트로 환산: UTC = 서울시각 - 9h.
  const utcMillis =
    Date.UTC(year, month, day + daysFromNow, hour, minute, 0, 0) - SEOUL_UTC_OFFSET_MINUTES * 60000;
  return new Date(utcMillis).toISOString();
}

type FallbackGeneralScheduleSpec = {
  id: string;
  title: string;
  description: string;
  day: number;
  startHour: number;
  endHour: number;
};

const fallbackGeneralScheduleSpecs: FallbackGeneralScheduleSpec[] = [
  {
    id: "general-1",
    title: "월례 공개 사례 세미나",
    description: "매달 한 차례, 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나입니다.",
    day: 14,
    startHour: 10,
    endHour: 12,
  },
  {
    id: "general-2",
    title: "여름 정기 휴무 안내",
    description: "연구소 정기 휴무일입니다. 이날은 상담과 문의 응대가 어렵습니다.",
    day: 3,
    startHour: 10,
    endHour: 18,
  },
  {
    id: "general-3",
    title: "상담자 집단 슈퍼비전",
    description: "상담자들이 모여 사례를 검토하고 서로의 관점을 나누는 내부 모임입니다.",
    day: 8,
    startHour: 14,
    endHour: 17,
  },
  {
    id: "general-4",
    title: "저녁 심리학 독서모임",
    description: "심리학 책 한 권을 함께 읽고 이야기 나누는 저녁 모임입니다.",
    day: 22,
    startHour: 19,
    endHour: 21,
  },
  {
    id: "general-5",
    title: "가을 마음건강 공개 특강",
    description: "일반인을 위한 마음건강 주제의 공개 특강입니다. 사전 신청을 받습니다.",
    day: 40,
    startHour: 10,
    endHour: 16,
  },
];

// PublicGeneralSchedule[] 형태로 반환합니다.
export function buildFallbackGeneralSchedules() {
  const nowIso = new Date().toISOString();
  return fallbackGeneralScheduleSpecs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    description: spec.description,
    date: seoulOffsetIso(spec.day, spec.startHour, 0),
    endsAt: seoulOffsetIso(spec.day, spec.endHour, 0),
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}

type FallbackSessionSpec = { day: number; startTime: string; endTime: string };
type FallbackStageSpec = {
  stageName: string;
  orderIndex: number;
  applicationStartDay: number;
  applicationEndDay: number;
  sessions: FallbackSessionSpec[];
};
type FallbackRunSpec = {
  workshopSlug: WorkshopSlug;
  description: string;
  stages: FallbackStageSpec[];
};

const fallbackWorkshopRunSpecs: FallbackRunSpec[] = [
  {
    workshopSlug: "program-a",
    description: "실무의 기초를 처음부터 다지는 입문 과정입니다.",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: -3,
        applicationEndDay: 8,
        sessions: [
          { day: 12, startTime: "10:00", endTime: "13:00" },
          { day: 13, startTime: "10:00", endTime: "13:00" },
        ],
      },
    ],
  },
  {
    workshopSlug: "program-c",
    description: "여러 단계에 걸쳐 이론과 사례 실습을 함께 쌓아가는 단계별 과정입니다.",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: 9,
        applicationEndDay: 27,
        sessions: [{ day: 30, startTime: "10:00", endTime: "13:00" }],
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStartDay: 23,
        applicationEndDay: 41,
        sessions: [{ day: 44, startTime: "10:00", endTime: "13:00" }],
      },
    ],
  },
  {
    workshopSlug: "program-d",
    description: "실제 사례를 깊이 있게 검토하는 고급 심화 과정입니다.",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: 4,
        applicationEndDay: 22,
        sessions: [
          { day: 25, startTime: "14:00", endTime: "17:00" },
          { day: 26, startTime: "14:00", endTime: "17:00" },
        ],
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStartDay: 25,
        applicationEndDay: 43,
        sessions: [{ day: 46, startTime: "14:00", endTime: "17:00" }],
      },
      {
        stageName: "3단계",
        orderIndex: 2,
        applicationStartDay: 39,
        applicationEndDay: 57,
        sessions: [{ day: 60, startTime: "14:00", endTime: "17:00" }],
      },
    ],
  },
];

// PublicWorkshopRun[] 형태로 반환합니다. runLabel은 캘린더가 규칙대로 생성하도록 비웁니다.
export function buildFallbackWorkshopRuns() {
  const nowIso = new Date().toISOString();
  const year = new Date().getFullYear();
  const runNumber = 1;

  return fallbackWorkshopRunSpecs.map((runSpec) => ({
    id: `${runSpec.workshopSlug}-run-${runNumber}`,
    workshopSlug: runSpec.workshopSlug,
    year,
    runNumber,
    runLabel: "",
    applicationFormUrl: "https://example.com",
    description: runSpec.description,
    noticePost: null,
    stages: runSpec.stages.map((stage, stageIndex) => ({
      id: `${runSpec.workshopSlug}-stage-${stageIndex}`,
      stageName: stage.stageName,
      orderIndex: stage.orderIndex,
      applicationStartsAt: seoulOffsetIso(stage.applicationStartDay, 9, 0),
      applicationEndsAt: seoulOffsetIso(stage.applicationEndDay, 18, 0),
      applicationFormUrl: "https://example.com",
      noticePostId: null,
      noticePost: null,
      sessions: stage.sessions.map((session, sessionIndex) => ({
        id: `${runSpec.workshopSlug}-stage-${stageIndex}-session-${sessionIndex}`,
        dayIndex: sessionIndex,
        // 서울 자정 인스턴트. 벽시계 시각은 startTime/endTime 오프셋으로 더해집니다.
        sessionDate: seoulOffsetIso(session.day, 0, 0),
        startTime: session.startTime,
        endTime: session.endTime,
        applicationFormUrl: "https://example.com",
        noticePostId: null,
        noticePost: null,
      })),
    })),
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
}
