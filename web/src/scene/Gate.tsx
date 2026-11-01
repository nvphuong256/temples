// Tam quan Phúc Lâm Tự (z = 24): ba gian rõ ràng — gian giữa cao (cổ diêm + biển chữ + mái có lưỡng long
// chầu nguyệt), hai gian bên thấp mái riêng. Xà mập bo tròn; lối đi giữa thông thoáng. Cột nằm trong Columns.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DEFAULT_SETTINGS } from "@cvo/shared";
import { GATE_Z } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";
import { Signboard } from "./Signboard";
import { lathe, merge, rbox, xf } from "./arch/geom";

const CX = 2.4; // cột gian giữa
const SX = 7; // cột gian bên

function gateGeometry() {
  // Xà gỗ son (bo tròn) + đai vàng nhỏ ở đầu xà.
  const beams = merge([
    // Gian bên: xà trên + xà dưới.
    ...[1, -1].flatMap((s) => [
      xf(rbox(SX - CX + 0.2, 0.46, 0.5, 0.2), [(s * (SX + CX)) / 2, 5.55, 0]),
      xf(rbox(SX - CX - 0.4, 0.3, 0.36, 0.14), [(s * (SX + CX)) / 2, 4.75, 0]),
    ]),
    // Gian giữa: xà đỡ biển, xà đỉnh.
    xf(rbox(2 * CX + 0.6, 0.5, 0.56, 0.22), [0, 5.75, 0]),
    xf(rbox(2 * CX + 0.6, 0.44, 0.56, 0.2), [0, 7.95, 0]),
    // Cột nối gian giữa (lên tới mái cao).
    ...[1, -1].map((s) =>
      xf(
        lathe(
          [
            [0.4, 0],
            [0.38, 2.3],
          ],
          14,
        ),
        [s * CX, 5.9, 0],
      ),
    ),
  ]);
  // Chạm vàng: đầu dư (bẩy) cuộn dưới mái gian bên + cặp nụ vàng hai đầu xà giữa.
  const gold = merge([
    ...[1, -1].flatMap((s) => [
      xf(rbox(0.5, 0.5, 0.58, 0.2), [s * (CX + 0.05), 5.75, 0]),
      xf(rbox(0.5, 0.46, 0.58, 0.2), [s * (CX + 0.05), 7.95, 0]),
      xf(new THREE.SphereGeometry(0.2, 10, 8), [s * (SX + 0.1), 5.55, 0.3]),
      xf(new THREE.SphereGeometry(0.2, 10, 8), [s * (SX + 0.1), 5.55, -0.3]),
    ]),
  ]);
  // Ván hồi gian giữa (lưới song nhỏ) sau biển.
  const panel = xf(rbox(2 * CX - 0.4, 1.9, 0.22, 0.1), [0, 6.85, -0.05]);
  return { beams, gold, panel };
}

export function Gate() {
  const sign = DEFAULT_SETTINGS.gate_sign;
  const g = useMemo(gateGeometry, []);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  return (
    <group position={[0, 0, GATE_Z]}>
      <mesh geometry={g.beams} material={M.son} castShadow />
      <mesh geometry={g.gold} material={M.gold} />
      <mesh geometry={g.panel} material={M.lattice} />
      {/* Hai gian bên: mái thấp riêng */}
      {[1, -1].map((s) => (
        <Roof
          key={s}
          w={4.2}
          d={1.6}
          h={1.5}
          y={5.85}
          curl={0.75}
          over={1.0}
          skipDaoX={s > 0 ? -1 : 1}
          position={[s * 4.95, 0, 0]}
        />
      ))}
      {/* Gian giữa: mái cao, lưỡng long chầu nguyệt */}
      <Roof w={2 * CX + 0.8} d={2} h={1.9} y={8.2} curl={0.95} over={1.15} ornate="moon" />
      <Signboard han={sign.han} vi={sign.vi} size={[3.9, 0.98]} position={[0, 6.9, 0.32]} />
    </group>
  );
}
