import { describe, expect, it } from "vitest";
import * as L from "../../web/src/scene/layout";
import * as S from "../../web/src/scene/nature/scatter";
import { COUNTS } from "../../web/src/scene/nature/geometries";

describe("nature layout (garden decor placement)", () => {
  it("rng is deterministic and in [0, 1)", () => {
    const a = S.rng(5);
    const b = S.rng(5);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("main walkways, gate, burner and hall steps are paved", () => {
    for (const p of [
      { x: 0, z: 40 },
      { x: 0, z: 24 },
      { x: 3, z: 6 },
      { x: 0, z: -11 },
      { x: 4, z: 15 },
    ])
      expect(S.isPaved(p)).toBe(true);
    expect(S.isPaved({ x: -15, z: 0 })).toBe(false);
  });

  it("scattered decor stays off the main walkways, pond, tree and hall", () => {
    const spots = [
      ...S.scatter(COUNTS.tufts, 101),
      ...S.scatter(COUNTS.flowersYellow + COUNTS.flowersWhite, 202, 0.5),
      ...S.scatter(COUNTS.pebbles, 303, 0.8, 0.9),
    ];
    expect(spots.length).toBeGreaterThan(COUNTS.tufts * 0.95);
    for (const p of spots) {
      expect(S.isMainWalkway(p)).toBe(false);
      expect(S.isGardenArea(p)).toBe(true);
      expect(Math.hypot(p.x - L.POND.x, p.z - L.POND.z)).toBeGreaterThan(L.POND.r + 1);
      expect(Math.hypot(p.x - L.TREE.x, p.z - L.TREE.z)).toBeGreaterThan(3);
      expect(L.isInHall(p)).toBe(false);
    }
  });

  it("wall plants, bamboo and pots avoid the walkways", () => {
    const { bush, fern } = S.wallPlantSpots(404);
    expect(bush.length).toBeGreaterThan(10);
    expect(fern.length).toBeGreaterThan(5);
    for (const p of [...bush, ...fern, ...S.BAMBOO_CLUMPS, ...S.POTS]) {
      expect(S.isMainWalkway(p)).toBe(false);
      expect(Math.abs(p.x)).toBeLessThan(26);
    }
    // Chậu cảnh ngoài bề ngang bậc (|x| < 5) và không làm thay đổi va chạm.
    for (const p of S.POTS) {
      expect(Math.abs(p.x)).toBeGreaterThan(5.5);
      expect(L.clampPos({ ...p })).toEqual(p);
    }
  });
});
