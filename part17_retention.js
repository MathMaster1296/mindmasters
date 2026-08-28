/* ================= RETENTION SYSTEMS =================
   Onboarding quest, unified Today checklist with a daily chest, streak
   freezes and repairs, monthly seasons, comeback gifts, friend challenge
   codes, and small delight systems (lucky problems, personal bests).
   Loaded before part4; every function touches shared state (S, Store,
   toast, ...) only at call time, never at load time. */

/* ---- seasons: each calendar month is a season ---- */
const SEASON_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function seasonLabel(id) {
  const m = String(id || "").split("-");
  const mi = parseInt(m[1], 10);
  return (SEASON_MONTHS[mi - 1] || "Mystery") + " " + (m[0] || "");
}
function retentionDaily() {
  const today = todayStr();
  const sid = today.slice(0, 7);
  if (!S.season || !S.season.id) {
    S.season = { id: sid, xp: 0 };
  } else if (S.season.id !== sid) {
    const old = S.season;
    const coins = Math.min(500, Math.floor((old.xp || 0) / 10));
    S.seasonHist = S.seasonHist || {};
    S.seasonHist[old.id] = old.xp || 0;
    let msg = "The " + seasonLabel(old.id) + " season has ended.";
    if (coins > 0) { earnCoins(coins); msg += " Your " + old.xp + " season XP turned into " + coins + " coins."; }
    if ((old.xp || 0) >= 1500 && (S.accOwned || []).indexOf("seasonaura") < 0) {
      S.accOwned = S.accOwned || [];
      S.accOwned.push("seasonaura");
      msg += " You also earned the exclusive Champion Aura. Find it in the Avatar Studio.";
    }
    S.season = { id: sid, xp: 0 };
    setTimeout(() => { toast("★", msg); confetti(45); Sfx.badge(); }, 900);
  }
  /* comeback gift: three or more full days away */
  if (S.lastActive && S.lastActive !== today && (S.lastGift || "") !== today) {
    const gap = Math.round((new Date(today) - new Date(S.lastActive)) / 86400000);
    if (gap >= 4) {
      S.lastGift = today;
      earnCoins(40);
      setTimeout(() => {
        toast("🎁", "Welcome back, " + (S.name || "champion") + ". Here are 40 coins to restart your journey. Your review queue kept your missed problems warm.");
        confetti(24);
      }, 400);
    }
  }
  save();
}

/* ---- streak freezes and same-day repair ---- */
function buyFreeze() {
  if ((S.freezes || 0) >= 2) { toast("❄", "You already hold 2 streak freezes, the maximum."); return; }
  if ((S.coins || 0) < 150) { toast("!", "A streak freeze costs 150 coins. You have " + (S.coins || 0) + "."); return; }
  askConfirm("Buy a streak freeze?", "150 coins. If you miss one day, a freeze is used automatically and your streak survives.", "Buy", () => {
    S.coins -= 150;
    S.freezes = (S.freezes || 0) + 1;
    save(); renderTopbar(); Sfx.badge();
    toast("❄", "Streak freeze stored. You hold " + S.freezes + ".");
    if (typeof showHome === "function") showHome();
  });
}
function repairStreak() {
  const today = todayStr();
  if (!S.repairOffer || S.repairOffer.d !== today) return;
  if ((S.coins || 0) < 200) { toast("!", "A streak repair costs 200 coins. You have " + (S.coins || 0) + "."); return; }
  const prev = S.repairOffer.prev;
  askConfirm("Repair your streak?", "200 coins brings your " + prev + " day streak back to life, today only.", "Repair", () => {
    S.coins -= 200;
    S.streak = prev + 1;
    if (S.streak > S.maxStreak) S.maxStreak = S.streak;
    S.repairOffer = null;
    save(); renderTopbar(); Sfx.level(); confetti(30);
    toast("🔥", "Streak repaired. " + S.streak + " days and counting.");
    if (typeof showHome === "function") showHome();
  });
}

/* ---- daily counters for the Today card ---- */
function bumpRevToday() {
  const today = todayStr();
  if (!S.revToday || S.revToday.d !== today) S.revToday = { d: today, n: 0 };
  S.revToday.n++;
}
function bumpAsgToday() {
  const today = todayStr();
  if (!S.asgToday || S.asgToday.d !== today) S.asgToday = { d: today, n: 0 };
  S.asgToday.n++;
}

