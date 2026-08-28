/* v12 supplement: letter-key recording, num retry, mate1 replay, AMC10 scoring, daily retry */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const ok = m => console.log('ok:', m);
  const fail = m => { console.log('FAIL:', m); process.exitCode = 1; };
  await page.goto('file://' + path.resolve('MindMasters_Academy.html'));
  await page.waitForTimeout(800);
  await page.fill('#nameInput', 'T2'); await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (!S.onboarded) { S.onboarded = 1; save(); showHome(); } });
  await page.waitForTimeout(300);
  await page.waitForTimeout(300);

  // ---- AMC 10 practice test: letter keys + official scoring ----
  await page.click('#goMath'); await page.waitForTimeout(250);
  await page.click('button.topic[data-topic="amc10"]'); await page.waitForTimeout(250);
  await page.click('#testBtn'); await page.waitForTimeout(250);
  await page.click('.contestbtn'); await page.waitForTimeout(400);
  await page.keyboard.press('c'); await page.waitForTimeout(500);
  const rec = await page.evaluate(() => T.entries[0].ans);
  rec === 'C' ? ok('letter key C recorded in test') : fail('key record: ' + rec);
  const scoring = await page.evaluate(() => {
    // 10 correct, 5 blank, rest wrong
    T.entries.forEach((e, k) => {
      if (k < 10) e.ans = 'ABCDE'[e.item.ci];
      else if (k < 15) e.ans = null;
      else e.ans = 'ABCDE'[(e.item.ci + 1) % 5];
    });
    T.i = T.entries.length - 1;
    finishTest(false);
    return { n: T.entries.length, best: S.testBest[T.contest.name] };
  });
  await page.waitForTimeout(300);
  const expected = 6 * 10 + 1.5 * 5;
  scoring.best.v === expected ? ok('AMC10 official scoring: ' + scoring.best.s) : fail('scoring: ' + JSON.stringify(scoring.best));

  // ---- num-type retry (AIME) ----
  await page.evaluate(() => { showSets('aime'); });
  await page.waitForTimeout(250);
  await page.click('#contSetBtn'); await page.waitForTimeout(400);
  const isNum = await page.evaluate(() => Q.entries[Q.i].item.type);
  if (isNum !== 'num') fail('aime item not num: ' + isNum);
  await page.fill('#numAns', '12345');
  await page.click('#numGo'); await page.waitForTimeout(250);
  (await page.textContent('#feedback')).includes('one more try') ? ok('num retry bar') : fail('num retry bar');
  // Enter triggers Try Again (wait past the 350ms anti-double-fire debounce)
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  const enabled = await page.$eval('#numAns', i => !i.disabled);
  enabled ? ok('Enter = Try Again re-enables input') : fail('input still disabled');
  const ans = await page.evaluate(() => Q.entries[Q.i].item.answer);
  await page.fill('#numAns', String(ans));
  await page.click('#numGo'); await page.waitForTimeout(250);
  (await page.textContent('#feedback')).includes('Second try') ? ok('num second-try solve') : fail('num second try');

  // ---- mate1 give-up replay ----
  const mateTopic = await page.evaluate(() => {
    const t = CHESS_MODULES.find(m => m.items.some(it => it.kind === 'mate1'));
    return t && t.id;
  });
  await page.evaluate(tid => {
    // craft a session on a mate1 item directly
    const items = topicItems(tid);
    let gi = items.findIndex(it => it.kind === 'mate1');
    Q = { topicId: tid, entries: [{ item: items[gi], gi }], i: 0, target: 1, correctThisRun: 0, xpThisRun: 0,
      eloStart: eloOf('chess'), lesson: '', name: 'test', icon: '♟️', track: 'chess', isDaily: false };
    renderQuestion(false);
  }, mateTopic);
  await page.waitForTimeout(400);
  const wrongMv = await page.evaluate(() => {
    for (let s = 0; s < 64; s++) {
      const p = BP.st.b[s];
      if (!p || (p === p.toUpperCase()) !== !!BP.pw) continue;
      for (const m of Engine.legalFrom(BP.st, s)) {
        if (Engine.status(Engine.make(BP.st, m, 'Q')) !== 'checkmate') return { from: m.from, to: m.to };
      }
    }
    return null;
  });
  await page.click(`#board .sq[data-i="${wrongMv.from}"]`); await page.waitForTimeout(120);
  await page.click(`#board .sq[data-i="${wrongMv.to}"]`); await page.waitForTimeout(1500);
  (await page.textContent('#feedback')).includes('one more try') ? ok('mate1 retry bar') : fail('mate1 retry bar');
  await page.click('#retryNo'); await page.waitForTimeout(3800);
  const mateDone = await page.evaluate(() => ({ status: Engine.status(BP.st), badge: document.getElementById('puzzleTurn').textContent }));
  mateDone.status === 'checkmate' ? ok('mate1 replay ends in checkmate on board') : fail('mate1 replay status: ' + mateDone.status);

  // ---- daily challenge retry works ----
  await page.evaluate(() => showHome());
  await page.waitForTimeout(300);
  const hasDaily = await page.$('#tdDaily');
  if (hasDaily) {
    await page.click('#tdDaily'); await page.waitForTimeout(400);
    const t = await page.evaluate(() => Q.entries[0].item.type);
    if (t === 'mc') {
      const ci = await page.evaluate(() => Q.entries[0].item.ci);
      await page.click(`.choice[data-ci="${(ci + 1) % (await page.$$eval('.choice', e => e.length))}"]`);
      await page.waitForTimeout(250);
      (await page.textContent('#feedback')).includes('one more try') ? ok('daily retry bar') : fail('daily retry');
      await page.click(`#retryYes`); await page.waitForTimeout(150);
      await page.click(`.choice[data-ci="${ci}"]`); await page.waitForTimeout(300);
      (await page.textContent('#feedback')).includes('Second try') ? ok('daily second-try solve') : fail('daily 2nd try');
    } else { ok('daily item is ' + t + ', mc retry covered elsewhere'); }
  } else ok('daily already done, skip');

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
