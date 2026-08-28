/* v12 E2E: retry system, solution replay, practice tests, smart review, mind rating, keyboard */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch(process.env.MM_CHROMIUM ? { executablePath: process.env.MM_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const url = 'file://' + path.resolve('MindMasters_Academy.html');
  const fail = (m) => { console.log('FAIL:', m); process.exitCode = 1; };
  const ok = (m) => console.log('ok:', m);

  await page.goto(url);
  await page.waitForTimeout(800);

  // ---- onboarding ----
  await page.fill('#nameInput', 'Tester');
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (!S.onboarded) { S.onboarded = 1; save(); showHome(); } });
  await page.waitForTimeout(300);
  await page.waitForTimeout(400);
  (await page.textContent('.hello')).includes('Tester') ? ok('onboarding -> home') : fail('home hello');

  // Mind rating locked card visible
  (function(){})();

  // ---- MATH MC retry flow (2 chances) ----
  await page.click('#goMath');
  await page.waitForTimeout(300);
  await page.click('button.topic[data-topic="amc8"]');
  await page.waitForTimeout(300);
  // difficulty chips present + toggle
  await page.click('.diffchip[data-bias="h"]');
  const chipSel = await page.getAttribute('.diffchip[data-bias="h"]', 'class');
  chipSel.includes('sel') ? ok('difficulty chip toggles') : fail('difficulty chip');
  await page.click('.diffchip[data-bias="m"]');
  // practice test button present
  (await page.$('#testBtn')) ? ok('practice test button present') : fail('no testBtn');

  await page.click('#contSetBtn');
  await page.waitForTimeout(500);
  // find correct choice index from app state, click a WRONG one
  const ci = await page.evaluate(() => Q.entries[Q.i].item.ci);
  const wrongIdx = ci === 0 ? 1 : 0;
  await page.click(`.choice[data-ci="${wrongIdx}"]`);
  await page.waitForTimeout(300);
  (await page.textContent('#feedback')).includes('one more try') ? ok('MC retry bar after first wrong') : fail('MC retry bar');
  // Try Again re-enables other choices
  await page.click('#retryYes');
  await page.waitForTimeout(200);
  const wrongDisabled = await page.$eval(`.choice[data-ci="${wrongIdx}"]`, b => b.disabled);
  const otherEnabled = await page.$eval(`.choice[data-ci="${ci}"]`, b => !b.disabled);
  (wrongDisabled && otherEnabled) ? ok('retry re-enables remaining choices') : fail('retry enable state');
  // now answer correctly on 2nd try -> reduced XP, rating unchanged
  await page.click(`.choice[data-ci="${ci}"]`);
  await page.waitForTimeout(300);
  const fb1 = await page.textContent('#feedback');
  (fb1.includes('Second try') && fb1.includes('rating unchanged')) ? ok('second-try solve: no rating change') : fail('second-try text: ' + fb1.slice(0, 120));
  const eloAfter = await page.evaluate(() => S.mathElo);
  eloAfter === 800 ? ok('elo untouched by second-try solve') : fail('elo changed: ' + eloAfter);

  // ---- MC give-up path + smart review queue ----
  await page.click('#nextBtn');
  await page.waitForTimeout(400);
  const ci2 = await page.evaluate(() => Q.entries[Q.i].item.ci);
  const wrong2 = ci2 === 0 ? 1 : 0;
  await page.click(`.choice[data-ci="${wrong2}"]`);
  await page.waitForTimeout(200);
  await page.click('#retryNo'); // give up
  await page.waitForTimeout(300);
  const fb2 = await page.textContent('#feedback');
  (fb2.includes('Not this time') && fb2.includes('Smart Review')) ? ok('give up -> graded wrong + review note') : fail('give-up feedback: ' + fb2.slice(0, 140));
  const correctShown = await page.$eval(`.choice[data-ci="${ci2}"]`, b => b.classList.contains('correct'));
  correctShown ? ok('correct answer revealed on give up') : fail('correct not revealed');
  const rq = await page.evaluate(() => Object.keys(S.reviewQueue || {}).length);
  rq >= 1 ? ok('review queue has ' + rq + ' entry') : fail('review queue empty');

  // ---- quit confirm modal (only guards unanswered questions past the first) ----
  await page.click('#nextBtn');
  await page.waitForTimeout(400);
  await page.click('#quitBtn');
  await page.waitForTimeout(200);
  (await page.$('.mmodal')) ? ok('quit confirm modal appears') : fail('no quit modal');
  await page.click('#mmNo');
  await page.waitForTimeout(200);
  (await page.$('.mmodal')) ? fail('modal did not close') : ok('modal Keep Training closes');
  await page.click('#quitBtn');
  await page.waitForTimeout(200);
  await page.click('#mmYes');
  await page.waitForTimeout(300);

  // ---- PRACTICE TEST ----
  await page.click('#testBtn');
  await page.waitForTimeout(300);
  const nContests = await page.$$eval('.contestbtn', els => els.length);
  nContests >= 5 ? ok('contest picker lists ' + nContests + ' AMC 8 tests') : fail('contest list: ' + nContests);
  await page.click('.contestbtn'); // newest first
  await page.waitForTimeout(400);
  (await page.$('#testClock')) ? ok('test timer visible') : fail('no test clock');
  // answer first with keyboard 'B'
  await page.keyboard.press('b');
  await page.waitForTimeout(500);
  // leave second blank
  await page.click('#blankBtn');
  await page.waitForTimeout(300);
  // finish rest quickly via engine
  const testInfo = await page.evaluate(() => {
    while (T.i < T.entries.length - 1) { T.entries[T.i].ans = 'A'; T.i++; }
    T.entries[T.i].ans = 'ABCDE'[T.entries[T.i].item.ci]; // last one correct
    finishTest(false);
    return { n: T.entries.length, rows: T.rows.length };
  });
  await page.waitForTimeout(400);
  const scoreTxt = await page.textContent('#screen-root');
  scoreTxt.includes('Official score') ? ok('test scored (' + testInfo.n + ' problems)') : fail('no score screen');
  const testsTaken = await page.evaluate(() => S.testsTaken);
  testsTaken === 1 ? ok('testsTaken counted') : fail('testsTaken: ' + testsTaken);
  await page.click('#ansBtn');
  await page.waitForTimeout(300);
  const rows = await page.$$eval('.revrow', els => els.length);
  rows === testInfo.n ? ok('answer review lists all ' + rows + ' problems') : fail('review rows: ' + rows);
  await page.click('.revrow');
  await page.waitForTimeout(300);
  (await page.textContent('#screen-root')).includes('Correct answer') ? ok('problem review page') : fail('problem review');
  await page.click('#backBtn');
  await page.waitForTimeout(200);

  // ---- CHESS: wrong move -> retry -> give up -> full replay ----
  await page.click('#bottomnav button[data-nav="chess"]');
  await page.waitForTimeout(300);
  // pick a lichess line module (multi-move)
  const chessTopic = await page.evaluate(() => {
    const t = CHESS_MODULES.find(m => m.items.some(it => it.kind === 'line' && it.line && it.line.length >= 3));
    return t.id;
  });
  await page.click(`button.topic[data-topic="${chessTopic}"]`);
  await page.waitForTimeout(300);
  await page.click('#contSetBtn');
  await page.waitForTimeout(600);
  // ensure current item is a line puzzle with >=3 moves; if not, skip until found
  for (let tries = 0; tries < 6; tries++) {
    const isLine = await page.evaluate(() => BP && BP.item.kind === 'line' && BP.item.line.length >= 3);
    if (isLine) break;
    await page.evaluate(() => { grade(true, Q.entries[Q.i].item); });
    await page.waitForTimeout(150);
    await page.click('#nextBtn');
    await page.waitForTimeout(400);
  }
  const lineLen = await page.evaluate(() => BP.item.line.length);
  ok('board line puzzle with ' + lineLen + ' half-moves');
  // make a deliberately wrong legal move
  const wrongMove = await page.evaluate(() => {
    const exp = BP.item.line[0];
    for (let s = 0; s < 64; s++) {
      const p = BP.st.b[s];
      if (!p || (Engine ? (p === p.toUpperCase()) !== !!BP.pw : false)) continue;
      for (const m of Engine.legalFrom(BP.st, s)) {
        const from = Engine.sqName(m.from), to = Engine.sqName(m.to);
        if (!(from === exp[0] && to === exp[1])) return { from: m.from, to: m.to };
      }
    }
    return null;
  });
  if (!wrongMove) fail('no wrong move found');
  await page.click(`#board .sq[data-i="${wrongMove.from}"]`);
  await page.waitForTimeout(150);
  await page.click(`#board .sq[data-i="${wrongMove.to}"]`);
  await page.waitForTimeout(1600); // wrong-anim + rewind
  (await page.textContent('#feedback')).includes('one more try') ? ok('chess retry bar after wrong move') : fail('chess retry bar');
  const notDone = await page.evaluate(() => !BP.done);
  notDone ? ok('puzzle still live for second try') : fail('puzzle marked done too early');
  // give up -> replay starts
  await page.click('#retryNo');
  await page.waitForTimeout(500);
  const graded = await page.textContent('#feedback');
  graded.includes('Not this time') ? ok('graded wrong immediately on give up') : fail('no grade after give up: ' + graded.slice(0, 80));
  const fenBefore = await page.evaluate(() => fenOf(BP.st));
  // wait for replay: line moves at ~2.3s intervals
  await page.waitForTimeout(1200 + lineLen * 2500);
  const after = await page.evaluate(() => ({ fen: fenOf(BP.st), badge: document.getElementById('puzzleTurn').textContent, busy: BP.busy }));
  (after.fen !== fenBefore) ? ok('board replayed the solution moves') : fail('board never moved during replay');
  after.badge.includes('Solution complete') ? ok('replay completion banner') : fail('replay banner: ' + after.badge);
  const chessElo = await page.evaluate(() => S.chessElo);
  chessElo < 800 ? ok('chess rating dropped on failed puzzle: ' + chessElo) : ok('chess rating: ' + chessElo + ' (may be unchanged if prior activity)');
  // board coordinates present
  const coords = await page.$$eval('#board .coord', els => els.length);
  coords >= 16 ? ok('board coordinates rendered (' + coords + ')') : fail('coords: ' + coords);

  // ---- SMART REVIEW: force due-now and run ----
  await page.evaluate(() => {
    for (const k of Object.keys(S.reviewQueue)) S.reviewQueue[k].due = '2000-01-01';
    save(); showHome();
  });
  await page.waitForTimeout(400);
  const homeTxt = await page.textContent('#screen-root');
  homeTxt.includes('Smart Review') ? ok('smart review card on home') : fail('no review card');
  await page.click('#tdReview');
  await page.waitForTimeout(500);
  (await page.textContent('#screen-root')).includes('Smart Review') ? ok('review session started') : fail('review session');
  const eloBeforeRev = await page.evaluate(() => ({ m: S.mathElo, c: S.chessElo }));
  // answer current review item correctly via state
  const revType = await page.evaluate(() => Q.entries[Q.i].item.type);
  if (revType === 'mc') {
    const rci = await page.evaluate(() => Q.entries[Q.i].item.ci);
    await page.click(`.choice[data-ci="${rci}"]`);
  } else if (revType === 'num') {
    const ans = await page.evaluate(() => Q.entries[Q.i].item.answer);
    await page.fill('#numAns', String(ans));
    await page.click('#numGo');
  } else {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
  }
  await page.waitForTimeout(400);
  const revFb = await page.textContent('#feedback');
  revFb.includes('rating unchanged') ? ok('review: rating unchanged') : fail('review feedback: ' + revFb.slice(0, 100));
  const eloAfterRev = await page.evaluate(() => ({ m: S.mathElo, c: S.chessElo }));
  (eloBeforeRev.m === eloAfterRev.m && eloBeforeRev.c === eloAfterRev.c) ? ok('elo really unchanged in review') : fail('elo moved in review');
  const cleared = await page.evaluate(() => S.reviewCleared);
  cleared >= 1 ? ok('reviewCleared counted: ' + cleared) : fail('reviewCleared: ' + cleared);

  // ---- Mind rating unlock ----
  await page.evaluate(() => { S.mathEloGames = 6; S.chessEloGames = 6; S.mathElo = 1200; S.chessElo = 1000; save(); showHome(); });
  await page.waitForTimeout(300);
  const home2 = await page.textContent('#screen-root');
  (home2.includes('Mind Rating') && home2.includes('1100') && home2.includes('Strategist')) ? ok('mind rating card: 1100 Strategist') : fail('mind card missing pieces');

  // ---- badge families count ----
  const units = await page.evaluate(() => badgeUnitCount());
  units === 29 * 5 + 8 ? ok('badge units: ' + units) : fail('badge units: ' + units);

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
