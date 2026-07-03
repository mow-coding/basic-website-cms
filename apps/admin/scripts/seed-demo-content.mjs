import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@example.com";
const editorOneEmail = "editor-one@example.com";

// 게시물별 고유 본문. 사이트 정적 폴백(site-data.ts)의 notices 배열과 "완전히 동일한"
// 세계를 재현합니다. 순서·제목·카테고리·라벨·작성자·본문 문안이 1:1로 대응합니다.
// (site-data 카테고리 매핑: 전체 공지=GENERAL · 안내=COUNSELING · 자유게시판=GREEN_BOARD ·
//  자료실=RESOURCE. site-data body[] 각 문단 = 여기 <p>…</p> 한 개.)
const demoPosts = [
  {
    title: "2026년 상반기 상담·검사 운영 시간 안내",
    category: "GENERAL",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>3월부터 상담과 심리검사 예약 가능 시간이 일부 조정됩니다.</p>" +
      "<p>평일은 오전 10시부터 오후 7시까지, 토요일은 오후 2시까지 운영합니다.</p>" +
      "<p>예약과 문의는 홈페이지 문의 양식을 이용해 주시기 바랍니다.</p>"
  },
  {
    title: "프로그램 A 봄 기수 수강생을 모집합니다",
    category: "GENERAL",
    labels: ["프로그램A"],
    authorEmail: adminEmail,
    body:
      "<p>심리평가 실무의 기초를 처음부터 다지고자 하는 분들을 위한 프로그램 A 봄 기수 수강생을 모집합니다.</p>" +
      "<p>정원은 20명이며 신청은 선착순으로 마감됩니다.</p>" +
      "<p>자세한 일정과 신청 방법은 프로그램 안내 페이지에서 확인하실 수 있습니다.</p>"
  },
  {
    title: "심리상담은 이렇게 진행됩니다",
    category: "COUNSELING",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>첫 상담에서는 지금 겪고 계신 어려움과 상담을 통해 바라는 변화를 함께 이야기합니다.</p>" +
      "<p>이후 상담자와 협의하여 상담의 방향과 횟수를 정합니다.</p>" +
      "<p>상담에서 나눈 내용은 철저히 비밀이 보장됩니다.</p>"
  },
  {
    title: "심리검사는 어떻게 받게 되나요",
    category: "COUNSELING",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>심리검사는 사전 상담에서 어떤 부분을 살펴보면 좋을지 함께 정하는 것으로 시작합니다.</p>" +
      "<p>검사 당일에는 편안한 상태에서 여러 문항과 과제에 응답하시게 됩니다.</p>" +
      "<p>결과는 별도의 해석 상담을 통해 이해하기 쉽게 설명해 드립니다.</p>"
  },
  {
    title: "프로그램 B 단기 특강 안내",
    category: "GENERAL",
    labels: ["프로그램B"],
    authorEmail: adminEmail,
    body:
      "<p>핵심 주제를 하루 동안 짧고 깊게 다루는 프로그램 B 단기 특강을 엽니다.</p>" +
      "<p>실무 중에 자주 마주치는 상황을 사례 중심으로 함께 정리합니다.</p>" +
      "<p>신청 기간과 준비물은 프로그램 안내 페이지를 참고해 주세요.</p>"
  },
  {
    title: "프로그램 C 단계별 과정 참여 안내",
    category: "GENERAL",
    labels: ["프로그램C"],
    authorEmail: adminEmail,
    body:
      "<p>이론과 사례 실습을 여러 단계에 걸쳐 쌓아가는 프로그램 C 참여자를 모집합니다.</p>" +
      "<p>각 단계는 앞 단계의 내용을 전제로 하므로 순서대로 이수하시길 권합니다.</p>" +
      "<p>단계별 일정은 캘린더에서 미리 확인하실 수 있습니다.</p>"
  },
  {
    title: "프로그램 D 고급 과정 소수 정원 모집",
    category: "GENERAL",
    labels: ["프로그램D"],
    authorEmail: adminEmail,
    body:
      "<p>실무 경험이 있는 분들이 자신의 사례를 가지고 와 함께 검토하는 프로그램 D를 엽니다.</p>" +
      "<p>깊이 있는 논의를 위해 소수 정원으로만 진행합니다.</p>" +
      "<p>참여를 원하시면 신청 기간 안에 미리 문의해 주세요.</p>"
  },
  {
    title: "여름 정기 휴무 기간을 안내드립니다",
    category: "GENERAL",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>8월 초 정기 휴무 기간에는 상담과 문의 응대가 잠시 중단됩니다.</p>" +
      "<p>휴무 전후로 예약이 몰릴 수 있으니 일정을 여유 있게 잡아 주시기 바랍니다.</p>" +
      "<p>급한 문의는 휴무 종료 후 순차적으로 답변드리겠습니다.</p>"
  },
  {
    title: "연말 상담 예약 마감 및 새해 일정 안내",
    category: "GENERAL",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>연말에는 상담 예약이 조기에 마감될 수 있어 미리 안내드립니다.</p>" +
      "<p>새해 첫 주 일정은 12월 마지막 주에 캘린더에 반영됩니다.</p>" +
      "<p>한 해 동안 연구소를 찾아 주셔서 감사합니다.</p>"
  },
  {
    title: "월례 공개 사례 세미나에 참여해 보세요",
    category: "COUNSELING",
    labels: [],
    authorEmail: adminEmail,
    body:
      "<p>매달 한 차례 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나를 엽니다.</p>" +
      "<p>전공생과 초심 실무자 모두 편하게 참여하실 수 있습니다.</p>" +
      "<p>일정은 캘린더의 전체 일정에서 확인해 주세요.</p>"
  },
  {
    title: "상담 예약을 변경하거나 취소하려면",
    category: "COUNSELING",
    labels: ["상담"],
    authorEmail: adminEmail,
    body:
      "<p>예약 변경이나 취소는 상담 예정일 하루 전까지 문의 양식으로 알려 주시면 됩니다.</p>" +
      "<p>당일 취소가 반복되면 다음 예약이 어려워질 수 있으니 양해 부탁드립니다.</p>" +
      "<p>부득이한 사정이 있으실 때는 편하게 사정을 알려 주세요.</p>"
  },
  {
    title: "연구소 서가에 새 책들을 들였습니다",
    category: "GREEN_BOARD",
    labels: [],
    authorEmail: editorOneEmail,
    body:
      "<p>이번 달에는 감정 조절과 애착을 다룬 책 몇 권을 서가에 새로 두었습니다.</p>" +
      "<p>상담을 기다리시는 동안 편하게 읽어보실 수 있습니다.</p>" +
      "<p>함께 읽고 싶은 책이 있다면 언제든 알려주세요.</p>"
  },
  {
    title: "저녁 심리학 독서모임 첫 책을 골랐습니다",
    category: "GREEN_BOARD",
    labels: [],
    authorEmail: editorOneEmail,
    body:
      "<p>가을 저녁 독서모임에서 함께 읽을 첫 책을 골랐습니다.</p>" +
      "<p>부담 없이 한 챕터씩 읽고 모여 이야기를 나눌 예정입니다.</p>" +
      "<p>책을 아직 구하지 못하셨어도 편하게 오셔서 함께하세요.</p>"
  },
  {
    title: "상담실 한편에 작은 화분을 두었어요",
    category: "GREEN_BOARD",
    labels: [],
    authorEmail: editorOneEmail,
    body:
      "<p>상담실 창가에 작은 화분 몇 개를 두었습니다.</p>" +
      "<p>기다리시는 동안 초록을 보며 잠시 숨을 고르실 수 있으면 좋겠습니다.</p>" +
      "<p>물 주는 걸 도와주고 싶으신 분은 살짝 알려 주세요.</p>"
  },
  {
    // 후기 게시물: 운영자가 외부에 공유된 수강 후기를 모아 옮겨 오는 카테고리입니다.
    // 운영자 1 작성 + GREEN_BOARD + 프로그램 라벨 → 공개 사이트에서 후기로 분류됩니다.
    title: '"사례를 보는 눈이 트였습니다" · 프로그램 C 수강 후기',
    category: "GREEN_BOARD",
    labels: ["프로그램C"],
    authorEmail: editorOneEmail,
    body:
      "<p>프로그램 C를 수강하신 분이 개인 블로그에 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.</p>" +
      "<p>\"매주 다른 사례를 함께 뜯어보며 제 시야가 얼마나 좁았는지 알게 됐습니다. 혼자 공부할 때 놓쳤던 부분을 동료들의 질문으로 채울 수 있었어요.\"</p>" +
      "<p>이렇게 외부에 공유해 주신 수강 후기를 한곳에 모아 소개합니다.</p>"
  },
  {
    title: '"입문의 문턱이 낮았어요" · 프로그램 A 수강 후기',
    category: "GREEN_BOARD",
    labels: ["프로그램A"],
    authorEmail: editorOneEmail,
    body:
      "<p>프로그램 A를 수강하신 분이 외부에 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.</p>" +
      "<p>\"처음이라 걱정이 많았는데, 기초 개념부터 천천히 짚어 주셔서 따라갈 수 있었어요. 실습으로 바로 적용해 보는 구성이 좋았습니다.\"</p>" +
      "<p>입문 과정을 고민하시는 분들께 참고가 되길 바라며 소개합니다.</p>"
  },
  {
    title: '"짧지만 알찼습니다" · 프로그램 B 수강 후기',
    category: "GREEN_BOARD",
    labels: ["프로그램B"],
    authorEmail: editorOneEmail,
    body:
      "<p>프로그램 B 단기 특강을 수강하신 분이 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.</p>" +
      "<p>\"하루 과정이라 큰 기대가 없었는데, 핵심만 짚어 주셔서 오히려 집중이 잘됐어요. 현장에서 바로 써먹을 지점이 분명했습니다.\"</p>" +
      "<p>바쁜 일정 속에서 특강을 고민하시는 분들께 소개합니다.</p>"
  },
  {
    title: '"내 사례를 함께 봐 주셨어요" · 프로그램 D 수강 후기',
    category: "GREEN_BOARD",
    labels: ["프로그램D"],
    authorEmail: editorOneEmail,
    body:
      "<p>프로그램 D를 수강하신 분이 남겨 주신 후기를 동의를 얻어 옮겨 옵니다.</p>" +
      "<p>\"제가 오래 붙들고 있던 사례를 꺼내 놓고 함께 논의하면서, 놓치고 있던 시각을 여러 개 얻었습니다. 소수라서 더 깊게 다룰 수 있었어요.\"</p>" +
      "<p>고급 과정을 고민하시는 실무자분들께 참고가 되길 바랍니다.</p>"
  },
  {
    title: "프로그램 A 1회차 참고자료를 공유합니다",
    category: "RESOURCE",
    labels: ["프로그램A"],
    authorEmail: adminEmail,
    body:
      "<p>프로그램 A 1회차에서 다룬 기본 개념 정리 자료를 공유합니다.</p>" +
      "<p>수강생 여러분은 아래 링크에서 자료를 내려받으실 수 있습니다.</p>" +
      "<p>복습에 참고해 주시기 바랍니다.</p>",
    relatedLinks: [{ title: "1회차 참고자료 (PDF)", url: "https://example.com/resource" }]
  },
  {
    title: "프로그램 B 특강 슬라이드를 공유합니다",
    category: "RESOURCE",
    labels: ["프로그램B"],
    authorEmail: adminEmail,
    body:
      "<p>프로그램 B 단기 특강에서 사용한 슬라이드를 공유합니다.</p>" +
      "<p>당일 다룬 사례 요약과 참고 도서 목록이 함께 담겨 있습니다.</p>" +
      "<p>필요하신 분은 아래 링크에서 내려받으세요.</p>",
    relatedLinks: [{ title: "특강 슬라이드 (PDF)", url: "https://example.com/resource" }]
  },
  {
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    category: "RESOURCE",
    labels: ["프로그램C"],
    authorEmail: adminEmail,
    body:
      "<p>프로그램 C에서 사용하는 사례 정리 양식을 배포합니다.</p>" +
      "<p>다음 시간까지 각자 맡은 사례를 양식에 맞추어 정리해 오시면 됩니다.</p>" +
      "<p>궁금한 점은 담당 운영자에게 문의해 주세요.</p>",
    relatedLinks: [{ title: "사례 정리 양식 (문서)", url: "https://example.com/resource" }]
  },
  {
    title: "프로그램 D 슈퍼비전 기록 양식을 배포합니다",
    category: "RESOURCE",
    labels: ["프로그램D"],
    authorEmail: adminEmail,
    body:
      "<p>프로그램 D에서 사용하는 슈퍼비전 기록 양식을 배포합니다.</p>" +
      "<p>각 회기에서 논의한 내용을 이 양식에 정리해 두면 다음 단계에서 참고하기 좋습니다.</p>" +
      "<p>작성 방법이 궁금하시면 담당 운영자에게 문의해 주세요.</p>",
    relatedLinks: [{ title: "슈퍼비전 기록 양식 (문서)", url: "https://example.com/resource" }]
  },
  {
    title: "심리검사 결과지 읽는 법 안내 자료",
    category: "RESOURCE",
    labels: ["자료실"],
    authorEmail: adminEmail,
    body:
      "<p>심리검사 결과지를 이해하는 데 도움이 되는 안내 자료를 공유합니다.</p>" +
      "<p>검사 종류별로 결과가 어떻게 표시되는지 예시와 함께 정리했습니다.</p>" +
      "<p>해석 상담 전에 미리 읽어 두시면 이야기 나누기가 한결 수월합니다.</p>",
    relatedLinks: [{ title: "결과지 안내 자료 (PDF)", url: "https://example.com/resource" }]
  },
  {
    title: "상담 준비 체크리스트를 공유합니다",
    category: "RESOURCE",
    labels: ["상담"],
    authorEmail: adminEmail,
    body:
      "<p>첫 상담을 앞두고 준비하면 좋은 것들을 간단한 체크리스트로 정리했습니다.</p>" +
      "<p>무엇을 이야기하고 싶은지 미리 떠올려 보시면 상담이 한결 편해집니다.</p>" +
      "<p>부담 갖지 마시고 참고 자료로만 활용해 주세요.</p>",
    relatedLinks: [{ title: "상담 준비 체크리스트 (문서)", url: "https://example.com/resource" }]
  }
];

