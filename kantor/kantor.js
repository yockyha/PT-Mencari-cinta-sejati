// =====================================================================
//  KANTOR VIRTUAL — PT MENCARI CINTA SEJATI
//  Dunia 3D (three.js) + karyawan lain (online / lokal) + chat.
// =====================================================================
import * as THREE from 'three';
import { CFG, DIVISI, STATUS, LS, bersih, igBersih, kasar, esc, fmt, hash, profil, simpanProfil, jamJakarta } from '../js/common.js';
import { buatNet } from '../js/net.js';

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const acak = a => a[Math.floor(Math.random() * a.length)];
const sudutLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
function ukuran() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 0.8 ? 72 : 55;
  camera.updateProjectionMatrix();
}
addEventListener('resize', ukuran); ukuran();

const hemi = new THREE.HemisphereLight(0xffffff, 0xe0c2b8, 1.15);
const matahari = new THREE.DirectionalLight(0xfff3e6, 2.2);
matahari.position.set(28, 46, 22);
matahari.castShadow = true;
matahari.shadow.mapSize.set(2048, 2048);
Object.assign(matahari.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 140 });
matahari.shadow.bias = -0.0004;
matahari.shadow.normalBias = 0.03;
scene.add(hemi, matahari, matahari.target);
scene.fog = new THREE.Fog(0xbfe3ff, 70, 170);

// ---------------------------------------------------------------- bahan dasar
const GEO = new THREE.BoxGeometry(1, 1, 1);
const _mat = {};
const M = (c, o = {}) => _mat[c + JSON.stringify(o)] ||= new THREE.MeshLambertMaterial({ color: c, ...o });
const KACA = new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.32, depthWrite: false });

const tabrak = [];   // kotak tabrakan {x1,x2,z1,z2}
const kursi = [];    // tempat duduk {x,z,r,y}
const titikAksi = []; // {x,z,r,label,aksi}

function kotak(w, h, d, x, y, z, warna, { tab = false, mat = null, bayang = true } = {}) {
  const m = new THREE.Mesh(GEO, mat || M(warna));
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  m.castShadow = bayang; m.receiveShadow = true;
  scene.add(m);
  if (tab) tabrak.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2 });
  return m;
}
const TINGGI_DINDING = 2.7;
function dinding(x1, z1, x2, z2, { kaca = false, warna = '#f7ece6', tinggi = TINGGI_DINDING } = {}) {
  const t = 0.26;
  const w = Math.abs(x2 - x1) || t, d = Math.abs(z2 - z1) || t;
  const m = kotak(w, tinggi, d, (x1 + x2) / 2, 0, (z1 + z2) / 2, warna, { tab: true, mat: kaca ? KACA : null, bayang: !kaca });
  if (kaca) { // kusen
    kotak(w + 0.02, 0.12, d + 0.02, (x1 + x2) / 2, tinggi - 0.12, (z1 + z2) / 2, '#5b3a4a');
    kotak(w + 0.02, 0.12, d + 0.02, (x1 + x2) / 2, 0, (z1 + z2) / 2, '#5b3a4a');
  }
  return m;
}
function lantai(x1, z1, x2, z2, warna, y = 0.01, mat = null) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), mat || M(warna));
  m.rotation.x = -Math.PI / 2;
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// canvas → tekstur
function kanvas(w, h, gambar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const ulang = () => { x.clearRect(0, 0, w, h); gambar(x, w, h); t.needsUpdate = true; };
  ulang();
  return { t, c, x, ulang, set gambar(f) { gambar = f; } };
}
function bidangTeks(lebar, tinggi, px, kv, x, y, z, rotY = 0, { basic = true } = {}) {
  const mat = basic ? new THREE.MeshBasicMaterial({ map: kv.t, toneMapped: false }) : new THREE.MeshLambertMaterial({ map: kv.t });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar, tinggi), mat);
  m.position.set(x, y, z); m.rotation.y = rotY;
  scene.add(m);
  return m;
}
function bungkus(x, teks, maxW) {
  const kata = String(teks).split(' '), baris = []; let b = '';
  for (const k of kata) { const c = b ? b + ' ' + k : k; if (x.measureText(c).width > maxW && b) { baris.push(b); b = k; } else b = c; }
  if (b) baris.push(b);
  return baris;
}
function bulat(x, X, Y, W, H, r) { x.beginPath(); x.roundRect(X, Y, W, H, r); }
const FD = (px, w = 700) => `${w} ${px}px Fredoka, Nunito, sans-serif`;
const FB = (px, w = 800) => `${w} ${px}px Nunito, sans-serif`;

