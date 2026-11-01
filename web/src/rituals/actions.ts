// Sáu nghi lễ: hương, lễ, mõ, tràng hạt, chắp tay, chuông. Nối luật (rules.ts) với cảnh (runtime) và UI (store).
import { GREET_RANGE_M, INCENSE_RANGE_M } from "@cvo/shared";
import { playBead, playBell, playMo } from "../audio/synth";
import {
  CUSHIONS,
  TIEU_AN,
  incenseSpot,
  nearestFreeCushion,
  BURNER,
  BELL_TOWER,
  type XZ,
} from "../scene/layout";
import { PLAYER_ID, TIEU_AN_ID, avatars, player, setPose } from "../state/runtime";
import { emitFx } from "../scene/fx/bus";
import { toast, useUi } from "../state/store";
import * as rules from "./rules";

const MAX_STICKS = 40;

function here(): XZ {
  const g = player.group;
  return g ? { x: g.position.x, z: g.position.z } : { x: 0, z: 0 };
}

function faceTowards(target: XZ) {
  const g = player.group;
  if (!g) return;
  g.rotation.y = Math.atan2(target.x - g.position.x, target.z - g.position.z);
}

export function cancelAction() {
  const s = useUi.getState();
  if (s.action === "le") {
    s.set({ action: null, seat: null });
    const a = avatars.get(PLAYER_ID);
    if (a) a.onBowCycle = undefined;
  }
  setPose(PLAYER_ID, "idle");
}

export function goTo(target: XZ, then: (() => void) | null) {
  cancelAction();
  player.walkTo = { ...target };
  player.onArrive = then;
}

export function doIncense() {
  goTo(incenseSpot(here(), INCENSE_RANGE_M), () => {
    faceTowards(BURNER);
    setPose(PLAYER_ID, "greet");
    const s = useUi.getState();
    const r = rules.incense(s.progress);
    s.set({ progress: r.next, sticks: Math.min(MAX_STICKS, s.sticks + 1) });
    playBell(false);
    emitFx({ kind: "incense", x: BURNER.x, z: BURNER.z, gained: r.gained });
    toast(`Bạn đã thắp một nén hương. Công đức +${r.gained}`);
  });
}

export function doBow() {
  const s = useUi.getState();
  if (s.action === "le") {
    cancelAction();
    toast("Đã dừng lễ");
    return;
  }
  const idx = nearestFreeCushion(here(), new Set());
  const c = CUSHIONS[idx];
  if (!c) {
    toast("Chiếu lễ đã kín, chờ một chút");
    return;
  }
  goTo({ x: c.x, z: c.z + 0.9 }, () => {
    const g = player.group;
    if (g) {
      g.position.x = c.x;
      g.position.z = c.z;
      g.rotation.y = Math.PI;
    }
    useUi.getState().set({ action: "le", seat: idx });
    setPose(PLAYER_ID, "bow");
    const a = avatars.get(PLAYER_ID);
    if (a)
      a.onBowCycle = () => {
        const st = useUi.getState();
        const r = rules.bow(st.progress);
        st.set({ progress: r.next });
        emitFx({ kind: "bow", ...here(), gained: r.gained });
        if (r.gained) toast(`Đã lễ ${r.next.bows} lạy. Công đức +${r.gained}`);
      };
    toast("Đang lễ Phật · bấm lại để dừng");
  });
}

export function doMo() {
  playMo();
  const s = useUi.getState();
  const r = rules.mo(s.progress, Math.random());
  s.set({ progress: r.next });
  emitFx({ kind: "mo", ...here(), gained: r.gained });
}

export function openBeads() {
  useUi.getState().set({ beadsOpen: true });
}
export function closeBeads() {
  useUi.getState().set({ beadsOpen: false });
}

export function beadStep(): boolean {
  const s = useUi.getState();
  const r = rules.bead(s.progress);
  if (r.next === s.progress) return false;
  playBead();
  s.set({ progress: r.next });
  if (r.gained) {
    playBell(false);
    emitFx({ kind: "beadsRound", ...here(), gained: r.gained });
    toast(`Trọn một tràng 108 hạt. Công đức +${r.gained}`);
  }
  return true;
}

export function resetBeads() {
  const s = useUi.getState();
  s.set({ progress: rules.resetBeads(s.progress) });
}

export function doGreet() {
  setPose(PLAYER_ID, "greet");
  emitFx({ kind: "greet", ...here(), gained: 0 });
  const p = here();
  const nearTieuAn = Math.hypot(p.x - TIEU_AN.x, p.z - TIEU_AN.z) < GREET_RANGE_M;
  if (!nearTieuAn) {
    toast("Bạn chắp tay chào. Chưa có ai ở gần.");
    return;
  }
  faceTowards(TIEU_AN);
  toast("Bạn chắp tay chào Tiểu An");
  setTimeout(() => {
    setPose(TIEU_AN_ID, "greet");
    toast("Tiểu An chắp tay chào lại bạn");
  }, 900);
}

export function doBell() {
  const s = useUi.getState();
  const now = Date.now();
  if (!rules.canRingBell(s.lastBellAt, now)) {
    toast("Chuông vừa thỉnh, đợi một chút cho tiếng ngân hết");
    return;
  }
  s.set({ lastBellAt: now });
  playBell(true);
  emitFx({ kind: "bell", x: BELL_TOWER.x, z: BELL_TOWER.z, gained: 0 });
  toast("Chuông ngân khắp chùa");
}

export const RITUAL_KEYS: Record<string, () => void> = {
  "1": doIncense,
  "2": doBow,
  "3": doMo,
  "4": openBeads,
  "5": doGreet,
  "6": doBell,
};