// 캘린더를 조밀하게 채울 고정 연도 범위. 사이트 폴백(site-data.ts)의 DEMO_YEARS와
// 반드시 동일해야 합니다.
const DEMO_YEARS = [2026, 2027, 2028, 2029, 2030];

const SEOUL_UTC_OFFSET_MINUTES = 9 * 60;

// (연, 월, 일, 시, 분) 서울 벽시계 시각에 해당하는 UTC 인스턴트(Date)를 만듭니다.
// UTC = 서울시각 - 9h. site-data.ts의 seoulFixedIso와 동일한 규칙입니다.
function seoulFixedDate(year, month, day, hour = 0, minute = 0) {
  const utcMillis =
    Date.UTC(year, month - 1, day, hour, minute, 0, 0) - SEOUL_UTC_OFFSET_MINUTES * 60000;
  return new Date(utcMillis);
}

async function upsertUser(email, displayName) {
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: displayName },
    update: {}
  });

  await prisma.authorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName },
    update: {}
  });

  return user;
}

async function seedPosts(usersByEmail) {
  let created = 0;

  for (const post of demoPosts) {
    const existing = await prisma.sitePost.findFirst({
      where: { title: post.title, category: post.category }
    });

    if (existing) {
      continue;
    }

    await prisma.sitePost.create({
      data: {
        authorUserId: usersByEmail.get(post.authorEmail)?.id ?? null,
        title: post.title,
        body: post.body,
        category: post.category,
        labels: post.labels,
        visibility: "PUBLIC",
        relatedLinks: post.relatedLinks ?? undefined
      }
    });
    created += 1;
  }

  return created;
}