// ---------------------------------------------------------------- DUNIA
function bangunDunia() {
  // tanah & jalan
  lantai(-120, -120, 120, 120, '#9fd17a', 0);
  lantai(-4, 20, 4, 70, '#e9dccf', 0.02);         // jalan setapak
  lantai(-120, 52, 120, 64, '#585a66', 0.015);      // jalan raya
  for (let x = -116; x < 120; x += 8) lantai(x, 57.7, x + 4, 58.3, '#ffffff', 0.025);
  lantai(-30, -26, 30, 26, '#cbb7ae', 0.012);       // pondasi

  // lantai ruangan
  lantai(-24, 10, 24, 20, '#f4ece4', 0.03);          // lobi (marmer)
  lantai(-24, -7, 14, 10, '#c9d6e8', 0.03);          // area kerja (karpet)
  lantai(-8, -20, 14, -7, '#d7cdea', 0.03);          // koridor dinding karyawan
  lantai(14, -7, 24, 12, '#fbe2a8', 0.03);           // pantry
  lantai(14, -20, 24, -7, '#8fcf6b', 0.03);          // taman curhat
  lantai(-24, -20, -8, -7, '#c99a6b', 0.031);        // ruang rapat (kayu)
  lantai(-24, 0, -15, 10, '#bfe3e0', 0.032);         // ruang loker
  // motif ubin pantry
  for (let x = 14; x < 24; x += 2) for (let z = -7; z < 12; z += 2) if (((x + z) / 2) % 2 === 0) lantai(x, z, x + 2, z + 2, '#f6cf7f', 0.035);

  // dinding luar
  dinding(-24, -20, 24, -20);
  dinding(-24, -20, -24, 20);
  dinding(24, -20, 24, 20);
  dinding(-24, 20, -3, 20, { kaca: true });
  dinding(3, 20, 24, 20, { kaca: true });
  // pantry & taman
  dinding(14, -7, 14, 1); dinding(14, 4, 14, 12);
  dinding(14, -7, 17, -7); dinding(20, -7, 24, -7);
  dinding(14, -20, 14, -7);
  // ruang rapat (kaca)
  dinding(-8, -20, -8, -11, { kaca: true }); dinding(-8, -9, -8, -7, { kaca: true });
  dinding(-24, -7, -8, -7, { kaca: true });
  // ruang loker
  dinding(-24, 0, -15, 0); dinding(-15, 0, -15, 4); dinding(-15, 6, -15, 10); dinding(-24, 10, -15, 10);

  // ---- papan nama gedung (di atas pintu, menghadap luar)
  const logo = kanvas(1024, 192, (x, w, h) => {
    x.fillStyle = '#ff4f7b'; bulat(x, 0, 0, w, h, 40); x.fill();
    x.fillStyle = '#fff'; x.font = FD(92); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('❤ ' + CFG.namaPT.toUpperCase(), w / 2, h / 2 + 4, w - 60);
  });
  kotak(14.5, 2.9, 0.3, 0, TINGGI_DINDING, 20.1, '#2a1420');
  bidangTeks(14, 2.6, 0, logo, 0, TINGGI_DINDING + 1.45, 20.27);
  bidangTeks(14, 2.6, 0, logo, 0, TINGGI_DINDING + 1.45, 19.93, Math.PI);
  // kanopi pintu
  kotak(8, 0.2, 3, 0, TINGGI_DINDING - 0.1, 21.5, '#ff4f7b');
  kotak(0.2, TINGGI_DINDING - 0.1, 0.2, -3.8, 0, 22.9, '#2a1420', { tab: true });
  kotak(0.2, TINGGI_DINDING - 0.1, 0.2, 3.8, 0, 22.9, '#2a1420', { tab: true });

  // ---- LOBI
  kotak(5.6, 1.1, 1.1, 0, 0, 13, '#ff4f7b', { tab: true });
  kotak(5.8, 0.08, 1.3, 0, 1.1, 13, '#fff6ef');
  kotak(0.5, 0.5, 0.05, 1.6, 1.18, 12.8, '#333a44');
  kursiKantor(0, 11.9, 0, '#2a1420', false);
  orangDiam(0, 11.95, 0, { k: 1, b: 7, c: 0, r: 1, w: 0, a: 4 }, 'Mbak Resepsionis');
  titikAksi.push({ x: 0, z: 14.3, r: 1.8, label: 'Tanya resepsionis', aksi: bukaResepsionis });
  sofa(-9, 16.5, 0); sofa(9, 16.5, 0);
  kotak(2.2, 0.4, 1, -9, 0, 14.6, '#c99a6b', { tab: true }); kotak(2.2, 0.4, 1, 9, 0, 14.6, '#c99a6b', { tab: true });
  for (const [x, z] of [[-21.5, 18], [21.5, 18], [-21.5, 11.5], [21.5, 11.5], [-4.5, 18.5], [4.5, 18.5]]) pot(x, z);
  // lift (hiasan)
  for (const x of [-20, -16.6]) {
    kotak(2.4, 2.5, 0.2, x, 0, 10.2, '#aeb6c2', { tab: true });
    kotak(0.04, 2.3, 0.22, x, 0.05, 10.2, '#6c7480');
  }
  titikAksi.push({ x: -18.3, z: 11.6, r: 1.8, label: 'Naik lift', aksi: () => toast('Lift sedang perbaikan… seperti hatimu. Pakai tangga perasaan dulu ya.') });
  // mading HRD
  madingHRD(10, 10.15, 0);
  titikAksi.push({ x: 10, z: 11.5, r: 1.8, label: 'Baca mading HRD', aksi: bukaMading });

  // ---- AREA KERJA: 8 meja, tiap meja satu divisi
  const kluster = [[-9.5, -2], [-3.5, -2], [3.5, -2], [9.5, -2], [-9.5, 5], [-3.5, 5], [3.5, 5], [9.5, 5]];
  kluster.forEach(([x, z], i) => mejaDivisi(x, z, DIVISI[i], i));
  // printer
  kotak(1.1, 0.9, 0.8, 12.6, 0, 8.6, '#e9e4dd', { tab: true });
  kotak(0.8, 0.12, 0.5, 12.6, 0.9, 8.6, '#5b5f6a');
  kotak(0.5, 0.02, 0.36, 12.6, 1.02, 8.6, '#ffffff');
  titikAksi.push({ x: 12.6, z: 7.5, r: 1.5, label: 'Cetak ID Card', aksi: () => { location.href = '../idcard/index.html'; } });
  for (const [x, z] of [[-13, 9], [13, -6], [-13, -6], [0, -6]]) pot(x, z);
  // dispenser
  kotak(0.5, 1.2, 0.5, -13, 0, -5.2, '#dfe7ef', { tab: true });
  kotak(0.36, 0.5, 0.36, -13, 1.2, -5.2, '#8fd3ff', { mat: new THREE.MeshLambertMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7 }) });

  // ---- DINDING KARYAWAN (koridor utara)
  dindingKaryawan();
  titikAksi.push({ x: 3, z: -17.6, r: 3.2, label: 'Cari namamu di dinding', aksi: bukaDinding });
  kotak(1.6, 0.45, 0.5, -2, 0, -14.5, '#c99a6b', { tab: true }); kursi.push({ x: -2, z: -14.5, r: Math.PI, y: 0.45 });
  kotak(1.6, 0.45, 0.5, 8, 0, -14.5, '#c99a6b', { tab: true }); kursi.push({ x: 8, z: -14.5, r: Math.PI, y: 0.45 });

  // ---- RUANG RAPAT
  kotak(8.4, 0.08, 2.4, -16, 0.74, -13.5, '#6b4630', { tab: false });
  kotak(7.6, 0.74, 1.6, -16, 0, -13.5, '#4d3122', { tab: true });
  for (let i = 0; i < 5; i++) {
    const x = -19.4 + i * 1.7;
    kursiKantor(x, -15.3, 0, '#ff4f7b');
    kursiKantor(x, -11.7, Math.PI, '#ff4f7b');
  }
  kursiKantor(-20.9, -13.5, Math.PI / 2, '#2a1420');
  papanRapat();
  titikAksi.push({ x: -16, z: -17.9, r: 2.4, label: 'Tulis di papan rapat', aksi: bukaPapan });
  bidangTeks(3.4, 0.5, 0, kanvas(512, 76, (x, w, h) => {
    x.fillStyle = '#2a1420'; bulat(x, 0, 0, w, h, 16); x.fill();
    x.fillStyle = '#fff'; x.font = FD(44); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RUANG RAPAT PERASAAN', w / 2, h / 2 + 2, w - 20);
  }), -12, 2.25, -6.85);
  pot(-9, -19); pot(-23, -8);

  // ---- PANTRY
  kotak(1.4, 1.0, 17, 23.1, 0, 2.5, '#fff6ef', { tab: true });
  kotak(1.5, 0.08, 17.1, 23.1, 1.0, 2.5, '#d35470');
  mesinKopi(23.1, 1.08, 1.0);
  titikAksi.push({ x: 21.7, z: 1.0, r: 1.8, label: 'Bikin kopi', aksi: bukaKopi });
  kotak(1.3, 2.2, 1.2, 23.0, 0, 10.9, '#e8eef3', { tab: true });
  kotak(0.06, 0.6, 0.06, 22.32, 1.2, 10.5, '#9aa3ad');
  kotak(1.2, 0.7, 1.0, 23.1, 1.08, -4.5, '#f2f2f2'); // microwave
  kotak(0.8, 0.45, 0.04, 22.55, 1.2, -4.5, '#333a44');
  for (const [x, z] of [[18, -2.5], [18, 7.5]]) mejaBundar(x, z);
  pot(15, 11); pot(15, -6);
  bidangTeks(2.6, 0.5, 0, kanvas(512, 96, (x, w, h) => {
    x.fillStyle = '#d35470'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#fff'; x.font = FD(56); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('☕ PANTRY', w / 2, h / 2 + 3);
  }), 14.15, 2.2, 2.5, Math.PI / 2);

  // ---- TAMAN CURHAT
  airMancur(19, -13.5);
  titikAksi.push({ x: 19, z: -11, r: 2.4, label: 'Lempar koin harapan', aksi: bukaKoin });
  for (const [x, z] of [[15.6, -19], [22.6, -19], [15.6, -8.6], [22.6, -8.6]]) pohon(x, z, 0.85);
  bangkuTaman(16.0, -13.5, Math.PI / 2); bangkuTaman(22.0, -13.5, -Math.PI / 2);
  bidangTeks(3, 0.55, 0, kanvas(512, 96, (x, w, h) => {
    x.fillStyle = '#2f9e6e'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#fff'; x.font = FD(50); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🌷 TAMAN CURHAT', w / 2, h / 2 + 3, w - 20);
  }), 18.5, 2.25, -6.85);

  // ---- RUANG LOKER
  for (let i = 0; i < 8; i++) {
    const z = 1 + i * 1.1;
    kotak(0.7, 2.1, 1.0, -23.5, 0, z + 0.5, i % 2 ? '#7fb3d5' : '#5d9cc9', { tab: true });
    kotak(0.04, 0.3, 0.08, -23.13, 1.1, z + 0.75, '#2a1420');
  }
  kotak(0.08, 1.8, 1.4, -15.3, 0.3, 2, '#dff3ff', { mat: new THREE.MeshLambertMaterial({ color: 0xe8f6ff, emissive: 0x334455 }) }); // cermin
  kotak(2.2, 0.45, 0.6, -19.5, 0, 5, '#c99a6b', { tab: true }); kursi.push({ x: -19.5, z: 5, r: Math.PI / 2, y: 0.45 });
  titikAksi.push({ x: -20, z: 7, r: 2.6, label: 'Ganti penampilan', aksi: bukaLoker });
  bidangTeks(2.4, 0.45, 0, kanvas(512, 96, (x, w, h) => {
    x.fillStyle = '#5d9cc9'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#fff'; x.font = FD(52); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('👔 RUANG LOKER', w / 2, h / 2 + 3, w - 20);
  }), -14.85, 2.25, 5, Math.PI / 2);

  // ---- LUAR KANTOR
  patungHati(-14, 32); patungHati(14, 32);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, r = 44 + (i % 3) * 5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.85;
    if (z > 46 && z < 68) continue;
    if (Math.abs(x) < 6 && z > 20) continue;
    pohon(x, z, 1 + (i % 4) * 0.2);
  }
  for (const x of [-8, 8]) for (const z of [26, 34, 42]) pohon(x, z, 0.8);
  // gedung tetangga
  const TET = ['#f5b7c5', '#c9d6e8', '#fbe2a8', '#d7cdea', '#bfe3e0'];
  for (let i = 0; i < 12; i++) {
    const x = -88 + i * 16, h = 10 + (i * 37 % 5) * 4;
    kotak(12, h, 10, x, 0, 78, TET[i % TET.length], { tab: true });
    for (let f = 2; f < h - 1; f += 3) kotak(10, 1.1, 10.1, x, f, 78, '#8fbcd9');
  }
  // batas dunia
  tabrak.push({ x1: -100, x2: 100, z1: 50, z2: 51 });
  tabrak.push({ x1: -100, x2: -99, z1: -100, z2: 51 }, { x1: 99, x2: 100, z1: -100, z2: 51 }, { x1: -100, x2: 100, z1: -100, z2: -99 });
}

