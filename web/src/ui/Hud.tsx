// HUD trên cùng: tên, số người, công đức, hạt hôm nay, giờ VN, thời tiết, nút rời chùa.
import { BEADS_PER_ROUND, DEFAULT_ROOMS } from "@cvo/shared";
import { cancelAction, closeBeads } from "../rituals/actions";
import { sayLine } from "../companion/useCompanion";
import { useWeatherUi } from "../lib/weatherStore";
import { useUi } from "../state/store";

export function Hud() {
  const { name, progress, clock, set } = useUi();
  const weather = useWeatherUi((s) => s.label);
  const leave = () => {
    cancelAction();
    closeBeads();
    sayLine("bless");
    set({ phase: "leaving" });
  };
  return (
    <div className="hud" id="top">
      <span className="chip name">{name}</span>
      <span className="chip" title="Số người đang ở cùng phòng">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        </svg>
        <b>1</b> ở {DEFAULT_ROOMS[0]?.name}
      </span>
      <span className="chip">
        Công đức <b>{progress.merit}</b>
      </span>
      <span className="chip">
        Hạt hôm nay{" "}
        <b>
          {progress.beads}/{BEADS_PER_ROUND}
        </b>
      </span>
      <span className="chip">{clock}</span>
      <span className="chip weather" title="Thời tiết tại chùa (theo giờ Việt Nam)">
        {weather}
      </span>
      <button className="chip leave" onClick={leave}>
        Rời chùa
      </button>
    </div>
  );
}
