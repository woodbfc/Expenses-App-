import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@ops.local" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@ops.local",
      name: "Demo Ops Lead"
    }
  });

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      priorityWeight: 1,
      dueSoonWeight: 1,
      projectValueWeight: 1
    },
    update: {}
  });

  console.log("Seeded user", user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
