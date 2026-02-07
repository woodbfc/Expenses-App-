import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";
import { RealtimeService } from "../services/realtime.service";

@Controller("projects")
export class ProjectController {
  constructor(private prisma: PrismaService, private realtime: RealtimeService) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  @Get()
  async list(@Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    return this.prisma.project.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  @Post()
  async create(@Headers() headers: Record<string, string>, @Body() body: any) {
    const userId = this.getUserId(headers);
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: body.name,
        description: body.description ?? null,
        rag: body.rag ?? "AMBER",
        status: body.status ?? "ACTIVE",
        value: body.value ? Number(body.value) : null
      }
    });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return project;
  }

  @Delete(":id")
  async remove(@Headers() headers: Record<string, string>, @Param("id") id: string) {
    const userId = this.getUserId(headers);
    await this.prisma.project.deleteMany({ where: { id, userId } });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return { ok: true };
  }
}