// ---------------------------------------------------------------- perabot
function kursiKantor(x, z, r, warna = '#2a1420', duduk = true) {
  const g = new THREE.Group();
  const add = (w, h, d, px, py, pz, c) => { const m = new THREE.Mesh(GEO, M(c)); m.scale.set(w, h, d); m.position.set(px, py, pz); m.castShadow = true; g.add(m); };
  add(0.55, 0.08, 0.55, 0, 0.45, 0, warna);
  add(0.55, 0.55, 0.08, 0, 0.75, -0.26, warna);
  add(0.06, 0.4, 0.06, 0, 0.22, 0, '#555');
  add(0.5, 0.04, 0.06, 0, 0.03, 0, '#555'); add(0.06, 0.04, 0.5, 0, 0.03, 0, '#555');
  g.position.set(x, 0, z); g.rotation.y = r;
  scene.add(g);
  if (duduk) kursi.push({ x, z, r, y: 0.47 });
}
function mejaDivisi(cx, cz, nama, i) {
  kotak(2.9, 0.06, 1.7, cx, 0.74, cz, '#fff6ef', { tab: false });
  kotak(2.7, 0.74, 1.5, cx, 0, cz, '#d9c6bb', { tab: true });
  kotak(0.04, 0.35, 1.5, cx, 0.8, cz, '#ffb3c6'); // sekat
  for (const sx of [-0.7, 0.7]) for (const sz of [-1, 1]) {
    const mx = cx + sx, mz = cz + sz * 0.42;
    kotak(0.62, 0.38, 0.04, mx, 0.92, mz - sz * 0.12, '#2b2d42');
    const layar = ['#8fd3ff', '#ffb3c6', '#ffe08a', '#b9f3c9'][(i * 3 + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0)) % 4];
    kotak(0.56, 0.3, 0.01, mx, 0.96, mz - sz * 0.12 + sz * 0.025, layar, { mat: new THREE.MeshBasicMaterial({ color: layar }) });
    kotak(0.06, 0.12, 0.06, mx, 0.8, mz - sz * 0.12, '#2b2d42');
    kotak(0.4, 0.02, 0.14, mx, 0.8, mz + sz * 0.12, '#444');
    if ((i + sx + sz) % 3 === 0) kotak(0.12, 0.14, 0.12, mx + 0.3, 0.8, mz + sz * 0.15, '#ff4f7b'); // mug
    kursiKantor(mx, cz + sz * 1.3, sz > 0 ? Math.PI : 0, ['#ff4f7b', '#2a1420', '#5d9cc9', '#2f9e6e'][i % 4]);
  }
  // papan divisi menggantung
  const kv = kanvas(512, 110, (x, w, h) => {
    x.fillStyle = '#2a1420'; bulat(x, 0, 0, w, h, 20); x.fill();
    x.fillStyle = '#ffd23f'; x.font = FD(46); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(nama, w / 2, h / 2 + 2, w - 26);
  });
  kotak(0.03, 0.9, 0.03, cx - 1.1, 2.5, cz, '#2a1420', { bayang: false });
  kotak(0.03, 0.9, 0.03, cx + 1.1, 2.5, cz, '#2a1420', { bayang: false });
  bidangTeks(2.6, 0.56, 0, kv, cx, 2.25, cz + 0.02);
  bidangTeks(2.6, 0.56, 0, kv, cx, 2.25, cz - 0.02, Math.PI);
}
function sofa(x, z, r) {
  kotak(3.2, 0.45, 1.0, x, 0, z, '#ff8fab', { tab: true });
  kotak(3.2, 0.6, 0.3, x, 0.45, z + 0.35, '#ff6f91');
  kotak(0.3, 0.35, 1.0, x - 1.45, 0.45, z, '#ff6f91'); kotak(0.3, 0.35, 1.0, x + 1.45, 0.45, z, '#ff6f91');
  for (const dx of [-0.8, 0, 0.8]) kursi.push({ x: x + dx, z: z - 0.05, r: Math.PI, y: 0.45 });
}
function pot(x, z) {
  kotak(0.6, 0.55, 0.6, x, 0, z, '#d35470', { tab: true });
  const daun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), M('#3fa66a', { flatShading: true }));
  daun.position.set(x, 1.15, z); daun.castShadow = true; scene.add(daun);
}
function pohon(x, z, s = 1) {
  kotak(0.35 * s, 1.6 * s, 0.35 * s, x, 0, z, '#7a5236', { tab: true });
  const d = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 0), M(['#5cb85c', '#4aa35a', '#6cc070'][Math.abs(Math.round(x + z)) % 3], { flatShading: true }));
  d.position.set(x, 2.3 * s, z); d.castShadow = true; scene.add(d);
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 * s, 0), M('#ff6f91'));
  b.position.set(x + 0.9 * s, 2.6 * s, z + 0.6 * s); scene.add(b);
}
function mejaBundar(x, z) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.07, 24), M('#ffffff'));
  top.position.set(x, 0.76, z); top.castShadow = true; scene.add(top);
  kotak(0.1, 0.74, 0.1, x, 0, z, '#555', { tab: true });
  tabrak.push({ x1: x - 0.5, x2: x + 0.5, z1: z - 0.5, z2: z + 0.5 });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, sx = x + Math.sin(a) * 1.25, sz = z + Math.cos(a) * 1.25;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.47, 14), M('#ffd23f'));
    st.position.set(sx, 0.235, sz); st.castShadow = true; scene.add(st);
    kursi.push({ x: sx, z: sz, r: a + Math.PI, y: 0.47 });
  }
}
function mesinKopi(x, y, z) {
  kotak(0.7, 0.75, 0.6, x, y, z, '#2b2d42');
  kotak(0.5, 0.18, 0.62, x, y + 0.75, z, '#ff4f7b');
  kotak(0.12, 0.1, 0.12, x - 0.3, y + 0.25, z, '#c0c0c0');
  kotak(0.12, 0.14, 0.12, x - 0.42, y, z, '#ffffff');
}
function bangkuTaman(x, z, r) {
  const g = new THREE.Group();
  const add = (w, h, d, px, py, pz, c) => { const m = new THREE.Mesh(GEO, M(c)); m.scale.set(w, h, d); m.position.set(px, py, pz); m.castShadow = true; g.add(m); };
  add(2.2, 0.08, 0.6, 0, 0.45, 0, '#b5703f'); add(2.2, 0.45, 0.08, 0, 0.75, -0.3, '#b5703f');
  add(0.08, 0.45, 0.5, -0.95, 0.22, 0, '#444'); add(0.08, 0.45, 0.5, 0.95, 0.22, 0, '#444');
  g.position.set(x, 0, z); g.rotation.y = r; scene.add(g);
  const ax = Math.abs(Math.sin(r)) > 0.5;
  tabrak.push(ax ? { x1: x - 0.3, x2: x + 0.3, z1: z - 1.1, z2: z + 1.1 } : { x1: x - 1.1, x2: x + 1.1, z1: z - 0.3, z2: z + 0.3 });
  for (const d of [-0.55, 0.55]) kursi.push({ x: x + (ax ? Math.sin(r) * 0.05 : d), z: z + (ax ? d : 0.05), r, y: 0.47 });
}
let airHati = null;
function airMancur(x, z) {
  const kolam = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, 0.55, 32), M('#e9dccf'));
  kolam.position.set(x, 0.27, z); kolam.castShadow = true; kolam.receiveShadow = true; scene.add(kolam);
  const air = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.05, 32), new THREE.MeshLambertMaterial({ color: 0x6ec6ff, emissive: 0x113355 }));
  air.position.set(x, 0.52, z); scene.add(air);
  tabrak.push({ x1: x - 1.9, x2: x + 1.9, z1: z - 1.9, z2: z + 1.9 });
  airHati = bentukHati(0.55, '#ff4f7b'); airHati.position.set(x, 1.5, z); scene.add(airHati);
  kotak(0.25, 0.9, 0.25, x, 0.5, z, '#e9dccf');
}
function bentukHati(s, warna) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -1); sh.bezierCurveTo(-0.2, -0.75, -1.2, -0.35, -1.2, 0.3); sh.bezierCurveTo(-1.2, 0.9, -0.45, 1.15, 0, 0.6);
  sh.bezierCurveTo(0.45, 1.15, 1.2, 0.9, 1.2, 0.3); sh.bezierCurveTo(1.2, -0.35, 0.2, -0.75, 0, -1);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3, curveSegments: 16 });
  g.center();
  const m = new THREE.Mesh(g, M(warna)); m.scale.setScalar(s); m.castShadow = true;
  return m;
}
const hatiBesar = [];
function patungHati(x, z) {
  kotak(2.6, 0.8, 2.6, x, 0, z, '#fff6ef', { tab: true });
  const h = bentukHati(1.3, '#ff4f7b'); h.position.set(x, 2.6, z); scene.add(h); hatiBesar.push(h);
}
function orangDiam(x, z, r, look, nama) {
  const ch = buatKarakter(look); ch.position.set(x, 0, z); ch.rotation.y = r; scene.add(ch);
  pose(ch, 2, 0); ch.userData.tubuh.position.y = -0.3;
  const l = labelNama(nama, true); l.position.y = 1.8; ch.add(l);
}
let teksMading = null;
function madingHRD(x, z, r) {
  kotak(3.4, 2.0, 0.12, x, 0.35, z, '#b5703f');
  teksMading = kanvas(680, 380, (c, w, h) => {
    c.fillStyle = '#f3dfc1'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff4f7b'; c.font = FD(44); c.textAlign = 'center'; c.fillText('📌 MADING HRD', w / 2, 52);
    c.textAlign = 'left'; let y = 100;
    for (const m of CFG.mading.slice(0, 3)) {
      c.fillStyle = '#fff'; bulat(c, 18, y - 26, w - 36, 82, 10); c.fill();
      c.fillStyle = '#2a1420'; c.font = FB(24, 900); c.fillText(m.judul, 30, y + 2, w - 60);
      c.font = FB(19, 700); c.fillStyle = '#5b3a4a'; c.fillText(bungkus(c, m.isi, w - 60)[0] + (bungkus(c, m.isi, w - 60).length > 1 ? '…' : ''), 30, y + 34, w - 60);
      y += 96;
    }
  });
  bidangTeks(3.2, 1.8, 0, teksMading, x, 1.35, z + 0.07, r);
}

// ---- papan rapat (whiteboard bersama)
let papanKV = null, isiPapan = [];
function papanRapat() {
  kotak(6.4, 2.2, 0.1, -16, 0.4, -19.8, '#c0c4cc');
  papanKV = kanvas(1280, 440, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d35470'; c.font = FD(42); c.fillText('PAPAN RAPAT — semua boleh nulis ✍', 28, 54);
    c.strokeStyle = '#ffb3c6'; c.lineWidth = 4; c.beginPath(); c.moveTo(28, 70); c.lineTo(w - 28, 70); c.stroke();
    const warna = ['#1d3557', '#c0392b', '#2f9e6e', '#8e5cc9'];
    const daftar = isiPapan.slice(-6);
    if (!daftar.length) { c.fillStyle = '#9aa'; c.font = FB(32, 700); c.fillText('Belum ada tulisan. Jadilah yang pertama!', 28, 140); }
    daftar.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2), X = 28 + col * (w / 2), Y = 118 + row * 110;
      c.fillStyle = warna[i % 4]; c.font = FB(30, 800);
      const b = bungkus(c, '“' + p.m + '”', w / 2 - 60);
      c.fillText(b[0] + (b.length > 1 ? '' : ''), X, Y, w / 2 - 50);
      if (b[1]) c.fillText(b[1] + (b.length > 2 ? '…' : ''), X, Y + 34, w / 2 - 50);
      c.font = FB(22, 700); c.fillStyle = '#8a6b77'; c.fillText('— ' + p.n, X, Y + (b[1] ? 66 : 34), w / 2 - 50);
    });
  });
  bidangTeks(6.2, 2.0, 0, papanKV, -16, 1.4, -19.73);
}

// ---- dinding karyawan
let dindingKV = null, daftarKaryawan = [];
function dindingKaryawan() {
  kotak(19.6, 2.5, 0.12, 3, 0.1, -19.8, '#2a1420');
  dindingKV = kanvas(2048, 262, (c, w, h) => {
    c.fillStyle = '#2a1420'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd23f'; c.font = FD(40); c.textAlign = 'center';
    c.fillText(`DINDING KARYAWAN ANGKATAN 1 · ${fmt(daftarKaryawan.length)} KARYAWAN`, w / 2, 44);
    const nama = daftarKaryawan.slice(-200).map(k => k.n);
    const px = nama.length < 30 ? 34 : nama.length < 80 ? 24 : 15;
    c.font = FB(px, 800); c.textAlign = 'left';
    let x = 16, y = 70 + px * 1.3;
    const pal = ['#ffb3c6', '#ffffff', '#8fd3ff', '#ffe08a', '#b9f3c9'];
    nama.forEach((n, i) => {
      const tw = c.measureText(n).width + 22;
      if (x + tw > w - 10) { x = 16; y += px * 1.45; }
      if (y > h - 8) return;
      c.fillStyle = pal[hash(n) % pal.length]; c.fillText(n + '  ♥', x, y); x += tw;
    });
    if (!nama.length) { c.fillStyle = '#ffb3c6'; c.font = FB(28, 800); c.textAlign = 'center'; c.fillText('Masih kosong — daftar & namamu langsung terpasang di sini', w / 2, 150); }
  });
  bidangTeks(19.2, 2.3, 0, dindingKV, 3, 1.35, -19.72);
}

