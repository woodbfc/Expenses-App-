import { Module } from "@nestjs/common";
import { DumpController } from "./controllers/dump.controller";
import { ExtractedController } from "./controllers/extracted.controller";
import { DashboardController } from "./controllers/dashboard.controller";
import { RealtimeController } from "./controllers/realtime.controller";
import { ActionController } from "./controllers/action.controller";
import { ProjectController } from "./controllers/project.controller";
import { SearchController } from "./controllers/search.controller";
import { PrismaService } from "./services/prisma.service";
import { DumpService } from "./services/dump.service";
import { DashboardService } from "./services/dashboard.service";
import { RealtimeService } from "./services/realtime.service";

@Module({
  controllers: [
    DumpController,
    ExtractedController,
    DashboardController,
    RealtimeController,
    ActionController,
    ProjectController,
    SearchController
  ],
  providers: [PrismaService, DumpService, DashboardService, RealtimeService]
})
export class AppModule {}
