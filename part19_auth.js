/* ================= ACCOUNTS AND LOGIN =================
   Local accounts for shared devices. Each account has one role (student or
   teacher) and its own private progress. Passwords are never stored: only a
   salted PBKDF2-SHA256 hash (Web Crypto, 120000 rounds) with a pure-JS
   fallback for engines without SubtleCrypto. Includes login lockout,
   password hints, a strength meter, and stay-signed-in sessions.
   Loaded before part4; authBoot() is called by part4 right after Store is
   created, before any profile state loads. */

/* ---- raw storage (used before Store's profile is chosen) ---- */
function _lsGet(k, d) {
  try { const v = window.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
}
function _lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function _lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) {} }
function _ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
function _ssSet(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
function _ssDel(k) { try { window.sessionStorage.removeItem(k); } catch (e) {} }

function authUsers() { return _lsGet("mm_users", {}); }
function authSaveUsers(u) { _lsSet("mm_users", u); }
function authActiveUid() {
  const s = _ssGet("mm_active_s");
  if (s && authUsers()[s]) return s;
  const l = _lsGet("mm_active", null);
  return l && authUsers()[l] ? l : null;
}
function authActive() {
  const uid = authActiveUid();
  return uid ? authUsers()[uid] : null;
}

/* ---- boot: migrate old single-profile saves, then activate the session ---- */
function authBoot() {
  let users = _lsGet("mm_users", null);
  if (!users) {
    users = {};
    /* one-time migration: the old save becomes the first account(s) */
    const legacyS = _lsGet("mm_state", null);
    const legacyT = _lsGet("mm_teacher", null);
    const legacyRole = _lsGet("mm_role", "student");
    let firstUid = null;
    if (legacyS && legacyS.name) {
      const uid = "u" + Math.random().toString(36).slice(2, 10);
      _lsSet("p:" + uid + ":mm_state", legacyS);
      _lsSet("p:" + uid + ":mm_role", "student");
      users[uid] = { id: uid, role: "student", name: String(legacyS.name).slice(0, 20), av: legacyS.avatar || "🦁", hash: null, hint: "", created: new Date().toISOString().slice(0, 10) };
      if (legacyRole !== "teacher") firstUid = uid;
      else firstUid = firstUid || uid;
    }
    if (legacyT && legacyT.name) {
      const uid = "t" + Math.random().toString(36).slice(2, 10);
      _lsSet("p:" + uid + ":mm_teacher", legacyT);
      _lsSet("p:" + uid + ":mm_role", "teacher");
      users[uid] = { id: uid, role: "teacher", name: String(legacyT.name).slice(0, 20), av: "🎓", hash: null, hint: "", created: new Date().toISOString().slice(0, 10) };
      if (legacyRole === "teacher") firstUid = uid;
    }
    _lsSet("mm_users", users);
    if (firstUid) _lsSet("mm_active", firstUid);
    _lsDel("mm_state"); _lsDel("mm_teacher"); _lsDel("mm_role");
  }
  const uid = authActiveUid();
  if (uid && typeof Store !== "undefined" && Store.setProfile) Store.setProfile(uid);
  return uid;
}

/* ---- password hashing: PBKDF2-SHA256, salted; JS fallback when needed ---- */
function _bytesToB64(b) { let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function _b64ToBytes(s) { const raw = atob(s); const b = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i); return b; }
function _randSalt() {
  const b = new Uint8Array(16);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  return _bytesToB64(b);
}
/* compact SHA-256 (fallback only) */
function _sha256Hex(str) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) { bytes.push(192 | (c >> 6), 128 | (c & 63)); }
    else { bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
  }
  const bitLen = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 255);
  const w = new Array(64);
  for (let off = 0; off < bytes.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => ("00000000" + (x >>> 0).toString(16)).slice(-8)).join("");
}
function _jsIterHash(pw, salt, iter) {
  let h = _sha256Hex(salt + "|" + pw);
  for (let i = 1; i < iter; i++) h = _sha256Hex(h + salt);
  return h;
}
function pwDerive(pw, saltB64, alg, iter, cb) {
  if (alg === "pbkdf2" && window.crypto && crypto.subtle && crypto.subtle.importKey) {
    try {
      crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"])
        .then(k => crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: _b64ToBytes(saltB64), iterations: iter }, k, 256))
        .then(bits => cb(_bytesToB64(new Uint8Array(bits))))
        .catch(() => cb(_jsIterHash(pw, saltB64, 20000)));
      return;
    } catch (e) {}
  }
  cb(_jsIterHash(pw, saltB64, alg === "pbkdf2" ? 20000 : iter));
}
function pwMakeHash(pw, cb) {
  const salt = _randSalt();
  const useSubtle = !!(window.crypto && crypto.subtle && crypto.subtle.importKey);
  const alg = useSubtle ? "pbkdf2" : "js";
  const iter = useSubtle ? 120000 : 20000;
  pwDerive(pw, salt, alg, iter, h => cb({ alg, it: iter, salt, h }));
}
function pwVerify(pw, rec, cb) {
  if (!rec) { cb(false); return; }
  pwDerive(pw, rec.salt, rec.alg, rec.it, h => cb(h === rec.h));
}
function pwStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "var(--muted)" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "weak", color: "var(--red)" };
  if (score <= 3) return { score, label: "okay", color: "var(--orange)" };
  return { score, label: "strong", color: "var(--green)" };
}
function authValidatePw(role, pw, pw2) {
  if (!pw && role === "teacher") return "Teacher accounts need a password, so students cannot open your classes.";
  if (!pw) return null;   // students may skip
  if (pw.length < 6) return "Passwords need at least 6 characters.";
  if (pw !== pw2) return "The two passwords do not match.";
  return null;
}

