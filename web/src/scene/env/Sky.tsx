// Bầu trời chibi: vòm gradient (shader rẻ, có đĩa mặt trời + quầng, trăng rằm), sao (Points), mây phồng tròn
// (cụm cầu ghép, MỘT InstancedMesh) trôi theo gió, nhiều/xám hơn khi mây/mưa. MỘT useFrame.
// Tam giác: vòm ~1k + mây 96 × 120 ≈ 11,5k (ngân sách trời/thời tiết ≤ 15k).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_SKY } from "@cvo/shared";
import { look } from "./look";
import { env } from "./wind";

const DOME_R = 270;
const CLOUDS = 16;
const PUFFS = 6;
const SPAN = 250; // mây trôi trong hình vuông ±SPAN rồi quay vòng

const domeVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const domeFrag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uGoldenCol;
uniform float uGolden;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uSunVis;
uniform vec3 uMoonDir;
uniform vec3 uMoonCol;
uniform float uMoonVis;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  // Dải chân trời mỏng, lên cao nhanh thành xanh trong; đỉnh đậm hơn một chút.
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.32, pow(h, 0.85)));
  col *= 1.0 - 0.18 * smoothstep(0.35, 1.0, h);
  // Quầng vàng bình minh/hoàng hôn phía mặt trời, sát chân trời.
  float sd = dot(d, uSunDir);
  col = mix(col, uGoldenCol, uGolden * pow(max(sd, 0.0), 4.0) * pow(1.0 - h, 3.0) * 0.75);
  // Mặt trời tròn + quầng mềm.
  float disc = smoothstep(0.99915, 0.99945, sd);
  float halo = pow(max(sd, 0.0), 400.0) * 0.55 + pow(max(sd, 0.0), 30.0) * 0.22;
  vec3 sunC = mix(uSunCol, uGoldenCol, uGolden * 0.55);
  col = mix(col, sunC * 1.25, disc * uSunVis);
  col += sunC * halo * uSunVis;
  // Trăng rằm to sáng, vài vết mờ.
  float md = dot(d, uMoonDir);
  float mdisc = smoothstep(0.99795, 0.9983, md);
  vec3 r = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
  vec3 u = cross(r, uMoonDir);
  vec2 q = vec2(dot(d, r), dot(d, u)) / 0.058;
  float maria = smoothstep(0.42, 0.0, length(q - vec2(-0.28, 0.22))) * 0.16
              + smoothstep(0.32, 0.0, length(q - vec2(0.3, -0.12))) * 0.13
              + smoothstep(0.24, 0.0, length(q - vec2(0.02, -0.5))) * 0.1;
  col = mix(col, uMoonCol * (1.15 - maria), mdisc * uMoonVis);
  col += uMoonCol * (pow(max(md, 0.0), 1500.0) * 0.4 + pow(max(md, 0.0), 160.0) * 0.1) * uMoonVis;
  // Dưới chân trời hòa vào màu sương/fog.
  col = mix(col, uHorizon, smoothstep(0.0, -0.06, d.y));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Ngẫu nhiên có hạt giống — cảnh trời giống nhau mỗi lần tải. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Khung cụm mây: [dx, dy, dz, r] — đáy phẳng, đỉnh phồng.
const PUFF: [number, number, number, number][] = [
  [0, 0.15, 0, 1],
  [-1.15, -0.05, 0.1, 0.78],
  [1.2, -0.08, -0.05, 0.74],
  [-0.35, 0.7, -0.1, 0.72],
  [0.55, 0.55, 0.15, 0.62],
  [2.0, -0.2, 0.05, 0.5],
];

interface Cloud {
  x: number;
  y: number;
  z: number;
  s: number;
  rot: number;
  /** Thứ tự hiện: mây có `order` nhỏ hiện cả khi trời nắng. */
  order: number;
  vis: number;
}

