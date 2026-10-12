/* ============================================================================
   165 START — Sandbox Matematika (1D → 5D)
   ----------------------------------------------------------------------------
   Semua angka di file ini bisa kamu ubah. Cari tulisan "PARAM" untuk mulai.
   ============================================================================ */
(function(){
"use strict";

// ============================ RENDERER & SCENE ==============================
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbfe6ff, 220, 2600);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth/window.innerHeight, 0.1, 8000);

// ============================ LANGIT (ala Frutiger Aero) ===================
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{
    topCol:{value:new THREE.Color(0x1a5fc8)},
    midCol:{value:new THREE.Color(0x9fd8ff)},
    botCol:{value:new THREE.Color(0xeaf9ff)},
    sunDir:{value:new THREE.Vector3(0.45,0.55,-0.7).normalize()}
  },
  vertexShader:"varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
  fragmentShader:[
    "uniform vec3 topCol; uniform vec3 midCol; uniform vec3 botCol; uniform vec3 sunDir;",
    "varying vec3 vP;",
    "void main(){",
    "  vec3 d=normalize(vP);",
    "  float h=clamp(d.y*1.15,-1.0,1.0);",
    "  vec3 col = h>0.0 ? mix(midCol,topCol,pow(h,0.65)) : mix(midCol,botCol,pow(-h,0.45));",
    "  float sun=pow(max(dot(d,normalize(sunDir)),0.0),90.0);",
    "  float glow=pow(max(dot(d,normalize(sunDir)),0.0),6.0);",
    "  col += vec3(1.0,0.97,0.85)*sun*1.2 + vec3(1.0,0.95,0.8)*glow*0.22;",
    "  gl_FragColor=vec4(col,1.0);",
    "}"
  ].join("\n")
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(4200, 40, 24), skyMat));

// Environment map sederhana dari gradasi langit → pantulan logam/kaca jadi realistis
(function buildEnv(){
  const c = document.createElement("canvas"); c.width=256; c.height=128;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0,0,0,128);
  grad.addColorStop(0.00,"#1a5fc8"); grad.addColorStop(0.42,"#9fd8ff");
  grad.addColorStop(0.52,"#eaf9ff"); grad.addColorStop(1.00,"#2e7d4f");
  g.fillStyle=grad; g.fillRect(0,0,256,128);
  g.fillStyle="rgba(255,255,240,0.95)"; g.beginPath(); g.arc(184,34,17,0,Math.PI*2); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  tex.dispose(); pmrem.dispose();
})();

// ============================ CAHAYA =======================================
scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x2e6b3f, 0.85));
const sun = new THREE.DirectionalLight(0xfff4dd, 1.25);
sun.position.set(180, 260, -300);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 1200;
sun.shadow.camera.left = -160; sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
sun.shadow.bias = -0.0006;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9fd8ff, 0.35);
fill.position.set(-220, 120, 240); scene.add(fill);

// ============================ TANAH TAK BERUJUNG ==========================
const gridCanvas = (function(){
  const c=document.createElement("canvas"); c.width=c.height=256;
  const g=c.getContext("2d");
  g.fillStyle="#0e3450"; g.fillRect(0,0,256,256);
  g.strokeStyle="rgba(102,224,255,0.55)"; g.lineWidth=3;
  g.strokeRect(1.5,1.5,253,253);
  g.strokeStyle="rgba(102,224,255,0.16)"; g.lineWidth=1;
  for(let i=1;i<4;i++){ const p=i*64;
    g.beginPath(); g.moveTo(p,0); g.lineTo(p,256); g.moveTo(0,p); g.lineTo(256,p); g.stroke(); }
  return c;
})();
const gridTex = new THREE.CanvasTexture(gridCanvas);
gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping;
gridTex.repeat.set(300,300);
gridTex.encoding = THREE.sRGBEncoding;
const TILE = 20; // ukuran 1 kotak grid (satuan dunia)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(6000,6000),
  new THREE.MeshStandardMaterial({map:gridTex, roughness:0.55, metalness:0.35, color:0x86c8e8})
);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// ============================ BUKIT & GELEMBUNG (nuansa aero) =============
const hillMat = new THREE.MeshStandardMaterial({color:0x3fae5c, roughness:0.42, metalness:0.12});
for(let i=0;i<16;i++){
  const r = 220 + Math.random()*520;
  const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 18), hillMat);
  const ang = Math.random()*Math.PI*2;
  const dist = 900 + Math.random()*1600;
  hill.position.set(Math.cos(ang)*dist, -r*0.72, Math.sin(ang)*dist);
  hill.scale.y = 0.42 + Math.random()*0.25;
  scene.add(hill);
}
const bubbles = [];
const bubbleMat = new THREE.MeshStandardMaterial({
  color:0xd8f6ff, roughness:0.06, metalness:0.92,
  transparent:true, opacity:0.5, envMapIntensity:1.5
});
for(let i=0;i<26;i++){
  const b = new THREE.Mesh(new THREE.SphereGeometry(2+Math.random()*5, 20, 14), bubbleMat);
  b.position.set((Math.random()-0.5)*260, 6+Math.random()*70, (Math.random()-0.5)*260);
  b.userData = {sp:0.25+Math.random()*0.7, ph:Math.random()*Math.PI*2, y0:b.position.y};
  bubbles.push(b); scene.add(b);
}

// ============================ OBJEK MATEMATIKA (PARAM) =====================
// Setiap rumus = bentuk nyata yang lahir dari persamaan. Ubah angkanya di panel.
const PARAM = {
  ukuran: 7, tebal: 2.4, frekuensi: 3, amplitudo: 0.35, twist: 1.2, detail: 96,
  iterasi: 28, eksponen: 1,
  wireframe: false, datar: false, warna: 0x66e0ff, logam: 0.55, kilap: 0.28
};

