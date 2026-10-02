const test = require('node:test'); const assert = require('node:assert');
const { PriorityQueue } = require('../src/priorityQueue');
const mk = (id, priority, t, seq) => ({ id, priority, arrivalTime: `2026-01-01T10:${t}:00Z`, seq });
const order = ps => { const q = new PriorityQueue(); ps.forEach(p => q.push(p)); return q.toSortedArray().map(p => p.id); };
test('higher priority first', () => assert.deepStrictEqual(order([mk('a', 4, '00', 1), mk('b', 5, '10', 2), mk('c', 1, '00', 3)]), ['b', 'a', 'c']));
test('same priority: earlier arrival first', () => assert.deepStrictEqual(order([mk('late', 4, '40', 1), mk('early', 4, '35', 2)]), ['early', 'late']));
test('same priority + time: lower seq first', () => assert.deepStrictEqual(order([mk('x', 3, '00', 2), mk('y', 3, '00', 1)]), ['y', 'x']));
test('critical jumps ahead', () => assert.strictEqual(order([mk('a', 2, '00', 1), mk('b', 3, '01', 2), mk('c', 5, '30', 3)])[0], 'c'));
test('empty pop returns null', () => assert.strictEqual(new PriorityQueue().pop(), null));
test('large queue stays ordered', () => {
  const ps = Array.from({ length: 5000 }, (_, i) => mk(i, 1 + (i * 7919) % 5, String(i % 60).padStart(2, '0'), i));
  const out = order(ps).map(i => ps[i]);
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i], ta = Date.parse(a.arrivalTime), tb = Date.parse(b.arrivalTime);
    assert.ok(a.priority > b.priority || (a.priority === b.priority && (ta < tb || (ta === tb && a.seq < b.seq))));
  }
});
