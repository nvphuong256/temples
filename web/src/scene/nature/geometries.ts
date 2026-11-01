// Hình khối chibi cho thiên nhiên — chỉ three.js (không DOM) để test đếm tam giác được.
// Mọi geometry có đủ position/normal/uv/color (không index) để gộp bằng mergeGeometries;
// màu tô theo đỉnh (vertexColors) → một material cho cả vật thể, ít draw call.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHIBI_NATURE as N } from "@cvo/shared";

type G = THREE.BufferGeometry;
type Paint = THREE.ColorRepresentation | ((p: THREE.Vector3, c: THREE.Color) => void);

const _c = new THREE.Color();
const _p = new THREE.Vector3();

/** Tô màu từng đỉnh (hằng hoặc hàm theo vị trí cục bộ). Trả về geometry không index, đủ thuộc tính. */
export function paint(g: G, color: Paint): G {
  const out = g.index ? g.toNonIndexed() : g;
  if (!out.getAttribute("normal")) out.computeVertexNormals();
  const pos = out.getAttribute("position");
  if (!out.getAttribute("uv"))
    out.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    if (typeof color === "function") {
      _p.fromBufferAttribute(pos, i);
      color(_p, _c);
    } else _c.set(color);
    cols.set([_c.r, _c.g, _c.b], i * 3);
  }
  out.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return out;
}

export function merge(parts: G[]): G {
  const g = mergeGeometries(parts, false);
  if (!g) throw new Error("mergeGeometries failed");
  g.computeBoundingSphere();
  return g;
}

export function triCount(g: G) {
  return (g.index ? g.index.count : g.getAttribute("position").count) / 3;
}

/** Tam giác tự dựng (pháp tuyến hướng lên → sáng đều như nền cỏ, kiểu hoạt hình). */
function triangles(pos: number[], colors: number[], up = true): G {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2),
  );
  if (up) {
    const n: number[] = [];
    for (let i = 0; i < pos.length; i += 3) n.push(0.15, 0.97, 0.15);
    g.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
  } else g.computeVertexNormals();
  return g;
}

/** Một lá/phiến dạng dải cong (cỏ, dương xỉ, lá tre). `width(t)` nửa bề rộng, `path(t)` → [dọc, cao]. */
function strip(
  segs: number,
  width: (t: number) => number,
  path: (t: number) => [number, number],
  base: string,
  tip: string,
  m: THREE.Matrix4,
): G {
  const pos: number[] = [];
  const col: number[] = [];
  const cb = new THREE.Color(base);
  const ct = new THREE.Color(tip);
  const pt = (t: number, side: number) => {
    const [along, h] = path(t);
    const v = new THREE.Vector3(side * width(t), h, along).applyMatrix4(m);
    const c = cb.clone().lerp(ct, t);
    return { v, c };
  };
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const a = pt(t0, -1);
    const b = pt(t0, 1);
    const c = pt(t1, -1);
    const d = pt(t1, 1);
    const quad = i === segs - 1 && width(1) < 1e-4 ? [a, b, d] : [a, b, d, a, d, c];
    for (const q of quad) {
      pos.push(q.v.x, q.v.y, q.v.z);
      col.push(q.c.r, q.c.g, q.c.b);
    }
  }
  return triangles(pos, col);
}

const rotY = (a: number) => new THREE.Matrix4().makeRotationY(a);

// ---------- Sân vườn ----------

/** Cụm cỏ mập 5 lá (15 tam giác). Gốc ở y = 0, cao ~0,5 m. */
export function grassTuft(): G {
  const parts: G[] = [];
  for (let i = 0; i < 5; i++) {
    const h = 0.38 + ((i * 37) % 5) * 0.06;
    const lean = 0.14 + (i % 2) * 0.1;
    parts.push(
      strip(
        2,
        (t) => 0.085 * (1 - t * t),
        (t) => [lean * t * t, h * t],
        N.grassDark,
        N.grassTip,
        rotY(i * 1.257 + 0.3),
      ),
    );
  }
  return merge(parts);
}

