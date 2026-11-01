// Hình học dùng chung cho kiến trúc chibi: ống thuôn (sweep), lathe, gộp geometry theo vật liệu.
// Tất cả tạo một lần (useMemo / module), không cập nhật từng khung.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type V3 = [number, number, number];

/** Biến đổi geometry tại chỗ: scale → xoay (Euler XYZ) → dời. Trả lại chính nó để viết gọn. */
export function xf(
  g: THREE.BufferGeometry,
  pos: V3 = [0, 0, 0],
  rot: V3 = [0, 0, 0],
  scale: V3 | number = 1,
) {
  const s = typeof scale === "number" ? [scale, scale, scale] : scale;
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
  g.applyMatrix4(m);
  return g;
}

/** Gộp nhiều geometry (khác loại) thành một — chỉ giữ position/normal/uv. */
export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (!list.length) return new THREE.BufferGeometry();
  const anyFlat = list.some((g) => !g.index);
  const prepared = list.map((g) => {
    let h = anyFlat && g.index ? g.toNonIndexed() : g;
    if (h === g) h = g.clone();
    for (const name of Object.keys(h.attributes))
      if (name !== "position" && name !== "normal" && name !== "uv") h.deleteAttribute(name);
    if (!h.attributes.uv) {
      const n = h.attributes.position!.count;
      h.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (!h.attributes.normal) h.computeVertexNormals();
    return h;
  });
  const out = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
  list.forEach((g) => g.dispose());
  if (!out) throw new Error("merge: incompatible geometries");
  return out;
}

/** Ống thuôn chạy theo đường cong; bán kính theo r(u), u ∈ [0, 1]. Có thể bịt hai đầu bằng nửa cầu. */
export function sweep(
  pts: THREE.Vector3[] | THREE.Curve<THREE.Vector3>,
  segs: number,
  radial: number,
  r: (u: number) => number,
  opts: { closed?: boolean; caps?: boolean } = {},
) {
  const curve =
    pts instanceof THREE.Curve
      ? pts
      : new THREE.CatmullRomCurve3(pts, !!opts.closed, "centripetal", 0.5);
  const tube = new THREE.TubeGeometry(curve, segs, 1, radial, !!opts.closed);
  const p = tube.attributes.position as THREE.BufferAttribute;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    curve.getPointAt(Math.min(u, 1), c);
    const rr = r(u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(p, k).sub(c).multiplyScalar(rr).add(c);
      p.setXYZ(k, v.x, v.y, v.z);
    }
  }
  tube.computeVertexNormals();
  if (!opts.caps || opts.closed) return tube;
  const a = curve.getPointAt(0);
  const b = curve.getPointAt(1);
  const capA = xf(new THREE.SphereGeometry(r(0), radial, Math.max(3, radial >> 1)), [
    a.x,
    a.y,
    a.z,
  ]);
  const capB = xf(new THREE.SphereGeometry(r(1), radial, Math.max(3, radial >> 1)), [
    b.x,
    b.y,
    b.z,
  ]);
  return merge([tube, capA, capB]);
}

/** Lathe từ mảng [r, y]. Hồ sơ vẽ từ trên xuống thì tự đảo để mặt luôn hướng ra ngoài. */
export function lathe(profile: [number, number][], segs: number) {
  const pts = profile[0]![1] > profile[profile.length - 1]![1] ? [...profile].reverse() : profile;
  return new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segs,
  );
}

/** Khối hộp bo tròn (đồ chơi). */
export function rbox(w: number, h: number, d: number, radius = 0.12, segs = 1) {
  const r = Math.min(radius, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  return new RoundedBoxGeometry(w, h, d, segs, r);
}

/** Trụ ngang/dọc nối hai điểm (bo hai đầu nếu caps). */
export function rod(a: V3, b: V3, r: number, radial = 6, caps = false) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const g = new THREE.CylinderGeometry(r, r, len, radial, 1, caps);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    vb.clone().sub(va).normalize(),
  );
  const mid = va.add(vb).multiplyScalar(0.5);
  g.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
  if (!caps) return g;
  return merge([
    g,
    xf(new THREE.SphereGeometry(r, radial, 4), a),
    xf(new THREE.SphereGeometry(r, radial, 4), b),
  ]);
}

/** Số tam giác của một geometry. */
export function triCount(g: THREE.BufferGeometry) {
  return (g.index ? g.index.count : g.attributes.position!.count) / 3;
}
