// Thời tiết: đặt env (gió nền, hướng, mưa, sương, mây) mượt theo lib/weather (xác định theo giờ VN),
// tính `look` cho Sky/Lighting, vẽ mưa phùn (LineSegments, chuyển động hoàn toàn trên GPU) và điều âm gió/mưa.
// MỘT useFrame cho cả hệ thống.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_SKY } from "@cvo/shared";
import { setWeatherAudio } from "../../audio/synth";
import {
  currentWeather,
  isWeatherKind,
  skyPhase,
  vnHourFloat,
  weatherDebug,
  type Weather,
} from "../../lib/weather";
import { syncWeatherUi } from "../../lib/weatherStore";
import { useUi } from "../../state/store";
import { HALL } from "../layout";
import { updateLook } from "./look";
import { env } from "./wind";

// Gỡ lỗi / chụp ảnh: ?weather=drizzle
if (typeof window !== "undefined") {
  const q = new URLSearchParams(window.location.search);
  const w = q.get("weather");
  if (isWeatherKind(w)) weatherDebug.force = w;
  const h = Number(q.get("hour") ?? NaN);
  if (q.has("hour") && h >= 0 && h < 24) weatherDebug.hour = h;
}

const DROPS = 1400;
const BOX = 34;
const BOX_H = 18;

const rainVert = /* glsl */ `
uniform vec3 uCenter;
uniform float uTime;
uniform vec2 uWind;
attribute vec3 aSeed;
attribute float aTail;
varying float vFade;
varying vec3 vWorld;
void main() {
  vec3 box = vec3(${BOX.toFixed(1)}, ${BOX_H.toFixed(1)}, ${BOX.toFixed(1)});
  // Tốc độ lấy từ hạt giống KHÁC aSeed.y — nếu tương quan, mọi giọt dồn thành một lớp theo chu kỳ.
  float speed = 6.5 + fract(aSeed.x * 7.13 + aSeed.z * 3.71) * 2.5; // mưa phùn rơi chậm
  vec3 vel = vec3(uWind.x * 4.0, -speed, uWind.y * 4.0);
  vec3 p = aSeed * box + vel * uTime;
  vec3 rel = mod(p - uCenter + box * 0.5, box) - box * 0.5;
  vec3 w = uCenter + rel;
  w -= normalize(vel) * aTail * (0.45 + aSeed.x * 0.35);
  float edge = max(abs(rel.x), abs(rel.z)) / (box.x * 0.5);
  vFade = (1.0 - smoothstep(0.55, 1.0, edge)) * (1.0 - smoothstep(0.6, 1.0, abs(rel.y) / (box.y * 0.5)));
  vFade *= 1.0 - aTail * 0.5;
  vWorld = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;

const rainFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec4 uRoof; // minX, maxX, minZ, maxZ — không mưa trong chính điện
varying float vFade;
varying vec3 vWorld;
void main() {
  if (vWorld.y < 0.0) discard;
  if (vWorld.x > uRoof.x && vWorld.x < uRoof.y && vWorld.z > uRoof.z && vWorld.z < uRoof.w && vWorld.y < 11.0) discard;
  gl_FragColor = vec4(uColor, uOpacity * vFade);
  #include <colorspace_fragment>
}`;

function useRain() {
  return useMemo(() => {
    const pos = new Float32Array(DROPS * 6); // vị trí thật tính trong shader
    const seed = new Float32Array(DROPS * 6);
    const tail = new Float32Array(DROPS * 2);
    for (let i = 0; i < DROPS; i++) {
      const s = [Math.random(), Math.random(), Math.random()];
      seed.set(s, i * 6);
      seed.set(s, i * 6 + 3);
      tail[i * 2 + 1] = 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    geo.setAttribute("aTail", new THREE.BufferAttribute(tail, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const mat = new THREE.ShaderMaterial({
      vertexShader: rainVert,
      fragmentShader: rainFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCenter: { value: new THREE.Vector3() },
        uTime: { value: 0 },
        uWind: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Color(CHIBI_SKY.rain) },
        uOpacity: { value: 0 },
        uRoof: {
          value: new THREE.Vector4(
            HALL.x - HALL.w / 2 - 2,
            HALL.x + HALL.w / 2 + 2,
            HALL.z - HALL.d / 2 - 2,
            HALL.z + HALL.d / 2 + 2,
          ),
        },
      },
    });
    return { geo, mat };
  }, []);
}

/** Nội suy góc theo cung ngắn nhất. */
function lerpAngle(a: number, b: number, k: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * k;
}

export function WeatherFx() {
  const { geo, mat } = useRain();
  const lines = useRef<THREE.LineSegments>(null);
  const st = useRef({
    target: null as Weather | null,
    check: 0,
    audio: 0,
    force: weatherDebug.force as string | null,
  });

  useFrame(({ camera }, delta) => {
    const s = st.current;
    const now = new Date();
    const dt = Math.min(delta, 0.1);
    s.check -= dt;
    let snap = s.target === null;
    if (s.check <= 0 || weatherDebug.force !== s.force) {
      s.check = 1;
      const w = currentWeather(now);
      const changed = !s.target || w.kind !== s.target.kind || w.key !== s.target.key;
      if (weatherDebug.force !== s.force) snap = true; // ép gỡ lỗi: đổi ngay
      s.force = weatherDebug.force;
      s.target = w;
      if (changed) syncWeatherUi(useUi.getState().night, now);
    }
    const w = s.target!;
    env.weather = w.kind;
    // ~20 s để chuyển hẳn sang thời tiết mới.
    const k = snap ? 1 : 1 - Math.exp(-dt / 7);
    env.baseStrength += (w.baseStrength - env.baseStrength) * k;
    env.dir = lerpAngle(env.dir, w.dir, k);
    env.rain += (w.rain - env.rain) * k;
    env.mist += (w.mist - env.mist) * k;
    env.cloud += (w.cloud - env.cloud) * k;

    const ph = skyPhase(weatherDebug.hour ?? vnHourFloat(now));
    updateLook(ph);
    env.daylight = ph.daylight;

    const l = lines.current;
    if (l) {
      l.visible = env.rain > 0.02;
      const u = mat.uniforms;
      u.uCenter!.value.copy(camera.position);
      u.uTime!.value = env.time;
      u.uWind!.value.set(env.windX, env.windZ);
      u.uOpacity!.value = env.rain * (0.45 + 0.35 * ph.daylight);
    }

    s.audio -= dt;
    if (s.audio <= 0) {
      s.audio = 0.25;
      setWeatherAudio(env.strength, env.rain);
    }
  });

  return <lineSegments ref={lines} geometry={geo} material={mat} frustumCulled={false} />;
}