// ---------------------------------------------------------------- KARAKTER
const KULIT = ['#f6d2b8', '#e8b48f', '#c98e62', '#a36a43', '#6f4428'];
const BAJU = ['#ff4f7b', '#ffffff', '#3a6ea5', '#2f9e6e', '#f2b33d', '#8e5cc9', '#2b2d42', '#ff8fab'];
const CELANA = ['#2b2d42', '#4a4e69', '#6b4f3a', '#1d3557', '#cfc6b8'];
const RAMBUT = ['pendek', 'panjang', 'kuncir', 'botak', 'keriting'];
const WRAMBUT = ['#1b1b1b', '#4a2f1f', '#8a5a2b', '#d9a441', '#c0392b', '#ff8fab'];
const AKS = ['tidak ada', 'kacamata', 'topi', 'pita', 'headset'];
const PILIHAN = { k: KULIT, b: BAJU, c: CELANA, r: RAMBUT, w: WRAMBUT, a: AKS };

function cekLook(l) {
  const o = {};
  for (const k in PILIHAN) { const v = l && Number.isInteger(l[k]) ? l[k] : 0; o[k] = clamp(v, 0, PILIHAN[k].length - 1); }
  return o;
}
function lookAcak(seed) {
  const o = {}; let s = seed;
  for (const k in PILIHAN) { o[k] = s % PILIHAN[k].length; s = Math.floor(s / 7) + 13; }
  return o;
}

function buatKarakter(look) {
  const L = cekLook(look);
  const g = new THREE.Group();
  const tubuh = new THREE.Group(); g.add(tubuh);
  const part = (w, h, d, x, y, z, m, p) => { const me = new THREE.Mesh(GEO, m); me.scale.set(w, h, d); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const kulit = M(KULIT[L.k]), baju = M(BAJU[L.b]), cel = M(CELANA[L.c]), rmb = M(WRAMBUT[L.w]);
  const kaki = [];
  for (const sx of [-0.13, 0.13]) {
    const k = new THREE.Group(); k.position.set(sx, 0.78, 0); tubuh.add(k);
    part(0.23, 0.72, 0.25, 0, -0.36, 0, cel, k);
    part(0.25, 0.1, 0.34, 0, -0.74, 0.04, M('#2a2a2a'), k);
    kaki.push(k);
  }
  part(0.58, 0.68, 0.33, 0, 1.12, 0, baju, tubuh);
  part(0.6, 0.1, 0.35, 0, 0.8, 0, cel, tubuh); // ikat pinggang
  part(0.04, 0.3, 0.02, -0.09, 1.3, 0.172, M('#ff4f7b'), tubuh); part(0.04, 0.3, 0.02, 0.09, 1.3, 0.172, M('#ff4f7b'), tubuh); // tali ID
  part(0.17, 0.21, 0.03, 0, 1.1, 0.178, M('#ffffff'), tubuh); // kartu ID
  part(0.11, 0.06, 0.035, 0, 1.15, 0.18, M('#ff4f7b'), tubuh);
  const lengan = [];
  for (const sx of [-0.38, 0.38]) {
    const a = new THREE.Group(); a.position.set(sx, 1.42, 0); tubuh.add(a);
    part(0.17, 0.6, 0.2, 0, -0.28, 0, baju, a);
    part(0.15, 0.12, 0.17, 0, -0.63, 0, kulit, a);
    lengan.push(a);
  }
  const kepala = new THREE.Group(); kepala.position.y = 1.46; tubuh.add(kepala);
  part(0.46, 0.46, 0.44, 0, 0.25, 0, kulit, kepala);
  part(0.07, 0.09, 0.02, -0.1, 0.27, 0.225, M('#2a1420'), kepala);
  part(0.07, 0.09, 0.02, 0.1, 0.27, 0.225, M('#2a1420'), kepala);
  part(0.09, 0.04, 0.02, -0.16, 0.17, 0.225, M('#ff9aa8'), kepala);
  part(0.09, 0.04, 0.02, 0.16, 0.17, 0.225, M('#ff9aa8'), kepala);
  part(0.1, 0.03, 0.02, 0, 0.12, 0.225, M('#b0302b'), kepala);
  const gaya = RAMBUT[L.r];
  if (gaya !== 'botak') {
    part(0.5, 0.14, 0.48, 0, 0.53, -0.01, rmb, kepala);
    part(0.5, 0.3, 0.1, 0, 0.36, -0.22, rmb, kepala);
    part(0.06, 0.22, 0.44, -0.24, 0.39, 0, rmb, kepala); part(0.06, 0.22, 0.44, 0.24, 0.39, 0, rmb, kepala);
    part(0.5, 0.08, 0.1, 0, 0.45, 0.2, rmb, kepala);
  }
  if (gaya === 'panjang') { part(0.52, 0.62, 0.12, 0, 0.08, -0.24, rmb, kepala); part(0.08, 0.5, 0.3, -0.25, 0.15, -0.06, rmb, kepala); part(0.08, 0.5, 0.3, 0.25, 0.15, -0.06, rmb, kepala); }
  if (gaya === 'kuncir') { part(0.18, 0.18, 0.18, 0, 0.42, -0.34, rmb, kepala); part(0.12, 0.34, 0.12, 0, 0.2, -0.38, rmb, kepala); }
  if (gaya === 'keriting') for (let i = 0; i < 7; i++) part(0.17, 0.17, 0.17, Math.cos(i) * 0.2, 0.58 + (i % 2) * 0.05, Math.sin(i * 1.7) * 0.18, rmb, kepala);
  const aks = AKS[L.a];
  if (aks === 'kacamata') { part(0.15, 0.12, 0.03, -0.11, 0.27, 0.24, M('#2a1420'), kepala); part(0.15, 0.12, 0.03, 0.11, 0.27, 0.24, M('#2a1420'), kepala); part(0.08, 0.03, 0.03, 0, 0.29, 0.24, M('#2a1420'), kepala); }
  if (aks === 'topi') { part(0.52, 0.16, 0.5, 0, 0.6, 0, M('#ff4f7b'), kepala); part(0.48, 0.04, 0.24, 0, 0.53, 0.32, M('#ff4f7b'), kepala); }
  if (aks === 'pita') { part(0.14, 0.12, 0.06, -0.1, 0.62, 0.1, M('#ff4f7b'), kepala); part(0.14, 0.12, 0.06, 0.1, 0.62, 0.1, M('#ff4f7b'), kepala); part(0.06, 0.08, 0.08, 0, 0.62, 0.1, M('#d35470'), kepala); }
  if (aks === 'headset') { part(0.56, 0.05, 0.08, 0, 0.6, 0, M('#2b2d42'), kepala); part(0.08, 0.16, 0.16, -0.27, 0.3, 0, M('#2b2d42'), kepala); part(0.08, 0.16, 0.16, 0.27, 0.3, 0, M('#2b2d42'), kepala); part(0.03, 0.03, 0.2, -0.27, 0.18, 0.15, M('#2b2d42'), kepala); }
  g.userData = { kaki, lengan, tubuh, kepala, fase: Math.random() * 6 };
  return g;
}
// a: 0 diam, 1 jalan, 2 duduk
function pose(ch, a, dt, cepat = 1) {
  const u = ch.userData;
  if (a === 1) u.fase += dt * 9 * cepat;
  const s = a === 1 ? Math.sin(u.fase) * 0.7 : 0;
  const lerp = (o, v) => o + (v - o) * Math.min(1, dt * 14 || 1);
  u.kaki[0].rotation.x = lerp(u.kaki[0].rotation.x, a === 2 ? -Math.PI / 2 : s);
  u.kaki[1].rotation.x = lerp(u.kaki[1].rotation.x, a === 2 ? -Math.PI / 2 : -s);
  u.lengan[0].rotation.x = lerp(u.lengan[0].rotation.x, a === 2 ? -0.5 : -s * 0.8);
  u.lengan[1].rotation.x = lerp(u.lengan[1].rotation.x, a === 2 ? -0.5 : s * 0.8);
  u.tubuh.position.y = lerp(u.tubuh.position.y, a === 2 ? -0.31 : (a === 1 ? Math.abs(Math.cos(u.fase)) * 0.05 : 0));
  if (a === 0) { u.fase += dt; u.kepala.rotation.y = Math.sin(u.fase * 0.4) * 0.15; } else u.kepala.rotation.y = lerp(u.kepala.rotation.y, 0);
}

function labelNama(teks, npc = false) {
  const kv = kanvas(320, 72, (x, w, h) => {
    x.font = FB(30, 900);
    const tw = Math.min(w - 6, x.measureText(teks).width + 30);
    x.fillStyle = npc ? 'rgba(255,79,123,.9)' : 'rgba(42,20,32,.78)';
    bulat(x, (w - tw) / 2, 8, tw, 54, 27); x.fill();
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(teks, w / 2, 37, w - 30);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kv.t, transparent: true, depthWrite: false }));
  s.scale.set(1.75, 0.4, 1); s.position.y = 2.32; s.renderOrder = 5;
  return s;
}
function gelembung(teks) {
  const kv = kanvas(512, 180, (x, w, h) => {
    x.font = FB(30, 800);
    const b = bungkus(x, teks, w - 60).slice(0, 3);
    const lh = 36, bh = b.length * lh + 26;
    const bw = Math.min(w - 8, Math.max(...b.map(s => x.measureText(s).width)) + 40);
    const X = (w - bw) / 2, Y = h - bh - 22;
    x.fillStyle = '#fff'; x.strokeStyle = '#2a1420'; x.lineWidth = 5;
    bulat(x, X, Y, bw, bh, 22); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(w / 2 - 14, Y + bh - 2); x.lineTo(w / 2, h - 4); x.lineTo(w / 2 + 14, Y + bh - 2); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(w / 2 - 14, Y + bh); x.lineTo(w / 2, h - 4); x.lineTo(w / 2 + 14, Y + bh); x.stroke();
    x.fillStyle = '#2a1420'; x.textAlign = 'center'; x.textBaseline = 'middle';
    b.forEach((s, i) => x.fillText(s, w / 2, Y + 13 + lh / 2 + i * lh));
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kv.t, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set(2.8, 0.98, 1); s.position.y = 2.85; s.renderOrder = 10;
  return s;
}
function bicara(o, teks) {
  if (o.gel) { o.g.remove(o.gel); o.gel.material.map.dispose(); o.gel.material.dispose(); }
  o.gel = gelembung(teks); o.g.add(o.gel); o.gelT = 6 + teks.length / 20;
}

// ---------------------------------------------------------------- TABRAKAN
const RADIUS = 0.3;
function geser(p) {
  for (let iter = 0; iter < 2; iter++) for (const b of tabrak) {
    if (p.x < b.x1 - RADIUS || p.x > b.x2 + RADIUS || p.z < b.z1 - RADIUS || p.z > b.z2 + RADIUS) continue;
    const cx = clamp(p.x, b.x1, b.x2), cz = clamp(p.z, b.z1, b.z2);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= RADIUS * RADIUS) continue;
    if (d2 > 1e-9) { const d = Math.sqrt(d2); p.x = cx + dx / d * RADIUS; p.z = cz + dz / d * RADIUS; }
    else {
      const kiri = p.x - b.x1, kanan = b.x2 - p.x, atas = p.z - b.z1, bawah = b.z2 - p.z, m = Math.min(kiri, kanan, atas, bawah);
      if (m === kiri) p.x = b.x1 - RADIUS; else if (m === kanan) p.x = b.x2 + RADIUS; else if (m === atas) p.z = b.z1 - RADIUS; else p.z = b.z2 + RADIUS;
    }
  }
}

// ---------------------------------------------------------------- PEMAIN
const saya = { x: 0, z: 23, r: Math.PI, a: 0, duduk: null, g: null, label: null, gel: null, gelT: 0, look: null };
let prof = profil();

function pasangKarakterSaya() {
  const lama = saya.g;
  saya.look = cekLook(prof?.look || lookAcak(Math.floor(Math.random() * 1e6)));
  saya.g = buatKarakter(saya.look);
  saya.label = labelNama(prof ? prof.n : 'Tamu');
  saya.g.add(saya.label);
  if (lama) { if (saya.gel) { lama.remove(saya.gel); saya.g.add(saya.gel); } scene.remove(lama); }
  scene.add(saya.g);
}

// ---------------------------------------------------------------- KAMERA & INPUT
const kam = { yaw: Math.PI, pitch: innerWidth / innerHeight < 0.8 ? 0.55 : 0.38, jarak: innerWidth / innerHeight < 0.8 ? 10.5 : 8.5, x: 0, y: 1.4, z: 20 };
const tombol = {};
const joy = { aktif: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
let seret = null, cubit = null;

addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (!$('kartu').hidden && !$('kartu').classList.contains('bawah')) { if (e.key === 'Escape') tutupKartu(); return; }
  tombol[e.code] = true;
  if (e.key === 'Enter') { e.preventDefault(); $('chatI').focus(); }
  if (e.code === 'KeyE' && !$('aksi').hidden) $('aksi').click();
  if (e.key === 'Escape') tutupKartu();
});
addEventListener('keyup', e => { tombol[e.code] = false; });
addEventListener('blur', () => { for (const k in tombol) tombol[k] = false; });

