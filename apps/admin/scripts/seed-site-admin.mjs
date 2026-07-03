import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accounts = [
  {
    email: "admin@example.com",
    displayName: "관리자"
  },
  {
    email: "editor-one@example.com",
    displayName: "운영자 1"
  },
  {
    email: "editor-two@example.com",
    displayName: "운영자 2"
  }
];

async function main() {
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        name: account.displayName
      },
      update: {
        name: account.displayName
      }
    });

    await prisma.authorProfile.upsert({
      where: {
        userId: user.id
      },
      create: {
        userId: user.id,
        displayName: account.displayName
      },
      // Keep user-edited display names intact when the seed is run again.
      update: {}
    });
  }

  console.log(`Seeded ${accounts.length} site admin accounts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