// 일반 일정 템플릿: 매년 반복되는 6개의 계절 이벤트. site-data.ts의
// GENERAL_SCHEDULE_TEMPLATES와 반드시 동일해야 합니다(월/일/시/제목/설명 1:1).
const generalScheduleTemplates = [
  {
    title: "새해 상담 일정 안내",
    description: "새해 첫 상담 일정과 한 해 프로그램 계획을 함께 안내하는 자리입니다.",
    month: 1,
    day: 8,
    startHour: 10,
    endHour: 12
  },
  {
    title: "신규 상담사 오리엔테이션",
    description: "새로 합류한 상담사들이 연구소의 운영 방식과 사례 기록 원칙을 익히는 오리엔테이션입니다.",
    month: 2,
    day: 5,
    startHour: 10,
    endHour: 13
  },
  {
    title: "봄 마음건강 공개 특강",
    description: "일반인을 위한 마음건강 주제의 공개 특강입니다. 사전 신청을 받습니다.",
    month: 4,
    day: 18,
    startHour: 14,
    endHour: 16
  },
  {
    title: "월례 공개 사례 세미나",
    description: "매달 한 차례, 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나입니다.",
    month: 5,
    day: 16,
    startHour: 10,
    endHour: 12
  },
  {
    title: "여름 정기 휴무 안내",
    description: "연구소 정기 휴무일입니다. 이날은 상담과 문의 응대가 어렵습니다.",
    month: 8,
    day: 3,
    startHour: 10,
    endHour: 18
  },
  {
    title: "저녁 심리학 독서모임",
    description: "심리학 책 한 권을 함께 읽고 이야기 나누는 저녁 모임입니다.",
    month: 10,
    day: 22,
    startHour: 19,
    endHour: 21
  },
  {
    title: "연말 결산 모임",
    description: "한 해 동안의 상담과 교육을 함께 돌아보고 다음 해 계획을 나누는 내부 결산 모임입니다.",
    month: 12,
    day: 12,
    startHour: 14,
    endHour: 17
  }
];

