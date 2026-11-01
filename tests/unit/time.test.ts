import { describe, expect, it } from "vitest";
import { isNightHour, vnClockLabel, vnParts } from "../../web/src/lib/time";

describe("VN time", () => {
  it("converts UTC to UTC+7 and day key", () => {
    const d = new Date("2026-11-01T17:30:00Z"); // 00:30 ngày 02/11 giờ VN
    expect(vnParts(d)).toEqual({ hour: 0, minute: 30, dayKey: "2026-11-02" });
    expect(vnClockLabel(d)).toBe("00:30 giờ VN · đêm");
  });
  it("night 18h–5h", () => {
    expect(isNightHour(17)).toBe(false);
    expect(isNightHour(18)).toBe(true);
    expect(isNightHour(4)).toBe(true);
    expect(isNightHour(5)).toBe(false);
  });
});
