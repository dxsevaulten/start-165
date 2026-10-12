/* ============================================================================
   20-world.js — DUNIA DREAMCORE TANPA BATAS
   ----------------------------------------------------------------------------
   Rumput hijau, bukit, rumah, pokok, bunga, kolam, awan — dijana prosedur
   mengelilingi pemain selama-lamanya. Jauh dari titik mula, dunia mula
   "terdistorsi" (zona tepi) dan selepas itu jadi ZON KOSMIK (retro gelap +
   bintang + formula melayang). Semuanya matematik: bunyi nilai (value noise),
   hash deterministik, tiada fail tekstur besar.
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME, THREE = G.THREE, scene = G.scene;

// ============================ PARAM DUNIA (PARAM) ==========================
const W = {
  seed: 165,          // benih dunia — tukar = dunia baru sepenuhnya
  bukit: 1.0,         // ketinggian bukit (amplitudo rupa bumi)
  kepadatan: 1.0,     // kepadatan hiasan (rumah, pokok, bunga)
  batas: 900,         // jarak dari titik mula sebelum dunia mula terdistorsi
  jarakRender: 420,   // jarak render rupa bumi
  waktu: 0.85,        // 0 = malam · 0.5 = senja · 1 = siang penuh
  autoSiang: false,   // kitaran siang-malam automatik
  awan: true, hiasan: true, bunga: true, cosmic: true, kolam: true
};

// ============================ BUNYI NILAI (value noise) ====================
function h2(x, z){
  const s = Math.sin(x*127.1 + z*311.7 + W.seed*13.37)*43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z){
  const xi=Math.floor(x), zi=Math.floor(z), xf=x-xi, zf=z-zi;
  const u=xf*xf*(3-2*xf), v=zf*zf*(3-2*zf);
  const a=h2(xi,zi), b=h2(xi+1,zi), c=h2(xi,zi+1), d=h2(xi+1,zi+1);
  return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;
}
function fbm(x, z){
  let h=0, amp=1, f=1, tot=0;
  for(let i=0;i<4;i++){ h+=vnoise(x*f, z*f)*amp; tot+=amp; amp*=0.5; f*=2.1; }
  return h/tot;
}
/* ketinggian rupa bumi — SAMA digunakan untuk mesh, pemain & hiasan */
function worldHeight(x, z){
  let h = (fbm(x*0.008+100, z*0.008+100)-0.42)*14*W.bukit;
  // --- zon tepi: dunia mula berpusing/terdistorsi bila jauh dari pusat ---
  const d = Math.sqrt(x*x+z*z);
  const over = Math.max(0, d - W.batas);
  if(over > 0){
    const w = over*0.004;
    h += Math.sin(x*0.021 + w*8)*over*0.035 + Math.cos(z*0.018 - w*6)*over*0.03;
    h += Math.sin((x+z)*0.006 + w*20)*over*0.05;   // gelombang besar aneh
  }
  return h;
}
G.groundHeight = worldHeight;
G.dunia = W;   // dedahkan parameter dunia untuk misi & modul lain

