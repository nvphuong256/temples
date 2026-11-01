// Cần điều khiển ảo (chỉ hiện trên màn hình cảm ứng qua CSS @media (pointer: coarse)).
import { useRef } from "react";
import { input } from "../state/runtime";

const R = 44;

export function Joystick() {
  const knob = useRef<HTMLElement>(null);
  const pid = useRef<number | null>(null);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > R) {
      dx *= R / l;
      dy *= R / l;
    }
    input.joyX = dx / R;
    input.joyY = dy / R;
    if (knob.current) knob.current.style.transform = `translate(${dx}px,${dy}px)`;
  };
  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    input.joyX = input.joyY = 0;
    if (knob.current) knob.current.style.transform = "";
  };

  return (
    <div
      id="joy"
      aria-label="Cần điều khiển"
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => pid.current === e.pointerId && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <i ref={knob} />
    </div>
  );
}
