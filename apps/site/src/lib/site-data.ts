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
    status: "등록된 일정 없음",
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
    status: "등록된 일정 없음",
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
    status: "등록된 일정 없음",
    courses: [],
  },
];

export const notices = [
  {
    id: 101,
    title: "모오 임상심리연구소 새 웹사이트 준비 안내",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:30",
    updatedAt: "-",
    official: true,
    body: [
      "모오 임상심리연구소의 새 웹사이트를 준비하고 있습니다",
      "새 웹사이트에서는 연구소 소개, 워크숍 일정, 공지사항, 심리상담 안내, 자료실을 한곳에서 확인할 수 있도록 구성합니다",
      "현재 공개되어 있는 내용은 준비 중인 화면이며, 실제 워크숍 신청 링크와 공지사항은 관리자 확인 후 순차적으로 반영됩니다",
    ],
    relatedLinks: [
      {
        title: "연구소 문의 양식",
        url: inquiryLinks.institute,
      },
    ],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 102,
    title: "프로그램 A 워크숍 자료실 준비 중",
    category: "프로그램 공지" as NoticeCategory,
    labels: ["프로그램A", "자료실"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:20",
    updatedAt: "-",
    official: true,
    body: [
      "프로그램 A 워크숍 관련 공개 자료실을 준비하고 있습니다",
      "워크숍에서 사용된 공개 가능 문서와 참고 링크는 회차별로 묶어 자료실에 정리할 예정입니다",
    ],
    relatedLinks: [
      {
        title: "프로그램 A 페이지",
        url: "/nested/program-a",
      },
      ],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 103,
    title: "심리상담 문의는 전용 양식을 이용해 주세요",
    category: "안내" as NoticeCategory,
    labels: ["상담"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:10",
    updatedAt: "-",
    official: true,
    body: [
      "심리상담과 심리평가에 관해 궁금한 점이 있으시면 전용 문의 양식을 이용해 주세요",
      "상담 관련 문의는 개인정보가 포함될 수 있으므로 공개 게시판 댓글 대신 별도 양식으로 접수합니다",
    ],
    relatedLinks: [
      {
        title: "심리상담 문의 양식",
        url: inquiryLinks.counseling,
      },
    ],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 104,
    title: "자유게시판은 공지보다 조금 느슨한 글을 담습니다",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.26 17:00",
    updatedAt: "-",
    official: false,
    body: [
      "자유게시판은 공식 공지보다 조금 더 느슨한 글을 담는 공간입니다",
      "연구소 관리자들이 남기고 싶은 생각, 안내, 기록을 필요에 따라 정리합니다",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
];

export const resources = [
  {
    id: 201,
    workshop: "program-a" as WorkshopSlug,
    session: "제1회 프로그램 A",
    title: "실습용 프롬프트 모음",
    description: "워크숍 실습 흐름을 다시 확인할 수 있는 공개 공유 문서입니다",
    url: "https://docs.google.com/",
    author: "관리자",
    createdAt: "2026.04.26 17:30",
    updatedAt: "-",
  },
  {
    id: 202,
    workshop: "program-a" as WorkshopSlug,
    session: "제2회 프로그램 A",
    title: "참고 문서 목록",
    description: "",
    url: "https://docs.google.com/",
    author: "관리자",
    createdAt: "2026.04.26 17:31",
    updatedAt: "-",
  },
  {
    id: 203,
    workshop: "program-c" as WorkshopSlug,
    session: "프로그램 C 단계별 워크숍 - 세부 과정",
    title: "세부 과정 참고자료",
    description: "프로그램 C 세부 과정 관련 공개 자료 링크입니다",
    url: "https://docs.google.com/",
    author: "관리자",
    createdAt: "2026.04.26 17:32",
    updatedAt: "-",
  },
  {
    id: 204,
    workshop: "program-d" as WorkshopSlug,
    session: "프로그램 D 단계별 워크숍 - 세부 과정",
    title: "세부 과정 안내 자료",
    description: "",
    url: "https://docs.google.com/",
    author: "관리자",
    createdAt: "2026.04.26 17:33",
    updatedAt: "-",
  },
];

export const researchSurveyHref = "https://github.com/mow-coding/basic-website-cms";
