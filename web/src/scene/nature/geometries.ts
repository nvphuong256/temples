// Hình khối chibi cho thiên nhiên — chỉ three.js (không DOM) để test đếm tam giác được.
// Mọi geometry có đủ position/normal/uv/color (không index) để gộp bằng mergeGeometries;
// màu tô theo đỉnh (vertexColors) → một material cho cả vật thể, ít draw call.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { rng } from "./scatter";

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

/** Màu chuyển theo độ cao cục bộ y ∈ [y0, y1]. */
function gradY(a: string, b: string, y0: number, y1: number) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return (p: THREE.Vector3, c: THREE.Color) =>
    c.copy(ca).lerp(cb, THREE.MathUtils.clamp((p.y - y0) / (y1 - y0), 0, 1));
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

/** Bụi cây tròn: 3 khối mây lá, tối dưới sáng trên (240 tam giác). */
export function bush(): G {
  const blobs: [number, number, number, number][] = [
    [0, 0.55, 0, 0.7],
    [0.55, 0.42, 0.15, 0.5],
    [-0.45, 0.4, -0.2, 0.52],
  ];
  return merge(
    blobs.map(([x, y, z, r]) =>
      paint(
        new THREE.IcosahedronGeometry(r, 1).translate(x, y, z),
        gradY(N.leafDark, N.leafLight, 0, 1.2),
      ),
    ),
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

/** Khóm tre: 9 cây, đốt sẫm phình nhẹ, ngọn xòe lá (≈ 700 tam giác). Gốc ở (0, 0, 0). */
export function bambooClump(seed = 7): G {
  const r = rng(seed);
  const parts: G[] = [];
  for (let s = 0; s < 9; s++) {
    const a = r() * Math.PI * 2;
    const d = 0.2 + r() * 0.9;
    const h = 6 + r() * 3;
    const segs = 6;
    const stalk = new THREE.CylinderGeometry(0.11, 0.14, h, 6, segs, true);
    // Đốt tre: vòng ở ranh mỗi đốt phình và sẫm hơn.
    const pos = stalk.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + h / 2;
      const k = Math.abs(y / (h / segs) - Math.round(y / (h / segs))) < 0.01 ? 1.18 : 1;
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
    }
    stalk.computeVertexNormals();
    stalk.translate(0, h / 2, 0);
    const node = new THREE.Color(N.bambooNode);
    const body = new THREE.Color(N.bamboo);
    const g = paint(stalk, (p, c) => {
      const f = Math.abs(p.y / (h / segs) - Math.round(p.y / (h / segs)));
      c.copy(f < 0.01 ? node : body).multiplyScalar(0.85 + 0.15 * (p.y / h));
    });
    // Nghiêng ra ngoài một chút.
    const tilt = new THREE.Matrix4()
      .makeTranslation(Math.cos(a) * d, 0, Math.sin(a) * d)
      .multiply(
        new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)),
          -(0.08 + d * 0.1),
        ),
      );
    g.applyMatrix4(tilt);
    parts.push(g);
    // Lá tre: 3 chùm × 4 lá rủ.
    for (let k = 0; k < 3; k++) {
      const y = h * (0.62 + k * 0.14);
      for (let j = 0; j < 4; j++) {
        const m = tilt
          .clone()
          .multiply(new THREE.Matrix4().makeTranslation(0, y, 0))
          .multiply(rotY(j * 1.57 + k * 0.8 + r()));
        parts.push(
          strip(
            2,
            (t) => 0.11 * Math.sin(Math.PI * Math.min(1, t * 1.2 + 0.15)),
            (t) => [1.05 * t, 0.15 * t - 0.5 * t * t],
            N.bambooNode,
            N.bambooLeaf,
            m,
          ),
        );
      }
    }
  }
  return merge(parts);
}

/** Chậu cây cảnh: chậu men nâu đỏ viền vàng, thân cong, 3 tầng tán mây (≈ 560 tam giác). */
export function bonsaiPot(): G {
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
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0.18, 0.85, 0.05),
    new THREE.Vector3(-0.12, 1.2, -0.04),
    new THREE.Vector3(0.1, 1.55, 0),
  ]);
  const trunk = paint(new THREE.TubeGeometry(curve, 8, 0.07, 5), N.trunk);
  const pads: [number, number, number, number][] = [
    [0.35, 1.05, 0.05, 0.36],
    [-0.32, 1.3, -0.05, 0.34],
    [0.08, 1.68, 0, 0.42],
  ];
  const leaves = pads.map(([x, y, z, rr]) =>
    paint(
      new THREE.IcosahedronGeometry(rr, 1).scale(1.3, 0.62, 1.15).translate(x, y, z),
      gradY(N.leafDark, N.leafLight, y - 0.25, y + 0.25),
    ),
  );
  return merge([pot, trunk, ...leaves]);
}

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

