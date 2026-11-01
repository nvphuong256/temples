// Texture canvas cho nền (không tải file): cỏ hoạt hình và đá lát bo tròn. ≤ 512 px, lặp liền mạch.
import * as THREE from "three";
import { CHIBI_NATURE as N } from "@cvo/shared";
import { rng } from "./scatter";

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const g = cv.getContext("2d");
  if (g) draw(g, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Vẽ lặp ở 9 vị trí lệch ±size để hình chạm mép vẫn liền mạch khi lặp. */
function wrapDraw(s: number, x: number, y: number, fn: (x: number, y: number) => void) {
  for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) fn(x + dx, y + dy);
}

/** Cỏ: nền xanh tươi + mảng sáng tối mềm + nét lá nhỏ. Một ô = 6 m. */
export function grassTexture() {
  return canvasTexture(512, (g, s) => {
    const r = rng(42);
    g.fillStyle = N.grass;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) {
      const x = r() * s;
      const y = r() * s;
      const rad = 30 + r() * 70;
      const col = r() < 0.5 ? N.grassTip : N.grassDark;
      wrapDraw(s, x, y, (px, py) => {
        const gr = g.createRadialGradient(px, py, 0, px, py, rad);
        gr.addColorStop(0, col + "55");
        gr.addColorStop(1, col + "00");
        g.fillStyle = gr;
        g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      });
    }
    g.lineCap = "round";
    for (let i = 0; i < 900; i++) {
      const x = r() * s;
      const y = r() * s;
      const len = 5 + r() * 7;
      const lean = (r() - 0.5) * 5;
      g.strokeStyle = r() < 0.55 ? N.grassTip + "aa" : N.grassDark + "aa";
      g.lineWidth = 1.6 + r() * 1.2;
      wrapDraw(s, x, y, (px, py) => {
        if (px < -12 || py < -12 || px > s + 12 || py > s + 12) return;
        g.beginPath();
        g.moveTo(px, py);
        g.quadraticCurveTo(px + lean * 0.3, py - len * 0.6, px + lean, py - len);
        g.stroke();
      });
    }
  });
}

/** Đá lát: viên chữ nhật bo tròn màu be ấm, mạch vữa sẫm, viền sáng trên–tối dưới (nổi kiểu đồ chơi). Ô = 4 m. */
export function pavingTexture() {
  return canvasTexture(512, (g, s) => {
    const r = rng(7);
    g.fillStyle = N.paveGrout;
    g.fillRect(0, 0, s, s);
    const rowH = 64; // 0,5 m
    for (let y = 0; y < s; y += rowH) {
      let x = r() * 40;
      const start = x;
      while (x < start + s) {
        const w = Math.min(70 + r() * 70, start + s - x);
        if (w < 24) break;
        const base = r() < 0.5 ? N.paveStone : N.paveStoneAlt;
        const l = (r() - 0.5) * 12;
        wrapDraw(s, x, y, (px, py) => {
          if (px > s || px + w < 0 || py > s || py + rowH < 0) return;
          const pad = 4;
          const rx = px + pad;
          const ry = py + pad;
          const rw = w - pad * 2;
          const rh = rowH - pad * 2;
          // bóng dưới
          g.fillStyle = "rgba(60,40,20,0.35)";
          g.beginPath();
          g.roundRect(rx + 1, ry + 3, rw, rh, 14);
          g.fill();
          g.fillStyle = base;
          g.filter = `brightness(${100 + l}%)`;
          g.beginPath();
          g.roundRect(rx, ry, rw, rh, 14);
          g.fill();
          g.filter = "none";
          // ánh sáng đỉnh viên đá
          const gr = g.createLinearGradient(0, ry, 0, ry + rh);
          gr.addColorStop(0, "rgba(255,248,230,0.35)");
          gr.addColorStop(0.5, "rgba(255,248,230,0)");
          gr.addColorStop(1, "rgba(80,50,20,0.12)");
          g.fillStyle = gr;
          g.beginPath();
          g.roundRect(rx, ry, rw, rh, 14);
          g.fill();
        });
        x += w;
      }
    }
  });
}
