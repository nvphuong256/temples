# Trạng thái — 2026-11-01

**Phase:** 0 · khung dự án (chưa cài package, chưa có code). **Domain:** tieuan.vn (chưa đăng ký).
**Sản phẩm:** chùa Việt 3D nhiều người (mô hình Sansa). Bản thiết kế cổng thông tin trước đó đã bị hủy theo quyết định của Phương ngày 01/11.

## Đã xong
- Thiết kế sản phẩm 9 mục (doc "Chùa Việt 3D (tieuan.vn) — Thiết kế sản phẩm").
- Khung repo: workspaces `shared/`, `web/` (Vite + R3F), `server/` (Colyseus + Express + Prisma 7 bảng), docs, skills, CI, compose.
- Nguyên mẫu Three.js chạy được tại `docs/prototype/chua-viet-online.html`.

## Việc kế tiếp (chờ Phương nói "bắt đầu tuần 1")
1. `npm install`; `npm -w server exec prisma validate` (chưa validate được trong môi trường thiết kế).
2. Tuần 1: chuyển nguyên mẫu sang R3F theo `docs/04-visual-audio.md`; seed 10 phòng + lời thoại Tiểu An.
3. Tuần 3: TempleRoom theo `docs/03-room-protocol.md`.

## Câu hỏi mở
Tên phòng · bảng công đức có tên khách? · log quốc gia truy cập? · thời điểm thuê model 3D. (docs/00-product.md mục cuối)

## Hạ tầng (01/11)
- Repo git khởi tạo (nhánh `main`); file zip khung dự án bị loại khỏi git.
- Cloud Session: hook SessionStart trong `.claude/settings.json` chạy `scripts/cloud-setup.sh` (chỉ khi `CLAUDE_CODE_REMOTE=true`): tạo `.env` dev, `npm install`, bật Postgres + Redis nếu cài được.
- Secret thật đặt trong phần Environment của claude.ai/code, không commit.
