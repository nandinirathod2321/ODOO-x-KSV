import { LookupRepository } from '../repositories/lookup.repository.js';

export class LookupService {
  static async getVendorCategories() {
    return await LookupRepository.getVendorCategories();
  }

  static getVendorStatuses() {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'blacklisted', label: 'Blacklisted' }
    ];
  }

  static getRfqStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'PUBLISHED' },
      { value: 'QUOTATION_RECEIVED' },
      { value: 'AWARDED' },
      { value: 'CLOSED' },
      { value: 'CANCELLED' }
    ];
  }

  static getQuotationStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'SUBMITTED' },
      { value: 'SELECTED' },
      { value: 'REJECTED' }
    ];
  }

  static getPoStatuses() {
    return [
      { value: 'ACTIVE' },
      { value: 'CLOSED' },
      { value: 'CANCELLED' }
    ];
  }

  static getInvoiceStatuses() {
    return [
      { value: 'DRAFT' },
      { value: 'SENT' },
      { value: 'PAID' },
      { value: 'OVERDUE' }
    ];
  }

  static getRoles() {
    return [
      { value: 'ADMIN' },
      { value: 'MANAGER' },
      { value: 'PROCUREMENT_OFFICER' },
      { value: 'VENDOR' }
    ];
  }

  static getUnits() {
    return [
      { value: 'pcs' },
      { value: 'kg' },
      { value: 'litre' },
      { value: 'box' },
      { value: 'set' },
      { value: 'metre' },
      { value: 'hour' }
    ];
  }

  static async getActivityEventTypes() {
    return await LookupRepository.getActivityEventTypes();
  }
}
