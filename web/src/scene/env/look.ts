// Trạng thái hình ảnh trời/ánh sáng tính MỘT lần mỗi khung (WeatherFx gọi `updateLook`); Sky + Lighting đọc.
// Màu từ CHIBI_SKY; trộn theo env.cloud/rain/mist (đã nội suy) và pha ngày/đêm liên tục.
import * as THREE from "three";
import { CHIBI_SKY as S } from "@cvo/shared";
import type { SkyPhase } from "../../lib/weather";
import { env } from "./wind";

const c = (hex: string) => new THREE.Color(hex);
const P = {
  dayTop: c(S.dayTop),
  dayHorizon: c(S.dayHorizon),
  cloudyTop: c(S.cloudyTop),
  cloudyHorizon: c(S.cloudyHorizon),
  rainTop: c(S.rainTop),
  rainHorizon: c(S.rainHorizon),
  mist: c(S.mist),
  nightTop: c(S.nightTop),
  nightHorizon: c(S.nightHorizon),
  goldenTop: c(S.goldenTop),
  goldenHorizon: c(S.goldenHorizon),
  cloud: c(S.cloud),
  cloudShade: c(S.cloudShade),
  nightCloud: c(S.nightCloud),
  sunLight: c(S.sunLight),
  goldenLight: c(S.goldenLight),
  moonLight: c(S.moonLight),
  hemiDay: c(S.hemiDay),
  hemiNight: c(S.hemiNight),
};

export const look = {
  top: new THREE.Color(),
  horizon: new THREE.Color(),
  cloudColor: new THREE.Color(),
  hemiSky: new THREE.Color(),
  sunColor: new THREE.Color(),
  sunDir: new THREE.Vector3(0, 1, 0),
  moonDir: new THREE.Vector3(0, 1, 0),
  daylight: 1,
  golden: 0,
  /** Độ hiện của đĩa mặt trời / trăng / sao 0..1. */
  sunVis: 1,
  moonVis: 0,
  starVis: 0,
  hemiInt: 1.4,
  /** Đèn chính (mặt trời ban ngày, trăng ban đêm). */
  sunInt: 2.2,
  lightDir: new THREE.Vector3(0.5, 0.8, 0.35),
  /** Độ đậm bóng 0..1 (trời âm u → bóng mờ). */
  shadow: 1,
  fogNear: 60,
  fogFar: 180,
};

const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

export function updateLook(ph: SkyPhase) {
  const { cloud, rain, mist } = env;
  const day = ph.daylight;
  const gold = ph.golden * (1 - 0.6 * Math.max(cloud - 0.3, 0)) * (1 - rain * 0.7);
  look.daylight = day;
  look.golden = gold;
  look.sunDir.set(...ph.sun);
  look.moonDir.set(...ph.moon);

  // Ngày: trời trong → mây → mưa → sương.
  const ck = Math.min(1, Math.max(0, (cloud - 0.2) / 0.6));
  tmp
    .copy(P.dayTop)
    .lerp(P.cloudyTop, ck)
    .lerp(P.rainTop, rain)
    .lerp(P.mist, mist * 0.55);
  tmp2
    .copy(P.dayHorizon)
    .lerp(P.cloudyHorizon, ck)
    .lerp(P.rainHorizon, rain)
    .lerp(P.mist, mist * 0.9);
  tmp.lerp(P.goldenTop, gold * 0.6);
  tmp2.lerp(P.goldenHorizon, gold * 0.75);
  // Đêm rằm: xanh sâu, mây/mưa làm xám nhẹ.
  look.top.copy(P.nightTop).lerp(P.nightCloud, (ck * 0.35 + mist * 0.25) * (1 - day));
  look.horizon.copy(P.nightHorizon).lerp(P.nightCloud, ck * 0.3 + mist * 0.3);
  look.top.lerp(tmp, day);
  look.horizon.lerp(tmp2, day);

  look.cloudColor
    .copy(P.cloud)
    .lerp(P.cloudShade, ck * 0.6)
    .lerp(P.rainTop, rain * 0.75)
    .lerp(P.goldenHorizon, gold * 0.35);
  look.cloudColor.lerp(P.nightCloud, 1 - day);

  const clearness = 1 - Math.max(ck * 0.85, rain, mist * 0.9);
  look.sunVis = Math.min(1, Math.max(0, ph.sun[1] * 8 + 0.4)) * day * (0.15 + 0.85 * clearness);
  look.moonVis =
    (1 - day) * (0.25 + 0.75 * clearness) * Math.min(1, Math.max(0, ph.moon[1] * 8 + 0.4));
  look.starVis = (1 - day) * clearness;

  // Ánh sáng: ban ngày theo mặt trời, đêm theo trăng. Hướng sáng ăn gian lấy +z để mặt tiền chùa luôn được chiếu.
  const src = day > 0.5 ? ph.sun : ph.moon;
  look.lightDir.set(src[0] * 0.8, Math.max(src[1], 0.42), 0.55).normalize();
  const overcast = Math.max(ck * 0.55, rain * 0.75, mist * 0.6);
  look.sunColor.copy(P.moonLight).lerp(tmp.copy(P.sunLight).lerp(P.goldenLight, gold), day);
  look.sunInt =
    (1 - day) * 0.95 * (1 - overcast * 0.5) + day * 2.3 * (1 - overcast) * (1 - gold * 0.25);
  look.hemiSky
    .copy(P.hemiNight)
    .lerp(P.hemiDay, day)
    .lerp(P.mist, overcast * day * 0.4);
  look.hemiInt = (1 - day) * 1.15 + day * (1.3 + overcast * 0.45);
  look.shadow = 1 - overcast * 0.75;

  look.fogNear = 60 - mist * 50 - rain * 25;
  look.fogFar = 185 - mist * 115 - rain * 50 - ck * 15;
}
