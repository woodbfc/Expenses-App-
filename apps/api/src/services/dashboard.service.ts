import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(userId: string) {
    const now = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7);

    const [openActions, overdueActions, actionsDueWeek, projectsAtRisk, waitingOn] =
      await Promise.all([
        this.prisma.action.count({ where: { userId, status: { not: "DONE" } } }),
        this.prisma.action.count({
          where: { userId, dueDate: { lt: now }, status: { not: "DONE" } }
        }),
        this.prisma.action.count({
          where: { userId, dueDate: { lte: weekEnd }, status: { not: "DONE" } }
        }),
        this.prisma.project.count({ where: { userId, rag: { in: ["RED", "AMBER"] } } }),
        this.prisma.action.count({
          where: { userId, waitingOnPersonId: { not: null }, status: { not: "DONE" } }
        })
      ]);

    return {
      openActions,
      overdueActions,
      projectsAtRisk,
      actionsWaitingOn: waitingOn,
      actionsDueWeek
    };
  }

  async getCommandBrief(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId } });
    const weights = settings ?? { priorityWeight: 1, dueSoonWeight: 1, projectValueWeight: 1 };

    const actions = await this.prisma.action.findMany({
      where: { userId, status: { not: "DONE" } },
      include: { project: true, waitingOn: true }
    });

    const scored = actions.map((action) => {
      const dueScore = action.dueDate
        ? Math.max(0, 7 - Math.round((action.dueDate.getTime() - Date.now()) / 86400000))
        : 0;
      const priorityScore = action.priority === "HIGH" ? 3 : action.priority === "MEDIUM" ? 2 : 1;
      const valueScore = action.project?.value ? action.project.value / 100000 : 0;
      return {
        action,
        score:
          priorityScore * weights.priorityWeight +
          dueScore * weights.dueSoonWeight +
          valueScore * weights.projectValueWeight
      };
    });

    const topPriorities = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.action);

    const waitingOn = actions.filter((action) => action.waitingOnPersonId);

    const risks = await this.prisma.risk.findMany({
      where: { userId },
      include: { project: true, action: true }
    });

    const topRisks = risks.filter((risk) => risk.project?.rag !== "GREEN");

    const now = new Date();
    const next24 = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextActions = actions.filter(
      (action) => action.dueDate && action.dueDate <= next24 && action.status !== "DONE"
    );
    const overdue = actions.filter(
      (action) => action.dueDate && action.dueDate < now && action.status !== "DONE"
    );

    return {
      topPriorities,
      waitingOn,
      topRisks,
      next24h: [...new Set([...nextActions, ...overdue])]
    };
  }

  async getInbox(userId: string) {
    return this.prisma.extractedItem.findMany({
      where: { userId, status: "TRIAGE" },
      orderBy: { createdAt: "desc" }
    });
  }

  async getProjectGrid(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { risks: true, actions: true }
    });
  }

  async getEowPack(userId: string, weekStart: Date, weekEnd: Date) {
    const [actions, decisions, risks, projects] = await Promise.all([
      this.prisma.action.findMany({
        where: { userId, status: "DONE", updatedAt: { gte: weekStart, lte: weekEnd } }
      }),
      this.prisma.decision.findMany({
        where: { userId, createdAt: { gte: weekStart, lte: weekEnd } }
      }),
      this.prisma.risk.findMany({
        where: { userId, createdAt: { gte: weekStart, lte: weekEnd } }
      }),
      this.prisma.project.findMany({
        where: { userId, updatedAt: { gte: weekStart, lte: weekEnd } }
      })
    ]);

    return {
      actions,
      decisions,
      risks,
      projects
    };
  }
}