/* ---- login lockout: slow down guessing on shared devices ---- */
function lockOf(uid) { return _lsGet("mm_lock:" + uid, { n: 0, until: 0 }); }
function lockNote(uid, ok) {
  if (ok) { _lsDel("mm_lock:" + uid); return null; }
  const L = lockOf(uid);
  L.n++;
  if (L.n >= 5) {
    const waitMs = 30000 * Math.pow(2, Math.min(4, L.n - 5));
    L.until = Date.now() + waitMs;
  }
  _lsSet("mm_lock:" + uid, L);
  return L;
}
function lockWait(uid) {
  const L = lockOf(uid);
  return L.until > Date.now() ? Math.ceil((L.until - Date.now()) / 1000) : 0;
}

/* ---- account lifecycle ---- */
function authRegister(opts, cb) {
  const users = authUsers();
  const uid = (opts.role === "teacher" ? "t" : "u") + Math.random().toString(36).slice(2, 10);
  const finish = hash => {
    users[uid] = {
      id: uid, role: opts.role, name: String(opts.name).slice(0, 20),
      av: opts.role === "teacher" ? "🎓" : (opts.avatar || "🦁"),
      hash: hash || null, hint: String(opts.hint || "").slice(0, 60),
      created: todayStr()
    };
    authSaveUsers(users);
    _lsSet("mm_active", uid);
    _ssDel("mm_active_s");
    if (Store.setProfile) Store.setProfile(uid);
    cb();
  };
  if (opts.pw) pwMakeHash(opts.pw, finish);
  else finish(null);
}
function authUpdateName(name, av) {
  const u = authActive();
  if (!u) return;
  const users = authUsers();
  users[u.id].name = String(name).slice(0, 20);
  if (av) users[u.id].av = av;
  authSaveUsers(users);
}
function authDeleteAccount(uid) {
  const users = authUsers();
  delete users[uid];
  authSaveUsers(users);
  _lsDel("p:" + uid + ":mm_state");
  _lsDel("p:" + uid + ":mm_teacher");
  _lsDel("p:" + uid + ":mm_role");
  _lsDel("mm_lock:" + uid);
  if (_lsGet("mm_active", null) === uid) _lsDel("mm_active");
  if (_ssGet("mm_active_s") === uid) _ssDel("mm_active_s");
}
function mmLogout() {
  _lsDel("mm_active");
  _ssDel("mm_active_s");
  location.reload();
}
function doLogin(uid, remember) {
  lockNote(uid, true);
  if (remember === false) { _ssSet("mm_active_s", uid); _lsDel("mm_active"); }
  else { _lsSet("mm_active", uid); _ssDel("mm_active_s"); }
  location.reload();
}

