/**
 * Tiny Web Audio synth SFX engine. No external assets, no network.
 * Toggle via setSfxEnabled(); state persisted to localStorage as "narf.sfx.on".
 *
 * Listen for changes with onSfxChange(cb).
 */

const KEY = "narf.sfx.on";
let enabled = typeof window !== "undefined" ? localStorage.getItem(KEY) !== "0" : true;
const listeners = new Set<(on: boolean) => void>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isSfxEnabled() {
  return enabled;
}
export function setSfxEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l(on));
  if (on) ensure();
}
export function onSfxChange(cb: (on: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function tone({
  freq,
  endFreq,
  type = "sine",
  dur = 0.18,
  vol = 0.25,
  attack = 0.005,
  release = 0.08,
  delay = 0,
}: {
  freq: number;
  endFreq?: number;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  attack?: number;
  release?: number;
  delay?: number;
}) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

function noise({
  dur = 0.2,
  vol = 0.15,
  filterFreq = 1200,
  q = 1,
  delay = 0,
}: {
  dur?: number;
  vol?: number;
  filterFreq?: number;
  q?: number;
  delay?: number;
}) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = filterFreq;
  filt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  click() {
    if (!enabled) return;
    tone({ freq: 880, endFreq: 660, type: "square", dur: 0.04, vol: 0.08, release: 0.04 });
  },
  hover() {
    if (!enabled) return;
    tone({ freq: 1200, type: "sine", dur: 0.03, vol: 0.04, release: 0.03 });
  },
  alert() {
    if (!enabled) return;
    // Klaxon: two falling sirens
    tone({ freq: 880, endFreq: 480, type: "sawtooth", dur: 0.35, vol: 0.18, release: 0.06 });
    tone({ freq: 880, endFreq: 480, type: "sawtooth", dur: 0.35, vol: 0.18, release: 0.06, delay: 0.42 });
  },
  warn() {
    if (!enabled) return;
    tone({ freq: 620, type: "triangle", dur: 0.12, vol: 0.18, release: 0.08 });
    tone({ freq: 620, type: "triangle", dur: 0.12, vol: 0.18, release: 0.08, delay: 0.16 });
  },
  deploy() {
    if (!enabled) return;
    tone({ freq: 220, endFreq: 60, type: "sawtooth", dur: 0.5, vol: 0.16, release: 0.2 });
    noise({ dur: 0.45, vol: 0.08, filterFreq: 800, q: 2 });
  },
  impact() {
    if (!enabled) return;
    tone({ freq: 90, endFreq: 35, type: "sine", dur: 0.35, vol: 0.45, release: 0.25 });
    noise({ dur: 0.3, vol: 0.25, filterFreq: 200, q: 0.7 });
  },
  unlock() {
    if (!enabled) return;
    tone({ freq: 660, type: "sine", dur: 0.1, vol: 0.18, release: 0.08 });
    tone({ freq: 990, type: "sine", dur: 0.14, vol: 0.2, release: 0.1, delay: 0.1 });
    tone({ freq: 1320, type: "sine", dur: 0.2, vol: 0.22, release: 0.15, delay: 0.22 });
  },
  coin() {
    if (!enabled) return;
    tone({ freq: 1240, type: "triangle", dur: 0.06, vol: 0.18, release: 0.05 });
    tone({ freq: 1860, type: "triangle", dur: 0.1, vol: 0.18, release: 0.08, delay: 0.05 });
  },
  /** Fire — low crackling rumble with sub-bass body. */
  fire() {
    if (!enabled) return;
    // Low rumble body
    tone({ freq: 70, endFreq: 45, type: "sine", dur: 1.2, vol: 0.32, release: 0.4 });
    tone({ freq: 110, endFreq: 60, type: "sawtooth", dur: 1.0, vol: 0.12, release: 0.3 });
    // Layered crackle: short noise bursts through a low-pass-ish band filter
    for (let i = 0; i < 14; i++) {
      noise({
        dur: 0.05 + Math.random() * 0.08,
        vol: 0.08 + Math.random() * 0.1,
        filterFreq: 400 + Math.random() * 1600,
        q: 0.8,
        delay: Math.random() * 1.1,
      });
    }
  },
  /** Biological — eerie droning hum, two detuned sines + slow noise wash. */
  bio() {
    if (!enabled) return;
    tone({ freq: 138, type: "sine", dur: 1.6, vol: 0.18, attack: 0.3, release: 0.6 });
    tone({ freq: 142, type: "sine", dur: 1.6, vol: 0.18, attack: 0.3, release: 0.6 });
    tone({ freq: 207, type: "triangle", dur: 1.4, vol: 0.1, attack: 0.4, release: 0.5, delay: 0.1 });
    // Breathy wash
    noise({ dur: 1.6, vol: 0.05, filterFreq: 600, q: 4 });
  },
  /** EM — sharp electrical zap with static tail. */
  em() {
    if (!enabled) return;
    // Initial zap: square sweep
    tone({ freq: 2200, endFreq: 180, type: "square", dur: 0.18, vol: 0.22, attack: 0.001, release: 0.05 });
    tone({ freq: 3300, endFreq: 240, type: "sawtooth", dur: 0.16, vol: 0.16, attack: 0.001, release: 0.05 });
    // Static crackle tail
    noise({ dur: 0.45, vol: 0.18, filterFreq: 3200, q: 2, delay: 0.05 });
    noise({ dur: 0.3, vol: 0.1, filterFreq: 1800, q: 1.4, delay: 0.18 });
  },
  /** Geological — deep rumble + low sub-bass. */
  geo() {
    if (!enabled) return;
    tone({ freq: 55, endFreq: 30, type: "sine", dur: 1.6, vol: 0.45, release: 0.6 });
    tone({ freq: 80, endFreq: 40, type: "sawtooth", dur: 1.2, vol: 0.18, release: 0.4 });
    noise({ dur: 1.6, vol: 0.22, filterFreq: 180, q: 0.7 });
    noise({ dur: 1.0, vol: 0.12, filterFreq: 90, q: 0.6, delay: 0.4 });
  },
  /** Cosmic — deep impact boom with long reverb tail. */
  cosmic() {
    if (!enabled) return;
    tone({ freq: 140, endFreq: 35, type: "sine", dur: 1.8, vol: 0.5, attack: 0.001, release: 0.8 });
    tone({ freq: 220, endFreq: 60, type: "triangle", dur: 1.4, vol: 0.2, release: 0.6 });
    noise({ dur: 0.4, vol: 0.35, filterFreq: 1200, q: 0.6 });
    // Reverb-ish trailing noise tail
    noise({ dur: 1.6, vol: 0.1, filterFreq: 400, q: 0.5, delay: 0.2 });
    noise({ dur: 1.2, vol: 0.06, filterFreq: 250, q: 0.5, delay: 0.6 });
  },
  /** Atmospheric — howling wind (filtered noise sweep). */
  atmo() {
    if (!enabled) return;
    noise({ dur: 2.0, vol: 0.28, filterFreq: 700, q: 6 });
    noise({ dur: 1.8, vol: 0.18, filterFreq: 1400, q: 5, delay: 0.2 });
    tone({ freq: 320, endFreq: 180, type: "sine", dur: 1.6, vol: 0.06, attack: 0.4, release: 0.6 });
  },
  /** Hydrological — rushing water (high-passed noise + bubble tones). */
  hydro() {
    if (!enabled) return;
    noise({ dur: 1.8, vol: 0.3, filterFreq: 2200, q: 0.6 });
    noise({ dur: 1.4, vol: 0.18, filterFreq: 4000, q: 0.5, delay: 0.2 });
    tone({ freq: 220, endFreq: 110, type: "sine", dur: 0.6, vol: 0.1, delay: 0.1 });
    tone({ freq: 180, endFreq: 90, type: "sine", dur: 0.5, vol: 0.08, delay: 0.5 });
  },
  /** Long-term / slow burn — distant ominous drone. */
  slow() {
    if (!enabled) return;
    tone({ freq: 65, type: "sine", dur: 2.4, vol: 0.22, attack: 0.6, release: 1.0 });
    tone({ freq: 97, type: "triangle", dur: 2.4, vol: 0.12, attack: 0.6, release: 1.0 });
    noise({ dur: 2.4, vol: 0.05, filterFreq: 500, q: 3 });
  },
};

/** Call once on first user gesture to satisfy autoplay policies. */
export function unlockAudio() {
  ensure();
}

/* ────────────────────────────────────────────────────────────────────
 * Ambient hum — a low, evolving drone played while in Terra view.
 * Returns a stop() function. Safe no-op on SSR or when audio disabled.
 * ──────────────────────────────────────────────────────────────────── */
export function startAmbientHum(): () => void {
  const c = ensure();
  if (!c || !master || !enabled) return () => {};
  const t0 = c.currentTime;
  const bus = c.createGain();
  bus.gain.setValueAtTime(0.0001, t0);
  bus.gain.linearRampToValueAtTime(0.18, t0 + 1.6);
  bus.connect(master);

  const o1 = c.createOscillator();
  o1.type = "sine";
  o1.frequency.value = 55;
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.value = 56.4;
  const o3 = c.createOscillator();
  o3.type = "triangle";
  o3.frequency.value = 110;

  const g3 = c.createGain();
  g3.gain.value = 0.12;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;

  o1.connect(lp);
  o2.connect(lp);
  o3.connect(g3).connect(lp);
  lp.connect(bus);

  // Slow LFO on the lowpass for "breathing" movement.
  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 120;
  lfo.connect(lfoGain).connect(lp.frequency);

  o1.start();
  o2.start();
  o3.start();
  lfo.start();

  return () => {
    try {
      const now = c.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      o1.stop(now + 0.7);
      o2.stop(now + 0.7);
      o3.stop(now + 0.7);
      lfo.stop(now + 0.7);
      setTimeout(() => bus.disconnect(), 900);
    } catch {}
  };
}