/* ---- the Today card: one checklist, one chest ---- */
function buildTodayCard() {
  const today = todayStr();
  const cnt = S.todayDate === today ? S.todayCount : 0;
  const dailyDone = S.dailyDoneOn === today;
  const solveDone = cnt >= 10;
  const due = (typeof reviewDue === "function") ? reviewDue() : [];
  const revDone = !!(S.revToday && S.revToday.d === today && S.revToday.n > 0);
  const openA = (typeof openAssignmentCount === "function") ? openAssignmentCount() : 0;
  const asgDone = !!(S.asgToday && S.asgToday.d === today && S.asgToday.n > 0);
  const chestReady = dailyDone && solveDone;
  const chestOpen = S.chestOpenOn === today;
  const row = (done, id, label, right) =>
    '<div class="todayrow' + (done ? " done" : "") + '"' + (id && !done ? ' id="' + id + '" style="cursor:pointer"' : '') + '>' +
      '<span class="tdchk">' + (done ? "✓" : "") + '</span>' +
      '<span style="flex:1;min-width:0">' + label + '</span>' + (right || "") +
    '</div>';
  let rows = row(dailyDone, "tdDaily", "Daily Challenge", dailyDone ? "" : '<span class="tdgo">Play ›</span>');
  rows += row(solveDone, "tdSolve", "Solve 10 problems",
    '<span class="num" style="font-weight:700;color:var(--gold)">' + Math.min(cnt, 10) + '/10</span>');
  if (due.length || revDone) {
    rows += row(revDone, "tdReview", "Smart Review" + (revDone ? "" : " · " + due.length + " ready"),
      revDone ? '<span class="tdgo" style="color:var(--green)">chest +5</span>' : '<span class="tdgo">chest +5 ›</span>');
  }
  if (openA || asgDone) {
    rows += row(asgDone, "tdAsg", "Finish an assignment" + (asgDone || !openA ? "" : " · " + openA + " open"),
      asgDone ? '<span class="tdgo" style="color:var(--green)">chest +5</span>' : '<span class="tdgo">chest +5 ›</span>');
  }
  const chest = chestOpen
    ? '<div class="chestrow opened"><span class="chesticon">🎁</span><span style="flex:1">Chest opened. A new one arrives tomorrow.</span></div>'
    : chestReady
      ? '<div class="chestrow ready" id="tdChest" style="cursor:pointer"><span class="chesticon">🎁</span><span style="flex:1"><b>Your chest is ready.</b> Tap to open it.</span><span class="tdgo">Open ›</span></div>'
      : '<div class="chestrow"><span class="chesticon">🎁</span><span style="flex:1">Finish the Daily Challenge and solve 10 to unlock today\'s chest.</span></div>';
  const repair = (S.repairOffer && S.repairOffer.d === today)
    ? '<div class="card repaircard" id="tdRepair" style="cursor:pointer">' +
        '<b style="flex:1">Your ' + S.repairOffer.prev + ' day streak broke while you were away.</b>' +
        '<span class="tdgo" style="color:var(--gold)">Repair · 200 coins, today only ›</span></div>'
    : "";
  const freezeBtn = (S.freezes || 0) < 2
    ? ' <button class="btn ghost small" id="tdFreeze" style="padding:4px 10px;font-size:11.5px">Freeze · 150</button>' : "";
  return repair +
    '<div id="annSlot">' + annBannerHtml() + '</div>' +
    '<div class="card todaycard">' +
      '<div class="todayhead">' +
        '<b>Today' + tip("Your daily checklist. Complete the Daily Challenge and solve 10 problems to unlock the chest. Review and assignment work adds bonus coins to it.") + '</b>' +
        '<span class="todaystreak">🔥 ' + (S.streak || 0) + '<span class="tdfrz">❄ ' + (S.freezes || 0) + '</span>' +
          '<span class="tdfrz" style="color:var(--teal)" title="Fifty-Fifty hints: cross out two wrong choices">✂ ' + itemsOf().fifty + '</span>' +
          '<span class="tdfrz" style="color:var(--purple)" title="Piece Hints: reveal the winning piece">♞ ' + itemsOf().hintP + '</span>' + freezeBtn + '</span>' +
      '</div>' +
      rows + chest +
      '<div class="todayseason">' + seasonLabel((S.season || {}).id || todayStr().slice(0, 7)) + ' Season' +
        tip("Every point of XP also counts as season XP. When the month ends, season XP becomes coins, up to 500. Reach 1500 season XP for the exclusive Champion Aura.") +
        '<span class="num" style="margin-left:auto;font-weight:700;color:var(--purple)">' + ((S.season && S.season.xp) || 0) + ' XP</span>' +
      '</div>' +
      '<div class="todayasglink" id="tdAsgAll">Assignments' + (openA ? ' · <b style="color:var(--gold)">' + openA + ' open</b>' : '') +
        '<span style="margin-left:auto;color:var(--muted)">›</span></div>' +
    '</div>';
}
function bindTodayCard() {
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  on("tdDaily", startDaily);
  on("tdReview", startReview);
  on("tdAsg", showAssignmentsHome);
  on("tdAsgAll", showAssignmentsHome);
  on("tdChest", openChest);
  on("tdFreeze", buyFreeze);
  on("tdRepair", repairStreak);
  fetchAnnouncement();
}
function openChest() {
  const today = todayStr();
  if (S.chestOpenOn === today) return;
  const cnt = S.todayDate === today ? S.todayCount : 0;
  if (!(S.dailyDoneOn === today && cnt >= 10)) { toast("🎁", "The chest unlocks after the Daily Challenge and 10 solves."); return; }
  const loot = rollChest(10);
  const lines = [applyLoot(loot)];
  let bonus = 0;
  if (S.revToday && S.revToday.d === today && S.revToday.n > 0) bonus += 5;
  if (S.asgToday && S.asgToday.d === today && S.asgToday.n > 0) bonus += 5;
  if (bonus) { earnCoins(bonus); lines.push({ icon: coinIco(13), label: "+" + bonus + " bonus coins", sub: "" }); }
  S.chestOpenOn = today;
  save(); renderTopbar(); checkBadges();
  showChestAnim({
    lines, jackpot: loot.t === "jackpot", title: "Daily Chest",
    sub: "A new chest arrives tomorrow.",
    onDone: () => { if (typeof showHome === "function") showHome(); }
  });
}