/* ---- the login screen ---- */
function authGate() {
  const users = authUsers();
  if (!Object.keys(users).length) return false;   // first run: creation flow handles it
  if (authActiveUid()) return false;
  showLoginScreen();
  return true;
}
function showLoginScreen() {
  document.getElementById("topbar").classList.add("hidden");
  document.getElementById("bottomnav").classList.add("hidden");
  const users = Object.values(authUsers()).sort((a, b) => (a.role === "teacher" ? 1 : 0) - (b.role === "teacher" ? 1 : 0) || a.name.localeCompare(b.name));
  setScreen(
    '<div id="welcome">' +
    '<div class="biglogo"><svg viewBox="0 0 24 24" width="64" height="64"><rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="none" stroke="var(--gold)" stroke-width="1.6"/><path d="M6.5 17V8l5.5 6 5.5-6v9" fill="none" stroke="var(--gold)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<h1>MindMasters Academy</h1>' +
    '<p class="sub" style="margin-top:8px">Who is training today?</p>' +
    '<div class="logingrid">' +
      users.map(u =>
        '<button class="logincard" data-uid="' + u.id + '">' +
          '<span class="loginav">' + u.av + '</span>' +
          '<span class="loginname">' + esc(u.name) + '</span>' +
          '<span class="loginrole">' + (u.role === "teacher" ? "Teacher" : "Student") + (u.hash ? " · 🔒" : "") + '</span>' +
          '<span class="lx logindel" data-del="' + u.id + '" title="Delete account">✕</span>' +
        '</button>').join("") +
    '</div>' +
    '<div id="loginPane"></div>' +
    '<div style="display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap">' +
      '<button class="btn gold small" id="addStudent">New student account</button>' +
      '<button class="btn ghost small" id="addTeacher">New teacher account</button>' +
      '<button class="btn ghost small" id="restoreBk">Restore a backup</button>' +
    '</div>' +
    '<p class="sub" style="margin-top:14px;font-size:11.5px">Accounts live on this device. Each account keeps its own progress, coins and classes.</p>' +
    '</div>'
  );
  document.getElementById("addStudent").addEventListener("click", () => { welcomeRole = "student"; showWelcome(); });
  document.getElementById("addTeacher").addEventListener("click", () => { welcomeRole = "teacher"; showWelcome(); });
  document.getElementById("restoreBk").addEventListener("click", () => showRestoreScreen(showLoginScreen));
  document.querySelectorAll(".logindel").forEach(x => x.addEventListener("click", e => {
    e.stopPropagation();
    const uid = x.dataset.del;
    const u = authUsers()[uid];
    askConfirm("Delete " + esc(u.name) + "'s account?", "All of this account's progress, coins, badges" + (u.role === "teacher" ? ", classes and collected results" : "") + " on this device are erased forever. There is no undo.", "Delete Forever", () => {
      authDeleteAccount(uid);
      showLoginScreen();
    });
  }));
  document.querySelectorAll(".logincard").forEach(c => c.addEventListener("click", e => {
    if (e.target.classList.contains("logindel")) return;
    const uid = c.dataset.uid;
    const u = authUsers()[uid];
    if (!u.hash) { doLogin(uid, true); return; }
    showLoginPw(uid);
  }));
}
function showLoginPw(uid) {
  const u = authUsers()[uid];
  const pane = document.getElementById("loginPane");
  if (!pane || !u) return;
  pane.innerHTML =
    '<div class="card loginpw">' +
      '<b>' + esc(u.name) + '</b><span class="sub" style="font-size:12px;margin-left:6px">' + (u.role === "teacher" ? "Teacher" : "Student") + '</span>' +
      '<div class="pwrow"><input type="password" class="lbinput" id="loginPwIn" placeholder="Password" autocomplete="off" style="margin:0;flex:1">' +
      '<button class="btn ghost small pweye" id="loginEye" title="Show password">👁</button></div>' +
      '<label class="stayrow"><input type="checkbox" id="stayIn" checked> Keep me signed in on this device</label>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn gold small" id="loginGo">Log in</button>' +
        '<button class="btn ghost small" id="loginForgot">Forgot?</button>' +
        '<span id="loginErr" style="color:var(--red);font-size:12px;font-weight:700"></span>' +
      '</div>' +
    '</div>';
  const inp = document.getElementById("loginPwIn");
  inp.focus();
  document.getElementById("loginEye").addEventListener("click", () => {
    inp.type = inp.type === "password" ? "text" : "password";
  });
  document.getElementById("loginForgot").addEventListener("click", () => {
    const hint = u.hint ? "Password hint: “" + esc(u.hint) + "”" : "No password hint was saved for this account.";
    toast("i", hint + " If the password is truly lost, this account cannot be opened; a parent or teacher can delete it with the ✕ and start fresh.");
  });
  const tryLogin = () => {
    const wait = lockWait(uid);
    if (wait) { document.getElementById("loginErr").textContent = "Too many tries. Wait " + wait + "s."; return; }
    const pw = inp.value;
    if (!pw) { document.getElementById("loginErr").textContent = "Enter the password."; return; }
    document.getElementById("loginGo").disabled = true;
    pwVerify(pw, u.hash, ok => {
      if (ok) { doLogin(uid, document.getElementById("stayIn").checked); return; }
      const L = lockNote(uid, false);
      document.getElementById("loginGo").disabled = false;
      const w2 = lockWait(uid);
      document.getElementById("loginErr").textContent = w2
        ? "Too many tries. Wait " + w2 + "s."
        : "Wrong password. " + Math.max(0, 5 - L.n) + (5 - L.n === 1 ? " try" : " tries") + " before a timeout.";
      Sfx.wrong();
    });
  };
  document.getElementById("loginGo").addEventListener("click", tryLogin);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
}

