// InstancedMesh tĩnh cho cây cỏ: đặt ma trận một lần, tắt raycast (nhấp xuyên tới nền, đỡ CPU).
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export interface Placement {
  x: number;
  y?: number;
  z: number;
  /** Xoay quanh y. */
  ry?: number;
  /** Tỉ lệ đều hoặc [sx, sy, sz]. */
  s: number | [number, number, number];
  color?: THREE.ColorRepresentation;
}

const noRaycast = () => null;
const _o = new THREE.Object3D();
const _c = new THREE.Color();

export function Instances({
  geometry,
  material,
  items,
  castShadow = false,
  receiveShadow = false,
  customDepthMaterial,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: readonly Placement[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Bóng đổ theo alpha (thẻ lá). */
  customDepthMaterial?: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((p, i) => {
      _o.position.set(p.x, p.y ?? 0, p.z);
      _o.rotation.set(0, p.ry ?? 0, 0);
      if (typeof p.s === "number") _o.scale.setScalar(p.s);
      else _o.scale.set(...p.s);
      _o.updateMatrix();
      m.setMatrixAt(i, _o.matrix);
      if (p.color !== undefined) m.setColorAt(i, _c.set(p.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      raycast={noRaycast}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      customDepthMaterial={customDepthMaterial}
      frustumCulled
    />
  );
}
