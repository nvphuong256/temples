// Lời thoại Tiểu An mẫu — nguồn seed cho bảng companion_lines và dự phòng phía web khi chưa có server.
// Quy tắc (docs/00-product.md): ≤ 90 ký tự, xưng "Tiểu An" – gọi "bạn", ấm, không hứa hẹn tâm linh;
// "A Di Đà Phật" chỉ ở greet/bless.
export const COMPANION_STATES = ["greet", "guide", "bless", "meditate"] as const;
export type CompanionState = (typeof COMPANION_STATES)[number];
export const COMPANION_LINE_MAX = 90;

export interface CompanionLineSeed {
  state: CompanionState;
  text: string;
  weight?: number;
  condition?: { night?: boolean; returning?: boolean };
}

export const COMPANION_SEED_LINES: readonly CompanionLineSeed[] = [
  // greet — ở tam quan khi vừa vào
  { state: "greet", text: "A Di Đà Phật. Tiểu An chào bạn, mời bạn qua cổng tam quan.", weight: 3 },
  { state: "greet", text: "A Di Đà Phật. Bạn đến rồi, sân chùa hôm nay yên lắm." },
  { state: "greet", text: "Tiểu An chào bạn. Cứ đi chậm thôi, ở đây không ai vội.", weight: 2 },
  {
    state: "greet",
    text: "A Di Đà Phật. Đêm rằm sáng trăng, đèn lồng đã thắp rồi.",
    condition: { night: true },
  },
  {
    state: "greet",
    text: "Bạn quay lại rồi. Tiểu An vẫn đứng đây chờ bạn.",
    condition: { returning: true },
  },
  // guide — đứng yên > 30 s lần đầu
  {
    state: "guide",
    text: "Bạn thử thắp một nén hương ở lư hương giữa sân nhé (phím 1).",
    weight: 3,
  },
  { state: "guide", text: "Vào chính điện, bạn có thể ngồi chiếu và lễ Phật (phím 2)." },
  { state: "guide", text: "Gõ mõ chậm rãi, nghe tiếng mõ cho tâm lắng lại (phím 3)." },
  { state: "guide", text: "Lần tràng hạt: vuốt lên một lần là một hạt, đủ 108 là trọn tràng." },
  { state: "guide", text: "Gặp ai, bạn chắp tay chào nhé. Ở chùa mình chào nhau không cần lời." },
  { state: "guide", text: "Chuông lớn ở gác chuông, thỉnh một tiếng rồi đợi tiếng ngân tan." },
  // bless — khi rời chùa
  { state: "bless", text: "A Di Đà Phật. Chúc bạn về nhà bình an, lòng nhẹ như mây.", weight: 3 },
  { state: "bless", text: "A Di Đà Phật. Cảm ơn bạn đã ghé, hẹn bạn hôm khác nhé." },
  { state: "bless", text: "Đi đường cẩn thận nhé bạn. Cổng chùa lúc nào cũng mở." },
  // meditate — Tiểu An ngồi lặng, thỉnh thoảng nói khẽ
  { state: "meditate", text: "Thở vào, biết mình đang thở vào. Thở ra, mỉm cười." },
  { state: "meditate", text: "Tiếng gió qua cây đa nghe hay quá, bạn có nghe không?" },
  { state: "meditate", text: "Tiểu An ngồi đây một lát. Bạn cứ thong thả nhé." },
];

/** Chọn một câu theo state + điều kiện, có trọng số. `rand` ∈ [0,1) để test được. */
export function pickCompanionLine(
  lines: readonly CompanionLineSeed[],
  state: CompanionState,
  ctx: { night?: boolean; returning?: boolean } = {},
  rand: number = Math.random(),
): CompanionLineSeed | undefined {
  const pool = lines.filter((l) => {
    if (l.state !== state) return false;
    const c = l.condition;
    if (c?.night !== undefined && c.night !== !!ctx.night) return false;
    if (c?.returning !== undefined && c.returning !== !!ctx.returning) return false;
    return true;
  });
  const total = pool.reduce((s, l) => s + (l.weight ?? 1), 0);
  let r = rand * total;
  for (const l of pool) {
    r -= l.weight ?? 1;
    if (r < 0) return l;
  }
  return pool[pool.length - 1];
}
