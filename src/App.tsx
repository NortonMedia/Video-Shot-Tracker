import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Route, Routes, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '@/data/db';
import { fireClap } from '@/lib/clap';
import type { Project, Scene, SceneStatus, Shot, ShotStatus, Take, TakeClap, TakeVerdict, ShootDay } from '@/data/types';
import { SHOT_STATUSES } from '@/data/types';
import ClapScreen from '@/features/clap/ClapScreen';
import DashboardView from '@/features/dashboard/DashboardView';

const blankProject = (): Project => ({
  title: '', company: '', director: '', producer: '',
  unit: '', status: 'ACTIVE', fps: 24, createdAt: Date.now(), updatedAt: Date.now(),
});

/* ------------------------------------------------------------------ topbar */
function Topbar({ project }: { project?: Project }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasBack = location.pathname !== '/';
  const backTarget = /\/p\/\d+\/(clap|dashboard)$/.test(location.pathname) && project?.id ? `/p/${project.id}` : '/';

  return (
    <header className="topbar">
      {hasBack && <button className="back-btn" onClick={() => navigate(backTarget)} aria-label="Go back">← <span>Back</span></button>}
      <span className="brand"><span className="dot">■</span>SLATE</span>
      <nav>
        <Link to="/">Projects</Link>
        {project && <Link to={`/p/${project.id}`}>Board</Link>}
        {project && <Link to={`/p/${project.id}/clap`}>Clap</Link>}
        {project && <Link to={`/p/${project.id}/dashboard`}>Dashboard</Link>}
      </nav>
    </header>
  );
}

/* --------------------------------------------------------- project editor */
export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/p/:id" element={<ProjectDetail />} />
        <Route path="/p/:id/clap" element={<ClapScreen />} />
        <Route path="/p/:id/dashboard" element={<DashboardView />} />
      </Routes>
    </div>
  );
}

