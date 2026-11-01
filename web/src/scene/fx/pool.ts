// Pool hạt cố định (struct-of-arrays) + RNG xác định — logic thuần, không three.js, để test được.

/** RNG mulberry32: cùng seed → cùng chuỗi (vị trí nén hương giống nhau cho mọi người). */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pool hạt kích thước cố định. Hạt "chết" khi age >= life. `spawn()` lấy ô chết gần con trỏ;
 * nếu pool đầy thì tái dùng ô già nhất (theo tỉ lệ age/life) — không bao giờ cấp phát thêm.
 */
export class ParticlePool {
  readonly cap: number;
  readonly px: Float32Array;
  readonly py: Float32Array;
  readonly pz: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly vz: Float32Array;
  readonly age: Float32Array;
  readonly life: Float32Array;
  readonly seed: Float32Array;
  /** Tham số tự do cho từng loại hiệu ứng (kích thước, kiểu chuyển động...). */
  readonly a: Float32Array;
  readonly b: Float32Array;
  private cursor = 0;

  constructor(cap: number) {
    this.cap = cap;
    const f = () => new Float32Array(cap);
    this.px = f();
    this.py = f();
    this.pz = f();
    this.vx = f();
    this.vy = f();
    this.vz = f();
    this.age = f().fill(1);
    this.life = f();
    this.seed = f();
    this.a = f();
    this.b = f();
  }

  alive(i: number) {
    return (this.age[i] ?? 1) < (this.life[i] ?? 0);
  }

  aliveCount() {
    let n = 0;
    for (let i = 0; i < this.cap; i++) if (this.alive(i)) n++;
    return n;
  }

  /** Cấp một ô (đặt lại age = 0, life). Trả về chỉ số. */
  spawn(life: number): number {
    let pick = -1;
    for (let k = 0; k < this.cap; k++) {
      const i = (this.cursor + k) % this.cap;
      if (!this.alive(i)) {
        pick = i;
        break;
      }
    }
    if (pick < 0) {
      let worst = -1;
      for (let i = 0; i < this.cap; i++) {
        const r = (this.age[i] ?? 0) / Math.max(this.life[i] ?? 1, 1e-6);
        if (r > worst) {
          worst = r;
          pick = i;
        }
      }
    }
    this.cursor = (pick + 1) % this.cap;
    this.age[pick] = 0;
    this.life[pick] = life;
    this.vx[pick] = this.vy[pick] = this.vz[pick] = 0;
    this.a[pick] = this.b[pick] = 0;
    return pick;
  }

  kill(i: number) {
    this.age[i] = 1;
    this.life[i] = 0;
  }

  /** Tăng tuổi mọi hạt sống. */
  tick(dt: number) {
    for (let i = 0; i < this.cap; i++) if (this.alive(i)) this.age[i] = (this.age[i] ?? 0) + dt;
  }
}

/** Khung "lên nhanh, tan chậm": 0 → 1 trong `rise` đầu, rồi giảm mượt về 0 tại t = 1. */
export function fadeInOut(t: number, rise = 0.15) {
  if (t <= 0 || t >= 1) return 0;
  if (t < rise) return t / rise;
  const u = (t - rise) / (1 - rise);
  return (1 - u) * (1 - u) * (1 + 2 * u); // hermite: mượt ở cả hai đầu
}

export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