const pointers = new Map();
canvas.addEventListener('pointerdown', e => {
  canvas.focus();
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
  canvas.setPointerCapture(e.pointerId);
  const sentuh = e.pointerType === 'touch';
  if (sentuh && !joy.aktif && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.35) {
    Object.assign(joy, { aktif: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
    const j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.firstChild.style.transform = '';
    $('bantuJoy').style.display = 'none';
    return;
  }
  if (pointers.size === 2 && sentuh) {
    const [a, b] = [...pointers.values()].filter((_, i, arr) => !joy.aktif || [...pointers.keys()][i] !== joy.id);
    if (a && b) cubit = { d: Math.hypot(a.x - b.x, a.y - b.y), j: kam.jarak };
  }
  seret = e.pointerId;
});
canvas.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (joy.aktif && e.pointerId === joy.id) {
    let jx = e.clientX - joy.ox, jy = e.clientY - joy.oy; const l = Math.hypot(jx, jy), maxL = 50;
    if (l > maxL) { jx = jx / l * maxL; jy = jy / l * maxL; }
    joy.x = jx / maxL; joy.y = -jy / maxL;
    $('joy').firstChild.style.transform = `translate(${jx}px,${jy}px)`;
    return;
  }
  if (cubit) {
    const ps = [...pointers.entries()].filter(([k]) => k !== joy.id).map(([, v]) => v);
    if (ps.length >= 2) { const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y); kam.jarak = clamp(cubit.j * cubit.d / d, 3, 20); }
    return;
  }
  if (seret === e.pointerId) {
    kam.yaw -= dx * 0.0065;
    kam.pitch = clamp(kam.pitch + dy * 0.004, 0.05, 1.25);
  }
});
function lepas(e) {
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (joy.aktif && e.pointerId === joy.id) { joy.aktif = false; joy.x = joy.y = 0; $('joy').style.display = 'none'; return; }
  if (p && e.type === 'pointerup' && Math.hypot(p.x - p.sx, p.y - p.sy) < 8 && performance.now() - p.t < 400) ketuk(e.clientX, e.clientY);
  if (pointers.size < 2) cubit = null;
  if (seret === e.pointerId) seret = null;
}
canvas.addEventListener('pointerup', lepas);
canvas.addEventListener('pointercancel', lepas);
canvas.addEventListener('wheel', e => { e.preventDefault(); kam.jarak = clamp(kam.jarak * (1 + Math.sign(e.deltaY) * 0.1), 3, 20); }, { passive: false });

// ketuk karakter lain → kartu profil
const ray = new THREE.Raycaster();
function ketuk(cx, cy) {
  const v = new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(v, camera);
  const semua = [...lain.values(), ...bot].map(o => o.g);
  const hit = ray.intersectObjects(semua, true)[0];
  if (!hit) return;
  let o = hit.object; while (o.parent && !semua.includes(o)) o = o.parent;
  const org = [...lain.values(), ...bot].find(p => p.g === o);
  if (org) bukaProfilLain(org);
}

// ---------------------------------------------------------------- BOT (mode lokal)
const NAV = {
  pintu: [0, 23], lobi: [0, 16.5], lobiB: [-8, 12.5], lobiT: [8, 12.5],
  aisle: [0, 8.4], aisleB: [-12.6, 8.0], aisleT: [12.6, 5.5],
  tengah: [0, 1.5], tengahB: [-12.8, 1.5], tengahT: [12, 1.5], tengahT2: [6.5, 1.5], tengahB2: [-6.5, 1.5],
  utara: [0, -5], utaraB: [-6.5, -5], utaraB2: [-12.2, -4.8], utaraT: [11.5, -5],
  rapatLuar: [-6.5, -10], rapat: [-10, -10], rapat2: [-16, -10.3], rapat3: [-22.8, -10.5], rapat4: [-22.8, -16.6], rapat5: [-11, -16.6],
  dinding: [3, -16.5], dinding2: [9, -17],
  loker: [-12.8, 5], lokerD: [-18, 5.5],
  pantry: [16, 2.5], pantry2: [19.5, 2.5], pantryT: [21, -2.5], pantryU: [18.5, -5.2], pantryS: [20.5, 10],
  taman: [18.5, -9], taman2: [16.6, -10.6], taman3: [21.6, -10.6],
};
const SAMBUNG = [
  ['pintu', 'lobi'], ['lobi', 'lobiB'], ['lobi', 'lobiT'], ['lobi', 'aisle'], ['aisle', 'aisleB'], ['aisle', 'tengah'],
  ['aisleB', 'tengahB'], ['aisleB', 'loker'], ['tengah', 'tengahB2'], ['tengahB2', 'tengahB'], ['tengah', 'tengahT2'], ['tengahT2', 'tengahT'],
  ['tengahT', 'aisleT'], ['tengahB', 'loker'], ['loker', 'lokerD'],
  ['tengah', 'utara'], ['utara', 'utaraB'], ['utara', 'utaraT'], ['utaraB', 'rapatLuar'], ['rapatLuar', 'rapat'], ['rapat', 'rapat2'], ['rapat2', 'rapat3'], ['rapat3', 'rapat4'], ['rapat4', 'rapat5'], ['rapat', 'rapat5'],
  ['utara', 'dinding'], ['dinding', 'dinding2'], ['tengahT', 'pantry'], ['pantry', 'pantry2'], ['pantry2', 'pantryT'], ['pantryT', 'pantryU'], ['pantry2', 'pantryS'],
  ['pantryU', 'taman'], ['taman', 'taman2'], ['taman', 'taman3'], ['tengahB', 'utaraB2'], ['utaraB2', 'utaraB'], ['tengahT', 'utaraT'],
];
const TETANGGA = {};
for (const [a, b] of SAMBUNG) { (TETANGGA[a] ||= []).push(b); (TETANGGA[b] ||= []).push(a); }
function jalur(dari, ke) {
  const prev = { [dari]: null }, q = [dari];
  while (q.length) { const n = q.shift(); if (n === ke) break; for (const m of TETANGGA[n] || []) if (!(m in prev)) { prev[m] = n; q.push(m); } }
  const out = []; for (let n = ke; n; n = prev[n]) out.unshift(n);
  return out;
}
function simpulTerdekat(x, z) {
  let best = null, bd = 1e9;
  for (const k in NAV) { const d = Math.hypot(NAV[k][0] - x, NAV[k][1] - z); if (d < bd) { bd = d; best = k; } }
  return best;
}

