const LABELS = { 5: 'Critical', 4: 'Emergency', 3: 'Urgent', 2: 'Less Urgent', 1: 'Non-Urgent' };
const $ = id => document.getElementById(id);
let waiting = [], treating = [], treated = [], filter = 'All';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tm = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const mins = iso => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));
function toast(msg, bad) { const t = $('toast'); t.textContent = msg; t.className = 'show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 2800); }
async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Request failed'); return d;
}
async function load() {
  [waiting, treating, treated] = await Promise.all([api('/api/patients/waiting'), api('/api/patients/treating'), api('/api/patients/treated')]);
  const s = await api('/api/stats');
  $('sWaiting').textContent = s.waiting; $('sCritical').textContent = s.critical; $('sTreating').textContent = s.treating; $('sTreated').textContent = s.treated;
  render();
}
const empty = t => `<div class="empty">${t}</div>`;
function render() {
  const q = $('search').value.trim().toLowerCase();
  // position = real place in the full queue; search/filter only hide rows
  const rows = waiting.map((p, i) => ({ p, pos: i + 1 })).filter(({ p }) =>
    (filter === 'All' || LABELS[p.priority] === filter) && (!q || p.name.toLowerCase().includes(q) || p.patientId.toLowerCase().includes(q)));
  $('queue').innerHTML = !waiting.length ? empty('No patients waiting. Add one or load demo patients.') : !rows.length ? empty('No patients match your search/filter.') :
    rows.map(({ p, pos }) => `<div class="p p${p.priority}"><div class="pos">#${pos}</div><div><b>${esc(p.name)}</b> <small style="display:inline">${esc(p.patientId)} · ${p.age} yrs · ${p.gender}</small>
    <small><span class="badge">${p.priority} - ${LABELS[p.priority]}</span> ${esc(p.symptoms)}</small><small>Arrived ${tm(p.arrivalTime)} · Waiting: <span class="w" data-t="${p.arrivalTime}">${mins(p.arrivalTime)}</span> min</small></div>
    <button class="x" title="Remove" data-del="${esc(p.patientId)}">✕</button></div>`).join('');
  $('treating').innerHTML = treating.length ? treating.map(p => `<div class="now"><small>NOW TREATING</small><h3>${esc(p.name)}</h3>Priority: ${LABELS[p.priority]}<br>Patient ID: ${esc(p.patientId)}<br>Symptoms: ${esc(p.symptoms)}
    <button class="btn primary" style="margin-top:10px;width:100%" data-done="${esc(p.patientId)}">Complete Treatment</button></div>`).join('') : empty('Nobody is being treated right now.');
  $('treated').innerHTML = treated.length ? treated.slice(0, 6).map(p => `<div class="p p${p.priority}" style="grid-template-columns:1fr"><div><b>${esc(p.name)}</b> <span class="badge">Treated</span><small>${esc(p.patientId)} · finished ${tm(p.treatmentEnd)}</small></div></div>`).join('') : empty('No treated patients yet.');
  $('filters').innerHTML = ['All', ...Object.values(LABELS)].map(f => `<button class="chip ${f === filter ? 'on' : ''}" data-f="${f}">${f}</button>`).join('');
}
const act = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };
$('form').addEventListener('submit', act(async e => {
  e.preventDefault(); $('formErr').textContent = '';
  const d = Object.fromEntries(new FormData(e.target)); if (d.arrivalTime) d.arrivalTime = new Date(d.arrivalTime).toISOString();
  try { await api('/api/patients', 'POST', d); } catch (err) { $('formErr').textContent = err.message; throw err; }
  e.target.reset(); toast('Patient registered and placed in queue.'); await load();
}));
$('clearForm').onclick = () => { $('form').reset(); $('formErr').textContent = ''; };
$('callNext').onclick = act(async () => { const r = await api('/api/patients/next', 'POST'); toast(r.patient ? `Now treating ${r.patient.name}` : r.message, !r.patient); await load(); });
$('search').oninput = render;
document.addEventListener('click', act(async e => {
  const t = e.target;
  if (t.dataset.f) { filter = t.dataset.f; render(); }
  if (t.dataset.done) { await api(`/api/patients/${encodeURIComponent(t.dataset.done)}/complete`, 'POST'); toast('Treatment completed.'); await load(); }
  if (t.dataset.del && confirm('Remove this patient?')) { await api(`/api/patients/${encodeURIComponent(t.dataset.del)}`, 'DELETE'); toast('Patient removed.'); await load(); }
}));
$('clearQ').onclick = act(async () => { if (!confirm('Delete ALL patients? This cannot be undone.')) return; await api('/api/patients', 'DELETE'); toast('Queue cleared.'); await load(); });
$('demo').onclick = act(async () => {
  const now = Date.now(), at = m => new Date(now - m * 60000).toISOString(), id = n => 'D' + (now % 100000) + n;
  const demo = [['Ravi', 4, 25, 'High fever, vomiting'], ['Asha', 2, 22, 'Sprained ankle'], ['Meena', 4, 20, 'Abdominal pain'], ['Kiran', 1, 15, 'Mild cough'], ['Arjun', 5, 10, 'Severe chest pain']];
  for (const [i, [name, priority, ago, symptoms]] of demo.entries()) await api('/api/patients', 'POST', { name, patientId: id(i), age: 25 + i * 9, gender: 'Other', priority, symptoms, arrivalTime: at(ago) });
  toast('Demo patients loaded.'); await load();
});
setInterval(() => { $('clock').textContent = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }); }, 1000);
setInterval(() => document.querySelectorAll('.w').forEach(s => s.textContent = mins(s.dataset.t)), 15000); // light: only updates numbers
$('clock').textContent = new Date().toLocaleString(); load().catch(() => toast('Cannot reach server', true));
