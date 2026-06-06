import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.ts';
import rfqRoutes from './routes/rfq.routes.ts';
import activityLogRoutes from './routes/activityLog.routes.ts';
import notificationRoutes from './routes/notification.routes.ts';
import reportsRoutes from './routes/reports.routes.ts';
import invoiceRoutes from './routes/invoice.routes.ts';
import quotationRoutes from './routes/quotation.routes.ts';
import vendorRoutes from './routes/vendor.routes.ts';
import lookupRoutes from './routes/lookup.routes.ts';
import myRoutes from './routes/my.routes.ts';

import { globalErrorHandler } from './middlewares/error.middleware.ts';

const app = express();
app.use(cors({
  origin: '*'
}));
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.json());
app.set('io', io);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/my', myRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportsRoutes);





app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
