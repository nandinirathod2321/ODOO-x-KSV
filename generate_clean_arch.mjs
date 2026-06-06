import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = __dirname;

const files = {
  'src/server.js': `import express from 'express';
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
  console.log(\`Server running on port \${PORT}\`);
});
`,
  'src/websocket/index.js': `import { Server } from 'socket.io';

let io;

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
`,
  'src/repositories/quotation.repository.js': `import prisma from '../lib/prisma.js';

export class QuotationRepository {
  async create(data) {
    return prisma.quotation.create({ data });
  }

  async findByRfq(rfqId) {
    return prisma.quotation.findMany({
      where: { rfq_id: rfqId },
      include: { vendor: true }
    });
  }

  async updateStatus(id, status) {
    return prisma.quotation.update({
      where: { id },
      data: { status }
    });
  }
}
`,
  'src/services/quotation.service.js': `import { QuotationRepository } from '../repositories/quotation.repository.js';
import { broadcastEvent } from '../websocket/index.js';

const quotationRepo = new QuotationRepository();

export class QuotationService {
  async submitQuotation(data) {
    const quotation = await quotationRepo.create(data);
    broadcastEvent('quotation_submitted', quotation);
    return quotation;
  }

  async compareQuotations(rfqId) {
    const quotations = await quotationRepo.findByRfq(rfqId);
    if (!quotations.length) return [];

    // Procurement Recommendation Engine
    // Weights: Price = 40%, Delivery Time = 30%, Vendor Rating = 30%
    
    const maxPrice = Math.max(...quotations.map(q => Number(q.price)));
    const maxDelivery = Math.max(...quotations.map(q => q.delivery_days));
    const maxRating = 5.0; // Assume rating is out of 5

    const ranked = quotations.map(q => {
      // Lower price is better
      const normalizedPriceScore = maxPrice === 0 ? 1 : 1 - (Number(q.price) / maxPrice);
      // Lower delivery time is better
      const normalizedDeliveryScore = maxDelivery === 0 ? 1 : 1 - (q.delivery_days / maxDelivery);
      // Higher rating is better
      const normalizedRatingScore = q.vendor.rating / maxRating;

      const score = (normalizedPriceScore * 0.4) + (normalizedDeliveryScore * 0.3) + (normalizedRatingScore * 0.3);
      
      return {
        ...q,
        score: score.toFixed(4)
      };
    }).sort((a, b) => b.score - a.score);

    return ranked;
  }
}
`,
  'src/controllers/quotation.controller.js': `import { QuotationService } from '../services/quotation.service.js';

const quotationService = new QuotationService();

export const submit = async (req, res, next) => {
  try {
    const quotation = await quotationService.submitQuotation(req.body);
    res.status(201).json(quotation);
  } catch (err) {
    next(err);
  }
};

export const compare = async (req, res, next) => {
  try {
    const rankings = await quotationService.compareQuotations(req.params.rfqId);
    res.json(rankings);
  } catch (err) {
    next(err);
  }
};
`,
  'src/routes/quotation.routes.js': `import { Router } from 'express';
import { submit, compare } from '../controllers/quotation.controller.js';
// Auth middleware should be added here

const router = Router();

router.post('/', submit);
router.get('/rfq/:rfqId/compare', compare);

export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(backendDir, filepath), content);
}
console.log('Clean Architecture core generation complete.');
