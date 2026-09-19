// Timecode helpers. Timecode = hh:mm:ss:ff at an fps with non-drop (ND) display.
// Internally everything is a count of frames; the "wall clock" is a separate sync anchor.

export function framesToTC(frames: number, fps: number): string {
  const f = Math.max(0, Math.round(frames));
  const F = fps;
  const totalSec = Math.floor(f / F);
  const ff = f % F;
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

export function tcToFrames(tc: string, fps: number): number {
  const parts = tc.split(':').map((n) => parseInt(n, 10) || 0);
  const [hh = 0, mm = 0, ss = 0, ff = 0] = parts;
  return ((hh * 3600 + mm * 60 + ss) * fps) + ff;
}

// Convert a wall-clock ms duration back into "frames elapsed" for a given rate,
// truncating to whole frames (a take's TC is usually defined at the recorder).
export function msToFrames(ms: number, fps: number): number {
  return Math.floor((ms / 1000) * fps);
}

// Format an elapsed ms as hh:mm:ss for the set dashboard.
export function msToHMS(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${hh}:${p(mm)}:${p(ss)}`;
}

// Convert an elapsed wall-clock duration (ms) into hh:mm:ss:ff at a given fps.
export function msToTC(ms: number, fps: number): string {
  return framesToTC(msToFrames(ms, fps), fps);
}
