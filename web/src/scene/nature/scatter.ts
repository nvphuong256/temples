// Bố trí cây cỏ sân vườn — hàm thuần (không three.js) để test được.
// Sân lát đá (PAVED) là vùng đi lại chính; trang trí chỉ đặt trên bãi cỏ, tránh ao, gốc đa, gác chuông.
// Không đổi va chạm: decor chỉ để nhìn (raycast tắt), người vẫn đi theo layout.ts.
import { BELL_TOWER, BURNER, GATE_Z, HALL, POND, TREE, type XZ } from "../layout";

/** PRNG xác định (mulberry32): mọi máy cùng thấy một khu vườn. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RoundRect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Bán kính bo góc. */
  r: number;
}
export interface Disc {
  x: number;
  z: number;
  r: number;
}

const hallFront = HALL.z + HALL.d / 2;

/** Sân lát đá bo tròn: trục thần đạo, sân lư hương, thềm chính điện, thềm tam quan, lối vào ngoài cổng. */
export const PAVED_RECTS: readonly RoundRect[] = [
  { x0: -5.5, x1: 5.5, z0: hallFront - 1, z1: GATE_Z + 1, r: 1.5 },
  { x0: -16.5, x1: 16.5, z0: HALL.z - HALL.d / 2 - 5, z1: hallFront + 3.2, r: 2.5 },
  { x0: -10, x1: 10, z0: GATE_Z - 3, z1: GATE_Z + 3, r: 2 },
  { x0: -4, x1: 4, z0: GATE_Z + 2, z1: 59, r: 1.5 },
];
export const PAVED_DISCS: readonly Disc[] = [
  { x: BURNER.x, z: BURNER.z, r: 8.5 },
  { x: BELL_TOWER.x, z: BELL_TOWER.z, r: 3.4 },
];

function inRoundRect(p: XZ, s: RoundRect, m: number) {
  const x0 = s.x0 - m;
  const x1 = s.x1 + m;
  const z0 = s.z0 - m;
  const z1 = s.z1 + m;
  if (p.x < x0 || p.x > x1 || p.z < z0 || p.z > z1) return false;
  const r = s.r + m;
  const cx = Math.min(Math.max(p.x, x0 + r), x1 - r);
  const cz = Math.min(Math.max(p.z, z0 + r), z1 - r);
  return Math.hypot(p.x - cx, p.z - cz) <= r;
}

export function isPaved(p: XZ, margin = 0) {
  return (
    PAVED_RECTS.some((s) => inRoundRect(p, s, margin)) ||
    PAVED_DISCS.some((d) => Math.hypot(p.x - d.x, p.z - d.z) <= d.r + margin)
  );
}

/** Trong tường bao (bãi cỏ trong sân) hoặc dải cỏ ngoài cổng dọc lối vào. */
export function isGardenArea(p: XZ) {
  const inYard = Math.abs(p.x) < 26.2 && p.z > -39.3 && p.z < GATE_Z - 0.6;
  const outside = Math.abs(p.x) < 30 && p.z > GATE_Z + 0.8 && p.z < 60;
  return inYard || outside;
}

/** Ô cấm đặt trang trí (ngoài sân lát): ao, gốc đa, gác chuông, nền chính điện. */
export function isBlocked(p: XZ, margin = 0.6) {
  if (isPaved(p, margin)) return true;
  if (Math.hypot(p.x - POND.x, p.z - POND.z) < POND.r + 1.1 + margin) return true;
  if (Math.hypot(p.x - TREE.x, p.z - TREE.z) < 3.2 + margin) return true;
  if (Math.hypot(p.x - BELL_TOWER.x, p.z - BELL_TOWER.z) < 3.4 + margin) return true;
  if (Math.abs(p.x) < HALL.w / 2 + 1.5 && p.z < hallFront + 1 && p.z > HALL.z - HALL.d / 2 - 1)
    return true;
  return false;
}

