import { contextBridge, ipcRenderer } from "electron";

// Safe, typed bridge between the renderer and the main process.
const api = {
  getStatus: () => ipcRenderer.invoke("status:get"),
  refresh: () => ipcRenderer.invoke("status:refresh"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (partial: Record<string, unknown>) => ipcRenderer.invoke("settings:save", partial),
  testConnection: (creds: { apiUrl: string; apiKey: string; userId: string }) =>
    ipcRenderer.invoke("settings:test", creds),
  openDashboard: () => ipcRenderer.invoke("app:open-dashboard"),
  resize: (height: number) => ipcRenderer.invoke("app:resize", height),
  quit: () => ipcRenderer.invoke("app:quit"),
  onStatusUpdate: (cb: (payload: unknown) => void) => {
    const listener = (_e: unknown, payload: unknown) => cb(payload);
    ipcRenderer.on("status:update", listener);
    return () => ipcRenderer.removeListener("status:update", listener);
  },
};

contextBridge.exposeInMainWorld("devlife", api);

export type DevlifeApi = typeof api;
