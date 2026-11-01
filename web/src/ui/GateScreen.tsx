// Màn hình cổng tam quan: chọn nhân vật + tên ngẫu nhiên kiểu Việt, rồi "Vào chùa".
import { DEFAULT_SETTINGS, GUEST_NAMES } from "@cvo/shared";
import { initAudio } from "../audio/synth";
import { cam } from "../state/runtime";
import { toast, randomGuestName, useUi, type AvatarKind } from "../state/store";

export function GateScreen() {
  const { avatar, name, set } = useUi();
  const couplets = DEFAULT_SETTINGS.couplets;

  const enter = () => {
    initAudio();
    // Camera ngoài cổng xoay chậm; vào chùa thì quay về phía tam quan.
    cam.yaw = 0;
    cam.pitch = 0.42;
    cam.dist = 11;
    set({ phase: "temple", visits: useUi.getState().visits + 1 });
    toast("Qua cổng tam quan. Hãy thắp một nén hương ở sân trước.");
  };

  return (
    <section id="gate" aria-label="Cổng tam quan">
      <svg className="gate-roof" viewBox="0 0 520 150" aria-hidden="true">
        <defs>
          <linearGradient id="gl" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F0CB7A" />
            <stop offset="1" stopColor="#B8832A" />
          </linearGradient>
        </defs>
        <path
          d="M20 95 C 60 70, 110 55, 260 50 C 410 55, 460 70, 500 95 L 470 92 C 420 78, 350 68, 260 66 C 170 68, 100 78, 50 92 Z"
          fill="url(#gl)"
        />
        <path
          d="M70 118 C 110 100, 180 92, 260 90 C 340 92, 410 100, 450 118 L 425 116 C 380 104, 320 98, 260 97 C 200 98, 140 104, 95 116 Z"
          fill="url(#gl)"
          opacity=".85"
        />
        <path
          d="M16 96 c -8 -6 -10 -16 -6 -24"
          stroke="#F0CB7A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M504 96 c 8 -6 10 -16 6 -24"
          stroke="#F0CB7A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="40" y="120" width="10" height="30" fill="#5C3A21" />
        <rect x="470" y="120" width="10" height="30" fill="#5C3A21" />
        <rect x="190" y="118" width="8" height="32" fill="#5C3A21" />
        <rect x="322" y="118" width="8" height="32" fill="#5C3A21" />
        <rect x="215" y="100" width="90" height="16" rx="2" fill="#A4262C" />
        <text
          x="260"
          y="112"
          textAnchor="middle"
          fontSize="11"
          fill="#F0CB7A"
          fontFamily="Noto Serif Display, serif"
          letterSpacing="2"
        >
          {DEFAULT_SETTINGS.gate_sign.vi}
        </text>
      </svg>
      <h1>
        Chùa Việt 3D<small>không nói, cùng ngồi</small>
      </h1>
      <p>
        Một ngôi chùa làng Bắc Bộ trên trình duyệt: qua cổng tam quan, thắp một nén hương ở sân, vào
        chính điện lễ Phật, gõ mõ, lần tràng hạt. Không có chat; chỉ chắp tay chào nhau.
      </p>
      <div className="couplet" aria-hidden="true">
        <span>{couplets.left}</span>
        <span>{couplets.right}</span>
      </div>
      <div className="row">
        <label className="f">
          Nhân vật
          <select value={avatar} onChange={(e) => set({ avatar: e.target.value as AvatarKind })}>
            <option value="tieu">Chú tiểu áo nâu</option>
            <option value="phattu">Phật tử áo lam</option>
          </select>
        </label>
        <label className="f">
          Tên hiển thị
          <select value={name} onChange={(e) => set({ name: e.target.value })}>
            {GUEST_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <button className="btn" onClick={enter} autoFocus>
          Vào chùa
        </button>
        <button className="btn ghost" onClick={() => set({ name: randomGuestName(name) })}>
          Đổi tên khác
        </button>
      </div>
      <div className="fine">Mọi âm thanh được tổng hợp tại chỗ, chưa có giọng tụng kinh.</div>
    </section>
  );
}
