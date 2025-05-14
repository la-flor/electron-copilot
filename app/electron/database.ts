import { IpcMain, App } from "electron";
import fs from "fs";
import path from "path";
import sqlite3 from "better-sqlite3";
import { User } from "../src/shared/interfaces/database.interface";

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
};
