// Âm thanh tổng hợp WebAudio — gió (theo env.strength), mưa phùn, chim, mõ, chuông gia trì, chuông lớn, hạt.
// Không dùng file tụng kinh, không nhạc có nhịp.
// Port từ docs/prototype/chua-viet-online.html. AudioContext chỉ tạo sau thao tác người dùng (nút "Vào chùa").
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let birdTimer: ReturnType<typeof setInterval> | null = null;
let birdsOn = true;
let windGain: GainNode | null = null;
let windLp: BiquadFilterNode | null = null;
let rainGain: GainNode | null = null;

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

  // Gió: tiếng ồn trắng qua lọc thông thấp; biên độ + tần số cắt theo sức gió (setWeatherAudio), LFO nhỏ cho "thở".
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  windLp = ctx.createBiquadFilter();
  windLp.type = "lowpass";
  windLp.frequency.value = 420;
  windGain = ctx.createGain();
  windGain.gain.value = 0.045;
  src.connect(windLp).connect(windGain).connect(master);
  src.start();
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.11;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.012;
  lfo.connect(lfoGain).connect(windGain.gain);
  lfo.start();

  // Mưa phùn: cùng nguồn ồn (lệch pha) qua lọc thông cao + dải, rất nhỏ — tiếng rì rào mảnh, không nhịp.
  const rsrc = ctx.createBufferSource();
  rsrc.buffer = buf;
  rsrc.loop = true;
  rsrc.playbackRate.value = 0.93;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const bp = ctx.createBiquadFilter();
  bp.type = "lowpass";
  bp.frequency.value = 6500;
  rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  rsrc.connect(hp).connect(bp).connect(rainGain).connect(master);
  rsrc.start(0, 0.7);

  birdTimer = setInterval(() => {
    if (birdsOn && Math.random() < 0.5) bird();
  }, 2600);
}

/** Đêm: tắt tiếng chim. */
export function setBirds(on: boolean) {
  birdsOn = on;
}

/** Gọi vài lần mỗi giây từ WeatherFx: wind = env.strength (đã có giật), rain = env.rain (0..1). */
export function setWeatherAudio(wind: number, rain: number) {
  if (!ctx || !windGain || !windLp || !rainGain) return;
  const t = ctx.currentTime;
  windGain.gain.setTargetAtTime(0.012 + wind * 0.075, t, 0.6);
  windLp.frequency.setTargetAtTime(260 + wind * 620, t, 0.8);
  rainGain.gain.setTargetAtTime(rain * 0.05, t, 1.2);
}

export function stopAudio() {
  if (birdTimer) clearInterval(birdTimer);
  birdTimer = null;
  void ctx?.close();
  ctx = null;
  master = null;
  windGain = windLp = rainGain = null;
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
