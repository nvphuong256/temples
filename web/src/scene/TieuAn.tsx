// Tiểu An — NPC đứng ở tam quan: cùng mẫu chú tiểu + khăn vàng. Lời thoại hiển thị ở HUD (ui/CompanionBubble).
import { TIEU_AN_ID } from "../state/runtime";
import { Avatar } from "./Avatar";
import { TIEU_AN } from "./layout";

export function TieuAn() {
  return (
    <group position={[TIEU_AN.x, 0, TIEU_AN.z]}>
      <Avatar id={TIEU_AN_ID} kind="tieu" variant="tieuan" />
    </group>
  );
}
