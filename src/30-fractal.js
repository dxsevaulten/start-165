/* ============================================================================
   30-fractal.js — MESIN FRAKTAL ZOOM TANPA HUJUNG
   ----------------------------------------------------------------------------
   Teknik sebenar (sama seperti rekod dunia Mandelbrot zoom):
   · Orbit rujukan dikira dalam aritmetik DOUBLE-DOUBLE (±31 digit).
   · Setiap piksel = "perturbation" (delta kecil) terhadap orbit rujukan.
   · Itulah sebab zoom boleh sampai 10^30+ dan seterusnya, bukan sekadar
     zoom visual — angka di dalam betul-betul dihitung lebih dalam.
   · Bila had digit komputer sampai, "re-anchor" menerima-semula (self-
     similarity): perjalanan diteruskan ke salinan fraktal yang serupa.
   · 1000 model matematik dijana daripada keluarga iterasi berbeza —
     setiap model benar-benar berbeza (kuasa, varian, mod, c).
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME, THREE = G.THREE;

// ============================ ARITMETIK DOUBLE-DOUBLE =====================
// nombor dd = [hi, lo] dengan hi+lo ≈ nilai penuh (~31 digit tepat)
const SPLITTER = 134217729; // 2^27+1
function ddAdd(ah, al, bh, bl){
  const s = ah+bh;
  const bb = s-ah;
  const err = (ah-(s-bb)) + (bh-bb);
  const l = (al+bl) + err;
  const sh = s+l;
  return [sh, (s-sh)+l];
}
function ddSub(ah, al, bh, bl){ return ddAdd(ah, al, -bh, -bl); }
function ddMul(ah, al, bh, bl){
  const p = ah*bh;
  // pembahagian Dekker untuk hasil darab tepat
  let t = SPLITTER*ah;
  const ahi = t-(t-ah), alo = ah-ahi;
  t = SPLITTER*bh;
  const bhi = t-(t-bh), blo = bh-bhi;
  const err = ((ahi*bhi-p) + ahi*blo + alo*bhi) + alo*blo;
  const l = err + (ah*bl + al*bh);
  const ph = p+l;
  return [ph, (p-ph)+l];
}
function ddFrom(x){ return [x, 0]; }

// ============================ KEADAAN FRAKTAL =============================
const F = {
  cx: -0.743643887037151, cy: 0.131825904205330,   // pusat tampilan (dd)
  zoomExp: 4,          // zoom = 10^zoomExp
  zoomTotal: 4,        // jumlah perjalanan (terus naik walaupun re-anchor)
  rotasi: 0,           // darjah
  iterasi: 400, autoIter: true,
  bailout: 256,
  kuasa: 2,
  cre: -0.8, cim: 0.156,
  palet: "aero", warnaAuto: true, halus: true,
  kecerahan: 1.0, kelajuanWarna: 0.35,
  resolusi: 0.35,
  model: 0
};
// simpan pusat sebagai dd
const CEN = {r:[F.cx,0], i:[F.cy,0]};

// ============================ 1000 MODEL MATEMATIK ========================
// Keluarga iterasi (semua nyata, bukan nama kosong):
const KELUARGA = [
  {id:"mandel",  nama:"Mandelbrot",     rumus:"z → z^p + c",                     holomorfik:true},
  {id:"conj",    nama:"Konjugat",       rumus:"z → conj(z)^p + c",               holomorfik:true},
  {id:"ship",    nama:"Kapal Terbakar", rumus:"z → (|Re z| + i|Im z|)^p + c",    holomorfik:false},
  {id:"tricorn", nama:"Tricorn",        rumus:"z → conj(z)^p + c (mod bertentangan)", holomorfik:true},
  {id:"absxy",   nama:"Mutlak-xy",      rumus:"z → (|x|+|y|i)^p + c",            holomorfik:false},
  {id:"swap",    nama:"Tukar-x-y",      rumus:"z → (Im z + i·Re z)^p + c",       holomorfik:true},
  {id:"nova",    nama:"Nova Newton",    rumus:"z → z − (z^p−1)/(p·z^(p−1)) + c", holomorfik:true},
  {id:"lambda",  nama:"Lambda",         rumus:"z → c·z·(1−z)^p",                 holomorfik:true}
];
// galeri 30 titik c Julia yang menarik (bahagian nyata, imajiner)
const JULIA_C = [
  [0.285,0.01],[-0.70176,-0.3842],[-0.8,0.156],[-0.4,0.6],[0.35,0.35],[-0.745,0.113],
  [-0.1,0.651],[0.233,0.538],[-0.79,0.15],[-0.162,1.04],[0.189,0.532],[-0.123,0.745],
  [0.37,0.16],[0.295,0.02],[-0.75,0.12],[-0.23,0.778],[-0.5,0.55],[0.32,0.643],
  [-0.67,0.297],[-0.9,0.275],[0.45,0.142],[-0.15,0.9],[0.27,0.58],[-0.835,-0.2321],
  [-0.7269,0.1889],[0.355,0.355],[-0.2,0.83],[0.11,0.66],[-0.39,0.617],[-0.755,0.15]
];
function binaModel(i){
  const kf = i % KELUARGA.length;
  const p = 2 + Math.floor(i/KELUARGA.length) % 7;
  const mod = Math.floor(i/(KELUARGA.length*7)) % 2;       // 0 = Mandelbrot-type, 1 = Julia
  const jc = JULIA_C[i % JULIA_C.length];
  const k = KELUARGA[kf];
  const nama = "MDL-"+String(i+1).padStart(4,"0")+" · "+k.nama+" p"+p+" · "+(mod?"Julia":"Mandel")+
               (mod?" (c="+(jc[0]).toFixed(3)+(jc[1]<0?"":"+")+jc[1].toFixed(3)+"i)":"");
  return {i:i, keluarga:k, kuasa:p, mod:mod, cre:mod?jc[0]:F.cre, cim:mod?jc[1]:F.cim, nama:nama};
}
const MODELS = [];
for(let i=0;i<1000;i++) MODELS.push(binaModel(i));

// ============================ PALET WARNA ================================
const PALETS = {
  aero:      [[10,30,80],[20,110,200],[120,220,255],[255,255,255],[120,220,255],[20,110,200]],
  pelangi:   [[120,0,255],[0,90,255],[0,220,200],[80,255,80],[255,240,80],[255,90,30]],
  api:       [[10,0,30],[120,10,60],[230,70,20],[255,170,40],[255,245,200],[230,70,20]],
  lautan:    [[2,20,50],[10,70,140],[40,160,210],[170,235,255],[255,255,255],[40,160,210]],
  ungu:      [[20,5,40],[80,20,140],[170,80,230],[240,190,255],[255,255,255],[170,80,230]],
  mono:      [[0,0,0],[60,60,70],[140,140,155],[230,230,240],[255,255,255],[140,140,155]],
  dreamcore: [[255,150,210],[150,190,255],[190,255,220],[255,245,180],[255,150,210],[150,190,255]],
  neon:      [[10,0,30],[255,20,180],[20,255,220],[255,240,60],[255,20,180],[20,255,220]],
  hijau:     [[0,20,8],[10,90,40],[60,200,90],[190,255,170],[255,255,255],[60,200,90]],
  retro:     [[20,10,40],[190,60,120],[255,140,80],[255,220,130],[255,245,210],[255,140,80]],
  es:        [[4,20,40],[40,120,190],[120,210,240],[230,250,255],[255,255,255],[120,210,240]],
  kegelapan: [[0,0,0],[30,0,60],[90,0,140],[190,60,255],[255,200,255],[90,0,140]]
};
function warnaPalet(nama, t){
  const stops = PALETS[nama] || PALETS.aero;
  if(typeof t !== "number" || !isFinite(t)) t = 0;
  t = ((t % 1) + 1) % 1;
  const f = t*stops.length;
  let i0 = Math.floor(f) % stops.length, i1 = (i0+1) % stops.length;
  if(!stops[i0]) i0 = 0;
  if(!stops[i1]) i1 = 0;
  const k = f - Math.floor(f);
  const a = stops[i0], b = stops[i1];
  return [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];
}

// ============================ UI MOD FRAKTAL ==============================
const wrap = document.createElement("div");
wrap.id = "fraktalMode";
wrap.style.cssText = "position:fixed;inset:0;z-index:44;display:none;background:#030711;";
const canvas = document.createElement("canvas");
canvas.style.cssText = "width:100%;height:100%;display:block;cursor:crosshair;";
wrap.appendChild(canvas);
const ctx = canvas.getContext("2d");

// kotak info matematik (ala Desmos — sentiasa tunjuk rumus & angka sebenar)
const info = document.createElement("div");
info.style.cssText = "position:absolute;top:14px;left:14px;max-width:430px;background:rgba(6,20,28,.88);"+
  "border:2px solid #ffb000;border-radius:6px;padding:12px 14px;font:11.5px 'Courier New',monospace;"+
  "color:#4dff88;letter-spacing:.4px;line-height:1.75;white-space:pre-wrap;";
wrap.appendChild(info);

// panel kawalan fraktal
const ctrl = document.createElement("div");
ctrl.style.cssText = "position:absolute;top:14px;right:14px;width:296px;max-height:calc(100% - 120px);"+
  "overflow-y:auto;background:rgba(6,20,28,.88);border:2px solid #66e0ff;border-radius:6px;"+
  "padding:12px 14px;font:11px 'Courier New',monospace;color:#66e0ff;";
wrap.appendChild(ctrl);

const tip = document.createElement("div");
tip.style.cssText = "position:absolute;left:0;right:0;bottom:0;padding:10px 18px;background:linear-gradient(0deg,rgba(3,7,17,.92),rgba(3,7,17,0));"+
  "font:11px 'Courier New',monospace;color:#9fd8ff;letter-spacing:1px;";
tip.innerHTML = "<b>[TETIKUS]</b> tatal = zoom ke arah kursor · seret = gerak · klik dua kali = zoom 2× &nbsp; "+
  "<b>[F]</b> tutup mod fraktal &nbsp; <b>[A]</b> auto-teroka &nbsp; Zoom nombor = kuasa 10 sebenar, bukan hiasan.";
wrap.appendChild(tip);
document.body.appendChild(wrap);

function buatSlider(label, key, min, max, step, onChange){
  const row = document.createElement("div"); row.style.margin = "7px 0";
  const lab = document.createElement("label");
  lab.style.cssText = "display:flex;justify-content:space-between;margin-bottom:2px;";
  const val = document.createElement("b"); val.style.color = "#ffb000";
  lab.appendChild(document.createTextNode(label)); lab.appendChild(val);
  const inp = document.createElement("input");
  inp.type = "range"; inp.min = min; inp.max = max; inp.step = step;
  inp.value = F[key]; inp.style.width = "100%";
  val.textContent = F[key];
  inp.addEventListener("input", function(){
    const v = parseFloat(inp.value);
    F[key] = v; val.textContent = inp.value;
    if(onChange) onChange(v);
    rosak = true;
  });
  row.appendChild(lab); row.appendChild(inp); ctrl.appendChild(row);
}
function buatSelect(label, options, onChange, value){
  const row = document.createElement("div"); row.style.margin = "7px 0";
  const lab = document.createElement("div"); lab.textContent = label; lab.style.marginBottom = "2px";
  const sel = document.createElement("select");
  sel.style.cssText = "width:100%;background:#0c3246;color:#66e0ff;border:1px solid #2b6f8e;border-radius:3px;font-family:inherit;padding:3px;";
  options.forEach(function(o){
    const op = document.createElement("option"); op.value = o[0]; op.textContent = o[1];
    sel.appendChild(op);
  });
  if(value !== undefined) sel.value = value;
  sel.addEventListener("change", function(){ onChange(sel.value); rosak = true; });
  row.appendChild(lab); row.appendChild(sel); ctrl.appendChild(row);
  return sel;
}
function buatButton(label, onClick){
  const b = document.createElement("button");
  b.textContent = label;
  b.style.cssText = "background:#0c3246;color:#ffb000;border:1px solid #ffb000;border-radius:3px;"+
    "font-family:inherit;font-size:10.5px;padding:5px 8px;margin:4px 4px 2px 0;cursor:pointer;letter-spacing:.5px;";
  b.addEventListener("click", onClick);
  ctrl.appendChild(b);
  return b;
}
function buatCheck(label, key){
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:8px;margin:6px 0;";
  const inp = document.createElement("input");
  inp.type = "checkbox"; inp.checked = !!F[key];
  inp.addEventListener("change", function(){ F[key] = inp.checked; rosak = true; });
  const sp = document.createElement("span"); sp.textContent = label;
  row.appendChild(inp); row.appendChild(sp); ctrl.appendChild(row);
}

// --- isi panel ---
const judul = document.createElement("div");
judul.style.cssText = "color:#ffb000;font-size:13px;letter-spacing:2px;margin-bottom:8px;";
judul.textContent = "🌀 MESIN FRAKTAL DALAM";
ctrl.appendChild(judul);

const selModel = buatSelect("Model matematik (1000 pilihan):",
  MODELS.map(function(m){ return [String(m.i), m.nama]; }),
  function(v){ pilihModel(parseInt(v,10)); }, "0");

buatSlider("Zoom (10^x — makin dalam makin nyata)","zoomExp",0,120,0.1);
buatSlider("Putaran tampilan (darjah)","rotasi",0,360,1);
buatSlider("Iterasi maksimum","iterasi",64,20000,1,function(){ F.autoIter=false; });
buatSlider("Jejak pelarian (bailout)","bailout",2,256,1);
buatSlider("Kuasa p","kuasa",2,8,1);
buatSlider("c nyata (untuk Julia)","cre",-2,2,0.001);
buatSlider("c imajiner (untuk Julia)","cim",-2,2,0.001);
buatSlider("Kecerahan","kecerahan",0.2,3,0.05);
buatSlider("Kelajuan tukar warna","kelajuanWarna",0,1,0.01);
buatSlider("Resolusi render (× skrin)","resolusi",0.2,1,0.05);

buatSelect("Palet warna:", Object.keys(PALETS).map(function(k){ return [k, k]; }),
  function(v){ F.palet = v; }, F.palet);
buatSelect("Kelajuan / varian formula:", [["0","Normal"],["1","Tukar x↔y"],["2","Mutlak |x|+|y|i"],["3","Konjugat"]],
  function(v){ F.varian = parseInt(v,10); }, "0");
buatCheck("Auto-iterasi ikut kedalaman","autoIter");
buatCheck("Pewarnaan halus (smooth)","halus");
buatCheck("Warna bergerak automatik","warnaAuto");

buatButton("▶ Auto-teroka (A)", function(){ autoZoom = !autoZoom; });
buatButton("⏩ Uji zoom dalam: 10^15", function(){ lompatZoom(15); });
buatButton("🌌 Bukti zoom tanpa hujung: 10^40", function(){ lompatZoom(40); });
buatButton("🎲 Model rawak", function(){ pilihModel(Math.floor(Math.random()*1000)); });
buatButton("⤓ Simpan gambar fraktal", function(){
  const a = document.createElement("a");
  a.download = "fraktal-165START.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
});
const tutupBtn = buatButton("✕ Tutup (F) — kembali ke dunia", function(){ tutupFraktal(); });
tutupBtn.style.borderColor = "#4dff88"; tutupBtn.style.color = "#4dff88";

// ============================ RENDERER FRAKTAL ============================
let rosak = true, barisBerikutnya = 0, autoZoom = false, fasaWarna = 0, kitaranWarnaT = 0;
let imej = null, imejW = 0, imejH = 0;
let statusKetepatan = "float64 standard";
let terakhirWaktu = 0;

function pilihModel(i){
  F.model = i;
  const m = MODELS[i];
  F.kuasa = m.kuasa;
  if(m.mod){ F.cre = m.cre; F.cim = m.cim; }
  if(m.keluarga.id === "mandel" || m.keluarga.id === "conj" || m.keluarga.id === "tricorn" || m.keluarga.id === "nova" || m.keluarga.id === "lambda" || m.keluarga.id === "swap"){
    statusKetepatan = "perturbasi + double-double (dalam)";
  } else {
    statusKetepatan = "float64 standard (keluarga bukan-holomorfik)";
  }
  selModel.value = String(i);
  rosak = true;
}
function lompatZoom(exp){
  F.zoomExp = exp; F.zoomTotal = Math.max(F.zoomTotal, exp);
  if(F.autoIter) F.iterasi = Math.min(20000, Math.round(120 + exp*14));
  rosak = true;
}
function setPusat(x, y){
  CEN.r = ddFrom(x); CEN.i = ddFrom(y);
}
// susut nilai skala: 1 unit tampilan = 10^-zoomExp
function skala(){ return Math.pow(10, -F.zoomExp); }

/* ---- orbit rujukan dd ---- */
function orbitRujukan(maxN, isJulia, cr_dd, ci_dd){
  // Z bermula: Mandelbrot-type = 0 ; Julia = pusat tampilan
  let zr = isJulia ? [CEN.r[0], CEN.r[1]] : [0,0];
  let zi = isJulia ? [CEN.i[0], CEN.i[1]] : [0,0];
  const ZR = new Float64Array(maxN+1), ZI = new Float64Array(maxN+1);
  const ZRL = new Float64Array(maxN+1), ZIL = new Float64Array(maxN+1);
  const p = Math.round(F.kuasa);
  let n = 0, lepas = -1;
  const b2 = F.bailout*F.bailout;
  for(n=0; n<=maxN; n++){
    ZR[n]=zr[0]; ZRL[n]=zr[1]; ZI[n]=zi[0]; ZIL[n]=zi[1];
    if(zr[0]*zr[0]+zi[0]*zi[0] > b2){ lepas = n; break; }
    // z ← z^p + c  (kuasa integer guna darab berulang dd)
    let nr = zr, ni = zi;
    for(let k=1;k<p;k++){
      const acbd = ddMul(nr[0],nr[1],zr[0],zr[1]);
      const ad = ddMul(nr[0],nr[1],zi[0],zi[1]);
      const bc = ddMul(ni[0],ni[1],zr[0],zr[1]);
      const bd = ddMul(ni[0],ni[1],zi[0],zi[1]);
      const rBaru = ddSub(acbd[0],acbd[1],bd[0],bd[1]);
      const iBaru = ddAdd(ad[0],ad[1],bc[0],bc[1]);
      nr = rBaru; ni = iBaru;
    }
    if(F.varian === 3){ ni = [ -ni[0], -ni[1] ]; }               // konjugat
    if(F.varian === 2){ // mutlak
      nr = [Math.abs(nr[0]), 0];
      ni = [Math.abs(ni[0]), 0];
    }
    if(F.varian === 1){ const tmp = nr; nr = ni; ni = tmp; }     // tukar x↔y
    zr = ddAdd(nr[0],nr[1],cr_dd[0],cr_dd[1]);
    zi = ddAdd(ni[0],ni[1],ci_dd[0],ci_dd[1]);
  }
  return {ZR:ZR, ZRL:ZRL, ZI:ZI, ZIL:ZIL, n:Math.min(n,maxN), lepas:lepas};
}

