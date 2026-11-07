const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const path = require("path");

const APP_TITLE = "Employee Management System (EMS) - GIET Polytechnic College";
let currentServerUrl = process.env.EMS_WEB_URL || "http://localhost:3000";
let mainWindow = null;

// IPC handlers
ipcMain.on("ems:navigate", (event, url) => {
  if (mainWindow && url) {
    currentServerUrl = url;
    mainWindow.loadURL(url).catch(() => {
      mainWindow.loadFile(path.join(__dirname, "connecting.html"));
    });
  }
});

ipcMain.handle("ems:get-server-url", () => {
  return currentServerUrl;
});

ipcMain.handle("ems:set-server-url", (event, url) => {
  if (url) {
    currentServerUrl = url;
    return true;
  }
  return false;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: APP_TITLE,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: "#0f172a",
    show: false,
  });

  // Native Windows Menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Reload Portal",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow && mainWindow.reload(),
        },
        {
          label: "Portal Home",
          accelerator: "CmdOrCtrl+H",
          click: () => mainWindow && mainWindow.loadURL(`${currentServerUrl}/portal`),
        },
        {
          label: "Connection Settings",
          click: () => mainWindow && mainWindow.loadFile(path.join(__dirname, "connecting.html")),
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          click: () => mainWindow && mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About EMS",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${currentServerUrl}/about`);
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // If loading fails, load the fallback connecting page
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    // Error code -3 is ABORTED (e.g. user navigation before page finished loading)
    if (errorCode === -3) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, "connecting.html"));
    }
  });

  // Attempt to load the portal
  mainWindow.loadURL(currentServerUrl).catch(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, "connecting.html"));
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      if (!url.startsWith(currentServerUrl)) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