export function Sky() {
  const dome = useRef<THREE.Mesh>(null);
  const stars = useRef<THREE.Points>(null);
  const clouds = useRef<THREE.InstancedMesh>(null);

  const domeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: domeVert,
        fragmentShader: domeFrag,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uGoldenCol: { value: new THREE.Color(CHIBI_SKY.goldenHorizon) },
          uGolden: { value: 0 },
          uSunDir: { value: new THREE.Vector3(0, 1, 0) },
          uSunCol: { value: new THREE.Color(CHIBI_SKY.sun) },
          uSunVis: { value: 1 },
          uMoonDir: { value: new THREE.Vector3(0, 1, 0) },
          uMoonCol: { value: new THREE.Color(CHIBI_SKY.moon) },
          uMoonVis: { value: 0 },
        },
      }),
    [],
  );

  const starGeo = useMemo(() => {
    const r = rng(7);
    const n = 520;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const y = 0.08 + Math.pow(r(), 0.8) * 0.92;
      const c = Math.sqrt(1 - y * y);
      p.set(
        [Math.cos(a) * c * (DOME_R - 10), y * (DOME_R - 10), Math.sin(a) * c * (DOME_R - 10)],
        i * 3,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const starMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: CHIBI_SKY.star,
        size: 1.8,
        sizeAttenuation: false,
        transparent: true,
        depthWrite: false,
        fog: false,
        opacity: 0,
      }),
    [],
  );

  const cloudGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 7), []);
  const cloudMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CHIBI_SKY.cloud,
        roughness: 1,
        metalness: 0,
        fog: false,
        emissive: CHIBI_SKY.cloud,
        emissiveIntensity: 0.35,
      }),
    [],
  );
  const cloudData = useMemo<Cloud[]>(() => {
    const r = rng(42);
    return Array.from({ length: CLOUDS }, (_, i) => {
      // Nửa số mây phía chính điện (-z) — hướng nhìn quen thuộc từ sân.
      const a = i % 2 ? r() * Math.PI * 2 : -Math.PI / 2 + (r() - 0.5) * 2.2;
      const d = 95 + r() * 130;
      return {
        x: Math.cos(a) * d,
        z: Math.sin(a) * d,
        y: 22 + r() * 30,
        s: 7 + r() * 7,
        rot: r() * Math.PI,
        order: i / CLOUDS,
        vis: 0,
      };
    });
  }, []);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1);
    dome.current?.position.copy(camera.position);
    stars.current?.position.copy(camera.position);
    const u = domeMat.uniforms;
    u.uTop!.value.copy(look.top);
    u.uHorizon!.value.copy(look.horizon);
    u.uGolden!.value = look.golden;
    u.uSunDir!.value.copy(look.sunDir);
    u.uSunVis!.value = look.sunVis;
    u.uMoonDir!.value.copy(look.moonDir);
    u.uMoonVis!.value = look.moonVis;
    starMat.opacity = look.starVis * 0.9;
    if (stars.current) {
      stars.current.visible = look.starVis > 0.02;
      stars.current.rotation.y = env.time * 0.002;
    }

    cloudMat.color.copy(look.cloudColor);
    cloudMat.emissive.copy(look.cloudColor);
    cloudMat.emissiveIntensity = 0.25 + 0.2 * look.daylight;

    const mesh = clouds.current;
    if (!mesh) return;
    const show = 0.3 + env.cloud * 0.7;
    const speed = 0.8 + env.strength * 3.5;
    let i = 0;
    for (const c of cloudData) {
      c.x += env.windX * speed * dt * 2;
      c.z += env.windZ * speed * dt * 2;
      if (c.x > SPAN) c.x -= SPAN * 2;
      if (c.x < -SPAN) c.x += SPAN * 2;
      if (c.z > SPAN) c.z -= SPAN * 2;
      if (c.z < -SPAN) c.z += SPAN * 2;
      const want = c.order < show ? 1 : 0;
      c.vis += (want - c.vis) * Math.min(1, dt * 0.4);
      // Trời mưa: mây phình to, hạ thấp.
      const s = c.s * c.vis * (1 + env.rain * 0.35);
      const cy = c.y - env.rain * 6;
      const cos = Math.cos(c.rot);
      const sin = Math.sin(c.rot);
      for (const [dx, dy, dz, r] of PUFF) {
        v.set(c.x + (dx * cos - dz * sin) * s, cy + dy * s, c.z + (dx * sin + dz * cos) * s);
        sc.set(r * s, r * s * 0.82, r * s);
        q.setFromAxisAngle(up, c.rot);
        m.compose(v, q, sc);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={dome} material={domeMat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[DOME_R, 32, 16]} />
      </mesh>
      <points
        ref={stars}
        geometry={starGeo}
        material={starMat}
        renderOrder={-9}
        frustumCulled={false}
      />
      <instancedMesh
        ref={clouds}
        args={[cloudGeo, cloudMat, CLOUDS * PUFFS]}
        frustumCulled={false}
        renderOrder={-8}
      />
    </>
  );
}