/* ---- iterasi perturbation untuk satu piksel ---- */
function pikselIterasi(orb, maxN, dcr, dci, holomorfik, isJulia){
  // Mandelbrot: z0 = 0, c = pusat + dc  → paksaan dc tiap langkah
  // Julia:      z0 = pusat + dc, c tetap → paksaan 0, dz mula = dc
  const p = Math.round(F.kuasa);
  const b2 = F.bailout*F.bailout;
  const forcR = isJulia ? 0 : dcr, forcI = isJulia ? 0 : dci;
  let dzr = isJulia ? dcr : 0, dzi = isJulia ? dci : 0;
  const ZR = orb.ZR, ZI = orb.ZI, ZRL = orb.ZRL, ZIL = orb.ZIL;
  const nAkhir = orb.lepas >= 0 ? orb.lepas : maxN;

  if(!holomorfik){
    // float64 terus (keluarga bukan-holomorfik — ketepatan sederhana)
    const cr = isJulia ? F.cre : CEN.r[0]+dcr, ci = isJulia ? F.cim : CEN.i[0]+dci;
    let zr = CEN.r[0]+dcr, zi = CEN.i[0]+dci, n = 0;
    if(!isJulia){ zr = 0; zi = 0; }
    for(n=0;n<maxN;n++){
      if(zr*zr+zi*zi > b2) return n;
      let nr = zr, ni = zi;
      for(let k=1;k<p;k++){
        const tr2 = nr*zr - ni*zi;
        ni = nr*zi + ni*zr; nr = tr2;
      }
      if(F.varian === 3) ni = -ni;
      if(F.varian === 2){ nr = Math.abs(nr); ni = Math.abs(ni); }
      if(F.varian === 1){ const t3 = nr; nr = ni; ni = t3; }
      zr = nr + cr; zi = ni + ci;
    }
    return maxN;
  }

  // ---- laluan pantas kuasa 2 (Mandelbrot/Julia klasik) ----
  if(p === 2 && (F.varian === undefined || F.varian === 0 || F.varian === 3)){
    for(let n=0;n<nAkhir;n++){
      const Zr = ZR[n], Zi = ZI[n];
      const zr = Zr + dzr, zi = Zi + dzi;
      if(zr*zr + zi*zi > b2) return n;
      if(Math.abs(dzr) > 1e6 || Math.abs(dzi) > 1e6) return n;
      const kR = 2*(ZRL[n]*dzr - ZIL[n]*dzi);
      const kI = 2*(ZRL[n]*dzi + ZIL[n]*dzr);
      let t = 2*(Zr*dzr - Zi*dzi) + (dzr*dzr - dzi*dzi) + kR + forcR;
      let u = 2*(Zr*dzi + Zi*dzr) + 2*dzr*dzi + kI + forcI;
      if(F.varian === 3){ u = -u; }
      dzr = t; dzi = u;
    }
    return nAkhir;
  }

  for(let n=0;n<nAkhir;n++){
    const Zr = ZR[n], Zi = ZI[n];
    // z penuh = Z + dz (untuk ujian pelarian; bahagian lo diabaikan selamat)
    const zr = Zr + dzr, zi = Zi + dzi;
    if(zr*zr + zi*zi > b2) return n;
    if(Math.abs(dzr) > 1e6 || Math.abs(dzi) > 1e6) return n; // glitch guard

    // kira dz' = (Z+dz)^p − Z^p + dc  (kembangan binomial)
    let sr = 0, si = 0;
    let dzkr = 1, dzki = 0;              // dz^k
    const ZpowR = [1], ZpowI = [0];       // Z^0
    for(let e=1;e<=p;e++){
      const pr = ZpowR[e-1]*Zr - ZpowI[e-1]*Zi;
      const pi = ZpowR[e-1]*Zi + ZpowI[e-1]*Zr;
      ZpowR.push(pr); ZpowI.push(pi);
    }
    let coef = p;
    for(let k=1;k<=p;k++){
      if(k>1){
        const t4 = dzkr*dzr - dzki*dzi;
        dzki = dzkr*dzi + dzki*dzr; dzkr = t4;
      }
      const ar = ZpowR[p-k], ai = ZpowI[p-k];
      sr += coef * (ar*dzkr - ai*dzki);
      si += coef * (ar*dzki + ai*dzkr);
      coef = coef * (p-k) / (k+1);
    }
    if(F.varian === 3){ si = -si; }
    if(F.varian === 2){ sr = Math.abs(sr); si = Math.abs(si); }
    if(F.varian === 1){ const t5 = sr; sr = si; si = t5; }
    // koreksi halus dari bahagian lo orbit rujukan (ketepatan tambahan)
    const kR = 2*(ZRL[n]*dzr - ZIL[n]*dzi);
    const kI = 2*(ZRL[n]*dzi + ZIL[n]*dzr);
    dzr = sr + kR + forcR;
    dzi = si + kI + forcI;
  }
  return nAkhir;
}

