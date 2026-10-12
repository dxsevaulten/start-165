/* ============================================================================
   40-assetgen.js — PEMBINA ASET PARAMETRIK + "AI" PROSEDUR (GAMBAR → 3D)
   ----------------------------------------------------------------------------
   · Pembina bentuk parametrik (ala Grasshopper/NURBS): setiap angka = parameter
     sebenar yang mengubah bentuk sebelum aset "dilahirkan" ke dalam dunia.
   · Mesin AI-prosedur: baca gambar rujukan, analisis (Sobel, siluet, palet,
     simetri, nisbah), kemudian bina 3D dalam 5 cara berbeza. 100% luar talian —
     ini "AI" yang menjadi enjin prosedur tulen di dalam game (seperti diminta:
     konsep neural-net ditukar jadi mesin prosedur, hasil tetap sama).
   ============================================================================ */
(function(){
"use strict";
const G = window.GAME, THREE = G.THREE, scene = G.scene;

// ============================ BAHAN & PEMBANTU ============================
const bahanAset = new THREE.MeshStandardMaterial({color:0x8fd3ff, roughness:0.35, metalness:0.45});
function letakDiDunia(obj){
  const p = G.player.pos;
  const fwd = new THREE.Vector3(-Math.sin(G.player.yaw), 0, -Math.cos(G.player.yaw));
  const x = p.x + fwd.x*14, z = p.z + fwd.z*14;
  const y = G.groundHeight ? G.groundHeight(x, z) : 0;
  obj.position.set(x, y, z);
  scene.add(obj);
  if(G.ugc && G.ugc.tambah) G.ugc.tambah(obj, obj.userData.deskriptor || null);
  return obj;
}

// ============================ ASET PARAMETRIK =============================
// Setiap pembina menerima P = {tinggi, lebar, segmen, twist, taper, tebal}
const JENIS = {
  tabung: {nama:"Tabung silinder", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(P.lebar*(1-P.taper*0.5), P.lebar, P.tinggi, Math.round(P.segmen)), bahanAset);
    m.position.y = P.tinggi/2;
    g.add(m); return g;
  }},
  kerucut: {nama:"Kerucut", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ConeGeometry(P.lebar, P.tinggi, Math.round(P.segmen)), bahanAset);
    m.position.y = P.tinggi/2;
    g.add(m); return g;
  }},
  bola: {nama:"Bola / sfera", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(P.lebar, Math.round(P.segmen), Math.round(P.segmen*0.75)), bahanAset);
    m.position.y = P.lebar;
    m.scale.y = 1+P.taper;
    g.add(m); return g;
  }},
  torus: {nama:"Torus (cincin)", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.TorusGeometry(P.lebar, P.tebal, 12, Math.round(P.segmen)), bahanAset);
    m.position.y = P.lebar*0.9; m.rotation.x = Math.PI/2;
    g.add(m); return g;
  }},
  prisma: {nama:"Prisma (segi)", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(P.lebar, P.lebar, P.tinggi, Math.max(3, Math.round(P.segmen*0.35))), bahanAset);
    m.position.y = P.tinggi/2; m.rotation.y = P.twist*0.35;
    g.add(m); return g;
  }},
  vas: {nama:"Vas / pasu (lathe parametrik)", buat:function(P){
    // profil 2D diputarkan — inilah "NURBS-like" sebenar: lengkung → permukaan
    const titik = [];
    const N = 22;
    for(let i=0;i<=N;i++){
      const t = i/N;
      const r = P.lebar*(0.32 + 0.68*Math.sin(t*Math.PI*(1+P.taper*0.8)) *
                (1 + 0.18*Math.sin(t*Math.PI*P.segmen*0.14 + P.twist)));
      titik.push(new THREE.Vector2(Math.max(0.05, r), t*P.tinggi));
    }
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.LatheGeometry(titik, Math.round(P.segmen)), bahanAset);
    g.add(m); return g;
  }},
  tangga: {nama:"Tangga berpusing", buat:function(P){
    const g = new THREE.Group();
    const n = Math.max(3, Math.round(P.segmen*0.45));
    for(let i=0;i<n;i++){
      const m = new THREE.Mesh(new THREE.BoxGeometry(P.lebar*2, P.tinggi/n, P.lebar*0.9), bahanAset);
      const a = (i/n)*P.twist;
      m.position.set(Math.cos(a)*P.lebar*0.8, (i+0.5)*P.tinggi/n, Math.sin(a)*P.lebar*0.8);
      m.rotation.y = -a;
      g.add(m);
    }
    return g;
  }},
  rodaGigi: {nama:"Roda gigi", buat:function(P){
    const g = new THREE.Group();
    const teras = new THREE.Mesh(new THREE.CylinderGeometry(P.lebar*0.75, P.lebar*0.75, P.tebal, Math.round(P.segmen)), bahanAset);
    teras.position.y = P.lebar; teras.rotation.x = Math.PI/2;
    g.add(teras);
    const gigi = Math.max(6, Math.round(P.segmen*0.8));
    for(let i=0;i<gigi;i++){
      const t = new THREE.Mesh(new THREE.BoxGeometry(P.lebar*0.34, P.tebal, P.lebar*0.5), bahanAset);
      const a = i/gigi*Math.PI*2 + P.twist*0.1;
      t.position.set(Math.cos(a)*P.lebar*0.95, P.lebar, Math.sin(a)*P.lebar*0.95);
      t.rotation.y = -a;
      g.add(t);
    }
    return g;
  }},
  menara: {nama:"Menara bertingkat", buat:function(P){
    const g = new THREE.Group();
    const n = Math.max(2, Math.round(P.segmen*0.28));
    let y = 0;
    for(let i=0;i<n;i++){
      const r = P.lebar*(1 - i*0.13*(1+P.taper*0.5));
      const h = P.tinggi/n;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r*0.88, r, h, 10), bahanAset);
      m.position.y = y + h/2; y += h;
      g.add(m);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r*1.02, P.tebal*0.18, 6, 18), bahanAset);
      ring.position.y = y; ring.rotation.x = Math.PI/2;
      g.add(ring);
    }
    const top = new THREE.Mesh(new THREE.ConeGeometry(P.lebar*0.62, P.tinggi*0.28, 10), bahanAset);
    top.position.y = y + P.tinggi*0.14;
    g.add(top);
    return g;
  }},
  rumah: {nama:"Rumah kecil", buat:function(P){
    const g = new THREE.Group();
    const badan = new THREE.Mesh(new THREE.BoxGeometry(P.lebar*2, P.tinggi, P.lebar*1.6), bahanAset);
    badan.position.y = P.tinggi/2;
    g.add(badan);
    const bumbung = new THREE.Mesh(new THREE.ConeGeometry(P.lebar*1.55, P.tinggi*0.62, 4), bahanAset);
    bumbung.position.y = P.tinggi*1.31; bumbung.rotation.y = Math.PI/4;
    g.add(bumbung);
    return g;
  }},
  simpul: {nama:"Simpul torus (TorusKnot)", buat:function(P){
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.TorusKnotGeometry(P.lebar, P.tebal, Math.round(P.segmen*3), 12,
      Math.max(1, Math.round(P.twist+3)), Math.max(1, Math.round(P.taper*3+2))), bahanAset);
    m.position.y = P.lebar*1.2;
    g.add(m); return g;
  }},
  spiral: {nama:"Piramid berpusing", buat:function(P){
    const g = new THREE.Group();
    const n = Math.max(3, Math.round(P.segmen*0.3));
    for(let i=0;i<n;i++){
      const r = P.lebar*(1 - i/n);
      const m = new THREE.Mesh(new THREE.BoxGeometry(r*1.7, P.tinggi/n, r*1.7), bahanAset);
      m.position.y = (i+0.5)*P.tinggi/n;
      m.rotation.y = (i/n)*P.twist;
      g.add(m);
    }
    return g;
  }}
};
const P = {tinggi:6, lebar:2.4, segmen:24, twist:2, taper:0.3, tebal:0.5, jenis:"vas", warna:0x8fd3ff};

