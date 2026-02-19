import { beforeAll, afterAll, it } from 'vitest';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';

let browser: Browser | null = null;

beforeAll(async () => {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
}, 30_000);

afterAll(async () => {
  if (browser) await browser.close();
});

it('debug /dashboard in dev - capture client errors & stack', async () => {
  if (!browser) throw new Error('Browser not started');
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('[PAGE LOG]', msg.text()));
  page.on('pageerror', (err: any) => {
    console.log('[PAGE ERROR]', err?.message ?? String(err));
    if (err?.stack) console.log('[PAGE ERROR STACK]', err.stack);
  });

  // Pre-seed localStorage as a Demo session (navigate first so localStorage is writable)
  const url = process.env.DEV_URL || 'http://localhost:5187';
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
  await page.evaluate(() => {
    localStorage.setItem('guest_user', JSON.stringify({ id: 'guest_debug', username: 'Invitado' }));
    localStorage.setItem('valnor_user', JSON.stringify({ id: 'guest_debug', username: 'Invitado' }));
    localStorage.setItem('valnor-session-storage', JSON.stringify({ state: { isGuest: true } }));
    localStorage.setItem('valgame_preferredMode', 'rpg');
  });

  // Navigate to dev dashboard
  await page.goto(`${url}/dashboard`, { waitUntil: 'networkidle2', timeout: 60_000 });

  // Wait to collect errors/logs (use a page.evaluate delay for compatibility)
  await page.evaluate(() => new Promise((res) => setTimeout(res, 3000)));
  const bodyStart = await page.evaluate(() => document.body ? document.body.innerHTML.slice(0, 400) : 'no-body');
  console.log('[PAGE BODY START]', bodyStart.replace(/\n/g, '\\n'));

  await page.close();
}, 120_000);
