// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { User, Automation } from "../../app/src/shared/interfaces/database.interface";
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
    updateUser: (user: Partial<User>): Promise<any> => // Consider more specific return type
      ipcRenderer.invoke("database:updateUser", user),
    loginUser: (
      credentials: Pick<User, "email" | "password">
    ): Promise<{ success: boolean; user?: User; message?: string }> =>
      ipcRenderer.invoke("database:loginUser", credentials),
  },
  automation: {
    fetchAutomations: (): Promise<Automation[]> =>
      ipcRenderer.invoke("database:fetchAutomations"),
    addAutomation: (
      automation: Omit<Automation, "id" | "create_time" | "update_time" | "delete_time"> & { file?: ArrayBuffer }
    ): Promise<{ success: boolean; automation?: Automation; message?: string }> =>
      ipcRenderer.invoke("database:addAutomation", automation),
    updateAutomation: (
      automation: Partial<Automation> & Pick<Automation, "id"> & { file?: ArrayBuffer }
    ): Promise<{ success: boolean; automation?: Automation; message?: string }> =>
      ipcRenderer.invoke("database:updateAutomation", automation),
    deleteAutomation: (
      id: number
    ): Promise<{ success: boolean; id?: number; message?: string }> =>
      ipcRenderer.invoke("database:deleteAutomation", id),
    testExecuteAutomation: (
      id: number
    ): Promise<{ success: boolean; output?: string; error?: string; message?: string }> =>
      ipcRenderer.invoke("database:testExecuteAutomation", id),
  }
});
