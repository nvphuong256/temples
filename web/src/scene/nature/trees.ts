// Cây chân thực (01/11, theo yêu cầu của Phương): cây đa làng, khóm tre gai, bụi cây, chậu cảnh.
// Kỹ thuật: thân/cành là ống cong thon dần (taperTube, uv theo mét → vỏ cây không méo), tán lá là
// "thẻ lá" — mặt phẳng có texture chùm lá alpha (natureTextures) cắm quanh lõi tối; pháp tuyến thẻ hướng
// ra khỏi tâm khối → tán sáng tối mềm như khối lá thật, viền lởm chởm thay vì quả cầu trơn.
// Chỉ three.js (không DOM) để test đếm tam giác. Mọi phần có position/normal/uv/color, không index.
import * as THREE from "three";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { TREE_PROPS } from "../layout";
import { merge, paint, triCount } from "./geometries";
import { rng } from "./scatter";

type G = THREE.BufferGeometry;
type ColorFn = (t: number, p: THREE.Vector3, out: THREE.Color) => void;

/** Các phần của một cây, mỗi phần một material: gỗ (vỏ texture), đặc (màu đỉnh), lõi tán, thẻ lá, rễ buông. */
export interface TreeParts {
  wood?: G;
  solid?: G;
  core?: G;
  cards: G;
  roots?: G;
}

