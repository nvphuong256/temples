# CLAUDE.md — Chùa Việt 3D (tieuan.vn)

Sản phẩm là MỘT NGÔI CHÙA 3D nhiều người trên trình duyệt (mô hình Sansa Hàn Quốc, bản sắc chùa làng Bắc Bộ): vào qua tam quan, thắp hương, lễ Phật, gõ mõ, lần tràng hạt, chắp tay chào. Không chat. Không phải cổng tin tức Phật giáo — không thêm bài viết, kinh sách, CMS, module thiền riêng.

Stack: `web/` Vite + React 19 + React Three Fiber (web tĩnh) · `server/` Node 22 + Colyseus 0.18 + Express 5 + Prisma 7 + Postgres + Redis (một tiến trình) · `shared/` Zod schema gói tin dùng chung. Tiếng Việt có dấu trong UI; code/commit tiếng Anh.

## Đọc gì trước (tiết kiệm token)
1. `docs/status.md` — LUÔN đọc đầu phiên (1 trang: đang làm gì, dở gì, quyết định mới).
2. Theo task: `docs/00-product.md` (nghi lễ, phạm vi) · `docs/03-room-protocol.md` (message, state) · `docs/02-data.md` (6 bảng, Redis) · `docs/04-visual-audio.md` (cảnh, màu, âm thanh).
3. Nguyên mẫu: `docs/prototype/chua-viet-online.html` — cảnh, nghi lễ, âm thanh tổng hợp, joystick đã chạy được; chuyển sang R3F, không viết lại từ đầu.
4. Không đọc `node_modules`, `dist`, `public/models`.

## Lệnh
    npm run dev            # web :5173 + server :2567 (concurrently)
    npm run build · typecheck · lint · test · test:room · test:e2e
    npm -w server run db:migrate -- --name <ten>   · db:seed
Definition of done: typecheck + lint + test xanh; `docs/status.md` cập nhật 3–5 dòng.

## Quy ước
- Gói tin WebSocket: khai báo Zod trong `shared/src/messages.ts`, server validate mọi message, client không gửi gì ngoài schema. Thêm message = cập nhật `docs/03-room-protocol.md` cùng lúc (skill `/room-message`).
- `server/src/rooms/TempleRoom.ts` là nơi duy nhất quyết định luật chơi (chiếu, công đức, giới hạn chuông); client chỉ hiển thị.
- Cảnh 3D: mỗi vật thể một component trong `web/src/scene/` (skill `/scene-object`); màu từ `shared/src/constants.ts` (palette sơn mài); tổng tải ≤ 8 MB; không `useFrame` nặng trong component có nhiều instance.
- Nghi lễ phải chạy được cho khách không tài khoản; Postgres chỉ ghi thành viên.
- Âm thanh: chỉ tổng hợp WebAudio (`web/src/audio/synth.ts`). Không thêm file tụng kinh khi chưa có bản quyền.
- Tôn nghiêm: không chat, không chạy nhảy trong chính điện, không nhạc có nhịp, không quảng cáo trong 3D; lời thoại Tiểu An từ `companion_lines`, ≤ 90 ký tự, giọng ấm, không hứa hẹn tâm linh.
- Secret chỉ trong `.env` (không commit); `.env.example` đủ biến.
- Không thêm package khi chưa nêu lý do; không đổi stack (ADR-0001).

## Quy trình
Đọc status → kế hoạch 3–7 bước → code + test → `/review` → PR → `qa-reviewer` → cuối phiên cập nhật `docs/status.md`.
Cloud Sessions: chạy nền cho test TempleRoom, tối ưu model/texture, seed lời thoại, docs. Tại máy: migration production, secret, deploy.

## Không làm
- Không `prisma migrate reset`, không xóa dữ liệu khi chưa được yêu cầu rõ.
- Không thêm tính năng ngoài `docs/00-product.md` mục MVP nếu chưa có quyết định của Phương.
