// Ban thờ sơn son thếp vàng hai cấp (mặt chạm mây vàng), đôi chân nến có ánh sáng ấm, mõ gỗ tròn có dùi
// trên gối, chuông gia trì đồng đặt trên gối đỏ. Gộp theo vật liệu, không useFrame.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { lathe, merge, rbox, rod, xf } from "./geom";
import { M } from "../materials";

/** Gối tròn phồng (dùng cho mõ, chuông). */
export function puffGeometry(r: number, h: number, segs = 16) {
  return lathe(
    [
      [0.001, h],
      [r * 0.7, h * 0.95],
      [r, h * 0.5],
      [r * 0.75, h * 0.04],
      [0.001, 0],
    ],
    segs,
  );
}

function altarGeometry() {
  const lacquer = merge([
    xf(rbox(8, 1.5, 3, 0.18, 2), [0, 1.8, 0]),
    xf(rbox(5.2, 0.6, 2, 0.16, 2), [0, 2.95, -0.25]),
    // Chân quỳ tròn bốn góc.
    ...[
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([sx, sz]) => xf(new THREE.SphereGeometry(0.3, 8, 6), [sx! * 3.7, 1.1, sz! * 1.3])),
  ]);
  const gold = merge([
    // Gờ vàng viền mặt bàn và chân.
    xf(rbox(8.2, 0.16, 3.2, 0.07), [0, 2.58, 0]),
    xf(rbox(8.2, 0.16, 3.2, 0.07), [0, 1.06, 0]),
    xf(rbox(5.4, 0.12, 2.2, 0.05), [0, 3.27, -0.25]),
    // Chân nến: đế tròn + thân + đĩa.
    ...[1, -1].flatMap((s) => [
      xf(
        lathe(
          [
            [0.001, 0],
            [0.22, 0],
            [0.24, 0.06],
            [0.08, 0.16],
            [0.06, 0.5],
            [0.16, 0.56],
            [0.17, 0.6],
            [0.001, 0.6],
          ],
          12,
        ),
        [s * 2.8, 2.66, 0.4],
      ),
    ]),
  ]);
  const candle = merge(
    [1, -1].map((s) => xf(new THREE.CylinderGeometry(0.08, 0.09, 0.4, 10), [s * 2.8, 3.46, 0.4])),
  );
  const flame = merge(
    [1, -1].map((s) =>
      xf(new THREE.SphereGeometry(0.07, 8, 6), [s * 2.8, 3.74, 0.4], [0, 0, 0], [1, 1.7, 1]),
    ),
  );
  return { lacquer, gold, candle, flame };
}

function moGeometry() {
  // Mõ gỗ tròn (cá gỗ cuộn), rãnh miệng phía trước, hai bướu đầu cá; dùi gỗ đầu bọc vải.
  const wood = merge([
    xf(new THREE.SphereGeometry(1, 18, 12), [0, 0.52, 0], [0, 0, 0], [0.5, 0.4, 0.44]),
    ...[1, -1].map((s) => xf(new THREE.SphereGeometry(0.13, 10, 8), [s * 0.2, 0.86, -0.22])),
    rod([0.42, 0.18, 0.3], [0.85, 0.12, -0.15], 0.035, 6, true),
  ]);
  const dark = merge([
    xf(
      new THREE.TorusGeometry(0.43, 0.035, 6, 20, Math.PI * 1.1),
      [0, 0.5, 0],
      [Math.PI / 2, 0, Math.PI * -0.05],
      [1.12, 1, 1],
    ),
  ]);
  const cloth = xf(new THREE.SphereGeometry(0.1, 10, 8), [0.4, 0.19, 0.32]);
  const puff = puffGeometry(0.55, 0.2);
  return { wood, dark, cloth, puff };
}

function bellGeometry() {
  // Chuông gia trì: bát đồng hai lớp vành, đặt trên gối đỏ trên kỷ gỗ thấp.
  const bowl = lathe(
    [
      [0.001, 0.0],
      [0.28, 0.01],
      [0.44, 0.1],
      [0.53, 0.3],
      [0.52, 0.52],
      [0.47, 0.56],
      [0.44, 0.52],
      [0.45, 0.32],
      [0.37, 0.14],
      [0.001, 0.08],
    ],
    20,
  );
  const rim = xf(new THREE.TorusGeometry(0.5, 0.035, 6, 24), [0, 0.54, 0], [Math.PI / 2, 0, 0]);
  const stand = merge([xf(rbox(1.15, 0.3, 1.15, 0.12), [0, 0.15, 0])]);
  const puff = puffGeometry(0.5, 0.2);
  const stick = rod([0.55, 0.36, 0.45], [0.95, 0.36, -0.1], 0.04, 6, true);
  return { bowl, rim, stand, puff, stick };
}

interface Props {
  altarZ: number;
  floorY: number;
  mo: [number, number];
  bell: [number, number];
}

export function AltarSet({ altarZ, floorY, mo, bell }: Props) {
  const a = useMemo(altarGeometry, []);
  const m = useMemo(moGeometry, []);
  const b = useMemo(bellGeometry, []);
  useEffect(
    () => () => [a, m, b].forEach((o) => Object.values(o).forEach((g) => g.dispose())),
    [a, m, b],
  );
  return (
    <group>
      <group position={[0, 0, altarZ]}>
        <mesh geometry={a.lacquer} material={M.lacquer} castShadow />
        <mesh geometry={a.gold} material={M.gold} />
        <mesh geometry={a.candle} material={M.son} />
        <mesh geometry={a.flame}>
          <meshBasicMaterial color="#ffd27a" toneMapped={false} />
        </mesh>
        {/* Mặt trước chạm mây vàng */}
        <mesh material={M.goldCarve} position={[0, 1.82, 1.52]}>
          <planeGeometry args={[6.8, 1.05]} />
        </mesh>
        {[1, -1].map((s) => (
          <pointLight
            key={s}
            color="#ffb060"
            intensity={2}
            distance={8}
            decay={1.5}
            position={[s * 2.8, 3.9, 0.4]}
          />
        ))}
      </group>
      <group position={[mo[0], floorY, mo[1]]} rotation-y={-0.35}>
        <mesh geometry={m.puff} material={M.cushion} />
        <group position-y={0.14}>
          <mesh geometry={m.wood} material={M.woodWarm} castShadow />
          <mesh geometry={m.dark} material={M.woodDark} />
          <mesh geometry={m.cloth} material={M.cushionTrim} />
        </group>
      </group>
      <group position={[bell[0], floorY, bell[1]]} rotation-y={0.35}>
        <mesh geometry={b.stand} material={M.lacquer} />
        <group position-y={0.3}>
          <mesh geometry={b.puff} material={M.cushion} />
          <group position-y={0.14}>
            <mesh geometry={b.bowl} material={M.bellBronze} castShadow />
            <mesh geometry={b.rim} material={M.gold} />
          </group>
        </group>
        <mesh geometry={b.stick} material={M.woodWarm} />
      </group>
    </group>
  );
}
