// Project dashboard: the roll-up view computed by stats.ts.
// Shows shot/scene/take progress, print rate, and the next slate.

import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import { db } from '@/data/db';
import { rollup } from '@/features/stats';

export default function DashboardView() {
  const { id } = useParams();
  const pid = Number(id);
  const project = useLiveQuery(() => db.projects.get(pid), [pid]);
  const shots = useLiveQuery(() => db.shots.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const scenes = useLiveQuery(() => db.scenes.where('projectId').equals(pid).sortBy('order'), [pid]) ?? [];
  const takes = useLiveQuery(() => db.takes.where('projectId').equals(pid).toArray(), [pid]) ?? [];
  const days = useLiveQuery(() => db.shootDays.where('projectId').equals(pid).toArray(), [pid]) ?? [];

  const r = rollup(shots, scenes, takes, days);
  const nextDay = days.slice().sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="page">
      <div className="topbar">
        <span className="brand">SLATE</span>
        <span className="dim">{project?.title ?? '…'} — Dashboard</span>
      </div>

      <div className="page-inner">
        <h2>Dashboard</h2>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Progress</div>
            <div className="card-sub">{r.shots} shots · {r.scenes} scenes · {r.takes} takes</div>
          </div>
          <div className="row">
            <div className="stat"><span className="stat-val">{r.shots}</span><span className="stat-label">Shots</span></div>
            <div className="stat"><span className="stat-val">{r.prints}</span><span className="stat-label">Prints</span></div>
            <div className="stat"><span className="stat-val">{r.scenePct}%</span><span className="stat-label">Scenes</span></div>
            <div className="stat"><span className="stat-val">{r.printRate}%</span><span className="stat-label">Take print rate</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Scenes</div>
            <div className="card-sub">{r.scenesDone}/{r.scenes} done · {r.pagesShot}/{r.pages} pg shot</div>
          </div>
          <div className="progress-line"><span>{r.scenesDone}/{r.scenes} scenes</span><b>{r.scenePct}%</b></div>
          <div className="progress"><div className="progress-fill" style={{ width: `${r.scenePct}%` }} /></div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Takes</div>
            <div className="card-sub">{r.printTakes}/{r.takes} prints</div>
          </div>
          <div className="row">
            <div className="stat"><span className="stat-val">{r.takes}</span><span className="stat-label">Takes</span></div>
            <div className="stat"><span className="stat-val">{r.printTakes}</span><span className="stat-label">Prints</span></div>
            <div className="stat"><span className="stat-val">{r.daysLogged}/{r.days}</span><span className="stat-label">Days logged</span></div>
          </div>
        </div>

        <div className="card day-of-shoot">
          <div className="card-head">
            <div className="card-title">Day of shoot</div>
            <button className="btn btn-sm" onClick={() => window.print()}>Print call sheet</button>
          </div>
          {nextDay ? (
            <>
              <div className="day-callout"><b>{nextDay.date}</b><span>{nextDay.location || 'Location TBD'}</span></div>
              <div className="row">
                <div className="stat"><span className="stat-val">{nextDay.callTime || '—'}</span><span className="stat-label">Call</span></div>
                <div className="stat"><span className="stat-val">{nextDay.wrapTime || '—'}</span><span className="stat-label">Wrap</span></div>
                <div className="stat"><span className="stat-val">{nextDay.weather || '—'}</span><span className="stat-label">Weather</span></div>
              </div>
              {nextDay.crew && nextDay.crew.length > 0 && <div className="card-sub">Crew: {nextDay.crew.join(' · ')}</div>}
              {nextDay.notes && <div className="card-sub">{nextDay.notes}</div>}
            </>
          ) : <div className="card-sub">Add a shoot day from the project board to build the call sheet.</div>}
        </div>

        {r.nextSlate !== '—' && (
          <div className="card highlight">
            <div className="card-head">
              <div className="card-title">Next slate</div>
              <div className="card-sub">{r.nextSlate}</div>
            </div>
          </div>
        )}

        <div className="card dim">
          <div className="card-sub">Updated {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</div>
        </div>
      </div>
    </div>
  );
}
