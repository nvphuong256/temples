// Hệ thống hoạt ảnh DUY NHẤT cho mọi avatar — một useFrame (chuẩn bị 100 người/phòng).
// Avatar có rig chibi: stepLife (chớp mắt, trọng số tư thế, nhịp bước) → solvePose (số khớp thuần) →
// applyPose (đổ ra three), kèm LOD theo khoảng cách camera và tay áo lay theo gió. Avatar không có rig
// (cũ) vẫn chạy nhánh pivot/hands như trước.
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BOW_CYCLE_S, avatars, player, type AvatarAnim } from "../state/runtime";
import { newJoints, pickLod, solvePose, stepLife, lookYawTo, GREET_S } from "./chibi/motion";
import { applyPose, setLod } from "./chibi/rig";
import { env } from "./env/wind";

const J = newJoints();
const wp = new THREE.Vector3();

function legacy(a: AvatarAnim) {
  const p = a.pivot;
  switch (a.pose) {
    case "bow": {
      const ph = (a.t % BOW_CYCLE_S) / BOW_CYCLE_S;
      const k = ph < 0.5 ? ph * 2 : 1 - (ph - 0.5) * 2;
      const e = k * k * (3 - 2 * k);
      p.rotation.x = e * 1.25;
      p.position.y = -e * 0.55;
      a.hands.visible = true;
      break;
    }
    case "greet":
      a.hands.visible = true;
      p.rotation.x = Math.sin((Math.min(a.t, 1.2) * Math.PI) / 1.2) * 0.35;
      p.position.y = 0;
      break;
    case "sit":
      p.rotation.x = 0;
      p.position.y = -0.5;
      a.hands.visible = true;
      break;
    default:
      p.rotation.x = 0;
      p.position.y = Math.abs(Math.sin(a.t * 9)) * (a.moving ? 0.06 : 0);
      a.hands.visible = false;
  }
}

/** Hướng mặt (yaw) của avatar: rig nằm trong group cha được xoay (Player) hoặc không xoay (NPC). */
function facing(a: AvatarAnim) {
  return a.pivot.parent?.rotation.y ?? 0;
}

export function AvatarAnimator() {
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    for (const a of avatars.values()) {
      const prevT = a.t;
      a.t += dt;
      if (a.pose === "bow" && Math.floor(a.t / BOW_CYCLE_S) > Math.floor(prevT / BOW_CYCLE_S))
        a.onBowCycle?.();
      if (a.pose === "greet" && a.t > GREET_S) {
        a.pose = "idle";
        a.t = 0;
      }
      const { rig, life } = a;
      if (!rig || !life) {
        legacy(a);
        continue;
      }
      rig.root.getWorldPosition(wp);
      const yaw = facing(a);
      let look: number | null = null;
      const g = player.group;
      if (a.lookAtPlayer && g) look = lookYawTo(g.position.x - wp.x, g.position.z - wp.z, yaw);

      stepLife(
        life,
        { pose: a.pose, poseT: a.t, moving: a.moving, lookYaw: look },
        dt,
        Math.random(),
      );
      solvePose(life, a.pose, a.t, BOW_CYCLE_S, J);

      const lod = pickLod(camera.position.distanceToSquared(wp), rig.lod);
      if (lod !== rig.lod) setLod(rig, lod);

      // Gió thế giới → không gian cục bộ avatar (xoay ngược yaw).
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const wx = env.windX * cy - env.windZ * sy;
      const wz = env.windX * sy + env.windZ * cy;
      applyPose(rig, J, wx, wz, life.clock);
    }
  });
  return null;
}
