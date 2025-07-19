export interface User {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	password: string;
	create_time: string;
	update_time: string;
	delete_time: string | null;
	dark: number;
}

export interface Automation {
	id: number;
	name: string;
	description: string;
	cronSchedule: string;
	cronTimezone: string;
	cronDescription: string;
	cronNextRun: string; // ISO date string
	cronLastRun: string; // ISO date string
	cronLastRunStatus: 'success' | 'failure' | 'pending' | 'running';
	cronLastRunError: string | null;
	cronLastRunDuration: string; // e.g., "1s", "10ms"
	cronLastRunOutput: string;
	status: 'Active' | 'Inactive';
	fileName: string | null;
	fileSize: number | null; // in bytes
	fileType: string | null;
	fileLastModified: string | null; // ISO date string
	fileChecksum: string | null;
	// fileDownloadLink: string | null; // This might be better generated or handled differently
	fileUploadDate: string | null; // ISO date string
	triggerEndpoint: string | null;
	create_time: string; // ISO date string
	update_time: string; // ISO date string
	delete_time: string | null; // ISO date string
}

export interface ApiKey {
	id: number;
	user_id: number;
	provider: string; // e.g., 'gemini', 'ollama'
	api_key: string | null;
	hostname: string | null;
	create_time: string;
	update_time: string;
	delete_time: string | null;
}
