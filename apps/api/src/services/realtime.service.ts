import { Injectable, OnModuleInit } from "@nestjs/common";
import { Subject } from "rxjs";
import IORedis from "ioredis";
import { RealtimeEvent } from "@ops/shared";

const CHANNEL = "ops-events";

@Injectable()
export class RealtimeService implements OnModuleInit {
  private readonly events$ = new Subject<RealtimeEvent>();
  private readonly publisher = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
  private readonly subscriber = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

  async onModuleInit() {
    await this.subscriber.subscribe(CHANNEL);
    this.subscriber.on("message", (_channel, message) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        this.events$.next(event);
      } catch (error) {
        console.error("Failed to parse realtime message", error);
      }
    });
  }

  emit(event: RealtimeEvent) {
    this.events$.next(event);
    this.publisher.publish(CHANNEL, JSON.stringify(event));
  }

  stream() {
    return this.events$.asObservable();
  }
}
