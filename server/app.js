'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { HttpError, splitPath, readPath, applyWrites } = require('./store');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
  '.apk': 'application/vnd.android.package-archive', '.pdf': 'application/pdf',
};

function sendJson(res, status, body) {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(s);
}

function readBody(req, limit) {
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on('data', function (c) {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, 'Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function serveStatic(req, res, distDir) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  let file = path.join(distDir, urlPath);
  if (file !== distDir && !file.startsWith(distDir + path.sep)) { res.writeHead(403); return res.end(); }
  let stat = null;
  try { stat = fs.statSync(file); if (stat.isDirectory()) { file = path.join(file, 'index.html'); stat = fs.statSync(file); } } catch (e) { stat = null; }
  if (!stat) {
    if (path.extname(urlPath)) { res.writeHead(404); return res.end('Not found'); }
    file = path.join(distDir, 'index.html');
    try { stat = fs.statSync(file); } catch (e) { res.writeHead(404); return res.end('Build the app first: npm run build'); }
  }
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes' };
  if (file.endsWith('index.html')) headers['Cache-Control'] = 'no-cache';
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      let start = m[1] === '' ? stat.size - parseInt(m[2], 10) : parseInt(m[1], 10);
      let end = m[1] === '' || m[2] === '' ? stat.size - 1 : parseInt(m[2], 10);
      if (isNaN(start) || start < 0) start = 0;
      if (end >= stat.size) end = stat.size - 1;
      if (start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size }); return res.end(); }
      headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
      headers['Content-Length'] = end - start + 1;
      res.writeHead(206, headers);
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start: start, end: end }).pipe(res);
    }
  }
  headers['Content-Length'] = stat.size;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

function createServer(adapter, opts) {
  const distDir = opts && opts.distDir ? path.resolve(opts.distDir) : null;
  return http.createServer(async function (req, res) {
    try {
      const pathname = new URL(req.url, 'http://x').pathname;
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/health' && req.method === 'GET') return sendJson(res, 200, { ok: true });
        if (pathname === '/api/time' && req.method === 'GET') return sendJson(res, 200, { now: Date.now() });
        if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
        let body;
        try { body = JSON.parse(await readBody(req, 2 * 1024 * 1024) || '{}'); } catch (e) {
          if (e instanceof HttpError) throw e; throw new HttpError(400, 'Invalid JSON');
        }
        if (pathname === '/api/db/read') {
          const value = await readPath(adapter, splitPath(body.path));
          return sendJson(res, 200, { value: value === undefined ? null : value });
        }
        if (pathname === '/api/db/write') {
          if (!Array.isArray(body.writes) || body.writes.length === 0 || body.writes.length > 500) throw new HttpError(400, 'Invalid writes');
          const writes = body.writes.map(function (w) {
            if (!w || typeof w.path !== 'string') throw new HttpError(400, 'Invalid write');
            return { path: w.path, value: w.value === undefined ? null : w.value };
          });
          await applyWrites(adapter, writes, Date.now());
          return sendJson(res, 200, { ok: true });
        }
        throw new HttpError(404, 'Not found');
      }
      if (distDir && (req.method === 'GET' || req.method === 'HEAD')) return serveStatic(req, res, distDir);
      res.writeHead(404); res.end('Not found');
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error('Server error:', e);
      if (!res.headersSent) sendJson(res, status, { error: status === 500 ? 'Internal server error' : e.message });
      else res.end();
    }
  });
}

module.exports = { createServer };
