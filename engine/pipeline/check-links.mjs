import { chromium } from 'playwright';
import fs from 'fs';
const [tsv, outPath, conc] = process.argv.slice(2);
const done = new Set(fs.existsSync(outPath) ? fs.readFileSync(outPath,'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l).slug) : []);
const out = fs.createWriteStream(outPath, { flags: 'a' });
const jobs = fs.readFileSync(tsv,'utf8').trim().split('\n').map(l => l.split('\t')).filter(([s]) => !done.has(s));
const browser = await chromium.launch({
  // Fuera de un contenedor con el navegador preinstalado, déjalo sin poner
  // y Playwright resuelve la ruta por su cuenta.
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--ignore-certificate-errors'],
});
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
let i = 0;
async function worker() {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: UA });
  await ctx.route('**/*', r => ['image','media','font','stylesheet'].includes(r.request().resourceType()) ? r.abort() : r.continue());
  let page = await ctx.newPage();
  while (i < jobs.length) {
    const [slug, url] = jobs[i++];
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const text = (await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g,' ').trim().slice(0, 300)).catch(() => ''));
      out.write(JSON.stringify({ slug, status: resp?.status() ?? null, final_url: page.url(), title: await page.title().catch(() => ''), text }) + '\n');
    } catch (e) {
      out.write(JSON.stringify({ slug, status: null, error: String(e).split('\n')[0].slice(0,100) }) + '\n');
      try { await page.close(); page = await ctx.newPage(); } catch { /* el contexto sigue */ }
    }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: Number(conc || 5) }, worker));
await browser.close(); out.end();
