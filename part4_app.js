/* ================= GAME ENGINE (app logic) ================= */

/* ---- merge real content into the topic banks ---- */
(function mergeGenerated() {
  if (typeof AIME_EXTRA !== "undefined") {
    const aime = MATH_TOPICS.find(t => t.id === "aime");
    if (aime) {
      aime.problems = aime.problems.concat(AIME_EXTRA);
      aime.sub = aime.problems.length + " real past AIME problems: answers 0–999";
    }
  }
  if (typeof TEXT_BANK !== "undefined") {
    const attach = (id, arr) => {
      const t = MATH_TOPICS.find(x => x.id === id);
      if (t && arr) t.problems = t.problems.concat(arr);
    };
    attach("arith", TEXT_BANK.gsm);
    attach("prealg", TEXT_BANK.prealg);
    attach("algebra", TEXT_BANK.algebra);
    attach("geometry", TEXT_BANK.geometry);
    attach("counting", TEXT_BANK.counting);
    attach("numtheory", TEXT_BANK.numtheory);
    const arith = MATH_TOPICS.find(t => t.id === "arith");
    if (arith) { arith.sub = "Arithmetic skills + " + (TEXT_BANK.gsm || []).length + " real word problems"; }
    const amcT = MATH_TOPICS.find(t => t.id === "amc");
    if (amcT && TEXT_BANK.amc23) {
      amcT.name = "AMC Arena"; amcT.problems = amcT.problems.concat(TEXT_BANK.amc23);
      amcT.sub = "Contest technique drills + the real AMC 2023 problems";
    }
    const aimeT = MATH_TOPICS.find(t => t.id === "aime");
    if (aimeT && TEXT_BANK.aime24) {
      aimeT.problems = aimeT.problems.concat(TEXT_BANK.aime24);
      aimeT.sub = aimeT.problems.length + " real AIME problems (1983–2024)";
    }
    MATH_TOPICS.push({
      id: "interalg", name: "Advanced Algebra", icon: "🧬", color: "#3a1055",
      sub: TEXT_BANK.interalg.length + " real competition problems: Levels ramp 1→5", diff: 3,
      lesson: "Intermediate Algebra from real competitions: <b>polynomials</b>, <b>inequalities</b>, <b>sequences & series</b>, <b>functional equations</b>, <b>complex numbers</b>. Levels follow the official difficulty grades; Level sets near the end are AIME-caliber.",
      problems: TEXT_BANK.interalg
    });
    MATH_TOPICS.push({
      id: "precalc", name: "Precalc Summit", icon: "📐", color: "#0d4455",
      sub: TEXT_BANK.precalc.length + " real competition problems: trig, vectors & matrices", diff: 3,
      lesson: "Real competition precalculus: <b>trigonometric identities</b>, <b>polar form & De Moivre</b>, <b>vectors, dot & cross products</b>, <b>matrices & determinants</b>. Graded Level 1→5; the summit is steep.",
      problems: TEXT_BANK.precalc
    });
    MATH_TOPICS.push({
      id: "olymp", name: "Olympiad Peak", icon: "🗻", color: "#4a1010", group: "comp",
      sub: TEXT_BANK.olymp.length + " real olympiad problems: the hardest bank in the app", diff: 4,
      lesson: "Genuine olympiad problems (IMO-family and national olympiads). These are meant to take a LONG time. Answers are numeric; full rigor lives in the official solutions. Scale the mountain one problem at a time!",
      problems: TEXT_BANK.olymp
    });
  }
  if (typeof AOPS_BANK !== "undefined") {
    MATH_TOPICS.push({
      id: "amc8", name: "AMC 8 Arena", icon: "🎒", color: "#0e3c5c", group: "comp",
      sub: AOPS_BANK.amc8.length + " AMC 8 problems from the official archive (1999-2025)", diff: 2,
      lesson: "Problems from past AMC 8 contests, shown exactly as published, with the answer choices inside each problem. Answer with the letter buttons. Grading uses the official answer keys.",
      problems: AOPS_BANK.amc8
    });
    MATH_TOPICS.push({
      id: "amc10", name: "AMC 10 Arena", icon: "🏛️", color: "#103c6b", group: "comp",
      sub: AOPS_BANK.amc10.length + " AMC 10 problems from the official archive (2000-2024)", diff: 3,
      lesson: "Problems from past AMC 10 contests, shown exactly as published. Each problem is labeled with its contest and number, and questions are selected to match your rating. Grading uses the official answer keys.",
      problems: AOPS_BANK.amc10
    });
    MATH_TOPICS.push({
      id: "amc12", name: "AMC 12 Arena", icon: "🏆", color: "#3a1055", group: "comp",
      sub: AOPS_BANK.amc12.length + " AMC 12 problems from the official archive (2000-2024)", diff: 3,
      lesson: "Problems from past AMC 12 contests, shown exactly as published. Each problem is labeled with its contest and number, and questions are selected to match your rating. Grading uses the official answer keys.",
      problems: AOPS_BANK.amc12
    });
    const aimeT = MATH_TOPICS.find(t => t.id === "aime");
    if (aimeT) {
      const scraped = AOPS_BANK.aime.filter(p => !p.q.startsWith("<b>[2024 AIME"));
      aimeT.problems = aimeT.problems.concat(scraped);
      aimeT.sub = aimeT.problems.length + " AIME problems from the official archive (1983-2024)";
      aimeT.lesson = "Problems from past AIME exams, shown exactly as published. Answers are integers from 0 to 999. Grading uses the official answer keys. The first problems in each exam are labeled with low numbers; problem 12 to 15 are among the hardest questions offered to high school students.";
    }
    // the same problems also count toward their subject topics
    if (typeof AOPS_TOPICS !== "undefined") {
      for (const [tid, refs] of Object.entries(AOPS_TOPICS)) {
        const t = MATH_TOPICS.find(x => x.id === tid);
        if (!t) continue;
        for (const [bk, idx] of refs) {
          const src = AOPS_BANK[bk] && AOPS_BANK[bk][idx];
          if (src) t.problems.push(src);
        }
      }
    }
  }
  // competition grouping flags
  const asComp = ["amc", "aime", "amc8", "amc10", "amc12", "olymp"];
  MATH_TOPICS.forEach(t => { if (asComp.includes(t.id)) t.group = "comp"; });
  const amcTopic = MATH_TOPICS.find(t => t.id === "amc");
  if (amcTopic) { amcTopic.name = "AMC 10/12 Arena"; }
  if (typeof VAULT_PROBLEMS !== "undefined") {
    MATH_TOPICS.push({
      id: "vault", name: "Championship Vault", icon: "🏅", color: "#7a1040",
      sub: VAULT_PROBLEMS.length + " hand-crafted competition problems: every one a real challenge", diff: 4,
      lesson: "Original competition-grade problems: <b>Newton's identities</b>, <b>derangements</b>, the <b>British Flag Theorem</b>, <b>telescoping factorials</b>, <b>domino tilings</b>, and more. No formulas-by-rote here; each one needs an idea.",
      problems: VAULT_PROBLEMS
    });
  }
  // real difficulty progression: sort every topic's problems easiest -> hardest
  // (official Level 1-5 grades where available, then coarse difficulty, keeping original order as tiebreak)
  MATH_TOPICS.forEach(t => {
    if (t.id === "aime") return; // chronological, already meaningful
    t.problems = t.problems.map((p, i) => [p, i])
      .sort((a, b) => (a[0].diff - b[0].diff) || ((a[0].lv || 0) - (b[0].lv || 0)) || (a[1] - b[1]))
      .map(x => x[0]);
  });
  if (typeof CHESS_GEN !== "undefined") {
    const mkBoard = (p, diff) => {
      if (p.kind === "mate1") return {
        type: "board", diff, kind: "mate1", tag: "Mate in 1", nm: p.nmates || 1,
        q: "Find the checkmate in ONE move! (Any mating move counts.)",
        fen: p.fen, solutions: [p.sol],
        sol: "One winning move: <b>" + p.sol[0] + " → " + p.sol[1] + "</b>" + (p.nmates > 1 ? " (other mates exist too; any counts!)" : "") + ". Always scan every check first!"
      };
      if (p.kind === "mate2") return {
        type: "board", diff, kind: "mate2", tag: "Mate in 2",
        q: "Force checkmate in TWO moves: find the one key move, then finish the job!",
        fen: p.fen, solutions: [p.sol],
        sol: "The key move is <b>" + p.sol[0] + " → " + p.sol[1] + "</b>; after any reply, a mate-in-1 follows. Forcing moves first!"
      };
      const tgtName = p.tgt || "piece";
      return {
        type: "board", diff, kind: "move", tag: "Win the " + tgtName,
        q: "White to move: win the " + tgtName + " by force!",
        fen: p.fen, solutions: p.sol,
        sol: "<b>" + p.sol[0][0] + " → " + p.sol[0][1] + "</b>! Whatever Black tries, the " + tgtName + " can't be saved."
      };
    };
    const addModule = (id, name, icon, color, sub, diff, lesson, arr) => {
      CHESS_MODULES.push({ id, name, icon, color, sub, diff, lesson, items: arr.map(p => mkBoard(p, diff)) });
    };
    // trimmed warm-up drills (single-movers, for beginners)
    addModule("mate1h", "Mate Warm-Ups I", "⚡", "#123c63",
      "Queen & rook mates in one: quick pattern drills", 2,
      "Heavy pieces build walls. The queen mates with king support or against the edge; rooks rule ranks and files. In every puzzle a <b>one-move checkmate</b> exists, and ANY mate you find counts!",
      CHESS_GEN.mate1h.slice(0, 100));
    addModule("mate1m", "Mate Warm-Ups II", "🎯", "#4a2a63",
      "Knight, bishop & pawn mates in one: trickier patterns", 3,
      "Minor pieces mate with finesse: knight smothers, bishop crossfires, humble pawn strikes. Every puzzle has a mate in one by a knight, bishop, or pawn (other mates count too).",
      CHESS_GEN.mate1m.slice(0, 100));
    addModule("mate2", "Mate-in-Two Masters", "🧨", "#6b1010",
      CHESS_GEN.mate2.length + " forced two-move mates: find the unique key move", 4,
      "One <b>unique key move</b> forces mate against every defense. Play the key, watch the defense, deliver the blow.",
      CHESS_GEN.mate2);
    addModule("forks", "Fork Factory", "🍴", "#6b1d3a",
      "Royal knight forks: check the king, win the loot", 2,
      "The knight's signature crime: a <b>royal fork</b> checks the king while attacking a heavy piece. The king must respond, and then the loot falls.",
      CHESS_GEN.forks.slice(0, 100));
    addModule("hanging", "Loose Piece Patrol", "🕵️", "#0e4d3c",
      "Spot the one undefended piece and take it", 2,
      "'Loose pieces drop off!' In each position exactly <b>one</b> black piece hangs with no protection. Find it, take it, keep it.",
      CHESS_GEN.hanging.slice(0, 80));
    addModule("skewers", "Skewer School", "🍢", "#5b3a10",
      "Check first, collect what's hiding behind", 3,
      "A <b>skewer</b> attacks the king first and collects the piece behind it on the same line. Check, king moves, capture.",
      CHESS_GEN.skewers.slice(0, 70));
  }
  if (typeof MINED_PUZZLES !== "undefined") {
    const lineItem = (p) => {
      const isMate = p.kind === "linemate";
      const nWhite = Math.ceil(p.line.length / 2);
      const lineStr = p.line.map((m, i) => (i % 2 === 0 ? "<b>" : "") + m[0] + "→" + m[1] + (i % 2 === 0 ? "</b>" : "")).join(", ");
      return {
        type: "board", kind: "line", diff: isMate ? (p.mate_n >= 3 ? 4 : 3) : 4, mn: p.mate_n || 0,
        tag: isMate ? "Mate in " + p.mate_n : "Combination",
        q: isMate
          ? "White to move. Force checkmate in " + p.mate_n + " moves against the strongest defense."
          : "White to move. Find the " + nWhite + "-move sequence that wins decisive material.",
        fen: p.fen, line: p.line, mateLine: isMate,
        sol: "The winning moves were: " + lineStr + " (yours in bold). " + (isMate ? "The enemy king had nowhere to run." : "That wins enough material to win the game.")
      };
    };
    if (MINED_PUZZLES.linemates && MINED_PUZZLES.linemates.length) {
      CHESS_MODULES.push({
        id: "linemates", name: "Mate Hunt: Deep Forcing Lines", icon: "🏹", color: "#3a0d1d", diff: 4,
        sub: MINED_PUZZLES.linemates.length + " forced mates in 2–5 from real game positions",
        lesson: "These positions come from real games: full boards, real defenses. Calculate the <b>forcing sequence</b>: every check, capture, and threat, all the way to mate. Black always plays the toughest defense.",
        items: MINED_PUZZLES.linemates.map(lineItem)
      });
    }
    if (MINED_PUZZLES.combos && MINED_PUZZLES.combos.length) {
      CHESS_MODULES.push({
        id: "combos", name: "Combination Clinic", icon: "🔗", color: "#0d3a2e", diff: 4,
        sub: MINED_PUZZLES.combos.length + " multi-move winning combinations from real games",
        lesson: "The hardest skill in chess: a <b>combination</b>: a forced multi-move sequence that wins decisive material. Only one move works at each step, and Black always plays the best defense. Calculate before you touch!",
        items: MINED_PUZZLES.combos.map(lineItem)
      });
    }
  }
  if (typeof LICHESS_BANK !== "undefined") {
    const LI_DEFS = {
      limate1:  ["Checkmate in One", "⚡", "#123c63", "Find the move that delivers immediate checkmate. Any move that checkmates is accepted."],
      limate2:  ["Checkmate in Two", "🧨", "#4a1030", "Force checkmate in two moves against the strongest defense."],
      limatedeep: ["Deep Checkmates", "🏹", "#3a0d1d", "Force checkmate in three to five moves. Calculate the full sequence before playing."],
      lifork:   ["Forks", "🍴", "#6b1d3a", "Win material with a double attack."],
      lipin:    ["Pins", "📌", "#1a3a5c", "Win material by exploiting a pinned piece."],
      liskewer: ["Skewers", "🍢", "#5b3a10", "Attack a valuable piece and capture the piece behind it."],
      lidisc:   ["Discovered Attacks", "🎭", "#3f2d63", "Move one piece to unleash an attack from another."],
      lisac:    ["Sacrifices", "💎", "#5c1a3a", "Give up material to gain a decisive advantage."],
      lihang:   ["Undefended Pieces", "🕵️", "#0e4d3c", "Identify and capture an unprotected piece."],
      lideflect: ["Deflection", "🧲", "#4d3c0e", "Draw a defender away from its duty, then strike."],
      liend:    ["Endgame Technique", "👑", "#3f4d10", "Convert winning rook, pawn, and queen endgames with precise play."],
      lipromo:  ["Pawn Promotion", "🚀", "#0d4455", "Advance a passed pawn to promotion."],
      lidef:    ["Best Defense", "🛡️", "#2d3a4a", "Find the only move that holds the position."],
      liking:   ["King Attacks", "🔥", "#6b1010", "Break through to the enemy king."],
      liopen:   ["Opening Tactics", "📖", "#123c63", "Punish inaccurate opening play."],
      ligm:     ["Grandmaster Gauntlet", "🏆", "#4a1010", "The most difficult puzzles in the app, rated 2500 and above."]
    };
    const liItem = p => {
      const isMate = p.th.indexOf("mateIn") >= 0;
      const nMoves = Math.ceil(p.line.length / 2);
      const lineStr = p.line.map((m, i) => (i % 2 === 0 ? "<b>" : "") + m[0] + "→" + m[1] + (m[2] ? "=" + m[2].toUpperCase() : "") + (i % 2 === 0 ? "</b>" : "")).join(", ");
      return {
        type: "board", kind: "line", li: 1, pw: p.pw,
        diff: p.r < 1100 ? 1 : (p.r < 1600 ? 2 : (p.r < 2100 ? 3 : 4)), lv: p.r, er: p.r,
        tag: p.pw ? "White to move" : "Black to move", mateLine: isMate,
        q: (p.pw ? "White" : "Black") + " to move. " + (isMate ? "Find the checkmate" : "Find the winning idea") + " (" + nMoves + (nMoves > 1 ? " moves" : " move") + ").",
        fen: p.fen, line: p.line,
        sol: "The winning moves were: " + lineStr + " (yours in bold)." + (isMate ? " The enemy king had nowhere to run." : " That wins the game.")
      };
    };
    for (const [mid, arr] of Object.entries(LICHESS_BANK)) {
      const def = LI_DEFS[mid];
      if (!def || !arr.length) continue;
      CHESS_MODULES.push({
        id: mid, name: def[0], icon: def[1], color: def[2], group: "li",
        diff: 3, sub: arr.length + " puzzles, rated " + arr[0].r + " to " + arr[arr.length - 1].r,
        lesson: def[3] + " Puzzles are drawn from tournament positions and selected to match your current rating. When you play as Black, the board is shown from Black's side.",
        items: arr.map(liItem)
      });
    }
  }
  // real difficulty progression inside every chess module
  const pieceCount = fen => (fen.split(" ")[0].match(/[a-zA-Z]/g) || []).length;
  CHESS_MODULES.forEach(m => {
    if (m.id === "mate1h" || m.id === "mate1m") {
      // more available mates and fewer pieces = easier to spot -> those come first
      m.items.sort((a, b) => (b.nm || 1) - (a.nm || 1) || pieceCount(a.fen) - pieceCount(b.fen));
    } else if (m.id === "linemates") {
      // ramp by mate depth, then by board complexity
      m.items.sort((a, b) => (a.mn - b.mn) || (pieceCount(a.fen) - pieceCount(b.fen)));
    } else if (m.id === "mate2" || m.id === "forks" || m.id === "hanging" || m.id === "skewers" || m.id === "combos") {
      // sparser boards first, crowded boards later
      m.items.sort((a, b) => pieceCount(a.fen) - pieceCount(b.fen));
    }
  });

  // ---- estimated problem ratings (powers the adaptive trainer and the player rating) ----
  function mathEr(tid, p) {
    if (p.er) return p.er;
    if (tid === "amc8") return 520 + (p.lv || 1) * 45;
    if (tid === "aime") return 2150;
    if (tid === "amc") return p.tex ? 1700 : 400 + (p.diff || 2) * 250;
    if (tid === "vault") return 1900;
    if ((tid === "hmmt" || tid === "pcf" || tid === "olymp") && p.lv) return 900 + p.lv * 180;
    if (tid === "olymp") return 2350;
    if (p.lv >= 1 && p.lv <= 5) return [0, 800, 1050, 1300, 1600, 1950][p.lv];
    if (p.lv > 5) return 900 + p.lv * 180;
    return [0, 600, 900, 1300, 1800][p.diff || 2];
  }
  function chessEr(mid, it) {
    if (it.er) return it.er;
    if (mid === "linemates") return 900 + (it.mn || 2) * 180;
    if (mid === "mate2") return 1250;
    if (mid === "mate1h") return 850;
    if (mid === "mate1m") return 1000;
    if (mid === "forks") return 800;
    if (mid === "hanging") return 750;
    if (mid === "skewers") return 950;
    if (mid === "combos") return 1500;
    if (mid === "openings") return 700;
    if (mid === "endgames") return 850;
    if (mid === "tactics") return 950;
    if (mid === "strategy") return 1050;
    return 300 + (it.diff || 2) * 300;
  }
  MATH_TOPICS.forEach(t => t.problems.forEach(p => { p.er = mathEr(t.id, p); }));
  CHESS_MODULES.forEach(m => m.items.forEach(it => { it.er = chessEr(m.id, it); }));
  // one-move checkmates are pattern drills: their community ratings run high, so scale them down
  CHESS_MODULES.forEach(m => {
    if (m.id === "limate1") m.items.forEach(it => { it.er = Math.round(400 + (it.er - 550) * 0.62); });
    if (m.id === "limate2") m.items.forEach(it => { it.er = Math.max(500, it.er - 120); });
  });
  // competition provenance labels (any copy of a problem that carries a source tag)
  MATH_TOPICS.forEach(t => {
    t.problems.forEach(p => {
      if (p.src && !p.tagged) { p.tagged = 1; p.q = "<b>[" + p.src + "]</b>  " + p.q; }
    });
  });
  // shared problem identity: solving a problem anywhere credits every bank that contains it
  window.UID_INDEX = {};
  let uidSeq = 0;
  const contentKey = p => (p.fen ? "F" + p.fen : "Q" + String(p.q).replace(/^<b>\[[^\]]*\]<\/b>\s*/, "").slice(0, 140));
  const keyToUid = {};
  const register = (tid, arr) => {
    arr.forEach((p, gi) => {
      const ck = contentKey(p);
      if (!(ck in keyToUid)) keyToUid[ck] = ++uidSeq;
      p.uid = keyToUid[ck];
      (UID_INDEX[p.uid] = UID_INDEX[p.uid] || []).push([tid, gi]);
    });
  };
  MATH_TOPICS.forEach(t => register(t.id, t.problems));
  CHESS_MODULES.forEach(m => register(m.id, m.items));

  // ---- practice-test index: group competition problems by contest ----
  window.CONTESTS = {};
  (function buildContests() {
    const conf = {
      amc8: { n: 25, min: 17, minutes: 40 },
      amc10: { n: 25, min: 20, minutes: 75 },
      amc12: { n: 25, min: 20, minutes: 75 },
      aime: { n: 15, min: 12, minutes: 180 }
    };
    for (const [tid, cf] of Object.entries(conf)) {
      const t = MATH_TOPICS.find(x => x.id === tid);
      if (!t) continue;
      const byContest = {};
      t.problems.forEach((p, gi) => {
        const m = String(p.q).match(/^(?:<b>)?\[(.+?)\s*(?:·\s*)?#(\d+)\]/);
        if (!m) return;
        const arr = byContest[m[1]] = byContest[m[1]] || [];
        if (!arr.some(e => e.n === +m[2])) arr.push({ gi, n: +m[2] });   // one entry per problem number
      });
      const list = [];
      for (const [name, probs] of Object.entries(byContest)) {
        if (probs.length < cf.min) continue;
        probs.sort((a, b) => a.n - b.n);
        const ym = name.match(/^(\d{4})/);
        list.push({ name, topicId: tid, probs, expected: cf.n, minutes: cf.minutes, year: ym ? +ym[1] : 0 });
      }
      list.sort((a, b) => b.year - a.year || (a.name < b.name ? -1 : 1));
      CONTESTS[tid] = list;
    }
  })();

  // ---- copy cleanup: keep descriptions plain and consistent ----
  MATH_TOPICS.concat(CHESS_MODULES).forEach(t => {
    if (t.sub) t.sub = t.sub.replace(/(\d[\d,]*) real /g, "$1 ").replace(/\s+—\s+/g, ", ").replace(/—/g, "-").replace(/ → /g, " to ");
    if (t.lesson) t.lesson = t.lesson.replace(/(\d[\d,]*) real /g, "$1 ").replace(/\s+—\s+/g, ". ").replace(/—/g, "-");
  });
})();

/* ---- safe storage ---- */
const Store = (() => {
  let mem = {};
  let ok = false;
  try {
    const t = "__mm_test__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    ok = true;
  } catch (e) { ok = false; }
  const SCOPED = { mm_state: 1, mm_teacher: 1, mm_role: 1 };   // per-account keys
  let prof = null;
  const keyOf = k => (prof && SCOPED[k]) ? "p:" + prof + ":" + k : k;
  return {
    get(k, d) {
      try {
        const kk = keyOf(k);
        const v = ok ? window.localStorage.getItem(kk) : mem[kk];
        return v == null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set(k, v) {
      const kk = keyOf(k);
      const s = JSON.stringify(v);
      if (ok) { try { window.localStorage.setItem(kk, s); } catch (e) { mem[kk] = s; } }
      else mem[kk] = s;
    },
    del(k) {
      const kk = keyOf(k);
      if (ok) { try { window.localStorage.removeItem(kk); } catch (e) {} }
      delete mem[kk];
    },
    setProfile(id) { prof = id; },
    profile() { return prof; },
    persistent: ok
  };
})();
/* choose the signed-in account before any state loads */
if (typeof authBoot === "function") authBoot();

/* ---- state ---- */
const DEFAULT_STATE = {
  name: "", avatar: "🦁", xp: 0,
  correctTotal: 0, answeredTotal: 0, mathCorrect: 0, chessCorrect: 0,
  combo: 0, bestCombo: 0,
  streak: 0, maxStreak: 0, lastActive: "",
  badges: {},
  progress: {},
  matesSolved: {}, aimeSolved: {},
  dailyDoneOn: "", dailyCount: 0,
  duelsPlayed: 0, duelWins: 0,
  gamesPlayed: 0, gamesWon: 0,
  duelUsed: {}, lichessSolved: 0,
  mathElo: 800, chessElo: 800, mathEloGames: 0, chessEloGames: 0,
  mathEloPeak: 800, chessEloPeak: 800,
  todayDate: "", todayCount: 0, dailyGoalHit: "", perfectSessions: 0,
  trainBias: "m", reviewQueue: {}, testBest: {}, testsTaken: 0, reviewCleared: 0,
  lbPeers: {}, cloud: { url: "", cls: "" },
  assignments: {},
  coins: 0, coinsEarned: 0, owned: null, frame: "none",
  goalDays: 0, earlySolves: 0, lateSolves: 0, weekendSolves: 0,
  hardSolved: 0, bestScalp: 0, daysActive: 0,
  asgDone: 0, asgPerfect: 0, testAce: 0, testArenas: {},
  freezes: 0, repairOffer: null, chestOpenOn: "", revToday: null, asgToday: null,
  season: null, seasonHist: {}, challenges: {}, metrics: {}, onboarded: 0, lastGift: "", pbCount: 0,
  tryFirst: 0, trySecond: 0, tryFailed: 0, tryQuit: 0,
  items: null, redeemed: null, lastAnn: null
};
let S = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), Store.get("mm_state", {}));
if (!S.owned) S.owned = { av: ["🦁", "🦊", "🐼", "🦉"], fr: ["none"] };
if (!S.charOwned) S.charOwned = {};
if (!S.accOwned) S.accOwned = [];
if (S.char === undefined) S.char = null;
if (S.avatar && S.owned.av.indexOf(S.avatar) < 0) S.owned.av.push(S.avatar);   // returning players keep their avatar
if (S.frame && S.owned.fr.indexOf(S.frame) < 0) S.owned.fr.push(S.frame);
if (!S.onboarded && S.name) S.onboarded = 1;   // existing players skip the welcome quest
if (!S.items) S.items = { fifty: 1, hintP: 1 };   // welcome pack: one of each power-up
if (!S.redeemed) S.redeemed = {};
if (((S.tryFirst || 0) + (S.trySecond || 0) + (S.tryFailed || 0) + (S.tryQuit || 0)) === 0 && S.answeredTotal > 0) {
  // saves from before the outcome tracker: start from the known totals
  S.tryFirst = S.correctTotal || 0;
  S.tryQuit = Math.max(0, (S.answeredTotal || 0) - (S.correctTotal || 0));
}
function save() { Store.set("mm_state", S); }
function earnCoins(n) { S.coins = (S.coins || 0) + n; S.coinsEarned = (S.coinsEarned || 0) + n; }
function frCls() { return S.frame && S.frame !== "none" ? " fr-" + S.frame : ""; }
function avDisplay(size) {
  if (S.char && typeof charMini === "function") {
    return '<span class="charav">' + charMini(size || 48) + '</span>';
  }
  return S.avatar;
}

/* ---- leveling ---- */
const LEVEL_XP = [0, 50, 120, 220, 350, 520, 740, 1020, 1360, 1780, 2280, 2900, 3600, 4400, 5300];
const TITLES = ["Rookie", "Apprentice", "Scholar", "Strategist", "Tactician", "Challenger", "Champion", "Master", "Grandmaster", "Legend", "Mythic", "Immortal", "Celestial", "Cosmic", "Infinite"];
function xpForLevel(l) {
  return l <= LEVEL_XP.length ? LEVEL_XP[l - 1] : LEVEL_XP[LEVEL_XP.length - 1] + (l - LEVEL_XP.length) * 1000;
}
function levelInfo(xp) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1) && lvl < 99) lvl++;
  return { lvl, floor: xpForLevel(lvl), ceil: xpForLevel(lvl + 1), title: TITLES[Math.min(lvl - 1, TITLES.length - 1)] };
}

