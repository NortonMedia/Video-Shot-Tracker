# Shot Tracker

Offline-first, on-set video production tracker with a digital clapperboard.

- **Projects → Scenes → Shots → Takes** with full slate data
- **Digital clap** — beep + screen flash + millisecond UTC stamp per take for sync
- Live timecode + progress dashboard
- PWA: installable, works fully offline, stores everything locally (IndexedDB)

## Dev

```bash
npm install
npm run dev
```

## Stack
Vite · React · TypeScript · Dexie (IndexedDB) · vite-plugin-pwa
