'use strict';
// In-memory adapter used only by the automated tests (no database needed).
function createMemoryAdapter() {
  let rows = new Map();
  const k = function (r, i) { return r + '\u0000' + i; };
  let chain = Promise.resolve();
  return {
    async init() {},
    async read(root, id) { const v = rows.get(k(root, id)); return v === undefined ? null : JSON.parse(v); },
    async list(root) {
      const out = [];
      rows.forEach(function (v, key) { const p = key.split('\u0000'); if (p[0] === root) out.push({ id: p[1], data: JSON.parse(v) }); });
      return out;
    },
    async listAll() {
      const out = [];
      rows.forEach(function (v, key) { const p = key.split('\u0000'); out.push({ root: p[0], id: p[1], data: JSON.parse(v) }); });
      return out;
    },
    transaction(fn) {
      const run = chain.then(async function () {
        const staged = new Map(rows);
        const tx = {
          async getRow(r, i) { const v = staged.get(k(r, i)); return v === undefined ? null : JSON.parse(v); },
          async putRow(r, i, d) { staged.set(k(r, i), JSON.stringify(d)); },
          async delRow(r, i) { staged.delete(k(r, i)); },
          async delRoot(r) { Array.from(staged.keys()).forEach(function (key) { if (key.split('\u0000')[0] === r) staged.delete(key); }); },
        };
        await fn(tx);
        rows = staged;
      });
      chain = run.catch(function () {});
      return run;
    },
  };
}
module.exports = { createMemoryAdapter };