function fTorus(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI*2;
  const R=p.ukuran, r=p.tebal*(1+p.amplitudo*0.6*Math.sin(p.frekuensi*a));
  return [(R+r*Math.cos(b))*Math.cos(a), r*Math.sin(b), (R+r*Math.cos(b))*Math.sin(a)];
}
function fBola(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI;
  const w=1+p.amplitudo*Math.sin(p.frekuensi*a*2)*Math.cos(p.frekuensi*b*2);
  const r=p.ukuran*w;
  return [r*Math.sin(b)*Math.cos(a), r*Math.cos(b), r*Math.sin(b)*Math.sin(a)];
}
function fGelombang(u,v,p){
  const x=(u-0.5)*p.ukuran*3.2, z=(v-0.5)*p.ukuran*3.2;
  const y=p.amplitudo*p.ukuran*1.6*(
    Math.sin(x*p.frekuensi*0.28)*Math.cos(z*p.frekuensi*0.28) +
    0.5*Math.sin((x+z)*p.frekuensi*0.19+p.twist));
  return [x,y,z];
}
function fHiperboloid(u,v,p){
  const a=u*Math.PI*2+p.twist*(v-0.5), h=(v-0.5)*2.4;
  const r=p.tebal*Math.sqrt(1+h*h)*1.4;
  return [r*Math.cos(a), h*p.ukuran*0.85, r*Math.sin(a)];
}
function fSpiral(u,v,p){
  const a=u*Math.PI*2*p.frekuensi*0.6, t=v;
  const r=p.ukuran*(0.35+t*1.25);
  return [r*Math.cos(a), (t-0.5)*p.ukuran*2.1, r*Math.sin(a)];
}
function fLissajous(u,v,p){
  const t=u*Math.PI*2, A=p.ukuran, k=p.frekuensi*0.9;
  const w=p.tebal*(0.25+v*0.8);
  return [A*Math.sin(k*t+p.twist)+w*Math.cos(t*9),
          A*Math.sin((k*1.6+1)*t)*0.7,
          A*Math.cos(k*t)+w*Math.sin(t*9)];
}
/* ---- FRAKTAL & bentuk eksotis (v0.2) ---- */
function fMandelbrot(u,v,p){
  /* medan ketinggian dari himpunan Mandelbrot: z = z² + c */
  const x=(u-0.5)*p.frekuensi*2.6-0.7, y=(v-0.5)*p.frekuensi*2.6;
  let zx=0, zy=0, esc=p.iterasi;
  for(let i=0;i<p.iterasi;i++){
    const x2=zx*zx-zy*zy+x; zy=2*zx*zy+y; zx=x2;
    if(zx*zx+zy*zy>4){ esc=i; break; }
  }
  const h=Math.pow(esc/p.iterasi, 0.6);
  return [(u-0.5)*p.ukuran*3, h*p.amplitudo*p.ukuran*1.5-p.ukuran*0.25, (v-0.5)*p.ukuran*3];
}
function fJulia(u,v,p){
  /* twist mengendalikan konstanta c → setiap putaran = Julia berbeda */
  const cx=0.72*Math.cos(p.twist), cy=0.72*Math.sin(p.twist);
  let zx=(u-0.5)*p.frekuensi*1.8, zy=(v-0.5)*p.frekuensi*1.8;
  let esc=p.iterasi;
  for(let i=0;i<p.iterasi;i++){
    const x2=zx*zx-zy*zy+cx; zy=2*zx*zy+cy; zx=x2;
    if(zx*zx+zy*zy>4){ esc=i; break; }
  }
  const h=Math.pow(esc/p.iterasi, 0.6);
  return [(u-0.5)*p.ukuran*3, h*p.amplitudo*p.ukuran*1.5-p.ukuran*0.25, (v-0.5)*p.ukuran*3];
}
function fMobius(u,v,p){
  const a=u*Math.PI*2, t=(v-0.5)*p.tebal*2, R=p.ukuran;
  return [(R+t*Math.cos(a/2))*Math.cos(a),
          t*Math.sin(a/2)+Math.sin(a*3)*p.amplitudo,
          (R+t*Math.cos(a/2))*Math.sin(a)];
}
function fSuper(u,v,p){
  /* superelipsoid: eksponen < 1 → bintang, = 1 → oktahedron, > 2 → kubus */
  const a=u*Math.PI*2, b=v*Math.PI-Math.PI/2, e=p.eksponen;
  const f=function(z,n){ return Math.sign(z)*Math.pow(Math.abs(z),n); };
  return [p.ukuran*f(Math.cos(b),e)*f(Math.cos(a),e),
          p.ukuran*f(Math.sin(b),e),
          p.ukuran*f(Math.cos(b),e)*f(Math.sin(a),e)];
}
function fFibonacci(u,v,p){
  /* spiral alam: kulit kerang / bunga matahari */
  const a=u*Math.PI*2*p.frekuensi, r=v*p.ukuran*2;
  const y=p.amplitudo*p.ukuran*0.5*Math.sin(a-v*p.frekuensi*1.3+p.twist)*(1-v*0.6);
  return [r*Math.cos(a), y, r*Math.sin(a)];
}
function fBurningShip(u,v,p){
  /* "kapal terbakar": saudara Mandelbrot dengan nilai mutlak */
  const x=(u-0.5)*p.frekuensi*3.4-1.75, y=(v-0.5)*p.frekuensi*2.8-0.1;
  let zx=0, zy=0, esc=p.iterasi;
  for(let i=0;i<p.iterasi;i++){
    zx=Math.abs(zx); zy=Math.abs(zy);
    const x2=zx*zx-zy*zy+x; zy=2*zx*zy+y; zx=x2;
    if(zx*zx+zy*zy>4){ esc=i; break; }
  }
  const h=Math.pow(esc/p.iterasi,0.6);
  return [(u-0.5)*p.ukuran*3, h*p.amplitudo*p.ukuran*1.5-p.ukuran*0.25, (v-0.5)*p.ukuran*3];
}
function fNewton(u,v,p){
  /* basin of attraction Newton untuk z³ − 1: tiga akar = tiga benua */
  let zx=(u-0.5)*p.frekuensi*2, zy=(v-0.5)*p.frekuensi*2;
  for(let i=0;i<p.iterasi;i++){
    const a=zx*zx*zx-3*zx*zy*zy-1, b=3*zx*zx*zy-zy*zy*zy;
    const da=3*(zx*zx-zy*zy), db=6*zx*zy;
    const dd=da*da+db*db; if(dd<1e-12) break;
    const q1=(a*da+b*db)/dd, q2=(b*da-a*db)/dd;
    zx-=q1; zy-=q2;
    if(q1*q1+q2*q2<1e-14) break;
  }
  const akar=[[1,0],[-0.5,0.866],[-0.5,-0.866]];
  let best=0, bd=1e18;
  for(let k=0;k<3;k++){
    const dx=zx-akar[k][0], dy=zy-akar[k][1], dd=dx*dx+dy*dy;
    if(dd<bd){ bd=dd; best=k; }
  }
  return [(u-0.5)*p.ukuran*3, ((best+0.5)/3)*p.amplitudo*p.ukuran*1.2-p.ukuran*0.3, (v-0.5)*p.ukuran*3];
}
function fMawar(u,v,p){
  /* mawar polar: r = cos(k·θ) — kelopak ditentukan frekuensi */
  const th=u*Math.PI*2, r=v*p.ukuran*1.8, k=p.frekuensi;
  const kelopak=Math.abs(Math.cos(k*th*0.5));
  const y=p.amplitudo*p.ukuran*0.9*kelopak*Math.sin(v*Math.PI*0.95)*(1-v*0.5);
  return [r*Math.cos(th), y, r*Math.sin(th)];
}
function fSierpinski(u,v,p){
  /* karpet Sierpinski: setiap iterasi melubangi bidang */
  let x=u, y=v, h=0, sc=1;
  const d=Math.max(1, Math.min(7, Math.round(p.iterasi/10)));
  for(let i=0;i<d;i++){
    const xi=Math.floor(x*3), yi=Math.floor(y*3);
    if(xi===1 && yi===1) h+=sc;
    x=(x*3)%1; y=(y*3)%1; sc*=0.5;
  }
  return [(u-0.5)*p.ukuran*3, h*p.amplitudo*p.ukuran*1.3-p.ukuran*0.2, (v-0.5)*p.ukuran*3];
}
/* ===== PEMBANTU ===== */
function _mod(x,m){ return ((x%m)+m)%m; }
function _cbrt(x){ return Math.sign(x)*Math.pow(Math.abs(x),1/3); }
function _hash(x,z){ const s=Math.sin(x*127.1+z*311.7)*43758.5453; return s-Math.floor(s); }
function _noise(x,z){
  const xi=Math.floor(x), zi=Math.floor(z), xf=x-xi, zf=z-zi;
  const u=xf*xf*(3-2*xf), v=zf*zf*(3-2*zf);
  const a=_hash(xi,zi), b=_hash(xi+1,zi), c=_hash(xi,zi+1), d=_hash(xi+1,zi+1);
  return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;
}
function _binom7(k,i){ let c=1; for(let n=0;n<i;n++){ c=c*(k-n)/(n+1); } return Math.round(c)%7; }

