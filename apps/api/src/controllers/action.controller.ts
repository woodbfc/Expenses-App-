import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { RealtimeService } from "../services/realtime.service";

@Controller("actions")
export class ActionController {
  constructor(private prisma: PrismaService, private realtime: RealtimeService) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  @Get()
  async list(@Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    return this.prisma.action.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  @Post()
  async create(@Headers() headers: Record<string, string>, @Body() body: any) {
    const userId = this.getUserId(headers);
    let sourceDumpId = body.sourceDumpId as string | undefined;
    if (!sourceDumpId) {
      const dump = await this.prisma.dump.create({
        data: { userId, rawText: "Manual action", sourceType: "UI", processedStatus: "DONE" }
      });
      sourceDumpId = dump.id;
    }
    const action = await this.prisma.action.create({
      data: {
        userId,
        title: body.title,
        description: body.description ?? null,
        priority: body.priority ?? "MEDIUM",
        status: body.status ?? "OPEN",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId: body.projectId ?? null,
        sourceDumpId
      }
    });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return action;
  }

  @Delete(":id")
  async remove(@Headers() headers: Record<string, string>, @Param("id") id: string) {
    const userId = this.getUserId(headers);
    await this.prisma.action.deleteMany({ where: { id, userId } });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return { ok: true };
  }
}
