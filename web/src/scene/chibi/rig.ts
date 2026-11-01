// Rig chibi dùng chung (chú tiểu / Phật tử / Tiểu An), dựng bằng three thuần để đếm được tam giác trong test
// và đổi LOD rẻ. Geometry + material màu dùng chung cấp module (tạo một lần); mỗi avatar chỉ có material
// đầu riêng để đổi map khi chớp mắt. Không useFrame ở đây — AvatarAnimator gọi applyPose()/setLod().
import * as THREE from "three";
import { CHIBI_CHAR as K } from "@cvo/shared";
import { BODY, type ChibiVariant, type Joints } from "./motion";

export type Lod = 0 | 1;
type GeoKey =
  | "head"
  | "ear"
  | "skirt"
  | "torso"
  | "sash"
  | "sleeve"
  | "cuff"
  | "hand"
  | "palms"
  | "foot"
  | "collarRing"
  | "collarStrip"
  | "knot"
  | "neck"
  | "tuft"
  | "hairCap"
  | "bun"
  | "staff"
  | "cushion";

function lathe(pts: number[][], seg: number) {
  return new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r, y)),
    seg,
  );
}

function buildGeos(lod: Lod): Record<GeoKey, THREE.BufferGeometry> {
  const hi = lod === 0;
  const sleeve = new THREE.CylinderGeometry(0.11, 0.21, 0.5, hi ? 12 : 6, 1, true);
  sleeve.translate(0, -0.25, 0);
  return {
    head: new THREE.SphereGeometry(BODY.headR, hi ? 30 : 14, hi ? 22 : 10),
    ear: new THREE.SphereGeometry(0.2, hi ? 10 : 6, hi ? 8 : 4),
    // Váy áo (gốc chân → eo) và thân trên (eo → cổ), tách ở eo để cúi người; đai che mối nối.
    skirt: lathe(
      [
        [0, 0.06],
        [0.6, 0.06],
        [0.63, 0.12],
        [0.59, 0.32],
        [0.51, 0.56],
        [0.47, 0.64],
        [0, 0.66],
      ],
      hi ? 22 : 10,
    ),
    torso: lathe(
      [
        [0, -0.05],
        [0.47, -0.05],
        [0.49, 0.04],
        [0.45, 0.2],
        [0.37, 0.35],
        [0.2, 0.44],
        [0, 0.46],
      ],
      hi ? 22 : 10,
    ),
    sash: new THREE.CylinderGeometry(0.51, 0.53, 0.13, hi ? 22 : 10, 1, true),
    sleeve,
    cuff: new THREE.TorusGeometry(0.21, 0.028, 5, 14),
    hand: new THREE.SphereGeometry(0.1, 8, 6),
    palms: new THREE.SphereGeometry(0.1, 10, 8),
    foot: new THREE.SphereGeometry(0.09, 8, 6),
    collarRing: new THREE.TorusGeometry(0.2, 0.036, 6, 18),
    collarStrip: new THREE.BoxGeometry(0.09, 0.42, 0.03),
    knot: new THREE.BoxGeometry(0.06, 0.34, 0.02),
    neck: new THREE.CylinderGeometry(0.12, 0.14, 0.16, 10, 1, true),
    tuft: new THREE.SphereGeometry(0.12, 12, 8),
    hairCap: new THREE.SphereGeometry(
      BODY.headR * 1.04,
      hi ? 24 : 12,
      hi ? 9 : 4,
      0,
      Math.PI * 2,
      0,
      1.2,
    ),
    bun: new THREE.SphereGeometry(0.17, 10, 8),
    staff: new THREE.CylinderGeometry(0.032, 0.04, 1.55, 6),
    cushion: new THREE.CylinderGeometry(0.7, 0.72, 0.14, hi ? 20 : 10),
  };
}

