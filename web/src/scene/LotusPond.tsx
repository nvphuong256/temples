// Ao sen (x = -19, z = 12): mặt nước, bờ đá, lá sen + hoa sen (InstancedMesh).
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { POND } from "./layout";
import { M } from "./materials";

const LEAVES = 14;

export function LotusPond() {
  const leaves = useRef<THREE.InstancedMesh>(null);
  const flowers = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(
    () =>
      Array.from({ length: LEAVES }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 1 + Math.random() * 5;
        return {
          x: POND.x + Math.cos(a) * r,
          z: POND.z + Math.sin(a) * r,
          s: 0.7 + Math.random() * 0.5,
        };
      }),
    [],
  );
  const flowerSpots = spots.filter((_, i) => i % 3 === 0);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach((s, i) => {
      o.position.set(s.x, 0.12, s.z);
      o.rotation.set(-Math.PI / 2, 0, 0);
      o.scale.setScalar(s.s);
      o.updateMatrix();
      leaves.current?.setMatrixAt(i, o.matrix);
    });
    flowerSpots.forEach((s, i) => {
      o.position.set(s.x, 0.5, s.z);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      flowers.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [leaves.current, flowers.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [spots, flowerSpots]);

  return (
    <group>
      <mesh material={M.water} rotation-x={-Math.PI / 2} position={[POND.x, 0.05, POND.z]}>
        <circleGeometry args={[POND.r, 40]} />
      </mesh>
      <mesh material={M.stone} rotation-x={Math.PI / 2} position={[POND.x, 0.2, POND.z]}>
        <torusGeometry args={[POND.r, 0.35, 8, 48]} />
      </mesh>
      <instancedMesh ref={leaves} args={[undefined, M.lotusLeaf, LEAVES]}>
        <circleGeometry args={[1, 14]} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, M.lotus, flowerSpots.length]}>
        <coneGeometry args={[0.35, 0.6, 8]} />
      </instancedMesh>
    </group>
  );
}
