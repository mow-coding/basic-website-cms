import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@example.com";
const editorOneEmail = "editor-one@example.com";

// 게시물별 고유 본문. 사이트 정적 폴백(site-data.ts)의 문단 배열과 문안이 100% 일치합니다.
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
    title: "프로그램 A 3기 수강생을 모집합니다",
    category: "GENERAL",
    labels: ["프로그램A"],
    authorEmail: adminEmail,
    body:
      "<p>심리평가 실무의 기초를 처음부터 다지고자 하는 분들을 위한 프로그램 A 3기 수강생을 모집합니다.</p>" +
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
    title: "프로그램 C 사례 정리 양식을 배포합니다",
    category: "RESOURCE",
    labels: ["프로그램C"],
    authorEmail: adminEmail,
    body:
      "<p>프로그램 C에서 사용하는 사례 정리 양식을 배포합니다.</p>" +
      "<p>다음 시간까지 각자 맡은 사례를 양식에 맞추어 정리해 오시면 됩니다.</p>" +
      "<p>궁금한 점은 담당 운영자에게 문의해 주세요.</p>",
    relatedLinks: [{ title: "사례 정리 양식 (문서)", url: "https://example.com/resource" }]
  }
];

function futureDate(daysFromNow, hours = 10, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date;
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

const demoGeneralSchedules = [
  {
    title: "월례 공개 사례 세미나",
    description: "매달 한 차례, 관심 있는 분들과 사례를 함께 살펴보는 공개 세미나입니다.",
    day: 14,
    startHour: 10,
    endHour: 12
  },
  {
    title: "여름 정기 휴무 안내",
    description: "연구소 정기 휴무일입니다. 이날은 상담과 문의 응대가 어렵습니다.",
    day: 3,
    startHour: 10,
    endHour: 18
  },
  {
    title: "상담자 집단 슈퍼비전",
    description: "상담자들이 모여 사례를 검토하고 서로의 관점을 나누는 내부 모임입니다.",
    day: 8,
    startHour: 14,
    endHour: 17
  },
  {
    title: "저녁 심리학 독서모임",
    description: "심리학 책 한 권을 함께 읽고 이야기 나누는 저녁 모임입니다.",
    day: 22,
    startHour: 19,
    endHour: 21
  },
  {
    title: "가을 마음건강 공개 특강",
    description: "일반인을 위한 마음건강 주제의 공개 특강입니다. 사전 신청을 받습니다.",
    day: 40,
    startHour: 10,
    endHour: 16
  }
];

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
        date: futureDate(schedule.day, schedule.startHour, 0),
        endsAt: futureDate(schedule.day, schedule.endHour, 0),
        visibility: "PUBLIC"
      }
    });
    created += 1;
  }

  return created;
}

const demoWorkshopRuns = [
  {
    // 프로그램 A: 신청 기간이 현재 진행 중인 단일 단계 런
    workshopSlug: "program-a",
    description: "<p>실무의 기초를 처음부터 다지는 입문 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: -3,
        applicationEndDay: 8,
        sessions: [
          { day: 12, startTime: "10:00", endTime: "13:00" },
          { day: 13, startTime: "10:00", endTime: "13:00" }
        ]
      }
    ]
  },
  {
    // 프로그램 C: 두 단계 런
    workshopSlug: "program-c",
    description: "<p>여러 단계에 걸쳐 이론과 사례 실습을 함께 쌓아가는 단계별 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: 9,
        applicationEndDay: 27,
        sessions: [{ day: 30, startTime: "10:00", endTime: "13:00" }]
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStartDay: 23,
        applicationEndDay: 41,
        sessions: [{ day: 44, startTime: "10:00", endTime: "13:00" }]
      }
    ]
  },
  {
    // 프로그램 D: 세 단계 런 (여러 달에 걸친 세션)
    workshopSlug: "program-d",
    description: "<p>실제 사례를 깊이 있게 검토하는 고급 심화 과정입니다.</p>",
    stages: [
      {
        stageName: "1단계",
        orderIndex: 0,
        applicationStartDay: 4,
        applicationEndDay: 22,
        sessions: [
          { day: 25, startTime: "14:00", endTime: "17:00" },
          { day: 26, startTime: "14:00", endTime: "17:00" }
        ]
      },
      {
        stageName: "2단계",
        orderIndex: 1,
        applicationStartDay: 25,
        applicationEndDay: 43,
        sessions: [{ day: 46, startTime: "14:00", endTime: "17:00" }]
      },
      {
        stageName: "3단계",
        orderIndex: 2,
        applicationStartDay: 39,
        applicationEndDay: 57,
        sessions: [{ day: 60, startTime: "14:00", endTime: "17:00" }]
      }
    ]
  }
];

async function seedWorkshopRuns(usersByEmail) {
  let createdStages = 0;

  for (const runConfig of demoWorkshopRuns) {
    const year = futureDate(30).getFullYear();
    const runNumber = 1;

    const run = await prisma.workshopRun.upsert({
      where: {
        workshopSlug_year_runNumber: { workshopSlug: runConfig.workshopSlug, year, runNumber }
      },
      create: {
        authorUserId: usersByEmail.get(adminEmail)?.id ?? null,
        workshopSlug: runConfig.workshopSlug,
        year,
        runNumber,
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
          applicationStartsAt: futureDate(stage.applicationStartDay, 9, 0),
          applicationEndsAt: futureDate(stage.applicationEndDay, 18, 0),
          applicationFormUrl: "https://example.com",
          sessions: {
            create: stage.sessions.map((session, index) => ({
              dayIndex: index,
              sessionDate: futureDate(session.day, 0, 0),
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
