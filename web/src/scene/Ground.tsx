// Nền: bãi cỏ hoạt hình + sân lát đá bo tròn (trục thần đạo, sân lư hương, thềm điện, lối vào tam quan).
// Nhấp (không kéo) lên nền → đi tới điểm đó. Vật trang trí (nature/*) tắt raycast nên nhấp xuyên tới đây.
import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { goTo } from "../rituals/actions";
import { useUi } from "../state/store";
import { clampPos } from "./layout";
import { NM } from "./nature/natureMaterials";
import { PAVED_DISCS, PAVED_RECTS } from "./nature/scatter";

function onGroundClick(e: ThreeEvent<MouseEvent>) {
  if (useUi.getState().phase !== "temple" || e.delta > 6) return;
  e.stopPropagation();
  goTo(clampPos({ x: e.point.x, z: e.point.z }), null);
}

const GRASS_SIZE = 260;

/** Hình dạng trong mặt phẳng xy với y = -z (sau khi xoay -π/2 quanh x). UV = tọa độ mét. */
function pavingGeometry(m = 0) {
  const shapes: THREE.Shape[] = PAVED_RECTS.map((p) => {
    const x0 = p.x0 - m;
    const x1 = p.x1 + m;
    const z0 = p.z0 - m;
    const z1 = p.z1 + m;
    const r = p.r + m;
    const s = new THREE.Shape();
    const y0 = -z1;
    const y1 = -z0;
    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0);
    s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x1, y1 - r);
    s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
    s.lineTo(x0 + r, y1);
    s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x0, y0 + r);
    s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  });
  for (const d of PAVED_DISCS) {
    const s = new THREE.Shape();
    s.absarc(d.x, -d.z, d.r + m, 0, Math.PI * 2, false);
    shapes.push(s);
  }
  // Các mảng chồng nhau cùng texture tọa độ thế giới → chỗ chồng không lộ đường nối.
  return new THREE.ShapeGeometry(shapes, 10);
}

function grassGeometry() {
  const g = new THREE.PlaneGeometry(GRASS_SIZE, GRASS_SIZE);
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * GRASS_SIZE, uv.getY(i) * GRASS_SIZE);
  return g;
}

export function Ground() {
  const grass = useMemo(grassGeometry, []);
  const paving = useMemo(() => pavingGeometry(), []);
  // Viền đá sẫm hơn bao quanh sân lát → mép mềm, nổi khối kiểu đồ chơi.
  const edge = useMemo(() => pavingGeometry(0.35), []);
  return (
    <group name="nature-ground">
      <mesh
        geometry={grass}
        material={NM.grassGround}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={onGroundClick}
      />
      <mesh
        geometry={edge}
        material={NM.pavingEdge}
        rotation-x={-Math.PI / 2}
        position-y={0.012}
        receiveShadow
        onClick={onGroundClick}
      />
      <mesh
        geometry={paving}
        material={NM.paving}
        rotation-x={-Math.PI / 2}
        position-y={0.024}
        receiveShadow
        onClick={onGroundClick}
      />
    </group>
  );
}