/* --------------------------------------------------------- project list */
function ProjectList() {
  const projects = useLiveQuery(() => db.projects.reverse().toArray(), []) ?? [];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Project>(blankProject());

  async function save() {
    if (!draft.title.trim()) return;
    await (draft.id ? db.projects.update(draft.id, draft) : db.projects.add(draft));
    setEditing(false);
    setDraft(blankProject());
  }

  return (
    <div className="page">
      <div className="topbar">
        <span className="brand">SLATE</span>
        <button className="btn btn-primary" onClick={() => { setEditing(true); setDraft(blankProject()); }}>+ Project</button>
      </div>
      <div className="page-inner">
        {projects.map((p) => (
          <Link key={p.id} to={`/p/${p.id}`} className="card block">
            <div className="card-head">
              <div className="card-title">{p.title}</div>
              <span className="status-pill">{p.status}</span>
            </div>
            <div className="card-sub">{p.company && `${p.company} · `}{p.director && `dir. ${p.director} · `}{p.fps} fps</div>
          </Link>
        ))}
        {projects.length === 0 && <div className="empty-state card"><div className="empty-state-mark">◫</div><h2>Start your first production</h2><p>Create a project to organize scenes, shots, takes, crew notes, and your digital clapperboard.</p><button className="btn btn-primary" onClick={() => { setEditing(true); setDraft(blankProject()); }}>+ Create project</button></div>}
        {editing && (
          <div className="modal-backdrop" onClick={() => setEditing(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{draft.id ? 'Edit' : 'New'} Project</h3>
              <div className="field"><label>Title</label><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus /></div>
              <div className="row">
                <div className="field"><label>Company</label><input value={draft.company ?? ''} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></div>
                <div className="field"><label>Director</label><input value={draft.director ?? ''} onChange={(e) => setDraft({ ...draft, director: e.target.value })} /></div>
              </div>
              <div className="row">
                <div className="field"><label>FPS</label><select value={draft.fps} onChange={(e) => setDraft({ ...draft, fps: +e.target.value })}>{fpsOptions.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="field"><label>Unit</label><input value={draft.unit ?? ''} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="2nd Unit" /></div>
              </div>
              <div className="row"><button className="btn btn-block" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary btn-block" onClick={save}>Save</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- project detail */
function ProjectDetail() {
  const { id } = useParams();
  const pid = Number(id);
  const project = useLiveQuery(() => db.projects.get(pid), [pid]);
  const scenes = useLiveQuery(() => db.scenes.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const shots = useLiveQuery(() => db.shots.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const takes = useLiveQuery(() => db.takes.where('projectId').equals(pid).toArray(), [pid]) ?? [];
  const days = useLiveQuery(() => db.shootDays.where('projectId').equals(pid).toArray(), [pid]) ?? [];

  const [activeSceneId, setActiveSceneId] = useState<number | undefined>();
  const [activeShotId, setActiveShotId] = useState<number | undefined>();
  const navigate = useNavigate();
  const [showShotForm, setShowShotForm] = useState(false);
  const [shotDraft, setShotDraft] = useState({ size: 'WS', move: 'STATIC' });
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [sceneDraft, setSceneDraft] = useState({ slugline: '', intExt: 'INT' as string, dayNight: 'DAY' as string });
  const [showDayForm, setShowDayForm] = useState(false);
  const [dayDraft, setDayDraft] = useState({ date: new Date().toISOString().slice(0, 10), callTime: '', wrapTime: '', weather: '', location: '', crew: '', notes: '' });

  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneShots = shots.filter((s) => s.sceneId === activeSceneId);
  const activeShot = sceneShots.find((s) => s.id === activeShotId);
  const shotTakes = activeShot ? takes.filter((t) => t.shotId === activeShot.id).sort((a, b) => a.takeNumber - b.takeNumber) : [];

  function openSceneForm() { setSceneDraft({ slugline: 'INT. LOCATION - DAY', intExt: 'INT', dayNight: 'DAY' }); setShowSceneForm(true); }
  async function addSceneFromForm() {
    const n = scenes.length + 1;
    const scene: Scene = { projectId: pid, order: n, number: `S${n}`, slugline: sceneDraft.slugline, intExt: sceneDraft.intExt as any, dayNight: sceneDraft.dayNight as any, pages: 1, status: 'NOT_STARTED', notes: '' };
    const sceneId = await db.scenes.add(scene);
    setActiveSceneId(sceneId);
    setShowSceneForm(false);
  }

  function openShotForm() { setShotDraft({ size: 'WS', move: 'STATIC' }); setShowShotForm(true); }
  async function addShotFromForm() {
    if (!activeScene) return;
    const next = sceneShots.length + 1;
    const shot: Shot = { projectId: pid, sceneId: activeScene.id!, order: scenes.length * 100 + next, number: `${next}`, size: shotDraft.size, move: shotDraft.move, lens: '', format: '', fps: project?.fps ?? 24, aspect: '', filters: '', status: 'NOT_STARTED', notes: '', createdAt: Date.now() };
    const shotId = await db.shots.add(shot);
    setActiveShotId(shotId);
    setShowShotForm(false);
  }

  async function nextTake() {
    if (!activeShot) return;
    const n = shotTakes.length + 1;
    const r = await fireClap();
    const take: Take = { projectId: pid, sceneId: activeScene!.id!, shotId: activeShot.id!, takeNumber: n, slate: `${activeScene!.number} / ${activeShot.number}`, verdict: 'PRINT', soundRoll: '', mos: false, wait: false, notes: '', createdAt: r.atMs, updatedAt: Date.now(), clap: { clapAtMs: r.atMs, tcAtClap: msToTC(r.atMs - activeShot.createdAt, project?.fps ?? 24), beepDelayMs: 0 } };
    await db.takes.add(take);
  }

  async function markTake(takeId: number, verdict: TakeVerdict) {
    await db.takes.update(takeId, { verdict });
  }

  function openDayForm() {
    setDayDraft({ date: new Date().toISOString().slice(0, 10), callTime: '', wrapTime: '', weather: '', location: '', crew: '', notes: '' });
    setShowDayForm(true);
  }

  async function saveDay() {
    const day: ShootDay = { projectId: pid, date: dayDraft.date, callTime: dayDraft.callTime, wrapTime: dayDraft.wrapTime, weather: dayDraft.weather, location: dayDraft.location, crew: dayDraft.crew.split(',').map((name) => name.trim()).filter(Boolean), notes: dayDraft.notes };
    await db.shootDays.add(day);
    setShowDayForm(false);
  }

  function printCallSheet() {
    window.print();
  }

  const tcRun = useTimecode(project?.fps ?? 24);
  const shotPrints = shots.filter((s) => s.status === 'PRINT').length;

  return (
    <div className="page">
      <Topbar project={project} />
      <div className="page-inner">
        <h2>{project?.title ?? '…'}</h2>
        <div className="card">
          <div className="progress-line"><span>{shotPrints}/{shots.length} shots printed</span><b>{shots.length ? Math.round(shotPrints / shots.length * 100) : 0}%</b></div>
          <div className="progress"><div className="progress-fill" style={{ width: `${shots.length ? Math.round(shotPrints / shots.length * 100) : 0}%` }} /></div>
        </div>

        <div className="row">
          {scenes.map((s) => (
            <button key={s.id} className={`chip ${activeSceneId === s.id ? 'on' : ''}`} onClick={() => { setActiveSceneId(s.id); setActiveShotId(undefined); }}>
              {s.number}
            </button>
          ))}
          <button className="chip" onClick={openSceneForm}>+ Scene</button>
        </div>

        {activeScene && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">{activeScene.slugline}</div>
              <select className={`scene-status scene-status-${activeScene.status.toLowerCase()}`} value={activeScene.status} onChange={(e) => db.scenes.update(activeScene.id!, { status: e.target.value as SceneStatus })} aria-label={`Status for scene ${activeScene.number}`}>
                {SCENE_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
            <div className="card-sub">{activeScene.intExt}. {activeScene.dayNight} · {activeScene.pages}pg</div>
            <div className="row3"><label>Slugline</label></div>
            <input value={activeScene.slugline} onChange={(e) => db.scenes.update(activeScene.id!, { slugline: e.target.value })} />
            <div className="hint">INT/EXT · location · DAY/NIGHT</div>
            <button className="btn btn-sm" onClick={openShotForm}>+ Shot</button>
          </div>
        )}

        <ul className="shot-list">
          {sceneShots.map((s) => (
            <li key={s.id} onClick={() => setActiveShotId(s.id)} style={{ background: activeShotId === s.id ? 'var(--bg-elevated)' : 'transparent' }}>
              <span className="num">{s.number}</span>
              <div><div className="card-title">{s.size} {s.move}</div><div className="card-sub">{s.lens || '—'} · {s.fps}fps</div></div>
              <span className={`status-pill ${s.status}`}>{s.status.replace('_', ' ')}</span>
            </li>
          ))}
        </ul>

        <section className="card storyboard-card">
          <div className="card-head"><div><div className="card-title">Storyboard</div><div className="card-sub">Shot beats for {activeScene?.number ?? 'the current scene'}</div></div><span className="status-pill">{sceneShots.length} frames</span></div>
          {sceneShots.length === 0 ? <div className="empty storyboard-empty">Add a shot to start blocking the scene.</div> : <div className="storyboard-strip">{sceneShots.map((shot) => <button key={shot.id} className={`storyboard-card-frame ${activeShotId === shot.id ? 'on' : ''}`} onClick={() => setActiveShotId(shot.id)}><span className="storyboard-frame"><b>{activeScene?.number}.{shot.number}</b><span>{shot.size}</span></span><span className="storyboard-caption">{shot.move}<small>{shot.lens || 'Lens TBD'}</small></span></button>)}</div>}
        </section>

        {activeShot && (
          <div className="card">
            <div className="card-head">
              <div className="card-title">Shot {activeScene?.number}.{activeShot.number}</div>
              <div className="card-sub">{activeShot.size} {activeShot.move}</div>
            </div>
            <div className="row">
              <div className="field"><label>Size</label><select value={activeShot.size} onChange={(e) => db.shots.update(activeShot.id!, { size: e.target.value })}>{SHOT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div className="field"><label>Move</label><select value={activeShot.move} onChange={(e) => db.shots.update(activeShot.id!, { move: e.target.value })}>{CAMERA_MOVES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div className="field"><label>Status</label><select value={activeShot.status} onChange={(e) => db.shots.update(activeShot.id!, { status: e.target.value as ShotStatus })}>{SHOT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div className="row">
              <div className="field"><label>Lens</label><input value={activeShot.lens ?? ''} onChange={(e) => db.shots.update(activeShot.id!, { lens: e.target.value })} placeholder="e.g. 32mm" /></div>
              <div className="field"><label>Notes</label><input value={activeShot.notes ?? ''} onChange={(e) => db.shots.update(activeShot.id!, { notes: e.target.value })} placeholder="notes" /></div>
            </div>
            <div className="slate">
              <div className="tc-line">{tcRun}</div>
              <div className="slate-grid">
                <span>SCENE</span><b>{activeScene?.number}</b>
                <span>SHOT</span><b>{activeShot.number}</b>
                <span>LENS</span><b>{activeShot.lens || '—'} @ {activeShot.fps}fps</b>
                <span>ROLL</span><b>{activeScene?.order}sound</b>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={nextTake}>⚡ Clap &amp; Roll Take {shotTakes.length + 1}</button>
            <ul className="shot-list">
              {shotTakes.map((t) => (
                <li key={t.id}>
                  <span className="num">{t.takeNumber}</span>
                  <select className={`verdict-select verdict-${t.verdict.toLowerCase()}`} value={t.verdict} onChange={(e) => markTake(t.id!, e.target.value as TakeVerdict)} aria-label={`Verdict for take ${t.takeNumber}`}>
                    <option value="UNMARKED">UNMARKED</option>
                    <option value="PRINT">PRINT</option>
                    <option value="NG">NG</option>
                    <option value="KEEPER">KEEPER</option>
                  </select>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <div className="card-title">Daybook</div>
            <div className="daybook-actions"><div className="card-sub">{days.length} day{days.length !== 1 ? 's' : ''} logged</div><button className="btn btn-sm" onClick={printCallSheet}>Print call sheet</button></div>
          </div>
          {days.length === 0 && <div className="dim">No shoot days logged yet.</div>}
          <ul className="shot-list">
            {days.map((d) => (
              <li key={d.id}>
                <div><div className="card-title">{d.date}{d.weather ? ` · ${d.weather}` : ''}{d.location ? ` · ${d.location}` : ''}</div>{d.crew && d.crew.length > 0 && <div className="card-sub">Crew: {d.crew.join(' · ')}</div>}{d.notes && <div className="card-sub">{d.notes}</div>}</div>
                <div className="card-sub">{d.callTime ? `call ${d.callTime}` : ''}{d.wrapTime ? ` → wrap ${d.wrapTime}` : ''}</div>
              </li>
            ))}
          </ul>
          <button className="btn btn-sm" onClick={openDayForm}>+ Add Day</button>
        </div>
      </div>
      <div id="clap-flash" />

      {showSceneForm && (
        <div className="modal-backdrop" onClick={() => setShowSceneForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Scene</h3>
            <div className="field"><label>Slugline</label><input autoFocus value={sceneDraft.slugline} onChange={(e) => setSceneDraft({ ...sceneDraft, slugline: e.target.value })} /></div>
            <div className="row">
              <div className="field"><label>INT/EXT</label><select value={sceneDraft.intExt} onChange={(e) => setSceneDraft({ ...sceneDraft, intExt: e.target.value })}>{INTX_EXTS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
              <div className="field"><label>Day/Night</label><select value={sceneDraft.dayNight} onChange={(e) => setSceneDraft({ ...sceneDraft, dayNight: e.target.value })}>{DAY_NIGHTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
            </div>
            <div className="row"><button className="btn" onClick={() => setShowSceneForm(false)}>Cancel</button><button className="btn btn-primary" onClick={addSceneFromForm}>Add Scene</button></div>
          </div>
        </div>
      )}

      {showShotForm && (
        <div className="modal-backdrop" onClick={() => setShowShotForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Shot</h3>
            <div className="row">
              <div className="field"><label>Size</label><select value={shotDraft.size} onChange={(e) => setShotDraft({ ...shotDraft, size: e.target.value })}>{SHOT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div className="field"><label>Move</label><select value={shotDraft.move} onChange={(e) => setShotDraft({ ...shotDraft, move: e.target.value })}>{CAMERA_MOVES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            </div>
            <div className="row"><button className="btn" onClick={() => setShowShotForm(false)}>Cancel</button><button className="btn btn-primary" onClick={addShotFromForm}>Add Shot</button></div>
          </div>
        </div>
      )}
      {showDayForm && (
        <div className="modal-backdrop" onClick={() => setShowDayForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Shoot Day</h3>
            <div className="row"><div className="field"><label>Date</label><input type="date" value={dayDraft.date} onChange={(e) => setDayDraft({ ...dayDraft, date: e.target.value })} autoFocus /></div><div className="field"><label>Location</label><input value={dayDraft.location} onChange={(e) => setDayDraft({ ...dayDraft, location: e.target.value })} placeholder="Stage / location" /></div></div>
            <div className="row"><div className="field"><label>Call time</label><input type="time" value={dayDraft.callTime} onChange={(e) => setDayDraft({ ...dayDraft, callTime: e.target.value })} /></div><div className="field"><label>Wrap time</label><input type="time" value={dayDraft.wrapTime} onChange={(e) => setDayDraft({ ...dayDraft, wrapTime: e.target.value })} /></div></div>
            <div className="row"><div className="field"><label>Weather</label><input value={dayDraft.weather} onChange={(e) => setDayDraft({ ...dayDraft, weather: e.target.value })} placeholder="Sunny, 72°F" /></div><div className="field"><label>Crew</label><input value={dayDraft.crew} onChange={(e) => setDayDraft({ ...dayDraft, crew: e.target.value })} placeholder="Names, comma separated" /></div></div>
            <div className="field"><label>Notes</label><textarea value={dayDraft.notes} onChange={(e) => setDayDraft({ ...dayDraft, notes: e.target.value })} rows={3} /></div>
            <div className="row"><button className="btn" onClick={() => setShowDayForm(false)}>Cancel</button><button className="btn btn-primary" onClick={saveDay}>Save Day</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- live timecode */
function useTimecode(fps: number) {
  const [tc, setTc] = useState('00:00:00:00');
  useEffect(() => {
    const start = Date.now();
    const tick = () => setTc(msToTC(Date.now() - start, fps));
    tick();
    const iv = setInterval(tick, fps > 48 ? 8 : Math.floor(1000 / fps));
    return () => clearInterval(iv);
  }, [fps]);
  return tc;
}

function msToTC(ms: number, fps: number): string {
  const frames = Math.floor((ms / 1000) * fps);
  const ff = frames % fps;
  const total = Math.floor(frames / fps);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

const fpsOptions = [23.976, 24, 25, 29.97, 30, 47.952, 48, 50, 59.94, 60, 120];

const SHOT_SIZES: { value: string; label: string }[] = [
  { value: 'WS', label: 'WS — Wide' }, { value: 'MS', label: 'MS — Mid' }, { value: 'CU', label: 'CU — Close' },
  { value: 'ECU', label: 'ECU — Extra Close' }, { value: 'MCU', label: 'MCU — Medium Close' },
  { value: 'XCU', label: 'XCU — Extra Close Up' }, { value: 'EST', label: 'EST — Establishing' },
  { value: 'INSERT', label: 'INSERT' }, { value: 'POV', label: 'POV' }, { value: 'OTS', label: 'OTS — Over The Shoulder' },
  { value: 'OTHER', label: 'Other' },
];
const CAMERA_MOVES: { value: string; label: string }[] = [
  { value: 'STATIC', label: 'Static' }, { value: 'HANDHELD', label: 'Handheld' }, { value: 'DOLLY_IN', label: 'Dolly In' },
  { value: 'DOLLY_OUT', label: 'Dolly Out' }, { value: 'TRAVELING', label: 'Traveling' }, { value: 'PAN', label: 'Pan' },
  { value: 'TILT', label: 'Tilt' }, { value: 'CRANE', label: 'Crane' }, { value: 'GIMBAL', label: 'Gimbal' },
  { value: 'ZOOM', label: 'Zoom' }, { value: 'OTHER', label: 'Other' },
];
const INTX_EXTS: { value: string; label: string }[] = [
  { value: 'INT', label: 'INT' }, { value: 'EXT', label: 'EXT' }, { value: 'INT_EXT', label: 'INT/EXT' },
];
const DAY_NIGHTS: { value: string; label: string }[] = [
  { value: 'DAY', label: 'DAY' }, { value: 'NIGHT', label: 'NIGHT' },
];
const SCENE_STATUSES: { value: SceneStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'SHOOTING', label: 'Shooting' },
  { value: 'DONE', label: 'Done' },
  { value: 'SKIPPED', label: 'Skipped' },
];
