import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import puppeteer from 'puppeteer';
import type { Browser, HTTPRequest } from 'puppeteer';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

let PREVIEW_URL = 'http://localhost:5173';
let previewProcess: ChildProcess | null = null;
let browser: Browser | null = null;

function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const req = http.get(url, (res) => {
        res.destroy();
        return resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('Server did not start in time'));
        setTimeout(check, 300);
      });
      req.end();
    })();
  });
}

beforeAll(async () => {
  // 1) Build (usar npm script para compatibilidad con exports de vite)
  await new Promise<void>((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('build failed'))));
  });

  // 2) Start `vite preview` (usar npx). Vite puede elegir otro puerto — leer stdout para obtener la URL real
  previewProcess = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
    shell: true,
  });

  // Capturar la URL que Vite imprime (intentar stdout primero, fallback a probe de puertos)
  try {
    PREVIEW_URL = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('preview did not start in time (stdout)')), 30000);
      previewProcess!.stdout!.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        process.stdout.write(`[preview] ${text}`);
        const m = text.match(/Local:\s*(http:\/\/localhost:\d+)/i);
        if (m) {
          clearTimeout(timeout);
          resolve(m[1]);
        }
      });
      previewProcess!.stderr!.on('data', (c: Buffer) => process.stderr.write(`[preview] ${c.toString()}`));
    });
  } catch (err: any) {
    // Fallback: probe common preview ports (5173..5183)
    const ports = Array.from({ length: 11 }, (_, i) => 5173 + i);
    let found: string | null = null;
    for (const p of ports) {
      try {
        await waitForServer(`http://localhost:${p}`, 3000);
        found = `http://localhost:${p}`;
        break;
      } catch (e) {
        /* not on this port */
      }
    }
    if (!found) throw new Error('preview did not start in time (probe)');
    PREVIEW_URL = found;
  }

  // Asegurarnos que el servidor responde antes de continuar
  await waitForServer(PREVIEW_URL, 30000);

  // launch browser
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}, 120_000);

afterAll(async () => {
  if (browser) await browser.close();
  if (previewProcess) previewProcess.kill();
});

describe('Demo session — F5 persistence + safe logout (e2e)', () => {
  it('survive F5 and is fully removed on Demo logout without calling backend', async () => {
    if (!browser) throw new Error('Browser not started');
    const page = await browser.newPage();

    // Debug: forward browser console & errors to test stdout for easier debugging
    page.on('console', (msg) => console.log('[PAGE LOG]', msg.text()));
    page.on('pageerror', (err: any) => {
      console.log('[PAGE ERROR]', err?.message ?? String(err));
      if ((err as any)?.stack) console.log('[PAGE ERROR STACK]', (err as any).stack);
    });

    const backendLogoutRequests: string[] = [];
    page.on('request', (req: HTTPRequest) => {
      const url = req.url();
      if (url.includes('/api/auth/logout')) backendLogoutRequests.push(url);
    });

    // 1) Go to landing and start demo
    await page.goto(`${PREVIEW_URL}/landing`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button[aria-label="Entrar al Demo"]', { timeout: 5000 });
    await page.click('button[aria-label="Entrar al Demo"]');

    // navigation to /portals (app triggers after short delay)
    await page.waitForFunction(() => location.pathname.includes('/portals'), { timeout: 5000 });

    // 2) Assert demo user persisted in localStorage
    const storedUser = await page.evaluate(() => localStorage.getItem('valnor_user'));
    expect(storedUser).not.toBeNull();
    const parsed = JSON.parse(storedUser as string);
    expect(parsed.username || parsed.user?.username).toMatch(/Invitad|guest/i);

    // 3) Simulate F5
    await page.reload({ waitUntil: 'networkidle2' });

    // still on portals and demo persisted
    await page.waitForFunction(() => location.pathname.includes('/portals'), { timeout: 5000 });
    const storedAfterReload = await page.evaluate(() => localStorage.getItem('valnor_user'));
    expect(storedAfterReload).not.toBeNull();

    // Verificar que sessionStore persistido contiene isGuest (asegurar short-circuit)
    const persistedSession = await page.evaluate(() => localStorage.getItem('valnor-session-storage'));
    expect(persistedSession).not.toBeNull();
    expect(persistedSession).toMatch(/isGuest\":true|\"isGuest\":true/);

    // 4) Asegurar que hay un modo de juego seleccionado (demo bootstrapper no lo cambia)
    await page.evaluate(() => localStorage.setItem('valgame_preferredMode', 'rpg'));

    // Navegar a Dashboard (asegura que la UI del header está renderizada)
    await page.goto(`${PREVIEW_URL}/dashboard`, { waitUntil: 'networkidle2' });

    // DEBUG: mostrar ruta y primeros caracteres del body si algo falla
    const currentPath = await page.evaluate(() => location.pathname + location.search + location.hash);
    console.log('[e2e] currentPath after goto:', currentPath);
    const bodyStart = await page.evaluate(() => document.body ? document.body.innerHTML.slice(0, 800) : 'no-body');
    console.log('[e2e] bodyStart:', bodyStart.replace(/\n/g, '\\n').slice(0, 800));

    // Espera más generosa por si la app inicializa lentamente
    // Usar el botón de logout del Dashboard (estable y presente en /dashboard)
    await page.waitForSelector('[data-testid="dash-logout"]', { timeout: 60000 });
    await page.click('[data-testid="dash-logout"]');

    // 5) Confirm modal appears and confirm (misma modal reutilizada)
    await page.waitForSelector('[data-testid="guest-logout-modal"]', { timeout: 10000 });
    await page.click('[data-testid="guest-logout-confirm"]');

    // 6) After logout ensure localStorage cleared and redirected to landing
    await page.waitForFunction(() => location.pathname === '/landing' || location.pathname === '/splash' || location.pathname === '/', { timeout: 5000 });
    const afterLogoutUser = await page.evaluate(() => localStorage.getItem('valnor_user'));
    expect(afterLogoutUser).toBeNull();

    // 7) Ensure no backend logout call was made for Demo
    expect(backendLogoutRequests.length).toBe(0);

    // 8) Ensure success toast shown
    const toastText = await page.evaluate(() => {
      const el = document.querySelector('.toast--success .toast__text');
      return el ? el.textContent : null;
    });
    expect(toastText).toMatch(/Demo|eliminad/i);

    await page.close();
  }, 180_000);
});