/* ---- content helpers ---- */
function allTopics() {
  return MATH_TOPICS.map(t => ({ id: t.id, n: t.problems.length }))
    .concat(CHESS_MODULES.map(m => ({ id: m.id, n: m.items.length })));
}
function topicItems(id) {
  const mt = MATH_TOPICS.find(t => t.id === id);
  if (mt) return mt.problems;
  const cm = CHESS_MODULES.find(m => m.id === id);
  return cm ? cm.items : [];
}
function prog(id) {
  if (!S.progress[id]) S.progress[id] = { correct: {}, attempted: {} };
  return S.progress[id];
}
function correctCount(id) { return Object.keys(prog(id).correct).length; }
function topicComplete(id) { return correctCount(id) >= topicItems(id).length; }
function perfectCount() { return allTopics().filter(t => topicComplete(t.id)).length; }

/* ---- level sets: topics are split into sets of 10 ---- */
const SET_SIZE = 10;
function setCount(id) { return Math.ceil(topicItems(id).length / SET_SIZE); }
function setSolvedCount(id, si) {
  const items = topicItems(id), p = prog(id);
  let c = 0;
  for (let gi = si * SET_SIZE; gi < Math.min(items.length, (si + 1) * SET_SIZE); gi++) if (p.correct[gi]) c++;
  return c;
}
function setSize(id, si) { return Math.min(topicItems(id).length, (si + 1) * SET_SIZE) - si * SET_SIZE; }
function setsCompletedTotal() {
  let n = 0;
  for (const t of allTopics())
    for (let si = 0; si < setCount(t.id); si++)
      if (setSolvedCount(t.id, si) >= setSize(t.id, si)) n++;
  return n;
}

/* ---- tiered badges (5 stars each: Bronze → Silver → Gold → Platinum → Diamond) ---- */
const TIER_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
const FAMILIES = [
  /* Solving */
  { id: "mathc", sec: "solve", name: "Math Star", metric: () => S.mathCorrect, tiers: [50, 250, 1000, 3000, 7000], unit: "math problems solved" },
  { id: "chessc", sec: "solve", name: "Chess Star", metric: () => S.chessCorrect, tiers: [100, 500, 1500, 4000, 9000], unit: "chess challenges solved" },
  { id: "lich", sec: "solve", name: "Puzzle Prodigy", metric: () => S.lichessSolved || 0, tiers: [50, 250, 1000, 3000, 8000], unit: "arena puzzles solved" },
  { id: "aime", sec: "solve", name: "Dragon Slayer", metric: () => Object.keys(S.aimeSolved).length, tiers: [10, 50, 150, 400, 900], unit: "AIME problems solved" },
  { id: "mates", sec: "solve", name: "Mate Artist", metric: () => Object.keys(S.matesSolved).length, tiers: [25, 100, 400, 1200, 3000], unit: "checkmates delivered" },
  { id: "answers", sec: "solve", name: "Grinder", metric: () => S.answeredTotal, tiers: [100, 500, 1500, 4000, 9000], unit: "questions attempted" },
  { id: "scalp", sec: "solve", name: "Giant Slayer", metric: () => S.hardSolved || 0, tiers: [1, 10, 40, 120, 300], unit: "wins over problems rated 300 above you" },
  /* Ratings */
  { id: "mrating", sec: "rating", name: "Math Rating", metric: () => S.mathElo || 800, tiers: [1000, 1300, 1600, 2000, 2400], unit: "math rating reached" },
  { id: "crating", sec: "rating", name: "Chess Rating", metric: () => S.chessElo || 800, tiers: [1000, 1300, 1600, 2000, 2400], unit: "chess rating reached" },
  { id: "mind", sec: "rating", name: "MindMaster", metric: () => { const r = mindRating(); return r.ready ? r.val : 0; }, tiers: [1000, 1250, 1500, 1800, 2200], unit: "Mind Rating reached" },
  /* Dedication */
  { id: "streak", sec: "ded", name: "Streak Keeper", metric: () => S.maxStreak, tiers: [3, 7, 14, 30, 75], unit: "day practice streak" },
  { id: "daily", sec: "ded", name: "Daily Devotee", metric: () => S.dailyCount, tiers: [1, 7, 30, 75, 150], unit: "daily challenges won" },
  { id: "goal", sec: "ded", name: "Goal Getter", metric: () => S.goalDays || 0, tiers: [3, 10, 25, 60, 120], unit: "daily goals reached" },
  { id: "early", sec: "ded", name: "Early Bird", metric: () => S.earlySolves || 0, tiers: [5, 25, 75, 200, 500], unit: "problems solved before 8 in the morning" },
  { id: "night", sec: "ded", name: "Night Owl", metric: () => S.lateSolves || 0, tiers: [5, 25, 75, 200, 500], unit: "problems solved after 9 at night" },
  { id: "weekend", sec: "ded", name: "Weekend Warrior", metric: () => S.weekendSolves || 0, tiers: [10, 50, 150, 400, 1000], unit: "problems solved on weekends" },
  { id: "level", sec: "ded", name: "Level Climber", metric: () => levelInfo(S.xp).lvl, tiers: [5, 12, 20, 30, 45], unit: "level reached" },
  { id: "xph", sec: "ded", name: "XP Hunter", metric: () => S.xp, tiers: [1000, 5000, 15000, 40000, 90000], unit: "total XP" },
  { id: "perfect", sec: "ded", name: "Flawless", metric: () => S.perfectSessions || 0, tiers: [1, 10, 50, 150, 400], unit: "perfect training sessions" },
  { id: "review", sec: "ded", name: "Comeback Kid", metric: () => S.reviewCleared || 0, tiers: [5, 25, 75, 200, 500], unit: "missed problems conquered on review" },
  /* Competition */
  { id: "tests", sec: "comp", name: "Test Taker", metric: () => S.testsTaken || 0, tiers: [1, 5, 15, 35, 75], unit: "full practice tests completed" },
  { id: "ace", sec: "comp", name: "Test Ace", metric: () => S.testAce || 0, tiers: [1, 3, 10, 25, 60], unit: "practice tests scored 80 percent or higher" },
  { id: "duel", sec: "comp", name: "Duelist", metric: () => S.duelsPlayed, tiers: [1, 5, 15, 35, 75], unit: "math duels fought" },
  { id: "dwin", sec: "comp", name: "Duel Champion", metric: () => S.duelWins || 0, tiers: [1, 5, 15, 35, 75], unit: "math duels won" },
  { id: "games", sec: "comp", name: "Board Warrior", metric: () => S.gamesPlayed, tiers: [1, 5, 15, 35, 75], unit: "chess games finished" },
  /* Classroom */
  { id: "asg", sec: "cls", name: "Homework Hero", metric: () => S.asgDone || 0, tiers: [1, 5, 15, 40, 100], unit: "assignments completed" },
  { id: "asgp", sec: "cls", name: "Perfect Homework", metric: () => S.asgPerfect || 0, tiers: [1, 3, 10, 25, 60], unit: "assignments finished with a perfect score" },
  /* Treasure */
  { id: "coin", sec: "meta", name: "Treasure Hunter", metric: () => S.coinsEarned || 0, tiers: [100, 400, 1200, 3000, 7000], unit: "coins earned" },
  { id: "combo", sec: "meta", name: "Combo King", metric: () => S.bestCombo, tiers: [5, 15, 30, 60, 100], unit: "best answer streak" }
];
const SINGLES = [
  { id: "first", name: "First Steps", desc: "Answer your first question correctly", test: () => S.correctTotal >= 1 },
  { id: "polymath", name: "Polymath", desc: "Solve 100 math problems and 100 chess challenges", test: () => S.mathCorrect >= 100 && S.chessCorrect >= 100 },
  { id: "gmface", name: "Giant's Table", desc: "Solve a puzzle in the Grandmaster Gauntlet", test: () => correctCount("ligm") >= 1 },
  { id: "archivist", name: "Archivist", desc: "Complete a practice test in all four competitions", test: () => Object.keys(S.testArenas || {}).length >= 4 },
  { id: "team", name: "Team Player", desc: "Build a leaderboard with three or more classmates", test: () => Object.keys(S.lbPeers || {}).length >= 3 },
  { id: "openings", name: "Opening Scholar", desc: "Complete the entire Opening Academy", test: () => topicComplete("openings") },
  { id: "endgamer", name: "Endgame Expert", desc: "Complete the entire Endgame Empire", test: () => topicComplete("endgames") },
  { id: "all", name: "Completionist", desc: "Complete every topic in both arenas", test: () => allTopics().every(t => topicComplete(t.id)) }
];
const SEC_LABELS = { solve: "Solving", rating: "Ratings", ded: "Dedication", comp: "Competition", cls: "Classroom", meta: "Treasure" };
const TIER_COINS = [15, 25, 40, 60, 100];
function badgeUnitCount() { return FAMILIES.reduce((a, f) => a + f.tiers.length, 0) + SINGLES.length; }
function earnedUnitCount() { return Object.keys(S.badges).length; }
function checkBadges() {
  const wins = [];
  const chestWins = [];
  for (const f of FAMILIES) {
    const v = f.metric();
    f.tiers.forEach((req, ti) => {
      const key = f.id + "_" + ti;
      if (!S.badges[key] && v >= req) {
        S.badges[key] = todayStr();
        earnCoins(TIER_COINS[ti]);
        if (BADGE_CHEST[ti]) chestWins.push({ name: TIER_NAMES[ti] + " " + f.name, coins: BADGE_CHEST[ti] });
        wins.push({ label: TIER_NAMES[ti] + " " + f.name + " (+" + TIER_COINS[ti] + " coins)" });
      }
    });
  }
  for (const b of SINGLES) {
    if (!S.badges[b.id] && b.test()) {
      S.badges[b.id] = todayStr();
      earnCoins(30);
      wins.push({ label: b.name + " (+30 coins)" });
    }
  }
  if (wins.length) {
    let chestLoot = null;
    if (chestWins.length) chestLoot = applyLoot(rollChest(chestWins.reduce((a, c) => a + c.coins, 0)));   // higher tiers roll richer loot
    save();
    renderTopbar();
    wins.forEach((b, i) => setTimeout(() => {
      toast("★", "Badge earned: " + b.label);
      confetti();
      Sfx.badge();
    }, i * 900));
    if (chestLoot) {
      setTimeout(() => showChestAnim({
        lines: [chestLoot],
        title: chestWins.length > 1 ? "Badge Chests" : "Badge Chest",
        sub: chestWins.map(c => c.name).join(" · ")
      }), Math.min(wins.length * 900 + 400, 2800));
    }
  }
}

/* ---- streaks ---- */
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function touchStreak() {
  retentionDaily();   // seasons roll over and comeback gifts arrive before the streak is judged
  const today = todayStr();
  if (S.lastActive === today) return;
  const dstr = k => { const y = new Date(); y.setDate(y.getDate() - k); return y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0"); };
  const yest = dstr(1), before2 = dstr(2);
  S.daysActive = (S.daysActive || 0) + 1;
  if (S.lastActive === yest) {
    S.streak = S.streak + 1;
  } else if (S.lastActive === before2 && (S.freezes || 0) > 0) {
    S.freezes--;                                   // one missed day: a stored freeze saves the streak
    S.streak = S.streak + 1;
    setTimeout(() => toast("\u2744", "A streak freeze covered yesterday. Your " + S.streak + " day streak lives on. Freezes left: " + S.freezes + "."), 700);
  } else {
    if ((S.streak || 0) >= 3) S.repairOffer = { d: today, prev: S.streak };   // same-day repair offer
    S.streak = 1;
  }
  if (S.streak > S.maxStreak) S.maxStreak = S.streak;
  S.lastActive = today;
  save();
}

/* ---- rating system (Elo with a provisional phase) ---- */
function eloOf(track) { return (track === "math" ? S.mathElo : S.chessElo) || 800; }

/* ---- Mind Rating: one number for both disciplines ----
   Math and chess each count half. Unlocks after 5 rated answers on each side. */
const MIND_TIERS = [
  { min: 0, name: "Spark", icon: "💡" }, { min: 900, name: "Thinker", icon: "🧠" },
  { min: 1100, name: "Strategist", icon: "♟️" }, { min: 1350, name: "Scholar", icon: "📜" },
  { min: 1650, name: "Mastermind", icon: "🌟" }, { min: 2000, name: "Grandmind", icon: "👑" }
];
function mindRating() {
  const m = S.mathElo || 800, c = S.chessElo || 800;
  const ready = (S.mathEloGames || 0) >= 5 && (S.chessEloGames || 0) >= 5;
  const val = Math.round((m + c) / 2);
  let tier = MIND_TIERS[0];
  for (const t of MIND_TIERS) if (val >= t.min) tier = t;
  return { val, ready, tier };
}
function eloUpdate(track, problemRating, won) {
  const kElo = track === "math" ? "mathElo" : "chessElo";
  const kGames = track === "math" ? "mathEloGames" : "chessEloGames";
  const kPeak = track === "math" ? "mathEloPeak" : "chessEloPeak";
  const cur = S[kElo] || 800;
  const games = S[kGames] || 0;
  const K = games < 12 ? 80 : games < 30 ? 40 : 20;   // settles quickly, then stabilizes
  const expected = 1 / (1 + Math.pow(10, (problemRating - cur) / 400));
  let delta = Math.round(K * ((won ? 1 : 0) - expected));
  if (delta === 0) delta = won ? 1 : -1;
  const nv = Math.min(3000, Math.max(400, cur + delta));
  S[kElo] = nv;
  S[kGames] = games + 1;
  if (nv > (S[kPeak] || 800)) S[kPeak] = nv;
  save();
  return { delta: nv - cur, elo: nv, provisional: games + 1 < 12 };
}

/* ---- XP ---- */
const DIFF_XP = { 1: 10, 2: 15, 3: 25, 4: 40 };
function awardXP(n) {
  const before = levelInfo(S.xp).lvl;
  S.xp += n;
  if (S.season) S.season.xp = (S.season.xp || 0) + n;
  const after = levelInfo(S.xp);
  save(); renderTopbar();
  if (after.lvl > before) {
    earnCoins(30);
    toast("★", "Level up! You are now Level " + after.lvl + ": " + after.title + ". +30 coins.");
    confetti(60);
    Sfx.level();
  }
}

/* ---- sound effects (tiny built-in synthesizer, no audio files) ---- */
const Sfx = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function tone(f, t0, dur, type, gain) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.1, c.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  }
  function buzz(p) { if (S.soundOff) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  return {
    correct() { if (S.soundOff) return; buzz(15); tone(523, 0, 0.12); tone(659, 0.08, 0.12); tone(784, 0.16, 0.22); },
    wrong() { if (S.soundOff) return; buzz([40, 60, 40]); tone(196, 0, 0.22, "sawtooth", 0.05); tone(175, 0.12, 0.28, "sawtooth", 0.045); },
    badge() { if (S.soundOff) return; buzz([15, 60, 15, 60, 30]); [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.26)); },
    level() { if (S.soundOff) return; buzz([20, 70, 20, 70, 40]); [392, 494, 587, 784, 988].forEach((f, i) => tone(f, i * 0.1, 0.3)); },
    click() { if (S.soundOff) return; tone(880, 0, 0.05, "sine", 0.04); },
    almost() { if (S.soundOff) return; tone(392, 0, 0.14, "sine", 0.06); tone(440, 0.1, 0.18, "sine", 0.06); }
  };
})();
/* floating reward text */
function floatUp(txt, color, delay) {
  setTimeout(() => {
    const el = document.createElement("div");
    el.className = "floatxp";
    el.textContent = txt;
    el.style.color = color || "var(--gold)";
    el.style.left = (38 + Math.random() * 24) + "%";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }, delay || 0);
}

