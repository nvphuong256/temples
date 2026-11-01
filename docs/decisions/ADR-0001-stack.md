# ADR-0001 · Vite + R3F và một server Node (Colyseus + Express)

**Ngày:** 2026-11-01 · **Trạng thái:** Đã duyệt (Phương).

**Bối cảnh:** sản phẩm là chùa 3D nhiều người, không cần SEO nội dung, 1 người làm với Claude Code, ngân sách ≤ 1 triệu/tháng. Bản thiết kế cổng thông tin (Next.js + Vercel + Neon, 31 bảng) đã bị hủy vì lệch mục tiêu.

**Phương án:** (A) Vite + R3F tĩnh + server Node Colyseus/Express/Prisma trên VPS — ít nhất, rẻ nhất, WebSocket tự chủ. (B) Next.js + realtime riêng — thêm một framework không dùng tới. (C) Dịch vụ realtime managed — phí theo kết nối.

**Quyết định:** A. **Hệ quả:** tự vận hành một VPS (Uptime Kuma, backup); khi > 1.000 người đồng thời thêm VPS và Redis presence chung.
