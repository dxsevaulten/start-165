#!/usr/bin/env python3
# Bina 165START.exe (Windows portable) dengan game TERTANAM.
# Keperluan: zig (https://ziglang.org) untuk kompil silang Windows.
#   Jalankan: python3 build-exe.py
# Hasil: 165START.exe di root repo + zip rilis/165START-win64-v*.zip
import os, subprocess, sys, zipfile

root = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(root, "index.html"), "rb").read()
js = open(os.path.join(root, "three.min.js"), "rb").read()

def array(nama, data):
    baris = ["const unsigned char %s[] = {" % nama]
    for i in range(0, len(data), 32):
        baris.append("  " + ",".join("0x%02x" % b for b in data[i:i+32]) + ",")
    baris.append("};")
    baris.append("const unsigned int %s_LEN = %d;" % (nama, len(data)))
    return "\n".join(baris)

payload_c = "/* dijana automatik oleh build-exe.py — jangan edit */\n" \
    + array("PAYLOAD_HTML", html) + "\n" + array("PAYLOAD_JS", js) + "\n"
open(os.path.join(root, "src-exe", "payload.c"), "w").write(payload_c)
print("payload.c: %d bytes (html=%d, js=%d)" % (len(payload_c), len(html), len(js)))

zig = os.environ.get("ZIG", "zig")
cmd = [zig, "cc", "-target", "x86_64-windows-gnu", "-O2", "-s",
       os.path.join(root, "src-exe", "launcher.c"),
       os.path.join(root, "src-exe", "payload.c"),
       "-o", os.path.join(root, "165START.exe"),
       "-lshell32", "-luser32", "-lkernel32"]
print("kompil:", " ".join(cmd))
subprocess.check_call(cmd)
saiz = os.path.getsize(os.path.join(root, "165START.exe"))
print("OK -> 165START.exe (%d bytes)" % saiz)

# zip rilis
rilis = os.path.join(root, "rilis")
os.makedirs(rilis, exist_ok=True)
zipPath = os.path.join(rilis, "165START-win64-v0.7.zip")
with zipfile.ZipFile(zipPath, "w", zipfile.ZIP_DEFLATED) as z:
    for f in ["165START.exe", "index.html", "three.min.js", "BACA-DULU.txt"]:
        z.write(os.path.join(root, f), f)
print("OK -> %s (%d bytes)" % (zipPath, os.path.getsize(zipPath)))
