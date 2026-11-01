// Đại Hùng Bảo Điện (z = -22, 26 × 18) bản chibi: nền đá bo góc, bậc tam cấp tròn, tường vôi khung gỗ có
// ô cửa sổ tròn, mái chồng diêm hai tầng (lưỡng long chầu nguyệt), cửa võng chạm vàng giữa các cột trước,
// hoành phi + câu đối khung bo, ban thờ, tượng Phật tòa sen, mõ, chuông gia trì.
// Cột nằm trong Columns, bồ đoàn trong Cushions. Giữ đúng mặt sàn/va chạm của layout.ts.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DEFAULT_SETTINGS } from "@cvo/shared";
import { HALL } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";
import { Couplet, Signboard } from "./Signboard";
import { merge, rbox, xf } from "./arch/geom";
import { AltarSet } from "./arch/AltarSet";
import { Buddha } from "./arch/Buddha";

const { w, d, z, floorH } = HALL;
const front = z + d / 2; // -13
const back = z - d / 2; // -31
const COL_FRONT_Z = front - 1.2;
const WALL_TOP = 7.9;
const BAYS = [-12, -6, 0, 6, 12];

/** Cửa võng: ván vòm cong (mép dưới hình cung), bo mép, đặt sau hàng cột trước. */
function archPanel(width: number, height: number) {
  const s = new THREE.Shape();
  const hw = width / 2;
  s.moveTo(-hw, 0);
  s.lineTo(-hw, height);
  s.lineTo(hw, height);
  s.lineTo(hw, 0);
  // Mép dưới: cung nhiều nhịp mềm (vòm võng).
  const steps = 18;
  for (let i = 1; i < steps; i++) {
    const u = i / steps;
    const x = hw - u * width;
    const arch = Math.sin(Math.PI * u);
    const scallop = 0.08 * Math.abs(Math.sin(Math.PI * u * 5));
    s.lineTo(x, height * (0.15 + 0.6 * Math.pow(arch, 0.6)) - scallop);
  }
  s.lineTo(-hw, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // UV theo kích thước để texture mây vàng không bị kéo giãn.
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.2, uv.getY(i) / 1.1);
  return g;
}

function hallGeometry() {
  const stone = merge([
    // Nền đá bo góc (mặt nền đúng cao 1 m) + bậc tam cấp tròn (hai bậc + mặt nền).
    xf(rbox(w + 2, floorH, d + 2, 0.3, 2), [0, floorH / 2, z]),
    xf(rbox(10.2, 0.36, 2.0, 0.16), [0, 0.18, front + 2.8 - 1.0]),
    xf(rbox(9.6, 0.7, 1.1, 0.16), [0, 0.35, front + 1.15]),
    // Hai trụ đá + quả cầu hai bên bậc.
    ...[1, -1].flatMap((s) => [
      xf(rbox(0.8, 1.0, 0.8, 0.2), [s * 5.6, 0.5, front + 2.1]),
      xf(new THREE.SphereGeometry(0.42, 10, 6), [s * 5.6, 1.35, front + 2.1]),
    ]),
  ]);
  const plinth = xf(rbox(w + 2.3, 0.28, d + 2.3, 0.12), [0, 0.14, z]);

  const wallH = WALL_TOP - floorH;
  const wallY = floorH + wallH / 2;
  const walls = merge([
    xf(rbox(w, wallH, 0.4, 0.15), [0, wallY, back + 0.6]),
    ...[1, -1].map((s) => xf(rbox(0.4, wallH, d - 2, 0.15), [s * (w / 2 - 0.4), wallY, z])),
    // Cổ diêm (thân tầng mái trên) — đáy là trần.
    xf(rbox(17.6, 1.3, 9.6, 0.25), [0, 9.7, z]),
  ]);
  // Khung gỗ trên tường: xà đầu tường, rầm chân tường, trụ áp tường; xà trước trên hàng cột.
  const frame: THREE.BufferGeometry[] = [
    xf(rbox(w + 0.2, 0.5, 0.62, 0.18), [0, WALL_TOP - 0.4, back + 0.6]),
    xf(rbox(w + 0.2, 0.36, 0.56, 0.14), [0, floorH + 0.5, back + 0.6]),
    xf(rbox(w + 0.6, 0.62, 0.6, 0.22), [0, 7.35, COL_FRONT_Z]),
    xf(rbox(18, 0.36, 9.9, 0.15), [0, 9.05, z]),
    xf(rbox(18, 0.3, 9.9, 0.13), [0, 10.3, z]),
  ];
  for (const s of [1, -1]) {
    frame.push(
      xf(rbox(0.62, 0.5, d - 1.6, 0.18), [s * (w / 2 - 0.4), WALL_TOP - 0.4, z]),
      xf(rbox(0.56, 0.36, d - 1.6, 0.14), [s * (w / 2 - 0.4), floorH + 0.5, z]),
    );
    for (const zz of [z - 4, z + 4])
      frame.push(xf(rbox(0.58, wallH, 0.3, 0.12), [s * (w / 2 - 0.4), wallY, zz]));
  }
  for (const x of [-9, -3, 3, 9])
    frame.push(xf(rbox(0.3, wallH, 0.58, 0.12), [x, wallY, back + 0.6]));
  // Ô cửa sổ tròn trên tường hồi (khung gỗ xuyên tường + song).
  const rings: THREE.BufferGeometry[] = [];
  const lattice: THREE.BufferGeometry[] = [];
  for (const s of [1, -1])
    for (const zz of [z]) {
      rings.push(
        xf(
          new THREE.TorusGeometry(0.72, 0.26, 5, 12),
          [s * (w / 2 - 0.4), 4.4, zz],
          [0, Math.PI / 2, 0],
        ),
      );
      lattice.push(
        xf(
          new THREE.CylinderGeometry(0.72, 0.72, 0.46, 12),
          [s * (w / 2 - 0.4), 4.4, zz],
          [0, 0, Math.PI / 2],
        ),
      );
    }
  frame.push(...rings);
  return {
    stone,
    plinth,
    walls,
    frame: merge(frame),
    lattice: merge(lattice),
    arch: archPanel(5.5, 1.5),
  };
}

