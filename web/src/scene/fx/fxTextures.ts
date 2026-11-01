// Texture vẽ canvas riêng của phiên 5 (≤ 256 px): vòng sáng, gợn, sóng âm, đóa sen.
import * as THREE from "three";
import type { RingTex } from "./effects";

function canvasTex(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (g) draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vòng tròn mềm: `inner` → `outer` theo tỉ lệ bán kính, đỉnh sáng ở `peak`. */
function ring(stops: [number, number][]) {
  return canvasTex(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for (const [at, a] of stops) r.addColorStop(at, `rgba(255,255,255,${a})`);
    g.fillStyle = r;
    g.fillRect(0, 0, s, s);
  });
}

const cache = new Map<string, THREE.Texture>();
export function ringTexture(kind: RingTex) {
  let t = cache.get(kind);
  if (t) return t;
  t =
    kind === "halo"
      ? ring([
          [0, 0],
          [0.55, 0.05],
          [0.8, 0.9],
          [0.9, 0.35],
          [1, 0],
        ])
      : kind === "ripple"
        ? ring([
            [0, 0],
            [0.78, 0],
            [0.88, 0.95],
            [0.94, 0.3],
            [1, 0],
          ])
        : kind === "wave"
          ? ring([
              [0, 0],
              [0.82, 0],
              [0.9, 0.7],
              [0.93, 1],
              [0.97, 0.25],
              [1, 0],
            ])
          : ring([
              [0, 0.5],
              [0.45, 0.4],
              [0.75, 0.2],
              [1, 0],
            ]);
  cache.set(kind, t);
  return t;
}

/** Đóa sen 8 cánh, viền sáng (vẽ một lần). */
export function lotusTexture() {
  let t = cache.get("lotus");
  if (t) return t;
  t = canvasTex(256, (g, s) => {
    const c = s / 2;
    const glow = g.createRadialGradient(c, c * 1.1, 4, c, c * 1.1, c);
    glow.addColorStop(0, "rgba(255,240,200,0.55)");
    glow.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, s, s);
    const petal = (ang: number, len: number, wid: number, fill: string) => {
      g.save();
      g.translate(c, c * 1.25);
      g.rotate(ang);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(wid, -len * 0.35, wid * 0.6, -len * 0.85, 0, -len);
      g.bezierCurveTo(-wid * 0.6, -len * 0.85, -wid, -len * 0.35, 0, 0);
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = "rgba(255,250,235,0.9)";
      g.lineWidth = 3;
      g.stroke();
      g.restore();
    };
    for (const a of [-1.25, 1.25]) petal(a, s * 0.32, s * 0.12, "rgba(255,190,205,0.85)");
    for (const a of [-0.75, 0.75]) petal(a, s * 0.4, s * 0.13, "rgba(255,200,212,0.92)");
    for (const a of [-0.32, 0.32]) petal(a, s * 0.46, s * 0.13, "rgba(255,214,222,0.95)");
    petal(0, s * 0.5, s * 0.14, "rgba(255,228,233,1)");
    const core = g.createRadialGradient(c, c * 1.18, 2, c, c * 1.18, s * 0.08);
    core.addColorStop(0, "rgba(255,236,150,1)");
    core.addColorStop(1, "rgba(255,210,94,0)");
    g.fillStyle = core;
    g.fillRect(0, 0, s, s);
  });
  cache.set("lotus", t);
  return t;
}
