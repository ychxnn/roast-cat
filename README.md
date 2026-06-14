# Roast Cat

A desktop cat that watches your AI CLI sessions and roasts you — with documented facts — when it catches you doing something wrong.

> The AI can't tell you your context window is rotting. The cat can and will.

[![CI](https://github.com/ychxnn/roast-cat/actions/workflows/ci.yml/badge.svg)](https://github.com/ychxnn/roast-cat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Table of Contents

- [Install](#install)
- [Run the Demo](#run-the-demo)
- [Supported Tools](#supported-tools)
- [Roast Triggers](#roast-triggers)
- [Cat Emotions](#cat-emotions)
- [Why Each Roast is Justified](#why-each-roast-is-justified)
- [Configure Cats](#configure-cats)
- [Grant macOS Permissions](#grant-macos-permissions)
- [Privacy](#privacy)
- [Architecture](#architecture)
- [Extend Roasts](#extend-roasts)

---

## Install

```bash
git clone https://github.com/ychxnn/roast-cat
cd roast-cat
npm install
npm start
```

Requires [Node.js](https://nodejs.org) v18+.

---

## Run the Demo

```bash
npm run demo
```

Cycles through all roast triggers so you can see the cat in action without an active AI session.

---

## Supported Tools

The cat watches CLI tools running in Terminal, iTerm2, or Warp:

| Tool | Detected by |
|------|-------------|
| Claude Code (`claude`) | terminal buffer content |
| Aider | terminal buffer content |
| OpenAI Codex CLI | terminal buffer content |
| `llm`, `sgpt` | terminal buffer content |
| Any tool matching `Human:` / `Assistant:` prompt format | terminal buffer content |

**macOS only for session reading.** On other platforms, time-based triggers still work.

---

## Roast Triggers

The cat never roasts you on a timer. Every roast has a specific, documented reason.

| Trigger | Evidence required | Fires |
|---------|-----------------|-------|
| **Context rot** | Session running 60 / 90 / 120 min | Once each milestone per session |
| **Cognitive wall** | 90 min continuous focus | Once per session |
| **Error loop** | Same error signature appears 3+ times | Per new loop (8 min cooldown) |
| **Panic prompting** | 4+ prompts in under 60 seconds | Per incident (10 min cooldown) |
| **No context prompt** | "fix this" / "debug" / "doesn't work" with no error text or code nearby | Per incident (15 min cooldown) |
| **Post-output silence** | 60+ new lines from AI, then no follow-up for 2 min | Per large output (20 min cooldown) |
| **Weekend overwork** | Saturday/Sunday + session > 2 hours | Once per day |
| **After midnight** | Active session detected after 12am | At most every 45 min |

---

## Cat Emotions

| Face | When |
|------|------|
| 😺 idle | Default |
| 😸 happy | — |
| 😾 angry | Error loop, context rot |
| 😱 shocked | Context rot, panic prompting |
| 😒 bored | Cognitive wall, no context, weekend overwork |
| 😏 smug | Post-output silence |
| 😴 sleep | After midnight |

---

## Why Each Roast is Justified

- **Context rot** — transformer attention degrades as context fills; the "middle token problem" is documented in LLM research
- **Cognitive wall** — cognitive load studies consistently show performance degrades past 90 min of sustained focus
- **Error loop** — the AI has no new information when you paste the same error again; the approach is wrong, not the prompt
- **Panic prompting** — rapid-fire prompts fill context with low-signal turns, measurably degrading output quality
- **No context prompt** — a debugging prompt without error/code context will get a confidently wrong answer
- **Post-output silence** — 16 of 18 AI-code production failures studied in 2025 involved unreviewed large outputs
- **Weekend overwork** — burnout research links this pattern to reduced output on Monday–Tuesday
- **After midnight** — sleep deprivation at this level impairs logical reasoning at roughly 0.05 BAC

---

## Configure Cats

Click the cat icon in the menu bar, then open **Settings** to:

- Add or remove cats
- Name each cat and pick a colour (orange, black, white, grey, pink)
- Set size (small / medium / large)
- Enable or disable individual cats

---

## Grant macOS Permissions

**System Settings → Privacy & Security → Accessibility → enable Electron**

Without this, the cat still runs. It catches midnight sessions and weekend overwork from the system clock alone. With Accessibility enabled, it reads your terminal buffer and catches the prompting-behaviour triggers.

---

## Privacy

- No network requests
- No session content written to disk
- Terminal buffer is read, analyzed in memory, and discarded immediately
- Only cat configuration (name, color, size) is persisted

---

## Architecture

```
src/
  core/        — pure pattern matching, trigger logic (no I/O)
  service/     — monitor orchestration, roast selection
  infra/       — AppleScript execution, config file I/O
interface/     — Electron tray, windows, IPC handlers
renderer/      — cat.html, settings.html
main.js        — entry point only
preload.js     — IPC bridge
```

---

## Extend Roasts

Open `roasts.js`. Each trigger maps to an array of strings. Add yours.

Rules: fact-based, meme tone, under ~200 chars if possible. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](LICENSE)
