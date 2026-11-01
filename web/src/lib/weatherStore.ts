// Store UI nhỏ cho chip thời tiết trên HUD (không đụng state/store.ts).
// useVnClock gọi `syncWeatherUi` mỗi 30 s; WeatherFx gọi thêm khi thời tiết đổi (kể cả khi ép gỡ lỗi).
import { create } from "zustand";
import { setBirds } from "../audio/synth";
import { currentWeather, weatherLabel, type WeatherKind } from "./weather";

interface WeatherUi {
  kind: WeatherKind;
  label: string;
}

export const useWeatherUi = create<WeatherUi>(() => ({ kind: "clear", label: "Nắng · gió nhẹ" }));

export function syncWeatherUi(night: boolean, now: Date = new Date()) {
  const w = currentWeather(now);
  useWeatherUi.setState({ kind: w.kind, label: weatherLabel(w, night) });
  // Chim im khi đêm hoặc mưa phùn.
  setBirds(!night && w.kind !== "drizzle");
}
