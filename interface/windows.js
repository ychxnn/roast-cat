// Manages all BrowserWindows: cat overlays and the settings panel.
// catWindows is module-level shared state — exported for IPC and dispatch use.

const { BrowserWindow, screen } = require('electron');
const path = require('path');

const SIZES       = { small: 160, medium: 220, large: 290 };
const PRELOAD     = path.join(__dirname, '..', 'preload.js');
const CAT_HTML    = path.join(__dirname, '..', 'renderer', 'cat.html');
const SETTINGS_HTML = path.join(__dirname, '..', 'renderer', 'settings.html');

const catWindows = new Map();
let settingsWindow = null;

function createCatWindow(cat, onMoved) {
  if (catWindows.has(cat.id)) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const sz = SIZES[cat.size] ?? 220;

  const win = new BrowserWindow({
    width:  sz + 60,
    height: sz + 100,
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

  win.loadFile(CAT_HTML);
  win.setIgnoreMouseEvents(false);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.webContents.on('did-finish-load', () => win.webContents.send('init', cat));
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    onMoved(cat.id, x, y);
  });
  win.on('closed', () => catWindows.delete(cat.id));
  catWindows.set(cat.id, win);
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
    if (!catWindows.has(cat.id)) createCatWindow(cat, onMoved);
    else {
      const win = catWindows.get(cat.id);
      if (!win.isDestroyed()) win.webContents.send('init', cat);
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

module.exports = { catWindows, createCatWindow, destroyCatWindow, syncCatWindows, dispatch, openSettings };
