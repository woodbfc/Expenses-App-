import { z } from "zod";

export const DumpSourceType = z.enum(["UI", "API", "UPLOAD"]);
export const ExtractedItemType = z.enum([
  "ACTION",
  "PROJECT",
  "RISK",
  "DECISION",
  "NOTE",
  "PERSON",
  "DEPENDENCY"
]);

export const DumpCreateSchema = z.object({
  rawText: z.string().min(1),
  sourceType: DumpSourceType.default("UI")
});

export const ExtractedItemStatus = z.enum(["TRIAGE", "CONFIRMED", "DISCARDED"]);

export const ConfirmExtractedItemSchema = z.object({
  extractedItemId: z.string().uuid(),
  action: z.enum(["CONFIRM", "DISCARD", "EDIT", "MERGE"]).default("CONFIRM"),
  payload: z.record(z.any()).optional()
});

export const WeightSettingsSchema = z.object({
  priorityWeight: z.number().min(0).max(2),
  dueSoonWeight: z.number().min(0).max(2),
  projectValueWeight: z.number().min(0).max(2)
});

export type DumpCreate = z.infer<typeof DumpCreateSchema>;
export type ConfirmExtractedItem = z.infer<typeof ConfirmExtractedItemSchema>;
export type WeightSettings = z.infer<typeof WeightSettingsSchema>;

export type RealtimeEvent =
  | { type: "DUMP_CREATED"; dumpId: string }
  | { type: "DUMP_PROCESSED"; dumpId: string }
  | { type: "EXTRACTED_UPDATED" }
  | { type: "DASHBOARD_UPDATED" };

export const ApiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number()
});
