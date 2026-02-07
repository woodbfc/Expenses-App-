import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { ConfirmExtractedItemSchema } from "@ops/shared";
import { PrismaService } from "../services/prisma.service";
import { RealtimeService } from "../services/realtime.service";

@Controller("extracted")
export class ExtractedController {
  constructor(private prisma: PrismaService, private realtime: RealtimeService) {}

  private getUserId(headers: Record<string, string>) {
    return headers["x-user-id"] ?? headers["x-user"] ?? "00000000-0000-0000-0000-000000000001";
  }

  @Get("inbox")
  async inbox(@Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    return this.prisma.extractedItem.findMany({
      where: { userId, status: "TRIAGE" },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("confirm")
  async confirm(@Body() body: unknown, @Headers() headers: Record<string, string>) {
    const userId = this.getUserId(headers);
    const parsed = ConfirmExtractedItemSchema.parse(body);
    const item = await this.prisma.extractedItem.update({
      where: { id: parsed.extractedItemId },
      data: { status: parsed.action === "DISCARD" ? "DISCARDED" : "CONFIRMED" }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        entity: "ExtractedItem",
        entityId: item.id,
        action: parsed.action,
        payload: parsed.payload ?? {}
      }
    });

    this.realtime.emit({ type: "EXTRACTED_UPDATED" });
    this.realtime.emit({ type: "DASHBOARD_UPDATED" });
    return item;
  }
}
