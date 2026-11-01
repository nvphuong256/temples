// Lư hương chibi giữa sân (BURNER, va chạm 1,6 m): đế đá bo tròn, bụng đồng tròn (lathe), hai quai tròn,
// ba chân thú mập, miệng có tro; nén hương InstancedMesh (≤ 40, theo store `sticks`) có đốm lửa nhấp nháy.
// Không có useFrame: đốm lửa nhấp nháy trên GPU qua windUniforms.uTime (WindSystem cập nhật).
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { CHIBI_FX as F } from "@cvo/shared";
import { useUi } from "../state/store";
import { windUniforms } from "./env/wind";
import { BURNER } from "./layout";
import { ASH_R, ASH_Y, MAX_STICKS, STICK_LEN, stickSlots } from "./fx/incense";
import { makeGlowMaterial, pointScale, pointsGeometry } from "./fx/pointMaterials";

const v = (x: number, y: number) => new THREE.Vector2(x, y);

function burnerParts() {
  const bronze = new THREE.MeshStandardMaterial({
    color: F.burnerBronze,
    metalness: 0.55,
    roughness: 0.4,
  });
  const bronzeDark = new THREE.MeshStandardMaterial({
    color: F.burnerBronzeDark,
    metalness: 0.45,
    roughness: 0.5,
  });
  const stone = new THREE.MeshStandardMaterial({ color: F.burnerStone, roughness: 0.85 });
  const ash = new THREE.MeshStandardMaterial({ color: F.ash, roughness: 1 });
  const stick = new THREE.MeshStandardMaterial({ color: F.incenseStick, roughness: 0.7 });
  // Đốm lửa: sáng không phụ thuộc đèn, nhấp nháy lệch pha theo vị trí từng nén.
  const ember = new THREE.MeshBasicMaterial({ color: F.ember, toneMapped: false });
  ember.onBeforeCompile = (sh) => {
    sh.uniforms["uTime"] = windUniforms.uTime;
    sh.vertexShader =
      "uniform float uTime;\nvarying float vFlick;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 31.0 + instanceMatrix[3].z * 17.0;
        vFlick = 0.75 + 0.25 * sin(uTime * 9.0 + ph) * sin(uTime * 5.3 + ph * 0.7);`,
      );
    sh.fragmentShader =
      "varying float vFlick;\n" +
      sh.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb * 0.7, vec3(1.0, 0.86, 0.5), vFlick - 0.5) * (0.6 + vFlick * 0.6);`,
      );
  };
  ember.customProgramCacheKey = () => "cvo-ember";

  // Bụng lư: tròn mập, cổ thắt, miệng loe — profile (bán kính, độ cao) quanh trục y, gốc tại đáy bụng.
  const belly = new THREE.LatheGeometry(
    [
      v(0.001, 0),
      v(0.35, 0.02),
      v(0.68, 0.1),
      v(0.92, 0.26),
      v(1.04, 0.45),
      v(1.02, 0.62),
      v(0.9, 0.78),
      v(0.8, 0.88),
      v(0.84, 0.95),
      v(0.95, 1.0),
      v(0.97, 1.04),
      v(0.9, 1.07),
      v(0.8, 1.02),
    ],
    24,
  );
  // Đế đá bo tròn.
  const base = new THREE.LatheGeometry(
    [v(0.001, 0), v(1.12, 0), v(1.22, 0.06), v(1.24, 0.2), v(1.16, 0.3), v(0.001, 0.32)],
    20,
  );
  // Mặt tro: vòm thấp.
  const ashGeo = new THREE.LatheGeometry([v(0.001, 0.06), v(0.4, 0.04), v(ASH_R + 0.25, 0)], 20);
  // Chân thú: khối nang mập + bàn chân tròn.
  const leg = new THREE.CapsuleGeometry(0.17, 0.28, 3, 8);
  const paw = new THREE.SphereGeometry(0.21, 10, 6);
  const toe = new THREE.SphereGeometry(0.08, 6, 4);
  const knob = new THREE.SphereGeometry(0.15, 10, 6);
  const handle = new THREE.TorusGeometry(0.24, 0.075, 8, 18);
  const band = new THREE.TorusGeometry(1.035, 0.045, 5, 32);
  const stickGeo = new THREE.CylinderGeometry(0.022, 0.03, STICK_LEN, 5, 1, true);
  stickGeo.translate(0, STICK_LEN / 2, 0);
  const emberGeo = new THREE.OctahedronGeometry(0.045, 0);
  emberGeo.translate(0, STICK_LEN, 0);
  return {
    bronze,
    bronzeDark,
    stone,
    ash,
    stick,
    ember,
    belly,
    base,
    ashGeo,
    leg,
    paw,
    toe,
    knob,
    handle,
    band,
    stickGeo,
    emberGeo,
  };
}

/** Đáy bụng lư (m): ASH_Y nằm dưới miệng 0,05 m. */
const BELLY_Y = ASH_Y - 1.02 + 0.05;

