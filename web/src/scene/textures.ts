// Texture vẽ bằng canvas (không tải file): gạch sân, ngói mũi hài, khói, biển chữ. Tất cả ≤ 512 px.
import * as THREE from "three";
import { PALETTE } from "@cvo/shared";

function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat: [number, number] = [1, 1],
) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d");
  if (g) draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const brickTexture = () =>
  canvasTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = PALETTE.brick;
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32)
        for (let x = 0; x < w; x += 64) {
          const off = (y / 32) % 2 ? 32 : 0;
          g.fillStyle = `hsl(${16 + Math.random() * 8},55%,${38 + Math.random() * 10}%)`;
          g.fillRect(x + off + 2, y + 2, 60, 28);
          if (off) g.fillRect(x - 32 + 2, y + 2, 28, 28);
        }
    },
    [18, 18],
  );

export const tileTexture = () =>
  canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = "#7a3324";
      g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16)
        for (let x = 0; x < w; x += 16) {
          g.fillStyle = (y / 16) % 2 ? PALETTE.tile : "#6e2d20";
          g.fillRect(x, y, 16, 16);
          g.fillStyle = "rgba(0,0,0,.25)";
          g.beginPath();
          g.arc(x + 8, y + 16, 7, Math.PI, 0);
          g.fill();
        }
    },
    [6, 3],
  );

export function smokeTexture() {
  const t = canvasTexture(64, 64, (g, w, h) => {
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    r.addColorStop(0, "rgba(255,255,255,.55)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Biển chữ sơn son thếp vàng: chữ Hán lớn + phiên âm nhỏ. */
export function signTexture(han: string, vi: string) {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = "#8f1d22";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = PALETTE.gold;
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "#f0cb7a";
    g.textAlign = "center";
    g.font = 'bold 62px "Noto Serif Display", serif';
    g.fillText(han, w / 2, 78);
    g.font = '18px "Be Vietnam Pro", sans-serif';
    g.fillStyle = PALETTE.mist;
    g.fillText(vi, w / 2, 108);
  });
}

/** Câu đối dọc: chữ quốc ngữ từng từ một dòng. */
export function coupletTexture(text: string) {
  const words = text.split(/\s+/);
  return canvasTexture(96, 512, (g, w, h) => {
    g.fillStyle = PALETTE.son;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = PALETTE.gold;
    g.lineWidth = 4;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = "#f0cb7a";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const step = (h - 40) / Math.max(words.length, 1);
    const size = Math.min(26, step * 0.6);
    g.font = `600 ${size}px "Noto Serif Display", serif`;
    words.forEach((word, i) => g.fillText(word, w / 2, 20 + step * (i + 0.5), w - 14));
  });
}
