import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

const PORT = +(process.env.PORT || 8017);
const HOST = '127.0.0.1';
const SPA_DIR = process.env.SPA_DIR || '/www/wwwroot/ashishproperties.in/client/dist';

let app, server;
const mod = await import('./dist/server/index.mjs');

function toHandler(a){
  return (a && typeof a.callback==='function' && a.callback()) ||
         (a && typeof a.handle==='function' && ((req,res)=>a.handle(req,res))) ||
         (typeof a === 'function' && a) ||
         ((req,res)=>{ res.statusCode=200; res.end('OK'); });
}

async function tryCreateServer(){
  // try createServer with timeout (kahi hang na ho)
  if (typeof mod.createServer === 'function') {
    try {
      const p = mod.createServer({ spaDir: SPA_DIR, port: PORT, host: HOST });
      const ret = await Promise.race([p, delay(1500,'__timeout__')]);
      if (ret && typeof ret === 'object') {
        if (ret.server?.listen) server = ret.server;
        if (!app && ret.app) app = ret.app;
      }
    } catch {}
  }
  // try g()
  if (!server && typeof mod.g === 'function') {
    try {
      const p = mod.g({ spaDir: SPA_DIR, port: PORT, host: HOST });
      const ret = await Promise.race([p, delay(1500,'__timeout__')]);
      if (ret && typeof ret === 'object') {
        if (ret.server?.listen) server = ret.server;
        if (!app && ret.app) app = ret.app;
      }
      // kabhi-kabhi global par rakh dete hain
      if (!server && globalThis.server?.listen) server = globalThis.server;
      if (!app && globalThis.app) app = globalThis.app;
    } catch {}
  }
  // named exports
  if (!server && mod.server?.listen) server = mod.server;
  if (!app && mod.app) app = mod.app;

  // force listen
  if (!server) {
    const handler = toHandler(app);
    server = http.createServer(handler);
    server.listen(PORT, HOST);
  }

  server.on('listening', ()=>{
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
    console.log('📱 SPA path:', SPA_DIR);
  });
}
tryCreateServer().catch(e=>{ console.error('Fatal boot error:', e); process.exit(1); });

// keepalive
setInterval(()=>{}, 3600_000);
