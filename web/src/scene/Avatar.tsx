// Giữ tương thích: Avatar cũ (hình trụ + cầu) đã thay bằng rig chibi dùng chung (scene/chibi/ChibiAvatar).
import type { AvatarPose } from "../state/runtime";
import { ChibiAvatar } from "./chibi/ChibiAvatar";

interface Props {
  id: string;
  kind: "tieu" | "phattu";
  variant?: "tieuan";
  pose?: AvatarPose;
}

export function Avatar({ id, kind, variant, pose = "idle" }: Props) {
  return <ChibiAvatar id={id} variant={variant ?? kind} pose={pose} />;
}
