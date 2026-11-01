// Lư hương giữa sân (z = 6): đế đá, thân đồng, miệng, ba chân + hương cắm (InstancedMesh, tối đa 40 nén).
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useUi } from "../state/store";
import { BURNER } from "./layout";
import { M } from "./materials";

const MAX_STICKS = 40;

export function IncenseBurner() {
  const sticks = useUi((s) => s.sticks);
  const ref = useRef<THREE.InstancedMesh>(null);
  // Vị trí ngẫu nhiên cố định cho từng nén.
  const slots = useMemo(
    () =>
      Array.from({ length: MAX_STICKS }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.5;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          rx: (Math.random() - 0.5) * 0.25,
          rz: (Math.random() - 0.5) * 0.25,
        };
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    slots.forEach((s, i) => {
      o.position.set(BURNER.x + s.x, 2.1, BURNER.z + s.z);
      o.rotation.set(s.rx, 0, s.rz);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [slots]);

  useLayoutEffect(() => {
    if (ref.current) ref.current.count = Math.min(sticks, MAX_STICKS);
  }, [sticks]);

  return (
    <group>
      <group position={[BURNER.x, 0, BURNER.z]}>
        <mesh material={M.stone} position-y={0.2}>
          <cylinderGeometry args={[1.1, 1, 0.4, 16]} />
        </mesh>
        <mesh material={M.bronze} position-y={1} castShadow>
          <cylinderGeometry args={[1, 0.8, 1.1, 16]} />
        </mesh>
        <mesh material={M.bronze} position-y={1.55} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1, 0.12, 8, 24]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3;
          return (
            <mesh
              key={i}
              material={M.bronze}
              position={[Math.cos(a) * 0.7, 0.6, Math.sin(a) * 0.7]}
            >
              <cylinderGeometry args={[0.08, 0.12, 0.6, 8]} />
            </mesh>
          );
        })}
      </group>
      <instancedMesh ref={ref} args={[undefined, M.incense, MAX_STICKS]}>
        <cylinderGeometry args={[0.025, 0.025, 1.4, 5]} />
      </instancedMesh>
    </group>
  );
}