export function treeTris(t: TreeParts) {
  return Object.values(t).reduce((a: number, g: G | undefined) => a + (g ? triCount(g) : 0), 0);
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/**
 * Ống cong thon dần theo đường cong qua `pts`. u quanh ống, v = mét dọc ống / vScale
 * (vScale = độ dài ống → v ∈ [0, 1], dùng cho rễ buông lắc theo uv.y).
 */
export function taperTube(
  pts: THREE.Vector3[],
  radius: (t: number) => number,
  radial: number,
  segs: number,
  color: ColorFn,
  vScale = 1.5,
): G {
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const frames = curve.computeFrenetFrames(segs, false);
  const len = curve.getLength();
  const vs = vScale <= 0 ? len : vScale;
  // Lặp vỏ quanh ống theo chu vi (số nguyên lần → không lộ đường nối).
  const uRep = vScale <= 0 ? 1 : Math.max(1, Math.round((2 * Math.PI * radius(0)) / vs));
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const n = new THREE.Vector3();
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const P = curve.getPointAt(t);
    const Nn = frames.normals[i] as THREE.Vector3;
    const B = frames.binormals[i] as THREE.Vector3;
    const r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      n.copy(Nn).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      v.copy(P).addScaledVector(n, r);
      pos.push(v.x, v.y, v.z);
      nor.push(n.x, n.y, n.z);
      uv.push((j / radial) * uRep, (t * len) / vs);
      color(t, v, c);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g.toNonIndexed();
}

/** Gom thẻ lá (mỗi thẻ 2 tam giác) thành một geometry. */
class Cards {
  private pos: number[] = [];
  private nor: number[] = [];
  private uv: number[] = [];
  private col: number[] = [];
  private _t1 = new THREE.Vector3();
  private _n = new THREE.Vector3();
  private _up = new THREE.Vector3();

  /**
   * Thẻ w×h: `up` là chiều dọc ảnh (v tăng), `face` gần đúng pháp tuyến mặt thẻ.
   * `bottom` = true: `at` là trung điểm mép dưới (cành tre mọc từ đốt); ngược lại `at` là tâm thẻ.
   * `normal(v)` cho pháp tuyến chiếu sáng từng đỉnh; `tint` nhân màu texture.
   */
  add(
    at: THREE.Vector3,
    up: THREE.Vector3,
    face: THREE.Vector3,
    w: number,
    h: number,
    bottom: boolean,
    normal: (v: THREE.Vector3) => THREE.Vector3,
    tint: THREE.Color,
  ) {
    const u = this._up.copy(up).normalize();
    const n = this._n.copy(face).addScaledVector(u, -face.dot(u));
    if (n.lengthSq() < 1e-6) n.set(u.y, -u.x, 0.3);
    n.normalize();
    const t1 = this._t1.crossVectors(u, n).normalize();
    const y0 = bottom ? 0 : -h / 2;
    const corner = (sx: number, sy: number) =>
      at
        .clone()
        .addScaledVector(t1, sx * w)
        .addScaledVector(u, y0 + sy * h);
    const q = [
      [corner(-0.5, 0), 0, 0],
      [corner(0.5, 0), 1, 0],
      [corner(0.5, 1), 1, 1],
      [corner(-0.5, 1), 0, 1],
    ] as const;
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const [p, uu, vv] = q[k] as (typeof q)[number];
      const nn = normal(p);
      this.pos.push(p.x, p.y, p.z);
      this.nor.push(nn.x, nn.y, nn.z);
      this.uv.push(uu, vv);
      this.col.push(tint.r, tint.g, tint.b);
    }
  }

  build(): G {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}

function randDir(r: () => number, upBias: number) {
  const d = V(r() * 2 - 1, r() * 2 - 1 + upBias, r() * 2 - 1);
  return d.lengthSq() < 1e-4 ? UP.clone() : d.normalize();
}

/** Lõi tán: khối 20 mặt méo, pháp tuyến cầu (không lộ mặt phẳng), dưới tối trên sáng. */
function leafCore(
  c: THREE.Vector3,
  rad: number,
  flat: number,
  r: () => number,
  dark: THREE.Color,
  light: THREE.Color,
): G {
  const g = new THREE.IcosahedronGeometry(rad, 0).toNonIndexed();
  const pos = g.getAttribute("position");
  // cùng một đỉnh xuất hiện ở nhiều mặt → méo theo vị trí để không hở
  const key = (x: number, y: number, z: number) =>
    `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
  const jit = new Map<string, number>();
  const nor: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = key(x, y, z);
    if (!jit.has(k)) jit.set(k, 0.8 + r() * 0.35);
    const s = jit.get(k) ?? 1;
    pos.setXYZ(i, x * s, y * s * flat, z * s);
    const nn = V(x, y / Math.max(flat, 0.3), z).normalize();
    nor.push(nn.x, nn.y, nn.z);
  }
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.translate(c.x, c.y, c.z);
  return paint(g, (p, col) =>
    col
      .copy(dark)
      .lerp(light, THREE.MathUtils.clamp(((p.y - c.y) / (rad * flat)) * 0.5 + 0.5, 0, 1)),
  );
}

interface ClumpOpts {
  n: number;
  /** Bề rộng thẻ / bán kính khối. */
  size: number;
  flat?: number;
  upBias?: number;
  /** Pháp tuyến chiếu sáng thẻ. */
  normal: (v: THREE.Vector3) => THREE.Vector3;
  /** Độ sáng thẻ theo hướng ra ngoài của nó (dir.y ∈ [-1, 1]). */
  shade: (dirY: number, r: () => number) => THREE.Color;
}

/** Khối lá: thẻ lá cắm quanh tâm, chĩa ra ngoài (mặt thẻ ≈ hướng ra), xoay ngẫu nhiên. */
function clumpCards(b: Cards, c: THREE.Vector3, rad: number, r: () => number, o: ClumpOpts) {
  const flat = o.flat ?? 1;
  for (let k = 0; k < o.n; k++) {
    const d = randDir(r, o.upBias ?? 0.25);
    const p = c.clone().add(V(d.x, d.y * flat, d.z).multiplyScalar(rad * (0.45 + 0.45 * r())));
    const spin = randDir(r, 0);
    const w = rad * o.size * (0.85 + 0.35 * r());
    b.add(p, spin, d, w, w, false, o.normal, o.shade(d.y, r));
  }
}

const _nrm = new THREE.Vector3();
/** Pháp tuyến pha giữa hướng ra từ khối nhỏ và từ cả tán (tán đọc thành một khối lớn có chi tiết). */
function blendNormal(
  local: THREE.Vector3,
  localR: number,
  whole: THREE.Vector3,
  wholeR: THREE.Vector3,
  k = 0.5,
) {
  return (v: THREE.Vector3) => {
    const a = v.clone().sub(local).divideScalar(localR);
    const bb = v.clone().sub(whole).divide(wholeR);
    return _nrm
      .copy(a.multiplyScalar(1 - k))
      .addScaledVector(bb, k)
      .addScaledVector(UP, 0.25)
      .normalize()
      .clone();
  };
}

function gray(s: number, warm = 0) {
  return new THREE.Color(s * (1 + warm * 0.12), s * (1 + warm * 0.08), s * (1 - warm * 0.25));
}

// ---------- Cây đa ----------

export const BANYAN = {
  canopyC: V(0, 8.3, 0),
  canopyR: V(6.2, 2.5, 6.2),
} as const;

/**
 * Cây đa cổ thụ đầu làng/sân chùa: gốc nhiều thân phụ xoắn dính vào nhau, rễ bạnh bò mặt đất, 7 cành
 * lớn vươn ngang, 4 rễ phụ đã thành cột (TREE_PROPS, có va chạm), rèm rễ buông, tán ô rộng ~12 m.
 * Gốc tọa độ ở gốc cây. ≈ 7k tam giác.
 */
export function banyan(seed = 11): TreeParts {
  const r = rng(seed);
  const wood: G[] = [];
  const bark = new THREE.Color(N.banyanBark).multiplyScalar(1.45);
  const barkDark = new THREE.Color(N.barkDark).multiplyScalar(1.5);
  const barkCol: ColorFn = (_t, p, c) =>
    c.copy(barkDark).lerp(bark, 0.35 + 0.65 * smooth(-0.1, 2.2, p.y));
  const tube = (pts: THREE.Vector3[], rf: (t: number) => number, radial: number, segs: number) => {
    const g = taperTube(pts, rf, radial, segs, barkCol, 1.6);
    wood.push(g);
    return new THREE.CatmullRomCurve3(pts, false, "centripetal");
  };

  // Thân lõi.
  tube(
    [V(0, -0.3, 0), V(0.1, 1.4, 0.05), V(-0.1, 3, 0.1), V(0, 4.6, 0)],
    (t) => 1.05 - 0.35 * t + 0.6 * (1 - t) ** 4,
    14,
    8,
  );
  // Thân phụ xoắn bám quanh lõi → gốc đa xù xì nhiều múi.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + r() * 0.4;
    const tw = 0.16 + r() * 0.1;
    const ring = (k: number, rad: number, y: number) =>
      V(Math.cos(a + tw * k) * rad, y, Math.sin(a + tw * k) * rad);
    const r0 = 0.32 + r() * 0.16;
    tube(
      [
        ring(0, 1.55, -0.2),
        ring(1, 1.2, 1.1),
        ring(2, 0.98, 2.5),
        ring(3, 0.78, 3.8),
        ring(3.6, 0.5, 4.9),
      ],
      (t) => r0 * (1 - 0.35 * t),
      7,
      7,
    );
  }
  // Rễ bạnh bò trên mặt đất.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + r() * 0.5;
    const side = (r() - 0.5) * 0.8;
    const L = 2.8 + r() * 1.4;
    const at = (d: number, y: number, s: number) =>
      V(Math.cos(a) * d - Math.sin(a) * s, y, Math.sin(a) * d + Math.cos(a) * s);
    tube(
      [
        at(0.7, 1.1, 0),
        at(1.6, 0.4, side * 0.3),
        at(L * 0.75, 0.08, side),
        at(L, -0.4, side * 1.4),
      ],
      (t) => 0.1 + 0.4 * (1 - t) ** 1.5,
      6,
      5,
    );
  }

  // Cành lớn: 4 cành đi qua đỉnh cột rễ phụ, 3 cành xen giữa.
  const tips: { p: THREE.Vector3; rad: number }[] = [];
  const propAng = TREE_PROPS.map((p) => Math.atan2(p.dz, p.dx));
  const limbAng = [...propAng];
  const sorted = [...propAng].sort((a, b) => a - b);
  sorted.forEach((a, i) => {
    const next = sorted[(i + 1) % sorted.length] ?? a;
    const gap = (next - a + Math.PI * 2) % (Math.PI * 2);
    if (gap > 1.3) limbAng.push(a + gap / 2);
  });
  const props: THREE.Vector3[] = [];
  limbAng.forEach((a, i) => {
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const side = V(-dir.z, 0, dir.x).multiplyScalar((r() - 0.5) * 1.2);
    const y0 = 3.6 + r() * 0.8;
    const prop = TREE_PROPS[i];
    const d = prop ? Math.hypot(prop.dx, prop.dz) : 3.4;
    const at = (dist: number, y: number, s = 0) =>
      dir.clone().multiplyScalar(dist).addScaledVector(side, s).setY(y);
    const pts = [
      at(0.4, y0),
      at(d * 0.5, y0 + 0.9, 0.3),
      at(d, y0 + 1.35, prop ? 0 : 0.6),
      at(d + 1.6, y0 + 2.1, 0.8),
      at(d + 2.7, y0 + 2.5, 1),
    ];
    if (prop) props.push(V(prop.dx, y0 + 1.35, prop.dz));
    const curve = tube(pts, (t) => 0.56 - 0.42 * t, 8, 8);
    tips.push({ p: (pts[4] as THREE.Vector3).clone().add(V(0, 0.4, 0)), rad: 1.8 });
    // Cành cấp hai.
    for (const [t, s] of [
      [0.5, 1],
      [0.78, -1],
    ] as const) {
      const P = curve.getPointAt(t);
      const d1 = dir
        .clone()
        .applyAxisAngle(UP, s * (0.7 + r() * 0.5))
        .multiplyScalar(1.4 + r() * 0.6);
      const end = P.clone()
        .add(d1)
        .add(V(0, 1.1 + r() * 0.6, 0));
      tube(
        [
          P,
          P.clone()
            .addScaledVector(d1, 0.5)
            .add(V(0, 0.6, 0)),
          end,
        ],
        (t2) => 0.17 - 0.12 * t2,
        5,
        4,
      );
      tips.push({ p: end.add(V(0, 0.3, 0)), rad: 1.45 + r() * 0.3 });
    }
  });
  // Ngọn chính vươn lên giữa tán.
  for (const s of [-1, 1]) {
    const pts = [
      V(0, 4.3, 0),
      V(s * 0.6, 6, s * 0.3),
      V(s * 1.2, 7.9, -s * 0.2),
      V(s * 1, 9.3, s * 0.4),
    ];
    tube(pts, (t) => 0.5 - 0.36 * t, 7, 6);
    tips.push({ p: (pts[3] as THREE.Vector3).clone().add(V(0, 0.6, 0)), rad: 2 });
  }
  // Cột rễ phụ: thẳng xuống đất, loe chân.
  for (const top of props) {
    const wob = () => (r() - 0.5) * 0.25;
    tube(
      [
        top.clone().add(V(0, 0.2, 0)),
        V(top.x + wob(), top.y * 0.6, top.z + wob()),
        V(top.x + wob(), top.y * 0.25, top.z + wob()),
        V(top.x, -0.15, top.z),
      ],
      (t) => 0.2 + 0.08 * t + 0.28 * smooth(0.82, 1, t),
      7,
      6,
    );
  }

  // Tán: khối lá ở đầu cành + lấp đầy vỏ ellipsoid (mặt dưới thưa để thấy cành).
  const C = BANYAN.canopyC;
  const R = BANYAN.canopyR;
  for (let i = 0; i < 28; i++) {
    const d = randDir(r, 0.35);
    if (d.y < -0.25) d.y = -0.25 + r() * 0.1;
    const k = 0.7 + r() * 0.3;
    tips.push({ p: V(d.x * R.x * k, C.y + d.y * R.y * k, d.z * R.z * k), rad: 1.5 + r() * 0.5 });
  }
  const cards = new Cards();
  const cores: G[] = [];
  const leafDark = new THREE.Color(N.banyanLeaf).multiplyScalar(0.72);
  const leafMid = new THREE.Color(N.banyanLeaf).multiplyScalar(1.0);
  for (const { p, rad } of tips) {
    // Khối thấp (đầu cành dưới tán) chỉ có thẻ lá: lõi đặc nhìn từ dưới lên thành cục tối.
    const low = p.y < C.y - 0.3;
    if (!low) cores.push(leafCore(p, rad * 0.36, 0.8, r, leafDark, leafMid));
    clumpCards(cards, p, rad, r, {
      n: low ? 12 : 10,
      size: 1.25,
      flat: 0.8,
      normal: blendNormal(p, rad, C, R, 0.5),
      shade: (dy, rr) => {
        const outer = smooth(C.y - 2, C.y + 3, p.y + dy * rad);
        const young = rr() < 0.1 ? 1 : 0;
        return gray(0.62 + 0.45 * outer + (rr() - 0.5) * 0.12, young);
      },
    });
  }

  // Rèm rễ buông: từ cành và mặt dưới tán; ~1/3 rễ dài gần chạm đất, đi thành bó 2–3 sợi.
  const roots: G[] = [];
  const rootCol = new THREE.Color(N.banyanBark).multiplyScalar(0.95);
  const rootTip = new THREE.Color(N.trunkLight).multiplyScalar(1.1);
  const rootFn: ColorFn = (t, _p, c) => c.copy(rootCol).lerp(rootTip, smooth(0.6, 1, t));
  const hang = (top: THREE.Vector3, len: number, rad: number) => {
    const sway = V((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3);
    roots.push(
      taperTube(
        [
          top,
          top
            .clone()
            .add(V(0, -len * 0.5, 0))
            .add(sway),
          top
            .clone()
            .add(V(0, -len, 0))
            .addScaledVector(sway, 1.6),
        ],
        (t) => rad * (1 - 0.55 * t),
        3,
        3,
        rootFn,
        0,
      ),
    );
  };
  for (let i = 0; i < 38; i++) {
    const a = r() * Math.PI * 2;
    const dist = 1.6 + r() * 4.4;
    const top = V(Math.cos(a) * dist, 5.2 + dist * 0.28 + r() * 0.6, Math.sin(a) * dist);
    const long = r() < 0.35;
    const len = long ? top.y - 0.35 - r() * 0.9 : 1 + r() * 2.6;
    const bundle = long ? 2 + Math.floor(r() * 2) : 1;
    for (let k = 0; k < bundle; k++)
      hang(
        top.clone().add(V((r() - 0.5) * 0.14, 0, (r() - 0.5) * 0.14)),
        len - k * 0.3,
        0.018 + r() * 0.014,
      );
  }

  return {
    wood: merge(wood),
    core: merge(cores),
    cards: cards.build(),
    roots: merge(roots),
  };
}

// ---------- Tre ----------

/**
 * Khóm tre gai làng Bắc Bộ: 15 cây cao 8–11,5 m, thân thon nhọn dần, cong vồng ra ngoài và rủ ngọn;
 * từ nửa trên mỗi đốt mọc cành lá so le, ngọn có chùm lá rủ. Gốc khóm tại (0, 0, 0). ≈ 1,7k tam giác.
 */
export function bambooClump(seed = 7): TreeParts {
  const r = rng(seed);
  const culms: G[] = [];
  const cards = new Cards();
  const green = new THREE.Color(N.bambooCulm).multiplyScalar(1.12);
  const old = new THREE.Color(N.bambooCulmOld).multiplyScalar(1.08);
  const axisNormal = (v: THREE.Vector3) =>
    V(v.x, 0, v.z)
      .normalize()
      .multiplyScalar(0.8)
      .add(V(0, 0.75, 0))
      .normalize();
  for (let s = 0; s < 15; s++) {
    const a = (s / 15) * Math.PI * 2 + r() * 0.5;
    const d = 0.15 + r() * 0.7;
    const base = V(Math.cos(a) * d, 0, Math.sin(a) * d);
    const out = V(Math.cos(a + (r() - 0.5) * 0.6), 0, Math.sin(a + (r() - 0.5) * 0.6));
    const H = 8 + r() * 3.5;
    const lean = 0.09 + d * 0.12 + r() * 0.08;
    const arch = 1.6 + r() * 2.2;
    const at = (k: number) =>
      base
        .clone()
        .addScaledVector(out, lean * H * k ** 1.5 + arch * k ** 4)
        .setY(H * k * (1 - 0.13 * k ** 3));
    const pts = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1].map(at);
    const r0 = 0.06 + r() * 0.03;
    const tint = (r() < 0.25 ? old : green).clone().multiplyScalar(0.92 + r() * 0.16);
    culms.push(
      taperTube(
        pts,
        (t) =>
          t < 0.8 ? r0 * (1 - 0.5 * t) : THREE.MathUtils.lerp(r0 * 0.6, 0.006, (t - 0.8) / 0.2),
        5,
        8,
        (t, _p, c) => c.copy(tint).multiplyScalar(0.72 + 0.28 * smooth(0, 0.25, t)),
        0.42,
      ),
    );
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    // Cành lá so le ở nửa trên.
    const nodes = 9 + Math.floor(r() * 3);
    for (let k = 0; k < nodes; k++) {
      const t = 0.3 + (0.62 * k) / nodes + r() * 0.03;
      const P = curve.getPointAt(t);
      const side = out.clone().applyAxisAngle(UP, (k % 2 ? 1 : -1) * (0.9 + r() * 0.8));
      const dir = side.add(V(0, 0.35 - 0.75 * t, 0)).normalize();
      const h = (2.1 - 0.8 * t) * (0.85 + 0.3 * r());
      const flatN = UP.clone().addScaledVector(dir, -dir.y).normalize();
      const shade = gray(0.85 + 0.25 * t + (r() - 0.5) * 0.15);
      cards.add(P, dir, flatN, h * 0.85, h, true, axisNormal, shade);
      cards.add(P, dir, flatN.clone().cross(dir), h * 0.85, h, true, axisNormal, shade);
    }
    // Chùm lá ngọn rủ xuống.
    const tip = curve.getPointAt(0.9);
    for (let k = 0; k < 5; k++) {
      const dir = out
        .clone()
        .applyAxisAngle(UP, (k / 4) * Math.PI * 2 + r())
        .add(V(0, -0.55, 0))
        .normalize();
      const flatN = UP.clone().addScaledVector(dir, -dir.y).normalize();
      cards.add(tip, dir, flatN, 1.3, 1.5, true, axisNormal, gray(1.05 + (r() - 0.5) * 0.1));
    }
  }
  return { wood: merge(culms), cards: cards.build() };
}

// ---------- Bụi cây & chậu cảnh ----------

/** Bụi cây xén tròn chân tường (ngâu, trang): 3 thùy lá, lõi tối + thẻ lá viền lởm chởm. ≈ 90 tam giác. */
export function shrub(seed = 3): TreeParts {
  const r = rng(seed);
  const lobes: [number, number, number, number][] = [
    [0, 0.62, 0, 0.62],
    [0.5, 0.46, 0.18, 0.46],
    [-0.44, 0.44, -0.16, 0.48],
  ];
  const cards = new Cards();
  const cores: G[] = [];
  const C = V(0, 0.55, 0);
  const R = V(1, 0.65, 0.8);
  const dark = new THREE.Color(N.shrubLeaf).multiplyScalar(0.62);
  const mid = new THREE.Color(N.shrubLeaf).multiplyScalar(0.85);
  for (const [x, y, z, rad] of lobes) {
    const c = V(x, y, z);
    cores.push(leafCore(c, rad * 0.45, 0.85, r, dark, mid));
    clumpCards(cards, c, rad, r, {
      n: 6,
      size: 1.15,
      flat: 0.85,
      upBias: 0.4,
      normal: blendNormal(c, rad, C, R, 0.55),
      shade: (dy, rr) => gray(0.72 + 0.3 * (dy * 0.5 + 0.5) + (rr() - 0.5) * 0.1),
    });
  }
  return { core: merge(cores), cards: cards.build() };
}

/** Chậu cây cảnh (sanh/si): chậu men nâu đỏ viền vàng, thân uốn thế, 3 tán tầng dẹt. */
export function bonsai(seed = 9): TreeParts {
  const r = rng(seed);
  const profile = [
    [0, 0],
    [0.42, 0],
    [0.5, 0.08],
    [0.58, 0.42],
    [0.66, 0.48],
    [0.64, 0.56],
    [0.54, 0.56],
    [0, 0.52],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = paint(new THREE.LatheGeometry(profile, 14), (p, c) =>
    c
      .set(p.y > 0.44 ? N.potRim : N.pot)
      .multiplyScalar(p.y < 0.5 || Math.hypot(p.x, p.z) > 0.56 ? 1 : 0.35),
  );
  const bark = new THREE.Color(N.trunkLight).multiplyScalar(1.1);
  const barkFn: ColorFn = (_t, _p, c) => c.copy(bark);
  const trunkPts = [
    V(0, 0.48, 0),
    V(0.2, 0.8, 0.05),
    V(-0.14, 1.12, -0.04),
    V(0.12, 1.45, 0.02),
    V(0.04, 1.66, 0),
  ];
  const wood = [
    taperTube(trunkPts, (t) => 0.13 - 0.09 * t + 0.06 * (1 - t) ** 6, 6, 8, barkFn, 0.6),
    taperTube(
      [V(0.16, 0.86, 0.05), V(0.32, 0.95, 0.06), V(0.42, 1.02, 0.05)],
      (t) => 0.045 - 0.025 * t,
      4,
      2,
      barkFn,
      0.6,
    ),
    taperTube(
      [V(-0.12, 1.15, -0.04), V(-0.26, 1.24, -0.05), V(-0.36, 1.28, -0.05)],
      (t) => 0.04 - 0.022 * t,
      4,
      2,
      barkFn,
      0.6,
    ),
  ];
  const pads: [number, number, number, number][] = [
    [0.42, 1.06, 0.05, 0.34],
    [-0.36, 1.3, -0.05, 0.32],
    [0.06, 1.72, 0, 0.4],
  ];
  const cards = new Cards();
  const cores: G[] = [];
  const dark = new THREE.Color(N.banyanLeaf).multiplyScalar(0.75);
  const mid = new THREE.Color(N.banyanLeaf).multiplyScalar(1.05);
  for (const [x, y, z, rad] of pads) {
    const c = V(x, y, z);
    cores.push(leafCore(c, rad * 0.55, 0.5, r, dark, mid));
    clumpCards(cards, c, rad * 1.1, r, {
      n: 12,
      size: 1.15,
      flat: 0.55,
      upBias: 0.35,
      normal: (v) =>
        v
          .clone()
          .sub(c)
          .multiply(V(1, 2.2, 1))
          .add(V(0, rad * 0.5, 0))
          .normalize(),
      shade: (dy, rr) => gray(0.75 + 0.3 * (dy * 0.5 + 0.5) + (rr() - 0.5) * 0.1),
    });
  }
  return { solid: pot, wood: merge(wood), core: merge(cores), cards: cards.build() };
}
