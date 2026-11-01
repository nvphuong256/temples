// Thời tiết XÁC ĐỊNH theo giờ VN: băm (ngày + khối giờ) → cùng giờ, mọi người cùng phòng thấy cùng thời tiết.
// Hàm thuần (không đọc DOM/three); tuần 3 server sẽ phát cùng kết quả (docs/chibi/04-thoi-tiet.md).
import type { WeatherKind } from "../scene/env/wind";

export type { WeatherKind };

const VN_OFFSET_H = 7;

/** Khối giờ (giờ bắt đầu). Thời tiết giữ nguyên trong một khối; 5–8h là khối sương sớm. */
export const WEATHER_BLOCKS = [0, 5, 8, 11, 14, 17, 20] as const;
export const MIST_BLOCK = 1;

export interface Weather {
  kind: WeatherKind;
  /** Hướng gió nền (rad, mặt phẳng xz). */
  dir: number;
  /** Sức gió nền 0..1. */
  baseStrength: number;
  /** Mưa 0..1, sương 0..1, mây che 0..1 (đích để nội suy). */
  rain: number;
  mist: number;
  cloud: number;
  /** Khóa khối: "YYYY-MM-DD#k". */
  key: string;
}

/** Gỡ lỗi/chụp ảnh: ép thời tiết (`?weather=drizzle`) / giờ trời (`?hour=5.6`, chỉ đổi trời + ánh sáng). */
export const weatherDebug: { force: WeatherKind | null; hour: number | null } = {
  force: null,
  hour: null,
};

export const WEATHER_KINDS: readonly WeatherKind[] = ["clear", "cloudy", "drizzle", "mist"];
export const isWeatherKind = (s: unknown): s is WeatherKind =>
  typeof s === "string" && (WEATHER_KINDS as readonly string[]).includes(s);

/** Giờ VN dạng số thực 0..24. */
export function vnHourFloat(now: Date = new Date()) {
  const h = now.getTime() / 3_600_000 + VN_OFFSET_H;
  return ((h % 24) + 24) % 24;
}

export function vnDayKey(now: Date = new Date()) {
  return new Date(now.getTime() + VN_OFFSET_H * 3_600_000).toISOString().slice(0, 10);
}

export function blockOf(hour: number) {
  let b = 0;
  for (let i = 0; i < WEATHER_BLOCKS.length; i++) if (hour >= WEATHER_BLOCKS[i]!) b = i;
  return b;
}

/** FNV-1a 32 bit → [0,1). Giống nhau trên mọi máy (server dùng được). */
export function hash01(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // trộn thêm để bit thấp đều
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

const PROFILE: Record<
  WeatherKind,
  { wind: [number, number]; rain: number; mist: number; cloud: number }
> = {
  clear: { wind: [0.22, 0.48], rain: 0, mist: 0, cloud: 0.18 },
  cloudy: { wind: [0.35, 0.68], rain: 0, mist: 0.05, cloud: 0.7 },
  drizzle: { wind: [0.3, 0.58], rain: 1, mist: 0.35, cloud: 1 },
  mist: { wind: [0.04, 0.14], rain: 0, mist: 1, cloud: 0.35 },
};

/** Tỷ lệ theo mùa: mưa phùn Bắc Bộ nhiều vào tháng 1–4. */
function odds(month: number, block: number) {
  const spring = month >= 1 && month <= 4;
  const mist = block === MIST_BLOCK ? 0.5 : 0;
  const rest = 1 - mist;
  const base = spring
    ? { clear: 0.4, cloudy: 0.32, drizzle: 0.28 }
    : { clear: 0.58, cloudy: 0.28, drizzle: 0.14 };
  return {
    mist,
    clear: base.clear * rest,
    cloudy: base.cloudy * rest,
    drizzle: base.drizzle * rest,
  };
}

/** Thời tiết cho một ngày VN (`YYYY-MM-DD`) và giờ VN (0..24). */
export function weatherFor(
  dayKey: string,
  hour: number,
  force: WeatherKind | null = null,
): Weather {
  const block = blockOf(hour);
  const key = `${dayKey}#${block}`;
  const month = Number(dayKey.slice(5, 7));
  let kind: WeatherKind;
  if (force) kind = force;
  else {
    const o = odds(month, block);
    const u = hash01(`w:${key}`);
    kind =
      u < o.mist
        ? "mist"
        : u < o.mist + o.clear
          ? "clear"
          : u < o.mist + o.clear + o.cloudy
            ? "cloudy"
            : "drizzle";
  }
  const p = PROFILE[kind];
  // Hướng gió theo ngày, lệch nhẹ theo khối (gió đổi dần trong ngày).
  const dir = hash01(`d:${dayKey}`) * Math.PI * 2 + (hash01(`j:${key}`) - 0.5) * 0.8;
  const baseStrength = p.wind[0] + (p.wind[1] - p.wind[0]) * hash01(`s:${key}`);
  return { kind, dir, baseStrength, rain: p.rain, mist: p.mist, cloud: p.cloud, key };
}

/** Thời tiết hiện tại (có tính ép gỡ lỗi). */
export function currentWeather(now: Date = new Date()) {
  return weatherFor(vnDayKey(now), vnHourFloat(now), weatherDebug.force);
}

export function windWord(strength: number) {
  if (strength < 0.18) return "lặng gió";
  if (strength < 0.42) return "gió nhẹ";
  if (strength < 0.65) return "gió vừa";
  return "gió mạnh";
}

/** Nhãn chip HUD: "Nắng · gió nhẹ", "Mưa phùn · gió vừa", "Sương sớm". */
export function weatherLabel(w: Pick<Weather, "kind" | "baseStrength">, night: boolean) {
  if (w.kind === "mist") return "Sương sớm";
  const name =
    w.kind === "clear"
      ? night
        ? "Trời quang"
        : "Nắng"
      : w.kind === "cloudy"
        ? "Nhiều mây"
        : "Mưa phùn";
  return `${name} · ${windWord(w.baseStrength)}`;
}

// ---- Ngày/đêm liên tục (bình minh 5h, hoàng hôn 18h) ----

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface SkyPhase {
  /** 0 = đêm, 1 = ngày; chuyển mượt quanh 5h và 18h. */
  daylight: number;
  /** 0..1 nắng vàng bình minh/hoàng hôn. */
  golden: number;
  /** Hướng (đơn vị) tới mặt trời / trăng — nghiêng về phía chính điện (-z) để thấy được từ sân. */
  sun: [number, number, number];
  moon: [number, number, number];
}

function arcDir(p: number, maxElevDeg: number, zLean: number): [number, number, number] {
  const e = Math.sin(Math.PI * p) * ((maxElevDeg * Math.PI) / 180) - 0.05;
  const hx = Math.cos(Math.PI * p);
  const hl = Math.hypot(hx, zLean);
  const c = Math.cos(e);
  return [(hx / hl) * c, Math.sin(e), (-zLean / hl) * c];
}

export function skyPhase(hour: number): SkyPhase {
  const daylight = smooth(4.5, 5.7, hour) * (1 - smooth(17.5, 18.4, hour));
  const bump = (c: number, w: number) => Math.max(0, 1 - Math.abs(hour - c) / w);
  const golden = Math.min(1, smooth(0, 1, bump(5.6, 1.3)) + smooth(0, 1, bump(17.6, 1.3)));
  const sunP = (hour - 5) / 13;
  const nightH = (hour - 18 + 24) % 24; // 0..11 trong đêm
  return {
    daylight,
    golden,
    sun: arcDir(sunP, 62, 0.9),
    moon: arcDir(nightH / 11, 20, 1.8),
  };
}
