// Orchestrates polling (infra) and trigger evaluation (core).
// Emits 'context' events — never writes to disk or mutates external state.

const { EventEmitter } = require('events');
const { getTerminalContent }  = require('../infra/applescript');
const { stripAnsi, isAiSession, lastUserPrompt, errorSignature } = require('../core/patterns');
const {
  contextRotMilestone, cogWallReached,
  isErrorLoop, isPanicPrompting, isNoContextPrompt,
  isPostOutputSilence, isWeekendOverwork, isMidnight,
} = require('../core/triggers');

class Monitor extends EventEmitter {
  constructor() {
    super();
    this._timer          = null;
    this._sessionStart   = null;
    this._prevLen        = 0;
    this._errorHistory   = [];
    this._promptTimes    = [];
    this._largeOutputAt  = null;
    this._lastActivityAt = null;
    this._fired          = new Set();
    this._cooldowns      = {};
  }

  start() {
    this._poll();
    this._timer = setInterval(() => this._poll(), 5000);
  }

  stop() { clearInterval(this._timer); }

  // ── Private ──────────────────────────────────────────────────────────────────

  _cooledDown(key, ms) {
    const last = this._cooldowns[key];
    return !last || Date.now() - last > ms;
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

  _resetSession() {
    this._sessionStart   = Date.now();
    this._prevLen        = 0;
    this._errorHistory   = [];
    this._promptTimes    = [];
    this._largeOutputAt  = null;
    this._lastActivityAt = null;
    this._fired.clear();
  }

  async _poll() {
    const raw = await getTerminalContent();
    if (raw === null) { this._timeBased(); return; }
    this._analyze(stripAnsi(raw));
  }

  _analyze(content) {
    if (!isAiSession(content)) {
      if (this._sessionStart) this._resetSession();
      this._timeBased();
      return;
    }

    const now = Date.now();
    if (!this._sessionStart || content.length < this._prevLen * 0.4) {
      this._resetSession();
    }

    const newContent = content.slice(this._prevLen);
    const lenGrew    = content.length > this._prevLen + 20;
    if (lenGrew) this._lastActivityAt = now;

    // Context rot (60 / 90 / 120 min milestones)
    const rot = contextRotMilestone(this._sessionStart, this._fired);
    if (rot) this._fireOnce(rot.trigger, rot.emotion);

    // Cognitive wall (90 min, once per session)
    if (cogWallReached(this._sessionStart, this._fired)) this._fireOnce('cogWall', 'bored');

    // Error loop
    if (newContent) {
      const sig = errorSignature(newContent);
      if (sig) {
        if (isErrorLoop(sig, this._errorHistory) && this._cooledDown('errorLoop', 8 * 60 * 1000)) {
          this._fire('errorLoop', 'angry');
        }
        this._errorHistory.push(sig);
        if (this._errorHistory.length > 20) this._errorHistory.shift();
      }
    }

    // Panic prompting
    const prompt = lastUserPrompt(newContent);
    if (prompt && lenGrew) {
      this._promptTimes.push(now);
      this._promptTimes = this._promptTimes.filter(t => now - t < 60000);
      if (isPanicPrompting(this._promptTimes) && this._cooledDown('panicPrompt', 10 * 60 * 1000)) {
        this._fire('panicPrompt', 'shocked');
        this._promptTimes = [];
      }
    }

    // No-context prompt
    if (prompt && isNoContextPrompt(prompt, newContent.slice(0, 400)) && this._cooledDown('noContext', 15 * 60 * 1000)) {
      this._fire('noContext', 'bored');
    }

    // Post-output silence
    if (newContent.split('\n').length > 60 && lenGrew) this._largeOutputAt = now;
    if (isPostOutputSilence(this._largeOutputAt, this._lastActivityAt, now, this._cooldowns['postOutput'])) {
      this._fire('postOutput', 'smug');
    }

    // Weekend overwork
    if (isWeekendOverwork(this._sessionStart, this._fired)) this._fireOnce('weekendOverwork', 'bored');

    this._timeBased();
    this._prevLen = content.length;
  }

  _timeBased() {
    if (isMidnight(this._cooldowns['midnight'])) this._fire('midnight', 'sleep');
  }
}

module.exports = Monitor;
