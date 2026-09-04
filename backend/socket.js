import { Server } from 'socket.io';
import authmid from './middleware/auth.js';

let io;

export const initSocket = (httpServer, corsOrigin)=> {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin || '*' },
  });

  // Every socket connection must present a valid JWT same token used for REST.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing auth token'));

    try {
      socket.user = authmid.verifyToken(token); // { id, role, name }
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, name } = socket.user;

    /* Role-based rooms: dispatchers get the pending-orders feed, riders get
     notified of their own assignments, retailers get updates on their own orders.*/
    socket.join(`role:${role}`);
    socket.join(`user:${id}`);

    console.log(`Socket connected: ${name} (${role})`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${name} (${role})`);
    });
  });

  return io;
}

export const getIO = ()=> {
  if (!io) throw new Error('Socket.IO not initialized, call initSocket first');
  return io;
}

