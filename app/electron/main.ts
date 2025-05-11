import { app, BrowserWindow, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import started from "electron-squirrel-startup";
import sqlite3 from "better-sqlite3";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Ensure the directory exists
const isDevelopment = process.env.NODE_ENV === "development";
const dbPath = isDevelopment
  ? "./app/database/dev-database.db"
  : path.join(app.getPath("userData"), "database.db");

const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3(dbPath);

// Initialize database schema if it doesn't exist
const initializeDatabase = () => {
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

initializeDatabase();

ipcMain.handle("database:fetchUsers", () => {
  const stmt = db.prepare("SELECT * FROM user");
  return stmt.all();
});

ipcMain.handle("database:addUser", (_event, user) => {
  const stmt = db.prepare(
    "INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)"
  );
  stmt.run(user.first_name, user.last_name, user.email, user.password);
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
