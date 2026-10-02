const test = require('node:test'); const assert = require('node:assert');
const { PatientService } = require('../src/patientService');
const p = (id, priority, min = 0, extra = {}) => ({ patientId: id, name: 'N' + id, age: 30, gender: 'Male', priority, symptoms: 'pain', arrivalTime: new Date(Date.UTC(2026, 0, 1, 10, min)).toISOString(), ...extra });
test('queue order, critical jumps ahead', () => {
  const s = new PatientService(); s.add(p('A', 2, 0)); s.add(p('B', 4, 1)); s.add(p('C', 4, 2)); s.add(p('D', 5, 30));
  assert.deepStrictEqual(s.waiting().map(x => x.patientId), ['D', 'B', 'C', 'A']);
});
test('call next moves patient to treating; complete moves to treated', () => {
  const s = new PatientService(); s.add(p('A', 1)); s.add(p('B', 5));
  const n = s.next(); assert.strictEqual(n.patientId, 'B'); assert.strictEqual(n.status, 'treating');
  assert.deepStrictEqual(s.waiting().map(x => x.patientId), ['A']);
  s.complete('B'); assert.deepStrictEqual(s.stats(), { waiting: 1, critical: 0, treating: 0, treated: 1 });
});
test('empty queue next returns null', () => assert.strictEqual(new PatientService().next(), null));
test('invalid input rejected', () => {
  const s = new PatientService();
  for (const bad of [p('A', 9), p('A', 3, 0, { age: -1 }), p('A', 3, 0, { age: 'abc' }), p('A', 3, 0, { name: '  ' }), p('', 3), p('A', 3, 0, { symptoms: '' }), p('bad id!', 3), null])
    assert.throws(() => s.add(bad));
  s.add(p('A', 3)); assert.throws(() => s.add(p('A', 2)), /already exists/);
});
test('same priority and time uses registration order', () => {
  const s = new PatientService(); s.add(p('X', 3)); s.add(p('Y', 3));
  assert.deepStrictEqual(s.waiting().map(x => x.patientId), ['X', 'Y']);
});
