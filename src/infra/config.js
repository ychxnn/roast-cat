// File I/O boundary: persists cat configuration to userData.
// Only cat preferences are stored — never session content.

const path = require('path');
const fs   = require('fs');

let configPath = null;

function getConfigPath() {
  if (!configPath) {
    const { app } = require('electron');
    configPath = path.join(app.getPath('userData'), 'cats.json');
  }
  return configPath;
}

function makeCat(overrides = {}) {
  return {
    id:          Date.now().toString() + Math.random().toString(36).slice(2),
    name:        'Roast Cat',
    color:       'orange',
    size:        'medium',
    assignedApp: 'any',
    enabled:     true,
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

module.exports = { makeCat, loadCats, saveCats };
