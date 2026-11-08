const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

const APP_TITLE = "Employee Management System (EMS) - GIET Polytechnic College";
const WEB_DIST_DIR = path.join(__dirname, "web-dist");

let internalServer = null;
let internalPort = null;
let mainWindow = null;
let splashHandled = false;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

/**
 * Starts an embedded local HTTP server in the main process to serve bundled web assets.
 * Handles client-side SPA routing by falling back to index.html.
 */
function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    internalServer = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://127.0.0.1:${internalPort || 3000}`);
        let filePath = path.join(WEB_DIST_DIR, decodeURIComponent(parsedUrl.pathname));

        // Prevent directory traversal
        if (!filePath.startsWith(WEB_DIST_DIR)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }

        fs.stat(filePath, (err, stats) => {
          if (!err && stats.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = MIME_TYPES[ext] || "application/octet-stream";
            res.writeHead(200, { "Content-Type": mime });
            fs.createReadStream(filePath).pipe(res);
          } else {
            // SPA fallback: return index.html for all client routes (/login, /portal, etc.)
            const indexPath = path.join(WEB_DIST_DIR, "index.html");
            fs.readFile(indexPath, (readErr, content) => {
              if (readErr) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("EMS bundle not found. Please verify application package.");
              } else {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(content);
              }
            });
          }
        });
      } catch (e) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Application Error");
      }
    });

    // Listen on 127.0.0.1 with ephemeral random port
    internalServer.listen(0, "127.0.0.1", () => {
      internalPort = internalServer.address().port;
      resolve(internalPort);
    });

    internalServer.on("error", (err) => {
      reject(err);
    });
  });
}

function getAppLoginUrl() {
  return `http://127.0.0.1:${internalPort}/login`;
}

function navigateToLogin() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.loadURL(getAppLoginUrl()).catch(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, "connecting.html"));
    }
  });
}

// IPC Handlers
ipcMain.on("ems:navigate", (event, url) => {
  if (mainWindow && url) {
    mainWindow.loadURL(url).catch(() => {
      mainWindow.loadFile(path.join(__dirname, "connecting.html"));
    });
  }
});

ipcMain.on("ems:splash-ready", () => {
  if (splashHandled) return;
  splashHandled = true;
  navigateToLogin();
});

ipcMain.handle("ems:get-server-url", () => {
  return `http://127.0.0.1:${internalPort}`;
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

  // Native Application Menu
  const template = [
    {
      label: "Application",
      submenu: [
        {
          label: "Reload Application",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow && mainWindow.reload(),
        },
        {
          label: "Login Screen",
          accelerator: "CmdOrCtrl+L",
          click: () => navigateToLogin(),
        },
        {
          label: "Portal Home",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`http://127.0.0.1:${internalPort}/portal`);
            }
          },
        },
        { type: "separator" },
        {
          label: "Exit EMS",
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
          label: "About GIET EMS",
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`http://127.0.0.1:${internalPort}/about`);
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load opening splash animation first
  mainWindow.loadFile(path.join(__dirname, "splash.html")).catch(() => {
    navigateToLogin();
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Safety fallback: transition to login after 2.2 seconds if splash event was missed
  setTimeout(() => {
    if (!splashHandled) {
      splashHandled = true;
      navigateToLogin();
    }
  }, 2200);

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      if (!url.startsWith(`http://127.0.0.1:${internalPort}`)) {
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

  app.whenReady().then(async () => {
    try {
      await startEmbeddedServer();
      createWindow();
    } catch (err) {
      console.error("Failed to start embedded application server:", err);
      createWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (internalServer) {
      internalServer.close();
    }
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
