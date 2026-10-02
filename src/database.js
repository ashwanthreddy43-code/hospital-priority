const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Where to keep the database file.
// - DB_PATH env var overrides everything.
// - On Vercel/serverless the app folder is read-only, so use the OS temp dir (/tmp). This storage is TEMPORARY.
// - Locally, keep patients.db in the project folder (works on Windows, Mac, Linux).
function defaultDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const serverless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  return serverless ? path.join(os.tmpdir(), 'patients.db') : path.join(__dirname, '..', 'patients.db');
}
function openDb(file = defaultDbPath()) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS patients(
    seq INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    age INTEGER NOT NULL, gender TEXT NOT NULL, priority INTEGER NOT NULL, symptoms TEXT NOT NULL,
    arrival_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting', treatment_start TEXT, treatment_end TEXT)`);
  return db;
}
module.exports = { openDb, defaultDbPath };