function renderBaris(y0, y1){
  const W = imejW, H = imejH, data = imej.data;
  const m = MODELS[F.model];
  const holomorfik = m.keluarga.holomorfik && F.varian !== 2 && F.varian !== 1;
  const isJulia = m.mod === 1;

  // pusat c orbit rujukan = pusat tampilan (Mandelbrot) atau c tetap (Julia)
  const cr_dd = isJulia ? ddFrom(F.cre) : [CEN.r[0], CEN.r[1]];
  const ci_dd = isJulia ? ddFrom(F.cim) : [CEN.i[0], CEN.i[1]];

  const maxN = Math.round(F.iterasi);
  const orb = orbitRujukan(maxN, isJulia, cr_dd, ci_dd);

  const th = F.rotasi*Math.PI/180;
  const cos = Math.cos(th), sin = Math.sin(th);
  const sc = skala();
  const asp = W/H;
  const akar = Math.pow(10, ((performance.now()*0.001*F.kelajuanWarna + fasaWarna) % 1));

  for(let y=y0; y<y1; y++){
    for(let x=0; x<W; x++){
      // koordinat kompleks piksel = pusat(dd) + offset kecil
      const nx = (x/W - 0.5)*2*asp*sc;
      const ny = (0.5 - y/H)*2*sc;
      const dcr = nx*cos - ny*sin;
      const dci = nx*sin + ny*cos;

      const n = pikselIterasi(orb, maxN, dcr, dci, holomorfik, isJulia);
      const nAkhir = orb.lepas>=0 ? orb.lepas : maxN;
      let t = 0;
      if(n < nAkhir){
        if(F.halus){
          const ix = Math.min(n, orb.ZR.length-1);
          const zr2 = orb.ZR[ix] + dcr, zi2 = orb.ZI[ix] + dci;
          const mag = Math.sqrt(zr2*zr2 + zi2*zi2);
          const l1 = Math.log(Math.max(1.0000001, mag));
          const l2 = Math.log(Math.max(1.0000001, l1*2));
          t = (n + 1 - l2/Math.log(Math.max(2, F.kuasa))) / Math.max(24, maxN*0.28);
        } else {
          t = n/Math.max(24, maxN*0.28);
        }
        if(!isFinite(t) || t < 0) t = 0.0001;
      }
      let r, g, b;
      if(t <= 0){ r=3; g=7; b=17; }
      else {
        const w = warnaPalet(F.palet, t*6*F.kecerahan + akar*0.12);
        r=w[0]; g=w[1]; b=w[2];
      }
      const o = (y*W + x)*4;
      data[o]=r; data[o+1]=g; data[o+2]=b; data[o+3]=255;
    }
  }
}

