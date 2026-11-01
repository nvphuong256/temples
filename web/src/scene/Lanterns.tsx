// Đèn lồng (hiên chính điện + tam quan): sáng về đêm, đung đưa nhẹ. Một useFrame cho cả nhóm.
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { SCENE_COLORS } from "@cvo/shared";
import { useUi } from "../state/store";
import { GATE_Z, HALL } from "./layout";
import { M } from "./materials";

const SPOTS: [number, number, number][] = [
  ...[-2, -1, 0, 1, 2].map((i): [number, number, number] => [
    i * 5.5,
    6.6,
    HALL.z + HALL.d / 2 - 1.4,
  ]),
  [-6, 5.2, GATE_Z + 0.9],
  [6, 5.2, GATE_Z + 0.9],
];

export function Lanterns() {
  const night = useUi((s) => s.night);
  const bodies = useRef<(Mesh | null)[]>([]);
  useEffect(() => {
    M.lantern.emissiveIntensity = night ? 1.6 : 0;
  }, [night]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bodies.current.forEach((b, i) => {
      if (b) b.rotation.z = Math.sin(t * 1.2 + i) * 0.06;
    });
  });

  return (
    <group>
      {SPOTS.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh
            ref={(m) => {
              bodies.current[i] = m;
            }}
            material={M.lantern}
            scale-y={1.25}
          >
            <sphereGeometry args={[0.45, 12, 10]} />
          </mesh>
          <mesh material={M.woodDark} position-y={1}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 4]} />
          </mesh>
          {/* Chỉ 3 đèn có nguồn sáng thật để giữ hiệu năng; còn lại chỉ phát sáng (emissive). */}
          {(i === 2 || i >= 5) && (
            <pointLight
              color={SCENE_COLORS.lanternGlow}
              intensity={night ? 6 : 0}
              distance={10}
              decay={1.5}
              position-y={-0.2}
            />
          )}
        </group>
      ))}
    </group>
  );
}