/* ===== 50 TOKOH MATEMATIKA — tiap tokoh jadi satu bentuk nyata ===== */
function fThales(u,v,p){
  const x=(u-0.5)*p.ukuran*2.4, z=(v-0.5)*p.ukuran*2.4, R=p.ukuran*1.2;
  const dome=Math.sqrt(Math.max(0,R*R-x*x-z*z));
  const siku=Math.max(0, R-Math.abs(x)-Math.abs(z));
  return [x, Math.max(dome,siku)*p.amplitudo*2, z];
}
function fPythagoras(u,v,p){
  const x=(u-0.5)*p.ukuran*2.4, z=(v-0.5)*p.ukuran*2.4;
  return [x, Math.sqrt(x*x+z*z)*p.amplitudo*1.2, z];
}
function fEudoxus(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const n=Math.max(3,Math.round(p.frekuensi));
  const sisi=Math.cos(Math.PI/n)/Math.max(0.2,Math.cos(_mod(th,Math.PI*2/n)-Math.PI/n));
  const h=Math.exp(-Math.pow(rr/(p.ukuran*1.1)-sisi,2)*14)*p.ukuran*0.5;
  return [x,h,z];
}
function fEuclid(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(Math.abs(Math.sin(x*0.8))+Math.abs(Math.sin(z*0.8)))*p.amplitudo*p.ukuran*0.5;
  return [x,h,z];
}
function fArkhimedes(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.abs(Math.sin((rr-th*p.frekuensi*0.6)*1.1))*p.amplitudo*p.ukuran*1.2;
  return [x,h,z];
}
function fApollonius(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(x*x*0.09-z*z*0.09)*p.amplitudo*1.6;
  return [x,h,z];
}
function fDiophantus(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const fx=x-Math.round(x), fz=z-Math.round(z);
  const h=Math.exp(-(fx*fx+fz*fz)*p.frekuensi*2)*p.amplitudo*p.ukuran*1.6;
  return [x,h,z];
}
function fLiuHui(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  const h=Math.cos(rr*p.frekuensi*0.55)*Math.max(0,1-rr/(p.ukuran*1.5))*p.amplitudo*p.ukuran*1.6;
  return [x,h,z];
}
function fAryabhata(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(Math.sin(x*0.8+p.twist)+Math.sin(x*1.6)*0.5+Math.sin(x*2.4)*0.25)*p.amplitudo*p.ukuran*0.8;
  return [x,h,z];
}
function fBrahmagupta(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(x*x-z*z)*0.07*p.amplitudo*2,z];
}
function fKhwarizmi(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  const h=Math.max(0,Math.floor((1-rr/(p.ukuran*1.5))*p.frekuensi))/p.frekuensi*p.amplitudo*p.ukuran*1.8;
  return [x,h,z];
}
function fKhayyam(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(x*x*x*0.016+z*0.35)*p.amplitudo*1.6,z];
}
function fBhaskara(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.sin(x*0.8+z*0.8+p.twist)*p.amplitudo*p.ukuran*1.2,z];
}
function fMadhava(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6, X=x*0.9;
  const h=(X-X*X*X/6+Math.pow(X,5)/120)*p.amplitudo*1.2 + Math.sin(z*0.6)*p.amplitudo*0.3;
  return [x,h,z];
}
function fFibonacciEmas(u,v,p){
  const th=u*Math.PI*2, r=v*p.ukuran*1.9;
  const h=Math.abs(Math.cos(th*p.frekuensi-r*2.39996))*Math.sin(v*Math.PI)*p.amplitudo*p.ukuran*1.4;
  return [r*Math.cos(th),h,r*Math.sin(th)];
}
function fCardano(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(_cbrt(x*2)*p.ukuran*0.35+z*0.22)*p.amplitudo*1.8,z];
}
function fViete(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.sin(rr*p.frekuensi*0.7-th*3)*Math.exp(-Math.pow(rr-p.ukuran,2)*0.09)*p.amplitudo*p.ukuran*1.8;
  return [x,h,z];
}
function fNapier(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.log(1+x*x+z*z)*p.amplitudo*p.ukuran*0.55,z];
}
function fDescartes(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(Math.exp(-x*x*0.35)+Math.exp(-z*z*0.35))*p.amplitudo*p.ukuran*1.2;
  return [x,h,z];
}
function fFermat(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const a=Math.abs(x/p.ukuran), b=Math.abs(z/p.ukuran);
  const s=Math.pow(a,p.eksponen)+Math.pow(b,p.eksponen);
  const h=Math.exp(-Math.pow(s-0.5,2)*16)*p.amplitudo*p.ukuran*1.6;
  return [x,h,z];
}
function fPascal(u,v,p){
  const k=Math.min(22,Math.floor((1-v)*22)), i=Math.floor(u*(k+1));
  const c=_binom7(k,i);
  return [(u-0.5)*p.ukuran*2.6, (c/7)*p.amplitudo*p.ukuran*1.6, (v-0.5)*p.ukuran*2.6];
}
function fNewtonGravitasi(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x, -p.amplitudo*p.ukuran*2.2/(0.35+(x*x+z*z)*0.05) + p.amplitudo*p.ukuran*0.9, z];
}
function fLeibniz(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,((1-Math.cos(x*0.8))*p.amplitudo*p.ukuran*0.9 + z*z*0.022),z];
}
function fBernoulli(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.sin(th*2+Math.log(1+rr)*p.frekuensi*0.8)*Math.exp(-Math.pow(rr-p.ukuran,2)*0.07)*p.amplitudo*p.ukuran*1.8;
  return [x,h,z];
}
function fEuler(u,v,p){
  const t=u*Math.PI*2*p.frekuensi*0.7, R=p.ukuran, w=p.tebal*(0.2+v*0.5);
  return [(R+w*Math.cos(t*2))*Math.cos(t), (u-0.5)*p.ukuran*1.5+w*Math.sin(t*2), (R+w*Math.cos(t*2))*Math.sin(t)];
}
function fLagrange(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=p.amplitudo*p.ukuran*0.7;
  for(let k=0;k<3;k++){
    const a=k*Math.PI*2/3+p.twist;
    const dx=x-Math.cos(a)*p.ukuran*0.8, dz=z-Math.sin(a)*p.ukuran*0.8;
    h-=Math.exp(-(dx*dx+dz*dz)*0.09)*p.amplitudo*p.ukuran*1.2;
  }
  return [x,h,z];
}
function fLaplace(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.cos(3*th)*Math.sin(rr*0.8)*Math.exp(-rr*0.07)*p.amplitudo*p.ukuran*1.6,z];
}
function fFourier(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let k=1;k<=5;k++){ h+=Math.sin(k*x*0.55+p.twist)/k + Math.sin(k*z*0.55)/k*0.55; }
  return [x,h*p.amplitudo*p.ukuran*0.85,z];
}
function fGauss(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,p.amplitudo*p.ukuran*1.8*Math.exp(-(x*x+z*z)*0.045),z];
}
function fCauchy(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.sin(th*4-rr*1.1)*Math.exp(-rr*0.11)*p.amplitudo*p.ukuran*1.7;
  return [x,h,z];
}
function fLobachevsky(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(Math.cosh(x*0.22)+Math.cosh(z*0.22)-2)*p.amplitudo*p.ukuran*0.9,z];
}
function fAbel(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.sin(p.frekuensi/(0.25+Math.abs(x)+Math.abs(z)))*p.amplitudo*p.ukuran*0.9,z];
}
function fHamilton(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI*2, R=p.ukuran, r=p.tebal;
  return [(R+r*Math.cos(b))*Math.cos(a), r*Math.sin(b)+Math.sin(2*a)*p.amplitudo*1.6, (R+r*Math.cos(b))*Math.sin(a)];
}
function fGalois(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.cos(Math.round(p.frekuensi)*th)*Math.exp(-Math.pow(rr-p.ukuran*0.95,2)*0.05)*p.amplitudo*p.ukuran*1.5;
  return [x,h,z];
}
function fBoole(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=((Math.sin(x*0.8)>0?1:0)+(Math.sin(z*0.8)>0?1:0))*p.amplitudo*p.ukuran*0.7;
  return [x,h,z];
}
function fRiemann(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.sin(Math.log(0.3+rr)*p.frekuensi*0.9+th)*p.amplitudo*p.ukuran*1.1,z];
}
function fWeierstrass(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let n=0;n<7;n++){ h+=Math.pow(0.56,n)*Math.cos(Math.pow(2.3,n)*x); }
  return [x,h*p.amplitudo*p.ukuran*1.1*Math.exp(-z*z*0.01),z];
}
function fCantor(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0, xx=_mod(x*0.22,1), sc=1;
  for(let i=0;i<7;i++){ if(Math.floor(_mod(xx*3,3))!==1){ h+=sc; } xx*=3; sc*=0.55; }
  return [x,h*p.amplitudo*p.ukuran*0.65*Math.exp(-z*z*0.008),z];
}
function fPoincare(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let k=0;k<3;k++){
    const t=k*Math.PI*2/3+u*p.frekuensi*0.6;
    const dx=x-Math.cos(t)*p.ukuran*0.75, dz=z-Math.sin(t)*p.ukuran*0.75;
    h-=1/(0.7+dx*dx+dz*dz);
  }
  return [x,h*p.amplitudo*p.ukuran*0.32,z];
}
function fHilbert(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let i=0;i<5;i++){
    const f=Math.pow(2,i)*0.55;
    h+=Math.sin(f*x)*Math.sin(f*z)/Math.pow(1.65,i);
  }
  return [x,h*p.amplitudo*p.ukuran*0.95,z];
}
function fLebesgue(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(Math.floor((Math.sin(x*0.5)+1)*3)/3)*p.amplitudo*p.ukuran*1.2 + z*0.06;
  return [x,h,z];
}
function fRamanujan(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let n=1;n<=6;n++){ h+=Math.cos(x*0.5/n+p.twist)*Math.cos(z*0.5/n)/n; }
  return [x,h*p.amplitudo*p.ukuran*1.15,z];
}
function fNoether(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI*2, R=p.ukuran, r=p.tebal;
  return [(R+r*Math.cos(b+a*2))*Math.cos(a), r*Math.sin(b+a*2), (R+r*Math.cos(b+a*2))*Math.sin(a)];
}
function fGodel(u,v,p){
  const rr=v*p.ukuran*1.7, th=u*Math.PI*2*3;
  return [rr*Math.cos(th), Math.floor(v*p.frekuensi*2)/p.frekuensi*p.amplitudo*p.ukuran*2.4, rr*Math.sin(th)];
}
function fVonNeumann(u,v,p){
  const k=Math.min(17,Math.floor((1-v)*17)), i=Math.floor(u*17);
  const h=((k&i)===i ? 1 : 0.15)*p.amplitudo*p.ukuran*1.1;
  return [(u-0.5)*p.ukuran*2.6, h, (v-0.5)*p.ukuran*2.6];
}
function fTuring(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.abs(Math.sin(x*0.8+p.twist*Math.sin(z*0.8)))*p.amplitudo*p.ukuran*1.25,z];
}
function fKolmogorov(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(_noise(x*0.35+p.twist,z*0.35)-0.35)*p.amplitudo*p.ukuran*1.5;
  return [x,h,z];
}
function fErdos(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let k=1;k<=7;k++){
    const a=k*2.39996+p.twist, r=p.ukuran*(0.25+0.68*((k*0.618)%1));
    const dx=x-Math.cos(a)*r, dz=z-Math.sin(a)*r;
    h+=Math.exp(-(dx*dx+dz*dz)*1.1);
  }
  return [x,h*p.amplitudo*p.ukuran*0.85,z];
}
function fGrothendieck(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.sin(x*0.65+z*z*0.018+p.twist)*p.amplitudo*p.ukuran*1.15,z];
}
function fWiles(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const a=Math.abs(x/p.ukuran), b=Math.abs(z/p.ukuran);
  const s=Math.pow(a,3)+Math.pow(b,3);
  const th=Math.atan2(z,x);
  const gap=0.5+0.5*Math.tanh(4*(Math.abs(th)-0.45));
  const h=Math.exp(-Math.pow(s-0.5,2)*16)*gap*p.amplitudo*p.ukuran*1.7;
  return [x,h,z];
}
/* ===== 50 BENTUK TAMBAHAN (A1-A50) ===== */
function fSinusLapis(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(Math.sin(x*0.8+p.twist)+Math.sin(z*1.05)+Math.sin((x+z)*0.55))/3*p.amplitudo*p.ukuran*1.5;
  return [x,h,z];
}
function fCosGrid(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.cos(x*0.8)*Math.cos(z*0.8)*p.amplitudo*p.ukuran*1.5,z];
}
function fTangenR(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(Math.atan(Math.sin(x*0.7+p.twist)*3)/Math.PI+0.5)*p.amplitudo*p.ukuran*1.6,z];
}
function fLingkaranM(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  return [x,Math.exp(-Math.pow(rr-p.ukuran*0.9,2)*0.5)*p.amplitudo*p.ukuran*1.8,z];
}
function fElipsM(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const e=Math.sqrt(Math.pow(x/(p.ukuran*1.1),2)+Math.pow(z/(p.ukuran*0.6),2));
  return [x,Math.exp(-Math.pow(e-1,2)*16)*p.amplitudo*p.ukuran*1.8,z];
}
function fParabolaM(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,(x*x+z*z)*0.045*p.amplitudo*2.2,z];
}
function fHiperbolaM(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.exp(-Math.pow(x*z*0.035-p.frekuensi*0.25,2)*14)*p.amplitudo*p.ukuran*1.6,z];
}
function fKardioid(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.exp(-Math.pow(rr/(p.ukuran*1.2)-(1+Math.cos(th))*0.5,2)*18)*p.amplitudo*p.ukuran*1.8;
  return [x,h,z];
}
function fLimason(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.exp(-Math.pow(rr/(p.ukuran*1.3)-(0.6+Math.cos(th)*p.frekuensi*0.18),2)*14)*p.amplitudo*p.ukuran*1.8;
  return [x,h,z];
}
function fMawar5(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const k=Math.max(2,Math.round(p.frekuensi));
  const h=Math.pow(Math.abs(Math.cos(k*th*0.5)),2.2)*Math.sin(Math.min(1,rr/(p.ukuran*1.3))*Math.PI)*p.amplitudo*p.ukuran*1.7;
  return [x,h,z];
}
function fSpiral2(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.abs(Math.sin(rr*0.55-th*th*0.06))*p.amplitudo*p.ukuran*1.3,z];
}
function fLemniskat(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const X=x/p.ukuran, Z=z/p.ukuran;
  const s=Math.pow(X*X+Z*Z,2)-(X*X-Z*Z)*0.9;
  return [x,Math.exp(-s*s*11)*p.amplitudo*p.ukuran*1.8,z];
}
function fAstroid(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const X=Math.abs(x/p.ukuran), Z=Math.abs(z/p.ukuran);
  const s=Math.pow(X,2/3)+Math.pow(Z,2/3);
  return [x,Math.exp(-Math.pow(s-0.75,2)*17)*p.amplitudo*p.ukuran*1.8,z];
}
function fSikloid(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(1-Math.cos(x*0.65+p.twist))*0.5*p.amplitudo*p.ukuran*1.5 + z*z*0.012;
  return [x,h,z];
}
function fEpikloid(u,v,p){
  const t=u*Math.PI*2*p.frekuensi*0.35, R=p.ukuran*0.75, r=p.ukuran*0.28;
  const w=p.tebal*0.35;
  return [(R+r)*Math.cos(t)-r*Math.cos((R+r)/r*t),
          (u-0.5)*p.amplitudo*2.2+w*Math.cos(t*3),
          (R+r)*Math.sin(t)-r*Math.sin((R+r)/r*t)];
}
function fHipoSikloid(u,v,p){
  const t=u*Math.PI*2*p.frekuensi*0.35, R=p.ukuran*0.75, r=p.ukuran*0.28;
  const w=p.tebal*0.35;
  return [(R-r)*Math.cos(t)+r*Math.cos((R-r)/r*t),
          (u-0.5)*p.amplitudo*2.2+w*Math.cos(t*3),
          (R-r)*Math.sin(t)-r*Math.sin((R-r)/r*t)];
}
function fHelixGanda(u,v,p){
  const t=u*Math.PI*2*p.frekuensi*0.65, R=p.ukuran*0.75, s=(v-0.5)*2;
  const ph=t+(s>0?Math.PI:0);
  return [(R+s*p.tebal*0.22)*Math.cos(t), (u-0.5)*p.ukuran*1.5+Math.sin(ph)*p.tebal*0.22, (R+s*p.tebal*0.22)*Math.sin(t)];
}
function fSimpulTorus(u,v,p){
  const t=u*Math.PI*2, R=p.ukuran*0.62, r=p.ukuran*0.26, w=p.tebal*0.22;
  const cx=(R+r*Math.cos(3*t))*Math.cos(2*t);
  const cy=(R+r*Math.cos(3*t))*Math.sin(2*t);
  const cz=r*Math.sin(3*t);
  return [cx+ (v-0.5)*w*2, cz + (u-0.5)*p.amplitudo*1.2, cy+(v-0.5)*w*2];
}
function fKleinPita(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI*2, R=p.ukuran*0.8;
  return [R*((R*0.5+Math.cos(a/2)*Math.sin(b)-Math.sin(a/2)*Math.sin(2*b))*Math.cos(a)),
          R*0.6*(Math.sin(a/2)*Math.sin(b)+Math.cos(a/2)*Math.sin(2*b)),
          R*((R*0.5+Math.cos(a/2)*Math.sin(b)-Math.sin(a/2)*Math.sin(2*b))*Math.sin(a))];
}
function fHopf(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.cos(rr*0.85-th*2)*Math.exp(-Math.pow(rr-p.ukuran*0.85,2)*0.045)*p.amplitudo*p.ukuran*1.6,z];
}
function fGelombangJalan(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.sin(x*0.8-z*0.6+p.twist)*p.amplitudo*p.ukuran*1.3,z];
}
function fInterferensi(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const d1=Math.sqrt(x*x+Math.pow(z-p.ukuran*0.6,2)), d2=Math.sqrt(x*x+Math.pow(z+p.ukuran*0.6,2));
  return [x,(Math.cos(d1*0.8)+Math.cos(d2*0.8))*0.5*p.amplitudo*p.ukuran*1.4,z];
}
function fDifraksi(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const k=p.frekuensi*0.8;
  const sinc=Math.sin(x*k)/(1+Math.abs(x*k)*0.35);
  return [x,sinc*Math.cos(z*0.45)*p.amplitudo*p.ukuran*1.3,z];
}
function fDuaPuncak(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6, R=p.ukuran*0.7;
  const h=Math.exp(-(x*x+Math.pow(z-R,2))*0.06)+Math.exp(-(x*x+Math.pow(z+R,2))*0.06);
  return [x,h*p.amplitudo*p.ukuran*1.6,z];
}
function fTangga(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=Math.max(0,Math.floor(x*0.35+p.frekuensi))/p.frekuensi*p.amplitudo*p.ukuran*1.6;
  return [x,h,z];
}
function fPiramida(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.max(0, p.ukuran*1.3-Math.abs(x)-Math.abs(z))*p.amplitudo*1.1,z];
}
function fKubah(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6, R=p.ukuran*1.25;
  const rr=Math.sqrt(x*x+z*z)/R;
  const h=Math.sqrt(Math.max(0,1-rr*rr))*(1-0.28*rr*rr)*p.amplitudo*p.ukuran*1.7;
  return [x,h,z];
}
function fTabung(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  return [x,Math.exp(-Math.pow(rr-p.ukuran*0.85,2)*0.9)*p.amplitudo*p.ukuran*2.2,z];
}
function fKerucut(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  const target=(0.5-Math.abs(v-0.5))*p.ukuran*1.9;
  return [x,Math.exp(-Math.pow(rr-target,2)*1.1)*p.amplitudo*p.ukuran*1.6,z];
}
function fPrisma(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=(1-Math.abs(_mod(x*0.42,2)-1))*p.amplitudo*p.ukuran*1.2;
  return [x,h,z];
}
function fBerduri(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI, R=p.ukuran;
  const r=R*(0.55+0.55*Math.pow(Math.abs(Math.cos(4*a)*Math.cos(3*b)),1.4));
  return [r*Math.sin(b)*Math.cos(a), r*Math.cos(b), r*Math.sin(b)*Math.sin(a)];
}
function fLandak(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI, R=p.ukuran;
  const r=R*(0.5+0.75*Math.pow(Math.abs(Math.sin(5*a)*Math.sin(4*b)),0.7));
  return [r*Math.sin(b)*Math.cos(a), r*Math.cos(b), r*Math.sin(b)*Math.sin(a)];
}
function fKawah(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0;
  for(let k=0;k<5;k++){
    const a=k*2.39996+p.twist, r=p.ukuran*(0.2+0.72*_hash(k,7));
    const dx=x-Math.cos(a)*r, dz=z-Math.sin(a)*r;
    h-=Math.exp(-(dx*dx+dz*dz)*0.16)*p.amplitudo*p.ukuran*1.1;
    h+=Math.exp(-Math.pow(Math.sqrt(dx*dx+dz*dz)-p.ukuran*0.22,2)*0.7)*p.amplitudo*p.ukuran*0.35;
  }
  return [x,h,z];
}
function fPegunungan(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  let h=0, amp=1, f=0.16;
  for(let o=0;o<5;o++){ h+=_noise(x*f+p.twist,z*f)*amp; amp*=0.52; f*=2.1; }
  return [x,(h-1.05)*p.amplitudo*p.ukuran*1.5,z];
}
function fBukitPasir(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  return [x,Math.pow(Math.abs(Math.sin(x*0.5+z*0.18+p.twist)),0.55)*p.amplitudo*p.ukuran*1.25,z];
}
function fOmbakLaut(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const h=_noise(x*0.28,z*0.28)*0.75+Math.sin(x*0.45+z*0.3)*0.35;
  return [x,h*p.amplitudo*p.ukuran*1.15,z];
}
function fApiPanas(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const n=_noise(x*0.42,z*0.16+p.twist);
  const h=Math.pow(1-Math.abs(2*n-1),2)*Math.max(0,1-Math.abs(x)/p.ukuran*1.15)*p.amplitudo*p.ukuran*1.9;
  return [x,h,z];
}
function fSarangLebah(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6, k=0.62;
  const h=Math.abs(Math.sin(k*x)*Math.sin(k*(x*0.5+z*0.866))*Math.sin(k*(x*0.5-z*0.866)));
  return [x,Math.pow(h,0.45)*p.amplitudo*p.ukuran*1.1,z];
}
function fJaringLaba(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=(Math.pow(Math.abs(Math.sin(th*4)),0.35)*Math.exp(-rr*0.05)+Math.pow(Math.abs(Math.sin(rr*0.7)),0.4)*Math.exp(-rr*0.05))*p.amplitudo*p.ukuran*0.75;
  return [x,h,z];
}
function fDaun(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const bentuk=Math.max(0,1-Math.abs(x)/(p.ukuran*1.25))*Math.max(0,1-Math.abs(z)/(p.ukuran*1.25));
  const h=(Math.abs(Math.sin(x*0.5))*0.5+bentuk)*bentuk*p.amplitudo*p.ukuran*1.5;
  return [x,h,z];
}
function fBungaBunga(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.pow(Math.abs(Math.cos(th*p.frekuensi*0.5)),1.5)*Math.sin(Math.min(1,rr/(p.ukuran*1.25))*Math.PI)*p.amplitudo*p.ukuran*1.5;
  return [x,h,z];
}
function fKerang(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.cos(th*10)*Math.sin(rr*0.5)*Math.max(0,1-rr/(p.ukuran*1.45))*p.amplitudo*p.ukuran*1.6,z];
}
function fTelur(u,v,p){
  const a=u*Math.PI*2, b=v*Math.PI, R=p.ukuran;
  const r=R*(1+0.22*Math.cos(b));
  return [r*Math.sin(b)*Math.cos(a)*0.85, r*Math.cos(b)*1.15, r*Math.sin(b)*Math.sin(a)*0.85];
}
function fJam(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const cincin=Math.exp(-Math.pow(rr-p.ukuran*0.95,2)*0.7);
  return [x,cincin*(0.45+0.55*Math.pow(Math.abs(Math.cos(6*th)),7))*p.amplitudo*p.ukuran*2,z];
}
function fKompas(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const h=Math.pow(Math.abs(Math.cos(2*th)),7)*Math.max(0,1-rr/(p.ukuran*1.35))*p.amplitudo*p.ukuran*1.9;
  return [x,h,z];
}
function fRodaGigi(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  const gigi=0.6+0.4*Math.sign(Math.cos(th*p.frekuensi));
  return [x,Math.exp(-Math.pow(rr-p.ukuran*0.9*gigi,2)*1.1)*p.amplitudo*p.ukuran*1.8,z];
}
function fPerSpiral(u,v,p){
  const t=u*Math.PI*2*p.frekuensi*0.7, R=p.ukuran*0.8, w=p.tebal*0.3;
  return [(R+w*Math.cos(t*3))*Math.cos(t), (u-0.5)*p.ukuran*1.7+w*Math.sin(t*3), (R+w*Math.cos(t*3))*Math.sin(t)];
}
function fMedanMagnet(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr2=x*x+z*z+0.6;
  return [x,(x*x-2*z*z)*Math.pow(rr2,-1.5)*p.amplitudo*p.ukuran*1.6,z];
}
function fVortex(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const th=Math.atan2(z,x), rr=Math.sqrt(x*x+z*z);
  return [x,Math.cos(th*3+rr*0.85+p.twist)*Math.exp(-rr*0.085)*p.amplitudo*p.ukuran*1.6,z];
}
function fBlackHole(u,v,p){
  const x=(u-0.5)*p.ukuran*2.6, z=(v-0.5)*p.ukuran*2.6;
  const rr=Math.sqrt(x*x+z*z);
  const h=-p.amplitudo*p.ukuran*2.4/(0.35+rr*0.22) + Math.exp(-Math.pow(rr-p.ukuran*0.8,2)*1.6)*p.amplitudo*p.ukuran*1.1;
  return [x,h,z];
}

