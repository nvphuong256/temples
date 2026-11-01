// Bố cục chùa (nội công ngoại quốc) — tọa độ theo nguyên mẫu docs/prototype/chua-viet-online.html.
// Hàm thuần (không three.js) để test được.
export interface XZ {
  x: number;
  z: number;
}

export const GATE_Z = 24;
export const HALL = { x: 0, z: -22, w: 26, d: 18, floorH: 1 } as const;
export const BURNER = { x: 0, z: 6 } as const;
export const POND = { x: -19, z: 12, r: 7 } as const;
export const TREE = { x: 19, z: 12 } as const;
export const BELL_TOWER = { x: 14, z: -4 } as const;
export const SPAWN = { x: 0, z: 46 } as const;
export const TIEU_AN = { x: 4.6, z: 27.5 } as const;

/** 8 chiếu lễ trong chính điện. */
export const CUSHIONS: readonly XZ[] = Array.from({ length: 8 }, (_, i) => ({
  x: -7 + i * 2,
  z: HALL.z + 3.2,
}));

export interface ColumnSpec {
  x: number;
  z: number;
  h: number;
}
export const COLUMNS: readonly ColumnSpec[] = [
  ...[-7, -2.4, 2.4, 7].map((x) => ({ x, z: GATE_Z, h: 6 })),
  ...Array.from({ length: 5 }, (_, i) => ({
    x: -HALL.w / 2 + 1 + i * ((HALL.w - 2) / 4),
    z: HALL.z + HALL.d / 2 - 1.2,
    h: 7,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    x: -HALL.w / 2 + 1 + i * ((HALL.w - 2) / 4),
    z: HALL.z - HALL.d / 2 + 1.2,
    h: 7,
  })),
  { x: -HALL.w / 2 + 1, z: HALL.z, h: 7 },
  { x: HALL.w / 2 - 1, z: HALL.z, h: 7 },
  ...[-1.2, 1.2].flatMap((dx) =>
    [-1.2, 1.2].map((dz) => ({ x: BELL_TOWER.x + dx, z: BELL_TOWER.z + dz, h: 4.5 })),
  ),
];

const hallFront = HALL.z + HALL.d / 2;
const hallBack = HALL.z - HALL.d / 2;

export function isInHall(p: XZ) {
  return p.z < hallFront + 1 && p.z > hallBack && Math.abs(p.x - HALL.x) < HALL.w / 2;
}

/** Độ cao mặt sàn: nền chính điện cao 1 m, bậc thềm 0,5 m. */
export function groundHeight(p: XZ) {
  if (Math.abs(p.x) < HALL.w / 2 + 1 && p.z < hallFront + 1 && p.z > hallBack - 1)
    return HALL.floorH;
  if (Math.abs(p.x) < 5 && p.z < hallFront + 2.8 && p.z >= hallFront + 1) return HALL.floorH / 2;
  return 0;
}

function pushOut(p: XZ, cx: number, cz: number, r: number) {
  const d = Math.hypot(p.x - cx, p.z - cz);
  if (d < r && d > 1e-6) {
    p.x = cx + ((p.x - cx) / d) * r;
    p.z = cz + ((p.z - cz) / d) * r;
  }
}

/** Giữ người trong tường bao, không đi xuyên lư hương, ao sen, gốc đa, tượng Phật. Sửa tại chỗ. */
export function clampPos<T extends XZ>(p: T): T {
  p.x = Math.max(-26, Math.min(26, p.x));
  p.z = Math.max(-37, Math.min(60, p.z));
  if (isInHall(p)) {
    p.z = Math.max(p.z, HALL.z - 6.5);
    p.x = Math.max(-HALL.w / 2 + 1.2, Math.min(HALL.w / 2 - 1.2, p.x));
  }
  pushOut(p, BURNER.x, BURNER.z, 1.6);
  pushOut(p, POND.x, POND.z, POND.r + 0.6);
  pushOut(p, TREE.x, TREE.z, 2);
  return p;
}

/** Điểm đứng thắp hương: cách lư hương INCENSE_RANGE, phía người đang đứng. */
export function incenseSpot(p: XZ, range: number): XZ {
  const a = Math.atan2(p.x - BURNER.x, p.z - BURNER.z);
  return { x: BURNER.x + Math.sin(a) * range, z: BURNER.z + Math.cos(a) * range };
}

export function nearestFreeCushion(p: XZ, taken: ReadonlySet<number>): number {
  let best = -1;
  let bestD = Infinity;
  CUSHIONS.forEach((c, i) => {
    if (taken.has(i)) return;
    const d = Math.hypot(c.x - p.x, c.z - p.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

const OBSTACLES = [
  { x: BURNER.x, z: BURNER.z, r: 1.6 },
  { x: POND.x, z: POND.z, r: POND.r + 0.6 },
  { x: TREE.x, z: TREE.z, r: 2 },
] as const;

/**
 * Lái hướng đi (dx, dz) vòng qua vật cản tròn: gần vật cản mà đang hướng vào tâm thì bỏ thành phần
 * hướng vào, trượt theo tiếp tuyến (về phía hướng ban đầu lệch sang). Giữ nguyên độ dài vector.
 */
export function steerAround(p: XZ, dx: number, dz: number): { dx: number; dz: number } {
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) return { dx, dz };
  let x = dx;
  let z = dz;
  for (const o of OBSTACLES) {
    const ox = p.x - o.x;
    const oz = p.z - o.z;
    const d = Math.hypot(ox, oz);
    if (d > o.r + 1 || d < 1e-6) continue;
    const nx = ox / d;
    const nz = oz / d;
    const dot = x * nx + z * nz;
    if (dot >= 0) continue;
    x -= dot * nx;
    z -= dot * nz;
    if (Math.hypot(x, z) < 0.15 * len) {
      // Đi thẳng vào tâm: chọn một tiếp tuyến cố định.
      x = -nz;
      z = nx;
    }
  }
  const l = Math.hypot(x, z);
  return { dx: (x / l) * len, dz: (z / l) * len };
}