export function IncenseBurner() {
  const sticks = Math.min(
    useUi((s) => s.sticks),
    MAX_STICKS,
  );
  const night = useUi((s) => s.night);
  const P = useMemo(burnerParts, []);
  const slots = useMemo(() => stickSlots(), []);
  const stickRef = useRef<THREE.InstancedMesh>(null);
  const emberRef = useRef<THREE.InstancedMesh>(null);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const dpr = useThree((s) => s.viewport.dpr);

  // Quầng sáng quanh đốm lửa (additive points), nhấp nháy trong shader.
  const glow = useMemo(() => {
    const g = pointsGeometry(MAX_STICKS, new THREE.Vector3(BURNER.x, ASH_Y + 1, BURNER.z), 2);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const sz = g.attributes["aSize"] as THREE.BufferAttribute;
    const al = g.attributes["aAlpha"] as THREE.BufferAttribute;
    const col = g.attributes["aColor"] as THREE.BufferAttribute;
    const seed = g.attributes["aSeed"] as THREE.BufferAttribute;
    const c = new THREE.Color(F.ember);
    slots.forEach((s, i) => {
      pos.setXYZ(i, s.tip[0], s.tip[1], s.tip[2]);
      sz.setX(i, 0.16);
      al.setX(i, 0.9);
      col.setXYZ(i, c.r, c.g, c.b);
      seed.setX(i, (i * 0.618) % 1);
    });
    const m = makeGlowMaterial(0.5);
    m.uniforms["uTime"] = windUniforms.uTime;
    return { g, m };
  }, [slots]);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (const mesh of [stickRef.current, emberRef.current]) {
      if (!mesh) continue;
      slots.forEach((s, i) => {
        o.position.set(BURNER.x + s.x, ASH_Y, BURNER.z + s.z);
        o.rotation.set(s.rx, 0, s.rz);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [slots]);

  useLayoutEffect(() => {
    if (stickRef.current) stickRef.current.count = sticks;
    if (emberRef.current) emberRef.current.count = sticks;
    glow.g.setDrawRange(0, sticks);
  }, [sticks, glow]);

  useLayoutEffect(() => {
    glow.m.uniforms["uScale"]!.value = pointScale(size.height * dpr, camera);
    // Ban đêm quầng sáng rõ hơn, ban ngày chỉ lấp lánh.
    glow.g.attributes["aSize"]!.array.fill(night ? 0.3 : 0.17);
    glow.g.attributes["aSize"]!.needsUpdate = true;
  }, [size.height, dpr, camera, glow, night]);

  return (
    <group>
      <group position={[BURNER.x, 0, BURNER.z]}>
        <mesh geometry={P.base} material={P.stone} receiveShadow castShadow />
        {/* Ba chân thú mập: chân nang nghiêng ra ngoài, bàn chân tròn có ngón, mặt thú tròn ở gối. */}
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3 + Math.PI / 2;
          const cx = Math.cos(a);
          const cz = Math.sin(a);
          return (
            <group key={i} position={[cx * 0.62, 0.32, cz * 0.62]} rotation-y={-a + Math.PI / 2}>
              <mesh
                geometry={P.paw}
                material={P.bronze}
                position={[0, 0.1, 0.06]}
                scale={[1, 0.65, 1.15]}
                castShadow
              />
              {[-0.1, 0, 0.1].map((tx) => (
                <mesh
                  key={tx}
                  geometry={P.toe}
                  material={P.bronzeDark}
                  position={[tx, 0.06, 0.27]}
                />
              ))}
              <mesh
                geometry={P.leg}
                material={P.bronze}
                position={[0, 0.38, -0.02]}
                rotation-x={-0.25}
                castShadow
              />
              <mesh
                geometry={P.knob}
                material={P.bronzeDark}
                position={[0, 0.62, 0.1]}
                scale={[1, 0.85, 0.7]}
              />
            </group>
          );
        })}
        <group position-y={BELLY_Y}>
          <mesh geometry={P.belly} material={P.bronze} castShadow />
          {/* Đai trang trí quanh bụng. */}
          <mesh
            geometry={P.band}
            material={P.bronzeDark}
            position-y={0.5}
            rotation-x={Math.PI / 2}
          />
          {/* Hai quai tròn dựng trên vành miệng. */}
          {[-1, 1].map((sx) => (
            <mesh
              key={sx}
              geometry={P.handle}
              material={P.bronze}
              position={[sx * 0.82, 1.27, 0]}
              castShadow
            />
          ))}
        </group>
        <mesh geometry={P.ashGeo} material={P.ash} position-y={ASH_Y - 0.03} />
      </group>
      <instancedMesh ref={stickRef} args={[P.stickGeo, P.stick, MAX_STICKS]} castShadow />
      <instancedMesh ref={emberRef} args={[P.emberGeo, P.ember, MAX_STICKS]} />
      <points geometry={glow.g} material={glow.m} />
    </group>
  );
}
