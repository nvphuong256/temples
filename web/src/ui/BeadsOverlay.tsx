// Lần tràng hạt 108: vuốt lên / cuộn / phím ↑ hoặc Space = một hạt. Vẽ canvas 2D (port từ nguyên mẫu).
import { useCallback, useEffect, useRef } from "react";
import { BEADS_PER_ROUND } from "@cvo/shared";
import { beadStep, closeBeads, resetBeads } from "../rituals/actions";
import { useUi } from "../state/store";

const STEP_PX = 36;

export function BeadsOverlay() {
  const beads = useUi((s) => s.progress.beads);
  const canvas = useRef<HTMLCanvasElement>(null);
  const offset = useRef(0);
  const drag = useRef<{ y: number; acc: number } | null>(null);

  const draw = useCallback(() => {
    const cv = canvas.current;
    const g = cv?.getContext("2d");
    if (!cv || !g) return;
    const s = window.devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    if (cv.width !== Math.round(r.width * s)) {
      cv.width = Math.round(r.width * s);
      cv.height = Math.round(r.height * s);
    }
    const w = cv.width;
    const h = cv.height;
    const n = 14;
    const R = 28 * s;
    const cx = w / 2;
    g.clearRect(0, 0, w, h);
    g.lineWidth = 3 * s;
    g.strokeStyle = "#8f6a3a";
    g.beginPath();
    g.moveTo(cx, 0);
    g.bezierCurveTo(cx - 60 * s, h * 0.3, cx + 60 * s, h * 0.7, cx, h);
    g.stroke();
    const count = useUi.getState().progress.beads;
    for (let i = -1; i <= n; i++) {
      const t = ((((i + offset.current) % n) + n) % n) / n;
      const x = cx + Math.sin(t * Math.PI * 2) * 60 * s * 0.9;
      const y = t * h;
      const big = (count + i) % 27 === 0;
      g.beginPath();
      g.arc(x, y, (big ? R * 1.2 : R) * 0.9, 0, Math.PI * 2);
      const grad = g.createRadialGradient(x - R * 0.3, y - R * 0.3, 2, x, y, R);
      grad.addColorStop(0, big ? "#f0cb7a" : "#a86e3c");
      grad.addColorStop(1, big ? "#8f5f1c" : "#4a2b14");
      g.fillStyle = grad;
      g.fill();
    }
  }, []);

  const step = useCallback(() => {
    if (beadStep()) offset.current += 1;
  }, []);

  useEffect(() => {
    draw();
  }, [beads, draw]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        step();
      } else if (e.key === "Escape") closeBeads();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", draw);
    };
  }, [draw, step]);

  return (
    <section id="beads" aria-label="Lần tràng hạt" role="dialog" aria-modal="true">
      <h2>Tràng hạt {BEADS_PER_ROUND}</h2>
      <canvas
        ref={canvas}
        id="beadc"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, acc: 0 };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          d.acc += d.y - e.clientY;
          d.y = e.clientY;
          while (d.acc > STEP_PX) {
            d.acc -= STEP_PX;
            step();
          }
          if (d.acc < 0) d.acc = 0;
        }}
        onPointerUp={() => (drag.current = null)}
        onWheel={(e) => e.deltaY < 0 && step()}
      />
      <div id="beadn" aria-live="polite">
        {beads}
        <small>/ {BEADS_PER_ROUND} · vuốt lên để lần một hạt</small>
      </div>
      <div className="row">
        <button className="btn ghost" onClick={resetBeads}>
          Làm lại
        </button>
        <button className="btn" onClick={closeBeads}>
          Về chính điện
        </button>
      </div>
    </section>
  );
}