/* ---- tiny reward icons, used wherever coins or chests are promised ---- */
function coinIco(sz) {
  return '<svg class="icoin" viewBox="0 0 20 20" width="' + sz + '" height="' + sz + '" aria-label="coins">' +
    '<circle cx="10" cy="10" r="8.4" fill="#d9a441" stroke="#8a6218" stroke-width="1.8"/>' +
    '<circle cx="10" cy="10" r="4.9" fill="none" stroke="#f5e0a8" stroke-width="1.6"/></svg>';
}
function chestIco(sz) {
  return '<svg class="ichest" viewBox="0 0 24 21" width="' + sz + '" height="' + Math.round(sz * 0.9) + '" aria-label="bonus chest">' +
    '<path d="M3 10 Q3 3 12 3 Q21 3 21 10 Z" fill="#7c5a30" stroke="#5c4210" stroke-width="1.4"/>' +
    '<rect x="3" y="10" width="18" height="9" rx="2.5" fill="#8a6a2e" stroke="#5c4210" stroke-width="1.4"/>' +
    '<rect x="9.5" y="7.5" width="5" height="7" rx="1.4" fill="#d9a441"/></svg>';
}

/* ---- answer outcome pie for the lifetime stats page ---- */
function accuracyPieHtml() {
  const f = S.tryFirst || 0, s = S.trySecond || 0, m = S.tryFailed || 0, q = S.tryQuit || 0;
  const total = f + s + m + q;
  if (!total) {
    return '<div class="card accpie"><p class="sub" style="margin:0;text-align:center">Answer questions and your accuracy picture appears here.</p></div>';
  }
  const segs = [
    { n: f, label: "Correct first try", color: "var(--green)" },
    { n: s, label: "Correct second try", color: "var(--teal)" },
    { n: m, label: "Missed both tries", color: "var(--orange)" },
    { n: q, label: "Gave up", color: "var(--red)" }
  ];
  const R = 40, C = 2 * Math.PI * R;
  let off = 0, rings = "";
  for (const g of segs) {
    if (!g.n) continue;
    const len = (g.n / total) * C;
    rings += '<circle cx="55" cy="55" r="' + R + '" fill="none" stroke="' + g.color + '" stroke-width="17" ' +
      'stroke-dasharray="' + Math.max(0, len - 1.5).toFixed(2) + ' ' + (C - Math.max(0, len - 1.5)).toFixed(2) + '" ' +
      'stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 55 55)"/>';
    off += len;
  }
  const accPct = (((f + s) / total) * 100).toFixed(1);
  const rows = segs.map(g =>
    '<div class="pierow"><span class="piedot" style="background:' + g.color + '"></span>' +
    '<span style="flex:1">' + g.label + '</span>' +
    '<b class="num">' + g.n.toLocaleString() + '</b>' +
    '<span class="num" style="color:var(--muted);width:46px;text-align:right">' + (g.n ? ((g.n / total) * 100).toFixed(1) : "0.0") + '%</span></div>').join("");
  return '<div class="card accpie">' +
    '<div class="piewrap"><svg viewBox="0 0 110 110" width="120" height="120">' + rings +
      '<text x="55" y="52" text-anchor="middle" style="font-size:19px;font-weight:800;fill:var(--ink)" class="num">' + accPct + '%</text>' +
      '<text x="55" y="68" text-anchor="middle" style="font-size:8.5px;fill:var(--muted);letter-spacing:.8px">ACCURATE</text>' +
    '</svg></div>' +
    '<div style="flex:1;min-width:0">' +
      '<b style="font-size:13px">How your answers land' + tip("Every training answer sorted by outcome. First-try solves build your rating fastest. Second-try solves still count as correct. Accuracy is all correct answers divided by everything you have attempted, including practice tests.") + '</b>' +
      rows +
    '</div>' +
  '</div>';
}

