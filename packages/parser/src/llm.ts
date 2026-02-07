import { ParsedItem } from "./index";

export interface LLMProvider {
  name: string;
  parse(text: string): Promise<ParsedItem[]>;
}

export class RuleBasedProvider implements LLMProvider {
  name = "rule-based";
  async parse(text: string) {
    const { pipeline } = await import("./index");
    return pipeline(text);
  }
}
