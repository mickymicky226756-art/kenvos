'use strict';
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { createServer } = require('../server/app');
const { createMemoryAdapter } = require('../server/memory-adapter');

(async function () {
  const server = createServer(createMemoryAdapter(), {});
  await new Promise(function (r) { server.listen(0, r); });
  const base = 'http://127.0.0.1:' + server.address().port;

  // load the browser client in a fake window
  const intervals = [];
  const win = {};
  const ctx = {
    window: win, document: { hidden: false }, console: console, JSON: JSON, Math: Math, Date: Date, Object: Object,
    Promise: Promise, Error: Error, Array: Array, Number: Number, String: String,
    setInterval: function (f) { intervals.push(f); return intervals.length; },
    fetch: function (u, o) { return fetch(base + u, o); },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/db-client.js'), 'utf8'), ctx);
  const firebase = win.firebase; firebase.initializeApp({});
  const db = firebase.database();
  const poll = function () { intervals.forEach(function (f) { f(); }); return new Promise(function (r) { setTimeout(r, 60); }); };

  // set / once / exists / val
  assert.strictEqual((await db.ref('users/251911').once('value')).exists(), false);
  await db.ref('users/251911').set({ phone: '251911', balance: 100, plans: [{ a: 1 }, { a: 2 }], bankInfo: { name: 'x' } });
  let s = await db.ref('users/251911').once('value');
  assert.strictEqual(s.val().balance, 100);
  assert.ok(Array.isArray(s.val().plans) && s.val().plans.length === 2);
  assert.strictEqual(s.key, '251911');

  // update (partial + nested path + null delete)
  await db.ref('users/251911').update({ balance: 150, 'bankInfo/name': null, 'extra/deep/x': 5 });
  s = await db.ref('users/251911').once('value');
  assert.strictEqual(s.val().balance, 150);
  assert.strictEqual(s.child('bankInfo').exists(), false);
  assert.strictEqual(s.val().extra.deep.x, 5);
  assert.strictEqual(s.val().phone, '251911');

  // push + multi-path root update (as in the app)
  const incRef = db.ref('users/251911/incomes').push();
  assert.ok(incRef.key && incRef.key.length === 20 && typeof incRef.then === 'undefined');
  await db.ref('users/251911').update({ ['incomes/' + incRef.key]: { amount: 5, timestamp: firebase.database.ServerValue.TIMESTAMP } });
  const inc = (await db.ref('users/251911/incomes').once('value')).val();
  assert.strictEqual(inc[incRef.key].amount, 5);
  assert.ok(Math.abs(inc[incRef.key].timestamp - Date.now()) < 5000);
  const ref2 = await db.ref('users/251911/incomes').push({ amount: 7 });
  assert.ok(ref2.key);
  assert.ok(incRef.key < ref2.key, 'push ids sort chronologically');

  // string leaf (refCodeIndex) and collection read + ordering
  await db.ref('refCodeIndex/ABC').set('251911');
  assert.strictEqual((await db.ref('refCodeIndex/ABC').once('value')).val(), '251911');
  await db.ref('users/9').set({ phone: '9' });
  await db.ref('users/100').set({ phone: '100' });
  const keys = []; (await db.ref('users').once('value')).forEach(function (c) { keys.push(c.key); });
  assert.deepStrictEqual(keys, ['9', '100', '251911']);
  assert.strictEqual((await db.ref('users').once('value')).numChildren(), 3);

  // root multi-path update (deposits/withdrawals cleanup pattern)
  await db.ref('deposits/d1').set({ status: 'reject', amount: 1 });
  await db.ref('deposits/d2').set({ status: 'approve', amount: 2 });
  await db.ref().update({ 'deposits/d1': null });
  const deps = (await db.ref('deposits').once('value')).val();
  assert.deepStrictEqual(Object.keys(deps), ['d2']);

  // collection replace (plans) + remove
  await db.ref('plans').push({ name: 'P1' });
  await db.ref('plans/k1').set({ name: 'P2' });
  await db.ref('plans/k1').remove();
  assert.strictEqual(Object.keys((await db.ref('plans').once('value')).val()).length, 1);
  await db.ref('giftCodes/WELCOME50').set({ amount: 50 });
  await db.ref('giftCodes/WELCOME50').remove();
  assert.strictEqual((await db.ref('giftCodes').once('value')).exists(), false);

  // callback style once
  await new Promise(function (resolve) { db.ref('settings/config').once('value', function (snap) { assert.strictEqual(snap.exists(), false); resolve(); }); });

  // serverTimeOffset
  const off = await db.ref('.info/serverTimeOffset').once('value');
  assert.ok(Math.abs(off.val()) < 2000);

  // listeners: initial fire, fire on change, off
  const seen = [];
  db.ref('settings/config').on('value', function (snap) { seen.push(snap.val()); });
  await new Promise(function (r) { setTimeout(r, 100); });
  assert.deepStrictEqual(seen, [null]);
  await db.ref('settings/config').set({ minDeposit: 700 });   // local write refreshes immediately
  await new Promise(function (r) { setTimeout(r, 100); });
  assert.deepStrictEqual(seen[seen.length - 1], { minDeposit: 700 });
  const n = seen.length;
  await poll();
  assert.strictEqual(seen.length, n, 'unchanged data does not re-fire');
  // change made by "another client" is picked up by polling
  await fetch(base + '/api/db/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [{ path: 'settings/config/minDeposit', value: 900 }] }) });
  await poll();
  assert.strictEqual(seen[seen.length - 1].minDeposit, 900);
  db.ref('settings/config').off('value');
  const n2 = seen.length;
  await db.ref('settings/config').set({ minDeposit: 1 });
  await poll();
  assert.strictEqual(seen.length, n2, 'off() stops events');

  // validation
  const bad = await fetch(base + '/api/db/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [{ path: 'users/__proto__/x', value: 1 }] }) });
  assert.strictEqual(bad.status, 400);
  const rootw = await fetch(base + '/api/db/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [{ path: '', value: null }] }) });
  assert.strictEqual(rootw.status, 400);
  assert.strictEqual((await fetch(base + '/api/health')).status, 200);

  // atomicity: failing multi-write leaves nothing applied
  const before = (await db.ref('users/9').once('value')).val();
  const fail = await fetch(base + '/api/db/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: [{ path: 'users/9/phone', value: 'changed' }, { path: 'users/__proto__', value: 1 }] }) });
  assert.strictEqual(fail.status, 400);
  assert.deepStrictEqual((await db.ref('users/9').once('value')).val(), before);

  console.log('All data-layer tests passed');
  server.close(); process.exit(0);
})().catch(function (e) { console.error('TEST FAILED:', e); process.exit(1); });
