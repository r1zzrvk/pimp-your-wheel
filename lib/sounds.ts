const STORAGE_KEY = "pyw-sounds";

let context: AudioContext | null = null;
let lastClickAt = 0;
let enabled = true;
let loaded = false;
const listeners = new Set<() => void>();

function readSetting() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  enabled = localStorage.getItem(STORAGE_KEY) !== "off";
}

export function soundsEnabled() {
  readSetting();
  return enabled;
}

export function subscribeSounds(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSoundsEnabled(next: boolean) {
  enabled = next;
  loaded = true;
  localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  for (const listener of listeners) listener();
}

function audio() {
  if (typeof window === "undefined") return null;
  readSetting();
  if (!enabled) return null;
  if (!context) context = new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function blip(frequency: number, level: number, duration: number) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const tone = ctx.createOscillator();
  const gain = ctx.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(frequency, now);
  tone.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.75), now + duration);
  gain.gain.setValueAtTime(level, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  tone.connect(gain);
  gain.connect(ctx.destination);
  tone.start(now);
  tone.stop(now + duration + 0.01);
}

export function playButton() {
  blip(880, 0.05, 0.045);
}

export function playMenu() {
  blip(620, 0.022, 0.03);
}

export function primeSounds() {
  audio();
}

export function playSpinWhoosh(quick = false) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const duration = quick ? 0.1 : 0.2;
  const tone = ctx.createOscillator();
  const gain = ctx.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(quick ? 240 : 320, now);
  tone.frequency.exponentialRampToValueAtTime(90, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.02, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  tone.connect(gain);
  gain.connect(ctx.destination);
  tone.start(now);
  tone.stop(now + duration + 0.02);
}

export function playPointerClick() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gap = now - lastClickAt;
  if (gap < 0.09) return;
  lastClickAt = now;
  const loud = Math.min(1, Math.max(0, (gap - 0.09) / 0.14));
  const level = 0.035 + loud * 0.09;

  const knock = ctx.createOscillator();
  const knockGain = ctx.createGain();
  knock.type = "triangle";
  knock.frequency.setValueAtTime(240, now);
  knock.frequency.exponentialRampToValueAtTime(70, now + 0.045);
  knockGain.gain.setValueAtTime(level, now);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  knock.connect(knockGain);
  knockGain.connect(ctx.destination);
  knock.start(now);
  knock.stop(now + 0.055);
}

function chime(frequencies: number[], step: number, level: number) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  frequencies.forEach((frequency, index) => {
    const start = now + index * step;
    const tone = ctx.createOscillator();
    const gain = ctx.createGain();
    tone.type = "sine";
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    tone.connect(gain);
    gain.connect(ctx.destination);
    tone.start(start);
    tone.stop(start + 0.24);
  });
}

export function playCoinWin() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  [1046, 1318, 1568].forEach((frequency, index) => {
    const start = now + index * 0.07;
    [1, 2.7].forEach((ratio) => {
      const tone = ctx.createOscillator();
      const gain = ctx.createGain();
      tone.type = "sine";
      tone.frequency.value = frequency * ratio;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(ratio === 1 ? 0.03 : 0.01, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      tone.connect(gain);
      gain.connect(ctx.destination);
      tone.start(start);
      tone.stop(start + 0.22);
    });
  });
}

export function playLoss() {
  chime([494, 370, 247], 0.1, 0.04);
}

export function playBonus() {
  chime([659, 784, 988, 1318], 0.055, 0.04);
}
