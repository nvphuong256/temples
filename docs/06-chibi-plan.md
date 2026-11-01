# 06 · Kế hoạch chibi hóa toàn cảnh (5 phiên song song)

Quyết định của Phương (01/11): toàn bộ chùa — người chơi, cảnh vật, thời tiết, gió, hương bay, mọi vật thể — chuyển sang **3D chibi hoạt hình** cùng phong cách với Tiểu An (`web/src/scene/TieuAn.tsx`, ảnh tham chiếu: đầu to, mắt nâu to, má hồng, áo tràng cam, nền sân chùa nắng ấm, cây xanh, đá tròn). Thời tiết + gió + lá rơi là phần mới, được Phương duyệt cùng quyết định này.

## Phong cách chung (mọi phiên)
- **Hình khối tròn, mập, phóng đại**: bo góc (`RoundedBoxGeometry` từ `three/examples/jsm/geometries/RoundedBoxGeometry.js`), `LatheGeometry` cho vật tròn xoay, cầu/viên nang thay hộp sắc cạnh. Tỷ lệ "đồ chơi": cột mập, mái cong vút, đầu đao xoắn to.
- **Màu bão hòa, ấm, sạch** (Pixar/claymation), lấy từ `shared/src/palette/<hạng mục>.ts`. `MeshStandardMaterial` roughness 0,5–0,85, metalness thấp (trừ đồng/vàng). Không tải ảnh/texture file; texture vẽ canvas ≤ 1024.
- **Tôn nghiêm**: tượng Phật trang nghiêm (mắt khép, nét hiền, không mắt to hoạt hình, không biểu cảm hài); không chữ/quảng cáo trong 3D ngoài hoành phi, câu đối.
- **Hiệu năng**: tổng ≤ 150k tam giác, tải ≤ 8 MB, 30 fps máy tầm trung. Vật lặp → `InstancedMesh`. Mỗi hệ thống tối đa **một** `useFrame`; không `useFrame` trong component có nhiều instance. Đung đưa cây cỏ dùng `withWindSway` (GPU), không cập nhật ma trận từng khung nếu tránh được.
- Ngân sách tam giác: nhân vật ≤ 4k/avatar (đặt sẵn đường LOD cho 100 người/phòng), kiến trúc ≤ 60k, thiên nhiên ≤ 40k, trời/thời tiết ≤ 15k, hương khói/hiệu ứng ≤ 10k.
- Không thêm package (ADR-0001) — three, R3F, drei đã có. Không đổi `scene/layout.ts` (tọa độ, va chạm) trừ khi phiên đó sở hữu và có test.

## API dùng chung (đã có sẵn, không đổi chữ ký)
- `web/src/scene/env/wind.ts`: `env` (weather, dir, baseStrength, strength, windX, windZ, gust, rain, mist, time), `windUniforms`, `withWindSway(material, amp, refHeight)`. Chỉ phiên 4 ghi `weather/dir/baseStrength/rain/mist`; mọi phiên đọc.
- `web/src/scene/env/WindSystem.tsx`: một useFrame tính gió giật + uniform.
- `web/src/scene/fx/bus.ts`: `onFx/emitFx` — `rituals/actions.ts` đã phát `incense | bow | mo | beadsRound | greet | bell` kèm vị trí và công đức.
- `web/src/state/runtime.ts`: `avatars` (AvatarAnim: pivot, hands, pose, t, moving, onBowCycle), `player`, `cam`, `setPose`.
- Khung đã gắn sẵn trong `Temple.tsx` (KHÔNG sửa `Temple.tsx`): `env/Sky`, `env/WeatherFx`, `nature/GardenDecor`, `nature/FallingLeaves`, `fx/RitualFx`. Muốn thêm vật thể → tạo file mới trong thư mục của mình và render từ khung đó.

