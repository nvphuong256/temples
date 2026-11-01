// Tượng Phật Thích Ca ngồi thiền trên tòa sen nhiều cánh — TRANG NGHIÊM: mắt khép, mày cong dài, miệng
// hiền (vẽ canvas), tai dài, nhục kế, tóc xoắn ốc, tay kết ấn thiền định; thếp vàng ấm, hào quang sau đầu.
// Khối tròn đầy đặn hợp phong cách chibi nhưng tỷ lệ người lớn (không mắt to, không biểu cảm hài).
// Gốc tọa độ = mặt trên ban thờ. Toàn bộ geometry gộp theo vật liệu (7 draw call), không useFrame.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { lathe, merge, sweep, xf } from "./geom";
import { M } from "../materials";

function petal(len: number, wid: number) {
  const g = lathe(
    [
      [0.001, 0],
      [wid * 0.8, len * 0.15],
      [wid, len * 0.45],
      [wid * 0.65, len * 0.8],
      [0.001, len],
    ],
    6,
  );
  g.scale(1, 1, 0.42);
  return g;
}

function buddhaGeometry() {
  const pink: THREE.BufferGeometry[] = [];
  const deep: THREE.BufferGeometry[] = [];
  // Tòa sen: 3 vòng cánh, ngoài thấp nghiêng nhiều, trong cao dựng đứng.
  const rows = [
    { n: 16, r: 1.25, y: 0.18, tilt: 1.05, len: 0.62, wid: 0.24, list: deep },
    { n: 13, r: 0.98, y: 0.3, tilt: 0.7, len: 0.66, wid: 0.25, list: pink },
    { n: 10, r: 0.7, y: 0.42, tilt: 0.38, len: 0.6, wid: 0.24, list: deep },
  ];
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.n; i++) {
      const phi = ((i + (ri % 2) * 0.5) / row.n) * Math.PI * 2;
      const g = petal(row.len, row.wid);
      g.rotateX(row.tilt);
      g.rotateY(phi);
      g.translate(Math.sin(phi) * row.r, row.y, Math.cos(phi) * row.r);
      row.list.push(g);
    }
  });
  const gold: THREE.BufferGeometry[] = [
    // Đế tòa sen (trống vàng) + đài sen.
    lathe(
      [
        [0.001, 0.32],
        [1.18, 0.32],
        [1.32, 0.22],
        [1.36, 0.08],
        [1.24, 0],
      ],
      24,
    ),
    xf(
      lathe(
        [
          [0.001, 0.12],
          [0.95, 0.12],
          [1.0, 0.05],
          [0.9, 0],
        ],
        20,
      ),
      [0, 0.62, 0],
    ),
  ];

  // Thân tượng: y0 = mặt đài sen.
  const y0 = 0.72;
  const robe: THREE.BufferGeometry[] = [
    // Hai chân xếp bằng (kiết già).
    xf(new THREE.SphereGeometry(1, 14, 7), [0, y0 + 0.28, 0.12], [0, 0, 0], [1.2, 0.36, 0.78]),
    // Thân: lathe vai tròn, dẹt trước sau.
    xf(
      lathe(
        [
          [0.001, 0],
          [0.68, 0.02],
          [0.74, 0.3],
          [0.66, 0.75],
          [0.6, 1.08],
          [0.62, 1.26],
          [0.5, 1.42],
          [0.22, 1.52],
          [0.001, 1.54],
        ],
        18,
      ),
      [0, y0 + 0.3, 0],
      [0, 0, 0],
      [1, 1, 0.74],
    ),
  ];
  // Hai cánh tay trong áo: vai → khuỷu → cổ tay (đặt trong lòng).
  for (const s of [1, -1]) {
    robe.push(
      sweep(
        [
          new THREE.Vector3(s * 0.55, y0 + 1.55, 0.02),
          new THREE.Vector3(s * 0.8, y0 + 1.1, 0.1),
          new THREE.Vector3(s * 0.74, y0 + 0.66, 0.36),
          new THREE.Vector3(s * 0.32, y0 + 0.56, 0.6),
        ],
        16,
        10,
        (u) => 0.22 - 0.06 * u,
        { caps: true },
      ),
    );
  }
  // Nếp áo cà sa vắt chéo vai trái (gờ vàng sáng).
  const skin: THREE.BufferGeometry[] = [
    sweep(
      [
        new THREE.Vector3(0.48, y0 + 0.62, 0.5),
        new THREE.Vector3(0.18, y0 + 1.05, 0.5),
        new THREE.Vector3(-0.22, y0 + 1.5, 0.38),
        new THREE.Vector3(-0.42, y0 + 1.78, 0.12),
      ],
      14,
      6,
      () => 0.05,
      { caps: true },
    ),
    // Tay kết ấn thiền định: hai bàn tay chồng nhau, ngửa trong lòng.
    xf(new THREE.SphereGeometry(1, 10, 6), [0, y0 + 0.58, 0.6], [0.15, 0, 0], [0.4, 0.11, 0.25]),
    xf(new THREE.SphereGeometry(1, 10, 6), [0, y0 + 0.65, 0.6], [0.15, 0, 0], [0.36, 0.1, 0.22]),
    // Cổ có ba ngấn.
    xf(new THREE.CylinderGeometry(0.2, 0.24, 0.32, 12, 1, true), [0, y0 + 1.92, 0]),
    // Tai dài (dái tai chảy xuống).
    ...[1, -1].map((s) =>
      xf(
        new THREE.SphereGeometry(1, 10, 8),
        [s * 0.53, y0 + 2.28, -0.02],
        [0, 0, s * -0.08],
        [0.09, 0.3, 0.15],
      ),
    ),
  ];
  const head = xf(
    new THREE.SphereGeometry(0.52, 20, 14),
    [0, y0 + 2.42, 0],
    [0, 0, 0],
    [1, 1.1, 0.98],
  );
  // Tóc xoắn ốc: chỏm tóc + các nốt tròn + nhục kế.
  const hair: THREE.BufferGeometry[] = [
    xf(
      new THREE.SphereGeometry(0.535, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.36),
      [0, y0 + 2.45, -0.01],
      [-0.12, 0, 0],
      [1, 1.1, 0.98],
    ),
    xf(new THREE.SphereGeometry(0.25, 14, 10), [0, y0 + 3.0, -0.03]),
  ];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 26; i++) {
    const yy = 1 - (i / 25) * 0.62; // chỉ nửa trên đầu
    const rr = Math.sqrt(1 - yy * yy);
    const a = i * golden;
    const p = new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr);
    p.applyEuler(new THREE.Euler(-0.12, 0, 0));
    hair.push(
      xf(new THREE.SphereGeometry(0.075, 5, 3), [
        p.x * 0.55,
        y0 + 2.45 + p.y * 0.6,
        p.z * 0.54 - 0.01,
      ]),
    );
  }
  gold.push(
    xf(new THREE.SphereGeometry(0.08, 8, 6), [0, y0 + 3.27, -0.03], [0, 0, 0], [1, 1.4, 1]),
  );

  // Hào quang: vòng sau đầu + vầng thân.
  const halo = [
    xf(new THREE.CircleGeometry(0.88, 32), [0, y0 + 2.45, -0.62]),
    xf(new THREE.TorusGeometry(0.95, 0.06, 4, 32), [0, y0 + 2.45, -0.6]),
    xf(new THREE.TorusGeometry(1.45, 0.07, 4, 36), [0, y0 + 1.5, -0.78], [0, 0, 0], [1, 1.35, 1]),
  ];
  return {
    pink: merge(pink),
    deep: merge(deep),
    gold: merge(gold),
    robe: merge(robe),
    skin: merge(skin),
    head,
    hair: merge(hair),
    halo: merge(halo),
  };
}

export function Buddha({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const g = useMemo(buddhaGeometry, []);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  return (
    <group position={position} scale={scale}>
      <mesh geometry={g.pink} material={M.lotusThrone} castShadow />
      <mesh geometry={g.deep} material={M.lotusThroneDeep} castShadow />
      <mesh geometry={g.gold} material={M.gold} />
      <mesh geometry={g.robe} material={M.buddhaRobe} castShadow />
      <mesh geometry={g.skin} material={M.buddha} />
      <mesh geometry={g.head} material={M.buddhaFace} />
      <mesh geometry={g.hair} material={M.buddhaRobe} />
      <mesh geometry={g.halo} material={M.halo} />
    </group>
  );
}
