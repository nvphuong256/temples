// Giờ Việt Nam (UTC+7, không có giờ mùa hè) — độc lập với múi giờ máy người dùng.
const VN_OFFSET_MS = 7 * 3600_000;

export function vnParts(now: Date = new Date()) {
  const d = new Date(now.getTime() + VN_OFFSET_MS);
  return {
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    dayKey: d.toISOString().slice(0, 10),
  };
}

/** Đêm rằm 18h–5h, ngày 5h–18h (docs/04-visual-audio.md). */
export const isNightHour = (hour: number) => hour >= 18 || hour < 5;

export function vnClockLabel(now: Date = new Date()) {
  const { hour, minute } = vnParts(now);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm} giờ VN · ${isNightHour(hour) ? "đêm" : "ngày"}`;
}
