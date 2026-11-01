// Palette sơn mài và hằng số luật chơi — dùng chung web/server. Thay đổi = cập nhật docs/04-visual-audio.md
export const PALETTE = {
  lacquer: "#5C3A21",
  son: "#A4262C",
  gold: "#D9A441",
  tile: "#8B3A2A",
  lotus: "#E58FA6",
  brick: "#B8663D",
  mist: "#EEE7D8",
} as const;
export const ROOM_CAPACITY = 100;
export const ROOM_COUNT = 10;
export const SEATS_PER_ROOM = 8;
export const BELL_COOLDOWN_MS = 20_000;
export const INCENSE_RANGE_M = 2.2;
export const GREET_RANGE_M = 6;
export const BEADS_PER_ROUND = 108;

// 10 phòng mặc định. Tên phòng là câu hỏi mở (docs/00-product.md) — tạm "Tiền đường 1–10".
export const DEFAULT_ROOMS = Array.from({ length: ROOM_COUNT }, (_, i) => ({
  id: `tien-duong-${i + 1}`,
  name: `Tiền đường ${i + 1}`,
  sortOrder: i + 1,
}));

// Hoành phi, câu đối mặc định (bảng settings, quản trị sửa được).
export const DEFAULT_SETTINGS = {
  gate_sign: { han: "福林寺", vi: "PHÚC LÂM TỰ" },
  hall_sign: { han: "大雄寶殿", vi: "ĐẠI HÙNG BẢO ĐIỆN" },
  couplets: { left: "Cửa thiền rộng mở đón người hữu duyên", right: "Tâm an vạn sự an" },
  announcement: { text: "" },
} as const;

// Màu phụ của cảnh (ngoài palette sơn mài) — gỗ tối, tường vôi, đá, đồng, cây cỏ, nước, áo, da, trời.
export const SCENE_COLORS = {
  woodDark: "#3B2416",
  wall: "#E9DCC2",
  stone: "#8D8578",
  bronze: "#6B4F2A",
  leaf: "#3F6B2F",
  grass: "#6C8A3A",
  water: "#4A7B86",
  lotusLeaf: "#4F7A3C",
  robeBrown: "#6B4A2B",
  robeBlue: "#6D7F98",
  skin: "#E7C3A0",
  scarf: "#E2B23C",
  // Tiểu An bản hoạt hình (theo ảnh tham chiếu của Phương, 01/11): áo tràng cam, cổ chéo trắng, đai nâu.
  tieuAnSkin: "#F7D9C8",
  tieuAnEar: "#F2B9A0",
  tieuAnRobe: "#E2672F",
  tieuAnCollar: "#F1E6D3",
  tieuAnSash: "#5C3A21",
  tieuAnIris: "#7A4A1E",
  tieuAnBrow: "#4A2E1C",
  tieuAnBlush: "#F29C8C",
  lantern: "#C42D2D",
  lanternGlow: "#FF6A2A",
  incense: "#B04A2A",
  smoke: "#F2E8D8",
  skyDay: "#D6C3A2",
  fogDay: "#D9C7A4",
  skyNight: "#121626",
} as const;

// Luật công đức (docs/00-product.md). Server (TempleRoom) là nơi quyết định; web dùng cho khách offline/tuần 1.
export const MERIT_RULES = {
  incense: 1,
  bowsPerMerit: 10,
  moChance: 0.2,
  beadsRound: 3,
  bell: 0,
  greet: 0,
} as const;
