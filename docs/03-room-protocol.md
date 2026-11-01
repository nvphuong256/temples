# 03 · Giao thức TempleRoom

Một TempleRoom/phòng, ≤ 100 client, tick 20 Hz, state qua @colyseus/schema; client gửi vị trí 10/s, server clamp vào vùng đi được; nội suy ở client. Schema Zod: `shared/src/messages.ts`.

Vào phòng: `joinOrCreate("temple", { roomId, token })`, token từ `/api/session`. Đầy → `queue { position, etaSec }`.

| Chiều | Message | Payload | Luật |
|---|---|---|---|
| C→S | move | {x,z,rot} | ≤ 10/s, clamp |
| C→S | bow | {start} | server cấp chiếu trống (8), khóa theo người; +1 công đức mỗi 10 lạy |
| C→S | incense | – | trong 2,2 m lư hương; +1 |
| C→S | mo | – | +1 ngẫu nhiên 20 % |
| C→S | bell | – | 1/20 s/người |
| C→S | beads | {count} | +3 khi 108 |
| C→S | greet | {targetId?} | target trong 6 m |
| C→S | leave | – | giải phóng chiếu |
| S→C state | players Map{name, avatar, x, z, rot, state, seat}, seats, isNight, online | | state: idle/walk/bow/greet/sit |
| S→C event | greeted {fromId, fromName} · bell {fromName} · incense {playerId} · merit {today,total} · queue {position,etaSec} | | |

Rate limit 10 msg/s/client, vượt 3 lần → ngắt. Không có message chat, không bao giờ thêm.