/* ---- toasts & confetti ---- */
function toast(icon, msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<span class="tico">' + icon + '</span><span>' + msg + '</span>';
  document.getElementById("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3400);
}
const CONF = ["#d9a441", "#7d9bc4", "#7fb08a", "#bd8ba4", "#c98a5e", "#9299c9"];
function confetti(n) {
  n = n || 34;
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.background = CONF[Math.floor(Math.random() * CONF.length)];
    c.style.left = (Math.random() * 100) + "vw";
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    c.style.animationDelay = (Math.random() * 0.5) + "s";
    c.style.transform = "rotate(" + Math.floor(Math.random() * 180) + "deg)";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
}

/* ---- in-app confirm dialog ---- */
function askConfirm(title, msg, yesLabel, onYes, noLabel) {
  const ov = document.createElement("div");
  ov.className = "mmodal";
  ov.innerHTML = '<div class="mbox"><h3>' + title + '</h3><p>' + msg + '</p>' +
    '<div class="mrow"><button class="btn ghost" id="mmNo">' + (noLabel || "Cancel") + '</button>' +
    '<button class="btn gold" id="mmYes">' + yesLabel + '</button></div></div>';
  document.body.appendChild(ov);
  ov.querySelector("#mmNo").addEventListener("click", () => ov.remove());
  ov.querySelector("#mmYes").addEventListener("click", () => { ov.remove(); onYes(); });
  ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
}

/* ---- Smart Review queue: missed problems come back the next day ---- */
function reviewAdd(item, topicId, gi, track) {
  if (!item || !item.uid) return;
  if (!S.reviewQueue) S.reviewQueue = {};
  const d = new Date(); d.setDate(d.getDate() + 1);
  const due = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (!S.reviewQueue[item.uid]) S.reviewQueue[item.uid] = { t: topicId, gi, track, due };
  else S.reviewQueue[item.uid].due = due;   // missed again: come back tomorrow
  save();
}
function reviewRemove(uid, conquered) {
  if (uid && S.reviewQueue && S.reviewQueue[uid]) {
    delete S.reviewQueue[uid];
    if (conquered) S.reviewCleared = (S.reviewCleared || 0) + 1;
    save();
  }
}
function reviewDue() {
  const today = todayStr(), out = [];
  for (const [uid, r] of Object.entries(S.reviewQueue || {})) {
    if (r.due > today) continue;
    const items = topicItems(r.t);
    const item = items && items[r.gi];
    if (!item || item.uid !== +uid) { delete S.reviewQueue[uid]; continue; }
    out.push({ uid: +uid, item, gi: r.gi, tid: r.t, track: r.track });
  }
  return out;
}

/* ---- topbar / nav ---- */
function renderTopbar() {
  const li = levelInfo(S.xp);
  document.getElementById("chipLevel").textContent = "Lv " + li.lvl + " · " + li.title;
  document.getElementById("chipXP").textContent = S.xp + " XP";
  document.getElementById("chipStreak").textContent = S.streak + " day streak";
  document.getElementById("chipCoins").textContent = (S.coins || 0) + (S.coins === 1 ? " coin" : " coins");
}
function setNav(active) {
  document.querySelectorAll("#bottomnav button").forEach(b => {
    b.classList.toggle("active", b.dataset.nav === active);
  });
}
document.getElementById("bottomnav").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  stopDuelTimer(); stopTestTimer();
  const nav = b.dataset.nav;
  if (nav === "home") showHome();
  else if (nav === "math") showTrack("math");
  else if (nav === "chess") showTrack("chess");
  else if (nav === "battle") showBattle();
  else if (nav === "badges") showBadges();
  else if (nav === "profile") showProfile();
});

const ROOT = document.getElementById("screen-root");
function setScreen(html) {
  ROOT.innerHTML = '<div class="screen">' + html + '</div>';
  window.scrollTo(0, 0);
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
/* hoverable info dot: keeps screens clean, details on demand */
function tip(text, left) {
  return '<span class="tip' + (left ? ' left' : '') + '" tabindex="0"><span class="tipdot">i</span><span class="tipbox">' + text + '</span></span>';
}
const TOPIC_GLYPHS = {
  arith: "÷", prealg: "x", algebra: "Σ", geometry: "△", counting: "nCr", numtheory: "ℤ",
  amc: "A", amc8: "8", amc10: "10", amc12: "12", aime: "15", olymp: "Ω", interalg: "α", precalc: "θ", vault: "V",
  openings: "♟", tactics: "♞", endgames: "♜", strategy: "♝",
  limate1: "♚", limate2: "♚", limatedeep: "♚", lifork: "♞", lipin: "♟", liskewer: "♝", lidisc: "♗",
  lisac: "♛", lihang: "♟", lideflect: "♞", liend: "♜", lipromo: "♟", lidef: "♚", liking: "♛", liopen: "♟", ligm: "♚"
};
function tGlyph(t) {
  if (TOPIC_GLYPHS[t.id]) return TOPIC_GLYPHS[t.id];
  if (/[♔-♟]/.test(t.icon || "")) return t.icon;
  return (t.name || "?").replace(/[^A-Za-z]/g, "").slice(0, 1) || "?";
}

/* render a problem/solution string: LaTeX -> KaTeX HTML for imported problems, passthrough otherwise.
   ⟦FIGn⟧ tokens become the problem's rendered diagrams. */
function fmt(item, str) {
  let out;
  if (item && item.tex && typeof katex !== "undefined") {
    try { out = texToHtml(str, katex, false); } catch (e) { out = str; }
  } else {
    out = String(str).replace(/\n/g, "<br>");
  }
  if (item && item.figs) {
    out = out.replace(/⟦FIG(\d+)⟧/g, (m, i) => {
      const f = item.figs[+i] || "";
      const wm = f.match(/<svg[^>]*?width='([0-9.]+)pt'/);
      const wpt = wm ? parseFloat(wm[1]) : 0;
      if (wpt && wpt < 30) return '<div class="asyfig asyfig-inline">' + f + '</div>';   // tiny inline symbol: keep natural size
      // real diagrams display at about 1.6 times their natural size, clamped for phones and desktops
      const px = wpt ? Math.round(Math.min(470, Math.max(250, wpt * 1.333 * 1.6))) : (f.indexOf("<img") >= 0 ? 430 : 0);
      return '<div class="asyfig asyfig-zoom" title="Tap to enlarge"' + (px ? ' style="width:min(96%,' + px + 'px)"' : '') + '>' + f + '</div>';
    });
  }
  return out;
}
/* answer checks that honor dual-accepted official answers */
function mcGood(item, ci) { return ci === item.ci || (item.ci2 != null && ci === item.ci2); }
function numGood(item, v) { return answersMatch(v, item.answer) || (item.alt != null && answersMatch(v, item.alt)); }
/* numeric grading that understands integers, decimals and fractions like 3/8 */
function parseNumeric(s) {
  s = String(s).trim().replace(/,/g, "").replace(/\s+/g, "");
  let m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) { const d = +m[2]; if (!d) return null; return (+m[1]) / d; }
  m = s.match(/^-?\d+(\.\d+)?$/);
  if (m) return parseFloat(s);
  return null;
}
function answersMatch(user, answer) {
  const u = parseNumeric(user), a = parseNumeric(answer);
  if (u === null || a === null) return false;
  return Math.abs(u - a) < 1e-6 * Math.max(1, Math.abs(a));
}

/* ================= SHARED BOARD RENDERING ================= */
const GLYPHS = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const isWhitePiece = p => p && p === p.toUpperCase();
function sqName(idx) { return Engine.sqName(idx); }
function sqIdx(name) { return Engine.sqIdx(name); }

function drawBoardEl(el, st, opts) {
  opts = opts || {};
  el.innerHTML = "";
  const hints = opts.hints || [];
  const hintSet = {};
  hints.forEach(m => hintSet[m.to] = true);
  const checkSq = opts.checkSq != null ? opts.checkSq : -1;
  for (let dsp = 0; dsp < 64; dsp++) {
    const i = opts.flip ? 63 - dsp : dsp;   // black-perspective rendering
    const r = Math.floor(i / 8), c = i % 8;
    const d = document.createElement("div");
    d.className = "sq " + ((r + c) % 2 === 0 ? "light" : "dark");
    d.dataset.i = i;
    const pc = st.b[i];
    if (pc) {
      d.innerHTML = '<span class="pc ' + (isWhitePiece(pc) ? "w" : "b") + '">' + GLYPHS[pc] + '</span>';
    }
    if (dsp % 8 === 0) d.innerHTML += '<span class="coord rk">' + (8 - Math.floor(i / 8)) + '</span>';
    if (dsp >= 56) d.innerHTML += '<span class="coord fl">' + "abcdefgh"[i % 8] + '</span>';
    if (opts.sel === i) d.classList.add("selsq");
    if (hintSet[i]) d.classList.add(pc ? "hintcap" : "hint");
    if (opts.last && (opts.last[0] === i || opts.last[1] === i)) d.classList.add("lastmove");
    if (i === checkSq) d.classList.add("incheck");
    if (opts.onTap) d.addEventListener("click", () => opts.onTap(i));
    el.appendChild(d);
  }
}
/* slide a piece glyph from one square to another, then call done() */
function animateMove(boardEl, fromI, toI, pieceChar, done) {
  const fs = boardEl.querySelector('[data-i="' + fromI + '"]');
  const ts = boardEl.querySelector('[data-i="' + toI + '"]');
  if (!fs || !ts) { done(); return; }
  const fr = fs.getBoundingClientRect(), tr = ts.getBoundingClientRect();
  const pcEl = fs.querySelector(".pc");
  if (pcEl) pcEl.style.visibility = "hidden";
  const clone = document.createElement("div");
  clone.className = "slideclone";
  clone.style.left = fr.left + "px"; clone.style.top = fr.top + "px";
  clone.style.width = fr.width + "px"; clone.style.height = fr.height + "px";
  clone.style.fontSize = getComputedStyle(fs).fontSize;
  clone.innerHTML = '<span class="pc ' + (isWhitePiece(pieceChar) ? "w" : "b") + '">' + GLYPHS[pieceChar] + '</span>';
  document.body.appendChild(clone);
  let finished = false;
  const finish = () => { if (finished) return; finished = true; clone.remove(); done(); };
  requestAnimationFrame(() => {
    clone.style.transform = "translate(" + (tr.left - fr.left) + "px," + (tr.top - fr.top) + "px)";
  });
  clone.addEventListener("transitionend", finish);
  setTimeout(finish, 400);
}

/* ================= SCREENS ================= */
function AVATAR_CHOICES() {
  const free = ["🦁", "🦊", "🐼", "🦉"];
  const owned = (S.owned && S.owned.av) || [];
  return free.concat(owned.filter(a => free.indexOf(a) < 0));
}
let pickedAvatar = S.avatar || "🦁";

let welcomeRole = "student";
function showWelcome() {
  document.getElementById("topbar").classList.add("hidden");
  document.getElementById("bottomnav").classList.add("hidden");
  setScreen(
    '<div id="welcome">' +
    '<div class="biglogo"><svg viewBox="0 0 24 24" width="64" height="64"><rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill="none" stroke="var(--gold)" stroke-width="1.6"/><path d="M6.5 17V8l5.5 6 5.5-6v9" fill="none" stroke="var(--gold)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<h1>MindMasters Academy</h1>' +
    '<p class="sub" style="margin-top:8px">Train your brain in <b>math</b> and <b>chess</b>. Earn a rating, keep a streak, climb the leaderboard.</p>' +
    '<div class="programs"><div class="prog">North South Foundation · Math</div><div class="prog">CheckMates · Chess</div></div>' +
    (authActive() ? '' :
    '<div class="roleseg">' +
      '<button class="rolebtn' + (welcomeRole === "student" ? " sel" : "") + '" data-role="student">I am a student</button>' +
      '<button class="rolebtn' + (welcomeRole === "teacher" ? " sel" : "") + '" data-role="teacher">I am a teacher</button>' +
    '</div>') +
    '<input id="nameInput" maxlength="20" placeholder="Your name" autocomplete="off">' +
    (welcomeRole === "student" ? '<div class="avatar-row">' + AVATAR_CHOICES().map(a =>
      '<button class="avatar-pick' + (a === pickedAvatar ? ' sel' : '') + '" data-av="' + a + '">' + a + '</button>').join("") + '</div>' : '') +
    pwFieldsHtml(welcomeRole) +
    '<button class="btn gold" id="startBtn" style="font-size:16px;padding:13px 34px">' + (authActive() ? "Save" : welcomeRole === "teacher" ? "Create Teacher Account" : "Start Training") + '</button>' +
    (Object.keys(authUsers()).length && !authActive()
      ? '<div style="margin-top:12px"><button class="btn ghost small" id="backLogin">← Back to accounts</button></div>' : '') +
    '</div>'
  );
  document.querySelectorAll(".rolebtn").forEach(b => b.addEventListener("click", () => {
    welcomeRole = b.dataset.role;
    showWelcome();
  }));
  attachPwUx();
  const bl = document.getElementById("backLogin");
  if (bl) bl.addEventListener("click", showLoginScreen);
  document.querySelectorAll(".avatar-pick").forEach(b => b.addEventListener("click", () => {
    pickedAvatar = b.dataset.av;
    document.querySelectorAll(".avatar-pick").forEach(x => x.classList.toggle("sel", x.dataset.av === pickedAvatar));
  }));
  const nameEl = document.getElementById("nameInput");
  if (welcomeRole === "student" && S.name) nameEl.value = S.name;
  if (welcomeRole === "teacher" && loadTS().name) nameEl.value = TS.name;
  const go = () => {
    const nm = nameEl.value.trim() || (welcomeRole === "teacher" ? "Coach" : "Champion");
    const proceed = () => {
      if (welcomeRole === "teacher") {
        loadTS().name = nm;
        saveTS(); setRole("teacher");
        toast("★", "Welcome, " + esc(nm) + ". Your account is ready.");
        showTeacherHome();
        return;
      }
      S.name = nm;
      S.avatar = pickedAvatar;
      setRole("student");
      touchStreak(); save();
      toast("★", "Welcome, " + esc(nm) + ". Your journey begins.");
      if (!S.onboarded) startOnboarding(); else showHome();
    };
    if (authActive()) { authUpdateName(nm, welcomeRole === "student" ? pickedAvatar : null); proceed(); return; }
    const pw = (document.getElementById("pwInput") || {}).value || "";
    const pw2 = (document.getElementById("pwConfirm") || {}).value || "";
    const err = authValidatePw(welcomeRole, pw, pw2);
    if (err) { toast("!", err); return; }
    authRegister({ role: welcomeRole, name: nm, avatar: pickedAvatar, pw, hint: (document.getElementById("pwHint") || {}).value || "" }, proceed);
  };
  document.getElementById("startBtn").addEventListener("click", go);
  nameEl.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
}

function trackStats(track) {
  const topics = track === "math" ? MATH_TOPICS.map(t => t.id) : CHESS_MODULES.map(m => m.id);
  let done = 0, total = 0;
  topics.forEach(id => { done += correctCount(id); total += topicItems(id).length; });
  return { done, total };
}

function dailyProblem() {
  const all = [];
  MATH_TOPICS.forEach(t => t.problems.forEach((p, i) => { if (p.type !== "board") all.push({ topicId: t.id, idx: i, p, track: "math", tname: t.name }); }));
  CHESS_MODULES.forEach(m => m.items.forEach((p, i) => { if (p.type === "mc") all.push({ topicId: m.id, idx: i, p, track: "chess", tname: m.name }); }));
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  // prefer an unsolved problem near the player's rating; never re-asks
  let fallback = null;
  for (let k = 0; k < all.length; k++) {
    const cand = all[(seed + k * 37) % all.length];
    if (prog(cand.topicId).correct[cand.idx]) continue;
    if (!fallback) fallback = cand;
    const elo = eloOf(cand.track);
    if (Math.abs((cand.p.er || 1200) - elo) <= 250) return cand;
  }
  return fallback;
}

