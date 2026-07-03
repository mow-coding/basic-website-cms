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
  title: "전문적 심리치료 및 심리검사 서비스",
  domain: normalizeSiteDomain(process.env.NEXT_PUBLIC_SITE_URL),
  email: "admin@example.com",
  description:
    "모오 임상심리연구소의 공개 웹사이트 데모입니다. 실제 소개 문구는 운영 환경에서 작성합니다.",
  heroCopy: ["여기에 소개 문장이 들어갑니다", "두 줄까지 쓸 수 있습니다"],
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
    description: "여기에 프로그램 A의 소개 문구가 들어갑니다.\n실제 문구는 운영 환경에서 작성합니다.",
    cardImage: {
      src: "/og-image.png",
      alt: "프로그램 A 대표 이미지 자리입니다.",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["여기에 프로그램 A의 첫 번째 소개 문단이 들어갑니다."],
      ["여기에 프로그램 A의 두 번째 소개 문단이 들어갑니다."],
    ],
    status: "신청 중",
    courses: [],
  },
  {
    slug: "program-b",
    shortName: "프로그램B",
    title: "프로그램 B",
    description: "여기에 프로그램 B의 소개 문구가 들어갑니다.",
    cardImage: {
      src: "/og-image.png",
      alt: "프로그램 B 대표 이미지 자리입니다.",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["여기에 프로그램 B의 첫 번째 소개 문단이 들어갑니다."],
      ["여기에 프로그램 B의 두 번째 소개 문단이 들어갑니다."],
    ],
    status: "등록된 일정 없음",
    courses: [],
  },
  {
    slug: "program-c",
    shortName: "프로그램C",
    title: "프로그램 C",
    description: "여기에 프로그램 C의 소개 문구가 들어갑니다.\n단계별 일정이 있는 프로그램 예시입니다.",
    cardImage: {
      src: "/og-image.png",
      alt: "프로그램 C 대표 이미지 자리입니다.",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["여기에 프로그램 C의 첫 번째 소개 문단이 들어갑니다."],
      ["여기에 프로그램 C의 두 번째 소개 문단이 들어갑니다."],
    ],
    status: "신청 중",
    courses: [],
  },
  {
    slug: "program-d",
    shortName: "프로그램D",
    title: "프로그램 D",
    description: "여기에 프로그램 D의 소개 문구가 들어갑니다.",
    cardImage: {
      src: "/og-image.png",
      alt: "프로그램 D 대표 이미지 자리입니다.",
      width: 1200,
      height: 630,
    },
    introParagraphs: [
      ["여기에 프로그램 D의 첫 번째 소개 문단이 들어갑니다."],
      ["여기에 프로그램 D의 두 번째 소개 문단이 들어갑니다."],
    ],
    status: "신청 중",
    courses: [],
  },
];

// 캐노니컬 데모 게시물 1~5(비자료실). 어드민 시드(seed-demo-content.mjs)와 동일한 세계를
// 정적 폴백으로 재현합니다. 6·7번(자료실)은 아래 resources 배열로 노출합니다.
const demoNoticeBody = [
  "예시 게시물 본문입니다. 실제 콘텐츠는 관리자에서 작성합니다.",
];

export const notices = [
  {
    id: 101,
    title: "예시 공지사항입니다",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:30",
    updatedAt: "-",
    official: true,
    body: demoNoticeBody,
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 102,
    // GENERAL + 프로그램 라벨 → 홈에서 "프로그램 공지" 섹션에 노출됩니다.
    title: "예시 프로그램 공지입니다",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:20",
    updatedAt: "-",
    official: true,
    body: demoNoticeBody,
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 103,
    title: "예시 안내 게시물입니다",
    category: "안내" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:10",
    updatedAt: "-",
    official: true,
    body: demoNoticeBody,
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 104,
    title: "예시 자유게시판 글입니다",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.04.26 17:00",
    updatedAt: "-",
    official: false,
    body: demoNoticeBody,
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 105,
    // 후기: 운영자 1 + GREEN_BOARD + 프로그램C 라벨 → 후기/리뷰 탭에 노출됩니다.
    title: "예시 후기 게시물입니다",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.04.26 16:50",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: demoNoticeBody,
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    // 캐노니컬 자료실 게시물 6·7. 운영 어드민에서는 RESOURCE 게시물도 notices 스트림으로
    // 내려오므로, 워크숍 상세 페이지의 "자료실" 탭이 폴백에서도 동일하게 채워지도록 여기에 둡니다.
    id: 106,
    title: "예시 프로그램 A 자료입니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 16:40",
    updatedAt: "-",
    official: true,
    body: demoNoticeBody,
    relatedLinks: [{ title: "예시 자료 링크", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 107,
    title: "예시 프로그램 C 자료입니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 16:30",
    updatedAt: "-",
    official: true,
    body: demoNoticeBody,
    relatedLinks: [{ title: "예시 자료 링크", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
];

// 캐노니컬 자료실 게시물 6·7(RESOURCE + 프로그램 라벨). 어드민 시드와 동일 세계.
export const resources = [
  {
    id: 201,
    workshop: "program-a" as WorkshopSlug,
    session: "제1회 프로그램 A",
    title: "예시 프로그램 A 자료입니다",
    description: "예시 게시물 본문입니다. 실제 콘텐츠는 관리자에서 작성합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.04.26 17:32",
    updatedAt: "-",
  },
  {
    id: 202,
    workshop: "program-c" as WorkshopSlug,
    session: "제1회 프로그램 C",
    title: "예시 프로그램 C 자료입니다",
    description: "예시 게시물 본문입니다. 실제 콘텐츠는 관리자에서 작성합니다.",
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
  day: number;
  startHour: number;
  endHour: number;
};

const fallbackGeneralScheduleSpecs: FallbackGeneralScheduleSpec[] = [
  { id: "general-1", title: "예시 기본 일정입니다", day: 14, startHour: 10, endHour: 12 },
  { id: "general-2", title: "예시 휴무 안내 일정입니다", day: 3, startHour: 10, endHour: 18 },
  { id: "general-3", title: "예시 내부 세미나 일정입니다", day: 8, startHour: 14, endHour: 17 },
  { id: "general-4", title: "예시 정기 모임 일정입니다", day: 22, startHour: 19, endHour: 21 },
  { id: "general-5", title: "예시 특별 행사 일정입니다", day: 40, startHour: 10, endHour: 16 },
];

// PublicGeneralSchedule[] 형태로 반환합니다.
export function buildFallbackGeneralSchedules() {
  const nowIso = new Date().toISOString();
  return fallbackGeneralScheduleSpecs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    description: "예시 일정 설명입니다. 실제 일정은 관리자에서 등록합니다.",
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
  stages: FallbackStageSpec[];
};

const fallbackWorkshopRunSpecs: FallbackRunSpec[] = [
  {
    workshopSlug: "program-a",
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
    description: "예시 프로그램 런 설명입니다.",
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
