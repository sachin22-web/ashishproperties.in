process.env.NODE_ENV = 'production';

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = +(process.env.PORT || 8017);
// ✅ Your SPA build is under client/dist
const SPA_DIR = process.env.SPA_DIR || '/www/wwwroot/ashishproperties.in/client/dist';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(here, 'dist/server/index.mjs');

let mod;
try {
  mod = await import(pathToFileURL(serverEntry).href);
} catch (e) {
  console.error('❌ Cannot import server entry:', serverEntry, e);
  process.exit(1);
}

console.log('ℹ️ Server exports:', Object.keys(mod));

let server = null;

// Prefer createServer({host,port,spaDir})
if (typeof mod.createServer === 'function') {
  try {
    const r = await mod.createServer({ host: HOST, port: PORT, spaDir: SPA_DIR });
    // If createServer returned an http server or express app:
    if (r?.listen) server = r;
    else if (r?.server?.listen) server = r.server;
  } catch (e) {
    console.error('❌ createServer failed:', e);
  }
}

// Fallbacks if your bundle exports app/default with .listen
if (!server && mod.app?.listen) server = mod.app;
if (!server && mod.default?.listen) server = mod.default;

if (server && typeof server.listen === 'function' && !server.listening) {
  await new Promise((resolve, reject) =>
    server.listen(PORT, HOST, (err) => err ? reject(err) : resolve())
  );
  console.log(`✅ Listening on http://${HOST}:${PORT}`);
  console.log(`📱 SPA path: ${SPA_DIR}`);
} else if (!server) {
  console.error('❌ No server with .listen() exposed by dist/server/index.mjs');
  process.exit(1);
}

// keep process alive
setInterval(() => {}, 3600_000);
