import { describe, expect, it } from "vitest";
import * as M from "../../web/src/scene/chibi/motion";
import {
  applyPose,
  chibiGeos,
  countTriangles,
  createChibi,
  setLod,
} from "../../web/src/scene/chibi/rig";

describe("chibi rig", () => {
  for (const v of ["tieu", "phattu", "tieuan"] as const) {
    it(`${v}: ≤ 4k triangles, LOD 1 much lighter`, () => {
      const rig = createChibi(v, { cushion: v === "tieuan" });
      const hi = countTriangles(rig.root);
      expect(hi).toBeLessThanOrEqual(4000);
      setLod(rig, 1);
      const lo = countTriangles(rig.root);
      expect(lo).toBeLessThan(hi * 0.5);
      expect(rig.details.every((d) => !d.visible)).toBe(true);
    });
  }
  it("shares geometry and colour materials between avatars", () => {
    const a = createChibi("tieu");
    const b = createChibi("tieu");
    const meshA = a.lodMeshes.find((m) => m.key === "skirt")!.mesh;
    const meshB = b.lodMeshes.find((m) => m.key === "skirt")!.mesh;
    expect(meshA.geometry).toBe(chibiGeos(0).skirt);
    expect(meshA.geometry).toBe(meshB.geometry);
    expect(meshA.material).toBe(meshB.material);
    expect(a.headMat).not.toBe(b.headMat); // riêng để chớp mắt
  });
  it("variants differ: tuft, hair bun, staff", () => {
    expect(createChibi("tieu").lodMeshes.some((m) => m.key === "tuft")).toBe(true);
    expect(createChibi("phattu").lodMeshes.some((m) => m.key === "bun")).toBe(true);
    expect(createChibi("tieuan").staff).not.toBeNull();
    expect(createChibi("tieu").staff).toBeNull();
  });
  it("joined hands show palms and hide side hands + staff", () => {
    const rig = createChibi("tieuan");
    const j = M.newJoints();
    j.join = 1;
    applyPose(rig, j);
    expect(rig.palms.visible).toBe(true);
    expect(rig.staff!.visible).toBe(false);
    j.join = 0;
    applyPose(rig, j);
    expect(rig.palms.visible).toBe(false);
    expect(rig.staff!.visible).toBe(true);
  });
});
