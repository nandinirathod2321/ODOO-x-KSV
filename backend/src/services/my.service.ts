import { MyRepository } from '../repositories/my.repository.js';

export class MyService {
  static async getRfqs(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getRfqs(vendorId);
  }

  static async getQuotations(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getQuotations(vendorId);
  }

  static async getPurchaseOrders(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getPurchaseOrders(vendorId);
  }

  static async getInvoices(userId: string) {
    const vendorId = await MyRepository.getVendorIdByUserId(userId);
    if (!vendorId) throw new Error('Vendor profile not found');
    return await MyRepository.getInvoices(vendorId);
  }
}
