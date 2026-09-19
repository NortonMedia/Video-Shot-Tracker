import Dexie, { type EntityTable } from 'dexie';
import type { Project, Scene, Shot, Take, ShootDay } from './types';

export const db = new Dexie('shot-tracker') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  scenes: EntityTable<Scene, 'id'>;
  shots: EntityTable<Shot, 'id'>;
  takes: EntityTable<Take, 'id'>;
  shootDays: EntityTable<ShootDay, 'id'>;
};

db.version(1).stores({
  projects: '++id, status, createdAt, updatedAt',
  scenes: '++id, projectId, order, status',
  shots: '++id, projectId, sceneId, order, status',
  takes: '++id, projectId, sceneId, shotId, takeNumber, verdict, createdAt',
  shootDays: '++id, projectId, date',
});
