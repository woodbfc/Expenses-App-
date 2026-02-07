import { Controller, Sse } from "@nestjs/common";
import { map } from "rxjs";
import { RealtimeService } from "../services/realtime.service";

@Controller("events")
export class RealtimeController {
  constructor(private realtime: RealtimeService) {}

  @Sse()
  stream() {
    return this.realtime.stream().pipe(map((event) => ({ data: event })));
  }
}
