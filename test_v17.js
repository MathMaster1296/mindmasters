/* v17 E2E: teacher role, classes, assignment builder, student completion, results, cloud sync */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(process.env.MM_CHROMIUM ? { executablePath: process.env.MM_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1000, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const ok = m => console.log('ok:', m);
  const fail = m => { console.log('FAIL:', m); process.exitCode = 1; };

  // mocked class cloud
  const cloudDb = {};
  await page.route('**/*firebaseio.com/**', async route => {
    const req = route.request();
    const key = new URL(req.url()).pathname;
    if (req.method() === 'PUT') {
      cloudDb[key] = JSON.parse(req.postData());
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    } else {
      const prefix = key.replace(/\.json$/, '');
      const out = {};
      for (const [k, v] of Object.entries(cloudDb)) {
        if (k.startsWith(prefix + '/')) {
          const rest = k.slice(prefix.length + 1).replace(/\.json$/, '');
          if (!rest.includes('/')) out[rest] = v;
        }
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.keys(out).length ? out : null) });
    }
  });

  await page.goto('file://' + path.resolve('MindMasters_Academy.html'));
  await page.waitForTimeout(1000);

  // ---- teacher onboarding ----
  (await page.$$eval('.rolebtn', els => els.length)) === 2 ? ok('role choice on welcome') : fail('no role buttons');
  await page.click('.rolebtn[data-role="teacher"]');
  await page.waitForTimeout(300);
  const avatarsHidden = await page.$$eval('.avatar-pick', els => els.length);
  avatarsHidden === 0 ? ok('teacher onboarding hides avatars') : fail('avatars visible for teacher');
  await page.fill('#nameInput', 'Coach P');
  await page.fill('#pwInput', 'coachpass1');
  await page.fill('#pwConfirm', 'coachpass1');
  await page.click('#startBtn');
  await page.waitForTimeout(700);
  (await page.textContent('#screen-root')).includes('Your Classes') ? ok('teacher home') : fail('no teacher home');

  // ---- create a class (cloud linked) ----
  await page.click('#newClassBtn');
  await page.waitForTimeout(250);
  await page.fill('#clsName', 'NSF Tuesday');
  await page.fill('#clsUrl', 'https://mmtest.firebaseio.com');
  await page.fill('#clsCls', 'nsf2026');
  await page.click('#createBtn');
  await page.waitForTimeout(350);
  (await page.textContent('#screen-root')).includes('NSF Tuesday') ? ok('class created') : fail('class view');

  // ---- build an assignment: manual picks + auto-pick ----
  await page.click('#newAsgBtn');
  await page.waitForTimeout(300);
  await page.fill('#asgTitle', 'Week 3 homework');
  await page.evaluate(() => { document.getElementById('asgTitle').dispatchEvent(new Event('change')); });
  await page.click('.bldtopic[data-topic="amc8"]');
  await page.waitForTimeout(350);
  // filter to easy problems then add two manually
  await page.fill('#minR', '500'); await page.fill('#maxR', '700');
  await page.click('#applyR');
  await page.waitForTimeout(300);
  await page.click('[data-gi]');
  await page.waitForTimeout(250);
  const addBtns = await page.$$('[data-gi]');
  await addBtns[1].click();
  await page.waitForTimeout(250);
  let picked = await page.evaluate(() => BLD.picks.length);
  picked === 2 ? ok('manual picks: 2') : fail('picks: ' + picked);
  // auto-pick 10 more
  await page.click('#autoPick');
  await page.waitForTimeout(300);
  picked = await page.evaluate(() => BLD.picks.length);
  picked === 12 ? ok('auto-pick brings total to 12') : fail('picks after auto: ' + picked);
  // rating filter respected
  const ratingsOk = await page.evaluate(() => BLD.picks.every(p => { const it = topicItems(p[0])[p[1]]; return it.er >= 500 && it.er <= 700; }));
  ratingsOk ? ok('all picks respect the rating filter') : fail('rating filter violated');
  await page.click('#createAsg');
  await page.waitForTimeout(600);
  const detail = await page.textContent('#screen-root');
  (detail.includes('Week 3 homework') && detail.includes('Assignment code')) ? ok('assignment detail with code') : fail('no detail');
  // cloud publish happened
  const pubKey = Object.keys(cloudDb).find(k => k.includes('/assignments/'));
  pubKey ? ok('published to cloud: ' + pubKey) : fail('no cloud publish');
  const asgCode = await page.evaluate(() => {
    const cls = TS.classes[0]; return assignmentCode(cls, cls.assignments[0]);
  });
  const asgInfo = await page.evaluate(() => ({ id: TS.classes[0].assignments[0].id, n: TS.classes[0].assignments[0].probs.length }));

  // code roundtrip + tamper
  const parsed = await page.evaluate(c => parseAssignmentCode(c), asgCode);
  (parsed && parsed.title === 'Week 3 homework' && parsed.probs.length === 12) ? ok('assignment code roundtrip') : fail('roundtrip: ' + JSON.stringify(parsed && parsed.title));
  const tampered = await page.evaluate(c => parseAssignmentCode(c.slice(0, 12) + 'Z' + c.slice(13)), asgCode);
  tampered === null ? ok('tampered assignment code rejected') : fail('tamper accepted');

  // ---- switch to student, receive by CODE ----
  await page.click('#backBtn');            // back to class
  await page.waitForTimeout(250);
  await page.click('#backBtn');            // back to classes
  await page.waitForTimeout(250);
  await page.click('#toStudent');                 // logs out to the account chooser
  await page.waitForTimeout(3000);
  await page.click('#addStudent');
  await page.waitForTimeout(400);
  await page.fill('#nameInput', 'Anya');
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (!S.onboarded) { S.onboarded = 1; save(); showHome(); } });
  await page.waitForTimeout(300);
  await page.waitForTimeout(400);
  (await page.textContent('#screen-root')).includes('Assignments') ? ok('student home shows assignments card') : fail('no assignments card');
  await page.click('#tdAsgAll');
  await page.waitForTimeout(300);
  await page.fill('#asgInput', asgCode);
  await page.click('#parseAsg');
  await page.waitForTimeout(400);
  (await page.textContent('#screen-root')).includes('Week 3 homework') ? ok('assignment accepted via code') : fail('not accepted');

  // ---- play it: answer all (mix right/wrong) ----
  await page.click('.asgcard');
  await page.waitForTimeout(500);
  for (let i = 0; i < asgInfo.n; i++) {
    const t = await page.evaluate(() => Q.entries[Q.i].item.type);
    if (t === 'mc') {
      const ci = await page.evaluate(() => Q.entries[Q.i].item.ci);
      const pick = i % 3 === 2 ? (ci + 1) % 5 : ci;   // every 3rd wrong
      await page.click(`.choice[data-ci="${pick}"]`);
      await page.waitForTimeout(250);
      if (i % 3 === 2) { await page.click('#retryNo'); await page.waitForTimeout(250); }
    } else {
      await page.evaluate(() => grade(i % 3 === 2 ? false : true, Q.entries[Q.i].item));
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(150);
    await page.click('#nextBtn');
    await page.waitForTimeout(350);
  }
  const report = await page.textContent('#screen-root');
  report.includes('Week 3 homework') && report.includes('MMS1-') ? ok('completion report with result code') : fail('no report: ' + report.slice(0, 100));
  const expectedScore = asgInfo.n - Math.floor(asgInfo.n / 3);
  const gotScore = await page.evaluate(() => { const a = Object.values(S.assignments)[0]; return a.per.filter(Boolean).length; });
  gotScore === expectedScore ? ok('per-problem recording: ' + gotScore + '/' + asgInfo.n) : fail('score ' + gotScore + ' expected ' + expectedScore);
  // cloud submission (student has no cloud configured -> none expected). Configure and re-finish? Instead check code path:
  const subCode = await page.evaluate(() => { const a = Object.values(S.assignments)[0]; return submissionCode(a.id, a.per.map(x => !!x)); });
  const subParsed = await page.evaluate(c => parseSubmissionCode(c), subCode);
  (subParsed && subParsed.name === 'Anya' && subParsed.score === expectedScore) ? ok('submission code roundtrip') : fail('sub parse: ' + JSON.stringify(subParsed));

  // assignment marked done, shows report on reopen
  await page.click('#backAsg');
  await page.waitForTimeout(300);
  (await page.textContent('.asgcard')).includes(expectedScore + '/' + asgInfo.n) ? ok('assignment list shows final score') : fail('list score');

  // ---- back to teacher: paste result code ----
  await page.click('#bottomnav button[data-nav="profile"]');
  await page.waitForTimeout(300);
  await page.click('#teachBtn');                  // logs out to the account chooser
  await page.waitForTimeout(3000);
  await page.click('.logincard[data-uid^="t"]');   // Coach P, password protected
  await page.waitForTimeout(400);
  await page.fill('#loginPwIn', 'coachpass1');
  await page.click('#loginGo');
  await page.waitForTimeout(3200);
  await page.click('.clsrow');
  await page.waitForTimeout(300);
  await page.click('.asgrow');
  await page.waitForTimeout(300);
  await page.fill('#subInput', subCode);
  await page.click('#parseSubs');
  await page.waitForTimeout(400);
  const results = await page.textContent('#screen-root');
  (results.includes('Anya') && results.includes(expectedScore + '/' + asgInfo.n)) ? ok('teacher sees pasted result') : fail('no result row');
  const cells = await page.$$eval('.subcell', els => els.length);
  cells >= asgInfo.n ? ok('per-problem cells rendered: ' + cells) : fail('cells: ' + cells);

  // ---- cloud submissions path ----
  cloudDb['/classes/nsf2026/subs/' + asgInfo.id + '/zara.json'] = { name: 'Zara', score: 11, total: 12, mask: '111111111101', ts: '2026-08-05' };
  await page.click('#pullSubs');
  await page.waitForTimeout(500);
  const results2 = await page.textContent('#screen-root');
  (results2.includes('Zara') && results2.includes('11/12')) ? ok('cloud submission loaded') : fail('cloud sub missing');

  // ---- persistence: reload boots to teacher ----
  await page.reload();
  await page.waitForTimeout(1200);
  (await page.textContent('#screen-root')).includes('Your Classes') ? ok('reload boots into teacher view') : fail('no teacher boot');
  // switch back to student persists too
  await page.click('#toStudent');
  await page.waitForTimeout(3000);
  await page.click('.logincard[data-uid^="u"]');   // Anya, no password
  await page.waitForTimeout(3200);
  (await page.textContent('#screen-root')).includes('Hi, Anya') ? ok('student state intact after account switch') : fail('student lost');

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
