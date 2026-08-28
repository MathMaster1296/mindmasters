/* v21 E2E: Personal Training buttons. Home + arena Train entry points, cross-topic
   personalized pool (unsolved only, deduped, rating-matched), per-topic progress credit,
   quiz progress bar, rating movement, review queue on a miss, results + Train Again,
   quit routing, chess track, replay-all fallback when everything is solved */
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
  await page.goto('file://' + path.resolve('MindMasters_Academy.html'));
  await page.waitForTimeout(1000);

  // ---- boot a fresh student through onboarding ----
  await page.fill('#nameInput', 'Trainee'); await page.click('#startBtn');
  await page.waitForTimeout(500);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(200);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(200);
  }
  await page.click('#obDone');
  await page.waitForTimeout(400);

  // ---- home: Train buttons present, arena cards still navigate ----
  (await page.$('#trainMath')) && (await page.$('#trainChess'))
    ? ok('home shows a Train button on both arena cards') : fail('missing home Train buttons');
  let txt = await page.textContent('#screen-root');
  txt.includes('10 problems picked for you') && txt.includes('10 puzzles picked for you')
    ? ok('train notes on home cards') : fail('train notes missing');
  await page.click('#goMath');
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  (txt.includes('Math Arena') && txt.includes('Personal Training'))
    ? ok('arena card still opens Math Arena, which shows Personal Training') : fail('arena navigation broken: ' + txt.slice(0, 120));
  (await page.$('#trainNow')) ? ok('arena Train button present') : fail('no #trainNow in arena');

  // ---- pool integrity: unsolved only, deduped by uid, entries carry topic + track ----
  const pool = await page.evaluate(() => {
    const p = trainPool('math', false);
    const uids = p.map(e => e.item.uid);
    return {
      n: p.length,
      unsolved: p.every(e => !prog(e.tid).correct[e.gi]),
      deduped: new Set(uids).size === uids.length,
      tagged: p.every(e => e.tid && e.track === 'math')
    };
  });
  pool.n > 1000 ? ok('math pool is large (' + pool.n + ')') : fail('pool too small: ' + pool.n);
  pool.unsolved ? ok('pool holds unsolved problems only') : fail('solved problem in pool');
  pool.deduped ? ok('pool deduplicated by shared problem identity') : fail('duplicate uid in pool');
  pool.tagged ? ok('every pool entry carries its topic and track') : fail('pool entry missing tid/track');

  // ---- personalization: served problem tracks the player rating ----
  const pers = await page.evaluate(() => {
    window.__mr = Math.random; Math.random = () => 0;
    S.mathElo = 1400; S.mathEloGames = 20; save();
    startTrain('math');
    const hi = Q.entries[0].item.er || 1200;
    S.mathElo = 800; S.mathEloGames = 20; save();
    startTrain('math');
    const lo = Q.entries[0].item.er || 1200;
    Math.random = window.__mr;
    return { hi, lo };
  });
  Math.abs(pers.hi - 1400) <= 150 ? ok('1400 player served ~1400 problem (' + pers.hi + ')') : fail('high-rated pick off target: ' + pers.hi);
  Math.abs(pers.lo - 800) <= 150 ? ok('800 player served ~800 problem (' + pers.lo + ')') : fail('low-rated pick off target: ' + pers.lo);
  pers.hi - pers.lo >= 300 ? ok('selection separates ratings (' + pers.lo + ' vs ' + pers.hi + ')') : fail('no rating separation');

  // ---- fresh session from the arena button: header, count, progress bar ----
  await page.evaluate(() => { showTrack('math'); });
  await page.waitForTimeout(300);
  await page.click('#trainNow');
  await page.waitForTimeout(400);
  const sess = await page.evaluate(() => ({
    isTrain: !!Q.isTrain, track: Q.track, target: Q.target,
    count: document.querySelector('.qcount').textContent,
    bar: document.querySelector('.qprogress > div').style.width
  }));
  (sess.isTrain && sess.track === 'math') ? ok('arena Train starts a math training session') : fail('session flags: ' + JSON.stringify(sess));
  sess.target === 10 ? ok('session targets 10 problems') : fail('target: ' + sess.target);
  sess.count === '1/10' ? ok('question count reads 1/10') : fail('count: ' + sess.count);
  sess.bar === '0%' ? ok('progress bar starts at 0%') : fail('bar: ' + sess.bar);
  txt = await page.textContent('#screen-root');
  txt.includes('Math Training') ? ok('session lesson box says Math Training') : fail('no session name');

  // ---- first-try solve: credit under its own topic, every overlapping bank, rating moves ----
  const solve = await page.evaluate(() => {
    const en = Q.entries[Q.i];
    const before = { elo: S.mathElo, games: S.mathEloGames || 0, xp: S.xp };
    grade(true, en.item);
    const banks = (en.item.uid && UID_INDEX[en.item.uid]) || [[en.tid, en.gi]];
    return {
      credited: !!prog(en.tid).correct[en.gi],
      allBanks: banks.every(([t, g]) => !!prog(t).correct[g]),
      multiBank: banks.length,
      dElo: S.mathElo - before.elo, dGames: (S.mathEloGames || 0) - before.games,
      dXp: S.xp - before.xp
    };
  });
  solve.credited ? ok('solve recorded under the problem\'s own topic') : fail('topic progress not recorded');
  solve.allBanks ? ok('solve credited to all ' + solve.multiBank + ' bank(s) holding the problem') : fail('cross-bank credit missing');
  (solve.dElo > 0 && solve.dGames === 1) ? ok('math rating moved up (+' + solve.dElo + ') and counted a game') : fail('rating: ' + JSON.stringify(solve));
  solve.dXp > 0 ? ok('XP awarded (+' + solve.dXp + ')') : fail('no XP');
  await page.evaluate(() => nextQuestion());
  await page.waitForTimeout(300);
  const step = await page.evaluate(() => ({
    count: document.querySelector('.qcount').textContent,
    bar: document.querySelector('.qprogress > div').style.width
  }));
  step.count === '2/10' ? ok('advanced to 2/10') : fail('count after next: ' + step.count);
  step.bar === '10%' ? ok('progress bar advanced to 10%') : fail('bar after next: ' + step.bar);

  // ---- miss: no rating gain, problem queued for Smart Review under its own topic ----
  const miss = await page.evaluate(() => {
    const en = Q.entries[Q.i];
    const eloB = S.mathElo;
    grade(false, en.item);
    const r = en.item.uid && S.reviewQueue && S.reviewQueue[en.item.uid];
    return { dElo: S.mathElo - eloB, queued: !!r, qTid: r && r.t === en.tid, gaveUpText: document.getElementById('feedback').textContent };
  });
  miss.dElo <= 0 ? ok('miss did not raise the rating (' + miss.dElo + ')') : fail('miss raised rating');
  (miss.queued && miss.qTid) ? ok('missed problem queued for review under its topic') : fail('review queue: ' + JSON.stringify(miss));
  miss.gaveUpText.includes('Smart Review') ? ok('feedback promises Smart Review return') : fail('no review note in feedback');

  // ---- finish the session: results screen, Train Again, Done routing ----
  await page.evaluate(() => nextQuestion());
  await page.waitForTimeout(200);
  for (let i = 2; i < 10; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(120);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(120);
  }
  txt = await page.textContent('#screen-root');
  (txt.includes('Math Training') && txt.includes('rating change'))
    ? ok('results screen shows Math Training with rating change') : fail('results screen wrong: ' + txt.slice(0, 160));
  txt.includes('9 / 10 correct') ? ok('results score 9 / 10 after one miss') : fail('score line wrong');
  (await page.$('#retryBtn')) ? ok('Train Again offered') : fail('no Train Again');
  await page.click('#retryBtn');
  await page.waitForTimeout(400);
  const again = await page.evaluate(() => ({ isTrain: !!Q.isTrain, i: Q.i, count: document.querySelector('.qcount').textContent }));
  (again.isTrain && again.count === '1/10') ? ok('Train Again starts a fresh session at 1/10') : fail('retrain: ' + JSON.stringify(again));

  // ---- solved problems never reappear in later training pools ----
  const noRepeat = await page.evaluate(() => {
    const solved = new Set();
    MATH_TOPICS.forEach(t => { const p = prog(t.id); t.problems.forEach((it, gi) => { if (p.correct[gi]) solved.add(it.uid); }); });
    return { solvedN: solved.size, clean: trainPool('math', false).every(e => !solved.has(e.item.uid)) };
  });
  (noRepeat.solvedN >= 9 && noRepeat.clean) ? ok('later pools exclude all ' + noRepeat.solvedN + ' solved problems') : fail('repeat leak: ' + JSON.stringify(noRepeat));

  // ---- quit at question 1 returns to the arena ----
  await page.click('#quitBtn');
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  (txt.includes('Math Arena') && txt.includes('Personal Training')) ? ok('quit returns to the Math Arena') : fail('quit routing: ' + txt.slice(0, 120));

  // ---- chess training from the home card ----
  await page.evaluate(() => showHome());
  await page.waitForTimeout(300);
  await page.click('#trainChess');
  await page.waitForTimeout(500);
  const ch = await page.evaluate(() => ({
    isTrain: !!Q.isTrain, track: Q.track, type: Q.entries[0].item.type,
    rendered: !!(document.getElementById('board') || document.querySelector('.choice')),
    count: document.querySelector('.qcount').textContent
  }));
  (ch.isTrain && ch.track === 'chess' && ch.count === '1/10') ? ok('home Train starts a chess session at 1/10') : fail('chess session: ' + JSON.stringify(ch));
  ch.rendered ? ok('chess question rendered (' + ch.type + ')') : fail('chess question did not render');
  const chSolve = await page.evaluate(() => {
    const en = Q.entries[Q.i];
    const b = { c: S.chessCorrect, g: S.chessEloGames || 0 };
    grade(true, en.item);
    return { credited: !!prog(en.tid).correct[en.gi], dc: S.chessCorrect - b.c, dg: (S.chessEloGames || 0) - b.g };
  });
  (chSolve.credited && chSolve.dc === 1 && chSolve.dg === 1) ? ok('chess solve credited to topic, tally and rating games') : fail('chess solve: ' + JSON.stringify(chSolve));
  await page.evaluate(() => nextQuestion());
  await page.waitForTimeout(300);

  // ---- replay-all fallback: with every math problem solved, Train still serves a session ----
  const replay = await page.evaluate(() => {
    MATH_TOPICS.forEach(t => { const p = prog(t.id); t.problems.forEach((it, gi) => { p.correct[gi] = true; p.attempted[gi] = true; }); });
    save();
    startTrain('math');
    return { replayAll: !!Q.replayAll, target: Q.target, isTrain: !!Q.isTrain };
  });
  (replay.isTrain && replay.replayAll && replay.target === 10)
    ? ok('all-solved fallback replays 10 problems') : fail('replay fallback: ' + JSON.stringify(replay));
  txt = await page.textContent('#screen-root');
  txt.includes('reduced XP bonus') ? ok('replay session shows reduced-XP note') : fail('no replay note');

  errors.length === 0 ? ok('zero console errors') : fail('console errors: ' + errors.join(' | '));
  await browser.close();
  console.log(process.exitCode ? 'SUITE FAILED' : 'ALL v21 CHECKS PASSED');
})();
