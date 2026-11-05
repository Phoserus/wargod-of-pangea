// Procedural audio (Web Audio, no asset files, so no licences to track). Swap in sampled assets
// behind the same `sfx()` / `setScene()` API when real ones exist.

export type SfxName =
  "click" | "dig" | "hit" | "miss" | "hurt" | "eat" | "win" | "lose" | "levelup" | "coin";
export type Scene = "menu" | "work" | "combat" | "none";

interface Tone {
  freq: number;
  /** Frequency to glide to over the tone's duration. */
  to?: number;
  dur: number;
  delay?: number;
  type?: OscillatorType;
  gain?: number;
}

export const SFX: Record<SfxName, Tone[]> = {
  click: [{ freq: 520, dur: 0.05, type: "square", gain: 0.08 }],
  dig: [{ freq: 180, to: 90, dur: 0.12, type: "sawtooth", gain: 0.15 }],
  hit: [
    { freq: 220, to: 70, dur: 0.15, type: "sawtooth", gain: 0.22 },
    { freq: 110, to: 40, dur: 0.2, type: "square", gain: 0.15 },
  ],
  miss: [{ freq: 400, to: 250, dur: 0.12, type: "triangle", gain: 0.1 }],
  hurt: [{ freq: 150, to: 60, dur: 0.22, type: "square", gain: 0.2 }],
  eat: [
    { freq: 330, dur: 0.07, type: "triangle", gain: 0.15 },
    { freq: 440, dur: 0.09, delay: 0.08, type: "triangle", gain: 0.15 },
  ],
  win: [
    { freq: 392, dur: 0.12, type: "triangle", gain: 0.18 },
    { freq: 494, dur: 0.12, delay: 0.12, type: "triangle", gain: 0.18 },
    { freq: 587, dur: 0.25, delay: 0.24, type: "triangle", gain: 0.18 },
  ],
  lose: [
    { freq: 300, to: 200, dur: 0.2, type: "triangle", gain: 0.18 },
    { freq: 200, to: 120, dur: 0.35, delay: 0.2, type: "triangle", gain: 0.18 },
  ],
  levelup: [
    { freq: 392, dur: 0.1, type: "square", gain: 0.12 },
    { freq: 523, dur: 0.1, delay: 0.1, type: "square", gain: 0.12 },
    { freq: 659, dur: 0.1, delay: 0.2, type: "square", gain: 0.12 },
    { freq: 784, dur: 0.4, delay: 0.3, type: "square", gain: 0.12 },
  ],
  coin: [
    { freq: 988, dur: 0.06, type: "square", gain: 0.1 },
    { freq: 1319, dur: 0.18, delay: 0.06, type: "square", gain: 0.1 },
  ],
};

/** Each scene loops a short phrase of semitone offsets above a root; null is a rest. */
export const SCENES: Record<
  Exclude<Scene, "none">,
  { root: number; stepMs: number; notes: (number | null)[]; type: OscillatorType }
> = {
  menu: { root: 110, stepMs: 600, notes: [0, null, 7, null, 3, null, 5, null], type: "triangle" },
  work: { root: 147, stepMs: 450, notes: [0, 4, 7, 4, 0, 5, 9, 5], type: "triangle" },
  combat: { root: 98, stepMs: 280, notes: [0, 0, 3, 0, 5, 0, 3, 1], type: "sawtooth" },
};

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let sceneTimer: ReturnType<typeof setInterval> | undefined;
let currentScene: Scene = "none";
let pending: AudioSettings | null = null;

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

function ramp(g: GainNode, value: number): void {
  g.gain.setTargetAtTime(value, g.context.currentTime, 0.03);
}

/** Safe to call before the audio context exists; the values are applied once it is created. */
export function applySettings(s: AudioSettings): void {
  pending = s;
  if (!ctx || !masterGain || !musicGain || !sfxGain) return;
  ramp(masterGain, s.master);
  ramp(musicGain, s.muteMusic ? 0 : s.music);
  ramp(sfxGain, s.muteSfx ? 0 : s.sfx);
}

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(ctx.destination);
  if (pending) applySettings(pending);
  return ctx;
}

/** Browsers only allow audio after a gesture: call from the first click/key press. */
export function unlockAudio(): void {
  const c = ensure();
  if (c && c.state === "suspended") void c.resume();
}

function playTone(c: AudioContext, out: AudioNode, t: Tone, at: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = t.type ?? "sine";
  osc.frequency.setValueAtTime(t.freq, at);
  if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, at + t.dur);
  g.gain.setValueAtTime(t.gain ?? 0.15, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + t.dur);
  osc.connect(g);
  g.connect(out);
  osc.start(at);
  osc.stop(at + t.dur + 0.02);
}

export function sfx(name: SfxName): void {
  const c = ctx;
  if (!c || !sfxGain || c.state !== "running") return;
  const now = c.currentTime;
  for (const tone of SFX[name]) playTone(c, sfxGain, tone, now + (tone.delay ?? 0));
}

export function stopMusic(): void {
  if (sceneTimer !== undefined) clearInterval(sceneTimer);
  sceneTimer = undefined;
  currentScene = "none";
}

/** Loops the scene's phrase; switching to the same scene is a no-op. */
export function setScene(scene: Scene): void {
  if (scene === currentScene) return;
  stopMusic();
  if (scene === "none") return;
  currentScene = scene;
  const def = SCENES[scene];
  let step = 0;
  sceneTimer = setInterval(() => {
    const c = ctx;
    if (!c || !musicGain || c.state !== "running") return;
    const n = def.notes[step++ % def.notes.length];
    if (n === null) return;
    playTone(
      c,
      musicGain,
      { freq: def.root * 2 ** (n / 12), dur: (def.stepMs / 1000) * 0.9, type: def.type, gain: 0.1 },
      c.currentTime,
    );
  }, def.stepMs);
}
