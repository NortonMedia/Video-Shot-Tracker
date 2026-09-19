# Shot Tracker

Offline-first, on-set video production tracker with a digital clapperboard.

- **Projects → Scenes → Shots → Takes** with full slate data
- **Digital clap** — beep + screen flash + millisecond UTC stamp per take for sync
- Live timecode + progress dashboard
- PWA: installable, works fully offline, stores everything locally (IndexedDB)

## Install on your devices

Build and host the contents of `dist/` from an HTTPS-capable static host. The app is an offline-first PWA, so each device keeps its own IndexedDB data.

- **macOS:** open the hosted URL in Chrome or Edge, then use the install icon in the address bar (or `⋯ → Save and share → Install page as app`).
- **iPhone/iPad:** open the hosted URL in Safari, tap **Share → Add to Home Screen**, then launch Slate from the Home Screen.
- **Windows:** open the hosted URL in Edge or Chrome, then choose **Install this site as an app** from the address-bar install icon or browser menu.

A normal `file://` URL is useful for local inspection but cannot install the service worker. Use the preview server or an HTTPS deployment for PWA installation and offline caching.

## Dev

```bash
npm run dev
npm run test
npm run build
```

## Stack
Vite · React · TypeScript · Dexie (IndexedDB) · vite-plugin-pwa
