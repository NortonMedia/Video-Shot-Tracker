import test from 'node:test';
import assert from 'node:assert/strict';
import { framesToTC, tcToFrames, msToTC, msToHMS } from '../src/lib/timecode.ts';
import { rollup } from '../src/features/stats.ts';
import { fireClap } from '../src/lib/clap.ts';

test('timecode conversions round-trip frames and wall-clock durations', () => {
  assert.equal(framesToTC(0, 24), '00:00:00:00');
  assert.equal(framesToTC(25, 24), '00:00:01:01');
  assert.equal(tcToFrames('01:02:03:04', 24), 89356);
  assert.equal(msToTC(1500, 24), '00:00:01:12');
  assert.equal(msToHMS(3723000), '1:02:03');
});

test('rollup calculates shot, scene, take, and day progress', () => {
  const scenes = [
    { id: 1, number: '1', status: 'DONE', pages: 2 },
    { id: 2, number: '2', status: 'NOT_STARTED', pages: 1 },
  ];
  const shots = [
    { id: 1, sceneId: 1, number: '1', order: 1, status: 'PRINT', createdAt: 10 },
    { id: 2, sceneId: 2, number: '2', order: 2, status: 'NOT_STARTED', createdAt: 20 },
  ];
  const takes = [{ verdict: 'PRINT', createdAt: 30 }];
  const days = [{ date: '2026-01-01', wrapTime: '18:00' }];
  const result = rollup(shots, scenes, takes, days);
  assert.deepEqual({ shots: result.shots, prints: result.prints, scenesDone: result.scenesDone, printRate: result.printRate, daysLogged: result.daysLogged, nextSlate: result.nextSlate }, { shots: 2, prints: 1, scenesDone: 1, printRate: 100, daysLogged: 1, nextSlate: '2 2' });
});

test('fireClap returns a UTC timestamp without requiring audio or DOM', async () => {
  const before = Date.now();
  const result = await fireClap({ tone: false, flash: false });
  assert.ok(result.atMs >= before);
  assert.equal(result.localIso, new Date(result.atMs).toISOString());
});
