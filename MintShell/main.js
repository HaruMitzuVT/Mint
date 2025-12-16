const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Obtener tamaño REAL del display
  const { width, height } = screen.getPrimaryDisplay().bounds;

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,

    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    resizable: false,
    movable: false,
    fullscreenable: true,
    useContentSize: true,
    backgroundColor: '#000000',

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Forzar tamaño otra vez (sí, intencional)
  mainWindow.setBounds({ x: 0, y: 0, width, height });
  mainWindow.setFullScreen(true);

  mainWindow.loadFile('distro/index.html');
}

app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(() => {
  createWindow();

  // Re-crear ventana si el display cambia (hotplug, live USB)
  screen.on('display-metrics-changed', () => {
    if (mainWindow) {
      const { width, height } = screen.getPrimaryDisplay().bounds;
      mainWindow.setBounds({ x: 0, y: 0, width, height });
    }
  });
});
