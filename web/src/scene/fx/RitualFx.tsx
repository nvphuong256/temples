// Hiệu ứng nghi lễ (phiên 5): lắng nghe fx/bus.ts, lập kế hoạch bằng effects.ts, vẽ bằng pool cố định:
// - 12 vòng sáng nằm ngang (plane 2 tam giác + texture canvas, cộng sáng): lạy, gõ mõ, gợn khói, sóng chuông;
// - 160 hạt sáng (Points): tàn hương, vòng hạt tràng bay lên, ánh công đức;
// - 2 đóa sen (Sprite): chắp tay.
// Một useFrame cho tất cả; mọi hiệu ứng ≤ 2 s, mờ dần.
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "../../state/runtime";
import { groundHeight } from "../layout";
import { onFx } from "./bus";
import {
  FxQueue,
  Slots,
  planFx,
  ringLook,
  spawnBurst,
  type FxSpec,
  type LotusSpec,
  type RingSpec,
} from "./effects";
import { ringTexture, lotusTexture } from "./fxTextures";
import { makeGlowMaterial, pointScale, pointsGeometry } from "./pointMaterials";
import { ParticlePool, fadeInOut, makeRng } from "./pool";

const RINGS = 12;
const LOTUS = 2;
const SPARKS = 160;

export function RitualFx() {
  const sys = useMemo(() => {
    const ringGeo = new THREE.PlaneGeometry(2, 2);
    const rings = Array.from({ length: RINGS }, () => {
      const m = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      m.visible = false;
      m.renderOrder = 3;
      return m;
    });
    const lotus = Array.from({ length: LOTUS }, () => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: lotusTexture(),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      s.visible = false;
      s.renderOrder = 3;
      return s;
    });
    const sparkGeo = pointsGeometry(SPARKS, new THREE.Vector3(), 1);
    const sparkMat = makeGlowMaterial(0.35);
    return {
      rings,
      ringSlots: new Slots<RingSpec>(RINGS),
      lotus,
      lotusSlots: new Slots<LotusSpec>(LOTUS),
      sparks: new ParticlePool(SPARKS),
      sparkGeo,
      sparkMat,
      sparkColor: new Float32Array(SPARKS * 3),
      queue: new FxQueue<FxSpec>(),
      rnd: makeRng(99),
      color: new THREE.Color(),
    };
  }, []);
  const clockRef = useRef(0);

  useEffect(
    () =>
      onFx((e) => {
        const g = player.group;
        const ctx = {
          groundY: (x: number, z: number) => groundHeight({ x, z }),
          ...(g
            ? {
                player: { x: g.position.x, y: g.position.y, z: g.position.z, facing: g.rotation.y },
              }
            : {}),
        };
        sys.queue.push(planFx(e, ctx), clockRef.current);
      }),
    [sys],
  );

  useFrame(({ clock, size, camera, gl }, delta) => {
    const now = clock.elapsedTime;
    clockRef.current = now;
    const dt = Math.min(delta, 0.05);

    for (const s of sys.queue.due(now)) {
      if (s.type === "ring") {
        const i = sys.ringSlots.add(s, now);
        const m = sys.rings[i]!;
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.map = ringTexture(s.tex);
        mat.color.set(s.color);
      } else if (s.type === "lotus") {
        const i = sys.lotusSlots.add(s, now);
        (sys.lotus[i]!.material as THREE.SpriteMaterial).color
          .set(s.color)
          .lerp(sys.color.set("#ffffff"), 0.5);
      } else {
        sys.color.set(s.color);
        for (const i of spawnBurst(sys.sparks, s, sys.rnd)) {
          sys.sparkColor[i * 3] = sys.color.r;
          sys.sparkColor[i * 3 + 1] = sys.color.g;
          sys.sparkColor[i * 3 + 2] = sys.color.b;
        }
      }
    }

    // Vòng sáng.
    sys.rings.forEach((m, i) => {
      const t = sys.ringSlots.progress(i, now);
      if (t === null) {
        m.visible = false;
        return;
      }
      const s = sys.ringSlots.items[i]!.spec;
      const l = ringLook(s, t);
      m.visible = true;
      m.position.set(s.x, s.y + l.dy, s.z);
      if (s.billboard) m.quaternion.copy(camera.quaternion);
      else m.rotation.set(-Math.PI / 2, 0, 0);
      m.scale.setScalar(l.r);
      (m.material as THREE.MeshBasicMaterial).opacity = l.alpha;
    });

    // Đóa sen: nở ra, nổi nhẹ lên, tan.
    sys.lotus.forEach((sp, i) => {
      const t = sys.lotusSlots.progress(i, now);
      if (t === null) {
        sp.visible = false;
        return;
      }
      const s = sys.lotusSlots.items[i]!.spec;
      sp.visible = true;
      const k = Math.min(1, t * 3);
      sp.position.set(s.x, s.y + t * 0.25, s.z);
      sp.scale.setScalar(0.35 + 0.4 * (1 - (1 - k) * (1 - k)));
      (sp.material as THREE.SpriteMaterial).opacity = fadeInOut(t, 0.25) * 0.85;
    });

    // Hạt sáng.
    const p = sys.sparks;
    const pos = sys.sparkGeo.attributes["position"] as THREE.BufferAttribute;
    const sz = sys.sparkGeo.attributes["aSize"] as THREE.BufferAttribute;
    const al = sys.sparkGeo.attributes["aAlpha"] as THREE.BufferAttribute;
    const col = sys.sparkGeo.attributes["aColor"] as THREE.BufferAttribute;
    const seed = sys.sparkGeo.attributes["aSeed"] as THREE.BufferAttribute;
    let n = 0;
    for (let i = 0; i < p.cap; i++) {
      if (!p.alive(i)) continue;
      const age = (p.age[i] ?? 0) + dt;
      p.age[i] = age;
      const t = age / (p.life[i] ?? 1);
      if (t >= 1) continue;
      let x: number, y: number, z: number;
      if ((p.b[i] ?? 0) > 0) {
        // Hạt tràng: vòng tròn xoay, bay lên, nở rộng nhẹ.
        const ang = (p.vx[i] ?? 0) + age * 1.2;
        const r = (p.b[i] ?? 0.5) * (1 + 0.35 * t);
        x = (p.px[i] ?? 0) + Math.cos(ang) * r;
        z = (p.pz[i] ?? 0) + Math.sin(ang) * r;
        y = (p.py[i] ?? 0) + (p.vy[i] ?? 0) * age;
      } else {
        // Tàn hương / ánh công đức: bay lên chậm dần, lượn nhẹ.
        p.vy[i] = (p.vy[i] ?? 0) * (1 - dt * 0.9);
        p.px[i] =
          (p.px[i] ?? 0) +
          (p.vx[i] ?? 0) * dt +
          Math.sin(age * 3 + (p.seed[i] ?? 0) * 9) * dt * 0.08;
        p.py[i] = (p.py[i] ?? 0) + (p.vy[i] ?? 0) * dt;
        p.pz[i] = (p.pz[i] ?? 0) + (p.vz[i] ?? 0) * dt;
        x = p.px[i]!;
        y = p.py[i]!;
        z = p.pz[i]!;
      }
      pos.setXYZ(n, x, y, z);
      sz.setX(n, (p.a[i] ?? 0.1) * (1 + 0.3 * Math.sin(t * 3.14)) * 2.2);
      al.setX(n, fadeInOut(t, 0.12));
      col.setXYZ(n, sys.sparkColor[i * 3]!, sys.sparkColor[i * 3 + 1]!, sys.sparkColor[i * 3 + 2]!);
      seed.setX(n, p.seed[i] ?? 0);
      n++;
    }
    sys.sparkGeo.setDrawRange(0, n);
    pos.needsUpdate = sz.needsUpdate = al.needsUpdate = col.needsUpdate = seed.needsUpdate = true;
    const u = sys.sparkMat.uniforms;
    u["uTime"]!.value = now;
    u["uScale"]!.value = pointScale(size.height * gl.getPixelRatio(), camera);
  });

  return (
    <group>
      {sys.rings.map((m, i) => (
        <primitive key={`r${i}`} object={m} />
      ))}
      {sys.lotus.map((s, i) => (
        <primitive key={`l${i}`} object={s} />
      ))}
      <points
        geometry={sys.sparkGeo}
        material={sys.sparkMat}
        frustumCulled={false}
        renderOrder={3}
      />
    </group>
  );
}
