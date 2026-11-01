// Cây đa chibi (x = 19, z = 12): thân mập xoắn có múi, rễ bạnh, tán là nhiều khối mây lá tròn
// (withWindSway), rễ phụ buông lay theo gió. Không useFrame — mọi chuyển động trên GPU.
import { useMemo } from "react";
import { TREE } from "./layout";
import * as G from "./nature/geometries";
import { NM } from "./nature/natureMaterials";

const noRaycast = () => null;

export function BanyanTree() {
  const geo = useMemo(
    () => ({ trunk: G.banyanTrunk(), canopy: G.banyanCanopy(), roots: G.aerialRoots() }),
    [],
  );
  return (
    <group name="nature-banyan" position={[TREE.x, 0, TREE.z]}>
      <mesh geometry={geo.trunk} material={NM.trunk} castShadow receiveShadow raycast={noRaycast} />
      <mesh geometry={geo.canopy} material={NM.canopy} castShadow raycast={noRaycast} />
      <mesh geometry={geo.roots} material={NM.aerialRoot} raycast={noRaycast} />
    </group>
  );
}