/** Vùng đi lại chính tuyệt đối không được có vật trang trí (dùng cho test và kiểm tra). */
export function isMainWalkway(p: XZ) {
  if (Math.abs(p.x) < 4.5 && p.z > hallFront - 1 && p.z < 59) return true; // lối giữa + bậc
  if (Math.hypot(p.x - BURNER.x, p.z - BURNER.z) < 4) return true; // quanh lư hương
  if (Math.abs(p.x) < 9 && Math.abs(p.z - GATE_Z) < 2) return true; // cổng
  return false;
}

export interface Spot extends XZ {
  /** Tỉ lệ 0..1 ngẫu nhiên. */
  s: number;
  /** Góc xoay quanh trục y. */
  a: number;
}

/** Rải n điểm trên bãi cỏ, cách nhau tối thiểu `minGap`. */
export function scatter(n: number, seed: number, minGap = 0, margin = 0.6): Spot[] {
  const r = rng(seed);
  const out: Spot[] = [];
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    // 70% trong sân, 30% ngoài cổng (dọc lối vào, nơi người chơi xuất hiện).
    const p =
      r() < 0.7
        ? { x: -26 + r() * 52, z: -39 + r() * 62.5 }
        : { x: -30 + r() * 60, z: GATE_Z + 1 + r() * 35 };
    if (!isGardenArea(p) || isBlocked(p, margin)) continue;
    if (minGap > 0 && out.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < minGap)) continue;
    out.push({ ...p, s: r(), a: r() * Math.PI * 2 });
  }
  return out;
}

/** Điểm ven mép sân lát (ngoài viền 0,9–1,6 m) để cỏ mọc dày dọc lối đi. */
export function borderSpots(n: number, seed: number): Spot[] {
  const r = rng(seed);
  const out: Spot[] = [];
  for (let tries = 0; out.length < n && tries < n * 80; tries++) {
    const p = { x: -27 + r() * 54, z: -40 + r() * 100 };
    if (!isGardenArea(p) || isBlocked(p, 0.9) || !isPaved(p, 1.6)) continue;
    out.push({ ...p, s: r(), a: r() * Math.PI * 2 });
  }
  return out;
}

/** Bụi cây + dương xỉ dọc chân tường bao (trong sân), xen kẽ. */
export function wallPlantSpots(seed: number): { bush: Spot[]; fern: Spot[] } {
  const r = rng(seed);
  const line: XZ[] = [];
  for (let z = -37.5; z <= 21.5; z += 3.9) {
    line.push({ x: -25.4, z });
    line.push({ x: 25.4, z });
  }
  for (let x = -24; x <= 24; x += 3.9) line.push({ x, z: -38.6 });
  for (const sx of [-1, 1]) for (let x = 15.5; x <= 24; x += 3) line.push({ x: sx * x, z: 22.8 });
  const bush: Spot[] = [];
  const fern: Spot[] = [];
  line.forEach((p, i) => {
    const q = { x: p.x + (r() - 0.5) * 0.8, z: p.z + (r() - 0.5) * 0.8 };
    const spot = { ...q, s: r(), a: r() * Math.PI * 2 };
    if (isBlocked(q, 0.3) || nearBamboo(q, 2.6)) return;
    (i % 3 === 1 ? fern : bush).push(spot);
  });
  return { bush, fern };
}

/** Khóm tre bốn góc sân. */
export const BAMBOO_CLUMPS: readonly XZ[] = [
  { x: -23.2, z: -35.8 },
  { x: 23.2, z: -35.8 },
  { x: -23.4, z: 20.6 },
  { x: 23.4, z: 20.6 },
];
function nearBamboo(p: XZ, r: number) {
  return BAMBOO_CLUMPS.some((b) => Math.hypot(b.x - p.x, b.z - p.z) < r);
}

/** Hai chậu cây cảnh hai bên bậc chính điện (ngoài bề ngang bậc |x| < 5). */
export const POTS: readonly XZ[] = [
  { x: -7.2, z: hallFront + 1.6 },
  { x: 7.2, z: hallFront + 1.6 },
];
