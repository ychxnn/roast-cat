const { EventEmitter } = require('events');
const { exec } = require('child_process');

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripAnsi(s) {
  return s.replace(/\x1B\[[0-9;]*[mGKHFJABCDsuhr]/g, '').replace(/\x1B\][^\x07]*\x07/g, '');
}

// Does this terminal buffer look like an active AI CLI session?
const CLI_SIGNALS = [
  /\bclaude\b/i, /\baider\b/i, /\bsgpt\b/i,
  /\bllm\b/i,    /\bcodex\b/i, /Human:/,
  /╭─+╮/,        /aider>/i,    /openai/i,
];

function isAiSession(content) {
  return CLI_SIGNALS.some(p => p.test(content));
}

// Extract what looks like the user's most recent prompt from the buffer
function lastUserPrompt(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  // Walk backwards; skip AI-output-looking lines
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 40); i--) {
    const l = lines[i];
    if (/^[╭╰│✓✗●◉►▸]/.test(l)) continue;
    if (/^(Human:|Assistant:|aider>|claude>)/.test(l)) continue;
    if (l.length > 3 && l.length < 600) return l;
  }
  return '';
}

// Pull a repeatable "signature" from an error line so we can count duplicates
const ERROR_RX = [
  /^(Error|TypeError|SyntaxError|ReferenceError|ValueError|RuntimeError|AttributeError|ImportError|ModuleNotFoundError|KeyError|IndexError|NameError|OSError|FileNotFoundError|PermissionError|AssertionError)/m,
  /Traceback \(most recent call last\)/m,
  /^\s+at .+\(.+:\d+:\d+\)/m,
  /FAILED|ENOENT|ECONNREFUSED/m,
];

function errorSignature(text) {
  for (const rx of ERROR_RX) {
    const m = text.match(rx);
    if (m) return text.slice(text.indexOf(m[0]), text.indexOf(m[0]) + 80)
                       .replace(/\s+/g, ' ').toLowerCase().trim();
  }
  return null;
}

// ── Monitor ───────────────────────────────────────────────────────────────────

class Monitor extends EventEmitter {
  constructor() {
    super();
    this._timer        = null;
    this._sessionStart = null;
    this._prevContent  = '';
    this._prevLen      = 0;

    // error loop
    this._errorSigs    = [];          // last seen error signatures
    this._errorCount   = 0;

    // panic prompting
    this._promptTimes  = [];          // timestamps of detected user prompts

    // post-output silence
    this._largeOutputAt  = null;
    this._lastActivityAt = null;
    this._postOutputFired = false;

    // per-session trigger gates (reset on new session)
    this._fired = new Set();
    // global cooldowns { trigger -> Date last fired }
    this._cooldowns = {};
  }

  start() {
    this._poll();
    this._timer = setInterval(() => this._poll(), 5000);
  }

  stop() { clearInterval(this._timer); }

  // ── Cooldown helpers ────────────────────────────────────────────────────────

  _cooledDown(trigger, ms) {
    const last = this._cooldowns[trigger];
    if (!last) return true;
    return Date.now() - last > ms;
  }

  _fire(trigger, emotion) {
    this._cooldowns[trigger] = Date.now();
    this.emit('context', { trigger, emotion });
  }

  _fireOnce(trigger, emotion) {
    if (this._fired.has(trigger)) return;
    this._fired.add(trigger);
    this._fire(trigger, emotion);
  }

  // ── New session detection ───────────────────────────────────────────────────

  _resetSession() {
    this._sessionStart  = Date.now();
    this._prevContent   = '';
    this._prevLen       = 0;
    this._errorSigs     = [];
    this._errorCount    = 0;
    this._promptTimes   = [];
    this._largeOutputAt = null;
    this._postOutputFired = false;
    this._fired.clear();
  }

  // ── macOS poll ──────────────────────────────────────────────────────────────

