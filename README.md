<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![CI][ci-shield]][ci-url]

<br />

# 🐱 Roast Cat

**A desktop cat that sits on your screen, watches your AI CLI sessions, and roasts you — with documented facts — when it catches you doing something wrong.**

*The AI can't tell you your context window is rotting. The cat can and will.*

<br />

[View Demo](#demo) · [Report Bug](https://github.com/ychxnn/roast-cat/issues) · [Request Feature](https://github.com/ychxnn/roast-cat/issues)

</div>

---

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Demo Mode](#demo-mode)
  - [Supported Tools](#supported-tools)
  - [Roast Triggers](#roast-triggers)
  - [Cat Emotions](#cat-emotions)
  - [Configure Cats](#configure-cats)
  - [Grant macOS Permissions](#grant-macos-permissions)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

---

## About The Project

Most developer tools tell you what went wrong *after* the fact. Roast Cat tells you what you're doing wrong *as you do it* — by watching your AI CLI sessions in real time.

It detects real, documented failure patterns:

- **Context rot** — your 90-minute Claude session has degraded to the point the model forgot your first 20 messages
- **Error loops** — you've pasted the same traceback 3 times and the AI still doesn't have a diagnosis
- **Panic prompting** — you sent 4 prompts in 30 seconds and now your context is full of noise
- **Post-output silence** — the AI gave you 200 lines and you haven't questioned any of it

Every roast has a source. Nothing fires on a random timer.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Built With

- [Electron](https://www.electronjs.org/) — cross-platform desktop shell
- [Node.js](https://nodejs.org/) — runtime
- AppleScript — macOS terminal buffer access (for session reading)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node)
- macOS (required for AI session reading; time-based triggers work on all platforms)

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/ychxnn/roast-cat.git
   cd roast-cat
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run
   ```bash
   npm start
   ```

The cat appears on your screen. Drag it anywhere. Grant Accessibility permission (see below) to enable session monitoring.

---

### Install as a menu bar app (no terminal needed)

To run Roast Cat as a proper macOS app that lives in your status bar and survives terminal closes:

1. Build the `.app` bundle

   **Apple Silicon (M1/M2/M3/M4)**
   ```bash
   npm run build
   ```

   **Intel Mac**
   ```bash
   npm run build:intel
   ```

2. Move it to Applications
   ```bash
   npm run install-app
   ```

3. Launch it from Spotlight (`Cmd+Space` → type `RoastCat`) — the 🐱 icon appears in your menu bar.

4. **Auto-start on login:** System Settings → General → Login Items & Extensions → `+` → select `/Applications/RoastCat.app`

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Usage

### Demo Mode

See all roast triggers in action without an active AI session:

```bash
npm run demo
```

Cycles through all 9 triggers with a 10-second pause between each.

---

### Supported Tools

The cat reads the terminal buffer from Terminal, iTerm2, and Warp:

| Tool | Detected by |
|------|-------------|
| Claude Code (`claude`) | terminal buffer content |
| Aider | terminal buffer content |
| OpenAI Codex CLI | terminal buffer content |
| `llm`, `sgpt` | terminal buffer content |
| Any tool with `Human:` / `Assistant:` format | terminal buffer content |

> macOS only for session reading. Time-based triggers (midnight, weekend overwork) work on all platforms.

---

### Roast Triggers

Every roast requires specific, observable evidence. No random-timer roasting.

| Trigger | Evidence required | Fires |
|---------|-------------------|-------|
| **Context rot** | Session running 60 / 90 / 120 min | Once per milestone |
| **Cognitive wall** | 90 min of continuous focus | Once per session |
| **Error loop** | Same error signature 3+ times | Per loop (8 min cooldown) |
| **Panic prompting** | 4+ prompts in under 60 sec | Per incident (10 min cooldown) |
| **No context prompt** | "fix this" / "debug" with no error or code nearby | Per incident (15 min cooldown) |
| **Post-output silence** | 60+ new AI lines, then silence for 2 min | Per output (20 min cooldown) |
| **Weekend overwork** | Saturday/Sunday + session > 2 hours | Once per day |
| **After midnight** | Active session after 12am | Every 45 min max |

**Why each roast is justified:**

- **Context rot** — transformer attention degrades as context fills; the "middle token problem" is documented in LLM research
- **Cognitive wall** — cognitive load studies show performance degrades measurably past 90 min of sustained focus
- **Error loop** — the AI has no new information when you paste the same error again
- **Panic prompting** — rapid-fire prompts fill context with low-signal turns, degrading output quality
- **No context prompt** — a debugging prompt without error/code context produces a confidently wrong answer
- **Post-output silence** — 16 of 18 AI-code production failures in 2025 involved unreviewed large outputs
- **Weekend overwork** — burnout research links this to reduced output the following Monday–Tuesday
- **After midnight** — sleep deprivation at this hour impairs reasoning at roughly 0.05 BAC

---

### Cat Emotions

| Face | Triggered by |
|------|-------------|
| 😺 idle | Default |
| 😾 angry | Error loop, context rot (90+ min) |
| 😱 shocked | Context rot (60 min), panic prompting |
| 😒 bored | Cognitive wall, no-context prompt, weekend overwork |
| 😏 smug | Post-output silence |
| 😴 sleep | After midnight |

---

### Configure Cats

Click 🐱 in the menu bar → **Settings** to:

- Add or remove cats
- Name each cat
- Set colour: orange, black, white, grey, pink
- Set size: small, medium, large
- Enable or disable individual cats

Multiple cats can run simultaneously — useful if you're juggling multiple terminal sessions.

---

### Grant macOS Permissions

To read your AI CLI sessions:

**System Settings → Privacy & Security → Accessibility → enable Electron**

Without this permission, the cat still works — it catches midnight coding and weekend overwork from the system clock. With it, it reads your terminal buffer and catches all prompting-behaviour triggers.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Architecture

```
src/
  core/          — pure functions only: pattern matching, trigger evaluation (no I/O)
  service/       — orchestration: Monitor class, roast selection
  infra/         — OS and file boundaries: AppleScript, config persistence
interface/       — Electron UI: tray, windows, IPC handlers
renderer/        — cat.html, settings.html
main.js          — entry point only: boots app, owns state, wires modules
preload.js       — contextIsolation IPC bridge
```

Dependencies flow top-down only. `src/core` has no imports from other layers.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Roadmap

- [x] Animated SVG cat with 7 emotion states
- [x] Evidence-based roasting (no random timer)
- [x] Multiple cats, each configurable
- [x] Demo mode
- [x] macOS Accessibility integration
- [ ] Windows support (PowerShell session monitoring)
- [ ] Linux support (X11/Wayland terminal reading)
- [ ] Browser extension for web-based AI apps (Claude.ai, ChatGPT)
- [ ] Token usage estimation from session length
- [ ] Custom roast packs (community contributed)

See [open issues](https://github.com/ychxnn/roast-cat/issues) for the full list of proposed features and known bugs.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion, please fork the repo and open a pull request, or open an issue with the tag `enhancement`. And if this project saved you from a midnight deployment disaster, consider giving it a star.

**Adding a roast:**

1. Open `src/service/roasts.js`
2. Find the right trigger category
3. Add your string — it must be fact-based with a source
4. Open a PR using the template (it asks for the source citation)

**Adding a trigger:**

1. Add the pure evaluation logic to `src/core/triggers.js`
2. Wire it in `src/service/monitor.js`
3. Add roast text to `src/service/roasts.js`
4. Map it to a cat emotion in `main.js`

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

**Fork the project:**

1. Fork the repo
2. Create your branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Contact

ychxnn — [@ychxnn](https://github.com/ychxnn)

Project Link: [https://github.com/ychxnn/roast-cat](https://github.com/ychxnn/roast-cat)

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

## Acknowledgments

- [othneildrew's Best README Template](https://github.com/othneildrew/Best-README-Template) — structure of this README
- [MindStudio — Context Rot in AI Coding Agents](https://www.mindstudio.ai/blog/context-rot-ai-coding-agents-explained) — the research behind the context rot triggers
- [DEV Community — When Long Chats Drift](https://dev.to/himanshu_jetani_0a4817c3f/when-long-chats-drift-context-windows-and-hidden-errors-in-ai-assisted-coding-31e4) — middle token problem documentation
- [Vibe Coding on Reddit](https://www.morphllm.com/reddit-vibe-coding) — the 16-of-18 production failure stat
- [Img Shields](https://shields.io) — badges
- [contrib.rocks](https://contrib.rocks) — contributor image

<p align="right">(<a href="#table-of-contents">back to top</a>)</p>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/ychxnn/roast-cat.svg?style=for-the-badge
[contributors-url]: https://github.com/ychxnn/roast-cat/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ychxnn/roast-cat.svg?style=for-the-badge
[forks-url]: https://github.com/ychxnn/roast-cat/fork
[stars-shield]: https://img.shields.io/github/stars/ychxnn/roast-cat.svg?style=for-the-badge
[stars-url]: https://github.com/ychxnn/roast-cat/stargazers
[issues-shield]: https://img.shields.io/github/issues/ychxnn/roast-cat.svg?style=for-the-badge
[issues-url]: https://github.com/ychxnn/roast-cat/issues
[license-shield]: https://img.shields.io/github/license/ychxnn/roast-cat.svg?style=for-the-badge
[license-url]: https://github.com/ychxnn/roast-cat/blob/main/LICENSE
[ci-shield]: https://img.shields.io/github/actions/workflow/status/ychxnn/roast-cat/ci.yml?style=for-the-badge&label=CI
[ci-url]: https://github.com/ychxnn/roast-cat/actions/workflows/ci.yml
