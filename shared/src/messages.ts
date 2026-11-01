// Zod schema gói tin TempleRoom — nguồn sự thật cho web và server. Chi tiết: docs/03-room-protocol.md
// Khung (phase 0): các schema sẽ được điền ở tuần 3. Không gửi message ngoài danh sách này.
export const MESSAGE_NAMES = [
  "move",
  "bow",
  "incense",
  "mo",
  "bell",
  "beads",
  "greet",
  "leave",
] as const;
export type MessageName = (typeof MESSAGE_NAMES)[number];
