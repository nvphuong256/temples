import { afterEach, describe, expect, it } from "vitest";
import {
  blockOf,
  currentWeather,
  skyPhase,
  vnDayKey,
  vnHourFloat,
  weatherDebug,
  weatherFor,
  weatherLabel,
  windWord,
  type WeatherKind,
} from "../../web/src/lib/weather";

const days = (n: number, start = Date.UTC(2026, 0, 1)) =>
  Array.from({ length: n }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));

afterEach(() => {
  weatherDebug.force = null;
});

describe("weather — deterministic by VN time", () => {
  it("same day + block gives the same weather everywhere", () => {
    const a = weatherFor("2026-11-01", 11.2);
    const b = weatherFor("2026-11-01", 13.9); // cùng khối 11–14h
    expect(b).toEqual(a);
    expect(weatherFor("2026-11-01", 11.2)).toEqual(a);
  });

  it("uses VN time, not the device time zone", () => {
    const d = new Date("2026-11-01T23:30:00Z"); // 06:30 ngày 02/11 giờ VN
    expect(vnDayKey(d)).toBe("2026-11-02");
    expect(vnHourFloat(d)).toBeCloseTo(6.5);
    expect(currentWeather(d)).toEqual(weatherFor("2026-11-02", 6.5));
  });

  it("blocks: 0,5,8,11,14,17,20", () => {
    expect([0, 4.99, 5, 7.9, 8, 13, 19.5, 23.9].map(blockOf)).toEqual([0, 0, 1, 1, 2, 3, 5, 6]);
  });

  it("clear is most common; every kind appears; mist only 5–8h", () => {
    const count: Record<WeatherKind, number> = { clear: 0, cloudy: 0, drizzle: 0, mist: 0 };
    for (const day of days(730)) {
      for (let h = 0; h < 24; h += 1) {
        const w = weatherFor(day, h + 0.5);
        count[w.kind]++;
        if (w.kind === "mist") {
          expect(h).toBeGreaterThanOrEqual(5);
          expect(h).toBeLessThan(8);
        }
      }
    }
    const total = 730 * 24;
    expect(count.clear).toBeGreaterThan(count.cloudy);
    expect(count.clear).toBeGreaterThan(count.drizzle);
    expect(count.clear / total).toBeGreaterThan(0.4);
    expect(count.drizzle / total).toBeGreaterThan(0.08);
    expect(count.drizzle / total).toBeLessThan(0.3);
    expect(count.mist).toBeGreaterThan(0);
  });

  it("early morning is often misty", () => {
    const mist = days(365).filter((d) => weatherFor(d, 6).kind === "mist").length;
    expect(mist / 365).toBeGreaterThan(0.35);
    expect(mist / 365).toBeLessThan(0.65);
  });

  it("drizzle is more frequent in spring (Jan–Apr) in the north", () => {
    const rate = (start: number) =>
      days(100, start).filter((d) => weatherFor(d, 12).kind === "drizzle").length;
    expect(rate(Date.UTC(2026, 0, 5))).toBeGreaterThan(rate(Date.UTC(2026, 6, 1)));
  });

  it("wind is in range and calmer in mist", () => {
    for (const d of days(200)) {
      for (const h of [3, 6, 12, 18]) {
        const w = weatherFor(d, h);
        expect(w.baseStrength).toBeGreaterThanOrEqual(0);
        expect(w.baseStrength).toBeLessThanOrEqual(1);
        expect(Number.isFinite(w.dir)).toBe(true);
        if (w.kind === "mist") expect(w.baseStrength).toBeLessThan(0.2);
        if (w.kind === "drizzle") expect(w.rain).toBe(1);
      }
    }
  });

  it("debug override forces a kind", () => {
    weatherDebug.force = "drizzle";
    expect(currentWeather(new Date("2026-07-01T05:00:00Z")).kind).toBe("drizzle");
    expect(weatherFor("2026-07-01", 12, "mist").kind).toBe("mist");
  });
});

describe("weather — labels", () => {
  it("Vietnamese HUD chip", () => {
    expect(weatherLabel({ kind: "clear", baseStrength: 0.3 }, false)).toBe("Nắng · gió nhẹ");
    expect(weatherLabel({ kind: "drizzle", baseStrength: 0.5 }, false)).toBe("Mưa phùn · gió vừa");
    expect(weatherLabel({ kind: "mist", baseStrength: 0.1 }, false)).toBe("Sương sớm");
    expect(weatherLabel({ kind: "cloudy", baseStrength: 0.7 }, true)).toBe("Nhiều mây · gió mạnh");
    expect(weatherLabel({ kind: "clear", baseStrength: 0.1 }, true)).toBe("Trời quang · lặng gió");
    expect(windWord(0.41)).toBe("gió nhẹ");
  });
});

describe("weather — sky phase", () => {
  it("day/night with smooth dawn (5h) and dusk (18h)", () => {
    expect(skyPhase(12).daylight).toBe(1);
    expect(skyPhase(0).daylight).toBe(0);
    expect(skyPhase(21).daylight).toBe(0);
    const dawn = skyPhase(5.1).daylight;
    expect(dawn).toBeGreaterThan(0.2);
    expect(dawn).toBeLessThan(0.9);
    const dusk = skyPhase(18).daylight;
    expect(dusk).toBeGreaterThan(0.1);
    expect(dusk).toBeLessThan(0.8);
    expect(skyPhase(5.6).golden).toBeGreaterThan(0.8);
    expect(skyPhase(17.6).golden).toBeGreaterThan(0.8);
    expect(skyPhase(12).golden).toBe(0);
  });

  it("sun high at noon, moon up at night, unit vectors", () => {
    const noon = skyPhase(11.5);
    expect(noon.sun[1]).toBeGreaterThan(0.8);
    expect(skyPhase(23.5).moon[1]).toBeGreaterThan(0.25);
    for (const h of [5, 9, 15, 19, 2]) {
      const p = skyPhase(h);
      expect(Math.hypot(...p.sun)).toBeCloseTo(1);
      expect(Math.hypot(...p.moon)).toBeCloseTo(1);
    }
  });
});
