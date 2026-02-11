const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const BACKEND_AUDIT = path.join(ROOT, 'gui a de ejempli', 'valgame-backend', 'docs', '02_frontend', 'ENDPOINTS_AUDIT_REPORT.json');

function extractFrontend() {
  const files = glob.sync('src/**/*.ts*', { cwd: ROOT, absolute: true });
  const set = new Set();
  const re1 = /['"](\/api\/[A-Za-z0-9_\-:\/\?=.#\[\]{}]+)['"]/g;
  const re2 = /fetch\(\s*['"](\/api\/[A-Za-z0-9_\-:\/\?=.#\[\]{}]+)['"]/g;
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re1.exec(code))) set.add(m[1]);
    while ((m = re2.exec(code))) set.add(m[1]);
  }
  return Array.from(set).sort();
}

function extractBackend() {
  if (!fs.existsSync(BACKEND_AUDIT)) return [];
  const json = JSON.parse(fs.readFileSync(BACKEND_AUDIT, 'utf8'));
  return json.endpoints.map(e => e.path.replace(/\/g,'/'));
}

const frontend = extractFrontend();
const backend = extractBackend();

const missing = frontend.filter(f => !backend.includes(f) && !backend.includes(f.replace(/\/g, '/')));

console.log('frontend endpoints (sample):', frontend.length);
console.log(frontend.join('\n'));
console.log('\nbackend endpoints (sample):', backend.length);
console.log('\nmissing in backend:', missing.length);
console.log(missing.join('\n'));

// write report
fs.writeFileSync(path.join(ROOT, 'docs','ENDPOINTS_FRONTEND_JSON.txt'), frontend.join('\n'));
fs.writeFileSync(path.join(ROOT, 'docs','ENDPOINTS_MISSING_IN_BACKEND.txt'), missing.join('\n'));
console.log('reports written to docs/');