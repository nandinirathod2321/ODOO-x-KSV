import { PORepository } from '../repositories/po.repository';

export class POService {
  static async getAll() {
    return await PORepository.findAll();
  }
}
