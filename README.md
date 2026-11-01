# Chùa Việt 3D — tieuan.vn

Ngôi chùa làng Bắc Bộ 3D trên trình duyệt, nhiều người cùng vào, không nói chuyện, chỉ lễ. Khung dự án (chưa cài package, chưa có code nghiệp vụ). Đọc `CLAUDE.md` và `docs/status.md` trước.

```bash
npm install                      # workspaces: shared, web, server
cp .env.example .env
docker compose up -d postgres redis
npm -w server run db:migrate && npm -w server run db:seed
npm run dev                      # web http://localhost:5173 · server ws/http :2567
```
