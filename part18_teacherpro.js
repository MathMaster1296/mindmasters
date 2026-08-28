/* ================= TEACHER POWER PACK =================
   Roster (works offline through student codes), per-student detail pages,
   missing-work flags, per-problem analytics, CSV exports, printable class
   reports, teacher bonus codes, and class announcements.
   Functions only; shared state is touched at call time. */

/* ---- roster: the teacher's own copy of the class list ---- */
function rosterOf(cls) {
  if (!cls.roster) cls.roster = {};
  return cls.roster;
}
function rosterFromCodes(cls, raw) {
  const found = String(raw).match(/MM1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/g) || [];
  let added = 0, bad = 0;
  const roster = rosterOf(cls);
  for (const c of found) {
    const e = parseClassCode(c);
    if (!e) { bad++; continue; }
    const k = lbKeyOf(e.name);
    if (!roster[k] || String(e.ts) >= String(roster[k].ts || "")) { roster[k] = Object.assign({ src: "code" }, e); added++; }
  }
  saveTS();
  return { added, bad, found: found.length };
}
function rosterImportCloud(cls, cb) {
  if (!clsCloudOk(cls)) { if (cb) cb(null); return; }
  try {
    fetch(clsCloudPath(cls) + ".json").then(r => r.json()).then(data => {
      let n = 0;
      const roster = rosterOf(cls);
      if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          if (k === "assignments" || k === "subs" || k === "announce") continue;
          if (v && typeof v === "object" && v.name) {
            roster[k] = {
              src: "cloud", name: String(v.name).slice(0, 20), xp: +v.xp || 0, m: +v.m || 800, c: +v.c || 800,
              mg: +v.mg || 0, cg: +v.cg || 0, st: +v.st || 0, bd: +v.bd || 0, ct: +v.ct || 0,
              ts: String(v.ts || "").slice(0, 10), da: +v.da || 0, sx: +v.sx || 0
            };
            n++;
          }
        }
      }
      saveTS();
      if (cb) cb(n);
    }).catch(() => { if (cb) cb(null); });
  } catch (e) { if (cb) cb(null); }
}
function quietDaysOf(ts) {
  if (!ts) return 999;
  const d = Math.round((new Date(todayStr()) - new Date(String(ts).slice(0, 10))) / 86400000);
  return isNaN(d) ? 999 : Math.max(0, d);
}
function activityFlag(ts) {
  const q = quietDaysOf(ts);
  if (q === 0) return '<span style="color:var(--green);font-weight:700">active today</span>';
  if (q >= 7) return '<span style="color:var(--red);font-weight:700">quiet ' + q + ' days</span>';
  if (q >= 3) return '<span style="color:var(--orange);font-weight:700">quiet ' + q + ' days</span>';
  return '<span style="color:var(--muted)">' + q + (q === 1 ? ' day ago' : ' days ago') + '</span>';
}