  _poll() {
    if (process.platform !== 'darwin') {
      this._timeBased();
      return;
    }

    const script = `
      set appName to ""
      set content to ""
      tell application "System Events"
        try
          set appName to name of first application process whose frontmost is true
        end try
      end tell
      if appName is "Terminal" then
        tell application "Terminal"
          try
            set content to contents of selected tab of front window
          end try
        end tell
      else if appName is "iTerm2" then
        tell application "iTerm2"
          try
            set content to text of current session of current tab of current window
          end try
        end tell
      else if appName is "Warp" then
        -- Warp doesn't expose AppleScript content; use empty
        set content to ""
      end if
      return content
    `;

    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { timeout: 4000 }, (err, stdout) => {
      if (err) { this._timeBased(); return; }
      const raw  = stripAnsi((stdout || '').trim());
      this._analyze(raw);
    });
  }

  // ── Core analysis ───────────────────────────────────────────────────────────

  _analyze(content) {
    if (!isAiSession(content)) {
      // Not in an AI CLI session — only do time-based checks
      if (this._sessionStart) this._resetSession();
      this._timeBased();
      return;
    }

    const now = Date.now();

    // New session if content shrank dramatically (user opened a fresh terminal)
    if (content.length < this._prevLen * 0.4 || !this._sessionStart) {
      this._resetSession();
    }

    const sessionMin = (now - this._sessionStart) / 60000;
    const newContent = content.slice(this._prevLen);
    const lenGrew    = content.length > this._prevLen + 20;

    if (lenGrew) this._lastActivityAt = now;

    // ── Trigger 1: Context rot ─────────────────────────────────────────────
    if (sessionMin >= 60  && !this._fired.has('contextRot60'))  this._fireOnce('contextRot60',  'shocked');
    if (sessionMin >= 90  && !this._fired.has('contextRot90'))  this._fireOnce('contextRot90',  'angry');
    if (sessionMin >= 120 && !this._fired.has('contextRot120')) this._fireOnce('contextRot120', 'angry');

    // ── Trigger 2: 90-min cognitive wall ──────────────────────────────────
    if (sessionMin >= 90 && !this._fired.has('cogWall')) this._fireOnce('cogWall', 'bored');

    // ── Trigger 3: Error loop ─────────────────────────────────────────────
    if (newContent) {
      const sig = errorSignature(newContent);
      if (sig) {
        const recent = this._errorSigs.slice(-6);
        const dupeCount = recent.filter(s => s.startsWith(sig.slice(0, 40))).length;
        this._errorSigs.push(sig);
        if (this._errorSigs.length > 20) this._errorSigs.shift();
        if (dupeCount >= 2 && this._cooledDown('errorLoop', 8 * 60 * 1000)) {
          this._fire('errorLoop', 'angry');
        }
      }
    }

    // ── Trigger 4: Panic prompting ────────────────────────────────────────
    const prompt = lastUserPrompt(newContent);
    if (prompt && lenGrew) {
      this._promptTimes.push(now);
      // keep only last 60 seconds
      this._promptTimes = this._promptTimes.filter(t => now - t < 60000);
      if (this._promptTimes.length >= 4 && this._cooledDown('panicPrompt', 10 * 60 * 1000)) {
        this._fire('panicPrompt', 'shocked');
        this._promptTimes = [];
      }
    }

    // ── Trigger 5: No context prompt ─────────────────────────────────────
    if (prompt && /\b(fix this|debug|doesn'?t work|not working|broken|why (is|isn'?t|doesn'?t)|what'?s wrong)\b/i.test(prompt)) {
      // Bad if the surrounding context is thin (< 200 chars around the match)
      const contextSlice = newContent.slice(0, 400);
      const hasError = errorSignature(contextSlice);
      const hasCode  = /```|def |function |class |import |require/.test(contextSlice);
      if (!hasError && !hasCode && this._cooledDown('noContext', 15 * 60 * 1000)) {
        this._fire('noContext', 'bored');
      }
    }

    // ── Trigger 6: Post-output silence ───────────────────────────────────
    const addedLines = newContent.split('\n').length;
    if (addedLines > 60 && lenGrew) {
      // Large AI output detected
      this._largeOutputAt   = now;
      this._postOutputFired = false;
    }
    if (
      this._largeOutputAt &&
      !this._postOutputFired &&
      now - this._largeOutputAt > 2 * 60 * 1000 &&    // 2 min of silence
      (!this._lastActivityAt || this._lastActivityAt - this._largeOutputAt < 5000) &&
      this._cooledDown('postOutput', 20 * 60 * 1000)
    ) {
      this._postOutputFired = true;
      this._fire('postOutput', 'smug');
    }

    // ── Trigger 7: Weekend overwork (>2hr session on weekend) ────────────
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && sessionMin >= 120 && !this._fired.has('weekendOverwork')) {
      this._fireOnce('weekendOverwork', 'bored');
    }

    // ── Time-based ────────────────────────────────────────────────────────
    this._timeBased();

    this._prevContent = content;
    this._prevLen     = content.length;
  }

  // ── Time-based checks (always run) ─────────────────────────────────────────

  _timeBased() {
    const h = new Date().getHours();
    if (h >= 0 && h < 4 && this._cooledDown('midnight', 45 * 60 * 1000)) {
      this._fire('midnight', 'sleep');
    }
  }
}

module.exports = Monitor;
