import sqlite3 from 'better-sqlite3';
import { execFile } from 'child_process';
import { App, IpcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import {
	ApiKey,
	Automation,
	User,
} from '../src/shared/interfaces/database.interface';

let db: sqlite3.Database;

const initializeDatabaseConnection = (app: App) => {
	// Ensure the directory exists
	const isDevelopment = process.env.NODE_ENV === 'development';
	const dbPath = isDevelopment
		? './app/database/dev-database.db'
		: path.join(app.getPath('userData'), 'database.db');

	const dbDir = path.dirname(dbPath);

	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}

	db = new sqlite3(dbPath);

	// Initialize database schema if it doesn't exist
	db.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
        id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        password TEXT NOT NULL,
        email TEXT NOT NULL,
        create_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        update_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        delete_time TEXT,
        dark INTEGER DEFAULT 0 NOT NULL
    ) STRICT;
  `);

	db.exec(`
    CREATE TABLE IF NOT EXISTS "automation" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        cronSchedule TEXT NOT NULL,
        cronTimezone TEXT DEFAULT 'UTC' NOT NULL,
        cronDescription TEXT,
        cronNextRun TEXT,
        cronLastRun TEXT,
        cronLastRunStatus TEXT DEFAULT 'pending' NOT NULL, -- pending, success, failure, running
        cronLastRunError TEXT,
        cronLastRunDuration TEXT,
        cronLastRunOutput TEXT,
        status TEXT DEFAULT 'Inactive' NOT NULL, -- Active, Inactive
        fileName TEXT,
        fileSize TEXT,
        fileType TEXT,
        fileLastModified TEXT,
        fileChecksum TEXT,
        fileUploadDate TEXT,
        triggerEndpoint TEXT,
        create_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        update_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        delete_time TEXT
    ) STRICT;
    `);

	db.exec(`
		CREATE TABLE IF NOT EXISTS "api_keys" (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			provider TEXT NOT NULL,
			api_key TEXT,
			hostname TEXT,
			create_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
			update_time TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
			delete_time TEXT,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			UNIQUE(user_id, provider)
		) STRICT;
	`);
};

export const registerDatabaseHandlers = (ipcMain: IpcMain, app: App) => {
	initializeDatabaseConnection(app);

	ipcMain.handle('database:fetchUsers', () => {
		const stmt = db.prepare(
			'SELECT id, first_name, last_name, email, create_time, update_time, delete_time, dark FROM user',
		);
		return stmt.all();
	});

	ipcMain.handle('database:fetchUser', (_event, id: number) => {
		const stmt = db.prepare(
			'SELECT id, first_name, last_name, email, create_time, update_time, delete_time, dark FROM user WHERE id = ?',
		);
		return stmt.get(id);
	});

	ipcMain.handle('database:addUser', (_event, user) => {
		const stmt = db.prepare(
			'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
		);
		stmt.run(user.first_name, user.last_name, user.email, user.password);
	});

	ipcMain.handle('database:loginUser', async (_event, { email, password }) => {
		// IMPORTANT: In a real application, passwords should be hashed and compared securely.
		// This is a simplified example and is NOT secure for production.
		const stmt = db.prepare(
			`SELECT
                id, first_name, last_name, email, create_time, update_time, delete_time, dark
            FROM
                user
            WHERE
                email = ? AND password = ? AND delete_time IS NULL`,
		);
		const user = stmt.get(email, password);
		if (user) {
			return { success: true, user };
		} else {
			// Check if user exists with that email but wrong password for a more specific error
			const userExistsStmt = db.prepare(
				`SELECT
                    id, first_name, last_name, email, create_time, update_time, delete_time, dark
                FROM
                    user
                WHERE
                    email = ?
                AND
                    delete_time IS NULL`,
			);
			const existingUser = userExistsStmt.get(email) as User | undefined;
			if (existingUser) {
				return { success: false, message: 'Invalid password.' };
			}
			return { success: false, message: 'User not found.' };
		}
	});

	ipcMain.handle('database:updateUser', (_event, userPatch: Partial<User>) => {
		const { id, ...otherFields } = userPatch;

		if (!id) {
			console.error("Update user call missing 'id'");
			return {
				success: false,
				message: 'User ID must be provided for update.',
			};
		}

		const fieldsToUpdate: Partial<
			Omit<User, 'id' | 'create_time' | 'update_time'>
		> = {};
		const allowedKeys: (keyof Omit<
			User,
			'id' | 'create_time' | 'update_time'
		>)[] = [
			'first_name',
			'last_name',
			'email',
			'password',
			'delete_time',
			'dark',
		];

		for (const key of allowedKeys) {
			if (key in otherFields && otherFields[key] !== undefined) {
				(fieldsToUpdate as any)[key] = otherFields[key];
			}
		}

		const validKeys = Object.keys(fieldsToUpdate);

		if (validKeys.length === 0) {
			try {
				const userExistsStmt = db.prepare('SELECT id FROM user WHERE id = ?');
				const userExists = userExistsStmt.get(id) as
					| Omit<User, 'password'>
					| undefined;
				if (!userExists) {
					return { success: false, message: `User with id ${id} not found.` };
				}
				const stmt = db.prepare(
					'UPDATE user SET update_time = CURRENT_TIMESTAMP WHERE id = ?',
				);
				stmt.run(id);
				const updatedUserStmt = db.prepare(`
                    SELECT
                        id, first_name, last_name, email, create_time, update_time, delete_time, dark
                    FROM
                        user
                    WHERE
                        id = ?`);
				const updatedUser = updatedUserStmt.get(id) as
					| Omit<User, 'password'>
					| undefined;

				return {
					success: true,
					user: updatedUser,
					changes: 0,
					message:
						'Only update_time was refreshed as no other fields were provided.',
				};
			} catch (error: any) {
				console.error(
					`Failed to update user (update_time only) with id ${id}:`,
					error,
				);
				return { success: false, message: error.message };
			}
		}

		const setClauses = validKeys.map((key) => `${key} = ?`).join(', ');
		const values = validKeys.map((key) => (fieldsToUpdate as any)[key]);

		const query = `UPDATE user SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;
		values.push(id);

		try {
			const stmt = db.prepare(query);
			const info = stmt.run(...values);

			const updatedUserStmt = db.prepare(`SELECT
                id, first_name, last_name, email, create_time, update_time, delete_time, dark
            FROM
                user
            WHERE
                id = ?`);
			const updatedUser = updatedUserStmt.get(id);

			if (!updatedUser) {
				return {
					success: false,
					message: `User with id ${id} not found after update attempt.`,
				};
			}

			return { success: true, user: updatedUser, changes: info.changes };
		} catch (error: any) {
			console.error(`Failed to update user with id ${id}:`, error);
			return { success: false, message: error.message };
		}
	});

	// Automation Handlers
	ipcMain.handle('database:fetchAutomations', () => {
		const stmt = db.prepare(
			'SELECT * FROM automation WHERE delete_time IS NULL ORDER BY id DESC',
		);
		return stmt.all();
	});

	ipcMain.handle(
		'database:addAutomation',
		(
			_event,
			automationPayload: Omit<
				Automation,
				'id' | 'create_time' | 'update_time' | 'delete_time'
			> & { file?: ArrayBuffer },
		) => {
			const { file, ...automationData } = automationPayload;

			if (file && automationData.fileName) {
				let fileStream: fs.WriteStream;

				try {
					const scriptsDir = path.join(
						app.getPath('userData'),
						'automation_scripts',
					);
					if (!fs.existsSync(scriptsDir)) {
						fs.mkdirSync(scriptsDir, { recursive: true });
						console.info(`Created automation scripts directory: ${scriptsDir}`);
					}
					const destPath = path.join(scriptsDir, automationData.fileName);
					// Consider deleting the old file if the fileName has changed.
					// For now, this will overwrite if same name, or add new if different name.
					fileStream = fs.createWriteStream(destPath);
					fileStream.write(Buffer.from(file));

					console.info(`Saved file ${automationData.fileName}`);
				} catch (copyError) {
					console.error('Failed to copy automation script file:', copyError);
					return {
						success: false,
						message: `Failed to save script file: ${copyError.message}`,
					};
				}
			}

			const stmt = db.prepare(
				`INSERT INTO automation (
                    name, description, cronSchedule, cronTimezone, cronDescription, status, 
                    fileName, fileSize, fileType, fileLastModified, fileChecksum, fileUploadDate, triggerEndpoint
                ) VALUES (
                    @name, @description, @cronSchedule, @cronTimezone, @cronDescription, @status,
                    @fileName, @fileSize, @fileType, @fileLastModified, @fileChecksum, @fileUploadDate, @triggerEndpoint
                )`,
			);
			const info = stmt.run(automationData);
			const newAutomationId = info.lastInsertRowid;
			const newAutomation = db
				.prepare('SELECT * FROM automation WHERE id = ?')
				.get(newAutomationId);
			return { success: true, automation: newAutomation };
		},
	);

	ipcMain.handle(
		'database:updateAutomation',
		(
			_event,
			automationPatchPayload: Partial<Automation> &
				Pick<Automation, 'id'> & { file: ArrayBuffer },
		) => {
			const { id, file, ...otherFields } = automationPatchPayload;

			if (!id) {
				console.error("Update automation call missing 'id'");
				return {
					success: false,
					message: 'Automation ID must be provided for update.',
				};
			}

			const fieldsToUpdate: Partial<
				Omit<Automation, 'id' | 'create_time' | 'update_time'>
			> = {};
			// Explicitly list allowed keys to prevent SQL injection or unintended updates
			const allowedKeys: (keyof Omit<
				Automation,
				'id' | 'create_time' | 'update_time' | 'delete_time'
			>)[] = [
				'name',
				'description',
				'cronSchedule',
				'cronTimezone',
				'cronDescription',
				'cronNextRun',
				'cronLastRun',
				'cronLastRunStatus',
				'cronLastRunError',
				'cronLastRunDuration',
				'cronLastRunOutput',
				'status',
				'fileName',
				'fileSize',
				'fileType',
				'fileLastModified',
				'fileChecksum',
				'fileUploadDate',
				'triggerEndpoint',
			];

			for (const key of allowedKeys) {
				if (key in otherFields && otherFields[key] !== undefined) {
					(fieldsToUpdate as any)[key] = otherFields[key];
				}
			}

			if (
				otherFields.delete_time === null ||
				typeof otherFields.delete_time === 'string'
			) {
				(fieldsToUpdate as any)['delete_time'] = otherFields.delete_time;
			}

			// File copy logic for updates
			if (file && otherFields.fileName) {
				let fileStream: fs.WriteStream;

				try {
					const scriptsDir = path.join(
						app.getPath('userData'),
						'automation_scripts',
					);
					if (!fs.existsSync(scriptsDir)) {
						fs.mkdirSync(scriptsDir, { recursive: true });
						console.info(`Created automation scripts directory: ${scriptsDir}`);
					}
					const destPath = path.join(scriptsDir, otherFields.fileName);
					// Consider deleting the old file if the fileName has changed.
					// For now, this will overwrite if same name, or add new if different name.
					fileStream = fs.createWriteStream(destPath);
					fileStream.write(Buffer.from(file));

					console.info(`Saved file ${otherFields.fileName}`);
					// Ensure file related fields in 'otherFields' are up-to-date for the DB
					// (e.g., fileChecksum might need recalculation, fileUploadDate update)
					// The frontend already sets fileSize, fileType, fileLastModified from the new file.
				} catch (copyError) {
					console.error(
						'Failed to copy updated automation script file:',
						copyError,
					);
					return {
						success: false,
						message: `Failed to save updated script file: ${copyError.message}`,
					};
				} finally {
					fileStream?.close();
				}
			}

			const validKeys = Object.keys(fieldsToUpdate);

			if (validKeys.length === 0 && !file) {
				// Also check file to ensure we don't skip if only file changed
				// If only ID is provided (and no new file), perhaps just touch update_time or return current state
				const currentAutomation = db
					.prepare('SELECT * FROM automation WHERE id = ?')
					.get(id);
				if (!currentAutomation) {
					return {
						success: false,
						message: `Automation with id ${id} not found.`,
					};
				}
				db.prepare(
					'UPDATE automation SET update_time = CURRENT_TIMESTAMP WHERE id = ?',
				).run(id);
				const touchedAutomation = db
					.prepare('SELECT * FROM automation WHERE id = ?')
					.get(id);
				return {
					success: true,
					automation: touchedAutomation,
					changes: 0,
					message: 'Only update_time was refreshed.',
				};
			}

			const setClauses = validKeys.map((key) => `${key} = @${key}`).join(', ');
			const valuesForUpdate = { ...fieldsToUpdate, id };

			const query = `UPDATE automation SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = @id`;

			try {
				const stmt = db.prepare(query);
				const info = stmt.run(valuesForUpdate);

				const updatedAutomationStmt = db.prepare(
					'SELECT * FROM automation WHERE id = ?',
				);
				const updatedAutomation = updatedAutomationStmt.get(id);

				if (!updatedAutomation) {
					return {
						success: false,
						message: `Automation with id ${id} not found after update attempt.`,
					};
				}

				return {
					success: true,
					automation: updatedAutomation,
					changes: info.changes,
				};
			} catch (error: any) {
				console.error(`Failed to update automation with id ${id}:`, error);
				return { success: false, message: error.message };
			}
		},
	);

	ipcMain.handle('database:deleteAutomation', (_event, id: number) => {
		// Soft delete by setting delete_time
		const stmt = db.prepare(
			'UPDATE automation SET delete_time = CURRENT_TIMESTAMP, update_time = CURRENT_TIMESTAMP WHERE id = ?',
		);
		const info = stmt.run(id);
		if (info.changes > 0) {
			return { success: true, id };
		}
		return {
			success: false,
			message: `Automation with id ${id} not found or already deleted.`,
		};
	});

	ipcMain.handle(
		'database:testExecuteAutomation',
		async (_event, id: number) => {
			const automation = db
				.prepare(
					'SELECT * FROM automation WHERE id = ? AND delete_time IS NULL',
				)
				.get(id) as Automation | undefined;

			if (!automation) {
				return {
					success: false,
					message: `Automation with id ${id} not found.`,
				};
			}

			if (!automation.fileName) {
				return {
					success: false,
					message: `Automation with id ${id} does not have an associated file.`,
				};
			}

			// Assumption: Scripts are stored in 'automation_scripts' in userData
			const scriptsDir = path.join(
				app.getPath('userData'),
				'automation_scripts',
			);
			const scriptPath = path.join(scriptsDir, automation.fileName);

			if (!fs.existsSync(scriptPath)) {
				return {
					success: false,
					message: `Script file not found: ${scriptPath}`,
				};
			}

			// Assumption: Execute .py files with python3
			if (automation.fileName.endsWith('.py')) {
				return new Promise((resolve) => {
					execFile('python3', [scriptPath], (error, stdout, stderr) => {
						if (error) {
							resolve({
								success: false,
								error: stderr || error.message,
								output: stdout,
								message: 'Script execution failed.',
							});
						} else {
							resolve({ success: true, output: stdout, error: stderr });
						}
					});
				});
			} else if (automation.fileName.endsWith('.sh')) {
				return new Promise((resolve) => {
					execFile('bash', [scriptPath], (error, stdout, stderr) => {
						if (error) {
							resolve({
								success: false,
								error: stderr || error.message,
								output: stdout,
								message: 'Shell script execution failed.',
							});
						} else {
							resolve({ success: true, output: stdout, error: stderr });
						}
					});
				});
			} else {
				return {
					success: false,
					message: `File type not supported for execution: ${automation.fileName}. Only .py and .sh files are currently supported.`,
				};
			}
		},
	);

	// API Key Handlers
	ipcMain.handle('database:fetchApiKeysForUser', (_event, userId: number) => {
		const stmt = db.prepare(
			'SELECT * FROM api_keys WHERE user_id = ? AND delete_time IS NULL',
		);
		return stmt.all(userId);
	});

	ipcMain.handle(
		'database:upsertApiKey',
		(
			_event,
			apiKey: Omit<
				ApiKey,
				'id' | 'create_time' | 'update_time' | 'delete_time'
			>,
		) => {
			const { user_id, provider, api_key, hostname } = apiKey;
			const stmt = db.prepare(
				`INSERT INTO api_keys (user_id, provider, api_key, hostname)
                VALUES (@user_id, @provider, @api_key, @hostname)
                ON CONFLICT(user_id, provider) DO UPDATE SET
                api_key = excluded.api_key,
                hostname = excluded.hostname,
                update_time = CURRENT_TIMESTAMP`,
			);
			try {
				stmt.run({ user_id, provider, api_key, hostname });
				const updatedKeyStmt = db.prepare(
					'SELECT * FROM api_keys WHERE user_id = ? AND provider = ?',
				);
				const updatedKey = updatedKeyStmt.get(user_id, provider);
				return { success: true, apiKey: updatedKey };
			} catch (error: any) {
				console.error('Failed to upsert API key:', error);
				return { success: false, message: error.message };
			}
		},
	);
};