/* ---- password fields on the account creation screen ---- */
function pwFieldsHtml(role) {
  if (authActive()) return "";   // editing an existing account: password managed in settings
  return '<div class="pwsetup">' +
    '<div class="pwrow"><input type="password" class="lbinput" id="pwInput" placeholder="' + (role === "teacher" ? "Password (required)" : "Password (optional)") + '" autocomplete="off" style="margin:0;flex:1">' +
    '<button class="btn ghost small pweye" id="pwEye1" title="Show password">👁</button></div>' +
    '<div class="pwmeter"><div id="pwBar"></div></div><div id="pwLabel" class="pwlabel"></div>' +
    '<div class="pwrow"><input type="password" class="lbinput" id="pwConfirm" placeholder="Type it again" autocomplete="off" style="margin:0;flex:1"></div>' +
    '<input class="lbinput" id="pwHint" maxlength="60" placeholder="Password hint (optional), shown if you forget" autocomplete="off" style="margin-top:8px">' +
    (role === "teacher"
      ? '<p class="sub" style="font-size:11px;margin:6px 0 0">A password keeps your classes, rewards and reports away from curious students.</p>'
      : '<p class="sub" style="font-size:11px;margin:6px 0 0">A password keeps your account private on a shared device. You can skip it.</p>') +
    '</div>';
}
function attachPwUx() {
  const inp = document.getElementById("pwInput");
  if (!inp) return;
  const eye = document.getElementById("pwEye1");
  if (eye) eye.addEventListener("click", () => { inp.type = inp.type === "password" ? "text" : "password"; });
  inp.addEventListener("input", () => {
    const st = pwStrength(inp.value);
    const bar = document.getElementById("pwBar"), lab = document.getElementById("pwLabel");
    if (bar) { bar.style.width = (st.score * 20) + "%"; bar.style.background = st.color; }
    if (lab) { lab.textContent = st.label; lab.style.color = st.color; }
  });
}

