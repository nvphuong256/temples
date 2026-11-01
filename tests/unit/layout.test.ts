import { describe, expect, it } from "vitest";
import { INCENSE_RANGE_M } from "@cvo/shared";
import * as L from "../../web/src/scene/layout";

describe("temple layout", () => {
  it("8 cushions inside the hall", () => {
    expect(L.CUSHIONS).toHaveLength(8);
    for (const c of L.CUSHIONS) expect(L.isInHall(c)).toBe(true);
  });
  it("clampPos keeps player inside walls and out of the burner, pond, tree", () => {
    expect(L.clampPos({ x: 99, z: -99 })).toEqual({ x: 26, z: -37 });
    const b = L.clampPos({ x: L.BURNER.x + 0.3, z: L.BURNER.z });
    expect(Math.hypot(b.x - L.BURNER.x, b.z - L.BURNER.z)).toBeCloseTo(1.6);
    const p = L.clampPos({ x: L.POND.x, z: L.POND.z + 1 });
    expect(Math.hypot(p.x - L.POND.x, p.z - L.POND.z)).toBeCloseTo(L.POND.r + 0.6);
    const t = L.clampPos({ x: L.TREE.x + 0.5, z: L.TREE.z });
    expect(Math.hypot(t.x - L.TREE.x, t.z - L.TREE.z)).toBeCloseTo(2);
  });
  it("cannot walk behind the altar", () => {
    const p = L.clampPos({ x: 0, z: L.HALL.z - 8 });
    expect(p.z).toBe(L.HALL.z - 6.5);
  });
  it("ground height: hall floor 1 m, step 0.5 m, yard 0", () => {
    expect(L.groundHeight({ x: 0, z: L.HALL.z })).toBe(1);
    expect(L.groundHeight({ x: 0, z: L.HALL.z + L.HALL.d / 2 + 2 })).toBe(0.5);
    expect(L.groundHeight(L.BURNER)).toBe(0);
  });
  it("incense spot is at range, on the player's side", () => {
    const s = L.incenseSpot({ x: 0, z: 20 }, INCENSE_RANGE_M);
    expect(s.x).toBeCloseTo(0);
    expect(s.z).toBeCloseTo(L.BURNER.z + INCENSE_RANGE_M);
  });
  it("nearest free cushion skips taken ones", () => {
    expect(L.nearestFreeCushion({ x: -7, z: L.HALL.z + 5 }, new Set())).toBe(0);
    expect(L.nearestFreeCushion({ x: -7, z: L.HALL.z + 5 }, new Set([0]))).toBe(1);
    expect(L.nearestFreeCushion({ x: 0, z: 0 }, new Set([0, 1, 2, 3, 4, 5, 6, 7]))).toBe(-1);
  });
});

describe("steerAround", () => {
  it("walking straight from the gate to a cushion reaches the hall instead of sticking at the burner", () => {
    const p = { x: 0, z: 20 };
    const target = L.CUSHIONS[3]!;
    for (let i = 0; i < 2000; i++) {
      const dx = target.x - p.x;
      const dz = target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.35) break;
      const s = L.steerAround(p, dx / d, dz / d);
      p.x += s.dx * 0.05;
      p.z += s.dz * 0.05;
      L.clampPos(p);
    }
    expect(Math.hypot(p.x - target.x, p.z - target.z)).toBeLessThan(0.35);
  });
  it("leaves direction untouched far from obstacles", () => {
    expect(L.steerAround({ x: 0, z: 40 }, 0, -1)).toEqual({ dx: 0, dz: -1 });
  });
});
