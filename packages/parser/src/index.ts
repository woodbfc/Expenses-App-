import { parse } from "chrono-node";
import { uniqBy } from "lodash";

export type ParsedItemType =
  | "ACTION"
  | "PROJECT"
  | "RISK"
  | "DECISION"
  | "NOTE"
  | "PERSON"
  | "DEPENDENCY";

export interface ParsedItem {
  type: ParsedItemType;
  rawSpan: string;
  confidence: number;
  fields: Record<string, unknown>;
}

const projectHints = ["SteerCo", "pre-sort", "outliers", "5S", "linehaul", "NDC"];

export function normalizeText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[•*]+/g, "-")
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function segmentCandidates(input: string): string[] {
  return input
    .split(/\n| - /)
    .map((line) => line.trim())
    .filter((line) => line.length > 2);
}

export function classifyItem(text: string): ParsedItemType {
  if (/\bblocker|risk|issue\b/i.test(text)) return "RISK";
  if (/\bdecided|decision\b/i.test(text)) return "DECISION";
  if (/\baction|todo|follow up|chase\b/i.test(text)) return "ACTION";
  if (projectHints.some((hint) => text.toLowerCase().includes(hint.toLowerCase()))) return "PROJECT";
  if (/\bwaiting on|dependency\b/i.test(text)) return "DEPENDENCY";
  if (/\bmet with|meeting|minutes|note\b/i.test(text)) return "NOTE";
  if (/\b[A-Z][a-z]+\b/.test(text)) return "PERSON";
  return "NOTE";
}

export function extractFields(text: string): Record<string, unknown> {
  const dates = parse(text, new Date(), { forwardDate: true });
  const dueDate = dates[0]?.start?.date();
  const ownerMatch = text.match(/\b([A-Z][a-z]+)\b/);
  const priority = /urgent|asap|priority/i.test(text) ? "HIGH" : "MEDIUM";
  const project = projectHints.find((hint) => text.toLowerCase().includes(hint.toLowerCase()));
  return {
    dueDate: dueDate ? dueDate.toISOString() : null,
    owner: ownerMatch?.[1] ?? null,
    priority,
    project
  };
}

export function pipeline(input: string): ParsedItem[] {
  const normalized = normalizeText(input);
  const candidates = segmentCandidates(normalized);
  const items = candidates.map((candidate) => {
    const type = classifyItem(candidate);
    const fields = extractFields(candidate);
    return {
      type,
      rawSpan: candidate,
      confidence: type === "NOTE" ? 0.55 : 0.75,
      fields
    };
  });
  return uniqBy(items, (item) => item.rawSpan.toLowerCase());
}

export { LLMProvider, RuleBasedProvider } from "./llm";
