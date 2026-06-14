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
  resizeCat:  (id, size)=> ipcRenderer.invoke('resize-cat', { id, size }), // live, no save

  // onboarding / permissions
  finishOnboarding:        cfg => ipcRenderer.invoke('finish-onboarding', cfg),
  checkAccessibility:      ()  => ipcRenderer.invoke('check-accessibility'),
  requestAccessibility:    ()  => ipcRenderer.invoke('request-accessibility'),
  openAccessibilitySettings:() => ipcRenderer.invoke('open-accessibility-settings'),

  // theme / behavior
  getPrefs:    ()      => ipcRenderer.invoke('get-prefs'),
  setTheme:    theme   => ipcRenderer.invoke('set-theme', theme),
  onTheme:     cb      => ipcRenderer.on('theme', (_, v) => cb(v)),
  setBehavior: b       => ipcRenderer.invoke('set-behavior', b),
  onBehavior:  cb      => ipcRenderer.on('behavior', (_, v) => cb(v)),
});
