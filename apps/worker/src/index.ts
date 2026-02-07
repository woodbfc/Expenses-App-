import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { RuleBasedProvider } from "@ops/parser";

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const publisher = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const CHANNEL = "ops-events";

async function getOrCreatePerson(userId: string, name?: string | null) {
  if (!name) return null;
  const existing = await prisma.person.findFirst({ where: { userId, name } });
  if (existing) return existing;
  return prisma.person.create({ data: { userId, name } });
}

const provider = new RuleBasedProvider();

new Worker(
  "dump-processing",
  async (job) => {
    const { dumpId, userId } = job.data as { dumpId: string; userId: string };
    const dump = await prisma.dump.findUnique({ where: { id: dumpId } });
    if (!dump) return;

    const parsed = await provider.parse(dump.rawText);

    for (const item of parsed) {
      const extracted = await prisma.extractedItem.create({
        data: {
          userId,
          dumpId,
          type: item.type,
          rawSpan: item.rawSpan,
          confidence: item.confidence,
          payload: item.fields
        }
      });

      if (item.type === "ACTION") {
        const owner = await getOrCreatePerson(userId, item.fields.owner as string | null);
        await prisma.action.create({
          data: {
            userId,
            title: item.rawSpan,
            description: item.rawSpan,
            priority: (item.fields.priority as string) ?? "MEDIUM",
            dueDate: item.fields.dueDate ? new Date(item.fields.dueDate as string) : null,
            ownerId: owner?.id,
            sourceDumpId: dumpId
          }
        });
      }

      if (item.type === "RISK") {
        await prisma.risk.create({
          data: {
            userId,
            title: item.rawSpan,
            description: item.rawSpan
          }
        });
      }

      if (item.type === "DECISION") {
        await prisma.decision.create({
          data: {
            userId,
            title: item.rawSpan,
            description: item.rawSpan
          }
        });
      }

      if (item.type === "NOTE") {
        await prisma.note.create({
          data: {
            userId,
            content: item.rawSpan,
            tags: []
          }
        });
      }

      if (item.type === "PROJECT" && item.fields.project) {
        await prisma.project.upsert({
          where: { name_userId: { name: item.fields.project as string, userId } },
          create: { userId, name: item.fields.project as string },
          update: {}
        });
      }

      await prisma.auditLog.create({
        data: {
          userId,
          entity: "ExtractedItem",
          entityId: extracted.id,
          action: "PARSED",
          payload: item.fields
        }
      });
    }

    await prisma.dump.update({ where: { id: dumpId }, data: { processedStatus: "DONE" } });
    publisher.publish(CHANNEL, JSON.stringify({ type: "DUMP_PROCESSED", dumpId }));
    publisher.publish(CHANNEL, JSON.stringify({ type: "DASHBOARD_UPDATED" }));
  },
  { connection }
);

console.log("Worker started");
