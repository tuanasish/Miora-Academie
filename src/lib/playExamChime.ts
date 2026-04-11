"use client";

/** Shared context so we can resume after browser suspend between user gesture and chime. */
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  return sharedCtx;
}

/**
 * Short bell-like chime for speaking exam phase boundaries.
 * - prepEnd: higher two-tone (fin 2:00 préparation → début parole)
 * - sessionEnd: lower two-tone (fin 3:30 T2 ou fin 4:30 T3)
 */
export async function playExamChime(kind: "prepEnd" | "sessionEnd") {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    await ctx.resume();
  } catch {
    return;
  }

  const now = ctx.currentTime;
  const pair =
    kind === "prepEnd"
      ? ([784, 988] as const) // G5 → B5
      : ([392, 523.25] as const); // G4 → C5

  pair.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t0 = now + i * 0.12;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
    osc.start(t0);
    osc.stop(t0 + 0.48);
  });
}
