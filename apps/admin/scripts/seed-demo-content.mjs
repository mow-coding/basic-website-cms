import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = "admin@example.com";
const editorOneEmail = "editor-one@example.com";

const demoPostBody =
  "<p>예시 게시물 본문입니다. 실제 콘텐츠는 관리자에서 작성합니다.</p>";

const demoPosts = [
  {
    title: "예시 공지사항 제목입니다",
    category: "GENERAL",
    labels: [],
    authorEmail: adminEmail
  },
  {
    title: "예시 프로그램 공지 제목입니다",
    category: "GENERAL",
    labels: ["프로그램C"],
    authorEmail: adminEmail
  },
  {
    title: "예시 안내 게시물 제목입니다",
    category: "COUNSELING",
    labels: [],
    authorEmail: adminEmail
  },
  {
    title: "예시 자유게시판 게시물 제목입니다",
    category: "GREEN_BOARD",
    labels: [],
    authorEmail: adminEmail
  },
  {
    // 후기 게시물: editor-one 작성 + 프로그램 라벨 → 공개 사이트에서 후기로 분류됩니다.
    title: "예시 후기 게시물 제목입니다",
    category: "GREEN_BOARD",
    labels: ["프로그램C"],
    authorEmail: editorOneEmail
  },
  {
    title: "예시 자료실 게시물 제목입니다",
    category: "RESOURCE",
    labels: ["프로그램C"],
    authorEmail: adminEmail,
    relatedLinks: [{ title: "예시 자료 링크", url: "https://example.com/resource" }]
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
        body: demoPostBody,
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
  { title: "예시 기본 일정입니다", day: 14, startHour: 10, endHour: 12 },
  { title: "예시 휴무 안내 일정입니다", day: 3, startHour: 10, endHour: 18 },
  { title: "예시 내부 세미나 일정입니다", day: 8, startHour: 14, endHour: 17 },
  { title: "예시 정기 모임 일정입니다", day: 22, startHour: 19, endHour: 21 },
  { title: "예시 특별 행사 일정입니다", day: 40, startHour: 10, endHour: 16 }
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
        description: "예시 일정 설명입니다. 실제 일정은 관리자에서 등록합니다.",
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
        description: "<p>예시 프로그램 런 설명입니다.</p>",
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
