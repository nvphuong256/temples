// Đèn lồng chibi (hiên chính điện + tam quan, giữ vị trí cũ): bầu đỏ tròn mập, chóp/đế vàng, dây treo, tua rua.
// Đung đưa theo gió (nghiêng theo env.windX/windZ, biên độ theo env.strength, lệch pha từng đèn).
// Ban đêm: emissive ấm + quầng sáng (points cộng sáng) + tối đa 3 PointLight thật.
// Mọi phần của 7 đèn là 3 InstancedMesh dùng chung ma trận từng đèn; một useFrame cho cả nhóm.
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CHIBI_FX as F } from "@cvo/shared";
import { useUi } from "../state/store";
import { env } from "./env/wind";
import { GATE_Z, HALL } from "./layout";
import { makeGlowMaterial, pointScale, pointsGeometry } from "./fx/pointMaterials";

/** Tâm bầu đèn (giữ nguyên vị trí cũ). */
const SPOTS: [number, number, number][] = [
  ...[-2, -1, 0, 1, 2].map((i): [number, number, number] => [
    i * 5.5,
    6.6,
    HALL.z + HALL.d / 2 - 1.4,
  ]),
  [-6, 5.2, GATE_Z + 0.9],
  [6, 5.2, GATE_Z + 0.9],
];
const N = SPOTS.length;
/** Điểm treo nằm trên tâm bầu đèn (m). Đèn xoay quanh điểm này. */
const HANG = 1.15;
/** Chỉ 3 đèn có nguồn sáng thật để giữ hiệu năng. */
const LIT = [2, 5, 6];

const v = (x: number, y: number) => new THREE.Vector2(x, y);

function lanternGeometry() {
  // Toàn bộ hình học tính theo gốc = điểm treo (y = 0), bầu đèn ở y = -HANG.
  const c = -HANG;
  const body = new THREE.LatheGeometry(
    [
      v(0.2, c - 0.42),
      v(0.36, c - 0.38),
      v(0.48, c - 0.25),
      v(0.54, c - 0.06),
      v(0.54, c + 0.08),
      v(0.48, c + 0.25),
      v(0.36, c + 0.38),
      v(0.2, c + 0.42),
    ],
    16,
  );
  const cap = new THREE.LatheGeometry(
    [
      v(0.001, c + 0.6),
      v(0.12, c + 0.58),
      v(0.2, c + 0.52),
      v(0.27, c + 0.44),
      v(0.25, c + 0.39),
      v(0.001, c + 0.4),
    ],
    10,
  );
  const foot = new THREE.LatheGeometry(
    [
      v(0.001, c - 0.4),
      v(0.25, c - 0.39),
      v(0.27, c - 0.44),
      v(0.18, c - 0.52),
      v(0.08, c - 0.55),
      v(0.001, c - 0.55),
    ],
    10,
  );
  const knob = new THREE.SphereGeometry(0.07, 10, 6).translate(0, c - 0.6, 0);
  const cord = new THREE.CylinderGeometry(0.018, 0.018, HANG - 0.6 + 0.05, 4, 1, true).translate(
    0,
    -(HANG - 0.6) / 2,
    0,
  );
  const ring = new THREE.TorusGeometry(0.05, 0.02, 4, 10).translate(0, 0, 0);
  const gold = mergeGeometries([cap, foot, knob, cord, ring])!;
  // Tua rua: chùm thuôn mập phía dưới (lathe gợn sóng nhẹ như sợi chỉ).
  const tassel = new THREE.LatheGeometry(
    [
      v(0.03, c - 0.62),
      v(0.07, c - 0.68),
      v(0.1, c - 0.85),
      v(0.13, c - 1.0),
      v(0.11, c - 1.04),
      v(0.001, c - 1.05),
    ],
    8,
  );
  return { body, gold, tassel };
}

