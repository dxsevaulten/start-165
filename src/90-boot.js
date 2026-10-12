/* ============================================================================
   90-boot.js — ANTARAMUKA MOD, BANTUAN PENUH, & SENTUHAN AKHIR
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME;

// ============================ BAR MOD (butang terapung) ===================
const bar = document.createElement("div");
bar.style.cssText = "position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:42;"+
  "display:flex;gap:8px;background:rgba(6,20,28,.82);border:2px solid #ffb000;border-radius:6px;padding:8px 10px;";
function butangMod(teks, warna, onClick){
  const b = document.createElement("button");
  b.textContent = teks;
  b.style.cssText = "background:#0c3246;color:"+warna+";border:1px solid "+warna+";border-radius:3px;"+
    "font-family:'Courier New',monospace;font-size:11px;padding:6px 12px;cursor:pointer;letter-spacing:1px;";
  b.addEventListener("click", onClick);
  bar.appendChild(b);
  return b;
}
butangMod("🌀 MOD FRAKTAL (F)", "#66e0ff", function(){
  if(G.fractal){
    if(G.fractal.getTerbuka()) G.fractal.tutup();
    else G.fractal.buka();
  }
});
butangMod("🏗 MOD BINA (B)", "#4dff88", function(){
  const e = new KeyboardEvent("keydown", {code:"KeyB"});
  window.dispatchEvent(e);
});
butangMod("❓ BANTUAN (H)", "#ffb000", function(){ toggleBantuan(); });
document.body.appendChild(bar);

// ============================ BANTUAN PENUH ==============================
const bantuan = document.createElement("div");
bantuan.style.cssText = "position:fixed;inset:0;z-index:70;display:none;overflow-y:auto;"+
  "background:rgba(4,12,22,.94);padding:40px 20px;";
bantuan.innerHTML = [
  "<div style='max-width:860px;margin:0 auto;border:2px solid #ffb000;border-radius:10px;",
  "background:rgba(8,26,40,.96);padding:34px 40px;font:12.5px 'Courier New',monospace;",
  "color:#bfeaff;line-height:1.9;letter-spacing:.3px;'>",
  "<h1 style='color:#ffb000;letter-spacing:3px;margin:0 0 4px;'>165 START — BANTUAN LENGKAP</h1>",
  "<div style='color:#4dff88;margin-bottom:18px;'>Dunia matematika tanpa batas · pengembaraan untuk semua umur</div>",

  "<h3 style='color:#ffb000;'>🎮 CARA GERAK</h3>",
  "<table style='width:100%;border-collapse:collapse;'>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>W A S D</td><td>jalan / terbang</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>Tetikus</td><td>lihat sekeliling (klik untuk kunci kursor)</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>Spasi / C</td><td>naik / turun · Shift = lari</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>Tab</td><td>buka / tutup panel parameter</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>F</td><td>mod fraktal (zoom tanpa hujung)</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>B</td><td>mod bina · E = letak objek · X = padam · Q = pusing</td></tr>",
  "<tr><td style='padding:2px 12px 2px 0;color:#66e0ff;'>1-5 · R</td><td>dimensi hiperkubus · reset kedudukan</td></tr>",
  "</table>",

  "<h3 style='color:#ffb000;'>🌏 DUNIA DREAMCORE TANPA BATAS</h3>",
  "Rumput hijau, bukit, rumah, pokok, bunga, kolam dan awan — semua dijana prosedur ",
  "mengelilingi kau selama-lamanya (tiada 'dinding dunia'). Tukar <b>seed</b> = dunia baru sepenuhnya. ",
  "Bila kau terbang jauh dari pusat, dunia mula <b>terdistorsi</b> (zona tepi), dan selepas itu masuk ",
  "<b>zon kosmik</b>: langit retro-gelap, bintang dan formula matematik melayang. Terus terbang — ",
  "tiada ujung yang akan kau jumpa.<br>",

  "<h3 style='color:#ffb000;'>🌀 FRAKTAL ZOOM TANPA HUJUNG</h3>",
  "Enjin dalaman guna teknik sebenar rekod dunia: <b>orbit rujukan double-double (±31 digit)</b> + ",
  "<b>perturbation theory</b>. Itulah sebab zoom sampai 10^30+ betul-betul dikira, bukan animasi. ",
  "Bila had digit sampai, <b>re-anchor (self-similarity)</b> menyambung perjalanan — fraktal ",
  "memang tiada ujung: struktur serupa berulang pada semua skala. <b>1000 model matematik</b> ",
  "sedia dipilih (Mandelbrot, Julia, Kapal Terbakar, Tricorn, Nova, Lambda… × kuasa × varian). ",
  "Setiap slider = makna sebenar (zoom 10^x, iterasi, bailout, kuasa, c, palet).<br>",

  "<h3 style='color:#ffb000;'>🏗 PEMBINA ASET PARAMETRIK + AI PROSEDUR</h3>",
  "Bina aset seperti Grasshopper/NURBS: ubah tinggi, lebar, segmen, twist, taper — bentuk berubah ",
  "langsung sebelum 'dilahirkan' ke dunia. Mesin <b>AI-prosedur</b> pula membaca gambar rujukan kau: ",
  "mengesan tepi (Sobel), siluet, palet warna, simetri — lalu merakit <b>5 jenis model 3D</b> ",
  "(relief, siluet, lathe, voxel, puncak). Semua luar talian: ini AI yang menjadi enjin prosedur ",
  "tulen di dalam game — boleh dipakai sesiapa tanpa API key.<br>",

  "<h3 style='color:#ffb000;'>🌍 DUNIA / SERVER & PLUGIN</h3>",
  "Simpan dunia tanpa had (localStorage + eksport/import JSON — boleh kongsi dengan rakan). ",
  "Plugin: <b>JavaScript</b> (daftar formula, bentuk aset, misi, palet warna) atau <b>mana-mana ",
  "bahasa</b> yang dikompil ke WebAssembly (kontrak: eksport <code>height(x,z) -&gt; f64</code> — ",
  "C, Rust, Go, Zig semua boleh). Ekosistem yang boleh berkembang sendiri.<br>",

  "<h3 style='color:#ffb000;'>🗺 PENGEMBARAN MATEMATIKA</h3>",
  "Misi bertingkat Mudah → Pakar + kuiz berpilihan dengan penjelasan (Pythagoras, masalah Basel, ",
  "tesseract…). Sesuai dari kanak-kanak sampai dewasa — teks penuh di setiap bahagian.<br>",

  "<h3 style='color:#ffb000;'>📚 DIREKTORI RUJUKAN (yang menjadi panduan reka bentuk)</h3>",
  "<i>Dunia prosedur:</i> No Man's Sky, Space Engine, Minecraft (Cubic Chunks).<br>",
  "<i>Fraktal dunia sebenar:</i> Marble Marcher (raymarching Mandelbulb), Mandelbulb 3D, Shadertoy, ",
  "Inigo Quilez (SDF).<br>",
  "<i>Geometri mustahil:</i> Manifold Garden, Antichamber, Superliminal, HyperRogue, Miegakure.<br>",
  "<i>Estetika:</i> LSD: Dream Emulator, Yume Nikki, Fatum Betula (dreamcore) · Frutiger Aero ",
  "(langit biru, rumput, air, permukaan berkilau).<br>",
  "<i>Matematik interaktif:</i> Desmos, GeoGebra 3D, Calcflow, MathBox.<br>",
  "<i>Bina & parametrik:</i> Dreams (Media Molecule), Roblox Studio, Garry's Mod Wiremod, Teardown, ",
  "Grasshopper/Rhino, OpenSCAD, Blender Geometry Nodes.<br>",
  "<i>Deep zoom teknikal:</i> Hart 1989 (Ray Tracing Deterministic 3-D Fractals), Sphere Tracing, ",
  "perturbation theory + double-double (Kalles Fraktaler), Mandelbrot deep zoom world record.<br>",
  "<i>Skala & rasa zoom:</i> Scale of Universe, Powers of Ten (Eames 1977).<br>",
  "<i>Plugin mana-mana bahasa:</i> sandbox WASM (WebAssembly).<br>",

  "<h3 style='color:#ffb000;'>💾 PASANG & GUNA</h3>",
  "Windows: klik dua kali <b>165START.exe</b> (portable, tanpa install, tanpa internet). ",
  "Atau buka <b>index.html</b> dengan Chrome/Edge (double-klik sahaja). ",
  "Semua fail dalam satu folder — 1 fail game tunggal + enjin 3D. Ringan (< 3 MB).<br>",

  "<div style='margin-top:22px;text-align:center;'>",
  "<button id='tutupBantuan' style='background:#0c3246;color:#ffb000;border:1px solid #ffb000;",
  "border-radius:4px;font-family:inherit;font-size:12px;padding:10px 26px;cursor:pointer;letter-spacing:2px;'>",
  "TUTUP (H)</button></div>",
  "</div>"
].join("");
document.body.appendChild(bantuan);
document.getElementById("tutupBantuan").addEventListener("click", toggleBantuan);
function toggleBantuan(){
  bantuan.style.display = bantuan.style.display === "block" ? "none" : "block";
}
window.addEventListener("keydown", function(e){
  if(e.target && (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT")) return;
  if(e.code === "KeyF" && G.fractal && !G.fractal.getTerbuka()){
    G.fractal.buka();
    return;
  }
  if(e.code === "KeyH" && !(G.fractal && G.fractal.getTerbuka())){
    toggleBantuan();
  }
});

// ============================ SKRIN SELAMAT DATANG ========================
const welcome = document.getElementById("welcome");
if(welcome){
  const kotak = welcome.querySelector(".box");
  if(kotak){
    kotak.innerHTML = [
      "<h1 style='color:#ffb000;letter-spacing:3px;margin:0 0 8px;font-size:28px;'>165 START</h1>",
      "<p style='color:#bfeaff;line-height:1.85;font-size:13px;'>",
      "Dunia <b>dreamcore tanpa batas</b> yang bisa kamu ubah apa saja.<br>",
      "Rumah, awan, rumput, kolam — semua lahir dari persamaan matematika.<br>",
      "Zoom <b>fraktal tanpa hujung</b> · bina aset parametrik · AI prosedur dari gambar · ",
      "plugin · misi pengembaraan untuk semua umur.</p>",
      "<div style='margin-top:16px;font-size:12px;color:#4dff88;letter-spacing:2px;",
      "border:1px dashed #4dff88;border-radius:4px;padding:10px 16px;display:inline-block;'>",
      "▶ KLIK DI SINI UNTUK MASUK</div>",
      "<p style='font-size:11px;opacity:.85;color:#9fd8ff;'>",
      "<b>WASD</b> gerak · <b>F</b> fraktal · <b>B</b> bina · <b>Tab</b> panel · <b>H</b> bantuan penuh</p>"
    ].join("");
    welcome.addEventListener("click", function(){
      welcome.style.display = "none";
      G.renderer.domElement.requestPointerLock();
    }, {once:true});
  }
}

// ============================ HUD TAMBAHAN ================================
const hud = document.getElementById("hud");
if(hud){
  const kiri = hud.querySelector("div");
  if(kiri){
    kiri.innerHTML = "<b>[WASD]</b> gerak &nbsp; <b>[F]</b> fraktal &nbsp; <b>[B]</b> bina &nbsp; "+
      "<b>[TAB]</b> panel &nbsp; <b>[H]</b> bantuan &nbsp; <b>[R]</b> reset";
  }
}
})();
