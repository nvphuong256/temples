// Mô phỏng khói hương (logic thuần): cuộn khói bốc lên, xoắn, trôi theo gió, phồng to và loãng dần.
import { ParticlePool, fadeInOut } from "./pool";

export interface Wind {
  x: number;
  z: number;
  /** 0..1 */
  strength: number;
}

export const SMOKE_CAP = 180;
/** Thời gian "dày khói" sau mỗi lần thắp hương (s). */
export const BOOST_S = 7;

/** Số cuộn khói phát mỗi giây: theo số nén đang cháy + phần dày lên sau khi thắp. */
export function smokeRate(sticks: number, boost: number) {
  if (sticks <= 0 && boost <= 0) return 0;
  const n = Math.min(Math.max(sticks, 0), 40);
  return 5 + Math.sqrt(n) * 2.2 + Math.max(0, Math.min(boost, 1)) * 18;
}

/** boost 1 → 0 tuyến tính trong BOOST_S giây. */
export function decayBoost(boost: number, dt: number) {
  return Math.max(0, boost - dt / BOOST_S);
}

export class SmokeSim {
  readonly pool = new ParticlePool(SMOKE_CAP);
  private acc = 0;
  boost = 0;

  /** Phát cuộn khói mới tại `tip` (x, y, z). `big` = cuộn khói dày khi vừa thắp hương. */
  emit(tip: readonly [number, number, number], rnd: () => number, big = false) {
    const p = this.pool;
    const i = p.spawn(5 + rnd() * 2.2);
    p.px[i] = tip[0] + (rnd() - 0.5) * 0.06;
    p.py[i] = tip[1] + 0.05;
    p.pz[i] = tip[2] + (rnd() - 0.5) * 0.06;
    p.seed[i] = rnd();
    p.a[i] = (0.8 + rnd() * 0.5) * (big ? 1.25 : 1); // hệ số kích thước
    p.b[i] = rnd() < 0.5 ? -1 : 1; // chiều xoắn
    return i;
  }

  /** Phát theo tốc độ smokeRate; trả về số cuộn đã phát khung này. */
  emitByRate(
    dt: number,
    sticks: number,
    pickTip: () => readonly [number, number, number],
    rnd: () => number,
  ) {
    this.acc += smokeRate(sticks, this.boost) * dt;
    let n = 0;
    while (this.acc >= 1 && n < 12) {
      this.acc -= 1;
      this.emit(pickTip(), rnd, this.boost > 0.3 && rnd() < this.boost);
      n++;
    }
    if (this.acc > 1) this.acc = 0;
    this.boost = decayBoost(this.boost, dt);
    return n;
  }

  /** Bước vật lý: bay lên chậm dần, gió đẩy mạnh hơn ở trên cao (gió mạnh → cột khói nghiêng nhiều). */
  step(dt: number, wind: Wind) {
    const p = this.pool;
    const lift = 1 - 0.35 * Math.min(1, wind.strength);
    for (let i = 0; i < p.cap; i++) {
      if (!p.alive(i)) continue;
      const age = (p.age[i] ?? 0) + dt;
      p.age[i] = age;
      const t = age / (p.life[i] ?? 1);
      // Bay lên: nhanh ở gốc, chậm dần.
      p.py[i] = (p.py[i] ?? 0) + (0.42 + 0.75 * (1 - t)) * lift * dt;
      // Gió: càng lên cao càng bị cuốn (t tăng theo độ cao).
      const k = (0.25 + 1.9 * t) * dt;
      p.px[i] = (p.px[i] ?? 0) + wind.x * k;
      p.pz[i] = (p.pz[i] ?? 0) + wind.z * k;
    }
  }

  /** Vị trí hiển thị (thêm xoắn quanh tâm) + kích thước + độ đậm của hạt i. */
  look(i: number, out: { x: number; y: number; z: number; size: number; alpha: number }) {
    const p = this.pool;
    const age = p.age[i] ?? 0;
    const t = Math.min(1, age / (p.life[i] ?? 1));
    const s = p.seed[i] ?? 0;
    const ang = s * 6.283 + age * 1.5 * (p.b[i] ?? 1);
    const rad = 0.03 + t * 0.42;
    out.x = (p.px[i] ?? 0) + Math.cos(ang) * rad;
    out.y = (p.py[i] ?? 0) + Math.sin(age * 2.1 + s * 9) * 0.04;
    out.z = (p.pz[i] ?? 0) + Math.sin(ang) * rad;
    // Phồng: nhỏ ở đầu nén, to dần thành cuộn mây mềm.
    out.size = (0.2 + 1.15 * Math.sqrt(t)) * (p.a[i] ?? 1);
    out.alpha = fadeInOut(t, 0.02) * 0.72;
    return out;
  }
}