// ============================ TEKSTUR KANVAS RINGAN ========================
function grassTexture(){
  const c=document.createElement("canvas"); c.width=c.height=256;
  const g=c.getContext("2d");
  g.fillStyle="#4fae4c"; g.fillRect(0,0,256,256);
  // lorek rumput + bintik warna (dreamcore berwarna-warni)
  for(let i=0;i<2200;i++){
    const x=Math.random()*256, y=Math.random()*256;
    const t=Math.random();
    g.fillStyle = t<0.72 ? "rgba(30,110,40,0.5)" : (t<0.92 ? "rgba(150,230,120,0.5)" : "rgba(255,255,190,0.55)");
    g.fillRect(x, y, 1.6, 1.6);
  }
  for(let i=0;i<26;i++){ // bunga liar kecil dalam tekstur
    const x=Math.random()*256, y=Math.random()*256;
    g.fillStyle=["#ff8fd0","#ffe27a","#9fd8ff","#fff"][i%4];
    g.beginPath(); g.arc(x,y,1.8,0,Math.PI*2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}
function cloudTexture(){
  const c=document.createElement("canvas"); c.width=c.height=128;
  const g=c.getContext("2d");
  for(let i=0;i<9;i++){
    const x=28+Math.random()*72, y=52+Math.random()*32, r=18+Math.random()*22;
    const gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,"rgba(255,255,255,0.95)"); gr.addColorStop(1,"rgba(255,255,255,0)");
    g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}
function waterTexture(){
  const c=document.createElement("canvas"); c.width=c.height=128;
  const g=c.getContext("2d");
  const gr=g.createLinearGradient(0,0,128,128);
  gr.addColorStop(0,"#37b6e8"); gr.addColorStop(0.5,"#7fe3ff"); gr.addColorStop(1,"#2a86c8");
  g.fillStyle=gr; g.fillRect(0,0,128,128);
  for(let i=0;i<40;i++){
    g.strokeStyle="rgba(255,255,255,0.35)"; g.lineWidth=1.5;
    const y=Math.random()*128;
    g.beginPath(); g.moveTo(0,y);
    for(let x=0;x<=128;x+=8) g.lineTo(x, y+Math.sin(x*0.2+i)*3);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}
function gridDarkTexture(){
  const c=document.createElement("canvas"); c.width=c.height=256;
  const g=c.getContext("2d");
  g.fillStyle="#0b0b22"; g.fillRect(0,0,256,256);
  g.strokeStyle="rgba(150,120,255,0.6)"; g.lineWidth=2;
  for(let i=0;i<=4;i++){ const p=i*64;
    g.beginPath(); g.moveTo(p,0); g.lineTo(p,256); g.moveTo(0,p); g.lineTo(256,p); g.stroke(); }
  return new THREE.CanvasTexture(c);
}
const grassTex = grassTexture();
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(6,6);
const cloudTex = cloudTexture();
const waterTex = waterTexture();
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;

// bahan dikongsi
const trunkMat  = new THREE.MeshStandardMaterial({color:0x8a5a33, roughness:0.85});
const leafMat   = new THREE.MeshStandardMaterial({color:0x3fae5c, roughness:0.7});
const leafMat2  = new THREE.MeshStandardMaterial({color:0x63c86a, roughness:0.7});
const roofMat   = new THREE.MeshStandardMaterial({color:0xd94f4f, roughness:0.6});
const wallMats  = [0xffe9c9,0xffd6e8,0xd6ecff,0xe8ffd6,0xfff3b8,0xe6d6ff].map(function(c){
  return new THREE.MeshStandardMaterial({color:c, roughness:0.55, metalness:0.08});
});
const winMat    = new THREE.MeshStandardMaterial({color:0x9fe8ff, roughness:0.12, metalness:0.75, emissive:0x225577});
const rockMat   = new THREE.MeshStandardMaterial({color:0x9aa4b2, roughness:0.9});
const waterMat  = new THREE.MeshStandardMaterial({map:waterTex, transparent:true, opacity:0.82,
                     roughness:0.12, metalness:0.55, color:0x8fe8ff});
const flowerCols= [0xff5fa2,0xffe14d,0x8f6bff,0xff8c42,0x4dffb0,0xff4d6a];

// geometri dikongsi (penjimatan memori besar)
const GEO = {
  box: new THREE.BoxGeometry(1,1,1),
  trunk: new THREE.CylinderGeometry(0.22,0.32,1,7),
  leafBall: new THREE.SphereGeometry(1,10,8),
  leafCone: new THREE.ConeGeometry(1,1,9),
  roof: new THREE.ConeGeometry(1,1,4),
  sphere: new THREE.SphereGeometry(1,10,8),
  cyl: new THREE.CylinderGeometry(1,1,1,12),
  flower: new THREE.SphereGeometry(0.16,6,5),
  stem: new THREE.CylinderGeometry(0.03,0.03,1,4),
  rock: new THREE.DodecahedronGeometry(1,0)
};

// ============================ WARNA BENUA (kawasan berwarna-warni) =========
const benua = [
  new THREE.Color(0x4fae4c), new THREE.Color(0x63c86a), new THREE.Color(0x3fae7c),
  new THREE.Color(0x7cc242), new THREE.Color(0x2e9e6e), new THREE.Color(0x8fc93d)
];
function warnaBenua(x, z){
  const ix=Math.floor(x/420), iz=Math.floor(z/420);
  return benua[Math.floor(h2(ix*3.1, iz*7.7)*benua.length) % benua.length];
}

// ============================ CHUNK RUPA BUMI TANPA HENTI =================
const CHUNK = 60, SEGS = 10;
const chunks = new Map();
function chunkKey(cx,cz){ return cx+","+cz; }
function makeChunk(cx, cz){
  const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, SEGS, SEGS);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count*3);
  const base = warnaBenua(cx*CHUNK, cz*CHUNK);
  const tmp = new THREE.Color();
  for(let i=0;i<pos.count;i++){
    const x = pos.getX(i) + cx*CHUNK, z = pos.getZ(i) + cz*CHUNK;
    pos.setY(i, worldHeight(x, z));
    const n = 0.82 + 0.36*vnoise(x*0.05, z*0.05);   // variasi warna halus
    tmp.copy(base).multiplyScalar(n);
    cols[i*3]=tmp.r; cols[i*3+1]=tmp.g; cols[i*3+2]=tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols,3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map:grassTex, vertexColors:true, roughness:0.92, metalness:0.02
  }));
  mesh.position.set(cx*CHUNK, 0, cz*CHUNK);
  mesh.receiveShadow = true;
  return mesh;
}

