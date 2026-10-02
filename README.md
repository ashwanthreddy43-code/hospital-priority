# Hospital Priority Queue
Emergency Department Patient Management System. **Problem:** decide the order in which ER patients are treated — higher priority first; same priority → earlier arrival; same timestamp → earlier registration order.

## Features
Register patients, live sorted queue, Call Next, Complete Treatment, search, filters, live waiting time, stats, demo data, SQLite persistence, 11 automated tests.

## Stack
HTML/CSS/vanilla JS · Node.js (22.13+) · Express · SQLite (built-in `node:sqlite`).

## Priority rules
5 Critical > 4 Emergency > 3 Urgent > 2 Less Urgent > 1 Non-Urgent. Tie → earlier `arrivalTime` → lower `seq`.

## Algorithm
`src/priorityQueue.js` is a binary **max-heap** with comparator (priority desc, arrival asc, seq asc).
Insert O(log n) · extract-next O(log n) · peek O(1) · sorted display O(n log n) (n pushes + n pops on a copy). Each request loads waiting patients from SQLite and heapifies, so it is O(n log n) per call; fine for ER-sized queues.

## API
GET /api/health · GET /api/patients[/waiting|/treating|/treated] · GET /api/stats · POST /api/patients · POST /api/patients/next · POST /api/patients/:id/complete · DELETE /api/patients/:id · DELETE /api/patients
(`:id` is the Patient ID, e.g. P001.)

## Structure
`public/` UI · `src/` heap, service, DB · `tests/` · `server.js`

## Run
```
npm install
npm test
npm start     # http://localhost:3000
```
## Future improvements
Login/roles, multiple doctors, real-time updates (WebSocket), priority aging.