export function Hall() {
  const sign = DEFAULT_SETTINGS.hall_sign;
  const couplets = DEFAULT_SETTINGS.couplets;
  const g = useMemo(hallGeometry, []);
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  const altarZ = z - 4.5;
  return (
    <group>
      <mesh geometry={g.stone} material={M.stone} receiveShadow castShadow />
      <mesh geometry={g.plinth} material={M.stoneDark} receiveShadow />
      <mesh geometry={g.walls} material={M.wall} receiveShadow castShadow />
      <mesh geometry={g.frame} material={M.woodWarm} castShadow />
      <mesh geometry={g.lattice} material={M.lattice} />
      {/* Trần gỗ ô cờ dưới cổ diêm (tự sáng nhẹ để trong điện không tối đen) */}
      <mesh material={M.ceiling} position={[0, 8.85, z]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[17.9, 9.8]} />
      </mesh>

      {/* Mái chồng diêm: tầng dưới (vành) + tầng trên có lưỡng long chầu nguyệt */}
      <Roof
        w={w}
        d={d}
        h={5}
        y={WALL_TOP - 0.05}
        curl={1.3}
        skirt={0.5}
        over={1.5}
        position={[0, 0, z]}
      />
      <Roof
        w={17.2}
        d={9.2}
        h={3.4}
        y={10.35}
        curl={1.25}
        over={1.25}
        ornate
        position={[0, 0, z]}
      />

      {/* Cửa võng chạm vàng sau hàng cột trước (4 gian) */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          geometry={g.arch}
          material={M.goldCarve}
          position={[(BAYS[i]! + BAYS[i + 1]!) / 2, 5.55, COL_FRONT_Z - 0.85]}
        />
      ))}

      <Signboard
        han={sign.han}
        vi={sign.vi}
        size={[5.6, 1.4]}
        position={[0, 6.6, COL_FRONT_Z + 0.62]}
      />
      <Couplet text={couplets.right} position={[-6, 3.9, COL_FRONT_Z + 0.58]} />
      <Couplet text={couplets.left} position={[6, 3.9, COL_FRONT_Z + 0.58]} />

      <AltarSet altarZ={altarZ} floorY={floorH} mo={[3, z + 1]} bell={[-3, z + 1]} />
      <Buddha position={[0, 3.33, altarZ - 0.25]} scale={1.28} />
    </group>
  );
}