/* ---- teacher bonus codes: reward the class, one redeem per student ---- */
const BONUS_KINDS = {
  c25: { name: "25 coins", apply: () => [applyLoot({ t: "coins", coins: 25 })] },
  c50: { name: "50 coins", apply: () => [applyLoot({ t: "coins", coins: 50 })] },
  c100: { name: "100 coins", apply: () => [applyLoot({ t: "coins", coins: 100 })] },
  pack: { name: "Power-up pack", apply: () => [applyLoot({ t: "fifty", qty: 1 }), applyLoot({ t: "hintP", qty: 1 })] },
  freeze: { name: "Streak freeze", apply: () => [applyLoot({ t: "freeze", qty: 1 })] }
};
function bonusCode(kind, teacherName, clsName) {
  const id = Math.random().toString(36).slice(2, 10);
  const payload = JSON.stringify([id, kind, String(teacherName || "").slice(0, 20), String(clsName || "").slice(0, 30)]);
  return "MMB1-" + btoa(unescape(encodeURIComponent(payload))) + "-" + lbHash(payload);
}
function parseBonusCode(str) {
  const m = String(str).trim().match(/^MMB1-([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) return null;
  let payload;
  try { payload = decodeURIComponent(escape(atob(m[1]))); } catch (e) { return null; }
  if (lbHash(payload) !== m[2]) return null;
  let arr;
  try { arr = JSON.parse(payload); } catch (e) { return null; }
  if (!Array.isArray(arr) || arr.length < 4 || !BONUS_KINDS[arr[1]]) return null;
  return { id: String(arr[0]).slice(0, 12), kind: arr[1], teacher: String(arr[2]).slice(0, 20), cls: String(arr[3]).slice(0, 30) };
}
function redeemBonus(codeStr) {
  const p = parseBonusCode(codeStr);
  if (!p) return false;
  S.redeemed = S.redeemed || {};
  if (S.redeemed[p.id]) { toast("i", "You have already redeemed that bonus code."); return false; }
  S.redeemed[p.id] = todayStr();
  const lines = BONUS_KINDS[p.kind].apply();
  save(); renderTopbar(); checkBadges();
  showChestAnim({
    lines, title: "Teacher Bonus",
    sub: "A gift from " + (p.teacher ? esc(p.teacher) : "your teacher") + (p.cls ? " · " + esc(p.cls) : "")
  });
  return true;
}

/* ---- announcements: one message from coach to every student ---- */
function publishAnnouncement(cls, msg, cb) {
  if (!clsCloudOk(cls)) { if (cb) cb(false); return; }
  try {
    fetch(clsCloudPath(cls) + "/announce.json", {
      method: "PUT",
      body: JSON.stringify(msg ? { msg: String(msg).slice(0, 200), teacher: loadTS().name, ts: todayStr() } : null)
    }).then(r => cb && cb(r.ok)).catch(() => cb && cb(false));
  } catch (e) { if (cb) cb(false); }
}
function annBannerHtml() {
  const a = S.lastAnn;
  if (!a || !a.msg || quietDaysOf(a.ts) > 14) return "";
  return '<div class="card annbanner">📣 <b>' + esc(a.teacher || "Coach") + ':</b> <span style="flex:1">' + esc(a.msg) + '</span>' +
    '<span style="color:var(--muted);font-size:11px;white-space:nowrap">' + esc(a.ts || "") + '</span></div>';
}
function fetchAnnouncement() {
  if (typeof cloudCfgOk !== "function" || !cloudCfgOk()) return;
  const now = Date.now();
  if (window.__annT && now - window.__annT < 600000) return;   // at most every 10 minutes
  window.__annT = now;
  try {
    fetch(cloudPath() + "/announce.json").then(r => r.json()).then(v => {
      S.lastAnn = (v && v.msg)
        ? { msg: String(v.msg).slice(0, 200), teacher: String(v.teacher || "").slice(0, 20), ts: String(v.ts || "").slice(0, 10) }
        : null;
      save();
      const slot = document.getElementById("annSlot");
      if (slot) slot.innerHTML = annBannerHtml();
    }).catch(() => {});
  } catch (e) {}
}

/* ---- CSV export ---- */
function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function dlText(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
}
function rosterCsv(cls) {
  const rows = [["Name", "Math rating", "Chess rating", "Mind rating", "XP", "Season XP", "Streak", "Days active", "Solved", "Badges", "Last active"]];
  for (const r of Object.values(rosterOf(cls))) {
    const mind = (r.mg >= 5 && r.cg >= 5) ? Math.round((r.m + r.c) / 2) : "";
    rows.push([r.name, r.m, r.c, mind, r.xp, r.sx || 0, r.st, r.da || 0, r.ct, r.bd, r.ts]);
  }
  return rows.map(r => r.map(csvCell).join(",")).join("\n");
}
function resultsCsv(cls, a, subs) {
  const head = ["Name", "Score", "Total", "Date"].concat(a.probs.map((p, i) => "P" + (i + 1)));
  const rows = [head];
  for (const su of Object.values(subs)) {
    const per = a.probs.map((p, i) => (su.mask || "")[i] === "1" ? "right" : (su.mask || "")[i] === "0" ? "wrong" : "");
    rows.push([su.name, su.score, su.total, su.ts].concat(per));
  }
  return rows.map(r => r.map(csvCell).join(",")).join("\n");
}

/* ---- per-assignment analytics ---- */
function asgAnalysisHtml(cls, a, subs) {
  const keys = Object.keys(subs);
  let html = "";
  const roster = rosterOf(cls);
  const rosterKeys = Object.keys(roster);
  if (rosterKeys.length) {
    const missing = rosterKeys.filter(k => !subs[k]).map(k => roster[k].name);
    html += '<div class="card" style="padding:12px 18px;border-color:' + (missing.length ? 'var(--orange)' : 'var(--green)') + '">' +
      (missing.length
        ? '<b style="color:var(--orange)">Not yet submitted (' + missing.length + '):</b> <span style="color:var(--muted)">' + missing.map(esc).join(", ") + '</span>'
        : '<b style="color:var(--green)">Everyone on the roster has submitted.</b>') + '</div>';
  }
  if (keys.length) {
    const nP = a.probs.length;
    const right = new Array(nP).fill(0), tot = new Array(nP).fill(0);
    keys.forEach(k => {
      const m = subs[k].mask || "";
      for (let i = 0; i < nP; i++) { if (m[i] === "1") { right[i]++; tot[i]++; } else if (m[i] === "0") tot[i]++; }
    });
    let hardest = -1, hardPct = 101;
    const rows = a.probs.map((p, i) => {
      const pct = tot[i] ? Math.round((right[i] / tot[i]) * 100) : 100;
      if (tot[i] && pct < hardPct) { hardPct = pct; hardest = i; }
      const col = pct >= 70 ? "var(--green)" : pct >= 40 ? "var(--orange)" : "var(--red)";
      return '<div class="pierow"><span class="num" style="color:var(--muted);width:24px">#' + (i + 1) + '</span>' +
        '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">' + esc(refLabel(refItem(p))) + '</span>' +
        '<span class="tpbar" style="display:block;width:90px;height:6px;flex:none;background:var(--bg);border-radius:99px;overflow:hidden"><span style="display:block;height:100%;width:' + pct + '%;background:' + col + ';border-radius:99px"></span></span>' +
        '<b class="num" style="width:56px;text-align:right;color:' + col + '">' + right[i] + '/' + tot[i] + '</b></div>';
    }).join("");
    html += '<div class="section-label">Problem breakdown' + tip("How the class did on every problem, from all collected results. Red problems are the ones to go over together.") + '</div>' +
      '<div class="card" style="padding:12px 18px">' + rows +
      (hardest >= 0 && hardPct < 60
        ? '<div style="margin-top:10px;padding:9px 12px;border-radius:10px;background:rgba(201,111,111,.1);border:1px solid var(--red);font-size:12.5px">' +
          '<b>Reteach candidate:</b> problem #' + (hardest + 1) + ' (' + esc(refLabel(refItem(a.probs[hardest]))) + ') was solved by only ' + hardPct + '% of the class.</div>'
        : '') +
      '<div style="margin-top:10px"><button class="btn ghost small noprint" id="csvResults">Export results as CSV</button></div>' +
      '</div>';
  }
  return html;
}
function bindAsgAnalysis(cls, a, subs) {
  const b = document.getElementById("csvResults");
  if (b) b.addEventListener("click", () => { dlText(a.title.replace(/[^a-z0-9]+/gi, "_") + "_results.csv", resultsCsv(cls, a, subs)); toast("✓", "Results exported. Check your downloads."); });
}

/* ---- class screen extras: roster, rewards, announcement, report ---- */
function classExtrasHtml(cls) {
  const roster = rosterOf(cls);
  const entries = Object.values(roster).sort((x, y) => quietDaysOf(x.ts) - quietDaysOf(y.ts) || (y.xp || 0) - (x.xp || 0));
  const quietN = entries.filter(r => quietDaysOf(r.ts) >= 3).length;
  const rows = entries.map(r => {
    const k = lbKeyOf(r.name);
    const mind = (r.mg >= 5 && r.cg >= 5) ? Math.round((r.m + r.c) / 2) : null;
    return '<div class="pickrow stuRow" data-k="' + k + '" style="cursor:pointer">' +
      '<div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(r.name) + '</b>' +
      '<div style="font-size:11.5px;color:var(--muted)">Math ' + r.m + ' · Chess ' + r.c + (mind ? ' · Mind ' + mind : '') + ' · 🔥 ' + r.st + '</div></div>' +
      activityFlag(r.ts) +
      '<button class="lx stuRm" data-k="' + k + '" title="Remove">✕</button></div>';
  }).join("");
  return '<div class="section-label" style="display:flex;align-items:center;gap:10px">Roster' +
      tip("Your class list with live progress. Add students by pasting their class codes (from their Leaderboard screen), or import everyone from the Class Cloud in one tap.") +
      '<span class="cloudtag ' + (entries.length ? "on" : "off") + '">' + entries.length + (entries.length === 1 ? ' student' : ' students') + '</span>' +
      (quietN ? '<span style="color:var(--orange);font-size:12px;font-weight:700">' + quietN + ' quiet 3+ days</span>' : '') +
    '</div>' +
    (entries.length
      ? '<div class="card" style="padding:9px 18px 12px">' + rows + '</div>'
      : '<div class="card" style="padding:14px 18px"><p class="sub" style="margin:0">No students yet. Paste their codes below' + (clsCloudOk(cls) ? ' or import from the Class Cloud.' : '.') + '</p></div>') +
    '<div class="card" style="padding:14px 18px">' +
      '<b style="font-size:13px">Add students</b>' +
      '<textarea class="codebox" id="rosterInput" placeholder="Paste MM1- codes from students, one or many" style="margin-top:8px"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button class="btn gold small" id="rosterAdd">Add to roster</button>' +
        (clsCloudOk(cls) ? '<button class="btn ghost small" id="rosterCloud">Import from Class Cloud</button>' : '') +
        (entries.length ? '<button class="btn ghost small" id="rosterCsv">Export CSV</button>' : '') +
        (entries.length ? '<button class="btn ghost small" id="classReport">Class report</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="section-label">Reward the class' + tip("Generate a bonus code and read it out or write it on the board. Each student can redeem it once, in their Assignments screen. It arrives as a treasure chest.") + '</div>' +
    '<div class="card" style="padding:14px 18px">' +
      '<div class="diffchips" style="justify-content:flex-start;margin:0 0 4px">' +
        Object.entries(BONUS_KINDS).map(([k, v]) => '<button class="diffchip" data-bonus="' + k + '">' + v.name + '</button>').join("") +
      '</div>' +
      '<div id="bonusOut"></div>' +
    '</div>' +
    (clsCloudOk(cls)
      ? '<div class="section-label">Announcement' + tip("One message every student sees on their home screen, delivered through the Class Cloud. Publish an empty message to clear it.") + '</div>' +
        '<div class="card" style="padding:14px 18px">' +
        '<input class="lbinput" id="annInput" maxlength="200" placeholder="For example: Chapter 5 quiz on Friday. Finish Week 3 homework." autocomplete="off">' +
        '<button class="btn gold small" id="annPub" style="margin-top:6px">Publish to class</button>' +
        '</div>'
      : '');
}
function bindClassExtras(cid) {
  const cls = classById(cid);
  document.querySelectorAll(".stuRow").forEach(el => el.addEventListener("click", e => {
    if (e.target.classList.contains("stuRm")) return;
    showStudentDetail(cid, el.dataset.k);
  }));
  document.querySelectorAll(".stuRm").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    delete rosterOf(cls)[b.dataset.k];
    saveTS(); showClass(cid);
  }));
  const ra = document.getElementById("rosterAdd");
  if (ra) ra.addEventListener("click", () => {
    const res = rosterFromCodes(cls, document.getElementById("rosterInput").value);
    if (res.added) { toast("✓", res.added + (res.added === 1 ? " student added." : " students added.")); showClass(cid); }
    else toast("!", res.found ? "Those codes were invalid or already saved." : "No codes found. Student codes start with MM1-.");
  });
  const rc = document.getElementById("rosterCloud");
  if (rc) rc.addEventListener("click", () => {
    rc.textContent = "Importing…";
    rosterImportCloud(cls, n => {
      if (n === null) { toast("!", "Could not reach the Class Cloud."); rc.textContent = "Import from Class Cloud"; return; }
      toast("✓", n + (n === 1 ? " student imported." : " students imported."));
      showClass(cid);
    });
  });
  const rx = document.getElementById("rosterCsv");
  if (rx) rx.addEventListener("click", () => { dlText(cls.name.replace(/[^a-z0-9]+/gi, "_") + "_roster.csv", rosterCsv(cls)); toast("✓", "Roster exported. Check your downloads."); });
  const rp = document.getElementById("classReport");
  if (rp) rp.addEventListener("click", () => showClassReport(cid));
  document.querySelectorAll("[data-bonus]").forEach(b => b.addEventListener("click", () => {
    const code = bonusCode(b.dataset.bonus, loadTS().name, cls.name);
    document.getElementById("bonusOut").innerHTML =
      '<div class="mycode" style="margin-top:6px">' + code + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn small" id="bonusCopy">Copy code</button>' +
        '<span class="sub" style="font-size:11.5px">' + BONUS_KINDS[b.dataset.bonus].name + ' · each student redeems once</span></div>';
    document.getElementById("bonusCopy").addEventListener("click", () => {
      const done = () => toast("✓", "Bonus code copied.");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
      else fallbackCopy(code, done);
    });
    Sfx.click();
  }));
  const ap = document.getElementById("annPub");
  if (ap) ap.addEventListener("click", () => {
    const msg = document.getElementById("annInput").value.trim();
    publishAnnouncement(cls, msg, ok2 => {
      toast(ok2 ? "✓" : "!", ok2 ? (msg ? "Announcement published. Students see it on their home screen." : "Announcement cleared.") : "Could not reach the Class Cloud.");
    });
  });
}

