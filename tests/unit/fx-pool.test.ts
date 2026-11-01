import { describe, expect, it } from "vitest";
import { ParticlePool, fadeInOut, makeRng } from "../../web/src/scene/fx/pool";
import { MAX_STICKS, ASH_R, ASH_Y, stickSlots } from "../../web/src/scene/fx/incense";
import { BURNER } from "../../web/src/scene/layout";

describe("fx particle pool", () => {
  it("starts empty and spawns into free slots", () => {
    const p = new ParticlePool(4);
    expect(p.aliveCount()).toBe(0);
    const a = p.spawn(1);
    const b = p.spawn(1);
    expect(a).not.toBe(b);
    expect(p.aliveCount()).toBe(2);
  });
  it("never grows: when full it recycles the oldest particle", () => {
    const p = new ParticlePool(3);
    const first = p.spawn(10);
    p.tick(5); // first is now oldest
    p.spawn(10);
    p.spawn(10);
    const reused = p.spawn(10);
    expect(reused).toBe(first);
    expect(p.aliveCount()).toBe(3);
    expect(p.age[reused]).toBe(0);
  });
  it("particles die after their life and free their slot", () => {
    const p = new ParticlePool(2);
    p.spawn(0.5);
    p.tick(0.6);
    expect(p.aliveCount()).toBe(0);
  });
  it("fadeInOut is 0 at both ends, peaks at the rise point", () => {
    expect(fadeInOut(0)).toBe(0);
    expect(fadeInOut(1)).toBe(0);
    expect(fadeInOut(0.15, 0.15)).toBeCloseTo(1);
    expect(fadeInOut(0.9)).toBeLessThan(0.1);
  });
  it("rng is deterministic per seed", () => {
    const a = makeRng(5);
    const b = makeRng(5);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
});

describe("incense stick slots", () => {
  it("40 deterministic slots inside the burner mouth, tips above the ash", () => {
    const s = stickSlots();
    expect(s).toHaveLength(MAX_STICKS);
    expect(stickSlots()).toEqual(s);
    for (const k of s) {
      expect(Math.hypot(k.x, k.z)).toBeLessThanOrEqual(ASH_R + 1e-6);
      expect(k.tip[1]).toBeGreaterThan(ASH_Y + 0.9);
      expect(Math.hypot(k.tip[0] - BURNER.x, k.tip[2] - BURNER.z)).toBeLessThan(1);
    }
  });
});
