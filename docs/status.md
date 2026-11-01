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

## Chibi hóa toàn cảnh (01/11, quyết định của Phương) — đã ghép 5 phiên
Kế hoạch, phong cách, quyền sở hữu file: `docs/06-chibi-plan.md`. Nền chung đã có ở commit b9cd680 (gió `env/wind.ts`, `fx/bus.ts`, palette theo hạng mục, khung gắn sẵn trong `Temple.tsx`, `scripts/shot.cjs`).
| # | Hạng mục | Nhánh | Phiên |
|---|---|---|---|
| 1 | Nhân vật | `claude/chibi-1-nhan-vat` | session_011hoNTmfBTsanJsBGk4m1xT |
| 2 | Kiến trúc | `claude/chibi-2-kien-truc` | session_011hoNTnCcLEhWnyxC5xZVZY |
| 3 | Thiên nhiên & sân vườn | `claude/chibi-3-thien-nhien` | session_011hoNTmXxPXZVpoUqgiQ4eY |
| 4 | Trời, thời tiết & gió | `claude/chibi-4-thoi-tiet` | session_011hoNTkw3Bg5hqm8P65rP4H |
| 5 | Hương khói, đèn lồng & hiệu ứng | `claude/chibi-5-huong-khoi` | session_011hoNTin3Nswy5bZSqkUjnT |
Đã ghép vào `claude/pensive-darwin-w4fnhe` theo thứ tự 4 → 2 → 3 → 5 → 1 (01/11): chỉ xung đột docs (danh sách vật thể) và chú thích `scripts/shot.cjs`; typecheck, lint, 76 test, build xanh (361 KB gzip); chạy thử ban ngày không lỗi console.
Sửa sau ghép: camera va chạm mái (tia từ đầu người chơi, mái đăng ký `camBlockers`; không còn chui dưới mái hiên tam quan/chính điện); câu đối màn cổng không còn chồng ô chọn tên; bong bóng Tiểu An lên trên cụm nút ở màn ≤ 1040px, gợi ý phím dời góc trái dưới; tán đa/tre đổi sang xanh ô liu trầm (bỏ phát sáng tán), vỏ đa nâu xám. Còn lại: chưa kiểm tra đêm, mưa phùn, mobile.

## Bản build tổng hợp (01/11)
- Nhánh `claude/eager-noether-i0civq` = toàn bộ `pensive-darwin` (5 nhánh chibi + sửa lỗi); typecheck, lint, 76 test, build xanh (361 KB gzip); chạy thử bản build cảnh đêm không lỗi console.
- Server: thêm `postinstall: prisma generate` (trước đó build hỏng khi cài mới vì thiếu Prisma client); sửa `start` → `dist/src/index.js`. Server vẫn là khung trống đến tuần 3.

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
