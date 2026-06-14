// Real, activity-based health tracking — NOT random.
// Uses the OS idle clock (powerMonitor.getSystemIdleTime) to know exactly when
// the developer is actually at the keyboard, across every app. From that it
// derives: current uninterrupted focus streak, breaks, today's active total,
// and a consecutive-day streak — then fires health roasts on real thresholds.
//
// Privacy: stores only WHEN (active-time buckets), never WHAT.

const { EventEmitter } = require('events');

const TICK_MS        = 30 * 1000;       // re-check activity twice a minute
const IDLE_BREAK_SEC = 5 * 60;          // 5 min with no input = a break (resets focus streak)
const MAX_ADD_MS     = TICK_MS * 2;     // cap per-tick accumulation (guards against sleep/wake jumps)

// thresholds (minutes unless noted)
const EYE_REST_MIN   = 25;              // 20-20-20 eye rule
const NO_BREAK_MIN   = 50;              // sat too long without moving
const LONG_DAY_MIN   = 8 * 60;          // 8h active today
const STREAK_DAYS    = 7;               // worked every day for a week

// cooldowns (ms) so a roast doesn't repeat back-to-back
const COOL = {
  eyeRest:  25 * 60 * 1000,
  noBreak:  30 * 60 * 1000,
  longDay:  60 * 60 * 1000,
  dayStreak:12 * 60 * 60 * 1000,
};

function dayKey(d = new Date()) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }

class UsageTracker extends EventEmitter {
  constructor({ load, save }) {
    super();
    this._load = load;
    this._save = save;
    this._timer = null;
    this._data = null;            // { day, activeMs, streak, lastActiveDay }
    this._focusStart = null;      // ms timestamp of current uninterrupted focus streak
    this._lastActiveTick = null;  // ms timestamp of previous active tick
    this._cooldowns = {};
  }

  start() {
    this._data = this._load();
    this._rollDay();
    this._tick();
    this._timer = setInterval(() => this._tick(), TICK_MS);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    if (this._data) this._save(this._data);
  }

  // For a future stats view / tray tooltip.
  snapshot() {
    return {
      focusMin: this._focusStart ? Math.round((Date.now() - this._focusStart) / 60000) : 0,
      todayMin: Math.round((this._data?.activeMs || 0) / 60000),
      streak:   this._data?.streak || 0,
    };
  }

  // ── internals ──
  _idleSec() {
    try { return require('electron').powerMonitor.getSystemIdleTime(); }
    catch { return 0; }
  }

  _rollDay() {
    const today = dayKey();
    if (this._data.day !== today) { this._data.day = today; this._data.activeMs = 0; }
  }

  _markDayUsed() {
    const today = dayKey();
    if (this._data.lastActiveDay === today) return;
    this._data.streak = (this._data.lastActiveDay === yesterdayKey()) ? (this._data.streak || 0) + 1 : 1;
    this._data.lastActiveDay = today;
  }

  _cooled(key) { const l = this._cooldowns[key]; return !l || Date.now() - l > COOL[key]; }
  _fire(trigger, emotion) { this._cooldowns[trigger] = Date.now(); this.emit('context', { trigger, emotion }); }

  _tick() {
    const now = Date.now();
    this._rollDay();
    const active = this._idleSec() < IDLE_BREAK_SEC;

    if (!active) {
      // on a break — reset the focus streak, stop accumulating
      this._focusStart = null;
      this._lastActiveTick = null;
      this._save(this._data);
      return;
    }

    // actively working
    if (this._lastActiveTick) this._data.activeMs += Math.min(now - this._lastActiveTick, MAX_ADD_MS);
    this._lastActiveTick = now;
    if (!this._focusStart) this._focusStart = now;
    this._markDayUsed();
    this._checkHealth(now);
    this._save(this._data);
  }

  _checkHealth(now) {
    const focusMin = (now - this._focusStart) / 60000;
    const todayMin = this._data.activeMs / 60000;

    if (focusMin >= NO_BREAK_MIN && this._cooled('noBreak'))   this._fire('noBreak', 'bored');
    else if (focusMin >= EYE_REST_MIN && this._cooled('eyeRest')) this._fire('eyeRest', 'smug');

    if (todayMin >= LONG_DAY_MIN && this._cooled('longDay'))   this._fire('longDay', 'shocked');
    if ((this._data.streak || 0) >= STREAK_DAYS && this._cooled('dayStreak')) this._fire('dayStreak', 'angry');
  }
}

module.exports = UsageTracker;