// ============================ HIASAN (sel = petak hiasan) ==================
const SEL = 90;
const cells = new Map();
function makeTree(rnd){
  const g = new THREE.Group();
  const th = 2.2 + rnd()*2.2;
  const trunk = new THREE.Mesh(GEO.trunk, trunkMat);
  trunk.scale.set(1, th, 1); trunk.position.y = th/2;
  g.add(trunk);
  const jenis = Math.floor(rnd()*3);
  if(jenis === 0){            // pokok bulat (dreamcore)
    for(let i=0;i<3;i++){
      const b = new THREE.Mesh(GEO.leafBall, i%2 ? leafMat : leafMat2);
      const s = 1.4 + rnd()*1.2;
      b.scale.setScalar(s);
      b.position.set((rnd()-0.5)*1.6, th + 0.6 + i*0.9, (rnd()-0.5)*1.6);
      g.add(b);
    }
  } else if(jenis === 1){     // pain / kon
    for(let i=0;i<3;i++){
      const c = new THREE.Mesh(GEO.leafCone, leafMat);
      const s = 1.9 - i*0.45;
      c.scale.set(s, 1.6, s); c.position.y = th*0.75 + i*1.15;
      g.add(c);
    }
  } else {                    // pokok buah
    const b = new THREE.Mesh(GEO.leafBall, leafMat2);
    b.scale.setScalar(1.9); b.position.y = th + 0.7;
    g.add(b);
    for(let i=0;i<4;i++){
      const f = new THREE.Mesh(GEO.sphere, new THREE.MeshStandardMaterial({color:0xff6b57, roughness:0.5}));
      f.scale.setScalar(0.28);
      const a = rnd()*Math.PI*2;
      f.position.set(Math.cos(a)*1.4, th+0.2+rnd()*1.3, Math.sin(a)*1.4);
      g.add(f);
    }
  }
  return g;
}
function makeHouse(rnd){
  const g = new THREE.Group();
  const w = 5+rnd()*4, h = 3.4+rnd()*2.2, d = 5+rnd()*3.5;
  const wall = new THREE.Mesh(GEO.box, wallMats[Math.floor(rnd()*wallMats.length)]);
  wall.scale.set(w,h,d); wall.position.y = h/2;
  wall.castShadow = true;
  g.add(wall);
  const roof = new THREE.Mesh(GEO.roof, roofMat);
  roof.scale.set(w*0.92, h*0.62, w*0.92);
  roof.rotation.y = Math.PI/4;
  roof.position.y = h + h*0.31;
  roof.castShadow = true;
  g.add(roof);
  const door = new THREE.Mesh(GEO.box, trunkMat);
  door.scale.set(1.1, 2.1, 0.18); door.position.set(0, 1.05, d/2+0.08);
  g.add(door);
  for(let i=0;i<2;i++){
    const win = new THREE.Mesh(GEO.box, winMat);
    win.scale.set(1.15, 1.15, 0.16);
    win.position.set((i?1:-1)*w*0.27, h*0.58, d/2+0.07);
    g.add(win);
  }
  const chimney = new THREE.Mesh(GEO.box, roofMat);
  chimney.scale.set(0.8,1.6,0.8); chimney.position.set(w*0.26, h+0.9, -d*0.18);
  g.add(chimney);
  g.rotation.y = rnd()*Math.PI*2;
  return g;
}
function makePond(rnd){
  const g = new THREE.Group();
  const r = 4.5 + rnd()*5;
  const w = new THREE.Mesh(new THREE.CircleGeometry(r, 22), waterMat);
  w.rotation.x = -Math.PI/2;
  w.position.y = 0.32;
  g.add(w);
  for(let i=0;i<9;i++){ // batu tepi kolam
    const s = new THREE.Mesh(GEO.rock, rockMat);
    const a = i/9*Math.PI*2;
    s.scale.setScalar(0.6+rnd()*0.7);
    s.position.set(Math.cos(a)*r*1.03, 0.3, Math.sin(a)*r*1.03);
    g.add(s);
  }
  return g;
}
function makeFlower(rnd){
  const g = new THREE.Group();
  const stem = new THREE.Mesh(GEO.stem, leafMat);
  stem.scale.set(1, 0.55+rnd()*0.5, 1); stem.position.y = 0.32;
  const head = new THREE.Mesh(GEO.flower, new THREE.MeshStandardMaterial({
    color: flowerCols[Math.floor(rnd()*flowerCols.length)], roughness:0.55,
    emissive: 0x221111
  }));
  head.position.y = 0.72;
  g.add(stem, head);
  return g;
}
function makeRock(rnd){
  const s = new THREE.Mesh(GEO.rock, rockMat);
  const k = 0.5+rnd()*1.4;
  s.scale.set(k, k*0.7, k);
  s.rotation.set(rnd()*3, rnd()*3, rnd()*3);
  return s;
}
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a>>>15, 1|a);
    t = t + Math.imul(t ^ t>>>7, 61|t) ^ t;
    return ((t ^ t>>>14)>>>0)/4294967296;
  };
}
function makeCell(ix, iz){
  const g = new THREE.Group();
  const rnd = mulberry32((ix*73856093) ^ (iz*19349663) ^ (W.seed*83492791));
  const cx = ix*SEL + SEL/2, cz = iz*SEL + SEL/2;
  const dens = W.kepadatan;
  // rumah (kadang-kadang)
  if(rnd() < 0.28*dens + 0.06){
    const n = rnd() < 0.25 ? 2 : 1;
    for(let i=0;i<n;i++){
      const hx = cx + (rnd()-0.5)*SEL*0.7, hz = cz + (rnd()-0.5)*SEL*0.7;
      const house = makeHouse(rnd);
      house.position.set(hx, worldHeight(hx,hz), hz);
      g.add(house);
    }
  }
  // kolam
  if(W.kolam && rnd() < 0.16){
    const px = cx + (rnd()-0.5)*SEL*0.6, pz = cz + (rnd()-0.5)*SEL*0.6;
    const pond = makePond(rnd);
    pond.position.set(px, worldHeight(px,pz), pz);
    g.add(pond);
  }
  // pokok
  const nTree = Math.round((2 + rnd()*3)*dens);
  for(let i=0;i<nTree;i++){
    const tx = cx + (rnd()-0.5)*SEL*0.92, tz = cz + (rnd()-0.5)*SEL*0.92;
    const tree = makeTree(rnd);
    tree.position.set(tx, worldHeight(tx,tz), tz);
    g.add(tree);
  }
  // bunga & batu
  if(W.bunga){
    const nF = Math.round((5 + rnd()*7)*dens);
    for(let i=0;i<nF;i++){
      const fx = cx + (rnd()-0.5)*SEL*0.95, fz = cz + (rnd()-0.5)*SEL*0.95;
      const f = makeFlower(rnd);
      f.position.set(fx, worldHeight(fx,fz), fz);
      g.add(f);
    }
  }
  for(let i=0;i<2;i++){
    const rx = cx + (rnd()-0.5)*SEL*0.9, rz = cz + (rnd()-0.5)*SEL*0.9;
    const r = makeRock(rnd);
    r.position.set(rx, worldHeight(rx,rz)+0.2, rz);
    g.add(r);
  }
  return g;
}

