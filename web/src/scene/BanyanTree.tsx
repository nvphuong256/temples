// Cây đa cổ thụ (x = 19, z = 12) — bản chân thực (nature/trees.ts): gốc nhiều thân xoắn, rễ bạnh, cành vươn
// ngang, cột rễ phụ (có va chạm, layout TREE_PROPS), rèm rễ buông lay theo gió, tán ô bằng thẻ lá.
// Không useFrame — mọi chuyển động trên GPU.
import { useMemo } from "react";
import { TREE } from "./layout";
import { NM, NM_DEPTH } from "./nature/natureMaterials";
import { banyan } from "./nature/trees";

const noRaycast = () => null;

export function BanyanTree() {
  const t = useMemo(() => banyan(), []);
  return (
    <group name="nature-banyan" position={[TREE.x, 0, TREE.z]}>
      <mesh geometry={t.wood} material={NM.bark} castShadow receiveShadow raycast={noRaycast} />
      <mesh geometry={t.core} material={NM.canopyCore} castShadow raycast={noRaycast} />
      <mesh
        geometry={t.cards}
        material={NM.canopyLeaves}
        customDepthMaterial={NM_DEPTH.leaf}
        castShadow
        receiveShadow
        raycast={noRaycast}
      />
      <mesh geometry={t.roots} material={NM.aerialRoot} castShadow raycast={noRaycast} />
    </group>
  );
}
