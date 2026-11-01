import { describe, expect, it } from "vitest";
import {
  BOOST_S,
  SMOKE_CAP,
  SmokeSim,
  decayBoost,
  smokeRate,
} from "../../web/src/scene/fx/smokeSim";
import { makeRng } from "../../web/src/scene/fx/pool";

const TIP = [0, 2.7, 6] as const;
const look = { x: 0, y: 0, z: 0, size: 0, alpha: 0 };

function run(strength: number, seconds: number) {
  const sim = new SmokeSim();
  const rnd = makeRng(1);
  const i = sim.emit(TIP, rnd);
  const wind = { x: strength, z: 0, strength };
  for (let t = 0; t < seconds; t += 1 / 30) sim.step(1 / 30, wind);
  return { sim, i };
}

describe("incense smoke", () => {
  it("rate grows with sticks and with the post-incense boost", () => {
    expect(smokeRate(0, 0)).toBe(0);
    expect(smokeRate(9, 0)).toBeGreaterThan(smokeRate(1, 0));
    expect(smokeRate(9, 1)).toBeGreaterThan(smokeRate(9, 0) * 2);
    expect(smokeRate(400, 0)).toBe(smokeRate(40, 0));
  });
  it("boost decays to zero in BOOST_S seconds", () => {
    expect(decayBoost(1, BOOST_S / 2)).toBeCloseTo(0.5);
    expect(decayBoost(1, BOOST_S + 1)).toBe(0);
  });
  it("puffs rise, grow and thin out", () => {
    const { sim, i } = run(0, 0.5);
    const early = { ...sim.look(i, look) };
    for (let t = 0; t < 3.5; t += 1 / 30) sim.step(1 / 30, { x: 0, z: 0, strength: 0 });
    const late = sim.look(i, look);
    expect(late.y).toBeGreaterThan(early.y + 1.5);
    expect(late.size).toBeGreaterThan(early.size * 2);
    expect(late.alpha).toBeLessThan(early.alpha);
  });
  it("stronger wind bends the column further downwind", () => {
    const calm = run(0.1, 3);
    const gale = run(1, 3);
    expect(gale.sim.pool.px[gale.i]! - TIP[0]).toBeGreaterThan(
      2 * (calm.sim.pool.px[calm.i]! - TIP[0]),
    );
    expect(gale.sim.pool.py[gale.i]!).toBeLessThan(calm.sim.pool.py[calm.i]!);
  });
  it("pool stays fixed under heavy emission", () => {
    const sim = new SmokeSim();
    sim.boost = 1;
    const rnd = makeRng(3);
    for (let k = 0; k < 600; k++) {
      sim.emitByRate(1 / 30, 40, () => TIP, rnd);
      sim.step(1 / 30, { x: 0, z: 0, strength: 0.3 });
    }
    expect(sim.pool.cap).toBe(SMOKE_CAP);
    expect(sim.pool.aliveCount()).toBeLessThanOrEqual(SMOKE_CAP);
    expect(sim.boost).toBe(0);
  });
});
