// Ánh sáng + fog theo ngày/đêm (chuyển mượt 5h/18h giờ VN) và thời tiết — đọc `look` do WeatherFx tính.
// Ngày: nắng vàng ấm; âm u/mưa: dịu, bóng mềm; sương: fog dày. Đêm rằm: ánh trăng xanh nhạt.
// `shadows=false` (máy yếu) tắt bóng đổ. MỘT useFrame.
import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_SKY } from "@cvo/shared";
import { look } from "./env/look";

export function Lighting({ shadows }: { shadows: boolean }) {
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);

  useLayoutEffect(() => {
    const bg = new THREE.Color(CHIBI_SKY.dayHorizon);
    scene.background = bg;
    scene.fog = new THREE.Fog(bg.clone(), 60, 180);
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  useLayoutEffect(() => {
    const cam = sun.current?.shadow.camera;
    if (!cam) return;
    Object.assign(cam, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 160 });
    cam.updateProjectionMatrix();
  }, []);

  useFrame(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(look.horizon);
      fog.near = look.fogNear;
      fog.far = look.fogFar;
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(look.horizon);
    const h = hemi.current;
    if (h) {
      h.color.copy(look.hemiSky);
      h.intensity = look.hemiInt;
    }
    const s = sun.current;
    if (s) {
      s.position.copy(look.lightDir).multiplyScalar(70);
      s.color.copy(look.sunColor);
      s.intensity = look.sunInt;
      s.shadow.intensity = look.shadow;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={[CHIBI_SKY.hemiDay, CHIBI_SKY.hemiGround, 1.4]} />
      <directionalLight
        ref={sun}
        color={CHIBI_SKY.sunLight}
        intensity={2.2}
        position={[30, 50, 20]}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.02}
      />
    </>
  );
}
