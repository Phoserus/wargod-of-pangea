// Minimal Web Audio based audio system (zero deps).
// Provides SFX beeps and a simple looping music tone. Respects settings via applySettings.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicOsc: OscillatorNode | null = null;

function ensure(): void {
  if (ctx) return;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(ctx.destination);
}

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

export function applySettings(s: AudioSettings): void {
  ensure();
  if (!ctx || !masterGain || !musicGain || !sfxGain) return;
  masterGain.gain.value = s.master;
  musicGain.gain.value = s.muteMusic ? 0 : s.music;
  sfxGain.gain.value = s.muteSfx ? 0 : s.sfx;
}

export function playSfx(freq = 440, durationMs = 80): void {
  ensure();
  if (!ctx || !sfxGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(sfxGain);
  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

export function startMusic(freq = 220): void {
  ensure();
  stopMusic();
  if (!ctx || !musicGain) return;
  musicOsc = ctx.createOscillator();
  musicOsc.frequency.value = freq;
  musicOsc.connect(musicGain);
  musicOsc.start();
}

export function stopMusic(): void {
  if (musicOsc) {
    try {
      musicOsc.stop();
    } catch {
      // ignore
    }
    musicOsc.disconnect();
    musicOsc = null;
  }
}