function showHome() {
  document.getElementById("topbar").classList.remove("hidden");
  document.getElementById("bottomnav").classList.remove("hidden");
  renderTopbar(); setNav("home");
  const li = levelInfo(S.xp);
  const pct = Math.min(100, Math.round(((S.xp - li.floor) / (li.ceil - li.floor)) * 100));
  const ms = trackStats("math"), cs = trackStats("chess");
  const dailyDone = S.dailyDoneOn === todayStr();
  setScreen(
    '<div class="card hero">' +
      '<div class="av' + (S.char ? " charhost" : frCls()) + '" id="heroAv" style="cursor:pointer">' + avDisplay(52) + '</div>' +
      '<div class="meta">' +
        '<div class="hello">Hi, ' + esc(S.name) + '</div>' +
        '<div class="rank">Level ' + li.lvl + ' · ' + li.title + '</div>' +
        '<div class="xpbar"><div style="width:' + pct + '%"></div></div>' +
        '<div class="xpbar-note">' + S.xp + ' XP · ' + (li.ceil - S.xp) + ' XP to Level ' + (li.lvl + 1) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
          '<div class="chip" style="color:var(--blue)"><span class="num">Math ' + (S.mathElo || 800) + ((S.mathEloGames || 0) < 12 ? "?" : "") + '</span></div>' +
          '<div class="chip" style="color:var(--purple)"><span class="num">Chess ' + (S.chessElo || 800) + ((S.chessEloGames || 0) < 12 ? "?" : "") + '</span></div>' +
          (function () { const r = mindRating(); return r.ready
            ? '<div class="chip" style="color:var(--gold)"><span class="num">Mind ' + r.val + '</span></div>' : ""; })() +
        '</div>' +
      '</div>' +
    '</div>' +
    (function () {
      const r = mindRating();
      const t = tip("One rating for your whole mind. Math and chess each count half, so training both raises it fastest." + (r.ready ? "" : " Unlocks after 5 rated math questions and 5 rated chess puzzles."));
      return '<div class="card" style="padding:13px 18px;display:flex;align-items:center;gap:10px">' +
        '<b style="flex:1">Mind Rating' + t + '</b>' +
        (r.ready
          ? '<span class="num" style="font-size:19px;font-weight:700;color:var(--gold)">' + r.val + '</span><span style="color:var(--muted);font-size:13px">' + r.tier.name + '</span>'
          : '<span style="color:var(--muted);font-size:13px">locked</span>') +
        '</div>';
    })() +
    buildTodayCard() +
    '<div class="section-label">Your Arenas</div>' +
    '<div class="trackgrid">' +
      '<div class="track math" id="goMath" role="button" tabindex="0">' +
        '<div class="tico num">Σ</div><div class="torg">North South Foundation</div><h3>Math Arena</h3>' +
        '<p>' + ms.total.toLocaleString() + ' problems, school level to olympiad</p>' +
        '<div class="tprog num">' + ms.done + ' / ' + ms.total.toLocaleString() + ' solved</div>' +
        '<div class="trainrow"><button class="btn gold small" id="trainMath">Train</button><span class="trainnote">10 problems picked for you</span></div>' +
      '</div>' +
      '<div class="track chess" id="goChess" role="button" tabindex="0">' +
        '<div class="tico num">♞</div><div class="torg">CheckMates</div><h3>Chess Arena</h3>' +
        '<p>' + cs.total.toLocaleString() + ' puzzles, beginner to grandmaster</p>' +
        '<div class="tprog num">' + cs.done + ' / ' + cs.total.toLocaleString() + ' solved</div>' +
        '<div class="trainrow"><button class="btn gold small" id="trainChess">Train</button><span class="trainnote">10 puzzles picked for you</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="section-label">Battle Zone</div>' +
    '<div class="battlegrid">' +
      '<button class="track duel" id="goDuel">' +
        '<div class="tico num">vs</div><div class="torg">Head to Head</div><h3>Math Duel</h3>' +
        '<p>Race a friend through timed problems</p>' +
        '<div class="tprog num">' + S.duelsPlayed + ' duels fought</div>' +
      '</button>' +
      '<button class="track match" id="goMatch">' +
        '<div class="tico num">♟</div><div class="torg">Over the Board</div><h3>Chess Match</h3>' +
        '<p>Full two-player chess, pass and play</p>' +
        '<div class="tprog num">' + S.gamesPlayed + ' games finished</div>' +
      '</button>' +
    '</div>' +
    '<div class="section-label">Trophy Case</div>' +
    '<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:13px 18px" id="goBadges">' +
      '<b style="flex:1">Badges' + tip("Every badge family has five tiers: Bronze, Silver, Gold, Platinum, Diamond. Keep training to climb them.") + '</b>' +
      '<span class="num" style="font-weight:700">' + earnedUnitCount() + ' / ' + badgeUnitCount() + '</span>' +
      '<span style="color:var(--muted)">›</span>' +
    '</div>'
  );
  const wireCard = (id, fn) => {
    const el = document.getElementById(id);
    el.addEventListener("click", fn);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  };
  wireCard("goMath", () => showTrack("math"));
  wireCard("goChess", () => showTrack("chess"));
  document.getElementById("trainMath").addEventListener("click", e => { e.stopPropagation(); startTrain("math"); });
  document.getElementById("trainChess").addEventListener("click", e => { e.stopPropagation(); startTrain("chess"); });
  document.getElementById("goDuel").addEventListener("click", showDuelSetup);
  document.getElementById("goMatch").addEventListener("click", startChessMatch);
  document.getElementById("goBadges").addEventListener("click", showBadges);
  bindTodayCard();
  const hv = document.getElementById("heroAv");
  if (hv) hv.addEventListener("click", showStudio);
}

function showTrack(track) {
  renderTopbar(); setNav(track);
  const list = track === "math" ? MATH_TOPICS : CHESS_MODULES;
  const head = track === "math"
    ? { name: "Math Arena", org: "North South Foundation", sub: "Train by competition or by topic. Problems adapt to your rating." }
    : { name: "Chess Arena", org: "CheckMates", sub: "Openings, tactics, endgames, and strategy. Puzzles adapt to your rating." };
  const games = (track === "math" ? S.mathEloGames : S.chessEloGames) || 0;
  setScreen(
    '<div class="card" style="padding:14px 18px">' +
      '<div style="font-size:10.5px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:var(--gold)">' + head.org + '</div>' +
      '<h1 class="title" style="font-size:21px">' + head.name + tip(head.sub) + '</h1>' +
    '</div>' +
    '<div class="card" style="padding:13px 18px;display:flex;align-items:center;gap:12px">' +
      '<div style="flex:1"><b>Personal Training' +
        tip("One tap starts a session of 10 " + (track === "math" ? "problems" : "puzzles") + " chosen from across the whole arena, matched to your rating. Questions you have already solved are not repeated.") + '</b>' +
        '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">10 ' + (track === "math" ? "problems" : "puzzles") + ' matched to your rating of <span class="num">' + eloOf(track) + (games < 12 ? "?" : "") + '</span></div></div>' +
      '<button class="btn gold" id="trainNow">Train</button>' +
    '</div>' +
    renderTopicList(track, list)
  );
  document.getElementById("trainNow").addEventListener("click", () => startTrain(track));
  document.querySelectorAll(".topic").forEach(b => b.addEventListener("click", () => showSets(b.dataset.topic)));
}

function topicCardHtml(track, t) {
  const items = track === "math" ? t.problems : t.items;
  const c = correctCount(t.id);
  const pct = Math.round((c / items.length) * 100);
  const complete = c >= items.length;
  return '<button class="topic" data-topic="' + t.id + '">' +
    '<div class="tpico" style="background:' + t.color + '">' + tGlyph(t) + '</div>' +
    '<div class="tpmeta"><h4>' + t.name + ' <span class="pill d' + t.diff + '">' + ["", "STARTER", "SKILLED", "ADVANCED", "ELITE"][t.diff] + '</span></h4>' +
    '<div class="tpsub">' + t.sub + '</div>' +
    '<div class="tpbar"><div style="width:' + pct + '%"></div></div></div>' +
    '<div class="tpstat">' + (complete ? '<span class="done">done</span>' : c + "/" + items.length) + '</div>' +
    '</button>';
}
function renderTopicList(track, list) {
  const section = (label, arr) => arr.length
    ? '<div class="section-label">' + label + '</div><div class="topiclist">' + arr.map(t => topicCardHtml(track, t)).join("") + '</div>'
    : "";
  if (track === "math") {
    return section("Practice by Competition", list.filter(t => t.group === "comp")) +
      section("Practice by Topic", list.filter(t => t.group !== "comp"));
  }
  const CURATED = ["openings", "tactics", "endgames", "strategy"];
  return section("Puzzle Arena", list.filter(t => t.group === "li")) +
    section("Training Halls", list.filter(t => CURATED.includes(t.id))) +
    section("Engine Forge", list.filter(t => t.group !== "li" && !CURATED.includes(t.id)));
}

/* ================= LEVEL SET PICKER ================= */
function topicSrc(topicId) {
  return MATH_TOPICS.find(t => t.id === topicId) || CHESS_MODULES.find(m => m.id === topicId);
}
function showSets(topicId) {
  const src = topicSrc(topicId);
  const isMath = !!MATH_TOPICS.find(t => t.id === topicId);
  const elo = eloOf(isMath ? "math" : "chess");
  const games = (isMath ? S.mathEloGames : S.chessEloGames) || 0;
  const solved = correctCount(topicId), total = topicItems(topicId).length;
  const pct = Math.round((solved / total) * 100);
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">' + esc(src.name) + tip(src.lesson) + '</h1>' +
    '<p class="sub">' + esc(src.sub) + '</p></div></div>' +
    '<div class="statgrid" style="margin-bottom:16px">' +
      '<div class="stattile"><div class="sv" style="color:var(--gold)">' + elo + (games < 12 ? "?" : "") + '</div><div class="sl">Your ' + (isMath ? "Math" : "Chess") + ' Rating</div></div>' +
      '<div class="stattile"><div class="sv" style="color:var(--teal)">' + solved + ' / ' + total + '</div><div class="sl">Solved here</div></div>' +
      '<div class="stattile"><div class="sv" style="color:var(--purple)">' + pct + '%</div><div class="sl">Completed</div></div>' +
    '</div>' +
    '<div class="section-label" style="text-align:center">Session difficulty</div>' +
    '<div class="diffchips">' +
      [["e", "Easier"], ["m", "Matched"], ["h", "Challenge"]].map(([k, lab]) =>
        '<button class="diffchip' + ((S.trainBias || "m") === k ? " sel" : "") + '" data-bias="' + k + '">' + lab + '</button>').join("") +
    '</div>' +
    '<div style="text-align:center;margin:6px 0 12px">' +
      '<button class="btn gold" id="contSetBtn" style="font-size:15px;padding:13px 32px">Start Training</button>' +
      (window.CONTESTS && CONTESTS[topicId] && CONTESTS[topicId].length
        ? ' <button class="btn" id="testBtn" style="font-size:15px;padding:13px 24px">Practice Test</button>' : '') +
      tip("Each session gives you 10 questions matched to your rating. Questions you have already solved are not repeated." +
        (games < 12 ? " Your first sessions calibrate your rating, so it moves quickly at the start." : ""), true) +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", () => showTrack(isMath ? "math" : "chess"));
  document.getElementById("contSetBtn").addEventListener("click", () => startQuiz(topicId));
  document.querySelectorAll(".diffchip").forEach(b => b.addEventListener("click", () => {
    S.trainBias = b.dataset.bias; save(); Sfx.click();
    document.querySelectorAll(".diffchip").forEach(x => x.classList.toggle("sel", x === b));
  }));
  const tb = document.getElementById("testBtn");
  if (tb) tb.addEventListener("click", () => showTestPicker(topicId));
}

/* ================= ADAPTIVE QUIZ ENGINE ================= */
let Q = null;

function startQuiz(topicId) {
  const src = topicSrc(topicId);
  const isMath = !!MATH_TOPICS.find(t => t.id === topicId);
  const items = topicItems(topicId);
  const p = prog(topicId);
  let pool = [];
  items.forEach((it, gi) => { if (!p.correct[gi]) pool.push({ item: it, gi }); });
  let replayAll = false;
  if (!pool.length) {
    replayAll = true;
    items.forEach((it, gi) => pool.push({ item: it, gi }));
  }
  Q = {
    topicId, pool, entries: [], i: 0, target: Math.min(10, pool.length),
    correctThisRun: 0, xpThisRun: 0,
    eloStart: eloOf(isMath ? "math" : "chess"),
    lesson: src.lesson, name: src.name, icon: src.icon,
    track: isMath ? "math" : "chess", isDaily: false, replayAll
  };
  Q.luckyI = Math.floor(Math.random() * Math.max(1, Q.target));   // one problem per session pays bonus coins
  pickNextProblem();
  renderQuestion(true);
}
function pickNextProblem() {
  // serve the unserved problem closest to the player's current rating, with a slight stretch upward
  const elo = eloOf(Q.track);
  const bias = S.trainBias === "e" ? -170 : S.trainBias === "h" ? 170 : 0;
  const cool = (Q.missRun || 0) >= 2 ? 200 : 0;   // after two straight misses, ease off until a win
  const target = elo + bias - cool + 40 + Math.floor(Math.random() * 120) - 40;
  let best = -1, bestD = Infinity;
  for (let k = 0; k < Q.pool.length; k++) {
    const e = Q.pool[k];
    if (e.used) continue;
    const d = Math.abs((e.item.er || 1200) - target) + Math.random() * 30;
    if (d < bestD) { bestD = d; best = k; }
  }
  if (best < 0) return false;
  Q.pool[best].used = true;
  Q.entries.push(Q.pool[best]);
  return true;
}

/* ---- Personal Training: one tap starts a session drawn from the whole arena ---- */
function trainPool(track, includeSolved) {
  // every problem in the track, deduplicated by shared identity, unsolved first-class
  const list = track === "math" ? MATH_TOPICS : CHESS_MODULES;
  const pool = [], seen = {};
  list.forEach(t => {
    const items = track === "math" ? t.problems : t.items;
    const p = prog(t.id);
    items.forEach((it, gi) => {
      if (!includeSolved && p.correct[gi]) return;
      if (it.uid) { if (seen[it.uid]) return; seen[it.uid] = 1; }
      pool.push({ item: it, gi, tid: t.id, track });
    });
  });
  return pool;
}
function startTrain(track) {
  let pool = trainPool(track, false);
  let replayAll = false;
  if (!pool.length) { replayAll = true; pool = trainPool(track, true); }
  if (!pool.length) { toast("i", "No problems are available to train right now."); return; }
  Q = {
    topicId: pool[0].tid, pool, entries: [], i: 0, target: Math.min(10, pool.length),
    correctThisRun: 0, xpThisRun: 0,
    eloStart: eloOf(track),
    lesson: "Ten problems chosen for you from across the whole arena, matched to your rating. Questions you have already solved are not repeated.",
    name: track === "math" ? "Math Training" : "Chess Training", icon: track === "math" ? "Σ" : "♞",
    track, isDaily: false, isTrain: true, replayAll
  };
  Q.luckyI = Math.floor(Math.random() * Math.max(1, Q.target));   // one problem per session pays bonus coins
  pickNextProblem();
  renderQuestion(true);
}

function startReview() {
  const due = reviewDue();
  if (!due.length) { toast("i", "No problems are waiting for review. Miss one and it returns tomorrow."); return; }
  const entries = due.slice(0, 10).map(d => ({ item: d.item, gi: d.gi, tid: d.tid, track: d.track }));
  Q = {
    topicId: entries[0].tid, entries, i: 0, target: entries.length,
    correctThisRun: 0, xpThisRun: 0,
    eloStart: eloOf(entries[0].track),
    lesson: "These are the problems that beat you last time. Solving a problem you once missed is how lasting skill is built. Ratings do not change during review.",
    name: "Smart Review", icon: "🔁",
    track: entries[0].track, isDaily: false, isReview: true, replayAll: false
  };
  renderQuestion(true);
}

function startDaily() {
  const d = dailyProblem();
  if (!d) { toast("★", "Incredible. You have solved everything; no daily left to give."); return; }
  Q = {
    topicId: d.topicId, entries: [{ item: d.p, gi: d.idx }], i: 0, correctThisRun: 0, xpThisRun: 0,
    lesson: "", name: "Daily Challenge", icon: "🎯",
    track: d.track, isDaily: true, dailyFrom: d.tname
  };
  renderQuestion(true);
}

/* ---- second-chance bar: shown after a first wrong answer ---- */
function showRetryBar(onRetry, onGiveUp) {
  const fb = document.getElementById("feedback");
  if (!fb) { onGiveUp(); return; }
  fb.className = "feedback retry show";
  fb.innerHTML = '<div class="fb-title">Not quite. You have one more try.</div>' +
    '<div class="retryrow"><button class="btn gold small" id="retryYes">Try Again</button>' +
    '<button class="btn ghost small" id="retryNo">Give Up</button></div>';
  Sfx.almost();
  feedbackShownAt = Date.now();
  const clear = () => { fb.className = "feedback"; fb.innerHTML = ""; };
  document.getElementById("retryYes").addEventListener("click", () => { Sfx.click(); clear(); onRetry(); });
  document.getElementById("retryNo").addEventListener("click", () => { clear(); onGiveUp(); });
  fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideRetryBar() {
  const fb = document.getElementById("feedback");
  if (fb && fb.classList.contains("retry")) { fb.className = "feedback"; fb.innerHTML = ""; }
}

function renderQuestion(withLesson) {
  const entry = Q.entries[Q.i];
  const item = entry.item;
  if (entry.tid) Q.topicId = entry.tid;      // review sessions mix topics
  if (entry.track) Q.track = entry.track;
  Q.tries = 0;
  Q.gaveUp = 0;
  const total = Q.target || Q.entries.length;
  let inner = "";
  if (item.type === "mc") {
    const fiveLetters = item.choices.length === 5 && item.choices.every(c => String(c).length <= 2);
    inner = '<div class="qtext">' + fmt(item, item.q) + '</div>' +
      '<div class="choices' + (item.choices.length === 4 ? " four" : (fiveLetters ? " five" : "")) + '">' +
      item.choices.map((c, ci) => '<button class="choice" data-ci="' + ci + '">' + esc(c) + '</button>').join("") + '</div>' +
      hintBarHtml("mc", item);
  } else if (item.type === "num") {
    inner = '<div class="qtext">' + fmt(item, item.q) + '</div>' +
      '<div class="numrow"><input class="numinput" id="numAns" placeholder="e.g. 42, -7, 3/8 or 2.5" autocomplete="off">' +
      '<button class="btn" id="numGo">Submit</button></div>';
  } else if (item.type === "board") {
    inner = '<div class="puzzlegoal">' + (item.q.startsWith(item.tag) ? item.q.replace(item.tag, '<span class="goal-tag">' + esc(item.tag) + '</span>') : '<span class="goal-tag">' + esc(item.tag) + '</span> · ' + item.q) + '</div>' +
      '<div class="boardwrap"><div class="board" id="board"></div>' +
      '<div class="boardmeta"><span class="turnbadge" id="puzzleTurn">White to move. Tap a piece to see its moves.</span></div></div>' +
      hintBarHtml("board", item);
  }
  setScreen(
    '<div class="quizhead">' +
      '<button class="btn ghost small" id="quitBtn">✕</button>' +
      '<div class="qprogress"><div style="width:' + Math.round((Q.i / total) * 100) + '%"></div></div>' +
      '<div class="qcount">' + (Q.i + 1) + '/' + total + '</div>' +
      (S.combo >= 2 ? '<div class="combo num">×' + S.combo + '</div>' : '') +
    '</div>' +
    (withLesson && Q.lesson ? '<div class="lessonbox" style="padding:9px 14px;font-size:12.5px"><b>' + esc(Q.name) + '</b>' + tip(Q.lesson) + '</div>' : '') +
    (Q.isDaily ? '<div class="lessonbox" style="border-left-color:var(--gold)"><b>Daily Challenge</b> from ' + esc(Q.dailyFrom) + '. This question is worth double XP.</div>' : '') +
    (function () {
      const er = item.er || 1200;
      const d20 = Math.max(1, Math.min(20, Math.round(10 + (er - eloOf(Q.track)) / 60)));
      const col = d20 <= 7 ? "var(--green)" : d20 <= 13 ? "var(--gold)" : "var(--red)";
      return '<div class="probmeta"><span>Problem rating <b class="num">' + er + '</b></span>' +
        '<span style="color:' + col + '">Difficulty <b>' + d20 + '</b>/20 for you</span></div>';
    })() +
    '<div class="card question-card">' + inner + '</div>' +
    '<div class="feedback" id="feedback"></div>' +
    '<div class="quizfoot"><button class="btn hidden" id="nextBtn">Next →</button></div>' +
    (Q.replayAll ? '<p class="sub" style="text-align:center">You have solved every question here. This review session grants a reduced XP bonus.</p>' : '')
  );
  document.getElementById("quitBtn").addEventListener("click", () => {
    const leave = () => { if (Q.isAssignment) showAssignmentsHome(); else if (Q.isDaily || Q.isReview) showHome(); else if (Q.isTrain) showTrack(Q.track); else showSets(Q.topicId); };
    const answered = !document.getElementById("nextBtn").classList.contains("hidden");
    if (answered || Q.i === 0) leave();
    else askConfirm("Leave this session?", "Your solved questions are saved. Only this unanswered question will be lost.", "Leave", leave, "Keep Training");
  });
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  const fiftyB = document.getElementById("fiftyBtn");
  if (fiftyB) fiftyB.addEventListener("click", () => useFifty(item, fiftyB));
  const pieceB = document.getElementById("pieceHintBtn");
  if (pieceB) pieceB.addEventListener("click", () => usePieceHint(pieceB));
  if (item.type === "mc") {
    const reveal = () => { const cs = document.querySelectorAll(".choice"); cs.forEach(x => x.disabled = true); cs[item.ci].classList.add("correct"); };
    document.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
      if (b.disabled) return;
      const ci = +b.dataset.ci;
      if (mcGood(item, ci)) {
        document.querySelectorAll(".choice").forEach(x => x.disabled = true);
        b.classList.add("correct");
        grade(true, item);
        return;
      }
      b.classList.add("wrong");
      document.querySelectorAll(".choice").forEach(x => x.disabled = true);
      if (Q.tries === 0) {
        Q.tries = 1;
        showRetryBar(
          () => document.querySelectorAll(".choice").forEach(x => { if (!x.classList.contains("wrong") && !x.classList.contains("xout")) x.disabled = false; }),
          () => { reveal(); Q.gaveUp = 1; grade(false, item); }
        );
      } else {
        reveal();
        grade(false, item);
      }
    }));
  } else if (item.type === "num") {
    const lock = v => { document.getElementById("numAns").disabled = v; document.getElementById("numGo").disabled = v; };
    const go = () => {
      const inp = document.getElementById("numAns");
      const v = inp.value.trim();
      if (v === "" || inp.disabled) return;
      lock(true);
      if (numGood(item, v)) { grade(true, item); return; }
      if (Q.tries === 0) {
        Q.tries = 1;
        showRetryBar(
          () => { lock(false); inp.select(); inp.focus(); },
          () => { Q.gaveUp = 1; grade(false, item, "The correct answer is <b>" + esc(item.answer) + "</b>."); }
        );
      } else {
        grade(false, item, "The correct answer is <b>" + esc(item.answer) + "</b>.");
      }
    };
    document.getElementById("numGo").addEventListener("click", go);
    document.getElementById("numAns").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    document.getElementById("numAns").focus();
  } else if (item.type === "board") {
    initBoardPuzzle(item);
  }
}

