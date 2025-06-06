// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { User } from "../../app/src/shared/interfaces/database.interface";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("db", {
  user: {
    fetchUsers: (): Promise<User[]> =>
      ipcRenderer.invoke("database:fetchUsers"),
    fetchUser: (id: number): Promise<User> =>
      ipcRenderer.invoke("database:fetchUser", id),
    addUser: (
      user: Pick<User, "first_name" | "last_name" | "email" | "password">
    ): Promise<void> => ipcRenderer.invoke("database:addUser", user),
    updateUser: (user: Partial<User>): Promise<any> =>
      ipcRenderer.invoke("database:updateUser", user),
    loginUser: (
      credentials: Pick<User, "email" | "password">
    ): Promise<{ success: boolean; user?: User; message?: string }> =>
      ipcRenderer.invoke("database:loginUser", credentials),
  },
});
