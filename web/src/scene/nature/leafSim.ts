// Mô phỏng lá đa rơi — hàm thuần (không three.js) để test được. FallingLeaves gọi stepLeaves mỗi khung.
// Lá sinh ra trong tán đa, rơi chậm có rung lắc, trôi theo gió (gió mạnh → bay xa hơn), nằm đất vài giây
// rồi tái sinh trên tán.
import { TREE } from "../layout";

export interface Leaf {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  /** Tốc độ rơi (m/s). */
  fall: number;
  /** Pha rung lắc + tốc độ lật (rad/s). */
  phase: number;
  spin: number;
  rx: number;
  ry: number;
  rz: number;
  /** > 0: đang nằm trên đất, đếm ngược (s). */
  rest: number;
  /** 0 xanh, 1 vàng úa. */
  tint: number;
}

export interface Wind {
  x: number;
  z: number;
  strength: number;
}

export const LEAF_TOP = 9.5;
export const LEAF_GROUND = 0.03;
const MAX_DIST = 45;

export function spawnLeaf(l: Leaf, r: () => number, anyHeight = false) {
  const a = r() * Math.PI * 2;
  const d = 1 + r() * 4.6;
  l.x = TREE.x + Math.cos(a) * d;
  l.z = TREE.z + Math.sin(a) * d;
  l.y = anyHeight ? LEAF_GROUND + r() * (LEAF_TOP - LEAF_GROUND) : 5.8 + r() * (LEAF_TOP - 5.8);
  l.vx = 0;
  l.vz = 0;
  l.fall = 0.45 + r() * 0.4;
  l.phase = r() * Math.PI * 2;
  l.spin = (r() < 0.5 ? -1 : 1) * (1.2 + r() * 2.2);
  l.rx = r() * Math.PI * 2;
  l.ry = r() * Math.PI * 2;
  l.rz = r() * Math.PI * 2;
  l.rest = 0;
  l.tint = r() < 0.35 ? 1 : r() * 0.4;
  return l;
}

export function createLeaves(n: number, r: () => number): Leaf[] {
  return Array.from({ length: n }, () => {
    const l = spawnLeaf({} as Leaf, r, true);
    // Một ít lá đã nằm sẵn dưới gốc khi vào chùa.
    if (r() < 0.2) {
      l.y = LEAF_GROUND;
      l.rest = r() * 6;
    }
    return l;
  });
}

/** Hệ số trôi: gió 0 → 1,2; gió 1 → 5 (m/s trên mỗi đơn vị gió). */
export function driftFactor(strength: number) {
  return 1.2 + 3.8 * Math.min(1, Math.max(0, strength));
}

export function stepLeaves(leaves: Leaf[], dt: number, wind: Wind, r: () => number) {
  const k = driftFactor(wind.strength);
  const blend = Math.min(1, dt * 1.6);
  for (const l of leaves) {
    if (l.rest > 0) {
      l.rest -= dt;
      if (l.rest <= 0) spawnLeaf(l, r);
      continue;
    }
    l.phase += dt * (2.2 + l.fall);
    l.vx += (wind.x * k - l.vx) * blend;
    l.vz += (wind.z * k - l.vz) * blend;
    // Rung lắc kiểu chiếc lá: lắc ngang theo pha, rơi nhanh/chậm xen kẽ.
    const sway = Math.sin(l.phase) * 0.55;
    l.x += (l.vx + Math.cos(l.ry) * sway) * dt;
    l.z += (l.vz + Math.sin(l.ry) * sway) * dt;
    l.y -= l.fall * (0.7 + 0.45 * Math.abs(Math.cos(l.phase))) * dt;
    l.rx += l.spin * dt;
    l.rz += l.spin * 0.6 * dt;
    l.ry += Math.sin(l.phase * 0.5) * dt * 0.8;
    if (l.y <= LEAF_GROUND) {
      l.y = LEAF_GROUND;
      l.rest = 2 + r() * 4;
    } else if (Math.hypot(l.x - TREE.x, l.z - TREE.z) > MAX_DIST) {
      spawnLeaf(l, r);
    }
  }
}
