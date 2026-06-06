import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const controllersDir = path.join(__dirname, 'src', 'controllers');

fs.readdirSync(controllersDir).forEach(file => {
  if (file.endsWith('.ts')) {
    const fullPath = path.join(controllersDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    content = content.replace(/req\.params\.id(?! as string)/g, 'req.params.id as string');
    content = content.replace(/req\.params\.rfqId(?! as string)/g, 'req.params.rfqId as string');
    content = content.replace(/req\.params\.quotationId(?! as string)/g, 'req.params.quotationId as string');

    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed req.params in: ${file}`);
    }
  }
});