const MATEMATIKA = {
  torus:      {nama:"Torus — kulit donat",        fn:fTorus},
  bola:       {nama:"Bola — permukaan konstan",   fn:fBola},
  gelombang:  {nama:"Gelombang — sinus harmonik",  fn:fGelombang},
  hiperboloid:{nama:"Hiperboloid — kurva lurus",   fn:fHiperboloid},
  spiral:     {nama:"Spiral — pertumbuhan",        fn:fSpiral},
  lissajous:  {nama:"Lissajous — ritme harmonik",  fn:fLissajous},
  mandelbrot: {nama:"Mandelbrot — fraktal klasik", fn:fMandelbrot},
  julia:      {nama:"Julia — fraktal berputar",    fn:fJulia},
  mobius:     {nama:"Mobius — pita satu sisi",     fn:fMobius},
  super:      {nama:"Superelipsoid — pangkat",     fn:fSuper},
  fibonacci:  {nama:"Fibonacci — spiral alam",     fn:fFibonacci},
  burning:    {nama:"Burning Ship — fraktal api",   fn:fBurningShip},
  newton:     {nama:"Newton — basin z³−1",          fn:fNewton},
  mawar:      {nama:"Mawar — kurva polar",          fn:fMawar},
  sierpinski: {nama:"Sierpinski — karpet fraktal",  fn:fSierpinski},
  thales:        {nama:"1 Thales — setengah bola siku",  fn:fThales},
  pythagoras:    {nama:"2 Pythagoras — kerucut c²=a²+b²",fn:fPythagoras},
  eudoxus:       {nama:"3 Eudoxus — pendekatan kelelahan",fn:fEudoxus},
  euclid:        {nama:"4 Euclid — bidang grid aksioma",  fn:fEuclid},
  arkhimedes:    {nama:"5 Arkhimedes — spiral r=aθ",     fn:fArkhimedes},
  apollonius:    {nama:"6 Apollonius — irisan kerucut",  fn:fApollonius},
  diophantus:    {nama:"7 Diophantus — kisi bilangan",   fn:fDiophantus},
  liuhui:        {nama:"8 Liu Hui — pendekatan π",       fn:fLiuHui},
  aryabhata:     {nama:"9 Aryabhata — tabel sinus",      fn:fAryabhata},
  brahmagupta:   {nama:"10 Brahmagupta — pelana lengkung",fn:fBrahmagupta},
  khwarizmi:     {nama:"11 Al-Khwarizmi — piramida aljabar",fn:fKhwarizmi},
  khayyam:       {nama:"12 Omar Khayyam — kurva kubik",  fn:fKhayyam},
  bhaskara:      {nama:"13 Bhaskara — sinus(a+b)",       fn:fBhaskara},
  madhava:       {nama:"14 Madhava — deret Taylor",      fn:fMadhava},
  fiboemas:      {nama:"15 Fibonacci — sudut emas 137,5°",fn:fFibonacciEmas},
  cardano:       {nama:"16 Cardano — akar kubik",        fn:fCardano},
  viete:         {nama:"17 Viete — gelang trigonometri", fn:fViete},
  napier:        {nama:"18 Napier — corong logaritma",   fn:fNapier},
  descartes:     {nama:"19 Descartes — sumbu koordinat", fn:fDescartes},
  fermat:        {nama:"20 Fermat — cincin xⁿ+zⁿ",       fn:fFermat},
  pascal:        {nama:"21 Pascal — segitiga bilangan",  fn:fPascal},
  newtongrav:    {nama:"22 Newton — sumur gravitasi",    fn:fNewtonGravitasi},
  leibniz:       {nama:"23 Leibniz — akumulasi integral",fn:fLeibniz},
  bernoulli:     {nama:"24 Bernoulli — spiral logaritmik",fn:fBernoulli},
  euler:         {nama:"25 Euler — heliks e^(iθ)",       fn:fEuler},
  lagrange:      {nama:"26 Lagrange — tiga keseimbangan",fn:fLagrange},
  laplace:       {nama:"27 Laplace — harmonik bola",     fn:fLaplace},
  fourier:       {nama:"28 Fourier — deret harmonik",    fn:fFourier},
  gauss:         {nama:"29 Gauss — kurva lonceng",       fn:fGauss},
  cauchy:        {nama:"30 Cauchy — spiral konvergen",   fn:fCauchy},
  lobachevsky:   {nama:"31 Lobachevsky — geometri hiperbolik",fn:fLobachevsky},
  abel:          {nama:"32 Abel — singularitas tak terpecahkan",fn:fAbel},
  hamilton:      {nama:"33 Hamilton — rotasi ganda 4D",  fn:fHamilton},
  galois:        {nama:"34 Galois — simetri grup",       fn:fGalois},
  boole:         {nama:"35 Boole — dunia 0 dan 1",       fn:fBoole},
  riemann:       {nama:"36 Riemann — spiral zeta",       fn:fRiemann},
  weierstrass:   {nama:"37 Weierstrass — patah abstrak", fn:fWeierstrass},
  cantor:        {nama:"38 Cantor — debu tak hingga",    fn:fCantor},
  poincare:      {nama:"39 Poincaré — chaos tiga tubuh", fn:fPoincare},
  hilbert:       {nama:"40 Hilbert — ruang terisi",      fn:fHilbert},
  lebesgue:      {nama:"41 Lebesgue — ukuran bertingkat",fn:fLebesgue},
  ramanujan:     {nama:"42 Ramanujan — produk misterius",fn:fRamanujan},
  noether:       {nama:"43 Noether — simetri kekal",     fn:fNoether},
  godel:         {nama:"44 Gödel — tangga tak berujung", fn:fGodel},
  vonneumann:    {nama:"45 Von Neumann — automata sel",   fn:fVonNeumann},
  turing:        {nama:"46 Turing — pola reaksi",        fn:fTuring},
  kolmogorov:    {nama:"47 Kolmogorov — ladang peluang", fn:fKolmogorov},
  erdos:         {nama:"48 Erdős — jaringan graf",       fn:fErdos},
  grothendieck:  {nama:"49 Grothendieck — serat ruang",  fn:fGrothendieck},
  wiles:         {nama:"50 Wiles — cincin Fermat terakhir",fn:fWiles},
  sinuslapis:   {nama:"A1 Sinus lapis — tiga harmonik",  fn:fSinusLapis},
  cosgrid:      {nama:"A2 Kosinus kisi — telur dadar",   fn:fCosGrid},
  tangentr:     {nama:"A3 Tangen bertangga",             fn:fTangenR},
  lingkaranm:   {nama:"A4 Lingkaran murni",              fn:fLingkaranM},
  elipsm:       {nama:"A5 Elips",                        fn:fElipsM},
  parabolam:    {nama:"A6 Parabola — mangkuk",           fn:fParabolaM},
  hiperbolam:   {nama:"A7 Hiperbola xy=c",               fn:fHiperbolaM},
  kardioid:     {nama:"A8 Kardioid — hati matematika",   fn:fKardioid},
  limason:      {nama:"A9 Limaçon — siput Prancis",      fn:fLimason},
  mawar5:       {nama:"A10 Mawar lima kelopak",          fn:fMawar5},
  spiral2:      {nama:"A11 Spiral parabolik",            fn:fSpiral2},
  lemniskat:    {nama:"A12 Lemniskat — angka delapan",   fn:fLemniskat},
  astroid:      {nama:"A13 Astroid — bintang lengkung",  fn:fAstroid},
  sikloid:      {nama:"A14 Sikloid — roda berguling",    fn:fSikloid},
  epikloid:     {nama:"A15 Epikloid — roda di roda",     fn:fEpikloid},
  hiposikloid:  {nama:"A16 Hiposikloid — roda dalam",    fn:fHipoSikloid},
  helixganda:   {nama:"A17 Heliks ganda",                fn:fHelixGanda},
  simpultorus:  {nama:"A18 Simpul torus (2,3)",          fn:fSimpulTorus},
  kleinpita:    {nama:"A19 Pita Klein",                  fn:fKleinPita},
  hopf:         {nama:"A20 Cincin Hopf",                 fn:fHopf},
  gelombangjalan:{nama:"A21 Gelombang berjalan",         fn:fGelombangJalan},
  interferensi: {nama:"A22 Interferensi dua sumber",     fn:fInterferensi},
  difraksi:     {nama:"A23 Difraksi — pola celah",       fn:fDifraksi},
  duapuncak:    {nama:"A24 Dua puncak Gauss",            fn:fDuaPuncak},
  tangga:       {nama:"A25 Tangga lurus",                fn:fTangga},
  piramida:     {nama:"A26 Piramida",                    fn:fPiramida},
  kubah:        {nama:"A27 Kubah bawang",                fn:fKubah},
  tabung:       {nama:"A28 Tabung berdinding",           fn:fTabung},
  kerucut:      {nama:"A29 Kerucut berlubang",           fn:fKerucut},
  prisma:       {nama:"A30 Prisma bergerigi",            fn:fPrisma},
  berduri:      {nama:"A31 Bola berduri",                fn:fBerduri},
  landak:       {nama:"A32 Landak bulu tajam",           fn:fLandak},
  kawah:        {nama:"A33 Kawah bulan",                 fn:fKawah},
  pegunungan:   {nama:"A34 Pegunungan fraktal",          fn:fPegunungan},
  bukitpasir:   {nama:"A35 Bukit pasir",                 fn:fBukitPasir},
  ombaklaut:    {nama:"A36 Ombak laut",                  fn:fOmbakLaut},
  apipanas:     {nama:"A37 Lidah api",                   fn:fApiPanas},
  saranglebah:  {nama:"A38 Sarang lebah",                fn:fSarangLebah},
  jaringlaba:   {nama:"A39 Jaring laba-laba",            fn:fJaringLaba},
  daun:         {nama:"A40 Daun berurat",                fn:fDaun},
  bungabunga:   {nama:"A41 Bunga berlapis",              fn:fBungaBunga},
  kerang:       {nama:"A42 Kerang bergelombang",         fn:fKerang},
  telur:        {nama:"A43 Telur",                       fn:fTelur},
  jam:          {nama:"A44 Wajah jam",                   fn:fJam},
  kompas:       {nama:"A45 Mawar kompas",               fn:fKompas},
  rodagigi:     {nama:"A46 Roda gigi",                   fn:fRodaGigi},
  perspiral:    {nama:"A47 Per spiral",                  fn:fPerSpiral},
  medanmagnet:  {nama:"A48 Medan magnet kutub",          fn:fMedanMagnet},
  vortex:       {nama:"A49 Pusaran",                     fn:fVortex},
  blackhole:    {nama:"A50 Corong lubang hitam",         fn:fBlackHole}
};
let bentukAktif = "torus";

