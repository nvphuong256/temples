# 04 · Hình ảnh & âm thanh

Nhận diện Việt so với Sansa: mái đao ngói mũi hài, áo nâu sồng, lư hương giữa sân.

Bố cục (nội công ngoại quốc): tam quan Phúc Lâm Tự (z=24) → sân gạch (lư hương z=6, ao sen x=-19, cây đa x=19, gác chuông x=14) → Đại Hùng Bảo Điện (z=-22, 26×18, 8 chiếu, tượng Phật tòa sen, mõ, chuông gia trì) → tường bao. Tọa độ theo nguyên mẫu `docs/prototype/chua-viet-online.html`.

Palette sơn mài (`shared/src/constants.ts`): nâu gụ #5C3A21 · đỏ son #A4262C · vàng #D9A441 · ngói #8B3A2A · sen #E58FA6 · gạch #B8663D · sương #EEE7D8.

Avatar: chú tiểu (áo nâu, chỏm tóc) / Phật tử (áo lam, tóc búi), tỷ lệ 3 đầu, không mặt chi tiết. Tiểu An: cùng mẫu + khăn vàng, bong bóng thoại.
Ngày/đêm: 5h–18h nắng; 18h–5h đêm rằm, đèn lồng sáng.
HUD: tên, số người, công đức, hạt, giờ VN; nút nghi lễ dạng chip; Noto Serif Display + Be Vietnam Pro.
Âm thanh: WebAudio tổng hợp (gió, chim, mõ, chuông gia trì, chuông lớn, hạt) — `web/src/audio/synth.ts`; tụng kinh thật chỉ khi có bản quyền.
Hiệu năng: ≤ 8 MB, ≤ 150k tam giác, texture 1024, LOD avatar, 30 fps máy tầm trung, tắt bóng đổ máy yếu.
Tôn nghiêm: không nhảy/chạy nhanh trong điện, không nhạc có nhịp, không quảng cáo.

## Danh sách vật thể (cập nhật khi thêm)
Gate, Yard (brick), IncenseBurner (+Smoke), LotusPond, BanyanTree, BellTower, Hall (columns, roof, signboard, couplets, altar, Buddha), Cushions, Lanterns, Walls, Avatar, TieuAn.
