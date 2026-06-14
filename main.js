// Entry point — boots the app, owns cats state, wires all modules together.

const { app } = require('electron');
const { loadCats, saveCats, makeCat, loadPrefs, savePrefs,
        loadUsage, saveUsage }                               = require('./src/infra/config');
const { createTray }                                         = require('./interface/tray');
const { catWindows, createCatWindow, syncCatWindows, dispatch, openSettings,
        createOnboardingWindow, closeOnboardingWindow, setCatTheme, resizeCatWindow,
        setCatBehavior } = require('./interface/windows');
const { registerIpcHandlers }                                = require('./interface/ipc');
const Monitor                                                = require('./src/service/monitor');
const UsageTracker                                           = require('./src/service/usage');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const IS_DEMO = process.argv.includes('--demo');

// ── App state ─────────────────────────────────────────────────────────────────

let cats    = [];
let prefs   = {};
let refresh = null;
let monitor = null;
let usage   = null;

// ── Shared handlers ───────────────────────────────────────────────────────────

function onCatMoved(catId, x, y) {
  const cat = cats.find(c => c.id === catId);
  if (cat) { cat.x = x; cat.y = y; saveCats(cats); }
}

function roastCat(catId) {
  const win = catWindows.get(catId);
  if (win && !win.isDestroyed()) win.webContents.send('manual-roast');
}

function toggleCat(catId) {
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;
  cat.enabled = !cat.enabled;
  saveCats(cats);
  const win = catWindows.get(catId);
  if (win && !win.isDestroyed()) win.webContents.send('init', cat);
  refresh();
}

// Roasts are suppressed entirely while quiet/focus mode is on.
function onContext(event) { if (!prefs.quiet) dispatch(event, cats); }

function startMonitor() {
  if (IS_DEMO) return;
  if (!monitor) {
    monitor = new Monitor();
    monitor.on('context', onContext);
    monitor.start();
  }
  if (!usage) {
    // real, activity-based health roasts (works across all apps, no a11y needed)
    usage = new UsageTracker({ load: loadUsage, save: saveUsage });
    usage.on('context', onContext);
    usage.start();
  }
}

// Called by the onboarding window when the walkthrough finishes (or is skipped).
// Applies the chosen config to the first cat, then brings the cat to life.
function finishOnboarding(cfg = {}) {
  if (!cats.length) cats.push(makeCat());
  Object.assign(cats[0], {
    name:        cfg.name        || cats[0].name,
    color:       cfg.color       || cats[0].color,
    size:        cfg.size        || cats[0].size,
    assignedApp: cfg.assignedApp || cats[0].assignedApp,
  });
  saveCats(cats);
  prefs.onboarded = true;
  savePrefs(prefs);
  closeOnboardingWindow();
  syncCatWindows(cats, onCatMoved); // creates the cat (or updates it on a replay)
  refresh();
  startMonitor();
  return true;
}

// ── Boot ──────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  cats = loadCats();
  prefs = loadPrefs();
  setCatTheme(prefs.theme);
  setCatBehavior({ activity: prefs.activity, quiet: prefs.quiet });

  ;({ refresh } = createTray(
    () => cats,
    {
      onSettings: openSettings,
      onRoast: roastCat,
      onToggle: toggleCat,
      onReplayOnboarding: () => createOnboardingWindow(),
      getQuiet: () => prefs.quiet,
      onToggleQuiet: () => {
        prefs.quiet = !prefs.quiet;
        savePrefs(prefs);
        setCatBehavior({ activity: prefs.activity, quiet: prefs.quiet });
        refresh();
      },
      onQuit: () => app.quit(),
    },
  ));

  registerIpcHandlers({
    getCats: () => cats,
    saveCats: (newCats) => {
      cats = newCats;
      saveCats(cats);
      syncCatWindows(cats, onCatMoved);
      refresh();
    },
    addCat: () => {
      const cat = makeCat();
      cats.push(cat);
      saveCats(cats);
      createCatWindow(cat, onCatMoved);
      refresh();
      return cat;
    },
    removeCat: (catId) => {
      cats = cats.filter(c => c.id !== catId);
      saveCats(cats);
      syncCatWindows(cats, onCatMoved);
      refresh();
    },
    manualRoast: roastCat,
    finishOnboarding,
    resizeCat: (id, size) => {              // live slider drag: resize now, persist on release
      const cat = cats.find(c => c.id === id);
      if (cat) cat.size = size;
      resizeCatWindow(id, size);
    },
    getPrefs: () => prefs,
    setTheme: (theme) => {
      prefs.theme = theme;
      savePrefs(prefs);
      setCatTheme(theme);
      return true;
    },
    setBehavior: (b) => {
      if (b && typeof b.activity === 'number') prefs.activity = b.activity;
      if (b && typeof b.quiet === 'boolean')   prefs.quiet = b.quiet;
      savePrefs(prefs);
      setCatBehavior({ activity: prefs.activity, quiet: prefs.quiet });
      refresh();
      return true;
    },
  });

  // First launch → run the walkthrough first; cats appear only when it finishes.
  // Demo always skips onboarding so it can showcase behaviour immediately.
  if (!IS_DEMO && !prefs.onboarded) {
    createOnboardingWindow();
    return;
  }

  for (const cat of cats) createCatWindow(cat, onCatMoved);
  if (IS_DEMO) runDemo(); else startMonitor();
});

app.on('window-all-closed', e => e.preventDefault());
app.on('will-quit', () => { if (monitor) monitor.stop(); if (usage) usage.stop(); });

// ── Demo ──────────────────────────────────────────────────────────────────────

const DEMO_SEQUENCE = [
  { trigger: 'contextRot60',   emotion: 'shocked', delay: 2000  },
  { trigger: 'errorLoop',      emotion: 'angry',   delay: 10000 },
  { trigger: 'panicPrompt',    emotion: 'shocked', delay: 10000 },
  { trigger: 'noContext',      emotion: 'bored',   delay: 10000 },
  { trigger: 'postOutput',     emotion: 'smug',    delay: 10000 },
  { trigger: 'cogWall',        emotion: 'bored',   delay: 10000 },
  { trigger: 'weekendOverwork',emotion: 'bored',   delay: 10000 },
  { trigger: 'midnight',       emotion: 'sleep',   delay: 10000 },
  { trigger: 'contextRot120',  emotion: 'angry',   delay: 10000 },
  { trigger: 'eyeRest',        emotion: 'smug',    delay: 10000 },
  { trigger: 'noBreak',        emotion: 'bored',   delay: 10000 },
  { trigger: 'longDay',        emotion: 'shocked', delay: 10000 },
  { trigger: 'dayStreak',      emotion: 'angry',   delay: 10000 },
];

function runDemo() {
  let i = 0;
  (function next() {
    if (i >= DEMO_SEQUENCE.length) i = 0;
    const step = DEMO_SEQUENCE[i++];
    dispatch(step, cats);
    setTimeout(next, step.delay);
  })();
}