/* ---- power-up inventory: consumables that drop from chests ---- */
const POWERUPS = {
  fifty: { name: "Fifty-Fifty", icon: "✂", desc: "crosses out two wrong answer choices" },
  hintP: { name: "Piece Hint", icon: "♞", desc: "reveals the piece that makes the winning move" }
};
function itemsOf() {
  if (!S.items) S.items = { fifty: 0, hintP: 0 };
  if (S.items.fifty == null) S.items.fifty = 0;
  if (S.items.hintP == null) S.items.hintP = 0;
  return S.items;
}

/* ---- the loot table: nobody knows what a chest holds until it opens ---- */
function pickUnownedAcc() {
  const pool = ACC_DEFS.filter(a => !a.hidden && a.p > 0 && !accIsOwned(a.id));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
}
function rollChest(base) {
  const r = Math.random();
  if (r < 0.02) return { t: "jackpot", coins: 100 + base };
  if (r < 0.07) { const id = pickUnownedAcc(); if (id) return { t: "acc", id }; }
  if (r < 0.14 && (S.freezes || 0) < 2) return { t: "freeze", qty: 1 };
  if (r < 0.30) return { t: "fifty", qty: base >= 40 ? 2 : 1 };
  if (r < 0.46) return { t: "hintP", qty: base >= 40 ? 2 : 1 };
  return { t: "coins", coins: base + Math.floor(Math.random() * 21) };
}
function applyLoot(loot) {
  if (loot.t === "coins" || loot.t === "jackpot") {
    earnCoins(loot.coins);
    return { icon: coinIco(17), label: "+" + loot.coins + " coins", sub: loot.t === "jackpot" ? "the rare jackpot roll!" : "" };
  }
  if (loot.t === "freeze") {
    S.freezes = (S.freezes || 0) + loot.qty;
    return { icon: '<span style="color:#8fc7e8">❄</span>', label: loot.qty + "× Streak Freeze", sub: "saves your streak automatically when you miss a day" };
  }
  if (loot.t === "acc") {
    S.accOwned = S.accOwned || [];
    S.accOwned.push(loot.id);
    const a = ACC_DEFS.find(x => x.id === loot.id);
    return { icon: '<span style="color:var(--gold)">★</span>', label: (a ? a.name : "Accessory") + " unlocked", sub: "a new cosmetic is waiting in your Avatar Studio" };
  }
  const p = POWERUPS[loot.t];
  const it = itemsOf();
  it[loot.t] = (it[loot.t] || 0) + loot.qty;
  return { icon: '<span style="color:var(--teal)">' + p.icon + '</span>', label: loot.qty + "× " + p.name, sub: p.desc };
}

/* ---- in-question hint buttons ---- */
function hintBarHtml(kind, item) {
  if (typeof Q !== "undefined" && Q && Q.isChallenge) return "";   // fair play in head-to-head
  const it = itemsOf();
  if (kind === "mc") {
    if (!item.choices || item.choices.length < 4 || it.fifty < 1) return "";
    return '<div class="hintrow"><button class="btn ghost small" id="fiftyBtn">✂ Fifty-Fifty · ' + it.fifty + ' left</button>' +
      tip("Crosses out two wrong choices. Find more in chests.", true) + '</div>';
  }
  if (it.hintP < 1) return "";
  return '<div class="hintrow"><button class="btn ghost small" id="pieceHintBtn">♞ Piece Hint · ' + it.hintP + ' left</button>' +
    tip("Highlights the piece that makes the winning move. Find more in chests.", true) + '</div>';
}
function useFifty(item, btn) {
  const it = itemsOf();
  if (it.fifty < 1) return;
  const wrong = [];
  document.querySelectorAll(".choice").forEach(b => {
    const ci = +b.dataset.ci;
    if (b.disabled || b.classList.contains("wrong") || b.classList.contains("xout")) return;
    if (ci === item.ci || (item.ci2 != null && ci === item.ci2)) return;
    wrong.push(b);
  });
  if (wrong.length < 2) { toast("i", "Not enough choices are left to cross out."); return; }
  for (let k = 0; k < 2; k++) {
    const j = Math.floor(Math.random() * wrong.length);
    wrong[j].classList.add("xout");
    wrong[j].disabled = true;
    wrong.splice(j, 1);
  }
  it.fifty--;
  save();
  btn.closest(".hintrow").remove();
  Sfx.click();
  floatUp("✂ two wrong choices gone", "var(--teal)", 60);
}
function usePieceHint(btn) {
  const it = itemsOf();
  if (it.hintP < 1 || typeof BP === "undefined" || !BP || BP.done || BP.busy) return;
  const item = BP.item;
  let from = null;
  if (item.kind === "line") from = sqIdx(item.line[BP.lineIdx][0]);
  else if (item.kind === "mate2" && BP.phase === 1) from = sqIdx(item.solutions[0][0]);
  else { const m = findMateMoveFrom(BP.st); from = m ? m.from : (item.solutions ? sqIdx(item.solutions[0][0]) : null); }
  if (from == null) { toast("i", "No hint is available for this puzzle."); return; }
  BP.sel = from;
  redrawPuzzle();
  const tb = document.getElementById("puzzleTurn");
  if (tb) tb.innerHTML = "♞ This piece makes the winning move.";
  it.hintP--;
  save();
  btn.closest(".hintrow").remove();
  Sfx.click();
}

