const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("emsDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
  navigate: (url) => ipcRenderer.send("ems:navigate", url),
  getServerUrl: () => ipcRenderer.invoke("ems:get-server-url"),
  setServerUrl: (url) => ipcRenderer.invoke("ems:set-server-url", url),
});
