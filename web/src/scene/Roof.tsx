// Mái đao cong chibi (ngói mũi hài): mặt ngói cong lõm, góc cong vút, viền mái tròn, bờ nóc mập,
// đầu đao xoắn men xanh ngọc, lưỡng long chầu nguyệt (ornate). Hình học: arch/roofGeometry.ts.
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { camBlockers } from "../state/runtime";
import { buildRoof } from "./arch/roofGeometry";
import { M } from "./materials";

interface Props {
  w: number;
  d: number;
  /** Chiều cao mái (tới nóc nếu không phải skirt). */
  h: number;
  /** Cao độ chân mái. */
  y: number;
  /** Độ cong vút đầu đao. */
  curl: number;
  /** < 1: tầng mái dưới của mái chồng diêm (chỉ dựng tới tỉ lệ này). */
  skirt?: number;
  ornate?: boolean | "moon";
  over?: number;
  skipDaoX?: 1 | -1;
  position?: [number, number, number];
}

export function Roof({ w, d, h, y, curl, skirt, ornate, over, skipDaoX, position }: Props) {
  const parts = useMemo(
    () => buildRoof({ w, d, h, curl, skirt, ornate, over, skipDaoX }),
    [w, d, h, curl, skirt, ornate, over, skipDaoX],
  );
  useEffect(() => () => Object.values(parts).forEach((g) => g.dispose()), [parts]);
  const body = useRef<Group>(null);
  useEffect(() => {
    const g = body.current;
    if (!g) return;
    camBlockers.add(g);
    return () => {
      camBlockers.delete(g);
    };
  }, []);
  return (
    <group position={position}>
      <group ref={body} position-y={y}>
        <mesh geometry={parts.tiles} material={M.tile} castShadow receiveShadow />
        <mesh geometry={parts.under} material={M.roofUnder} />
        <mesh geometry={parts.edge} material={M.roofEdge} castShadow />
        <mesh geometry={parts.ceramic} material={M.ceramic} castShadow />
        <mesh geometry={parts.gold} material={M.gold} />
      </group>
    </group>
  );
}
