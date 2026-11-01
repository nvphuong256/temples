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

// ---------- Cây thật: thẻ lá (alpha) + vỏ cây ----------

/** Texture có nền trong suốt (thẻ lá), không lặp, mipmap để xa không nhấp nháy. */
function cardTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const t = canvasTexture(size, draw);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}

const _col = new THREE.Color();
/** Màu css lệch nhẹ HSL quanh màu gốc (biến thiên tự nhiên giữa các lá). */
function vary(base: string, r: () => number, dl: number, dh = 0.015) {
  return _col
    .set(base)
    .offsetHSL((r() - 0.5) * dh * 2, (r() - 0.5) * 0.08, (r() - 0.5) * dl * 2)
    .getStyle();
}

/** Một lá: gốc tại (x, y), mọc theo góc `ang`, dài `len`, nửa rộng `wid`; `tip` 0..1 độ nhọn đuôi. */
function drawLeaf(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  wid: number,
  light: string,
  dark: string,
  tip = 0.25,
) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(len * 0.2, -wid * 1.1, len * (0.75 - tip * 0.2), -wid * 0.9, len, 0);
  g.bezierCurveTo(len * (0.75 - tip * 0.2), wid * 0.9, len * 0.2, wid * 1.1, 0, 0);
  const gr = g.createLinearGradient(0, -wid, 0, wid);
  gr.addColorStop(0, light);
  gr.addColorStop(0.55, light);
  gr.addColorStop(1, dark);
  g.fillStyle = gr;
  g.fill();
  // gân giữa sáng + mép tối mảnh: lá bóng như lá đa
  g.strokeStyle = "rgba(230,240,190,0.35)";
  g.lineWidth = Math.max(0.8, wid * 0.12);
  g.beginPath();
  g.moveTo(len * 0.04, 0);
  g.quadraticCurveTo(len * 0.5, -wid * 0.08, len * 0.92, 0);
  g.stroke();
  g.restore();
}

/**
 * Chùm lá tròn bầu dục (đa, si, cây bụi): ~110 lá xếp quanh tâm, lá ngoài chĩa ra mép → viền thẻ lởm chởm.
 * Lá phía trong vẽ trước, tối hơn (giả bóng trong tán).
 */
export function leafClusterTexture(seed = 17) {
  return cardTexture(256, (g, s) => {
    const r = rng(seed);
    g.clearRect(0, 0, s, s);
    const c = s / 2;
    const leaves: { d: number; a: number }[] = [];
    for (let i = 0; i < 110; i++)
      leaves.push({ d: Math.sqrt(r()) * 0.36 * s, a: r() * Math.PI * 2 });
    leaves.sort((p, q) => p.d - q.d);
    for (const { d, a } of leaves) {
      const len = s * (0.1 + r() * 0.05);
      const k = d / (0.36 * s); // 0 trong → 1 ngoài
      const base = r() < 0.12 ? N.banyanLeafYoung : N.banyanLeaf;
      const dl = -0.12 + 0.12 * k;
      const light = _col
        .set(vary(base, r, 0.06))
        .offsetHSL(0, 0, dl + 0.06)
        .getStyle();
      const dark = _col
        .set(vary(base, r, 0.04))
        .offsetHSL(0, 0, dl - 0.08)
        .getStyle();
      const ang = a + (r() - 0.5) * 1.1;
      drawLeaf(g, c + Math.cos(a) * d, c + Math.sin(a) * d, ang, len, len * 0.3, light, dark);
    }
  });
}

