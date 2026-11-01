// Mái đao cong (ngói mũi hài): hai mái cong vút ở góc + bờ nóc + lưỡng long chầu nguyệt giản lược.
import { useMemo } from "react";
import * as THREE from "three";
import { M } from "./materials";

interface Props {
  w: number;
  d: number;
  /** Chiều cao mái. */
  h: number;
  /** Cao độ chân mái. */
  y: number;
  /** Độ cong đầu đao. */
  curl: number;
  position?: [number, number, number];
}

function slopeGeometry(w: number, d: number, h: number, curl: number) {
  const span = w + 3.2;
  const slope = Math.hypot(d / 2 + 1.6, h);
  const geo = new THREE.PlaneGeometry(span, slope, 32, 6);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const ly = p.getY(i);
    const e = Math.max(0, (Math.abs(x) - span * 0.32) / (span * 0.18));
    const t = (slope / 2 - ly) / slope;
    p.setZ(i, curl * e * e * t);
  }
  geo.computeVertexNormals();
  return geo;
}

export function Roof({ w, d, h, y, curl, position }: Props) {
  const geo = useMemo(() => slopeGeometry(w, d, h, curl), [w, d, h, curl]);
  const ang = Math.atan2(h, d / 2 + 1.6);
  return (
    <group position={position}>
      {[0, Math.PI].map((ry) => (
        <group key={ry} rotation-y={ry}>
          <mesh
            geometry={geo}
            material={M.tile}
            rotation-x={ang - Math.PI / 2}
            position={[0, y + h / 2, d / 4 + 0.8]}
            castShadow
            receiveShadow
          />
        </group>
      ))}
      <mesh material={M.woodDark} position={[0, y + h + 0.2, 0]}>
        <boxGeometry args={[w + 1, 0.5, 0.9]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} material={M.gold} position={[s * (w / 2 + 0.2), y + h + 0.6, 0]}>
          <sphereGeometry args={[0.55, 10, 8]} />
        </mesh>
      ))}
      <mesh material={M.gold} position={[0, y + h + 0.9, 0]}>
        <torusGeometry args={[0.6, 0.14, 8, 20]} />
      </mesh>
    </group>
  );
}
