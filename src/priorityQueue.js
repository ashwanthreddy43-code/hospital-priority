// Max-priority queue (binary heap). Order: higher priority, then earlier arrival, then lower seq.
function before(a, b) {
  if (a.priority !== b.priority) return a.priority > b.priority;
  const ta = Date.parse(a.arrivalTime), tb = Date.parse(b.arrivalTime);
  if (ta !== tb) return ta < tb;
  return a.seq < b.seq;
}
class PriorityQueue {
  constructor() { this.h = []; }
  get size() { return this.h.length; }
  peek() { return this.h[0] || null; }
  push(x) { // O(log n)
    const h = this.h; h.push(x);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!before(h[i], h[p])) break;
      [h[i], h[p]] = [h[p], h[i]]; i = p;
    }
  }
  pop() { // O(log n)
    const h = this.h;
    if (!h.length) return null;
    const top = h[0], last = h.pop();
    if (h.length) {
      h[0] = last; let i = 0;
      for (;;) {
        let m = i; const l = 2 * i + 1, r = l + 1;
        if (l < h.length && before(h[l], h[m])) m = l;
        if (r < h.length && before(h[r], h[m])) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m], h[i]]; i = m;
      }
    }
    return top;
  }
  toSortedArray() { const c = new PriorityQueue(); c.h = this.h.slice(); const o = []; while (c.size) o.push(c.pop()); return o; }
}
module.exports = { PriorityQueue, before };
