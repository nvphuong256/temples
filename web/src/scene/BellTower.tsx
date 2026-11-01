// Gác chuông (x = 14, z = -4): mái nhỏ + chuông đồng lớn. Cột nằm trong Columns.
import { BELL_TOWER } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";

export function BellTower() {
  return (
    <group position={[BELL_TOWER.x, 0, BELL_TOWER.z]}>
      <Roof w={3.6} d={3.6} h={1.5} y={4.6} curl={0.5} />
      <mesh material={M.bronze} position-y={2.6}>
        <cylinderGeometry args={[0.9, 1.05, 1.6, 18, 1, true]} />
      </mesh>
      <mesh material={M.bronze} position-y={3.4}>
        <sphereGeometry args={[0.9, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}
