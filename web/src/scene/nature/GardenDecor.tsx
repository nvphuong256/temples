// Sân vườn chibi (phiên 3): cụm cỏ, hoa vàng/trắng, đá cuội, bụi cây + dương xỉ dọc tường, khóm tre bốn góc,
// hai chậu cây cảnh bên bậc chính điện. Tất cả instanced + withWindSway (GPU), không useFrame.
// Chỉ trang trí: đặt ngoài vùng đi lại chính, không đổi va chạm, tắt raycast.
import { useMemo } from "react";
import { CHIBI_NATURE as N } from "@cvo/shared";
import * as G from "./geometries";
import { Instances, type Placement } from "./Instances";
import { NM } from "./natureMaterials";
import { BAMBOO_CLUMPS, borderSpots, POTS, rng, scatter, wallPlantSpots } from "./scatter";

const PEBBLE_COLORS = [N.pebble, N.stone, N.stoneWarm, "#C4BDB0"];

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
    const bushes: Placement[] = wall.bush.map((p) => ({ ...p, ry: p.a, s: 0.85 + p.s * 0.6 }));
    const ferns: Placement[] = wall.fern.map((p) => ({ ...p, ry: p.a, s: 0.9 + p.s * 0.5 }));
    const bamboo: Placement[] = BAMBOO_CLUMPS.map((p) => ({ ...p, s: 1 }));
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
      bush: G.bush(),
      fern: G.fern(),
      bamboo: G.bambooClump(),
      pot: G.bonsaiPot(),
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
      <Instances geometry={geo.bush} material={NM.bush} items={g.bushes} castShadow />
      <Instances geometry={geo.fern} material={NM.fern} items={g.ferns} />
      <Instances geometry={geo.bamboo} material={NM.bamboo} items={g.bamboo} castShadow />
      <Instances geometry={geo.pot} material={NM.pot} items={g.pots} castShadow />
    </group>
  );
}
