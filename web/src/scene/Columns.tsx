// Toàn bộ cột gỗ (tam quan, chính điện, gác chuông) + chân tảng đá: 2 InstancedMesh, 2 draw call.
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { COLUMNS } from "./layout";
import { M } from "./materials";

export function Columns() {
  const cols = useRef<THREE.InstancedMesh>(null);
  const bases = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    COLUMNS.forEach((c, i) => {
      m.compose(new THREE.Vector3(c.x, c.h / 2, c.z), q, new THREE.Vector3(1, c.h, 1));
      cols.current?.setMatrixAt(i, m);
      m.makeTranslation(c.x, 0.12, c.z);
      bases.current?.setMatrixAt(i, m);
    });
    if (cols.current) {
      cols.current.instanceMatrix.needsUpdate = true;
      cols.current.computeBoundingSphere();
    }
    if (bases.current) {
      bases.current.instanceMatrix.needsUpdate = true;
      bases.current.computeBoundingSphere();
    }
  }, []);

  return (
    <>
      <instancedMesh ref={cols} args={[undefined, M.wood, COLUMNS.length]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 1, 12]} />
      </instancedMesh>
      <instancedMesh ref={bases} args={[undefined, M.stone, COLUMNS.length]}>
        <cylinderGeometry args={[0.5, 0.55, 0.25, 12]} />
      </instancedMesh>
    </>
  );
}
