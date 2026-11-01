// Avatar chibi dùng chung: chú tiểu (tieu), Phật tử (phattu), Tiểu An (tieuan). Không useFrame — mọi cử
// động (đi lạch bạch, lạy, chắp tay, ngồi thiền, thở, chớp mắt, nhìn theo) do AvatarAnimator chạy chung.
import { useEffect, useLayoutEffect, useMemo } from "react";
import { avatars, type AvatarPose } from "../../state/runtime";
import { getFaceTextures } from "../tieuAnFace";
import { newLife, type ChibiVariant } from "./motion";
import { createChibi, disposeChibi } from "./rig";

interface Props {
  id: string;
  variant: ChibiVariant;
  pose?: AvatarPose;
  /** Quay đầu nhìn người chơi khi ở gần (Tiểu An). */
  lookAtPlayer?: boolean;
  /** Bồ đoàn riêng hiện khi ngồi thiền. */
  cushion?: boolean;
}

export function ChibiAvatar({
  id,
  variant,
  pose = "idle",
  lookAtPlayer = false,
  cushion = false,
}: Props) {
  const rig = useMemo(
    () => createChibi(variant, { face: getFaceTextures(), cushion }),
    [variant, cushion],
  );
  useEffect(() => () => disposeChibi(rig), [rig]);

  useLayoutEffect(() => {
    avatars.set(id, {
      pivot: rig.root,
      hands: rig.palms,
      pose,
      t: 0,
      moving: false,
      rig,
      life: newLife(Math.random()),
      lookAtPlayer,
    });
    return () => {
      avatars.delete(id);
    };
  }, [id, rig, pose, lookAtPlayer]);

  return <primitive object={rig.root} />;
}
