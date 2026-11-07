'use strict';
const { Pool } = require('pg');

// Neon connection strings may contain channel_binding=require; node-postgres
// does not need it (the connection is still TLS-encrypted), so strip it.
function cleanUrl(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch (e) { return url; }
}

function createPgAdapter(databaseUrl) {
  const pool = new Pool({
    connectionString: cleanUrl(databaseUrl),
    ssl: { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });
  pool.on('error', function (err) { console.error('Postgres pool error:', err.message); });

  return {
    async init() {
      await pool.query(
        'CREATE TABLE IF NOT EXISTS rtdb_nodes (' +
        ' root text NOT NULL, id text NOT NULL, data jsonb NOT NULL,' +
        ' updated_at timestamptz NOT NULL DEFAULT now(),' +
        ' PRIMARY KEY (root, id))'
      );
    },
    async read(root, id) {
      const r = await pool.query('SELECT data FROM rtdb_nodes WHERE root=$1 AND id=$2', [root, id]);
      return r.rows.length ? r.rows[0].data : null;
    },
    async list(root) {
      const r = await pool.query('SELECT id, data FROM rtdb_nodes WHERE root=$1', [root]);
      return r.rows.map(function (x) { return { id: x.id, data: x.data }; });
    },
    async listAll() {
      const r = await pool.query('SELECT root, id, data FROM rtdb_nodes');
      return r.rows;
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const tx = {
          async getRow(root, id) {
            const r = await client.query('SELECT data FROM rtdb_nodes WHERE root=$1 AND id=$2 FOR UPDATE', [root, id]);
            return r.rows.length ? r.rows[0].data : null;
          },
          async putRow(root, id, data) {
            await client.query(
              'INSERT INTO rtdb_nodes (root, id, data) VALUES ($1,$2,$3::jsonb) ' +
              'ON CONFLICT (root, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()',
              [root, id, JSON.stringify(data)]
            );
          },
          async delRow(root, id) { await client.query('DELETE FROM rtdb_nodes WHERE root=$1 AND id=$2', [root, id]); },
          async delRoot(root) { await client.query('DELETE FROM rtdb_nodes WHERE root=$1', [root]); },
        };
        await fn(tx);
        await client.query('COMMIT');
      } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw e;
      } finally {
        client.release();
      }
    },
    async close() { await pool.end(); },
  };
}

module.exports = { createPgAdapter };
