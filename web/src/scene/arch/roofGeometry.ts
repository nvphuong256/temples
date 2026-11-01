// Mái chibi Bắc Bộ: mái chảy cong lõm (ngói mũi hài), bốn góc cong vút, viền mái tròn chạy theo mép,
// bờ dải + bờ nóc mập, đầu đao xoắn men xanh ngọc, lưỡng long chầu nguyệt cách điệu tròn trịa.
// Trả về geometry gộp theo vật liệu (5 draw call / mái).
import * as THREE from "three";
import { merge, sweep, xf } from "./geom";

export interface RoofOpts {
  /** Kích thước khung (không kể chìa mái). */
  w: number;
  d: number;
  /** Chiều cao mái nếu đủ tới nóc. */
  h: number;
  /** Độ cong vút ở góc (m). */
  curl: number;
  /** Mái chìa ra ngoài khung. */
  over?: number;
  /** < 1: chỉ dựng phần dưới (tầng mái dưới của mái chồng diêm). */
  skirt?: number;
  /** Có lưỡng long chầu nguyệt trên bờ nóc. */
  /** Lưỡng long chầu nguyệt trên bờ nóc; "moon" = chỉ ngọc lửa (mái nhỏ, tiết kiệm tam giác). */
  ornate?: boolean | "moon";
  /** Bỏ đầu đao ở hai góc phía x = dấu này (góc áp vào gian giữa của tam quan). */
  skipDaoX?: 1 | -1;
}

export interface RoofParts {
  tiles: THREE.BufferGeometry;
  under: THREE.BufferGeometry;
  edge: THREE.BufferGeometry;
  ceramic: THREE.BufferGeometry;
  gold: THREE.BufferGeometry;
}

// Một ô texture ngói = 4 viên × 4 hàng → viên ngói ~0,55 × 0,5 m (to, kiểu đồ chơi).
const TILE_W = 0.55 * 4;
const TILE_H = 0.5 * 4;
const RINGS = 6;

