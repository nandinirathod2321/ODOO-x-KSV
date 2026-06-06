import { QuotationRepository } from '../repositories/quotation.repository.js';
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