/* ---- chest opening ceremony: shake, burst, coins fly ---- */
const BADGE_CHEST = [0, 0, 25, 40, 75];   // Gold and above drop a mystery chest; higher tiers roll richer loot
function showChestAnim(opts) {
  if (document.getElementById("chestOv")) { setTimeout(() => showChestAnim(opts), 1800); return; }   // one ceremony at a time
  const ov = document.createElement("div");
  ov.id = "chestOv";
  ov.className = "chestov";
  const coinsN = Math.min(14, 6 + Math.floor((opts.coins || 0) / 12));
  let coinsHtml = "";
  for (let i = 0; i < coinsN; i++) {
    const ang = (i / coinsN) * Math.PI * 2 + 0.4;
    const dist = 70 + (i % 3) * 34;
    coinsHtml += '<span class="chcoin" style="--tx:' + Math.round(Math.cos(ang) * dist) + 'px;--ty:' + Math.round(-Math.abs(Math.sin(ang)) * dist - 44) + 'px;animation-delay:' + (0.05 * i).toFixed(2) + 's"></span>';
  }
  ov.innerHTML =
    '<div class="chestwrap">' +
      '<div class="chrays"></div>' +
      coinsHtml +
      '<svg class="chestsvg" viewBox="0 0 120 104" width="150" height="130">' +
        '<g class="cbase"><rect x="18" y="46" width="84" height="42" rx="8" fill="#8a6a2e"/><rect x="18" y="46" width="84" height="9" fill="#6e5326"/><rect x="27" y="46" width="6" height="42" fill="#6e5326" opacity=".6"/><rect x="87" y="46" width="6" height="42" fill="#6e5326" opacity=".6"/><rect x="53" y="50" width="14" height="18" rx="3" fill="#d9a441"/><circle cx="60" cy="58" r="2.6" fill="#5c4210"/></g>' +
        '<g class="clid"><path d="M18 46 Q18 14 60 14 Q102 14 102 46 Z" fill="#7c5a30"/><path d="M18 46 Q18 14 60 14 Q102 14 102 46" fill="none" stroke="#5c4210" stroke-width="3"/><rect x="53" y="34" width="14" height="12" rx="3" fill="#d9a441"/></g>' +
      '</svg>' +
      '<div class="chamount">' +
        (opts.lines || [{ icon: coinIco(17), label: "+" + opts.coins + " coins", sub: "" }]).map(l =>
          '<div class="chline">' + (l.icon || "") + '<span>' + l.label + '</span></div>' +
          (l.sub ? '<div class="chsub2">' + l.sub + '</div>' : '')).join("") +
      '</div>' +
      (opts.jackpot ? '<div class="chjack">JACKPOT!</div>' : '') +
      '<div class="chtitle">' + (opts.title || "Chest") + '</div>' +
      (opts.sub ? '<div class="chsub">' + opts.sub + '</div>' : '') +
      '<div class="chtap">Tap to collect</div>' +
    '</div>';
  document.body.appendChild(ov);
  Sfx.almost();
  setTimeout(() => {
    if (!document.getElementById("chestOv")) return;
    ov.classList.add("open");
    Sfx.badge();
    confetti(opts.jackpot ? 80 : 30);
  }, 950);
  let done = false;
  const finish = () => { if (done) return; done = true; ov.remove(); if (opts.onDone) opts.onDone(); };
  ov.addEventListener("click", finish);
  setTimeout(finish, 5000);   // never trap the player
}

