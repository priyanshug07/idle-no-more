const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');

// Handle macOS security and app lifecycle
if (process.platform === 'darwin') {
  // Prevent the app from being quarantined
  app.setAsDefaultProtocolClient('idlenomore');
  
  // Handle macOS activation
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Idle No More',
    icon: path.join(__dirname, 'renderer', 'idle-no-more-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    fullscreen: true, // Start in fullscreen
    kiosk: false // Allow exiting fullscreen
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Prevent new window creation
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Register keyboard shortcuts
  globalShortcut.register('F11', () => {
    win.setFullScreen(!win.isFullScreen());
  });

  globalShortcut.register('Escape', () => {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    }
  });

  // Create application menu
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'F11',
          click: () => {
            win.setFullScreen(!win.isFullScreen());
          }
        },
        {
          label: 'Exit Full Screen',
          accelerator: 'Escape',
          click: () => {
            win.setFullScreen(false);
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            win.reload();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length) {
      if (windows[0].isMinimized()) windows[0].restore();
      windows[0].focus();
    }
  });
} 