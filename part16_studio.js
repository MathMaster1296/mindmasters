/* ================= CHARACTER STUDIO =================
   Full-body chibi characters drawn as layered SVG, with a drag-to-rotate
   3D viewer (real front and back views), per-character skins, and
   accessory slots. Loads AFTER part4 and overrides showStudio. */

/* ---- skins: palette overrides applied to any character ---- */
const CHAR_SKINS = [
  { id: "classic", name: "Classic", p: 0 },
  { id: "midnight", name: "Midnight", p: 400, pal: { head: "#454e78", body: "#454e78", belly: "#5d6799", accent: "#8e97c9" } },
  { id: "bubblegum", name: "Bubblegum", p: 500, pal: { head: "#e08bb0", body: "#e08bb0", belly: "#f7d4e4", accent: "#c4608f" } },
  { id: "toxic", name: "Toxic", p: 600, pal: { head: "#67b062", body: "#67b062", belly: "#b8e6a8", accent: "#3d7a39" } },
  { id: "golden", name: "Golden", p: 700, pal: { head: "#d9a441", body: "#d9a441", belly: "#f5e0a8", accent: "#a87a24" } },
  { id: "galaxy", name: "Galaxy", p: 1000, pal: { head: "#4a3f78", body: "#4a3f78", belly: "#7b6fb8", accent: "#b3a8e8" }, stars: 1 }
];

/* ---- characters ---- */
const CHAR_DEFS = [
  { id: "cat", name: "Nova the Cat", p: 800, tier: "Starter",
    pal: { head: "#8f8f9d", body: "#8f8f9d", belly: "#d8d8e2", accent: "#5c5c6b" }, ears: "cat", tail: "cat", whiskers: 1 },
  { id: "penguin", name: "Pip the Penguin", p: 800, tier: "Starter",
    pal: { head: "#3a4152", body: "#3a4152", belly: "#eef0f4", accent: "#e6a23c" }, beak: 1, wings: "flipper" },
  { id: "panda", name: "Bam the Panda", p: 1000, tier: "Starter",
    pal: { head: "#f0efe9", body: "#f0efe9", belly: "#ffffff", accent: "#2b2b31" }, ears: "round", patches: 1 },
  { id: "lion", name: "Rex the Lion", p: 1200, tier: "Starter",
    pal: { head: "#e0b25c", body: "#e0b25c", belly: "#f5dfae", accent: "#a4682a" }, mane: 1, ears: "round", tail: "tuft" },
  { id: "robot", name: "Volt the Robot", p: 1500, tier: "Hero",
    pal: { head: "#9aa7b8", body: "#8794a6", belly: "#c6d0dd", accent: "#d9a441" }, robot: 1 },
  { id: "ninja", name: "Shadow the Ninja", p: 1600, tier: "Hero",
    pal: { head: "#454654", body: "#33333f", belly: "#5a5b6e", accent: "#c96f6f" }, ninja: 1 },
  { id: "wizard", name: "Sage the Wizard", p: 1800, tier: "Hero",
    pal: { head: "#e8cdb1", body: "#5d5a96", belly: "#7b78b5", accent: "#d9a441" }, beard: 1, robe: 1 },
  { id: "axolotl", name: "Lotl the Axolotl", p: 2000, tier: "Hero",
    pal: { head: "#efa8b8", body: "#efa8b8", belly: "#fad7df", accent: "#d4738c" }, gills: 1, tail: "fin" },
  { id: "dragon", name: "Ember the Dragon", p: 2200, tier: "Hero",
    pal: { head: "#5da88a", body: "#5da88a", belly: "#c2e8d2", accent: "#c96f6f" }, horns: 1, wings: "dragon", tail: "spike" },
  { id: "capy", name: "Sigma Capybara", p: 2500, tier: "Meme",
    pal: { head: "#b08a5e", body: "#b08a5e", belly: "#d9c1a0", accent: "#6e5330" }, capy: 1, ears: "small", builtin: "shades" },
  { id: "raccoon", name: "Lil Bro Raccoon", p: 2800, tier: "Meme",
    pal: { head: "#7d838f", body: "#7d838f", belly: "#c5cad3", accent: "#2f333c" }, ears: "cat", mask: 1, tail: "ring" },
  { id: "corn", name: "Ohio Corn", p: 3000, tier: "Meme",
    pal: { head: "#e8c94f", body: "#e8c94f", belly: "#f5e59a", accent: "#6da84e" }, corn: 1, wideEyes: 1 },
  { id: "shark", name: "Aura Shark", p: 3500, tier: "Meme",
    pal: { head: "#7d9bc4", body: "#7d9bc4", belly: "#e6edf5", accent: "#4a6a94" }, fin: 1, tail: "shark", builtin: "aura" },
  { id: "goat", name: "Goated Goat", p: 4200, tier: "Meme",
    pal: { head: "#e9e4d7", body: "#e9e4d7", belly: "#f7f4ec", accent: "#d9a441" }, goat: 1, ears: "droop", builtin: "crownlet" }
];

