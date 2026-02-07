import { Controller, Get, Headers, Query } from "@nestjs/common";
import { PrismaService } from "../services/prisma.service";

@Controller("search")
export class SearchController {
  constructor(private prisma: PrismaService) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  @Get()
  async search(@Headers() headers: Record<string, string>, @Query("q") q = "") {
    const userId = this.getUserId(headers);
    if (!q.trim()) return { dumps: [], actions: [], projects: [], notes: [], people: [] };

    const [dumps, actions, projects, notes, people] = await Promise.all([
      this.prisma.dump.findMany({
        where: { userId, rawText: { contains: q, mode: "insensitive" } },
        take: 10
      }),
      this.prisma.action.findMany({
        where: { userId, title: { contains: q, mode: "insensitive" } },
        take: 10
      }),
      this.prisma.project.findMany({
        where: { userId, name: { contains: q, mode: "insensitive" } },
        take: 10
      }),
      this.prisma.note.findMany({
        where: { userId, content: { contains: q, mode: "insensitive" } },
        take: 10
      }),
      this.prisma.person.findMany({
        where: { userId, name: { contains: q, mode: "insensitive" } },
        take: 10
      })
    ]);

    return { dumps, actions, projects, notes, people };
  }
}