/* ---- session end: what tomorrow holds ---- */
function tomorrowHookHtml() {
  const n = Object.keys(S.reviewQueue || {}).length;
  let msg = "Tomorrow brings a fresh Daily Challenge and a new chest";
  if (n) msg += ", plus " + n + " review problem" + (n === 1 ? "" : "s") + " to conquer";
  return '<div class="tmrwline">' + msg + '.</div>';
}

/* ---- onboarding: a three-problem welcome quest for brand-new students ---- */
function startOnboarding() {
  let bestTid = null, bestPool = [];
  MATH_TOPICS.forEach(t => {
    const pool = [];
    t.problems.forEach((p, gi) => {
      if (p.type !== "board" && (p.diff || 1) === 1 && (p.er || 1200) <= 900) pool.push(gi);
    });
    if (pool.length > bestPool.length) { bestTid = t.id; bestPool = pool; }
  });
  if (!bestTid || bestPool.length < 3) { S.onboarded = 1; save(); showHome(); return; }
  const items = topicItems(bestTid);
  const entries = [];
  const used = {};
  while (entries.length < 3) {
    const j = bestPool[Math.floor(Math.random() * bestPool.length)];
    if (used[j]) continue;
    used[j] = 1;
    entries.push({ item: items[j], gi: j, tid: bestTid });
  }
  Q = {
    topicId: bestTid, entries, i: 0, target: 3,
    correctThisRun: 0, xpThisRun: 0, eloStart: eloOf("math"),
    lesson: "Welcome to MindMasters Academy! Warm up with three quick problems. Answer, read the solution, and collect your first coins at the end.",
    name: "Welcome Quest", icon: "🌟",
    track: "math", isDaily: false, isOnboard: true, replayAll: false
  };
  renderQuestion(true);
}
function finishOnboarding() {
  S.onboarded = 1;
  earnCoins(50);
  save(); renderTopbar(); checkBadges();
  confetti(60); Sfx.level();
  setScreen(
    '<div class="card results">' +
      '<div style="font-size:44px;margin-bottom:4px">🎉</div>' +
      '<h2>Welcome aboard, ' + esc(S.name) + '</h2>' +
      '<div class="score">Welcome Quest complete · ' + Q.correctThisRun + ' / 3 correct · <b style="color:var(--gold)">+50 coins</b></div>' +
      '<div class="lessonbox" style="text-align:left;margin-top:14px">Here is how MindMasters works. ' +
        'Your <b>Today</b> checklist unlocks a mystery chest every day, holding coins, cosmetics, or power-ups. ' +
        'Your welcome pack already has a <b>✂ Fifty-Fifty</b> (crosses out two wrong choices) and a <b>♞ Piece Hint</b> (reveals the winning chess piece). ' +
        'Solving problems raises your <b>rating</b>, and math plus chess together form your <b>Mind Rating</b>. ' +
        'Coins buy characters, skins and accessories in the <b>Avatar Studio</b>. ' +
        'Come back tomorrow to start your streak.</div>' +
      '<div style="margin-top:16px"><button class="btn gold" id="obDone" style="font-size:15px;padding:12px 30px">Go to my dashboard</button></div>' +
    '</div>'
  );
  document.getElementById("obDone").addEventListener("click", showHome);
}

