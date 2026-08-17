let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.stop(ac.currentTime + dur);
}

export function playWheelTick() {
  beep(880 + Math.random() * 80, 0.035, "square", 0.03);
}

export function playWinSting() {
  beep(523, 0.12, "triangle", 0.06);
  window.setTimeout(() => beep(659, 0.12, "triangle", 0.06), 90);
  window.setTimeout(() => beep(784, 0.22, "triangle", 0.07), 180);
}

export function playFlip() {
  beep(240, 0.08, "sawtooth", 0.04);
}
