// Trạng thái UI (zustand): màn hình, hồ sơ khách, công đức trong ngày, thông báo, lời Tiểu An.
import { create } from "zustand";
import { GUEST_NAMES } from "@cvo/shared";
import { rollDay, type DayProgress } from "../rituals/rules";
import { vnParts } from "../lib/time";

export type Phase = "gate" | "temple" | "leaving";
export type AvatarKind = "tieu" | "phattu";

interface Msg {
  text: string;
  id: number;
}

export interface UiState {
  phase: Phase;
  avatar: AvatarKind;
  name: string;
  visits: number;
  progress: DayProgress;
  night: boolean;
  clock: string;
  action: "le" | null;
  seat: number | null;
  lastBellAt: number | null;
  beadsOpen: boolean;
  /** Số nén hương đang cắm trong lư hương (hiển thị, tối đa 40). */
  sticks: number;
  toast: Msg | null;
  companion: Msg | null;
  set: (p: Partial<UiState>) => void;
}

const PROFILE_KEY = "cvo:profile";
const DAY_KEY = "cvo:day";

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

export const randomGuestName = (except?: string) => {
  const pool = GUEST_NAMES.filter((n) => n !== except);
  return pool[Math.floor(Math.random() * pool.length)] ?? GUEST_NAMES[0];
};

const profile = load<{ name?: string; avatar?: AvatarKind; visits?: number }>(PROFILE_KEY);
const validName = (n?: string) => (GUEST_NAMES as readonly string[]).includes(n ?? "");

export const useUi = create<UiState>((set) => ({
  phase: "gate",
  avatar: profile?.avatar === "phattu" ? "phattu" : "tieu",
  name: validName(profile?.name) ? profile!.name! : randomGuestName(),
  visits: profile?.visits ?? 0,
  progress: rollDay(load<DayProgress>(DAY_KEY), vnParts().dayKey),
  night: false,
  clock: "",
  action: null,
  seat: null,
  lastBellAt: null,
  beadsOpen: false,
  sticks: 9,
  toast: null,
  companion: null,
  set: (p) => set(p),
}));

useUi.subscribe((s, prev) => {
  if (s.progress !== prev.progress) save(DAY_KEY, s.progress);
  if (s.name !== prev.name || s.avatar !== prev.avatar || s.visits !== prev.visits)
    save(PROFILE_KEY, { name: s.name, avatar: s.avatar, visits: s.visits });
});

let msgId = 0;
export function toast(text: string) {
  useUi.getState().set({ toast: { text, id: ++msgId } });
}
export function companionSay(text: string) {
  useUi.getState().set({ companion: { text, id: ++msgId } });
}

/** Sang ngày mới (giờ VN) khi đang mở trang → bắt đầu lại công đức/hạt trong ngày. */
export function ensureToday() {
  const s = useUi.getState();
  const today = vnParts().dayKey;
  if (s.progress.day !== today) s.set({ progress: rollDay(null, today) });
}
