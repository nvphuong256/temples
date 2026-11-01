// Cập nhật đồng hồ giờ VN + ngày/đêm + thời tiết mỗi 30 s; sang ngày mới thì đặt lại công đức/hạt trong ngày.
import { useEffect } from "react";
import { ensureToday, useUi } from "../state/store";
import { isNightHour, vnClockLabel, vnParts } from "./time";
import { syncWeatherUi } from "./weatherStore";

export function useVnClock() {
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const night = isNightHour(vnParts(now).hour);
      useUi.getState().set({ clock: vnClockLabel(now), night });
      syncWeatherUi(night, now);
      ensureToday();
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
}
