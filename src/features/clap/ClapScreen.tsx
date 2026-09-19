// Studio clapperboard: high-contrast production slate, live timecode,
// and an audible sync cue with a camera-readable flash.

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import { db } from '@/data/db';
import { fireClap } from '@/lib/clap';
import { msToTC } from '@/lib/timecode';
import type { Take } from '@/data/types';

export default function ClapScreen() {
  const { id } = useParams();
  const pid = Number(id);
  const project = useLiveQuery(() => db.projects.get(pid), [pid]);
  const scenes = useLiveQuery(() => db.scenes.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const shots = useLiveQuery(() => db.shots.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const takes = useLiveQuery(() => db.takes.where('projectId').equals(pid).toArray(), [pid]) ?? [];

  const activeShot = shots[shots.length - 1];
  const activeScene = scenes.find((scene) => scene.id === activeShot?.sceneId);
  const shotTakes = activeShot ? takes.filter((t) => t.shotId === activeShot.id).sort((a, b) => a.takeNumber - b.takeNumber) : [];
  const lastTake: Take | undefined = shotTakes[shotTakes.length - 1];

  const [result, setResult] = useState<{ atMs: number; localIso: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fps = project?.fps ?? 24;

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Date.now() - start), fps > 48 ? 8 : Math.floor(1000 / fps));
    return () => clearInterval(iv);
  }, [fps]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  async function handleClap() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fireClap();
      setResult(r);
      if (lastTake) {
        await db.takes.update(lastTake.id!, {
          clap: { clapAtMs: r.atMs, tcAtClap: msToTC(r.atMs - lastTake.createdAt, fps), beepDelayMs: 0 },
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  return (
    <div className="page clap-page">
      <div className="topbar clap-topbar">
        <span className="brand">SLATE / CLAPPER</span>
        <span className="dim">{project?.title ?? '…'}</span>
        <button className="btn btn-sm" onClick={toggleFullscreen}>{fullscreen ? 'Exit full screen' : 'Full screen'}</button>
      </div>

      <div className="page-inner clap-body">
        <div className="slate production-slate">
          <div className="slate-heading">
            <div className="slate-production">{project?.company || 'PRODUCTION'}</div>
            <div className="slate-title">{project?.title || 'UNTITLED PROJECT'}</div>
          </div>
          <div className="slate-meta">
            <span>DIR. <b>{project?.director || '—'}</b></span>
            <span>PROD. <b>{project?.producer || '—'}</b></span>
            <span>UNIT <b>{project?.unit || 'MAIN'}</b></span>
          </div>
          <div className="slate-grid slate-grid-large">
            <span>DATE</span><b>{new Date().toLocaleDateString()}</b>
            <span>SCENE</span><b>{activeScene?.number ?? '—'}</b>
            <span>SLUGLINE</span><b>{activeScene?.slugline ?? '—'}</b>
            <span>SHOT</span><b>{activeShot?.number ?? '—'} · {activeShot?.size ?? '—'}</b>
            <span>TAKE</span><b>{lastTake?.takeNumber ?? shotTakes.length + 1}</b>
            <span>ROLL / SOUND</span><b>{activeScene?.order ?? '—'} / {lastTake?.soundRoll || '—'}</b>
            <span>CAMERA</span><b>{project?.camera || '—'}</b>
            <span>LENS / FORMAT</span><b>{activeShot?.lens || '—'} / {activeShot?.format || '—'}</b>
            <span>RATE / ASPECT</span><b>{activeShot?.fps ?? fps}fps / {activeShot?.aspect || '—'}</b>
            <span>INT / EXT · DAY / NIGHT</span><b>{activeScene ? `${activeScene.intExt} · ${activeScene.dayNight}` : '—'}</b>
          </div>
          <div className="tc-line">{msToTC(elapsed, fps)}</div>
          <div className="slate-footer">{activeShot?.move || '—'} · {lastTake?.mos ? 'MOS' : 'SYNC SOUND'}{lastTake?.wait ? ' · WAIT' : ''}</div>
          <div className="slate-sync">SYNC POINT: PRESS CLAP — AUDIBLE CUE + FLASH</div>
        </div>

        <button className="btn clap-btn" onClick={handleClap} disabled={busy || !activeShot}>
          <span>{busy ? 'CLAPPING…' : 'CLAP'}</span>
          <small>{activeShot ? `TAKE ${lastTake?.takeNumber ?? shotTakes.length + 1}` : 'ADD A SHOT FIRST'}</small>
        </button>

        {result && (
          <div className="card clap-result">
            <div className="card-title">Sync cue fired</div>
            <div className="card-sub">{result.localIso}</div>
            <div className="card-sub dim">{result.atMs} ms UTC · audible cue + flash</div>
          </div>
        )}

        <div id="clap-flash" />
      </div>
    </div>
  );
}