const NPC = [
  { n: 'Bu Ratna · HRD', d: 'HRD (Hati Rindu Dia)', s: 'Rahasia Perusahaan', rumah: 'lobiT' },
  { n: 'Pak Bambang · Satpam', d: 'Keamanan Hati', s: 'Bucin', rumah: 'pintu', diam: true },
  { n: 'Dimas', d: 'Divisi Overthinking', s: 'Digantung', rumah: 'tengah' },
  { n: 'Sinta', d: 'Marketing Perasaan', s: 'Lagi PDKT', rumah: 'pantry2' },
  { n: 'Kevin', d: 'IT (Ingin Ditemani)', s: 'Jomblo', rumah: 'utara' },
  { n: 'Nadia', d: 'Divisi PDKT', s: 'Jomblo', rumah: 'taman' },
  { n: 'Joko', d: 'Keuangan Akhir Bulan', s: 'Baru Putus', rumah: 'rapat' },
];
const KALIMAT = [
  'Rapat jam 3 dibatalkan, bos lagi galau.', 'Ada yang lihat charger-ku? Sama kayak hatiku, hilang.',
  'Kopi pantry pahit, tapi masih kalah sama kenyataan.', 'Deadline-ku hari ini. Jodohku entah kapan.',
  'Kata HRD, KPI bulan ini: berani chat duluan.', 'Siapa yang naruh gula di kopiku? Kok tiba-tiba manis.',
  'Lembur lagi… minimal ditemani notifikasi darimu.', 'Aku resign dari berharap. Eh, ditolak HRD.',
  'Divisi sebelah lagi ada yang PDKT, seru banget.', 'Selamat datang karyawan baru! Jangan lupa ambil ID card.',
  'Kalau ada yang nanya status, bilang aja “sedang proses rekrutmen”.', 'Wifi kantor lancar, perasaanku yang buffering.',
  'Udah coba lempar koin di Taman Curhat?', 'Papan rapat lagi rame, tulis juga dong!',
];
const BALASAN = ['Halo juga! 👋', 'Wah, karyawan baru ya?', 'Semangat kerjanya!', 'Sudah ngopi belum?', 'Hehe, iya iya.', 'Siap, laksanakan!', 'Jangan lupa istirahat ya.'];
const bot = [];
function buatBot() {
  NPC.forEach((d, i) => {
    const look = lookAcak(hash(d.n));
    if (d.diam) Object.assign(look, { b: 6, c: 0, a: 2 });
    const g = buatKarakter(look);
    const [x, z] = NAV[d.rumah];
    const o = { ...d, npc: true, look, g, x: x + (d.diam ? 2.5 : 0), z, r: d.diam ? 0 : Math.random() * 6, a: 0, jalur: [], tunggu: 2 + i * 1.5, duduk: null, gel: null, gelT: 0, ngomong: 8 + Math.random() * 20 };
    g.add(labelNama(d.n, true));
    scene.add(g); bot.push(o);
  });
}
function updateBot(o, dt) {
  o.ngomong -= dt;
  if (o.ngomong < 0) { o.ngomong = 22 + Math.random() * 30; if (Math.hypot(o.x - saya.x, o.z - saya.z) < 18) bicara(o, acak(KALIMAT)); }
  if (o.diam) { o.r = sudutLerp(o.r, Math.atan2(saya.x - o.x, saya.z - o.z), dt * 2); o.a = 0; return; }
  if (o.tunggu > 0) { o.tunggu -= dt; if (o.tunggu <= 0 && o.duduk) { o.duduk.oleh = null; o.duduk = null; } return; }
  if (!o.jalur.length) {
    // pilih tujuan baru: kadang duduk
    const dari = simpulTerdekat(o.x, o.z);
    if (Math.random() < 0.45) {
      const kosong = kursi.filter(k => !k.oleh && Math.hypot(k.x - o.x, k.z - o.z) < 26);
      const k = acak(kosong);
      if (k) { o.jalur = [...jalur(dari, simpulTerdekat(k.x, k.z)).map(n => NAV[n]), [k.x, k.z]]; o.target = k; k.oleh = o; return; }
    }
    const ke = acak(Object.keys(NAV).filter(k => k !== 'pintu'));
    o.jalur = jalur(dari, ke).map(n => NAV[n]).concat([[NAV[ke][0] + (Math.random() - 0.5) * 2, NAV[ke][1] + (Math.random() - 0.5) * 2]]);
    o.target = null;
    return;
  }
  const [tx, tz] = o.jalur[0];
  const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
  if (d < 0.25) {
    o.jalur.shift();
    if (!o.jalur.length) {
      if (o.target) { o.duduk = o.target; o.x = o.target.x; o.z = o.target.z; o.r = o.target.r; o.a = 2; o.tunggu = 10 + Math.random() * 20; o.target = null; }
      else { o.a = 0; o.tunggu = 3 + Math.random() * 8; }
    }
    return;
  }
  const v = 1.9 * dt;
  o.x += dx / d * Math.min(v, d); o.z += dz / d * Math.min(v, d);
  o.r = sudutLerp(o.r, Math.atan2(dx, dz), Math.min(1, dt * 8)); o.a = 1;
}

// ---------------------------------------------------------------- JARINGAN
let net = null;
const lain = new Map(); // uid -> {g,label,...}

function sinkronLain(peta) {
  for (const [uid, p] of peta) {
    let o = lain.get(uid);
    const lookStr = JSON.stringify(p.l || {});
    if (!o || o.lookStr !== lookStr || o.n !== p.n) {
      if (o) scene.remove(o.g);
      const g = buatKarakter(p.l);
      const nm = bersih(p.n || 'Karyawan', 20);
      g.add(labelNama(nm));
      const baru = { g, lookStr, n: p.n, nama: nm, x: p.x, z: p.z, r: p.r || 0, a: 0, gel: null, gelT: 0 };
      if (o) Object.assign(baru, { x: o.x, z: o.z, r: o.r, gel: o.gel, gelT: o.gelT }), o.gel && g.add(o.gel);
      o = baru; scene.add(g); lain.set(uid, o);
    }
    Object.assign(o, { tx: +p.x || 0, tz: +p.z || 0, tr: +p.r || 0, ta: p.a | 0, d: bersih(p.d, 40), s: bersih(p.s, 30), ig: igBersih(p.ig), uid });
  }
  for (const [uid, o] of lain) if (!peta.has(uid)) { scene.remove(o.g); lain.delete(uid); }
  hitungOnline();
}
function hitungOnline() {
  const el = $('online');
  const n = lain.size + 1;
  const sempit = innerWidth < 480;
  el.querySelector('span').textContent = net?.mode === 'lokal' ? (sempit ? `${n} · lokal` : `${n} di kantor · mode lokal`) : (sempit ? `${fmt(n)} online` : `${fmt(n)} karyawan online`);
  el.classList.toggle('lokal', net?.mode === 'lokal');
  el.title = net?.mode === 'lokal' ? 'Mode lokal: hanya tab di browser ini yang terlihat. Isi config.js untuk multiplayer.' : 'Karyawan yang sedang di kantor';
}

let posTerakhir = '', posWaktu = 0;
function kirimPosisi(t) {
  if (!net || !prof) return;
  const p = { n: prof.n, d: prof.d, s: prof.s, ig: prof.ig || '', l: saya.look, x: +saya.x.toFixed(2), z: +saya.z.toFixed(2), r: +saya.r.toFixed(2), a: saya.a };
  const k = `${p.x},${p.z},${p.r},${p.a}`;
  if ((k !== posTerakhir && t - posWaktu > 120) || t - posWaktu > 4000) { posTerakhir = k; posWaktu = t; net.posisi(p); }
}

// ---------------------------------------------------------------- CHAT
const log = $('log');
function tulisLog(nama, teks, sys = false) {
  const p = document.createElement('p');
  if (sys) p.className = 'sys';
  p.innerHTML = sys ? esc(teks) : `<b>${esc(nama)}</b> ${esc(teks)}`;
  log.appendChild(p);
  while (log.children.length > 6) log.firstChild.remove();
  setTimeout(() => p.classList.add('pudar'), 14000);
  setTimeout(() => p.remove(), 15500);
}
let chatTerakhir = 0;
$('chatF').addEventListener('submit', e => {
  e.preventDefault();
  const i = $('chatI'), t = bersih(i.value, 120);
  if (!t) { i.blur(); return; }
  if (!prof) { bukaDaftar(); return; }
  if (Date.now() - chatTerakhir < 1500) { toast('Pelan-pelan, satu-satu ya 🙂'); return; }
  chatTerakhir = Date.now();
  i.value = '';
  net.chat(t);
  if (net.mode === 'online') return; // pesan sendiri kembali lewat langganan
  if (/(halo|hai|hi|pagi|siang|sore|malam|permisi)/i.test(t)) {
    const dekat = bot.filter(b => Math.hypot(b.x - saya.x, b.z - saya.z) < 6);
    const b = acak(dekat);
    if (b) setTimeout(() => { const r = acak(BALASAN); bicara(b, r); tulisLog(b.n, r); }, 900);
  }
});
function terimaChat(c) {
  if (!c || !c.m) return;
  const nama = bersih(c.n, 20), teks = bersih(c.m, 120);
  tulisLog(nama, teks);
  const o = c.uid === net.uid ? saya : lain.get(c.uid);
  if (o && o.g) bicara(o, teks);
}

// ---------------------------------------------------------------- UI: kartu, toast
let toastT;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }
let saatTutup = null;
function bukaKartu(html, { bawah = false, pasang, tutup } = {}) {
  const k = $('kartu'), isi = k.querySelector('.isi');
  if (saatTutup) { const f = saatTutup; saatTutup = null; f(); }
  isi.innerHTML = `<button class="x" type="button" aria-label="Tutup">✕</button>` + html;
  k.classList.toggle('bawah', bawah);
  k.hidden = false;
  isi.querySelector('.x').onclick = tutupKartu;
  saatTutup = tutup || null;
  pasang && pasang(isi);
  const f = isi.querySelector('input,select,textarea'); if (f && !bawah && matchMedia('(hover:hover)').matches) setTimeout(() => f.focus(), 50);
}
function tutupKartu() {
  $('kartu').hidden = true;
  if (saatTutup) { const f = saatTutup; saatTutup = null; f(); }
  canvas.focus();
}
$('kartu').addEventListener('pointerdown', e => { if (e.target === $('kartu')) tutupKartu(); });

