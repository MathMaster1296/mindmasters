/* ================= TEACHER SIDE =================
   Classes, assignments, and results. Loaded before part4; uses part4 helpers
   (Store, esc, tip, toast, setScreen, fmt, askConfirm, lbHash, cloud helpers)
   only at call time, never at load time. */

let TS = null;   // teacher state
function loadTS() {
  if (!TS) {
    TS = Object.assign({ name: "", classes: [] }, Store.get("mm_teacher", {}));
    if (!Array.isArray(TS.classes)) TS.classes = [];
  }
  return TS;
}
function saveTS() { Store.set("mm_teacher", TS); }
function setRole(r) { Store.set("mm_role", r); }
function newId() { return Math.random().toString(36).slice(2, 8); }
function classById(cid) { return loadTS().classes.find(c => c.id === cid); }
function asgById(cls, aid) { return (cls.assignments || []).find(a => a.id === aid); }

/* ---- assignment and submission codes (offline transport) ---- */
function assignmentCode(cls, a) {
  const payload = JSON.stringify([a.id, a.title, a.due || "", cls.name, loadTS().name, a.probs]);
  const b = btoa(unescape(encodeURIComponent(payload)));
  return "MMA1-" + b + "-" + lbHash(payload);
}
function parseAssignmentCode(str) {
  const m = String(str).trim().match(/^MMA1-([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) return null;
  let payload;
  try { payload = decodeURIComponent(escape(atob(m[1]))); } catch (e) { return null; }
  if (lbHash(payload) !== m[2]) return null;
  let arr;
  try { arr = JSON.parse(payload); } catch (e) { return null; }
  if (!Array.isArray(arr) || arr.length < 6 || !Array.isArray(arr[5]) || !arr[5].length) return null;
  const probs = arr[5].filter(p => Array.isArray(p) && typeof p[0] === "string" && Number.isInteger(p[1]));
  if (!probs.length || probs.length > 40) return null;
  return { id: String(arr[0]).slice(0, 12), title: String(arr[1]).slice(0, 60) || "Assignment",
    due: String(arr[2]).slice(0, 10), cls: String(arr[3]).slice(0, 30), teacher: String(arr[4]).slice(0, 20), probs };
}
function submissionCode(asgId, per) {
  const e = selfEntry();
  const mask = per.map(x => (x ? "1" : "0")).join("");
  const payload = [e.name, asgId, per.filter(Boolean).length, per.length, mask, todayStr()].join("|");
  return "MMS1-" + btoa(unescape(encodeURIComponent(payload))) + "-" + lbHash(payload);
}
function parseSubmissionCode(str) {
  const m = String(str).trim().match(/^MMS1-([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) return null;
  let payload;
  try { payload = decodeURIComponent(escape(atob(m[1]))); } catch (e) { return null; }
  if (lbHash(payload) !== m[2]) return null;
  const p = payload.split("|");
  if (p.length < 6) return null;
  const total = parseInt(p[3], 10), score = parseInt(p[2], 10);
  if (!(total > 0 && total <= 40 && score >= 0 && score <= total)) return null;
  return { name: p[0].slice(0, 20), asgId: p[1].slice(0, 12), score, total, mask: p[4].slice(0, 40), ts: p[5].slice(0, 10) };
}

/* ---- cloud transport for assignments and submissions ---- */
function clsCloudOk(cls) {
  const u = (cls.cloud && cls.cloud.url) || "";
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)\/?$/i.test(u) && ((cls.cloud.cls || "").trim().length >= 2);
}
function clsCloudPath(cls) {
  return cls.cloud.url.replace(/\/+$/, "") + "/classes/" + lbKeyOf(cls.cloud.cls);
}
function cloudPublishAssignment(cls, a, cb) {
  if (!clsCloudOk(cls)) { if (cb) cb(false); return; }
  try {
    fetch(clsCloudPath(cls) + "/assignments/" + a.id + ".json", {
      method: "PUT",
      body: JSON.stringify({ title: a.title, due: a.due || "", teacher: loadTS().name, probs: a.probs, ts: todayStr() })
    }).then(r => cb && cb(r.ok)).catch(() => cb && cb(false));
  } catch (e) { if (cb) cb(false); }
}
function cloudFetchSubs(cls, aid, cb) {
  if (!clsCloudOk(cls)) { if (cb) cb(null); return; }
  try {
    fetch(clsCloudPath(cls) + "/subs/" + aid + ".json").then(r => r.json()).then(data => cb && cb(data || {})).catch(() => cb && cb(null));
  } catch (e) { if (cb) cb(null); }
}

/* ---- problem reference helpers ---- */
function refItem(ref) {
  const items = topicItems(ref[0]);
  return items ? items[ref[1]] : null;
}
function refLabel(item) {
  if (!item) return "(missing problem)";
  const m = String(item.q || "").match(/^(?:<b>)?\[([^\]]+)\]/);
  if (m) return m[1];
  if (item.type === "board") return (item.tag || "Chess puzzle");
  const plain = String(item.q || "").replace(/<[^>]+>/g, "").replace(/\$[^$]*\$/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 44) + (plain.length > 44 ? "…" : "");
}

/* ================= TEACHER SHELL ================= */
function teacherShell(inner, active) {
  document.getElementById("topbar").classList.remove("hidden");
  document.getElementById("bottomnav").classList.add("hidden");
  document.getElementById("chipLevel").textContent = "Teacher";
  document.getElementById("chipXP").textContent = loadTS().name || "";
  document.getElementById("chipStreak").textContent = (loadTS().classes || []).length + (loadTS().classes.length === 1 ? " class" : " classes");
  document.getElementById("chipCoins").textContent = "";
  setScreen(inner);
}

function showTeacherHome() {
  loadTS();
  setRole("teacher");
  teacherShell(
    '<div class="backrow" style="align-items:center"><div style="flex:1">' +
    '<h1 class="title">Your Classes</h1>' +
    '<p class="sub">Create a class, build assignments, and collect results.</p></div>' +
    '<button class="btn ghost small" id="acctBtn">Account</button>' +
    '<button class="btn ghost small" id="toStudent">Switch account</button></div>' +
    (TS.classes.length ? TS.classes.map(c => {
      const nA = (c.assignments || []).length;
      return '<div class="card clsrow" data-cid="' + c.id + '" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:15px 18px">' +
        '<div style="flex:1"><b style="font-size:15.5px">' + esc(c.name) + '</b>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">' + nA + (nA === 1 ? " assignment" : " assignments") +
        (clsCloudOk(c) ? ' · cloud linked' : '') + '</div></div>' +
        '<span style="color:var(--muted)">›</span></div>';
    }).join("") : '<div class="card" style="text-align:center;padding:26px"><p class="sub">No classes yet. Create your first one to start assigning problems.</p></div>') +
    '<div style="text-align:center;margin-top:14px">' +
      '<button class="btn gold" id="newClassBtn">New Class</button>' +
    '</div>'
  );
  document.getElementById("toStudent").addEventListener("click", mmLogout);
  document.getElementById("acctBtn").addEventListener("click", showPasswordSettings);
  document.getElementById("newClassBtn").addEventListener("click", showNewClass);
  document.querySelectorAll(".clsrow").forEach(el => el.addEventListener("click", () => showClass(el.dataset.cid)));
}

function showNewClass() {
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">New Class</h1></div></div>' +
    '<div class="card" style="padding:16px 18px">' +
      '<label class="flabel">Class name</label>' +
      '<input class="lbinput" id="clsName" maxlength="30" placeholder="For example: NSF Level 2, Tuesday" autocomplete="off">' +
      '<label class="flabel">Class Cloud link (optional)' + tip("If your class uses the Class Cloud, assignments publish automatically and student results come back live. Leave blank to share assignments by code instead.") + '</label>' +
      '<input class="lbinput" id="clsUrl" placeholder="https://your-class.firebaseio.com" autocomplete="off">' +
      '<input class="lbinput" id="clsCls" placeholder="Class name in the cloud, for example nsf2026" autocomplete="off">' +
      '<button class="btn gold" id="createBtn" style="margin-top:6px">Create Class</button>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", showTeacherHome);
  document.getElementById("createBtn").addEventListener("click", () => {
    const name = document.getElementById("clsName").value.trim();
    if (!name) { toast("!", "Give the class a name."); return; }
    const cls = { id: newId(), name, cloud: { url: document.getElementById("clsUrl").value.trim(), cls: document.getElementById("clsCls").value.trim() }, assignments: [], subs: {} };
    TS.classes.push(cls); saveTS();
    toast("✓", "Class created.");
    showClass(cls.id);
  });
}

function showClass(cid) {
  const cls = classById(cid);
  if (!cls) { showTeacherHome(); return; }
  const asgs = (cls.assignments || []).slice().reverse();
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Classes</button>' +
    '<div style="flex:1"><h1 class="title" style="font-size:21px">' + esc(cls.name) + '</h1>' +
    '<p class="sub">' + (clsCloudOk(cls) ? 'Cloud linked: ' + esc(cls.cloud.cls) : 'Sharing by codes') + '</p></div>' +
    '<button class="btn ghost small" id="clsSettings">Settings</button></div>' +
    '<div style="text-align:center;margin:4px 0 14px">' +
      '<button class="btn gold" id="newAsgBtn">New Assignment</button>' +
    '</div>' +
    '<div class="section-label">Assignments</div>' +
    (asgs.length ? asgs.map(a => {
      const subs = Object.keys((cls.subs || {})[a.id] || {}).length;
      return '<div class="card asgrow" data-aid="' + a.id + '" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:13px 18px">' +
        '<div style="flex:1"><b>' + esc(a.title) + '</b>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">' + a.probs.length + ' problems' +
        (a.due ? ' · due ' + esc(a.due) : '') + ' · ' + subs + (subs === 1 ? ' submission' : ' submissions') + '</div></div>' +
        '<span style="color:var(--muted)">›</span></div>';
    }).join("") : '<div class="card" style="text-align:center;padding:22px"><p class="sub">No assignments yet.</p></div>') +
    classExtrasHtml(cls)
  );
  document.getElementById("backBtn").addEventListener("click", showTeacherHome);
  document.getElementById("newAsgBtn").addEventListener("click", () => showBuilder(cid));
  bindClassExtras(cid);
  document.getElementById("clsSettings").addEventListener("click", () => showClassSettings(cid));
  document.querySelectorAll(".asgrow").forEach(el => el.addEventListener("click", () => showAssignment(cid, el.dataset.aid)));
}

function showClassSettings(cid) {
  const cls = classById(cid);
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← ' + esc(cls.name) + '</button>' +
    '<div><h1 class="title" style="font-size:21px">Class Settings</h1></div></div>' +
    '<div class="card" style="padding:16px 18px">' +
      '<label class="flabel">Class name</label>' +
      '<input class="lbinput" id="clsName" maxlength="30" value="' + esc(cls.name) + '">' +
      '<label class="flabel">Class Cloud link' + tip("With a cloud link, new assignments publish automatically and results arrive live. Students enter the same link on their Leaderboard screen.") + '</label>' +
      '<input class="lbinput" id="clsUrl" placeholder="https://your-class.firebaseio.com" value="' + esc((cls.cloud || {}).url || "") + '">' +
      '<input class="lbinput" id="clsCls" placeholder="Cloud class name" value="' + esc((cls.cloud || {}).cls || "") + '">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' +
        '<button class="btn gold small" id="saveBtn">Save</button>' +
        '<button class="btn ghost small" id="delBtn" style="color:var(--red)">Delete class</button>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", () => showClass(cid));
  document.getElementById("saveBtn").addEventListener("click", () => {
    cls.name = document.getElementById("clsName").value.trim() || cls.name;
    cls.cloud = { url: document.getElementById("clsUrl").value.trim(), cls: document.getElementById("clsCls").value.trim() };
    saveTS(); toast("✓", "Saved."); showClass(cid);
  });
  document.getElementById("delBtn").addEventListener("click", () => {
    askConfirm("Delete this class?", "Its assignments and collected results are removed from this device. Student progress is not affected.", "Delete", () => {
      TS.classes = TS.classes.filter(c => c.id !== cid); saveTS(); showTeacherHome();
    });
  });
}

/* ================= ASSIGNMENT BUILDER ================= */
let BLD = null;
function showBuilder(cid) {
  BLD = BLD && BLD.cid === cid ? BLD : { cid, title: "", due: "", picks: [], track: "math", topicId: null, minR: "", maxR: "", page: 0 };
  const cls = classById(cid);
  const topics = (BLD.track === "math" ? MATH_TOPICS : CHESS_MODULES);
  const src = BLD.topicId ? topics.find(t => t.id === BLD.topicId) : null;
  let browser = "";
  if (src) {
    const items = topicItems(BLD.topicId);
    const lo = parseInt(BLD.minR, 10) || 0, hi = parseInt(BLD.maxR, 10) || 99999;
    const pool = [];
    items.forEach((it, gi) => { const r = it.er || 1200; if (r >= lo && r <= hi) pool.push([gi, it]); });
    const PAGE = 8;
    const pages = Math.max(1, Math.ceil(pool.length / PAGE));
    BLD.page = Math.min(BLD.page, pages - 1);
    const slice = pool.slice(BLD.page * PAGE, BLD.page * PAGE + PAGE);
    browser =
      '<div class="card" style="padding:14px 18px">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">' +
        '<b style="flex:1">' + esc(src.name) + ' <span style="color:var(--muted);font-weight:500">' + pool.length + ' problems</span></b>' +
        '<input class="lbinput" id="minR" placeholder="Min rating" value="' + esc(BLD.minR) + '" style="width:105px;margin:0">' +
        '<input class="lbinput" id="maxR" placeholder="Max rating" value="' + esc(BLD.maxR) + '" style="width:105px;margin:0">' +
        '<button class="btn ghost small" id="applyR">Filter</button>' +
        '<button class="btn small" id="autoPick">Auto-pick 10</button>' +
      '</div>' +
      slice.map(([gi, it]) => {
        const picked = BLD.picks.some(p => p[0] === BLD.topicId && p[1] === gi);
        return '<div class="pickrow">' +
          '<div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(refLabel(it)) + '</b>' +
          '<div style="font-size:11.5px;color:var(--muted)">rating ' + (it.er || 1200) + ' · ' + (it.type === "board" ? "chess" : item_kind(it)) + '</div></div>' +
          '<button class="btn small ' + (picked ? "ghost" : "") + '" data-gi="' + gi + '">' + (picked ? "Remove" : "Add") + '</button>' +
          '</div>';
      }).join("") +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
        '<button class="btn ghost small" id="prevPg"' + (BLD.page === 0 ? " disabled" : "") + '>← Prev</button>' +
        '<span class="sub num">' + (BLD.page + 1) + ' / ' + pages + '</span>' +
        '<button class="btn ghost small" id="nextPg"' + (BLD.page >= pages - 1 ? " disabled" : "") + '>Next →</button>' +
      '</div></div>';
  } else {
    browser = '<div class="topiclist">' + topics.map(t =>
      '<button class="topic bldtopic" data-topic="' + t.id + '">' +
      '<div class="tpico" style="background:' + t.color + '">' + tGlyph(t) + '</div>' +
      '<div class="tpmeta"><h4>' + t.name + '</h4><div class="tpsub">' + topicItems(t.id).length + ' problems</div></div>' +
      '</button>').join("") + '</div>';
  }
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← ' + esc(cls.name) + '</button>' +
    '<div><h1 class="title" style="font-size:21px">New Assignment</h1></div></div>' +
    '<div class="card" style="padding:14px 18px">' +
      '<label class="flabel">Title</label>' +
      '<input class="lbinput" id="asgTitle" maxlength="60" placeholder="For example: Week 3 homework" value="' + esc(BLD.title) + '">' +
      '<label class="flabel">Due date (optional)</label>' +
      '<input class="lbinput" id="asgDue" type="date" value="' + esc(BLD.due) + '">' +
    '</div>' +
    '<div class="section-label" style="display:flex;gap:10px;align-items:center">Pick problems' +
      '<span class="cloudtag ' + (BLD.picks.length ? "on" : "off") + '">' + BLD.picks.length + ' selected</span>' +
      (BLD.topicId ? '<button class="btn ghost small" id="chgTopic" style="margin-left:auto">Change topic</button>'
        : '<span style="margin-left:auto;display:flex;gap:6px">' +
          '<button class="diffchip' + (BLD.track === "math" ? " sel" : "") + '" data-trk="math">Math</button>' +
          '<button class="diffchip' + (BLD.track === "chess" ? " sel" : "") + '" data-trk="chess">Chess</button></span>') +
    '</div>' +
    browser +
    (BLD.picks.length ? '<div class="card" style="padding:12px 18px">' +
      '<b style="font-size:13px">Selected</b>' +
      BLD.picks.map((p, i) => {
        const it = refItem(p);
        return '<div class="pickrow"><div style="flex:1;min-width:0;font-size:12.5px">' + esc(refLabel(it)) +
          ' <span style="color:var(--muted)">· ' + ((it && it.er) || 1200) + '</span></div>' +
          '<button class="btn ghost small" data-rm="' + i + '">Remove</button></div>';
      }).join("") + '</div>' : '') +
    '<div style="text-align:center;margin:14px 0">' +
      '<button class="btn gold" id="createAsg"' + (BLD.picks.length ? "" : " disabled") + '>Create Assignment</button>' +
    '</div>'
  );
  const keep = () => { BLD.title = document.getElementById("asgTitle").value; BLD.due = document.getElementById("asgDue").value; };
  document.getElementById("backBtn").addEventListener("click", () => { BLD = null; showClass(cid); });
  document.getElementById("asgTitle").addEventListener("change", keep);
  document.getElementById("asgDue").addEventListener("change", keep);
  document.querySelectorAll(".bldtopic").forEach(b => b.addEventListener("click", () => { keep(); BLD.topicId = b.dataset.topic; BLD.page = 0; showBuilder(cid); }));
  document.querySelectorAll("[data-trk]").forEach(b => b.addEventListener("click", () => { keep(); BLD.track = b.dataset.trk; BLD.topicId = null; showBuilder(cid); }));
  const ct = document.getElementById("chgTopic");
  if (ct) ct.addEventListener("click", () => { keep(); BLD.topicId = null; showBuilder(cid); });
  const ap = document.getElementById("applyR");
  if (ap) ap.addEventListener("click", () => { keep(); BLD.minR = document.getElementById("minR").value; BLD.maxR = document.getElementById("maxR").value; BLD.page = 0; showBuilder(cid); });
  const pp = document.getElementById("prevPg"), np = document.getElementById("nextPg");
  if (pp) pp.addEventListener("click", () => { keep(); BLD.page--; showBuilder(cid); });
  if (np) np.addEventListener("click", () => { keep(); BLD.page++; showBuilder(cid); });
  const auto = document.getElementById("autoPick");
  if (auto) auto.addEventListener("click", () => {
    keep();
    const items = topicItems(BLD.topicId);
    const lo = parseInt(BLD.minR, 10) || 0, hi = parseInt(BLD.maxR, 10) || 99999;
    const pool = [];
    items.forEach((it, gi) => {
      const r = it.er || 1200;
      if (r >= lo && r <= hi && !BLD.picks.some(p => p[0] === BLD.topicId && p[1] === gi)) pool.push(gi);
    });
    for (let k = 0; k < 10 && pool.length && BLD.picks.length < 40; k++) {
      const j = Math.floor(Math.random() * pool.length);
      BLD.picks.push([BLD.topicId, pool[j]]);
      pool.splice(j, 1);
    }
    showBuilder(cid);
  });
  document.querySelectorAll("[data-gi]").forEach(b => b.addEventListener("click", () => {
    keep();
    const gi = +b.dataset.gi;
    const at = BLD.picks.findIndex(p => p[0] === BLD.topicId && p[1] === gi);
    if (at >= 0) BLD.picks.splice(at, 1);
    else if (BLD.picks.length >= 40) { toast("!", "An assignment holds at most 40 problems."); return; }
    else BLD.picks.push([BLD.topicId, gi]);
    showBuilder(cid);
  }));
  document.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { keep(); BLD.picks.splice(+b.dataset.rm, 1); showBuilder(cid); }));
  const cr = document.getElementById("createAsg");
  if (cr) cr.addEventListener("click", () => {
    keep();
    if (!BLD.picks.length) return;
    const a = { id: newId(), title: BLD.title.trim() || "Assignment", due: BLD.due, probs: BLD.picks.slice(), created: todayStr() };
    const cls2 = classById(cid);
    cls2.assignments = cls2.assignments || [];
    cls2.assignments.push(a);
    saveTS();
    const done = () => { BLD = null; showAssignment(cid, a.id); };
    if (clsCloudOk(cls2)) cloudPublishAssignment(cls2, a, ok => { toast(ok ? "✓" : "!", ok ? "Assignment published to the Class Cloud." : "Created, but the cloud publish failed. Share the code instead."); done(); });
    else { toast("✓", "Assignment created."); done(); }
  });
}
function item_kind(it) {
  return it.type === "mc" ? "multiple choice" : it.type === "num" ? "numeric answer" : "chess";
}

