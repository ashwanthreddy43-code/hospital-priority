const { PriorityQueue } = require('./priorityQueue');
const { openDb } = require('./database');
class ServiceError extends Error { constructor(m, status = 400) { super(m); this.status = status; } }
const GENDERS = ['Male', 'Female', 'Other'];
const toPatient = r => r && ({ seq: r.seq, patientId: r.patient_id, name: r.name, age: r.age, gender: r.gender,
  priority: r.priority, symptoms: r.symptoms, arrivalTime: r.arrival_time, status: r.status,
  treatmentStart: r.treatment_start, treatmentEnd: r.treatment_end });

class PatientService {
  constructor(file = ':memory:') { this.db = openDb(file); }
  all(status) {
    const rows = status ? this.db.prepare('SELECT * FROM patients WHERE status=? ORDER BY seq').all(status)
                        : this.db.prepare('SELECT * FROM patients ORDER BY seq').all();
    return rows.map(toPatient);
  }
  waiting() { const q = new PriorityQueue(); this.all('waiting').forEach(p => q.push(p)); return q.toSortedArray(); }
  treating() { return this.all('treating'); }
  treated() { return this.all('treated').sort((a, b) => Date.parse(b.treatmentEnd) - Date.parse(a.treatmentEnd)); }
  validate(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new ServiceError('Send patient details as JSON.');
    const name = String(d.name ?? '').trim(), pid = String(d.patientId ?? '').trim(), sym = String(d.symptoms ?? '').trim();
    if (!name || name.length > 100) throw new ServiceError('Patient name is required (max 100 characters).');
    if (!/^[A-Za-z0-9-]{1,20}$/.test(pid)) throw new ServiceError('Patient ID is required (letters, numbers, dash; max 20).');
    const age = Number(d.age);
    if (d.age === '' || d.age == null || !Number.isInteger(age) || age < 0 || age > 120) throw new ServiceError('Age must be a whole number from 0 to 120.');
    const priority = Number(d.priority);
    if (d.priority === '' || d.priority == null || !Number.isInteger(priority) || priority < 1 || priority > 5) throw new ServiceError('Priority must be 1 to 5.');
    if (!sym || sym.length > 300) throw new ServiceError('Symptoms are required (max 300 characters).');
    const gender = d.gender || 'Other';
    if (!GENDERS.includes(gender)) throw new ServiceError('Gender must be Male, Female or Other.');
    let arrival = new Date();
    if (d.arrivalTime) { arrival = new Date(d.arrivalTime); if (isNaN(arrival)) throw new ServiceError('Arrival time is not valid.'); }
    return { name, pid, age, gender, priority, sym, arrival: arrival.toISOString() };
  }
  add(d) {
    const v = this.validate(d);
    if (this.db.prepare('SELECT 1 FROM patients WHERE patient_id=?').get(v.pid)) throw new ServiceError(`Patient ID ${v.pid} already exists.`, 409);
    const r = this.db.prepare('INSERT INTO patients(patient_id,name,age,gender,priority,symptoms,arrival_time) VALUES(?,?,?,?,?,?,?)')
      .run(v.pid, v.name, v.age, v.gender, v.priority, v.sym, v.arrival);
    return toPatient(this.db.prepare('SELECT * FROM patients WHERE seq=?').get(r.lastInsertRowid));
  }
  next() {
    const q = new PriorityQueue(); this.all('waiting').forEach(p => q.push(p));
    const p = q.pop(); if (!p) return null;
    this.db.prepare("UPDATE patients SET status='treating', treatment_start=? WHERE seq=?").run(new Date().toISOString(), p.seq);
    return toPatient(this.db.prepare('SELECT * FROM patients WHERE seq=?').get(p.seq));
  }
  complete(pid) {
    const row = this.db.prepare('SELECT * FROM patients WHERE patient_id=?').get(String(pid));
    if (!row) throw new ServiceError('Patient not found.', 404);
    if (row.status !== 'treating') throw new ServiceError('Only a patient who is being treated can be completed.', 409);
    this.db.prepare("UPDATE patients SET status='treated', treatment_end=? WHERE seq=?").run(new Date().toISOString(), row.seq);
    return toPatient(this.db.prepare('SELECT * FROM patients WHERE seq=?').get(row.seq));
  }
  remove(pid) {
    if (!this.db.prepare('DELETE FROM patients WHERE patient_id=?').run(String(pid)).changes) throw new ServiceError('Patient not found.', 404);
  }
  clear() { this.db.exec('DELETE FROM patients'); }
  stats() {
    const c = s => this.db.prepare('SELECT COUNT(*) n FROM patients WHERE status=?').get(s).n;
    const crit = this.db.prepare("SELECT COUNT(*) n FROM patients WHERE status='waiting' AND priority=5").get().n;
    return { waiting: c('waiting'), critical: crit, treating: c('treating'), treated: c('treated') };
  }
}
module.exports = { PatientService, ServiceError };
