const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // cat window
  onInit:       cb => ipcRenderer.on('init',        (_, v) => cb(v)),
  onRoast:      cb => ipcRenderer.on('manual-roast',()     => cb()),
  onContext:    cb => ipcRenderer.on('context',     (_, v) => cb(v)),
  moveWindow:  (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),

  // settings window
  getCats:     ()       => ipcRenderer.invoke('get-cats'),
  saveCats:    cats     => ipcRenderer.invoke('save-cats', cats),
  addCat:      ()       => ipcRenderer.invoke('add-cat'),
  removeCat:   catId    => ipcRenderer.invoke('remove-cat', catId),
  manualRoast: catId    => ipcRenderer.invoke('manual-roast', catId),
});
