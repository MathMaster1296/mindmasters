/* v18 E2E: coins economy, expanded badges with next-milestone cards, stats sections, avatar studio */
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
  await page.fill('#nameInput', 'Tester'); await page.click('#startBtn');
  await page.waitForTimeout(300);
  await page.evaluate(() => { if (!S.onboarded) { S.onboarded = 1; save(); showHome(); } });
  await page.waitForTimeout(300);
  await page.waitForTimeout(400);

  // ---- coin awards ----
  const c0 = await page.evaluate(() => S.coins);
  await page.evaluate(() => {
    Q = { topicId: 'amc8', entries: [{ item: topicItems('amc8')[0], gi: 0 }], i: 0, target: 1,
      correctThisRun: 0, xpThisRun: 0, eloStart: 800, lesson: '', name: 't', icon: '', track: 'math', isDaily: false };
    renderQuestion(false);
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => grade(true, Q.entries[0].item));
  await page.waitForTimeout(600);
  const c1 = await page.evaluate(() => S.coins);
  c1 > c0 ? ok('coins earned on correct answer (+' + (c1 - c0) + ', includes badge payouts)') : fail('no coins: ' + c0 + '->' + c1);
  const chip = await page.textContent('#chipCoins');
  parseInt(chip) === c1 ? ok('topbar coin chip live: ' + chip) : fail('chip ' + chip + ' vs ' + c1);
  // level-up coins
  const before = await page.evaluate(() => S.coins);
  await page.evaluate(() => awardXP(200));
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => S.coins);
  after >= before + 30 ? ok('level up pays 30 coins') : fail('level coins: ' + before + '->' + after);

  // ---- badges page: sections + next milestone only ----
  await page.click('#bottomnav button[data-nav="badges"]');
  await page.waitForTimeout(400);
  const txt = await page.textContent('#screen-root');
  ['Solving', 'Ratings', 'Dedication', 'Competition', 'Classroom', 'Treasure', 'Special'].every(x => txt.includes(x))
    ? ok('badge sections present') : fail('sections missing');
  txt.includes('50 / 250 / 1000') ? fail('old milestone list still shown') : ok('milestone lists removed');
  (await page.$$eval('.bnext', els => els.length)) > 20 ? ok('next-tier lines shown') : fail('no bnext lines');
  const units = await page.evaluate(() => badgeUnitCount());
  units === 153 ? ok('badge units now 153') : fail('units: ' + units);
  const famN = await page.evaluate(() => FAMILIES.length);
  famN === 29 ? ok('29 badge families') : fail('families: ' + famN);

  // new family metrics react
  await page.evaluate(() => { S.asgDone = 5; S.testAce = 3; S.goalDays = 10; S.hardSolved = 12; save(); checkBadges(); });
  await page.waitForTimeout(1200);
  const earned = await page.evaluate(() => Object.keys(S.badges).filter(k => /^(asg|ace|goal|scalp)_/.test(k)).length);
  earned >= 6 ? ok('new families award tiers: ' + earned) : fail('new tiers: ' + earned);

  // ---- profile stats sections ----
  await page.click('#bottomnav button[data-nav="profile"]');
  await page.waitForTimeout(400);
  const ptxt = await page.textContent('#screen-root');
  ['Ratings', 'Solving', 'Dedication', 'Competition', 'Classroom', 'Hardest Solve', 'Days Active', 'Giant Slays'].every(x => ptxt.includes(x))
    ? ok('profile stat sections present') : fail('profile sections missing');

  // ---- avatar studio ----
  await page.click('#studioBtn');
  await page.waitForTimeout(500);
  const stxt = await page.textContent('#screen-root');
  (stxt.includes('Characters') && stxt.includes('Accessories')) ? ok('studio opens with character tabs') : fail('no studio');
  await page.click('.diffchip[data-stab="classic"]');
  await page.waitForTimeout(400);
  const ctxt = await page.textContent('#screen-root');
  (ctxt.includes('Classic Avatars') && ctxt.includes('Frames')) ? ok('classic tab present') : fail('no classic tab');
  // free avatar equip
  await page.click('.shopitem[data-av="🦊"]');
  await page.waitForTimeout(300);
  (await page.evaluate(() => S.avatar)) === '🦊' ? ok('free avatar equips') : fail('equip failed');
  // buying without coins fails politely
  await page.evaluate(() => { S.coins = 10; save(); STU.tab = 'classic'; showStudio(); });
  await page.waitForTimeout(300);
  await page.click('.shopitem[data-av="🐉"]');
  await page.waitForTimeout(300);
  (await page.evaluate(() => S.owned.av.includes('🐉'))) ? fail('bought without coins') : ok('insufficient coins blocked');
  // buy with coins
  await page.evaluate(() => { S.coins = 2000; save(); STU.tab = 'classic'; showStudio(); });
  await page.waitForTimeout(300);
  await page.click('.shopitem[data-av="🐉"]');
  await page.waitForTimeout(250);
  await page.click('#mmYes');
  await page.waitForTimeout(400);
  const bought = await page.evaluate(() => ({ av: S.avatar, owned: S.owned.av.includes('🐉'), coins: S.coins }));
  (bought.owned && bought.av === '🐉' && bought.coins === 1000) ? ok('avatar purchased and equipped, coins deducted') : fail('buy: ' + JSON.stringify(bought));
  // buy + equip a frame
  await page.click('.shopitem[data-fr="gold"]');
  await page.waitForTimeout(250);
  await page.click('#mmYes');
  await page.waitForTimeout(400);
  const fr = await page.evaluate(() => ({ f: S.frame, coins: S.coins }));
  (fr.f === 'gold' && fr.coins === 100) ? ok('frame purchased: gold, coins now ' + fr.coins) : fail('frame: ' + JSON.stringify(fr));
  // frame renders on home hero
  await page.click('#bottomnav button[data-nav="home"]');
  await page.waitForTimeout(400);
  const heroCls = await page.getAttribute('#heroAv', 'class');
  heroCls.includes('fr-gold') ? ok('frame renders on home avatar') : fail('hero class: ' + heroCls);

  // persistence
  await page.reload();
  await page.waitForTimeout(1300);
  const persisted = await page.evaluate(() => ({ av: S.avatar, f: S.frame, coins: S.coins, owned: S.owned.av.length }));
  (persisted.av === '🐉' && persisted.f === 'gold') ? ok('purchases persist after reload') : fail('persist: ' + JSON.stringify(persisted));

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
