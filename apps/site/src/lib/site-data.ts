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
  // 오시는 길 주소. 이 한 줄만 바꾸면 아래 지도/길찾기 링크가 모두 그 주소를 가리킵니다.
  address: "서울특별시 동대문구 서울시립대로 160 3층",
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
    status: "신청 중",
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

// 캐노니컬 데모 게시물. 어드민 시드(seed-demo-content.mjs)의 demoPosts와 "완전히 동일한"
// 세계를 정적 폴백으로 재현합니다. 각 게시물의 문단(body[])은 시드의 <p>…</p> HTML과
// 문안이 100% 일치하며, 순서·제목·카테고리·라벨·작성자·후기 여부까지 1:1 대응합니다.
// 자료실(RESOURCE) 게시물은 relatedLinks(https://example.com/resource)를 포함하고,
// 아래 resources 배열에도 같은 내용으로 노출됩니다.
//
// 카테고리 매핑: 전체 공지=GENERAL · 안내=COUNSELING · 자유게시판=GREEN_BOARD · 자료실=RESOURCE.
// 후기 게시물은 운영자 1 + 자유게시판(GREEN_BOARD) + 프로그램 라벨 + isWorkshopReview.

export const notices = [
  {
    id: 101,
    title: "2026년 상반기 상담·검사 운영 시간 안내",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.01.06 17:30",
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
    title: "프로그램 A 봄 기수 수강생을 모집합니다",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.02.03 10:00",
    updatedAt: "-",
    official: true,
    body: [
      "심리평가 실무의 기초를 처음부터 다지고자 하는 분들을 위한 프로그램 A 봄 기수 수강생을 모집합니다.",
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
    createdAt: "2026.01.12 14:00",
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
    title: "심리검사는 어떻게 받게 되나요",
    category: "안내" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.02.18 11:00",
    updatedAt: "-",
    official: true,
    body: [
      "심리검사는 사전 상담에서 어떤 부분을 살펴보면 좋을지 함께 정하는 것으로 시작합니다.",
      "검사 당일에는 편안한 상태에서 여러 문항과 과제에 응답하시게 됩니다.",
      "결과는 별도의 해석 상담을 통해 이해하기 쉽게 설명해 드립니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 105,
    title: "프로그램 B 단기 특강 안내",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램B"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.06.01 09:30",
    updatedAt: "-",
    official: true,
    body: [
      "핵심 주제를 하루 동안 짧고 깊게 다루는 프로그램 B 단기 특강을 엽니다.",
      "실무 중에 자주 마주치는 상황을 사례 중심으로 함께 정리합니다.",
      "신청 기간과 준비물은 프로그램 안내 페이지를 참고해 주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 106,
    title: "프로그램 C 단계별 과정 참여 안내",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.04.02 10:00",
    updatedAt: "-",
    official: true,
    body: [
      "이론과 사례 실습을 여러 단계에 걸쳐 쌓아가는 프로그램 C 참여자를 모집합니다.",
      "각 단계는 앞 단계의 내용을 전제로 하므로 순서대로 이수하시길 권합니다.",
      "단계별 일정은 캘린더에서 미리 확인하실 수 있습니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 107,
    title: "프로그램 D 고급 과정 소수 정원 모집",
    category: "전체 공지" as NoticeCategory,
    labels: ["프로그램D"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.05.11 10:00",
    updatedAt: "-",
    official: true,
    body: [
      "실무 경험이 있는 분들이 자신의 사례를 가지고 와 함께 검토하는 프로그램 D를 엽니다.",
      "깊이 있는 논의를 위해 소수 정원으로만 진행합니다.",
      "참여를 원하시면 신청 기간 안에 미리 문의해 주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 108,
    title: "여름 정기 휴무 기간을 안내드립니다",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.07.20 15:00",
    updatedAt: "-",
    official: true,
    body: [
      "8월 초 정기 휴무 기간에는 상담과 문의 응대가 잠시 중단됩니다.",
      "휴무 전후로 예약이 몰릴 수 있으니 일정을 여유 있게 잡아 주시기 바랍니다.",
      "급한 문의는 휴무 종료 후 순차적으로 답변드리겠습니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 109,
    title: "연말 상담 예약 마감 및 새해 일정 안내",
    category: "전체 공지" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.12.05 16:00",
    updatedAt: "-",
    official: true,
    body: [
      "연말에는 상담 예약이 조기에 마감될 수 있어 미리 안내드립니다.",
      "새해 첫 주 일정은 12월 마지막 주에 캘린더에 반영됩니다.",
      "한 해 동안 연구소를 찾아 주셔서 감사합니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 110,
    title: "월례 공개 사례 세미나에 참여해 보세요",
    category: "안내" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.05.02 13:00",
    updatedAt: "-",
    official: true,
    body: [
      "매달 한 차례 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나를 엽니다.",
      "전공생과 초심 실무자 모두 편하게 참여하실 수 있습니다.",
      "일정은 캘린더의 전체 일정에서 확인해 주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 111,
    title: "상담 예약을 변경하거나 취소하려면",
    category: "안내" as NoticeCategory,
    labels: ["상담"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.03.09 11:30",
    updatedAt: "-",
    official: true,
    body: [
      "예약 변경이나 취소는 상담 예정일 하루 전까지 문의 양식으로 알려 주시면 됩니다.",
      "당일 취소가 반복되면 다음 예약이 어려워질 수 있으니 양해 부탁드립니다.",
      "부득이한 사정이 있으실 때는 편하게 사정을 알려 주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 112,
    title: "연구소 서가에 새 책들을 들였습니다",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.02.10 17:00",
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
    id: 113,
    title: "저녁 심리학 독서모임 첫 책을 골랐습니다",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.10.02 19:00",
    updatedAt: "-",
    official: false,
    body: [
      "가을 저녁 독서모임에서 함께 읽을 첫 책을 골랐습니다.",
      "부담 없이 한 챕터씩 읽고 모여 이야기를 나눌 예정입니다.",
      "책을 아직 구하지 못하셨어도 편하게 오셔서 함께하세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 114,
    title: "상담실 한편에 작은 화분을 두었어요",
    category: "자유게시판" as NoticeCategory,
    labels: [] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.06.15 12:00",
    updatedAt: "-",
    official: false,
    body: [
      "상담실 창가에 작은 화분 몇 개를 두었습니다.",
      "기다리시는 동안 초록을 보며 잠시 숨을 고르실 수 있으면 좋겠습니다.",
      "물 주는 걸 도와주고 싶으신 분은 살짝 알려 주세요.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 115,
    // 후기: 운영자가 외부에 공유된 수강 후기를 모아 옮겨 오는 카테고리입니다.
    // 운영자 1 + GREEN_BOARD + 프로그램C 라벨 → 후기/리뷰 탭에 노출됩니다.
    title: "\"사례를 보는 눈이 트였습니다\" · 프로그램 C 수강 후기",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.08.01 16:50",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: [
      "프로그램 C를 수강하신 분이 개인 블로그에 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.",
      "\"매주 다른 사례를 함께 뜯어보며 제 시야가 얼마나 좁았는지 알게 됐습니다. 혼자 공부할 때 놓쳤던 부분을 동료들의 질문으로 채울 수 있었어요.\"",
      "이렇게 외부에 공유해 주신 수강 후기를 한곳에 모아 소개합니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 116,
    title: "\"입문의 문턱이 낮았어요\" · 프로그램 A 수강 후기",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.04.05 15:20",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: [
      "프로그램 A를 수강하신 분이 외부에 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.",
      "\"처음이라 걱정이 많았는데, 기초 개념부터 천천히 짚어 주셔서 따라갈 수 있었어요. 실습으로 바로 적용해 보는 구성이 좋았습니다.\"",
      "입문 과정을 고민하시는 분들께 참고가 되길 바라며 소개합니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 117,
    title: "\"짧지만 알찼습니다\" · 프로그램 B 수강 후기",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램B"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.07.10 15:20",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: [
      "프로그램 B 단기 특강을 수강하신 분이 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.",
      "\"하루 과정이라 큰 기대가 없었는데, 핵심만 짚어 주셔서 오히려 집중이 잘됐어요. 현장에서 바로 써먹을 지점이 분명했습니다.\"",
      "바쁜 일정 속에서 특강을 고민하시는 분들께 소개합니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 118,
    title: "\"내 사례를 함께 봐 주셨어요\" · 프로그램 D 수강 후기",
    category: "자유게시판" as NoticeCategory,
    labels: ["프로그램D"] as NoticeLabel[],
    author: "운영자 1",
    createdAt: "2026.11.20 15:20",
    updatedAt: "-",
    official: false,
    isWorkshopReview: true,
    body: [
      "프로그램 D를 수강하신 분이 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.",
      "\"제가 오래 붙들고 있던 사례를 꺼내 놓고 함께 논의하면서, 놓치고 있던 시각을 여러 개 얻었습니다. 소수라서 더 깊게 다룰 수 있었어요.\"",
      "고급 과정을 고민하시는 실무자분들께 참고가 되길 바랍니다.",
    ],
    relatedLinks: [] as Array<{ title: string; url: string }>,
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 119,
    title: "프로그램 A 1회차 참고자료를 공유합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램A"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.03.15 18:00",
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
    id: 120,
    title: "프로그램 B 특강 슬라이드를 공유합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램B"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.07.05 18:00",
    updatedAt: "-",
    official: true,
    body: [
      "프로그램 B 단기 특강에서 사용한 슬라이드를 공유합니다.",
      "당일 다룬 사례 요약과 참고 도서 목록이 함께 담겨 있습니다.",
      "필요하신 분은 아래 링크에서 내려받으세요.",
    ],
    relatedLinks: [{ title: "특강 슬라이드 (PDF)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 121,
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램C"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.05.10 18:00",
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
  {
    id: 122,
    title: "프로그램 D 슈퍼비전 기록 양식을 배포합니다",
    category: "자료실" as NoticeCategory,
    labels: ["프로그램D"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.06.14 18:00",
    updatedAt: "-",
    official: true,
    body: [
      "프로그램 D에서 사용하는 슈퍼비전 기록 양식을 배포합니다.",
      "각 회기에서 논의한 내용을 이 양식에 정리해 두면 다음 단계에서 참고하기 좋습니다.",
      "작성 방법이 궁금하시면 담당 운영자에게 문의해 주세요.",
    ],
    relatedLinks: [{ title: "슈퍼비전 기록 양식 (문서)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 123,
    title: "심리검사 결과지 읽는 법 안내 자료",
    category: "자료실" as NoticeCategory,
    labels: ["자료실"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.02.20 18:00",
    updatedAt: "-",
    official: true,
    body: [
      "심리검사 결과지를 이해하는 데 도움이 되는 안내 자료를 공유합니다.",
      "검사 종류별로 결과가 어떻게 표시되는지 예시와 함께 정리했습니다.",
      "해석 상담 전에 미리 읽어 두시면 이야기 나누기가 한결 수월합니다.",
    ],
    relatedLinks: [{ title: "결과지 안내 자료 (PDF)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
  {
    id: 124,
    title: "상담 준비 체크리스트를 공유합니다",
    category: "자료실" as NoticeCategory,
    labels: ["상담"] as NoticeLabel[],
    author: "관리자",
    createdAt: "2026.03.02 18:00",
    updatedAt: "-",
    official: true,
    body: [
      "첫 상담을 앞두고 준비하면 좋은 것들을 간단한 체크리스트로 정리했습니다.",
      "무엇을 이야기하고 싶은지 미리 떠올려 보시면 상담이 한결 편해집니다.",
      "부담 갖지 마시고 참고 자료로만 활용해 주세요.",
    ],
    relatedLinks: [{ title: "상담 준비 체크리스트 (문서)", url: "https://example.com/resource" }],
    attachments: [] as Array<{ title: string; url: string }>,
  },
];

// 캐노니컬 자료실 게시물(RESOURCE + 프로그램/자료실/상담 라벨). 어드민 시드와 동일 세계.
// notices의 자료실 항목과 제목·설명·순서가 1:1로 대응합니다.
export const resources = [
  {
    id: 201,
    workshop: "program-a" as WorkshopSlug,
    session: "제1회 프로그램 A",
    title: "프로그램 A 1회차 참고자료를 공유합니다",
    description: "프로그램 A 1회차에서 다룬 기본 개념 정리 자료를 공유합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.03.15 18:00",
    updatedAt: "-",
  },
  {
    id: 202,
    workshop: "program-b" as WorkshopSlug,
    session: "제1회 프로그램 B",
    title: "프로그램 B 특강 슬라이드를 공유합니다",
    description: "프로그램 B 단기 특강에서 사용한 슬라이드를 공유합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.07.05 18:00",
    updatedAt: "-",
  },
  {
    id: 203,
    workshop: "program-c" as WorkshopSlug,
    session: "제1회 프로그램 C",
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    description: "프로그램 C에서 사용하는 사례 정리 양식을 배포합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.05.10 18:00",
    updatedAt: "-",
  },
  {
    id: 204,
    workshop: "program-d" as WorkshopSlug,
    session: "제1회 프로그램 D",
    title: "프로그램 D 슈퍼비전 기록 양식을 배포합니다",
    description: "프로그램 D에서 사용하는 슈퍼비전 기록 양식을 배포합니다.",
    url: "https://example.com/resource",
    author: "관리자",
    createdAt: "2026.06.14 18:00",
    updatedAt: "-",
  },
];

export const researchSurveyHref = "https://github.com/mow-coding/basic-website-cms";

// ---------------------------------------------------------------------------
// 정적 폴백 캘린더 데이터 (SITE_ADMIN_API_URL 미설정 시 사용)
//
// 어드민 시드(seed-demo-content.mjs)와 "완전히 동일한" 캐노니컬 일정/런을 재현합니다.
// 날짜는 상대 오프셋이 아니라 2026~2030 고정 연·월·일이므로, 몇 년 뒤 어느 달을 방문해도
// 캘린더에 일정이 보입니다. 두 파일은 아래 DEMO_YEARS 범위와 동일한 "템플릿 상수"
// (GENERAL_SCHEDULE_TEMPLATES / WORKSHOP_RUN_TEMPLATES)를 공유하며, 각자 같은 루프로
// 같은 고정 날짜를 생성합니다. 상수가 같으면 출력이 같습니다.
// 아래 두 빌더는 public-site-content.ts의 getFallbackContent에서
// PublicGeneralSchedule / PublicWorkshopRun 형태로 사용됩니다.
// 서울(UTC+9, DST 없음) 벽시계 기준으로 인스턴트를 계산합니다.

const SEOUL_UTC_OFFSET_MINUTES = 9 * 60;

// 캘린더를 조밀하게 채울 고정 연도 범위. 시드(seed-demo-content.mjs)와 반드시 동일해야 합니다.
export const DEMO_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

// (연, 월, 일, 시, 분) 서울 벽시계 시각에 해당하는 UTC 인스턴트를 만듭니다.
// UTC = 서울시각 - 9h.
function seoulFixedIso(year: number, month: number, day: number, hour = 0, minute = 0) {
  const utcMillis =
    Date.UTC(year, month - 1, day, hour, minute, 0, 0) - SEOUL_UTC_OFFSET_MINUTES * 60000;
  return new Date(utcMillis).toISOString();
}

// ---------------------------------------------------------------------------
// 일반 일정 템플릿: 매년 반복되는 6개의 계절 이벤트. 여러 달에 분산됩니다.
// (2월 오리엔테이션 · 4월 봄 공개특강 · 5월 사례 세미나 · 8월 여름 휴무 ·
//  10월 저녁 독서모임 · 12월 연말 결산)
type GeneralScheduleTemplate = {
  key: string;
  title: string;
  description: string;
  month: number;
  day: number;
  startHour: number;
  endHour: number;
};

export const GENERAL_SCHEDULE_TEMPLATES: GeneralScheduleTemplate[] = [
  {
    key: "new-year",
    title: "새해 상담 일정 안내",
    description: "새해 첫 상담 일정과 한 해 프로그램 계획을 함께 안내하는 자리입니다.",
    month: 1,
    day: 8,
    startHour: 10,
    endHour: 12,
  },
  {
    key: "orientation",
    title: "신규 상담사 오리엔테이션",
    description: "새로 합류한 상담사들이 연구소의 운영 방식과 사례 기록 원칙을 익히는 오리엔테이션입니다.",
    month: 2,
    day: 5,
    startHour: 10,
    endHour: 13,
  },
  {
    key: "spring-lecture",
    title: "봄 마음건강 공개 특강",
    description: "일반인을 위한 마음건강 주제의 공개 특강입니다. 사전 신청을 받습니다.",
    month: 4,
    day: 18,
    startHour: 14,
    endHour: 16,
  },
  {
    key: "case-seminar",
    title: "월례 공개 사례 세미나",
    description: "매달 한 차례, 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나입니다.",
    month: 5,
    day: 16,
    startHour: 10,
    endHour: 12,
  },
  {
    key: "summer-closure",
    title: "여름 정기 휴무 안내",
    description: "연구소 정기 휴무일입니다. 이날은 상담과 문의 응대가 어렵습니다.",
    month: 8,
    day: 3,
    startHour: 10,
    endHour: 18,
  },
  {
    key: "reading-club",
    title: "저녁 심리학 독서모임",
    description: "심리학 책 한 권을 함께 읽고 이야기 나누는 저녁 모임입니다.",
    month: 10,
    day: 22,
    startHour: 19,
    endHour: 21,
  },
  {
    key: "year-end",
    title: "연말 결산 모임",
    description: "한 해 동안의 상담과 교육을 함께 돌아보고 다음 해 계획을 나누는 내부 결산 모임입니다.",
    month: 12,
    day: 12,
    startHour: 14,
    endHour: 17,
  },
];

// PublicGeneralSchedule[] 형태로 반환합니다. DEMO_YEARS × 템플릿을 고정 날짜로 펼칩니다.
export function buildFallbackGeneralSchedules() {
  const nowIso = new Date().toISOString();
  const schedules: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    endsAt: string;
    createdAt: string;
    updatedAt: string;
  }> = [];

  for (const year of DEMO_YEARS) {
    for (const template of GENERAL_SCHEDULE_TEMPLATES) {
      schedules.push({
        id: `general-${year}-${template.key}`,
        title: `${year} ${template.title}`,
        description: template.description,
        date: seoulFixedIso(year, template.month, template.day, template.startHour, 0),
        endsAt: seoulFixedIso(year, template.month, template.day, template.endHour, 0),
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }

  return schedules;
}

// ---------------------------------------------------------------------------
// 프로그램 런 템플릿: (workshopSlug, runNumber)마다 신청 월/일과 단계별 세션 월/일·시간을
// 고정합니다. DEMO_YEARS의 각 연도에 대해 동일한 월/일로 런을 생성합니다.
// runNumber는 (workshopSlug, year) 안에서 1부터 부여되며, seed의
// @@unique(workshopSlug, year, runNumber)와 충돌하지 않습니다.
type WorkshopSessionTemplate = { month: number; day: number; startTime: string; endTime: string };
type WorkshopStageTemplate = {
  stageName: string;
  orderIndex: number;
  applicationStart: { month: number; day: number };
  applicationEnd: { month: number; day: number };
  sessions: WorkshopSessionTemplate[];
};
type WorkshopRunTemplate = {
  workshopSlug: WorkshopSlug;
  runNumber: number;
  description: string;
  stages: WorkshopStageTemplate[];
};

export const WORKSHOP_RUN_TEMPLATES: WorkshopRunTemplate[] = [
  // 프로그램 A(입문): 봄(1기)·가을(2기) 각 1단계 2세션.
  {
    workshopSlug: "program-a",
    runNumber: 1,
    description: "<p>실무의 기초를 처음부터 다지는 입문 과정입니다. 봄 기수입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStart: { month: 2, day: 10 },
        applicationEnd: { month: 3, day: 6 },
        sessions: [
          { month: 3, day: 14, startTime: "10:00", endTime: "13:00" },
          { month: 3, day: 21, startTime: "10:00", endTime: "13:00" },
        ],
      },
    ],
  },
  {
    workshopSlug: "program-a",
    runNumber: 2,
    description: "<p>실무의 기초를 처음부터 다지는 입문 과정입니다. 가을 기수입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStart: { month: 8, day: 11 },
        applicationEnd: { month: 9, day: 4 },
        sessions: [
          { month: 9, day: 12, startTime: "10:00", endTime: "13:00" },
          { month: 9, day: 19, startTime: "10:00", endTime: "13:00" },
        ],
      },
    ],
  },
  // 프로그램 B(단기 특강): 1기, 1단계 1세션.
  {
    workshopSlug: "program-b",
    runNumber: 1,
    description: "<p>핵심만 짧게 집중해서 다루는 단기 특강 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStart: { month: 6, day: 8 },
        applicationEnd: { month: 6, day: 28 },
        sessions: [{ month: 7, day: 4, startTime: "10:00", endTime: "17:00" }],
      },
    ],
  },
  // 프로그램 C(단계별): 1기, 2단계 다세션(5월·7월).
  {
    workshopSlug: "program-c",
    runNumber: 1,
    description: "<p>여러 단계에 걸쳐 이론과 사례 실습을 함께 쌓아가는 단계별 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStart: { month: 4, day: 6 },
        applicationEnd: { month: 4, day: 26 },
        sessions: [
          { month: 5, day: 9, startTime: "10:00", endTime: "13:00" },
          { month: 5, day: 23, startTime: "10:00", endTime: "13:00" },
        ],
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStart: { month: 6, day: 8 },
        applicationEnd: { month: 6, day: 27 },
        sessions: [
          { month: 7, day: 11, startTime: "10:00", endTime: "13:00" },
          { month: 7, day: 25, startTime: "10:00", endTime: "13:00" },
        ],
      },
    ],
  },
  // 프로그램 D(고급): 1기, 3단계(6월·9월·11월).
  {
    workshopSlug: "program-d",
    runNumber: 1,
    description: "<p>실제 사례를 깊이 있게 검토하는 고급 심화 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStart: { month: 5, day: 12 },
        applicationEnd: { month: 6, day: 1 },
        sessions: [
          { month: 6, day: 13, startTime: "14:00", endTime: "17:00" },
          { month: 6, day: 14, startTime: "14:00", endTime: "17:00" },
        ],
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStart: { month: 8, day: 18 },
        applicationEnd: { month: 9, day: 7 },
        sessions: [{ month: 9, day: 20, startTime: "14:00", endTime: "17:00" }],
      },
      {
        stageName: "3단계",
        orderIndex: 2,
        applicationStart: { month: 10, day: 20 },
        applicationEnd: { month: 11, day: 9 },
        sessions: [{ month: 11, day: 15, startTime: "14:00", endTime: "17:00" }],
      },
    ],
  },
];

// PublicWorkshopRun[] 형태로 반환합니다. runLabel은 캘린더가 규칙대로 생성하도록 비웁니다.
// DEMO_YEARS × 템플릿을 고정 날짜로 펼칩니다.
export function buildFallbackWorkshopRuns() {
  const nowIso = new Date().toISOString();
  const runs: ReturnType<typeof buildOneFallbackRun>[] = [];

  for (const year of DEMO_YEARS) {
    for (const template of WORKSHOP_RUN_TEMPLATES) {
      runs.push(buildOneFallbackRun(template, year, nowIso));
    }
  }

  return runs;
}

function buildOneFallbackRun(template: WorkshopRunTemplate, year: number, nowIso: string) {
  return {
    id: `${template.workshopSlug}-${year}-run-${template.runNumber}`,
    workshopSlug: template.workshopSlug,
    year,
    runNumber: template.runNumber,
    runLabel: "",
    applicationFormUrl: "https://example.com",
    description: template.description,
    noticePost: null,
    stages: template.stages.map((stage, stageIndex) => ({
      id: `${template.workshopSlug}-${year}-r${template.runNumber}-stage-${stageIndex}`,
      stageName: stage.stageName,
      orderIndex: stage.orderIndex,
      applicationStartsAt: seoulFixedIso(year, stage.applicationStart.month, stage.applicationStart.day, 9, 0),
      applicationEndsAt: seoulFixedIso(year, stage.applicationEnd.month, stage.applicationEnd.day, 18, 0),
      applicationFormUrl: "https://example.com",
      noticePostId: null,
      noticePost: null,
      sessions: stage.sessions.map((session, sessionIndex) => ({
        id: `${template.workshopSlug}-${year}-r${template.runNumber}-stage-${stageIndex}-session-${sessionIndex}`,
        dayIndex: sessionIndex,
        // 서울 자정 인스턴트. 벽시계 시각은 startTime/endTime 오프셋으로 더해집니다.
        sessionDate: seoulFixedIso(year, session.month, session.day, 0, 0),
        startTime: session.startTime,
        endTime: session.endTime,
        applicationFormUrl: "https://example.com",
        noticePostId: null,
        noticePost: null,
      })),
    })),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
