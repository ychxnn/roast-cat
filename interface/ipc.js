// Registers all ipcMain handlers.
// All business logic is injected via the handlers object — this module only wires IPC.

const { ipcMain, BrowserWindow, systemPreferences, shell } = require('electron');

function isTrusted(prompt = false) {
  if (process.platform !== 'darwin') return true; // no accessibility gate off macOS
  try { return systemPreferences.isTrustedAccessibilityClient(prompt); }
  catch { return false; }
}

function registerIpcHandlers({ getCats, saveCats, addCat, removeCat, manualRoast, finishOnboarding, getPrefs, setTheme, resizeCat, setBehavior }) {
  ipcMain.handle('get-cats',    ()           => getCats());
  ipcMain.handle('save-cats',   (_, newCats) => saveCats(newCats));
  ipcMain.handle('add-cat',     ()           => addCat());
  ipcMain.handle('remove-cat',  (_, catId)   => removeCat(catId));
  ipcMain.handle('manual-roast',(_, catId)   => manualRoast(catId));
  ipcMain.handle('resize-cat',  (_, { id, size }) => resizeCat(id, size));

  // ── Onboarding / permissions ──
  ipcMain.handle('finish-onboarding',  (_, cfg) => finishOnboarding(cfg));
  ipcMain.handle('check-accessibility',   ()    => isTrusted(false));
  ipcMain.handle('request-accessibility', ()    => isTrusted(true)); // triggers the macOS prompt
  ipcMain.handle('open-accessibility-settings', () => {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
    return true;
  });

  // ── Theme / behavior ──
  ipcMain.handle('get-prefs', () => getPrefs());
  ipcMain.handle('set-theme', (_, theme) => setTheme(theme));
  ipcMain.handle('set-behavior', (_, b) => setBehavior(b));

  ipcMain.on('move-window', (event, { dx, dy }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const { screen } = require('electron');
    const [x, y] = win.getPosition();
    const [w, h] = win.getSize();
    const area = screen.getDisplayMatching({ x, y, width: w, height: h }).workArea;
    // clamp so the cat always stays fully on-screen (roam + drag both)
    const nx = Math.max(area.x, Math.min(Math.round(x + dx), area.x + area.width  - w));
    const ny = Math.max(area.y, Math.min(Math.round(y + dy), area.y + area.height - h));
    win.setPosition(nx, ny);
  });
}

module.exports = { registerIpcHandlers };
