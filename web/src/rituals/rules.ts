// Luật nghi lễ phía khách (tuần 1, chưa có server). Tuần 3: TempleRoom quyết định, web chỉ hiển thị.
import { BEADS_PER_ROUND, BELL_COOLDOWN_MS, MERIT_RULES } from "@cvo/shared";

export interface DayProgress {
  day: string;
  merit: number;
  beads: number;
  bows: number;
}

export const emptyDay = (day: string): DayProgress => ({ day, merit: 0, beads: 0, bows: 0 });

/** Đổi ngày (giờ VN) → bắt đầu lại; cùng ngày → giữ. */
export function rollDay(
  saved: Partial<DayProgress> | null | undefined,
  today: string,
): DayProgress {
  if (!saved || saved.day !== today) return emptyDay(today);
  const n = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  return {
    day: today,
    merit: n(saved.merit),
    beads: Math.min(n(saved.beads), BEADS_PER_ROUND),
    bows: n(saved.bows),
  };
}

export interface RitualResult {
  next: DayProgress;
  gained: number;
}

export function incense(s: DayProgress): RitualResult {
  return { next: { ...s, merit: s.merit + MERIT_RULES.incense }, gained: MERIT_RULES.incense };
}

/** Mỗi lạy đếm một; đủ 10 lạy +1 công đức. */
export function bow(s: DayProgress): RitualResult {
  const bows = s.bows + 1;
  const gained = bows % MERIT_RULES.bowsPerMerit === 0 ? 1 : 0;
  return { next: { ...s, bows, merit: s.merit + gained }, gained };
}

export function mo(s: DayProgress, rand: number): RitualResult {
  const gained = rand < MERIT_RULES.moChance ? 1 : 0;
  return { next: { ...s, merit: s.merit + gained }, gained };
}

/** Lần một hạt; hạt thứ 108 trọn tràng +3. Đã trọn thì không đếm thêm cho tới khi làm lại. */
export function bead(s: DayProgress): RitualResult {
  if (s.beads >= BEADS_PER_ROUND) return { next: s, gained: 0 };
  const beads = s.beads + 1;
  const gained = beads === BEADS_PER_ROUND ? MERIT_RULES.beadsRound : 0;
  return { next: { ...s, beads, merit: s.merit + gained }, gained };
}

export function resetBeads(s: DayProgress): DayProgress {
  return { ...s, beads: 0 };
}

export function canRingBell(lastBellAt: number | null, now: number) {
  return lastBellAt === null || now - lastBellAt >= BELL_COOLDOWN_MS;
}
