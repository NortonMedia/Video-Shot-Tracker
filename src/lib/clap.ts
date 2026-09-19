// Digital clapperboard: audible beep, full-screen white flash, and a precise
// millisecond UTC stamp — the on-screen equivalent of a physical slate.

export interface ClapResult {
  atMs: number;      // epoch ms (UTC) at the clap instant
  localIso: string;  // local-clock ISO for the slate display
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

export async function fireClap(opts?: {
  tone?: boolean;   // beep on (default true)
  flash?: boolean;  // white flash on (default true)
  flashMs?: number; // flash duration in ms (default 90)
}): Promise<ClapResult> {
  const tone = opts?.tone ?? true;
  const flash = opts?.flash ?? true;
  const flashMs = opts?.flashMs ?? 90;

  // Stamp at the instant the clap fires. Date.now() is ms-precise on modern
  // devices and stays meaningful even if the audio path is blocked.
  const atMs = Date.now();

  if (tone) {
    try {
      const ac = getCtx();
      await ac.resume();
      const t0 = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      // A short, bright two-part click is easier to find on production audio
      // than a soft sine beep while remaining safe for device speakers.
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, t0);
      osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.035);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.075);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 0.1);
    } catch {
      /* audio unavailable (e.g. autoplay policy) — flash only */
    }
  }

  if (flash) {
    const el = document.getElementById('clap-flash');
    if (el) {
      el.style.transition = 'none';
      el.style.opacity = '1';
      void el.offsetWidth; // force reflow so rapid re-claps still flash
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${flashMs}ms ease-out`;
        el.style.opacity = '0';
      });
    }
  }

  return { atMs, localIso: new Date(atMs).toISOString() };
}
