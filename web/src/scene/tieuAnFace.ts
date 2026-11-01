// Khuôn mặt chibi (kiểu Pixar) vẽ lên texture cầu equirect 1024×512, dùng chung cho mọi avatar chibi.
// Mặt trước (+z) của SphereGeometry nằm ở u = 0,25 → tâm mặt tại x = 0,25·w. Hai bản: mắt mở / nhắm.
// getFaceTextures() tạo MỘT lần cho cả ứng dụng; mỗi avatar chỉ đổi `map` của material đầu riêng.
import * as THREE from "three";
import { CHIBI_CHAR as K } from "@cvo/shared";

const W = 1024;
const H = 512;
const CX = W * 0.25;
const EYE_Y = H * 0.54;
const EYE_DX = 70;

function blush(g: CanvasRenderingContext2D, x: number, y: number) {
  const r = g.createRadialGradient(x, y, 2, x, y, 48);
  r.addColorStop(0, "rgba(242,140,128,.8)");
  r.addColorStop(0.55, "rgba(242,150,135,.35)");
  r.addColorStop(1, "rgba(242,156,140,0)");
  g.fillStyle = r;
  g.fillRect(x - 52, y - 52, 104, 104);
}

function openEye(g: CanvasRenderingContext2D, x: number, s: number) {
  const y = EYE_Y;
  // Lòng trắng, hơi bóng phía dưới
  g.fillStyle = K.eyeWhite;
  g.beginPath();
  g.ellipse(x, y, 36, 43, 0, 0, Math.PI * 2);
  g.fill();
  // Tròng nâu to, sáng dần xuống dưới (ánh phản chiếu kiểu Pixar)
  const iris = g.createRadialGradient(x, y + 16, 4, x, y + 2, 36);
  iris.addColorStop(0, K.irisLight);
  iris.addColorStop(0.55, K.iris);
  iris.addColorStop(1, K.irisDark);
  g.fillStyle = iris;
  g.beginPath();
  g.ellipse(x, y + 3, 32, 38, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = K.pupil;
  g.beginPath();
  g.ellipse(x, y + 3, 15, 18, 0, 0, Math.PI * 2);
  g.fill();
  // Ánh sáng long lanh: một đốm lớn, một đốm nhỏ, một vệt cong dưới
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(x + s * 11 - 2, y - 13, 11, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(x - s * 11, y + 17, 5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y + 3, 26, Math.PI * 0.2, Math.PI * 0.55);
  g.stroke();
  // Mí trên đậm + mi cong ở đuôi mắt
  g.strokeStyle = K.lash;
  g.lineCap = "round";
  g.lineWidth = 7;
  g.beginPath();
  g.ellipse(x, y, 37, 44, 0, Math.PI * 1.06, Math.PI * 1.94);
  g.stroke();
  g.lineWidth = 5;
  g.beginPath();
  const ox = x + s * 35;
  g.moveTo(ox, y - 16);
  g.quadraticCurveTo(ox + s * 7, y - 20, ox + s * 9, y - 27);
  g.stroke();
}

function closedEye(g: CanvasRenderingContext2D, x: number) {
  // Mắt nhắm hiền: cung cong xuống (kiểu cười / thiền)
  g.strokeStyle = K.lash;
  g.lineCap = "round";
  g.lineWidth = 7;
  g.beginPath();
  g.arc(x, EYE_Y - 6, 31, Math.PI * 0.16, Math.PI * 0.84);
  g.stroke();
}

function drawFace(g: CanvasRenderingContext2D, eyesOpen: boolean) {
  g.fillStyle = K.skin;
  g.fillRect(0, 0, W, H);
  // Bóng nhẹ trên trán để đầu tròn hơn
  const sh = g.createRadialGradient(CX, H * 0.3, 10, CX, H * 0.3, 220);
  sh.addColorStop(0, "rgba(255,240,230,.35)");
  sh.addColorStop(1, "rgba(255,240,230,0)");
  g.fillStyle = sh;
  g.fillRect(CX - 230, 0, 460, H * 0.7);

  for (const s of [-1, 1]) blush(g, CX + s * 112, EYE_Y + 58);

  // Lông mày đậm, cong, đầu to đuôi nhỏ
  g.fillStyle = K.brow;
  for (const s of [-1, 1]) {
    const x0 = CX + s * 26;
    const x1 = CX + s * 110;
    const yb = EYE_Y - 66;
    g.beginPath();
    g.moveTo(x0, yb + 6);
    g.quadraticCurveTo(CX + s * 62, yb - 30, x1, yb + 2);
    g.quadraticCurveTo(CX + s * 64, yb - 14, x0, yb + 16);
    g.closePath();
    g.fill();
  }

  for (const s of [-1, 1]) {
    const x = CX + s * EYE_DX;
    if (eyesOpen) openEye(g, x, s);
    else closedEye(g, x);
  }

  // Mũi: nét bóng nhỏ
  g.strokeStyle = "rgba(196,128,104,.55)";
  g.lineCap = "round";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(CX, EYE_Y + 44, 8, Math.PI * 0.2, Math.PI * 0.8);
  g.stroke();

  // Miệng cười hiền, hé nhẹ
  g.fillStyle = K.mouth;
  g.beginPath();
  g.moveTo(CX - 30, EYE_Y + 66);
  g.quadraticCurveTo(CX, EYE_Y + 74, CX + 30, EYE_Y + 66);
  g.quadraticCurveTo(CX, EYE_Y + 100, CX - 30, EYE_Y + 66);
  g.fill();
  g.strokeStyle = K.lip;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(CX - 38, EYE_Y + 60);
  g.quadraticCurveTo(CX, EYE_Y + 76, CX + 38, EYE_Y + 60);
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

let shared: { open: THREE.Texture; closed: THREE.Texture } | null = null;

/** Hai texture mặt dùng chung cho mọi avatar chibi (tạo lần đầu gọi, không dispose). */
export function getFaceTextures() {
  return (shared ??= { open: faceTexture(true), closed: faceTexture(false) });
}

/** @deprecated giữ tương thích — dùng getFaceTextures(). */
export const makeFaceTextures = getFaceTextures;
