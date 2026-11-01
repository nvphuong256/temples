// 8 bồ đoàn trong chính điện: gối tròn phồng đỏ son, viền vàng, nút giữa — 3 InstancedMesh.
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CUSHIONS, HALL } from "./layout";
import { M } from "./materials";
import { puffGeometry } from "./arch/AltarSet";

export function Cushions() {
  const geo = useMemo(
    () => ({
      body: puffGeometry(0.72, 0.24, 14),
      trim: new THREE.TorusGeometry(0.71, 0.035, 3, 16).rotateX(Math.PI / 2).translate(0, 0.11, 0),
      knot: new THREE.SphereGeometry(0.09, 8, 4).scale(1, 0.5, 1).translate(0, 0.235, 0),
    }),
    [],
  );
  const body = useRef<THREE.InstancedMesh>(null);
  const trim = useRef<THREE.InstancedMesh>(null);
  const knot = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    CUSHIONS.forEach((c, i) => {
      m.makeTranslation(c.x, HALL.floorH + 0.005, c.z);
      for (const r of [body, trim, knot]) r.current?.setMatrixAt(i, m);
    });
    for (const r of [body, trim, knot]) {
      if (!r.current) continue;
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
  }, []);
  return (
    <>
      <instancedMesh
        ref={body}
        args={[geo.body, M.cushion, CUSHIONS.length]}
        receiveShadow
        castShadow
      />
      <instancedMesh ref={trim} args={[geo.trim, M.cushionTrim, CUSHIONS.length]} />
      <instancedMesh ref={knot} args={[geo.knot, M.cushionTrim, CUSHIONS.length]} />
    </>
  );
}
