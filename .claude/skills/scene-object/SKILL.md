---
name: scene-object
description: Thêm hoặc sửa một vật thể trong cảnh chùa 3D (web/src/scene) đúng quy ước R3F, palette sơn mài, ngân sách hiệu năng.
---
# scene-object
1. Đọc `docs/04-visual-audio.md` và phần tương ứng trong `docs/prototype/chua-viet-online.html` (hàm `roof`, `column`, lư hương, avatar...).
2. Một component/file trong `web/src/scene/<Ten>.tsx`, props tối thiểu (position, variant); geometry/material tạo bằng `useMemo`; màu từ `PALETTE` trong `@cvo/shared`.
3. Ngân sách: ≤ 20 nghìn tam giác cho vật thể lớn, texture ≤ 1024, dùng `InstancedMesh` cho vật lặp (cột, hương, hạt sen).
4. Không `useFrame` trong component có nhiều instance; animation gom vào một hệ thống.
5. Kiểm tra: FPS ≥ 30 trên "Slow 4G + CPU 4x" của DevTools; mobile 390 px; chế độ đêm.
6. Cập nhật danh sách vật thể trong `docs/04-visual-audio.md`.
