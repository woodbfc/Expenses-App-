import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaService } from "./prisma.service";
import { DumpCreate } from "@ops/shared";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const queue = new Queue("dump-processing", { connection });

@Injectable()
export class DumpService {
  constructor(private prisma: PrismaService) {}

  async createDump(userId: string, data: DumpCreate) {
    const dump = await this.prisma.dump.create({
      data: {
        userId,
        rawText: data.rawText,
        sourceType: data.sourceType
      }
    });
    await queue.add("process", { dumpId: dump.id, userId });
    return dump;
  }
}
