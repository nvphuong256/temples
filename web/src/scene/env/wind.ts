// Gió toàn cảnh — API dùng chung cho mọi phiên chibi (docs/06-chibi-plan.md).
// - `env`: trạng thái môi trường đọc mỗi khung hình (gió, mưa, sương). Phiên 4 (thời tiết) là nơi DUY NHẤT
//   ghi `weather`, `dir`, `baseStrength`, `rain`, `mist`; WindSystem tính `strength`, `windX/Z`, `gust`.
// - `windUniforms` + `withWindSway(material)`: làm cỏ/lá/tre/hoa đung đưa trên GPU, không cần useFrame riêng.
import * as THREE from "three";

export type WeatherKind = "clear" | "cloudy" | "drizzle" | "mist";

export const env = {
  weather: "clear" as WeatherKind,
  /** Hướng gió (rad, trong mặt phẳng xz). */
  dir: -0.6,
  /** Sức gió nền 0..1 do thời tiết đặt. */
  baseStrength: 0.35,
  /** Sức gió hiện tại 0..1 (có giật). */
  strength: 0.35,
  windX: 0,
  windZ: 0,
  /** Cơn gió giật 0..1. */
  gust: 0,
  /** Mưa 0..1, sương 0..1 (phiên 4 điều khiển). */
  rain: 0,
  mist: 0,
  time: 0,
};

export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: new THREE.Vector2(0, 0) },
};

/**
 * Tiêm đung đưa theo gió vào vertex shader của một material (MeshStandard/Basic/Toon...).
 * Biên độ tăng theo độ cao cục bộ `position.y / refHeight` (gốc đứng yên, ngọn lắc).
 * Với InstancedMesh, pha lệch theo vị trí instance để không lắc đồng loạt.
 * Lưu ý: dịch chuyển tính trong không gian cục bộ của geometry (trước instanceMatrix) —
 * instance xoay quanh trục y sẽ lắc theo hướng đã xoay; chấp nhận được cho cỏ/lá.
 */
export function withWindSway<T extends THREE.Material>(mat: T, amp = 0.15, refHeight = 1): T {
  const a = amp.toFixed(4);
  const h = Math.max(refHeight, 0.001).toFixed(4);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = windUniforms.uTime;
    shader.uniforms["uWind"] = windUniforms.uWind;
    shader.vertexShader =
      "uniform float uTime;\nuniform vec2 uWind;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec3 swayBase = vec3(0.0);
        #ifdef USE_INSTANCING
          swayBase = instanceMatrix[3].xyz;
        #endif
        float swayH = clamp(position.y / ${h}, 0.0, 1.0);
        float swayPhase = uTime * 1.8 + swayBase.x * 0.37 + swayBase.z * 0.29;
        float swayK = swayH * swayH * ${a};
        transformed.x += uWind.x * (0.65 + 0.35 * sin(swayPhase)) * swayK;
        transformed.z += uWind.y * (0.65 + 0.35 * sin(swayPhase * 1.3 + 1.1)) * swayK;`,
      );
  };
  mat.customProgramCacheKey = () => `wind-${a}-${h}`;
  return mat;
}
