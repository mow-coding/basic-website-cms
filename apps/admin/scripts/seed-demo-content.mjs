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

async function seedGeneralSchedule(usersByEmail) {
  const title = "예시 기본 일정입니다";
  const existing = await prisma.generalSchedule.findFirst({ where: { title } });
  if (existing) {
    return 0;
  }

  await prisma.generalSchedule.create({
    data: {
      authorUserId: usersByEmail.get(adminEmail)?.id ?? null,
      title,
      description: "예시 일정 설명입니다. 실제 일정은 관리자에서 등록합니다.",
      date: futureDate(14, 10, 0),
      endsAt: futureDate(14, 12, 0),
      visibility: "PUBLIC"
    }
  });

  return 1;
}

async function seedWorkshopRun(usersByEmail) {
  const workshopSlug = "program-c";
  const year = futureDate(30).getFullYear();
  const runNumber = 1;

  const run = await prisma.workshopRun.upsert({
    where: { workshopSlug_year_runNumber: { workshopSlug, year, runNumber } },
    create: {
      authorUserId: usersByEmail.get(adminEmail)?.id ?? null,
      workshopSlug,
      year,
      runNumber,
      applicationFormUrl: "https://example.com",
      description: "<p>예시 프로그램 런 설명입니다.</p>",
      visibility: "PUBLIC"
    },
    update: {}
  });

  const existingStageCount = await prisma.scheduleStage.count({ where: { workshopRunId: run.id } });
  if (existingStageCount > 0) {
    return 0;
  }

  const stages = [
    { stageName: "1단계", orderIndex: 0, sessionDay: 30 },
    { stageName: "2단계", orderIndex: 1, sessionDay: 44 }
  ];

  for (const stage of stages) {
    await prisma.scheduleStage.create({
      data: {
        workshopRunId: run.id,
        stageName: stage.stageName,
        orderIndex: stage.orderIndex,
        applicationStartsAt: futureDate(stage.sessionDay - 21, 9, 0),
        applicationEndsAt: futureDate(stage.sessionDay - 3, 18, 0),
        applicationFormUrl: "https://example.com",
        sessions: {
          create: [
            {
              dayIndex: 0,
              sessionDate: futureDate(stage.sessionDay, 10, 0),
              startTime: "10:00",
              endTime: "13:00"
            }
          ]
        }
      }
    });
  }

  return stages.length;
}

async function main() {
  const usersByEmail = new Map();
  usersByEmail.set(adminEmail, await upsertUser(adminEmail, "관리자"));
  usersByEmail.set(editorOneEmail, await upsertUser(editorOneEmail, "운영자 1"));

  const createdPosts = await seedPosts(usersByEmail);
  const createdSchedules = await seedGeneralSchedule(usersByEmail);
  const createdStages = await seedWorkshopRun(usersByEmail);

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
