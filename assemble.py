#!/usr/bin/env python3
"""Canonical single-file build for MindMasters Academy.
Run from the repo root: python3 assemble.py
Produces MindMasters_Academy.html and index.html (identical)."""
import os

PARTS = [
    "katex.min.js", "texshared.js", "part5_engine.js", "part2_mathdata.js",
    "part3_chessdata.js", "part6_gendata.js", "part7_vault.js", "part8_mined.js",
    "part10_textbank.js", "part13_lichess.js", "part14_aops.js", "part15_teacher.js",
    "part16_studio.js", "part17_retention.js", "part18_teacherpro.js",
    "part19_auth.js", "part4_app.js",
]

head = open("part1_head.html").read()
katexcss = open("katex_inline.css").read()
fontcss = open("fonts_inline.css").read()
head = head.replace("</style>\n</head>",
    "</style>\n<style>" + fontcss + "</style>\n<style>" + katexcss + "</style>\n</head>", 1)
head = head.replace("</head>",
    "<style>.katex{font-size:1.06em}.katex-display{margin:10px 0;overflow-x:auto;overflow-y:hidden}"
    ".qtext .katex-display{padding:4px 0}</style>\n</head>", 1)

parts = [head]
for f in PARTS:
    parts.append(open(f).read() + "\n;\n")
parts.append("</script>\n</body>\n</html>\n")
out = "".join(parts)

# part1_head.html already ends with an open <script>; adding another breaks the app
assert out.count("<script>") == 1 and out.count("</script>") == 1, "script tag balance broken"

open("MindMasters_Academy.html", "w").write(out)
open("index.html", "w").write(out)
print("built MindMasters_Academy.html + index.html:", round(os.path.getsize("index.html") / 1e6, 2), "MB")
