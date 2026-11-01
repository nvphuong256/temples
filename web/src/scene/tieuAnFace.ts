// Khuôn mặt hoạt hình Tiểu An vẽ lên texture cầu (equirect 1024×512). Mặt trước (+z) của SphereGeometry
// nằm ở u = 0,25 → tâm mặt tại x = 0,25·w. Hai bản: mắt mở / mắt nhắm (chớp mắt).
import * as THREE from "three";
import { SCENE_COLORS as C } from "@cvo/shared";

const W = 1024;
const H = 512;
const CX = W * 0.25;
const EYE_Y = H * 0.53;
const EYE_DX = 62;

function drawFace(g: CanvasRenderingContext2D, eyesOpen: boolean) {
  g.fillStyle = C.tieuAnSkin;
  g.fillRect(0, 0, W, H);

  // Má hồng
  for (const s of [-1, 1]) {
    const x = CX + s * 98;
    const y = EYE_Y + 62;
    const r = g.createRadialGradient(x, y, 2, x, y, 46);
    r.addColorStop(0, "rgba(242,156,140,.75)");
    r.addColorStop(1, "rgba(242,156,140,0)");
    g.fillStyle = r;
    g.fillRect(x - 50, y - 50, 100, 100);
  }

  // Lông mày cong, đậm ở đầu
  g.strokeStyle = C.tieuAnBrow;
  g.lineCap = "round";
  for (const s of [-1, 1]) {
    g.lineWidth = 13;
    g.beginPath();
    g.moveTo(CX + s * 28, EYE_Y - 52);
    g.quadraticCurveTo(CX + s * 62, EYE_Y - 78, CX + s * 98, EYE_Y - 58);
    g.stroke();
  }

  for (const s of [-1, 1]) {
    const x = CX + s * EYE_DX;
    if (eyesOpen) {
      // Lòng trắng
      g.fillStyle = "#fffaf4";
      g.beginPath();
      g.ellipse(x, EYE_Y, 30, 34, 0, 0, Math.PI * 2);
      g.fill();
      // Tròng nâu
      const iris = g.createRadialGradient(x - 4, EYE_Y + 4, 3, x, EYE_Y + 2, 27);
      iris.addColorStop(0, "#c88a4a");
      iris.addColorStop(0.6, C.tieuAnIris);
      iris.addColorStop(1, "#3a200c");
      g.fillStyle = iris;
      g.beginPath();
      g.ellipse(x, EYE_Y + 3, 25, 29, 0, 0, Math.PI * 2);
      g.fill();
      // Con ngươi
      g.fillStyle = "#1a0d05";
      g.beginPath();
      g.ellipse(x, EYE_Y + 4, 12, 14, 0, 0, Math.PI * 2);
      g.fill();
      // Ánh sáng trong mắt
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(x + 9, EYE_Y - 9, 8, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(x - 9, EYE_Y + 13, 3.5, 0, Math.PI * 2);
      g.fill();
      // Mí trên + mi
      g.strokeStyle = "#2a160a";
      g.lineWidth = 6;
      g.beginPath();
      g.ellipse(x, EYE_Y, 31, 35, 0, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
    } else {
      g.strokeStyle = "#2a160a";
      g.lineWidth = 6;
      g.beginPath();
      g.arc(x, EYE_Y - 6, 28, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
  }

  // Mũi: chỉ một nét bóng nhỏ
  g.strokeStyle = "rgba(190,120,95,.55)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(CX, EYE_Y + 50, 9, Math.PI * 0.2, Math.PI * 0.8);
  g.stroke();

  // Miệng cười hiền
  g.strokeStyle = "#9a4a38";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(CX, EYE_Y + 62, 26, Math.PI * 0.22, Math.PI * 0.78);
  g.stroke();
}

function faceTexture(eyesOpen: boolean) {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");
  if (g) drawFace(g, eyesOpen);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeFaceTextures() {
  return { open: faceTexture(true), closed: faceTexture(false) };
}
