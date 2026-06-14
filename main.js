// Entry point — boots the app, owns cats state, wires all modules together.

const { app } = require('electron');
const { loadCats, saveCats, makeCat }                       = require('./src/infra/config');
const { createTray }                                         = require('./interface/tray');
const { catWindows, createCatWindow, syncCatWindows, dispatch, openSettings } = require('./interface/windows');
const { registerIpcHandlers }                                = require('./interface/ipc');
const Monitor                                                = require('./src/service/monitor');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const IS_DEMO = process.argv.includes('--demo');

// ── App state ─────────────────────────────────────────────────────────────────

let cats    = [];
let refresh = null;
let monitor = null;

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

// ── Boot ──────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  cats = loadCats();

  ;({ refresh } = createTray(
    () => cats,
    { onSettings: openSettings, onRoast: roastCat, onToggle: toggleCat, onQuit: () => app.quit() },
  ));

  for (const cat of cats) createCatWindow(cat, onCatMoved);

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
  });

  if (IS_DEMO) {
    runDemo();
  } else {
    monitor = new Monitor();
    monitor.on('context', event => dispatch(event, cats));
    monitor.start();
  }
});

app.on('window-all-closed', e => e.preventDefault());
app.on('will-quit', () => { if (monitor) monitor.stop(); });

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
