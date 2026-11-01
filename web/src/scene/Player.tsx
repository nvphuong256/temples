// Người chơi + camera bám theo: phím WASD/mũi tên, joystick, nhấp sàn để đi, kéo xoay, cuộn/pinch zoom.
// Trong chính điện đi chậm (tôn nghiêm, không chạy). Một useFrame cho di chuyển + camera.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PLAYER_ID, avatars, cam, camBlockers, input, player } from "../state/runtime";
import { useUi } from "../state/store";
import { ChibiAvatar } from "./chibi/ChibiAvatar";
import { SPAWN, clampPos, groundHeight, isInHall, steerAround } from "./layout";

const SPEED_YARD = 5.5;
const SPEED_HALL = 2.4;
const CAM_MIN_DIST = 2.5;
const CAM_HIT_MARGIN = 0.6;
const tmp = new THREE.Vector3();
const look = new THREE.Vector3();
const dir = new THREE.Vector3();
const ray = new THREE.Raycaster();

function useCameraControls() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    let drag: { x: number; y: number; yaw: number; pitch: number; id: number } | null = null;
    let pinch: number | null = null;
    const active = () => useUi.getState().phase === "temple";
    const clampDist = (d: number) => Math.max(5, Math.min(24, d));

    const down = (e: PointerEvent) => {
      if (!active() || (e.pointerType === "touch" && pinch !== null)) return;
      drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId || pinch !== null) return;
      cam.yaw = drag.yaw - (e.clientX - drag.x) * 0.006;
      cam.pitch = Math.max(0.12, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.004));
    };
    const up = (e: PointerEvent) => {
      if (drag?.id === e.pointerId) drag = null;
    };
    const wheel = (e: WheelEvent) => {
      if (active()) cam.dist = clampDist(cam.dist + e.deltaY * 0.01);
    };
    const span = (t: TouchList) =>
      Math.hypot(
        (t[0]?.clientX ?? 0) - (t[1]?.clientX ?? 0),
        (t[0]?.clientY ?? 0) - (t[1]?.clientY ?? 0),
      );
    const tstart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = span(e.touches);
        drag = null;
      }
    };
    const tmove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinch === null) return;
      const d = span(e.touches);
      cam.dist = clampDist(cam.dist - (d - pinch) * 0.03);
      pinch = d;
    };
    const tend = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: true });
    el.addEventListener("touchstart", tstart, { passive: true });
    el.addEventListener("touchmove", tmove, { passive: true });
    el.addEventListener("touchend", tend, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", tstart);
      el.removeEventListener("touchmove", tmove);
      el.removeEventListener("touchend", tend);
    };
  }, [gl]);
}

export function resetPlayer() {
  const g = player.group;
  if (g) {
    g.position.set(SPAWN.x, 0, SPAWN.z);
    g.rotation.y = Math.PI;
  }
  player.walkTo = null;
  player.onArrive = null;
  cam.yaw = 0;
  cam.pitch = 0.42;
  cam.dist = 14;
}

export function Player() {
  const kind = useUi((s) => s.avatar);
  const group = useRef<THREE.Group>(null);
  useCameraControls();

  useEffect(() => {
    player.group = group.current;
    resetPlayer();
    return () => {
      player.group = null;
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const ui = useUi.getState();
    const inTemple = ui.phase === "temple";
    const anim = avatars.get(PLAYER_ID);
    let mx = 0;
    let mz = 0;

    if (inTemple && ui.action !== "le" && !ui.beadsOpen) {
      const k = input.keys;
      const f =
        (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      const r =
        (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
      const fx = -Math.sin(cam.yaw);
      const fz = -Math.cos(cam.yaw);
      const rx = Math.cos(cam.yaw);
      const rz = -Math.sin(cam.yaw);
      mx = fx * f + rx * r + (fx * -input.joyY + rx * input.joyX);
      mz = fz * f + rz * r + (fz * -input.joyY + rz * input.joyX);
      const l = Math.hypot(mx, mz);
      if (l > 1) {
        mx /= l;
        mz /= l;
      }
      if (l > 0.05) {
        player.walkTo = null;
        player.onArrive = null;
      } else if (player.walkTo) {
        tmp.set(player.walkTo.x - g.position.x, 0, player.walkTo.z - g.position.z);
        if (tmp.length() < 0.35) {
          player.walkTo = null;
          const cb = player.onArrive;
          player.onArrive = null;
          cb?.();
        } else {
          tmp.normalize();
          mx = tmp.x;
          mz = tmp.z;
        }
      }
    }

    if (player.walkTo) ({ dx: mx, dz: mz } = steerAround(g.position, mx, mz));
    const moving = Math.hypot(mx, mz) > 0.05;
    if (anim) anim.moving = moving;
    if (moving) {
      const speed = isInHall(g.position) ? SPEED_HALL : SPEED_YARD;
      g.position.x += mx * speed * dt;
      g.position.z += mz * speed * dt;
      clampPos(g.position);
      g.rotation.y = Math.atan2(mx, mz);
      player.lastMoveAt = performance.now();
      if (anim && (anim.pose === "sit" || anim.pose === "bow")) anim.pose = "idle";
    }
    const gy = groundHeight(g.position);
    g.position.y += (gy - g.position.y) * Math.min(1, dt * 12);

    // Camera: quỹ đạo quanh người chơi; ngoài cổng thì xoay chậm.
    // Tia từ đầu người chơi tới camera chạm mái → kéo camera vào trước điểm chạm.
    if (!inTemple) cam.yaw += dt * 0.05;
    look.set(g.position.x, g.position.y + 1.6, g.position.z);
    dir.set(
      Math.sin(cam.yaw) * Math.cos(cam.pitch),
      Math.sin(cam.pitch),
      Math.cos(cam.yaw) * Math.cos(cam.pitch),
    );
    let dist = cam.dist;
    if (inTemple && camBlockers.size) {
      ray.set(look, dir);
      ray.far = cam.dist;
      const hit = ray.intersectObjects([...camBlockers], true)[0];
      if (hit) dist = Math.max(CAM_MIN_DIST, hit.distance - CAM_HIT_MARGIN);
    }
    tmp.copy(dir).multiplyScalar(dist).add(look);
    tmp.y = Math.max(tmp.y, 1.2);
    camera.position.lerp(tmp, inTemple ? 0.15 : 0.02);
    camera.lookAt(look);
  });

  return (
    <group ref={group}>
      <ChibiAvatar id={PLAYER_ID} variant={kind} />
    </group>
  );
}
