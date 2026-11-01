import { describe, expect, it } from "vitest";
import * as G from "../../web/src/scene/nature/geometries";
import { BAMBOO_CLUMPS, POTS, wallPlantSpots } from "../../web/src/scene/nature/scatter";

describe("nature triangle budget (≤ 40k, docs/06-chibi-plan.md)", () => {
  it("garden + pond + banyan + leaves fit the budget", () => {
    const C = G.COUNTS;
    const wall = wallPlantSpots(404);
    const parts: Record<string, number> = {
      tufts: G.triCount(G.grassTuft()) * C.tufts,
      flowers: G.triCount(G.flower("#fff", "#ff0")) * (C.flowersYellow + C.flowersWhite),
      pebbles: G.triCount(G.pebble()) * C.pebbles,
      bushes: G.triCount(G.bush()) * wall.bush.length,
      ferns: G.triCount(G.fern()) * wall.fern.length,
      bamboo: G.triCount(G.bambooClump()) * BAMBOO_CLUMPS.length,
      pots: G.triCount(G.bonsaiPot()) * POTS.length,
      rim: G.triCount(G.pebble()) * C.rimStones,
      pads: G.triCount(G.lilyPad()) * C.lilyPads,
      lotus: G.triCount(G.lotusFlower()) * C.lotus + G.triCount(G.lotusBud()) * C.buds,
      koi: G.triCount(G.koi()) * C.koi,
      water: 48 + 40,
      banyan:
        G.triCount(G.banyanTrunk()) + G.triCount(G.banyanCanopy()) + G.triCount(G.aerialRoots()),
      leaves: G.triCount(G.fallingLeaf()) * C.leaves,
      ground: 600,
    };
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    console.info("nature triangles", JSON.stringify(parts), "total", total);
    expect(total).toBeLessThanOrEqual(40_000);
  });
});
