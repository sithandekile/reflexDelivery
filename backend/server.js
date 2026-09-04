import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';

import { initSocket } from './socket.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import deliveriesRouter from './routes/deliveries.js';
import assignmentsRouter from './routes/assignments.js';
import statusRouter from './routes/status.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/deliveries', deliveriesRouter);
app.use('/assignments', assignmentsRouter);
app.use('/status', statusRouter);

/* Socket.IO needs to attach to the raw HTTP server, not just the Express app,
 so create the server explicitly instead of using app.listen().*/
const httpServer = http.createServer(app);
initSocket(httpServer, process.env.CORS_ORIGIN);

const PORT = process.env.PORT || 8800;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Reflex Delivery API + sockets running on http://localhost:${PORT}`));
