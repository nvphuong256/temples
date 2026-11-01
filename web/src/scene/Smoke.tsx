// Khói hương chibi: cuộn khói phồng mềm kiểu hoạt hình bốc lên từ đầu các nén hương, xoắn, trôi theo gió
// (env.windX/windZ — gió mạnh nghiêng nhiều), loãng dần; dày lên ~7 s sau mỗi lần thắp hương (onFx "incense").
// Một useFrame, pool 180 hạt cố định (Points + shader riêng, 0 tam giác).
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHIBI_FX as F } from "@cvo/shared";
import { useUi } from "../state/store";
import { env } from "./env/wind";
import { onFx } from "./fx/bus";
import { ASH_Y, MAX_STICKS, stickSlots } from "./fx/incense";
import { makePuffMaterial, pointScale, pointsGeometry } from "./fx/pointMaterials";
import { makeRng } from "./fx/pool";
import { SMOKE_CAP, SmokeSim } from "./fx/smokeSim";
import { BURNER } from "./layout";

const DAY = 1;
const NIGHT = 0.42;

export function Smoke() {
  const { sim, geo, mat, tips, rnd } = useMemo(() => {
    const geo = pointsGeometry(SMOKE_CAP, new THREE.Vector3(BURNER.x, ASH_Y + 5, BURNER.z), 12);
    const mat = makePuffMaterial(F.smoke, F.smokeShade);
    return {
      sim: new SmokeSim(),
      geo,
      mat,
      tips: stickSlots().map((s) => s.tip),
      rnd: makeRng(1234),
    };
  }, []);

  useEffect(
    () =>
      onFx((e) => {
        if (e.kind === "incense") sim.boost = 1;
      }),
    [sim],
  );

  const look = useMemo(() => ({ x: 0, y: 0, z: 0, size: 0, alpha: 0 }), []);
  const wind = useMemo(() => ({ x: 0, z: 0, strength: 0 }), []);

  useFrame(({ size, camera, gl }, delta) => {
    const dt = Math.min(delta, 0.05);
    const { sticks, night } = useUi.getState();
    const n = Math.min(Math.max(sticks, 0), MAX_STICKS);
    // Nhiều nén → khói gom từ vài đầu nén ngẫu nhiên; không nén nào cháy thì chỉ còn khói lúc mới thắp.
    const pick = () => tips[n > 0 ? Math.floor(rnd() * n) : 0]!;
    sim.emitByRate(dt, n, pick, rnd);
    wind.x = env.windX;
    wind.z = env.windZ;
    wind.strength = env.strength;
    sim.step(dt, wind);

    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    const sz = geo.attributes["aSize"] as THREE.BufferAttribute;
    const al = geo.attributes["aAlpha"] as THREE.BufferAttribute;
    const p = sim.pool;
    let k = 0;
    // Gói hạt sống lên đầu buffer (drawRange) để không vẽ hạt chết.
    for (let i = 0; i < p.cap; i++) {
      if (!p.alive(i)) continue;
      sim.look(i, look);
      pos.setXYZ(k, look.x, look.y, look.z);
      sz.setX(k, look.size);
      al.setX(k, look.alpha);
      k++;
    }
    geo.setDrawRange(0, k);
    pos.needsUpdate = sz.needsUpdate = al.needsUpdate = true;

    const u = mat.uniforms;
    u["uScale"]!.value = pointScale(size.height * gl.getPixelRatio(), camera);
    const b = u["uBright"]!;
    b.value += ((night ? NIGHT : DAY) - b.value) * Math.min(1, dt * 2);
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={2} />;
}
