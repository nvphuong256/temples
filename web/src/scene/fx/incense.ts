// Hình học lư hương chibi dùng chung cho IncenseBurner (vẽ) và Smoke (điểm phát khói). Logic thuần.
import { BURNER } from "../layout";
import { makeRng } from "./pool";

export const MAX_STICKS = 40;
/** Độ cao mặt tro trong miệng lư (m). */
export const ASH_Y = 1.62;
export const STICK_LEN = 1.05;
/** Bán kính vùng cắm hương trong miệng lư. */
export const ASH_R = 0.55;

export interface StickSlot {
  x: number;
  z: number;
  rx: number;
  rz: number;
  /** Đầu nén (đốm lửa), tọa độ thế giới. */
  tip: [number, number, number];
}

/** 40 vị trí cắm hương cố định (seed xác định → mọi người thấy giống nhau). Nén đầu tiên ở giữa. */
export function stickSlots(seed = 7): StickSlot[] {
  const rnd = makeRng(seed);
  return Array.from({ length: MAX_STICKS }, (_, i) => {
    // Phân bố hoa hướng dương: đều trong miệng lư, không dồn cụm.
    const r = ASH_R * Math.sqrt((i + 0.5) / MAX_STICKS);
    const a = i * 2.39996 + rnd() * 0.4;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // Nghiêng nhẹ ra ngoài như bó hương thật.
    const rx = (z / ASH_R) * 0.16 + (rnd() - 0.5) * 0.08;
    const rz = (-x / ASH_R) * 0.16 + (rnd() - 0.5) * 0.08;
    const tip: [number, number, number] = [
      BURNER.x + x - Math.sin(rz) * STICK_LEN,
      ASH_Y + Math.cos(rx) * Math.cos(rz) * STICK_LEN,
      BURNER.z + z + Math.sin(rx) * Math.cos(rz) * STICK_LEN,
    ];
    return { x, z, rx, rz, tip };
  });
}
