/* Drop-in replacement for the Firebase Realtime Database client used by app-logic.js.
   It exposes the same `firebase.initializeApp()` / `firebase.database()` / `db.ref()` API
   but talks to this project's own server (/api), which stores the data in Neon Postgres.
   No database credentials ever reach the browser. */
(function () {
  'use strict';
  var API = '/api';
  var POLL_MS = 4000;
  var SERVER_TS = { '.sv': 'timestamp' };

  function clone(v) { return v === undefined ? null : JSON.parse(JSON.stringify(v)); }
  function norm(p) { return String(p || '').split('/').filter(function (s) { return s.length > 0; }).join('/'); }
  function join(a, b) { return norm(norm(a) + '/' + norm(b)); }
  function lastSeg(p) { var s = norm(p).split('/'); return s[s.length - 1] || null; }

  // Firebase key order: integer-like keys first (numerically), then strings.
  function isIntKey(k) { return /^(0|-?[1-9][0-9]{0,9})$/.test(k) && Math.abs(Number(k)) <= 2147483647; }
  function cmpKeys(a, b) {
    var ia = isIntKey(a), ib = isIntKey(b);
    if (ia && ib) return Number(a) - Number(b);
    if (ia) return -1;
    if (ib) return 1;
    return a < b ? -1 : (a > b ? 1 : 0);
  }

  function request(method, url, body) {
    return fetch(API + url, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j && j.error) || ('Request failed (' + r.status + ')'));
        return j;
      });
    });
  }

  /* ---------- DataSnapshot ---------- */
  function Snapshot(path, value) {
    this._path = norm(path);
    this._v = value === undefined ? null : value;
    this.key = lastSeg(path);
  }
  Snapshot.prototype.val = function () { return clone(this._v); };
  Snapshot.prototype.exists = function () { return this._v !== null && this._v !== undefined; };
  Snapshot.prototype.child = function (p) {
    var segs = norm(p).split('/').filter(Boolean), cur = this._v;
    for (var i = 0; i < segs.length; i++) {
      if (cur === null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, segs[i])) { cur = null; break; }
      cur = cur[segs[i]];
    }
    return new Snapshot(join(this._path, p), cur);
  };
  Snapshot.prototype.hasChild = function (p) { return this.child(p).exists(); };
  Snapshot.prototype.numChildren = function () {
    return (this._v !== null && typeof this._v === 'object') ? Object.keys(this._v).length : 0;
  };
  Snapshot.prototype.forEach = function (cb) {
    if (this._v === null || typeof this._v !== 'object') return false;
    var self = this, keys = Object.keys(this._v).sort(cmpKeys);
    for (var i = 0; i < keys.length; i++) {
      if (cb(new Snapshot(join(self._path, keys[i]), self._v[keys[i]])) === true) return true;
    }
    return false;
  };
  Object.defineProperty(Snapshot.prototype, 'ref', { get: function () { return db.ref(this._path); } });

  /* ---------- push ids (same scheme as Firebase) ---------- */
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  var lastPushTime = 0, lastRand = [];
  function pushId() {
    var now = Date.now(), dup = now === lastPushTime, i;
    lastPushTime = now;
    var ts = new Array(8);
    for (i = 7; i >= 0; i--) { ts[i] = PUSH_CHARS.charAt(now % 64); now = Math.floor(now / 64); }
    var id = ts.join('');
    if (!dup) {
      for (i = 0; i < 12; i++) lastRand[i] = Math.floor(Math.random() * 64);
    } else {
      for (i = 11; i >= 0 && lastRand[i] === 63; i--) lastRand[i] = 0;
      if (i >= 0) lastRand[i]++;
    }
    for (i = 0; i < 12; i++) id += PUSH_CHARS.charAt(lastRand[i]);
    return id;
  }

  /* ---------- realtime listeners (polling) ---------- */
  var listeners = {};   // path -> [{ cb, last }]
  var inflight = {};
  var serverOffset = 0;

  function fire(path, value) {
    var list = listeners[path]; if (!list) return;
    var s = JSON.stringify(value === undefined ? null : value);
    list.slice().forEach(function (l) {
      if (l.last === s) return;
      l.last = s;
      try { l.cb(new Snapshot(path, clone(value))); } catch (e) { console.error(e); }
    });
  }

  function fetchPath(path) {
    if (path === '.info/serverTimeOffset') {
      var t0 = Date.now();
      return request('GET', '/time').then(function (j) {
        var t1 = Date.now();
        serverOffset = j.now - Math.round((t0 + t1) / 2);
        fire(path, serverOffset);
      }).catch(function () {});
    }
    if (inflight[path]) return inflight[path];
    inflight[path] = request('POST', '/db/read', { path: path }).then(function (j) {
      fire(path, j.value);
    }).catch(function () { /* retry on next poll */ }).then(function () { delete inflight[path]; });
    return inflight[path];
  }

  function refreshAll() {
    return Promise.all(Object.keys(listeners).filter(function (p) {
      return p !== '.info/serverTimeOffset' && listeners[p] && listeners[p].length;
    }).map(fetchPath));
  }

  setInterval(function () {
    if (typeof document !== 'undefined' && document.hidden) return;
    refreshAll();
  }, POLL_MS);

  /* ---------- Reference ---------- */
  function Reference(path) {
    this._path = norm(path);
    this.key = lastSeg(path);
  }
  Reference.prototype.toString = function () { return '/' + this._path; };
  Reference.prototype.child = function (p) { return new Reference(join(this._path, p)); };

  function write(writes) {
    return request('POST', '/db/write', { writes: writes }).then(function () { return refreshAll(); }).then(function () {});
  }

  Reference.prototype.set = function (value) {
    return write([{ path: this._path, value: value === undefined ? null : value }]);
  };
  Reference.prototype.remove = function () { return write([{ path: this._path, value: null }]); };
  Reference.prototype.update = function (values) {
    var base = this._path;
    var writes = Object.keys(values || {}).map(function (k) {
      return { path: join(base, k), value: values[k] === undefined ? null : values[k] };
    });
    if (!writes.length) return Promise.resolve();
    return write(writes);
  };
  Reference.prototype.push = function (value) {
    var child = new Reference(join(this._path, pushId()));
    if (value === undefined) return child;
    var plain = new Reference(child._path);
    var p = child.set(value).then(function () { return plain; });
    child.then = function (a, b) { return p.then(a, b); };
    child.catch = function (b) { return p.catch(b); };
    return child;
  };
  Reference.prototype.once = function (eventType, successCb, failureCb) {
    var self = this;
    var promise;
    if (this._path === '.info/serverTimeOffset') {
      promise = fetchPath(this._path).then(function () { return new Snapshot(self._path, serverOffset); });
    } else {
      promise = request('POST', '/db/read', { path: this._path }).then(function (j) { return new Snapshot(self._path, j.value); });
    }
    if (typeof successCb === 'function') {
      promise.then(function (snap) { successCb(snap); }, function (err) {
        if (typeof failureCb === 'function') failureCb(err); else console.error(err);
      });
    }
    return promise;
  };
  Reference.prototype.on = function (eventType, cb) {
    if (eventType !== 'value') throw new Error('Only the "value" event is supported');
    var p = this._path;
    (listeners[p] = listeners[p] || []).push({ cb: cb, last: undefined });
    fetchPath(p);
    return cb;
  };
  Reference.prototype.off = function (eventType, cb) {
    var p = this._path;
    if (!listeners[p]) return;
    if (typeof cb === 'function') listeners[p] = listeners[p].filter(function (l) { return l.cb !== cb; });
    else listeners[p] = [];
    if (!listeners[p].length) delete listeners[p];
  };

  /* ---------- firebase namespace ---------- */
  var db = { ref: function (p) { return new Reference(p); } };
  function database() { return db; }
  database.ServerValue = { TIMESTAMP: SERVER_TS };
  window.firebase = {
    initializeApp: function () { return {}; },
    database: database,
    apps: []
  };
  // exposed for tests / debugging
  window.__dbClient = { refreshAll: refreshAll };
})();
