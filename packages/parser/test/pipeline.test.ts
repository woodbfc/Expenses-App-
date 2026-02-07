import { describe, expect, it } from "vitest";
import { pipeline } from "../src";

const messyDump = `
• Action: Chase Rosa re: SteerCo deck by Fri
- Risk: Pre-sort delays on NDC linehaul
Meeting notes: Matt said EOW pack needs £ savings highlight
Waiting on Uli for 5S rollout update
Decision: move shift pattern to 06:00
`;

describe("parser pipeline", () => {
  it("extracts structured items from messy dump", () => {
    const items = pipeline(messyDump);
    expect(items.length).toBeGreaterThan(3);
    const action = items.find((item) => item.type === "ACTION");
    expect(action?.fields).toHaveProperty("owner");
    const risk = items.find((item) => item.type === "RISK");
    expect(risk).toBeTruthy();
  });
});