// DEMO_YEARS × 템플릿을 고정 날짜로 펼쳐 (연도별로 제목을 붙인) 일반 일정 목록을 만듭니다.
const demoGeneralSchedules = DEMO_YEARS.flatMap((year) =>
  generalScheduleTemplates.map((template) => ({
    title: `${year} ${template.title}`,
    description: template.description,
    date: seoulFixedDate(year, template.month, template.day, template.startHour, 0),
    endsAt: seoulFixedDate(year, template.month, template.day, template.endHour, 0)
  }))
);

async function seedGeneralSchedules(usersByEmail) {
  let created = 0;

  for (const schedule of demoGeneralSchedules) {
    const existing = await prisma.generalSchedule.findFirst({ where: { title: schedule.title } });
    if (existing) {
      continue;
    }

    await prisma.generalSchedule.create({
      data: {
        authorUserId: usersByEmail.get(adminEmail)?.id ?? null,
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        endsAt: schedule.endsAt,
        visibility: "PUBLIC"
      }
    });
    created += 1;
  }

  return created;
}

// 프로그램 런 템플릿: (workshopSlug, runNumber)마다 신청 월/일과 단계별 세션 월/일·시간을
// 고정합니다. site-data.ts의 WORKSHOP_RUN_TEMPLATES와 반드시 동일해야 합니다.
// DEMO_YEARS의 각 연도에 대해 같은 월/일로 런을 생성합니다. runNumber는
// (workshopSlug, year) 안에서 부여되며 @@unique(workshopSlug, year, runNumber)와 충돌하지 않습니다.
const workshopRunTemplates = [
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
          { month: 3, day: 21, startTime: "10:00", endTime: "13:00" }
        ]
      }
    ]
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
          { month: 9, day: 19, startTime: "10:00", endTime: "13:00" }
        ]
      }
    ]
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
        sessions: [{ month: 7, day: 4, startTime: "10:00", endTime: "17:00" }]
      }
    ]
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
          { month: 5, day: 23, startTime: "10:00", endTime: "13:00" }
        ]
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStart: { month: 6, day: 8 },
        applicationEnd: { month: 6, day: 27 },
        sessions: [
          { month: 7, day: 11, startTime: "10:00", endTime: "13:00" },
          { month: 7, day: 25, startTime: "10:00", endTime: "13:00" }
        ]
      }
    ]
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
          { month: 6, day: 14, startTime: "14:00", endTime: "17:00" }
        ]
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStart: { month: 8, day: 18 },
        applicationEnd: { month: 9, day: 7 },
        sessions: [{ month: 9, day: 20, startTime: "14:00", endTime: "17:00" }]
      },
      {
        stageName: "3단계",
        orderIndex: 2,
        applicationStart: { month: 10, day: 20 },
        applicationEnd: { month: 11, day: 9 },
        sessions: [{ month: 11, day: 15, startTime: "14:00", endTime: "17:00" }]
      }
    ]
  }
];