/* ---- password settings for the signed-in account ---- */
function showPasswordSettings() {
  const u = authActive();
  if (!u) { toast("!", "No account is signed in."); return; }
  const hasPw = !!u.hash;
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Account and Password</h1>' +
    '<p class="sub">' + esc(u.name) + ' · ' + (u.role === "teacher" ? "Teacher" : "Student") + ' · account created ' + esc(u.created || "") + '</p></div></div>' +
    '<div class="card" style="padding:16px 18px;max-width:430px">' +
      (hasPw ? '<label class="flabel">Current password</label><div class="pwrow"><input type="password" class="lbinput" id="curPw" autocomplete="off" style="margin:0;flex:1"></div>' : '<p class="sub" style="margin:0 0 8px">This account has no password yet.</p>') +
      '<label class="flabel">' + (hasPw ? "New password" : "Password") + '</label>' +
      '<div class="pwrow"><input type="password" class="lbinput" id="pwInput" autocomplete="off" style="margin:0;flex:1">' +
      '<button class="btn ghost small pweye" id="pwEye1" title="Show password">👁</button></div>' +
      '<div class="pwmeter"><div id="pwBar"></div></div><div id="pwLabel" class="pwlabel"></div>' +
      '<label class="flabel">Type it again</label>' +
      '<div class="pwrow"><input type="password" class="lbinput" id="pwConfirm" autocomplete="off" style="margin:0;flex:1"></div>' +
      '<label class="flabel">Hint (optional)</label>' +
      '<input class="lbinput" id="pwHint" maxlength="60" value="' + esc(u.hint || "") + '" autocomplete="off">' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button class="btn gold small" id="pwSave">' + (hasPw ? "Change password" : "Set password") + '</button>' +
        (hasPw && u.role !== "teacher" ? '<button class="btn ghost small" id="pwRemove" style="color:var(--red)">Remove password</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:16px 18px;max-width:430px;display:flex;align-items:center;gap:12px">' +
      '<div style="flex:1"><b>Backup</b><div class="sub" style="font-size:12px;margin-top:2px">Save this account\'s progress as a code or file.</div></div>' +
      '<button class="btn ghost small" id="bkOpen">Back up</button>' +
    '</div>'
  );
  attachPwUx();
  const back = () => { if (u.role === "teacher") showTeacherHome(); else showProfile(); };
  document.getElementById("backBtn").addEventListener("click", back);
  document.getElementById("bkOpen").addEventListener("click", () => showBackupScreen(showPasswordSettings));
  const verifyCur = cb => {
    if (!hasPw) { cb(true); return; }
    pwVerify(document.getElementById("curPw").value, u.hash, cb);
  };
  document.getElementById("pwSave").addEventListener("click", () => {
    const pw = document.getElementById("pwInput").value;
    const pw2 = document.getElementById("pwConfirm").value;
    const err = authValidatePw(u.role, pw, pw2) || (!pw ? "Enter a new password." : null);
    if (err) { toast("!", err); return; }
    verifyCur(ok => {
      if (!ok) { toast("!", "The current password is wrong."); return; }
      pwMakeHash(pw, hash => {
        const users = authUsers();
        users[u.id].hash = hash;
        users[u.id].hint = document.getElementById("pwHint").value.trim().slice(0, 60);
        authSaveUsers(users);
        toast("✓", hasPw ? "Password changed." : "Password set. It will be asked at the next login.");
        back();
      });
    });
  });
  const rm = document.getElementById("pwRemove");
  if (rm) rm.addEventListener("click", () => {
    verifyCur(ok => {
      if (!ok) { toast("!", "The current password is wrong."); return; }
      askConfirm("Remove the password?", "Anyone using this device could then open this account.", "Remove", () => {
        const users = authUsers();
        users[u.id].hash = null;
        users[u.id].hint = "";
        authSaveUsers(users);
        toast("✓", "Password removed.");
        back();
      });
    });
  });
}