function grade(good, item, extra) {
  S.answeredTotal++;
  const wasSecondTry = (Q.tries || 0) > 0;
  if (good) { if (wasSecondTry) S.trySecond = (S.trySecond || 0) + 1; else S.tryFirst = (S.tryFirst || 0) + 1; }
  else if (Q.gaveUp) S.tryQuit = (S.tryQuit || 0) + 1;
  else S.tryFailed = (S.tryFailed || 0) + 1;
  touchStreak();
  let xp = 0;
  const fb = document.getElementById("feedback");
  if (!fb) return;
  const gi = Q.entries[Q.i].gi;
  const secondTry = (Q.tries || 0) > 0;
  // rating update: first-try answers count fully; second-try solves leave the rating unchanged;
  // review sessions never move the rating (those problems' solutions were already shown once)
  let ratingRes = null, ratingHtml = "";
  if (Q.isChallenge) {
    ratingHtml = ' <span style="color:var(--muted);font-weight:700">challenge, rating unchanged</span>';
  } else if (Q.isReview) {
    ratingHtml = ' <span style="color:var(--muted);font-weight:700">review, rating unchanged</span>';
  } else if (good && secondTry) {
    ratingHtml = ' <span style="color:var(--muted);font-weight:700">second try, rating unchanged</span>';
  } else {
    ratingRes = eloUpdate(Q.track, item.er || 1200, good);
    ratingHtml = ' <span style="font-weight:900;color:' + (ratingRes.delta >= 0 ? "var(--green)" : "var(--red)") + '">' +
      (ratingRes.delta >= 0 ? "+" : "") + ratingRes.delta + '</span> <span style="color:var(--muted);font-weight:700">→ ' +
      ratingRes.elo + (ratingRes.provisional ? "?" : "") + '</span>';
  }
  // daily goal: solve 10 in a day
  const today = todayStr();
  if (S.todayDate !== today) { S.todayDate = today; S.todayCount = 0; }
  S.metrics = S.metrics || {};
  S.metrics[today] = (S.metrics[today] || 0) + 1;
  const mdays = Object.keys(S.metrics);
  if (mdays.length > 60) delete S.metrics[mdays.sort()[0]];
  if (good) {
    S.todayCount++;
    if (S.todayCount === 10 && S.dailyGoalHit !== today) {
      S.dailyGoalHit = today;
      S.goalDays = (S.goalDays || 0) + 1;
      earnCoins(10);
      awardXP(30);
      setTimeout(() => { toast("★", "Daily goal reached: 10 solved today. Bonus 30 XP."); confetti(40); }, 500);
    }
  }
  if (good) {
    S.correctTotal++;
    earnCoins(1);
    const _d = new Date(), _hr = _d.getHours(), _dy = _d.getDay();
    if (_hr < 8) S.earlySolves = (S.earlySolves || 0) + 1;
    if (_hr >= 21) S.lateSolves = (S.lateSolves || 0) + 1;
    if (_dy === 0 || _dy === 6) S.weekendSolves = (S.weekendSolves || 0) + 1;
    if ((item.er || 1200) - eloOf(Q.track) >= 300) S.hardSolved = (S.hardSolved || 0) + 1;
    if ((item.er || 1200) > (S.bestScalp || 0)) S.bestScalp = item.er || 1200;
    Q.missRun = 0;   // flow governor: a win ends any cooldown
    S.combo++;
    if (S.combo > S.bestCombo) S.bestCombo = S.combo;
    if (Q.track === "math") S.mathCorrect++; else S.chessCorrect++;
    let base = DIFF_XP[item.diff] || 15;
    if (secondTry) base = Math.max(3, Math.round(base * 0.5));
    const comboBonus = S.combo >= 3 ? 5 : 0;
    const p = prog(Q.topicId);
    if (Q.isDaily) {
      xp = base * 2 + comboBonus;
      S.dailyDoneOn = todayStr();
      S.dailyCount++;
      p.correct[gi] = true; p.attempted[gi] = true;
    } else {
      const firstTime = !p.correct[gi];
      xp = (firstTime ? base : Math.max(3, Math.round(base * 0.3))) + comboBonus;
      p.correct[gi] = true; p.attempted[gi] = true;
      if (Q.topicId === "aime") S.aimeSolved[gi] = true;
      if (item.mate || item.kind === "mate1" || item.kind === "mate2" || item.mateLine) S.matesSolved[Q.topicId + "_" + gi] = true;
      if (item.li) S.lichessSolved = (S.lichessSolved || 0) + 1;
    }
    // credit every bank that contains this same problem (topic and competition banks overlap)
    if (item.uid && window.UID_INDEX && UID_INDEX[item.uid]) {
      for (const [tid2, gi2] of UID_INDEX[item.uid]) {
        const p2 = prog(tid2);
        p2.correct[gi2] = true; p2.attempted[gi2] = true;
      }
    }
    // conquering a Smart Review problem clears it from the queue; solving anywhere clears a pending review
    if (item.uid) reviewRemove(item.uid, !!Q.isReview);
    if (Q.isReview) bumpRevToday();
    if (Q.luckyI != null && Q.i === Q.luckyI && !Q.isReview && !Q.isAssignment && !Q.isChallenge) {
      const lb = 5 + Math.floor(Math.random() * 11);
      earnCoins(lb);
      floatUp("\u2726 Lucky problem! +" + lb + " coins", "var(--teal)", 700);
    }
    Q.correctThisRun++;
    Q.xpThisRun += xp;
    awardXP(xp);
    fb.className = "feedback good show";
    fb.innerHTML = '<div class="fb-title">' + (secondTry ? "Second try, you got it!" : praise()) + ' <span class="xpgain num">+' + xp + ' XP</span>' + ratingHtml +
      (S.combo >= 3 ? ' <span style="color:var(--orange)" class="num">×' + S.combo + ' streak</span>' : '') + '</div>' + fmt(item, item.sol);
    Sfx.correct();
    confetti(8);
    floatUp("+" + xp + " XP", "var(--gold)", 60);
    if (ratingRes && ratingRes.delta > 0) floatUp("+" + ratingRes.delta + " rating", "var(--green)", 360);
  } else {
    S.combo = 0;
    Q.missRun = (Q.missRun || 0) + 1;   // flow governor: two in a row triggers easier picks
    if (!Q.isDaily) { prog(Q.topicId).attempted[gi] = true; }
    // this problem returns (or returns again) tomorrow in Smart Review
    reviewAdd(item, Q.topicId, gi, Q.track);
    fb.className = "feedback bad show";
    fb.innerHTML = '<div class="fb-title">Not this time.' + ratingHtml + '</div>' + (extra || "") + " " + fmt(item, item.sol) +
      '<div style="margin-top:6px;font-size:12.5px;color:var(--muted)">This problem will return in Smart Review tomorrow.</div>';
    Sfx.wrong();
  }
  if (Q.isAssignment) {
    const en = Q.entries[Q.i];
    const aa = S.assignments && S.assignments[Q.isAssignment];
    if (aa && en.asgIndex != null && aa.per[en.asgIndex] === null) aa.per[en.asgIndex] = !!good;
  }
  save(); renderTopbar(); checkBadges();
  feedbackShownAt = Date.now();
  document.getElementById("nextBtn").classList.remove("hidden");
  fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const PRAISES = ["Brilliant!", "Nailed it!", "Outstanding!", "You're on fire!", "Genius move!", "Crushed it!", "Superb!", "Exactly right!"];
function praise() { return PRAISES[Math.floor(Math.random() * PRAISES.length)]; }

function nextQuestion() {
  if (Q.isDaily) { showResults(); return; }
  Q.i++;
  if (Q.isAssignment) {
    if (Q.i >= Q.entries.length) finishAssignment(Q.isAssignment);
    else renderQuestion(false);
    return;
  }
  if (Q.i >= Q.target || (Q.i >= Q.entries.length && !pickNextProblem())) showResults();
  else renderQuestion(false);
}

function showResults() {
  if (Q.isOnboard) { finishOnboarding(); return; }
  if (Q.isChallenge) { finishChallenge(); return; }
  if (typeof cloudPush === "function") cloudPush();   // Class Cloud: update your score after each session
  const total = Q.entries.length;
  const pct = total ? Math.round((Q.correctThisRun / total) * 100) : 0;
  const perfect = total > 0 && Q.correctThisRun === total;
  if (perfect && !Q.isDaily && total >= 5) {
    S.perfectSessions = (S.perfectSessions || 0) + 1;
    save(); checkBadges();
  }
  if (perfect && !Q.isDaily) confetti(50);
  const eloNow = eloOf(Q.track);
  const eloDelta = eloNow - (Q.eloStart || eloNow);
  const mark = '<span class="num" style="font-size:44px;font-weight:700;color:' + (perfect ? 'var(--gold)' : pct >= 50 ? 'var(--ink)' : 'var(--muted)') + '">' + pct + '%</span>';
  const headline = Q.isDaily
    ? (Q.correctThisRun ? "Daily Challenge complete" : "Daily Challenge: see you tomorrow")
    : perfect ? "Perfect session" : pct >= 75 ? "Strong session" : pct >= 50 ? "Solid work" : "Keep training";
  setScreen(
    '<div class="card results">' +
      (S.char && pct >= 75 && typeof charSvg === "function"
        ? '<div class="cheerchar">' + charSvg(S.char, 92) + '</div>' : '') +
      '<div style="margin-bottom:4px">' + mark + '</div>' +
      '<h2>' + headline + '</h2>' +
      '<div class="score">' + esc(Q.name) + ' · ' + Q.correctThisRun + ' / ' + total + ' correct</div>' +
      '<div class="rewards">' +
        '<div class="reward"><div class="rv" style="color:' + (eloDelta >= 0 ? "var(--green)" : "var(--red)") + '">' + (eloDelta >= 0 ? "+" : "") + eloDelta + '</div><div class="rl">rating change</div></div>' +
        '<div class="reward"><div class="rv">' + eloNow + '</div><div class="rl">' + (Q.track === "math" ? "math" : "chess") + ' rating</div></div>' +
        '<div class="reward"><div class="rv">+' + Q.xpThisRun + '</div><div class="rl">XP earned</div></div>' +
        '<div class="reward"><div class="rv">' + (S.todayDate === todayStr() ? S.todayCount : 0) + '/10</div><div class="rl">daily goal</div></div>' +
      '</div>' +
      tomorrowHookHtml() +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        (Q.isDaily || Q.isReview ? '' : '<button class="btn gold" id="retryBtn">Train Again</button>') +
        (Q.isReview && reviewDue().length ? '<button class="btn gold" id="moreRevBtn">Review More</button>' : '') +
        '<button class="btn ghost" id="contBtn">Done</button>' +
      '</div>' +
    '</div>'
  );
  const r = document.getElementById("retryBtn");
  if (r) r.addEventListener("click", () => { if (Q.isTrain) startTrain(Q.track); else startQuiz(Q.topicId); });
  const mr = document.getElementById("moreRevBtn");
  if (mr) mr.addEventListener("click", startReview);
  document.getElementById("contBtn").addEventListener("click", () => {
    if (Q.isDaily || Q.isReview) showHome();
    else if (Q.isTrain) showTrack(Q.track);
    else showSets(Q.topicId);
  });
}

/* ================= CHESS PUZZLES (engine-backed) ================= */
let BP = null;
function initBoardPuzzle(item) {
  BP = { st: Engine.parse(item.fen), origFen: item.fen, sel: null, item, done: false, last: null, phase: 1, failFen: null, busy: false, lineIdx: 0, tries: 0, pw: item.pw === 0 ? 0 : 1 };
  const tb = document.getElementById("puzzleTurn");
  if (tb) tb.innerHTML = (BP.pw ? "White" : "Black") + " to move. Tap a piece to see its moves.";
  redrawPuzzle();
}
function redrawPuzzle() {
  const el = document.getElementById("board");
  if (!el) return;
  const hints = BP.sel != null && !BP.done ? Engine.legalFrom(BP.st, BP.sel) : [];
  drawBoardEl(el, BP.st, {
    sel: BP.sel, hints, last: BP.last, flip: !BP.pw,
    onTap: i => tapPuzzle(i)
  });
}
/* a wrong attempt: animate it, rewind, then either offer a second chance or replay the solution */
function puzzleWrong(selIdx, i, legal, failMsg) {
  const boardEl = document.getElementById("board");
  const piece = BP.st.b[selIdx];
  const preFen = fenOf(BP.st);            // position before the wrong attempt
  const attempted = Engine.make(BP.st, legal, "Q");
  BP.busy = true;
  animateMove(boardEl, selIdx, i, piece, () => {
    BP.st = attempted; redrawPuzzle();
    setTimeout(() => {
      BP.st = Engine.parse(preFen); BP.busy = false; redrawPuzzle();
      if (BP.tries === 0) {
        BP.tries = 1;
        if (typeof Q !== "undefined" && Q) Q.tries = 1;   // chess second-chance affects XP/rating like math
        const tb = document.getElementById("puzzleTurn");
        if (tb) tb.innerHTML = "Look deeper. You have one more try.";
        showRetryBar(
          () => { const t2 = document.getElementById("puzzleTurn"); if (t2) t2.innerHTML = (BP.pw ? "White" : "Black") + " to move. One more try."; },
          () => { if (typeof Q !== "undefined" && Q) Q.gaveUp = 1; replaySolution(failMsg); }
        );
      } else {
        replaySolution(failMsg);
      }
    }, 700);
  });
}

/* find any move that delivers immediate checkmate for the side to move */
function findMateMoveFrom(st) {
  for (let s0 = 0; s0 < 64; s0++) {
    const p0 = st.b[s0];
    if (!p0 || isWhitePiece(p0) !== (st.turn === "w")) continue;
    for (const m of Engine.legalFrom(st, s0)) {
      if (Engine.status(Engine.make(st, m, "Q")) === "checkmate") return m;
    }
  }
  return null;
}

/* play the full remaining solution on the board, one move every ~2.3 seconds */
function replaySolution(failMsg) {
  const item = BP.item;
  BP.done = true; BP.busy = true; BP.sel = null;
  const tb = document.getElementById("puzzleTurn");
  if (tb) tb.innerHTML = "Watch the board. The winning line is playing out.";
  const moves = [];
  const sim0 = Engine.parse(fenOf(BP.st));
  if (item.kind === "line") {
    for (let k = BP.lineIdx; k < item.line.length; k++) moves.push([sqIdx(item.line[k][0]), sqIdx(item.line[k][1])]);
  } else if (item.kind === "mate1" || (item.kind === "mate2" && BP.phase === 2)) {
    const m = findMateMoveFrom(sim0);
    if (m) moves.push([m.from, m.to]);
    else if (item.solutions) { const s = item.solutions[0]; moves.push([sqIdx(s[0]), sqIdx(s[1])]); }
  } else if (item.kind === "mate2") {
    // the full two-move plan: key move, one defense, then the mate
    const key = item.solutions[0];
    moves.push([sqIdx(key[0]), sqIdx(key[1])]);
    const km = Engine.legalFrom(sim0, sqIdx(key[0])).find(m => m.to === sqIdx(key[1]));
    if (km) {
      let sim = Engine.make(sim0, km, "Q");
      const replies = [];
      for (let s0 = 0; s0 < 64; s0++) {
        const p0 = sim.b[s0];
        if (p0 && isWhitePiece(p0) === (sim.turn === "w")) replies.push(...Engine.legalFrom(sim, s0));
      }
      if (replies.length) {
        const r = replies[0];
        moves.push([r.from, r.to]);
        const mm = findMateMoveFrom(Engine.make(sim, r, "Q"));
        if (mm) moves.push([mm.from, mm.to]);
      }
    }
  } else {
    const flat = item.solutions.map(s => (Array.isArray(s[0]) ? s[0] : s));
    moves.push([sqIdx(flat[0][0]), sqIdx(flat[0][1])]);
  }
  // grade right away so the explanation and Next button appear while the board replays
  grade(false, item, failMsg);
  const myBP = BP;
  let idx = 0;
  const step = () => {
    if (BP !== myBP) return;                        // a new puzzle started; stop this replay
    const bEl = document.getElementById("board");
    if (!bEl) { BP.busy = false; return; }          // player moved on to the next question
    if (idx >= moves.length) { BP.busy = false; return; }
    const [fi, ti] = moves[idx];
    const mv = Engine.legalFrom(BP.st, fi).find(m => m.to === ti);
    const pc = BP.st.b[fi];
    if (!pc || !mv) { idx++; step(); return; }
    animateMove(bEl, fi, ti, pc, () => {
      if (BP !== myBP) return;
      BP.st = Engine.make(BP.st, mv, "Q");
      BP.last = [fi, ti];
      redrawPuzzle();
      idx++;
      if (idx < moves.length) setTimeout(step, 2300);
      else {
        BP.busy = false;
        const t2 = document.getElementById("puzzleTurn");
        if (t2) t2.innerHTML = "Solution complete. That was the winning line.";
      }
    });
  };
  setTimeout(step, 900);
}

function tapPuzzle(i) {
  if (BP.done || BP.busy) return;
  hideRetryBar();   // tapping the board counts as choosing to try again
  const pc = BP.st.b[i];
  const mine = pc && (isWhitePiece(pc) === !!BP.pw);
  if (BP.sel == null) {
    if (mine) { BP.sel = i; redrawPuzzle(); }
    return;
  }
  if (i === BP.sel) { BP.sel = null; redrawPuzzle(); return; }
  if (mine) { BP.sel = i; redrawPuzzle(); return; }
  const legal = Engine.legalFrom(BP.st, BP.sel).find(m => m.to === i);
  if (!legal) { return; }
  const from = sqName(BP.sel), to = sqName(i);
  const item = BP.item;
  const kind = item.kind || (item.mate ? "exactmate" : "exact");
  const boardEl = document.getElementById("board");
  const piece = BP.st.b[BP.sel];
  const selIdx = BP.sel;
  BP.sel = null;
  const nx = Engine.make(BP.st, legal, "Q");

  if (kind === "line") {
    const line = item.line;
    const exp = line[BP.lineIdx];
    const isLastMove = BP.lineIdx === line.length - 1;
    const exact = exp[0] === from && exp[1] === to;
    const matesNow = Engine.status(nx) === "checkmate";
    // any checkmating move wins a mate puzzle; otherwise the line's only move is required
    const good = exact || (item.mateLine && matesNow && (isLastMove || item.li));
    if (!good) {
      puzzleWrong(selIdx, i, legal, BP.lineIdx === 0
        ? "The winning idea starts with <b>" + exp[0] + " → " + exp[1] + "</b>. Watch the full line on the board."
        : "So close! The continuation was <b>" + exp[0] + " → " + exp[1] + "</b>. Watch the full line on the board.");
      return;
    }
    if (isLastMove || matesNow) {
      BP.done = true;
      animateMove(boardEl, selIdx, i, piece, () => {
        BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
        if (matesNow) setTimeout(() => toast("♚", "Checkmate. Calculated to the end."), 300);
        grade(true, item);
      });
      return;
    }
    // correct intermediate move -> auto-play black's best defense from the line
    BP.busy = true;
    const reply = line[BP.lineIdx + 1];
    animateMove(boardEl, selIdx, i, piece, () => {
      BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
      const rf = sqIdx(reply[0]), rt = sqIdx(reply[1]);
      const rMove = Engine.legalFrom(BP.st, rf).find(m => m.to === rt);
      const rPiece = BP.st.b[rf];
      setTimeout(() => {
        animateMove(document.getElementById("board"), rf, rt, rPiece, () => {
          BP.st = Engine.make(BP.st, rMove || { from: rf, to: rt }, "Q");
          BP.last = [rf, rt];
          BP.lineIdx += 2;
          BP.busy = false;
          redrawPuzzle();
          const tb = document.getElementById("puzzleTurn");
          const left = Math.ceil((line.length - BP.lineIdx) / 2);
          if (tb) tb.innerHTML = "Right! The defense moves. <b>" + left + " more move" + (left > 1 ? "s" : "") + " to find.</b>";
          toast("✓", "Correct. Keep the pressure on.");
        });
      }, 380);
    });
    return;
  }

  if (kind === "mate1") {
    if (Engine.status(nx) === "checkmate") {
      BP.done = true;
      animateMove(boardEl, selIdx, i, piece, () => {
        BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
        setTimeout(() => toast("♚", "Checkmate. Beautifully done."), 300);
        grade(true, item);
      });
    } else {
      puzzleWrong(selIdx, i, legal, "Your move was legal, but it does not deliver mate. The mating move is shown on the board.");
    }
    return;
  }

  if (kind === "mate2") {
    if (BP.phase !== 2) {
      // phase 1: must play the unique key move
      const key = item.solutions[0];
      const good = key[0] === from && key[1] === to;
      if (!good) { puzzleWrong(selIdx, i, legal, "Only ONE move forces mate: <b>" + key[0] + " → " + key[1] + "</b>. The full plan is shown on the board."); return; }
      BP.busy = true;
      animateMove(boardEl, selIdx, i, piece, () => {
        BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
        // black plays a reply (all replies lose; pick one at random)
        const replies = [];
        for (let s0 = 0; s0 < 64; s0++) {
          const p0 = BP.st.b[s0];
          if (p0 && !isWhitePiece(p0)) replies.push(...Engine.legalFrom(BP.st, s0));
        }
        const r = replies[Math.floor(Math.random() * replies.length)];
        const rPiece = BP.st.b[r.from];
        setTimeout(() => {
          animateMove(document.getElementById("board"), r.from, r.to, rPiece, () => {
            BP.st = Engine.make(BP.st, r, "Q");
            BP.last = [r.from, r.to];
            BP.phase = 2;
            BP.failFen = null; BP.busy = false;
            redrawPuzzle();
            const tb = document.getElementById("puzzleTurn");
            if (tb) tb.innerHTML = "Key move played. Now <b>deliver the mate.</b>";
            toast("✓", "Perfect key move. Now finish it.");
            // remember current fen for fail-replay
            BP.failFen = fenOf(BP.st);
          });
        }, 350);
      });
      return;
    }
    // phase 2: any mating move wins
    if (Engine.status(nx) === "checkmate") {
      BP.done = true;
      animateMove(boardEl, selIdx, i, piece, () => {
        BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
        setTimeout(() => toast("♚", "Checkmate. A perfect two-move combination."), 300);
        grade(true, item);
      });
    } else {
      puzzleWrong(selIdx, i, legal, "So close. The key move was right, but that finish is not mate. The mate is shown on the board.");
    }
    return;
  }

  // exact-solution puzzles (curated + fork/hanging/skewer)
  const flat = item.solutions.map(s => (Array.isArray(s[0]) ? s[0] : s));
  const good = flat.some(s => s[0] === from && s[1] === to);
  if (good) {
    BP.done = true;
    animateMove(boardEl, selIdx, i, piece, () => {
      BP.st = nx; BP.last = [selIdx, i]; redrawPuzzle();
      if (item.mate || Engine.status(nx) === "checkmate") setTimeout(() => toast("♚", "Checkmate. Beautifully done."), 300);
      grade(true, item);
    });
  } else {
    const s = flat[0];
    puzzleWrong(selIdx, i, legal, "The winning move was <b>" + s[0] + " → " + s[1] + "</b> (shown on the board).");
  }
}
function fenOf(st) {
  let out = "";
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = st.b[r * 8 + c];
      if (!p) empty++;
      else { if (empty) { out += empty; empty = 0; } out += p; }
    }
    if (empty) out += empty;
    if (r < 7) out += "/";
  }
  return out + " " + st.turn + " " + (st.castle || "-") + " " + (st.ep >= 0 ? sqName(st.ep) : "-") + " " + st.half + " " + st.full;
}

