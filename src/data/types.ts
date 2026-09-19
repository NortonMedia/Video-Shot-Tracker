// ---------------------------------------------------------------------------
// Domain types for the shot tracker.
// ---------------------------------------------------------------------------

export type ShotStatus =
  | 'NOT_STARTED'
  | 'PREPARING'
  | 'ROLLING'
  | 'PRINT'
  | 'RETAKE'
  | 'CUT';

export type TakeVerdict = 'UNMARKED' | 'PRINT' | 'NG' | 'KEEPER';

export type DayNight = 'DAY' | 'NIGHT';
export type IntExt = 'INT' | 'EXT' | 'INT_EXT';

export type ShotSize =
  | 'WS'
  | 'MS'
  | 'CU'
  | 'ECU'
  | 'MCU'
  | 'XCU'
  | 'EST'
  | 'INSERT'
  | 'POV'
  | 'OTS'
  | 'OTHER';

export type CameraMove =
  | 'STATIC'
  | 'HANDHELD'
  | 'DOLLY_IN'
  | 'DOLLY_OUT'
  | 'TRAVELING'
  | 'PAN'
  | 'TILT'
  | 'CRANE'
  | 'GIMBAL'
  | 'ZOOM'
  | 'OTHER';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETE';
export type SceneStatus = 'NOT_STARTED' | 'PREPARING' | 'SHOOTING' | 'DONE' | 'SKIPPED';

export const SHOT_STATUSES: { value: ShotStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Stick' },
  { value: 'PREPARING', label: 'Prepping' },
  { value: 'ROLLING', label: 'Rolling' },
  { value: 'PRINT', label: 'Print' },
  { value: 'RETAKE', label: 'Retake' },
  { value: 'CUT', label: 'Cut' },
];

export interface Project {
  id?: number;
  title: string;
  company?: string;
  director?: string;
  producer?: string;
  unit?: string;
  status: ProjectStatus;
  fps: number;
  camera?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id?: number;
  projectId: number;
  order: number;
  number: string; // 1, 1A, 2
  slugline: string; // INT. BAR - NIGHT
  location?: string;
  intExt: IntExt;
  dayNight: DayNight;
  pages?: number; // script pages
  synopsis?: string;
  status: SceneStatus;
  notes?: string;
}

export interface Shot {
  id?: number;
  projectId: number;
  sceneId: number;
  order: number; // global shot counter
  number: string; // within scene: 1, 2, 3
  size: string;
  move: string;
  lens?: string; // e.g. 32mm
  format?: string; // e.g. 6K
  fps: number;
  aspect?: string; // e.g. 2.39:1
  filters?: string;
  status: ShotStatus;
  notes?: string;
  createdAt: number;
}

export interface TakeClap {
  clapAtMs?: number; // epoch ms (UTC) at clap moment
  tcAtClap?: string; // timecode display at the clap moment
  beepDelayMs?: number; // audio latency compensation
}

export interface Take {
  id?: number;
  projectId: number;
  sceneId: number;
  shotId: number;
  takeNumber: number;
  slate?: string; // slate slug shown on the board
  timecodeIn?: string;
  timecodeOut?: string;
  verdict: TakeVerdict;
  clap?: TakeClap;
  soundRoll?: string;
  mos: boolean; // no simultaneous sound
  wait: boolean; // still / "wait" take
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ShootDay {
  id?: number;
  projectId: number;
  date: string; // YYYY-MM-DD
  callTime?: string; // HH:MM
  wrapTime?: string; // HH:MM
  weather?: string;
  location?: string;
  crew?: string[]; // crew IDs or names present
  notes?: string;
}