// ============================ AWAN (sprite melayang) =======================
const awan = [];
function buatAwan(){
  for(let i=0;i<26;i++){
    const m = new THREE.SpriteMaterial({map:cloudTex, transparent:true, opacity:0.85, depthWrite:false});
    const s = new THREE.Sprite(m);
    const sc = 26 + Math.random()*52;
    s.scale.set(sc, sc*0.52, 1);
    s.position.set((Math.random()-0.5)*1200, 70+Math.random()*160, (Math.random()-0.5)*1200);
    s.userData = {sp: 2.2+Math.random()*3.4, ph: Math.random()*Math.PI*2};
    awan.push(s); scene.add(s);
  }
}
buatAwan();

// ============================ BINTANG & FORMULA (zon kosmik) ===============
const starGeo = new THREE.BufferGeometry();
{
  const n = 1600, arr = new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*2-1), r=2600+Math.random()*900;
    arr[i*3]=Math.sin(ph)*Math.cos(th)*r; arr[i*3+1]=Math.abs(Math.cos(ph))*r*0.9+30; arr[i*3+2]=Math.sin(ph)*Math.sin(th)*r;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(arr,3));
}
const starMat = new THREE.PointsMaterial({color:0xcdb8ff, size:7, sizeAttenuation:true, transparent:true, opacity:0});
const bintang = new THREE.Points(starGeo, starMat);
scene.add(bintang);

