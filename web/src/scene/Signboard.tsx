// Biển chữ (hoành phi) và câu đối — texture canvas, vẽ lại khi font web đã tải xong.
import { useEffect, useMemo, useState } from "react";
import { coupletTexture, signTexture } from "./textures";

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
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
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
    <mesh position={position}>
      <boxGeometry args={[0.9, 5, 0.1]} />
      <meshStandardMaterial map={tex} roughness={0.55} />
    </mesh>
  );
}
