// Vật liệu dùng chung, tạo một lần cho cả cảnh. Kiến trúc lấy màu từ CHIBI_ARCH (phong cách chibi
// Pixar/claymation: bão hòa, ấm, roughness 0,5–0,85); các mục cũ giữ tên vì phiên khác còn dùng.
import * as THREE from "three";
import { CHIBI_ARCH as A, PALETTE, SCENE_COLORS as C } from "@cvo/shared";
import {
  brickTexture,
  buddhaFaceTexture,
  goldCarveTexture,
  latticeTexture,
  tileTexture,
} from "./textures";

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

export const M = {
  wood: std({ color: A.wood, roughness: 0.75 }),
  woodDark: std({ color: A.woodDark, roughness: 0.8 }),
  son: std({ color: A.columnSon, roughness: 0.55 }),
  gold: std({ color: A.gold, metalness: 0.45, roughness: 0.38 }),
  wall: std({ color: A.wallLime, roughness: 0.85 }),
  stone: std({ color: A.stone, roughness: 0.85 }),
  bronze: std({ color: A.bronze, metalness: 0.55, roughness: 0.42 }),
  leaf: std({ color: C.leaf, roughness: 0.9 }),
  grass: std({ color: C.grass, roughness: 1 }),
  water: std({ color: C.water, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }),
  lotus: std({ color: PALETTE.lotus, roughness: 0.7 }),
  lotusLeaf: std({ color: C.lotusLeaf, roughness: 0.9, side: THREE.DoubleSide }),
  robeBrown: std({ color: C.robeBrown, roughness: 0.9 }),
  robeBlue: std({ color: C.robeBlue, roughness: 0.9 }),
  skin: std({ color: C.skin, roughness: 0.8 }),
  scarf: std({ color: C.scarf, roughness: 0.7 }),
  lantern: std({ color: C.lantern, emissive: C.lanternGlow, emissiveIntensity: 0, roughness: 0.6 }),
  incense: std({ color: C.incense }),
  brick: std({ map: brickTexture(), roughness: 1 }),
  tile: std({ map: tileTexture(), roughness: 0.7 }),

  // —— Kiến trúc chibi (phiên 2) ——
  woodWarm: std({ color: A.woodWarm, roughness: 0.7 }),
  stoneDark: std({ color: A.stoneDark, roughness: 0.85 }),
  plinth: std({ color: A.wallPlinth, roughness: 0.85 }),
  roofEdge: std({ color: A.roofTileDark, roughness: 0.6 }),
  roofUnder: std({
    color: A.roofUnder,
    emissive: A.roofUnder,
    emissiveIntensity: 0.35,
    roughness: 0.85,
  }),
  ceramic: std({ color: A.ornamentCeramic, roughness: 0.35, metalness: 0.05 }),
  lacquer: std({ color: A.lacquerRed, roughness: 0.45 }),
  goldCarve: (() => {
    const t = goldCarveTexture();
    return std({
      map: t,
      emissive: "#ffffff",
      emissiveMap: t,
      emissiveIntensity: 0.12,
      metalness: 0.35,
      roughness: 0.45,
    });
  })(),
  lattice: std({ map: latticeTexture(), roughness: 0.8 }),
  ceiling: (() => {
    const t = latticeTexture();
    t.repeat.set(9, 5);
    return std({
      map: t,
      emissive: A.woodWarm,
      emissiveMap: t,
      emissiveIntensity: 0.9,
      roughness: 0.8,
    });
  })(),
  bellBronze: std({ color: A.bronzeLight, metalness: 0.6, roughness: 0.4 }),
  rope: std({ color: A.rope, roughness: 0.9 }),
  cushion: std({ color: A.cushion, roughness: 0.75 }),
  cushionTrim: std({ color: A.cushionTrim, metalness: 0.3, roughness: 0.45 }),
  // Tượng Phật tự sáng rất nhẹ (vàng ấm) để không chìm trong điện về đêm.
  buddha: std({
    color: A.buddhaGold,
    emissive: A.buddhaGold,
    emissiveIntensity: 0.12,
    metalness: 0.5,
    roughness: 0.38,
  }),
  buddhaFace: (() => {
    const t = buddhaFaceTexture();
    return std({
      map: t,
      emissive: "#ffffff",
      emissiveMap: t,
      emissiveIntensity: 0.12,
      metalness: 0.45,
      roughness: 0.4,
    });
  })(),
  buddhaRobe: std({
    color: A.buddhaRobe,
    emissive: A.buddhaRobe,
    emissiveIntensity: 0.12,
    metalness: 0.4,
    roughness: 0.45,
  }),
  halo: std({
    color: A.halo,
    emissive: A.halo,
    emissiveIntensity: 0.35,
    metalness: 0.3,
    roughness: 0.4,
  }),
  lotusThrone: std({
    color: A.lotusPink,
    emissive: A.lotusPink,
    emissiveIntensity: 0.1,
    roughness: 0.6,
  }),
  lotusThroneDeep: std({
    color: A.lotusPinkDeep,
    emissive: A.lotusPinkDeep,
    emissiveIntensity: 0.1,
    roughness: 0.6,
  }),
};