/* ---- accessories: one drawing works on every character (shared skeleton) ---- */
const ACC_DEFS = [
  { id: "cap", slot: "head", name: "Backwards Cap", p: 300 },
  { id: "wizhat", slot: "head", name: "Wizard Hat", p: 500 },
  { id: "halo", slot: "head", name: "Halo", p: 800 },
  { id: "crown", slot: "head", name: "Royal Crown", p: 1200 },
  { id: "phones", slot: "head", name: "Headphones", p: 450 },
  { id: "shades", slot: "face", name: "Sunglasses", p: 350 },
  { id: "starglass", slot: "face", name: "Star Shades", p: 600 },
  { id: "monocle", slot: "face", name: "Monocle", p: 400 },
  { id: "bow", slot: "neck", name: "Bow Tie", p: 200 },
  { id: "scarf", slot: "neck", name: "Scarf", p: 250 },
  { id: "chain", slot: "neck", name: "Gold Chain", p: 700 },
  { id: "boba", slot: "held", name: "Boba Tea", p: 400 },
  { id: "knight", slot: "held", name: "Chess Knight", p: 500 },
  { id: "sword", slot: "held", name: "Hero Sword", p: 800 },
  { id: "trophy", slot: "held", name: "Gold Trophy", p: 900 },
  { id: "sparkle", slot: "aura", name: "Sparkle Aura", p: 1000 },
  { id: "fire", slot: "aura", name: "Fire Aura", p: 1500 },
  { id: "galaxyaura", slot: "aura", name: "Galaxy Aura", p: 2000 },
  { id: "seasonaura", slot: "aura", name: "Champion Aura", p: 0, hidden: true }   // earned with 1500 season XP, never sold
];
const ACC_SLOTS = ["head", "face", "neck", "held", "aura"];

