// Thanh nghi lễ: 6 nút (phím 1–6). Mobile: 3 nút lớn Hương/Lễ/Mõ + "Thêm" mở 3 nút còn lại.
import { useState, type ReactNode } from "react";
import { doBell, doBow, doGreet, doIncense, doMo, openBeads } from "../rituals/actions";
import { useUi } from "../state/store";

interface Act {
  id: string;
  label: string;
  key: string;
  run: () => void;
  icon: ReactNode;
  primary?: boolean;
}

const ACTS: Act[] = [
  {
    id: "huong",
    label: "Thắp hương",
    key: "1",
    run: doIncense,
    primary: true,
    icon: (
      <>
        <path d="M12 21v-9M9 21v-7M15 21v-7" />
        <path d="M12 12c0-2 1-3 1-5s-2-2-1-4" />
        <path d="M5 21h14" />
      </>
    ),
  },
  {
    id: "le",
    label: "Lễ Phật",
    key: "2",
    run: doBow,
    primary: true,
    icon: (
      <>
        <circle cx="8" cy="9" r="2.5" />
        <path d="M4 20c0-3 1.5-5 4-5s4 2 4 5" />
        <path d="M13 15l7-2M20 13v6" />
      </>
    ),
  },
  {
    id: "mo",
    label: "Gõ mõ",
    key: "3",
    run: doMo,
    primary: true,
    icon: (
      <>
        <path d="M5 13a7 5 0 1 0 14 0 7 5 0 1 0-14 0z" />
        <path d="M12 13v-2M16 6l3-2" />
      </>
    ),
  },
  {
    id: "hat",
    label: "Tràng hạt",
    key: "4",
    run: openBeads,
    icon: (
      <>
        <circle cx="12" cy="12" r="8" strokeDasharray="2.5 3" />
        <circle cx="12" cy="20" r="1.5" />
      </>
    ),
  },
  {
    id: "chao",
    label: "Chắp tay",
    key: "5",
    run: doGreet,
    icon: (
      <>
        <path d="M12 3v18" />
        <path d="M8 8c0 6 4 7 4 7s4-1 4-7" />
      </>
    ),
  },
  {
    id: "chuong",
    label: "Thỉnh chuông",
    key: "6",
    run: doBell,
    icon: (
      <>
        <path d="M6 17V11a6 6 0 0 1 12 0v6" />
        <path d="M4 17h16M10 20h4" />
      </>
    ),
  },
];

export function ActionBar() {
  const action = useUi((s) => s.action);
  const [more, setMore] = useState(false);
  return (
    <div className="hud" id="bottom">
      <div id="actions" role="toolbar" aria-label="Nghi lễ" className={more ? "more" : ""}>
        {ACTS.map((a) => (
          <button
            key={a.id}
            className={`act${a.primary ? " primary" : ""}${action === "le" && a.id === "le" ? " on" : ""}`}
            onClick={a.run}
            aria-keyshortcuts={a.key}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {a.icon}
            </svg>
            {a.label}
            <span className="k">{a.key}</span>
          </button>
        ))}
        <button className="act toggle" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="12" r="1.2" />
            <circle cx="12" cy="12" r="1.2" />
            <circle cx="18" cy="12" r="1.2" />
          </svg>
          {more ? "Thu gọn" : "Thêm"}
        </button>
      </div>
    </div>
  );
}
