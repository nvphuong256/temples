// Gốc ứng dụng: canvas 3D toàn màn hình + lớp HUD/overlay theo màn hình (cổng, trong chùa, rời chùa).
import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useCompanion } from "./companion/useCompanion";
import { isLowEnd } from "./lib/device";
import { useVnClock } from "./lib/useVnClock";
import { RITUAL_KEYS } from "./rituals/actions";
import { Temple } from "./scene/Temple";
import { input } from "./state/runtime";
import { useUi } from "./state/store";
import { ActionBar } from "./ui/ActionBar";
import { BeadsOverlay } from "./ui/BeadsOverlay";
import { GateScreen } from "./ui/GateScreen";
import { Hud } from "./ui/Hud";
import { Joystick } from "./ui/Joystick";
import { LeaveScreen } from "./ui/LeaveScreen";
import { CompanionBubble, Toast } from "./ui/Toast";

const lowEnd = isLowEnd();

function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useUi.getState();
      if (s.phase !== "temple" || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      input.keys.add(e.key.toLowerCase());
      if (!s.beadsOpen && !e.repeat) RITUAL_KEYS[e.key]?.();
    };
    const up = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    const clear = () => input.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
}

export function App() {
  const phase = useUi((s) => s.phase);
  const beadsOpen = useUi((s) => s.beadsOpen);
  useVnClock();
  useCompanion();
  useKeyboard();

  return (
    <>
      <Canvas
        id="c"
        aria-label="Không gian chùa Việt 3D"
        shadows={!lowEnd}
        dpr={lowEnd ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !lowEnd, powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 300, position: [0, 9, 62] }}
      >
        <Temple shadows={!lowEnd} />
      </Canvas>

      {phase === "gate" && <GateScreen />}
      {phase === "temple" && (
        <>
          <Hud />
          <div id="hint">
            WASD / mũi tên để đi · nhấp sàn để đến · kéo chuột xoay · cuộn để zoom · phím 1 hương ·
            2 lễ · 3 mõ · 4 tràng hạt · 5 chắp tay · 6 chuông
          </div>
          <ActionBar />
          <Joystick />
          {beadsOpen && <BeadsOverlay />}
        </>
      )}
      {phase === "leaving" && <LeaveScreen />}
      <CompanionBubble />
      <Toast />
    </>
  );
}
