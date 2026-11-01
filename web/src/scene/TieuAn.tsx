// Tiểu An — NPC ở tam quan, bản hoạt hình chibi (ảnh tham chiếu của Phương, 01/11): đầu to, mắt nâu to,
// má hồng, tai to, áo tràng cam cổ chéo trắng, đai nâu, tay áo rộng, cầm gậy gỗ.
// Tư thế (chào, ngồi) do AvatarAnimator chạy qua runtime.avatars; cử động riêng (thở, chớp mắt, nghiêng
// đầu, nhìn theo người chơi) ở useFrame dưới đây — chỉ có một Tiểu An trong cảnh.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_COLORS as C } from "@cvo/shared";
import { TIEU_AN_ID, avatars, player } from "../state/runtime";
import { TIEU_AN } from "./layout";
import { makeFaceTextures } from "./tieuAnFace";

const HEAD_Y = 1.42;
const HEAD_R = 0.56;
const LOOK_RANGE_M = 9;

function useTieuAnMaterials() {
  return useMemo(() => {
    const std = (color: string, roughness = 0.7) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const face = makeFaceTextures();
    return {
      face,
      head: new THREE.MeshStandardMaterial({ map: face.open, roughness: 0.55 }),
      skin: std(C.tieuAnSkin, 0.55),
      ear: std(C.tieuAnEar, 0.55),
      robe: std(C.tieuAnRobe, 0.85),
      collar: std(C.tieuAnCollar, 0.8),
      sash: std(C.tieuAnSash, 0.8),
      staff: std("#B9773A", 0.6),
    };
  }, []);
}

/** Thân áo tràng: mặt tròn xoay loe ở gấu. */
function robeGeometry() {
  const pts = [
    [0.0, 0.06],
    [0.6, 0.06],
    [0.62, 0.12],
    [0.58, 0.32],
    [0.5, 0.58],
    [0.44, 0.8],
    [0.36, 0.96],
    [0.18, 1.04],
    [0.0, 1.06],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 28);
}

/** Tay áo rộng: ống côn loe ở cổ tay. */
function sleeveGeometry() {
  const g = new THREE.CylinderGeometry(0.11, 0.2, 0.5, 14, 1, true);
  g.translate(0, -0.25, 0);
  return g;
}