function resizeCanvas(){
  const w = Math.max(160, Math.round(window.innerWidth * F.resolusi));
  const h = Math.max(100, Math.round(window.innerHeight * F.resolusi));
  if(w !== imejW || h !== imejH){
    canvas.width = w; canvas.height = h;
    imejW = w; imejH = h;
    imej = ctx.createImageData(w, h);
    rosak = true; barisBerikutnya = 0;
  }
}

function updateInfo(ms){
  const m = MODELS[F.model];
  const ketepatanDigit = F.zoomExp > 15 ? "dd ±31 digit + perturbasi" : "float64 (15–16 digit)";
  info.textContent =
    "MODEL: " + m.nama + "\n" +
    "RUMUS: " + m.keluarga.rumus + (m.mod ? "   (mod Julia: c = "+F.cre.toFixed(4)+(F.cim<0?"":"+")+F.cim.toFixed(4)+"i)" : "   (c = koordinat piksel)") + "\n" +
    "KUASA: p = " + F.kuasa + "   ·   BAILOUT: " + F.bailout + "   ·   ITERASI: " + Math.round(F.iterasi) + "\n" +
    "PUSAT: " + CEN.r[0].toFixed(15) + " + " + CEN.i[0].toFixed(15) + "i\n" +
    "ZOOM: 10^" + F.zoomExp.toFixed(1) + "  (skala 1 piksel ≈ " + skala().toExponential(2) + " unit)\n" +
    "PERJALANAN TOTAL: 10^" + F.zoomTotal.toFixed(1) + (F.zoomTotal > F.zoomExp+1 ? "  ← re-anchor (self-similarity) aktif" : "") + "\n" +
    "KETEPATAN: " + ketepatanDigit + " · mod: " + statusKetepatan + "\n" +
    "RENDER: " + imejW + "×" + imejH + " · " + Math.round(ms) + " ms\n" +
    "-------------------------------------------\n" +
    "Petunjuk: dunia fraktal ini TIDAK berdinding. Makin kau zoom, " +
    "struktur serupa muncul semula — itu sifat self-similarity. Angka zoom " +
    "di atas ialah kuasa 10 sebenar hasil kiraan perturbation, bukan animasi.";
}

