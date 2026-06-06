import { Prisma } from '@prisma/client';

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export const serializeData = (data: any): any => {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (typeof data === 'object') {
    if (Prisma.Decimal && data instanceof Prisma.Decimal) {
      return Number(data);
    }
    // Simple check if it has a toNumber method (like some decimal types)
    if (typeof data.toNumber === 'function') {
      return data.toNumber();
    }
    
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = toSnakeCase(key);
      serialized[snakeKey] = serializeData(value);
    }
    return serialized;
  }
  
  return data;
};

// Safe array fallback
export const safeArray = (arr: any) => (Array.isArray(arr) ? arr : []);
