# Contributing to Roast Cat

PRs welcome. Here's what to know.

## Setup

```bash
git clone https://github.com/ychxnn/roast-cat
cd roast-cat
npm install
npm start
```

## Project structure

```
main.js        — Electron main process: windows, tray, IPC, monitor dispatch
preload.js     — Secure IPC bridge (contextIsolation)
monitor.js     — Live session watcher (AppleScript on macOS, time-based fallback)
roasts.js      — Roast library (categorized, meme-flavored)
cat.html       — Cat window: SVG cat + emotion states + bubble
settings.html  — Settings UI: manage multiple cats, colors, sizes, app assignment
```

## Adding roasts

Open `roasts.js`. Every category is an array of strings. Add yours to the right category:

- `unrealistic` — asking AI for too much in one shot
- `badPrompting` — vague/context-free prompts
- `lazy` — very short prompts
- `frustrated` — user seems annoyed at the AI
- `late` — coding after midnight
- `earlyMorning` — coding before 6am
- `weekend` — coding on Saturday/Sunday
- `tokenBurn` — long circular sessions
- `dependency` — using AI for trivially googleable things
- `general` — general health/life/productivity roasts

Rules for roasts:
- Fact-based or observation-based (no pure mean-spirited insults)
- Internet/Reddit/meme tone — casual English
- Under 140 characters if possible (fits the bubble better)
- No slurs, no genuinely harmful content

## Adding a new AI app to monitor

In `monitor.js`:
1. Add it to `APP_MAP` (maps OS app name → internal key)
2. Add its URL to `URL_APP_MAP` if browser-based
3. Add a roast category for it in `roasts.js` if needed

## Emotion states

The cat has 7 faces: `idle`, `happy`, `angry`, `shocked`, `bored`, `smug`, `sleep`.
Map your trigger → emotion in `monitor.js` when emitting `context` events.

## No data storage policy

The monitor MUST NOT write session content anywhere. All analysis is in-memory.
Don't add logging of user prompts or session content to disk or network.
