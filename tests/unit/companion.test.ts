import { describe, expect, it } from "vitest";
import { COMPANION_LINE_MAX, COMPANION_SEED_LINES, pickCompanionLine } from "@cvo/shared";

describe("Tiểu An lines", () => {
  it("every seed line ≤ 90 chars, A Di Đà Phật only in greet/bless", () => {
    for (const l of COMPANION_SEED_LINES) {
      expect(l.text.length).toBeLessThanOrEqual(COMPANION_LINE_MAX);
      if (l.text.includes("A Di Đà Phật")) expect(["greet", "bless"]).toContain(l.state);
    }
  });
  it("each state has at least one unconditional line", () => {
    for (const st of ["greet", "guide", "bless", "meditate"] as const)
      expect(pickCompanionLine(COMPANION_SEED_LINES, st, {}, 0.5)).toBeDefined();
  });
  it("conditions filter: night-only line never picked by day, returning line only on return", () => {
    const dayPicks = new Set(
      Array.from(
        { length: 50 },
        (_, i) => pickCompanionLine(COMPANION_SEED_LINES, "greet", {}, i / 50)?.text,
      ),
    );
    expect([...dayPicks].some((t) => t?.includes("Đêm rằm"))).toBe(false);
    expect([...dayPicks].some((t) => t?.includes("quay lại"))).toBe(false);
    const night = pickCompanionLine(
      [{ state: "greet", text: "n", condition: { night: true } }],
      "greet",
      {
        night: true,
      },
    );
    expect(night?.text).toBe("n");
  });
  it("weights: rand near 0 picks the first (heaviest) line", () => {
    const lines = [
      { state: "guide", text: "a", weight: 3 },
      { state: "guide", text: "b" },
    ] as const;
    expect(pickCompanionLine(lines, "guide", {}, 0.7)?.text).toBe("a");
    expect(pickCompanionLine(lines, "guide", {}, 0.8)?.text).toBe("b");
  });
});
