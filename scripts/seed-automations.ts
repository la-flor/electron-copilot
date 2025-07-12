import { Automation } from "app/src/shared/interfaces/database.interface";
import sqlite3 from "better-sqlite3";
import fs from "fs";
import path from "path";

// Data copied from app/src/pages/Automations.tsx and adapted for seeding
// 'id' and 'fileDownloadLink' fields are removed.
const sampleAutomationsSeedData: Omit<
  Automation,
  "id" | "create_time" | "update_time" | "delete_time"
>[] = [
  {
    cronSchedule: "0 0 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at midnight",
    cronNextRun: "2023-10-01T00:00:00Z",
    cronLastRun: "2023-09-30T23:59:59Z",
    cronLastRunStatus: "success",
    cronLastRunError: null,
    cronLastRunDuration: "1s",
    cronLastRunOutput: "Automation 1 executed successfully",
    name: "Automation 1",
    description: "Check weather forcast and report key interests",
    status: "Active",
    fileName: "automation1.py",
    fileSize: 2,
    fileType: "Python Script",
    fileLastModified: "2023-09-30T23:59:59Z",
    fileChecksum: "abc123",
    fileUploadDate: "2023-09-30T23:59:59Z",
    triggerEndpoint: "http://example.com/automation/1",
  },
  {
    cronSchedule: "0 12 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at noon",
    cronNextRun: "2023-10-01T12:00:00Z",
    cronLastRun: "2023-09-30T11:59:59Z",
    cronLastRunStatus: "failure",
    cronLastRunError: "Error executing automation 2",
    cronLastRunDuration: "2s",
    cronLastRunOutput: "Automation 2 failed",
    name: "Automation 2",
    description: "Check latest tech releases and summarize",
    status: "Inactive",
    fileName: "automation2.py",
    fileSize: 3,
    fileType: "Python Script",
    fileLastModified: "2023-09-30T11:59:59Z",
    fileChecksum: "def456",
    fileUploadDate: "2023-09-30T11:59:59Z",
    triggerEndpoint: null,
  },
  {
    cronSchedule: "0 18 * * *",
    cronTimezone: "UTC",
    cronDescription: "Every day at 6 PM",
    cronNextRun: "2023-10-01T18:00:00Z",
    cronLastRun: "2023-09-30T17:59:59Z",
    cronLastRunStatus: "success",
    cronLastRunError: null,
    cronLastRunDuration: "3s",
    cronLastRunOutput: "Automation 3 executed successfully",
    name: "Automation 3",
    description: "Report top todos on my list",
    status: "Active",
    fileName: "automation3.py",
    fileSize: 4,
    fileType: "Python Script",
    fileLastModified: "2023-09-30T17:59:59Z",
    fileChecksum: "ghi789",
    fileUploadDate: "2023-09-30T17:59:59Z",
    triggerEndpoint: "http://example.com/automation/3",
  },
];

const dbPath = path.resolve(__dirname, "../app/database/dev-database.db");

function initializeDatabase(): sqlite3.Database {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }

  const db = new sqlite3(dbPath);
  console.log(`Connected to database: ${dbPath}`);

  // Initialize automation table schema if it doesn't exist
  // This schema should match the one in app/electron/database.ts
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
        fileSize NUMBER,
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
  console.log('Ensured "automation" table exists and schema is up-to-date.');
  return db;
}

function seedData(db: sqlite3.Database) {
  const insertStmt = db.prepare(
    `INSERT INTO automation (
      name, description, cronSchedule, cronTimezone, cronDescription, cronNextRun, cronLastRun,
      cronLastRunStatus, cronLastRunError, cronLastRunDuration, cronLastRunOutput, status,
      fileName, fileSize, fileType, fileLastModified, fileChecksum, fileUploadDate, triggerEndpoint
    ) VALUES (
      @name, @description, @cronSchedule, @cronTimezone, @cronDescription, @cronNextRun, @cronLastRun,
      @cronLastRunStatus, @cronLastRunError, @cronLastRunDuration, @cronLastRunOutput, @status,
      @fileName, @fileSize, @fileType, @fileLastModified, @fileChecksum, @fileUploadDate, @triggerEndpoint
    )`
  );

  let insertedCount = 0;
  let skippedCount = 0;

  // Optional: Check if data already exists to avoid duplicates, e.g., by name
  // For simplicity, this script will insert them. If you run it multiple times, you'll get duplicates.
  // To make it idempotent, you might clear the table first or add unique constraints and ON CONFLICT clauses.

  for (const automationData of sampleAutomationsSeedData) {
    try {
      // Example check: (optional, remove if duplicates are fine or handled by DB constraints)
      // const existing = db.prepare("SELECT id FROM automation WHERE name = ?").get(automationData.name);
      // if (existing) {
      //   console.log(`Skipping existing automation: ${automationData.name}`);
      //   skippedCount++;
      //   continue;
      // }
      insertStmt.run(automationData);
      insertedCount++;
    } catch (error) {
      console.error(
        `Failed to insert automation "${automationData.name}":`,
        error
      );
    }
  }
  if (insertedCount > 0) {
    console.log(`Successfully inserted ${insertedCount} automations.`);
  }
  if (skippedCount > 0) {
    console.log(`Skipped ${skippedCount} already existing automations.`);
  }
  if (insertedCount === 0 && skippedCount === 0) {
    console.log("No new automations were inserted.");
  }
}

function main() {
  console.log("Starting automation data seeding script...");
  const db = initializeDatabase();
  seedData(db);
  db.close();
  console.log("Database connection closed. Seeding complete.");
}

main();
