import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@runrace/shared';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export async function getSocket(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync('auth_token');
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