const surfaceMat = new THREE.MeshStandardMaterial({
  color:PARAM.warna, roughness:PARAM.kilap, metalness:PARAM.logam,
  side:THREE.DoubleSide, flatShading:PARAM.datar
});
const surface = new THREE.Mesh(new THREE.BufferGeometry(), surfaceMat);
surface.position.y = 3.2;
surface.castShadow = true; surface.receiveShadow = true;
scene.add(surface);

function bangunPermukaan(){
  const p = PARAM, fn = MATEMATIKA[bentukAktif].fn;
  const N = Math.max(12, Math.round(p.detail));
  const verts = new Float32Array((N+1)*(N+1)*3);
  const idx = [];
  let k = 0;
  for(let j=0;j<=N;j++){
    for(let i=0;i<=N;i++){
      const q = fn(i/N, j/N, p);
      verts[k++]=q[0]; verts[k++]=q[1]; verts[k++]=q[2];
    }
  }
  for(let j=0;j<N;j++){
    for(let i=0;i<N;i++){
      const a=j*(N+1)+i, b=a+1, c=a+N+1, d=c+1;
      idx.push(a,c,b, b,c,d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(verts,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  surface.geometry.dispose();
  surface.geometry = g;
}

// ============================ HIBERKUBUS 1D → 5D (PARAM) ==================
// Titik di 5 dimensi diputar di setiap bidang, lalu "difoto" turun ke 3D.
const ND = {dim:4, skala:5.2, kecepatan:0.35, jarak:2.6, kedip:true};

const ndLineMat = new THREE.LineBasicMaterial({color:0xffb000, transparent:true, opacity:0.95});
const ndVertMat = new THREE.PointsMaterial({color:0x66e0ff, size:0.42, sizeAttenuation:true});

const ndGroup = new THREE.Group();
ndGroup.position.set(0, 11, -34);
scene.add(ndGroup);
// Geometri dialokasikan sekali untuk ukuran maksimum (5D = 32 titik / 80 sisi)
const ndLineGeo = new THREE.BufferGeometry();
ndLineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(160*3),3));
const ndPointGeo = new THREE.BufferGeometry();
ndPointGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(32*3),3));
const ndLines = new THREE.LineSegments(ndLineGeo, ndLineMat);
const ndPoints = new THREE.Points(ndPointGeo, ndVertMat);
ndGroup.add(ndLines); ndGroup.add(ndPoints);

