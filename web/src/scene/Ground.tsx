// Nền: cỏ, sân gạch, lối vào tam quan. Nhấp (không kéo) lên nền → đi tới điểm đó.
import type { ThreeEvent } from "@react-three/fiber";
import { goTo } from "../rituals/actions";
import { useUi } from "../state/store";
import { clampPos } from "./layout";
import { M } from "./materials";

function onGroundClick(e: ThreeEvent<MouseEvent>) {
  if (useUi.getState().phase !== "temple" || e.delta > 6) return;
  e.stopPropagation();
  goTo(clampPos({ x: e.point.x, z: e.point.z }), null);
}

export function Ground() {
  return (
    <group>
      <mesh material={M.grass} rotation-x={-Math.PI / 2} receiveShadow onClick={onGroundClick}>
        <planeGeometry args={[260, 260]} />
      </mesh>
      <mesh
        material={M.brick}
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, -4]}
        receiveShadow
        onClick={onGroundClick}
      >
        <planeGeometry args={[52, 70]} />
      </mesh>
      <mesh
        material={M.brick}
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, 42]}
        receiveShadow
        onClick={onGroundClick}
      >
        <planeGeometry args={[8, 30]} />
      </mesh>
    </group>
  );
}