/* ================= PRACTICE TESTS (full past contests, official timing & scoring) ================= */
let T = null, testTimer = null;
function stopTestTimer() { if (testTimer) { clearInterval(testTimer); testTimer = null; } }
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(ss).padStart(2, "0");
}

function showTestPicker(topicId) {
  const list = (window.CONTESTS && CONTESTS[topicId]) || [];
  const src = topicSrc(topicId);
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Practice Tests' + tip("Answers are revealed only at the end, exactly like the real contest, and scoring follows the official rules. Practice tests do not change your rating.") + '</h1>' +
    '<p class="sub">' + esc(src.name) + ': take a full past contest under the official time limit.</p></div></div>' +
    list.map((c, k) => {
      const best = (S.testBest || {})[c.name];
      return '<button class="contestbtn" data-k="' + k + '">' +
        '<span class="cname">' + esc(c.name) + '</span>' +
        (best ? '<span class="cbest">Best: ' + best.s + '</span>' : '') +
        '<span class="cmeta">' + c.probs.length + (c.probs.length < c.expected ? " of " + c.expected : "") + ' problems · ' + c.minutes + ' min</span>' +
        '</button>';
    }).join("")
  );
  document.getElementById("backBtn").addEventListener("click", () => showSets(topicId));
  document.querySelectorAll(".contestbtn").forEach(b => b.addEventListener("click", () => startTest(topicId, list[+b.dataset.k])));
}

function startTest(topicId, contest) {
  const items = topicItems(topicId);
  T = {
    topicId, contest, i: 0, done: false,
    entries: contest.probs.map(pr => ({ item: items[pr.gi], gi: pr.gi, n: pr.n, ans: null })),
    endsAt: Date.now() + contest.minutes * 60000
  };
  stopTestTimer();
  testTimer = setInterval(() => {
    if (!T || T.done) { stopTestTimer(); return; }
    const el = document.getElementById("testClock");
    const left = T.endsAt - Date.now();
    if (left <= 0) { toast("!", "Time is up. Scoring your test."); finishTest(true); return; }
    if (el) { el.textContent = fmtClock(left); el.classList.toggle("low", left < 5 * 60000); }
  }, 500);
  renderTestQ();
}

function renderTestQ() {
  const e = T.entries[T.i];
  const item = e.item;
  const isMC = item.type === "mc";
  let inner = '<div class="qtext">' + fmt(item, item.q) + '</div>';
  if (isMC) {
    inner += '<div class="choices' + (item.choices.length === 5 ? " five" : "") + '">' +
      item.choices.map((c, ci) => '<button class="choice" data-ci="' + ci + '">' + esc(c) + '</button>').join("") + '</div>';
  } else {
    inner += '<div class="numrow"><input class="numinput" id="numAns" inputmode="numeric" pattern="[0-9]*" placeholder="Integer from 0 to 999" autocomplete="off">' +
      '<button class="btn" id="numGo">Submit →</button></div>';
  }
  setScreen(
    '<div class="quizhead">' +
      '<button class="btn ghost small" id="quitBtn">✕</button>' +
      '<div class="qprogress"><div style="width:' + Math.round((T.i / T.entries.length) * 100) + '%"></div></div>' +
      '<span class="testtimer" id="testClock">' + fmtClock(T.endsAt - Date.now()) + '</span>' +
      '<div class="qcount">' + (T.i + 1) + '/' + T.entries.length + '</div>' +
    '</div>' +
    '<div class="lessonbox" style="border-left-color:var(--gold);padding:9px 14px"><b>' + esc(T.contest.name) + '</b>, Problem ' + e.n + tip("Answers are checked only when the test ends, exactly like the real contest.") + '</div>' +
    '<div class="card question-card">' + inner + '</div>' +
    '<div class="quizfoot" style="justify-content:space-between">' +
      '<button class="btn ghost" id="blankBtn">Leave Blank →</button>' +
      '<span class="sub" style="align-self:center">' + (T.entries.length - T.i - 1) + ' after this one</span>' +
    '</div>'
  );
  document.getElementById("quitBtn").addEventListener("click", () => {
    askConfirm("End this practice test?", "If you leave now the test will not be scored.", "Leave Test", () => {
      const tid = T.topicId;
      stopTestTimer(); T = null;
      showTestPicker(tid);
    }, "Keep Going");
  });
  document.getElementById("blankBtn").addEventListener("click", () => { e.ans = null; advanceTest(); });
  if (isMC) {
    document.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll(".choice").forEach(x => x.disabled = true);
      b.classList.add("correct");
      e.ans = "ABCDE"[+b.dataset.ci];
      Sfx.click();
      setTimeout(advanceTest, 220);
    }));
  } else {
    const go = () => {
      const v = document.getElementById("numAns").value.trim();
      e.ans = v === "" ? null : v;
      Sfx.click();
      advanceTest();
    };
    document.getElementById("numGo").addEventListener("click", go);
    document.getElementById("numAns").addEventListener("keydown", ev => { if (ev.key === "Enter") go(); });
    document.getElementById("numAns").focus();
  }
}
function advanceTest() {
  if (!T || T.done) return;
  T.i++;
  if (T.i >= T.entries.length) finishTest(false);
  else renderTestQ();
}

function finishTest(expired) {
  if (!T || T.done) return;
  T.done = true;
  stopTestTimer();
  const kind = T.topicId;
  let correct = 0, wrong = 0, blank = 0;
  const p = prog(T.topicId);
  T.rows = T.entries.map(e => {
    const item = e.item;
    let ok = false, correctAns;
    if (item.type === "mc") { correctAns = "ABCDE"[item.ci]; ok = e.ans === correctAns || (item.ci2 != null && e.ans === "ABCDE"[item.ci2]); }
    else { correctAns = String(item.answer); ok = e.ans != null && numGood(item, e.ans); }
    if (e.ans == null) blank++; else if (ok) correct++; else wrong++;
    if (e.ans != null) {
      S.answeredTotal++;
      p.attempted[e.gi] = true;
      if (ok) {
        S.correctTotal++; S.mathCorrect++;
        p.correct[e.gi] = true;
        if (item.uid && window.UID_INDEX && UID_INDEX[item.uid]) {
          for (const [t2, g2] of UID_INDEX[item.uid]) { const pp = prog(t2); pp.correct[g2] = true; pp.attempted[g2] = true; }
        }
        if (T.topicId === "aime") S.aimeSolved[e.gi] = true;
        reviewRemove(item.uid, false);
      } else {
        reviewAdd(item, T.topicId, e.gi, "math");
      }
    }
    return { e, ok, correctAns };
  });
  const isAmcHS = kind === "amc10" || kind === "amc12";
  const scoreVal = isAmcHS ? 6 * correct + 1.5 * blank : correct;
  const scoreMax = isAmcHS ? 6 * T.entries.length : T.entries.length;
  const scoreStr = (isAmcHS ? (Math.round(scoreVal * 10) / 10) : scoreVal) + " / " + scoreMax;
  if (!S.testBest) S.testBest = {};
  const prev = S.testBest[T.contest.name];
  const isPB = !!(prev && scoreVal > prev.v);   // beating an existing best deserves a party
  if (isPB) { S.pbCount = (S.pbCount || 0) + 1; earnCoins(25); }
  if (!prev || scoreVal > prev.v) S.testBest[T.contest.name] = { v: scoreVal, s: scoreStr };
  S.testsTaken = (S.testsTaken || 0) + 1;
  const xp = correct * (kind === "aime" ? 12 : 5) + (blank + wrong === 0 && correct > 0 ? 25 : 0);
  const full = T.entries.length === T.contest.expected;
  let remark = "";
  if (isAmcHS && full && scoreVal >= 100) remark = "A score like this has historically qualified students for the AIME. Outstanding work.";
  else if (kind === "amc8" && correct >= Math.round(T.entries.length * 0.8)) remark = "That is an honor-roll level performance.";
  else if (kind === "aime" && correct >= 10) remark = "Double digits on an AIME is olympiad-qualifying territory.";
  const pctOk = T.entries.length ? correct / T.entries.length : 0;
  if (pctOk >= 0.8) S.testAce = (S.testAce || 0) + 1;
  S.testArenas = S.testArenas || {};
  S.testArenas[kind] = 1;
  const markCol = pctOk >= 0.8 ? "var(--gold)" : pctOk >= 0.5 ? "var(--ink)" : "var(--muted)";
  touchStreak();
  awardXP(xp);
  save(); checkBadges();
  cloudPush();   // Class Cloud: update your score after a practice test
  if (pctOk >= 0.6) confetti(50);
  setScreen(
    '<div class="card results">' +
      '<h2 style="margin-top:6px">' + esc(T.contest.name) + '</h2>' +
      (isPB ? '<div class="pbbanner">★ New personal best on this contest! +25 coins</div>' : '') +
      '<div class="score">' + (expired ? "Time expired. " : "") + 'Official score: <b class="num" style="color:' + markCol + ';font-size:22px">' + scoreStr + '</b>' +
        (isAmcHS ? '<div style="font-size:12px;color:var(--muted);margin-top:4px">6 points per correct answer, 1.5 per blank, 0 per wrong answer</div>' : '') + '</div>' +
      (remark ? '<div class="lessonbox" style="text-align:left;margin-top:12px">' + remark + '</div>' : '') +
      '<div class="rewards">' +
        '<div class="reward"><div class="rv" style="color:var(--green)">' + correct + '</div><div class="rl">correct</div></div>' +
        '<div class="reward"><div class="rv" style="color:var(--red)">' + wrong + '</div><div class="rl">wrong</div></div>' +
        '<div class="reward"><div class="rv" style="color:var(--muted)">' + blank + '</div><div class="rl">blank</div></div>' +
        '<div class="reward"><div class="rv">+' + xp + '</div><div class="rl">XP earned</div></div>' +
      '</div>' +
      (full ? '' : '<p class="sub">' + (T.contest.expected - T.entries.length) + ' problem(s) from this contest need diagrams and were not included.</p>') +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">' +
        '<button class="btn gold" id="ansBtn">See Answers</button>' +
        '<button class="btn ghost" id="doneBtn">Done</button>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("ansBtn").addEventListener("click", showTestReview);
  document.getElementById("doneBtn").addEventListener("click", () => showTestPicker(T.topicId));
}

function showTestReview() {
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">' + esc(T.contest.name) + ' Answers</h1>' +
    '<p class="sub">Tap any problem to read it again with its answer. Missed problems return in Smart Review tomorrow.</p></div></div>' +
    T.rows.map((r, k) =>
      '<div class="revrow" data-k="' + k + '" style="cursor:pointer">' +
        '<span class="rn">#' + r.e.n + '</span>' +
        '<span class="rres" style="color:' + (r.e.ans == null ? "var(--muted)" : r.ok ? "var(--green)" : "var(--red)") + '">' + (r.e.ans == null ? "–" : r.ok ? "✓" : "✗") + '</span>' +
        '<span style="flex:1">Your answer: <b>' + (r.e.ans == null ? "blank" : esc(r.e.ans)) + '</b></span>' +
        '<span>Correct: <b style="color:var(--green)">' + esc(r.correctAns) + '</b></span>' +
      '</div>').join("")
  );
  document.getElementById("backBtn").addEventListener("click", reshowTestResults);
  document.querySelectorAll(".revrow").forEach(el => el.addEventListener("click", () => showTestProblem(+el.dataset.k)));
}
function reshowTestResults() {
  // lightweight: rebuild the score screen from stored rows
  const kind = T.topicId;
  let correct = 0, wrong = 0, blank = 0;
  T.rows.forEach(r => { if (r.e.ans == null) blank++; else if (r.ok) correct++; else wrong++; });
  const isAmcHS = kind === "amc10" || kind === "amc12";
  const scoreVal = isAmcHS ? 6 * correct + 1.5 * blank : correct;
  const scoreMax = isAmcHS ? 6 * T.entries.length : T.entries.length;
  const scoreStr = (isAmcHS ? (Math.round(scoreVal * 10) / 10) : scoreVal) + " / " + scoreMax;
  setScreen(
    '<div class="card results">' +
      '<h2>' + esc(T.contest.name) + '</h2>' +
      '<div class="score">Official score: <b style="color:var(--gold)">' + scoreStr + '</b></div>' +
      '<div class="rewards">' +
        '<div class="reward"><div class="rv" style="color:var(--green)">' + correct + '</div><div class="rl">correct</div></div>' +
        '<div class="reward"><div class="rv" style="color:var(--red)">' + wrong + '</div><div class="rl">wrong</div></div>' +
        '<div class="reward"><div class="rv" style="color:var(--muted)">' + blank + '</div><div class="rl">blank</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">' +
        '<button class="btn gold" id="ansBtn">See Answers</button>' +
        '<button class="btn ghost" id="doneBtn">Done</button>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("ansBtn").addEventListener("click", showTestReview);
  document.getElementById("doneBtn").addEventListener("click", () => showTestPicker(T.topicId));
}
function showTestProblem(k) {
  const r = T.rows[k];
  const item = r.e.item;
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← All Answers</button>' +
    '<div><h1 class="title" style="font-size:21px">Problem ' + r.e.n + ' · ' + (r.e.ans == null ? "left blank" : r.ok ? "correct" : "missed") + '</h1></div></div>' +
    '<div class="card question-card"><div class="qtext">' + fmt(item, item.q) + '</div></div>' +
    '<div class="feedback ' + (r.ok ? "good" : "bad") + ' show">' +
      '<div class="fb-title">Your answer: ' + (r.e.ans == null ? "blank" : esc(r.e.ans)) + ' · Correct answer: ' + esc(r.correctAns) + '</div>' +
      fmt(item, item.sol) +
    '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", showTestReview);
}

/* ================= MATH DUEL (FTW-style, pass & play) ================= */
let DUEL = null, duelTimer = null;
function stopDuelTimer() { if (duelTimer) { clearInterval(duelTimer); duelTimer = null; } }

function showBattle() {
  renderTopbar(); setNav("battle");
  setScreen(
    '<h1 class="title">Battle Zone</h1>' +
    '<p class="sub">Play head to head on one device.</p>' +
    '<div class="battlegrid" style="margin-top:16px">' +
      '<button class="track duel" id="goDuel"><div class="tico num">vs</div><div class="torg">Head to Head</div><h3>Math Duel</h3>' +
      '<p>Both players race the clock on problems of equal difficulty.</p>' +
      '<div class="tprog num">' + S.duelsPlayed + ' fought · ' + S.duelWins + ' won by ' + esc(S.name) + '</div></button>' +
      '<button class="track match" id="goMatch"><div class="tico num">♟</div><div class="torg">Over the Board</div><h3>Chess Match</h3>' +
      '<p>Complete chess with every rule, including castling and en passant.</p>' +
      '<div class="tprog num">' + S.gamesPlayed + ' games finished</div></button>' +
    '</div>' +
    '<div class="section-label">Compete with your class</div>' +
    '<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:13px 18px" id="goLb">' +
      '<b style="flex:1">Class Leaderboard' + tip("Rank your whole class by Mind Rating, XP or streak. Share codes, or connect the Class Cloud for live standings.") + '</b>' +
      '<span style="color:var(--muted)">›</span>' +
    '</div>' +
    '<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:13px 18px" id="goChal">' +
      '<b style="flex:1">Friend Challenge' + tip("Play five problems near your rating, send the code to a friend, and see who scores higher on the exact same five. The winner earns 25 coins.") + '</b>' +
      '<span style="color:var(--muted)">›</span>' +
    '</div>' +
    '<p class="sub" style="margin-top:14px;text-align:center">Duels and matches are played on this device by passing it between players.</p>'
  );
  document.getElementById("goLb").addEventListener("click", showLeaderboard);
  document.getElementById("goChal").addEventListener("click", showChallengeHub);
  document.getElementById("goDuel").addEventListener("click", showDuelSetup);
  document.getElementById("goMatch").addEventListener("click", startChessMatch);
}

function showDuelSetup() {
  renderTopbar(); setNav("battle");
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button><h1 class="title" style="font-size:22px">🧮 Math Duel</h1></div>' +
    '<div class="card duelsetup">' +
      '<label>Player 1</label><input type="text" id="p1name" maxlength="14" value="' + esc(S.name) + '">' +
      '<label>Player 2</label><input type="text" id="p2name" maxlength="14" placeholder="Challenger" value="Challenger">' +
      '<label>Difficulty</label><div class="segrow" id="diffRow">' +
        '<button class="seg sel" data-d="1">Starter</button>' +
        '<button class="seg" data-d="2">Skilled</button>' +
        '<button class="seg" data-d="3">Advanced</button>' +
        '<button class="seg" data-d="4">AIME</button></div>' +
      '<label>Rounds each</label><div class="segrow" id="roundRow">' +
        '<button class="seg sel" data-r="3">3 rounds</button>' +
        '<button class="seg" data-r="5">5 rounds</button></div>' +
      '<div style="margin-top:20px;text-align:center"><button class="btn gold" id="duelGo" style="font-size:16px;padding:13px 34px">Fight</button></div>' +
    '</div>' +
    '<div class="lessonbox"><b>Scoring:</b> a correct answer = 100 points + 2 points per second remaining. Wrong or out of time = 0. Same difficulty for both players every round: pure skill!</div>'
  );
  document.getElementById("backBtn").addEventListener("click", showBattle);
  let diff = 1, rounds = 3;
  document.getElementById("diffRow").addEventListener("click", e => {
    const b = e.target.closest(".seg"); if (!b) return;
    diff = +b.dataset.d;
    document.querySelectorAll("#diffRow .seg").forEach(x => x.classList.toggle("sel", x === b));
  });
  document.getElementById("roundRow").addEventListener("click", e => {
    const b = e.target.closest(".seg"); if (!b) return;
    rounds = +b.dataset.r;
    document.querySelectorAll("#roundRow .seg").forEach(x => x.classList.toggle("sel", x === b));
  });
  document.getElementById("duelGo").addEventListener("click", () => {
    const p1 = document.getElementById("p1name").value.trim() || "Player 1";
    const p2 = document.getElementById("p2name").value.trim() || "Player 2";
    startDuel(p1, p2, diff, rounds);
  });
}

