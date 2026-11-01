// Tường bao sân (vôi + mũ tường gỗ tối), chừa lối tam quan.
import { M } from "./materials";

const H = 2.2;
const SEGMENTS: { w: number; x: number; z: number; rot?: number }[] = [
  { w: 12, x: -20, z: 24 },
  { w: 12, x: 20, z: 24 },
  { w: 72, x: -27, z: -4, rot: Math.PI / 2 },
  { w: 72, x: 27, z: -4, rot: Math.PI / 2 },
  { w: 54, x: 0, z: -40 },
];

export function Walls() {
  return (
    <group>
      {SEGMENTS.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation-y={s.rot ?? 0}>
          <mesh material={M.wall} position-y={H / 2} receiveShadow>
            <boxGeometry args={[s.w, H, 0.5]} />
          </mesh>
          <mesh material={M.woodDark} position-y={H + 0.15}>
            <boxGeometry args={[s.w + 0.2, 0.3, 0.9]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
