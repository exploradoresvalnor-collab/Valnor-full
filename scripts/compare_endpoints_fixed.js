const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const BACKEND_AUDIT = path.join(ROOT, 'gui a de ejempli', 'valgame-backend', 'docs', '02_frontend', 'ENDPOINTS_AUDIT_REPORT.json');

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) res.push(...walk(full));
    else if (/\.tsx?$/.test(name)) res.push(full);
  }
  return res;
}

function extractFrontend() {
  const files = walk(SRC_DIR);
  const set = new Set();
  const re = /['"](\/api\/[A-Za-z0-9_\-:\/\?=.#\[\]{}]+)['"]/g;
  for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(code))) set.add(m[1]);
  }
  return Array.from(set).sort();
}

function extractBackend() {
  if (!fs.existsSync(BACKEND_AUDIT)) return [];
  const json = JSON.parse(fs.readFileSync(BACKEND_AUDIT, 'utf8'));
  return json.endpoints.map(e => e.path.replace(/\\/g,'/'));
}

const frontend = extractFrontend();
const backend = extractBackend();

const missing = frontend.filter(f => !backend.includes(f));

console.log('frontend endpoints:', frontend.length);
console.log(frontend.join('\n'));
console.log('\nbackend endpoints:', backend.length);
console.log('\nmissing in backend:', missing.length);
console.log(missing.join('\n'));

// write report
if (!fs.existsSync(path.join(ROOT, 'docs'))) fs.mkdirSync(path.join(ROOT, 'docs'));
fs.writeFileSync(path.join(ROOT, 'docs','ENDPOINTS_FRONTEND_JSON.txt'), frontend.join('\n'));
fs.writeFileSync(path.join(ROOT, 'docs','ENDPOINTS_MISSING_IN_BACKEND.txt'), missing.join('\n'));
console.log('reports written to docs/');