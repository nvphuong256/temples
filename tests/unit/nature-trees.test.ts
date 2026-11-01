import { describe, expect, it } from "vitest";
import { clampPos, TREE, TREE_PROPS } from "../../web/src/scene/layout";
import * as T from "../../web/src/scene/nature/trees";

const parts = { banyan: T.banyan(), bamboo: T.bambooClump(), shrub: T.shrub(), bonsai: T.bonsai() };

describe("realistic trees (nature/trees.ts)", () => {
  it("every part is non-indexed with position/normal/uv/color", () => {
    for (const [name, tree] of Object.entries(parts))
      for (const g of Object.values(tree)) {
        if (!g) continue;
        expect(g.index, name).toBeNull();
        for (const a of ["position", "normal", "uv", "color"])
          expect(g.getAttribute(a), `${name}.${a}`).toBeTruthy();
      }
  });

  it("bamboo culms taper to a point (tip radius ≤ 1 cm)", () => {
    const pos = parts.bamboo.wood?.getAttribute("position");
    expect(pos).toBeTruthy();
    if (!pos) return;
    // đỉnh cao nhất phải thuộc một vòng gần như suy biến về một điểm
    let top = 0;
    for (let i = 1; i < pos.count; i++) if (pos.getY(i) > pos.getY(top)) top = i;
    let ring = 0;
    for (let i = 0; i < pos.count; i++)
      if (Math.abs(pos.getY(i) - pos.getY(top)) < 0.05)
        ring = Math.max(ring, Math.hypot(pos.getX(i) - pos.getX(top), pos.getZ(i) - pos.getZ(top)));
    expect(ring).toBeLessThanOrEqual(0.02);
  });

  it("banyan aerial roots carry hang factor in uv.y (0 top → 1 tip)", () => {
    const uv = parts.banyan.roots?.getAttribute("uv");
    expect(uv).toBeTruthy();
    if (!uv) return;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      min = Math.min(min, uv.getY(i));
      max = Math.max(max, uv.getY(i));
    }
    expect(min).toBeCloseTo(0, 5);
    expect(max).toBeCloseTo(1, 5);
  });

  it("players cannot walk through banyan prop roots", () => {
    for (const t of TREE_PROPS) {
      const p = clampPos({ x: TREE.x + t.dx + 0.1, z: TREE.z + t.dz });
      expect(Math.hypot(p.x - TREE.x - t.dx, p.z - TREE.z - t.dz)).toBeGreaterThanOrEqual(0.7);
    }
  });
});
