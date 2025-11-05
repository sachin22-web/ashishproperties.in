// server/start-server.ts
// This file is used for production builds only
// In development, use `npm run dev` which uses Vite dev server

import { createServer, initializeSocket } from "./index";
import { createServer as createHttpServer } from 'http';

const app = createServer();
const httpServer = createHttpServer(app);
const PORT = process.env.PORT || 8080;

// Initialize Socket.io for production
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ Production server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io server ready`);
});
