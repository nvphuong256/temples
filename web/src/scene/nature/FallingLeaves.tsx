// Lá đa rơi (phiên 3): 40 lá instanced, một useFrame. Lá rơi từ tán đa, bay theo env.windX/Z
// (gió mạnh → bay xa hơn), xoay lật, nằm đất vài giây rồi tái sinh trên tán. Logic thuần ở leafSim.ts.
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { env } from "../env/wind";
import { COUNTS, fallingLeaf } from "./geometries";
import { createLeaves, LEAF_GROUND, stepLeaves } from "./leafSim";
import { NM } from "./natureMaterials";
import { rng } from "./scatter";

const noRaycast = () => null;

export function FallingLeaves() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(fallingLeaf, []);
  const sim = useMemo(() => {
    const r = rng(909);
    return { r, leaves: createLeaves(COUNTS.leaves, r), o: new THREE.Object3D() };
  }, []);

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const green = new THREE.Color(N.fallenLeaf);
    const dry = new THREE.Color(N.fallenLeafDry);
    const c = new THREE.Color();
    sim.leaves.forEach((l, i) => m.setColorAt(i, c.copy(green).lerp(dry, l.tint)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [sim]);

  useFrame((_, delta) => {
    const m = ref.current;
    if (!m) return;
    const dt = Math.min(delta, 0.1);
    stepLeaves(sim.leaves, dt, { x: env.windX, z: env.windZ, strength: env.strength }, sim.r);
    const { o } = sim;
    sim.leaves.forEach((l, i) => {
      o.position.set(l.x, l.y, l.z);
      if (l.y <= LEAF_GROUND) o.rotation.set(-Math.PI / 2, 0, l.ry);
      else o.rotation.set(l.rx, l.ry, l.rz);
      o.scale.setScalar(1.6);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      name="nature-leaves"
      ref={ref}
      args={[geo, NM.leaf, COUNTS.leaves]}
      raycast={noRaycast}
      frustumCulled={false}
    />
  );
}