function formulaTexture(teks){
  const c=document.createElement("canvas"); c.width=256; c.height=64;
  const g=c.getContext("2d");
  g.fillStyle="rgba(10,8,40,0.65)"; g.fillRect(0,0,256,64);
  g.font="26px 'Courier New',monospace"; g.fillStyle="#c9b8ff";
  g.textAlign="center"; g.textBaseline="middle";
  g.fillText(teks, 128, 32);
  return new THREE.CanvasTexture(c);
}
const rumusMelayang = [];
["z = z² + c","e^(iπ) + 1 = 0","a² + b² = c²","∇²φ = 0","∑ 1/n² = π²/6",
 "F = ma","eiθ = cosθ + i·sinθ","λ = h/p","x = (-b±√(b²-4ac))/2a","sin²θ + cos²θ = 1",
 "ζ(s) = ∑ 1/n^s","det(AB)=detA·detB"].forEach(function(txt, i){
  const m = new THREE.SpriteMaterial({map:formulaTexture(txt), transparent:true, opacity:0, depthWrite:false});
  const s = new THREE.Sprite(m);
  const a = i/12*Math.PI*2;
  s.position.set(Math.cos(a)*W.batas*1.35, 26+(i%4)*18, Math.sin(a)*W.batas*1.35);
  s.scale.set(46, 11.5, 1);
  s.userData = {ph: i*0.7};
  rumusMelayang.push(s); scene.add(s);
});

// ============================ ZON: biasa → tepi → kosmik ==================
const PAL = {
  siang:  {top:new THREE.Color(0x1a5fc8), mid:new THREE.Color(0x9fd8ff), bot:new THREE.Color(0xeaf9ff), fog:new THREE.Color(0xbfe6ff)},
  senja:  {top:new THREE.Color(0x2b1a5e), mid:new THREE.Color(0xff8c42), bot:new THREE.Color(0xffd9a0), fog:new THREE.Color(0xe8b48f)},
  malam:  {top:new THREE.Color(0x040a20), mid:new THREE.Color(0x12244d), bot:new THREE.Color(0x1a3566), fog:new THREE.Color(0x12203f)},
  kosmik: {top:new THREE.Color(0x07031a), mid:new THREE.Color(0x180b3d), bot:new THREE.Color(0x2a1155), fog:new THREE.Color(0x150a30)}
};
const cur = {top:new THREE.Color(), mid:new THREE.Color(), bot:new THREE.Color(), fog:new THREE.Color()};
let fogBase = scene.fog.far || 2600, fogLastSet = fogBase;
const zonaText = document.createElement("div");
zonaText.style.cssText = "position:fixed;top:16px;right:16px;z-index:34;display:none;max-width:290px;"+
  "background:rgba(20,8,48,.85);border:2px solid #9a7bff;border-radius:6px;padding:10px 12px;"+
  "font:11px 'Courier New',monospace;color:#cdb8ff;letter-spacing:.5px;line-height:1.6;";
