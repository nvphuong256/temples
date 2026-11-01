// Ao sen chibi (x = -19, z = 12): bờ đá cuội tròn, nước lấp lánh (shader rẻ), lá súng có khía,
// hoa sen 3 lớp cánh + nụ sen trên cuống (withWindSway), 3 cá chép cam bơi vòng (một useFrame cho cả ao).
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { POND } from "./layout";
import * as G from "./nature/geometries";
import { Instances, type Placement } from "./nature/Instances";
import { NM } from "./nature/natureMaterials";
import { rng } from "./nature/scatter";

const WATER_Y = 0.24;
const RIM_COLORS = [N.stone, N.pebble, N.stoneWarm, "#9C978C"];
const noRaycast = () => null;

function waterGeometry() {
  const g = new THREE.CircleGeometry(POND.r + 0.1, 48).rotateX(-Math.PI / 2);
  const deep = new THREE.Color(N.waterDeep);
  const shallow = new THREE.Color(N.water);
  return G.paint(g, (p, c) =>
    c.copy(deep).lerp(shallow, Math.min(1, Math.hypot(p.x, p.z) / POND.r)),
  );
}

function usePondLayout() {
  return useMemo(() => {
    const r = rng(77);
    const rim: Placement[] = [];
    for (let i = 0; i < G.COUNTS.rimStones; i++) {
      const a = (i / G.COUNTS.rimStones) * Math.PI * 2 + r() * 0.05;
      const d = POND.r + 0.25 + r() * 0.2;
      const k = 0.5 + r() * 0.3;
      rim.push({
        x: POND.x + Math.cos(a) * d,
        z: POND.z + Math.sin(a) * d,
        y: 0.1,
        ry: -a,
        s: [k * 0.8, k * 0.55, k * 1.05],
        color: RIM_COLORS[Math.floor(r() * RIM_COLORS.length)],
      });
    }
    const pads: Placement[] = [];
    const flowers: Placement[] = [];
    const buds: Placement[] = [];
    const used: { x: number; z: number; r: number }[] = [];
    for (let tries = 0; pads.length < G.COUNTS.lilyPads && tries < 400; tries++) {
      const a = r() * Math.PI * 2;
      const d = 1.2 + r() * (POND.r - 2.1);
      const s = 0.45 + r() * 0.4;
      const x = POND.x + Math.cos(a) * d;
      const z = POND.z + Math.sin(a) * d;
      if (used.some((u) => Math.hypot(u.x - x, u.z - z) < u.r + s)) continue;
      used.push({ x, z, r: s });
      pads.push({ x, z, y: WATER_Y + 0.015, ry: r() * Math.PI * 2, s });
      if (flowers.length < G.COUNTS.lotus && pads.length % 3 === 1)
        flowers.push({ x, z, y: WATER_Y, ry: r() * Math.PI, s: 1 + r() * 0.3 });
      else if (buds.length < G.COUNTS.buds && pads.length % 3 === 2)
        buds.push({ x: x + 0.3, z: z - 0.2, y: WATER_Y, ry: 0, s: 0.9 + r() * 0.3 });
    }
    return { rim, pads, flowers, buds };
  }, []);
}

/** Đường bơi: mỗi con một vòng elip riêng, tốc độ/chiều khác nhau. */
const KOI = [
  { r: 4.6, e: 0.75, w: 0.32, p: 0, y: 0.17 },
  { r: 3.1, e: 0.9, w: -0.45, p: 2.1, y: 0.18 },
  { r: 5.5, e: 0.65, w: 0.24, p: 4.2, y: 0.16 },
] as const;

export function LotusPond() {
  const geo = useMemo(
    () => ({
      water: waterGeometry(),
      rim: G.pebble(),
      pad: G.lilyPad(),
      lotus: G.lotusFlower(),
      bud: G.lotusBud(),
      koi: G.koi(),
    }),
    [],
  );
  const lay = usePondLayout();
  const koi = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);

  // Một useFrame cho cả ao: cá bơi vòng, uốn đuôi bằng lắc nhẹ thân.
  useFrame(({ clock }) => {
    const m = koi.current;
    if (!m) return;
    const t = clock.elapsedTime;
    KOI.forEach((k, i) => {
      const a = k.p + t * k.w;
      const wob = Math.sin(t * 0.37 + i) * 0.6;
      const x = POND.x + Math.cos(a) * (k.r + wob);
      const z = POND.z + Math.sin(a) * (k.r + wob) * k.e;
      // Hướng = đạo hàm quỹ đạo.
      const dx = -Math.sin(a) * k.w;
      const dz = Math.cos(a) * k.w * k.e;
      o.position.set(x, k.y + Math.sin(t * 1.3 + i) * 0.015, z);
      o.rotation.set(0, Math.atan2(dx, dz) + Math.sin(t * 6 + i * 2) * 0.12, 0);
      o.scale.setScalar(1.5);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="nature-pond">
      {/* Đáy ao xanh rêu che cỏ, rồi nước trong suốt phía trên → cá thấy mờ dưới nước. */}
      <mesh
        material={NM.pondBed}
        rotation-x={-Math.PI / 2}
        position={[POND.x, 0.03, POND.z]}
        raycast={noRaycast}
      >
        <circleGeometry args={[POND.r + 0.2, 40]} />
      </mesh>
      <mesh
        geometry={geo.water}
        material={NM.water}
        position={[POND.x, WATER_Y, POND.z]}
        raycast={noRaycast}
        renderOrder={1}
      />
      <Instances geometry={geo.rim} material={NM.pebble} items={lay.rim} castShadow receiveShadow />
      <Instances geometry={geo.pad} material={NM.lily} items={lay.pads} />
      <Instances geometry={geo.lotus} material={NM.lotus} items={lay.flowers} />
      <Instances geometry={geo.bud} material={NM.lotus} items={lay.buds} />
      <instancedMesh
        ref={koi}
        args={[geo.koi, NM.koi, KOI.length]}
        raycast={noRaycast}
        frustumCulled={false}
      />
    </group>
  );
}
