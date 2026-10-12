# Cara upload ke GitHub (private) — untuk yang bukan programmer

Ikuti persis langkah demi langkah. Perkiraan waktu: **10 menit**.

⚠️ **PENTING:** Jangan pernah mengetik password, token, atau kata sandi ke chat mana pun
(termasuk ke aku). Login GitHub hanya dilakukan di aplikasi/browser GitHub milikmu sendiri.

---

## ❓ Pertanyaan yang sering muncul

**Q: Zip-nya harus diekstrak dulu sebelum di-upload?**
**TIDAK.** Upload `165START-win64-v0.6.zip` apa adanya ke repo — GitHub menyimpannya sebagai file yang bisa diunduh siapa pun (termasuk kamu sendiri dari laptop lain). Ekstrak hanya perlu dilakukan di laptop **saat mau main**.

**Q: Repo-ku sudah keburu dibuat dengan README (sudah muncul 1 commit). Gimana lanjutnya?**
Itu **normal dan justru bagus** — README memang sengaja dibuat duluan supaya repo tidak kosong. Kamu tinggal menambah file di **commit berikutnya**:
1. Buka repo kamu di GitHub
2. Klik **Add file** → **Upload files**
3. Seret semua file game ke halaman itu
4. Klik **Commit changes**
Selesai. Commit baru akan menumpuk rapi di atas commit README tadi.

**Q: File apa saja yang di-upload?**
Supaya GitHub **menampilkan isinya langsung** (bukan cuma zip), upload **file mentahnya**: `index.html`, `three.min.js`, `165START.exe`, `preview.png`, `README.md`, `BACA-DULU.txt`, `CARA-UPLOAD-GITHUB.md`, `build.py`, serta folder `src/` (kod modular untuk yang nak ubah suai).

Hasilnya: halaman repo langsung menampilkan kode game, gambar preview, dan README — sesiapa pun boleh terus main `index.html` dari GitHub (Download raw), dan zip release tetap tersedia untuk diunduh.

💡 **Cara upload folder `rilis/` lewat web:** saat di halaman Upload files, **seret folder `rilis` itu langsung** (drag folder, bukan isinya) — GitHub otomatis membuat foldernya. Atau buat dulu tombol "Create new file" → ketik `rilis/` lalu simpan apa pun, lalu upload zip ke dalam folder itu.

**Q: Lalu kapan zip-nya diekstrak?**
Di laptop kamu, saat mau main: klik kanan zip → Extract All → klik dua kali `165START.exe`.

---

## Jalan cepat: push mandiri (tinggal klik)

1. Buka <https://github.com/new>
   - **Repository name:** `165-start`
   - Pilih **Private** ✅
   - Centang **Add a README file**
   - Klik **Create repository**
2. Letakkan semua file game (termasuk `push-ke-github.bat`) dalam **satu folder** di laptopmu.
3. Klik dua kali **`push-ke-github.bat`**.
4. Jendela login GitHub akan muncul → login di sana (aman, tidak lewat chat).
5. Tunggu tulisan selesai → cek <https://github.com/dxsevaulten/165-start>

Sudah. Isi repo = kode game + paket `165START-win64-v0.2.zip` yang bisa kamu unduh kapan saja.

---

## Opsi A — Pakai GitHub Desktop (paling mudah)

### 1. Bikin repo kosong di website GitHub
1. Buka <https://github.com/new>
2. **Repository name:** `165-start`
3. Pilih **Private** ✅ (ini permintaanmu — repo tetap rahasia)
4. Centang **Add a README file** (biar tidak kosong)
5. Klik tombol hijau **Create repository**

### 2. Buka di GitHub Desktop
1. Install GitHub Desktop kalau belum: <https://desktop.github.com>
2. Login GitHub di aplikasi itu (di sana aman, bukan di chat)
3. Klik **File → Clone repository…** → pilih `dxsevaulten/165-start` → **Clone**
4. Buka folder hasil clone di File Explorer

### 3. Salin file game
1. Salin **semua isi** folder game ini (`165START.exe`, `index.html`, `three.min.js`, `preview.png`, `README.md`)
2. Tempel ke dalam folder hasil clone tadi

### 4. Push (unggah)
1. Buka GitHub Desktop → akan muncul daftar file baru
2. Isi kolom kiri bawah: `165 start v0.1 — game sandbox matematika`
3. Klik tombol **Commit to main**
4. Klik **Push origin** (tombol di atas)

Selesai. Repo `dxsevaulten/165-start` (private) sudah berisi gamenya.

---

## Opsi B — Tanpa aplikasi (lewat browser + VS)

1. Buka <https://github.com/new> → nama: `165-start` → **Private** → centang **Add a README file** → **Create repository**
2. Klik tombol hijau **Code** → **Download ZIP**
3. Buka ZIP-nya, ekstrak ke folder mana pun (misal `Documents\165-start`)
4. Salin semua file game ini ke folder itu
5. Buka <https://github.com/dxsevaulten/165-start> → **Add file** → **Upload files**
6. Seret semua file game ke halaman itu → **Commit changes**

---

## Catatan

- **File besar:** GitHub menolak file > 100 MB. File game ini total ± 3 MB, jadi aman sekali.
- **Private artinya:** hanya kamu yang bisa lihat. Kalau nanti mau dibagikan, ubah jadi Public di menu Settings repo.
- **Update versi berikutnya:** cukup ganti file yang berubah, lalu ulangi langkah "Push" (Opsi A) atau "Upload files" (Opsi B).
- Kalau pakai **Visual Studio**: File → Open → Folder → pilih folder repo tadi. VS langsung bisa dipakai edit & commit lewat menu Git.