/** Cành lá tre: cuống mảnh từ giữa mép dưới lên, lá thuôn dài mọc so le, rủ nhẹ. */
export function bambooSprayTexture(seed = 23) {
  return cardTexture(256, (g, s) => {
    const r = rng(seed);
    g.clearRect(0, 0, s, s);
    const twigs: [number, number, number][] = [
      // góc lệch, độ dài (phần s), số lá
      [0, 0.95, 7],
      [-0.42, 0.62, 4],
      [0.45, 0.58, 4],
    ];
    for (const [lean, L, n] of twigs) {
      const x0 = s / 2;
      const y0 = s;
      const pt = (t: number): [number, number] => [
        x0 + Math.sin(lean) * L * s * t + (r() - 0.5) * 1.5,
        y0 - Math.cos(lean) * L * s * t,
      ];
      g.strokeStyle = "rgba(110,110,55,0.9)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x0, y0);
      for (let i = 1; i <= 8; i++) g.lineTo(...pt(i / 8));
      g.stroke();
      for (let i = 0; i < n; i++) {
        const t = 0.25 + (0.75 * (i + 0.5)) / n;
        const [x, y] = pt(t);
        const side = i % 2 ? 1 : -1;
        const len = s * (0.26 + r() * 0.1) * (1 - 0.3 * t);
        const ang = -Math.PI / 2 + lean + side * (0.55 + r() * 0.35);
        const base = r() < 0.15 ? N.bambooLeafDry : N.bambooLeafReal;
        drawLeaf(
          g,
          x,
          y,
          ang,
          len,
          len * 0.075,
          vary(base, r, 0.07),
          _col.set(base).offsetHSL(0, 0, -0.12).getStyle(),
          0.6,
        );
      }
    }
  });
}

/** Vỏ đa: xám nâu, sọc rễ dọc gợn sóng (lặp liền cả hai chiều), đốm bì khổng. Gần trắng → nhân màu đỉnh. */
export function barkTexture() {
  return canvasTexture(256, (g, s) => {
    const r = rng(31);
    g.fillStyle = "#bdb8ae";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 150; i++) {
      const x = r() * s;
      const w = 1.5 + r() * 6;
      const amp = 2 + r() * 6;
      const k = 1 + Math.floor(r() * 3);
      const ph = r() * 6.28;
      const dark = r() < 0.6;
      g.strokeStyle = dark
        ? `rgba(55,50,44,${0.1 + r() * 0.2})`
        : `rgba(250,248,240,${0.12 + r() * 0.2})`;
      g.lineWidth = w;
      wrapDraw(s, x, 0, (px) => {
        if (px < -20 || px > s + 20) return;
        g.beginPath();
        for (let y = 0; y <= s; y += 8) {
          const xx = px + Math.sin((y / s) * Math.PI * 2 * k + ph) * amp;
          if (y === 0) g.moveTo(xx, y);
          else g.lineTo(xx, y);
        }
        g.stroke();
      });
    }
    for (let i = 0; i < 70; i++) {
      const x = r() * s;
      const y = r() * s;
      g.fillStyle = `rgba(60,50,40,${0.2 + r() * 0.25})`;
      wrapDraw(s, x, y, (px, py) => {
        g.beginPath();
        g.ellipse(px, py, 1.5 + r() * 3, 0.8 + r(), 0, 0, Math.PI * 2);
        g.fill();
      });
    }
  });
}

/** Thân tre: một ô = một lóng (v lặp theo mét); đốt sẫm ở đầu ô, vòng phấn trắng ngay dưới đốt. */
export function culmTexture() {
  return canvasTexture(128, (g, s) => {
    const r = rng(37);
    g.fillStyle = "#e9eedb";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(70,80,30,0.08)" : "rgba(255,255,240,0.1)";
      g.fillRect(r() * s, 0, 1 + r() * 3, s);
    }
    // v = 0 ở mép dưới ảnh (flipY) → đốt vẽ ở mép trên = đầu lóng phía trên.
    const wax = g.createLinearGradient(0, 4, 0, 26);
    wax.addColorStop(0, "rgba(255,255,245,0.85)");
    wax.addColorStop(1, "rgba(255,255,245,0)");
    g.fillStyle = wax;
    g.fillRect(0, 4, s, 22);
    g.fillStyle = "rgba(55,62,25,0.85)";
    g.fillRect(0, 0, s, 4);
    g.fillStyle = "rgba(90,95,40,0.4)";
    g.fillRect(0, s - 3, s, 3);
  });
}