/* ================= ASSIGNMENT DETAIL + RESULTS ================= */
function showAssignment(cid, aid) {
  const cls = classById(cid);
  const a = cls && asgById(cls, aid);
  if (!a) { showClass(cid); return; }
  const subs = (cls.subs || {})[aid] || {};
  const names = Object.keys(subs).sort((x, y) => subs[y].score - subs[x].score);
  teacherShell(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← ' + esc(cls.name) + '</button>' +
    '<div style="flex:1"><h1 class="title" style="font-size:21px">' + esc(a.title) + '</h1>' +
    '<p class="sub">' + a.probs.length + ' problems' + (a.due ? ' · due ' + esc(a.due) : '') + '</p></div>' +
    '<button class="btn ghost small" id="delAsg" style="color:var(--red)">Delete</button></div>' +

    '<div class="card" style="padding:14px 18px">' +
      '<b>Assignment code' + tip("Students paste this code in their Assignments screen. If the class is cloud linked they receive it automatically instead.") + '</b>' +
      '<div class="mycode" style="margin-top:8px">' + assignmentCode(cls, a) + '</div>' +
      '<button class="btn small" id="copyAsg" style="margin-top:9px">Copy code</button>' +
      '<button class="btn ghost small" id="refreshAsg" style="margin-top:9px;margin-left:8px">New version, fresh problems' +
        '</button>' + tip("Builds a brand new assignment with different problems from the same topics and difficulty range. Perfect for a weekly routine.", true) +
    '</div>' +

    '<div class="section-label">Problems</div>' +
    '<div class="card" style="padding:10px 18px">' +
      a.probs.map((p, i) => {
        const it = refItem(p);
        return '<div class="pickrow"><span class="num" style="color:var(--muted);width:22px">' + (i + 1) + '</span>' +
          '<div style="flex:1;font-size:12.5px">' + esc(refLabel(it)) + ' <span style="color:var(--muted)">· ' + ((it && it.er) || "?") + '</span></div></div>';
      }).join("") +
    '</div>' +

    '<div class="section-label" style="display:flex;align-items:center;gap:10px">Results' +
      (clsCloudOk(cls) ? '<button class="btn ghost small" id="pullSubs" style="margin-left:auto">Refresh from cloud</button>' : '') +
    '</div>' +
    (names.length ?
      names.map(k => {
        const su = subs[k];
        const cells = (su.mask || "").split("").slice(0, a.probs.length).map(c =>
          '<span class="subcell ' + (c === "1" ? "ok" : "no") + '"></span>').join("");
        return '<div class="card" style="padding:11px 18px;display:flex;align-items:center;gap:12px">' +
          '<b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">' + esc(su.name) + '</b>' +
          '<span style="display:flex;gap:3px;flex-wrap:wrap;max-width:45%">' + cells + '</span>' +
          '<span class="num" style="font-weight:700;color:var(--gold)">' + su.score + '/' + su.total + '</span>' +
        '</div>';
      }).join("")
      : '<div class="card" style="text-align:center;padding:18px"><p class="sub">No submissions yet.</p></div>') +
    asgAnalysisHtml(cls, a, subs) +
    '<div class="card" style="padding:14px 18px">' +
      '<b style="font-size:13px">Add results by code</b>' +
      '<textarea class="codebox" id="subInput" placeholder="Paste MMS1- codes from students, one or many" style="margin-top:8px"></textarea>' +
      '<button class="btn gold small" id="parseSubs" style="margin-top:8px">Add results</button>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", () => showClass(cid));
  document.getElementById("refreshAsg").addEventListener("click", () => refreshAssignment(cid, aid));
  document.getElementById("copyAsg").addEventListener("click", () => {
    const code = assignmentCode(cls, a);
    const done = () => toast("✓", "Code copied.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
    else fallbackCopy(code, done);
  });
  document.getElementById("delAsg").addEventListener("click", () => {
    askConfirm("Delete this assignment?", "Collected results for it are removed too.", "Delete", () => {
      cls.assignments = cls.assignments.filter(x => x.id !== aid);
      if (cls.subs) delete cls.subs[aid];
      saveTS(); showClass(cid);
    });
  });
  document.getElementById("parseSubs").addEventListener("click", () => {
    const found = (document.getElementById("subInput").value.match(/MMS1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/g)) || [];
    let added = 0, wrong = 0;
    for (const c of found) {
      const su = parseSubmissionCode(c);
      if (!su) { wrong++; continue; }
      if (su.asgId !== aid) { wrong++; continue; }
      cls.subs = cls.subs || {}; cls.subs[aid] = cls.subs[aid] || {};
      const k = lbKeyOf(su.name);
      if (!cls.subs[aid][k] || su.ts >= (cls.subs[aid][k].ts || "")) { cls.subs[aid][k] = su; added++; }
    }
    saveTS();
    if (added) toast("✓", added + (added === 1 ? " result added." : " results added."));
    else toast("!", found.length ? "Those codes belong to a different assignment or are invalid." : "No result codes found.");
    showAssignment(cid, aid);
  });
  const pull = document.getElementById("pullSubs");
  if (pull) pull.addEventListener("click", () => {
    cloudFetchSubs(cls, aid, data => {
      if (data === null) { toast("!", "Could not reach the class cloud."); return; }
      let n = 0;
      cls.subs = cls.subs || {}; cls.subs[aid] = cls.subs[aid] || {};
      for (const [k, v] of Object.entries(data)) {
        if (v && v.name && Number.isInteger(v.score)) { cls.subs[aid][k] = { name: String(v.name).slice(0, 20), score: v.score, total: v.total, mask: String(v.mask || ""), ts: String(v.ts || "") }; n++; }
      }
      saveTS();
      toast("✓", n + (n === 1 ? " submission loaded." : " submissions loaded."));
      showAssignment(cid, aid);
    });
  });
  bindAsgAnalysis(cls, a, subs);
}

/* ================= STUDENT SIDE: ASSIGNMENTS ================= */
function myAssignments() {
  if (!S.assignments) S.assignments = {};
  return S.assignments;
}
function openAssignmentCount() {
  return Object.values(myAssignments()).filter(a => !a.done).length;
}
function acceptAssignment(a, from) {
  const mine = myAssignments();
  if (mine[a.id]) return false;
  mine[a.id] = { id: a.id, title: a.title, due: a.due, cls: a.cls, teacher: a.teacher, probs: a.probs, from: from, per: a.probs.map(() => null), done: false, ts: todayStr() };
  save();
  return true;
}
function showAssignmentsHome() {
  renderTopbar(); setNav("home");
  const mine = Object.values(myAssignments()).sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || String(b.ts).localeCompare(String(a.ts)));
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Home</button>' +
    '<div><h1 class="title" style="font-size:21px">Assignments</h1>' +
    '<p class="sub">Work your teacher has set for you.</p></div></div>' +
    (mine.length ? mine.map(a => {
      const doneN = a.per.filter(x => x !== null).length;
      const score = a.per.filter(Boolean).length;
      return '<div class="card asgcard" data-aid="' + a.id + '" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:13px 18px">' +
        '<div style="flex:1;min-width:0"><b>' + esc(a.title) + '</b>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">' + esc(a.teacher || "") + (a.cls ? ' · ' + esc(a.cls) : '') +
        (a.due ? ' · due ' + esc(a.due) : '') + '</div></div>' +
        (a.done
          ? '<span class="num" style="color:var(--green);font-weight:700">' + score + '/' + a.probs.length + '</span>'
          : '<span class="num" style="color:var(--muted)">' + doneN + '/' + a.probs.length + '</span>') +
        '<span style="color:var(--muted)">›</span></div>';
    }).join("") : '<div class="card" style="text-align:center;padding:22px"><p class="sub">Nothing yet. Paste an assignment code from your teacher below' + (cloudCfgOk() ? ', or refresh from your Class Cloud.' : '.') + '</p></div>') +
    '<div class="card" style="padding:14px 18px">' +
      '<b style="font-size:13px">Add an assignment or redeem a bonus code</b>' +
      '<textarea class="codebox" id="asgInput" placeholder="Paste an assignment code (MMA1) or bonus code (MMB1) from your teacher" style="margin-top:8px"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
        '<button class="btn gold small" id="parseAsg">Add assignment</button>' +
        (cloudCfgOk() ? '<button class="btn ghost small" id="pullAsg">Refresh from Class Cloud</button>' : '') +
      '</div>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", showHome);
  document.querySelectorAll(".asgcard").forEach(el => el.addEventListener("click", () => showAssignmentPlay(el.dataset.aid)));
  document.getElementById("parseAsg").addEventListener("click", () => {
    const rawIn = document.getElementById("asgInput").value;
    const bcodes = rawIn.match(/MMB1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/g) || [];
    let redeemedN = 0;
    for (const c of bcodes) if (redeemBonus(c)) redeemedN++;
    const found = (rawIn.match(/MMA1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/g)) || [];
    let added = 0;
    for (const c of found) {
      const a = parseAssignmentCode(c);
      if (a && acceptAssignment(a, "code")) added++;
    }
    if (added) { toast("✓", added + (added === 1 ? " assignment added." : " assignments added.")); showAssignmentsHome(); }
    else if (!redeemedN) toast("!", found.length ? "You already have that assignment, or the code is invalid." : (bcodes.length ? "That bonus code was invalid or already used." : "No codes found. Assignment codes start with MMA1-, bonus codes with MMB1-."));
  });
  const pa = document.getElementById("pullAsg");
  if (pa) pa.addEventListener("click", () => {
    try {
      fetch(cloudPath() + "/assignments.json").then(r => r.json()).then(data => {
        let added = 0;
        if (data && typeof data === "object") {
          for (const [id, v] of Object.entries(data)) {
            if (v && Array.isArray(v.probs) && v.probs.length && v.probs.length <= 40) {
              if (acceptAssignment({ id: String(id).slice(0, 12), title: String(v.title || "Assignment").slice(0, 60), due: String(v.due || "").slice(0, 10), cls: S.cloud.cls, teacher: String(v.teacher || "").slice(0, 20), probs: v.probs }, "cloud")) added++;
            }
          }
        }
        toast(added ? "✓" : "i", added ? added + (added === 1 ? " new assignment." : " new assignments.") : "No new assignments.");
        if (added) showAssignmentsHome();
      }).catch(() => toast("!", "Could not reach the Class Cloud."));
    } catch (e) { toast("!", "Could not reach the Class Cloud."); }
  });
}

function showAssignmentPlay(aid) {
  const a = myAssignments()[aid];
  if (!a) { showAssignmentsHome(); return; }
  if (a.done) { showAssignmentReport(aid); return; }
  // find the first unanswered problem and run the standard quiz engine over the remaining ones
  const entries = [];
  a.probs.forEach((ref, i) => {
    if (a.per[i] !== null) return;
    const item = refItem(ref);
    if (item) entries.push({ item, gi: ref[1], tid: ref[0], track: MATH_TOPICS.some(t => t.id === ref[0]) ? "math" : "chess", asgIndex: i });
  });
  if (!entries.length) { finishAssignment(aid); return; }
  Q = {
    topicId: entries[0].tid, entries, i: 0, target: entries.length,
    correctThisRun: 0, xpThisRun: 0,
    eloStart: eloOf(entries[0].track),
    lesson: "", name: a.title, icon: "",
    track: entries[0].track, isDaily: false, isAssignment: aid, replayAll: false
  };
  renderQuestion(false);
}
function finishAssignment(aid) {
  const a = myAssignments()[aid];
  if (!a || a.done) { showAssignmentReport(aid); return; }
  a.done = true;
  a.finishedOn = todayStr();
  S.asgDone = (S.asgDone || 0) + 1;
  if (a.per.every(Boolean)) S.asgPerfect = (S.asgPerfect || 0) + 1;
  if (typeof bumpAsgToday === "function") bumpAsgToday();   // counts toward the Today chest bonus
  earnCoins(15);
  save(); checkBadges();
  // push to the class cloud if this student is linked
  if (cloudCfgOk() && S.name) {
    const per = a.per.map(x => !!x);
    try {
      fetch(cloudPath() + "/subs/" + aid + "/" + lbKeyOf(S.name) + ".json", {
        method: "PUT",
        body: JSON.stringify({ name: selfEntry().name, score: per.filter(Boolean).length, total: per.length, mask: per.map(x => x ? "1" : "0").join(""), ts: todayStr() })
      }).catch(() => {});
    } catch (e) {}
  }
  showAssignmentReport(aid);
}
function showAssignmentReport(aid) {
  const a = myAssignments()[aid];
  if (!a) { showAssignmentsHome(); return; }
  const score = a.per.filter(Boolean).length;
  const code = submissionCode(aid, a.per.map(x => !!x));
  setScreen(
    '<div class="card results">' +
      '<div class="num" style="font-size:40px;font-weight:700;color:' + (score === a.probs.length ? 'var(--gold)' : 'var(--ink)') + '">' + score + ' / ' + a.probs.length + '</div>' +
      '<h2 style="font-size:20px">' + esc(a.title) + '</h2>' +
      '<div class="score">' + (a.teacher ? esc(a.teacher) + (a.cls ? ' · ' + esc(a.cls) : '') : '') + '</div>' +
      '<div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin:14px 0">' +
        a.per.map(x => '<span class="subcell ' + (x ? "ok" : "no") + '"></span>').join("") +
      '</div>' +
      '<div class="mycode" style="text-align:left">' + code + '</div>' +
      '<p class="sub" style="margin-top:8px">' + (a.from === "cloud" && cloudCfgOk()
        ? 'Your result was sent to the Class Cloud. The code above is a backup you can send by hand.'
        : 'Send this result code to your teacher.') + '</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px">' +
        '<button class="btn small" id="copySub">Copy result code</button>' +
        '<button class="btn ghost small" id="backAsg">Assignments</button>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("copySub").addEventListener("click", () => {
    const done = () => toast("✓", "Result code copied.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
    else fallbackCopy(code, done);
  });
  document.getElementById("backAsg").addEventListener("click", showAssignmentsHome);
}

/* ---- class health: who trained, who went quiet (needs the Class Cloud) ---- */
function renderClassHealth(cls) {
  const box = document.getElementById("healthBox");
  if (!box) return;
  box.innerHTML = '<div class="card" style="padding:13px 18px"><p class="sub" style="margin:0">Loading roster\u2026</p></div>';
  try {
    fetch(clsCloudPath(cls) + ".json").then(r => r.json()).then(data => {
      const rows = [];
      if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          if (k === "assignments" || k === "subs") continue;
          if (v && typeof v === "object" && v.name) rows.push(v);
        }
      }
      if (!rows.length) {
        box.innerHTML = '<div class="card" style="padding:13px 18px"><p class="sub" style="margin:0">No students have synced to this class cloud yet. They connect from their Leaderboard screen.</p></div>';
        return;
      }
      const today = todayStr();
      const quietDays = ts => {
        if (!ts) return 999;
        const d = Math.round((new Date(today) - new Date(String(ts).slice(0, 10))) / 86400000);
        return isNaN(d) ? 999 : Math.max(0, d);
      };
      rows.sort((a, b) => quietDays(a.ts) - quietDays(b.ts) || (+b.xp || 0) - (+a.xp || 0));
      const quietN = rows.filter(r => quietDays(r.ts) >= 3).length;
      box.innerHTML =
        '<div class="card" style="padding:9px 18px 12px">' +
        '<p class="sub" style="margin:6px 0 8px">' + rows.length + (rows.length === 1 ? " student" : " students") + " on the cloud" +
          (quietN ? ' \u00b7 <b style="color:var(--red)">' + quietN + ' quiet 3+ days</b>' : " \u00b7 everyone active this week") + '</p>' +
        rows.map(r => {
          const q = quietDays(r.ts);
          const flag = q >= 7 ? '<span style="color:var(--red);font-weight:700">quiet ' + q + ' days</span>'
            : q >= 3 ? '<span style="color:var(--orange);font-weight:700">quiet ' + q + ' days</span>'
            : q === 0 ? '<span style="color:var(--green);font-weight:700">active today</span>'
            : '<span style="color:var(--muted)">' + q + (q === 1 ? ' day ago' : ' days ago') + '</span>';
          return '<div class="pickrow">' +
            '<div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(String(r.name).slice(0, 20)) + '</b>' +
            '<div style="font-size:11.5px;color:var(--muted)">' + (+r.ct || 0) + ' solved \u00b7 streak ' + (+r.st || 0) +
            ((+r.sx || 0) ? ' \u00b7 season ' + (+r.sx) + ' XP' : '') + '</div></div>' + flag + '</div>';
        }).join("") + '</div>';
    }).catch(() => {
      box.innerHTML = '<div class="card" style="padding:13px 18px"><p class="sub" style="margin:0">Could not reach the Class Cloud. Check the internet connection and the cloud link in Settings.</p></div>';
    });
  } catch (e) {
    box.innerHTML = '<div class="card" style="padding:13px 18px"><p class="sub" style="margin:0">Could not reach the Class Cloud.</p></div>';
  }
}

