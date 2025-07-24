// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import {
	ApiKey,
	Automation,
	OllamaModel,
	User,
} from '../../app/src/shared/interfaces/database.interface';

contextBridge.exposeInMainWorld('agent', {
	stream: (
		channel: string,
		userInput: string,
		options: {
			provider: 'ollama';
			model: string;
			history: any[]; // Avoid importing langchain types in preload
		},
	) => {
		ipcRenderer.send('agent:stream', { channel, userInput, options });
	},
	on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
		ipcRenderer.on(channel, listener);
	},
	off: (channel: string, listener: (event: any, ...args: any[]) => void) => {
		ipcRenderer.removeListener(channel, listener);
	},
});

contextBridge.exposeInMainWorld('db', {
	user: {
		fetchUsers: (): Promise<User[]> =>
			ipcRenderer.invoke('database:fetchUsers'),
		fetchUser: (id: number): Promise<User> =>
			ipcRenderer.invoke('database:fetchUser', id),
		addUser: (
			user: Pick<User, 'first_name' | 'last_name' | 'email' | 'password'>,
		): Promise<void> => ipcRenderer.invoke('database:addUser', user),
		updateUser: (user: Partial<User>): Promise<any> =>
			ipcRenderer.invoke('database:updateUser', user), // Consider more specific return type
		loginUser: (
			credentials: Pick<User, 'email' | 'password'>,
		): Promise<{ success: boolean; user?: User; message?: string }> =>
			ipcRenderer.invoke('database:loginUser', credentials),
	},
	apiKey: {
		fetchApiKeysForUser: (userId: number): Promise<ApiKey[]> =>
			ipcRenderer.invoke('database:fetchApiKeysForUser', userId),
		upsertApiKey: (
			apiKey: Omit<
				ApiKey,
				'id' | 'create_time' | 'update_time' | 'delete_time'
			>,
		): Promise<{ success: boolean; apiKey?: ApiKey; message?: string }> =>
			ipcRenderer.invoke('database:upsertApiKey', apiKey),
		deleteApiKey: (
			id: number,
		): Promise<{ success: boolean; id?: number; message?: string }> =>
			ipcRenderer.invoke('database:deleteApiKey', id),
	},
	ollama: {
		listModels: (
			userId: number,
		): Promise<{
			success: boolean;
			models?: OllamaModel[];
			message?: string;
		}> => ipcRenderer.invoke('ollama:listModels', userId),
	},
	automation: {
		fetchAutomations: (): Promise<Automation[]> =>
			ipcRenderer.invoke('database:fetchAutomations'),
		addAutomation: (
			automation: Omit<
				Automation,
				'id' | 'create_time' | 'update_time' | 'delete_time'
			> & { file?: ArrayBuffer },
		): Promise<{
			success: boolean;
			automation?: Automation;
			message?: string;
		}> => ipcRenderer.invoke('database:addAutomation', automation),
		updateAutomation: (
			automation: Partial<Automation> &
				Pick<Automation, 'id'> & { file?: ArrayBuffer },
		): Promise<{
			success: boolean;
			automation?: Automation;
			message?: string;
		}> => ipcRenderer.invoke('database:updateAutomation', automation),
		deleteAutomation: (
			id: number,
		): Promise<{ success: boolean; id?: number; message?: string }> =>
			ipcRenderer.invoke('database:deleteAutomation', id),
		testExecuteAutomation: (
			id: number,
		): Promise<{
			success: boolean;
			output?: string;
			error?: string;
			message?: string;
		}> => ipcRenderer.invoke('database:testExecuteAutomation', id),
	},
});
