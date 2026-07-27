const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    title: 'Hoop Life',
    backgroundColor: '#eef1f6',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  // The bundled single file, not web/index.html. loadFile serves over file://,
  // and Chromium blocks ES module imports from file:// origins — pointing this
  // at web/index.html opens a window with the chrome painted and no game in it.
  // `npm run desktop` builds dist/build-a-hooper.html first.
  win.loadFile(path.join(__dirname, 'dist', 'build-a-hooper.html'));
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.buildahooper.game');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