export function Lanterns() {
  const night = useUi((s) => s.night);
  const { geo, mats, glow } = useMemo(() => {
    const geo = lanternGeometry();
    const mats = {
      body: new THREE.MeshStandardMaterial({
        color: F.lanternRed,
        emissive: F.lanternEmissive,
        emissiveIntensity: 0,
        roughness: 0.55,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: F.lanternCap,
        metalness: 0.5,
        roughness: 0.35,
      }),
      tassel: new THREE.MeshStandardMaterial({ color: F.tassel, roughness: 0.8 }),
    };
    const g = pointsGeometry(N, new THREE.Vector3(0, 6, 0), 40);
    const col = g.attributes["aColor"] as THREE.BufferAttribute;
    const c = new THREE.Color(F.lanternGlow);
    for (let i = 0; i < N; i++) col.setXYZ(i, c.r, c.g, c.b);
    return { geo, mats, glow: { g, m: makeGlowMaterial(0) } };
  }, []);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const glowK = useRef(0);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), body: new THREE.Vector3() }), []);

  useLayoutEffect(() => {
    for (const m of refs.current) if (m) m.computeBoundingSphere();
  }, []);

  useFrame(({ clock, size, camera, gl }, delta) => {
    const t = clock.elapsedTime;
    const s = env.strength;
    // Sáng/tắt mượt khi đổi ngày–đêm.
    glowK.current += ((night ? 1 : 0) - glowK.current) * Math.min(1, delta * 1.5);
    const k = glowK.current;
    mats.body.emissiveIntensity = k * 0.9;
    const pos = glow.g.attributes["position"] as THREE.BufferAttribute;
    const sz = glow.g.attributes["aSize"] as THREE.BufferAttribute;
    const al = glow.g.attributes["aAlpha"] as THREE.BufferAttribute;
    const { o, body } = tmp;
    for (let i = 0; i < N; i++) {
      const [x, y, z] = SPOTS[i]!;
      // Nghiêng đều theo gió + lắc lệch pha; gió mạnh → lắc rộng và nhanh hơn chút.
      const amp = 0.025 + 0.11 * s;
      const w = 1.1 + 0.5 * s;
      const swX = Math.sin(t * w + i * 1.7) * amp;
      const swZ = Math.sin(t * w * 0.8 + i * 2.3 + 1) * amp * 0.7;
      o.position.set(x, y + HANG, z);
      o.rotation.set(-env.windZ * 0.12 + swZ, 0, env.windX * 0.12 + swX);
      o.updateMatrix();
      for (const m of refs.current) m?.setMatrixAt(i, o.matrix);
      body.set(0, -HANG, 0).applyMatrix4(o.matrix);
      pos.setXYZ(i, body.x, body.y, body.z);
      sz.setX(i, 2.2);
      al.setX(i, k * 0.26);
    }
    for (const m of refs.current) if (m) m.instanceMatrix.needsUpdate = true;
    pos.needsUpdate = sz.needsUpdate = al.needsUpdate = true;
    glow.m.uniforms["uScale"]!.value = pointScale(size.height * gl.getPixelRatio(), camera);
  });

  const parts: [THREE.BufferGeometry, THREE.Material][] = [
    [geo.body, mats.body],
    [geo.gold, mats.gold],
    [geo.tassel, mats.tassel],
  ];

  return (
    <group>
      {parts.map(([g, m], j) => (
        <instancedMesh
          key={j}
          ref={(r) => {
            refs.current[j] = r;
          }}
          args={[g, m, N]}
          frustumCulled={false}
        />
      ))}
      <points geometry={glow.g} material={glow.m} visible={night} frustumCulled={false} />
      {LIT.map((i) => {
        const [x, y, z] = SPOTS[i]!;
        return (
          <pointLight
            key={i}
            color={F.lanternGlow}
            intensity={night ? 6 : 0}
            distance={10}
            decay={1.5}
            position={[x, y - 0.2, z]}
          />
        );
      })}
    </group>
  );
}
