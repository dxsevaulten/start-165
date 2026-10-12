/* ============================================================================
   50-ugc.js — SANDBOX UGC: BINA · DUNIA/SERVER · PLUGIN · FIZIK
   ----------------------------------------------------------------------------
   Konsep: Roblox + Minecraft + Grasshopper dalam satu — apa-apa yang dibina
   jadi hasil sebenar dalam dunia tanpa batas.
   · Editor: letak, padam, pusing, skala objek (papan kekunci + panel).
   · Dunia/server tanpa had: simpan/muat/muat naik/muat turun sebagai JSON.
   · Plugin: JavaScript (sandbox fungsi) DAN mana-mana bahasa lain yang
     dikompil ke WebAssembly (kontrak eksport: height(x,z)->f64).
   · Fizik: graviti + lantunan mudah untuk objek yang dibina.
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME, THREE = G.THREE, scene = G.scene;

// ============================ SENARAI OBJEK DUNIA =========================
const objek = [];              // semua objek yang dibina pemain
let objekSasaran = null;       // objek yang sedang disasarkan (untuk edit)
const statusBina = document.createElement("div");
statusBina.style.cssText = "position:fixed;right:16px;bottom:52px;z-index:35;display:none;max-width:320px;"+
  "background:rgba(6,28,20,.85);border:2px solid #4dff88;border-radius:6px;padding:10px 12px;"+
  "font:11px 'Courier New',monospace;color:#4dff88;line-height:1.7;";
document.body.appendChild(statusBina);

function refreshStatus(){
  if(!modBina){
    statusBina.style.display = "none";
    return;
  }
  statusBina.style.display = "block";
  statusBina.innerHTML =
    "<b>MOD BINA AKTIF</b> · objek dalam dunia: " + objek.length + "<br>" +
    "<b>[E]</b> letak aset di sasaran &nbsp; <b>[X]</b> padam objek disasarkan<br>" +
    "<b>[Q]</b> pusing objek &nbsp; <b>[Z]</b> skala besar &nbsp; <b>[N]</b> skala kecil<br>" +
    "Sasaran: " + (objekSasaran ? (objekSasaran.name || "objek") : "— (halakan pandangan ke objek)");
}

// ============================ SASARAN (raycast ringan) ====================
function titikSasaran(){
  // berjalan di sepanjang ray kamera sehingga jatuh bawah rupa bumi
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir);
  const p = G.camera.position.clone();
  for(let i=0;i<70;i++){
    p.addScaledVector(dir, 2.2);
    const gh = G.groundHeight ? G.groundHeight(p.x, p.z) : 0;
    if(p.y <= gh + 0.2) return p;
  }
  return p;
}
function cariObjekSasaran(){
  const dir = new THREE.Vector3();
  G.camera.getWorldDirection(dir);
  const p = G.camera.position;
  let terbaik = null, jarakTerbaik = 14;  // unit
  for(const o of objek){
    const v = o.position.clone().sub(p);
    const proj = v.dot(dir);
    if(proj < 2 || proj > 70) continue;
    const tepi = v.sub(dir.clone().multiplyScalar(proj)).length();
    const anggar = 4 * (o.scale ? o.scale.x : 1);
    if(tepi < Math.max(2.5, anggar) && proj < jarakTerbaik + 4){
      terbaik = o; jarakTerbaik = proj;
    }
  }
  objekSasaran = terbaik;
}

// ============================ API UGC =====================================
G.ugc = {
  objek: objek,
  tambah: function(obj, deskriptor){
    if(deskriptor) obj.userData.deskriptor = deskriptor;
    if(!obj.userData.deskriptor) obj.userData.deskriptor = {sumber:"param", jenis:(G.assetgen && G.assetgen.P.jenis)||"tabung"};
    objek.push(obj);
    scene.add(obj);
    refreshStatus();
    return obj;
  },
  padam: function(obj){
    const i = objek.indexOf(obj);
    if(i >= 0) objek.splice(i, 1);
    scene.remove(obj);
    if(objekSasaran === obj) objekSasaran = null;
    refreshStatus();
  },
  bersih: function(){
    while(objek.length){ scene.remove(objek.pop()); }
    objekSasaran = null;
    refreshStatus();
  },
  sasaran: function(){ return objekSasaran; },
  refresh: refreshStatus
};

// ============================ MOD BINA + KAWALAN ==========================
let modBina = false;
function setModBina(v){
  modBina = v;
  refreshStatus();
}
window.addEventListener("keydown", function(e){
  if(e.target && (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT")) return;
  if(G.fractal && G.fractal.getTerbuka()) return;   // jangan ganggu mod fraktal
  if(e.code === "KeyB"){ setModBina(!modBina); }
  if(!modBina) return;
  if(e.code === "KeyE"){
    const titik = titikSasaran();
    const jenis = (G.assetgen && G.assetgen.P.jenis) || "tabung";
    const obj = G.assetgen ? G.assetgen.binaAset() : new THREE.Mesh(new THREE.BoxGeometry(3,3,3), new THREE.MeshStandardMaterial());
    obj.position.copy(titik);
    obj.position.y = Math.max(obj.position.y, (G.groundHeight ? G.groundHeight(titik.x, titik.z) : 0));
    obj.name = "binaan-" + (objek.length+1);
    G.ugc.tambah(obj, {sumber:"param", jenis:jenis, P: G.assetgen ? JSON.parse(JSON.stringify(G.assetgen.P)) : null});
  }
  if(e.code === "KeyX" && objekSasaran){ G.ugc.padam(objekSasaran); }
  if(e.code === "KeyQ" && objekSasaran){ objekSasaran.rotation.y += Math.PI/12; }
  if(e.code === "KeyZ" && objekSasaran){ objekSasaran.scale.multiplyScalar(1.15); }
  if(e.code === "KeyN" && objekSasaran){ objekSasaran.scale.multiplyScalar(1/1.15); }
});

// ============================ FIZIK MUDAH =================================
const fizik = {aktif:false, graviti:12, lantunan:0.42};
function updateFizik(dt){
  if(!fizik.aktif) return;
  for(const o of objek){
    if(o.userData.tanah) continue;
    if(o.userData.vy === undefined){
      o.userData.vy = 0;
      const box = new THREE.Box3().setFromObject(o);
      o.userData.tinggiObj = Math.max(0.5, box.max.y - box.min.y);
    }
    o.userData.vy -= fizik.graviti*dt;
    o.position.y += o.userData.vy*dt;
    const gh = G.groundHeight ? G.groundHeight(o.position.x, o.position.z) : 0;
    const lantai = gh + (o.userData.tinggiObj||2)*0.5;
    if(o.position.y <= lantai){
      o.position.y = lantai;
      if(Math.abs(o.userData.vy) < 1.2){ o.userData.vy = 0; o.userData.tanah = true; }
      else o.userData.vy = -o.userData.vy * fizik.lantunan;
    }
  }
}
G.updates.push(updateFizik);
G.updates.push(function(dt, t){
  if(modBina){
    cariObjekSasaran();
    refreshStatus();
  }
});

// ============================ DUNIA / SERVER ==============================
// simpanan: localStorage "165worlds" = { namaDunia: {...} }
const BENDA_KEY = "165worlds";
function muatSemuaDunia(){
  try{ return JSON.parse(localStorage.getItem(BENDA_KEY) || "{}"); }
  catch(e){ return {}; }
}
function simpanDunia(nama, data){
  const semua = muatSemuaDunia();
  semua[nama] = data;
  try{ localStorage.setItem(BENDA_KEY, JSON.stringify(semua)); }
  catch(e){ alert("Gagal simpan (storan penuh?): " + e.message); }
  isiSenaraiDunia();
}
function serialisasiDunia(){
  return {
    versi: 1,
    seed: (G.duniaSeed !== undefined ? G.duniaSeed : 165),
    masa: Date.now(),
    objek: objek.map(function(o){
      return {
        d: o.userData.deskriptor,
        pos: [o.position.x, o.position.y, o.position.z],
        rot: [o.rotation.x, o.rotation.y, o.rotation.z],
        skala: [o.scale.x, o.scale.y, o.scale.z],
        nama: o.name
      };
    })
  };
}
function binaSemulaObjek(rec){
  let obj = null;
  if(rec.d && rec.d.sumber === "ai" && G.assetgen && rec.d.gambar){
    // bina semula aset AI dari gambar sumber
    const img = new Image();
    img.onload = function(){
      const c = document.createElement("canvas"); c.width = c.height = 64;
      c.getContext("2d").drawImage(img, 0, 0, 64, 64);
      const analisis = G.assetgen.analisisGambar(c);
      const o2 = G.assetgen.binaDariGambar(analisis);
      pasang(o2);
    };
    img.src = rec.d.gambar;
    return;
  } else if(G.assetgen && rec.d && rec.d.P){
    const P = G.assetgen.P;
    const lama = {jenis:P.jenis, tinggi:P.tinggi, lebar:P.lebar, segmen:P.segmen, twist:P.twist, taper:P.taper, tebal:P.tebal};
    Object.assign(P, rec.d.P);
    obj = G.assetgen.binaAset();
    Object.assign(P, lama);
  } else {
    obj = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), new THREE.MeshStandardMaterial({color:0x8fd3ff}));
  }
  pasang(obj);
  function pasang(o){
    o.position.set(rec.pos[0], rec.pos[1], rec.pos[2]);
    o.rotation.set(rec.rot[0], rec.rot[1], rec.rot[2]);
    o.scale.set(rec.skala[0], rec.skala[1], rec.skala[2]);
    o.name = rec.nama || "";
    G.ugc.tambah(o, rec.d || null);
  }
}
function muatDunia(nama){
  const semua = muatSemuaDunia();
  const d = semua[nama];
  if(!d) return;
  G.ugc.bersih();
  (d.objek||[]).forEach(binaSemulaObjek);
  refreshStatus();
}

// UI panel dunia
const PNL = G.panel;
PNL.group("🌍 DUNIA / SERVER (tanpa had)");
const namaDuniaInp = document.createElement("input");
namaDuniaInp.type = "text";
namaDuniaInp.placeholder = "nama dunia / server…";
namaDuniaInp.value = "Dunia Pertamaku";
namaDuniaInp.style.cssText = "width:100%;background:#0c3246;color:#4dff88;border:1px solid #2b6f8e;"+
  "border-radius:3px;font-family:inherit;font-size:11px;padding:5px;margin:6px 0;";
PNL.body.appendChild(namaDuniaInp);

const rowSel = document.createElement("div"); rowSel.className = "row";
const lblSel = document.createElement("label"); lblSel.innerHTML = "<span>Dunia tersimpan</span>";
const selDunia = document.createElement("select");
selDunia.style.cssText = "width:100%;background:#0c3246;color:#66e0ff;border:1px solid #2b6f8e;border-radius:3px;font-family:inherit;padding:3px;";
rowSel.appendChild(lblSel); rowSel.appendChild(selDunia);
PNL.body.appendChild(rowSel);
function isiSenaraiDunia(){
  const semua = muatSemuaDunia();
  selDunia.innerHTML = "";
  Object.keys(semua).forEach(function(n){
    const op = document.createElement("option"); op.value = n; op.textContent = n;
    selDunia.appendChild(op);
  });
}
isiSenaraiDunia();

PNL.button({label:"💾 Simpan dunia semasa", onClick:function(){
  simpanDunia(namaDuniaInp.value || "tanpa-nama", serialisasiDunia());
}});
PNL.button({label:"📂 Muat dunia terpilih", onClick:function(){
  if(selDunia.value){ namaDuniaInp.value = selDunia.value; muatDunia(selDunia.value); }
}});
PNL.button({label:"🗑 Padam dunia terpilih", onClick:function(){
  if(!selDunia.value) return;
  const semua = muatSemuaDunia();
  delete semua[selDunia.value];
  localStorage.setItem(BENDA_KEY, JSON.stringify(semua));
  isiSenaraiDunia();
}});
PNL.button({label:"⤓ Eksport dunia (fail JSON)", onClick:function(){
  const blob = new Blob([JSON.stringify(serialisasiDunia(), null, 1)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (namaDuniaInp.value || "dunia") + ".165world.json";
  a.click();
}});
const rowImp = document.createElement("div"); rowImp.className = "row";
const impInp = document.createElement("input");
impInp.type = "file"; impInp.accept = ".json,application/json";
impInp.style.cssText = "width:100%;font:10px 'Courier New',monospace;color:#4dff88;";
impInp.addEventListener("change", function(){
  if(!impInp.files[0]) return;
  const rd = new FileReader();
  rd.onload = function(){
    try{
      const d = JSON.parse(rd.result);
      G.ugc.bersih();
      (d.objek||[]).forEach(binaSemulaObjek);
      refreshStatus();
    }catch(err){ alert("Fail JSON tidak sah: " + err.message); }
  };
  rd.readAsText(impInp.files[0]);
});
rowImp.appendChild(impInp);
PNL.body.appendChild(rowImp);

// UI fizik + mod bina
PNL.group("⚙ FIZIK & MOD BINA");
PNL.check({label:"Mod bina (B) — E letak · X padam · Q pusing", key:"modBina", obj:{modBina:false},
  onChange:setModBina});
PNL.check({label:"Fizik: graviti & lantunan", key:"aktif", obj:fizik, onChange:function(){}});
PNL.slider({label:"Graviti", key:"graviti", min:1, max:40, step:0.5, obj:fizik});
PNL.slider({label:"Lantunan", key:"lantunan", min:0, max:0.95, step:0.01, obj:fizik});

// ============================ SISTEM PLUGIN ===============================
// API untuk plugin: JavaScript (sandbox fungsi) atau WebAssembly (mana-mana bahasa)
const API_PLUGIN = {
  registerAssetType: function(kode, nama, fn){
    if(G.assetgen) G.assetgen.tambahJenis(kode, nama, fn);
  },
  registerFormula: function(kunci, nama, fn){
    if(G.MATEMATIKA) G.MATEMATIKA[kunci] = {nama:nama, fn:fn};
  },
  registerMission: function(misi){
    if(G.missions && G.missions.tambah) G.missions.tambah(misi);
    else (G._pendingMissions = G._pendingMissions || []).push(misi);
  },
  registerPalette: function(nama, stops){
    if(G.fractal && G.fractal.tambahPalet) G.fractal.tambahPalet(nama, stops);
  },
  place: function(mesh){ return G.ugc.tambah(mesh); },
  notify: function(teks){ infoPlugin.textContent = teks; },
  G: G
};
G.plugins = {
  api: API_PLUGIN,
  jalankan: function(kod){
    try{
      const fn = new Function("api", "G", kod);
      fn(API_PLUGIN, G);
      G._pluginRan = true;
      infoPlugin.textContent = "✔ Plugin berjaya dimuat (" + kod.length + " aksara).";
    }catch(e){
      infoPlugin.textContent = "✘ Ralat plugin: " + e.message;
    }
  },
  muatWasm: function(buffer, nama){
    // kontrak WebAssembly (mana-mana bahasa): export height(x: f64, z: f64) -> f64
    return WebAssembly.instantiate(buffer, {env:{}}).then(function(h){
      const exp = h.instance.exports;
      if(typeof exp.height === "function"){
        const asal = G.groundHeight || function(){ return 0; };
        G.groundHeight = function(x, z){ return asal(x, z) + exp.height(x, z); };
        infoPlugin.textContent = "✔ Plugin WASM «"+nama+"» aktif — height(x,z) dipasang ke rupa bumi.";
      } else {
        infoPlugin.textContent = "⚠ WASM «"+nama+"» tiada eksport height(x,z). Kontrak: height(x:f64,z:f64)->f64.";
      }
    }).catch(function(e){ infoPlugin.textContent = "✘ WASG ralat: " + e.message; });
  }
};

PNL.group("🧩 PLUGIN (JavaScript / WebAssembly)");
const infoPlugin = document.createElement("div");
infoPlugin.style.cssText = "font:10px 'Courier New',monospace;color:#9fd8ff;background:rgba(10,40,60,.5);"+
  "border:1px dashed #2b6f8e;border-radius:4px;padding:8px;margin:8px 0;white-space:pre-wrap;line-height:1.65;";
infoPlugin.textContent = "Plugin = kod tambahan yang mengembangkan game.\n"+
  "· JavaScript: tampal kod → «Jalankan plugin» (API: api.registerFormula/AssetType/Mission/Palette)\n"+
  "· Mana-mana bahasa (C, Rust, Go, Zig…): kompil ke .wasm dengan eksport height(x,z)->f64 → «Muat plugin .wasm».\n"+
  "Semua luar talian — game ini enjin mandiri.";
PNL.body.appendChild(infoPlugin);

const kotakKod = document.createElement("textarea");
kotakKod.rows = 7;
kotakKod.style.cssText = "width:100%;background:#071c28;color:#4dff88;border:1px solid #2b6f8e;"+
  "border-radius:3px;font:10px 'Courier New',monospace;padding:6px;";
kotakKod.value =
"// contoh plugin: daftar bentuk baharu\n" +
"api.registerAssetType('bolaAjaib','Bola ajaib plugin', function(P){\n" +
"  const THREE = G.THREE;\n" +
"  const g = new THREE.Group();\n" +
"  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(P.lebar, 2),\n" +
"    new THREE.MeshStandardMaterial({color:0xff66cc, metalness:0.7, roughness:0.2}));\n" +
"  m.position.y = P.lebar;\n" +
"  g.add(m);\n" +
"  return g;\n" +
"});\n" +
"api.notify('Plugin contoh siap — cuba pilih \"Bola ajaib plugin\" di panel aset.');";
PNL.body.appendChild(kotakKod);

PNL.button({label:"▶ Jalankan plugin (JavaScript)", onClick:function(){
  G.plugins.jalankan(kotakKod.value);
}});
PNL.button({label:"📋 Muat contoh plugin lain", onClick:function(){
  kotakKod.value =
    "// contoh 2: formula matematika + misi baharu\n" +
    "api.registerFormula('gelombangAneh','Gelombang Aneh (plugin)', function(u,v,p){\n" +
    "  const x=(u-0.5)*p.ukuran*3, z=(v-0.5)*p.ukuran*3;\n" +
    "  return [x, Math.sin(x*p.frekuensi)*Math.cos(z*p.frekuensi*1.7)*p.amplitudo*p.ukuran, z];\n" +
    "});\n" +
    "api.registerMission({judul:'Uji plugin', petunjuk:'Pilih formula \"Gelombang Aneh\".',\n" +
    "  semak:function(G){ return G.getBentuk()==='gelombangAneh'; }, ganjaran:'Plugin Master'});\n" +
    "api.notify('Plugin 2 dimuat: formula \"Gelombang Aneh\" + 1 misi baharu.');";
}});
const rowWasm = document.createElement("div"); rowWasm.className = "row";
const wasmInp = document.createElement("input");
wasmInp.type = "file"; wasmInp.accept = ".wasm,application/wasm";
wasmInp.style.cssText = "width:100%;font:10px 'Courier New',monospace;color:#4dff88;";
wasmInp.addEventListener("change", function(){
  if(!wasmInp.files[0]) return;
  wasmInp.files[0].arrayBuffer().then(function(buf){ G.plugins.muatWasm(buf, wasmInp.files[0].name); });
});
rowWasm.appendChild(wasmInp);
PNL.body.appendChild(rowWasm);

refreshStatus();
})();