/** Hoa nhỏ 5 cánh tròn trên cuống (~44 tam giác). */
export function flower(petal: string, heart: string): G {
  const parts: G[] = [];
  parts.push(
    strip(
      1,
      () => 0.012,
      (t) => [0, 0.34 * t],
      N.grassDark,
      N.lotusStem,
      rotY(0),
    ),
    strip(
      1,
      () => 0.012,
      (t) => [0, 0.34 * t],
      N.grassDark,
      N.lotusStem,
      rotY(Math.PI / 2),
    ),
  );
  const pos: number[] = [];
  const col: number[] = [];
  const cp = new THREE.Color(petal);
  const ch = new THREE.Color(heart);
  const n = 20;
  const y = 0.34;
  const rim = (k: number) => {
    const a = (k / n) * Math.PI * 2;
    const r = 0.06 + 0.06 * Math.abs(Math.cos(2.5 * a));
    return [Math.cos(a) * r, y + 0.025 * (r / 0.12), Math.sin(a) * r];
  };
  for (let k = 0; k < n; k++) {
    const p0 = rim(k);
    const p1 = rim(k + 1);
    pos.push(0, y, 0, ...p1, ...p0);
    col.push(ch.r, ch.g, ch.b, cp.r, cp.g, cp.b, cp.r, cp.g, cp.b);
  }
  parts.push(triangles(pos, col));
  parts.push(
    paint(
      new THREE.IcosahedronGeometry(0.035, 0).scale(1, 0.7, 1).translate(0, y + 0.015, 0),
      heart,
    ),
  );
  return merge(parts);
}

/** Đá cuội tròn nhẵn (80 tam giác); tỷ lệ dẹt đặt bằng instance. Màu trắng → nhân instanceColor. */
export function pebble(): G {
  return paint(new THREE.IcosahedronGeometry(1, 1), (p, c) =>
    c.set("#ffffff").multiplyScalar(0.82 + 0.18 * THREE.MathUtils.clamp(p.y + 0.4, 0, 1)),
  );
}

/** Dương xỉ: 6 tàu lá cong có khía răng cưa (96 tam giác). */
export function fern(): G {
  const parts: G[] = [];
  for (let i = 0; i < 6; i++) {
    const L = 0.75 + (i % 3) * 0.12;
    parts.push(
      strip(
        8,
        (t) =>
          t >= 1
            ? 0
            : (i % 2 ? 0.1 : 0.09) *
              Math.sin(Math.PI * Math.min(1, t * 1.15)) *
              (Math.round(t * 8) % 2 ? 1 : 0.45),
        (t) => [L * t, 0.05 + 0.62 * Math.sin(Math.PI * 0.8 * t) * (1 - 0.35 * t)],
        N.leafDark,
        N.fern,
        rotY(i * 1.047 + 0.2),
      ),
    );
  }
  return merge(parts);
}

// Cây (đa, tre, bụi, chậu cảnh): xem trees.ts.

// ---------- Ao sen ----------

/** Lá súng tròn có khía chữ V, hơi khum (14 tam giác). Mặt phẳng xz. */
export function lilyPad(): G {
  const g = new THREE.CircleGeometry(1, 14, 0.35, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    pos.setY(i, 0.05 * r * r);
  }
  g.computeVertexNormals();
  const light = new THREE.Color(N.leafLight);
  const pad = new THREE.Color(N.lilyPad);
  return paint(g, (p, c) => c.copy(light).lerp(pad, Math.min(1, Math.hypot(p.x, p.z) * 1.3)));
}

/** Một cánh sen: hình giọt dẹt, gốc tại gốc tọa độ, ngọn hướng +y. */
function petal(len: number, w: number) {
  const g = new THREE.SphereGeometry(1, 5, 3).scale(w, len / 2, w * 0.45).translate(0, len / 2, 0);
  const pale = new THREE.Color(N.lotusPale);
  const pink = new THREE.Color(N.lotus);
  return paint(g, (p, c) => c.copy(pale).lerp(pink, THREE.MathUtils.clamp(p.y / len, 0, 1) ** 1.4));
}

