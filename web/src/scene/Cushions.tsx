// 8 chiếu lễ (bồ đoàn) trong chính điện — một InstancedMesh.
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { CUSHIONS, HALL } from "./layout";
import { M } from "./materials";

export function Cushions() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    CUSHIONS.forEach((c, i) => {
      m.makeTranslation(c.x, HALL.floorH + 0.07, c.z);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, M.son, CUSHIONS.length]} receiveShadow>
      <cylinderGeometry args={[0.75, 0.75, 0.14, 16]} />
    </instancedMesh>
  );
}
