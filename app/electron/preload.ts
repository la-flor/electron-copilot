// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("db", {
  user: {
    fetchUsers: () => ipcRenderer.invoke("database:fetchUsers"),
    addUser: (user: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => ipcRenderer.invoke("database:addUser", user),
  },
});
