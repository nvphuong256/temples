// Thông báo ngắn (2,6 s) và bong bóng lời Tiểu An (6 s).
import { useEffect, useState } from "react";
import { useUi } from "../state/store";

function useFlash(id: number | undefined, ms: number) {
  const [shownId, setShownId] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (id === undefined) return;
    setShownId(id);
    const t = setTimeout(() => setShownId((cur) => (cur === id ? undefined : cur)), ms);
    return () => clearTimeout(t);
  }, [id, ms]);
  return id !== undefined && shownId === id;
}

export function Toast() {
  const toast = useUi((s) => s.toast);
  const show = useFlash(toast?.id, 2600);
  return (
    <div id="toast" role="status" className={show ? "show" : ""}>
      {toast?.text}
    </div>
  );
}

export function CompanionBubble() {
  const line = useUi((s) => s.companion);
  const show = useFlash(line?.id, 6000);
  return (
    <div id="companion" role="status" aria-live="polite" className={show ? "show" : ""}>
      <b>Tiểu An</b>
      <span>{line?.text}</span>
    </div>
  );
}
