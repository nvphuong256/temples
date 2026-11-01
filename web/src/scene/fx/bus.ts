// Kênh sự kiện hiệu ứng nghi lễ: rituals/actions.ts phát, phiên 5 (fx) lắng nghe để vẽ hiệu ứng.
// Không chứa luật chơi — chỉ báo "vừa xảy ra ở đâu" để cảnh hiển thị.
export type FxKind = "incense" | "bow" | "mo" | "beadsRound" | "greet" | "bell";

export interface FxEvent {
  kind: FxKind;
  x: number;
  z: number;
  /** Công đức vừa nhận (0 nếu không có). */
  gained: number;
}

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export function onFx(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitFx(e: FxEvent) {
  for (const fn of listeners) fn(e);
}
