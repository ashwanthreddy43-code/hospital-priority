const { DatabaseSync } = require('node:sqlite');
function openDb(file = 'patients.db') {
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS patients(
    seq INTEGER PRIMARY KEY AUTOINCREMENT, patient_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    age INTEGER NOT NULL, gender TEXT NOT NULL, priority INTEGER NOT NULL, symptoms TEXT NOT NULL,
    arrival_time TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting', treatment_start TEXT, treatment_end TEXT)`);
  return db;
}
module.exports = { openDb };
