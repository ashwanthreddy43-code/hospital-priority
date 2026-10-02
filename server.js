const express = require('express');
const path = require('path');
const { PatientService, ServiceError } = require('./src/patientService');
const { defaultDbPath } = require('./src/database');
const svc = new PatientService(defaultDbPath());
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const w = fn => (req, res, next) => { try { res.json(fn(req)); } catch (e) { next(e); } };
app.get('/api/health', w(() => ({ status: 'ok' })));
app.get('/api/patients', w(() => svc.all()));
app.get('/api/patients/waiting', w(() => svc.waiting()));
app.get('/api/patients/treating', w(() => svc.treating()));
app.get('/api/patients/treated', w(() => svc.treated()));
app.get('/api/stats', w(() => svc.stats()));
app.post('/api/patients', (req, res, next) => { try { res.status(201).json(svc.add(req.body)); } catch (e) { next(e); } });
app.post('/api/patients/next', w(() => svc.next() ? { patient: svc.treating().slice(-1)[0] } : { patient: null, message: 'No patients are waiting.' }));
app.post('/api/patients/:id/complete', w(r => svc.complete(r.params.id)));
app.delete('/api/patients/:id', w(r => { svc.remove(r.params.id); return { ok: true }; }));
app.delete('/api/patients', w(() => { svc.clear(); return { ok: true }; }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route.' }));
app.use((err, req, res, next) => {
  if (err instanceof ServiceError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON.' });
  console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' });
});
// Local: start the server. Vercel: it imports the exported app instead, so we must not listen.
if (require.main === module) app.listen(process.env.PORT || 3000, () => console.log('Running at http://localhost:3000'));
module.exports = app;
