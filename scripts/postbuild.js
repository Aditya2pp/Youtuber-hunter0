import fs from 'fs';
import path from 'path';

const distIndex = path.resolve('dist/index.html');
if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html not found');
  process.exit(1);
}

const htmlContent = fs.readFileSync(distIndex, 'utf8');

// List of client routes that might be accessed directly
const routes = [
  'admin-011@',
  'admin',
  'dashboard/find',
  'dashboard/saved',
  'dashboard/plans',
  'dashboard/settings',
  'login',
  'signup',
];

// 1. Ensure .nojekyll and 404.html in dist
fs.writeFileSync(path.resolve('dist/.nojekyll'), '');
fs.writeFileSync(path.resolve('dist/404.html'), htmlContent);

// 2. Create physical route directories in dist
for (const route of routes) {
  const dir = path.resolve('dist', route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
}

// 3. Mirror all of dist into docs (for GitHub Pages /docs folder deployment)
const docsDir = path.resolve('docs');
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.cpSync(path.resolve('dist'), docsDir, { recursive: true });

// 4. Also provide root 404.html, .nojekyll, and root route directories
// (in case user deploys from root instead of /docs)
fs.writeFileSync(path.resolve('.nojekyll'), '');
fs.writeFileSync(path.resolve('404.html'), htmlContent);

for (const route of routes) {
  const dir = path.resolve(route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);
}

console.log('✓ Successfully generated all GitHub Pages routes, 404 fallbacks, and docs bundle!');
