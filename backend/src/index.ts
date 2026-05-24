import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import { loadEnv } from './config/env';
import { createApp } from './app';
import { registerSocketHandlers } from './socket/SocketHandler';
import { ensureSchema } from './db/ensureSchema';

async function main() {
  const env = loadEnv();
  await ensureSchema(env.DATABASE_URL);
  const server = http.createServer();

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  const { app, users, races } = createApp(env, io);
  server.on('request', app);

  registerSocketHandlers(io, env, users, races);

  server.listen(env.PORT, () => {
    console.log(`RunRace Live API listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
