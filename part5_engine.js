/* ================= CHESS ENGINE =================
   Full legal move generation: castling, en passant, promotion,
   check / checkmate / stalemate / insufficient material / 50-move.
   Board: array[64], index 0 = a8 ... 63 = h1. White = uppercase.
*/
const Engine = (() => {
  const KN = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const KI = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const DIAG = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const ORTH = [[-1,0],[1,0],[0,-1],[0,1]];

  function parse(fen) {
    const parts = fen.trim().split(/\s+/);
    const b = new Array(64).fill(null);
    let i = 0;
    for (const ch of parts[0]) {
      if (ch === "/") continue;
      if (/\d/.test(ch)) i += +ch;
      else b[i++] = ch;
    }
    return {
      b, turn: parts[1] || "w",
      castle: parts[2] && parts[2] !== "-" ? parts[2] : "",
      ep: parts[3] && parts[3] !== "-" ? sqIdxE(parts[3]) : -1,
      half: parts[4] ? +parts[4] : 0,
      full: parts[5] ? +parts[5] : 1
    };
  }
  function sqIdxE(name) { return (8 - +name[1]) * 8 + "abcdefgh".indexOf(name[0]); }
  function sqNameE(idx) { return "abcdefgh"[idx % 8] + (8 - Math.floor(idx / 8)); }
  const isW = p => p && p === p.toUpperCase();
  const row = i => i >> 3, col = i => i & 7;

  function attacked(b, sq, byWhite) {
    const r = row(sq), c = col(sq);
    // knights
    for (const [dr, dc] of KN) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const p = b[rr * 8 + cc];
      if (p && isW(p) === byWhite && p.toLowerCase() === "n") return true;
    }
    // king
    for (const [dr, dc] of KI) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const p = b[rr * 8 + cc];
      if (p && isW(p) === byWhite && p.toLowerCase() === "k") return true;
    }
    // pawns: a white pawn on (r+1) attacks (r); black pawn on (r-1) attacks (r)
    const pr = byWhite ? r + 1 : r - 1;
    if (pr >= 0 && pr <= 7) {
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const p = b[pr * 8 + cc];
        if (p && isW(p) === byWhite && p.toLowerCase() === "p") return true;
      }
    }
    // sliders
    for (const [dr, dc] of DIAG) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr <= 7 && cc >= 0 && cc <= 7) {
        const p = b[rr * 8 + cc];
        if (p) {
          if (isW(p) === byWhite && (p.toLowerCase() === "b" || p.toLowerCase() === "q")) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }
    for (const [dr, dc] of ORTH) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr <= 7 && cc >= 0 && cc <= 7) {
        const p = b[rr * 8 + cc];
        if (p) {
          if (isW(p) === byWhite && (p.toLowerCase() === "r" || p.toLowerCase() === "q")) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }
    return false;
  }

  function kingSq(b, white) {
    const k = white ? "K" : "k";
    for (let i = 0; i < 64; i++) if (b[i] === k) return i;
    return -1;
  }
  function inCheck(st, white) { return attacked(st.b, kingSq(st.b, white), !white); }

  // pseudo-legal moves for piece at `from`
  function pseudo(st, from) {
    const b = st.b, p = b[from];
    if (!p) return [];
    const white = isW(p), moves = [], r = row(from), c = col(from);
    const push = (to, extra) => moves.push(Object.assign({ from, to }, extra || {}));
    const t = p.toLowerCase();
    if (t === "p") {
      const dir = white ? -1 : 1;
      const startRow = white ? 6 : 1, promoRow = white ? 0 : 7;
      const f1 = (r + dir) * 8 + c;
      if (r + dir >= 0 && r + dir <= 7 && !b[f1]) {
        if (row(f1) === promoRow) push(f1, { promo: true });
        else push(f1);
        const f2 = (r + 2 * dir) * 8 + c;
        if (r === startRow && !b[f2]) push(f2, { dbl: true });
      }
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const rr = r + dir;
        if (rr < 0 || rr > 7) continue;
        const to = rr * 8 + cc;
        if (b[to] && isW(b[to]) !== white) {
          if (rr === promoRow) push(to, { promo: true });
          else push(to);
        } else if (to === st.ep && !b[to]) {
          push(to, { ep: true });
        }
      }
    } else if (t === "n" || t === "k") {
      const deltas = t === "n" ? KN : KI;
      for (const [dr, dc] of deltas) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        const to = rr * 8 + cc;
        if (!b[to] || isW(b[to]) !== white) push(to);
      }
      if (t === "k") {
        // castling: rights present, squares empty, king not in/through check
        const rights = st.castle;
        const home = white ? 60 : 4; // e1 / e8
        if (from === home && !attacked(b, home, !white)) {
          const ks = white ? "K" : "k", qs = white ? "Q" : "q";
          if (rights.includes(ks) && !b[home + 1] && !b[home + 2] &&
              b[home + 3] === (white ? "R" : "r") &&
              !attacked(b, home + 1, !white) && !attacked(b, home + 2, !white))
            push(home + 2, { castle: "K" });
          if (rights.includes(qs) && !b[home - 1] && !b[home - 2] && !b[home - 3] &&
              b[home - 4] === (white ? "R" : "r") &&
              !attacked(b, home - 1, !white) && !attacked(b, home - 2, !white))
            push(home - 2, { castle: "Q" });
        }
      }
    } else {
      const dirs = t === "b" ? DIAG : t === "r" ? ORTH : DIAG.concat(ORTH);
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr <= 7 && cc >= 0 && cc <= 7) {
          const to = rr * 8 + cc;
          if (!b[to]) push(to);
          else { if (isW(b[to]) !== white) push(to); break; }
          rr += dr; cc += dc;
        }
      }
    }
    return moves;
  }

  function make(st, mv, promoPiece) {
    const b = st.b.slice();
    const p = b[mv.from], white = isW(p);
    let half = st.half + 1;
    if (p.toLowerCase() === "p" || b[mv.to]) half = 0;
    b[mv.to] = p; b[mv.from] = null;
    if (mv.ep) b[mv.to + (white ? 8 : -8)] = null;
    if (mv.promo) b[mv.to] = white ? (promoPiece || "Q") : (promoPiece || "q").toLowerCase();
    if (mv.castle === "K") { b[mv.to - 1] = b[mv.to + 1]; b[mv.to + 1] = null; }
    if (mv.castle === "Q") { b[mv.to + 1] = b[mv.to - 2]; b[mv.to - 2] = null; }
    let castle = st.castle;
    const strip = s => { castle = castle.replace(s, ""); };
    if (p === "K") { strip("K"); strip("Q"); }
    if (p === "k") { strip("k"); strip("q"); }
    for (const sq of [mv.from, mv.to]) {
      if (sq === 63) strip("K"); if (sq === 56) strip("Q");
      if (sq === 7) strip("k"); if (sq === 0) strip("q");
    }
    const ep = mv.dbl ? (mv.from + mv.to) / 2 : -1;
    return {
      b, turn: white ? "b" : "w", castle, ep, half,
      full: st.full + (white ? 0 : 1)
    };
  }

  function legalFrom(st, from) {
    const p = st.b[from];
    if (!p || (isW(p) !== (st.turn === "w"))) return [];
    return pseudo(st, from).filter(mv => {
      const nx = make(st, mv);
      return !inCheck(nx, st.turn === "w");
    });
  }
  function allLegal(st) {
    const out = [];
    for (let i = 0; i < 64; i++) {
      const p = st.b[i];
      if (p && isW(p) === (st.turn === "w")) out.push(...legalFrom(st, i));
    }
    return out;
  }
  function insufficient(b) {
    const pieces = [];
    for (let i = 0; i < 64; i++) if (b[i]) pieces.push(b[i].toLowerCase());
    const nonK = pieces.filter(x => x !== "k");
    if (nonK.length === 0) return true;
    if (nonK.length === 1 && (nonK[0] === "b" || nonK[0] === "n")) return true;
    return false;
  }
  function status(st) {
    const moves = allLegal(st);
    const chk = inCheck(st, st.turn === "w");
    if (!moves.length) return chk ? "checkmate" : "stalemate";
    if (insufficient(st.b)) return "insufficient";
    if (st.half >= 100) return "fifty";
    return chk ? "check" : "ok";
  }
  return { parse, legalFrom, allLegal, make, status, inCheck, sqIdx: sqIdxE, sqName: sqNameE, attacked, kingSq };
})();
if (typeof module !== "undefined") module.exports = Engine;
