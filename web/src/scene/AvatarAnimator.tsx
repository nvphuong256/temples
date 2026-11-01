// Hệ thống hoạt ảnh duy nhất cho mọi avatar (lạy, chào, ngồi, bước đi) — một useFrame.
import { useFrame } from "@react-three/fiber";
import { BOW_CYCLE_S, avatars } from "../state/runtime";

export function AvatarAnimator() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (const a of avatars.values()) {
      const prevT = a.t;
      a.t += dt;
      const p = a.pivot;
      switch (a.pose) {
        case "bow": {
          const ph = (a.t % BOW_CYCLE_S) / BOW_CYCLE_S;
          const k = ph < 0.5 ? ph * 2 : 1 - (ph - 0.5) * 2;
          const e = k * k * (3 - 2 * k);
          p.rotation.x = e * 1.25;
          p.position.y = -e * 0.55;
          a.hands.visible = true;
          if (Math.floor(a.t / BOW_CYCLE_S) > Math.floor(prevT / BOW_CYCLE_S)) a.onBowCycle?.();
          break;
        }
        case "greet":
          a.hands.visible = true;
          p.rotation.x = Math.sin((Math.min(a.t, 1.2) * Math.PI) / 1.2) * 0.35;
          p.position.y = 0;
          if (a.t > 1.4) {
            a.pose = "idle";
            a.t = 0;
          }
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
  });
  return null;
}
