// Âm thanh tổng hợp WebAudio — gió, chim, mõ, chuông gia trì, chuông lớn, hạt. Không dùng file tụng kinh.
// Port từ docs/prototype/chua-viet-online.html. AudioContext chỉ tạo sau thao tác người dùng (nút "Vào chùa").
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let birdTimer: ReturnType<typeof setInterval> | null = null;
let birdsOn = true;

export function initAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  // Gió: tiếng ồn trắng qua lọc thông thấp, biên độ dao động chậm.
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const wind = ctx.createGain();
  wind.gain.value = 0.045;
  src.connect(lp).connect(wind).connect(master);
  src.start();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.11;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain).connect(wind.gain);
  lfo.start();

  birdTimer = setInterval(() => {
    if (birdsOn && Math.random() < 0.5) bird();
  }, 2600);
}

/** Đêm: tắt tiếng chim. */
export function setBirds(on: boolean) {
  birdsOn = on;
}

export function stopAudio() {
  if (birdTimer) clearInterval(birdTimer);
  birdTimer = null;
  void ctx?.close();
  ctx = null;
  master = null;
}

function bird() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  const f = 1800 + Math.random() * 1400;
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.08);
  o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.18);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.05, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.25);
}

export function playMo() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(780, t);
  o.frequency.exponentialRampToValueAtTime(380, t + 0.06);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(bp).connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.14);
}

/** big = chuông lớn gác chuông (110 Hz, ngân 6 s); nhỏ = chuông gia trì (520 Hz). */
export function playBell(big: boolean) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const base = big ? 110 : 520;
  [1, 2.01, 2.74, 4.1, 5.4].forEach((ratio, i) => {
    const o = ctx!.createOscillator();
    o.type = "sine";
    o.frequency.value = base * ratio;
    const g = ctx!.createGain();
    g.gain.setValueAtTime((big ? 0.35 : 0.25) / (i + 1), t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + (big ? 6 : 2.2) - i * 0.3);
    o.connect(g).connect(master!);
    o.start(t);
    o.stop(t + (big ? 6 : 2.5));
  });
}

export function playBead() {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(2400, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.06);
}