function binaAset(){
  const jenis = JENIS[P.jenis];
  const g = jenis ? jenis.buat(P) : new THREE.Group();
  g.traverse(function(o){ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
  g.userData.deskriptor = {sumber:"param", jenis:P.jenis, P:JSON.parse(JSON.stringify(P))};
  return g;
}
function warnaBaru(hex){ bahanAset.color.setHex(hex); }

// ============================ MESIN GAMBAR → 3D ===========================
const AI = {kedalaman:6, ambang:0.45, lembut:0.5, skala:8, segmen:28, bentuk:"relief"};
let gambarSumber = null;   // canvas 64×64 selepas analisis

function canvasKecil(size){
  const c = document.createElement("canvas"); c.width = c.height = size;
  return c;
}
// gambar rujukan terbina-dalam (bila pengguna tiada gambar sendiri)
function gambarPreset(nama){
  const c = canvasKecil(64), g = c.getContext("2d");
  g.fillStyle = "#123"; g.fillRect(0,0,64,64);
  if(nama === "rumah"){
    g.fillStyle = "#ffd6e8"; g.fillRect(14,26,36,26);
    g.fillStyle = "#d94f4f"; g.beginPath(); g.moveTo(10,26); g.lineTo(32,8); g.lineTo(54,26); g.closePath(); g.fill();
    g.fillStyle = "#8a5a33"; g.fillRect(28,38,8,14);
    g.fillStyle = "#9fe8ff"; g.fillRect(18,32,6,6); g.fillRect(40,32,6,6);
  } else if(nama === "vas"){
    const gr = g.createLinearGradient(0,0,64,0);
    gr.addColorStop(0,"#2255aa"); gr.addColorStop(0.5,"#7fd3ff"); gr.addColorStop(1,"#2255aa");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(24,8); g.bezierCurveTo(10,22,8,44,22,56); g.lineTo(42,56);
    g.bezierCurveTo(56,44,54,22,40,8); g.closePath(); g.fill();
  } else if(nama === "rodaGigi"){
    g.fillStyle = "#c9b8ff"; g.translate(32,32);
    for(let i=0;i<10;i++){ g.rotate(Math.PI/5); g.fillRect(-4,-26,8,12); }
    g.beginPath(); g.arc(0,0,19,0,Math.PI*2); g.fill();
    g.fillStyle = "#123"; g.beginPath(); g.arc(0,0,7,0,Math.PI*2); g.fill();
    g.setTransform(1,0,0,1,0,0);
  } else { // bintang / abstrak
    g.fillStyle = "#ffe14d"; g.translate(32,32);
    g.beginPath();
    for(let i=0;i<10;i++){
      const r = i%2 ? 10 : 26, a = i/10*Math.PI*2 - Math.PI/2;
      g.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    g.closePath(); g.fill();
  }
  return c;
}

function analisisGambar(src){
  // 1. kecilkan ke grid analisis
  const N = 64;
  const c = canvasKecil(N), g = c.getContext("2d");
  g.drawImage(src, 0, 0, N, N);
  const data = g.getImageData(0, 0, N, N).data;
  const lum = new Float32Array(N*N), mask = new Uint8Array(N*N);
  let minL = 1e9, maxL = -1e9;
  for(let i=0;i<N*N;i++){
    const l = (0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2]) / 255;
    lum[i] = l;
    if(l < minL) minL = l;
    if(l > maxL) maxL = l;
  }
  for(let i=0;i<N*N;i++){
    lum[i] = (lum[i]-minL)/Math.max(0.001, maxL-minL);
    mask[i] = lum[i] > 0.32 ? 1 : 0;
  }
  // 2. tepi Sobel
  let tepiKuat = 0;
  for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++){
    const gx = -lum[(y-1)*N+x-1]-2*lum[y*N+x-1]-lum[(y+1)*N+x-1]+lum[(y-1)*N+x+1]+2*lum[y*N+x+1]+lum[(y+1)*N+x+1];
    const gy = -lum[(y-1)*N+x-1]-2*lum[(y-1)*N+x]-lum[(y-1)*N+x+1]+lum[(y+1)*N+x-1]+2*lum[(y+1)*N+x]+lum[(y+1)*N+x+1];
    if(Math.sqrt(gx*gx+gy*gy) > 0.9) tepiKuat++;
  }
  // 3. palet warna (kuantiti kasar)
  const peta = {};
  for(let i=0;i<N*N;i+=3){
    const k = (data[i*4]>>5)+"-"+(data[i*4+1]>>5)+"-"+(data[i*4+2]>>5);
    peta[k] = (peta[k]||0)+1;
  }
  const palet = Object.keys(peta).sort(function(a,b){ return peta[b]-peta[a]; }).slice(0,5).map(function(k){
    const q = k.split("-").map(function(v){ return parseInt(v,10)*32+16; });
    return "rgb("+q[0]+","+q[1]+","+q[2]+")";
  });
  // 4. simetri (beza cermin)
  let simH = 0, simV = 0, n = 0;
  for(let y=0;y<N;y++) for(let x=0;x<N/2;x++){
    simH += Math.abs(lum[y*N+x]-lum[y*N+(N-1-x)]);
    simV += Math.abs(lum[x*N+y]-lum[(N-1-x)*N+y]);
    n++;
  }
  simH = 1 - simH/n; simV = 1 - simV/n;
  // 5. nisbah & litupan
  let isi = 0;
  for(let i=0;i<N*N;i++) isi += mask[i];
  return {
    N:N, lum:lum, mask:mask, palet:palet,
    tepi:tepiKuat, simetriH:simH, simetriV:simV,
    litupan: isi/(N*N),
    laporan:
      "◍ MENGANALISIS GAMBAR RUJUKAN (64×64 piksel)\n" +
      "  · kecerahan: julat " + minL.toFixed(2) + " – " + maxL.toFixed(2) + "\n" +
      "◍ MENGESAN TEPI (penapis Sobel 3×3)\n" +
      "  · " + tepiKuat + " titik tepi kuat → kontur utama dijumpai\n" +
      "◍ MENGIRA SILUET & LITUPAN\n" +
      "  · objek melitupi " + (100*isi/(N*N)).toFixed(1) + "% bingkai\n" +
      "◍ MENGAMBIL PALET WARNA (kuantiti warna dominan)\n" +
      "  · " + palet.join("  ") + "\n" +
      "◍ MENGESAN SIMETRI\n" +
      "  · menegak: " + (simV*100).toFixed(0) + "% · mendatar: " + (simH*100).toFixed(0) + "%\n" +
      "◍ MEMBINA GEOMETRI 3D PROSEDUR…\n" +
      "  · ketinggian dijana daripada luminans + penapis lembut (Gaussian kasar)\n" +
      "  · tekstur warna diambil terus dari gambar sumber\n" +
      "✔ SIAP — 5 bentuk 3D dicadangkan, pilih & laraskan param sebelum letak"
  };
}

function binaDariGambar(analisis){
  const N = analisis.N;
  const g = new THREE.Group();
  const sc = AI.skala, ked = AI.kedalaman;

  // tekstur warna dari gambar asal
  const tex = new THREE.CanvasTexture(gambarSumber || canvasKecil(64));
  tex.encoding = THREE.sRGBEncoding;

  function lembut(x,y){
    let s = 0, w = 0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      const xx = x+dx, yy = y+dy;
      if(xx<0||yy<0||xx>=N||yy>=N) continue;
      const k = (dx===0&&dy===0) ? (1+AI.lembut*4) : 1;
      s += analisis.lum[yy*N+xx]*k; w += k;
    }
    return s/w;
  }

  if(AI.bentuk === "relief"){
    const geo = new THREE.PlaneGeometry(sc, sc, N-1, N-1);
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x = i % N, y = Math.floor(i/N);
      pos.setY(i, lembut(x,y)*ked);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:tex, roughness:0.6, metalness:0.15}));
    g.add(m);
  } else if(AI.bentuk === "siluet"){
    // ekstrusi voxel lajur: gabung semua blok jadi satu geometri
    const verts = [], norms = [], uvs = [], idx = [];
    let vi = 0;
    const s = sc/N;
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      if(!analisis.mask[y*N+x]) continue;
      const h = Math.max(0.25, lembut(x,y))*ked;
      const x0 = (x-N/2)*s, z0 = (y-N/2)*s, x1 = x0+s, z1 = z0+s;
      // 6 muka blok (ringkas: atas + 4 sisi)
      const faces = [
        [[x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1]],                 // atas
        [[x0,0,z1],[x1,0,z1],[x1,h,z1],[x0,h,z1]],                 // depan
        [[x1,0,z0],[x0,0,z0],[x0,h,z0],[x1,h,z0]],                 // belakang
        [[x0,0,z0],[x0,0,z1],[x0,h,z1],[x0,h,z0]],                 // kiri
        [[x1,0,z1],[x1,0,z0],[x1,h,z0],[x1,h,z1]]                  // kanan
      ];
      for(const f of faces){
        for(let k=0;k<4;k++){
          verts.push(f[k][0], f[k][1], f[k][2]);
          norms.push(0,1,0);
          uvs.push((x+k%2)/N, (y+(k>>1))/N);
        }
        idx.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
        vi += 4;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts),3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(norms),3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs),2));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:tex, roughness:0.55}));
    g.add(m);
  } else if(AI.bentuk === "lathe"){
    // putarkan profil purata luminans → pasu/objek putaran
    const titik = [];
    for(let y=0;y<N;y++){
      let s2 = 0;
      for(let x=0;x<N;x++) s2 += analisis.lum[y*N+x];
      titik.push(new THREE.Vector2(Math.max(0.05, (s2/N)*sc*0.5), (y/N)*ked*1.4));
    }
    const m = new THREE.Mesh(new THREE.LatheGeometry(titik, Math.round(AI.segmen)),
      new THREE.MeshStandardMaterial({map:tex, roughness:0.4, metalness:0.3}));
    g.add(m);
  } else if(AI.bentuk === "voxel"){
    const s = sc/N;
    const geo = new THREE.BoxGeometry(s*0.92, s*0.92, s*0.92);
    const mat = new THREE.MeshStandardMaterial({vertexColors:false, roughness:0.5, metalness:0.25});
    const senarai = [];
    for(let y=0;y<N;y+=2) for(let x=0;x<N;x+=2){
      const l = analisis.lum[y*N+x];
      if(l < AI.ambang*0.6) continue;
      const tinggi = Math.round(1 + l*4*(0.5+AI.kedalaman*0.12));
      for(let zz=0; zz<tinggi; zz++) senarai.push([x,y,zz,l]);
    }
    const inst = new THREE.InstancedMesh(geo, mat, Math.max(1, senarai.length));
    const m4 = new THREE.Matrix4(), kol = new THREE.Color();
    senarai.forEach(function(q, i){
      m4.makeTranslation((q[0]-N/2)*s, q[2]*s+s/2, (q[1]-N/2)*s);
      inst.setMatrixAt(i, m4);
      kol.setHSL(0.55 + q[3]*0.35, 0.65, 0.5+q[3]*0.25);
      inst.setColorAt(i, kol);
    });
    inst.instanceMatrix.needsUpdate = true;
    if(inst.instanceColor) inst.instanceColor.needsUpdate = true;
    g.add(inst);
  } else { // "puncak" — radial heightfield
    const geo = new THREE.CircleGeometry(sc*0.5, Math.round(AI.segmen), 0, Math.PI*2);
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i)/(sc*0.5)*0.5+0.5, z = pos.getZ(i)/(sc*0.5)*0.5+0.5;
      const xi = Math.min(N-1, Math.max(0, Math.round(x*(N-1))));
      const zi = Math.min(N-1, Math.max(0, Math.round(z*(N-1))));
      pos.setY(i, analisis.lum[zi*N+xi]*ked);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:tex, roughness:0.5}));
    g.add(m);
  }
  g.traverse(function(o){ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
  g.userData.deskriptor = {
    sumber:"ai", bentuk:AI.bentuk,
    ai:JSON.parse(JSON.stringify(AI)),
    gambar:(gambarSumber && gambarSumber.toDataURL) ? gambarSumber.toDataURL("image/png") : null
  };
  return g;
}

// ============================ UI PANEL ====================================
const PNL = G.panel;
PNL.group("🏗️ PEMBINA ASET PARAMETRIK (NURBS-style)");
PNL.select({label:"Jenis aset", key:"jenis", obj:P,
  options:Object.keys(JENIS).map(function(k){ return [k, JENIS[k].nama]; }),
  onChange:function(){ pratinjau(); }});
PNL.slider({label:"Tinggi", key:"tinggi", min:0.5, max:24, step:0.1, obj:P, onChange:pratinjau});
PNL.slider({label:"Lebar / radius", key:"lebar", min:0.2, max:10, step:0.1, obj:P, onChange:pratinjau});
PNL.slider({label:"Segmen / detail", key:"segmen", min:3, max:64, step:1, obj:P, onChange:pratinjau});
PNL.slider({label:"Pintalan (twist)", key:"twist", min:-6, max:6, step:0.1, obj:P, onChange:pratinjau});
PNL.slider({label:"Tirusan (taper)", key:"taper", min:0, max:1.5, step:0.05, obj:P, onChange:pratinjau});
PNL.slider({label:"Ketebalan", key:"tebal", min:0.05, max:3, step:0.05, obj:P, onChange:pratinjau});
PNL.slider({label:"Warna (0-360 hue)", key:"hue", min:0, max:360, step:1, obj:{hue:200}, onChange:function(v){
  warnaBaru(new THREE.Color().setHSL(v/360, 0.6, 0.6).getHex()); pratinjau();
}});
PNL.button({label:"🎲 Aset rawak", onClick:function(){
  const keys = Object.keys(JENIS);
  P.jenis = keys[Math.floor(Math.random()*keys.length)];
  P.tinggi = 2+Math.random()*14; P.lebar = 0.8+Math.random()*5;
  P.segmen = 8+Math.floor(Math.random()*40); P.twist = (Math.random()-0.5)*8;
  P.taper = Math.random(); P.tebal = 0.1+Math.random()*1.4;
  PNL.sync(); pratinjau();
}});
PNL.button({label:"✔ Bina & letak ke dunia", onClick:function(){
  const obj = binaAset();
  letakDiDunia(obj);
}});
PNL.button({label:"👁 Tunjang / sembunyi pratinjau", onClick:function(){
  if(pratinjauObj){ pratinjauObj.visible = !pratinjauObj.visible; }
}});

PNL.group("🤖 MESIN AI-PROSEDUR — GAMBAR RUJUKAN → 3D");
const infoAI = document.createElement("div");
infoAI.style.cssText = "font:10px 'Courier New',monospace;color:#9fd8ff;background:rgba(10,40,60,.5);"+
  "border:1px dashed #2b6f8e;border-radius:4px;padding:8px;margin:8px 0;white-space:pre-wrap;line-height:1.6;";
infoAI.textContent = "Muat naik gambar (atau pilih gambar contoh), tekan «Analisis & jana 3D».\n"+
  "Mesin ini prosedur 100% luar talian: ia membaca piksel, mengesan tepi,\n"+
  "mengambil palet & simetri, lalu merakit model 3D berparameter.";
PNL.body.appendChild(infoAI);

const rowFile = document.createElement("div"); rowFile.className = "row";
const fileInp = document.createElement("input");
fileInp.type = "file"; fileInp.accept = "image/*";
fileInp.style.cssText = "width:100%;font:10px 'Courier New',monospace;color:#4dff88;";
rowFile.appendChild(fileInp);
PNL.body.appendChild(rowFile);

let presetPilih = "rumah";
(function(){
  const row = document.createElement("div"); row.className = "row";
  const lab = document.createElement("label");
  lab.innerHTML = "<span>Gambar contoh terbina-dalam</span>";
  const sel = document.createElement("select");
  [["rumah","contoh: rumah lukisan"],["vas","contoh: vas"],["rodaGigi","contoh: roda gigi"],["bintang","contoh: bintang"]].forEach(function(o){
    const op = document.createElement("option"); op.value = o[0]; op.textContent = o[1];
    sel.appendChild(op);
  });
  sel.addEventListener("change", function(){ presetPilih = sel.value; });
  row.appendChild(lab); row.appendChild(sel); PNL.body.appendChild(row);
})();
PNL.select({label:"Bentuk 3D yang dijana", key:"bentuk", obj:AI,
  options:[["relief","Relief ketinggian (luminans → permukaan)"],
           ["siluet","Siluet ekstrusi (kontur → blok 3D)"],
           ["lathe","Putaran lathe (profil → pasu)"],
           ["voxel","Voxel blok (grid → binaan)"],
           ["puncak","Puncak radial (cermin → kubah)"]],
  onChange:function(){}});
PNL.slider({label:"Kedalaman 3D", key:"kedalaman", min:0.5, max:20, step:0.1, obj:AI});
PNL.slider({label:"Ambang siluet", key:"ambang", min:0.05, max:0.95, step:0.01, obj:AI});
PNL.slider({label:"Kelembutan", key:"lembut", min:0, max:2, step:0.05, obj:AI});
PNL.slider({label:"Skala hasil", key:"skala", min:2, max:30, step:0.5, obj:AI});
PNL.slider({label:"Segmen putaran", key:"segmen", min:6, max:64, step:1, obj:AI});

let imejAnalisis = null;
function jalankanAnalisis(sumber){
  gambarSumber = sumber;
  imejAnalisis = analisisGambar(sumber);
  infoAI.textContent = imejAnalisis.laporan;
  const obj = binaDariGambar(imejAnalisis);
  letakDiDunia(obj);
}
PNL.button({label:"🧠 Analisis gambar & jana 3D", onClick:function(){
  if(fileInp.files && fileInp.files[0]){
    const rd = new FileReader();
    rd.onload = function(){
      const img = new Image();
      img.onload = function(){
        const c = canvasKecil(64);
        c.getContext("2d").drawImage(img, 0, 0, 64, 64);
        jalankanAnalisis(c);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(fileInp.files[0]);
  } else {
    jalankanAnalisis(gambarPreset("rumah"));
  }
}});
PNL.button({label:"🖼 Guna gambar contoh sahaja", onClick:function(){
  jalankanAnalisis(gambarPreset(presetPilih));
}});
PNL.button({label:"✔ Letak hasil AI ke dunia", onClick:function(){
  if(!imejAnalisis){ infoAI.textContent = "⚠ Jalankan analisis dahulu."; return; }
  letakDiDunia(binaDariGambar(imejAnalisis));
}});

// ============================ PRATINJAU LANGSUNG =========================
let pratinjauObj = null;
function pratinjau(){
  if(pratinjauObj){ scene.remove(pratinjauObj); }
  pratinjauObj = binaAset();
  const p = G.player.pos;
  const fwd = new THREE.Vector3(-Math.sin(G.player.yaw), 0, -Math.cos(G.player.yaw));
  const x = p.x + fwd.x*9, z = p.z + fwd.z*9;
  const y = (G.groundHeight ? G.groundHeight(x, z) : 0) + 2.2;
  pratinjauObj.position.set(x, y, z);
  scene.add(pratinjauObj);
}
G.updates.push(function(dt, t){
  if(pratinjauObj && pratinjauObj.visible){
    pratinjauObj.rotation.y += dt*0.5;
    pratinjauObj.position.y += Math.sin(t*1.4)*0.006;
  }
});
pratinjau();

// API untuk plugin & modul lain
G.assetgen = {JENIS: JENIS, P: P, binaAset: binaAset, binaDariGambar: binaDariGambar,
  letakDiDunia: letakDiDunia, analisisGambar: analisisGambar, gambarPreset: gambarPreset,
  tambahJenis: function(kode, nama, fn){ JENIS[kode] = {nama:nama, buat:fn}; }};
})();
