# 04 · Hình ảnh & âm thanh

Nhận diện Việt so với Sansa: mái đao ngói mũi hài, áo nâu sồng, lư hương giữa sân.

Bố cục (nội công ngoại quốc): tam quan Phúc Lâm Tự (z=24) → sân gạch (lư hương z=6, ao sen x=-19, cây đa x=19, gác chuông x=14) → Đại Hùng Bảo Điện (z=-22, 26×18, 8 chiếu, tượng Phật tòa sen, mõ, chuông gia trì) → tường bao. Tọa độ theo nguyên mẫu `docs/prototype/chua-viet-online.html`.

Palette sơn mài (`shared/src/constants.ts`): nâu gụ #5C3A21 · đỏ son #A4262C · vàng #D9A441 · ngói #8B3A2A · sen #E58FA6 · gạch #B8663D · sương #EEE7D8.

Avatar (chibi, phiên 1 — `web/src/scene/chibi/`): MỘT rig dùng chung kiểu Pixar — đầu rất to tròn, mắt nâu to có ánh sáng, lông mày đậm cong, má hồng, miệng cười hiền, tai to; áo tràng cổ chéo trắng ngà, đai nâu, tay áo rộng, tất trắng. Biến thể: `tieu` (chú tiểu áo nâu sồng, chỏm tóc trái đào), `phattu` (Phật tử áo lam, tóc búi), `tieuan` (Tiểu An áo cam, gậy gỗ). Màu `CHIBI_CHAR` (`shared/src/palette/characters.ts`); mặt vẽ canvas một lần cho mọi avatar (`tieuAnFace.ts`). Cử động do `AvatarAnimator` (một useFrame): thở, chớp mắt ngẫu nhiên, đi lạch bạch, lạy quỳ trên bồ đoàn (không cúi chạm đất), chắp tay chào, ngồi thiền nhắm mắt; Tiểu An nhìn theo người chơi < 9 m, ngồi thiền khi người chơi xa > 22 m. ≤ 4k tam giác/avatar, LOD > 25 m. Lời thoại hiện ở bong bóng HUD.
Ngày/đêm: 5h–18h nắng; 18h–5h đêm rằm, đèn lồng sáng.
HUD: tên, số người, công đức, hạt, giờ VN; nút nghi lễ dạng chip; Noto Serif Display + Be Vietnam Pro.
Âm thanh: WebAudio tổng hợp (gió, chim, mõ, chuông gia trì, chuông lớn, hạt) — `web/src/audio/synth.ts`; tụng kinh thật chỉ khi có bản quyền.
Hiệu năng: ≤ 8 MB, ≤ 150k tam giác, texture 1024, LOD avatar, 30 fps máy tầm trung, tắt bóng đổ máy yếu.
Tôn nghiêm: không nhảy/chạy nhanh trong điện, không nhạc có nhịp, không quảng cáo.

## Danh sách vật thể (cập nhật khi thêm)
`web/src/scene/`: Ground (cỏ, sân gạch, lối vào — nhấp để đi), Columns (mọi cột + chân tảng, instanced), Roof, Signboard/Couplet, Gate, Hall (nền, bậc, tường, ban thờ, tượng Phật, mõ, chuông gia trì), Cushions (instanced), IncenseBurner (+ hương instanced ≤ 40), Smoke (220 hạt), LotusPond (instanced), BanyanTree, BellTower, Lanterns (3 đèn có nguồn sáng thật), Walls, Lighting (ngày/đêm), Avatar + AvatarAnimator (một useFrame cho mọi avatar), Player (di chuyển + camera), TieuAn.
Tọa độ, va chạm, lái tránh vật cản: `web/src/scene/layout.ts` (hàm thuần, có test). Trong chính điện đi chậm 2,4 m/s (sân 5,5 m/s).
