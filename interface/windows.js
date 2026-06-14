// Manages all BrowserWindows: cat overlays and the settings panel.
// catWindows is module-level shared state — exported for IPC and dispatch use.

const { BrowserWindow, screen } = require('electron');
const path = require('path');

const SIZES       = { small: 190, medium: 250, large: 310 }; // legacy string sizes still supported
const SIZE_MIN = 120, SIZE_MAX = 340;
// resolve a cat.size (number px, or legacy 'small'/'medium'/'large') to a base px
function sizePx(size) {
  const n = (typeof size === 'number') ? size : (SIZES[size] ?? 250);
  return Math.max(SIZE_MIN, Math.min(SIZE_MAX, n));
}
const PRELOAD     = path.join(__dirname, '..', 'preload.js');
const CAT_HTML    = path.join(__dirname, '..', 'renderer', 'cat.html');
const SETTINGS_HTML = path.join(__dirname, '..', 'renderer', 'settings.html');
const ONBOARDING_HTML = path.join(__dirname, '..', 'renderer', 'onboarding.html');

const catWindows = new Map();
let settingsWindow = null;
let onboardingWindow = null;
let currentTheme = 'pink'; // app-wide chat theme, broadcast to every cat window
let currentBehavior = { activity: 60, quiet: false };

function setCatTheme(theme) {
  currentTheme = theme || 'pink';
  for (const win of catWindows.values()) {
    if (win && !win.isDestroyed()) win.webContents.send('theme', currentTheme);
  }
}

function setCatBehavior(behavior) {
  currentBehavior = { activity: 60, quiet: false, ...behavior };
  for (const win of catWindows.values()) {
    if (win && !win.isDestroyed()) win.webContents.send('behavior', currentBehavior);
  }
}

function createCatWindow(cat, onMoved) {
  if (catWindows.has(cat.id)) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const sz = sizePx(cat.size);

  const win = new BrowserWindow({
    width:  sz + 30,
    height: sz + 110, // a little headroom for the (now short) bubble; keeps the cat filling the frame
    x: cat.x ?? width  - sz - 80,
    y: cat.y ?? height - sz - 120,
    transparent:  true,
    frame:        false,
    alwaysOnTop:  true,
    skipTaskbar:  true,
    resizable:    false,
    hasShadow:    false,
    webPreferences: { preload: PRELOAD, contextIsolation: true },
  });

  win._catSize = cat.size; // remembered so syncCatWindows can detect a size change
  win.loadFile(CAT_HTML);
  win.setIgnoreMouseEvents(false);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('init', cat);
    win.webContents.send('theme', currentTheme);
    win.webContents.send('behavior', currentBehavior);
  });
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    onMoved(cat.id, x, y);
  });
  // guard: only forget this window if the map still points at THIS instance
  // (prevents a late 'closed' from a replaced window deleting its successor)
  win.on('closed', () => { if (catWindows.get(cat.id) === win) catWindows.delete(cat.id); });
  catWindows.set(cat.id, win);
}

// Live resize from the settings slider — no persistence, no recreate.
function resizeCatWindow(catId, size) {
  const win = catWindows.get(catId);
  if (!win || win.isDestroyed()) return;
  const sz = sizePx(size);
  win.setSize(sz + 30, sz + 110);
  win._catSize = size;
}

function destroyCatWindow(catId) {
  const win = catWindows.get(catId);
  if (win && !win.isDestroyed()) win.close();
  catWindows.delete(catId);
}

function syncCatWindows(cats, onMoved) {
  const ids = new Set(cats.map(c => c.id));
  for (const id of catWindows.keys()) {
    if (!ids.has(id)) destroyCatWindow(id);
  }
  for (const cat of cats) {
    const win = catWindows.get(cat.id);
    if (!win || win.isDestroyed()) {
      createCatWindow(cat, onMoved);          // genuinely new cat
    } else {
      if (win._catSize !== cat.size) {        // size changed → resize IN PLACE (no new window)
        const sz = sizePx(cat.size);
        win.setSize(sz + 30, sz + 110);
        win._catSize = cat.size;
      }
      win.webContents.send('init', cat);      // colour / name / enabled / roam / size
    }
  }
}

function dispatch(event, cats) {
  for (const cat of cats) {
    if (!cat.enabled) continue;
    const win = catWindows.get(cat.id);
    if (win && !win.isDestroyed()) win.webContents.send('context', event);
  }
}

function createOnboardingWindow() {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) { onboardingWindow.focus(); return onboardingWindow; }
  onboardingWindow = new BrowserWindow({
    width:  560,
    height: 680,
    resizable: false,
    title: 'Welcome to Roast Cat',
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: PRELOAD, contextIsolation: true },
  });
  onboardingWindow.loadFile(ONBOARDING_HTML);
  onboardingWindow.on('closed', () => { onboardingWindow = null; });
  return onboardingWindow;
}

function closeOnboardingWindow() {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) onboardingWindow.close();
  onboardingWindow = null;
}

function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width:  700,
    height: 740,
    title:  'Roast Cat — Settings',
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: PRELOAD, contextIsolation: true },
  });
  settingsWindow.loadFile(SETTINGS_HTML);
}

module.exports = {
  catWindows, createCatWindow, destroyCatWindow, syncCatWindows, dispatch, openSettings,
  createOnboardingWindow, closeOnboardingWindow, setCatTheme, resizeCatWindow,
  setCatBehavior,
};
