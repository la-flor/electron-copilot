import { IpcMain, App } from "electron";
import fs from "fs";
import path from "path";
import sqlite3 from "better-sqlite3";
import { User, Automation } from "../src/shared/interfaces/database.interface";

let db: sqlite3.Database;

const initializeDatabaseConnection = (app: App) => {
  // Ensure the directory exists
  const isDevelopment = process.env.NODE_ENV === "development";
  const dbPath = isDevelopment
    ? "./app/database/dev-database.db"
    : path.join(app.getPath("userData"), "database.db");

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
};

export const registerDatabaseHandlers = (ipcMain: IpcMain, app: App) => {
  initializeDatabaseConnection(app);

  ipcMain.handle("database:fetchUsers", () => {
    const stmt = db.prepare("SELECT * FROM user");
    return stmt.all();
  });

  ipcMain.handle("database:fetchUser", (_event, id: number) => {
    const stmt = db.prepare("SELECT * FROM user WHERE id = ?");
    return stmt.get(id);
  });

  ipcMain.handle("database:addUser", (_event, user) => {
    const stmt = db.prepare(
      "INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)"
    );
    stmt.run(user.first_name, user.last_name, user.email, user.password);
  });

  ipcMain.handle("database:loginUser", async (_event, { email, password }) => {
    // IMPORTANT: In a real application, passwords should be hashed and compared securely.
    // This is a simplified example and is NOT secure for production.
    const stmt = db.prepare("SELECT * FROM user WHERE email = ? AND password = ? AND delete_time IS NULL");
    const user = stmt.get(email, password);
    if (user) {
      return { success: true, user };
    } else {
      // Check if user exists with that email but wrong password for a more specific error
      const userExistsStmt = db.prepare("SELECT * FROM user WHERE email = ? AND delete_time IS NULL");
      const existingUser = userExistsStmt.get(email);
      if (existingUser) {
        return { success: false, message: "Invalid password." };
      }
      return { success: false, message: "User not found." };
    }
  });

  ipcMain.handle("database:updateUser", (_event, userPatch: Partial<User>) => {
    const { id, ...otherFields } = userPatch;

    if (!id) {
      console.error("Update user call missing 'id'");
      return { success: false, message: "User ID must be provided for update." };
    }

    const fieldsToUpdate: Partial<Omit<User, 'id' | 'create_time' | 'update_time'>> = {};
    const allowedKeys: (keyof Omit<User, 'id' | 'create_time' | 'update_time'>)[] = [
      'first_name', 'last_name', 'email', 'password', 'delete_time', 'dark'
    ];

    for (const key of allowedKeys) {
      if (key in otherFields && otherFields[key] !== undefined) {
        (fieldsToUpdate as any)[key] = otherFields[key];
      }
    }

    const validKeys = Object.keys(fieldsToUpdate);

    if (validKeys.length === 0) {
      try {
        const userExistsStmt = db.prepare("SELECT id FROM user WHERE id = ?");
        const userExists = userExistsStmt.get(parseInt(id as string, 10));
        if (!userExists) {
          return { success: false, message: `User with id ${id} not found.` };
        }
        const stmt = db.prepare("UPDATE user SET update_time = CURRENT_TIMESTAMP WHERE id = ?");
        stmt.run(parseInt(id as string, 10));
        const updatedUserStmt = db.prepare("SELECT * FROM user WHERE id = ?");
        const updatedUser = updatedUserStmt.get(parseInt(id as string, 10));
        return { success: true, user: updatedUser, changes: 0, message: "Only update_time was refreshed as no other fields were provided." };
      } catch (error: any) {
        console.error(`Failed to update user (update_time only) with id ${id}:`, error);
        return { success: false, message: error.message };
      }
    }

    const setClauses = validKeys.map(key => `${key} = ?`).join(", ");
    const values = validKeys.map(key => (fieldsToUpdate as any)[key]);

    const query = `UPDATE user SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(parseInt(id as string, 10)); // Convert string id to number for SQL

    try {
      const stmt = db.prepare(query);
      const info = stmt.run(...values);

      const updatedUserStmt = db.prepare("SELECT * FROM user WHERE id = ?");
      const updatedUser = updatedUserStmt.get(parseInt(id as string, 10));

      if (!updatedUser) {
          return { success: false, message: `User with id ${id} not found after update attempt.` };
      }

      return { success: true, user: updatedUser, changes: info.changes };
    } catch (error: any) {
      console.error(`Failed to update user with id ${id}:`, error);
      return { success: false, message: error.message };
    }
  });

  // Automation Handlers
  ipcMain.handle("database:fetchAutomations", () => {
    const stmt = db.prepare("SELECT * FROM automation WHERE delete_time IS NULL ORDER BY id DESC");
    return stmt.all();
  });

  ipcMain.handle("database:addAutomation", (_event, automation: Omit<Automation, "id" | "create_time" | "update_time" | "delete_time">) => {
    const stmt = db.prepare(
      `INSERT INTO automation (
        name, description, cronSchedule, cronTimezone, cronDescription, status, 
        fileName, fileSize, fileType, fileLastModified, fileChecksum, fileUploadDate, triggerEndpoint
      ) VALUES (
        @name, @description, @cronSchedule, @cronTimezone, @cronDescription, @status,
        @fileName, @fileSize, @fileType, @fileLastModified, @fileChecksum, @fileUploadDate, @triggerEndpoint
      )`
    );
    const info = stmt.run(automation);
    const newAutomationId = info.lastInsertRowid;
    const newAutomation = db.prepare("SELECT * FROM automation WHERE id = ?").get(newAutomationId);
    return { success: true, automation: newAutomation };
  });

  ipcMain.handle("database:updateAutomation", (_event, automationPatch: Partial<Automation> & Pick<Automation, "id">) => {
    const { id, ...otherFields } = automationPatch;

    if (!id) {
      console.error("Update automation call missing 'id'");
      return { success: false, message: "Automation ID must be provided for update." };
    }

    const fieldsToUpdate: Partial<Omit<Automation, 'id' | 'create_time' | 'update_time'>> = {};
    // Explicitly list allowed keys to prevent SQL injection or unintended updates
    const allowedKeys: (keyof Omit<Automation, 'id' | 'create_time' | 'update_time' | 'delete_time'>)[] = [
      'name', 'description', 'cronSchedule', 'cronTimezone', 'cronDescription', 
      'cronNextRun', 'cronLastRun', 'cronLastRunStatus', 'cronLastRunError', 
      'cronLastRunDuration', 'cronLastRunOutput', 'status', 'fileName', 'fileSize', 
      'fileType', 'fileLastModified', 'fileChecksum', 'fileUploadDate', 'triggerEndpoint'
    ];

    for (const key of allowedKeys) {
      if (key in otherFields && otherFields[key] !== undefined) {
        (fieldsToUpdate as any)[key] = otherFields[key];
      }
    }
    
    if (otherFields.delete_time === null || typeof otherFields.delete_time === 'string') {
        (fieldsToUpdate as any)['delete_time'] = otherFields.delete_time;
    }


    const validKeys = Object.keys(fieldsToUpdate);

    if (validKeys.length === 0) {
      // If only ID is provided, perhaps just touch update_time or return current state
      const currentAutomation = db.prepare("SELECT * FROM automation WHERE id = ?").get(id);
      if (!currentAutomation) {
        return { success: false, message: `Automation with id ${id} not found.` };
      }
      db.prepare("UPDATE automation SET update_time = CURRENT_TIMESTAMP WHERE id = ?").run(id);
      const touchedAutomation = db.prepare("SELECT * FROM automation WHERE id = ?").get(id);
      return { success: true, automation: touchedAutomation, changes: 0, message: "Only update_time was refreshed." };
    }

    const setClauses = validKeys.map(key => `${key} = @${key}`).join(", ");
    const valuesForUpdate = { ...fieldsToUpdate, id };

    const query = `UPDATE automation SET ${setClauses}, update_time = CURRENT_TIMESTAMP WHERE id = @id`;

    try {
      const stmt = db.prepare(query);
      const info = stmt.run(valuesForUpdate);

      const updatedAutomationStmt = db.prepare("SELECT * FROM automation WHERE id = ?");
      const updatedAutomation = updatedAutomationStmt.get(id);

      if (!updatedAutomation) {
          return { success: false, message: `Automation with id ${id} not found after update attempt.` };
      }

      return { success: true, automation: updatedAutomation, changes: info.changes };
    } catch (error: any) {
      console.error(`Failed to update automation with id ${id}:`, error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("database:deleteAutomation", (_event, id: number) => {
    // Soft delete by setting delete_time
    const stmt = db.prepare("UPDATE automation SET delete_time = CURRENT_TIMESTAMP, update_time = CURRENT_TIMESTAMP WHERE id = ?");
    const info = stmt.run(id);
    if (info.changes > 0) {
      return { success: true, id };
    }
    return { success: false, message: `Automation with id ${id} not found or already deleted.` };
  });
};
