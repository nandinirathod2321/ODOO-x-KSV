import { QuotationService } from '../services/quotation.service.js';

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
