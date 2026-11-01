// Mọi cột (tam quan, chính điện, gác chuông): cột son mập hơi thuôn, đai vàng trên/dưới, đấu gỗ đầu cột,
// chân tảng đá tròn bo. 4 InstancedMesh = 4 draw call. Chân cột đặt theo mặt sàn (nền điện cao 1 m).
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLUMNS, HALL, groundHeight } from "./layout";
import { lathe, xf } from "./arch/geom";
import { M } from "./materials";

const R = 0.42;
// Chính điện chùa Việt luôn có số gian lẻ: không vẽ hai cột ở trục giữa (x = 0) để lối nhìn từ cửa vào
// tượng Phật thông thoáng. Chỉ là hình ảnh — layout.ts không đổi (cột không có va chạm).
const SHOWN = COLUMNS.filter(
  (c) => !(Math.abs(c.x - HALL.x) < 0.01 && Math.abs(c.z - HALL.z) < HALL.d),
);
const RADIAL = 12;
const RADIAL_SMALL = 10;

function columnGeometries() {
  // Thân cột đơn vị (cao 1, scale theo chiều cao): thuôn nhẹ, hơi phình (mập).
  const body = lathe(
    [
      [R, 0],
      [R * 1.04, 0.35],
      [R * 0.94, 1],
    ],
    RADIAL,
  );
  const band = lathe(
    [
      [R * 0.98, 0],
      [R * 1.13, 0.05],
      [R * 1.13, 0.17],
      [R * 0.96, 0.22],
    ],
    RADIAL_SMALL,
  );
  // Chân tảng: trống đá tròn bo mép.
  const base = lathe(
    [
      [0.01, 0.34],
      [0.56, 0.32],
      [0.7, 0.17],
      [0.62, 0],
    ],
    RADIAL_SMALL,
  );
  // Đấu đầu cột: khối tròn dẹt + nụ.
  const cap = lathe(
    [
      [0.01, 0.34],
      [0.5, 0.34],
      [0.56, 0.22],
      [0.46, 0.05],
      [0.36, 0],
    ],
    RADIAL_SMALL,
  );
  return { body, band, base, cap: xf(cap, [0, -0.3, 0]) };
}

export function Columns() {
  const geo = useMemo(columnGeometries, []);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const bands = useRef<THREE.InstancedMesh>(null);
  const bases = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    const v = new THREE.Vector3();
    SHOWN.forEach((c, i) => {
      const y0 = groundHeight(c);
      const foot = y0 + 0.3;
      m.compose(v.set(c.x, foot, c.z), q, new THREE.Vector3(1, c.h - foot, 1));
      bodies.current?.setMatrixAt(i, m);
      m.compose(v.set(c.x, y0 + 0.38, c.z), q, one);
      bands.current?.setMatrixAt(i * 2, m);
      m.compose(v.set(c.x, c.h - 0.75, c.z), q, one);
      bands.current?.setMatrixAt(i * 2 + 1, m);
      m.compose(v.set(c.x, y0, c.z), q, one);
      bases.current?.setMatrixAt(i, m);
      m.compose(v.set(c.x, c.h, c.z), q, one);
      caps.current?.setMatrixAt(i, m);
    });
    for (const r of [bodies, bands, bases, caps]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, []);

  return (
    <>
      <instancedMesh ref={bodies} args={[geo.body, M.son, SHOWN.length]} castShadow />
      <instancedMesh ref={bands} args={[geo.band, M.gold, SHOWN.length * 2]} />
      <instancedMesh ref={bases} args={[geo.base, M.stone, SHOWN.length]} receiveShadow />
      <instancedMesh ref={caps} args={[geo.cap, M.woodWarm, SHOWN.length]} />
    </>
  );
}