document.body.appendChild(zonaText);

function lerpPalet(a, b, k, out){
  out.top.copy(a.top).lerp(b.top, k);
  out.mid.copy(a.mid).lerp(b.mid, k);
  out.bot.copy(a.bot).lerp(b.bot, k);
  out.fog.copy(a.fog).lerp(b.fog, k);
}
function paletMasa(t, out){ // t: 0 malam → 0.5 senja → 1 siang
  if(t < 0.5) lerpPalet(PAL.malam, PAL.senja, t*2, out);
  else lerpPalet(PAL.senja, PAL.siang, (t-0.5)*2, out);
}
function updateZona(){
  const p = G.player.pos;
  const d = Math.sqrt(p.x*p.x + p.z*p.z);
  const over = Math.max(0, d - W.batas);
  const zona = Math.min(1, over/320);           // 0 = biasa, 1 = kosmik penuh

  paletMasa(W.waktu, cur);
  if(W.cosmic && zona > 0){
    lerpPalet({top:cur.top,mid:cur.mid,bot:cur.bot,fog:cur.fog}, PAL.kosmik, Math.min(1, zona*1.15), cur);
  }
  const u = G.skyMat.uniforms;
  u.topCol.value.copy(cur.top); u.midCol.value.copy(cur.mid); u.botCol.value.copy(cur.bot);
  scene.fog.color.copy(cur.fog);
  G.sun.intensity = 1.25*(0.35+0.65*W.waktu)*(1-0.75*zona);
  starMat.opacity = W.cosmic ? zona*0.95 : 0;

  // rumus melayang muncul di zon kosmik
  for(let i=0;i<rumusMelayang.length;i++){
    rumusMelayang[i].material.opacity = W.cosmic ? Math.max(0, zona-0.25)*1.1 : 0;
    rumusMelayang[i].position.y += Math.sin(performance.now()*0.0004 + rumusMelayang[i].userData.ph)*0.06;
  }

  if(over > 0 && W.cosmic){
    zonaText.style.display = "block";
    zonaText.innerHTML = over < 320
      ? "⚠ <b>ZONA TEPI DUNIA</b><br>Kau {jarak} unit dari pusat dunia. Ruang mula berpusing — rumput, bukit dan graviti tak lagi sama. Ini bukan dinding: dunia diteruskan oleh matematik."
          .replace("{jarak}", Math.round(d))
      : "✦ <b>ZON KOSMIK</b><br>Kau sudah melepasi pinggir dunia biasa. Langit jadi retro-gelap, bintang dan formula melayang. Terus terbang — tiada ujung yang akan jumpa, hanya fraktal yang berulang.";
  } else zonaText.style.display = "none";

  // kabut ikut zon (kekal hormat tetapan panel: kesan perubahan pengguna dikesan)
  if(Math.abs(scene.fog.far - fogLastSet) > 1) fogBase = scene.fog.far;
  fogLastSet = Math.max(400, fogBase * (1-0.45*zona));
  scene.fog.far = fogLastSet;
}

