const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { initializeStorage, deleteAllSaves, enforceSingleSaveSlot } = require('./game/storage');
const {
  initializeIpc,
  registerWindow,
  unregisterWindow,
  setAudienceWindowFactory,
} = require('./game/ipc');
const { initializeSettings, isSetupComplete, isEulaAccepted, deleteSettings } = require('./game/settings');
const { initializeLicense, isPaid, deactivateLicense } = require('./game/license');
const { initializeUpdater, scheduleStartupCheck } = require('./game/updater');

let mainWindow;
let audienceWindow = null;

const windowPrefs = () => ({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

function createAudienceWindow(existing) {
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return existing;
  }

  audienceWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    title: 'Bingo — Publiek',
    icon: path.join(__dirname, 'build', 'icon.png'),
    ...windowPrefs(),
  });

  audienceWindow.loadFile(path.join(__dirname, 'views/audience/index.html'));
  audienceWindow.once('ready-to-show', () => {
    audienceWindow.show();
  });

  registerWindow(audienceWindow);
  audienceWindow.on('closed', () => {
    unregisterWindow(audienceWindow);
    audienceWindow = null;
  });

  return audienceWindow;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    ...windowPrefs(),
  });

  if (!isEulaAccepted()) {
    mainWindow.loadFile(path.join(__dirname, 'views/eula/index.html'), {
      query: { mode: 'accept' },
    });
  } else if (isSetupComplete()) {
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
      label: 'Bestand',
      submenu: [
        {
          label: 'Avondrapport exporteren…',
          click: async () => {
            if (!isPaid()) {
              dialog.showMessageBox(mainWindow || undefined, {
                type: 'info',
                title: 'Betaalde functie',
                message: 'Avondrapport exporteren vereist een betaalde licentie (Voorkeuren → Licentie).',
              });
              return;
            }
            const { exportEveningReport } = require('./game/evening-report');
            await exportEveningReport({ parentWindow: mainWindow });
          },
        },
        { type: 'separator' },
        { label: 'Afsluiten', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Beeld',
      submenu: [
        { role: 'togglefullscreen', label: 'Volledig scherm' },
        {
          label: 'Venster voor publiek',
          click: () => {
            if (!isPaid()) {
              dialog.showMessageBox(mainWindow || undefined, {
                type: 'info',
                title: 'Betaalde functie',
                message: 'Het publieksvenster vereist een betaalde licentie (Voorkeuren → Licentie).',
              });
              return;
            }
            audienceWindow = createAudienceWindow(audienceWindow);
          },
        },
        { type: 'separator' },
        { role: 'reload', label: 'Vernieuwen' },
        { role: 'forceReload', label: 'Hard vernieuwen' },
        { role: 'toggleDevTools', label: 'Ontwikkelaarshulpmiddelen', visible: isDev },
      ],
    },
  ];

  if (isDev) {
    menuTemplate.push({
      label: 'Ontwikkelaar',
      submenu: [
        { role: 'toggleDevTools', label: 'Ontwikkelaarshulpmiddelen' },
        { type: 'separator' },
        {
          label: 'Gegevensmap openen',
          click: () => {
            shell.openPath(app.getPath('userData'));
          },
        },
        { type: 'separator' },
        {
          label: 'Alles resetten en verwijderen',
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
            deactivateLicense();
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
  initializeLicense();
  if (!isPaid()) {
    enforceSingleSaveSlot();
  }
  setAudienceWindowFactory(createAudienceWindow);
  initializeIpc();
  initializeUpdater();
  createWindow();
  createMenu();
  scheduleStartupCheck();

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