function duelPool(diff) {
  const pool = [];
  MATH_TOPICS.forEach(t => t.problems.forEach((p, i) => {
    if (p.type !== "board" && p.diff === diff) pool.push({ p, key: t.id + ":" + i });
  }));
  // never re-ask: filter out problems used in previous duels
  let fresh = pool.filter(e => !S.duelUsed[e.key]);
  if (fresh.length < 12) { S.duelUsed = {}; save(); fresh = pool; } // bank exhausted -> recycle
  return fresh;
}
function startDuel(p1, p2, diff, rounds) {
  const pool = duelPool(diff).slice();
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  DUEL = { players: [p1, p2], scores: [0, 0], diff, rounds, round: 0, turn: 0, pool, poolIdx: 0, secs: diff >= 3 ? 90 : 45 };
  duelInterstitial();
}
function duelInterstitial() {
  const D = DUEL;
  setScreen(
    '<div class="card passcard">' +
      '' +
      '<h2>Pass to ' + esc(D.players[D.turn]) + '!</h2>' +
      '<p class="sub">Round ' + (D.round + 1) + ' of ' + D.rounds + ' · ' + D.secs + ' seconds on the clock<br>No peeking, ' + esc(D.players[1 - D.turn]) + '! 👀</p>' +
      '<div style="margin-top:22px"><button class="btn gold" id="readyBtn" style="font-size:16px;padding:13px 32px">I\'m Ready!</button></div>' +
    '</div>' + duelScoreboardHtml()
  );
  document.getElementById("readyBtn").addEventListener("click", duelQuestion);
}
function duelScoreboardHtml() {
  const D = DUEL;
  return '<div class="vsbar">' +
    '<div class="vsplayer' + (D.turn === 0 ? " active" : "") + '"><div class="vpn">' + esc(D.players[0]) + '</div><div class="vps">' + D.scores[0] + '</div></div>' +
    '<div class="vsmid">VS</div>' +
    '<div class="vsplayer' + (D.turn === 1 ? " active" : "") + '"><div class="vpn">' + esc(D.players[1]) + '</div><div class="vps">' + D.scores[1] + '</div></div>' +
  '</div>';
}
function duelQuestion() {
  const D = DUEL;
  if (D.poolIdx >= D.pool.length) D.poolIdx = 0; // recycle if exhausted
  const entryD = D.pool[D.poolIdx++];
  const item = entryD.p;
  S.duelUsed[entryD.key] = true; save();
  let timeLeft = D.secs;
  let answered = false;
  let inner = "";
  if (item.type === "mc") {
    inner = '<div class="qtext">' + fmt(item, item.q) + '</div>' +
      '<div class="choices' + (item.choices.length === 4 ? " four" : (item.choices.length === 5 && item.choices.every(c => String(c).length <= 2) ? " five" : "")) + '">' +
      item.choices.map((c, ci) => '<button class="choice" data-ci="' + ci + '">' + esc(c) + '</button>').join("") + '</div>';
  } else {
    inner = '<div class="qtext">' + fmt(item, item.q) + '</div>' +
      '<div class="numrow"><input class="numinput" id="numAns" placeholder="e.g. 42, -7, 3/8 or 2.5" autocomplete="off">' +
      '<button class="btn" id="numGo">Submit</button></div>';
  }
  setScreen(
    duelScoreboardHtml() +
    '<div class="timerwrap"><div id="timerFill" style="width:100%"></div></div>' +
    '<div class="timernum" id="timerNum">' + timeLeft + 's</div>' +
    '<div class="card question-card">' + inner + '</div>' +
    '<div class="feedback" id="feedback"></div>' +
    '<div class="quizfoot"><button class="btn hidden" id="nextBtn">Next →</button></div>'
  );
  const finish = (good, timedOut) => {
    if (answered) return;
    answered = true;
    stopDuelTimer();
    // duels count toward lifetime accuracy
    S.answeredTotal++;
    if (good) { S.correctTotal++; Sfx.correct(); } else { Sfx.wrong(); }
    save();
    const fb = document.getElementById("feedback");
    let pts = 0;
    if (good) {
      pts = 100 + timeLeft * 2;
      D.scores[D.turn] += pts;
      fb.className = "feedback good show";
      fb.innerHTML = '<div class="fb-title">' + praise() + ' <span class="xpgain">+' + pts + ' points</span></div>' + fmt(item, item.sol);
    } else {
      fb.className = "feedback bad show";
      fb.innerHTML = '<div class="fb-title">' + (timedOut ? "Time is up." : "Not quite.") + '</div>' +
        (item.type === "num" ? "The answer was <b>" + esc(item.answer) + "</b>. " : "") + fmt(item, item.sol);
    }
    document.querySelectorAll(".choice").forEach(x => x.disabled = true);
    const na = document.getElementById("numAns"); if (na) na.disabled = true;
    const ng = document.getElementById("numGo"); if (ng) ng.disabled = true;
    const scoreEls = document.querySelectorAll(".vsplayer .vps");
    if (scoreEls[D.turn]) scoreEls[D.turn].textContent = D.scores[D.turn];
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("nextBtn").addEventListener("click", duelAdvance);
  };
  stopDuelTimer();
  duelTimer = setInterval(() => {
    timeLeft--;
    const tn = document.getElementById("timerNum"), tf = document.getElementById("timerFill");
    if (!tn || !tf) { stopDuelTimer(); return; }
    tn.textContent = timeLeft + "s";
    tf.style.width = Math.max(0, (timeLeft / D.secs) * 100) + "%";
    if (timeLeft <= 0) finish(false, true);
  }, 1000);
  if (item.type === "mc") {
    document.querySelectorAll(".choice").forEach(b => b.addEventListener("click", () => {
      const good = mcGood(item, +b.dataset.ci);
      b.classList.add(good ? "correct" : "wrong");
      if (!good) document.querySelectorAll(".choice")[item.ci].classList.add("correct");
      finish(good, false);
    }));
  } else {
    const go = () => {
      const v = document.getElementById("numAns").value.trim();
      if (v === "") return;
      finish(numGood(item, v), false);
    };
    document.getElementById("numGo").addEventListener("click", go);
    document.getElementById("numAns").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    document.getElementById("numAns").focus();
  }
}
function duelAdvance() {
  const D = DUEL;
  if (D.turn === 0) { D.turn = 1; duelInterstitial(); return; }
  D.turn = 0; D.round++;
  if (D.round >= D.rounds) duelResults();
  else duelInterstitial();
}
function duelResults() {
  const D = DUEL;
  S.duelsPlayed++;
  const tie = D.scores[0] === D.scores[1];
  const wIdx = D.scores[0] >= D.scores[1] ? 0 : 1;
  if (!tie && D.players[wIdx] === S.name) S.duelWins++;
  awardXP(25);
  save(); checkBadges(); confetti(60);
  setScreen(
    '<div class="card results">' +
      '' +
      '<h2>' + (tie ? "It's a TIE!" : esc(D.players[wIdx]) + " WINS!") + '</h2>' +
      '<div class="score">' + esc(D.players[0]) + ' ' + D.scores[0] + ' – ' + D.scores[1] + ' ' + esc(D.players[1]) + '</div>' +
      '<div class="rewards">' +
        '<div class="reward"><div class="rv">+25</div><div class="rl">XP for battling</div></div>' +
        '<div class="reward"><div class="rv">' + S.duelsPlayed + '</div><div class="rl">total duels</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn ghost" id="rematchBtn">Rematch</button>' +
        '<button class="btn" id="doneBtn">Done</button>' +
      '</div>' +
    '</div>'
  );
  document.getElementById("rematchBtn").addEventListener("click", () => startDuel(D.players[0], D.players[1], D.diff, D.rounds));
  document.getElementById("doneBtn").addEventListener("click", showBattle);
}

/* ================= CHESS MATCH (2P pass & play) ================= */
let CM = null;
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
function startChessMatch() {
  renderTopbar(); setNav("battle");
  CM = { st: Engine.parse(START_FEN), sel: null, last: null, caps: { w: [], b: [] }, moves: 0, over: false, animating: false };
  renderMatch();
}
function matchStatusText() {
  const st = CM.st;
  const stat = Engine.status(st);
  const side = st.turn === "w" ? "White" : "Black";
  const other = st.turn === "w" ? "Black" : "White";
  if (stat === "checkmate") return { text: "Checkmate. " + other + " wins!", over: true, winner: other };
  if (stat === "stalemate") return { text: "Stalemate. The game is a draw.", over: true };
  if (stat === "insufficient") return { text: "Draw. Not enough material to mate.", over: true };
  if (stat === "fifty") return { text: "Draw by the fifty move rule.", over: true };
  if (stat === "check") return { text: side + " is in check.", over: false };
  return { text: side + " to move", over: false };
}
function renderMatch() {
  const info = matchStatusText();
  if (info.over && !CM.over) {
    CM.over = true;
    S.gamesPlayed++;
    if (info.winner) S.gamesWon++;
    awardXP(40);
    save(); checkBadges();
    setTimeout(() => { toast("♚", info.text); confetti(50); }, 350);
  }
  setScreen(
    '<div class="matchhead">' +
      '<button class="btn ghost small" id="backBtn">← Exit</button>' +
      '<span class="turnbadge" id="statusBadge">' + info.text + '</span>' +
      '<button class="btn ghost small" id="newBtn">New game</button>' +
    '</div>' +
    '<div class="capbar" id="capB">' + CM.caps.b.map(p => '<span class="cw">' + GLYPHS[p] + '</span>').join("") + '</div>' +
    '<div class="boardwrap"><div class="board" id="board"></div></div>' +
    '<div class="capbar" id="capW">' + CM.caps.w.map(p => '<span class="cb">' + GLYPHS[p] + '</span>').join("") + '</div>' +
    '<div class="movelog" id="movelog">' + (CM.moves === 0 ? "Moves will appear here. Pawns auto-promote to queens." : CM.log || "") + '</div>'
  );
  document.getElementById("backBtn").addEventListener("click", showBattle);
  document.getElementById("newBtn").addEventListener("click", startChessMatch);
  redrawMatchBoard();
}
function redrawMatchBoard() {
  const el = document.getElementById("board");
  if (!el) return;
  const st = CM.st;
  const inChk = Engine.inCheck(st, st.turn === "w");
  const checkSq = inChk ? Engine.kingSq(st.b, st.turn === "w") : -1;
  const hints = CM.sel != null && !CM.over ? Engine.legalFrom(st, CM.sel) : [];
  drawBoardEl(el, st, { sel: CM.sel, hints, last: CM.last, checkSq, onTap: tapMatch });
}
function tapMatch(i) {
  if (CM.over || CM.animating) return;
  const st = CM.st;
  const pc = st.b[i];
  const mine = pc && (isWhitePiece(pc) === (st.turn === "w"));
  if (CM.sel == null) {
    if (mine) { CM.sel = i; redrawMatchBoard(); }
    return;
  }
  if (i === CM.sel) { CM.sel = null; redrawMatchBoard(); return; }
  if (mine) { CM.sel = i; redrawMatchBoard(); return; }
  const mv = Engine.legalFrom(st, CM.sel).find(m => m.to === i);
  if (!mv) return;
  const piece = st.b[CM.sel];
  const capturedPc = mv.ep ? (st.turn === "w" ? "p" : "P") : st.b[i];
  const from = CM.sel;
  CM.sel = null;
  CM.animating = true;
  const nx = Engine.make(st, mv, "Q");
  const moveStr = (st.turn === "w" ? (Math.floor(CM.moves / 2) + 1) + ". " : "") + sqName(from) + (capturedPc ? "×" : "–") + sqName(i) + (mv.promo ? "=Q" : "") + (mv.castle ? (mv.castle === "K" ? " (O-O)" : " (O-O-O)") : "");
  animateMove(document.getElementById("board"), from, i, piece, () => {
    if (capturedPc) {
      if (isWhitePiece(capturedPc)) CM.caps.b.push(capturedPc); else CM.caps.w.push(capturedPc);
    }
    CM.st = nx;
    CM.last = [from, i];
    CM.moves++;
    CM.log = (CM.log ? CM.log + "  " : "") + moveStr;
    CM.animating = false;
    renderMatch();
    const ml = document.getElementById("movelog");
    if (ml) ml.scrollTop = ml.scrollHeight;
  });
}

/* ================= CLASS LEADERBOARD (codes + optional Class Cloud) ================= */
function lbHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return ("0000" + (h % 1679616).toString(36)).slice(-4);
}
function selfEntry() {
  return {
    name: (S.name || "Player").replace(/\|/g, " ").slice(0, 20),
    xp: S.xp || 0, m: S.mathElo || 800, c: S.chessElo || 800,
    mg: S.mathEloGames || 0, cg: S.chessEloGames || 0,
    st: S.streak || 0, bd: earnedUnitCount(), ct: S.correctTotal || 0, ts: todayStr(),
    da: S.daysActive || 0, sx: (S.season && S.season.xp) || 0
  };
}
function classCode() {
  const e = selfEntry();
  const payload = [e.name, e.xp, e.m, e.c, e.mg, e.cg, e.st, e.bd, e.ct, e.ts].join("|");
  return "MM1-" + btoa(unescape(encodeURIComponent(payload))) + "-" + lbHash(payload);
}
function parseClassCode(str) {
  const m = String(str).trim().match(/^MM1-([A-Za-z0-9+/=]+)-([a-z0-9]{4})$/);
  if (!m) return null;
  let payload;
  try { payload = decodeURIComponent(escape(atob(m[1]))); } catch (e) { return null; }
  if (lbHash(payload) !== m[2]) return null;
  const p = payload.split("|");
  if (p.length < 10) return null;
  const num = x => { const v = parseInt(x, 10); return isNaN(v) ? 0 : Math.max(0, Math.min(9999999, v)); };
  const name = p[0].trim().slice(0, 20);
  if (!name) return null;
  return { name, xp: num(p[1]), m: num(p[2]), c: num(p[3]), mg: num(p[4]), cg: num(p[5]), st: num(p[6]), bd: num(p[7]), ct: num(p[8]), ts: String(p[9]).slice(0, 10) };
}
function lbKeyOf(name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24) || "player"; }
function lbMind(e) { return (e.mg >= 5 && e.cg >= 5) ? Math.round((e.m + e.c) / 2) : null; }

/* ---- Class Cloud: optional live sync through a Firebase Realtime Database ---- */
let CLOUD_PEERS = null, CLOUD_STATUS = "";
function cloudCfgOk() {
  const u = (S.cloud && S.cloud.url) || "";
  return /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebaseio\.com|firebasedatabase\.app)\/?$/i.test(u) && ((S.cloud.cls || "").trim().length >= 2);
}
function cloudPath() {
  return S.cloud.url.replace(/\/+$/, "") + "/classes/" + lbKeyOf(S.cloud.cls);
}
function cloudPush(cb) {
  if (!cloudCfgOk() || !S.name) { if (cb) cb(false); return; }
  try {
    fetch(cloudPath() + "/" + lbKeyOf(S.name) + ".json", { method: "PUT", body: JSON.stringify(selfEntry()) })
      .then(r => { if (cb) cb(r.ok); }).catch(() => { if (cb) cb(false); });
  } catch (e) { if (cb) cb(false); }
}
function cloudFetch(cb) {
  if (!cloudCfgOk()) { if (cb) cb(false); return; }
  try {
    fetch(cloudPath() + ".json").then(r => r.json()).then(data => {
      CLOUD_PEERS = {};
      if (data && typeof data === "object") {
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && v.name) {
            CLOUD_PEERS[k] = {
              name: String(v.name).slice(0, 20), xp: +v.xp || 0, m: +v.m || 800, c: +v.c || 800,
              mg: +v.mg || 0, cg: +v.cg || 0, st: +v.st || 0, bd: +v.bd || 0, ct: +v.ct || 0, ts: String(v.ts || "").slice(0, 10),
              da: +v.da || 0, sx: +v.sx || 0
            };
          }
        }
      }
      if (cb) cb(true);
    }).catch(() => { CLOUD_PEERS = null; if (cb) cb(false); });
  } catch (e) { if (cb) cb(false); }
}

