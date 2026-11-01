// Máy yếu / cảm ứng → tắt bóng đổ, giảm pixel ratio (docs/04-visual-audio.md: 30 fps máy tầm trung).
export function isLowEnd() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4;
}
