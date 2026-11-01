// Tiểu An — NPC ở tam quan: rig chibi dùng chung, biến thể "tieuan" (áo cam, gậy gỗ, bồ đoàn riêng).
// Mọi cử động (thở, chớp mắt, nhìn theo người chơi < 9 m, chào, ngồi thiền nhắm mắt) do AvatarAnimator.
import { TIEU_AN_ID } from "../state/runtime";
import { ChibiAvatar } from "./chibi/ChibiAvatar";
import { TIEU_AN } from "./layout";

export function TieuAn() {
  return (
    <group position={[TIEU_AN.x, 0, TIEU_AN.z]}>
      <ChibiAvatar id={TIEU_AN_ID} variant="tieuan" lookAtPlayer cushion />
    </group>
  );
}