export function buildRoof(o: RoofOpts): RoofParts {
  const over = o.over ?? Math.min(1.5, 0.45 + o.d * 0.12);
  const A = o.w / 2 + over;
  const B = o.d / 2 + over;
  const tMax = o.skirt ?? 1;
  const thick = Math.min(0.46, 0.2 + B * 0.028);
  const size = Math.min(1, Math.max(0.35, B / 6));
  const prof = (t: number) => Math.pow(t, 1.55);
  const nF = Math.round(Math.min(18, Math.max(6, (2 * A) / 1.0)));
  const nS = Math.round(Math.min(10, Math.max(4, (2 * B) / 1.0)));
  // Độ mịn ống (viền, bờ, đầu đao) theo cỡ mái: mái nhỏ dùng ít đoạn hơn.
  const rad = B > 4 ? 6 : 5;
  const q = B > 4 ? 1 : 0.7;
  const slopeLen = Math.hypot(B, o.h);

  // Điểm trên mặt mái: góc (sx, sz) ∈ {±1}, vị trí dọc cạnh, vòng t.
  const corner = (t: number) => ({ a: Math.max(A - B * t, 1e-3), b: Math.max(B * (1 - t), 1e-3) });
  function point(x: number, z: number, t: number, sideLen: number, along: number) {
    const e = Math.min(along, sideLen - along);
    const c = Math.max(0, 1 - e / Math.max(sideLen * 0.5, 1e-3));
    const fall = Math.pow(1 - t, 1.4);
    const lift = o.curl * Math.pow(c, 2.6) * fall;
    const push = o.curl * 0.45 * Math.pow(c, 3) * fall;
    const { a, b } = corner(t);
    return new THREE.Vector3(
      x + Math.sign(x) * push * (Math.abs(x) / a),
      prof(t) * o.h + lift,
      z + Math.sign(z) * push * (Math.abs(z) / b),
    );
  }

  // 4 dải: trước (z+), phải (x+), sau (z-), trái (x-). Mỗi dải là lưới (n+1) × (RINGS+1).
  const tilePos: number[] = [];
  const tileUv: number[] = [];
  const tileIdx: number[] = [];
  const eaveLoop: THREE.Vector3[] = [];
  const topLoop: THREE.Vector3[] = [];
  const sides = [
    { n: nF, long: true, dir: 1 },
    { n: nS, long: false, dir: 1 },
    { n: nF, long: true, dir: -1 },
    { n: nS, long: false, dir: -1 },
  ];
  for (const s of sides) {
    const base = tilePos.length / 3;
    for (let k = 0; k <= RINGS; k++) {
      const t = (tMax * k) / RINGS;
      const { a, b } = corner(t);
      const half = s.long ? a : b;
      for (let i = 0; i <= s.n; i++) {
        const along = (i / s.n) * 2 * half;
        const q = -half + along; // chạy theo chiều kim đồng hồ nhìn từ trên
        let x: number;
        let z: number;
        if (s.long) {
          x = q * s.dir;
          z = b * s.dir;
        } else {
          x = a * s.dir;
          z = -q * s.dir;
        }
        const p = point(x, z, t, 2 * half, along);
        tilePos.push(p.x, p.y, p.z);
        tileUv.push((s.long ? x : z) / TILE_W, (t * slopeLen) / TILE_H);
        if (k === 0 && i < s.n) eaveLoop.push(p);
        if (k === RINGS && i < s.n) topLoop.push(p);
      }
    }
    const row = s.n + 1;
    for (let k = 0; k < RINGS; k++)
      for (let i = 0; i < s.n; i++) {
        const a0 = base + k * row + i;
        const b0 = a0 + row;
        tileIdx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0);
      }
  }
  const tiles = new THREE.BufferGeometry();
  tiles.setAttribute("position", new THREE.Float32BufferAttribute(tilePos, 3));
  tiles.setAttribute("uv", new THREE.Float32BufferAttribute(tileUv, 2));
  tiles.setIndex(tileIdx);
  tiles.computeVertexNormals();
  // Đảm bảo pháp tuyến hướng lên (mặt ngói nhìn từ trên).
  if ((tiles.attributes.normal as THREE.BufferAttribute).getY(0) < 0) {
    for (let i = 0; i < tileIdx.length; i += 3) {
      const tmp = tileIdx[i + 1]!;
      tileIdx[i + 1] = tileIdx[i + 2]!;
      tileIdx[i + 2] = tmp;
    }
    tiles.setIndex(tileIdx);
    tiles.computeVertexNormals();
  }

  // Mặt dưới (gỗ rui mè): cùng lưới, hạ xuống, lật mặt.
  const under = tiles.clone();
  under.translate(0, -thick, 0);
  const ui = Array.from(under.index!.array);
  for (let i = 0; i < ui.length; i += 3) {
    const tmp = ui[i + 1]!;
    ui[i + 1] = ui[i + 2]!;
    ui[i + 2] = tmp;
  }
  under.setIndex(ui);
  under.computeVertexNormals();

  const edges: THREE.BufferGeometry[] = [];
  const ceramic: THREE.BufferGeometry[] = [];
  const gold: THREE.BufferGeometry[] = [];

  // Viền mái tròn chạy theo mép (che khe giữa mặt ngói và mặt dưới).
  const rimR = thick * 0.82;
  const rim = eaveLoop.map((p) => p.clone().add(new THREE.Vector3(0, -thick * 0.45, 0)));
  edges.push(sweep(rim, eaveLoop.length, rad, () => rimR, { closed: true }));
  if (tMax < 1) {
    const top = topLoop.map((p) => p.clone().add(new THREE.Vector3(0, -thick * 0.2, 0)));
    edges.push(sweep(top, Math.ceil(topLoop.length / 2), rad, () => rimR * 1.15, { closed: true }));
  }

  // Bờ dải (4 góc) — theo đường góc từ chân lên nóc.
  const ridgeR = Math.max(0.12, thick * 1.05) * (tMax < 1 ? 0.85 : 1);
  const hipLines: THREE.Vector3[][] = [];
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
  ] as const) {
    const line: THREE.Vector3[] = [];
    for (let k = 0; k <= RINGS; k++) {
      const t = (tMax * k) / RINGS;
      const { a, b } = corner(t);
      const p = point(sx * a, sz * b, t, 1, 0);
      line.push(p.add(new THREE.Vector3(0, ridgeR * 0.35, 0)));
    }
    hipLines.push(line);
    edges.push(sweep(line, RINGS, rad, (u) => ridgeR * (1 - 0.15 * (1 - u)), { caps: true }));
  }

  // Đầu đao xoắn tại 4 góc: xoắn ốc trong mặt phẳng đứng chứa đường chéo, cuộn ngược về phía mái.
  const daoR = 0.55 * size + o.curl * 0.25;
  hipLines.forEach((line, ci) => {
    const p0 = line[0]!.clone();
    const dirs = [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ][ci]!;
    if (o.skipDaoX && dirs[0] === o.skipDaoX) return;
    const D = new THREE.Vector3(dirs[0]!, 0, dirs[1]!).normalize();
    const Y = new THREE.Vector3(0, 1, 0);
    const C = p0
      .clone()
      .addScaledVector(Y, daoR)
      .addScaledVector(D, -daoR * 0.15);
    const pts: THREE.Vector3[] = [];
    const turns = Math.PI * 2.1;
    for (let i = 0; i <= 18; i++) {
      const th = (i / 18) * turns;
      const rr = daoR * (1 - (0.72 * th) / turns);
      pts.push(
        C.clone()
          .addScaledVector(D, Math.sin(th) * rr)
          .addScaledVector(Y, -Math.cos(th) * rr),
      );
    }
    const r0 = ridgeR * 1.15;
    ceramic.push(
      sweep(pts, Math.round(15 * q), rad, (u) => r0 * (1 - 0.7 * u) + 0.02, { caps: true }),
    );
    const end = pts[pts.length - 1]!;
    gold.push(xf(new THREE.SphereGeometry(r0 * 0.75, 6, 4), [end.x, end.y, end.z]));
    // Lá lật nhỏ dưới đầu đao (chỉ mái lớn).
    if (q < 1) return;
    const leaf: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const th = (i / 8) * Math.PI * 1.2;
      const rr = daoR * 0.42 * (1 - 0.5 * (i / 8));
      leaf.push(
        p0
          .clone()
          .addScaledVector(D, -daoR * 0.7 + Math.sin(th) * rr * 0.6)
          .addScaledVector(Y, rr * (1 - Math.cos(th)) * 0.9 + ridgeR * 0.4),
      );
    }
    ceramic.push(
      sweep(leaf, Math.round(8 * q), rad - 1, (u) => r0 * 0.55 * (1 - 0.6 * u) + 0.015, {
        caps: true,
      }),
    );
  });

  // Bờ nóc mập + hai đầu kìm cuộn + lưỡng long chầu nguyệt.
  if (tMax >= 1) {
    const L = Math.max(A - B, 0);
    const yR = o.h + ridgeR * 0.6;
    const nr = Math.max(ridgeR * 1.45, 0.16);
    if (L > 0.05) {
      edges.push(
        sweep([new THREE.Vector3(-L, yR, 0), new THREE.Vector3(L, yR, 0)], 6, 10, () => nr, {
          caps: true,
        }),
      );
      // Gờ trang trí giữa bờ nóc (vạch vàng).
      gold.push(
        sweep(
          [new THREE.Vector3(-L, yR + nr * 0.82, 0), new THREE.Vector3(L, yR + nr * 0.82, 0)],
          4,
          6,
          () => nr * 0.22,
          { caps: true },
        ),
      );
    }
    // Đầu kìm: xoắn hướng lên, cuộn vào trong (mái chóp vuông thì không có).
    for (const s of L > 0.05 ? [1, -1] : []) {
      const C = new THREE.Vector3(s * (L + nr * 0.2), yR + nr * 2.1 * size + nr, 0);
      const R = nr * 2.1 * size + nr * 0.4;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const th = (i / 16) * Math.PI * 1.9;
        const rr = R * (1 - (0.65 * i) / 16);
        pts.push(new THREE.Vector3(C.x + s * Math.sin(th) * rr, C.y - Math.cos(th) * rr, 0));
      }
      ceramic.push(sweep(pts, 13, rad, (u) => nr * (1 - 0.65 * u), { caps: true }));
      const e = pts[pts.length - 1]!;
      gold.push(xf(new THREE.SphereGeometry(nr * 0.5, 6, 4), [e.x, e.y, e.z]));
    }
    if (o.ornate && L > 0.8)
      ornaments(Math.min(L, 4.2), yR + nr * 0.6, o.ornate === true, ceramic, gold);
  }

  return {
    tiles,
    under,
    edge: merge(edges),
    ceramic: merge(ceramic),
    gold: merge(gold),
  };
}

