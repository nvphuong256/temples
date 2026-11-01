// Ánh xạ sự kiện nghi lễ → hiệu ứng (logic thuần, test được). RitualFx.tsx chỉ vẽ theo kế hoạch này.
// Nguyên tắc: tinh tế, trang nghiêm, ngắn (≤ 2 s), mờ dần, không chặn tầm nhìn, không chữ nổi.
import { CHIBI_FX as F } from "@cvo/shared";
import { BELL_TOWER, BURNER } from "../layout";
import type { FxEvent } from "./bus";
import { ASH_Y } from "./incense";
import { type ParticlePool, easeOut, fadeInOut } from "./pool";

/** Mọi hiệu ứng kết thúc trong khoảng này (s), tính cả độ trễ. */
export const FX_MAX_S = 2;

export type RingTex = "halo" | "ripple" | "wave" | "puff";

/** Vòng sáng nằm ngang (mặt phẳng xz), to dần rồi tan. */
export interface RingSpec {
  type: "ring";
  tex: RingTex;
  x: number;
  y: number;
  z: number;
  delay: number;
  dur: number;
  /** Bán kính đầu/cuối (m). */
  r0: number;
  r1: number;
  color: string;
  alpha: number;
  /** Tăng/giảm độ cao trong suốt vòng đời (m). */
  rise?: number;
  /** Quay mặt về camera (sóng âm) thay vì nằm ngang. */
  billboard?: boolean;
}

export type BurstPreset = "embers" | "beads" | "merit";

/** Một chùm hạt sáng nhỏ (tàn hương, hạt tràng, ánh công đức). */
export interface BurstSpec {
  type: "burst";
  preset: BurstPreset;
  x: number;
  y: number;
  z: number;
  delay: number;
  count: number;
  /** Tuổi thọ mỗi hạt (s). */
  life: number;
  color: string;
}

/** Đóa sen sáng nhỏ thoáng hiện trước người chắp tay. */
export interface LotusSpec {
  type: "lotus";
  x: number;
  y: number;
  z: number;
  delay: number;
  dur: number;
  color: string;
}

export type FxSpec = RingSpec | BurstSpec | LotusSpec;

export interface FxContext {
  /** Vị trí người chơi (nguồn ánh công đức); mặc định là vị trí sự kiện. */
  player?: { x: number; y: number; z: number; facing: number };
  /** Độ cao mặt sàn tại (x, z). */
  groundY?: (x: number, z: number) => number;
}

const BELL_Y = 3.0;

type RingOpts = Omit<RingSpec, "type" | "x" | "y" | "z" | "delay"> & { delay?: number };
const ring = (x: number, y: number, z: number, o: RingOpts): RingSpec => ({
  type: "ring",
  x,
  y,
  z,
  delay: 0,
  ...o,
});

export function planFx(e: FxEvent, ctx: FxContext = {}): FxSpec[] {
  const gy = ctx.groundY?.(e.x, e.z) ?? 0;
  const out: FxSpec[] = [];
  switch (e.kind) {
    case "incense":
      // Vài tàn lửa bắn lên từ bó hương + một gợn khói tỏa ra trên miệng lư.
      out.push(
        {
          type: "burst",
          preset: "embers",
          x: BURNER.x,
          y: ASH_Y + 0.9,
          z: BURNER.z,
          delay: 0,
          count: 9,
          life: 1.3,
          color: F.ember,
        },
        ring(BURNER.x, ASH_Y + 0.25, BURNER.z, {
          tex: "puff",
          delay: 0.05,
          dur: 1.6,
          r0: 0.5,
          r1: 1.7,
          color: F.smoke,
          alpha: 0.5,
          rise: 0.5,
        }),
      );
      break;
    case "bow":
      // Vòng sáng vàng nhẹ quanh bồ đoàn.
      out.push(
        ring(e.x, gy + 0.12, e.z, {
          tex: "halo",
          dur: 1.8,
          r0: 0.75,
          r1: 1.15,
          color: F.bowHalo,
          alpha: 0.85,
        }),
        ring(e.x, gy + 0.13, e.z, {
          tex: "halo",
          delay: 0.3,
          dur: 1.5,
          r0: 0.5,
          r1: 0.9,
          color: F.sparkle,
          alpha: 0.5,
        }),
      );
      break;
    case "mo":
      out.push(
        ring(e.x, gy + 0.12, e.z, {
          tex: "ripple",
          dur: 1.1,
          r0: 0.3,
          r1: 1.1,
          color: F.moRipple,
          alpha: 0.85,
        }),
      );
      break;
    case "beadsRound":
      out.push({
        type: "burst",
        preset: "beads",
        x: e.x,
        y: gy + 1.0,
        z: e.z,
        delay: 0,
        count: 18,
        life: 1.9,
        color: F.beads,
      });
      break;
    case "greet": {
      const f = ctx.player?.facing ?? 0;
      out.push({
        type: "lotus",
        x: e.x + Math.sin(f) * 0.55,
        y: gy + 1.3,
        z: e.z + Math.cos(f) * 0.55,
        delay: 0,
        dur: 1.6,
        color: F.lotus,
      });
      break;
    }
    case "bell":
      // Sóng âm: ba vòng quay về người xem lan ra từ quả chuông + một gợn trên mặt sân.
      for (let k = 0; k < 3; k++)
        out.push(
          ring(BELL_TOWER.x, BELL_Y, BELL_TOWER.z, {
            tex: "wave",
            delay: k * 0.3,
            dur: 1.4,
            r0: 0.6,
            r1: 4.2 + k * 0.8,
            color: F.bellRipple,
            alpha: 0.85 - k * 0.2,
            billboard: true,
          }),
        );
      out.push(
        ring(BELL_TOWER.x, 0.06, BELL_TOWER.z, {
          tex: "ripple",
          delay: 0.1,
          dur: 1.8,
          r0: 1,
          r1: 6,
          color: F.bellRipple,
          alpha: 0.6,
        }),
      );
      break;
  }
  if (e.gained > 0) {
    // Ánh công đức: vài đốm vàng nhỏ bay lên từ người chơi.
    const p = ctx.player ?? { x: e.x, y: gy, z: e.z };
    out.push({
      type: "burst",
      preset: "merit",
      x: p.x,
      y: p.y + 0.9,
      z: p.z,
      delay: 0.15,
      count: Math.min(10, 3 + Math.ceil(e.gained)),
      life: 1.6,
      color: F.merit,
    });
  }
  return out;
}

