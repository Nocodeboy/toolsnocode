import { chromium } from 'playwright';
import fs from 'fs';

// Igual que fetch-site.py pero con navegador: muchas fichas del tramo que queda
// sirven un cascarón vacío a curl porque pintan con JavaScript.
const tsv = process.argv[2];
const out = fs.createWriteStream(process.argv[3], { flags: 'a' });
const CONC = Number(process.argv[4] || 4);
const jobs = fs.readFileSync(tsv, 'utf8').trim().split('\n').map(l => l.split('\t'));

const browser = await chromium.launch({
  // Fuera de un contenedor con el navegador preinstalado, déjalo sin poner
  // y Playwright resuelve la ruta por su cuenta.
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--ignore-certificate-errors'],
});
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

let i = 0;
async function worker() {
  while (i < jobs.length) {
    const [slug, url] = jobs[i++];
    let ctx;
    try {
      ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: UA, viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.route('**/*', (route) => {
        const t = route.request().resourceType();
        return t === 'image' || t === 'media' || t === 'font' ? route.abort() : route.continue();
      });
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2500);
      const data = await page.evaluate(() => {
        const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content')?.trim() || '';
        const txt = (sel) => [...document.querySelectorAll(sel)].map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 6);
        return {
          title: document.title || '',
          description: meta('description'),
          og_description: meta('og:description'),
          og_title: meta('og:title'),
          h1: txt('h1'), h2: txt('h2'),
          text: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2500),
          lang: document.documentElement.getAttribute('lang') || '',
        };
      });
      out.write(JSON.stringify({ slug, ok: true, status: resp?.status() ?? null, final_url: page.url(), ...data }) + '\n');
    } catch (e) {
      out.write(JSON.stringify({ slug, ok: false, error: String(e).split('\n')[0].slice(0, 140) }) + '\n');
    } finally { await ctx?.close().catch(() => {}); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close();
out.end();
console.error('done', jobs.length);