/* ---- per-student detail page ---- */
function showStudentDetail(cid, key) {
  const cls = classById(cid);
  const r = cls && rosterOf(cls)[key];
  if (!r) { showClass(cid); return; }
  const mind = (r.mg >= 5 && r.cg >= 5) ? Math.round((r.m + r.c) / 2) : null;
  const subRows = [];
  for (const [aid, m] of Object.entries(cls.subs || {})) {
    if (m[key]) {
      const a = asgById(cls, aid);
      subRows.push({ title: a ? a.title : "Assignment " + aid, su: m[key] });
    }
  }
  const tile = (v, l, c) => '<div class="stattile"><div class="sv" style="color:' + (c || "var(--ink)") + '">' + v + '</div><div class="sl">' + l + '</div></div>';
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← ' + esc(cls.name) + '</button>' +
    '<div style="flex:1"><h1 class="title" style="font-size:21px">' + esc(r.name) + '</h1>' +
    '<p class="sub">Last active ' + esc(r.ts || "unknown") + ' · ' + (quietDaysOf(r.ts) >= 3 ? 'needs a nudge' : 'training regularly') + '</p></div></div>' +
    '<div class="statgrid">' +
      tile(r.m, "Math Rating", "var(--blue)") +
      tile(r.c, "Chess Rating", "var(--purple)") +
      tile(mind || "–", "Mind Rating", "var(--gold)") +
      tile(r.xp.toLocaleString(), "All-time XP", "var(--teal)") +
      tile((r.sx || 0).toLocaleString(), "Season XP", "var(--purple)") +
      tile(r.st, "Day Streak", "var(--orange)") +
      tile(r.da || 0, "Days Active", "var(--teal)") +
      tile(r.ct.toLocaleString(), "Solved", "var(--green)") +
      tile(r.bd, "Badges", "var(--gold)") +
    '</div>' +
    '<div class="section-label">Assignment history</div>' +
    (subRows.length ? subRows.map(x =>
      '<div class="card" style="padding:11px 18px;display:flex;align-items:center;gap:12px">' +
        '<b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(x.title) + '</b>' +
        '<span style="display:flex;gap:3px;flex-wrap:wrap;max-width:45%">' +
          (x.su.mask || "").split("").map(ch => '<span class="subcell ' + (ch === "1" ? "ok" : "no") + '"></span>').join("") + '</span>' +
        '<span class="num" style="font-weight:700;color:var(--gold)">' + x.su.score + '/' + x.su.total + '</span>' +
      '</div>').join("")
      : '<div class="card" style="padding:16px 18px;text-align:center"><p class="sub" style="margin:0">No collected results for this student yet.</p></div>') +
    '<p class="sub" style="margin-top:10px">Snapshot from ' + esc(r.ts || "their last shared code") + '. Refresh the roster with a newer code or a cloud import for current numbers.</p>'
  );
  document.getElementById("backBtn").addEventListener("click", () => showClass(cid));
}

