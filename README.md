# 🐱 Roast Cat

A desktop cat that watches your AI CLI sessions and roasts you — with documented facts — when it catches you doing something wrong.

> The AI can't tell you your context window is rotting. The cat can and will.

---

## Demo

```bash
npm run demo
```

Cycles through all roast triggers so you can see the cat in action without an active AI session.

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

## What it watches

CLI tools running in Terminal, iTerm2, or Warp:

| Tool | Detected by |
|------|-------------|
| Claude Code (`claude`) | terminal buffer content |
| Aider | terminal buffer content |
| OpenAI Codex CLI | terminal buffer content |
| `llm`, `sgpt` | terminal buffer content |
| Any tool matching `Human:` / `Assistant:` prompt format | terminal buffer content |

**macOS only for session reading.** On other platforms, time-based triggers still work.

---

## What triggers a roast

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

## macOS permissions (for session reading)

**System Settings → Privacy & Security → Accessibility → enable Electron**

Without this, the cat still runs. It catches midnight sessions and weekend overwork from the system clock alone. With it, it reads your terminal buffer and catches the prompting-behaviour triggers.

---

## Settings

Click 🐱 in the menu bar → **Settings** to:

- Add / remove cats
- Name each cat and pick a colour (orange, black, white, grey, pink)
- Set size (small / medium / large)
- Enable or disable individual cats

---

## Cat emotions

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

## Why each roast is justified

- **Context rot** — transformer attention degrades as context fills; the "middle token problem" is documented in LLM research
- **Cognitive wall** — cognitive load studies consistently show performance degrades past 90 min of sustained focus
- **Error loop** — the AI has no new information when you paste the same error again; the approach is wrong, not the prompt
- **Panic prompting** — rapid-fire prompts fill context with low-signal turns, measurably degrading output quality
- **No context prompt** — a debugging prompt without error/code context will get a confidently wrong answer
- **Post-output silence** — 16 of 18 AI-code production failures studied in 2025 involved unreviewed large outputs
- **Weekend overwork** — burnout research links this pattern to reduced output on Monday–Tuesday
- **After midnight** — sleep deprivation at this level impairs logical reasoning at roughly 0.05 BAC

---

## Adding roasts

Open `roasts.js`. Each trigger maps to an array of strings. Add yours. Rules: fact-based, meme tone, under ~200 chars if possible. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Privacy

- No network requests
- No session content written to disk
- Terminal buffer is read, analyzed in memory, and discarded immediately
- Only cat configuration (name, color, size) is persisted

---

## License

MIT — see [LICENSE](LICENSE)