/* ================= PROGRESS BACKUP AND RESTORE =================
   A backup packs an account's entire saved state into one MMP1 code:
   JSON, deflate-compressed when the browser supports it, base64, and a
   djb2 checksum in the same PREFIX-payload-check shape as the other
   sharing codes. Restoring on any device rebuilds the account. Passwords
   are never included in a backup; a restored account starts unlocked and
   a new password can be set in Account and Password. */

function backupCollect() {
  const u = authActive();
  const role = u ? u.role : Store.get("mm_role", "student");
  if (role === "teacher") {
    return { v: 1, role: "teacher", name: u ? u.name : "", av: "🎓", state: Store.get("mm_teacher", {}) };
  }
  return { v: 1, role: "student", name: u ? u.name : (Store.get("mm_state", {}).name || ""), av: u ? u.av : "🦁", state: Store.get("mm_state", {}) };
}

function _utf8Bytes(str) { return new TextEncoder().encode(str); }
function _utf8String(bytes) { return new TextDecoder().decode(bytes); }
function _bytesToB64Big(b) {
  let s = "";
  for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  return btoa(s);
}
function _pipeBytes(bytes, stream, cb, fail) {
  try {
    new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()
      .then(buf => cb(new Uint8Array(buf)))
      .catch(fail);
  } catch (e) { fail(e); }
}

function backupEncode(obj, cb) {
  const raw = _utf8Bytes(JSON.stringify(obj));
  const finish = (flag, bytes) => {
    const b64 = _bytesToB64Big(bytes);
    cb("MMP1-" + flag + b64 + "-" + lbHash(flag + b64));
  };
  if (typeof CompressionStream === "function") {
    _pipeBytes(raw, new CompressionStream("deflate"), z => finish("z", z), () => finish("r", raw));
  } else {
    finish("r", raw);
  }
}

