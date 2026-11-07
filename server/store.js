'use strict';
// Firebase-Realtime-Database-style JSON tree stored in Postgres.
// Layout: one row per depth-2 node.  path "users/251911/balance" ->
//   root = "users", id = "251911", data = { balance: ... } (the whole subtree under users/251911)

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function checkKey(k) {
  if (typeof k !== 'string' || k.length === 0 || k.length > 768 ||
      /[\u0000-\u001f\u007f]/.test(k) || k === '.' || k === '..' || FORBIDDEN_KEYS.has(k)) {
    throw new HttpError(400, 'Invalid key: ' + String(k).slice(0, 50));
  }
}

function splitPath(p) {
  if (p === undefined || p === null) p = '';
  if (typeof p !== 'string') throw new HttpError(400, 'Invalid path');
  const segs = p.split('/').filter(function (s) { return s.length > 0; });
  segs.forEach(checkKey);
  return segs;
}

function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Mimics RTDB value rules: null/empty objects are not stored, arrays become
// index-keyed objects, {".sv":"timestamp"} becomes the server time.
function normalize(v, now) {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) {
    const o = {};
    v.forEach(function (x, i) { const n = normalize(x, now); if (n !== null) o[String(i)] = n; });
    return Object.keys(o).length ? o : null;
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 1 && keys[0] === '.sv' && v['.sv'] === 'timestamp') return now;
    const o = {};
    keys.forEach(function (k) {
      checkKey(k);
      const n = normalize(v[k], now);
      if (n !== null) o[k] = n;
    });
    return Object.keys(o).length ? o : null;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  return null;
}

// Replace the value at `segs` inside `node`; returns the new node or null if it ended up empty.
function setAt(node, segs, value) {
  if (segs.length === 0) return value;
  const base = isObj(node) ? Object.assign({}, node) : {};
  const k = segs[0];
  const child = setAt(base[k], segs.slice(1), value);
  if (child === null || child === undefined) delete base[k]; else base[k] = child;
  return Object.keys(base).length ? base : null;
}

function getAt(node, segs) {
  let cur = node;
  for (let i = 0; i < segs.length; i++) {
    if (!isObj(cur) || !Object.prototype.hasOwnProperty.call(cur, segs[i])) return null;
    cur = cur[segs[i]];
  }
  return cur === undefined ? null : cur;
}

// RTDB turns objects with keys 0..n (at least half present) back into arrays on read.
function toRead(v) {
  if (!isObj(v)) return v;
  const keys = Object.keys(v);
  const out = {};
  keys.forEach(function (k) { out[k] = toRead(v[k]); });
  if (keys.length && keys.every(function (k) { return /^(0|[1-9][0-9]*)$/.test(k); })) {
    const max = Math.max.apply(null, keys.map(Number));
    if (max + 1 <= 2 * keys.length) {
      const arr = [];
      for (let i = 0; i <= max; i++) arr.push(Object.prototype.hasOwnProperty.call(out, String(i)) ? out[String(i)] : null);
      return arr;
    }
  }
  return out;
}

async function readPath(adapter, segs) {
  if (segs.length === 0) {
    const all = await adapter.listAll();
    return all.length ? toRead(all.reduce(function (acc, r) {
      acc[r.root] = acc[r.root] || {}; acc[r.root][r.id] = r.data; return acc;
    }, {})) : null;
  }
  if (segs.length === 1) {
    const rows = await adapter.list(segs[0]);
    if (!rows.length) return null;
    const o = {};
    rows.forEach(function (r) { o[r.id] = r.data; });
    return toRead(o);
  }
  const row = await adapter.read(segs[0], segs[1]);
  if (row === null) return null;
  return toRead(getAt(row, segs.slice(2)));
}

// Applies a list of {path, value} writes atomically (value null = delete).
async function applyWrites(adapter, writes, now) {
  await adapter.transaction(async function (tx) {
    const cache = new Map(); // "root\0id" -> { data, dirty }
    const ck = function (root, id) { return root + '\u0000' + id; };
    async function load(root, id) {
      const key = ck(root, id);
      if (!cache.has(key)) cache.set(key, { root: root, id: id, data: await tx.getRow(root, id), dirty: false });
      return cache.get(key);
    }
    async function flush() {
      for (const e of cache.values()) {
        if (!e.dirty) continue;
        if (e.data === null || e.data === undefined) await tx.delRow(e.root, e.id);
        else await tx.putRow(e.root, e.id, e.data);
      }
      cache.clear();
    }
    for (const w of writes) {
      const segs = splitPath(w.path);
      const nv = normalize(w.value, now);
      if (segs.length === 0) throw new HttpError(400, 'Writing to the database root is not allowed');
      if (segs.length === 1) {
        if (nv !== null && !isObj(nv)) throw new HttpError(400, 'A collection must be an object');
        await flush();
        await tx.delRoot(segs[0]);
        if (nv !== null) {
          for (const id of Object.keys(nv)) {
            const e = await load(segs[0], id); e.data = nv[id]; e.dirty = true;
          }
        }
        continue;
      }
      const e = await load(segs[0], segs[1]);
      e.data = setAt(e.data, segs.slice(2), nv);
      e.dirty = true;
    }
    await flush();
  });
}

module.exports = { HttpError, splitPath, normalize, setAt, getAt, toRead, readPath, applyWrites };
