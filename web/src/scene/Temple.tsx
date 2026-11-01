// Toàn cảnh chùa: ghép các vật thể. Thêm vật thể mới → skill /scene-object.
import { AvatarAnimator } from "./AvatarAnimator";
import { BanyanTree } from "./BanyanTree";
import { BellTower } from "./BellTower";
import { Columns } from "./Columns";
import { Cushions } from "./Cushions";
import { Gate } from "./Gate";
import { Ground } from "./Ground";
import { Hall } from "./Hall";
import { IncenseBurner } from "./IncenseBurner";
import { Lanterns } from "./Lanterns";
import { Lighting } from "./Lighting";
import { LotusPond } from "./LotusPond";
import { Player } from "./Player";
import { Smoke } from "./Smoke";
import { TieuAn } from "./TieuAn";
import { Walls } from "./Walls";

export function Temple({ shadows }: { shadows: boolean }) {
  return (
    <>
      <Lighting shadows={shadows} />
      <Ground />
      <Columns />
      <Gate />
      <Hall />
      <Cushions />
      <IncenseBurner />
      <Smoke />
      <LotusPond />
      <BanyanTree />
      <BellTower />
      <Lanterns />
      <Walls />
      <TieuAn />
      <Player />
      <AvatarAnimator />
    </>
  );
}
