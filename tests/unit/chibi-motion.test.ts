import { describe, expect, it } from "vitest";
import * as M from "../../web/src/scene/chibi/motion";

const CYCLE = 2.4;

function run(pose: M.ChibiPose, seconds: number, moving = false, dt = 1 / 30) {
  const life = M.newLife(0.5);
  const j = M.newJoints();
  let t = 0;
  let minHead = Infinity;
  for (let s = 0; s < seconds; s += dt) {
    t += dt;
    M.stepLife(life, { pose, poseT: t, moving, lookYaw: null }, dt, 0.5);
    M.solvePose(life, pose, t, CYCLE, j);
    minHead = Math.min(minHead, M.headHeight(j));
  }
  return { life, j, minHead };
}

describe("chibi blink schedule", () => {
  it("blinks every 2–5.5 s for 0.13 s, sometimes twice", () => {
    const b = M.newBlink(0, 0.5);
    expect(M.stepBlink(b, b.next, 0.5)).toBe(true);
    const at = b.until - M.BLINK_S;
    expect(b.next - at).toBeGreaterThanOrEqual(2);
    expect(b.next - at).toBeLessThanOrEqual(5.5);
    expect(M.stepBlink(b, at + M.BLINK_S + 0.01, 0.5)).toBe(false);
    const d = M.newBlink(0, 0);
    M.stepBlink(d, d.next, 0.05);
    expect(d.next - (d.until - M.BLINK_S)).toBeCloseTo(0.32);
  });
  it("eyes closed while meditating", () => {
    expect(run("sit", 3).j.eyesClosed).toBe(true);
  });
});

describe("chibi poses", () => {
  it("approach converges independent of frame rate", () => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < 30; i++) a = M.approach(a, 1, 5, 1 / 30);
    for (let i = 0; i < 120; i++) b = M.approach(b, 1, 5, 1 / 120);
    expect(a).toBeCloseTo(b, 6);
  });
  it("counts one bow per cycle", () => {
    expect(M.bowCyclesDone(2.3, 2.5, CYCLE)).toBe(1);
    expect(M.bowCyclesDone(0.1, 0.2, CYCLE)).toBe(0);
  });
  it("bow curve raises hands, bows, then rises back", () => {
    expect(M.bowCurve(0.15).raise).toBeGreaterThan(0.8);
    expect(M.bowCurve(0.6).pitch).toBeCloseTo(1);
    expect(M.bowCurve(0).pitch).toBe(0);
    expect(M.bowCurve(0.999).pitch).toBeLessThan(0.01);
  });
  it("kneels on the cushion and never puts the head on the floor", () => {
    const { j, minHead } = run("bow", CYCLE * 3);
    expect(j.feetVisible).toBe(false);
    expect(j.skirtY).toBeCloseTo(M.BODY.seatH, 2);
    // Tâm đầu luôn cao hơn bán kính đầu + mặt bồ đoàn → không cắm đầu xuống đất.
    expect(minHead).toBeGreaterThan(M.BODY.headR + M.BODY.seatH + 0.1);
    expect(minHead).toBeLessThan(1.2); // nhưng cúi thật
  });
  it("sits lower than kneeling, with joined hands in the lap", () => {
    const sit = run("sit", 3).j;
    const kneel = run("bow", 0.1 + CYCLE).j;
    expect(sit.waistY).toBeLessThan(kneel.waistY);
    expect(sit.join).toBeGreaterThan(0.9);
    expect(sit.palmY).toBeLessThan(0.1);
    expect(sit.cushionVisible).toBe(true);
  });
  it("waddles while walking: bob, sway and alternating feet", () => {
    const life = M.newLife(0);
    const j = M.newJoints();
    let maxRoll = 0;
    let minRoll = 0;
    let maxBob = 0;
    for (let i = 0; i < 60; i++) {
      M.stepLife(life, { pose: "idle", poseT: i / 30, moving: true, lookYaw: null }, 1 / 30, 0.5);
      M.solvePose(life, "idle", i / 30, CYCLE, j);
      maxRoll = Math.max(maxRoll, j.rootRoll);
      minRoll = Math.min(minRoll, j.rootRoll);
      maxBob = Math.max(maxBob, j.rootY);
      expect(j.footLiftL * j.footLiftR).toBe(0); // một chân nhấc thì chân kia chạm đất
    }
    expect(maxRoll).toBeGreaterThan(0.05);
    expect(minRoll).toBeLessThan(-0.05);
    expect(maxBob).toBeGreaterThan(0.04);
  });
  it("greet joins hands then releases", () => {
    expect(run("greet", 0.6).j.join).toBeGreaterThan(0.9);
    expect(run("greet", 0.6).j.torsoPitch).toBeGreaterThan(0.2);
  });
});

describe("chibi look-at and LOD", () => {
  it("turns head toward a near target, clamped, ignores far", () => {
    expect(M.lookYawTo(1, 2, 0)).toBeCloseTo(Math.atan2(1, 2));
    expect(M.lookYawTo(5, 0, 0)).toBe(M.LOOK_MAX);
    expect(M.lookYawTo(0, 20, 0)).toBeNull();
    expect(M.lookYawTo(0, -1, Math.PI)).toBeCloseTo(0);
  });
  it("switches LOD with hysteresis", () => {
    expect(M.pickLod(26 ** 2, 0)).toBe(0);
    expect(M.pickLod(28 ** 2, 0)).toBe(1);
    expect(M.pickLod(24 ** 2, 1)).toBe(1);
    expect(M.pickLod(22 ** 2, 1)).toBe(0);
  });
});
