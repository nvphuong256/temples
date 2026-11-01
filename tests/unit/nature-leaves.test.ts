import { describe, expect, it } from "vitest";
import { TREE } from "../../web/src/scene/layout";
import {
  createLeaves,
  driftFactor,
  LEAF_GROUND,
  stepLeaves,
} from "../../web/src/scene/nature/leafSim";
import { rng } from "../../web/src/scene/nature/scatter";

function run(strength: number, seconds: number) {
  const r = rng(1);
  const leaves = createLeaves(40, r);
  const wind = { x: strength, z: 0, strength };
  let maxX = -Infinity;
  for (let t = 0; t < seconds; t += 1 / 30) {
    stepLeaves(leaves, 1 / 30, wind, r);
    for (const l of leaves) {
      expect(l.y).toBeGreaterThanOrEqual(LEAF_GROUND);
      maxX = Math.max(maxX, l.x - TREE.x);
    }
  }
  return { leaves, maxX };
}

describe("falling leaves", () => {
  it("spawn inside the banyan canopy", () => {
    for (const l of createLeaves(40, rng(2))) {
      expect(Math.hypot(l.x - TREE.x, l.z - TREE.z)).toBeLessThanOrEqual(5.7);
      expect(l.y).toBeLessThanOrEqual(9.5);
    }
  });

  it("stronger wind carries leaves further", () => {
    expect(driftFactor(1)).toBeGreaterThan(driftFactor(0.2));
    const calm = run(0.15, 12);
    const storm = run(1, 12);
    expect(storm.maxX).toBeGreaterThan(calm.maxX + 5);
  });

  it("leaves land, rest, and get recycled (never lost)", () => {
    const { leaves } = run(0.4, 40);
    expect(leaves).toHaveLength(40);
    expect(leaves.some((l) => l.y > 1)).toBe(true);
    for (const l of leaves) expect(Math.hypot(l.x - TREE.x, l.z - TREE.z)).toBeLessThan(46);
  });
});