const geoCache: Partial<Record<Lod, Record<GeoKey, THREE.BufferGeometry>>> = {};
export function chibiGeos(lod: Lod) {
  return (geoCache[lod] ??= buildGeos(lod));
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
/** Material màu dùng chung (không dispose — sống suốt ứng dụng). */
export function chibiMat(color: string, roughness = 0.75) {
  const key = `${color}/${roughness}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
    matCache.set(key, m);
  }
  return m;
}

export function robeColor(v: ChibiVariant) {
  return v === "phattu" ? K.robePhatTu : v === "tieuan" ? K.robeTieuAn : K.robeTieu;
}

export interface FaceMaps {
  open: THREE.Texture;
  closed: THREE.Texture;
}

export interface ChibiRig {
  variant: ChibiVariant;
  root: THREE.Group;
  body: THREE.Group;
  skirt: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  arms: [THREE.Group, THREE.Group];
  sleeves: [THREE.Mesh, THREE.Mesh];
  sideHands: THREE.Object3D[];
  palms: THREE.Mesh;
  feet: THREE.Group;
  footL: THREE.Mesh;
  footR: THREE.Mesh;
  staff: THREE.Object3D | null;
  cushion: THREE.Mesh | null;
  /** Chi tiết nhỏ ẩn ở LOD 1. */
  details: THREE.Object3D[];
  lodMeshes: { mesh: THREE.Mesh; key: GeoKey }[];
  headMat: THREE.MeshStandardMaterial;
  face: FaceMaps | null;
  closed: boolean;
  restQ: [THREE.Quaternion, THREE.Quaternion];
  lod: Lod;
}

export const SHOULDER = { x: 0.36, y: 0.35, z: 0.02 } as const;
const ARM_L = 0.56;
const HEAD_SCALE = new THREE.Vector3(1, 0.97, 0.94);

export function createChibi(
  variant: ChibiVariant,
  opts: { face?: FaceMaps | null; cushion?: boolean } = {},
): ChibiRig {
  const G = chibiGeos(0);
  const lodMeshes: ChibiRig["lodMeshes"] = [];
  const details: THREE.Object3D[] = [];
  const robe = chibiMat(robeColor(variant), 0.85);
  const collar = chibiMat(K.collar, 0.8);
  const skin = chibiMat(K.skin, 0.55);
  const mk = (key: GeoKey, mat: THREE.Material, parent: THREE.Object3D, shadow = false) => {
    const m = new THREE.Mesh(G[key], mat);
    m.castShadow = shadow;
    parent.add(m);
    lodMeshes.push({ mesh: m, key });
    return m;
  };

  const root = new THREE.Group();
  root.name = `chibi-${variant}`;
  const body = new THREE.Group();
  root.add(body);

  let cushion: THREE.Mesh | null = null;
  if (opts.cushion) {
    cushion = mk("cushion", chibiMat(K.cushion, 0.8), root);
    cushion.position.y = BODY.seatH / 2;
    cushion.receiveShadow = true;
    cushion.visible = false;
  }

  // Váy áo + dây buộc đai
  const skirt = new THREE.Group();
  body.add(skirt);
  mk("skirt", robe, skirt, true);
  const knot = mk("knot", collar, skirt);
  knot.position.set(-0.16, 0.42, 0.5);
  knot.rotation.set(-0.2, 0, 0.05);
  details.push(knot);

  // Bàn chân đi tất trắng ló dưới gấu áo
  const feet = new THREE.Group();
  body.add(feet);
  const foot = (s: number) => {
    const f = mk("foot", chibiMat(K.sock, 0.7), feet);
    f.position.set(s * 0.17, 0.06, 0.44);
    f.scale.set(1, 0.6, 1.45);
    return f;
  };
  const footL = foot(1);
  const footR = foot(-1);

  // Thân trên (gốc ở eo): áo, đai, cổ chéo giao lĩnh, tay áo, đầu
  const torso = new THREE.Group();
  torso.position.y = BODY.waist;
  body.add(torso);
  mk("torso", robe, torso, true);
  mk("sash", chibiMat(K.sash, 0.8), torso);
  for (const s of [1, -1]) {
    const st = mk("collarStrip", collar, torso);
    st.position.set(s * 0.075, 0.22, 0.425);
    st.rotation.set(-0.5, 0, -s * 0.36);
  }
  const ring = mk("collarRing", collar, torso);
  ring.position.y = 0.4;
  ring.rotation.x = Math.PI / 2;
  details.push(ring);
  const neck = mk("neck", skin, torso);
  neck.position.y = 0.45;

  const arms: THREE.Group[] = [];
  const sleeves: THREE.Mesh[] = [];
  const sideHands: THREE.Object3D[] = [];
  const restQ: THREE.Quaternion[] = [];
  let staff: THREE.Object3D | null = null;
  for (const s of [1, -1]) {
    const arm = new THREE.Group();
    arm.position.set(s * SHOULDER.x, SHOULDER.y, SHOULDER.z);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0, s * 0.4));
    arm.quaternion.copy(q);
    restQ.push(q);
    torso.add(arm);
    const sl = mk("sleeve", robe, arm, true);
    sleeves.push(sl);
    const cuff = mk("cuff", collar, sl);
    cuff.position.y = -0.5;
    cuff.rotation.x = Math.PI / 2;
    details.push(cuff);
    const hand = mk("hand", skin, arm);
    hand.position.y = -ARM_L;
    sideHands.push(hand);
    if (variant === "tieuan" && s === -1) {
      // Gậy gỗ trong tay phải: dựng gần thẳng đứng trong không gian thân, hơi chúi ra trước.
      const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0.18));
      const st = mk("staff", chibiMat(K.staff, 0.6), arm);
      st.quaternion.copy(q.clone().invert().multiply(want));
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(st.quaternion);
      st.position.set(0, -ARM_L, 0).addScaledVector(up, 0.32);
      staff = st;
      sideHands.push(st);
    }
    arms.push(arm);
  }

  const palms = mk("palms", skin, torso);
  palms.scale.set(0.75, 1.35, 0.9);
  palms.visible = false;

  // Đầu to (chibi)
  const head = new THREE.Group();
  head.position.y = BODY.headY;
  torso.add(head);
  const headMat = new THREE.MeshStandardMaterial({
    color: opts.face ? "#ffffff" : K.skin,
    map: opts.face?.open ?? null,
    roughness: 0.55,
  });
  const headMesh = mk("head", headMat, head, true);
  headMesh.scale.copy(HEAD_SCALE);
  for (const s of [1, -1]) {
    const ear = mk("ear", chibiMat(K.ear, 0.55), head);
    ear.position.set(s * (BODY.headR + 0.02), -0.04, 0);
    ear.rotation.y = s * 0.35;
    ear.scale.set(0.45, 0.85, 0.3);
  }
  const hair = chibiMat(K.hair, 0.9);
  if (variant === "tieu") {
    // Chỏm tóc trái đào phía trước đỉnh đầu (chú tiểu Việt).
    const tuft = mk("tuft", hair, head);
    tuft.position.set(0, BODY.headR * 0.9, BODY.headR * 0.38);
    tuft.rotation.x = 0.55;
    tuft.scale.set(0.95, 0.35, 1.25);
  } else if (variant === "phattu") {
    const cap = mk("hairCap", hair, head, true);
    cap.scale.copy(HEAD_SCALE);
    cap.rotation.x = -0.4;
    const bun = mk("bun", hair, head);
    bun.position.set(0, 0.36, -0.48);
  }

  return {
    variant,
    root,
    body,
    skirt,
    torso,
    head,
    arms: arms as [THREE.Group, THREE.Group],
    sleeves: sleeves as [THREE.Mesh, THREE.Mesh],
    sideHands,
    palms,
    feet,
    footL,
    footR,
    staff,
    cushion,
    details,
    lodMeshes,
    headMat,
    face: opts.face ?? null,
    closed: false,
    restQ: restQ as [THREE.Quaternion, THREE.Quaternion],
    lod: 0,
  };
}

export function setLod(rig: ChibiRig, lod: Lod) {
  if (rig.lod === lod) return;
  rig.lod = lod;
  const G = chibiGeos(lod);
  for (const { mesh, key } of rig.lodMeshes) mesh.geometry = G[key];
  for (const d of rig.details) d.visible = lod === 0;
}

export function disposeChibi(rig: ChibiRig) {
  rig.headMat.dispose();
}

/** Tổng tam giác đang hiển thị của rig ở mức LOD hiện tại (cho test ngân sách). */
export function countTriangles(obj: THREE.Object3D) {
  let n = 0;
  obj.traverseVisible((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const g = o.geometry as THREE.BufferGeometry;
    n += (g.index ? g.index.count : g.attributes.position!.count) / 3;
  });
  return n;
}

const qA = new THREE.Quaternion();
const qB = new THREE.Quaternion();
const vDir = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

/**
 * Đổ số khớp ra cây đối tượng. `windX/windZ` là gió trong không gian cục bộ của avatar (0..~1).
 */
export function applyPose(rig: ChibiRig, j: Joints, windX = 0, windZ = 0, t = 0) {
  rig.body.position.y = j.rootY;
  rig.body.rotation.set(0, j.twist * 0.5, j.rootRoll);

  rig.skirt.position.set(0, j.skirtY, j.skirtZ);
  rig.skirt.scale.set(j.skirtSX, j.skirtSY, j.skirtSZ);

  const tor = rig.torso;
  tor.position.y = j.waistY;
  tor.rotation.set(j.torsoPitch, -j.twist, 0);
  const br = j.breath;
  tor.scale.set(1 + br * 0.012, 1 + br * 0.018, 1 + br * 0.012);

  rig.head.rotation.set(j.headPitch, j.headYaw, j.headRoll);

  const joined = j.join > 0.5;
  rig.palms.visible = joined;
  rig.palms.position.set(0, j.palmY, j.palmZ);
  for (const h of rig.sideHands) h.visible = !joined;

  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? 1 : -1;
    const arm = rig.arms[i]!;
    // Đứng/đi: tư thế nghỉ + vung tay ngược chân; chắp tay: hướng cánh tay về điểm bàn tay chắp.
    qA.setFromAxisAngle(X_AXIS, -j.armSwing * s).multiply(rig.restQ[i]!);
    vDir.set(s * 0.05 - arm.position.x, j.palmY - arm.position.y, j.palmZ - arm.position.z);
    const len = vDir.length();
    qB.setFromUnitVectors(DOWN, vDir.multiplyScalar(1 / len));
    arm.quaternion.slerpQuaternions(qA, qB, j.join);
    arm.scale.y = 1 + (len / ARM_L - 1) * j.join;
    // Tay áo rộng lay nhẹ theo gió.
    const sl = rig.sleeves[i]!;
    const flut = 0.6 + 0.4 * Math.sin(t * 3.1 + i * 1.7);
    sl.rotation.set(windZ * 0.12 * flut, 0, -windX * 0.12 * flut);
  }

  rig.feet.visible = j.feetVisible;
  rig.footL.position.set(0.17, 0.06 + j.footLiftL, 0.44 + j.footZ);
  rig.footR.position.set(-0.17, 0.06 + j.footLiftR, 0.44 - j.footZ);
  if (rig.cushion) rig.cushion.visible = j.cushionVisible;

  if (rig.face && rig.closed !== j.eyesClosed) {
    rig.closed = j.eyesClosed;
    // Cả hai map đều khác null → cùng chương trình shader, không cần needsUpdate.
    rig.headMat.map = j.eyesClosed ? rig.face.closed : rig.face.open;
  }
}
