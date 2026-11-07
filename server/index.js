'use strict';
const path = require('path');
const root = path.resolve(__dirname, '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch (e) { /* .env is optional if DATABASE_URL is already set */ }

const { createPgAdapter } = require('./pg-adapter');
const { createServer } = require('./app');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.'); process.exit(1); }
  const adapter = createPgAdapter(url);
  await adapter.init();
  const port = parseInt(process.env.PORT || '3001', 10);
  createServer(adapter, { distDir: path.join(root, 'dist') }).listen(port, function () {
    console.log('AgroChem server listening on http://localhost:' + port);
  });
}
main().catch(function (e) { console.error('Failed to start:', e.message); process.exit(1); });
