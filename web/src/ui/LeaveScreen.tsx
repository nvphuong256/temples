// Rời chùa: Tiểu An chúc, tổng công đức hôm nay, quay lại cổng. (Mời giữ công đức bằng magic link — tuần 5.)
import { resetPlayer } from "../scene/Player";
import { useUi } from "../state/store";

export function LeaveScreen() {
  const { progress, companion, set } = useUi();
  return (
    <section id="leave" aria-label="Rời chùa">
      <h2>Hẹn gặp lại</h2>
      <p className="bless">
        <b>Tiểu An:</b> {companion?.text}
      </p>
      <p>
        Công đức hôm nay <b>{progress.merit}</b> · {progress.beads} hạt · {progress.bows} lạy
      </p>
      <p className="fine">Công đức của khách được giữ trên máy này đến hết ngày (giờ VN).</p>
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            resetPlayer();
            set({ phase: "gate" });
          }}
        >
          Về cổng tam quan
        </button>
        <button className="btn ghost" onClick={() => set({ phase: "temple" })}>
          Ở lại thêm
        </button>
      </div>
    </section>
  );
}
