// Hệ thống gió: một useFrame duy nhất tính gió giật từ `env.baseStrength`/`env.dir` và cập nhật uniform.
import { useFrame } from "@react-three/fiber";
import { env, windUniforms } from "./wind";

export function WindSystem() {
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    env.time = t;
    env.gust = Math.max(0, Math.sin(t * 0.37) * Math.sin(t * 0.13 + 1.7));
    const target = Math.min(1, env.baseStrength * (0.75 + 0.9 * env.gust));
    env.strength += (target - env.strength) * Math.min(1, delta * 1.5);
    const wobble = Math.sin(t * 0.21) * 0.25;
    env.windX = Math.cos(env.dir + wobble) * env.strength;
    env.windZ = Math.sin(env.dir + wobble) * env.strength;
    windUniforms.uTime.value = t;
    windUniforms.uWind.value.set(env.windX, env.windZ);
  });
  return null;
}
