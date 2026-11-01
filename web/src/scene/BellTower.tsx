// Gác chuông chibi (x = 14, z = -4): bệ đá bo, xà son mập, mái chồng diêm nhỏ cong + hồ lô đỉnh,
// chuông đồng có đai hoa văn và núm, chày gỗ treo dây bên hông. Cột nằm trong Columns.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BELL_TOWER } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";
import { lathe, merge, rbox, rod, xf } from "./arch/geom";

const C = 1.2; // nửa khoảng cột
const BELL_Y = 2.05;

function towerGeometry() {
  const beams = merge([
    ...[1, -1].flatMap((s) => [
      xf(rbox(2 * C + 0.7, 0.36, 0.42, 0.15), [0, 4.3, s * C]),
      xf(rbox(0.42, 0.36, 2 * C + 0.7, 0.15), [s * C, 4.3, 0]),
      xf(rbox(2 * C, 0.22, 0.26, 0.1), [0, 3.75, s * C]),
    ]),
    // Xà treo chuông.
    xf(rbox(2 * C, 0.4, 0.44, 0.16), [0, 4.3, 0]),
  ]);
  const stone = merge([xf(rbox(2 * C + 1.6, 0.2, 2 * C + 1.6, 0.09), [0, 0.1, 0])]);
  const neck = xf(rbox(1.9, 0.7, 1.9, 0.18), [0, 5.55, 0]);
  // Chuông: thân đồng loe miệng, vành trong (miệng mở).
  const bell = lathe(
    [
      [0.58, 0.16],
      [0.7, 0.03],
      [0.8, 0.0],
      [0.82, 0.1],
      [0.72, 0.32],
      [0.63, 0.75],
      [0.61, 1.25],
      [0.55, 1.6],
      [0.38, 1.8],
      [0.001, 1.86],
    ],
    20,
  );
  const deco: THREE.BufferGeometry[] = [
    // Đai hoa văn: hai vòng đai + bốn dải dọc.
    xf(new THREE.TorusGeometry(0.73, 0.05, 4, 20), [0, 0.34, 0], [Math.PI / 2, 0, 0]),
    xf(new THREE.TorusGeometry(0.62, 0.045, 4, 20), [0, 1.18, 0], [Math.PI / 2, 0, 0]),
    xf(new THREE.TorusGeometry(0.55, 0.04, 4, 20), [0, 1.58, 0], [Math.PI / 2, 0, 0]),
    // Bồ lao (quai treo).
    xf(new THREE.TorusGeometry(0.17, 0.06, 6, 14), [0, 2.0, 0]),
    // Núm vú chuông (vòng nốt tròn) + núm đánh hình hoa sen phía trước.
    xf(new THREE.CircleGeometry(0.17, 14), [0, 0.6, 0.71], [-0.12, 0, 0]),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    deco.push(
      xf(new THREE.SphereGeometry(0.05, 6, 4), [Math.sin(a) * 0.6, 1.4, Math.cos(a) * 0.6]),
    );
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    deco.push(
      xf(
        rbox(0.09, 0.84, 0.05, 0.02, 1),
        [Math.sin(a) * 0.63, 0.76, Math.cos(a) * 0.63],
        [0.06, a, 0],
      ),
    );
  }
  // Chày gỗ treo ngang bằng hai dây, đầu chày tròn.
  const log = rod([-2.15, 2.75, 0], [-0.98, 2.75, 0], 0.15, 10, true);
  const ropes = merge([
    rod([-1.95, 2.75, 0], [-1.3, 4.15, 0], 0.025, 4),
    rod([-1.2, 2.75, 0], [-1.25, 4.15, 0], 0.025, 4),
  ]);
  const finial = lathe(
    [
      [0.001, 0],
      [0.2, 0.02],
      [0.24, 0.16],
      [0.12, 0.3],
      [0.17, 0.42],
      [0.13, 0.56],
      [0.03, 0.66],
      [0.001, 0.7],
    ],
    12,
  );
  return { beams, stone, neck, bell, deco: merge(deco), log, ropes, finial };
}

export function BellTower() {
  const g = useMemo(towerGeometry, []);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  return (
    <group position={[BELL_TOWER.x, 0, BELL_TOWER.z]}>
      <mesh geometry={g.stone} material={M.stone} receiveShadow />
      <mesh geometry={g.beams} material={M.son} castShadow />
      <mesh geometry={g.neck} material={M.wall} />
      <Roof w={2 * C} d={2 * C} h={2.4} y={4.5} curl={0.7} skirt={0.5} over={0.95} />
      <Roof w={1.5} d={1.5} h={1.3} y={5.8} curl={0.55} over={0.7} />
      <mesh geometry={g.finial} material={M.ceramic} position-y={7.1} />
      <group position-y={BELL_Y}>
        <mesh geometry={g.bell} material={M.bellBronze} castShadow />
        <mesh geometry={g.deco} material={M.gold} />
      </group>
      <mesh geometry={g.log} material={M.woodWarm} castShadow />
      <mesh geometry={g.ropes} material={M.rope} />
    </group>
  );
}
