// Khói hương: 220 hạt Points, một useFrame (một instance duy nhất trong cảnh).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_COLORS } from "@cvo/shared";
import { BURNER } from "./layout";
import { smokeTexture } from "./textures";

const N = 220;

export function Smoke() {
  const ref = useRef<THREE.Points>(null);
  const { geo, life, mat } = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const life = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      life[i] = Math.random();
      pos[i * 3] = BURNER.x;
      pos[i * 3 + 1] = 2.6;
      pos[i * 3 + 2] = BURNER.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(BURNER.x, 7, BURNER.z), 8);
    const mat = new THREE.PointsMaterial({
      map: smokeTexture(),
      size: 1.6,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
      color: SCENE_COLORS.smoke,
    });
    return { geo, life, mat };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const l = (life[i] ?? 0) + dt * 0.12;
      if (l > 1) {
        life[i] = 0;
        p.setXYZ(
          i,
          BURNER.x + (Math.random() - 0.5) * 0.6,
          2.4,
          BURNER.z + (Math.random() - 0.5) * 0.6,
        );
        continue;
      }
      life[i] = l;
      p.setY(i, 2.4 + l * 9);
      p.setX(i, p.getX(i) + Math.sin(l * 8 + i) * dt * 0.3 + dt * 0.25);
      p.setZ(i, p.getZ(i) + Math.cos(l * 6 + i) * dt * 0.2);
    }
    p.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}