function backupDecode(code, cb) {
  const m = String(code || "").replace(/\s+/g, "").match(/^MMP1-([zr])([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) { cb("That does not look like a MindMasters backup code."); return; }
  const [, flag, b64, check] = m;
  if (lbHash(flag + b64) !== check) { cb("This backup code is damaged. Copy the whole code and try again."); return; }
  let bytes;
  try { bytes = _b64ToBytes(b64); } catch (e) { cb("This backup code is damaged. Copy the whole code and try again."); return; }
  const parse = data => {
    let obj;
    try { obj = JSON.parse(_utf8String(data)); } catch (e) { cb("This backup could not be read."); return; }
    if (!obj || obj.v !== 1 || !obj.state || (obj.role !== "student" && obj.role !== "teacher")) {
      cb("This backup could not be read."); return;
    }
    cb(null, obj);
  };
  if (flag === "z") {
    if (typeof DecompressionStream !== "function") { cb("This browser is too old to read compressed backups. Try a current version of Chrome, Safari or Edge."); return; }
    _pipeBytes(bytes, new DecompressionStream("deflate"), parse, () => cb("This backup could not be read."));
  } else {
    parse(bytes);
  }
}

/* apply a decoded backup: replace the matching account, or create a new one */
function backupApply(obj) {
  const users = authUsers();
  const name = String(obj.name || obj.state.name || "Champion").slice(0, 20);
  let uid = Object.keys(users).find(id => users[id].role === obj.role && users[id].name === name);
  if (!uid) {
    uid = (obj.role === "teacher" ? "t" : "u") + Math.random().toString(36).slice(2, 10);
    users[uid] = { id: uid, role: obj.role, name, av: obj.av || (obj.role === "teacher" ? "🎓" : "🦁"), hash: null, hint: "", created: todayStr() };
  } else if (obj.av) {
    users[uid].av = obj.av;
  }
  authSaveUsers(users);
  _lsSet("p:" + uid + ":" + (obj.role === "teacher" ? "mm_teacher" : "mm_state"), obj.state);
  _lsSet("p:" + uid + ":mm_role", obj.role);
  _lsSet("mm_active", uid);
  _ssDel("mm_active_s");
  location.reload();
}

function backupFileName(name) {
  const safe = String(name || "account").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 20) || "account";
  return "MindMasters_" + safe + "_" + todayStr() + ".txt";
}

function showBackupScreen(backTo) {
  const data = backupCollect();
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Back Up Progress</h1>' +
    '<p class="sub">One code holds everything: ratings, streaks, coins, badges and solved problems.</p></div></div>' +
    '<div class="card" style="padding:16px 18px">' +
      '<p class="sub" style="margin-bottom:10px">Progress lives only in this browser. Keep a backup so a cleared browser or a new device never costs ' + esc(data.name || "you") + ' anything. Passwords are not included.</p>' +
      '<textarea class="lbinput" id="bkOut" readonly rows="5" style="width:100%;font-size:11px;word-break:break-all" placeholder="Preparing your backup code…"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button class="btn gold small" id="bkCopy" disabled>Copy code</button>' +
        '<button class="btn small" id="bkFile" disabled>Save as file</button>' +
      '</div>' +
      '<p class="sub" style="font-size:11.5px;margin-top:10px">To move to another device: open MindMasters there, choose "Restore a backup" on the login screen, and paste the code or pick the file.</p>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", backTo);
  backupEncode(data, code => {
    const out = document.getElementById("bkOut");
    if (!out) return;
    out.value = code;
    const copyBtn = document.getElementById("bkCopy"), fileBtn = document.getElementById("bkFile");
    copyBtn.disabled = false; fileBtn.disabled = false;
    copyBtn.addEventListener("click", () => {
      const done = () => { copyBtn.textContent = "Copied!"; setTimeout(() => { copyBtn.textContent = "Copy code"; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, () => fallbackCopy(code, done));
      else fallbackCopy(code, done);
    });
    fileBtn.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
      a.download = backupFileName(data.name);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    });
  });
}

function showRestoreScreen(backTo) {
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Restore a Backup</h1>' +
    '<p class="sub">Paste a backup code, or pick a saved backup file.</p></div></div>' +
    '<div class="card" style="padding:16px 18px">' +
      '<textarea class="lbinput" id="rsIn" rows="5" style="width:100%;font-size:11px;word-break:break-all" placeholder="MMP1-…"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">' +
        '<button class="btn gold small" id="rsGo">Restore</button>' +
        '<label class="btn ghost small" style="cursor:pointer">Pick a file<input type="file" id="rsFile" accept=".txt,text/plain" style="display:none"></label>' +
        '<span id="rsErr" style="color:var(--red);font-size:12px;font-weight:700"></span>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", backTo);
  const err = msg => { const el = document.getElementById("rsErr"); if (el) el.textContent = msg || ""; };
  const attempt = code => {
    err("");
    backupDecode(code, (e, obj) => {
      if (e) { err(e); return; }
      const users = authUsers();
      const name = String(obj.name || obj.state.name || "Champion").slice(0, 20);
      const existing = Object.keys(users).find(id => users[id].role === obj.role && users[id].name === name);
      const what = obj.role === "teacher" ? "teacher account" : "student account";
      if (existing) {
        askConfirm("Replace " + esc(name) + "?", "A " + what + " named " + esc(name) + " already exists on this device. Restoring replaces its progress with the backup. There is no undo.", "Replace", () => backupApply(obj));
      } else {
        askConfirm("Restore " + esc(name) + "?", "This creates the " + what + " " + esc(name) + " on this device with all of the backup's progress.", "Restore", () => backupApply(obj));
      }
    });
  };
  document.getElementById("rsGo").addEventListener("click", () => attempt(document.getElementById("rsIn").value));
  document.getElementById("rsFile").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => attempt(String(r.result));
    r.onerror = () => err("That file could not be read.");
    r.readAsText(f);
  });
}
