/* Shared LaTeX segmentation + rendering. Used at build time (validation) and runtime (display). */
function texSegments(str) {
  // returns array of {math:bool, s:string, display:bool}
  const out = [];
  let i = 0, buf = "";
  const pushText = () => { if (buf) { out.push({ math: false, s: buf }); buf = ""; } };
  while (i < str.length) {
    if (str[i] === "\\" && str[i + 1] === "$") { buf += "\\$"; i += 2; continue; }
    if (str.startsWith("\\begin{", i)) {
      const em = str.slice(i).match(/^\\begin\{(align\*?|aligned|gather\*?|eqnarray\*?|alignat\*?|cases)\}/);
      if (em) {
        const endTok = "\\end{" + em[1] + "}";
        const end = str.indexOf(endTok, i);
        if (end !== -1) {
          pushText();
          let body = str.slice(i + em[0].length, end);
          if (em[1].startsWith("eqnarray")) body = body.replace(/&=&/g, "&=");
          out.push({ math: true, display: true, s: "\\begin{aligned}" + body + "\\end{aligned}" });
          i = end + endTok.length; continue;
        }
      }
    }
    if (str[i] === "\\" && str[i + 1] === "[") {
      const end = str.indexOf("\\]", i + 2);
      if (end !== -1) { pushText(); out.push({ math: true, display: true, s: str.slice(i + 2, end) }); i = end + 2; continue; }
    }
    if (str[i] === "\\" && str[i + 1] === "(") {
      const end = str.indexOf("\\)", i + 2);
      if (end !== -1) { pushText(); out.push({ math: true, display: false, s: str.slice(i + 2, end) }); i = end + 2; continue; }
    }
    if (str[i] === "$" && str[i + 1] === "$") {
      const end = str.indexOf("$$", i + 2);
      if (end !== -1) { pushText(); out.push({ math: true, display: true, s: str.slice(i + 2, end) }); i = end + 2; continue; }
    }
    if (str[i] === "$") {
      // find closing $ not preceded by backslash
      let j = i + 1;
      while (j < str.length) {
        if (str[j] === "$" && str[j - 1] !== "\\") break;
        j++;
      }
      if (j < str.length) { pushText(); out.push({ math: true, display: false, s: str.slice(i + 1, j) }); i = j + 1; continue; }
    }
    buf += str[i]; i++;
  }
  pushText();
  return out;
}

function texToHtml(str, katexObj, throwOnError) {
  const segs = texSegments(str);
  let html = "";
  for (const seg of segs) {
    if (seg.math) {
      // the text was HTML-escaped at build time; undo entities inside math before KaTeX
      const raw = seg.s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      html += katexObj.renderToString(raw, {
        throwOnError: !!throwOnError, displayMode: !!seg.display,
        strict: "ignore", output: "html"
      });
    } else {
      html += seg.s.replace(/\\\$/g, "$").replace(/\\%/g, "%").replace(/\n/g, "<br>");
    }
  }
  return html;
}
if (typeof module !== "undefined") module.exports = { texSegments, texToHtml };
