import type { Database as SqliteDatabase } from "better-sqlite3";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DB_PATH || "./data/app.db";

let db: SqliteDatabase | null = null;

export function initDB() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  console.log("SQLite DB ready");
}

export function getDB(): SqliteDatabase {
  if (!db) {
    db = new Database(process.env.DB_PATH ?? "app.db");
  }
  return db;
}
