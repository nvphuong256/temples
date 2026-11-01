# Trạng thái — 2026-11-01

**Phase:** 1 · tuần 1 xong phần chơi một người trên web (chưa có server phòng). **Domain:** tieuan.vn (chưa đăng ký).
**Sản phẩm:** chùa Việt 3D nhiều người (mô hình Sansa). Bản thiết kế cổng thông tin trước đó đã bị hủy theo quyết định của Phương ngày 01/11.

## Đã xong
- Thiết kế sản phẩm 9 mục (doc "Chùa Việt 3D (tieuan.vn) — Thiết kế sản phẩm").
- Khung repo: workspaces `shared/`, `web/` (Vite + R3F), `server/` (Colyseus + Express + Prisma 7 bảng), docs, skills, CI, compose.
- Nguyên mẫu Three.js chạy được tại `docs/prototype/chua-viet-online.html`.

## Tuần 1 (01/11) — xong
- Prisma: sửa cú pháp enum, migration `init`, adapter `@prisma/adapter-pg` (Prisma 7 bắt buộc), seed idempotent: 10 phòng "Tiền đường 1–10" (tạm), hoành phi/câu đối, 17 câu Tiểu An (`shared/src/companion.ts`).
- Lint chạy được: `eslint.config.js` (typescript-eslint, react-hooks), `.prettierignore` bỏ docs/md.
- Web R3F: toàn cảnh, 6 nghi lễ (luật tạm ở `web/src/rituals/rules.ts`, công đức khách lưu localStorage theo ngày VN), tràng hạt, ngày/đêm giờ VN, joystick + 3 nút lớn mobile, màn rời chùa. Bundle 328 kB gzip; ~32 fps headless SwiftShader.
- Tiểu An bản chibi hoạt hình theo ảnh Phương gửi (áo cam, mắt to, chớp mắt, nhìn theo người chơi, ngồi thiền).
- 20 test đơn vị (luật nghi lễ, bố cục/va chạm, lời thoại ≤ 90 ký tự, giờ VN).

## Việc kế tiếp
1. Tuần 2: QA trên điện thoại thật (Slow 4G + CPU 4x), font tự host trong `web/public/fonts`, tinh chỉnh avatar người chơi.
2. Tuần 3: TempleRoom theo `docs/03-room-protocol.md`; chuyển luật công đức sang server.
3. Cần Phương quyết: màu áo Tiểu An (cam theo ảnh tham chiếu hay nâu sồng chùa Bắc Bộ); avatar người chơi có lên đời cùng phong cách chibi không.

## Câu hỏi mở
Tên phòng · bảng công đức có tên khách? · log quốc gia truy cập? · thời điểm thuê model 3D. (docs/00-product.md mục cuối)

## Hạ tầng (01/11)
- Repo git khởi tạo (nhánh `main`); file zip khung dự án bị loại khỏi git.
- Cloud Session: hook SessionStart trong `.claude/settings.json` chạy `scripts/cloud-setup.sh` (chỉ khi `CLAUDE_CODE_REMOTE=true`): tạo `.env` dev, `npm install`, bật Postgres + Redis nếu cài được.
- Secret thật đặt trong phần Environment của claude.ai/code, không commit.