export function TieuAn() {
  const m = useTieuAnMaterials();
  const robeGeo = useMemo(robeGeometry, []);
  const sleeveGeo = useMemo(sleeveGeometry, []);
  const pivot = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Group>(null);
  const cushion = useRef<THREE.Mesh>(null);
  const sitK = useRef(0);
  const head = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Mesh>(null);
  const feet = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const palms = useRef<THREE.Group>(null);
  const sideHands = useRef<THREE.Group>(null);
  const blink = useRef({ next: 2 + Math.random() * 3, until: 0 });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(
    () => () => {
      m.face.open.dispose();
      m.face.closed.dispose();
      Object.values(m).forEach((v) => v instanceof THREE.Material && v.dispose());
    },
    [m],
  );

  useLayoutEffect(() => {
    if (!pivot.current || !palms.current) return;
    avatars.set(TIEU_AN_ID, {
      pivot: pivot.current,
      hands: palms.current,
      pose: "idle",
      t: 0,
      moving: false,
    });
    return () => {
      avatars.delete(TIEU_AN_ID);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    // Ngồi thiền: bù độ hạ của pose "sit" chung (pivot -0,5), xòe áo trên bồ đoàn, hạ đầu theo thân.
    const sitting = avatars.get(TIEU_AN_ID)?.pose === "sit";
    sitK.current += ((sitting ? 1 : 0) - sitK.current) * Math.min(1, delta * 4);
    const k = sitK.current;
    if (lift.current) lift.current.position.y = sitting ? 0.5 : 0;
    if (cushion.current) cushion.current.visible = k > 0.05;
    if (neck.current) neck.current.position.y = 1.03 - 0.48 * k;
    // Thở: thân phồng nhẹ.
    const breath = Math.sin(t * 1.6);
    if (body.current) {
      body.current.position.y = 0.1 * k;
      body.current.scale.set(
        1 + 0.18 * k + breath * 0.012,
        1 - 0.45 * k + breath * 0.018,
        1 + 0.18 * k,
      );
    }
    // Chớp mắt mỗi 2–5 s.
    const b = blink.current;
    if (t > b.next) {
      b.until = t + 0.13;
      b.next = t + 2 + Math.random() * 3;
    }
    if (feet.current) feet.current.visible = k < 0.5;
    // Ngồi thiền thì nhắm mắt.
    const closed = t < b.until || k > 0.6;
    const want = closed ? m.face.closed : m.face.open;
    if (m.head.map !== want) {
      m.head.map = want;
      m.head.needsUpdate = true;
    }
    // Đầu: nghiêng nhẹ + quay nhìn người chơi khi ở gần.
    const h = head.current;
    if (h) {
      let yaw = Math.sin(t * 0.4) * 0.12;
      const g = player.group;
      if (g) {
        tmp.set(g.position.x - TIEU_AN.x, 0, g.position.z - TIEU_AN.z);
        if (tmp.length() < LOOK_RANGE_M)
          yaw = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -0.7, 0.7);
      }
      h.position.y = HEAD_Y - 0.48 * k;
      h.rotation.y += (yaw * (1 - k) - h.rotation.y) * 0.08;
      h.rotation.z = Math.sin(t * 0.7) * 0.06;
    }
    // Chắp tay (pose greet/bow/sit) thì ẩn tay hai bên và gậy.
    if (sideHands.current && palms.current) sideHands.current.visible = !palms.current.visible;
  });

  return (
    <group position={[TIEU_AN.x, 0, TIEU_AN.z]}>
      <mesh ref={cushion} material={m.sash} position-y={0.07} visible={false}>
        <cylinderGeometry args={[0.7, 0.72, 0.14, 24]} />
      </mesh>
      <group ref={pivot}>
        <group ref={lift}>
          <group ref={body}>
            <mesh geometry={robeGeo} material={m.robe} castShadow />
            {/* Cổ chéo (giao lĩnh) trắng ngà: hai dải bám mặt ngực, gặp nhau ở đai + viền cổ */}
            {[1, -1].map((s) => (
              <mesh
                key={s}
                material={m.collar}
                position={[s * 0.075, 0.82, 0.425]}
                rotation={[-0.5, 0, -s * 0.36]}
              >
                <boxGeometry args={[0.09, 0.42, 0.03]} />
              </mesh>
            ))}
            <mesh material={m.collar} position-y={1.0} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.2, 0.035, 8, 24]} />
            </mesh>
            {/* Đai nâu + dây buộc */}
            <mesh material={m.sash} position-y={0.6}>
              <cylinderGeometry args={[0.51, 0.53, 0.13, 28]} />
            </mesh>
            <mesh material={m.collar} position={[-0.16, 0.4, 0.5]} rotation={[-0.18, 0, 0.05]}>
              <boxGeometry args={[0.06, 0.34, 0.02]} />
            </mesh>
            {/* Bàn chân đi tất trắng ló dưới gấu áo */}
            {[1, -1].map((s) => (
              <mesh
                key={s}
                material={m.collar}
                position={[s * 0.16, 0.06, 0.48]}
                scale={[1, 0.6, 1.4]}
              >
                <sphereGeometry args={[0.09, 10, 8]} />
              </mesh>
            ))}
            {/* Tay áo rộng */}
            {[1, -1].map((s) => (
              <group key={s} position={[s * 0.36, 0.95, 0.02]} rotation={[0.15, 0, s * 0.42]}>
                <mesh geometry={sleeveGeo} material={m.robe} castShadow />
                <mesh material={m.collar} position-y={-0.5} rotation-x={Math.PI / 2}>
                  <torusGeometry args={[0.2, 0.025, 6, 18]} />
                </mesh>
              </group>
            ))}
            {/* Tay buông hai bên + gậy gỗ (tay phải) */}
            <group ref={sideHands}>
              {[1, -1].map((s) => (
                <mesh key={s} material={m.skin} position={[s * 0.6, 0.5, 0.06]}>
                  <sphereGeometry args={[0.1, 12, 10]} />
                </mesh>
              ))}
              <mesh material={m.staff} position={[-0.74, 0.42, 0.32]} rotation={[0.55, 0, 0.75]}>
                <cylinderGeometry args={[0.035, 0.04, 1.5, 8]} />
              </mesh>
            </group>
            {/* Chắp tay trước ngực (hiện khi chào/lễ) */}
            <group ref={palms} position={[0, 0.82, 0.46]} visible={false}>
              {[1, -1].map((s) => (
                <mesh key={s} material={m.skin} position-x={s * 0.035} scale={[0.6, 1.3, 0.9]}>
                  <sphereGeometry args={[0.1, 10, 8]} />
                </mesh>
              ))}
            </group>
          </group>
          {/* Đầu to (chibi), cổ ngắn */}
          <mesh ref={neck} material={m.skin} position-y={1.03}>
            <cylinderGeometry args={[0.12, 0.14, 0.14, 12]} />
          </mesh>
          <group ref={head} position-y={HEAD_Y}>
            <mesh material={m.head} rotation-y={0} scale={[1, 0.97, 0.94]} castShadow>
              <sphereGeometry args={[HEAD_R, 40, 28]} />
            </mesh>
            {[1, -1].map((s) => (
              <mesh
                key={s}
                material={m.ear}
                position={[s * (HEAD_R + 0.02), -0.04, 0]}
                rotation-y={s * 0.35}
                scale={[0.45, 0.85, 0.3]}
              >
                <sphereGeometry args={[0.2, 14, 10]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