// ============================ LOOP KEMAS KINI =============================
let chunkTimer = 0, autoT = 0;
function updateWorld(dt, t){
  // chunk rupa bumi — bina semula hanya bila perlu
  chunkTimer -= dt;
  if(chunkTimer <= 0){
    chunkTimer = 0.35;
    const pcx = Math.floor(G.player.pos.x/CHUNK), pcz = Math.floor(G.player.pos.z/CHUNK);
    const R = Math.ceil(W.jarakRender/CHUNK);
    for(let dz=-R;dz<=R;dz++) for(let dx=-R;dx<=R;dx++){
      const k = chunkKey(pcx+dx, pcz+dz);
      if(!chunks.has(k)){
        const ch = makeChunk(pcx+dx, pcz+dz);
        chunks.set(k, ch); scene.add(ch);
      }
    }
    for(const [k, ch] of chunks){
      const q = k.split(","), cx = +q[0], cz = +q[1];
      if(Math.abs(cx-pcx) > R+1 || Math.abs(cz-pcz) > R+1){
        scene.remove(ch); ch.geometry.dispose(); chunks.delete(k);
      }
    }
    // hiasan
    if(W.hiasan){
      const sx = Math.floor(G.player.pos.x/SEL), sz = Math.floor(G.player.pos.z/SEL);
      const CR = 3;
      for(let dz=-CR;dz<=CR;dz++) for(let dx=-CR;dx<=CR;dx++){
        const k = (sx+dx)+","+(sz+dz);
        if(!cells.has(k)){
          const c = makeCell(sx+dx, sz+dz);
          cells.set(k, c); scene.add(c);
        }
      }
      for(const [k, c] of cells){
        const q = k.split(","), cx = +q[0], cz = +q[1];
        if(Math.abs(cx-sx) > CR+1 || Math.abs(cz-sz) > CR+1){
          scene.remove(c); cells.delete(k);
        }
      }
    }
    // buang semua hiasan bila dimatikan
    if(!W.hiasan && cells.size){
      for(const [k, c] of cells){ scene.remove(c); }
      cells.clear();
    }
  }

  // air bergerak
  waterTex.offset.x = (t*0.021) % 1;
  waterTex.offset.y = (t*0.013) % 1;

  // awan melayang + ikut pemain
  for(let i=0;i<awan.length;i++){
    const a = awan[i];
    a.visible = W.awan;
    if(!W.awan) continue;
    a.position.x += a.userData.sp*dt*2.2;
    a.position.y += Math.sin(t*0.18 + a.userData.ph)*0.035;
    const dx = a.position.x - G.player.pos.x, dz = a.position.z - G.player.pos.z;
    if(dx > 750) a.position.x -= 1500;
    if(dx < -750) a.position.x += 1500;
    if(dz > 750) a.position.z -= 1500;
    if(dz < -750) a.position.z += 1500;
    a.material.opacity = 0.6 + 0.25*Math.sin(t*0.12 + a.userData.ph);
  }

  // kitaran siang-malam automatik
  if(W.autoSiang){
    autoT += dt*0.012;
    W.waktu = 0.5 + 0.5*Math.sin(autoT);
  }

  updateZona();
}
G.updates.push(updateWorld);

// ============================ PANEL — DUNIA DREAMCORE =====================
const P = G.panel;
P.group("🌏 DUNIA DREAMCORE (tanpa batas)");
P.slider({label:"Ketinggian bukit", key:"bukit", min:0, max:3, step:0.05, obj:W,
  onChange:function(){ rebuildAll(); }});
P.slider({label:"Kepadatan hiasan", key:"kepadatan", min:0, max:2.5, step:0.05, obj:W,
  onChange:function(){ clearCells(); }});
P.slider({label:"Jarak pinggir dunia", key:"batas", min:300, max:3000, step:50, obj:W});
P.slider({label:"Jarak render", key:"jarakRender", min:180, max:800, step:20, obj:W});
P.slider({label:"Waktu (malam↔siang)", key:"waktu", min:0, max:1, step:0.01, obj:W});
P.check({label:"Kitaran siang-malam automatik", key:"autoSiang", obj:W, onChange:function(){}});
P.check({label:"Awan melayang", key:"awan", obj:W, onChange:function(){}});
P.check({label:"Rumah, pokok, batu", key:"hiasan", obj:W, onChange:function(){}});
P.check({label:"Bunga liar", key:"bunga", obj:W, onChange:function(){ clearCells(); }});
P.check({label:"Kolam air", key:"kolam", obj:W, onChange:function(){ clearCells(); }});
P.check({label:"Zon tepi & kosmik", key:"cosmic", obj:W, onChange:function(){}});
P.button({label:"🎲 Dunia baru (rawak seed)", onClick:function(){
  W.seed = Math.floor(Math.random()*100000);
  rebuildAll();
}});
P.button({label:"⚡ Terbang ke pinggir dunia", onClick:function(){
  const a = Math.random()*Math.PI*2, d = W.batas + 220;
  G.player.pos.set(Math.cos(a)*d, 46, Math.sin(a)*d);
}});

function clearCells(){
  for(const [k, c] of cells){ scene.remove(c); }
  cells.clear();
}
function rebuildAll(){
  for(const [k, ch] of chunks){ scene.remove(ch); ch.geometry.dispose(); }
  chunks.clear();
  clearCells();
  chunkTimer = 0;
}

// sembunyikan grid lama (kini ditutup rumput)
G.ground.visible = false;
})();