/** Hình dạng của vòng tại t ∈ [0,1]: bán kính, độ đậm, độ cao lệch. */
export function ringLook(s: RingSpec, t: number) {
  const k = easeOut(Math.min(Math.max(t, 0), 1));
  return {
    r: s.r0 + (s.r1 - s.r0) * k,
    alpha: s.alpha * fadeInOut(t, s.tex === "wave" || s.tex === "ripple" ? 0.08 : 0.25),
    dy: (s.rise ?? 0) * k,
  };
}

/** Kết thúc của một kế hoạch (s). */
export function fxEnd(s: FxSpec) {
  return s.delay + (s.type === "burst" ? s.life : s.dur);
}

/** Hàng đợi hiệu ứng có độ trễ, theo thời gian tuyệt đối (s). */
export class FxQueue<T extends { delay: number }> {
  private items: { at: number; spec: T }[] = [];
  push(specs: readonly T[], now: number) {
    for (const spec of specs) this.items.push({ at: now + spec.delay, spec });
  }
  /** Lấy ra các mục đã tới giờ. */
  due(now: number): T[] {
    const ready: T[] = [];
    this.items = this.items.filter((it) => {
      if (it.at <= now) {
        ready.push(it.spec);
        return false;
      }
      return true;
    });
    return ready;
  }
  get size() {
    return this.items.length;
  }
}

/**
 * Khe hiệu ứng cố định (vòng sáng, đóa sen): mỗi khe giữ một spec + thời điểm bắt đầu.
 * Đầy → ghi đè khe bắt đầu sớm nhất. Khe hết hạn tự rảnh.
 */
export class Slots<T extends { dur: number }> {
  readonly items: ({ spec: T; start: number } | null)[];
  constructor(cap: number) {
    this.items = Array.from({ length: cap }, () => null);
  }
  add(spec: T, now: number): number {
    let pick = this.items.findIndex((s) => !s || now - s.start >= s.spec.dur);
    if (pick < 0) {
      let oldest = Infinity;
      this.items.forEach((s, i) => {
        if (s && s.start < oldest) {
          oldest = s.start;
          pick = i;
        }
      });
    }
    this.items[pick] = { spec, start: now };
    return pick;
  }
  /** t ∈ [0,1) nếu khe đang chạy, ngược lại null (và giải phóng khe). */
  progress(i: number, now: number): number | null {
    const s = this.items[i];
    if (!s) return null;
    const t = (now - s.start) / s.spec.dur;
    if (t >= 1) {
      this.items[i] = null;
      return null;
    }
    return Math.max(0, t);
  }
}

/** Khởi tạo hạt của một chùm theo kiểu. a = kích thước, b = bán kính quỹ đạo (hạt tràng). */
export function spawnBurst(pool: ParticlePool, s: BurstSpec, rnd: () => number): number[] {
  const out: number[] = [];
  for (let n = 0; n < s.count; n++) {
    const i = pool.spawn(s.life * (0.75 + rnd() * 0.25));
    out.push(i);
    pool.seed[i] = rnd();
    if (s.preset === "embers") {
      const a = rnd() * 6.283;
      const sp = 0.3 + rnd() * 0.5;
      pool.px[i] = s.x + Math.cos(a) * 0.15;
      pool.py[i] = s.y;
      pool.pz[i] = s.z + Math.sin(a) * 0.15;
      pool.vx[i] = Math.cos(a) * sp;
      pool.vy[i] = 0.9 + rnd() * 0.8;
      pool.vz[i] = Math.sin(a) * sp;
      pool.a[i] = 0.09 + rnd() * 0.05;
    } else if (s.preset === "beads") {
      // Vòng hạt: đều quanh người, xoay chậm và bay lên (vị trí tính trong look()).
      pool.px[i] = s.x;
      pool.py[i] = s.y;
      pool.pz[i] = s.z;
      pool.vx[i] = (n / s.count) * 6.283; // pha trên vòng
      pool.vy[i] = 0.55;
      pool.a[i] = 0.13;
      pool.b[i] = 0.55;
      pool.life[i] = s.life;
    } else {
      const a = rnd() * 6.283;
      const r = 0.15 + rnd() * 0.3;
      pool.px[i] = s.x + Math.cos(a) * r;
      pool.py[i] = s.y + rnd() * 0.4;
      pool.pz[i] = s.z + Math.sin(a) * r;
      pool.vx[i] = Math.cos(a) * 0.08;
      pool.vy[i] = 0.7 + rnd() * 0.5;
      pool.vz[i] = Math.sin(a) * 0.08;
      pool.a[i] = 0.1 + rnd() * 0.06;
    }
  }
  return out;
}
