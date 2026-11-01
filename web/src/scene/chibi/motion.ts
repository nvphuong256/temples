// Logic thuần của rig chibi (không three, không DOM) — có test ở tests/unit/chibi-motion.test.ts.
// AvatarAnimator gọi stepLife() rồi solvePose() mỗi khung cho mọi avatar, sau đó rig.applyPose() đổ số ra
// đối tượng three. Đơn vị mét/giây/radian; avatar nhìn về +z, gốc ở bàn chân.
export type ChibiVariant = "tieu" | "phattu" | "tieuan";
export type ChibiPose = "idle" | "bow" | "greet" | "sit";

/** Kích thước rig (khớp với hình trong rig.ts). */
export const BODY = {
  waist: 0.6, // eo khi đứng (đỉnh váy áo / gốc thân trên)
  headY: 0.88, // tâm đầu tính từ eo
  headR: 0.6,
  seatH: 0.14, // bồ đoàn
  kneelWaist: 0.32, // eo khi quỳ, tính từ mặt bồ đoàn
  sitWaist: 0.24, // eo khi ngồi kiết già
} as const;

export const BLINK_S = 0.13;
export const GREET_S = 1.4;
export const LOOK_RANGE_M = 9;
export const LOOK_MAX = 0.7;
/** LOD: xa hơn LOD_FAR_M dùng bản ít segment; trễ 4 m để không nhấp nháy ở ranh giới. */
export const LOD_FAR_M = 25;
export const LOD_HYST_M = 2;

export interface Blink {
  next: number;
  until: number;
}

export interface ChibiLife {
  clock: number;
  blink: Blink;
  blinking: boolean;
  move: number;
  kneel: number;
  sit: number;
  join: number;
  walkPhase: number;
  headYaw: number;
}

export interface LifeInput {
  pose: ChibiPose;
  poseT: number;
  moving: boolean;
  /** Góc quay đầu mong muốn (cục bộ) hoặc null = nhìn quanh nhẹ. */
  lookYaw: number | null;
}

/** Số khớp mà rig.applyPose đổ ra cây đối tượng; dùng lại một object để không cấp phát mỗi khung. */
export interface Joints {
  rootY: number;
  rootRoll: number;
  twist: number;
  skirtY: number;
  skirtZ: number;
  skirtSX: number;
  skirtSY: number;
  skirtSZ: number;
  waistY: number;
  torsoPitch: number;
  breath: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  join: number;
  palmY: number;
  palmZ: number;
  armSwing: number;
  footZ: number;
  footLiftL: number;
  footLiftR: number;
  feetVisible: boolean;
  eyesClosed: boolean;
  cushionVisible: boolean;
}

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export function smoothstep(e0: number, e1: number, x: number) {
  const k = clamp((x - e0) / (e1 - e0), 0, 1);
  return k * k * (3 - 2 * k);
}
/** Tiến về đích theo hàm mũ, độc lập tốc độ khung hình. */
export function approach(cur: number, target: number, rate: number, dt: number) {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}

export function newBlink(t: number, rand: number): Blink {
  return { next: t + 1 + rand * 3, until: 0 };
}

/** Lịch chớp mắt: mỗi 2–5,5 s, 15% chớp đôi; trả về true khi đang nhắm. */
export function stepBlink(b: Blink, t: number, rand: number): boolean {
  if (t >= b.next) {
    b.until = t + BLINK_S;
    b.next = rand < 0.15 ? t + 0.32 : t + 2 + ((rand - 0.15) / 0.85) * 3.5;
  }
  return t < b.until;
}

/** Số lạy vừa trọn giữa hai mốc thời gian của pose "bow". */
export function bowCyclesDone(prevT: number, t: number, cycle: number) {
  return Math.max(0, Math.floor(t / cycle) - Math.floor(prevT / cycle));
}

/**
 * Một lạy (pha 0..1): nâng tay chắp lên trán → cúi người, tay đưa xuống trước bồ đoàn → giữ → ngẩng lên.
 * pitch là độ cúi chuẩn hóa 0..1 (nhân BOW_PITCH), không bao giờ cắm đầu xuống đất.
 */
export function bowCurve(ph: number) {
  const up = smoothstep(0, 0.2, ph);
  const down = smoothstep(0.2, 0.5, ph);
  const rise = smoothstep(0.68, 1, ph);
  const pitch = down * (1 - rise);
  return { raise: up * (1 - down), pitch, reach: pitch };
}
export const BOW_PITCH = 0.95;

export function greetCurve(t: number) {
  return t < 1.2 ? Math.sin((t * Math.PI) / 1.2) : 0;
}

export function newLife(rand: number): ChibiLife {
  return {
    clock: rand * 10,
    blink: newBlink(rand * 10, rand),
    blinking: false,
    move: 0,
    kneel: 0,
    sit: 0,
    join: 0,
    walkPhase: 0,
    headYaw: 0,
  };
}

export function stepLife(life: ChibiLife, inp: LifeInput, dt: number, rand: number) {
  life.clock += dt;
  const { pose } = inp;
  const join = pose === "bow" || pose === "sit" || (pose === "greet" && inp.poseT < GREET_S - 0.1);
  life.move = approach(life.move, inp.moving ? 1 : 0, 10, dt);
  life.kneel = approach(life.kneel, pose === "bow" ? 1 : 0, 6, dt);
  life.sit = approach(life.sit, pose === "sit" ? 1 : 0, 4, dt);
  life.join = approach(life.join, join ? 1 : 0, 9, dt);
  if (life.move > 0.01) life.walkPhase = (life.walkPhase + dt * 10) % (Math.PI * 2);
  const idleYaw = Math.sin(life.clock * 0.4) * 0.12;
  const want = inp.lookYaw === null ? idleYaw : clamp(inp.lookYaw, -LOOK_MAX, LOOK_MAX);
  life.headYaw = approach(life.headYaw, want, 5, dt);
  life.blinking = stepBlink(life.blink, life.clock, rand);
}