/** Hoa sen 3 lớp cánh + gương sen vàng trên cuống (đung đưa theo gió). Cao ~0,6 m trên mặt nước. */
export function lotusFlower(): G {
  const parts: G[] = [];
  const stemH = 0.42;
  parts.push(
    paint(
      new THREE.CylinderGeometry(0.025, 0.03, stemH, 4, 2, true).translate(0, stemH / 2, 0),
      N.lotusStem,
    ),
  );
  const layers: [number, number, number, number][] = [
    // số cánh, độ nghiêng ra ngoài, dài, rộng
    [8, 1.05, 0.26, 0.1],
    [7, 0.62, 0.25, 0.095],
    [5, 0.25, 0.2, 0.08],
  ];
  layers.forEach(([n, tilt, len, w], li) => {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Matrix4()
        .makeTranslation(0, stemH, 0)
        .multiply(rotY((i / n) * Math.PI * 2 + li * 0.4))
        .multiply(new THREE.Matrix4().makeRotationX(tilt))
        .multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.04));
      parts.push(petal(len, w).applyMatrix4(m));
    }
  });
  parts.push(
    paint(
      new THREE.CylinderGeometry(0.075, 0.055, 0.07, 8).translate(0, stemH + 0.07, 0),
      N.lotusCenter,
    ),
  );
  return merge(parts);
}

/** Nụ sen hình giọt nước trên cuống cao. */
export function lotusBud(): G {
  const stemH = 0.62;
  const prof = [
    [0, 0],
    [0.08, 0.04],
    [0.11, 0.14],
    [0.075, 0.27],
    [0, 0.38],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bud = new THREE.LatheGeometry(prof, 7).translate(0, stemH, 0);
  const pale = new THREE.Color(N.lotusPale);
  const pink = new THREE.Color(N.lotus);
  return merge([
    paint(
      new THREE.CylinderGeometry(0.022, 0.028, stemH, 4, 2, true).translate(0, stemH / 2, 0),
      N.lotusStem,
    ),
    paint(bud, (p, c) =>
      c.copy(pale).lerp(pink, THREE.MathUtils.clamp((p.y - stemH) / 0.38, 0, 1)),
    ),
  ]);
}

/** Cá chép cam mập, đốm trắng, đuôi xòe. Đầu hướng +z. */
export function koi(): G {
  const orange = new THREE.Color(N.koi);
  const white = new THREE.Color(N.koiWhite);
  const body = paint(new THREE.SphereGeometry(1, 8, 6).scale(0.13, 0.085, 0.36), (p, c) =>
    c.copy(Math.sin(p.z * 22 + p.x * 30) > 0.45 || p.y < -0.05 ? white : orange),
  );
  const tail = triangles(
    [0, 0, -0.3, -0.16, 0.05, -0.56, 0, 0, -0.44, 0, 0, -0.3, 0, 0, -0.44, 0.16, 0.05, -0.56],
    new Array(18).fill(0).map((_, i) => [orange.r, orange.g, orange.b][i % 3] ?? 1),
  );
  const fins = triangles(
    [
      0.1, -0.03, 0.08, 0.26, -0.05, -0.02, 0.1, -0.03, -0.06, -0.1, -0.03, -0.06, -0.26, -0.05,
      -0.02, -0.1, -0.03, 0.08,
    ],
    new Array(18).fill(0).map((_, i) => [orange.r, orange.g, orange.b][i % 3] ?? 1),
  );
  return merge([body, tail, fins]);
}

/** Đá bờ ao (dùng chung pebble). */
export const rimStone = pebble;

/** Lá đa/bồ đề rơi: hình tim có đuôi nhọn, dài ~0,22 m (≈ 10 tam giác). */
export function fallingLeaf(): G {
  const s = new THREE.Shape();
  s.moveTo(0, -0.1);
  s.bezierCurveTo(0.1, -0.06, 0.1, 0.06, 0, 0.12);
  s.bezierCurveTo(-0.1, 0.06, -0.1, -0.06, 0, -0.1);
  return paint(new THREE.ShapeGeometry(s, 3), "#ffffff");
}

export const COUNTS = {
  tufts: 420,
  flowersYellow: 45,
  flowersWhite: 45,
  pebbles: 36,
  rimStones: 40,
  lilyPads: 16,
  lotus: 5,
  buds: 4,
  koi: 3,
  leaves: 40,
} as const;
