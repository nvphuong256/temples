// Cây đa (x = 19, z = 12): thân, 4 tán, rễ phụ.
import { useMemo } from "react";
import { TREE } from "./layout";
import { M } from "./materials";

const CANOPY: [number, number, number, number][] = [
  [0, 8, 0, 5],
  [2.5, 7.5, 1.5, 3.5],
  [-2.5, 7, -1, 3.2],
  [1, 9.5, -2, 3],
];

export function BanyanTree() {
  const roots = useMemo(
    () =>
      Array.from(
        { length: 5 },
        () => [(Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5] as const,
      ),
    [],
  );
  return (
    <group position={[TREE.x, 0, TREE.z]}>
      <mesh material={M.woodDark} position-y={3} castShadow>
        <cylinderGeometry args={[0.9, 1.6, 6, 10]} />
      </mesh>
      {CANOPY.map(([x, y, z, r], i) => (
        <mesh key={i} material={M.leaf} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 12, 10]} />
        </mesh>
      ))}
      {roots.map(([x, z], i) => (
        <mesh key={i} material={M.woodDark} position={[x, 2.8, z]}>
          <cylinderGeometry args={[0.08, 0.12, 5, 6]} />
        </mesh>
      ))}
    </group>
  );
}