/* ---- friend challenges: five problems, one code, head to head ---- */
function challengeCode(name, refs, score) {
  const payload = JSON.stringify([name, refs, score]);
  return "MMC1-" + btoa(unescape(encodeURIComponent(payload))) + "-" + lbHash(payload);
}
function parseChallengeCode(str) {
  const m = String(str).trim().match(/^MMC1-([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) return null;
  let payload;
  try { payload = decodeURIComponent(escape(atob(m[1]))); } catch (e) { return null; }
  if (lbHash(payload) !== m[2]) return null;
  let arr;
  try { arr = JSON.parse(payload); } catch (e) { return null; }
  if (!Array.isArray(arr) || arr.length < 3 || !Array.isArray(arr[1])) return null;
  const refs = arr[1].filter(r => Array.isArray(r) && typeof r[0] === "string" && Number.isInteger(r[1]) && refItem(r));
  if (refs.length < 3 || refs.length > 8) return null;
  const score = parseInt(arr[2], 10);
  return { name: String(arr[0]).slice(0, 20) || "Challenger", refs, score: isNaN(score) ? 0 : Math.max(0, Math.min(refs.length, score)) };
}
function challengeKey(refs) { return lbHash(JSON.stringify(refs)); }

function showChallengeHub() {
  renderTopbar(); setNav("battle");
  const chs = Object.entries(S.challenges || {}).sort((a, b) => String(b[1].d).localeCompare(String(a[1].d)));
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Friend Challenge</h1>' +
    '<p class="sub">Five problems, one code. Send it to a friend and see who scores higher.</p></div></div>' +
    '<div class="card" style="padding:16px 18px;text-align:center">' +
      '<b>Start a new challenge' + tip("You play five math problems near your rating first. Then you get a code to send. Your friend plays the same five problems and you compare scores. Winning a challenge pays 25 coins.") + '</b>' +
      '<div style="margin-top:10px"><button class="btn gold" id="newChal">Play my five problems</button></div>' +
    '</div>' +
    '<div class="card" style="padding:14px 18px">' +
      '<b>Enter a code</b>' +
      '<textarea class="codebox" id="chalInput" placeholder="Paste an MMC1- code from a friend" style="margin-top:8px"></textarea>' +
      '<button class="btn gold small" id="chalGo" style="margin-top:8px">Accept</button>' +
    '</div>' +
    (chs.length ? '<div class="section-label">Your challenges</div>' + chs.map(([k, c]) => {
      const settled = c.theirs != null;
      const res = !settled ? '<span style="color:var(--muted);font-size:12px">waiting for reply</span>'
        : c.mine > c.theirs ? '<span style="color:var(--green);font-weight:700">Won</span>'
        : c.mine < c.theirs ? '<span style="color:var(--red);font-weight:700">Lost</span>'
        : '<span style="color:var(--gold);font-weight:700">Tie</span>';
      return '<div class="card" style="padding:12px 18px;display:flex;align-items:center;gap:12px">' +
        '<div style="flex:1"><b>' + (settled ? "You vs " + esc(c.vs || "?") : "Open challenge") + '</b>' +
        '<div style="font-size:12px;color:var(--muted)">' + esc(c.d || "") + ' · you ' + c.mine + '/' + c.total + (settled ? ' · them ' + c.theirs + '/' + c.total : '') + '</div></div>' +
        res + '</div>';
    }).join("") : '')
  );
  document.getElementById("backBtn").addEventListener("click", showBattle);
  document.getElementById("newChal").addEventListener("click", startChallengeCreate);
  document.getElementById("chalGo").addEventListener("click", () => acceptChallengeInput(document.getElementById("chalInput").value));
}
function challengePickRefs() {
  const elo = eloOf("math");
  let best = null, bestPool = [];
  for (const spread of [180, 300, 500, 5000]) {
    MATH_TOPICS.forEach(t => {
      const pool = [];
      t.problems.forEach((p, gi) => {
        if (p.type !== "board" && Math.abs((p.er || 1200) - elo) <= spread) pool.push(gi);
      });
      if (pool.length > bestPool.length) { best = t.id; bestPool = pool; }
    });
    if (bestPool.length >= 5) break;
  }
  if (!best || bestPool.length < 5) return null;
  const refs = [], used = {};
  while (refs.length < 5) {
    const j = bestPool[Math.floor(Math.random() * bestPool.length)];
    if (used[j]) continue;
    used[j] = 1;
    refs.push([best, j]);
  }
  return refs;
}
function startChallengeRun(refs, mode, rival) {
  const entries = refs.map(r => ({ item: refItem(r), gi: r[1], tid: r[0] }));
  Q = {
    topicId: refs[0][0], entries, i: 0, target: entries.length,
    correctThisRun: 0, xpThisRun: 0, eloStart: eloOf("math"),
    lesson: mode === "accept"
      ? esc(rival.name) + " scored on these exact five problems. Beat that score to win 25 coins. Ratings do not change in challenges."
      : "These five problems become your challenge. Score high, then send the code. Ratings do not change in challenges.",
    name: "Friend Challenge", icon: "⚔",
    track: "math", isDaily: false, replayAll: false,
    isChallenge: mode === "accept" ? { mode: "accept", name: rival.name, score: rival.score, refs } : { mode: "create", refs }
  };
  renderQuestion(true);
}
function startChallengeCreate() {
  const refs = challengePickRefs();
  if (!refs) { toast("!", "Not enough math problems near your rating for a challenge."); return; }
  startChallengeRun(refs, "create");
}
function acceptChallengeInput(raw) {
  const code = (String(raw).match(/MMC1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/) || [])[0];
  const p = code && parseChallengeCode(code);
  if (!p) { toast("!", "No valid challenge code found. Codes start with MMC1-."); return; }
  S.challenges = S.challenges || {};
  const key = challengeKey(p.refs);
  const mine = S.challenges[key];
  if (mine && mine.theirs == null) {
    /* this is a reply to a challenge you created */
    mine.theirs = p.score;
    mine.vs = p.name;
    const win = mine.mine > p.score;
    if (win) earnCoins(25);
    save(); renderTopbar();
    showChallengeCompare(mine, win && 25);
    return;
  }
  if (mine && mine.theirs != null) { toast("i", "You have already settled this challenge with " + esc(mine.vs || "your friend") + "."); return; }
  askConfirm("Accept this challenge?", esc(p.name) + " scored " + p.score + "/" + p.refs.length + " on five problems. Play the same five now?", "Play", () => startChallengeRun(p.refs, "accept", p));
}
function finishChallenge() {
  const ch = Q.isChallenge;
  const total = Q.entries.length;
  const myScore = Q.correctThisRun;
  const myName = (S.name || "Player").replace(/\|/g, " ").slice(0, 20);
  const code = challengeCode(myName, ch.refs, myScore);
  S.challenges = S.challenges || {};
  const key = challengeKey(ch.refs);
  if (ch.mode === "accept") {
    const win = myScore > ch.score;
    if (win) earnCoins(25);
    S.challenges[key] = { vs: ch.name, mine: myScore, theirs: ch.score, total, d: todayStr() };
    save(); renderTopbar(); checkBadges();
    showChallengeCompare(S.challenges[key], win && 25, code);
  } else {
    S.challenges[key] = { vs: "", mine: myScore, theirs: null, total, d: todayStr() };
    save(); renderTopbar();
    setScreen(
      '<div class="card results">' +
        '<div class="num" style="font-size:44px;font-weight:700;color:var(--gold)">' + myScore + ' / ' + total + '</div>' +
        '<h2>Your challenge is ready</h2>' +
        '<div class="score">Send this code to a friend. When they send back their reply code, paste it in Friend Challenge to see who won.</div>' +
        '<div class="mycode" style="text-align:left;margin-top:12px">' + code + '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px">' +
          '<button class="btn small" id="copyChal">Copy code</button>' +
          '<button class="btn ghost small" id="chalBack">Done</button>' +
        '</div>' +
      '</div>'
    );
    document.getElementById("copyChal").addEventListener("click", () => {
      const done = () => toast("✓", "Challenge code copied. Send it to a friend.");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
      else fallbackCopy(code, done);
    });
    document.getElementById("chalBack").addEventListener("click", showChallengeHub);
  }
}
function showChallengeCompare(rec, coinsWon, replyCode) {
  const win = rec.mine > rec.theirs, tie = rec.mine === rec.theirs;
  if (win) { confetti(50); Sfx.level(); } else Sfx.almost();
  setScreen(
    '<div class="card results">' +
      '<h2 style="margin-top:6px">' + (win ? "Victory!" : tie ? "A perfect tie" : "So close") + '</h2>' +
      '<div class="chalcompare">' +
        '<div class="chalside me"><div class="cname">' + esc(S.name || "You") + '</div><div class="cscore num">' + rec.mine + '</div></div>' +
        '<div class="chalvs">vs</div>' +
        '<div class="chalside"><div class="cname">' + esc(rec.vs || "Friend") + '</div><div class="cscore num">' + rec.theirs + '</div></div>' +
      '</div>' +
      '<div class="score">' + (win ? "You outscored " + esc(rec.vs || "your friend") + (coinsWon ? " and earned " + coinsWon + " coins." : ".")
        : tie ? "Equal minds think alike. No coins change hands." : esc(rec.vs || "Your friend") + " takes this one. Challenge them again!") + '</div>' +
      (replyCode ? '<div class="mycode" style="text-align:left;margin-top:12px">' + replyCode + '</div>' +
        '<p class="sub" style="margin-top:6px">Send this reply code back so they see the result too.</p>' : '') +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px">' +
        (replyCode ? '<button class="btn small" id="copyReply">Copy reply code</button>' : '') +
        '<button class="btn ghost small" id="chalBack">Done</button>' +
      '</div>' +
    '</div>'
  );
  const cr = document.getElementById("copyReply");
  if (cr) cr.addEventListener("click", () => {
    const done = () => toast("✓", "Reply code copied.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(replyCode).then(done).catch(() => fallbackCopy(replyCode, done));
    else fallbackCopy(replyCode, done);
  });
  document.getElementById("chalBack").addEventListener("click", showChallengeHub);
}

/* ---- daily studio deal: one accessory discounted, seeded by the date ---- */
function dailyDeal() {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  const pool = ACC_DEFS.filter(a => !a.hidden && a.p > 0);
  if (!pool.length) return null;
  const a = pool[seed % pool.length];
  return { id: a.id, price: Math.max(50, Math.round(a.p * 0.6 / 10) * 10) };
}
function accPrice(a) {
  const deal = dailyDeal();
  return deal && deal.id === a.id ? deal.price : a.p;
}
