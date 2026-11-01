// Avatar tỷ lệ 3 đầu, không mặt chi tiết: chú tiểu (áo nâu, chỏm tóc) / Phật tử (áo lam, tóc búi).
// variant "tieuan" thêm khăn vàng. Không có useFrame — hoạt ảnh do AvatarAnimator chạy chung.
import { useLayoutEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import { avatars, type AvatarPose } from "../state/runtime";
import { M } from "./materials";

interface Props {
  id: string;
  kind: "tieu" | "phattu";
  variant?: "tieuan";
  pose?: AvatarPose;
}

export function Avatar({ id, kind, variant, pose = "idle" }: Props) {
  const pivot = useRef<Group>(null);
  const hands = useRef<Mesh>(null);

  useLayoutEffect(() => {
    if (!pivot.current || !hands.current) return;
    avatars.set(id, {
      pivot: pivot.current,
      hands: hands.current,
      pose,
      t: Math.random() * 3,
      moving: false,
    });
    return () => {
      avatars.delete(id);
    };
  }, [id, kind, pose]);

  return (
    <group ref={pivot}>
      <mesh material={kind === "phattu" ? M.robeBlue : M.robeBrown} position-y={0.72} castShadow>
        <cylinderGeometry args={[0.42, 0.55, 1.25, 12]} />
      </mesh>
      <mesh material={M.skin} position-y={1.68} castShadow>
        <sphereGeometry args={[0.34, 14, 12]} />
      </mesh>
      <mesh ref={hands} material={M.skin} position={[0, 1.1, 0.5]} visible={false}>
        <boxGeometry args={[0.3, 0.36, 0.18]} />
      </mesh>
      {kind === "phattu" ? (
        <>
          <mesh material={M.woodDark} position-y={1.72}>
            <sphereGeometry args={[0.36, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={M.woodDark} position={[0, 1.8, -0.32]}>
            <sphereGeometry args={[0.14, 8, 6]} />
          </mesh>
        </>
      ) : (
        <mesh material={M.woodDark} position={[0, 2.0, 0.1]}>
          <sphereGeometry args={[0.1, 8, 6]} />
        </mesh>
      )}
      {variant === "tieuan" && (
        <mesh material={M.scarf} position-y={1.36} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.36, 0.09, 8, 20]} />
        </mesh>
      )}
    </group>
  );
}
