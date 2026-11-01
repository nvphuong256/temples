// Texture vẽ bằng canvas (không tải file): gạch sân, ngói mũi hài, khói, biển chữ, chạm vàng, song cửa,
// mặt tượng Phật. Tất cả ≤ 512 px.
import * as THREE from "three";
import { CHIBI_ARCH, PALETTE } from "@cvo/shared";

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

/** Ngói mũi hài kiểu hoạt hình: hàng ngói đầu tròn hơi nhọn, viền đậm, vệt sáng; lặp liền mạch.
 * Một ô texture = 4 viên × 4 hàng; mái tự tính UV theo mét (arch/roofGeometry.ts). */
export const tileTexture = () =>
  canvasTexture(256, 256, (g, w, h) => {
    const cols = 4;
    const rows = 4;
    const tw = w / cols;
    const th = h / rows;
    g.fillStyle = CHIBI_ARCH.roofEdge;
    g.fillRect(0, 0, w, h);
    // Vẽ từ hàng dưới (gần diềm, cuối canvas) lên trên: viên phía trên đè lên đầu viên phía dưới.
    for (let r = rows; r >= -1; r--) {
      const off = r % 2 ? tw / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * tw + off;
        const y = r * th;
        const tip = th * 0.42;
        const shoe = (dx: number, dy: number) => {
          g.beginPath();
          g.moveTo(x + 2 + dx, y - tip + dy);
          g.lineTo(x + tw - 2 + dx, y - tip + dy);
          g.lineTo(x + tw - 2 + dx, y + th * 0.55 + dy);
          g.bezierCurveTo(
            x + tw - 2 + dx,
            y + th * 0.9 + dy,
            x + tw * 0.62 + dx,
            y + th + dy,
            x + tw / 2 + dx,
            y + th + 4 + dy,
          );
          g.bezierCurveTo(
            x + tw * 0.38 + dx,
            y + th + dy,
            x + 2 + dx,
            y + th * 0.9 + dy,
            x + 2 + dx,
            y + th * 0.55 + dy,
          );
          g.closePath();
        };
        // Bóng đổ dưới mũi ngói.
        g.fillStyle = "rgba(60,15,8,.45)";
        shoe(0, 5);
        g.fill();
        const grad = g.createLinearGradient(0, y - tip, 0, y + th);
        grad.addColorStop(0, CHIBI_ARCH.roofTileDark);
        grad.addColorStop(0.45, CHIBI_ARCH.roofTile);
        grad.addColorStop(1, CHIBI_ARCH.roofTileLight);
        g.fillStyle = grad;
        shoe(0, 0);
        g.fill();
        g.lineWidth = 3;
        g.strokeStyle = CHIBI_ARCH.roofEdge;
        g.stroke();
        // Vệt sáng mềm bên trái viên ngói.
        g.strokeStyle = "rgba(255,214,170,.55)";
        g.lineWidth = 4;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(x + tw * 0.25, y + th * 0.05);
        g.quadraticCurveTo(x + tw * 0.22, y + th * 0.6, x + tw * 0.38, y + th * 0.85);
        g.stroke();
      }
    }
  });

/** Gỗ chạm thếp vàng cách điệu: mây cuộn tròn trên nền vàng (cửa võng, mặt ban thờ). */
export const goldCarveTexture = () =>
  canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = CHIBI_ARCH.gold;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = CHIBI_ARCH.goldDeep;
    g.lineWidth = 6;
    g.lineCap = "round";
    const swirl = (cx: number, cy: number, r: number, dir: number) => {
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 3.2 * dir;
        const rr = r * (1 - i / 48);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i) g.lineTo(px, py);
        else g.moveTo(px, py);
      }
      g.stroke();
    };
    for (let i = 0; i < 4; i++) {
      swirl(32 + i * 64, 42, 22, i % 2 ? 1 : -1);
      swirl(i * 64, 96, 20, i % 2 ? -1 : 1);
      swirl(64 + i * 64, 96, 20, i % 2 ? -1 : 1);
    }
    g.strokeStyle = "rgba(255,240,190,.7)";
    g.lineWidth = 3;
    g.strokeRect(4, 4, w - 8, h - 8);
  });

