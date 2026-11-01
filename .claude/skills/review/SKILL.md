---
name: review
description: Checklist review trước PR — giới hạn server, schema gói tin, hiệu năng 3D, mobile, tôn nghiêm, docs.
---
# review
Chạy `npm run lint && npm run typecheck && npm run test && npm run test:room`, rồi rà:
- [ ] Mọi message qua Zod ở server; client không tin dữ liệu người khác (clamp vị trí).
- [ ] Luật chơi (chiếu, công đức, cooldown) chỉ ở TempleRoom.
- [ ] Không thêm chat/voice/quảng cáo/tính năng ngoài MVP.
- [ ] Màu từ PALETTE; tải thêm ≤ 500 KB mỗi PR; FPS mobile ≥ 30.
- [ ] Khách không tài khoản vẫn làm được nghi lễ.
- [ ] Lời thoại Tiểu An đúng giọng (`docs/00-product.md`).
- [ ] `docs/status.md` và doc liên quan cập nhật.
Trả lời theo mức blocker / nên sửa / gợi ý; không tự sửa khi đang review.
