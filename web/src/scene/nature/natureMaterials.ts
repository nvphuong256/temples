// Vật liệu thiên nhiên (riêng phiên 3, không đụng scene/materials.ts). Tạo một lần cho cả cảnh.
// Cây cỏ dùng withWindSway (đung đưa trên GPU, không useFrame). Màu theo đỉnh → một material/vật thể.
import * as THREE from "three";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { withWindSway, windUniforms } from "../env/wind";
import { grassTexture, pavingTexture } from "./natureTextures";

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
const vc = (p: THREE.MeshStandardMaterialParameters = {}) =>
  std({ vertexColors: true, roughness: 0.8, metalness: 0, ...p });

/** Lá mỏng hai mặt: giữ pháp tuyến hướng lên cho cả mặt sau (không tối đen khi nhìn từ phía sau). */
function noBackfaceDarken<T extends THREE.Material>(mat: T): T {
  const prev = mat.onBeforeCompile.bind(mat);
  const prevKey = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (shader, renderer) => {
    prev(shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      "#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal *= faceDirection;\n#endif",
    );
  };
  mat.customProgramCacheKey = () => prevKey() + "-nbd";
  return mat;
}

/** Rễ phụ buông: gốc trên đứng yên, đuôi dưới lắc theo gió. */
function withHangSway<T extends THREE.Material>(mat: T, amp: number, top: number, len: number): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = windUniforms.uTime;
    shader.uniforms["uWind"] = windUniforms.uWind;
    shader.vertexShader =
      "uniform float uTime;\nuniform vec2 uWind;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float hangK = clamp((${top.toFixed(3)} - position.y) / ${len.toFixed(3)}, 0.0, 1.0);
        hangK *= hangK * ${amp.toFixed(3)};
        float hangP = uTime * 1.5 + position.x * 0.9 + position.z * 0.7;
        transformed.x += (uWind.x + 0.12 * sin(hangP)) * hangK;
        transformed.z += (uWind.y + 0.12 * cos(hangP * 1.2)) * hangK;`,
      );
  };
  mat.customProgramCacheKey = () => `hang-${amp}-${top}-${len}`;
  return mat;
}

/** Mặt nước: màu sâu→nông theo đỉnh + gợn sáng lấp lánh trong fragment (theo uTime của gió). */
function withSparkle<T extends THREE.Material>(mat: T): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = windUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying vec3 vWp;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float wv = sin(vWp.x * 2.3 + uTime * 1.1) * sin(vWp.z * 2.9 - uTime * 0.9)
                 + 0.5 * sin((vWp.x + vWp.z) * 5.1 + uTime * 2.3);
        diffuseColor.rgb += vec3(0.03, 0.07, 0.08) * wv;
        totalEmissiveRadiance += vec3(${new THREE.Color(N.waterSparkle)
          .toArray()
          .map((v) => v.toFixed(3))
          .join(",")}) * smoothstep(1.3, 1.48, wv) * 0.7;`,
      );
  };
  mat.customProgramCacheKey = () => "pond-sparkle";
  return mat;
}

function groundMat(map: THREE.Texture, tileM: number, offset = false) {
  map.repeat.set(1 / tileM, 1 / tileM);
  return std({
    map,
    roughness: 0.95,
    ...(offset ? { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 } : {}),
  });
}

export const NM = {
  /** UV tính bằng mét (planeGeometry đã nhân kích thước) → repeat = 1/ô. */
  grassGround: groundMat(grassTexture(), 6),
  paving: groundMat(pavingTexture(), 4, true),
  pavingEdge: std({
    color: N.paveEdge,
    roughness: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -0.5,
    polygonOffsetUnits: -1,
  }),
  tuft: noBackfaceDarken(withWindSway(vc({ side: THREE.DoubleSide, roughness: 0.95 }), 0.22, 0.6)),
  flower: noBackfaceDarken(withWindSway(vc({ side: THREE.DoubleSide, roughness: 0.7 }), 0.2, 0.4)),
  pebble: vc({ roughness: 0.6 }),
  bush: withWindSway(vc({ roughness: 0.85 }), 0.08, 1.3),
  fern: noBackfaceDarken(withWindSway(vc({ side: THREE.DoubleSide, roughness: 0.85 }), 0.22, 0.7)),
  bamboo: noBackfaceDarken(withWindSway(vc({ side: THREE.DoubleSide, roughness: 0.7 }), 1.1, 8.5)),
  pot: withWindSway(vc({ roughness: 0.5 }), 0.1, 1.9),
  trunk: vc({ roughness: 0.9 }),
  canopy: withWindSway(
    vc({ roughness: 0.85, emissive: N.leafDark, emissiveIntensity: 0.35 }),
    0.35,
    11.5,
  ),
  aerialRoot: withHangSway(vc({ roughness: 0.9 }), 0.9, 6.6, 5.5),
  water: withSparkle(
    vc({ transparent: true, opacity: 0.82, roughness: 0.12, metalness: 0.1, depthWrite: false }),
  ),
  pondBed: std({ color: N.pondBed, roughness: 1 }),
  lily: vc({ side: THREE.DoubleSide, roughness: 0.6 }),
  lotus: withWindSway(vc({ roughness: 0.6 }), 0.18, 0.8),
  koi: noBackfaceDarken(vc({ side: THREE.DoubleSide, roughness: 0.45 })),
  leaf: noBackfaceDarken(vc({ side: THREE.DoubleSide, roughness: 0.75 })),
};
