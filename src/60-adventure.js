/* ============================================================================
   60-adventure.js — PENGEMBARAN MATEMATIKA (semua umur)
   ----------------------------------------------------------------------------
   Misi bertingkat: Mudah (kanak-kanak) → Sederhana → Sukar → Pakar.
   Setiap misi ada petunjuk + penjelasan matematik sebenar (belajar sambil main).
   Termasuk kuiz berpilihan dengan jawapan + huraian.
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME;

// ============================ PENDAFTARAN MISI ===========================
const senaraiMisi = [];
const selesai = (function(){
  try{ return JSON.parse(localStorage.getItem("165misi") || "{}"); }
  catch(e){ return {}; }
})();
function simpanSelesai(){ try{ localStorage.setItem("165misi", JSON.stringify(selesai)); }catch(e){} }

G.missions = {
  tambah: function(m){ senaraiMisi.push(m); isiPilihan(); },
  senarai: senaraiMisi
};
// plugin yang mendaftar misi sebelum modul ini dimuat
(G._pendingMissions || []).forEach(function(m){ senaraiMisi.push(m); });

// ============================ MISI TERBINA-DALAM =========================
function jarakDariPusat(){
  const p = G.player.pos;
  return Math.sqrt(p.x*p.x + p.z*p.z);
}
const MISI = [
  // ---------- MUDAH (kanak-kanak / baru kenal) ----------
  {judul:"👣 Langkah Pertama", tier:"Mudah",
   petunjuk:"Berjalanlah sekurang-kurangnya 100 unit dari titik mula (gunakan W A S D).",
   penjelasan:"Jarak = punca kuasa dua (x² + z²). Ini teorem Pythagoras — a² + b² = c²!",
   semak:function(){ return jarakDariPusat() > 100; }},
  {judul:"🏠 Bina Rumah Pertama", tier:"Mudah",
   petunjuk:"Buka panel «Pembina Aset», pilih «Rumah kecil», tekan «Bina & letak ke dunia».",
   penjelasan:"Rumah = kubus + piramid. Kubus ada 6 muka, 12 rusuk, 8 bucu — cuba kira!",
   semak:function(){
     return G.ugc.objek.some(function(o){ return o.userData.deskriptor && o.userData.deskriptor.jenis === "rumah"; });
   }},
  {judul:"🌙 Tukar ke Malam", tier:"Mudah",
   petunjuk:"Geser slider «Waktu (malam↔siang)» ke bawah 0.3.",
   penjelasan:"Cahaya matahari bergerak kerana Bumi berputar — 1 pusingan = 24 jam = 360 darjah.",
   semak:function(){ return G.dunia && G.dunia.waktu < 0.3; }},
  {judul:"🎲 Dunia Baharu", tier:"Mudah",
   petunjuk:"Tekan butang «🎲 Dunia baru (rawak seed)» di panel dunia.",
   penjelasan:"'Seed' nombor benih: nombor sama = dunia sama. Komputer guna matematik untuk rawak!",
   semak:function(){ return G.dunia && G.dunia.seed !== 165; }},

  // ---------- SEDERHANA ----------
  {judul:"🌀 Pembina Parametrik", tier:"Sederhana",
   petunjuk:"Bina aset dengan slider «Pintalan (twist)» bukan 0 — ubah bentuk, letak ke dunia.",
   penjelasan:"Parametrik = bentuk dikawal parameter. Ini konsep NURBS: lengkung matematik → permukaan 3D.",
   semak:function(){
     return G.ugc.objek.some(function(o){
       const d = o.userData.deskriptor;
       return d && d.P && Math.abs(d.P.twist) > 0.01;
     });
   }},
  {judul:"🤖 Juruterbang AI Prosedur", tier:"Sederhana",
   petunjuk:"Gunakan «Mesin AI-Proseder»: analisis gambar contoh, jana 3D, letak ke dunia.",
   penjelasan:"Mesin ini baca piksel → tepi (Sobel) → siluet → palet. Matematik jadi bentuk!",
   semak:function(){
     return G.ugc.objek.some(function(o){ return o.userData.deskriptor && o.userData.deskriptor.sumber === "ai"; });
   }},
  {judul:"🔭 Masuk Mod Fraktal", tier:"Sederhana",
   petunjuk:"Tekan butang «🌀 Mod Fraktal» (atau kekunci F), kemudian zoom dengan tatal tetikus.",
   penjelasan:"Fraktal = bentuk yang serupa walau berapa kali pun kau zoom. Sifat ini dipanggil self-similarity.",
   semak:function(){ return G.fractal && G.fractal.zoomExp() >= 5; }},
  {judul:"🗺️ Jelajah Pinggir Dunia", tier:"Sederhana",
   petunjuk:"Terbang jauh dari pusat dunia sampai dunia mula berubah (atau guna butang ⚡).",
   penjelasan:"Di pinggir, ruang berpusing — dalam matematik, koordinat boleh 'berpusing' mengikut fungsi.",
   semak:function(){ return G.dunia && jarakDariPusat() > G.dunia.batas; }},
  {judul:"💾 Arkib Dunia", tier:"Sederhana",
   petunjuk:"Simpan sekurang-kurangnya satu dunia (butang 💾 Simpan dunia semasa).",
   penjelasan:"Data dunia = senarai koordinat + parameter. Semuanya boleh jadi nombor — itulah dunia digital.",
   semak:function(){
     try{ return Object.keys(JSON.parse(localStorage.getItem("165worlds") || "{}")).length > 0; }
     catch(e){ return false; }
   }},

  // ---------- SUKAR ----------
  {judul:"🕳️ Zoom Dalam 10^15", tier:"Sukar",
   petunjuk:"Dalam mod fraktal, zoom sampai kuasa 10 melebihi 15 (tatal atau butang uji).",
   penjelasan:"Pada kedalaman ini float64 biasa sudah tidak cukup — enjin guna perturbation + double-double (31 digit)!",
   semak:function(){ return G.fractal && G.fractal.F.zoomTotal >= 15; }},
  {judul:"🏗️ Sepuluh Binaan", tier:"Sukar",
   petunjuk:"Letakkan 10 objek ke dalam dunia (mod bina: tekan B, kemudian E berulang kali).",
   penjelasan:"Grid & koordinat: setiap objek ada kedudukan (x, y, z) — sistem Cartesian dari Descartes.",
   semak:function(){ return G.ugc.objek.length >= 10; }},
  {judul:"🎨 Lima Jenis Aset", tier:"Sukar",
   petunjuk:"Letakkan 5 jenis aset berbeza (tabung, vas, menara, dll) dalam satu dunia.",
   penjelasan:"Setiap bentuk ada formula berbeza: silinder = πr²h, bola = 4/3 πr³. Bandingkan!",
   semak:function(){
     const set = {};
     G.ugc.objek.forEach(function(o){
       const d = o.userData.deskriptor;
       if(d && d.jenis) set[d.jenis] = 1;
       else if(d && d.sumber === "ai") set["ai-"+d.bentuk] = 1;
     });
     return Object.keys(set).length >= 5;
   }},
  {judul:"❓ Kuiz: Nombor Istimewa", tier:"Sukar", kuiz:{
     soalan:"Berapakah hasil 1 + 1/4 + 1/9 + 1/16 + … (jumlah songsang kuasa dua)?",
     pilihan:["π²/6","π/2","∞","1"],
     jawapan:0,
     penjelasan:"Ini masalah Basel — diselesaikan Euler (1734): ∑1/n² = π²/6 ≈ 1.6449. Nombor π muncul di tempat tak disangka!"}},

  // ---------- PAKAR ----------
  {judul:"🌌 Zoom Tanpa Hujung 10^40", tier:"Pakar",
   petunjuk:"Dalam mod fraktal, tekan «🌌 Bukti zoom tanpa hujung: 10^40» dan teruskan meneroka.",
   penjelasan:"Perturbation theory: orbit rujukan dd + delta piksel. Teknik yang sama dengan rekod dunia zoom Mandelbrot!",
   semak:function(){ return G.fractal && G.fractal.F.zoomTotal >= 40; }},
  {judul:"📚 Ahli 1000 Model", tier:"Pakar",
   petunjuk:"Dalam mod fraktal, pilih model matematik nombor 500 ke atas dari senarai.",
   penjelasan:"1000 model = gabungan keluarga iterasi (kuasa, konjugat, kapal terbakar…) × mod × titik c. Semuanya matematik sebenar.",
   semak:function(){ return G.fractal && G.fractal.F.model >= 500; }},
  {judul:"🧩 Tuan Plugin", tier:"Pakar",
   petunjuk:"Jalankan sekurang-kurangnya satu plugin JavaScript di panel «Plugin».",
   penjelasan:"Plugin = program dalam program. Plugin boleh daftar formula, bentuk, misi — ekosistem tanpa hujung.",
   semak:function(){ return !!G._pluginRan; }},
  {judul:"❓ Kuiz: Dimensi", tier:"Pakar", kuiz:{
     soalan:"Berapa bucu ada pada hiperkubus 4D (tesseract)?",
     pilihan:["8","16","24","32"],
     jawapan:1,
     penjelasan:"Kubus 3D = 8 bucu. Setiap +1 dimensi menggandakan bucu: 2ⁿ. Tesseract (4D) = 2⁴ = 16 bucu!"}}
];
G.missions.daftar = MISI;   // misi terbina-dalam (Mudah → Pakar)
const PNL = G.panel;
PNL.group("🗺️ PENGEMBARAN MATEMATIKA (semua umur)");

const infoMisi = document.createElement("div");
infoMisi.style.cssText = "font:10.5px 'Courier New',monospace;color:#bfeaff;background:rgba(10,40,60,.5);"+
  "border:1px dashed #2b6f8e;border-radius:4px;padding:9px;margin:8px 0;white-space:pre-wrap;line-height:1.7;";
PNL.body.appendChild(infoMisi);

const rowSel = document.createElement("div"); rowSel.className = "row";
const lblSel = document.createElement("label"); lblSel.innerHTML = "<span>Pilih misi</span>";
const selMisi = document.createElement("select");
selMisi.style.cssText = "width:100%;background:#0c3246;color:#66e0ff;border:1px solid #2b6f8e;border-radius:3px;font-family:inherit;padding:3px;";
rowSel.appendChild(lblSel); rowSel.appendChild(selMisi);
PNL.body.appendChild(rowSel);

const kuizBox = document.createElement("div");
kuizBox.style.cssText = "margin:6px 0;";
PNL.body.appendChild(kuizBox);

function isiPilihan(){
  if(!selMisi) return;
  const nilai = selMisi.value;
  selMisi.innerHTML = "";
  MISI.forEach(function(m, i){
    const op = document.createElement("option");
    op.value = String(i);
    op.textContent = (selesai[m.judul] ? "✔ " : "") + "[" + m.tier + "] " + m.judul;
    selMisi.appendChild(op);
  });
  senaraiMisi.forEach(function(m, i){
    const op = document.createElement("option");
    op.value = "p" + i;
    op.textContent = (selesai[m.judul] ? "✔ " : "") + "[Plugin] " + m.judul;
    selMisi.appendChild(op);
  });
  if(nilai) selMisi.value = nilai;
  paparMisi();
}
function misiTerpilih(){
  const v = selMisi.value;
  if(v && v[0] === "p") return senaraiMisi[parseInt(v.slice(1), 10)];
  return MISI[parseInt(v || "0", 10)] || MISI[0];
}
function paparMisi(){
  const m = misiTerpilih();
  if(!m) return;
  infoMisi.textContent =
    "MISI: " + m.judul + "   [" + m.tier + "]\n" +
    "-------------------------------------------\n" +
    "🎯 " + m.petunjuk + "\n\n" +
    "📐 " + m.penjelasan + "\n\n" +
    "Status: " + (selesai[m.judul] ? "✔ SELESAI — ganjaran: " + (m.ganjaran||"Jiwa Pengembara") : "belum selesai");
  // kuiz?
  kuizBox.innerHTML = "";
  if(m.kuiz){
    const q = document.createElement("div");
    q.style.cssText = "font:10.5px 'Courier New',monospace;color:#ffe27a;line-height:1.8;";
    const soal = document.createElement("div");
    soal.textContent = "❓ " + m.kuiz.soalan;
    q.appendChild(soal);
    m.kuiz.pilihan.forEach(function(t, i){
      const lab = document.createElement("label");
      lab.style.cssText = "display:flex;gap:6px;align-items:center;cursor:pointer;";
      const r = document.createElement("input");
      r.type = "radio"; r.name = "kuiz165"; r.value = String(i);
      lab.appendChild(r);
      lab.appendChild(document.createTextNode(t));
      q.appendChild(lab);
    });
    const btn = document.createElement("button");
    btn.className = "mini";
    btn.textContent = "Hantar jawapan";
    btn.style.marginTop = "6px";
    btn.addEventListener("click", function(){
      const pilih = q.querySelector("input[name=kuiz165]:checked");
      const hasil = document.createElement("div");
      hasil.style.cssText = "margin-top:6px;line-height:1.7;";
      if(!pilih){ hasil.textContent = "⚠ Pilih satu jawapan dahulu."; }
      else if(parseInt(pilih.value, 10) === m.kuiz.jawapan){
        hasil.innerHTML = "✔ <b>BETUL!</b> " + m.kuiz.penjelasan;
        selesai[m.judul] = true; simpanSelesai(); isiPilihan();
      } else {
        hasil.innerHTML = "✘ Belum tepat. Cuba lagi! Petunjuk: baca penjelasan misi di atas.";
      }
      q.appendChild(hasil);
    });
    q.appendChild(btn);
    kuizBox.appendChild(q);
  }
}
selMisi.addEventListener("change", paparMisi);

PNL.button({label:"✔ Semak misi semasa", onClick:function(){
  const m = misiTerpilih();
  if(!m || m.kuiz){ paparMisi(); return; }
  let ok = false;
  try{ ok = !!m.semak(G); }catch(e){ ok = false; }
  const hasil = document.createElement("div");
  hasil.style.cssText = "margin:6px 0;font:10.5px 'Courier New',monospace;line-height:1.7;";
  if(ok){
    selesai[m.judul] = true; simpanSelesai();
    hasil.innerHTML = "✔ <b>MISI SELESAI!</b> Ganjaran: " + (m.ganjaran || "Jiwa Pengembara") + " 🏆";
    isiPilihan();
  } else {
    hasil.innerHTML = "⏳ Belum cukup lagi — ikut petunjuk di atas. Kau boleh!";
  }
  PNL.body.appendChild(hasil);
  setTimeout(function(){ hasil.remove(); }, 9000);
}});

// kemas kini ringkas setiap 2 saat (paparan status)
let pemasa = 0;
G.updates.push(function(dt){
  pemasa += dt;
  if(pemasa > 2){
    pemasa = 0;
    const jumlah = MISI.length + senaraiMisi.length;
    const siap = MISI.concat(senaraiMisi).filter(function(m){ return selesai[m.judul]; }).length;
    if(infoMisi && !infoMisi.textContent.includes("MISI:")){
      infoMisi.textContent = "Pilih misi untuk mula pengembaraan matematika.";
    }
    const hud = document.getElementById("stat");
    if(hud && hud.dataset.misi !== String(siap)){
      hud.dataset.misi = String(siap);
    }
  }
});

isiPilihan();
})();