/** Lưỡng long chầu nguyệt: mặt trăng (ngọc lửa) giữa, hai rồng uốn khúc tròn trịa chầu vào. */
function ornaments(
  L: number,
  y: number,
  dragons: boolean,
  ceramic: THREE.BufferGeometry[],
  gold: THREE.BufferGeometry[],
) {
  const k = Math.min(1.4, Math.max(0.55, L / 3)); // tỷ lệ theo độ dài bờ nóc
  const moonY = y + 0.75 * k;
  gold.push(xf(new THREE.SphereGeometry(0.34 * k, 12, 8), [0, moonY, 0]));
  // Lửa quanh ngọc: vòng xuyến + 5 ngọn tròn.
  gold.push(xf(new THREE.TorusGeometry(0.5 * k, 0.07 * k, 5, 18), [0, moonY, 0]));
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + (i - 2) * 0.55;
    gold.push(
      xf(
        new THREE.ConeGeometry(0.1 * k, 0.32 * k, 6),
        [Math.cos(a) * 0.6 * k, moonY + Math.sin(a) * 0.6 * k, 0],
        [0, 0, a - Math.PI / 2],
      ),
    );
  }
  // Đế mây đỡ ngọc.
  ceramic.push(
    xf(new THREE.SphereGeometry(0.3 * k, 10, 6), [0, y + 0.08 * k, 0], [0, 0, 0], [1.4, 0.6, 0.8]),
  );

  for (const s of dragons ? [1, -1] : []) {
    const at = (x: number, yy: number) => new THREE.Vector3(s * x * k, y + yy * k, 0);
    const body = [
      at(2.7, -0.05),
      at(2.35, 0.45),
      at(1.95, 0.75),
      at(1.6, 0.45),
      at(1.3, 0.3),
      at(1.05, 0.6),
      at(0.98, 0.95),
    ];
    ceramic.push(
      sweep(
        body,
        14,
        6,
        (u) => (0.08 + 0.13 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * k + 0.03,
        {
          caps: true,
        },
      ),
    );
    // Vây lưng tròn (vàng) dọc thân.
    for (const u of [0.25, 0.42, 0.6]) {
      const c = new THREE.CatmullRomCurve3(body).getPointAt(u);
      gold.push(xf(new THREE.SphereGeometry(0.09 * k, 6, 4), [c.x, c.y + 0.17 * k, 0]));
    }
    // Đầu rồng: khối tròn + mõm, sừng vàng, mắt tròn nhỏ.
    const hx = 1.02 * s * k;
    const hy = y + 1.08 * k;
    ceramic.push(
      xf(new THREE.SphereGeometry(0.24 * k, 10, 6), [hx, hy, 0], [0, 0, 0], [1.1, 1, 0.9]),
    );
    ceramic.push(
      xf(
        new THREE.SphereGeometry(0.15 * k, 8, 5),
        [hx - s * 0.22 * k, hy - 0.04 * k, 0],
        [0, 0, 0],
        [1.3, 0.8, 0.85],
      ),
    );
    for (const zz of [0.1, -0.1]) {
      gold.push(
        xf(
          new THREE.ConeGeometry(0.05 * k, 0.28 * k, 5),
          [hx + s * 0.08 * k, hy + 0.27 * k, zz * k],
          [0, 0, s * 0.5],
        ),
      );
    }
    // Râu cuộn nhỏ trước mõm.
    const beard: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const th = (i / 6) * Math.PI * 1.5;
      beard.push(
        new THREE.Vector3(
          hx - s * (0.3 + 0.1 * Math.sin(th)) * k,
          hy - 0.12 * k - 0.1 * (1 - Math.cos(th)) * k,
          0,
        ),
      );
    }
    gold.push(sweep(beard, 8, 5, () => 0.025 * k + 0.01, { caps: true }));
    // Đuôi cuộn.
    const tail: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const th = (i / 8) * Math.PI * 1.6;
      const rr = 0.28 * (1 - i / 14);
      tail.push(at(2.7 + 0.15 + Math.sin(th) * rr, -0.05 + (1 - Math.cos(th)) * rr));
    }
    ceramic.push(sweep(tail, 9, 5, (u) => (0.09 - 0.05 * u) * k + 0.02, { caps: true }));
  }
}
