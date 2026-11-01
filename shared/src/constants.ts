// Palette sơn mài và hằng số luật chơi — dùng chung web/server. Thay đổi = cập nhật docs/04-visual-audio.md
export const PALETTE = {
  lacquer: "#5C3A21", son: "#A4262C", gold: "#D9A441", tile: "#8B3A2A", lotus: "#E58FA6", brick: "#B8663D", mist: "#EEE7D8",
} as const;
export const ROOM_CAPACITY = 100;
export const ROOM_COUNT = 10;
export const SEATS_PER_ROOM = 8;
export const BELL_COOLDOWN_MS = 20_000;
export const INCENSE_RANGE_M = 2.2;
export const GREET_RANGE_M = 6;
export const BEADS_PER_ROUND = 108;