let LB_SORT = "mind";
function showLeaderboard() {
  renderTopbar(); setNav("battle");
  const me = selfEntry();
  const meKey = lbKeyOf(me.name);
  // merge: pasted codes + cloud peers (cloud wins when newer), self always live
  const merged = {};
  for (const [k, v] of Object.entries(S.lbPeers || {})) merged[k] = v;
  if (CLOUD_PEERS) for (const [k, v] of Object.entries(CLOUD_PEERS)) {
    if (!merged[k] || String(v.ts) >= String(merged[k].ts || "")) merged[k] = v;
  }
  delete merged[meKey];
  const rows = [Object.assign({ self: true }, me)].concat(Object.values(merged).map(v => Object.assign({ key: lbKeyOf(v.name) }, v)));
  const metric = LB_SORT === "xp" ? (e => e.xp) : LB_SORT === "streak" ? (e => e.st) : LB_SORT === "season" ? (e => e.sx || 0) : (e => lbMind(e) == null ? -1 : lbMind(e));
  rows.sort((a, b) => metric(b) - metric(a) || b.xp - a.xp);
  const MEDAL_COLS = ["var(--gold)", "#a8adb8", "#b08d57"];
  const medal = i => i < 3
    ? '<span class="num" style="color:' + MEDAL_COLS[i] + ';font-weight:700">' + (i + 1) + '</span>'
    : '<span class="num" style="color:var(--muted)">' + (i + 1) + '</span>';
  const valOf = e => LB_SORT === "xp" ? e.xp + " XP" : LB_SORT === "streak" ? e.st + (e.st === 1 ? " day" : " days") : LB_SORT === "season" ? (e.sx || 0) + " season XP" : (lbMind(e) == null ? "?" : lbMind(e));
  const cloudOn = cloudCfgOk();
  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Back</button>' +
    '<div><h1 class="title" style="font-size:21px">Class Leaderboard</h1>' +
    '<p class="sub">Compare Mind Ratings, all-time XP, streaks and season XP. All-time XP never resets. Season XP starts fresh each month.</p></div></div>' +

    '<div class="card" style="padding:14px 16px">' +
      '<b>My class code' + tip("Send your code to your coach or friends, and paste theirs here to build the leaderboard. Codes update whenever they are shared again.") + '</b>' +
      '<div class="mycode" id="myCode" style="margin-top:8px">' + classCode() + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">' +
        '<button class="btn small" id="copyCode">Copy code</button>' +
        '<button class="btn ghost small" id="addCodes">Add classmates\' codes</button>' +
      '</div>' +
    '</div>' +

    '<div id="pasteArea" class="card hidden" style="padding:14px 16px">' +
      '<b>Paste one or more codes</b>' +
      '<textarea class="codebox" id="codeInput" placeholder="MM1-..." style="margin-top:8px"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="btn gold small" id="parseCodes">Add to leaderboard</button>' +
      '</div>' +
    '</div>' +

    '<div class="section-label" style="display:flex;align-items:center;gap:10px">Rankings' +
      '<span class="cloudtag ' + (cloudOn ? "on" : "off") + '">' + (cloudOn ? "Class Cloud: " + esc(S.cloud.cls) : "offline codes") + '</span>' +
    '</div>' +
    '<div class="diffchips" style="justify-content:flex-start">' +
      [["mind", "Mind Rating"], ["xp", "All-time XP"], ["streak", "Streak"], ["season", "Season XP"]].map(([k, lab]) =>
        '<button class="diffchip' + (LB_SORT === k ? " sel" : "") + '" data-srt="' + k + '">' + lab + '</button>').join("") +
    '</div>' +
    rows.map((e, i) =>
      '<div class="lbrow' + (e.self ? " me" : "") + '">' +
        '<span class="lrank">' + medal(i) + '</span>' +
        '<span style="font-size:18px;display:flex;align-items:center">' + (e.self ? avDisplay(26) : '<span class="num" style="color:var(--muted);font-weight:700">' + esc((e.name || "?")[0].toUpperCase()) + '</span>') + '</span>' +
        '<span class="lname">' + esc(e.name) + (e.self ? ' <span style="color:var(--gold);font-size:11px">(you)</span>' : '') +
          '<div class="lsub">' + e.ct + ' solved · ' + e.bd + ' badges' + (e.ts ? ' · as of ' + esc(e.ts) : '') + '</div></span>' +
        '<span style="text-align:right"><div class="lval">' + valOf(e) + '</div></span>' +
        (e.self ? '' : '<button class="lx" data-k="' + esc(e.key || lbKeyOf(e.name)) + '" title="Remove">✕</button>') +
      '</div>').join("") +
    (rows.length === 1 ? '<p class="sub" style="text-align:center;margin-top:10px">Just you so far. Add classmates\' codes or connect the Class Cloud below.</p>' : '') +

    '<div class="section-label">Class Cloud (live sync)</div>' +
    (cloudOn
      ? '<div class="card" style="padding:14px 16px">' +
          '<b>Connected to class: ' + esc(S.cloud.cls) + '</b>' +
          '<p class="sub" style="margin:6px 0 10px" id="cloudStatus">' + (CLOUD_STATUS || "Your score syncs automatically after each session.") + '</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn small" id="cloudRefresh">Refresh</button>' +
            '<button class="btn ghost small" id="cloudOff" style="color:var(--red)">Disconnect</button>' +
          '</div>' +
        '</div>'
      : '<div class="card" style="padding:14px 16px">' +
          '<b>Connect to your class (optional, needs internet)</b>' +
          '<p class="sub" style="margin:6px 0 10px">Your coach shares a database link and a class name. Enter both and the leaderboard updates live for everyone.</p>' +
          '<input class="lbinput" id="cloudUrl" placeholder="https://your-class.firebaseio.com" autocomplete="off">' +
          '<input class="lbinput" id="cloudCls" placeholder="Class name, for example nsf2026" autocomplete="off">' +
          '<button class="btn gold small" id="cloudSave">Connect</button>' +
          '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;font-weight:800;color:var(--muted)">Coach setup guide</summary>' +
            '<p class="sub" style="margin-top:8px">1. Go to console.firebase.google.com and create a free project.<br>' +
            '2. Add a <b>Realtime Database</b> (test mode).<br>' +
            '3. Copy the database URL (it ends in firebaseio.com or firebasedatabase.app).<br>' +
            '4. Share that URL and a class name with your students. Everyone enters the same two values here.<br>' +
            'Note: test-mode databases are open to anyone with the link, so share it only with your class.</p></details>' +
        '</div>') +
    '<div style="height:12px"></div>'
  );
  document.getElementById("backBtn").addEventListener("click", showBattle);
  document.getElementById("copyCode").addEventListener("click", () => {
    const code = classCode();
    const done = () => toast("✓", "Code copied. Send it to your coach or classmates.");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
    else fallbackCopy(code, done);
  });
  document.getElementById("addCodes").addEventListener("click", () => {
    document.getElementById("pasteArea").classList.toggle("hidden");
    const ta = document.getElementById("codeInput");
    if (!document.getElementById("pasteArea").classList.contains("hidden")) ta.focus();
  });
  document.getElementById("parseCodes").addEventListener("click", () => {
    const raw = document.getElementById("codeInput").value;
    const found = raw.match(/MM1-[A-Za-z0-9+/=]+-[a-z0-9]{4}/g) || [];
    let added = 0, bad = 0;
    for (const c of found) {
      const e = parseClassCode(c);
      if (!e) { bad++; continue; }
      const k = lbKeyOf(e.name);
      if (k === lbKeyOf(selfEntry().name)) continue;    // that's you
      if (!S.lbPeers[k] || String(e.ts) >= String(S.lbPeers[k].ts || "")) { S.lbPeers[k] = e; added++; }
    }
    save();
    if (added) { Sfx.correct(); toast("✓", added + " classmate" + (added > 1 ? "s" : "") + " added to the leaderboard."); }
    if (!found.length) toast("!", "No codes found. Codes start with MM1-.");
    else if (bad) toast("!", bad + " code" + (bad > 1 ? "s were" : " was") + " invalid and skipped.");
    showLeaderboard();
  });
  document.querySelectorAll(".diffchip[data-srt]").forEach(b => b.addEventListener("click", () => {
    LB_SORT = b.dataset.srt; Sfx.click(); showLeaderboard();
  }));
  document.querySelectorAll(".lx").forEach(b => b.addEventListener("click", () => {
    delete S.lbPeers[b.dataset.k];
    if (CLOUD_PEERS) delete CLOUD_PEERS[b.dataset.k];
    save(); showLeaderboard();
  }));
  const cs = document.getElementById("cloudSave");
  if (cs) cs.addEventListener("click", () => {
    const url = document.getElementById("cloudUrl").value.trim();
    const cls = document.getElementById("cloudCls").value.trim();
    S.cloud = { url, cls };
    if (!cloudCfgOk()) { S.cloud = { url: "", cls: "" }; toast("!", "That link does not look like a Firebase database URL. Check the coach setup guide."); return; }
    save();
    CLOUD_STATUS = "Connecting…";
    cloudPush(ok1 => cloudFetch(ok2 => {
      CLOUD_STATUS = (ok1 && ok2) ? "Connected. Your score is on the board." : "Could not reach the class database. Check the link and your internet connection.";
      showLeaderboard();
    }));
  });
  const cr = document.getElementById("cloudRefresh");
  if (cr) cr.addEventListener("click", () => {
    CLOUD_STATUS = "Refreshing…";
    cloudPush(() => cloudFetch(ok => { CLOUD_STATUS = ok ? "Up to date." : "Could not reach the class database."; showLeaderboard(); }));
  });
  const co = document.getElementById("cloudOff");
  if (co) co.addEventListener("click", () => {
    askConfirm("Disconnect Class Cloud?", "Your saved classmates from pasted codes are kept. Live sync stops until you reconnect.", "Disconnect", () => {
      S.cloud = { url: "", cls: "" }; CLOUD_PEERS = null; CLOUD_STATUS = ""; save(); showLeaderboard();
    });
  });
  // live refresh when connected
  if (cloudOn && !CLOUD_PEERS) {
    cloudPush(() => cloudFetch(ok => { if (ok) { CLOUD_STATUS = "Up to date."; showLeaderboard(); } }));
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { toast("!", "Copy failed. Select the code and copy it by hand."); }
  ta.remove();
}

/* ================= BADGES & PROFILE ================= */
function showBadges() {
  renderTopbar(); setNav("badges");
  const famCard = f => {
    const v = f.metric();
    const nextTier = f.tiers.findIndex(req => v < req);
    const doneAll = nextTier === -1;
    const topEarned = doneAll ? 4 : nextTier - 1;
    const pct = doneAll ? 100 : Math.min(100, Math.round((v / f.tiers[nextTier]) * 100));
    const anyEarned = S.badges[f.id + "_0"];
    const status = doneAll
      ? '<span style="color:var(--gold)">All five tiers earned</span>'
      : '<span class="num">' + v + ' / ' + f.tiers[nextTier] + '</span> ' + f.unit;
    const nextLine = doneAll ? '' : '<div class="bnext" title="Your next tier and its reward">\u25b8 ' + TIER_NAMES[nextTier] +
      '<span class="rwd">' + coinIco(11) + TIER_COINS[nextTier] + '</span>' +
      (BADGE_CHEST[nextTier] ? '<span class="rwd">' + chestIco(13) + BADGE_CHEST[nextTier] + '</span>' : '') + '</div>';
    return '<div class="badge ' + (anyEarned ? "earned" : "locked") + '">' +
      '<div class="bico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="' + (anyEarned ? "var(--gold)" : "var(--muted)") + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.2"/><path d="m9.2 13.4-1.9 6.6 4.7-2.4 4.7 2.4-1.9-6.6"/></svg></div>' +
      '<h5>' + f.name + '</h5>' +
      '<div class="tierrow">' + f.tiers.map((req, ti) =>
        '<div class="tierdot ' + (S.badges[f.id + "_" + ti] ? "t" + (ti + 1) : "") + '" title="' + TIER_NAMES[ti] + ': ' + req + ' ' + f.unit + '. Reward: ' + TIER_COINS[ti] + ' coins' + (BADGE_CHEST[ti] ? ', plus a bonus chest holding ' + BADGE_CHEST[ti] + ' more' : '') + '.">' + (S.badges[f.id + "_" + ti] ? "★" : "·") + '</div>').join("") + '</div>' +
      nextLine +
      '<div class="bprog">' + status + '</div>' +
      '<div class="bprogbar"><div style="width:' + pct + '%"></div></div>' +
      '</div>';
  };
  const sections = Object.keys(SEC_LABELS).map(sec => {
    const fams = FAMILIES.filter(f => f.sec === sec);
    if (!fams.length) return '';
    const earned = fams.reduce((a, f) => a + f.tiers.filter((_, ti) => S.badges[f.id + "_" + ti]).length, 0);
    const total = fams.length * 5;
    return '<div class="section-label" style="display:flex;align-items:center;gap:10px">' + SEC_LABELS[sec] +
      '<span class="cloudtag ' + (earned ? "on" : "off") + '">' + earned + ' / ' + total + '</span></div>' +
      '<div class="badgegrid">' + fams.map(famCard).join("") + '</div>';
  }).join("");
  const singleHtml = SINGLES.map(b => {
    const got = S.badges[b.id];
    return '<div class="badge ' + (got ? "earned" : "locked") + '">' +
      '<div class="bico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="' + (got ? "var(--gold)" : "var(--muted)") + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 14.4 8.6 20 9.4l-4 4 .9 5.6L12 16.4 7.1 19l.9-5.6-4-4 5.6-.8z"/></svg></div>' +
      '<h5>' + b.name + '</h5><p>' + b.desc + '</p>' +
      (got ? '<div class="bdate">' + got + '</div>' : '<div class="bnext">Earns<span class="rwd">' + coinIco(11) + '30</span></div>') + '</div>';
  }).join("");
  setScreen(
    '<div style="display:flex;align-items:center;gap:12px">' +
    '<div style="flex:1"><h1 class="title">Trophy Case</h1>' +
    '<p class="sub">' + earnedUnitCount() + ' of ' + badgeUnitCount() + ' badges collected.' + tip("Each family climbs Bronze, Silver, Gold, Platinum, then Diamond. Every tier pays out coins, and Gold tiers and above also drop a badge chest with bonus coins. Special badges are one of a kind.") + '</p></div>' +
    '<div style="text-align:right"><div class="num" style="font-size:19px;font-weight:700;color:var(--gold)">' + (S.coins || 0) + '</div>' +
    '<div style="font-size:10.5px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">coins</div></div>' +
    '</div>' +
    sections +
    '<div class="section-label">Special</div>' +
    '<div class="badgegrid">' + singleHtml + '</div>'
  );
}

function showProfile() {
  renderTopbar(); setNav("profile");
  const li = levelInfo(S.xp);
  const acc = S.answeredTotal ? ((S.correctTotal / S.answeredTotal) * 100).toFixed(1) : "0.0";
  const ms = trackStats("math"), cs = trackStats("chess");
  const tile = (v, l, c) => '<div class="stattile"><div class="sv" style="color:' + (c || "var(--ink)") + '">' + v + '</div><div class="sl">' + l + '</div></div>';
  const secLab = t => '<div class="section-label">' + t + '</div>';
  const bestTest = (function () {
    let best = null;
    for (const [name, b] of Object.entries(S.testBest || {})) if (!best || b.v > best.v) best = Object.assign({ name }, b);
    return best;
  })();
  setScreen(
    '<div class="card hero">' +
      '<div class="av' + (S.char ? " charhost" : frCls()) + '" id="profAv" style="cursor:pointer">' + avDisplay(52) + '</div>' +
      '<div class="meta"><div class="hello">' + esc(S.name) + '</div>' +
      '<div class="rank">Level ' + li.lvl + ' · ' + li.title + ' · ' + S.xp + ' XP all-time</div>' +
      '<div style="font-size:12px;color:var(--purple);font-weight:700">' + (((S.season || {}).xp) || 0) + ' XP this season</div>' +
      '<div style="font-size:12px;color:var(--muted)">NSF Math · CheckMates Chess</div></div>' +
      '<div style="text-align:right"><div class="num" style="font-size:20px;font-weight:700;color:var(--gold)">' + (S.coins || 0) + '</div>' +
      '<div style="font-size:10.5px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">coins</div></div>' +
    '</div>' +
    (function () {
      const r = mindRating();
      return '<div class="card" style="text-align:center;padding:16px">' +
        '<div class="num" style="font-size:30px;font-weight:700;color:var(--gold)">' + (r.ready ? r.val : "–") + '</div>' +
        '<div style="font-size:11px;color:var(--muted);font-weight:600;letter-spacing:1.4px;text-transform:uppercase">Mind Rating' + (r.ready ? " · " + r.tier.name : "") +
        tip(r.ready ? "Math and chess each count half. Balance your training to climb."
          : "Answer 5 rated math questions and 5 rated chess puzzles to unlock.") + '</div>' +
        '</div>';
    })() +
    secLab('Ratings') +
    '<div class="statgrid">' +
      tile(S.mathElo || 800, 'Math Rating', 'var(--blue)') +
      tile(S.chessElo || 800, 'Chess Rating', 'var(--purple)') +
      tile(S.mathEloPeak || 800, 'Peak Math', 'var(--blue)') +
      tile(S.chessEloPeak || 800, 'Peak Chess', 'var(--purple)') +
    '</div>' +
    secLab('Solving') +
    accuracyPieHtml() +
    '<div class="statgrid">' +
      tile(S.correctTotal, 'Correct', 'var(--green)') +
      tile(acc + '%', 'Accuracy', 'var(--blue)') +
      tile(ms.done.toLocaleString(), 'Math Solved', 'var(--blue)') +
      tile(cs.done.toLocaleString(), 'Chess Solved', 'var(--purple)') +
      tile(Object.keys(S.aimeSolved).length, 'AIME Solved', 'var(--orange)') +
      tile(Object.keys(S.matesSolved).length, 'Checkmates', 'var(--red)') +
      tile(S.hardSolved || 0, 'Giant Slays' + '', 'var(--gold)') +
      tile(S.bestScalp || '–', 'Hardest Solve', 'var(--gold)') +
    '</div>' +
    secLab('Dedication') +
    '<div class="statgrid">' +
      tile(S.streak, 'Day Streak', 'var(--teal)') +
      tile(S.maxStreak, 'Best Streak', 'var(--teal)') +
      tile(S.daysActive || 0, 'Days Active', 'var(--teal)') +
      tile(S.goalDays || 0, 'Daily Goals', 'var(--gold)') +
      tile(S.dailyCount, 'Dailies Won', 'var(--gold)') +
      tile(S.bestCombo, 'Best Combo', 'var(--orange)') +
      tile(S.earlySolves || 0, 'Early Solves', 'var(--muted)') +
      tile(S.lateSolves || 0, 'Night Solves', 'var(--muted)') +
      tile(((S.season || {}).xp) || 0, 'Season XP', 'var(--purple)') +
      tile((function () { const h = Object.values(S.seasonHist || {}); const cur = ((S.season || {}).xp) || 0; return Math.max(cur, h.length ? Math.max.apply(null, h) : 0); })(), 'Best Season', 'var(--purple)') +
    '</div>' +
    secLab('Competition') +
    '<div class="statgrid">' +
      tile(S.testsTaken || 0, 'Practice Tests', 'var(--teal)') +
      tile(S.testAce || 0, 'Test Aces', 'var(--gold)') +
      tile(S.duelsPlayed, 'Duels', 'var(--red)') +
      tile(S.duelWins, 'Duel Wins', 'var(--red)') +
      tile(S.gamesPlayed, 'Chess Games', 'var(--green)') +
      (bestTest ? tile(bestTest.s.split(' / ')[0], 'Best Test Score', 'var(--gold)') : '') +
    '</div>' +
    secLab('Classroom') +
    '<div class="statgrid">' +
      tile(S.asgDone || 0, 'Assignments Done', 'var(--blue)') +
      tile(S.asgPerfect || 0, 'Perfect Assignments', 'var(--gold)') +
      tile(S.reviewCleared || 0, 'Reviews Conquered', 'var(--purple)') +
      tile(earnedUnitCount(), 'Badges', 'var(--pink)') +
    '</div>' +
    (Store.persistent ? '' : '<p class="sub" style="margin-top:14px">This viewer cannot save progress between visits. Open the file in a regular browser (double-click it) for progress to be remembered.</p>') +
    '<div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn gold small" id="studioBtn">Avatar Studio</button>' +
      '<button class="btn ghost small" id="teachBtn">Switch account</button>' +
      '<button class="btn ghost small" id="myCodeBtn">My class code</button>' +
      '<button class="btn ghost small" id="editProfile">Edit name and avatar</button>' +
      '<button class="btn ghost small" id="pwBtn">Password</button>' +
      '<button class="btn ghost small" id="logoutBtn">Log out</button>' +
      '<button class="btn ghost small" id="soundBtn">' + (S.soundOff ? "Sounds: off" : "Sounds: on") + '</button>' +
      '<button class="btn ghost small" id="resetBtn" style="color:var(--red)">Reset all progress</button>' +
    '</div>'
  );
  document.getElementById("studioBtn").addEventListener("click", showStudio);
  document.getElementById("profAv").addEventListener("click", showStudio);
  document.getElementById("soundBtn").addEventListener("click", () => {
    S.soundOff = !S.soundOff; save(); Sfx.correct(); showProfile();
  });
  document.getElementById("teachBtn").addEventListener("click", mmLogout);
  document.getElementById("myCodeBtn").addEventListener("click", showLeaderboard);
  document.getElementById("editProfile").addEventListener("click", () => { welcomeRole = "student"; showWelcome(); });
  document.getElementById("pwBtn").addEventListener("click", showPasswordSettings);
  document.getElementById("logoutBtn").addEventListener("click", mmLogout);
  document.getElementById("resetBtn").addEventListener("click", () => {
    askConfirm("Erase everything?", "This permanently deletes all progress, XP, ratings, coins and badges. There is no undo.", "Erase All", () => {
      S = JSON.parse(JSON.stringify(DEFAULT_STATE));
      S.owned = { av: ["🦁", "🦊", "🐼", "🦉"], fr: ["none"] };
      save(); showWelcome();
    });
  });
}

/* ================= AVATAR STUDIO ================= */
const SHOP_AVATARS = [
  { e: "🦁", p: 0 }, { e: "🦊", p: 0 }, { e: "🐼", p: 0 }, { e: "🦉", p: 0 },
  { e: "🐯", p: 150 }, { e: "🐸", p: 150 }, { e: "🐧", p: 150 }, { e: "🐨", p: 150 }, { e: "🚀", p: 150 }, { e: "🤖", p: 150 },
  { e: "🥷", p: 300 }, { e: "🧙", p: 300 }, { e: "🦄", p: 300 }, { e: "🐺", p: 300 }, { e: "🦅", p: 300 }, { e: "🐙", p: 300 },
  { e: "🐲", p: 600 }, { e: "🦖", p: 600 }, { e: "🐳", p: 600 }, { e: "🦚", p: 600 },
  { e: "🐉", p: 1000 }, { e: "🧞", p: 1000 }
];
const SHOP_FRAMES = [
  { id: "none", name: "No frame", p: 0 },
  { id: "bronze", name: "Bronze Ring", p: 200 },
  { id: "silver", name: "Silver Ring", p: 450 },
  { id: "emerald", name: "Emerald Glow", p: 650 },
  { id: "gold", name: "Gold Glow", p: 900 },
  { id: "royal", name: "Royal Aura", p: 1200 },
  { id: "ember", name: "Ember Aura", p: 1500 }
];

/* ---- keyboard: Enter advances (or retries), A to E answer multiple choice ---- */
let feedbackShownAt = 0;
document.addEventListener("keydown", e => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return; // typing, not shortcuts
  if (e.key === "Enter") {
    if (Date.now() - feedbackShownAt < 350) return; // the submit keypress must not also advance
    const ry = document.getElementById("retryYes");
    if (ry) { e.preventDefault(); ry.click(); return; }
    const nb = document.getElementById("nextBtn");
    if (nb && !nb.classList.contains("hidden")) { e.preventDefault(); Sfx.click(); nb.click(); }
    return;
  }
  const k = e.key.toUpperCase();
  if (k.length === 1 && k >= "A" && k <= "E") {
    const chs = document.querySelectorAll(".choice");
    if (chs.length !== 5) return;
    const idx = k.charCodeAt(0) - 65;
    const btn = chs[idx];
    if (btn && !btn.disabled && String(btn.textContent).trim() === k) { e.preventDefault(); btn.click(); }
  }
});

/* ---- figure lightbox: tap a diagram to enlarge it ---- */
document.addEventListener("click", e => {
  const f = e.target.closest && e.target.closest(".asyfig-zoom");
  if (!f || document.getElementById("figZoom")) return;
  const ov = document.createElement("div");
  ov.id = "figZoom";
  ov.className = "figzoom";
  ov.innerHTML = '<div class="figzoombox">' + f.innerHTML + '</div><div class="figzoomhint">Tap anywhere to close</div>';
  document.body.appendChild(ov);
  ov.addEventListener("click", () => ov.remove());
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { const z = document.getElementById("figZoom"); if (z) z.remove(); }
});

/* ================= BOOT ================= */
if (typeof katex === "undefined") {
  setTimeout(() => toast("!", "Math rendering failed to load. Please re-download the app file; it may be incomplete."), 1200);
}
(function boot() {
  if (typeof authGate === "function" && authGate()) return;   // account chooser is showing
  const role = Store.get("mm_role", "student");
  if (role === "teacher" && loadTS().name) { showTeacherHome(); return; }
  if (S.name) {
    touchStreak();
    if (!S.onboarded && typeof startOnboarding === "function") startOnboarding();
    else showHome();
  } else { showWelcome(); }
})();
