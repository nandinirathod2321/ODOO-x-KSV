import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

const updateFile = (filePath, replacer) => {
  const fullPath = path.join(srcDir, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = replacer(content);
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent);
      console.log('Updated: ' + filePath);
    }
  }
};

// 1. Update Services: Pagination keys and logActivity
const servicesDir = path.join(srcDir, 'services');
if (fs.existsSync(servicesDir)) {
  fs.readdirSync(servicesDir).forEach(file => {
    if (file.endsWith('.ts')) {
      updateFile('services/' + file, content => {
        let updated = content;
        // Fix Pagination keys
        updated = updated.replace(/perPage/g, 'per_page');
        updated = updated.replace(/lastPage/g, 'last_page');
        
        // Fix logActivity
        if (updated.includes('prisma.activityLog.create')) {
          if (!updated.includes('logActivity')) {
            updated = "import { logActivity } from '../utils/logger.js';\n" + updated;
          }
          // Simple string replace for the standard pattern we generated
          updated = updated.replace(/await prisma\.activityLog\.create\(\{\s*data:\s*\{([\s\S]*?)\}\s*\}\);/g, (match, inner) => {
            return 'await logActivity({' + inner + '});';
          });
          // Fix tx.activityLog.create
          updated = updated.replace(/await tx\.activityLog\.create\(\{\s*data:\s*\{([\s\S]*?)\}\s*\}\);/g, (match, inner) => {
            return 'await logActivity({' + inner + '});';
          });
        }
        return updated;
      });
    }
  });
}

// 2. Update Controllers: Use apiResponse and serializeData
const controllersDir = path.join(srcDir, 'controllers');
if (fs.existsSync(controllersDir)) {
  fs.readdirSync(controllersDir).forEach(file => {
    if (file.endsWith('.ts')) {
      updateFile('controllers/' + file, content => {
        let updated = content;
        
        if (!updated.includes('successResponse')) {
          updated = "import { successResponse, paginatedResponse } from '../utils/apiResponse.js';\nimport { serializeData } from '../utils/serializer.js';\n" + updated;
        }

        // Replace res.json({ data: ... }) for single items or arrays without meta
        updated = updated.replace(/res\.status\(201\)\.json\(\{\s*message:\s*([^,]+),\s*data:\s*([^\}]+)\s*\}\);/g, "successResponse(res, serializeData($2), $1);");
        updated = updated.replace(/res\.json\(\{\s*message:\s*([^,]+),\s*data:\s*([^\}]+)\s*\}\);/g, "successResponse(res, serializeData($2), $1);");
        updated = updated.replace(/res\.json\(\{\s*data:\s*result\s*\}\);/g, "successResponse(res, serializeData(result), 'OK');");
        updated = updated.replace(/res\.json\(\{\s*data\s*\}\);/g, "successResponse(res, serializeData(data), 'OK');");
        updated = updated.replace(/res\.json\(data\);/g, "successResponse(res, serializeData(data), 'OK');");
        updated = updated.replace(/res\.json\(\{\s*message:\s*([^\}]+)\s*\}\);/g, "successResponse(res, null, $1);");

        // Replace paginated results (which return { data, meta })
        updated = updated.replace(/res\.json\(result\);/g, "if (result.meta) { paginatedResponse(res, serializeData(result.data), result.meta, 'OK'); } else { successResponse(res, serializeData(result), 'OK'); }");

        return updated;
      });
    }
  });
}

// 3. Update Error Middleware
updateFile('middlewares/error.middleware.ts', content => {
  if (!content.includes('errorResponse')) {
    let updated = "import { errorResponse } from '../utils/apiResponse.js';\n" + content;
    updated = updated.replace(/res\.status\(422\)\.json\(\{\s*message: 'Validation failed',\s*errors: err\.errors\s*\}\);/g, "return errorResponse(res, 422, 'Validation failed', err.errors);");
    updated = updated.replace(/res\.status\(500\)\.json\(\{\s*message: 'Internal server error'\s*\}\);/g, "return errorResponse(res, 500, 'Internal server error');");
    return updated;
  }
  return content;
});

console.log('Automated fixes applied.');
