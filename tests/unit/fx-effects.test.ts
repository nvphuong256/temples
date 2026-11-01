import { describe, expect, it } from "vitest";
import {
  FX_MAX_S,
  FxQueue,
  Slots,
  fxEnd,
  planFx,
  ringLook,
  spawnBurst,
  type BurstSpec,
  type RingSpec,
} from "../../web/src/scene/fx/effects";
import type { FxKind } from "../../web/src/scene/fx/bus";
import { ParticlePool, makeRng } from "../../web/src/scene/fx/pool";
import { BELL_TOWER, BURNER } from "../../web/src/scene/layout";

const KINDS: FxKind[] = ["incense", "bow", "mo", "beadsRound", "greet", "bell"];

describe("ritual fx plan", () => {
  it("every ritual maps to at least one effect, all ≤ 2 s", () => {
    for (const kind of KINDS) {
      const plan = planFx({ kind, x: 1, z: 2, gained: 3 });
      expect(plan.length).toBeGreaterThan(0);
      for (const s of plan) expect(fxEnd(s)).toBeLessThanOrEqual(FX_MAX_S);
    }
  });
  it("maps each event to its signature effect", () => {
    const types = (kind: FxKind) => planFx({ kind, x: 0, z: 0, gained: 0 });
    expect(types("incense").some((s) => s.type === "burst" && s.preset === "embers")).toBe(true);
    expect(types("bow").every((s) => s.type === "ring" && s.tex === "halo")).toBe(true);
    expect(types("mo")).toMatchObject([{ type: "ring", tex: "ripple" }]);
    expect(types("beadsRound")).toMatchObject([{ type: "burst", preset: "beads" }]);
    expect(types("greet")).toMatchObject([{ type: "lotus" }]);
    expect(types("bell").filter((s) => s.type === "ring" && s.tex === "wave")).toHaveLength(3);
  });
  it("incense fx sits on the burner, bell fx on the bell tower", () => {
    for (const s of planFx({ kind: "incense", x: 9, z: 9, gained: 0 })) {
      expect([s.x, s.z]).toEqual([BURNER.x, BURNER.z]);
    }
    for (const s of planFx({ kind: "bell", x: 0, z: 0, gained: 0 })) {
      expect([s.x, s.z]).toEqual([BELL_TOWER.x, BELL_TOWER.z]);
    }
  });
  it("merit glow only when merit was gained, rising from the player", () => {
    const merit = (gained: number) =>
      planFx(
        { kind: "incense", x: 0, z: 6, gained },
        { player: { x: 3, y: 0, z: 10, facing: 0 } },
      ).filter((s): s is BurstSpec => s.type === "burst" && s.preset === "merit");
    expect(merit(0)).toHaveLength(0);
    const [m] = merit(2);
    expect(m).toMatchObject({ x: 3, z: 10 });
    expect(m!.count).toBeLessThanOrEqual(10);
  });
  it("bow ring follows the floor height", () => {
    const [r] = planFx(
      { kind: "bow", x: 0, z: -18, gained: 0 },
      { groundY: () => 1 },
    ) as RingSpec[];
    expect(r!.y).toBeGreaterThan(1);
  });
  it("ring grows and fades out to zero", () => {
    const [r] = planFx({ kind: "mo", x: 0, z: 0, gained: 0 }) as RingSpec[];
    expect(ringLook(r!, 0).r).toBeCloseTo(r!.r0);
    expect(ringLook(r!, 1).r).toBeCloseTo(r!.r1);
    expect(ringLook(r!, 0).alpha).toBe(0);
    expect(ringLook(r!, 1).alpha).toBe(0);
    expect(ringLook(r!, 0.3).alpha).toBeGreaterThan(0);
  });
});

describe("fx lifecycle", () => {
  it("queue releases delayed specs on time", () => {
    const q = new FxQueue<{ delay: number; id: number }>();
    q.push(
      [
        { delay: 0, id: 1 },
        { delay: 0.5, id: 2 },
      ],
      10,
    );
    expect(q.due(10).map((s) => s.id)).toEqual([1]);
    expect(q.due(10.4)).toEqual([]);
    expect(q.due(10.5).map((s) => s.id)).toEqual([2]);
    expect(q.size).toBe(0);
  });
  it("slots expire, and overwrite the oldest when full", () => {
    const s = new Slots<{ dur: number; id: number }>(2);
    expect(s.add({ dur: 1, id: 1 }, 0)).toBe(0);
    expect(s.add({ dur: 1, id: 2 }, 0.2)).toBe(1);
    expect(s.add({ dur: 1, id: 3 }, 0.4)).toBe(0); // full → oldest (id 1)
    expect(s.progress(0, 0.9)).toBeCloseTo(0.5);
    expect(s.progress(1, 1.3)).toBeNull(); // expired, freed
    expect(s.add({ dur: 1, id: 4 }, 1.3)).toBe(1);
  });
  it("bursts spawn the requested number of particles within the pool", () => {
    const pool = new ParticlePool(16);
    const rnd = makeRng(2);
    const beads = planFx({ kind: "beadsRound", x: 0, z: 0, gained: 0 })[0] as BurstSpec;
    const idx = spawnBurst(pool, beads, rnd);
    expect(idx).toHaveLength(beads.count);
    expect(pool.aliveCount()).toBe(16); // 18 hạt vào pool 16 → tái dùng, không vượt
    for (const i of idx) expect(pool.life[i]).toBeLessThanOrEqual(2);
  });
});
