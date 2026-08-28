/* v20 E2E: onboarding quest, Today card + chest, streak freeze/repair, comeback,
   seasons + Champion Aura, friend challenges, flow governor, lucky problems,
   test personal bests, daily studio deal, teacher assignment refresh */
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

  // ---- onboarding: brand-new student enters the Welcome Quest ----
  await page.fill('#nameInput', 'Nova'); await page.click('#startBtn');
  await page.waitForTimeout(500);
  let txt = await page.textContent('#screen-root');
  txt.includes('Welcome Quest') ? ok('welcome quest starts for new students') : fail('no welcome quest: ' + txt.slice(0, 120));
  const obTarget = await page.evaluate(() => Q && Q.isOnboard && Q.entries.length);
  obTarget === 3 ? ok('quest is three problems') : fail('quest length: ' + obTarget);
  const cOb = await page.evaluate(() => S.coins);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(250);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(250);
  }
  txt = await page.textContent('#screen-root');
  txt.includes('Welcome aboard') ? ok('onboarding completion screen') : fail('no completion screen');
  const obState = await page.evaluate(() => ({ ob: S.onboarded, coins: S.coins }));
  (obState.ob === 1 && obState.coins >= cOb + 50) ? ok('onboarded flag set, +50 coin gift') : fail('ob state: ' + JSON.stringify(obState));
  await page.click('#obDone');
  await page.waitForTimeout(400);

  // ---- Today card ----
  txt = await page.textContent('#screen-root');
  ['Today', 'Daily Challenge', 'Solve 10 problems', 'Season', 'Assignments'].every(x => txt.includes(x))
    ? ok('Today card with checklist, season line and assignments link') : fail('today card incomplete');
  (txt.includes('✂') && txt.includes('♞')) ? ok('power-up inventory visible on Today card') : fail('no power-up inventory');
  txt.includes('unlock today') ? ok('chest locked at start') : fail('chest state wrong');
  (await page.$('#tdDaily')) ? ok('daily row clickable') : fail('no tdDaily');

  // ---- chest: complete requirements, open, guard reopen ----
  await page.evaluate(() => {
    const t = todayStr();
    S.dailyDoneOn = t; S.todayDate = t; S.todayCount = 10;
    S.revToday = { d: t, n: 2 };
    save(); showHome();
  });
  await page.waitForTimeout(400);
  (await page.$('.chestrow.ready')) ? ok('chest ready when checklist complete') : fail('chest not ready');
  const cPre = await page.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.9; return S.coins; });
  await page.click('#tdChest');
  await page.waitForTimeout(1400);
  const anim = await page.evaluate(() => {
    Math.random = window.__mr;
    const ov = document.getElementById('chestOv');
    return { there: !!ov, open: ov && ov.classList.contains('open'),
      amount: ov ? ov.querySelector('.chamount').textContent : '',
      lines: ov ? ov.querySelectorAll('.chline').length : 0,
      lid: ov ? getComputedStyle(ov.querySelector('.clid')).transform !== 'none' : false };
  });
  (anim.there && anim.open && anim.lid) ? ok('chest ceremony plays: overlay, lid swings open') : fail('anim: ' + JSON.stringify(anim));
  const chest = await page.evaluate(() => ({ coins: S.coins, on: S.chestOpenOn === todayStr() }));
  // forced roll 0.9 = coin loot: 10 + floor(0.9*21) = 28, plus the +5 review bonus line
  (chest.on && chest.coins >= cPre + 33) ? ok('mystery roll landed coins: +' + (chest.coins - cPre)) : fail('chest: ' + JSON.stringify(chest) + ' pre=' + cPre);
  (anim.lines === 2 && anim.amount.includes('+28 coins') && anim.amount.includes('+5 bonus'))
    ? ok('ceremony reveals the loot: +28 coins and +5 bonus line') : fail('loot lines: ' + anim.lines + ' | ' + anim.amount);
  await page.click('#chestOv');
  await page.waitForTimeout(500);
  (await page.$('#chestOv')) ? fail('overlay did not dismiss') : ok('tap collects and dismisses the ceremony');
  (await page.$('.chestrow.opened')) ? ok('chest shows opened state') : fail('no opened state');

  // ---- the loot table: every branch, forced deterministically ----
  const lootChk = await page.evaluate(() => {
    const mr = Math.random;
    const out = {};
    const it = itemsOf();
    Math.random = () => 0.20; const f0 = it.fifty; applyLoot(rollChest(10)); out.fifty = it.fifty === f0 + 1;
    Math.random = () => 0.35; const h0 = it.hintP; applyLoot(rollChest(40)); out.hintDouble = it.hintP === h0 + 2;
    Math.random = () => 0.10; S.freezes = 0; applyLoot(rollChest(10)); out.freeze = S.freezes === 1;
    Math.random = () => 0.04; const a0 = S.accOwned.length; const line = applyLoot(rollChest(10)); out.acc = S.accOwned.length === a0 + 1 && /unlocked/.test(line.label);
    Math.random = () => 0.01; const c0 = S.coins; applyLoot(rollChest(10)); out.jackpot = S.coins === c0 + 110;
    Math.random = mr; save();
    return out;
  });
  Object.values(lootChk).every(Boolean) ? ok('loot table drops power-ups, freezes, cosmetics, and jackpots: ' + JSON.stringify(lootChk)) : fail('loot: ' + JSON.stringify(lootChk));

  // ---- fifty-fifty hint on a multiple choice question ----
  await page.evaluate(() => {
    itemsOf().fifty = 1; save();
    const items = topicItems('amc8');
    const gi = items.findIndex(p => p.type === 'mc' && p.choices && p.choices.length === 5);
    Q = { topicId: 'amc8', entries: [{ item: items[gi], gi }], i: 0, target: 1, correctThisRun: 0, xpThisRun: 0,
      eloStart: 800, lesson: '', name: 'HintProbe', icon: '', track: 'math', isDaily: false };
    renderQuestion(false);
  });
  await page.waitForTimeout(400);
  (await page.$('#fiftyBtn')) ? ok('fifty-fifty button offered on multiple choice') : fail('no fifty button');
  await page.click('#fiftyBtn');
  await page.waitForTimeout(300);
  const ff = await page.evaluate(() => {
    const item = Q.entries[0].item;
    const xout = Array.from(document.querySelectorAll('.choice.xout')).map(b => +b.dataset.ci);
    return { n: xout.length, correctSafe: !xout.includes(item.ci),
      correctEnabled: !document.querySelectorAll('.choice')[item.ci].disabled,
      left: itemsOf().fifty, btnGone: !document.getElementById('fiftyBtn') };
  });
  (ff.n === 2 && ff.correctSafe && ff.correctEnabled && ff.left === 0 && ff.btnGone)
    ? ok('fifty-fifty crossed out two wrong choices, consumed one use') : fail('fifty: ' + JSON.stringify(ff));

  // ---- piece hint on a chess puzzle ----
  await page.evaluate(() => {
    itemsOf().hintP = 1; save();
    let found = null;
    for (const m of CHESS_MODULES) {
      m.items.forEach((p, gi) => { if (!found && p.type === 'board' && (p.kind === 'line' || p.kind === 'mate1')) found = { p, gi, tid: m.id }; });
      if (found) break;
    }
    Q = { topicId: found.tid, entries: [{ item: found.p, gi: found.gi }], i: 0, target: 1, correctThisRun: 0, xpThisRun: 0,
      eloStart: 800, lesson: '', name: 'HintProbe2', icon: '', track: 'chess', isDaily: false };
    renderQuestion(false);
  });
  await page.waitForTimeout(500);
  (await page.$('#pieceHintBtn')) ? ok('piece hint button offered on a chess puzzle') : fail('no piece hint button');
  await page.click('#pieceHintBtn');
  await page.waitForTimeout(400);
  const phk = await page.evaluate(() => {
    const item = BP.item;
    const expected = item.kind === 'line' ? sqIdx(item.line[0][0]) : (findMateMoveFrom(BP.st) || {}).from;
    return { sel: BP.sel, expected, left: itemsOf().hintP, msg: document.getElementById('puzzleTurn').textContent };
  });
  (phk.sel === phk.expected && phk.left === 0 && phk.msg.includes('winning move'))
    ? ok('piece hint selects the winning piece, consumed one use') : fail('piece hint: ' + JSON.stringify(phk));

  // ---- streak freeze: buy, then survive a missed day ----
  await page.evaluate(() => { S.coins = 1000; S.freezes = 0; save(); showHome(); });
  await page.waitForTimeout(300);
  await page.click('#tdFreeze');
  await page.waitForTimeout(250);
  await page.click('#mmYes');
  await page.waitForTimeout(300);
  const frz = await page.evaluate(() => ({ f: S.freezes, c: S.coins }));
  (frz.f === 1 && frz.c === 850) ? ok('streak freeze bought for 150') : fail('freeze: ' + JSON.stringify(frz));
  const frzRes = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() - 2);
    S.lastActive = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    S.streak = 5; save();
    touchStreak();
    return { streak: S.streak, freezes: S.freezes };
  });
  (frzRes.streak === 6 && frzRes.freezes === 0) ? ok('freeze auto-consumed, streak survives 5 -> 6') : fail('freeze use: ' + JSON.stringify(frzRes));

  // ---- streak repair: long gap breaks streak, coins fix it same day ----
  const repRes = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() - 3);
    S.lastActive = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    S.streak = 8; S.lastGift = todayStr(); save();
    touchStreak();
    return { streak: S.streak, offer: S.repairOffer && S.repairOffer.prev };
  });
  (repRes.streak === 1 && repRes.offer === 8) ? ok('broken streak leaves a repair offer') : fail('repair offer: ' + JSON.stringify(repRes));
  await page.evaluate(() => { S.coins = 500; save(); showHome(); });
  await page.waitForTimeout(400);
  (await page.$('#tdRepair')) ? ok('repair card on home') : fail('no repair card');
  await page.click('#tdRepair');
  await page.waitForTimeout(250);
  await page.click('#mmYes');
  await page.waitForTimeout(300);
  const rep2 = await page.evaluate(() => ({ s: S.streak, c: S.coins, o: S.repairOffer }));
  (rep2.s === 9 && rep2.c === 300 && !rep2.o) ? ok('repair restores streak to 9 for 200 coins') : fail('repair: ' + JSON.stringify(rep2));

  // ---- comeback gift ----
  const cb = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    S.lastActive = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    S.lastGift = ''; const c0 = S.coins; save();
    retentionDaily();
    return { gain: S.coins - c0, gifted: S.lastGift === todayStr() };
  });
  (cb.gain === 40 && cb.gifted) ? ok('comeback gift pays 40 coins after a long break') : fail('comeback: ' + JSON.stringify(cb));

  // ---- season rollover: coins + Champion Aura ----
  const sr = await page.evaluate(() => {
    S.season = { id: '2026-01', xp: 2000 }; const c0 = S.coins; save();
    retentionDaily();
    return { gain: S.coins - c0, id: S.season.id, xp: S.season.xp, hist: S.seasonHist['2026-01'], aura: S.accOwned.indexOf('seasonaura') >= 0 };
  });
  (sr.gain === 200 && sr.id === new Date().toISOString().slice(0, 7) && sr.xp === 0 && sr.hist === 2000 && sr.aura)
    ? ok('season rollover: 200 coins, history kept, Champion Aura earned') : fail('season: ' + JSON.stringify(sr));
  const sxp = await page.evaluate(() => { const x0 = S.season.xp; awardXP(25); return S.season.xp - x0; });
  sxp === 25 ? ok('XP feeds season XP') : fail('season xp: ' + sxp);

  // ---- friend challenge: create, then accept a rival code, win, get reply code ----
  await page.click('#bottomnav button[data-nav="battle"]');
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  txt.includes('Friend Challenge') ? ok('challenge card in Battle Zone') : fail('no challenge card');
  await page.click('#goChal');
  await page.waitForTimeout(400);
  await page.click('#newChal');
  await page.waitForTimeout(500);
  const chQ = await page.evaluate(() => Q && Q.isChallenge && Q.isChallenge.mode === 'create' && Q.entries.length === 5);
  chQ ? ok('create flow runs five problems') : fail('challenge Q wrong');
  const eloPre = await page.evaluate(() => S.mathElo);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(k => grade(k < 3, Q.entries[Q.i].item), i);
    await page.waitForTimeout(200);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(200);
  }
  txt = await page.textContent('#screen-root');
  txt.includes('Your challenge is ready') && txt.includes('MMC1-') ? ok('challenge code issued after playing') : fail('no challenge code screen');
  const eloPost = await page.evaluate(() => S.mathElo);
  eloPost === eloPre ? ok('challenge play leaves rating unchanged') : fail('rating moved ' + eloPre + '->' + eloPost);
  // accept a rival's code (crafted with different problems)
  const rival = await page.evaluate(() => {
    delete S.challenges[Object.keys(S.challenges)[0]];   // make room so the pick below is a fresh invite
    const refs = challengePickRefs();
    return challengeCode('Rival Rex', refs, 2);
  });
  await page.evaluate(() => showChallengeHub());
  await page.waitForTimeout(300);
  await page.fill('#chalInput', rival);
  await page.click('#chalGo');
  await page.waitForTimeout(300);
  await page.click('#mmYes');
  await page.waitForTimeout(400);
  const accQ = await page.evaluate(() => Q && Q.isChallenge && Q.isChallenge.mode === 'accept');
  accQ ? ok('accept flow starts from a pasted code') : fail('accept flow');
  const cChal = await page.evaluate(() => S.coins);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(200);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(200);
  }
  txt = await page.textContent('#screen-root');
  (txt.includes('Victory') && txt.includes('MMC1-')) ? ok('win screen with reply code') : fail('no victory screen');
  const cWin = await page.evaluate(() => S.coins);
  cWin >= cChal + 25 ? ok('challenge win pays 25 coins') : fail('win coins: ' + cChal + '->' + cWin);

  // ---- flow governor + lucky problems ----
  await page.evaluate(() => { startQuiz('amc8'); });
  await page.waitForTimeout(400);
  const gv = await page.evaluate(() => {
    grade(false, Q.entries[Q.i].item); const a = Q.missRun;
    nextQuestion(); grade(false, Q.entries[Q.i].item); const b = Q.missRun;
    nextQuestion(); grade(true, Q.entries[Q.i].item); const c = Q.missRun;
    return { a, b, c, lucky: Q.luckyI != null };
  });
  (gv.a === 1 && gv.b === 2 && gv.c === 0 && gv.lucky) ? ok('flow governor counts misses and resets on a win; lucky index seeded') : fail('governor: ' + JSON.stringify(gv));
  const lk = await page.evaluate(() => {
    nextQuestion();
    Q.luckyI = Q.i;   // force the lucky slot onto the current problem
    const c0 = S.coins; const e0 = S.coinsEarned;
    grade(true, Q.entries[Q.i].item);
    return { d: S.coinsEarned - e0 };
  });
  lk.d >= 6 ? ok('lucky problem paid a bonus (+' + (lk.d - 1) + ')') : fail('lucky: ' + JSON.stringify(lk));

  // ---- personal best on a practice test ----
  const pb = await page.evaluate(() => {
    const items = topicItems('amc8');
    T = { topicId: 'amc8', done: false, entries: [{ item: items[0], gi: 0, ans: (items[0].type === 'mc' ? 'ABCDE'[items[0].ci] : String(items[0].answer)), n: 1 }],
      contest: { name: 'PB Probe', expected: 25 } };
    S.testBest['PB Probe'] = { v: 0, s: '0 / 1' };
    const c0 = S.coins;
    finishTest(false);
    return { pbc: S.pbCount, gain: S.coins - c0, banner: document.body.innerHTML.indexOf('New personal best') >= 0 };
  });
  (pb.pbc >= 1 && pb.gain >= 25 && pb.banner) ? ok('beating a stored test score pays 25 coins with a banner') : fail('pb: ' + JSON.stringify(pb));

  // ---- session results show the tomorrow hook ----
  await page.evaluate(() => {
    Q = { topicId: 'amc8', entries: [{ item: topicItems('amc8')[3], gi: 3 }], i: 1, target: 1, correctThisRun: 1, xpThisRun: 10,
      eloStart: S.mathElo, name: 'Probe', track: 'math', isDaily: false };
    showResults();
  });
  await page.waitForTimeout(300);
  (await page.textContent('#screen-root')).includes('Tomorrow brings') ? ok('results screen plants the tomorrow hook') : fail('no tomorrow line');

  // ---- studio: daily deal + Champion Aura visibility ----
  await page.evaluate(() => {
    // the date-seeded deal item may already be owned via chest loot earlier in this run,
    // which hides the banner; release it so the check is date-independent
    const d = dailyDeal();
    if (d) { S.accOwned = (S.accOwned || []).filter(id => id !== d.id); save(); }
    STU.tab = 'acc'; showStudio();
  });
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  txt.includes('Deal of the day') ? ok('daily deal banner in accessories') : fail('no deal banner');
  txt.includes('Champion Aura') ? ok('earned Champion Aura visible in shop') : fail('champion aura missing');
  txt.includes('Season prize') ? ok('champion aura tagged as season prize') : fail('no season prize tag');
  const dealOk = await page.evaluate(() => { const d = dailyDeal(); const a = ACC_DEFS.find(x => x.id === d.id); return d.price < a.p && d.price >= 50; });
  dealOk ? ok('deal is a real discount') : fail('deal math wrong');

  // ---- leaderboard season sort ----
  await page.evaluate(() => showLeaderboard());
  await page.waitForTimeout(400);
  (await page.$('.diffchip[data-srt="season"]')) ? ok('season sort chip on leaderboard') : fail('no season chip');
  await page.click('.diffchip[data-srt="season"]');
  await page.waitForTimeout(300);
  (await page.textContent('#screen-root')).includes('season XP') ? ok('season sort renders values') : fail('season sort broken');

  // ---- teacher: assignment refresh ----
  await page.evaluate(() => {
    loadTS(); TS.name = 'Coach';
    const cls = { id: 'c1', name: 'Refresh Class', cloud: { url: '', cls: '' }, assignments: [], subs: {} };
    TS.classes = [cls];
    const probs = [];
    for (let gi = 0; gi < 6; gi++) probs.push(['amc8', gi]);
    cls.assignments.push({ id: 'a1', title: 'Weekly Set', due: '', probs, created: todayStr() });
    saveTS(); setRole('teacher'); showAssignment('c1', 'a1');
  });
  await page.waitForTimeout(400);
  (await page.$('#refreshAsg')) ? ok('refresh button on assignment') : fail('no refresh button');
  await page.click('#refreshAsg');
  await page.waitForTimeout(250);
  await page.click('#mmYes');
  await page.waitForTimeout(400);
  const ref = await page.evaluate(() => {
    const cls = classById('c1');
    const na = cls.assignments[cls.assignments.length - 1];
    const oldSet = {}; cls.assignments[0].probs.forEach(p => oldSet[p[0] + ':' + p[1]] = 1);
    return { n: cls.assignments.length, count: na.probs.length, title: na.title,
      overlap: na.probs.filter(p => oldSet[p[0] + ':' + p[1]]).length };
  });
  (ref.n === 2 && ref.count === 6 && ref.overlap === 0 && /week 2$/.test(ref.title))
    ? ok('refresh built a fresh six-problem set with zero overlap: ' + ref.title) : fail('refresh: ' + JSON.stringify(ref));
  const health = await page.evaluate(() => { showClass('c1'); return document.getElementById('healthBtn') === null; });
  health ? ok('cloud-only controls hidden without a cloud link (no crash)') : fail('health shown without cloud');

  // ---- teacher power pack: roster from codes ----
  const myCode = await page.evaluate(() => classCode());
  await page.evaluate(code => { rosterFromCodes(classById('c1'), code); showClass('c1'); }, myCode);
  await page.waitForTimeout(400);
  let ttxt = await page.textContent('#screen-root');
  (ttxt.includes('Roster') && ttxt.includes('1 student') && ttxt.includes('Reward the class'))
    ? ok('roster built offline from a student code; reward section present') : fail('roster missing');
  await page.click('.stuRow');
  await page.waitForTimeout(400);
  ttxt = await page.textContent('#screen-root');
  (ttxt.includes('Math Rating') && ttxt.includes('Season XP') && ttxt.includes('Assignment history'))
    ? ok('per-student detail page renders from roster data') : fail('student detail broken');

  // ---- missing work + per-problem breakdown + reteach callout ----
  const aid1 = await page.evaluate(() => {
    const cls = classById('c1');
    const a = cls.assignments[0];
    cls.subs = cls.subs || {};
    cls.subs[a.id] = { someone_else: { name: 'Someone Else', score: 2, total: 6, mask: '110100', ts: todayStr() } };
    saveTS(); showAssignment('c1', a.id);
    return a.id;
  });
  await page.waitForTimeout(400);
  ttxt = await page.textContent('#screen-root');
  (ttxt.includes('Not yet submitted') && ttxt.includes('Problem breakdown'))
    ? ok('missing-work flag and per-problem breakdown render') : fail('analysis missing');
  ttxt.includes('Reteach candidate') ? ok('reteach callout flags the hardest problem') : fail('no reteach callout');
  const csv = await page.evaluate(aid => { const cls = classById('c1'); return resultsCsv(cls, cls.assignments[0], cls.subs[aid]); }, aid1);
  (csv.startsWith('Name,Score,Total') && csv.includes('Someone Else,2,6') && csv.includes('right') && csv.includes('wrong'))
    ? ok('results CSV export built correctly') : fail('csv: ' + csv.slice(0, 120));
  const rcsv = await page.evaluate(() => rosterCsv(classById('c1')));
  (rcsv.startsWith('Name,Math rating') && rcsv.split('\n').length === 2) ? ok('roster CSV export built correctly') : fail('roster csv: ' + rcsv.slice(0, 100));

  // ---- printable class report ----
  await page.evaluate(() => showClassReport('c1'));
  await page.waitForTimeout(400);
  ttxt = await page.textContent('#screen-root');
  (ttxt.includes('Class Report') && ttxt.includes('Refresh Class') && ttxt.includes('Class average') && (await page.$('#printBtn')))
    ? ok('printable class report renders with roster and assignment tables') : fail('report broken');

  // ---- teacher bonus codes: redeem once, ceremony, no double dip ----
  const bonus = await page.evaluate(() => bonusCode('c50', 'Coach', 'Refresh Class'));
  await page.evaluate(() => { setRole('student'); showAssignmentsHome(); });
  await page.waitForTimeout(400);
  const cB0 = await page.evaluate(() => S.coins);
  await page.fill('#asgInput', bonus);
  await page.click('#parseAsg');
  await page.waitForTimeout(1300);
  const bres = await page.evaluate(() => {
    const ov = document.getElementById('chestOv');
    return { coins: S.coins, ov: !!ov, title: ov ? ov.querySelector('.chtitle').textContent : '', redeemed: Object.keys(S.redeemed).length };
  });
  (bres.coins === cB0 + 50 && bres.ov && bres.title.includes('Teacher Bonus') && bres.redeemed >= 1)
    ? ok('bonus code pays 50 coins through a Teacher Bonus ceremony') : fail('bonus: ' + JSON.stringify(bres));
  await page.evaluate(() => { const ov = document.getElementById('chestOv'); if (ov) ov.click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => showAssignmentsHome());
  await page.waitForTimeout(300);
  await page.fill('#asgInput', bonus);
  await page.click('#parseAsg');
  await page.waitForTimeout(400);
  const cB2 = await page.evaluate(() => S.coins);
  cB2 === cB0 + 50 ? ok('second redeem of the same bonus code is blocked') : fail('double redeem: ' + cB2);

  // ---- class announcement banner on the student home ----
  await page.evaluate(() => { S.lastAnn = { msg: 'Quiz on Friday, finish week 3.', teacher: 'Coach P', ts: todayStr() }; save(); showHome(); });
  await page.waitForTimeout(400);
  (await page.textContent('#screen-root')).includes('Quiz on Friday')
    ? ok('class announcement banner shows on the student home') : fail('no announcement banner');

  // ---- badge chest: a Gold tier drops a bonus chest with a ceremony ----
  await page.evaluate(() => { setRole('student'); showHome(); });
  await page.waitForTimeout(400);
  const cBadge = await page.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.9; const c0 = S.coins; S.testsTaken = 15; save(); checkBadges(); return c0; });
  await page.waitForTimeout(3600);
  const bch = await page.evaluate(() => {
    Math.random = window.__mr;
    const ov = document.getElementById('chestOv');
    return { there: !!ov, title: ov ? ov.querySelector('.chtitle').textContent : '', coins: S.coins };
  });
  (bch.there && bch.title.includes('Badge Chest')) ? ok('gold badge triggers a badge chest ceremony') : fail('badge chest: ' + JSON.stringify(bch));
  // forced 0.9 roll: silver 25 + gold 40 tier coins, plus chest loot of 25 + 18 coins
  (bch.coins >= cBadge + 25 + 40 + 43) ? ok('badge tier coins plus mystery chest loot paid') : fail('badge chest coins: ' + cBadge + '->' + bch.coins);
  await page.evaluate(() => { const ov = document.getElementById('chestOv'); if (ov) ov.click(); });
  await page.waitForTimeout(300);

  // ---- badges page shows the reward you are working toward ----
  await page.click('#bottomnav button[data-nav="badges"]');
  await page.waitForTimeout(500);
  const bp = await page.evaluate(() => {
    const nexts = Array.from(document.querySelectorAll('.bnext'));
    return {
      coinIcons: document.querySelectorAll('.bnext .icoin').length,
      chestIcons: document.querySelectorAll('.bnext .ichest').length,
      dotRewards: Array.from(document.querySelectorAll('.tierdot')).filter(e => e.title.includes('coins')).length,
      wordy: nexts.filter(e => /chest|coin/i.test(e.textContent)).length,
      oneLine: nexts.every(e => e.scrollHeight <= e.clientHeight + 2),
      fits: nexts.every(e => e.scrollWidth <= e.clientWidth + 2)
    };
  });
  (bp.coinIcons > 20 && bp.chestIcons >= 2 && bp.dotRewards > 100 && bp.wordy === 0)
    ? ok('badge rewards use coin and chest icons, no words (' + bp.coinIcons + ' coin, ' + bp.chestIcons + ' chest icons)') : fail('badge rewards: ' + JSON.stringify(bp));
  (bp.oneLine && bp.fits) ? ok('every badge reward line fits on one line') : fail('badge line overflow: ' + JSON.stringify(bp));

  // ---- answer outcome pie + working accuracy ----
  const oc = await page.evaluate(() => {
    S.tryFirst = 0; S.trySecond = 0; S.tryFailed = 0; S.tryQuit = 0;
    Q = { tries: 0, gaveUp: 0, entries: [], i: 0 };
    Q.tries = 0; Q.gaveUp = 0; grade(true, {});    // first-try solve
    Q.tries = 1; Q.gaveUp = 0; grade(true, {});    // second-try solve
    Q.tries = 1; Q.gaveUp = 0; grade(false, {});   // missed both tries
    Q.tries = 1; Q.gaveUp = 1; grade(false, {});   // gave up
    return { f: S.tryFirst, s: S.trySecond, m: S.tryFailed, q: S.tryQuit };
  });
  (oc.f === 1 && oc.s === 1 && oc.m === 1 && oc.q === 1) ? ok('answers classified: first try, second try, missed both, gave up') : fail('outcomes: ' + JSON.stringify(oc));
  await page.evaluate(() => showProfile());
  await page.waitForTimeout(400);
  const pie = await page.evaluate(() => {
    const card = document.querySelector('.accpie');
    const rings = card ? card.querySelectorAll('svg circle').length : 0;
    const t = card ? card.textContent : '';
    return { there: !!card, rings, hasAll: ['Correct first try', 'Correct second try', 'Missed both tries', 'Gave up'].every(x => t.includes(x)),
      center: /\d+\.\d%/.test(t) };
  });
  (pie.there && pie.rings === 4 && pie.hasAll && pie.center) ? ok('outcome pie renders four segments with counts and center accuracy') : fail('pie: ' + JSON.stringify(pie));
  const accMove = await page.evaluate(() => {
    const read = () => document.querySelector('#screen-root').textContent.match(/(\d+\.\d)%\s*Accuracy/);
    const a0 = ((S.correctTotal / S.answeredTotal) * 100).toFixed(1);
    Q = { tries: 1, gaveUp: 1, entries: [], i: 0 };
    grade(false, {});
    showProfile();
    const a1 = ((S.correctTotal / S.answeredTotal) * 100).toFixed(1);
    const shown = document.querySelector('#screen-root').textContent.includes(a1 + '%');
    return { a0, a1, shown, moved: a0 !== a1 };
  });
  (accMove.moved && accMove.shown) ? ok('accuracy moves with each answer and shows one decimal: ' + accMove.a0 + '% -> ' + accMove.a1 + '%') : fail('accuracy: ' + JSON.stringify(accMove));

  // ---- all-time XP vs season XP ----
  await page.click('#bottomnav button[data-nav="profile"]');
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  (txt.includes('XP all-time') && txt.includes('XP this season') && txt.includes('Season XP') && txt.includes('Best Season'))
    ? ok('profile separates all-time XP from season XP') : fail('profile xp labels missing');
  const xpSep = await page.evaluate(() => {
    const x0 = S.xp; const s0 = S.season.xp;
    S.season = { id: '1999-01', xp: 500 }; save(); retentionDaily();
    return { xpKept: S.xp === x0, seasonReset: S.season.xp === 0 };
  });
  (xpSep.xpKept && xpSep.seasonReset) ? ok('season rollover resets season XP only; all-time XP is permanent') : fail('xp permanence: ' + JSON.stringify(xpSep));
  await page.evaluate(() => showLeaderboard());
  await page.waitForTimeout(400);
  txt = await page.textContent('#screen-root');
  (txt.includes('All-time XP') && txt.includes('Season XP') && txt.includes('never resets'))
    ? ok('leaderboard offers all-time XP and season XP boards') : fail('lb labels missing');

  // ---- clickable AoPS solution links ----
  await page.evaluate(() => {
    setRole('student');
    const items = topicItems('amc8');
    const gi = items.findIndex(p => p.sol && p.sol.includes('sollink'));
    Q = { topicId: 'amc8', entries: [{ item: items[gi], gi }], i: 0, target: 1, correctThisRun: 0, xpThisRun: 0,
      eloStart: 800, lesson: '', name: 'LinkProbe', icon: '', track: 'math', isDaily: false };
    renderQuestion(false);
    grade(true, Q.entries[0].item);
  });
  await page.waitForTimeout(500);
  const sl = await page.evaluate(() => {
    const a = document.querySelector('#feedback a.sollink');
    const item = Q.entries[0].item;
    const m = item.q.match(/\[(\d{4}(?:\s+Fall)?\s+(?:AMC\s+\d+[AB]?|AIME(?:\s+I{1,2})?))\s*·\s*#(\d+)\]/);
    const expect = 'https://artofproblemsolving.com/wiki/index.php/' + m[1].replace(/\s+/g, '_') + '_Problems/Problem_' + m[2];
    return { there: !!a, href: a && a.getAttribute('href'), expect,
      text: a ? a.textContent : '', blank: a && a.getAttribute('target') === '_blank',
      lookupGone: !document.getElementById('feedback').textContent.includes('look up') };
  });
  (sl.there && sl.href === sl.expect && sl.text.includes('Click here') && sl.blank && sl.lookupGone)
    ? ok('solution link renders in feedback: ' + sl.href.split('index.php/')[1]) : fail('sollink: ' + JSON.stringify(sl));
  const slData = await page.evaluate(() => {
    let checked = 0, bad = 0;
    for (const arr of Object.values(AOPS_BANK)) for (const p of arr) {
      const m = String(p.q).match(/\[(\d{4}(?:\s+Fall)?\s+(?:AMC\s+\d+[AB]?|AIME(?:\s+I{1,2})?))\s*·\s*#(\d+)\]/);
      if (!m) continue;
      const h = String(p.sol || '').match(/href='([^']+)'/);
      checked++;
      if (!h || h[1] !== 'https://artofproblemsolving.com/wiki/index.php/' + m[1].replace(/\s+/g, '_') + '_Problems/Problem_' + m[2]) bad++;
    }
    return { checked, bad };
  });
  (slData.checked > 4000 && slData.bad === 0) ? ok('all ' + slData.checked + ' problems carry a correct wiki link') : fail('link data: ' + JSON.stringify(slData));

  // ---- persistence ----
  await page.evaluate(() => { setRole('student'); });
  await page.reload();
  await page.waitForTimeout(1300);
  const per = await page.evaluate(() => ({ ob: S.onboarded, f: S.freezes, aura: S.accOwned.indexOf('seasonaura') >= 0, ch: Object.keys(S.challenges).length, sid: S.season.id }));
  (per.ob === 1 && per.aura && per.ch >= 1 && per.sid) ? ok('retention state persists after reload') : fail('persist: ' + JSON.stringify(per));

  // ---- diagrams display large and zoom to fullscreen ----
  await page.evaluate(() => {
    let found = null;
    for (const arr of Object.values(AOPS_BANK)) {
      for (let gi = 0; gi < arr.length; gi++) {
        const p = arr[gi];
        if (!found && p.figs && p.figs.some(f => {
          const m = String(f).match(/<svg[^>]*?width='([0-9.]+)pt'/);
          return m && parseFloat(m[1]) >= 80 && parseFloat(m[1]) <= 200;
        })) { found = p; }
      }
    }
    Q = { topicId: 'amc8', entries: [{ item: found, gi: 0 }], i: 0, target: 1, correctThisRun: 0, xpThisRun: 0,
      eloStart: 800, lesson: '', name: 'FigProbe', icon: '', track: 'math', isDaily: false };
    renderQuestion(false);
  });
  await page.waitForTimeout(500);
  const fig = await page.evaluate(() => {
    const f = document.querySelector('.asyfig-zoom');
    const svg = f && f.querySelector('svg');
    const natural = svg ? parseFloat((svg.getAttribute('width') || '0').replace('pt', '')) * 1.333 : 0;
    return { there: !!f, w: svg ? svg.getBoundingClientRect().width : 0, natural: Math.round(natural) };
  });
  (fig.there && fig.w >= 250 && fig.w > fig.natural * 1.3)
    ? ok('diagram upscaled: ' + fig.natural + 'px natural -> ' + Math.round(fig.w) + 'px displayed') : fail('fig size: ' + JSON.stringify(fig));
  await page.click('.asyfig-zoom');
  await page.waitForTimeout(400);
  const zoom = await page.evaluate(() => {
    const z = document.getElementById('figZoom');
    const svg = z && z.querySelector('svg');
    return { there: !!z, w: svg ? svg.getBoundingClientRect().width : 0 };
  });
  (zoom.there && zoom.w >= 500) ? ok('tap opens a fullscreen zoom at ' + Math.round(zoom.w) + 'px') : fail('zoom: ' + JSON.stringify(zoom));
  await page.click('#figZoom');
  await page.waitForTimeout(300);
  (await page.$('#figZoom')) ? fail('zoom did not close') : ok('tap closes the zoom');
  const inl = await page.evaluate(() => {
    // tiny inline symbols must NOT be blown up
    let tiny = null;
    for (const arr of Object.values(AOPS_BANK)) for (const p of arr) {
      if (!tiny && p.figs && p.figs.some(f => { const m = String(f).match(/<svg[^>]*?width='([0-9.]+)pt'/); return m && parseFloat(m[1]) < 20; })) tiny = p;
    }
    if (!tiny) return { skip: true };
    const html = fmt(tiny, tiny.q);
    return { inline: html.includes('asyfig-inline'), zoomed: false };
  });
  (inl.skip || inl.inline) ? ok('tiny inline symbols keep their natural size') : fail('inline: ' + JSON.stringify(inl));

  // ---- accounts and login ----
  const acct = await page.evaluate(() => {
    const us = Object.values(authUsers());
    const me = us.find(u => u.name === 'Nova');
    return { n: us.length, me };
  });
  (acct.me && acct.me.role === 'student' && acct.me.hash === null)
    ? ok('account auto-created for Nova at signup, passwordless by choice') : fail('account: ' + JSON.stringify(acct));
  await page.evaluate(() => new Promise(res => {
    pwMakeHash('brainy123', h => {
      const us = authUsers();
      us[Object.values(us).find(u => u.name === 'Nova').id].hash = h;
      authSaveUsers(us); res(1);
    });
  }));
  const hrec = await page.evaluate(() => Object.values(authUsers()).find(u => u.name === 'Nova').hash);
  (hrec && hrec.h && hrec.h !== 'brainy123' && !hrec.h.includes('brainy') && hrec.salt && hrec.it >= 20000 && ['pbkdf2', 'js'].includes(hrec.alg))
    ? ok('password stored as a salted hash only (' + hrec.alg + ', ' + hrec.it + ' rounds)') : fail('hash: ' + JSON.stringify(hrec));
  const vr = await page.evaluate(() => new Promise(res => {
    const rec = Object.values(authUsers()).find(u => u.name === 'Nova').hash;
    pwVerify('brainy123', rec, ok1 => pwVerify('wrongpw', rec, ok2 => res({ ok1, ok2 })));
  }));
  (vr.ok1 && !vr.ok2) ? ok('hash verifies the right password and rejects the wrong one') : fail('verify: ' + JSON.stringify(vr));

  await page.evaluate(() => { _lsDel('mm_active'); _ssDel('mm_active_s'); });
  await page.reload();
  await page.waitForTimeout(2800);
  (await page.textContent('#screen-root')).includes('Who is training today')
    ? ok('signed-out boot shows the account chooser') : fail('no login screen');
  (await page.textContent('.logincard')).includes('🔒') ? ok('protected account shows a lock') : fail('no lock badge');
  await page.click('.logincard');
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    await page.fill('#loginPwIn', 'nope' + i);
    await page.click('#loginGo');
    await page.waitForTimeout(400);
  }
  (await page.textContent('#loginErr')).includes('Too many tries')
    ? ok('five wrong passwords trigger a login timeout') : fail('no lockout: ' + await page.textContent('#loginErr'));
  await page.evaluate(() => {
    const uid = Object.values(authUsers()).find(u => u.name === 'Nova').id;
    _lsDel('mm_lock:' + uid);
  });
  await page.fill('#loginPwIn', 'brainy123');
  await page.click('#loginEye');
  (await page.getAttribute('#loginPwIn', 'type')) === 'text' ? ok('show-password eye toggles the field') : fail('eye broken');
  await page.click('#loginGo');
  await page.waitForTimeout(3200);
  const back = await page.evaluate(() => ({ name: S.name, ob: S.onboarded, aura: S.accOwned.indexOf('seasonaura') >= 0 }));
  (back.name === 'Nova' && back.ob === 1 && back.aura)
    ? ok('correct password logs back in with all progress intact') : fail('relogin: ' + JSON.stringify(back));

  // ---- legacy single-profile saves migrate into accounts ----
  await page.evaluate(() => {
    _lsDel('mm_users'); _lsDel('mm_active'); _ssDel('mm_active_s');
    window.localStorage.setItem('mm_state', JSON.stringify({ name: 'OldTimer', avatar: '🐼', xp: 777, onboarded: 1 }));
    window.localStorage.setItem('mm_role', JSON.stringify('student'));
  });
  await page.reload();
  await page.waitForTimeout(2800);
  const mig = await page.evaluate(() => ({ name: S.name, xp: S.xp, users: Object.values(authUsers()).map(u => u.name) }));
  (mig.name === 'OldTimer' && mig.xp === 777 && mig.users.includes('OldTimer'))
    ? ok('legacy save migrates into an account and signs in automatically') : fail('migration: ' + JSON.stringify(mig));

  console.log('console errors:', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
  await browser.close();
})();