// ---- pendaftaran karyawan
function bukaDaftar() {
  const p = prof || {};
  bukaKartu(`
    <h2>${prof ? 'Ubah Data Karyawan' : 'Selamat Bergabung! 💌'}</h2>
    <p>${prof ? 'Perbarui data karyawanmu.' : `Isi data singkat untuk mulai bekerja di ${esc(CFG.namaPT)}. <b>Tidak perlu password.</b>`}</p>
    <form id="fD">
      <label for="dN">Nama panggilan</label>
      <input id="dN" maxlength="20" required placeholder="contoh: Raka" value="${esc(p.n || '')}">
      <label for="dI">Username Instagram (opsional)</label>
      <input id="dI" maxlength="31" placeholder="@username" autocapitalize="none" autocorrect="off" value="${esc(p.ig ? '@' + p.ig : '')}">
      <label for="dD">Divisi</label>
      <select id="dD">${DIVISI.map(d => `<option ${d === p.d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
      <label for="dS">Status hati</label>
      <select id="dS">${STATUS.map(d => `<option ${d === p.s ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
      <p class="err" id="dE"></p>
      <div class="baris"><button class="btn" type="submit">${prof ? 'Simpan' : 'Masuk Kerja →'}</button>${prof ? '' : '<button class="btn putih" type="button" id="dL">Lihat-lihat dulu</button>'}</div>
      <p class="kecil">Namamu akan tampil di atas karaktermu dan di Dinding Karyawan.</p>
    </form>`, {
    pasang(isi) {
      const dL = isi.querySelector('#dL'); if (dL) dL.onclick = tutupKartu;
      isi.querySelector('#fD').onsubmit = async e => {
        e.preventDefault();
        const n = bersih(isi.querySelector('#dN').value, 20), ig = igBersih(isi.querySelector('#dI').value);
        const E = isi.querySelector('#dE');
        if (n.length < 2) { E.textContent = 'Nama minimal 2 huruf.'; return; }
        if (kasar(n) || kasar(ig)) { E.textContent = 'Pakai nama yang lebih sopan ya.'; return; }
        const baru = !prof;
        prof = { ...(prof || {}), n, ig, d: isi.querySelector('#dD').value, s: isi.querySelector('#dS').value, look: saya.look };
        simpanProfil(prof);
        net && net.daftar({ n, ig, d: prof.d });
        pasangKarakterSaya(); perbaruiTombolProfil(); posWaktu = 0;
        tutupKartu();
        if (baru) {
          tulisLog('', `Selamat datang, ${n}! Kamu resmi karyawan ${CFG.namaPT}.`, true);
          setTimeout(() => toast('Mampir ke Ruang Loker untuk ganti penampilan 👔'), 1200);
        } else toast('Data tersimpan ✔');
      };
    },
  });
}
function perbaruiTombolProfil() { $('btnProfil').textContent = prof ? '👤 ' + prof.n : 'Daftar'; }
$('btnProfil').onclick = () => bukaDaftar();

// ---- loker: ganti penampilan
function bukaLoker() {
  if (!prof) { bukaDaftar(); return; }
  const lama = { ...saya.look };
  const kamLama = { yaw: kam.yaw, pitch: kam.pitch, jarak: kam.jarak };
  kam.yaw = saya.r + Math.PI; kam.pitch = 0.12; kam.jarak = 4.6; kam.y = innerWidth < 900 ? 0.6 : 1.1;
  const nama = { k: 'Kulit', b: 'Baju', c: 'Celana', r: 'Rambut', w: 'Warna rambut', a: 'Aksesoris' };
  const isiSw = k => PILIHAN[k].map((v, i) => k === 'r' || k === 'a'
    ? `<button type="button" data-k="${k}" data-i="${i}" class="${saya.look[k] === i ? 'on' : ''}">${esc(v)}</button>`
    : `<button type="button" data-k="${k}" data-i="${i}" class="${saya.look[k] === i ? 'on' : ''}" style="background:${v}" aria-label="${nama[k]} ${i + 1}"></button>`).join('');
  let tab = 'b';
  bukaKartu(`<h2>Ruang Loker 👔</h2>
    <div class="sw teks tab">${Object.keys(nama).map(k => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${nama[k]}</button>`).join('')}</div>
    <div class="sw pilih" id="lP"></div>
    <div class="baris"><button class="btn" type="button" id="lS">Simpan</button><button class="btn putih" type="button" id="lA">Acak 🎲</button></div>`, {
    bawah: true,
    pasang(isi) {
      const P = isi.querySelector('#lP');
      const pasangUlang = () => { prof.look = { ...saya.look }; pasangKarakterSaya(); saya.g.position.set(saya.x, 0, saya.z); saya.g.rotation.y = saya.r; };
      const isiTab = () => {
        P.className = 'sw pilih' + (tab === 'r' || tab === 'a' ? ' teks' : '');
        P.innerHTML = isiSw(tab);
        P.querySelectorAll('button').forEach(b => b.onclick = () => { saya.look[tab] = +b.dataset.i; pasangUlang(); isiTab(); });
        isi.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      };
      isi.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; isiTab(); });
      isi.querySelector('#lA').onclick = () => { saya.look = lookAcak(Math.floor(Math.random() * 1e7)); pasangUlang(); isiTab(); };
      isi.querySelector('#lS').onclick = () => { simpanProfil(prof); lama.simpan = true; posWaktu = 0; tutupKartu(); toast('Penampilan baru tersimpan ✨'); };
      isiTab();
    },
    tutup() {
      Object.assign(kam, kamLama, { y: 1.4 });
      if (!lama.simpan) { delete lama.simpan; prof.look = lama; pasangKarakterSaya(); }
    },
  });
}

// ---- resepsionis
function bukaResepsionis() {
  const ig = CFG.instagram ? `<a class="btn putih" href="https://www.instagram.com/${encodeURIComponent(CFG.instagram)}/" target="_blank" rel="noopener">Instagram</a>` : '';
  const don = CFG.donasi ? `<a class="btn putih" href="${esc(CFG.donasi)}" target="_blank" rel="noopener">Traktir kopi ☕</a>` : '';
  bukaKartu(`<h2>Selamat datang di ${esc(CFG.namaPT)}!</h2>
    <p>Kantor tanpa gaji. Bonusnya: siapa tahu ketemu jodoh. Jelajahi kantor, ngobrol dengan karyawan lain, dan pasang namamu di Dinding Karyawan.</p>
    <p class="kecil"><b>Cara main:</b> WASD/panah untuk jalan (Shift lari) · seret layar untuk memutar kamera · scroll untuk zoom · <b>E</b> untuk aksi · <b>Enter</b> untuk chat. Di HP: geser sisi kiri bawah untuk jalan.</p>
    <div class="baris">${prof ? '' : '<button class="btn" type="button" id="rD">Daftar jadi karyawan</button>'}<a class="btn putih" href="../idcard/index.html">Buat ID Card</a>${ig}${don}</div>`, {
    pasang(isi) { const b = isi.querySelector('#rD'); if (b) b.onclick = bukaDaftar; },
  });
}
function bukaMading() {
  bukaKartu(`<h2>📌 Mading HRD</h2>${CFG.mading.map(m => `<p><b>${esc(m.judul)}</b><br>${esc(m.isi)}</p>`).join('') || '<p>Belum ada pengumuman.</p>'}`);
}

// ---- papan rapat
function bukaPapan() {
  bukaKartu(`<h2>Papan Rapat ✍</h2>
    <p>Tulisanmu tampil di papan untuk semua karyawan (6 tulisan terbaru).</p>
    <form id="fP"><label for="pI">Tulisanmu</label><textarea id="pI" maxlength="80" rows="2" placeholder="contoh: Agenda hari ini: berani nyapa duluan"></textarea>
    <p class="err" id="pE"></p><div class="baris"><button class="btn" type="submit">Tulis</button></div></form>`, {
    pasang(isi) {
      isi.querySelector('#fP').onsubmit = e => {
        e.preventDefault();
        if (!prof) { bukaDaftar(); return; }
        const t = bersih(isi.querySelector('#pI').value, 80);
        if (t.length < 2) { isi.querySelector('#pE').textContent = 'Tulis sesuatu dulu.'; return; }
        const terakhir = LS.get('papanT', 0);
        if (Date.now() - terakhir < 30000) { isi.querySelector('#pE').textContent = 'Tunggu sebentar sebelum menulis lagi.'; return; }
        LS.set('papanT', Date.now());
        net.papan(t, prof.n); tutupKartu(); toast('Tulisanmu sudah di papan ✔');
      };
    },
  });
}

// ---- dinding karyawan
function bukaDinding() {
  const urut = [...daftarKaryawan].sort((a, b) => (a.t || 0) - (b.t || 0));
  const no = urut.findIndex(k => k.uid === net?.uid) + 1;
  bukaKartu(`<h2>Dinding Karyawan</h2>
    <p><b>${fmt(urut.length)}</b> karyawan sudah bergabung.${no ? ` Kamu karyawan ke-<b>${fmt(no)}</b> 🎉` : ''}</p>
    ${no || !prof ? '' : '<p class="kecil">Namamu belum terpasang. Tekan Daftar di pojok kanan atas.</p>'}
    <label for="cI">Cari nama</label><input id="cI" placeholder="ketik nama…">
    <div class="daftarNama" id="cL"></div>`, {
    pasang(isi) {
      const L = isi.querySelector('#cL');
      const tampil = q => {
        const h = urut.map((k, i) => ({ ...k, no: i + 1 })).filter(k => !q || k.n.toLowerCase().includes(q) || (k.ig || '').includes(q)).slice(-120).reverse();
        L.innerHTML = h.length ? h.map(k => `<div>#${fmt(k.no)} ${esc(k.n)} ${k.ig ? `<small>@${esc(k.ig)}</small>` : ''} <small>· ${esc(k.d || '')}</small></div>`).join('') : '<div>Tidak ketemu.</div>';
      };
      isi.querySelector('#cI').oninput = e => tampil(e.target.value.trim().toLowerCase());
      tampil('');
    },
  });
}

// ---- mesin kopi
const RAMALAN = [
  'Kopi susu: hari ini ada yang diam-diam memperhatikanmu.', 'Americano: pahit di awal, manis di akhir. Kayak kisahmu nanti.',
  'Latte: jangan cuma nunggu dia chat duluan.', 'Espresso: kecil tapi nendang. Berani sapa orang baru hari ini!',
  'Kopi tubruk: jodohmu sederhana, tapi tulus.', 'Cappuccino: banyak busa, banyak drama. Hati-hati.',
  'Kopi gula aren: yang manis-manis datang minggu ini.', 'Teh tawar: kamu belum siap, dan itu juga tidak apa-apa.',
];
function bukaKopi() {
  const r = acak(RAMALAN);
  const teman = [...lain.values(), ...(net?.mode === 'lokal' ? bot : [])];
  const t = acak(teman);
  bukaKartu(`<h2>☕ Mesin Kopi Jodoh</h2><p style="font-size:18px"><b>${esc(r)}</b></p>
    ${t ? `<p>Ngopi bareng siapa? Mesin menyarankan: <b>${esc(t.nama || t.n)}</b>${t.d ? ` dari ${esc(t.d)}` : ''}.</p>` : ''}
    <div class="baris"><button class="btn" type="button" id="kL">Bikin lagi</button></div>`, { pasang(isi) { isi.querySelector('#kL').onclick = bukaKopi; } });
  if (prof) bicara(saya, '☕ ' + r.split(':')[0]);
}

// ---- air mancur
const HARAPAN = [
  'Koinmu tenggelam dengan anggun. Harapanmu tercatat di HRD langit.', 'Plung! Katanya, yang lempar koin di sini bakal disapa orang baru.',
  'Koinnya memantul… semesta minta kamu usaha dulu.', 'Air mancur berbisik: “sabar, dia lagi otw.”',
  'Koin mendarat di tengah hati. Pertanda baik!', 'Harapan diterima. Estimasi pengiriman: rahasia perusahaan.',
];
function bukaKoin() {
  const n = (LS.get('koin', 0) || 0) + 1; LS.set('koin', n);
  airLompat = 1;
  bukaKartu(`<h2>🪙 Air Mancur Harapan</h2><p style="font-size:18px"><b>${esc(acak(HARAPAN))}</b></p><p class="kecil">Kamu sudah melempar ${fmt(n)} koin.</p>`);
}
let airLompat = 0;

