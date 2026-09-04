/* v23 E2E: accessibility. Landmarks and live regions, labels on placeholder-only
   inputs and icon buttons, keyboard operation of clickable cards, the login
   screen and the chess board, right/wrong marks that do not rely on color,
   and the Animations and Text size preferences (including persistence) */
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

  // ---- shell: landmarks, live regions, focus styling ----
  const shell = await page.evaluate(() => ({
    main: document.getElementById('screen-root').getAttribute('role'),
    nav: document.getElementById('bottomnav').getAttribute('role'),
    toasts: document.getElementById('toasts').getAttribute('aria-live'),
    focusRule: Array.from(document.styleSheets).some(s => { try { return Array.from(s.cssRules).some(r => r.selectorText && r.selectorText.includes(':focus-visible')); } catch (e) { return false; } }),
    motionRule: Array.from(document.styleSheets).some(s => { try { return Array.from(s.cssRules).some(r => r.media && r.media.mediaText.includes('prefers-reduced-motion')); } catch (e) { return false; } })
  }));
  (shell.main === 'main' && shell.nav === 'navigation') ? ok('main and navigation landmarks') : fail('landmarks: ' + JSON.stringify(shell));
  shell.toasts === 'polite' ? ok('toasts are a polite live region') : fail('toasts aria-live: ' + shell.toasts);
  shell.focusRule ? ok('keyboard focus ring rule present') : fail('no :focus-visible rule');
  shell.motionRule ? ok('prefers-reduced-motion honored in CSS') : fail('no reduced-motion media rule');

  // ---- welcome screen: placeholder-only inputs get labels ----
  const labels = await page.evaluate(() => ({
    name: document.getElementById('nameInput').getAttribute('aria-label'),
    pw: document.getElementById('pwInput').getAttribute('aria-label'),
    unlabeled: Array.from(document.querySelectorAll('input[placeholder],textarea[placeholder]')).filter(i => !i.getAttribute('aria-label')).length
  }));
  (labels.name === 'Your name' && labels.pw && labels.unlabeled === 0) ? ok('every placeholder input carries an accessible label') : fail('labels: ' + JSON.stringify(labels));

  await page.fill('#nameInput', 'Kai'); await page.click('#startBtn');
  await page.waitForTimeout(500);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => grade(true, Q.entries[Q.i].item));
    await page.waitForTimeout(150);
    await page.evaluate(() => nextQuestion());
    await page.waitForTimeout(150);
  }
  await page.click('#obDone');
  await page.waitForTimeout(400);

  // ---- home: clickable cards are keyboard buttons ----
  const cards = await page.evaluate(() => ['goBadges', 'goMath', 'goChess'].map(id => {
    const el = document.getElementById(id);
    return el.getAttribute('role') === 'button' && el.getAttribute('tabindex') === '0';
  }));
  cards.every(Boolean) ? ok('home cards expose role=button and tabindex') : fail('card roles: ' + JSON.stringify(cards));
  await page.focus('#goBadges');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  (await page.textContent('#screen-root')).includes('Trophy Case') && !(await page.$('#goBadges'))
    ? ok('Enter on a focused card opens it') : fail('keyboard activation failed');
  await page.evaluate(() => showHome());
  await page.waitForTimeout(300);
  const focusedRoot = await page.evaluate(() => document.activeElement === document.getElementById('screen-root') || document.activeElement === document.body);
  focusedRoot ? ok('focus moves to the new screen for screen readers') : fail('focus not on screen root');

  // ---- quiz: labels, progress semantics, live feedback, non-color marks ----
  await page.evaluate(() => {
    startTrain('math');
    let guard = 0;
    while (Q.entries[Q.i].item.type !== 'mc' && guard++ < 30) { Q.entries.pop(); pickNextProblem(); }
    renderQuestion(true);
  });
  await page.waitForTimeout(300);
  const quiz = await page.evaluate(() => ({
    quit: document.getElementById('quitBtn').getAttribute('aria-label'),
    prog: document.querySelector('.qprogress').getAttribute('role'),
    now: document.querySelector('.qprogress').getAttribute('aria-valuenow'),
    fb: document.getElementById('feedback').getAttribute('aria-live'),
    type: Q.entries[Q.i].item.type
  }));
  (quiz.quit && quiz.prog === 'progressbar' && quiz.now === '0' && quiz.fb === 'polite')
    ? ok('quit button labeled, progress bar semantic, feedback is live') : fail('quiz a11y: ' + JSON.stringify(quiz));
  if (quiz.type === 'mc') {
    await page.evaluate(() => document.querySelector('.choice[data-ci="' + Q.entries[Q.i].item.ci + '"]').click());
    await page.waitForTimeout(300);
    const mark = await page.evaluate(() => getComputedStyle(document.querySelector('.choice.correct'), '::after').content);
    mark.includes('✓') ? ok('correct choice shows a check mark, not color alone') : fail('mark: ' + mark);
  } else {
    ok('skipped choice-mark check (no multiple choice served)');
  }

  // ---- chess board: every square is a labeled keyboard button ----
  await page.evaluate(() => {
    const mod = CHESS_MODULES.find(m => m.items.length && m.items.every(it => it.type === 'board'));
    Q = null; startQuiz(mod.id);
  });
  await page.waitForTimeout(400);
  const board = await page.evaluate(() => {
    const sqs = Array.from(document.querySelectorAll('#board .sq'));
    const re = /^[a-h][1-8], ((white|black) (king|queen|rook|bishop|knight|pawn)|empty)/;
    return { n: sqs.length, buttons: sqs.filter(s => s.getAttribute('role') === 'button' && s.getAttribute('tabindex') === '0').length,
      labeled: sqs.filter(s => re.test(s.getAttribute('aria-label') || '')).length, group: document.getElementById('board').getAttribute('role') };
  });
  (board.n === 64 && board.buttons === 64 && board.labeled === 64 && board.group === 'group')
    ? ok('all 64 squares are labeled keyboard buttons inside a named group') : fail('board: ' + JSON.stringify(board));
  const picked = await page.evaluate(async () => {
    const side = BP.pw ? 'white' : 'black';
    const own = Array.from(document.querySelectorAll('#board .sq')).filter(s => (s.getAttribute('aria-label') || '').includes(side));
    for (const s of own) {
      s.focus();
      s.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 60));
      if (document.querySelector('#board .selsq')) return { sel: true, hints: document.querySelectorAll('#board .hint, #board .hintcap').length };
    }
    return { sel: false };
  });
  (picked.sel && picked.hints > 0) ? ok('Enter on a piece selects it and reveals ' + picked.hints + ' target squares') : fail('keyboard piece selection: ' + JSON.stringify(picked));

  // ---- preferences: animations off, larger text, persistence ----
  await page.evaluate(() => { Q = null; showProfile(); });
  await page.waitForTimeout(300);
  await page.click('#motionBtn');
  await page.waitForTimeout(300);
  const calm = await page.evaluate(() => {
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    confetti(20);
    return { cls: document.body.classList.contains('calm'), pref: S.reduceMotion, bits: document.querySelectorAll('.confetti').length, label: document.getElementById('motionBtn').textContent };
  });
  (calm.cls && calm.pref === 1 && calm.bits === 0 && calm.label === 'Animations: off')
    ? ok('Animations off: calm class applied and confetti suppressed') : fail('calm: ' + JSON.stringify(calm));
  await page.click('#textBtn');
  await page.waitForTimeout(300);
  const big = await page.evaluate(() => ({ cls: document.body.classList.contains('bigtext'), zoom: getComputedStyle(document.getElementById('app')).zoom, label: document.getElementById('textBtn').textContent }));
  (big.cls && parseFloat(big.zoom) > 1 && big.label === 'Text size: large') ? ok('Text size large applies zoom ' + big.zoom) : fail('bigtext: ' + JSON.stringify(big));
  await page.reload();
  await page.waitForTimeout(1200);
  const kept = await page.evaluate(() => ({ calm: document.body.classList.contains('calm'), big: document.body.classList.contains('bigtext') }));
  (kept.calm && kept.big) ? ok('preferences persist across reloads') : fail('kept: ' + JSON.stringify(kept));

  // ---- login screen: cards and delete controls work from the keyboard ----
  await page.evaluate(() => mmLogout());
  await page.waitForTimeout(1200);
  const login = await page.evaluate(() => {
    const c = document.querySelector('.logincard'), d = document.querySelector('.logindel');
    return { role: c.getAttribute('role'), tab: c.getAttribute('tabindex'), label: c.getAttribute('aria-label'), delTag: d.tagName, delLabel: d.getAttribute('aria-label') };
  });
  (login.role === 'button' && login.tab === '0' && /Open Kai/.test(login.label) && login.delTag === 'BUTTON' && /Delete Kai/.test(login.delLabel))
    ? ok('login card is a labeled keyboard button with a real delete button') : fail('login: ' + JSON.stringify(login));
  await page.focus('.logincard');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  (await page.evaluate(() => S.name)) === 'Kai' ? ok('Enter on the account card logs in') : fail('keyboard login failed');

  errors.length === 0 ? ok('zero console errors') : fail('console errors: ' + errors.join(' | '));
  await browser.close();
  console.log(process.exitCode ? 'SUITE FAILED' : 'ALL v23 CHECKS PASSED');
})();