export function newJoints(): Joints {
  return {
    rootY: 0,
    rootRoll: 0,
    twist: 0,
    skirtY: 0,
    skirtZ: 0,
    skirtSX: 1,
    skirtSY: 1,
    skirtSZ: 1,
    waistY: BODY.waist,
    torsoPitch: 0,
    breath: 0,
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    join: 0,
    palmY: 0.24,
    palmZ: 0.44,
    armSwing: 0,
    footZ: 0,
    footLiftL: 0,
    footLiftR: 0,
    feetVisible: true,
    eyesClosed: false,
    cushionVisible: false,
  };
}

// Vị trí bàn tay chắp (không gian thân trên, gốc ở eo).
const PALM_CHEST = [0.24, 0.44] as const;
const PALM_BROW = [0.7, 0.72] as const;
const PALM_MAT = [0.1, 0.66] as const;
const PALM_LAP = [0.04, 0.4] as const;

export function solvePose(
  life: ChibiLife,
  pose: ChibiPose,
  poseT: number,
  cycle: number,
  j: Joints,
) {
  const { move, kneel, sit } = life;
  const low = Math.max(kneel, sit);
  const s = Math.sin(life.walkPhase);
  const c = Math.cos(life.walkPhase);
  const breath = Math.sin(life.clock * 1.6);
  // Đi lạch bạch: nảy hai lần mỗi chu kỳ bước, lắc người sang hai bên, xoắn hông nhẹ.
  j.rootY = Math.abs(s) * 0.07 * move;
  j.rootRoll = s * 0.09 * move;
  j.twist = s * 0.1 * move;
  // Quỳ / ngồi trên bồ đoàn: hạ eo, váy áo xòe và dẹt.
  const seat = BODY.seatH * low;
  j.waistY =
    BODY.waist +
    (BODY.seatH + BODY.kneelWaist - BODY.waist) * kneel +
    (BODY.seatH + BODY.sitWaist - BODY.waist) * sit;
  j.skirtY = seat;
  j.skirtSY = (j.waistY - seat) / BODY.waist;
  j.skirtSX = 1 + 0.12 * kneel + 0.4 * sit;
  j.skirtSZ = 1 + 0.25 * kneel + 0.3 * sit;
  j.skirtZ = 0.07 * kneel;

  const g = pose === "greet" ? greetCurve(poseT) : 0;
  const b = pose === "bow" ? bowCurve((poseT % cycle) / cycle) : { raise: 0, pitch: 0, reach: 0 };
  const bp = b.pitch * kneel;
  j.torsoPitch = 0.32 * g + BOW_PITCH * bp + 0.05 * sit + 0.07 * move;
  j.breath = breath;
  j.headPitch = 0.18 * g + 0.25 * bp + 0.12 * b.raise * kneel + 0.16 * sit - 0.05 * move;
  j.headYaw = life.headYaw * (1 - low);
  j.headRoll = Math.sin(life.clock * 0.7) * 0.05 * (1 - sit) - j.rootRoll * 0.6;

  j.join = life.join;
  const raise = b.raise * kneel;
  const reach = b.reach * kneel;
  let py = PALM_CHEST[0] + (PALM_BROW[0] - PALM_CHEST[0]) * raise;
  let pz = PALM_CHEST[1] + (PALM_BROW[1] - PALM_CHEST[1]) * raise;
  py = lerp(py, PALM_MAT[0], reach);
  pz = lerp(pz, PALM_MAT[1], reach);
  j.palmY = lerp(py, PALM_LAP[0], sit);
  j.palmZ = lerp(pz, PALM_LAP[1], sit);
  j.armSwing = s * 0.5 * move;

  j.footZ = s * 0.13 * move;
  j.footLiftL = Math.max(0, c) * 0.06 * move;
  j.footLiftR = Math.max(0, -c) * 0.06 * move;
  j.feetVisible = low < 0.5;
  j.eyesClosed = life.blinking || sit > 0.6;
  j.cushionVisible = sit > 0.05;
  return j;
}

/** Độ cao tâm đầu so với bàn chân (dùng kiểm tra "không cắm đầu xuống đất"). */
export function headHeight(j: Joints) {
  return j.rootY + j.waistY + Math.cos(j.torsoPitch) * BODY.headY;
}

/** Chọn mức LOD theo bình phương khoảng cách tới camera, có trễ. */
export function pickLod(dist2: number, cur: 0 | 1): 0 | 1 {
  const far = LOD_FAR_M + (cur === 1 ? -LOD_HYST_M : LOD_HYST_M);
  return dist2 > far * far ? 1 : 0;
}

/** Góc quay đầu (cục bộ) để nhìn về điểm (dx, dz) khi avatar đang quay mặt `yaw`; null nếu ngoài tầm. */
export function lookYawTo(dx: number, dz: number, yaw: number): number | null {
  if (dx * dx + dz * dz > LOOK_RANGE_M * LOOK_RANGE_M) return null;
  let a = Math.atan2(dx, dz) - yaw;
  a = Math.atan2(Math.sin(a), Math.cos(a));
  return clamp(a, -LOOK_MAX, LOOK_MAX);
}
