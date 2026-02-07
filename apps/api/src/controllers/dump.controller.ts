import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { DumpCreateSchema } from "@ops/shared";
import { DumpService } from "../services/dump.service";
import { PrismaService } from "../services/prisma.service";
import { RealtimeService } from "../services/realtime.service";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

@Controller("dumps")
export class DumpController {
  constructor(
    private dumpService: DumpService,
    private prisma: PrismaService,
    private realtime: RealtimeService
  ) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  private checkRateLimit(userId: string) {
    const now = Date.now();
    const bucket = rateBuckets.get(userId);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(userId, { count: 1, resetAt: now + 60000 });
      return;
    }
    if (bucket.count >= 30) {
      throw new Error("Rate limit exceeded");
    }
    bucket.count += 1;
  }

  @Post()
  async createDump(@Body() body: unknown, @Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    this.checkRateLimit(userId);
    const parsed = DumpCreateSchema.parse(body);
    const dump = await this.dumpService.createDump(userId, parsed);
    this.realtime.emit({ type: "DUMP_CREATED", dumpId: dump.id });
    return dump;
  }

  @Get()
  async list(@Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    return this.prisma.dump.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }
}