/* ---- printable class report ---- */
function showClassReport(cid) {
  const cls = classById(cid);
  if (!cls) return;
  const entries = Object.values(rosterOf(cls)).sort((a, b) => (b.xp || 0) - (a.xp || 0));
  const asgs = (cls.assignments || []);
  const asgSummary = asgs.map(a => {
    const subs = (cls.subs || {})[a.id] || {};
    const scores = Object.values(subs);
    const avg = scores.length ? Math.round(scores.reduce((s, x) => s + (x.score / x.total) * 100, 0) / scores.length) : null;
    return { a, n: scores.length, avg };
  });
  teacherShell(
    '<div class="backrow noprint"><button class="btn ghost small" id="backBtn">← ' + esc(cls.name) + '</button>' +
    '<div style="flex:1"><h1 class="title" style="font-size:21px">Class Report</h1></div>' +
    '<button class="btn gold small" id="printBtn">Print or save as PDF</button></div>' +
    '<div class="card rptcard" style="padding:18px 22px">' +
      '<h2 style="margin:0 0 2px">' + esc(cls.name) + '</h2>' +
      '<p class="sub" style="margin:0 0 14px">MindMasters Academy class report · ' + todayStr() + ' · ' + esc(loadTS().name || "") + '</p>' +
      '<b style="font-size:13px">Students (' + entries.length + ')</b>' +
      '<table class="rpt"><tr><th>Name</th><th>Math</th><th>Chess</th><th>Mind</th><th>XP</th><th>Streak</th><th>Solved</th><th>Last active</th></tr>' +
      entries.map(r => {
        const mind = (r.mg >= 5 && r.cg >= 5) ? Math.round((r.m + r.c) / 2) : "–";
        return '<tr><td>' + esc(r.name) + '</td><td>' + r.m + '</td><td>' + r.c + '</td><td>' + mind + '</td><td>' + r.xp + '</td><td>' + r.st + '</td><td>' + r.ct + '</td><td>' + esc(r.ts || "") + '</td></tr>';
      }).join("") + '</table>' +
      '<b style="font-size:13px;display:block;margin-top:16px">Assignments (' + asgs.length + ')</b>' +
      (asgSummary.length
        ? '<table class="rpt"><tr><th>Title</th><th>Problems</th><th>Submissions</th><th>Class average</th></tr>' +
          asgSummary.map(x => '<tr><td>' + esc(x.a.title) + '</td><td>' + x.a.probs.length + '</td><td>' + x.n + '</td><td>' + (x.avg == null ? "–" : x.avg + "%") + '</td></tr>').join("") + '</table>'
        : '<p class="sub">No assignments yet.</p>') +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", () => showClass(cid));
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}
