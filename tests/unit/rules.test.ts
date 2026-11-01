import { describe, expect, it } from "vitest";
import { BEADS_PER_ROUND, BELL_COOLDOWN_MS } from "@cvo/shared";
import * as r from "../../web/src/rituals/rules";

const day = r.emptyDay("2026-11-01");

describe("ritual rules (client, week 1)", () => {
  it("incense +1", () => {
    expect(r.incense(day)).toEqual({ next: { ...day, merit: 1 }, gained: 1 });
  });
  it("bow: +1 merit every 10 bows", () => {
    let s = day;
    for (let i = 0; i < 9; i++) s = r.bow(s).next;
    expect(s.merit).toBe(0);
    const t = r.bow(s);
    expect(t.gained).toBe(1);
    expect(t.next).toMatchObject({ bows: 10, merit: 1 });
  });
  it("mo: 20 % chance", () => {
    expect(r.mo(day, 0.19).gained).toBe(1);
    expect(r.mo(day, 0.2).gained).toBe(0);
  });
  it("beads: 108th bead +3, no counting past 108, reset keeps merit", () => {
    let s = day;
    for (let i = 0; i < BEADS_PER_ROUND - 1; i++) s = r.bead(s).next;
    expect(s).toMatchObject({ beads: 107, merit: 0 });
    const done = r.bead(s);
    expect(done.gained).toBe(3);
    expect(done.next).toMatchObject({ beads: 108, merit: 3 });
    expect(r.bead(done.next).next).toBe(done.next);
    expect(r.resetBeads(done.next)).toMatchObject({ beads: 0, merit: 3 });
  });
  it("bell cooldown 20 s", () => {
    expect(r.canRingBell(null, 1000)).toBe(true);
    expect(r.canRingBell(1000, 1000 + BELL_COOLDOWN_MS - 1)).toBe(false);
    expect(r.canRingBell(1000, 1000 + BELL_COOLDOWN_MS)).toBe(true);
  });
  it("rollDay: new day resets, same day keeps and sanitizes", () => {
    expect(r.rollDay({ day: "2026-10-31", merit: 9, beads: 9, bows: 9 }, "2026-11-01")).toEqual(
      day,
    );
    expect(
      r.rollDay({ day: "2026-11-01", merit: 2.7, beads: 500, bows: -3 }, "2026-11-01"),
    ).toEqual({
      day: "2026-11-01",
      merit: 2,
      beads: 108,
      bows: 0,
    });
    expect(r.rollDay(null, "2026-11-01")).toEqual(day);
  });
});
