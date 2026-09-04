import { io } from 'socket.io-client';
import { api } from './api/client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket = null;

// Call after login (or on app load if a token already exists) to open the
// authenticated connection. Safe to call multiple times — reuses one socket.
export function connectSocket() {
  const token = api.getToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