/* ---- character renderer ---- */
function charPal(def, skinId) {
  const sk = CHAR_SKINS.find(x => x.id === skinId);
  if (!sk || !sk.pal) return def.pal;
  const p = Object.assign({}, def.pal, sk.pal);
  if (def.id === "wizard") p.head = def.pal.head;   // keep faces natural where it matters
  return p;
}
function accSvg(id, back) {
  if (back) {
    // simplified back sides for headwear so rotation feels honest
    if (id === "cap") return '<path d="M62 34a38 22 0 0 1 76 0v10H62z" fill="#c96f6f"/><rect x="88" y="18" width="24" height="12" rx="6" fill="#a85454"/>';
    if (id === "wizhat") return '<path d="M100 -14 138 46H62Z" fill="#5d5a96"/><ellipse cx="100" cy="46" rx="52" ry="10" fill="#4c4980"/>';
    if (id === "halo") return '<ellipse cx="100" cy="4" rx="34" ry="8" fill="none" stroke="#f5e0a8" stroke-width="5" opacity=".9"/>';
    if (id === "crown") return '<path d="M68 30h64v14H68z" fill="#d9a441"/>';
    if (id === "phones") return '<path d="M56 52a44 44 0 0 1 88 0" fill="none" stroke="#33333f" stroke-width="9"/>';
    if (id === "scarf") return '<rect x="66" y="98" width="68" height="14" rx="7" fill="#c96f6f"/>';
    return "";
  }
  switch (id) {
    case "cap": return '<path d="M62 36a38 24 0 0 1 76 0v8H62z" fill="#c96f6f"/><path d="M130 38h34a8 8 0 0 1 0 16h-30z" fill="#a85454"/>';
    case "wizhat": return '<path d="M100 -16 140 44H60Z" fill="#5d5a96"/><ellipse cx="100" cy="44" rx="54" ry="11" fill="#6c69a8"/><circle cx="104" cy="8" r="4" fill="#f5e0a8"/>';
    case "halo": return '<ellipse cx="100" cy="2" rx="34" ry="9" fill="none" stroke="#f5e0a8" stroke-width="5" opacity=".95"/>';
    case "crown": return '<path d="M68 42 76 20l14 12 10-18 10 18 14-12 8 22z" fill="#d9a441"/><rect x="68" y="40" width="64" height="10" rx="3" fill="#c08c2c"/><circle cx="100" cy="26" r="4" fill="#c96f6f"/>';
    case "phones": return '<path d="M54 50a46 46 0 0 1 92 0" fill="none" stroke="#33333f" stroke-width="9"/><rect x="46" y="46" width="16" height="26" rx="7" fill="#33333f"/><rect x="138" y="46" width="16" height="26" rx="7" fill="#33333f"/>';
    case "shades": return '<rect x="66" y="50" width="30" height="17" rx="6" fill="#22232b"/><rect x="104" y="50" width="30" height="17" rx="6" fill="#22232b"/><path d="M96 56h8M64 54l-8-5M136 54l8-5" stroke="#22232b" stroke-width="4"/>';
    case "starglass": return '<path d="M81 49 85 58l9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#d9a441"/><path d="M119 49l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#d9a441"/><path d="M96 58h8" stroke="#d9a441" stroke-width="3"/>';
    case "monocle": return '<circle cx="118" cy="58" r="13" fill="none" stroke="#d9a441" stroke-width="3.5"/><path d="M118 71v20" stroke="#d9a441" stroke-width="2.5"/>';
    case "bow": return '<path d="M100 106 82 96v20zM100 106l18-10v20z" fill="#c96f6f"/><circle cx="100" cy="106" r="5" fill="#a85454"/>';
    case "scarf": return '<rect x="66" y="98" width="68" height="15" rx="7" fill="#c96f6f"/><rect x="106" y="108" width="15" height="30" rx="7" fill="#b56060"/>';
    case "chain": return '<path d="M70 102q30 26 60 0" fill="none" stroke="#d9a441" stroke-width="6" stroke-dasharray="7 4"/><circle cx="100" cy="122" r="8" fill="#d9a441"/><text x="100" y="127" text-anchor="middle" font-size="11" font-weight="bold" fill="#5c4210">M</text>';
    case "boba": return '<rect x="152" y="136" width="22" height="30" rx="6" fill="#e8cdb1" opacity=".92"/><circle cx="158" cy="158" r="2.6" fill="#4a3324"/><circle cx="166" cy="156" r="2.6" fill="#4a3324"/><circle cx="162" cy="161" r="2.6" fill="#4a3324"/><path d="M160 138 166 118" stroke="#c96f6f" stroke-width="4"/>';
    case "knight": return '<path d="M155 165v-6l4-1c-3-8-1-16 6-20 6-3 12-2 14 1l-4 6 6 2c2 6 1 12-3 18z" fill="#e9e4d7" stroke="#8b93a3" stroke-width="2"/><rect x="152" y="164" width="32" height="7" rx="3" fill="#8b93a3"/>';
    case "sword": return '<rect x="160" y="96" width="7" height="52" rx="3" fill="#c6d0dd"/><path d="M163.5 88 170 100h-13z" fill="#c6d0dd"/><rect x="152" y="146" width="23" height="7" rx="3" fill="#d9a441"/><rect x="160" y="152" width="7" height="14" rx="3" fill="#8a6a2e"/>';
    case "trophy": return '<path d="M152 128h28v10a14 14 0 0 1-28 0z" fill="#d9a441"/><rect x="162" y="148" width="8" height="10" fill="#c08c2c"/><rect x="156" y="158" width="20" height="6" rx="2" fill="#a87a24"/>';
    case "sparkle": return '<g opacity=".9"><path d="M40 60l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#f5e0a8"/><path d="M162 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f5e0a8"/><path d="M170 190l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f5e0a8"/><path d="M34 180l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f5e0a8"/></g>';
    case "fire": return '<g opacity=".85"><path d="M30 210q-12-24 6-40-2 16 10 22-4-26 16-38-6 22 6 30 2-30 22-38-8 18 2 26" fill="none" stroke="#c98a5e" stroke-width="7" stroke-linecap="round"/><path d="M170 210q12-24-6-40 2 16-10 22 4-26-16-38 6 22-6 30" fill="none" stroke="#d9a441" stroke-width="6" stroke-linecap="round"/></g>';
    case "seasonaura": return '<g opacity=".95"><ellipse cx="100" cy="140" rx="90" ry="108" fill="none" stroke="#d9a441" stroke-width="4" stroke-dasharray="14 8"/><path d="M100 -12l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#d9a441"/><path d="M17 118l3 7 8 2-6 5 2 8-7-4-7 4 2-8-6-5 8-2z" fill="#f5e0a8"/><path d="M183 118l3 7 8 2-6 5 2 8-7-4-7 4 2-8-6-5 8-2z" fill="#f5e0a8"/><path d="M60 236l3 7 8 2-6 5 2 8-7-4-7 4 2-8-6-5 8-2z" fill="#d9a441" opacity=".8"/><path d="M140 236l3 7 8 2-6 5 2 8-7-4-7 4 2-8-6-5 8-2z" fill="#d9a441" opacity=".8"/></g>';
    case "galaxyaura": return '<g opacity=".9"><ellipse cx="100" cy="140" rx="92" ry="110" fill="none" stroke="#9b8fd4" stroke-width="3" stroke-dasharray="2 9"/><circle cx="26" cy="90" r="3.5" fill="#b3a8e8"/><circle cx="176" cy="80" r="2.8" fill="#b3a8e8"/><circle cx="180" cy="180" r="3.2" fill="#8e97c9"/><circle cx="22" cy="196" r="2.6" fill="#8e97c9"/><circle cx="60" cy="26" r="2.4" fill="#b3a8e8"/><circle cx="146" cy="20" r="3" fill="#9b8fd4"/></g>';
  }
  return "";
}
function charSvg(state, size, opts) {
  opts = opts || {};
  const def = CHAR_DEFS.find(c => c.id === state.id) || CHAR_DEFS[0];
  const pal = charPal(def, state.skin || "classic");
  const acc = state.acc || {};
  const back = !!opts.back;
  const P = [];
  const dk = "#2a2530";
  // aura accessories render behind everything
  if (acc.aura) P.push(accSvg(acc.aura, back));
  if (def.builtin === "aura" && !acc.aura) P.push('<ellipse cx="100" cy="140" rx="88" ry="106" fill="none" stroke="#7d9bc4" stroke-width="3" opacity=".55" stroke-dasharray="3 8"/>');
  // ---- tails / wings behind body ----
  if (def.tail === "cat") P.push('<path d="' + (back ? 'M100 195q34 6 30 -44q14 30 -4 52z' : 'M138 200q26-6 20-40q16 32-8 50z') + '" fill="' + pal.accent + '"/>');
  if (def.tail === "tuft") P.push('<path d="M140 200q24-4 20-34q14 28-8 46z" fill="' + pal.body + '"/><circle cx="158" cy="168" r="8" fill="' + pal.accent + '"/>');
  if (def.tail === "ring") P.push('<path d="M138 198q30-2 24-42q16 34-8 54z" fill="' + pal.body + '"/><path d="M150 176q10-2 10-12M146 192q14-2 14-14" stroke="' + pal.accent + '" stroke-width="7" fill="none"/>');
  if (def.tail === "spike") P.push('<path d="M136 202q30 0 26-38q14 32-8 50z" fill="' + pal.body + '"/><path d="M154 168l8-8 2 12zM148 186l9-6-1 12z" fill="' + pal.accent + '"/>');
  if (def.tail === "shark" && back) P.push('<path d="M100 196l-18 34 18-8 18 8z" fill="' + pal.body + '"/>');
  if (def.tail === "fin") P.push('<path d="M136 196q26 4 22 -30q12 30 -6 46z" fill="' + pal.belly + '"/>');
  if (def.wings === "dragon") P.push(back
    ? '<path d="M62 120 20 84q30 4 38 26zM138 120l42-36q-30 4-38 26z" fill="' + pal.accent + '" opacity=".9"/>'
    : '<path d="M60 122 30 96q22 2 28 18zM140 122l30-26q-22 2-28 18z" fill="' + pal.accent + '" opacity=".85"/>');
  if (def.fin) P.push('<path d="' + (back ? 'M100 -16 82 20h36z' : 'M100 -16 84 18h32z') + '" fill="' + pal.accent + '"/>');
  // ---- legs ----
  P.push('<rect x="76" y="200" width="20" height="46" rx="10" fill="' + pal.body + '"/><rect x="104" y="200" width="20" height="46" rx="10" fill="' + pal.body + '"/>');
  P.push('<ellipse cx="86" cy="248" rx="14" ry="8" fill="' + pal.accent + '"/><ellipse cx="114" cy="248" rx="14" ry="8" fill="' + pal.accent + '"/>');
  // ---- body ----
  const bodyFill = def.robe ? pal.body : pal.body;
  P.push('<path d="M64 122q-6 88 8 92q28 8 56 0q14-4 8-92q-20-14-72 0z" fill="' + bodyFill + '"/>');
  if (def.robe && !back) P.push('<path d="M100 118v92" stroke="' + pal.accent + '" stroke-width="4" opacity=".7"/><circle cx="100" cy="140" r="3.4" fill="' + pal.accent + '"/><circle cx="100" cy="158" r="3.4" fill="' + pal.accent + '"/>');
  if (!back && !def.robe) P.push('<ellipse cx="100" cy="168" rx="27" ry="33" fill="' + pal.belly + '"/>');
  if (back && def.corn) P.push('<path d="M72 130q28 14 56 0M72 152q28 14 56 0M72 174q28 14 56 0" stroke="' + pal.belly + '" stroke-width="5" fill="none" opacity=".8"/>');
  if (def.corn) P.push('<path d="M66 128q-24 40 6 82q-34-16-30-62q6-16 24-20zM134 128q24 40-6 82q34-16 30-62q-6-16-24-20z" fill="' + pal.accent + '"/>' +
    '<path d="M100 -14q10 10 2 24h-8q-6-14 6-24z" fill="' + pal.accent + '"/>');
  if (!back && def.corn) P.push('<g fill="' + pal.belly + '" opacity=".9"><circle cx="86" cy="136" r="5"/><circle cx="100" cy="132" r="5"/><circle cx="114" cy="136" r="5"/><circle cx="86" cy="152" r="5"/><circle cx="100" cy="148" r="5"/><circle cx="114" cy="152" r="5"/><circle cx="86" cy="168" r="5"/><circle cx="100" cy="164" r="5"/><circle cx="114" cy="168" r="5"/><circle cx="93" cy="182" r="5"/><circle cx="107" cy="182" r="5"/></g>');
  if (def.robot) {
    P.push('<rect x="82" y="140" width="36" height="26" rx="5" fill="' + pal.belly + '"/>');
    if (!back) P.push('<circle cx="92" cy="153" r="4" fill="' + pal.accent + '"/><rect x="102" y="147" width="10" height="4" rx="2" fill="' + pal.accent + '"/><rect x="102" y="155" width="10" height="4" rx="2" fill="' + pal.accent + '"/>');
  }
  // ---- arms ----
  const armY = 126;
  P.push('<rect x="46" y="' + armY + '" width="18" height="44" rx="9" fill="' + pal.body + '" transform="rotate(14 55 ' + armY + ')"/>');
  P.push('<rect x="136" y="' + armY + '" width="18" height="44" rx="9" fill="' + pal.body + '" transform="rotate(-14 145 ' + armY + ')"/>');
  P.push('<circle cx="47" cy="172" r="10" fill="' + (def.robot ? pal.accent : pal.body) + '"/><circle cx="153" cy="172" r="10" fill="' + (def.robot ? pal.accent : pal.body) + '"/>');
  if (def.wings === "flipper") P.push('<path d="M50 124q-18 24 0 46z" fill="' + pal.accent + '" opacity=".55"/><path d="M150 124q18 24 0 46z" fill="' + pal.accent + '" opacity=".55"/>');
  // ---- ears / horns / gills behind head ----
  if (def.ears === "cat") P.push('<path d="M60 34 54 4l26 14zM140 34l6-30-26 14z" fill="' + pal.body + '"/>' + (back ? '' : '<path d="M62 28 60 12l14 8zM138 28l2-16-14 8z" fill="' + pal.accent + '"/>'));
  if (def.ears === "round") P.push('<circle cx="60" cy="22" r="16" fill="' + (def.patches ? def.pal.accent : pal.body) + '"/><circle cx="140" cy="22" r="16" fill="' + (def.patches ? def.pal.accent : pal.body) + '"/>');
  if (def.ears === "small") P.push('<circle cx="66" cy="20" r="10" fill="' + pal.accent + '"/><circle cx="134" cy="20" r="10" fill="' + pal.accent + '"/>');
  if (def.ears === "droop") P.push('<path d="M56 30q-22 8-18 34q14 2 24-16z" fill="' + pal.accent + '"/><path d="M144 30q22 8 18 34q-14 2-24-16z" fill="' + pal.accent + '"/>');
  if (def.mane) P.push('<circle cx="100" cy="60" r="62" fill="' + pal.accent + '"/>');
  if (def.horns) P.push('<path d="M62 28Q52 8 62 -4q10 10 10 26zM138 28q10-20 0-32-10 10-10 26z" fill="' + pal.belly + '"/>');
  if (def.goat) P.push('<path d="M66 22Q52 14 52 -2q16 2 22 16zM134 22q14-8 14-24-16 2-22 16z" fill="#c9b98a"/>');
  if (def.gills) P.push('<g fill="' + pal.accent + '"><path d="M46 44q-16-2-22 8 10 8 24 2zM44 62q-16 0-20 12 12 6 24-2zM154 44q16-2 22 8-10 8-24 2zM156 62q16 0 20 12-12 6-24-2z"/></g>');
  // ---- head ----
  P.push('<circle cx="100" cy="62" r="50" fill="' + pal.head + '"/>');
  if (def.patches && !back) P.push('<ellipse cx="80" cy="56" rx="14" ry="17" fill="' + def.pal.accent + '"/><ellipse cx="120" cy="56" rx="14" ry="17" fill="' + def.pal.accent + '"/>');
  if (def.mask && !back) P.push('<path d="M52 52q48-18 96 0l-6 18q-42-14-84 0z" fill="' + pal.accent + '"/>');
  if (def.ninja) {
    if (back) P.push('<circle cx="100" cy="62" r="50" fill="' + pal.body + '"/><path d="M96 100l-26 26 10 8 22-24zM104 100l26 26-10 8-22-24z" fill="' + pal.accent + '"/>');
    else P.push('<circle cx="100" cy="62" r="50" fill="' + pal.body + '"/><path d="M52 46q48-14 96 0v24q-48 14-96 0z" fill="' + pal.belly + '"/>');
  }
  if (def.robot) {
    P.push('<rect x="97" y="-2" width="6" height="16" fill="' + pal.accent + '"/><circle cx="100" cy="-6" r="6" fill="' + pal.accent + '"/>');
    if (!back) P.push('<rect x="66" y="44" width="68" height="26" rx="13" fill="' + pal.belly + '"/>');
  }
  if (back) {
    if (def.robe && !acc.head) P.push(accSvg("wizhat", true));
    if (def.builtin === "crownlet" && !acc.head) P.push('<path d="M82 26h36v10H82z" fill="#d9a441"/>');
    return wrap(P, size, opts);
  }
  // ---- face ----
  if (def.robot) {
    P.push('<rect x="76" y="50" width="12" height="14" rx="3" fill="' + dk + '"/><rect x="112" y="50" width="12" height="14" rx="3" fill="' + dk + '"/><path d="M84 80q16 10 32 0" stroke="' + dk + '" stroke-width="4" fill="none" stroke-linecap="round"/>');
  } else if (def.wideEyes) {
    P.push('<circle cx="82" cy="56" r="12" fill="#fff"/><circle cx="118" cy="56" r="12" fill="#fff"/><circle cx="84" cy="58" r="6" fill="' + dk + '"/><circle cx="116" cy="58" r="6" fill="' + dk + '"/><path d="M82 84q18 14 36 0" stroke="' + dk + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>');
  } else {
    P.push('<circle cx="83" cy="56" r="6" fill="' + dk + '"/><circle cx="117" cy="56" r="6" fill="' + dk + '"/><circle cx="85" cy="54" r="2" fill="#fff"/><circle cx="119" cy="54" r="2" fill="#fff"/>');
    if (def.beak) P.push('<path d="M92 66l8 12 8-12q-8-6-16 0z" fill="' + pal.accent + '"/>');
    else if (def.capy) P.push('<ellipse cx="100" cy="76" rx="18" ry="12" fill="' + pal.belly + '"/><ellipse cx="94" cy="74" rx="2.5" ry="3.5" fill="' + dk + '"/><ellipse cx="106" cy="74" rx="2.5" ry="3.5" fill="' + dk + '"/><path d="M92 84q8 5 16 0" stroke="' + dk + '" stroke-width="3" fill="none" stroke-linecap="round"/>');
    else P.push('<path d="M90 74q10 8 20 0" stroke="' + dk + '" stroke-width="4" fill="none" stroke-linecap="round"/>');
    if (def.whiskers) P.push('<path d="M56 64h16M56 72l16-3M144 64h-16M144 72l-16-3" stroke="' + pal.accent + '" stroke-width="2.5"/>');
    if (def.beard) P.push('<path d="M74 70q26 44 52 0l-4 34q-22 16-44 0z" fill="#e6e6ea"/>');
    P.push('<circle cx="72" cy="70" r="6" fill="#fff" opacity=".25"/><circle cx="128" cy="70" r="6" fill="#fff" opacity=".25"/>');
  }
  // built-in signature items
  if (def.builtin === "shades" && !acc.face) P.push(accSvg("shades"));
  if (def.robe && !acc.head) P.push(accSvg("wizhat"));
  if (def.builtin === "crownlet" && !acc.head) P.push('<path d="M82 12l6 12 12-8 12 8 6-12 4 18H78z" fill="#d9a441"/>');
  // ---- equipped accessories ----
  if (acc.neck) P.push(accSvg(acc.neck));
  if (acc.face) P.push(accSvg(acc.face));
  if (acc.head) P.push(accSvg(acc.head));
  if (acc.held) P.push(accSvg(acc.held));
  // galaxy skin stars
  const sk = CHAR_SKINS.find(x => x.id === (state.skin || "classic"));
  if (sk && sk.stars) P.push('<g fill="#e8e4f8" opacity=".8"><circle cx="84" cy="140" r="2"/><circle cx="116" cy="152" r="1.6"/><circle cx="94" cy="176" r="1.8"/><circle cx="110" cy="128" r="1.5"/></g>');
  return wrap(P, size, opts);
  function wrap(parts, sz, o) {
    return '<svg viewBox="-10 -20 220 290" width="' + (sz || 200) + '" height="' + Math.round((sz || 200) * 1.32) + '" xmlns="http://www.w3.org/2000/svg">' + parts.join("") + '</svg>';
  }
}
function charMini(size) {
  return charSvg(S.char, size, {});
}

/* ---- ownership helpers ---- */
function charOwnedRec(id) {
  if (!S.charOwned) S.charOwned = {};
  return S.charOwned[id];
}
function ownChar(id) { if (!S.charOwned) S.charOwned = {}; if (!S.charOwned[id]) S.charOwned[id] = { skins: ["classic"] }; }
function accIsOwned(id) { return (S.accOwned || []).indexOf(id) >= 0; }

/* ================= STUDIO ================= */
let STU = { tab: "chars", sel: null, angle: 0, vel: 0, dragging: false, raf: 0, last: 0 };
function showStudio() {
  renderTopbar(); setNav("profile");
  if (!S.charOwned) S.charOwned = {};
  if (!S.accOwned) S.accOwned = [];
  const sel = STU.sel || (S.char ? S.char.id : CHAR_DEFS[0].id);
  STU.sel = sel;
  const def = CHAR_DEFS.find(c => c.id === sel);
  const rec = charOwnedRec(sel);
  const isEquipped = S.char && S.char.id === sel;
  const preview = {
    id: sel,
    skin: isEquipped ? S.char.skin : (rec ? (STU.prevSkin || "classic") : (STU.prevSkin || "classic")),
    acc: isEquipped ? (S.char.acc || {}) : (STU.prevAcc || {})
  };
  if (STU.prevSkinFor !== sel) { STU.prevSkin = isEquipped ? S.char.skin : "classic"; STU.prevAcc = isEquipped ? Object.assign({}, S.char.acc) : {}; STU.prevSkinFor = sel; preview.skin = STU.prevSkin; preview.acc = STU.prevAcc; }

  const tabBtn = (id, label) => '<button class="diffchip' + (STU.tab === id ? " sel" : "") + '" data-stab="' + id + '">' + label + '</button>';
  let panel = "";
  if (STU.tab === "chars") {
    const tiers = ["Starter", "Hero", "Meme"];
    panel = tiers.map(t =>
      '<div class="section-label">' + (t === "Meme" ? "Meme Legends" : t === "Hero" ? "Heroes" : "Starters") + '</div>' +
      '<div class="shopgrid chargrid">' + CHAR_DEFS.filter(c => c.tier === t).map(c => {
        const owned = !!charOwnedRec(c.id);
        const eq = S.char && S.char.id === c.id;
        const selc = STU.sel === c.id;
        return '<button class="shopitem' + (eq ? " equip" : "") + (selc ? " selchar" : "") + '" data-char="' + c.id + '">' +
          '<span class="charthumb">' + charSvg({ id: c.id, skin: "classic", acc: {} }, 54) + '</span>' +
          '<span style="font-size:11px;font-weight:700">' + c.name + '</span>' +
          '<span class="shoptag">' + (eq ? "In use" : owned ? "Owned" : c.p + " coins") + '</span></button>';
      }).join("") + '</div>').join("");
  } else if (STU.tab === "skins") {
    panel = '<div class="section-label">Skins for ' + esc(def.name) + '</div>' +
      '<div class="shopgrid chargrid">' + CHAR_SKINS.map(k => {
        const owned = rec && rec.skins.indexOf(k.id) >= 0;
        const inUse = preview.skin === k.id;
        return '<button class="shopitem' + (inUse ? " equip" : "") + '" data-skin="' + k.id + '">' +
          '<span class="charthumb">' + charSvg({ id: sel, skin: k.id, acc: {} }, 54) + '</span>' +
          '<span style="font-size:11px;font-weight:700">' + k.name + '</span>' +
          '<span class="shoptag">' + (inUse ? "In use" : owned || k.p === 0 ? "Owned" : k.p + " coins") + '</span></button>';
      }).join("") + '</div>' +
      (rec ? '' : '<p class="sub" style="text-align:center">Buy ' + esc(def.name) + ' first, then dress it up.</p>');
  } else if (STU.tab === "acc") {
    const deal = (typeof dailyDeal === "function") ? dailyDeal() : null;
    const dealA = deal && ACC_DEFS.find(x => x.id === deal.id);
    panel = (dealA && !accIsOwned(dealA.id)
      ? '<div class="dealbanner"><span style="font-size:17px">\ud83c\udff7\ufe0f</span><span style="flex:1"><b>Deal of the day:</b> ' + dealA.name +
        ' for <b style="color:var(--gold)">' + deal.price + '</b> <s style="color:var(--muted)">' + dealA.p + '</s> coins. A new deal arrives tomorrow.</span></div>'
      : '') + ACC_SLOTS.map(slot => {
      const items = ACC_DEFS.filter(a => a.slot === slot && (!a.hidden || accIsOwned(a.id)));
      return '<div class="section-label">' + { head: "Headwear", face: "Face", neck: "Neck", held: "Held", aura: "Auras" }[slot] + '</div>' +
        '<div class="shopgrid chargrid">' +
        '<button class="shopitem' + (!preview.acc[slot] ? " equip" : "") + '" data-acc="none" data-slot="' + slot + '">' +
        '<span class="charthumb" style="display:flex;align-items:center;justify-content:center;height:71px;color:var(--muted)">–</span>' +
        '<span style="font-size:11px;font-weight:700">None</span><span class="shoptag">' + (!preview.acc[slot] ? "In use" : "") + '</span></button>' +
        items.map(a => {
          const owned = accIsOwned(a.id);
          const inUse = preview.acc[slot] === a.id;
          const one = {}; one[slot] = a.id;
          return '<button class="shopitem' + (inUse ? " equip" : "") + '" data-acc="' + a.id + '" data-slot="' + slot + '">' +
            '<span class="charthumb">' + charSvg({ id: sel, skin: preview.skin, acc: one }, 54) + '</span>' +
            '<span style="font-size:11px;font-weight:700">' + a.name + '</span>' +
            '<span class="shoptag">' + (inUse ? "In use" : owned ? (a.hidden ? "Season prize" : "Owned") : (accPrice(a) < a.p ? "deal \u00b7 " + accPrice(a) : a.p) + " coins") + '</span></button>';
        }).join("") + '</div>';
    }).join("");
  } else {
    // classic emoji + frames (previous studio content)
    panel = '<div class="section-label">Classic Avatars</div>' +
      '<div class="shopgrid">' + SHOP_AVATARS.map(a => {
        const owned = S.owned.av.indexOf(a.e) >= 0;
        const equipped = !S.char && S.avatar === a.e;
        return '<button class="shopitem' + (equipped ? " equip" : "") + '" data-av="' + a.e + '">' +
          '<span class="shopemo">' + a.e + '</span>' +
          '<span class="shoptag">' + (equipped ? "In use" : owned ? "Owned" : a.p + " coins") + '</span></button>';
      }).join("") + '</div>' +
      '<div class="section-label">Frames</div>' +
      '<div class="shopgrid">' + SHOP_FRAMES.map(f => {
        const owned = S.owned.fr.indexOf(f.id) >= 0 || f.p === 0;
        const equipped = (S.frame || "none") === f.id;
        return '<button class="shopitem' + (equipped ? " equip" : "") + '" data-fr="' + f.id + '">' +
          '<span class="av' + (f.id !== "none" ? " fr-" + f.id : "") + '" style="width:44px;height:44px;font-size:24px;margin:0 auto">' + S.avatar + '</span>' +
          '<span class="shoptag">' + (equipped ? "In use" : owned ? "Owned" : f.p + " coins") + '</span></button>';
      }).join("") + '</div>' +
      (S.char ? '<p class="sub" style="text-align:center">Your character is in use. Equip a classic avatar to switch back.</p>' : '');
  }

  setScreen(
    '<div class="backrow"><button class="btn ghost small" id="backBtn">← Profile</button>' +
    '<div style="flex:1"><h1 class="title" style="font-size:21px">Avatar Studio</h1></div>' +
    '<div style="text-align:right"><div class="num" style="font-size:20px;font-weight:700;color:var(--gold)">' + (S.coins || 0) + '</div>' +
    '<div style="font-size:10.5px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">coins</div></div></div>' +

    '<div class="stage" id="stage">' +
      '<div class="spin3d" id="spinner">' +
        '<div class="cface front">' + charSvg(preview, 168) + '</div>' +
        '<div class="cface back">' + charSvg(preview, 168, { back: true }) + '</div>' +
      '</div>' +
      '<div class="floorshadow"></div>' +
      '<div class="stagename"><b>' + esc(def.name) + '</b><span class="sub" style="display:block;font-size:11px">' + (def.tier === "Meme" ? "Meme Legend" : def.tier) + ' · drag to spin</span></div>' +
      '<button class="btn ghost small spinbtn left" id="spinL">⟲</button>' +
      '<button class="btn ghost small spinbtn right" id="spinR">⟳</button>' +
    '</div>' +
    '<div style="text-align:center;margin:10px 0 4px">' +
      (charOwnedRec(sel)
        ? (isEquipped && JSON.stringify({ s: S.char.skin, a: S.char.acc }) === JSON.stringify({ s: preview.skin, a: preview.acc })
          ? '<span class="cloudtag on">Equipped</span>'
          : '<button class="btn gold" id="equipBtn">Equip this look</button>')
        : '<button class="btn gold" id="buyChar">Unlock ' + esc(def.name) + ' · ' + def.p + ' coins</button>') +
    '</div>' +
    '<div class="diffchips" style="margin-top:10px">' +
      tabBtn("chars", "Characters") + tabBtn("skins", "Skins") + tabBtn("acc", "Accessories") + tabBtn("classic", "Classic") +
    '</div>' +
    panel
  );

  document.getElementById("backBtn").addEventListener("click", () => { stopSpin(); showProfile(); });
  document.querySelectorAll("[data-stab]").forEach(b => b.addEventListener("click", () => { STU.tab = b.dataset.stab; Sfx.click(); stopSpin(); showStudio(); }));

  // ---- 3D spinner ----
  const sp = document.getElementById("spinner");
  const stage = document.getElementById("stage");
  let lastX = 0;
  const setAngle = () => { sp.style.transform = "rotateY(" + STU.angle + "deg)"; };
  setAngle();
  const down = e => { STU.dragging = true; STU.vel = 0; lastX = (e.touches ? e.touches[0].clientX : e.clientX); e.preventDefault(); };
  const move = e => {
    if (!STU.dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - lastX; lastX = x;
    STU.angle += dx * 0.7; STU.vel = dx * 0.7;
    setAngle();
  };
  const up = () => { STU.dragging = false; };
  stage.addEventListener("mousedown", down); stage.addEventListener("touchstart", down, { passive: false });
  window.addEventListener("mousemove", move); window.addEventListener("touchmove", move, { passive: true });
  window.addEventListener("mouseup", up); window.addEventListener("touchend", up);
  document.getElementById("spinL").addEventListener("click", () => { STU.vel = -14; });
  document.getElementById("spinR").addEventListener("click", () => { STU.vel = 14; });
  stopSpin();
  let t0 = 0;
  const loop = ts => {
    if (!document.getElementById("spinner")) { STU.raf = 0; return; }
    if (!STU.dragging) {
      if (Math.abs(STU.vel) > 0.15) { STU.angle += STU.vel; STU.vel *= 0.955; }
      else {
        // settle softly toward the nearest front-facing turn, with a gentle idle sway
        const target = Math.round(STU.angle / 360) * 360;
        STU.angle += (target - STU.angle) * 0.06;
        STU.angle += Math.sin(ts / 900) * 0.12;
      }
      setAngle();
    }
    STU.raf = requestAnimationFrame(loop);
  };
  STU.raf = requestAnimationFrame(loop);

  // ---- interactions ----
  const buyB = document.getElementById("buyChar");
  if (buyB) buyB.addEventListener("click", () => {
    if ((S.coins || 0) < def.p) { toast("!", "Not enough coins. You have " + (S.coins || 0) + " and " + def.name + " costs " + def.p + "."); return; }
    askConfirm("Unlock " + def.name + "?", def.p + " coins. Skins and accessories can be added afterward.", "Unlock", () => {
      S.coins -= def.p;
      ownChar(sel);
      S.char = { id: sel, skin: "classic", acc: {} };
      save(); Sfx.badge(); confetti(30); showStudio();
    });
  });
  const eqB = document.getElementById("equipBtn");
  if (eqB) eqB.addEventListener("click", () => {
    S.char = { id: sel, skin: preview.skin, acc: Object.assign({}, preview.acc) };
    save(); Sfx.correct(); toast("✓", def.name + " is ready to show off.");
    showStudio();
  });
  document.querySelectorAll("[data-char]").forEach(b => b.addEventListener("click", () => {
    STU.sel = b.dataset.char; STU.angle = 0; STU.vel = 0; Sfx.click(); stopSpin(); showStudio();
  }));
  document.querySelectorAll("[data-skin]").forEach(b => b.addEventListener("click", () => {
    const k = CHAR_SKINS.find(x => x.id === b.dataset.skin);
    const ownedSkin = (rec && rec.skins.indexOf(k.id) >= 0) || k.p === 0;
    if (!rec) { toast("!", "Unlock " + def.name + " first."); return; }
    if (ownedSkin) { STU.prevSkin = k.id; if (S.char && S.char.id === sel) { S.char.skin = k.id; save(); } Sfx.click(); stopSpin(); showStudio(); return; }
    if ((S.coins || 0) < k.p) { toast("!", "Not enough coins. This skin costs " + k.p + "."); return; }
    askConfirm("Buy the " + k.name + " skin?", k.p + " coins, for " + def.name + " only.", "Buy", () => {
      S.coins -= k.p; rec.skins.push(k.id);
      STU.prevSkin = k.id;
      if (S.char && S.char.id === sel) S.char.skin = k.id;
      save(); Sfx.badge(); confetti(16); stopSpin(); showStudio();
    });
  }));
  document.querySelectorAll("[data-acc]").forEach(b => b.addEventListener("click", () => {
    const slot = b.dataset.slot, id = b.dataset.acc;
    if (!rec) { toast("!", "Unlock " + def.name + " first."); return; }
    const apply = () => {
      if (id === "none") delete STU.prevAcc[slot]; else STU.prevAcc[slot] = id;
      if (S.char && S.char.id === sel) { S.char.acc = Object.assign({}, STU.prevAcc); save(); }
      Sfx.click(); stopSpin(); showStudio();
    };
    if (id === "none") { apply(); return; }
    const a = ACC_DEFS.find(x => x.id === id);
    if (accIsOwned(id)) { apply(); return; }
    if (a.hidden) { toast("\u2605", a.name + " cannot be bought. Earn 1500 season XP in a month to claim it."); return; }
    const price = accPrice(a);
    if ((S.coins || 0) < price) { toast("!", "Not enough coins. " + a.name + " costs " + price + "."); return; }
    askConfirm("Buy " + a.name + "?", price + (price < a.p ? " coins with today's deal (usually " + a.p + ")." : " coins.") + " Accessories work on every character you own.", "Buy", () => {
      S.coins -= price; S.accOwned.push(id); save(); Sfx.badge(); confetti(16); apply();
    });
  }));
  // classic tab handlers
  document.querySelectorAll("[data-av]").forEach(b => b.addEventListener("click", () => {
    const av = b.dataset.av;
    const adef = SHOP_AVATARS.find(x => x.e === av);
    const doEquip = () => { S.avatar = av; S.char = null; save(); Sfx.click(); stopSpin(); showStudio(); };
    if (S.owned.av.indexOf(av) >= 0) { doEquip(); return; }
    if ((S.coins || 0) < adef.p) { toast("!", "Not enough coins. This costs " + adef.p + "."); return; }
    askConfirm("Buy this avatar?", adef.p + " coins.", "Buy", () => { S.coins -= adef.p; S.owned.av.push(av); doEquip(); });
  }));
  document.querySelectorAll("[data-fr]").forEach(b => b.addEventListener("click", () => {
    const id = b.dataset.fr;
    const fdef = SHOP_FRAMES.find(x => x.id === id);
    const doEquip = () => { S.frame = id; save(); Sfx.click(); stopSpin(); showStudio(); };
    if (fdef.p === 0 || S.owned.fr.indexOf(id) >= 0) { doEquip(); return; }
    if ((S.coins || 0) < fdef.p) { toast("!", "Not enough coins. This costs " + fdef.p + "."); return; }
    askConfirm("Buy this frame?", fdef.name + " for " + fdef.p + " coins.", "Buy", () => { S.coins -= fdef.p; S.owned.fr.push(id); doEquip(); });
  }));
}
function stopSpin() { if (STU.raf) { cancelAnimationFrame(STU.raf); STU.raf = 0; } }
