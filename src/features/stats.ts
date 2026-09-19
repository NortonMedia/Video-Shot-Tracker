// Pure roll-up used by the project dashboard. Nothing here touches IndexedDB,
// keeping it trivially unit-testable.

import type { Shot, Scene, Take, ShootDay } from '@/data/types';

export interface Rollup {
  shots: number;
  prints: number;
  done: number;
  started: number;
  shotPct: number;
  scenes: number;
  scenesDone: number;
  scenePct: number;
  pages: number;
  pagesShot: number;
  takes: number;
  printTakes: number;
  printRate: number;
  days: number;
  daysLogged: number;
  updatedAt: number;
  nextSlate: string;
}

export function rollup(
  shots: Shot[],
  scenes: Scene[],
  takes: Take[],
  days: ShootDay[],
): Rollup {
  const total = shots.length;
  const started = shots.filter((s) => s.status !== 'NOT_STARTED').length;
  const prints = shots.filter((s) => s.status === 'PRINT').length;
  const done = shots.filter((s) => s.status === 'PRINT' || s.status === 'CUT').length;

  const scenesTotal = scenes.length;
  const scenesDone = scenes.filter((s) => s.status === 'DONE').length;

  const pagesAll = scenes.reduce((sum, s) => sum + (s.pages ?? 0), 0);
  const pagesShot = scenes
    .filter((s) => s.status === 'DONE')
    .reduce((sum, s) => sum + (s.pages ?? 0), 0);

  const takesTotal = takes.length;
  const printTakes = takes.filter((t) => t.verdict === 'PRINT').length;

  const daysTotal = days.length;
  const daysLogged = days.filter((d) => d.wrapTime).length;

  const lastT = takes.map((t) => t.createdAt ?? 0);
  const lastS = shots.map((s) => s.createdAt ?? 0);
  const lastD = days.map((d) => +new Date(d.date) || 0);

  const nextShot = [...shots]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .find((s) => s.status === 'NOT_STARTED');
  const nextScene = nextShot
    ? scenes.find((sc) => sc.id === nextShot.sceneId)
    : undefined;

  return {
    shots: total,
    prints,
    done,
    started,
    shotPct: total ? Math.round((prints / total) * 100) : 0,
    scenes: scenesTotal,
    scenesDone,
    scenePct: scenesTotal ? Math.round((scenesDone / scenesTotal) * 100) : 0,
    pages: pagesAll,
    pagesShot,
    takes: takesTotal,
    printTakes,
    printRate: takesTotal ? Math.round((printTakes / takesTotal) * 100) : 0,
    days: daysTotal,
    daysLogged,
    updatedAt: Math.max(0, ...lastT, ...lastS, ...lastD),
    nextSlate: nextShot && nextScene ? `${nextScene.number} ${nextShot.number}` : '—',
  };
}
