const {
  app, BrowserWindow, Tray, Menu, nativeImage,
  screen, ipcMain,
} = require('electron');
const path = require('path');
const fs = require('fs');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const CONFIG_PATH = path.join(app.getPath('userData'), 'cats.json');
const catWindows = new Map();
let cats = [];
let tray = null;
let settingsWindow = null;
let monitor = null;

// ── Config ────────────────────────────────────────────────────────────────────

function makeCat(overrides = {}) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: 'Roast Cat',
    color: 'orange',
    size: 'medium',
    assignedApp: 'any',
    freqMin: 45,
    freqMax: 90,
    enabled: true,
    x: null,
    y: null,
    ...overrides,
  };
}

function loadCats() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (Array.isArray(saved) && saved.length) { cats = saved; return; }
    }
  } catch {}
  cats = [makeCat()];
  saveCats();
}

function saveCats() {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cats, null, 2)); } catch {}
}

// ── Cat windows ───────────────────────────────────────────────────────────────

const SIZES = { small: 160, medium: 220, large: 290 };

function createCatWindow(cat) {
  if (catWindows.has(cat.id)) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const sz = SIZES[cat.size] ?? 220;

  const win = new BrowserWindow({
    width: sz + 60,
    height: sz + 100,
    x: cat.x ?? width - sz - 80,
    y: cat.y ?? height - sz - 120,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('cat.html');
  win.setIgnoreMouseEvents(false);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.webContents.on('did-finish-load', () => win.webContents.send('init', cat));
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    const c = cats.find(c => c.id === cat.id);
    if (c) { c.x = x; c.y = y; saveCats(); }
  });
  win.on('closed', () => catWindows.delete(cat.id));
  catWindows.set(cat.id, win);
}

function destroyCatWindow(catId) {
  const win = catWindows.get(catId);
  if (win && !win.isDestroyed()) win.close();
  catWindows.delete(catId);
}

function syncCatWindows() {
  const ids = new Set(cats.map(c => c.id));
  for (const id of catWindows.keys()) {
    if (!ids.has(id)) destroyCatWindow(id);
  }
  for (const cat of cats) {
    if (!catWindows.has(cat.id)) createCatWindow(cat);
    else {
      const win = catWindows.get(cat.id);
      if (!win.isDestroyed()) win.webContents.send('init', cat);
    }
  }
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: '🐱 Roast Cat', enabled: false },
    { type: 'separator' },
    { label: 'Settings', click: openSettings },
    { type: 'separator' },
    ...cats.map(cat => ({
      label: cat.name,
      submenu: [
        {
          label: 'Roast me now',
          click: () => {
            const w = catWindows.get(cat.id);
            if (w && !w.isDestroyed()) w.webContents.send('manual-roast');
          },
        },
        {
          label: cat.enabled ? 'Mute' : 'Unmute',
          click: () => {
            cat.enabled = !cat.enabled;
            saveCats();
            const w = catWindows.get(cat.id);
            if (w && !w.isDestroyed()) w.webContents.send('init', cat);
            tray.setContextMenu(buildMenu());
          },
        },
      ],
    })),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('🐱');
  tray.setToolTip('Roast Cat');
  tray.setContextMenu(buildMenu());
  tray.on('click', () => tray.setContextMenu(buildMenu()));
}

// ── Settings window ───────────────────────────────────────────────────────────

function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width: 700,
    height: 740,
    title: 'Roast Cat — Settings',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  settingsWindow.loadFile('settings.html');
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('get-cats', () => cats);

ipcMain.handle('save-cats', (_, newCats) => {
  cats = newCats;
  saveCats();
  syncCatWindows();
  tray.setContextMenu(buildMenu());
});

ipcMain.handle('add-cat', () => {
  const cat = makeCat();
  cats.push(cat);
  saveCats();
  createCatWindow(cat);
  tray.setContextMenu(buildMenu());
  return cat;
});

ipcMain.handle('remove-cat', (_, catId) => {
  cats = cats.filter(c => c.id !== catId);
  saveCats();
  destroyCatWindow(catId);
  tray.setContextMenu(buildMenu());
});

ipcMain.handle('manual-roast', (_, catId) => {
  const w = catWindows.get(catId);
  if (w && !w.isDestroyed()) w.webContents.send('manual-roast');
});

ipcMain.on('move-window', (event, { dx, dy }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  const [x, y] = win.getPosition();
  win.setPosition(Math.round(x + dx), Math.round(y + dy));
});

// ── Monitor → cats ────────────────────────────────────────────────────────────

function dispatch(event) {
  for (const cat of cats) {
    if (!cat.enabled) continue;
    if (cat.assignedApp !== 'any' && cat.assignedApp !== event.app) continue;
    const w = catWindows.get(cat.id);
    if (w && !w.isDestroyed()) w.webContents.send('context', event);
  }
}

// ── Demo mode ─────────────────────────────────────────────────────────────────

const DEMO_SEQUENCE = [
  { trigger: 'contextRot60',  emotion: 'shocked', delay: 2000  },
  { trigger: 'errorLoop',     emotion: 'angry',   delay: 10000 },
  { trigger: 'panicPrompt',   emotion: 'shocked', delay: 10000 },
  { trigger: 'noContext',     emotion: 'bored',   delay: 10000 },
  { trigger: 'postOutput',    emotion: 'smug',    delay: 10000 },
  { trigger: 'cogWall',       emotion: 'bored',   delay: 10000 },
  { trigger: 'weekendOverwork',emotion:'bored',   delay: 10000 },
  { trigger: 'midnight',      emotion: 'sleep',   delay: 10000 },
  { trigger: 'contextRot120', emotion: 'angry',   delay: 10000 },
];

function runDemo() {
  let i = 0;
  function next() {
    if (i >= DEMO_SEQUENCE.length) { i = 0; } // loop
    const step = DEMO_SEQUENCE[i++];
    dispatch(step);
    setTimeout(next, step.delay);
  }
  setTimeout(next, 1500);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

const IS_DEMO = process.argv.includes('--demo');

app.whenReady().then(() => {
  loadCats();
  createTray();
  for (const cat of cats) createCatWindow(cat);

  if (IS_DEMO) {
    runDemo();
  } else {
    const Monitor = require('./monitor');
    monitor = new Monitor();
    monitor.on('context', dispatch);
    monitor.start();
  }
});

app.on('window-all-closed', e => e.preventDefault());
app.on('will-quit', () => { if (monitor) monitor.stop(); });
