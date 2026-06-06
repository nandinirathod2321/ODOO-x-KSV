import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initializeWebSocket } from './websocket/index.js';
import authRoutes from './routes/auth.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize WebSockets
initializeWebSocket(server);

app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
