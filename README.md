# 165 START 🎲 — Dunia Matematika Tanpa Batas

**Sandbox matematika 3D — dari 1D sampai 5D, dari dunia dreamcore sampai fraktal tanpa hujung.**
Semua yang kau nampak lahir dari persamaan — dan setiap persamaan boleh kau sentuh.

> *"Dalam kehidupan nyata, apapun adalah bentuk matematika."*

![preview](preview.png)

---

## 🎮 Cara main (paling gampang)

| Cara | Langkah |
|---|---|
| **Windows** | Klik dua kali `165START.exe` → main. (Portable — tanpa install, tanpa internet.) |
| **Semua OS** | Klik dua kali `index.html` → terbuka di Chrome/Edge/Firefox. |

Itu sahaja. Fail game hanya **satu fail tunggal** (`index.html`, ± 180 KB) + enjin 3D (`three.min.js`, ± 590 KB). Muat turun, ekstrak, main. Sesuai untuk semua umur — ada teks penuh di setiap bahagian.

## 🌏 Apa yang ada dalam game

1. **Dunia dreamcore tanpa batas** — rumput hijau, bukit, rumah, pokok, bunga, kolam, awan. Dijana prosedur selama-lamanya di sekeliling kau. Tekan *Dunia baru (rawak seed)* = dunia lain sepenuhnya. Jauh dari pusat, dunia mula **terdistorsi** (zona tepi) → terus jadi **zon kosmik** (langit retro-gelap, bintang, formula melayang). Tiada dinding — terus terbang, tiada ujung.
2. **Fraktal zoom tanpa hujung** — enjin dalaman: orbit rujukan **double-double (±31 digit) + perturbation theory** (teknik sebenar rekod dunia Mandelbrot zoom). **1000 model matematik** (Mandelbrot, Julia, Kapal Terbakar, Tricorn, Nova, Lambda… × kuasa × varian). Slider = makna sebenar (zoom 10^x, iterasi, bailout, kuasa p, c, palet warna). Bila had digit sampai: **re-anchor self-similarity** — perjalanan diteruskan (jumlah kedalaman terus menaik).
3. **Pembina aset parametrik (NURBS-style)** — ubah tinggi, lebar, segmen, twist, taper, ketebalan → bentuk berubah langsung sebelum dilahirkan ke dunia. 12 jenis aset: vas lathe, menara, roda gigi, tangga berpusing, simpul torus…
4. **Mesin AI-prosedur: gambar → 3D** — muat naik gambar rujukan (atau guna contoh). Mesin menganalisis piksel (Sobel, siluet, palet, simetri) lalu merakit **5 jenis model 3D** (relief, siluet ekstrusi, lathe, voxel, puncak). 100% luar talian — AI yang menjadi enjin prosedur tulen, tanpa API key.
5. **Dunia/server tanpa had + plugin** — simpan/muat dunia, eksport/import JSON (kongsi dengan rakan). Plugin **JavaScript** (daftar formula, bentuk, misi, palet) atau **mana-mana bahasa** yang dikompil ke **WebAssembly** (kontrak: `height(x,z) -> f64`).
6. **Pengembaraan matematika** — misi bertingkat Mudah → Pakar + kuiz dengan penjelasan (Pythagoras, masalah Basel Euler, tesseract…). Sesuai kanak-kanak sampai dewasa.
7. **Galeri 115 bentuk matematika + 50 tokoh** + hiperkubus 1D–5D + Spons Menger (warisan v0.1–v0.5, kekal ada).

## 🕹 Tombol

| Tombol | Fungsi |
|---|---|
| `W A S D` | Jalan / terbang bebas |
| `Mouse` | Lihat sekeliling |
| `Spasi` / `C` | Naik / turun · `Shift` = lari |
| `Tab` | Buka / tutup panel parameter |
| `F` | Mod fraktal (zoom tanpa hujung) |
| `B` | Mod bina · `E` letak · `X` padam · `Q` pusing · `Z`/`N` skala |
| `H` | Bantuan penuh (dalam game) |
| `1`–`5` | Dimensi hiperkubus · `R` = reset kedudukan |

Dalam mod fraktal: **tatal tetikus** = zoom ke kursor, **seret** = gerak, **klik dua kali** = zoom 2×, `A` = auto-teroka.

## 📁 Isi repo

```
index.html              → SELURUH game dalam satu fail (double-klik = main!)
three.min.js            → enjin 3D (ringan, luar talian)
165START.exe            → pemutar Windows portable (fail game tertanam di dalamnya)
preview.png             → tangkapan skrin
README.md               → fail ini
BACA-DULU.txt           → panduan 30 saat
CARA-UPLOAD-GITHUB.md   → panduan GitHub & FAQ
src/                    → kod modular (untuk yang nak ubah suai)
  head.html · 10-core.js · 20-world.js · 30-fractal.js
  40-assetgen.js · 50-ugc.js · 60-adventure.js · 90-boot.js
build.py                → python3 build.py  → himpun src/ jadi index.html
```

## 🔧 Untuk yang suka ngoprek

- Semua kod modular dalam `src/`. Ubah → jalankan `python3 build.py` → `index.html` terbina semula.
- Cari tulisan **`PARAM`** untuk mula ubah angka.
- **Buat plugin**: dalam game, panel «Plugin» → tampal kod JavaScript (API: `api.registerFormula / registerAssetType / registerMission / registerPalette`) atau muat fail `.wasm` (eksport `height(x,z)`).

## 📚 Rujukan reka bentuk (dipaparkan juga dalam menu Bantuan)

No Man's Sky · Space Engine · Marble Marcher · Shadertoy/Inigo Quilez · Manifold Garden · LSD: Dream Emulator · Yume Nikki · Frutiger Aero · Desmos · GeoGebra 3D · Dreams (Media Molecule) · Roblox Studio · Grasshopper/Rhino · OpenSCAD · Blender Geometry Nodes · Hart 1989 (Ray Tracing Deterministic 3-D Fractals) · Sphere Tracing · perturbation theory + double-double (Kalles Fraktaler) · Scale of Universe · Powers of Ten · sandbox WebAssembly.

## 🗺 Peta jalan

- **v0.1–v0.5** — dunia 3D, 115 rumus, galeri 50 tokoh, hiperkubus 1D–5D, Menger. ✅
- **v0.6** — simpan/muat kreasi (JSON). ✅
- **v0.7 (sekarang)** — dunia dreamcore tanpa batas + zona tepi/kosmik · fraktal deep-zoom (perturbation + dd) + 1000 model · pembina aset parametrik · mesin AI-prosedur gambar→3D · dunia/server + plugin JS/WASM · fizik mudah · pengembaraan matematika + kuiz. ✅
- **v0.8** — multiplayer sederhana · lebih banyak keluarga fraktal (Mandelbulb 3D raymarching ala Marble Marcher) · eksport video zoom.

---

Dibuat dengan semangat: *matematika itu nyata, bisa dipegang, dan bisa dimainkan.* 🌌
