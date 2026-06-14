// Owns the menu-bar tray. Exposes createTray() which returns a refresh() handle.
// Handlers are injected — this module has no knowledge of cats state directly.

const { Tray, Menu, nativeImage } = require('electron');

function createTray(getCats, handlers) {
  const tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('🐱');
  tray.setToolTip('Roast Cat');

  function refresh() {
    tray.setContextMenu(_buildMenu(getCats(), handlers));
  }

  tray.on('click', refresh);
  refresh();
  return { tray, refresh };
}

function _buildMenu(cats, { onSettings, onRoast, onToggle, onQuit }) {
  return Menu.buildFromTemplate([
    { label: '🐱 Roast Cat', enabled: false },
    { type: 'separator' },
    { label: 'Settings', click: onSettings },
    { type: 'separator' },
    ...cats.map(cat => ({
      label: cat.name,
      submenu: [
        { label: 'Roast me now',               click: () => onRoast(cat.id)  },
        { label: cat.enabled ? 'Mute' : 'Unmute', click: () => onToggle(cat.id) },
      ],
    })),
    { type: 'separator' },
    { label: 'Quit', click: onQuit },
  ]);
}

module.exports = { createTray };
