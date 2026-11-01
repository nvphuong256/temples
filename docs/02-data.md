# 02 · Dữ liệu

Nguồn sự thật: `server/prisma/schema.prisma` (users, magic_links, merit_logs, rooms, settings, companion_lines, admins). Khách không ghi Postgres.

| Bảng | Giữ | Index |
|---|---|---|
| users | thành viên qua magic link: email, display_name, avatar, companion_name | email |
| magic_links | token hash, 15 phút, used_at | token_hash; (user_id, expires_at) |
| merit_logs | hành động có công đức của thành viên, theo ngày | (user_id, day); (day, action) |
| rooms | 10 phòng: tên, sức chứa, mở/đóng | – |
| settings | hoành phi, câu đối, giờ tụng, thông báo (jsonb) | key |
| companion_lines | lời thoại Tiểu An: state, condition, weight | (state, enabled) |
| admins | 1–3 quản trị, TOTP | email |

Redis: `presence:{room}` hash (TTL 60 s) · `seats:{room}` set 0–7 · `queue:{room}` list · `online` · `merit:day:{yyyy-mm-dd}` zset (bảng công đức, cả khách theo tên tạm) · `rl:{ip}`.
Khách: công đức/hạt trong localStorage theo ngày.
Backup: `pg_dump` hằng đêm → R2, giữ 30 bản. Xóa tài khoản: `deleted_at` → xóa cứng sau 30 ngày.
