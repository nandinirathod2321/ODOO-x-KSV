import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

// 1. Create apiResponse.ts
const apiResponseContent = `export const successResponse = (res: any, data: any, message = 'Success') => {
  return res.json({ data, message });
};

export const paginatedResponse = (res: any, data: any, meta: { total: number; page: number; per_page: number; last_page: number }, message = 'OK') => {
  return res.json({ data, meta, message });
};

export const errorResponse = (res: any, status: number, message: string, errors?: any) => {
  const payload: any = { message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};
`;
fs.mkdirSync(path.join(srcDir, 'utils'), { recursive: true });
fs.writeFileSync(path.join(srcDir, 'utils', 'apiResponse.ts'), apiResponseContent);

// 2. Create serializer.ts for snake_case and Decimal handling
const serializerContent = `import { Prisma } from '@prisma/client';

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);

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
`;
fs.writeFileSync(path.join(srcDir, 'utils', 'serializer.ts'), serializerContent);

console.log('Audit utilities generated successfully.');
