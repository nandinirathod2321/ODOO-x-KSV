import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

// Helper to move directory contents
function moveDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      moveDir(srcPath, destPath);
    } else {
      fs.renameSync(srcPath, destPath);
    }
  });
  fs.rmdirSync(src);
}

// 1. Move App.jsx to routes/
if (fs.existsSync(path.join(srcDir, 'App.jsx'))) {
  fs.renameSync(path.join(srcDir, 'App.jsx'), path.join(srcDir, 'routes/App.jsx'));
}

// Move guards to routes/guards
moveDir(path.join(srcDir, 'guards'), path.join(srcDir, 'routes/guards'));

// 2. Move config to utils/config
moveDir(path.join(srcDir, 'config'), path.join(srcDir, 'utils/config'));

// 3. Move context, styles, assets to lib/
moveDir(path.join(srcDir, 'context'), path.join(srcDir, 'lib/context'));
moveDir(path.join(srcDir, 'styles'), path.join(srcDir, 'lib/styles'));
moveDir(path.join(srcDir, 'assets'), path.join(srcDir, 'lib/assets'));

// 4. Move print, templates to components/
moveDir(path.join(srcDir, 'print'), path.join(srcDir, 'components/print'));
moveDir(path.join(srcDir, 'templates'), path.join(srcDir, 'components/templates'));

// We need to update imports. To do this perfectly via regex is hard, so we'll replace specific strings.
const replacements = [
  { from: "'./guards/", to: "'../routes/guards/" },
  { from: "'../guards/", to: "'../../routes/guards/" },
  
  { from: "'./config/", to: "'../utils/config/" },
  { from: "'../config/", to: "'../../utils/config/" },
  
  { from: "'./context/", to: "'../lib/context/" },
  { from: "'../context/", to: "'../../lib/context/" },
  
  { from: "'./styles/", to: "'../lib/styles/" },
  { from: "'../styles/", to: "'../../lib/styles/" },
  
  { from: "'./assets/", to: "'../lib/assets/" },
  { from: "'../assets/", to: "'../../lib/assets/" },
  
  { from: "'./print/", to: "'../components/print/" },
  { from: "'../print/", to: "'../../components/print/" },
  
  { from: "'./templates/", to: "'../components/templates/" },
  { from: "'../templates/", to: "'../../components/templates/" },
  
  // App.jsx was moved from root to routes/App.jsx, so main.jsx import changes
  { from: "import App from './App.jsx'", to: "import App from './routes/App.jsx'" },
  
  // App.jsx itself needs its imports adjusted since it's now in routes/
  // Instead of complex relative math, we just assume for App.jsx specifically:
];

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Generic replacements
  replacements.forEach(({from, to}) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });

  // App.jsx specific adjustments (since its depth changed by +1)
  if (file.endsWith('routes\\App.jsx') || file.endsWith('routes/App.jsx')) {
    content = content.replace(/from '\.\//g, "from '../");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
  }
});

console.log('Restructure complete.');