// ---------- Cây đa ----------

/** Thân đa mập xoắn có múi + rễ bạnh + cành chính. Tọa độ cục bộ gốc cây. */
export function banyanTrunk(): G {
  const h = 6.6;
  const g = new THREE.CylinderGeometry(1, 1, h, 14, 8, true);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const t = (pos.getY(i) + h / 2) / h;
    const th = Math.atan2(z, x) + t * 1.3; // xoắn
    const r = (1.45 - 0.6 * t) * (1 + 0.13 * Math.sin(th * 5 + t * 2)) + 0.75 * (1 - t) ** 5;
    pos.setXYZ(i, Math.cos(th) * r, t * h, Math.sin(th) * r);
  }
  g.computeVertexNormals();
  const dark = new THREE.Color(N.trunk);
  const light = new THREE.Color(N.trunkLight);
  const parts: G[] = [
    paint(g, (p, c) =>
      c.copy(dark).lerp(light, 0.5 + 0.5 * Math.sin(Math.atan2(p.z, p.x) * 5 - p.y * 1.3)),
    ),
  ];
  // Rễ bạnh tỏa quanh gốc.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const len = 2.4 + (i % 3) * 0.5;
    const root = new THREE.CylinderGeometry(0.1, 0.5, len, 7, 3)
      .scale(0.8, 1, 1.3)
      .translate(0, len / 2, 0)
      .rotateX(Math.PI / 2 + 0.36) // ngả ra ngoài, chúi xuống đất
      .rotateY(-a + Math.PI / 2)
      .translate(Math.cos(a) * 0.9, 0.75, Math.sin(a) * 0.9);
    parts.push(
      paint(root, (p, c) => c.copy(dark).lerp(light, THREE.MathUtils.clamp(p.y, 0, 1) * 0.6)),
    );
  }
  // Cành chính đỡ tán.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.7;
    const br = new THREE.CylinderGeometry(0.22, 0.45, 3.4, 7, 2, true)
      .translate(0, 1.7, 0)
      .rotateZ(-0.75)
      .rotateY(-a)
      .translate(0, h - 1.3, 0);
    parts.push(paint(br, N.trunk));
  }
  return merge(parts);
}

/** Tán đa: nhiều khối mây lá tròn, đậm dưới nhạt trên (≈ 4,5k tam giác). Có thể seed khác cho biến thể. */
export function banyanCanopy(seed = 11): G {
  const r = rng(seed);
  const blobs: [number, number, number, number][] = [[0, 8.7, 0, 3.3]];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.4;
    const d = 3.6 + r() * 0.8;
    blobs.push([Math.cos(a) * d, 7.4 + r() * 0.9, Math.sin(a) * d, 2.3 + r() * 0.6]);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.5 + r() * 0.3;
    const d = 1.7 + r() * 0.7;
    blobs.push([Math.cos(a) * d, 10 + r() * 0.8, Math.sin(a) * d, 2 + r() * 0.5]);
  }
  const dark = new THREE.Color(N.leafDark);
  const mid = new THREE.Color(N.leaf);
  const light = new THREE.Color(N.leafLight);
  return merge(
    blobs.map(([x, y, z, rad], i) =>
      paint(new THREE.IcosahedronGeometry(rad, 2).scale(1, 0.85, 1).translate(x, y, z), (p, c) => {
        // Khối dưới đậm, khối trên sáng; trong khối: dưới tối, đỉnh sáng (giả AO kiểu hoạt hình).
        const k = THREE.MathUtils.clamp((p.y - (y - rad * 0.85)) / (rad * 1.7), 0, 1);
        c.copy(dark).lerp(i % 3 === 1 ? light : mid, 0.25 + 0.75 * k);
        c.lerp(light, THREE.MathUtils.clamp((p.y - 9) / 3, 0, 1) * 0.5);
      }),
    ),
  );
}

/** Rễ phụ buông từ tán xuống (đung đưa phần đuôi). Đỉnh rễ ở y = ROOT_TOP. */
export const ROOT_TOP = 6.6;
export function aerialRoots(seed = 5): G {
  const r = rng(seed);
  const parts: G[] = [];
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const d = 2.2 + r() * 3;
    const len = 3.2 + r() * 2.6;
    parts.push(
      paint(
        new THREE.CylinderGeometry(0.06, 0.035, len, 4, 4, true).translate(
          Math.cos(a) * d,
          ROOT_TOP - len / 2,
          Math.sin(a) * d,
        ),
        N.trunkLight,
      ),
    );
  }
  return merge(parts);
}

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
