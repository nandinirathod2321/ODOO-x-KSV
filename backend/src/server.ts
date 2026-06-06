import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import rfqRoutes from './routes/rfq.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import lookupRoutes from './routes/lookup.routes.js';
import myRoutes from './routes/my.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import poRoutes from './routes/po.routes.js';

import { globalErrorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors({ origin: '*', credentials: false }));
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
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', poRoutes);





app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
