// Vật liệu Points riêng của phiên 5 (không dùng materials.ts): kích thước theo mét thế giới,
// độ đậm từng hạt (aAlpha), có sương mù. 0 tam giác — mỗi hạt là một point sprite.
import * as THREE from "three";

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uScale;
  uniform float uTime;
  uniform float uFlicker;
  varying float vAlpha;
  varying vec3 vColor;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float fl = 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 13.0 + aSeed * 40.0) * sin(uTime * 7.3 + aSeed * 17.0));
    gl_PointSize = aSize * uScale / max(-mvPosition.z, 0.1);
    vAlpha = aAlpha * fl;
    vColor = aColor;
    #include <fog_vertex>
  }
`;

/** Cuộn khói hoạt hình: đĩa tròn có "khối" (sáng phía trên-trái, bóng mềm phía dưới), viền mềm. */
const PUFF_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uShade;
  uniform float uBright;
  varying float vAlpha;
  #include <fog_pars_fragment>
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    c.y = -c.y;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    vec3 n = vec3(c, sqrt(1.0 - r2));
    float l = dot(n, normalize(vec3(-0.35, 0.75, 0.55)));
    float band = smoothstep(-0.05, 0.55, l);
    vec3 col = mix(uShade, uColor, band) * uBright;
    float edge = 1.0 - smoothstep(0.55, 1.0, r2);
    gl_FragColor = vec4(col, vAlpha * edge);
    #include <fog_fragment>
  }
`;

/** Đốm sáng: lõi trắng ấm + quầng màu (alpha thường để thấy cả ban ngày trên nền sáng). */
const GLOW_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  #include <fog_pars_fragment>
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = length(c);
    if (r > 1.0) discard;
    float core = 1.0 - smoothstep(0.0, 0.28, r);
    float halo = pow(1.0 - r, 2.2);
    vec3 col = mix(vColor, vec3(1.0, 0.97, 0.88), core * 0.8);
    gl_FragColor = vec4(col, clamp((halo + core) * vAlpha, 0.0, 1.0));
    #include <fog_fragment>
  }
`;

function base(extra: Record<string, THREE.IUniform>) {
  return THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uScale: { value: 400 },
      uTime: { value: 0 },
      uFlicker: { value: 0 },
      ...extra,
    },
  ]);
}

export function makePuffMaterial(color: string, shade: string) {
  return new THREE.ShaderMaterial({
    uniforms: base({
      uColor: { value: new THREE.Color(color) },
      uShade: { value: new THREE.Color(shade) },
      uBright: { value: 1 },
    }),
    vertexShader: VERT,
    fragmentShader: PUFF_FRAG,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
}

export function makeGlowMaterial(flicker = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: base({}),
    vertexShader: VERT,
    fragmentShader: GLOW_FRAG,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  m.uniforms["uFlicker"]!.value = flicker;
  return m;
}

/** uScale = chiều cao khung (px) / (2·tan(fov/2)) → aSize tính bằng mét. */
export function pointScale(heightPx: number, camera: THREE.Camera) {
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
  return heightPx / (2 * Math.tan((fov * Math.PI) / 360));
}

/** BufferGeometry cho n điểm với đủ thuộc tính của shader trên. */
export function pointsGeometry(n: number, center: THREE.Vector3, radius: number) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(n), 1));
  g.boundingSphere = new THREE.Sphere(center, radius);
  return g;
}
