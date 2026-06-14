// File I/O boundary: persists cat configuration to userData.
// Only cat preferences are stored — never session content.

const path = require('path');
const fs   = require('fs');

let configPath = null;
let prefsPath  = null;

function getConfigPath() {
  if (!configPath) {
    const { app } = require('electron');
    configPath = path.join(app.getPath('userData'), 'cats.json');
  }
  return configPath;
}

function getPrefsPath() {
  if (!prefsPath) {
    const { app } = require('electron');
    prefsPath = path.join(app.getPath('userData'), 'prefs.json');
  }
  return prefsPath;
}

// App-level preferences (not per-cat). Currently just onboarding state.
const DEFAULT_PREFS = { onboarded: false, theme: 'pink', activity: 60, quiet: false };

function loadPrefs() {
  try {
    const p = getPrefsPath();
    if (fs.existsSync(p)) {
      return { ...DEFAULT_PREFS, ...JSON.parse(fs.readFileSync(p, 'utf-8')) };
    }
  } catch {}
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs) {
  try { fs.writeFileSync(getPrefsPath(), JSON.stringify(prefs, null, 2)); } catch {}
}

// ── Usage / health tracking ──────────────────────────────────────────────────
// Real activity data so health roasts aren't random. Stores nothing about WHAT
// you do — only WHEN (active-time buckets), so the cat can roast on overwork.
let usagePath = null;
function getUsagePath() {
  if (!usagePath) {
    const { app } = require('electron');
    usagePath = path.join(app.getPath('userData'), 'usage.json');
  }
  return usagePath;
}

const DEFAULT_USAGE = { day: null, activeMs: 0, streak: 0, lastActiveDay: null };

function loadUsage() {
  try {
    const p = getUsagePath();
    if (fs.existsSync(p)) return { ...DEFAULT_USAGE, ...JSON.parse(fs.readFileSync(p, 'utf-8')) };
  } catch {}
  return { ...DEFAULT_USAGE };
}

function saveUsage(data) {
  try { fs.writeFileSync(getUsagePath(), JSON.stringify(data, null, 2)); } catch {}
}

function makeCat(overrides = {}) {
  return {
    id:          Date.now().toString() + Math.random().toString(36).slice(2),
    name:        'Roast Cat',
    color:       'orange',
    size:        'medium',
    assignedApp: 'any',
    enabled:     true,
    roam:        'free',   // 'free' (zoomies) | 'static' (couch potato)
    x:           null,
    y:           null,
    ...overrides,
  };
}

function loadCats() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      const saved = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (Array.isArray(saved) && saved.length) return saved;
    }
  } catch {}
  const initial = [makeCat()];
  saveCats(initial);
  return initial;
}

function saveCats(cats) {
  try { fs.writeFileSync(getConfigPath(), JSON.stringify(cats, null, 2)); } catch {}
}

module.exports = { makeCat, loadCats, saveCats, loadPrefs, savePrefs, loadUsage, saveUsage };
