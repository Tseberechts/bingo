const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { initializeStorage, deleteAllSaves } = require('./game/storage');
const { initializeIpc, registerWindow, unregisterWindow } = require('./game/ipc');
const { initializeSettings, isSetupComplete, deleteSettings } = require('./game/settings');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isSetupComplete()) {
    mainWindow.loadFile(path.join(__dirname, 'views/menu/index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'views/initial-setup/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  registerWindow(mainWindow);
  mainWindow.on('closed', () => {
    unregisterWindow(mainWindow);
    mainWindow = null;
  });
}

function createMenu() {
  const isDev = !app.isPackaged;
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools', visible: isDev },
      ],
    },
  ];

  if (isDev) {
    menuTemplate.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Open Data Folder',
          click: () => {
            shell.openPath(app.getPath('userData'));
          },
        },
        { type: 'separator' },
        {
          label: 'Reset and Delete All Data',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow || undefined, {
              type: 'warning',
              buttons: ['Annuleren', 'Alles verwijderen'],
              defaultId: 0,
              cancelId: 0,
              title: 'Alle data verwijderen',
              message: 'Weet je zeker dat je alle instellingen, logo\'s, sponsors en opgeslagen spellen wilt verwijderen?',
              detail: 'Dit kan niet ongedaan worden gemaakt. De app herstart daarna.',
            });
            if (response !== 1) return;
            deleteAllSaves();
            deleteSettings();
            app.relaunch();
            app.quit();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  initializeStorage();
  initializeSettings();
  initializeIpc();
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
