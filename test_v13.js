/* v13 E2E: class codes, leaderboard ranking, tamper rejection, mocked Class Cloud sync */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const ok = m => console.log('ok:', m);
  const fail = m => { console.log('FAIL:', m); process.exitCode = 1; };

  // mock the firebase endpoint
  const cloudDb = {};
  await page.route('**/*firebaseio.com/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const key = url.pathname;
    if (req.method() === 'PUT') {
      cloudDb[key] = JSON.parse(req.postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cloudDb[key]) });
    } else {
      // GET on /classes/<cls>.json -> object of entries under that path
      const prefix = key.replace(/\.json$/, '');
      const out = {};
      for (const [k, v] of Object.entries(cloudDb)) {
        if (k.startsWith(prefix + '/')) out[k.slice(prefix.length + 1).replace(/\.json$/, '')] = v;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.keys(out).length ? out : null) });
    }
  });

  await page.goto('file://' + path.resolve('MindMasters_Academy.html'));
  await page.waitForTimeout(800);
  await page.fill('#nameInput', 'Pratham'); await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (!S.onboarded) { S.onboarded = 1; save(); showHome(); } });
  await page.waitForTimeout(300);
  await page.waitForTimeout(300);

  // generate + roundtrip + tamper
  const codes = await page.evaluate(() => {
    S.xp = 555; S.mathElo = 1300; S.chessElo = 1100; S.mathEloGames = 20; S.chessEloGames = 20; S.streak = 4; save();
    const good = classCode();
    const parsed = parseClassCode(good);
    const tampered = good.slice(0, 10) + 'X' + good.slice(11);
    return { good, parsed, tamperOk: parseClassCode(tampered) === null, junkOk: parseClassCode('MM1-hello-zzzz') === null };
  });
  (codes.parsed && codes.parsed.name === 'Pratham' && codes.parsed.xp === 555 && codes.parsed.m === 1300) ? ok('code roundtrip') : fail('roundtrip: ' + JSON.stringify(codes.parsed));
  codes.tamperOk ? ok('tampered code rejected') : fail('tamper accepted');
  codes.junkOk ? ok('junk code rejected') : fail('junk accepted');

  // fabricate two classmate codes (with valid checksums, via the app's own functions)
  const peerCodes = await page.evaluate(() => {
    const mk = (name, xp, m, c, st) => {
      const payload = [name, xp, m, c, 20, 20, st, 10, 100, '2026-08-01'].join('|');
      return 'MM1-' + btoa(unescape(encodeURIComponent(payload))) + '-' + lbHash(payload);
    };
    return [mk('Anya', 900, 1500, 1400, 9), mk('Ben', 300, 900, 850, 2)];
  });

  // leaderboard via Battle screen
  await page.click('#bottomnav button[data-nav="battle"]');
  await page.waitForTimeout(250);
  await page.click('#goLb');
  await page.waitForTimeout(300);
  (await page.textContent('#screen-root')).includes('My class code') ? ok('leaderboard screen') : fail('lb screen');
  await page.click('#addCodes');
  await page.fill('#codeInput', peerCodes.join('\n') + '\nMM1-garbage-aaaa');
  await page.click('#parseCodes');
  await page.waitForTimeout(400);
  const names = await page.$$eval('.lbrow .lname', els => els.map(e => e.childNodes[0].textContent.trim()));
  (names[0] === 'Anya' && names.includes('Pratham') && names.includes('Ben')) ? ok('ranked by Mind Rating: ' + names.join(', ')) : fail('order: ' + names.join(', '));
  const meRow = await page.$eval('.lbrow.me', el => el.textContent);
  meRow.includes('(you)') ? ok('self row highlighted') : fail('self row');
  // sort by XP -> Anya 900, Pratham 555, Ben 300
  await page.click('.diffchip[data-srt="xp"]');
  await page.waitForTimeout(250);
  const vals = await page.$$eval('.lbrow .lval', els => els.map(e => e.textContent));
  vals[0].includes('900') ? ok('XP sort works: ' + vals.join(' | ')) : fail('xp sort: ' + vals.join(' | '));
  // remove Ben
  await page.click('.lbrow .lx');
  await page.waitForTimeout(250);
  const n2 = await page.$$eval('.lbrow', els => els.length);
  n2 === 2 ? ok('peer removed') : fail('rows after remove: ' + n2);

  // ---- Class Cloud (mocked) ----
  await page.evaluate(() => { LB_SORT = 'mind'; });
  await page.fill('#cloudUrl', 'https://mmtest.firebaseio.com');
  await page.fill('#cloudCls', 'nsf2026');
  await page.click('#cloudSave');
  await page.waitForTimeout(700);
  const st = await page.textContent('#screen-root');
  st.includes('Class Cloud: nsf2026') ? ok('cloud connected badge') : fail('cloud badge');
  // our PUT should be in the mock db
  const putKeys = Object.keys(cloudDb);
  (putKeys.length === 1 && putKeys[0].includes('/classes/nsf2026/pratham')) ? ok('score pushed to cloud: ' + putKeys[0]) : fail('cloud keys: ' + putKeys.join(','));
  // seed a cloud classmate and refresh
  cloudDb['/classes/nsf2026/zara.json'] = { name: 'Zara', xp: 2000, m: 1800, c: 1700, mg: 30, cg: 30, st: 12, bd: 20, ct: 400, ts: '2026-08-04' };
  await page.click('#cloudRefresh');
  await page.waitForTimeout(700);
  const names3 = await page.$$eval('.lbrow .lname', els => els.map(e => e.childNodes[0].textContent.trim()));
  (names3[0] === 'Zara' && names3.includes('Ben')) ? ok('cloud and code peers merged, Zara leads: ' + names3.join(', ')) : fail('merged: ' + names3.join(', '));

  // auto push after a session
  const before = JSON.stringify(cloudDb['/classes/nsf2026/pratham.json']);
  await page.evaluate(() => {
    Q = { topicId: 'amc8', entries: [], i: 0, target: 0, correctThisRun: 0, xpThisRun: 0, eloStart: 800, lesson: '', name: 'x', icon: '', track: 'math', isDaily: false };
    S.xp = 700; save();
    showResults();
  });
  await page.waitForTimeout(500);
  const after = cloudDb['/classes/nsf2026/pratham.json'];
  (after && after.xp === 700) ? ok('auto-push after session updates cloud (xp 700)') : fail('auto-push: ' + JSON.stringify(after));

  // disconnect
  await page.evaluate(() => showLeaderboard());
  await page.waitForTimeout(400);
  await page.click('#cloudOff');
  await page.waitForTimeout(200);
  await page.click('#mmYes');
  await page.waitForTimeout(300);
  (await page.textContent('#screen-root')).includes('offline codes') ? ok('cloud disconnect') : fail('disconnect');

  // profile entry point
  await page.click('#bottomnav button[data-nav="profile"]');
  await page.waitForTimeout(250);
  await page.click('#myCodeBtn');
  await page.waitForTimeout(250);
  (await page.$('#myCode')) ? ok('profile -> class code shortcut') : fail('profile shortcut');

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
