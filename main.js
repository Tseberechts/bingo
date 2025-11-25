const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { initializeStorage, deleteAllSaves } = require('./game/storage');
const { initializeIpc, registerWindow, unregisterWindow } = require('./game/ipc');
const { initializeSettings, settingsExist, deleteSettings } = require('./game/settings');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (settingsExist()) {
    mainWindow.loadFile('views/menu/index.html');
  } else {
    mainWindow.loadFile('views/initial-setup/index.html');
  }

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
                { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        }
    ];

    if (isDev) {
        menuTemplate.push({
            label: 'Developer',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                {
                    label: 'Reset and Delete All Data',
                    click: () => {
                        deleteAllSaves();
                        deleteSettings();
                        app.relaunch();
                        app.quit();
                    }
                },
            ]
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
