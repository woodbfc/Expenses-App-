import { PrismaClient } from "@prisma/client";
import { pipeline } from "@ops/parser";

const prisma = new PrismaClient();

const dumps = [
  `• Action: Chase Rosa re: SteerCo deck by Fri
- Risk: Pre-sort delays on NDC linehaul
Meeting notes: Matt said EOW pack needs £ savings highlight`,
  `Waiting on Uli for 5S rollout update
Decision: move shift pattern to 06:00
Action: update stakeholder comms`,
  `Action: Call Mark about outliers project by next Thursday
Risk: overtime costs trending up` 
];

async function main() {
  const user = await prisma.user.findFirst({ where: { email: "demo@ops.local" } });
  if (!user) throw new Error("Run seed first");

  for (const text of dumps) {
    const dump = await prisma.dump.create({
      data: { userId: user.id, rawText: text, sourceType: "UI", processedStatus: "DONE" }
    });

    const parsed = pipeline(text);
    for (const item of parsed) {
      await prisma.extractedItem.create({
        data: {
          userId: user.id,
          dumpId: dump.id,
          type: item.type,
          rawSpan: item.rawSpan,
          confidence: item.confidence,
          payload: item.fields
        }
      });
    }

    await prisma.action.create({
      data: {
        userId: user.id,
        title: `Follow up: ${text.split("\n")[0]}`,
        priority: "HIGH",
        sourceDumpId: dump.id
      }
    });
  }

  await prisma.project.upsert({
    where: { name_userId: { name: "SteerCo", userId: user.id } },
    create: { userId: user.id, name: "SteerCo", rag: "AMBER", value: 250000 },
    update: {}
  });

  console.log("Demo data loaded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