## 5 phiên — quyền sở hữu file (chỉ sửa file của mình)
| # | Hạng mục | Nhánh | Sở hữu |
|---|---|---|---|
| 1 | **Nhân vật chibi** (người chơi chú tiểu/Phật tử + Tiểu An dùng chung rig; đi lạch bạch, lạy quỳ, chắp tay, ngồi thiền, chớp mắt, thở) | `claude/chibi-1-nhan-vat` | `scene/Avatar.tsx`, `scene/AvatarAnimator.tsx`, `scene/TieuAn.tsx`, `scene/tieuAnFace.ts`, `scene/Player.tsx`, `scene/chibi/**` (mới), `state/runtime.ts` (chỉ mở rộng AvatarAnim), `shared/src/palette/characters.ts`, `tests/unit/chibi-*.test.ts` |
| 2 | **Kiến trúc chùa** (tam quan, chính điện, cột, mái đao, hoành phi/câu đối, ban thờ, tượng Phật, mõ, chuông gia trì, bồ đoàn, gác chuông, tường bao) | `claude/chibi-2-kien-truc` | `scene/Columns.tsx`, `Roof.tsx`, `Gate.tsx`, `Hall.tsx`, `Signboard.tsx`, `Cushions.tsx`, `BellTower.tsx`, `Walls.tsx`, `materials.ts`, `textures.ts`, `scene/arch/**` (mới), `shared/src/palette/architecture.ts` |
| 3 | **Thiên nhiên & sân vườn** (nền cỏ + sân gạch, cỏ/hoa/đá/bụi/tre/chậu cảnh, ao sen + lá súng + hoa sen nhiều cánh + cá chép, cây đa, lá rơi theo gió) | `claude/chibi-3-thien-nhien` | `scene/Ground.tsx` (giữ nhấp-để-đi), `LotusPond.tsx`, `BanyanTree.tsx`, `scene/nature/**`, `shared/src/palette/nature.ts`, `tests/unit/nature-*.test.ts` |
| 4 | **Bầu trời, thời tiết & gió** (vòm trời gradient ngày/đêm, mặt trời, trăng rằm, sao, mây chibi trôi theo gió; nắng / nhiều mây / mưa phùn / sương sớm theo giờ VN, xác định được để mọi người cùng phòng thấy giống nhau; ánh sáng; âm gió + mưa tổng hợp; chip thời tiết trên HUD) | `claude/chibi-4-thoi-tiet` | `scene/Lighting.tsx`, `scene/env/**` (trừ đổi chữ ký API trên), `lib/weather.ts` (mới), `lib/useVnClock.ts`, `audio/synth.ts`, `ui/Hud.tsx`, `shared/src/palette/sky.ts`, `tests/unit/weather-*.test.ts` |
| 5 | **Hương khói, đèn lồng & hiệu ứng nghi lễ** (lư hương chibi, nén hương có đốm lửa, khói cuộn bay theo gió, đèn lồng tròn có tua đung đưa theo gió và sáng đêm, hiệu ứng khi thắp hương/lạy/gõ mõ/trọn tràng/chắp tay/thỉnh chuông) | `claude/chibi-5-huong-khoi` | `scene/IncenseBurner.tsx`, `Smoke.tsx`, `Lanterns.tsx`, `scene/fx/**` (trừ đổi chữ ký `bus.ts`), `shared/src/palette/fx.ts`, `tests/unit/fx-*.test.ts` |

Không phiên nào: sửa `Temple.tsx`, `layout.ts`, `rituals/*`, `App.tsx`, `docs/status.md`; xóa mục trong `materials.ts` (phiên 2 được đổi giá trị/thêm mục, không xóa vì phiên khác còn dùng). Ghi chú của phiên → `docs/chibi/0N-<ten>.md` (file riêng) + cập nhật mục tương ứng trong `docs/04-visual-audio.md` nếu cần (chỉ đoạn của mình).

## Cách tự kiểm tra bằng hình
`npx vite --port 5174 --strictPort web` (chạy nền) rồi `node scripts/shot.cjs '{"out":"...png","x":4.6,"z":29.4,"yaw":0,"pitch":0.1,"dist":3,"hidePlayer":true}'`. Đêm: `"night":true`. Ép tư thế: `"pose":{"tieuan":"sit"}`. Chạy JS tùy ý: `"eval":"const w = await __imp('/src/scene/env/wind.ts'); w.env.rain = 1;"` (luôn dùng `__imp`, không `import()` trực tiếp — Vite thêm `?t=` vào module vừa sửa nên `import()` sẽ ra bản module khác). Headless chạy ~30 fps; giữ phím để đi không ổn định — đặt vị trí trực tiếp.

## Xong khi (mỗi phiên)
typecheck + lint + test xanh; `npm -w web run build` < 8 MB; ảnh chụp ngày + đêm không lỗi console; commit + push lên nhánh của phiên; `docs/chibi/0N-*.md` 5–10 dòng (đã làm gì, ảnh chụp ở đâu, việc còn lại, rủi ro khi ghép). Phiên tích hợp (`claude/pensive-darwin-w4fnhe`) ghép 5 nhánh theo thứ tự 4 → 2 → 3 → 5 → 1.
