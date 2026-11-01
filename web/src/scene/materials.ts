// Vật liệu dùng chung, tạo một lần cho cả cảnh. Màu từ PALETTE (sơn mài) + SCENE_COLORS.
import * as THREE from "three";
import { PALETTE, SCENE_COLORS as C } from "@cvo/shared";
import { brickTexture, tileTexture } from "./textures";

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

export const M = {
  wood: std({ color: PALETTE.lacquer, roughness: 0.8 }),
  woodDark: std({ color: C.woodDark, roughness: 0.85 }),
  son: std({ color: PALETTE.son, roughness: 0.55 }),
  gold: std({ color: PALETTE.gold, metalness: 0.75, roughness: 0.3 }),
  wall: std({ color: C.wall, roughness: 0.95 }),
  stone: std({ color: C.stone, roughness: 0.9 }),
  bronze: std({ color: C.bronze, metalness: 0.6, roughness: 0.45 }),
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
  tile: std({ map: tileTexture(), roughness: 0.85, side: THREE.DoubleSide }),
};
