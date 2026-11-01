// Trạng thái thay đổi mỗi khung hình (vị trí, phím, camera, hoạt ảnh) — biến thường, không qua React/zustand.
import type { Group, Object3D } from "three";
import type { XZ } from "../scene/layout";
import type { ChibiLife } from "../scene/chibi/motion";
import type { ChibiRig } from "../scene/chibi/rig";

export type AvatarPose = "idle" | "bow" | "greet" | "sit";

export interface AvatarAnim {
  pivot: Group;
  hands: Object3D;
  pose: AvatarPose;
  t: number;
  moving: boolean;
  /** Gọi mỗi lần hoàn tất một lạy (pose "bow"). */
  onBowCycle?: () => void;
  /** Rig chibi (scene/chibi): có thì AvatarAnimator dựng tư thế đầy đủ, không thì dùng pivot/hands như cũ. */
  rig?: ChibiRig;
  /** Trạng thái sống của rig (chớp mắt, trọng số tư thế, nhịp bước). */
  life?: ChibiLife;
  /** Quay đầu nhìn người chơi khi ở gần (Tiểu An). */
  lookAtPlayer?: boolean;
}

export const BOW_CYCLE_S = 2.4;

export const input = {
  keys: new Set<string>(),
  joyX: 0,
  joyY: 0,
};

export const cam = { yaw: 0, pitch: 0.42, dist: 14 };

/** Vật cản tầm nhìn camera (mái chùa): camera kéo vào trước điểm chạm để không chui dưới mái hiên. */
export const camBlockers = new Set<Object3D>();

export const player = {
  group: null as Group | null,
  walkTo: null as XZ | null,
  onArrive: null as (() => void) | null,
  lastMoveAt: 0,
};

/** Mọi avatar đang hiển thị, hoạt ảnh do một hệ thống duy nhất (AvatarAnimator) chạy. */
export const avatars = new Map<string, AvatarAnim>();

export function setPose(id: string, pose: AvatarPose) {
  const a = avatars.get(id);
  if (!a) return;
  a.pose = pose;
  a.t = 0;
}

export const PLAYER_ID = "me";
export const TIEU_AN_ID = "tieuan";

/** Cờ gỡ lỗi cho script chụp ảnh (scripts/shot.cjs): đóng băng hành vi NPC để ép tư thế. */
export const debug = { freezeNpc: false };