/* ---- weekly refresh: same topics and difficulty, brand new problems ---- */
function refreshAssignment(cid, aid) {
  const cls = classById(cid);
  const a = cls && asgById(cls, aid);
  if (!a) return;
  askConfirm("Create a fresh version?", "A new assignment appears with different problems drawn from the same topics and a similar difficulty range. The original stays as it is.", "Create", () => {
    const byTopic = {};
    a.probs.forEach(p => {
      const t = byTopic[p[0]] = byTopic[p[0]] || { n: 0, used: {}, lo: Infinity, hi: -Infinity };
      t.n++; t.used[p[1]] = 1;
      const it = refItem(p);
      const r = (it && it.er) || 1200;
      if (r < t.lo) t.lo = r;
      if (r > t.hi) t.hi = r;
    });
    const probs = [];
    for (const [tid, t] of Object.entries(byTopic)) {
      const items = topicItems(tid);
      const lo = t.lo - 80, hi = t.hi + 80;
      let pool = [];
      items.forEach((it, gi) => {
        const r = it.er || 1200;
        if (!t.used[gi] && r >= lo && r <= hi) pool.push(gi);
      });
      if (pool.length < t.n) { pool = []; items.forEach((it, gi) => { if (!t.used[gi]) pool.push(gi); }); }
      for (let k = 0; k < t.n && pool.length; k++) {
        const j = Math.floor(Math.random() * pool.length);
        probs.push([tid, pool[j]]);
        pool.splice(j, 1);
      }
    }
    if (!probs.length) { toast("!", "No fresh problems were available in those topics."); return; }
    const base = a.title.replace(/ \u00b7 week \d+$/i, "");
    const week = (cls.assignments || []).filter(x => x.title.indexOf(base) === 0).length + 1;
    const na = { id: newId(), title: base + " \u00b7 week " + week, due: "", probs, created: todayStr() };
    cls.assignments.push(na);
    saveTS();
    const done = () => showAssignment(cid, na.id);
    if (clsCloudOk(cls)) cloudPublishAssignment(cls, na, ok => { toast(ok ? "\u2713" : "!", ok ? "Fresh assignment published to the Class Cloud." : "Created. The cloud publish failed, share the code instead."); done(); });
    else { toast("\u2713", "Fresh assignment created."); done(); }
  });
}