function bangunND(){
  const d = Math.max(1, Math.round(ND.dim));
  const n = 1<<d;
  const verts = [];
  for(let i=0;i<n;i++){
    const v=[];
    for(let b=0;b<d;b++) v.push((i>>b)&1 ? 1 : -1);
    verts.push(v);
  }
  const seg = [];
  for(let i=0;i<n;i++){
    for(let b=0;b<d;b++){
      const j = i ^ (1<<b);
      if(j>i){ seg.push(i, j); }
    }
  }
  ndLines.userData.seg = seg;      // pasangan INDEKS titik
  ndLines.userData.verts = verts;  // koordinat nD tiap titik
  ndLines.userData.dim = d;
  ndLines.geometry.setDrawRange(0, seg.length*2);
  ndPoints.geometry.dispose();
  ndPoints.geometry = new THREE.BufferGeometry();
  ndPoints.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n*3),3));
  ndPoints.geometry.setDrawRange(0, n);
}

function rotasiND(p, i, j, ang){
  const c=Math.cos(ang), s=Math.sin(ang);
  const pi=p[i], pj=p[j];
  p[i]=pi*c-pj*s; p[j]=pi*s+pj*c;
}
function proyeksi3D(p){
  let q = p.slice();
  for(let d=q.length; d>3; d--){
    const k = ND.jarak/(ND.jarak - q[d-1]*0.55);
    for(let i=0;i<d-1;i++) q[i]*=k;
    q.pop();
  }
  return q;
}
function updateND(t){
  const seg = ndLines.userData.seg;
  if(!seg) return;
  const d = ndLines.userData.dim;
  const lpos = ndLines.geometry.attributes.position.array;
  const vpos = ndPoints.geometry.attributes.position.array;
  const cache = ndLines.userData.verts.map(function(v0){
    const p = v0.slice();
    let plane = 0;
    for(let i=0;i<d;i++) for(let j=i+1;j<d;j++){
      rotasiND(p, i, j, t*ND.kecepatan*(0.35 + plane*0.11));
      plane++;
    }
    return proyeksi3D(p).map(function(x){ return x*ND.skala; });
  });
  let k=0;
  for(let s=0;s<seg.length;s+=2){
    const a = cache[seg[s]], b = cache[seg[s+1]];
    lpos[k++]=a[0]; lpos[k++]=a[1]; lpos[k++]=a[2];
    lpos[k++]=b[0]; lpos[k++]=b[1]; lpos[k++]=b[2];
  }
  ndLines.geometry.attributes.position.needsUpdate = true;
  for(let i=0;i<cache.length;i++){
    vpos[i*3]=cache[i][0]; vpos[i*3+1]=cache[i][1]; vpos[i*3+2]=cache[i][2];
  }
  ndPoints.geometry.attributes.position.needsUpdate = true;
}

