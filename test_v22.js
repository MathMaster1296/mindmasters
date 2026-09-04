/* v22 E2E: PWA + backup + rating history. Serves the build over local http
   (service workers need it): worker registration and cache, full offline
   reload, the rating journey chart, backup code export, restore on a wiped
   "new device", replace-existing restore, and checksum rejection */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, p);
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch(process.env.MM_CHROMIUM ? { executablePath: process.env.MM_CHROMIUM } : {});
  const context = await browser.newContext({ viewport: { width: 1000, height: 950 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const ok = m => console.log('ok:', m);
  const fail = m => { console.log('FAIL:', m); process.exitCode = 1; };

  // ---- first load over http: the service worker installs and takes control ----
  await page.goto(BASE);
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    for (let i = 0; i < 50 && !navigator.serviceWorker.controller; i++) await new Promise(r => setTimeout(r, 100));
    const keys = await caches.keys();
    return { active: !!reg.active, controlled: !!navigator.serviceWorker.controller, caches: keys };
  });
  sw.active ? ok('service worker active') : fail('no active worker');
  sw.controlled ? ok('worker controls the page without a second visit') : fail('page not controlled');
  (sw.caches.length === 1 && /^mm-[0-9a-f]{10}$/.test(sw.caches[0]))
    ? ok('one versioned cache (' + sw.caches[0] + ')') : fail('cache keys: ' + JSON.stringify(sw.caches));
  const cached = await page.evaluate(async () => {
    const c = await caches.open((await caches.keys())[0]);
    const reqs = (await c.keys()).map(r => new URL(r.url).pathname);
    return reqs.sort();
  });
  ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']
    .every(p => cached.some(u => u === p || u.endsWith(p)))
    ? ok('app shell fully cached') : fail('cached: ' + JSON.stringify(cached));

  // ---- onboard a student and make some rated history ----
  await page.fill('#nameInput', 'Backup'); await page.click('#startBtn');
  await page.waitForTimeout(500);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(200);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(200);
  }
  await page.click('#obDone');
  await page.waitForTimeout(400);
  await page.evaluate(() => { startTrain('math'); });
  await page.waitForTimeout(300);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(win => grade(win, Q.entries[Q.i].item), i !== 1);
    await page.waitForTimeout(150);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(150);
  }
  const hist = await page.evaluate(() => ({ n: (S.mathHist || []).length, last: (S.mathHist || []).slice(-1)[0], elo: S.mathElo }));
  (hist.n >= 5 && hist.last === hist.elo)
    ? ok('rating history records every rated game (' + hist.n + ' points, ends at ' + hist.last + ')')
    : fail('history: ' + JSON.stringify(hist));

  // ---- profile: rating journey chart ----
  await page.evaluate(() => { Q = null; showProfile(); });
  await page.waitForTimeout(400);
  (await page.$('#ratingChart')) ? ok('rating journey chart on the profile') : fail('no #ratingChart');
  const chart = await page.evaluate(() => ({
    lines: document.querySelectorAll('#ratingChart polyline').length,
    grid: document.querySelectorAll('#ratingChart line').length,
    txt: document.getElementById('screen-root').textContent.includes('Rating Journey')
  }));
  (chart.lines === 1 && chart.grid >= 2 && chart.txt)
    ? ok('chart draws the math line with gridlines') : fail('chart: ' + JSON.stringify(chart));

  // ---- backup: export a code from the profile ----
  await page.evaluate(() => { S.coins = 777; save(); });
  await page.click('#backupBtn');
  await page.waitForTimeout(900);
  const code = await page.evaluate(() => document.getElementById('bkOut').value);
  (code.startsWith('MMP1-') && code.length > 200) ? ok('backup code generated (' + code.length + ' chars)') : fail('code: ' + code.slice(0, 40));
  const roundtrip = await page.evaluate(c => new Promise(res => backupDecode(c, (e, o) => res({ e, name: o && o.name, coins: o && o.state.coins }))), code);
  (!roundtrip.e && roundtrip.name === 'Backup' && roundtrip.coins === 777)
    ? ok('code decodes back to the same account') : fail('roundtrip: ' + JSON.stringify(roundtrip));

  // ---- full offline reload: the cached app still boots ----
  await context.setOffline(true);
  await page.reload();
  await page.waitForTimeout(1500);
  const off = await page.evaluate(() => ({ name: S.name, screen: document.getElementById('screen-root').textContent.slice(0, 200) }));
  (off.name === 'Backup') ? ok('offline reload boots the app with progress intact') : fail('offline: ' + JSON.stringify(off).slice(0, 150));
  await context.setOffline(false);

  // ---- wiped device: restore from the welcome screen ----
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1200);
  (await page.$('#welcomeRestore')) ? ok('welcome screen offers restore on a fresh device') : fail('no restore link on welcome');
  await page.click('#welcomeRestore');
  await page.waitForTimeout(300);
  await page.fill('#rsIn', code);
  await page.click('#rsGo');
  await page.waitForTimeout(600);
  (await page.$('#mmYes')) ? ok('restore asks before creating the account') : fail('no confirm dialog');
  await page.click('#mmYes');
  await page.waitForTimeout(1500);
  const restored = await page.evaluate(() => ({
    name: S.name, coins: S.coins, hist: (S.mathHist || []).length,
    solved: Object.values(S.progress || {}).reduce((a, p) => a + Object.keys(p.correct || {}).length, 0)
  }));
  (restored.name === 'Backup' && restored.coins === 777 && restored.hist >= 5 && restored.solved > 0)
    ? ok('restore rebuilt the account: coins, history and solved problems') : fail('restored: ' + JSON.stringify(restored));

  // ---- restoring again replaces, after a warning, and login screen has the button ----
  await page.evaluate(() => mmLogout());
  await page.waitForTimeout(1200);
  (await page.$('#restoreBk')) ? ok('login screen offers restore') : fail('no restore on login screen');
  await page.click('#restoreBk');
  await page.waitForTimeout(300);
  await page.fill('#rsIn', code);
  await page.click('#rsGo');
  await page.waitForTimeout(600);
  const replaceTxt = await page.evaluate(() => (document.querySelector('.mbox') || {}).textContent || '');
  replaceTxt.includes('Replace') ? ok('restoring over an existing account warns about replacement') : fail('replace dialog: ' + replaceTxt.slice(0, 80));
  await page.click('#mmYes');
  await page.waitForTimeout(1500);
  const again = await page.evaluate(() => ({ name: S.name, accounts: Object.keys(JSON.parse(localStorage.getItem('mm_users'))).length }));
  (again.name === 'Backup' && again.accounts === 1) ? ok('replacement reuses the account instead of duplicating') : fail('again: ' + JSON.stringify(again));

  // ---- damaged codes are rejected ----
  await page.evaluate(() => { showRestoreScreen(showHome); });
  await page.waitForTimeout(300);
  await page.fill('#rsIn', code.slice(0, -6) + 'xx-zz9');
  await page.click('#rsGo');
  await page.waitForTimeout(400);
  const errTxt = await page.evaluate(() => document.getElementById('rsErr').textContent);
  errTxt.length > 0 ? ok('damaged code rejected: "' + errTxt.slice(0, 40) + '…"') : fail('tampered code accepted');

  errors.length === 0 ? ok('zero console errors') : fail('console errors: ' + errors.join(' | '));
  await browser.close();
  server.close();
  console.log(process.exitCode ? 'SUITE FAILED' : 'ALL v22 CHECKS PASSED');
})();