// ---- profil orang lain
function bukaProfilLain(o) {
  const nama = o.nama || o.n;
  bukaKartu(`<h2>${esc(nama)}</h2>
    <p>${o.d ? `🏢 ${esc(o.d)}<br>` : ''}${o.s ? `💗 Status: <b>${esc(o.s)}</b><br>` : ''}${o.ig ? `📷 <a href="https://www.instagram.com/${encodeURIComponent(o.ig)}/" target="_blank" rel="noopener">@${esc(o.ig)}</a>` : ''}${o.npc ? '<br><span class="kecil">Karyawan NPC (mode lokal)</span>' : ''}</p>
    <div class="baris"><button class="btn" type="button" id="sP">Sapa 👋</button><button class="btn putih" type="button" id="sD">Jalan ke sana</button></div>`, {
    pasang(isi) {
      isi.querySelector('#sP').onclick = () => { tutupKartu(); $('chatI').value = `Halo ${nama.split(' · ')[0]}! `; $('chatI').focus(); };
      isi.querySelector('#sD').onclick = () => { tutupKartu(); pindah(o.x + 1.2, o.z + 1.2); };
    },
  });
}

// ---------------------------------------------------------------- LOKASI
const TEMPAT = [
  ['🚪 Lobi', 0, 17, Math.PI], ['💻 Area Kerja', 0, 1.5, Math.PI], ['☕ Pantry', 19.5, 2.5, Math.PI / 2],
  ['📋 Ruang Rapat', -12, -10, -Math.PI / 2 - 0.4], ['🧱 Dinding Karyawan', 3, -14.5, Math.PI], ['🌷 Taman Curhat', 18.5, -9.2, Math.PI],
  ['👔 Ruang Loker', -19, 7.5, -Math.PI / 2], ['🌳 Halaman', 0, 30, Math.PI],
];
TEMPAT.forEach(([n, x, z, r]) => {
  const b = document.createElement('button'); b.className = 'pill'; b.type = 'button'; b.textContent = n;
  b.onclick = () => { pindah(x, z, r); b.blur(); };
  $('tempat').appendChild(b);
});
function pindah(x, z, r) {
  berdiri();
  saya.x = x; saya.z = z; geser(saya);
  if (r !== undefined) { saya.r = r; kam.yaw = r; }
  kam.x = saya.x; kam.z = saya.z;
  posWaktu = 0;
}

// ---------------------------------------------------------------- DUDUK & AKSI
function berdiri() { if (saya.duduk) { saya.duduk.oleh = null; saya.duduk = null; saya.a = 0; } }
function kursiDekat() {
  let best = null, bd = 1.0;
  for (const k of kursi) {
    if (k.oleh && k.oleh !== saya) continue;
    const terisi = [...lain.values()].some(o => o.ta === 2 && Math.hypot(o.tx - k.x, o.tz - k.z) < 0.3);
    if (terisi) continue;
    const d = Math.hypot(k.x - saya.x, k.z - saya.z);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
let aksiSekarang = null;
function perbaruiAksi() {
  let pilih = null, bd = 1e9;
  for (const t of titikAksi) { const d = Math.hypot(t.x - saya.x, t.z - saya.z); if (d < t.r && d < bd) { bd = d; pilih = t; } }
  if (!pilih && !saya.duduk) { const k = kursiDekat(); if (k) pilih = { label: 'Duduk', aksi: () => { saya.duduk = k; k.oleh = saya; saya.x = k.x; saya.z = k.z; saya.r = k.r; saya.a = 2; posWaktu = 0; } }; }
  if (!pilih && saya.duduk) pilih = { label: 'Berdiri', aksi: () => { berdiri(); posWaktu = 0; } };
  if (pilih?.label !== aksiSekarang?.label) {
    const b = $('aksi');
    if (pilih) { b.innerHTML = `${esc(pilih.label)}<kbd>E</kbd>`; b.hidden = false; } else b.hidden = true;
  }
  aksiSekarang = pilih;
}
$('aksi').onclick = () => { if (aksiSekarang) aksiSekarang.aksi(); canvas.focus(); };

// ---------------------------------------------------------------- WAKTU (Asia/Jakarta)
const LANGIT = [
  [0, '#14183a', 0.15, 0.35], [5, '#3b3b6d', 0.3, 0.5], [6, '#ffb38a', 1.0, 0.85], [8, '#bfe3ff', 2.2, 1.15],
  [16, '#bfe3ff', 2.2, 1.15], [17.5, '#ffb38a', 1.3, 0.95], [19, '#4b3a78', 0.35, 0.6], [24, '#14183a', 0.15, 0.35],
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function aturWaktu() {
  const h = jamJakarta();
  let i = 0; while (i < LANGIT.length - 2 && LANGIT[i + 1][0] <= h) i++;
  const [h1, c1, s1, a1] = LANGIT[i], [h2, c2, s2, a2] = LANGIT[i + 1];
  const t = clamp((h - h1) / (h2 - h1), 0, 1);
  _c1.set(c1).lerp(_c2.set(c2), t);
  scene.background = _c1.clone(); scene.fog.color.copy(_c1);
  matahari.intensity = s1 + (s2 - s1) * t;
  hemi.intensity = a1 + (a2 - a1) * t + (h < 6 || h > 18.5 ? 0.35 : 0); // lampu kantor menyala
}

// ---------------------------------------------------------------- LOOP
const jam = new THREE.Clock();
const _dir = new THREE.Vector3();
let waktuLangit = -1e9;
function langkah() {
  const dt = Math.min(jam.getDelta(), 0.05), t = performance.now();
  const mengetik = document.activeElement && document.activeElement.matches('input,textarea,select');
  const modal = !$('kartu').hidden && !$('kartu').classList.contains('bawah');

  // input gerak
  let maju = 0, samping = 0;
  if (!mengetik && !modal) {
    if (tombol.KeyW || tombol.ArrowUp) maju += 1;
    if (tombol.KeyS || tombol.ArrowDown) maju -= 1;
    if (tombol.KeyA || tombol.ArrowLeft) samping -= 1;
    if (tombol.KeyD || tombol.ArrowRight) samping += 1;
    if (tombol.KeyQ) kam.yaw += dt * 2; if (tombol.KeyR) kam.yaw -= dt * 2;
  }
  if (joy.aktif) { maju = joy.y; samping = joy.x; }
  const besar = Math.hypot(maju, samping);
  if (besar > 0.12) {
    berdiri();
    const fx = Math.sin(kam.yaw), fz = Math.cos(kam.yaw), rx = -Math.cos(kam.yaw), rz = Math.sin(kam.yaw);
    let mx = fx * maju + rx * samping, mz = fz * maju + rz * samping;
    const l = Math.hypot(mx, mz); mx /= l; mz /= l;
    const lari = tombol.ShiftLeft || tombol.ShiftRight || (joy.aktif && besar > 0.95);
    const v = (lari ? 6.5 : 3.8) * Math.min(1, besar) * dt;
    saya.x += mx * v; saya.z += mz * v; geser(saya);
    saya.r = sudutLerp(saya.r, Math.atan2(mx, mz), Math.min(1, dt * 12));
    saya.a = 1; saya.cepat = lari ? 1.5 : 1;
  } else if (!saya.duduk) saya.a = 0;

  // pemain sendiri
  if (saya.g) {
    saya.g.position.set(saya.x, 0, saya.z); saya.g.rotation.y = saya.r;
    pose(saya.g, saya.a, dt, saya.cepat || 1);
  }
  // pemain lain (interpolasi)
  for (const o of lain.values()) {
    const d = Math.hypot(o.tx - o.x, o.tz - o.z);
    if (d > 8) { o.x = o.tx; o.z = o.tz; }
    else { const k = Math.min(1, dt * 8); o.x += (o.tx - o.x) * k; o.z += (o.tz - o.z) * k; }
    o.r = sudutLerp(o.r, o.tr, Math.min(1, dt * 10));
    const a = o.ta === 2 ? 2 : (d > 0.05 || o.ta === 1 ? (d > 0.02 ? 1 : 0) : 0);
    o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.r; pose(o.g, a, dt);
  }
  // bot
  if (net?.mode === 'lokal') for (const o of bot) {
    updateBot(o, dt);
    o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.r; pose(o.g, o.a, dt);
  }
  // gelembung chat
  for (const o of [saya, ...lain.values(), ...bot]) if (o.gel) { o.gelT -= dt; if (o.gelT <= 0) { o.g.remove(o.gel); o.gel.material.map.dispose(); o.gel = null; } }

  // hiasan
  for (const h of hatiBesar) h.rotation.y += dt * 0.8;
  if (airHati) { airLompat = Math.max(0, airLompat - dt); airHati.rotation.y += dt * (1.2 + airLompat * 8); airHati.position.y = 1.5 + Math.sin(t / 600) * 0.12 + airLompat * 0.6; }

  // kamera
  const k = 1 - Math.exp(-dt * 10);
  kam.x += (saya.x - kam.x) * k; kam.z += (saya.z - kam.z) * k;
  const cp = Math.cos(kam.pitch);
  camera.position.set(kam.x - Math.sin(kam.yaw) * cp * kam.jarak, kam.y + Math.sin(kam.pitch) * kam.jarak, kam.z - Math.cos(kam.yaw) * cp * kam.jarak);
  camera.lookAt(kam.x, kam.y, kam.z);
  matahari.position.set(kam.x + 28, 46, kam.z + 22); matahari.target.position.set(kam.x, 0, kam.z);

  if (t - waktuLangit > 30000) { waktuLangit = t; aturWaktu(); }
  perbaruiAksi();
  kirimPosisi(t);
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- MULAI
async function mulai() {
  try { await Promise.race([document.fonts.load('700 20px Fredoka'), new Promise(r => setTimeout(r, 2500))]); await document.fonts.load('800 20px Nunito'); } catch (e) {}
  bangunDunia();
  pasangKarakterSaya();
  perbaruiTombolProfil();
  kam.x = saya.x; kam.z = saya.z;
  renderer.setAnimationLoop(langkah);
  setTimeout(() => { $('loading').classList.add('hilang'); }, 150);

  net = await buatNet();
  window.__kantor = { net, saya, lain, bot, pindah }; // untuk debugging
  net.on('pemain', sinkronLain);
  net.on('chat', terimaChat);
  net.on('papan', l => { isiPapan = l || []; papanKV.ulang(); });
  net.on('karyawan', l => { daftarKaryawan = (l || []).filter(k => k && k.n).map(k => ({ ...k, n: bersih(k.n, 20), ig: igBersih(k.ig) })); dindingKV.ulang(); });
  await net.mulai();
  if (net.mode === 'lokal') buatBot();
  hitungOnline();
  if (prof) { net.daftar({ n: prof.n, ig: prof.ig, d: prof.d }); tulisLog('', `Selamat datang kembali, ${prof.n}!`, true); }
  else setTimeout(() => { if ($('kartu').hidden) bukaDaftar(); }, 900);
}
mulai().catch(e => {
  console.error(e);
  $('loading').innerHTML = '<div style="padding:20px">Maaf, kantor gagal dibuka di perangkat ini.<br><small>Coba buka lewat Chrome atau Safari terbaru.</small></div>';
});