// ============================ SPONGE MENGER (fraktal 3D) ==================
// Kubus yang dilubangi berulang-ulang: level 0 = kubus, level 3 = 8.000 kubus.
const MENG = {level:2, ukuran:10, tampil:true};
const mengerMat = new THREE.MeshStandardMaterial({color:0xffb000, roughness:0.32, metalness:0.72});
const menger = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), mengerMat, 8000);
menger.position.set(32, 9, -26);
menger.castShadow = true; menger.receiveShadow = true;
scene.add(menger);

function bangunMenger(){
  const lv = Math.max(0, Math.min(3, Math.round(MENG.level)));
  const kotak = [];
  (function pahat(x,y,z,s,d){
    if(d===0){ kotak.push([x,y,z,s]); return; }
    const t=s/3;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) for(let k=-1;k<=1;k++){
      if(Math.abs(i)+Math.abs(j)+Math.abs(k) > 1) pahat(x+i*t, y+j*t, z+k*t, t, d-1);
    }
  })(0, 0, 0, MENG.ukuran, lv);
  const m = new THREE.Matrix4();
  const n = Math.min(kotak.length, 8000);
  for(let i=0;i<n;i++){
    const q = kotak[i];
    m.makeScale(q[3], q[3], q[3]);
    m.setPosition(q[0], q[1], q[2]);
    menger.setMatrixAt(i, m);
  }
  menger.count = n;
  menger.instanceMatrix.needsUpdate = true;
  menger.visible = MENG.tampil;
}

// ============================ PEMAIN (gerak bebas) =========================
const player = {
  pos:new THREE.Vector3(0, 6, 26),
  yaw:Math.PI, pitch:-0.12,
  speed:14, lari:3.1
};
const keys = {};
window.addEventListener("keydown", function(e){
  if(e.target && (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT")) return;
  keys[e.code]=true;
  if(e.code==="Tab"){ e.preventDefault(); document.getElementById("panel").classList.toggle("hidden"); }
  if(e.code==="KeyR"){ player.pos.set(0,6,26); player.yaw=Math.PI; player.pitch=-0.12; }
  if(e.code>="Digit1" && e.code<="Digit5"){
    ND.dim = parseInt(e.code.slice(5),10);
    syncPanel(); bangunND();
  }
});
window.addEventListener("keyup", function(e){ keys[e.code]=false; });

const welcome = document.getElementById("welcome");
welcome.addEventListener("click", function(){
  welcome.style.display="none";
  renderer.domElement.requestPointerLock();
});
renderer.domElement.addEventListener("click", function(){
  if(welcome.style.display!=="none") return;
  renderer.domElement.requestPointerLock();
});
window.addEventListener("mousemove", function(e){
  if(document.pointerLockElement !== renderer.domElement) return;
  player.yaw   -= e.movementX*0.0022;
  player.pitch -= e.movementY*0.0022;
  player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch));
});

function updatePlayer(dt){
  if(player.frozen) return;   // mod fraktal / menu: pemain dibekukan
  const sp = player.speed*(keys["ShiftLeft"]||keys["ShiftRight"] ? player.lari : 1)*dt;
  const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  if(keys["KeyW"]) player.pos.addScaledVector(fwd, sp);
  if(keys["KeyS"]) player.pos.addScaledVector(fwd, -sp);
  if(keys["KeyD"]) player.pos.addScaledVector(right, sp);
  if(keys["KeyA"]) player.pos.addScaledVector(right, -sp);
  if(keys["Space"]) player.pos.y += sp;
  if(keys["KeyC"]||keys["ControlLeft"]) player.pos.y -= sp;
  const gh = (window.GAME && window.GAME.groundHeight) ? window.GAME.groundHeight(player.pos.x, player.pos.z) : 0;
  if(player.pos.y < gh+1.6) player.pos.y = gh+1.6;

  camera.position.copy(player.pos);
  camera.rotation.set(0,0,0);
  camera.rotateY(player.yaw);
  camera.rotateX(player.pitch);

  // tanah & matahari mengikuti pemain → peta terasa tak terhingga
  ground.position.x = Math.round(player.pos.x/TILE)*TILE;
  ground.position.z = Math.round(player.pos.z/TILE)*TILE;
  sun.position.set(player.pos.x+180, 260, player.pos.z-300);
  sun.target.position.copy(player.pos);
  sun.target.updateMatrixWorld();
}

