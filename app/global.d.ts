import {
	ApiKey,
	Automation,
	OllamaModel,
	User,
} from './src/shared/interfaces/database.interface';

export {};

declare global {
	interface Window {
		db: {
			user: {
				fetchUser: (id: number) => Promise<Omit<User, 'password'> | undefined>;
				fetchUsers: () => Promise<Omit<User, 'password'>[]>;
				updateUser: (
					user: Partial<User> & Pick<User, 'id'>,
				) => Promise<{
					success: boolean;
					user?: Omit<User, 'password'>;
					message?: string;
					changes?: number;
				}>;
				loginUser: (
					credentials: Pick<User, 'email' | 'password'>,
				) => Promise<{
					success: boolean;
					user?: Omit<User, 'password'>;
					message?: string;
				}>;
				// addUser is missing here, but present in preload. Let's assume it's not used in frontend directly or add if needed.
			};
			automation: {
				fetchAutomations: () => Promise<Automation[]>;
				addAutomation: (
					automation: Omit<
						Automation,
						'id' | 'create_time' | 'update_time' | 'delete_time'
					> & { file?: ArrayBuffer },
				) => Promise<{
					success: boolean;
					automation?: Automation;
					message?: string;
				}>;
				updateAutomation: (
					automation: Partial<Automation> &
						Pick<Automation, 'id' & { file: ArrayBuffer }>,
				) => Promise<{
					success: boolean;
					automation?: Automation;
					message?: string;
				}>;
				deleteAutomation: (
					id: number,
				) => Promise<{ success: boolean; id?: number; message?: string }>;
				testExecuteAutomation: (
					id: number,
				) => Promise<{
					success: boolean;
					output?: string;
					error?: string;
					message?: string;
				}>;
			};
			apiKey: {
				fetchApiKeysForUser: (userId: number) => Promise<ApiKey[]>;
				upsertApiKey: (
					apiKey: Omit<
						ApiKey,
						'id' | 'create_time' | 'update_time' | 'delete_time'
					>,
				) => Promise<{ success: boolean; apiKey?: ApiKey; message?: string }>;
			};
			ollama: {
				listModels: (userId: number) => Promise<{
					success: boolean;
					models?: OllamaModel[];
					message?: string;
				}>;
			};
		};
	}
}
