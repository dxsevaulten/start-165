#!/usr/bin/env python3
# 165 START — pembina fail tunggal: src/*.js + src/head.html -> index.html
# Jalankan: python3 build.py   (hasil: index.html di root repo)
import glob, os, sys

root = os.path.dirname(os.path.abspath(__file__))
head = open(os.path.join(root, "src", "head.html"), encoding="utf-8").read()
js_files = sorted(glob.glob(os.path.join(root, "src", "*.js")))

parts = [head, '<script src="three.min.js"></script>\n']
for f in js_files:
    code = open(f, encoding="utf-8").read()
    parts.append("\n<script>\n/* ==== %s ==== */\n%s\n</script>\n" % (os.path.basename(f), code))
parts.append("</body>\n</html>\n")

out = os.path.join(root, "index.html")
open(out, "w", encoding="utf-8").write("".join(parts))
print("OK ->", out, "(%d bytes, %d modul JS)" % (os.path.getsize(out), len(js_files)))
