// Trời, sương, ánh sáng theo ngày/đêm giờ VN (5h–18h nắng, 18h–5h đêm rằm).
import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_COLORS as C } from "@cvo/shared";
import { useUi } from "../state/store";

export function Lighting({ shadows }: { shadows: boolean }) {
  const night = useUi((s) => s.night);
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);

  useLayoutEffect(() => {
    const sky = night ? C.skyNight : C.skyDay;
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.Fog(night ? C.skyNight : C.fogDay, 60, 170);
  }, [night, scene]);

  useLayoutEffect(() => {
    const cam = sun.current?.shadow.camera;
    if (!cam) return;
    Object.assign(cam, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 150 });
    cam.updateProjectionMatrix();
  }, []);

  return (
    <>
      <hemisphereLight args={[night ? "#5a6a9a" : "#fff2d8", "#4a3a2a", night ? 0.35 : 1.4]} />
      <directionalLight
        ref={sun}
        color={night ? "#8aa0d0" : "#fff0c8"}
        intensity={night ? 0.3 : 2.2}
        position={[30, 50, 20]}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
      />
    </>
  );
}
