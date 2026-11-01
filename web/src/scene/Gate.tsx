// Tam quan Phúc Lâm Tự (z = 24): xà ngang, mái hai tầng, biển chữ. Cột nằm trong Columns.
import { DEFAULT_SETTINGS } from "@cvo/shared";
import { GATE_Z } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";
import { Signboard } from "./Signboard";

export function Gate() {
  const sign = DEFAULT_SETTINGS.gate_sign;
  return (
    <group>
      <mesh material={M.wood} position={[0, 6, GATE_Z]}>
        <boxGeometry args={[16, 0.6, 0.8]} />
      </mesh>
      <Roof w={16} d={4} h={2.2} y={6.2} curl={0.9} position={[0, 0, GATE_Z]} />
      <Roof w={7} d={3.2} h={1.6} y={8.2} curl={0.7} position={[0, 0, GATE_Z]} />
      <Signboard han={sign.han} vi={sign.vi} size={[5, 1.25]} position={[0, 7.2, GATE_Z + 1.2]} />
    </group>
  );
}
