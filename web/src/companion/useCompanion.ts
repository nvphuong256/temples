// Hành vi Tiểu An (tuần 1, phía khách): greet khi qua cổng, guide khi đứng yên > 30 s lần đầu,
// meditate khi người chơi ở xa, bless khi rời. Lời thoại từ COMPANION_SEED_LINES (= seed companion_lines);
// tuần 5 đổi sang lấy từ server.
import { useEffect, useRef } from "react";
import { COMPANION_SEED_LINES, pickCompanionLine, type CompanionState } from "@cvo/shared";
import { TIEU_AN } from "../scene/layout";
import { TIEU_AN_ID, avatars, player, setPose } from "../state/runtime";
import { companionSay, useUi } from "../state/store";

const GUIDE_AFTER_MS = 30_000;
const MEDITATE_FAR_M = 22;
const MEDITATE_EVERY_MS = 120_000;

export function sayLine(state: CompanionState) {
  const s = useUi.getState();
  const line = pickCompanionLine(COMPANION_SEED_LINES, state, {
    night: s.night,
    returning: s.visits > 1,
  });
  if (line) companionSay(line.text);
  return line?.text ?? "";
}

export function useCompanion() {
  const phase = useUi((s) => s.phase);
  const prevPhase = useRef(phase);

  useEffect(() => {
    const from = prevPhase.current;
    prevPhase.current = phase;
    if (phase !== "temple") return;
    if (from === "gate") {
      sayLine("greet");
      setPose(TIEU_AN_ID, "greet");
    }
    player.lastMoveAt = performance.now();
    let guided = false;
    let lastMeditate = performance.now();

    const id = setInterval(() => {
      const now = performance.now();
      const ui = useUi.getState();
      if (
        !guided &&
        !ui.beadsOpen &&
        ui.action === null &&
        now - player.lastMoveAt > GUIDE_AFTER_MS
      ) {
        guided = true;
        sayLine("guide");
      }
      const g = player.group;
      const tieuAn = avatars.get(TIEU_AN_ID);
      if (!g || !tieuAn) return;
      const far = Math.hypot(g.position.x - TIEU_AN.x, g.position.z - TIEU_AN.z) > MEDITATE_FAR_M;
      if (far && tieuAn.pose === "idle") setPose(TIEU_AN_ID, "sit");
      else if (!far && tieuAn.pose === "sit") setPose(TIEU_AN_ID, "idle");
      if (!far && guided && now - lastMeditate > MEDITATE_EVERY_MS) {
        lastMeditate = now;
        sayLine("meditate");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);
}
