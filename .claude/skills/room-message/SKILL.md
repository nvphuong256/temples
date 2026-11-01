---
name: room-message
description: Thêm hoặc đổi một message/state của TempleRoom — Zod schema trong shared, xử lý server, client, test và docs cùng lúc.
---
# room-message
1. Đọc `docs/03-room-protocol.md`; không thêm message chat dưới bất kỳ tên nào.
2. `shared/src/messages.ts`: thêm schema Zod + thêm tên vào `MESSAGE_NAMES`.
3. `server/src/rooms/TempleRoom.ts`: `onMessage` validate bằng schema, kiểm tra điều kiện (khoảng cách, cooldown, chiếu), cập nhật state, ghi công đức nếu có.
4. `web/src/net`: hàm gửi có kiểu; `web/src/rituals`: hiệu ứng client.
5. `tests/room/<message>.test.ts` với Colyseus test client: hợp lệ, vượt giới hạn, sai điều kiện.
6. Cập nhật bảng message trong `docs/03-room-protocol.md`.
