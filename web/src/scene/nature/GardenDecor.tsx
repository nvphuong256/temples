// Sân vườn (phiên 3): cụm cỏ, hoa vàng/trắng, đá cuội, bụi cây + dương xỉ dọc tường, khóm tre bốn góc,
// hai chậu cây cảnh bên bậc chính điện. Tất cả instanced + withWindSway (GPU), không useFrame.
// Tre, bụi, chậu cảnh là cây chân thực (trees.ts): mỗi cây vài InstancedMesh (gỗ, lõi, thẻ lá).
// Chỉ trang trí: đặt ngoài vùng đi lại chính, không đổi va chạm, tắt raycast.
import { useMemo } from "react";
import { CHIBI_NATURE as N } from "@cvo/shared";
import * as G from "./geometries";
import { Instances, type Placement } from "./Instances";
import { NM, NM_DEPTH } from "./natureMaterials";
import { BAMBOO_CLUMPS, borderSpots, POTS, rng, scatter, wallPlantSpots } from "./scatter";
import { bambooClump, bonsai, shrub } from "./trees";

const PEBBLE_COLORS = [N.pebble, N.stone, N.stoneWarm, "#C4BDB0"];
/** Nhân màu từng bụi: lá đậm nhạt khác nhau như cây thật. */
const SHRUB_TINTS = ["#FFFFFF", "#E6EFD6", "#F2EFD8", "#D8E4CC", "#F7F9EC"];

function useGarden() {
  return useMemo(() => {
    const nBorder = Math.round(G.COUNTS.tufts * 0.3);
    const tufts: Placement[] = [
      ...scatter(G.COUNTS.tufts - nBorder, 101),
      ...borderSpots(nBorder, 111),
    ].map((p) => ({
      ...p,
      ry: p.a,
      s: 0.9 + p.s * 0.8,
    }));
    const fl = scatter(G.COUNTS.flowersYellow + G.COUNTS.flowersWhite, 202, 0.5).map((p) => ({
      ...p,
      ry: p.a,
      s: 0.9 + p.s * 0.5,
    }));
    const r = rng(303);
    const pebbles: Placement[] = scatter(G.COUNTS.pebbles, 303, 0.8, 0.9).map((p) => {
      const k = 0.2 + p.s * 0.28;
      return {
        ...p,
        y: k * 0.15,
        ry: p.a,
        s: [k * (1 + r() * 0.5), k * 0.55, k],
        color: PEBBLE_COLORS[Math.floor(r() * PEBBLE_COLORS.length)],
      };
    });
    const wall = wallPlantSpots(404);
    const bushes: Placement[] = wall.bush.map((p, i) => ({
      ...p,
      ry: p.a,
      s: 0.85 + p.s * 0.6,
      color: SHRUB_TINTS[i % SHRUB_TINTS.length],
    }));
    const ferns: Placement[] = wall.fern.map((p) => ({ ...p, ry: p.a, s: 0.9 + p.s * 0.5 }));
    const bamboo: Placement[] = BAMBOO_CLUMPS.map((p, i) => ({ ...p, ry: i * 1.9, s: 1 }));
    const pots: Placement[] = POTS.map((p) => ({ ...p, ry: p.x < 0 ? 0.6 : -0.6, s: 1.3 }));
    const half = Math.ceil(fl.length / 2);
    return {
      tufts,
      yellow: fl.slice(0, half),
      white: fl.slice(half),
      pebbles,
      bushes,
      ferns,
      bamboo,
      pots,
    };
  }, []);
}

export function GardenDecor() {
  const geo = useMemo(
    () => ({
      tuft: G.grassTuft(),
      yellow: G.flower(N.flowerYellow, "#E89A3C"),
      white: G.flower(N.flowerWhite, N.lotusCenter),
      pebble: G.pebble(),
      shrub: shrub(),
      fern: G.fern(),
      bamboo: bambooClump(),
      pot: bonsai(),
    }),
    [],
  );
  const g = useGarden();
  return (
    <group name="nature-garden">
      <Instances geometry={geo.tuft} material={NM.tuft} items={g.tufts} />
      <Instances geometry={geo.yellow} material={NM.flower} items={g.yellow} />
      <Instances geometry={geo.white} material={NM.flower} items={g.white} />
      <Instances geometry={geo.pebble} material={NM.pebble} items={g.pebbles} receiveShadow />
      {geo.shrub.core && (
        <Instances geometry={geo.shrub.core} material={NM.shrubCore} items={g.bushes} castShadow />
      )}
      <Instances
        geometry={geo.shrub.cards}
        material={NM.shrubLeaves}
        items={g.bushes}
        castShadow
        customDepthMaterial={NM_DEPTH.shrub}
      />
      <Instances geometry={geo.fern} material={NM.fern} items={g.ferns} />
      {geo.bamboo.wood && (
        <Instances
          geometry={geo.bamboo.wood}
          material={NM.bambooCulm}
          items={g.bamboo}
          castShadow
        />
      )}
      <Instances
        geometry={geo.bamboo.cards}
        material={NM.bambooLeaves}
        items={g.bamboo}
        castShadow
        customDepthMaterial={NM_DEPTH.bamboo}
      />
      {geo.pot.solid && (
        <Instances geometry={geo.pot.solid} material={NM.pot} items={g.pots} castShadow />
      )}
      {geo.pot.wood && (
        <Instances geometry={geo.pot.wood} material={NM.potWood} items={g.pots} castShadow />
      )}
      {geo.pot.core && (
        <Instances geometry={geo.pot.core} material={NM.potCore} items={g.pots} castShadow />
      )}
      <Instances
        geometry={geo.pot.cards}
        material={NM.potLeaves}
        items={g.pots}
        castShadow
        customDepthMaterial={NM_DEPTH.leaf}
      />
    </group>
  );
}
