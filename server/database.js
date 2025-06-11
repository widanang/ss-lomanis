// server/database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function setup() {
  const db = await open({
    filename: './logistics.db', // This file will be created in the 'server' directory
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS pickup (
      AWB TEXT PRIMARY KEY,
      Nama TEXT,
      Alamat TEXT,
      "No. HP" TEXT,
      Tanggal TEXT,
      User TEXT
    );

    CREATE TABLE IF NOT EXISTS delivery (
      AWB TEXT PRIMARY KEY,
      Status TEXT,
      Tanggal TEXT,
      User TEXT,
      "COD Amount" REAL
    );

    CREATE TABLE IF NOT EXISTS manual_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      delivery_success INTEGER NOT NULL DEFAULT 0,
      delivery_pending INTEGER NOT NULL DEFAULT 0,
      pickup_success INTEGER NOT NULL DEFAULT 0,
      pickup_failed INTEGER NOT NULL DEFAULT 0,
      cod_packages_count INTEGER NOT NULL DEFAULT 0,
      submitted_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export default setup; 