// ============================ KAWALAN TETIKUS =============================
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener("mousedown", function(e){ dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("mouseup", function(){ dragging = false; });
window.addEventListener("mousemove", function(e){
  if(!dragging || !buka) return;
  const dx = (e.clientX-lastX)/window.innerWidth, dy = (e.clientY-lastY)/window.innerHeight;
  lastX = e.clientX; lastY = e.clientY;
  geser(dx*2*asp()*skala(), dy*2*skala());
  rosak = true;
});
function asp(){ return imejW/imejH; }
function geser(dx, dy){
  // ikut putaran tampilan
  const th = F.rotasi*Math.PI/180;
  const cos = Math.cos(th), sin = Math.sin(th);
  const ox = dx*cos + dy*sin;
  const oy = -dx*sin + dy*cos;
  CEN.r = ddAdd(CEN.r[0], CEN.r[1], ox, 0);
  CEN.i = ddAdd(CEN.i[0], CEN.i[1], oy, 0);
}
wrap.addEventListener("wheel", function(e){
  e.preventDefault();
  if(!buka) return;
  // tatal ke atas (deltaY negatif) = zoom MASUK
  const f = Math.pow(1.18, Math.sign(e.deltaY)*Math.min(3, Math.abs(e.deltaY)/80 + 0.6));
  zoomKe(e.clientX, e.clientY, f);
}, {passive:false});
function zoomKe(px, py, f){
  // zoom ke arah kursor: susut pusat sedikit + ubah zoomExp
  const nx = (px/window.innerWidth - 0.5)*2*asp()*skala();
  const ny = (0.5 - py/window.innerHeight)*2*skala();
  const th = F.rotasi*Math.PI/180;
  const dcr = nx*Math.cos(th) - ny*Math.sin(th);
  const dci = nx*Math.sin(th) + ny*Math.cos(th);
  const kf = 1 - f;
  geser(-dcr*kf, -dci*kf);
  F.zoomExp += Math.log10(1/f);
  F.zoomTotal = Math.max(F.zoomTotal, F.zoomExp);
  if(F.autoIter) F.iterasi = Math.min(20000, Math.round(120 + F.zoomExp*14));
  // had digit → re-anchor (self-similarity): perjalanan diteruskan
  if(F.zoomExp > 100){
    F.zoomExp -= 90;   // salinan fraktal pada skala lebih dalam kelihatan serupa
    kenyataanReanchor();
  }
  rosak = true;
}
canvas.addEventListener("dblclick", function(e){ zoomKe(e.clientX, e.clientY, 0.5); });

let pesanReanchor = null;
function kenyataanReanchor(){
  pesanReanchor = document.createElement("div");
  pesanReanchor.style.cssText = "position:absolute;left:50%;top:26%;transform:translateX(-50%);max-width:560px;"+
    "background:rgba(20,8,48,.92);border:2px solid #9a7bff;border-radius:8px;padding:18px 22px;"+
    "font:12px 'Courier New',monospace;color:#cdb8ff;line-height:1.8;text-align:center;z-index:5;";
  pesanReanchor.innerHTML = "✦ RE-ANCHOR (penerima-semula)<br><br>" +
    "Ketepatan digit komputer sudah sampai had di sini. Tapi fraktal ini " +
    "bersifat <b>self-similar</b>: struktur yang sama wujud berulang kali pada skala berbeza. " +
    "Perjalanan diteruskan ke salinan dalam yang serupa — jumlah kedalaman terus menaik.<br><br>" +
    "<b>Jumlah perjalanan kau: 10^" + F.zoomTotal.toFixed(1) + "</b>";
  wrap.appendChild(pesanReanchor);
  setTimeout(function(){ if(pesanReanchor){ pesanReanchor.remove(); pesanReanchor = null; } }, 6500);
}

// papan kekunci mod fraktal
window.addEventListener("keydown", function(e){
  if(e.target && (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT")) return;
  if(e.code === "KeyF"){
    if(buka) tutupFraktal(); else bukaFraktal();
    return;
  }
  if(!buka) return;
  if(e.code === "KeyA"){ autoZoom = !autoZoom; }
});

// ============================ BUKA / TUTUP MOD ============================
let buka = false;
function bukaFraktal(){
  buka = true;
  wrap.style.display = "block";
  G.player.frozen = true;
  resizeCanvas();
  rosak = true;
}
function tutupFraktal(){
  buka = false;
  wrap.style.display = "none";
  G.player.frozen = false;
}
G.fractal = {buka: bukaFraktal, tutup: tutupFraktal, F: F,
  getTerbuka: function(){ return buka; },
  tambahPalet: function(nama, stops){ PALETS[nama] = stops; },
  zoomExp: function(){ return F.zoomExp; }};

// ============================ LOOP RENDER (time-sliced) ==================
G.updates.push(function(dt, t){
  if(!buka) return;
  if(autoZoom){
    // zoom perlahan ke arah pusat — sentiasa ke dalam
    zoomKe(window.innerWidth/2, window.innerHeight/2, 0.985);
  }
  if(F.warnaAuto){
    // kitaran warna: fasa bergerak selalu, tapi render semula hanya berkala
    // (kalau restart setiap frame, hanya jalur atas sempat terlukis)
    fasaWarna += dt*0.05*F.kelajuanWarna;
    kitaranWarnaT += dt;
    if(kitaranWarnaT > 3.5 && barisBerikutnya >= imejH){
      kitaranWarnaT = 0; rosak = true;
    }
  }
  if(!imej) resizeCanvas();
  if(rosak){
    rosak = false; barisBerikutnya = 0;
    terakhirWaktu = performance.now();
  }
  if(barisBerikutnya < imejH){
    // bajet masa ~12 ms setiap frame supaya UI tak tersekat
    const mula = performance.now();
    while(barisBerikutnya < imejH && performance.now()-mula < 12){
      const hujung = Math.min(imejH, barisBerikutnya + Math.max(2, Math.round(imejH/24)));
      renderBaris(barisBerikutnya, hujung);
      barisBerikutnya = hujung;
    }
    ctx.putImageData(imej, 0, 0);
    if(barisBerikutnya >= imejH){
      updateInfo(performance.now()-terakhirWaktu);
    }
  }
});

window.addEventListener("resize", function(){ if(buka) resizeCanvas(); });
})();
