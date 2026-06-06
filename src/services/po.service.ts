import { PORepository } from '../repositories/po.repository.ts';

export class POService {
  static async getAll() {
    return await PORepository.findAll();
  }
}