// ============================ PANEL PARAMETER ==============================
const panelBody = document.getElementById("panelBody");
function slider(grp, label, key, min, max, step, obj, onChange){
  return {t:"slider", grp:grp, label:label, key:key, min:min, max:max, step:step, obj:obj, onChange:onChange};
}
const UI = [
  {grp:"☰ DUNIA & PEMAIN"},
  slider("","Kecepatan jalan","speed",2,60,1,player),
  slider("","Kabut jarak","fog",200,4000,50,{fog:2600}, function(v){ scene.fog.far=v; }),

  {grp:"∑ OBJEK MATEMATIKA"},
  {t:"select", grp:"", label:"Rumus bentuk", key:"bentuk", options:Object.keys(MATEMATIKA).map(function(k){return [k, MATEMATIKA[k].nama];}),
   onChange:function(v){ bentukAktif=v; bangunPermukaan(); }},
  slider("","Ukuran","ukuran",1,30,0.1,PARAM, function(){ bangunPermukaan(); }),
  slider("","Tebal / radius","tebal",0.2,12,0.1,PARAM, function(){ bangunPermukaan(); }),
  slider("","Frekuensi","frekuensi",0.5,16,0.1,PARAM, function(){ bangunPermukaan(); }),
  slider("","Amplitudo","amplitudo",0,2,0.01,PARAM, function(){ bangunPermukaan(); }),
  slider("","Putaran (twist)","twist",-6,6,0.05,PARAM, function(){ bangunPermukaan(); }),
  slider("","Detail mesh","detail",16,180,1,PARAM, function(){ bangunPermukaan(); }),
  slider("","Iterasi fraktal","iterasi",4,80,1,PARAM, function(){ bangunPermukaan(); }),
  slider("","Eksponen bentuk","eksponen",0.2,4,0.05,PARAM, function(){ bangunPermukaan(); }),
  slider("","Kilau logam","logam",0,1,0.01,PARAM, function(v){ surfaceMat.metalness=v; }),
  slider("","Kasar permukaan","kilap",0.02,1,0.01,PARAM, function(v){ surfaceMat.roughness=v; }),
  {t:"check", label:"Mode kawat (wireframe)", key:"wireframe", obj:PARAM,
   onChange:function(v){ surfaceMat.wireframe=v; }},
  {t:"check", label:"Bidang datar (flat shading)", key:"datar", obj:PARAM,
   onChange:function(v){ surfaceMat.flatShading=v; surfaceMat.needsUpdate=true; }},

  {grp:"✦ HIBERKUBUS 1D → 5D"},
  slider("","Dimensi (1 sampai 5)","dim",1,5,1,ND, function(){ bangunND(); }),
  slider("","Ukuran","skala",1,14,0.1,ND),
  slider("","Kecepatan rotasi","kecepatan",0,2,0.01,ND),
  slider("","Jarak proyeksi 4D","jarak",1.2,6,0.05,ND),

  {grp:"▦ SPONGE MENGER — fraktal 3D"},
  slider("","Level rekursi","level",0,3,1,MENG, function(){ bangunMenger(); }),
  slider("","Ukuran kubus","ukuran",2,22,0.5,MENG, function(){ bangunMenger(); }),
  {t:"check", label:"Tampilkan Menger", key:"tampil", obj:MENG,
   onChange:function(v){ menger.visible=v; }},

  {grp:"⚙ TAMPILAN"},
  slider("","Cahaya matahari","matahari",0,2.5,0.05,{matahari:1.25}, function(v){ sun.intensity=v; }),
  slider("","Paparan cahaya","exposure",0.4,2,0.05,{exposure:1.05}, function(v){ renderer.toneMappingExposure=v; }),
  {t:"button", label:"Reset semua parameter", onClick:function(){
     PARAM.ukuran=7; PARAM.tebal=2.4; PARAM.frekuensi=3; PARAM.amplitudo=0.35; PARAM.twist=1.2; PARAM.detail=96;
     PARAM.iterasi=28; PARAM.eksponen=1;
     ND.skala=5.2; ND.kecepatan=0.35; ND.jarak=2.6;
     MENG.level=2; MENG.ukuran=10; MENG.tampil=true;
     surfaceMat.metalness=PARAM.logam; surfaceMat.roughness=PARAM.kilap;
     bangunPermukaan(); bangunND(); bangunMenger(); syncPanel();
  }}
];

const sliders = [];
function panelGroup(title){
  const g=document.createElement("div"); g.className="grp"; g.textContent=title;
  panelBody.appendChild(g); return g;
}
function mkSlider(item){
  const row=document.createElement("div"); row.className="row";
  const lab=document.createElement("label");
  const val=document.createElement("b");
  lab.innerHTML = "<span>"+item.label+"</span>";
  lab.appendChild(val);
  const inp=document.createElement("input");
  inp.type="range"; inp.min=item.min; inp.max=item.max; inp.step=item.step;
  inp.value = item.obj[item.key];
  val.textContent = inp.value;
  inp.addEventListener("input", function(){
    const v = parseFloat(inp.value);
    item.obj[item.key] = v;
    val.textContent = inp.value;
    if(item.onChange) item.onChange(v);
  });
  row.appendChild(lab); row.appendChild(inp); panelBody.appendChild(row);
  sliders.push({item:item, inp:inp, val:val});
  return row;
}
function mkSelect(item){
  const row=document.createElement("div"); row.className="row";
  const lab=document.createElement("label"); lab.innerHTML="<span>"+item.label+"</span>";
  const sel=document.createElement("select");
  item.options.forEach(function(o){
    const op=document.createElement("option"); op.value=o[0]; op.textContent=o[1];
    sel.appendChild(op);
  });
  sel.addEventListener("change", function(){
    if(item.obj && item.key) item.obj[item.key] = sel.value;
    item.onChange(sel.value);
  });
  row.appendChild(lab); row.appendChild(sel); panelBody.appendChild(row);
  return row;
}
function mkCheck(item){
  const row=document.createElement("div"); row.className="row chk";
  const inp=document.createElement("input");
  inp.type="checkbox"; inp.checked=!!item.obj[item.key];
  inp.addEventListener("change", function(){ item.obj[item.key]=inp.checked; item.onChange(inp.checked); });
  row.appendChild(inp);
  const sp=document.createElement("span"); sp.textContent=item.label;
  row.appendChild(sp); panelBody.appendChild(row);
  return row;
}
function mkButton(item){
  const row=document.createElement("div"); row.className="row";
  const b=document.createElement("button"); b.className="mini"; b.textContent=item.label;
  b.addEventListener("click", item.onClick);
  row.appendChild(b); panelBody.appendChild(row);
  return row;
}
UI.forEach(function(item){
  if(item.grp){ panelGroup(item.grp); return; }
  if(item.t==="slider") mkSlider(item);
  else if(item.t==="select") mkSelect(item);
  else if(item.t==="check") mkCheck(item);
  else if(item.t==="button") mkButton(item);
});
function syncPanel(){
  sliders.forEach(function(s){
    s.inp.value = s.item.obj[s.item.key];
    s.val.textContent = s.inp.value;
  });
}

// ============================ LOOP UTAMA ===================================
let last = performance.now(), fpsAcc = 0, fpsN = 0, fpsT = 0;
bangunPermukaan();
bangunND();
bangunMenger();

function animate(){
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now-last)/1000, 0.05);
  last = now;
  const t = now/1000;

  updatePlayer(dt);
  updateND(t);

  // gelembung melayang
  for(let i=0;i<bubbles.length;i++){
    const b = bubbles[i];
    b.position.y = b.userData.y0 + Math.sin(t*b.userData.sp + b.userData.ph)*2.4;
    b.rotation.y += dt*0.12;
  }
  // objek matematika berputar pelan + "bernapas"
  surface.rotation.y += dt*0.12;
  menger.rotation.y += dt*0.16;
  menger.rotation.x = Math.sin(t*0.12)*0.12;

  // kaitan modul (dunia, fraktal, bina, misi) — dipanggil setiap frame
  if(window.GAME && window.GAME.updates){
    const ups = window.GAME.updates;
    for(let i=0;i<ups.length;i++) ups[i](dt, t);
  }

  renderer.render(scene, camera);

  // HUD statistik
  fpsAcc += 1/Math.max(dt,0.0001); fpsN++;
  if(now - fpsT > 500){
    document.getElementById("stat").textContent =
      "FPS " + Math.round(fpsAcc/fpsN) + " · dim " + Math.round(ND.dim) + " · " + MATEMATIKA[bentukAktif].nama.split("—")[0].trim();
    fpsAcc=0; fpsN=0; fpsT=now;
  }
}
animate();

window.addEventListener("resize", function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================== ANTARAMUKA UNTUK MODUL (API dalaman) ===================
window.GAME = {
  THREE: THREE, renderer: renderer, scene: scene, camera: camera,
  sun: sun, fill: fill, ground: ground, skyMat: skyMat, gridTex: gridTex,
  player: player, keys: keys, surface: surface, surfaceMat: surfaceMat,
  PARAM: PARAM, ND: ND, MENG: MENG, MATEMATIKA: MATEMATIKA,
  getBentuk: function(){ return bentukAktif; },
  setBentuk: function(k){ bentukAktif=k; bangunPermukaan(); },
  bangunPermukaan: bangunPermukaan, bangunND: bangunND, bangunMenger: bangunMenger,
  panel: { group: panelGroup, slider: mkSlider, select: mkSelect, check: mkCheck, button: mkButton, sync: syncPanel, body: panelBody },
  updates: [],                 // fn(dt,t) dipanggil setiap frame
  hooks: {},                   // tempat modul daftar fungsi (mis. groundHeight)
  groundHeight: null,          // dipasang oleh modul dunia (20-world.js)
  TILE: TILE, bubbles: bubbles, menger: menger
};

})();