/** Ô cửa sổ tròn: song gỗ chữ thập trên nền tối. */
export const latticeTexture = () =>
  canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = CHIBI_ARCH.latticeDark;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = CHIBI_ARCH.woodWarm;
    g.lineWidth = 7;
    g.lineCap = "round";
    for (let i = 1; i < 5; i++) {
      g.beginPath();
      g.moveTo((i * w) / 5, 0);
      g.lineTo((i * w) / 5, h);
      g.moveTo(0, (i * h) / 5);
      g.lineTo(w, (i * h) / 5);
      g.stroke();
    }
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.18, 0, Math.PI * 2);
    g.stroke();
  });

/** Mặt tượng Phật (bản đồ cầu, mặt ở u = 0,25): mắt khép, mày cong dài, ấn white, miệng hiền. */
export const buddhaFaceTexture = () =>
  canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = CHIBI_ARCH.buddhaGold;
    g.fillRect(0, 0, w, h);
    const cx = w * 0.25;
    const cy = h * 0.5;
    g.strokeStyle = CHIBI_ARCH.buddhaLine;
    g.lineCap = "round";
    // Mắt khép: cung cong xuống, mí dày nhẹ.
    g.lineWidth = 3.2;
    for (const s of [-1, 1]) {
      const ex = cx + s * 22;
      g.beginPath();
      g.moveTo(ex - 10, cy + 2);
      g.quadraticCurveTo(ex, cy + 9, ex + 10, cy + 2);
      g.stroke();
      // Mày cong dài, thanh.
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(ex - 13, cy - 7);
      g.quadraticCurveTo(ex, cy - 17, ex + 13, cy - 8);
      g.stroke();
      g.lineWidth = 3.2;
    }
    // Ấn white (urna).
    g.fillStyle = CHIBI_ARCH.goldDeep;
    g.beginPath();
    g.arc(cx, cy - 14, 2.6, 0, Math.PI * 2);
    g.fill();
    // Sống mũi rất nhẹ + miệng mỉm hiền.
    g.lineWidth = 2;
    g.strokeStyle = "rgba(154,100,24,.6)";
    g.beginPath();
    g.moveTo(cx - 4, cy + 18);
    g.quadraticCurveTo(cx, cy + 21, cx + 4, cy + 18);
    g.stroke();
    g.strokeStyle = CHIBI_ARCH.buddhaLine;
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(cx - 8, cy + 29);
    g.quadraticCurveTo(cx, cy + 34, cx + 8, cy + 29);
    g.stroke();
  });

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

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Biển chữ (hoành phi) sơn son thếp vàng, khung bo tròn kiểu hoạt hình: chữ Hán lớn + phiên âm nhỏ. */
export function signTexture(han: string, vi: string) {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = CHIBI_ARCH.goldDeep;
    g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#B8302F");
    grad.addColorStop(1, CHIBI_ARCH.signRed);
    g.fillStyle = grad;
    roundRect(g, 10, 10, w - 20, h - 20, 26);
    g.fill();
    g.strokeStyle = CHIBI_ARCH.signText;
    g.lineWidth = 4;
    roundRect(g, 18, 18, w - 36, h - 36, 20);
    g.stroke();
    g.textAlign = "center";
    g.fillStyle = "rgba(70,10,10,.45)";
    g.font = 'bold 60px "Noto Serif Display", serif';
    g.fillText(han, w / 2 + 2, 78);
    g.fillStyle = CHIBI_ARCH.signText;
    g.fillText(han, w / 2, 75);
    g.font = '600 17px "Be Vietnam Pro", sans-serif';
    g.fillStyle = PALETTE.mist;
    g.fillText(vi, w / 2, 102);
  });
}

/** Câu đối dọc khung bo tròn: chữ quốc ngữ từng từ một dòng. */
export function coupletTexture(text: string) {
  const words = text.split(/\s+/);
  return canvasTexture(96, 512, (g, w, h) => {
    g.fillStyle = CHIBI_ARCH.goldDeep;
    g.fillRect(0, 0, w, h);
    g.fillStyle = CHIBI_ARCH.signRed;
    roundRect(g, 6, 6, w - 12, h - 12, 18);
    g.fill();
    g.strokeStyle = CHIBI_ARCH.signText;
    g.lineWidth = 3;
    roundRect(g, 12, 12, w - 24, h - 24, 13);
    g.stroke();
    g.fillStyle = CHIBI_ARCH.signText;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const step = (h - 40) / Math.max(words.length, 1);
    const size = Math.min(26, step * 0.6);
    g.font = `600 ${size}px "Noto Serif Display", serif`;
    words.forEach((word, i) => g.fillText(word, w / 2, 20 + step * (i + 0.5), w - 22));
  });
}
