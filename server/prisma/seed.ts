// Seed idempotent: 10 phòng (tien-duong-1..10), settings (hoành phi, câu đối), lời thoại Tiểu An mẫu.
// Không xóa dữ liệu thành viên. Lời thoại: chỉ thêm khi bảng companion_lines đang trống.
import { COMPANION_SEED_LINES, DEFAULT_ROOMS, DEFAULT_SETTINGS, ROOM_CAPACITY } from "@cvo/shared";
import { createDb } from "../src/lib/db.js";

const db = createDb();

async function main() {
  for (const r of DEFAULT_ROOMS) {
    await db.room.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, capacity: ROOM_CAPACITY },
    });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as Record<string, string> },
    });
  }
  const existing = await db.companionLine.count();
  if (existing === 0) {
    await db.companionLine.createMany({
      data: COMPANION_SEED_LINES.map((l) => ({
        state: l.state,
        text: l.text,
        weight: l.weight ?? 1,
        condition: l.condition ? { ...l.condition } : undefined,
      })),
    });
  }
  const [rooms, lines] = await Promise.all([db.room.count(), db.companionLine.count()]);
  console.log(`seed ok: ${rooms} rooms, ${lines} companion lines`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
