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
import { Sky } from "./env/Sky";
import { WeatherFx } from "./env/WeatherFx";
import { WindSystem } from "./env/WindSystem";
import { RitualFx } from "./fx/RitualFx";
import { FallingLeaves } from "./nature/FallingLeaves";
import { GardenDecor } from "./nature/GardenDecor";

export function Temple({ shadows }: { shadows: boolean }) {
  return (
    <>
      {/* Phiên 4 — bầu trời, thời tiết, gió */}
      <WindSystem />
      <Lighting shadows={shadows} />
      <Sky />
      <WeatherFx />
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
      {/* Phiên 3 — thiên nhiên & sân vườn */}
      <GardenDecor />
      <FallingLeaves />
      {/* Phiên 5 — hương khói & hiệu ứng nghi lễ */}
      <RitualFx />
      {/* Phiên 1 — nhân vật */}
      <TieuAn />
      <Player />
      <AvatarAnimator />
    </>
  );
}
