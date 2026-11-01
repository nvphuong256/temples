// Đại Hùng Bảo Điện (z = -22, 26 × 18): nền, bậc, tường, mái, hoành phi, câu đối, ban thờ, tượng Phật tòa sen,
// mõ và chuông gia trì. Cột nằm trong Columns, chiếu trong Cushions.
import { DEFAULT_SETTINGS } from "@cvo/shared";
import { HALL } from "./layout";
import { M } from "./materials";
import { Roof } from "./Roof";
import { Couplet, Signboard } from "./Signboard";

export function Hall() {
  const { w, d, z } = HALL;
  const sign = DEFAULT_SETTINGS.hall_sign;
  const couplets = DEFAULT_SETTINGS.couplets;
  const altarZ = z - 4.5;
  return (
    <group>
      <mesh material={M.stone} position={[0, 0.5, z]} receiveShadow>
        <boxGeometry args={[w + 2, 1, d + 2]} />
      </mesh>
      <mesh material={M.stone} position={[0, 0.25, z + d / 2 + 1.8]} receiveShadow>
        <boxGeometry args={[10, 0.5, 2]} />
      </mesh>
      <mesh material={M.wall} position={[0, 4.5, z - d / 2 + 0.6]} receiveShadow>
        <boxGeometry args={[w, 7, 0.4]} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} material={M.wall} position={[s * (w / 2 - 0.4), 4.5, z]} receiveShadow>
          <boxGeometry args={[0.4, 7, d - 2]} />
        </mesh>
      ))}
      <Roof w={w} d={d} h={4.2} y={8} curl={1.3} position={[0, 0, z]} />
      <Signboard han={sign.han} vi={sign.vi} size={[6, 1.5]} position={[0, 7.3, z + d / 2 - 0.5]} />
      <Couplet text={couplets.right} position={[-5.6, 3.8, z + d / 2 - 0.75]} />
      <Couplet text={couplets.left} position={[5.6, 3.8, z + d / 2 - 0.75]} />

      {/* Ban thờ + tượng Phật tòa sen */}
      <mesh material={M.woodDark} position={[0, 1.8, altarZ]} castShadow>
        <boxGeometry args={[8, 1.6, 3]} />
      </mesh>
      <mesh material={M.lotus} position={[0, 2.9, altarZ]}>
        <cylinderGeometry args={[1.5, 1.1, 0.6, 12]} />
      </mesh>
      <mesh material={M.gold} position={[0, 4.5, altarZ]} castShadow>
        <coneGeometry args={[1.3, 2.6, 14]} />
      </mesh>
      <mesh material={M.gold} position={[0, 6.1, altarZ]}>
        <sphereGeometry args={[0.62, 16, 14]} />
      </mesh>
      <mesh material={M.gold} position={[0, 6.2, altarZ - 0.6]}>
        <torusGeometry args={[1.1, 0.08, 8, 40]} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[s * 2.8, 0, altarZ]}>
          <mesh material={M.son} position={[0, 3, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.8, 8]} />
          </mesh>
          <pointLight
            color="#ffb060"
            intensity={2}
            distance={8}
            decay={1.5}
            position={[0, 3.6, 0]}
          />
        </group>
      ))}

      {/* Mõ (phải) và chuông gia trì (trái) trước chiếu */}
      <mesh material={M.woodDark} position={[3, 1.35, z + 1]} scale-y={0.7}>
        <sphereGeometry args={[0.45, 12, 10]} />
      </mesh>
      <mesh material={M.bronze} position={[-3, 1.45, z + 1]}>
        <cylinderGeometry args={[0.7, 0.8, 0.9, 16, 1, true]} />
      </mesh>
    </group>
  );
}
