import { Body, Controller, Get, Headers, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import PDFDocument from "pdfkit";
import { WeightSettingsSchema } from "@ops/shared";
import { PrismaService } from "../services/prisma.service";
import { DashboardService } from "../services/dashboard.service";
import { RealtimeService } from "../services/realtime.service";

@Controller("dashboard")
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private dashboard: DashboardService,
    private realtime: RealtimeService
  ) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  @Get("kpis")
  async kpis(@Headers() headers: Record<string, string>) {
    return this.dashboard.getKpis(this.getUserId(headers));
  }

  @Get("brief")
  async brief(@Headers() headers: Record<string, string>) {
    return this.dashboard.getCommandBrief(this.getUserId(headers));
  }

  @Get("projects")
  async projects(@Headers() headers: Record<string, string>) {
    return this.dashboard.getProjectGrid(this.getUserId(headers));
  }

  @Get("inbox")
  async inbox(@Headers() headers: Record<string, string>) {
    return this.dashboard.getInbox(this.getUserId(headers));
  }

  @Get("eow")
  async eow(@Headers() headers: Record<string, string>, @Query("start") start?: string) {
    const startDate = start ? new Date(start) : new Date();
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() - startDate.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return this.dashboard.getEowPack(this.getUserId(headers), weekStart, weekEnd);
  }

  @Get("eow/export")
  async exportEow(
    @Headers() headers: Record<string, string>,
    @Query("format") format: "markdown" | "pdf" = "markdown",
    @Res() res: Response
  ) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const pack = await this.dashboard.getEowPack(this.getUserId(headers), weekStart, weekEnd);

    const markdown = `# EOW Pack\n\n## Completed Actions\n${pack.actions
      .map((action) => `- ${action.title}`)
      .join("\n")}\n\n## Decisions\n${pack.decisions
      .map((decision) => `- ${decision.title}`)
      .join("\n")}\n\n## Project Updates\n${pack.projects
      .map((project) => `- ${project.name} (${project.rag})`)
      .join("\n")}\n\n## New Risks\n${pack.risks.map((risk) => `- ${risk.title}`).join("\n")}`;

    if (format === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);
      doc.fontSize(18).text("EOW Pack", { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(markdown.replace(/#/g, ""));
      doc.end();
      return;
    }

    res.setHeader("Content-Type", "text/markdown");
    res.send(markdown);
  }

  @Post("weights")
  async updateWeights(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    const userId = this.getUserId(headers);
    const parsed = WeightSettingsSchema.parse(body);
    const updated = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...parsed },
      update: parsed
    });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return updated;
  }
}