// DEMO_YEARS × 템플릿을 고정 날짜로 펼친 런 목록.
const demoWorkshopRuns = DEMO_YEARS.flatMap((year) =>
  workshopRunTemplates.map((template) => ({
    workshopSlug: template.workshopSlug,
    year,
    runNumber: template.runNumber,
    description: template.description,
    stages: template.stages.map((stage) => ({
      stageName: stage.stageName,
      orderIndex: stage.orderIndex,
      applicationStartsAt: seoulFixedDate(year, stage.applicationStart.month, stage.applicationStart.day, 9, 0),
      applicationEndsAt: seoulFixedDate(year, stage.applicationEnd.month, stage.applicationEnd.day, 18, 0),
      sessions: stage.sessions.map((session) => ({
        sessionDate: seoulFixedDate(year, session.month, session.day, 0, 0),
        startTime: session.startTime,
        endTime: session.endTime
      }))
    }))
  }))
);

async function seedWorkshopRuns(usersByEmail) {
  let createdStages = 0;

  for (const runConfig of demoWorkshopRuns) {
    const run = await prisma.workshopRun.upsert({
      where: {
        workshopSlug_year_runNumber: {
          workshopSlug: runConfig.workshopSlug,
          year: runConfig.year,
          runNumber: runConfig.runNumber
        }
      },
      create: {
        authorUserId: usersByEmail.get(adminEmail)?.id ?? null,
        workshopSlug: runConfig.workshopSlug,
        year: runConfig.year,
        runNumber: runConfig.runNumber,
        applicationFormUrl: "https://example.com",
        description: runConfig.description,
        visibility: "PUBLIC"
      },
      update: {}
    });

    const existingStageCount = await prisma.scheduleStage.count({
      where: { workshopRunId: run.id }
    });
    if (existingStageCount > 0) {
      continue;
    }

    for (const stage of runConfig.stages) {
      await prisma.scheduleStage.create({
        data: {
          workshopRunId: run.id,
          stageName: stage.stageName,
          orderIndex: stage.orderIndex,
          applicationStartsAt: stage.applicationStartsAt,
          applicationEndsAt: stage.applicationEndsAt,
          applicationFormUrl: "https://example.com",
          sessions: {
            create: stage.sessions.map((session, index) => ({
              dayIndex: index,
              sessionDate: session.sessionDate,
              startTime: session.startTime,
              endTime: session.endTime
            }))
          }
        }
      });
      createdStages += 1;
    }
  }

  return createdStages;
}

async function main() {
  const usersByEmail = new Map();
  usersByEmail.set(adminEmail, await upsertUser(adminEmail, "관리자"));
  usersByEmail.set(editorOneEmail, await upsertUser(editorOneEmail, "운영자 1"));

  const createdPosts = await seedPosts(usersByEmail);
  const createdSchedules = await seedGeneralSchedules(usersByEmail);
  const createdStages = await seedWorkshopRuns(usersByEmail);

  console.log(
    `Seeded demo content: ${createdPosts} posts, ${createdSchedules} general schedules, ${createdStages} workshop stages (existing items were kept).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
