// Registers all ipcMain handlers.
// All business logic is injected via the handlers object — this module only wires IPC.

const { ipcMain, BrowserWindow } = require('electron');

function registerIpcHandlers({ getCats, saveCats, addCat, removeCat, manualRoast }) {
  ipcMain.handle('get-cats',    ()           => getCats());
  ipcMain.handle('save-cats',   (_, newCats) => saveCats(newCats));
  ipcMain.handle('add-cat',     ()           => addCat());
  ipcMain.handle('remove-cat',  (_, catId)   => removeCat(catId));
  ipcMain.handle('manual-roast',(_, catId)   => manualRoast(catId));

  ipcMain.on('move-window', (event, { dx, dy }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const [x, y] = win.getPosition();
    win.setPosition(Math.round(x + dx), Math.round(y + dy));
  });
}

module.exports = { registerIpcHandlers };
