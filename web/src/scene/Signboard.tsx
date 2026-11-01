// Biển chữ (hoành phi) và câu đối — khung gỗ thếp vàng bo tròn kiểu đồ chơi, mặt chữ là texture canvas
// (vẽ lại khi font web đã tải xong).
import { useEffect, useMemo, useState } from "react";
import { coupletTexture, signTexture } from "./textures";
import { rbox } from "./arch/geom";
import { M } from "./materials";

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

interface SignProps {
  han: string;
  vi: string;
  size: [number, number];
  position: [number, number, number];
}

export function Signboard({ han, vi, size, position }: SignProps) {
  const fonts = useFontsReady();
  const tex = useMemo(() => signTexture(han, vi), [han, vi, fonts]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => tex.dispose(), [tex]);
  const [w, h] = size;
  const frame = useMemo(() => rbox(w + 0.36, h + 0.36, 0.22, 0.16, 2), [w, h]);
  useEffect(() => () => frame.dispose(), [frame]);
  return (
    <group position={position}>
      <mesh geometry={frame} material={M.gold} position-z={-0.08} castShadow />
      {/* Hai nụ tròn hai đầu biển */}
      {[1, -1].map((s) => (
        <mesh key={s} material={M.lacquer} position={[s * (w / 2 + 0.22), 0, -0.02]}>
          <sphereGeometry args={[0.16, 10, 8]} />
        </mesh>
      ))}
      <mesh position-z={0.04}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

interface CoupletProps {
  text: string;
  position: [number, number, number];
}

export function Couplet({ text, position }: CoupletProps) {
  const fonts = useFontsReady();
  const tex = useMemo(() => coupletTexture(text), [text, fonts]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={position}>
      <mesh geometry={COUPLET_FRAME} material={M.gold} position-z={-0.06} />
      <mesh position-z={0.03}>
        <planeGeometry args={[0.9, 5]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
    </group>
  );
}

const COUPLET_FRAME = rbox(1.1, 5.2, 0.14, 0.12);
