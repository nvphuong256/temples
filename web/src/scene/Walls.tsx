// Tường bao sân chibi: thân vôi bo tròn trên bệ đá, mái ngói mũi hài nhỏ trên đầu tường (viền tròn, bờ nóc
// mập), ô cửa sổ tròn song gỗ, trụ đầu tường có nụ sen. Chừa lối tam quan. Gộp theo vật liệu (6 draw call).
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { M } from "./materials";
import { lathe, merge, rbox, rod, xf } from "./arch/geom";

const H = 2.2;
const T = 0.5;
interface Seg {
  w: number;
  x: number;
  z: number;
  rot?: number;
  /** Vị trí ô cửa tròn dọc tường (m, tính từ tâm đoạn). */
  windows?: number[];
}
const SEGMENTS: Seg[] = [
  { w: 12, x: -20, z: 24, windows: [-2.6, 2.6] },
  { w: 12, x: 20, z: 24, windows: [-2.6, 2.6] },
  { w: 72, x: -27, z: -4, rot: Math.PI / 2, windows: [-20, -6, 8, 22] },
  { w: 72, x: 27, z: -4, rot: Math.PI / 2, windows: [-20, -6, 8, 22] },
  { w: 54, x: 0, z: -40 },
];
const PILLARS: [number, number][] = [
  [-14, 24],
  [14, 24],
  [-27, 32],
  [27, 32],
  [-27, -40],
  [27, -40],
];

/** Mái ngói nhỏ trên đầu tường, chạy dọc trục x, dài L; UV theo mét cho texture ngói. */
function capTiles(L: number) {
  const half = 0.62;
  const rise = 0.36;
  const nx = 1; // mái thẳng theo chiều dài: chỉ cần một đoạn, texture lo phần ngói
  const nc = 4;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= nc; j++) {
      const t = j / nc; // 0 = mép mái, 1 = nóc
      const zz = side * half * (1 - t);
      const y = rise * Math.pow(t, 1.5);
      for (let i = 0; i <= nx; i++) {
        const x = -L / 2 + (i / nx) * L;
        pos.push(x, y, zz);
        uv.push(x / 1.6, (t * half * 1.1) / 1.4);
      }
    }
    const row = nx + 1;
    for (let j = 0; j < nc; j++)
      for (let i = 0; i < nx; i++) {
        const a = base + j * row + i;
        const b = a + row;
        if (side > 0) idx.push(a, a + 1, b, a + 1, b + 1, b);
        else idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function wallGeometry() {
  const lime: THREE.BufferGeometry[] = [];
  const plinth: THREE.BufferGeometry[] = [];
  const tiles: THREE.BufferGeometry[] = [];
  const edge: THREE.BufferGeometry[] = [];
  const ring: THREE.BufferGeometry[] = [];
  const lattice: THREE.BufferGeometry[] = [];
  const place = (g: THREE.BufferGeometry, s: Seg) => xf(g, [s.x, 0, s.z], [0, s.rot ?? 0, 0]);
  for (const s of SEGMENTS) {
    const L = s.w + 0.3;
    lime.push(place(xf(rbox(s.w, H, T, 0.2), [0, H / 2, 0]), s));
    plinth.push(place(xf(rbox(s.w + 0.1, 0.42, T + 0.16, 0.14), [0, 0.21, 0]), s));
    tiles.push(place(xf(capTiles(L), [0, H + 0.12, 0]), s));
    // Đáy mái + viền mái tròn hai bên + bờ nóc mập.
    edge.push(
      place(xf(rbox(L, 0.16, 1.2, 0.07, 1), [0, H + 0.06, 0]), s),
      place(rod([-L / 2, H + 0.12, 0.62], [L / 2, H + 0.12, 0.62], 0.09, 6), s),
      place(rod([-L / 2, H + 0.12, -0.62], [L / 2, H + 0.12, -0.62], 0.09, 6), s),
      place(rod([-L / 2, H + 0.5, 0], [L / 2, H + 0.5, 0], 0.14, 8, true), s),
    );
    for (const wx of s.windows ?? []) {
      ring.push(place(xf(new THREE.TorusGeometry(0.5, 0.2, 4, 10), [wx, 1.25, 0]), s));
      lattice.push(
        place(
          xf(
            new THREE.CylinderGeometry(0.5, 0.5, T + 0.04, 10),
            [wx, 1.25, 0],
            [Math.PI / 2, 0, 0],
          ),
          s,
        ),
      );
    }
  }
  // Trụ đầu tường: thân vôi vuông bo + mũ + nụ sen.
  const bud = lathe(
    [
      [0.001, 0],
      [0.28, 0.04],
      [0.34, 0.24],
      [0.2, 0.48],
      [0.001, 0.62],
    ],
    12,
  );
  for (const [x, z] of PILLARS) {
    lime.push(xf(rbox(1, H + 0.9, 1, 0.24), [x, (H + 0.9) / 2, z]));
    plinth.push(xf(rbox(1.15, 0.5, 1.15, 0.16), [x, 0.25, z]));
    edge.push(xf(rbox(1.3, 0.26, 1.3, 0.12), [x, H + 1.0, z]));
    ring.push(xf(bud.clone(), [x, H + 1.12, z]));
  }
  bud.dispose();
  return {
    lime: merge(lime),
    plinth: merge(plinth),
    tiles: merge(tiles),
    edge: merge(edge),
    ring: merge(ring),
    lattice: merge(lattice),
  };
}

export function Walls() {
  const g = useMemo(wallGeometry, []);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  return (
    <group>
      <mesh geometry={g.lime} material={M.wall} receiveShadow castShadow />
      <mesh geometry={g.plinth} material={M.plinth} receiveShadow />
      <mesh geometry={g.tiles} material={M.tile} castShadow />
      <mesh geometry={g.edge} material={M.roofEdge} />
      <mesh geometry={g.ring} material={M.woodWarm} />
      <mesh geometry={g.lattice} material={M.lattice} />
    </group>
  );
}
