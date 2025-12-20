const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Ye line check karti hai ke files kahan hain
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath);
}

app.whenReady().then(createWindow);
