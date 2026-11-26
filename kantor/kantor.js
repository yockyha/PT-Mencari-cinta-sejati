// =====================================================================
//  KANTOR VIRTUAL — PT MENCARI CINTA SEJATI
//  Dunia 3D (three.js) + karyawan lain (online / lokal) + chat.
// =====================================================================
import * as THREE from 'three';
import { CFG, TUJUAN, tujuanAman, TOPIK, STATUS, GENDER, LOKASI, lokasiDi, LS, bersih, igBersih, kasar, esc, fmt, hash, profil, simpanProfil, jamJakarta } from '../js/common.js?v=202611260100';
import { bukaDB } from '../js/db.js?v=202611260100';
import { buatLayanan } from '../js/layanan.js?v=202611260100';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, modalTengah, tanggalJam } from './ui.js?v=202611260100';
import * as Sosial from './sosial.js?v=202611260100';
import * as Direktur from './direktur.js?v=202611260100';
import * as Prog from './progres.js?v=202611260100';
import * as Game from './game.js?v=202611260100';
import * as Bayar from './bayar.js?v=202611260100';
import * as Meja from './meja.js?v=202611260100';
import * as Karyawan from './karyawan.js?v=202611260100';
import * as Hadir from './hadir.js?v=202611260100';
import { buatKarakter, pose, bentukHati } from './karakter.js?v=202611260100';
import { PAKAIAN, BARANG, SLOT, SLOT_AKS, WARNA_BAJU, WARNA_CELANA, KULIT, RAMBUT, WARNA_RAMBUT, lookV2, lookAcakV2 } from '../js/pakaian.js?v=202611260100';

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
const MEJA = [];      // meja nongkrong {x,z,topik}

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
  sofa(-9, 16.5, 0); sofa(9, 16.5, 0);
  kotak(2.2, 0.4, 1, -9, 0, 14.6, '#c99a6b', { tab: true }); kotak(2.2, 0.4, 1, 9, 0, 14.6, '#c99a6b', { tab: true });
  for (const [x, z] of [[-21.5, 18], [21.5, 18], [-21.5, 11.5], [21.5, 11.5], [-4.5, 18.5], [4.5, 18.5]]) pot(x, z);
  // lift (hiasan)
  for (const x of [-20, -16.6]) {
    kotak(2.4, 2.5, 0.2, x, 0, 10.2, '#aeb6c2', { tab: true });
    kotak(0.04, 2.3, 0.22, x, 0.05, 10.2, '#6c7480');
  }
  titikAksi.push({ x: -18.3, z: 11.6, r: 1.8, label: 'Naik lift ke Lounge 💎', aksi: () => Prog.pergiKe('lounge') });
  // mesin arcade Tangkap Hati
  kotak(1.2, 1.9, 0.8, -11.5, 0, 19.2, '#8e5cc9', { tab: true });
  kotak(1.3, 0.25, 0.9, -11.5, 1.9, 19.2, '#ff4f7b');
  kotak(1.0, 0.12, 0.35, -11.5, 0.95, 18.75, '#2a1420');
  bidangTeks(0.95, 0.72, 0, kanvas(256, 196, (x, w, h) => {
    x.fillStyle = '#2a1420'; x.fillRect(0, 0, w, h);
    x.font = '64px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💗', w / 2, 72);
    x.fillStyle = '#ffd23f'; x.font = FD(30); x.fillText('TANGKAP HATI', w / 2, 150, w - 16);
  }), -11.5, 1.45, 18.79, Math.PI);
  titikAksi.push({ x: -11.5, z: 17.7, r: 1.6, label: 'Main Tangkap Hati 🎮', aksi: () => Game.bukaArcade() });
  // papan jadwal acara
  kotak(3.4, 2.0, 0.12, -10, 0.35, 10.15, '#2a1420');
  const jadwal = kanvas(680, 400, (c, w, h) => {
    c.fillStyle = '#2a1420'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd23f'; c.font = FD(44); c.textAlign = 'center'; c.fillText('📅 JADWAL ACARA', w / 2, 56);
    const { live, nanti } = Prog.daftarAcara();
    const isi = [...live.map(x => [x, true]), ...nanti.map(x => [x, false])].slice(0, 3);
    c.textAlign = 'left';
    if (!isi.length) { c.fillStyle = '#ffb3c6'; c.font = FB(26, 800); c.textAlign = 'center'; c.fillText('Belum ada acara. Pantau terus!', w / 2, 200); }
    isi.forEach(([[, a], live], i) => {
      const Y = 86 + i * 102;
      c.fillStyle = live ? '#ff4f7b' : '#3d2433'; bulat(c, 18, Y, w - 36, 90, 12); c.fill();
      c.fillStyle = '#fff'; c.font = FB(27, 900); c.fillText((live ? '🔴 LIVE · ' : '') + a.judul, 32, Y + 36, w - 64);
      c.fillStyle = live ? '#fff6ef' : '#ffb3c6'; c.font = FB(20, 800); c.fillText(`${tanggalJam(a.mulai)} · ${LOKASI[a.lokasi]?.nama || ''}`, 32, Y + 70, w - 64);
    });
  });
  bidangTeks(3.2, 1.88, 0, jadwal, -10, 1.35, 10.22);
  K.gambarJadwal = () => jadwal.ulang();
  setInterval(() => jadwal.ulang(), 60000);
  titikAksi.push({ x: -10, z: 11.6, r: 1.8, label: 'Lihat jadwal acara', aksi: () => Prog.bukaHub('acara') });
  // mading HRD
  madingHRD(10, 10.15, 0);
  titikAksi.push({ x: 10, z: 11.5, r: 1.8, label: 'Baca mading', aksi: bukaMading });

  // ---- MEJA NONGKRONG: 8 meja, tiap meja satu topik (untuk cari teman)
  const kluster = [[-9.5, -2], [-3.5, -2], [3.5, -2], [9.5, -2], [-9.5, 5], [-3.5, 5], [3.5, 5], [9.5, 5]];
  kluster.forEach(([x, z], i) => { mejaDivisi(x, z, TOPIK[i], i); MEJA.push({ x, z, topik: TOPIK[i] }); });
  // printer
  kotak(1.1, 0.9, 0.8, 12.6, 0, 8.6, '#e9e4dd', { tab: true });
  kotak(0.8, 0.12, 0.5, 12.6, 0.9, 8.6, '#5b5f6a');
  kotak(0.5, 0.02, 0.36, 12.6, 1.02, 8.6, '#ffffff');
  titikAksi.push({ x: 12.6, z: 7.5, r: 1.5, label: 'Cetak kartu tamu', aksi: () => { location.href = '../idcard/index.html'; } });
  for (const [x, z] of [[-13, 9], [13, -6], [-13, -6], [0, -6]]) pot(x, z);
  // dispenser
  kotak(0.5, 1.2, 0.5, -13, 0, -5.2, '#dfe7ef', { tab: true });
  kotak(0.36, 0.5, 0.36, -13, 1.2, -5.2, '#8fd3ff', { mat: new THREE.MeshLambertMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7 }) });
  titikAksi.push({ x: -13, z: -4.4, r: 1.3, label: 'Ambil air minum 💧', aksi: ambilMinum });

  // ---- BUKU TAMU (koridor utara)
  dindingKaryawan();
  titikAksi.push({ x: 3, z: -17.6, r: 3.2, label: 'Lihat buku tamu', aksi: bukaBukuTamu });
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
  titikAksi.push({ x: 21.7, z: 1.0, r: 1.8, label: 'Mesin kopi jodoh', aksi: bukaKopi });
  kotak(1.3, 2.2, 1.2, 23.0, 0, 10.9, '#e8eef3', { tab: true });
  kotak(0.06, 0.6, 0.06, 22.32, 1.2, 10.5, '#9aa3ad');
  titikAksi.push({ x: 21.6, z: 10.6, r: 1.5, label: 'Buka kulkas 🧊', aksi: bukaKulkas });
  kotak(1.2, 0.7, 1.0, 23.1, 1.08, -4.5, '#f2f2f2'); // microwave
  kotak(0.8, 0.45, 0.04, 22.55, 1.2, -4.5, '#333a44');
  titikAksi.push({ x: 21.6, z: -4.5, r: 1.4, label: 'Panasin makanan 🍱', aksi: pakaiMicrowave });
  for (const [x, z] of [[18, -2.5], [18, 7.5]]) mejaBundar(x, z, 8, '💘 Kafe Jodoh');
  pot(15, 11); pot(15, -6);
  bidangTeks(2.6, 0.5, 0, kanvas(512, 96, (x, w, h) => {
    x.fillStyle = '#d35470'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#fff'; x.font = FD(56); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💘 KAFE JODOH', w / 2, h / 2 + 3, w - 20);
  }), 14.15, 2.2, 2.5, Math.PI / 2);

  // ---- TAMAN CURHAT
  airMancur(19, -13.5);
  titikAksi.push({ x: 19, z: -11, r: 2.4, label: 'Lempar koin harapan', aksi: bukaKoin });
  papanCurhat();
  titikAksi.push({ x: 19, z: -17.9, r: 1.9, label: 'Buka papan curhat', aksi: () => Sosial.bukaCurhat() });
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

  // ---- RUANG DIREKTUR (sudut tenggara lobi)
  lantai(14, 12, 24, 20, '#4a2f45', 0.034);
  dinding(14, 12, 24, 12);
  dinding(14, 12, 14, 15, { kaca: true }); dinding(14, 17, 14, 20, { kaca: true });
  kotak(1.3, 0.76, 3.2, 20.6, 0, 16, '#5b3a2a', { tab: true });
  kotak(1.45, 0.07, 3.35, 20.6, 0.76, 16, '#2a1420');
  kotak(0.5, 0.34, 0.06, 20.9, 0.83, 15.1, '#333a44');
  kotak(0.18, 0.3, 0.18, 20.4, 0.83, 17.2, '#f2b33d'); kotak(0.3, 0.06, 0.3, 20.4, 0.83, 17.2, '#5b3a2a'); // piala
  kursiKantor(21.9, 16, -Math.PI / 2, '#f2b33d', false);
  kursiKantor(19.2, 15.2, Math.PI / 2, '#2a1420'); kursiKantor(19.2, 16.8, Math.PI / 2, '#2a1420');
  kotak(0.5, 2.0, 2.8, 23.6, 0, 16, '#6b4630', { tab: true }); // lemari arsip
  titikAksi.push({ x: 22.6, z: 13.6, r: 1.3, label: 'Lihat arsip kantor 🗄', aksi: bukaArsip });
  titikAksi.push({ x: 19.4, z: 17.9, r: 1.0, label: 'Lihat piala 🏆', aksi: () => Prog.bukaHub('peringkat') });
  bidangTeks(2.6, 0.62, 0, kanvas(512, 120, (x, w, h) => {
    x.fillStyle = '#2a1420'; bulat(x, 0, 0, w, h, 20); x.fill();
    x.fillStyle = '#f2b33d'; x.font = FD(46); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('👑 DIREKTUR UTAMA', w / 2, h / 2 + 2, w - 24);
  }), 23.3, 2.35, 16, -Math.PI / 2);
  bidangTeks(2.4, 0.46, 0, kanvas(512, 96, (x, w, h) => {
    x.fillStyle = '#f2b33d'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#2a1420'; x.font = FD(48); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RUANG DIREKTUR', w / 2, h / 2 + 3, w - 20);
  }), 13.85, 2.35, 16, -Math.PI / 2);
  titikAksi.push({ x: 18.6, z: 16, r: 2.8, label: 'Meja Direktur', aksi: () => Direktur.bukaMeja() });

  // ---- LOUNGE EKSEKUTIF (taman belakang, khusus Kartu Eksekutif)
  lantai(-12, -70, 12, -54, '#3b2b3f', 0.03);
  lantai(-9, -68, 9, -57, '#5a3d55', 0.035);
  const pagar = '#d4a017';
  kotak(24.4, 1.2, 0.2, 0, 0, -70, pagar, { tab: true });
  kotak(0.2, 1.2, 16, -12, 0, -62, pagar, { tab: true }); kotak(0.2, 1.2, 16, 12, 0, -62, pagar, { tab: true });
  kotak(10.8, 1.2, 0.2, -6.6, 0, -54, pagar, { tab: true }); kotak(10.8, 1.2, 0.2, 6.6, 0, -54, pagar, { tab: true });
  kotak(2.4, 0.2, 0.2, 0, 2.6, -54, pagar, { tab: false }); kotak(0.25, 2.8, 0.25, -1.2, 0, -54, '#2a1420', { tab: true }); kotak(0.25, 2.8, 0.25, 1.2, 0, -54, '#2a1420', { tab: true });
  tabrak.push({ x1: -1.1, x2: 1.1, z1: -54.1, z2: -53.9 }); // gerbang terkunci; masuk lewat tombol
  bidangTeks(3.4, 0.6, 0, kanvas(512, 90, (x, w, h) => {
    x.fillStyle = '#2a1420'; bulat(x, 0, 0, w, h, 18); x.fill();
    x.fillStyle = '#ffd23f'; x.font = FD(46); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💎 LOUNGE EKSEKUTIF', w / 2, h / 2 + 2, w - 20);
  }), 0, 3.15, -53.85);
  for (let i = 0; i < 26; i++) { // lampu gantung
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: ['#ffd23f', '#ff8fab', '#ffffff'][i % 3] }));
    const t = i / 25; b.position.set(-12 + t * 24, 1.35 + Math.sin(t * Math.PI * 4) * 0.08, -70 + 0.05); scene.add(b);
  }
  sofa(-6, -60.5, 0); sofa(6, -60.5, 0);
  mejaBundar(-6.5, -65, 9, '💎 Lounge Eksekutif'); mejaBundar(6.5, -65, 9, '💎 Lounge Eksekutif');
  kotak(6, 1.05, 1, 0, 0, -68, '#5b3a2a', { tab: true }); kotak(6.2, 0.08, 1.2, 0, 1.05, -68, '#d4a017');
  for (let i = 0; i < 5; i++) kotak(0.14, 0.4, 0.14, -2 + i, 1.13, -68.2, ['#2f9e6e', '#c0392b', '#3a6ea5', '#f2b33d', '#8e5cc9'][i]);
  titikAksi.push({ x: 0, z: -66.6, r: 1.8, label: 'Pesan mocktail 🍹', aksi: bukaBar });
  const hl = bentukHati(1.1, '#ff4f7b'); hl.position.set(0, 3.3, -69.2); scene.add(hl); hatiBesar.push(hl);
  for (const [x, z] of [[-11, -55], [11, -55], [-11, -69], [11, -69]]) pot(x, z);
  titikAksi.push({ x: 0, z: -52.6, r: 1.8, label: 'Masuk Lounge 💎', aksi: () => Prog.pergiKe('lounge') });
  titikAksi.push({ x: 0, z: -55.4, r: 1.3, label: 'Keluar lounge', aksi: () => pindah(0, -51.8, 0) });

  // ---- LUAR KANTOR
  patungHati(-14, 32); patungHati(14, 32);
  for (const x of [-14, 14]) titikAksi.push({ x, z: 29.4, r: 2.2, label: '📸 Foto di patung hati', aksi: () => ambilFoto('Foto di Patung Hati', [x, 32]) });
  titikAksi.push({ x: 0, z: 28.6, r: 2.6, label: '📸 Foto di depan kantor', aksi: () => ambilFoto('Foto di Depan Kantor', [0, 20]) });
  titikAksi.push({ x: 0, z: -66.2, r: 1.4, label: '📸 Foto di lounge', aksi: () => ambilFoto('Foto di Lounge Eksekutif', [0, -69]) });
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
function pot(x, z, siram = true) {
  kotak(0.6, 0.55, 0.6, x, 0, z, '#d35470', { tab: true });
  const daun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), M('#3fa66a', { flatShading: true }));
  daun.position.set(x, 1.15, z); daun.castShadow = true; scene.add(daun);
  if (siram) titikAksi.push({ x, z, r: 1.15, label: 'Siram tanaman 🪴', aksi: () => siramTanaman(daun) });
}
function pohon(x, z, s = 1) {
  kotak(0.35 * s, 1.6 * s, 0.35 * s, x, 0, z, '#7a5236', { tab: true });
  const d = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 0), M(['#5cb85c', '#4aa35a', '#6cc070'][Math.abs(Math.round(x + z)) % 3], { flatShading: true }));
  d.position.set(x, 2.3 * s, z); d.castShadow = true; scene.add(d);
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15 * s, 0), M('#ff6f91'));
  b.position.set(x + 0.9 * s, 2.6 * s, z + 0.6 * s); scene.add(b);
}
const MEJA_BUNDAR = []; // {x,z,i,topik} meja bundar yang punya panel meja
function mejaBundar(x, z, mejaI = -1, topik = '') {
  if (mejaI >= 0) MEJA_BUNDAR.push({ x, z, i: mejaI, topik });
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
const hatiBesar = [];
function patungHati(x, z) {
  kotak(2.6, 0.8, 2.6, x, 0, z, '#fff6ef', { tab: true });
  const h = bentukHati(1.3, '#ff4f7b'); h.position.set(x, 2.6, z); scene.add(h); hatiBesar.push(h);
}
let teksMading = null;
function madingHRD(x, z, r) {
  kotak(3.4, 2.0, 0.12, x, 0.35, z, '#b5703f');
  teksMading = kanvas(680, 380, (c, w, h) => {
    c.fillStyle = '#f3dfc1'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff4f7b'; c.font = FD(44); c.textAlign = 'center'; c.fillText('📌 MADING KANTOR', w / 2, 52);
    c.textAlign = 'left'; let y = 100;
    for (const m of (K.mading || CFG.mading).slice(0, 3)) {
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

// ---- buku tamu (dinding utara)
let dindingKV = null;
function dindingKaryawan() {
  kotak(19.6, 2.5, 0.12, 3, 0.1, -19.8, '#2a1420');
  dindingKV = kanvas(2048, 262, (c, w, h) => {
    const daftar = K.tamu || [];
    c.fillStyle = '#2a1420'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd23f'; c.font = FD(40); c.textAlign = 'center';
    c.fillText(`📖 BUKU TAMU · ${fmt(daftar.length)} TAMU SUDAH DATANG`, w / 2, 44);
    const nama = daftar.slice(-200).map(k => (TUJUAN[k.tj]?.ikon || '') + ' ' + k.n);
    const px = nama.length < 30 ? 34 : nama.length < 80 ? 24 : 15;
    c.font = FB(px, 800); c.textAlign = 'left';
    let x = 16, y = 70 + px * 1.3;
    const pal = ['#ffb3c6', '#ffffff', '#8fd3ff', '#ffe08a', '#b9f3c9'];
    nama.forEach(n => {
      const tw = c.measureText(n).width + 30;
      if (x + tw > w - 10) { x = 16; y += px * 1.45; }
      if (y > h - 8) return;
      c.fillStyle = pal[hash(n) % pal.length]; c.fillText(n, x, y); x += tw;
    });
    if (!nama.length) { c.fillStyle = '#ffb3c6'; c.font = FB(28, 800); c.textAlign = 'center'; c.fillText('Masih kosong. Isi buku tamu & namamu langsung terpasang di sini', w / 2, 150); }
  });
  bidangTeks(19.2, 2.3, 0, dindingKV, 3, 1.35, -19.72);
}

// ---- papan curhat (taman)
let curhatKV = null;
function papanCurhat() {
  kotak(3.8, 2.3, 0.12, 19, 0.2, -19.8, '#2f6e4e');
  curhatKV = kanvas(760, 460, (c, w, h) => {
    c.fillStyle = '#eaf6ee'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2f9e6e'; c.font = FD(44); c.textAlign = 'center'; c.fillText('💬 PAPAN CURHAT', w / 2, 56);
    c.font = FB(20, 800); c.fillStyle = '#5b7a68'; c.fillText('anonim · saling peluk · jangan menghakimi', w / 2, 88);
    const isi = (K.curhatList || []).slice(-3).reverse();
    c.textAlign = 'left';
    if (!isi.length) { c.fillStyle = '#5b7a68'; c.font = FB(26, 700); c.textAlign = 'center'; c.fillText('Belum ada curhat. Mulai duluan?', w / 2, 220); }
    isi.forEach((p, i) => {
      const Y = 116 + i * 112;
      c.fillStyle = '#fff'; bulat(c, 20, Y, w - 40, 100, 14); c.fill();
      c.fillStyle = '#2a1420'; c.font = FB(24, 800);
      const b = bungkus(c, '“' + p.m + '”', w - 80);
      c.fillText(b[0], 36, Y + 36, w - 72); if (b[1]) c.fillText(b[1] + (b.length > 2 ? '…' : ''), 36, Y + 66, w - 72);
      c.font = FB(18, 800); c.fillStyle = '#2f9e6e'; c.fillText(`🤗 ${p.peluk ? Object.keys(p.peluk).length : 0} pelukan · 💬 ${p.balas ? Object.keys(p.balas).length : 0} balasan`, 36, Y + 92);
    });
  });
  bidangTeks(3.6, 2.18, 0, curhatKV, 19, 1.3, -19.73);
}

// ---------------------------------------------------------------- LABEL & GELEMBUNG
const peranOrang = uid => (K.peran[uid] === 'direktur' ? 'direktur' : K.peran[uid] === 'staf' ? 'staf' : 'tamu');
function labelNama(teks, gaya = '') {
  const kv = kanvas(360, 72, (x, w, h) => {
    x.font = FB(30, 900);
    const tw = Math.min(w - 6, x.measureText(teks).width + 30);
    x.fillStyle = gaya === 'direktur' ? 'rgba(242,179,61,.96)' : gaya === 'staf' ? 'rgba(58,110,165,.94)' : gaya === 'vip' ? 'rgba(160,110,10,.95)' : gaya ? 'rgba(255,79,123,.9)' : 'rgba(42,20,32,.78)';
    bulat(x, (w - tw) / 2, 8, tw, 54, 27); x.fill();
    x.fillStyle = gaya === 'direktur' ? '#2a1420' : '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(teks, w / 2, 37, w - 30);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kv.t, transparent: true, depthWrite: false }));
  s.scale.set(1.97, 0.4, 1); s.position.y = 2.5; s.renderOrder = 5;
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
  s.scale.set(2.8, 0.98, 1); s.position.y = 3.05; s.renderOrder = 10;
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
  saya.look = lookV2(prof?.look || lookAcakV2(Math.floor(Math.random() * 1e6), prof?.g === 'co' ? 'l' : prof?.g === 'ce' ? 'p' : ''), prof?.g);
  const peran = !resmi() ? 'pengunjung' : peranOrang(L.uid);
  saya.g = buatKarakter(peran === 'direktur' ? saya.look : Prog.lookAman(saya.look), { peran });
  saya.label = prof && prof.tj && resmi() ? labelNama(teksLabel(prof.n, prof.tj, L.uid, Prog.level()), gayaPeran(L.uid)) : labelNama('👀 Pengunjung');
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
  const orang = [...lain.values(), ...bot, ...Karyawan.daftar()];
  const semua = orang.map(o => o.g);
  const hit = ray.intersectObjects(semua, true)[0];
  if (!hit) return;
  let o = hit.object; while (o.parent && !semua.includes(o)) o = o.parent;
  const org = orang.find(p => p.g === o);
  if (org && org.karyawan) Karyawan.ketuk(org);
  else if (org) Sosial.bukaProfil(org);
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
  lobiT2: [12, 13.2], direkturPintu: [12.5, 16], direktur: [16.5, 16],
  lobiDepan: [0, 15], posSatpam: [3.4, 22.2], posBarista: [21.5, 2.0], lobiU: [-5.5, 17.9], game: [-9.8, 17.9], lokerP: [-16.6, 2.2], dispenser: [-12.6, -4.4], madingDepan: [10, 11.6],
};
const SAMBUNG = [
  ['pintu', 'lobi'], ['lobi', 'lobiB'], ['lobi', 'lobiT'], ['lobiT', 'aisle'], ['lobiB', 'aisle'],
  ['lobi', 'lobiDepan'], ['pintu', 'posSatpam'], ['pantry2', 'posBarista'], ['lobi', 'lobiU'], ['lobiU', 'game'], ['lokerD', 'lokerP'], ['utaraB2', 'dispenser'], ['lobiT', 'madingDepan'], ['aisle', 'aisleB'], ['aisle', 'tengah'],
  ['aisleB', 'tengahB'], ['aisleB', 'loker'], ['tengah', 'tengahB2'], ['tengahB2', 'tengahB'], ['tengah', 'tengahT2'], ['tengahT2', 'tengahT'],
  ['tengahT', 'aisleT'], ['tengahB', 'loker'], ['loker', 'lokerD'],
  ['tengah', 'utara'], ['utara', 'utaraB'], ['utara', 'utaraT'], ['utaraB', 'rapatLuar'], ['rapatLuar', 'rapat'], ['rapat', 'rapat2'], ['rapat2', 'rapat3'], ['rapat3', 'rapat4'], ['rapat4', 'rapat5'], ['rapat', 'rapat5'],
  ['utara', 'dinding'], ['dinding', 'dinding2'], ['tengahT', 'pantry'], ['pantry', 'pantry2'], ['pantry2', 'pantryT'], ['pantryT', 'pantryU'], ['pantry2', 'pantryS'],
  ['lobiT', 'lobiT2'], ['lobiT2', 'direkturPintu'], ['direkturPintu', 'direktur'], ['pantryU', 'taman'], ['taman', 'taman2'], ['taman', 'taman3'], ['tengahB', 'utaraB2'], ['utaraB2', 'utaraB'], ['tengahT', 'utaraT'],
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
  { n: 'Dimas', s: 'l', tj: 'teman', b: 'Suka main game & nonton bola. Ayo mabar!', rumah: 'tengah' },
  { n: 'Sinta', s: 'p', tj: 'jodoh', s: 'Jomblo', b: 'Pecinta kopi susu dan senja. Cari yang serius 😌', rumah: 'pantry2' },
  { n: 'Kevin', s: 'l', tj: 'jodoh', s: 'Lagi PDKT', b: 'Programmer, bisa benerin wifi tapi belum bisa benerin hati.', rumah: 'utara' },
  { n: 'Nadia', s: 'p', tj: 'curhat', s: 'Baru Putus', b: 'Lagi butuh teman cerita.', rumah: 'taman' },
  { n: 'Joko', s: 'l', tj: 'teman', b: 'Anak kuliner. Tahu warung enak se-Jakarta.', rumah: 'rapat' },
];
const KALIMAT = [
  'Ada yang mau mabar nanti malam?', 'Kafe Jodoh lagi rame, kopinya enak katanya.',
  'Barusan curhat di taman, lega banget.', 'Meja Kuliner sepi nih, sini gabung!',
  'Siapa yang naruh gula di kopiku? Kok tiba-tiba manis.', 'Wifi kantor lancar, perasaanku yang buffering.',
  'Udah coba lempar koin di Taman Curhat?', 'Papan rapat lagi rame, tulis juga dong!',
  'Jangan lupa isi buku tamu ya.', 'Klik orang lain buat ngajak ngobrol, jangan malu.',
  'Katanya kalau dua orang saling suka, langsung match lho.', 'Aku ke sini cuma mau cari teman ngobrol aja.',
];
const BALASAN = ['Halo juga! 👋', 'Wah, baru datang ya?', 'Selamat datang di kantor!', 'Sudah ngopi belum?', 'Hehe, iya iya.', 'Sini gabung!', 'Jangan lupa isi buku tamu ya.'];
const bot = K.bot;
function buatBot() {
  NPC.forEach((d, i) => {
    const look = lookAcakV2(hash(d.n), d.s);
    const g = buatKarakter(look);
    const [x, z] = NAV[d.rumah];
    const o = { ...d, uid: 'bot:' + d.n, nama: d.n, npc: true, look, g, x: x + (d.diam ? 2.5 : 0), z, r: d.diam ? 0 : Math.random() * 6, a: 0, jalur: [], tunggu: 2 + i * 1.5, duduk: null, gel: null, gelT: 0, ngomong: 8 + Math.random() * 20 };
    g.add(labelNama((d.peran ? '🛡 ' : TUJUAN[d.tj].ikon + ' ') + d.n, d.peran || 'npc'));
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
    const ke = acak(Object.keys(NAV).filter(k => !['pintu', 'posSatpam', 'posBarista', 'game', 'lokerP', 'lobiDepan'].includes(k)));
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
let L = null;
const lain = K.lain; // uid -> {g, nama, tj, ...}

const ikonPeran = uid => (K.peran[uid] === 'direktur' ? '👑 ' : K.peran[uid] === 'staf' ? '🛡 ' : '');
const gayaPeran = uid => (K.peran[uid] === 'direktur' ? 'direktur' : K.peran[uid] === 'staf' ? 'staf' : Prog.isVip(uid) ? 'vip' : '');
const teksLabel = (n, tj, uid, lv = 1) => (ikonPeran(uid) || (Prog.isVip(uid) ? '💎 ' : (TUJUAN[tj]?.ikon || '') + ' ')) + n + (lv > 1 && K.peran[uid] !== 'direktur' ? ' ⭐' + lv : '');

function sinkronLain(obj) {
  if (!L) return;
  const kini = L.db.now(), ada = new Set();
  for (const [uid, p] of Object.entries(obj || {})) {
    if (!p || uid === L.uid || K.sembunyi.has(uid)) continue;
    if (typeof p.t === 'number' && kini - p.t > 120000) continue;
    ada.add(uid);
    let o = lain.get(uid);
    const nm = bersih(p.n || 'Tamu', 20), tj = tujuanAman(p.tj), lv = clamp(p.lv | 0, 1, 99);
    const kunci = JSON.stringify(p.l || {}) + '|' + nm + '|' + tj + '|' + (K.peran[uid] || '') + '|' + lv + '|' + Prog.isVip(uid);
    if (!o || o.kunci !== kunci) {
      const g = buatKarakter(lookV2(p.l, p.g), { peran: peranOrang(uid) });
      g.add(labelNama(teksLabel(nm, tj, uid, lv), gayaPeran(uid)));
      const baru = { g, kunci, uid, x: +p.x || 0, z: +p.z || 0, r: +p.r || 0, gel: null, gelT: 0 };
      if (o) { scene.remove(o.g); Object.assign(baru, { x: o.x, z: o.z, r: o.r, gel: o.gel, gelT: o.gelT }); if (o.gel) g.add(o.gel); }
      o = baru; scene.add(g); lain.set(uid, o);
    }
    Object.assign(o, {
      nama: nm, tj, lv, s: bersih(p.s, 20), b: bersih(p.b, 100), gd: GENDER[p.g] ? p.g : '', ig: igBersih(p.ig), mj: bersih(p.mj, 30),
      tx: +p.x || 0, tz: +p.z || 0, tr: +p.r || 0, ta: p.a | 0,
    });
  }
  for (const [uid, o] of lain) if (!ada.has(uid)) { scene.remove(o.g); lain.delete(uid); }
  hitungOnline();
}
function hitungOnline() {
  const el = $('online'), n = lain.size + 1 + (L?.mode === 'lokal' ? bot.length : 0);
  el.querySelector('span').textContent = innerWidth < 480 ? `👥 ${fmt(n)}` : `${fmt(n)} orang di kantor${L?.mode === 'lokal' ? ' · mode lokal' : ''}`;
  el.classList.toggle('lokal', L?.mode === 'lokal');
}
$('online').onclick = () => Sosial.bukaDaftarOnline();

let posTerakhir = '', posWaktu = 0;
function kirimPosisi(t) {
  if (!L || !prof || !prof.tj || K.terkunci || !resmi()) return;
  const p = {
    n: prof.n, tj: prof.tj, s: prof.tj === 'jodoh' ? (prof.s || '') : '', b: prof.b || '', g: prof.g || '', ig: prof.ig || '',
    l: Prog.lookAman(saya.look), lv: Prog.level(), x: +saya.x.toFixed(2), z: +saya.z.toFixed(2), r: +saya.r.toFixed(2), a: saya.a, mj: saya.meja || '',
  };
  const k = `${p.x},${p.z},${p.r},${p.a},${p.mj}`;
  const detak = L.mode === 'lokal' ? 4000 : 20000;
  if ((k !== posTerakhir && t - posWaktu > (L.mode === 'lokal' ? 120 : 200)) || t - posWaktu > detak) { posTerakhir = k; posWaktu = t; L.hadir(p); }
}

// ---------------------------------------------------------------- CHAT
let chatTerakhir = 0, mulaiChat = 0;
const sudahChat = new Set();
$('chatF').addEventListener('submit', e => {
  e.preventDefault();
  const i = $('chatI'), t = bersih(i.value, 120);
  if (!t) { i.blur(); return; }
  if (!resmi()) { bukaDaftar(); return; }
  if (K.terkunci || !L) { toast('Kamu belum bisa chat sekarang.'); return; }
  if (Date.now() - chatTerakhir < 1500) { toast('Pelan-pelan, satu-satu ya 🙂'); return; }
  chatTerakhir = Date.now();
  i.value = '';
  L.chat(prof.n, t);
  Prog.lapor('tur_sapa'); Prog.lapor('chat');
  if (L.mode === 'lokal' && /(halo|hai|hi|pagi|siang|sore|malam|permisi|hello)/i.test(t)) {
    const b = acak(bot.filter(b => Math.hypot(b.x - saya.x, b.z - saya.z) < 7));
    if (b) setTimeout(() => { const r = acak(BALASAN); bicara(b, r); tulisLog(b.n, r); }, 900);
  }
});
function terimaChat(obj) {
  const item = Object.entries(obj || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  K.chatList = item.map(([k, v]) => ({ ...v, k }));
  for (const [k, c] of item) {
    if (sudahChat.has(k)) continue;
    sudahChat.add(k);
    if (!c || !c.m || K.sembunyi.has(c.uid)) continue;
    if (c.t && c.t < mulaiChat - 5 * 60000) continue;
    const nama = bersih(c.n, 20), teks = bersih(c.m, 120);
    tulisLog(ikonPeran(c.uid) + nama, teks);
    const o = c.uid === L.uid ? saya : lain.get(c.uid);
    if (o && o.g) bicara(o, teks);
  }
}

// ---------------------------------------------------------------- PENDAFTARAN & AKSES
// Pengunjung = lihat-lihat saja. Setelah mengisi formulir dan DITERIMA Direktur,
// baru resmi menjadi tamu (bisa chat, ngobrol, ikut acara, dst.).
const resmi = () => !!(L && (K.anggotaSaya || K.peran[L.uid]));
const SARAN_RUANG = { jodoh: ['Kafe Jodoh', 19.5, 2.5, Math.PI / 2], teman: ['Meja Nongkrong', 0, 1.5, Math.PI], curhat: ['Taman Curhat', 18.5, -9.2, Math.PI] };

// Syarat follow & komen sebelum di-ACC (config.js → wajibFollow)
const WF = CFG.wajibFollow && (CFG.instagram || CFG.tiktok) ? CFG.wajibFollow : null;
const akunSosial = () => [CFG.instagram && `<b>@${esc(CFG.instagram)}</b> di Instagram`, CFG.tiktok && `<b>@${esc(CFG.tiktok)}</b> di TikTok`].filter(Boolean).join(' / ');
function bukaDaftar() {
  if (resmi()) return bukaUbahData();
  const d = K.daftarku;
  if (d && d.status === 'menunggu') {
    return bukaKartu(`<h2>⏳ Pendaftaran sedang ditinjau</h2>
      <p>Halo <b>${esc(bersih(d.n, 20))}</b>! Formulirmu sudah sampai di meja Direktur. Begitu disetujui, kamu langsung resmi menjadi tamu ${TUJUAN[d.tj]?.ikon || ''} dan bisa ngobrol, ikut acara, serta kumpulkan EXP.</p>
      <p class="kecil">Sambil menunggu, kamu tetap bisa jalan-jalan melihat kantor. Halaman ini otomatis berubah saat ada keputusan.</p>
      <div class="baris"><button class="btn putih" type="button" id="dU">Ubah formulir</button><button class="btn putih" type="button" id="dB">Batalkan pendaftaran</button></div>`, {
      pasang(i) { i.querySelector('#dU').onclick = () => formulir(d); i.querySelector('#dB').onclick = () => L.batalDaftar().then(() => { toast('Pendaftaran dibatalkan.'); tutupKartu(); }).catch(() => toast('Gagal. Coba lagi.')); },
    });
  }
  if (d && d.status === 'ditolak') {
    return bukaKartu(`<h2>Pendaftaran belum diterima</h2>
      <p>${d.alasanTolak ? `Catatan dari Direktur: <b>${esc(bersih(d.alasanTolak, 160))}</b>` : 'Direktur belum bisa menerima pendaftaranmu.'}</p>
      <p class="kecil">Kamu bisa memperbaiki formulir lalu mengirimnya lagi.</p>
      <div class="baris"><button class="btn" type="button" id="dU">Perbaiki & kirim ulang</button></div>`, { pasang(i) { i.querySelector('#dU').onclick = () => formulir(d); } });
  }
  formulir(prof || {});
}

function formulir(p) {
  if (K.setelan?.daftarTutup) {
    return bukaKartu(`<h2>Pendaftaran sedang ditutup</h2><p>${esc(K.setelan.pesanDaftar || 'Direktur sedang tidak menerima tamu baru. Coba lagi nanti ya!')}</p><p class="kecil">Kamu tetap bisa jalan-jalan melihat kantor.</p>`);
  }
  const UM = CFG.pendaftaran || {}, tj = p.tj || '';
  bukaKartu(`
    <h2>📝 Formulir Pendaftaran Tamu</h2>
    <p>Saat ini kamu <b>pengunjung</b> dan hanya bisa melihat-lihat. Isi formulir ini; setelah <b>disetujui Direktur</b>, kamu resmi menjadi tamu dan bisa ngobrol, ikut acara, dan kumpulkan EXP. Tidak perlu password.</p>
    <form id="fD" novalidate>
      <label>Tujuan datang *</label>
      <div class="tjPilih" role="radiogroup">
        ${Object.entries(TUJUAN).map(([k, v]) => `<label class="tjKartu" style="--w:${v.warna}"><input type="radio" name="tj" value="${k}" ${k === tj ? 'checked' : ''}><span><b>${v.ikon}</b>${v.nama}</span></label>`).join('')}
      </div>
      <label for="dN">Nama panggilan *</label>
      <input id="dN" maxlength="20" placeholder="contoh: Raka" value="${esc(p.n || '')}">
      <div class="dua">
        <div><label for="dU">Umur *</label><input id="dU" type="number" inputmode="numeric" min="${UM.umurMin || 13}" max="99" value="${p.umur || ''}"></div>
        <div><label for="dG">Jenis kelamin</label><select id="dG">${Object.entries(GENDER).map(([k, v]) => `<option value="${k}" ${k === (p.g || '') ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label for="dK">Kota *</label><input id="dK" maxlength="40" placeholder="contoh: Bandung" value="${esc(p.kota || '')}"></div>
        <div id="bS"><label for="dS">Status hati</label><select id="dS">${STATUS.map(x => `<option ${x === p.s ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      </div>
      ${WF ? `<div class="syaratFollow"><b>📌 Syarat di-ACC Direktur</b>
        <ol><li>Follow ${akunSosial()}</li><li>Komen <b>"${esc(WF.komen || 'DAFTAR')}"</b> di postingan terbaru</li><li>Tulis username Instagram-mu di bawah (Direktur mengecek follow & komenmu dari sini)</li></ol>
        <div class="baris">${CFG.instagram ? `<a class="btn putih mini" href="https://www.instagram.com/${encodeURIComponent(CFG.instagram)}/" target="_blank" rel="noopener">📷 Buka Instagram</a>` : ''}${CFG.tiktok ? `<a class="btn putih mini" href="https://www.tiktok.com/@${encodeURIComponent(CFG.tiktok)}" target="_blank" rel="noopener">🎵 Buka TikTok</a>` : ''}</div></div>` : ''}
      <label for="dI">Username Instagram${WF ? ' *' : ' (opsional, membantu verifikasi)'}</label>
      <input id="dI" maxlength="31" placeholder="@username" autocapitalize="none" autocorrect="off" value="${esc(p.ig ? '@' + p.ig : '')}">
      <label for="dB">Tentang aku *</label>
      <textarea id="dB" maxlength="100" rows="2" placeholder="contoh: suka kopi, musik indie, dan jalan sore">${esc(p.b || '')}</textarea>
      <label for="dA2">Kenapa ingin bergabung? *</label>
      <textarea id="dA2" maxlength="200" rows="2" placeholder="contoh: pengen nambah teman ngobrol di malam hari">${esc(p.alasan || '')}</textarea>
      ${WF ? `<label class="cek"><input type="checkbox" id="dF"> Aku sudah follow ${akunSosial()} dan komen "${esc(WF.komen || 'DAFTAR')}"</label>` : ''}
      <label class="cek"><input type="checkbox" id="dA"> Data di atas benar, dan aku akan sopan, tidak melecehkan, tidak spam, serta tidak menyebar data pribadi orang lain</label>
      <p class="err" id="dE"></p>
      <div class="baris"><button class="btn" type="submit">Kirim pendaftaran</button><button class="btn putih" type="button" id="dL">Lihat-lihat dulu</button></div>
      <p class="kecil">* wajib. Umur minimal ${UM.umurMin || 13} tahun; khusus Cari Jodoh minimal ${UM.umurMinJodoh || 18} tahun.</p>
    </form>`, {
    pasang(isi) {
      isi.querySelector('#dL').onclick = tutupKartu;
      const segar = () => { isi.querySelector('#bS').hidden = isi.querySelector('input[name=tj]:checked')?.value !== 'jodoh'; };
      isi.querySelectorAll('input[name=tj]').forEach(r => r.onchange = segar); segar();
      isi.querySelector('#fD').onsubmit = async e => {
        e.preventDefault();
        const E = isi.querySelector('#dE'), v = id => isi.querySelector(id).value;
        const tjBaru = isi.querySelector('input[name=tj]:checked')?.value;
        const d = { n: bersih(v('#dN'), 20), tj: tjBaru, umur: Math.round(+v('#dU')), g: v('#dG'), kota: bersih(v('#dK'), 40), s: tjBaru === 'jodoh' ? v('#dS') : '', ig: igBersih(v('#dI')), b: bersih(v('#dB'), 100), alasan: bersih(v('#dA2'), 200) };
        const salah = !TUJUAN[d.tj] ? 'Pilih tujuan datang dulu.'
          : d.n.length < 2 ? 'Nama panggilan minimal 2 huruf.'
          : !(d.umur >= (UM.umurMin || 13) && d.umur <= 99) ? `Umur minimal ${UM.umurMin || 13} tahun.`
          : d.tj === 'jodoh' && d.umur < (UM.umurMinJodoh || 18) ? `Cari Jodoh khusus ${UM.umurMinJodoh || 18} tahun ke atas. Kamu bisa pilih Cari Teman atau Mau Curhat.`
          : d.kota.length < 2 ? 'Isi kota tempat tinggalmu.'
          : d.b.length < 10 ? 'Ceritakan sedikit tentang dirimu (minimal 10 huruf).'
          : d.alasan.length < 10 ? 'Tulis alasan bergabung (minimal 10 huruf).'
          : WF && d.ig.length < 2 ? 'Tulis username Instagram-mu supaya Direktur bisa mengecek follow & komenmu.'
          : WF && !isi.querySelector('#dF').checked ? `Follow ${CFG.instagram ? '@' + CFG.instagram : 'akun kami'} & komen "${WF.komen || 'DAFTAR'}" dulu, lalu centang ya.`
          : [d.n, d.ig, d.b, d.alasan, d.kota].some(kasar) ? 'Pakai kata-kata yang lebih sopan ya.'
          : !isi.querySelector('#dA').checked ? 'Centang pernyataan di bawah dulu ya.' : '';
        if (salah) { E.textContent = salah; return; }
        E.textContent = 'Mengirim…';
        try {
          if (WF) d.ikut = true;
          // izin notifikasi supaya tahu saat di-ACC walau tab kantor sedang di belakang
          if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
          await L.daftarAkses(d);
          prof = { ...(prof || {}), ...d, look: saya.look }; simpanProfil(prof);
          perbaruiTombolProfil();
          tutupKartu();
          bukaKartu(`<div class="match"><div class="hatiBesar">📨</div><h2>Pendaftaran terkirim!</h2><p>Direktur akan meninjau formulirmu. Kamu akan dapat kabar di sini begitu disetujui. Sambil menunggu, silakan jalan-jalan melihat kantor.</p><div class="baris"><button class="btn" type="button" id="kO">Oke</button></div></div>`, { pasang(i) { i.querySelector('#kO').onclick = tutupKartu; } });
        } catch (err) { E.textContent = 'Gagal mengirim. Coba lagi sebentar.'; }
      };
    },
  });
}

// Tamu resmi: nama & tujuan dikunci (diatur Direktur); sisanya bebas diubah
function bukaUbahData() {
  const p = prof || {};
  bukaKartu(`<h2>Ubah data tamu</h2>
    <p>${TUJUAN[p.tj]?.ikon || ''} <b>${esc(p.n || '')}</b> · ${esc(TUJUAN[p.tj]?.nama || '')}<br><span class="kecil">Nama & tujuan diatur Direktur. Hubungi Direktur lewat kotak saran di Ruang Direktur bila ingin menggantinya.</span></p>
    <form id="fU">
      <div class="dua">
        <div><label for="uG">Jenis kelamin</label><select id="uG">${Object.entries(GENDER).map(([k, v]) => `<option value="${k}" ${k === (p.g || '') ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        ${p.tj === 'jodoh' ? `<div><label for="uS">Status hati</label><select id="uS">${STATUS.map(x => `<option ${x === p.s ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>` : ''}
      </div>
      <label for="uB">Tentang aku</label><textarea id="uB" maxlength="100" rows="2">${esc(p.b || '')}</textarea>
      <label for="uI">Username Instagram</label><input id="uI" maxlength="31" value="${esc(p.ig ? '@' + p.ig : '')}" autocapitalize="none">
      <p class="err" id="uE"></p>
      <div class="baris"><button class="btn" type="submit">Simpan</button></div>
    </form>`, {
    pasang(isi) {
      isi.querySelector('#fU').onsubmit = e => {
        e.preventDefault();
        const b = bersih(isi.querySelector('#uB').value, 100), ig = igBersih(isi.querySelector('#uI').value);
        if (kasar(b) || kasar(ig)) { isi.querySelector('#uE').textContent = 'Pakai kata-kata yang lebih sopan ya.'; return; }
        prof = { ...prof, b, ig, g: isi.querySelector('#uG').value, s: isi.querySelector('#uS')?.value || prof.s };
        simpanProfil(prof); posWaktu = 0; tutupKartu(); toast('Data tersimpan ✔');
      };
    },
  });
}

// Dipanggil saat data keanggotaan / pendaftaran berubah
function terapkanAkses() {
  if (!L || K.anggotaSaya === undefined) return; // tunggu data keanggotaan termuat
  const a = K.anggotaSaya, dir = K.peran[L.uid] === 'direktur';
  const lama = K._resmiLama;
  if (a || dir) {
    const n = a ? a.n : (prof?.n || 'Direktur'), tj = a ? a.tj : (prof?.tj || 'teman');
    if (!prof || prof.n !== n || prof.tj !== tj) { prof = { ...(prof || {}), n, tj, look: prof?.look || saya.look }; simpanProfil(prof); }
    if (lama === false && !dir) {
      tulisLog('', `🎉 Selamat ${n}! Kamu resmi menjadi tamu ${TUJUAN[tj].ikon} ${TUJUAN[tj].nama}.`, 'sys');
      const s = SARAN_RUANG[tj];
      // kartu perayaan utama datang dari notifikasi ACC (progres.js); ini cadangan bila notifikasinya tidak ada
      setTimeout(() => { if (!$('kartu').hidden) return; bukaKartu(`<div class="match"><div class="hatiBesar">🎉</div><h2>Kamu resmi jadi tamu!</h2><p>Sekarang kamu bisa ngobrol, ajak orang ngobrol pribadi, ikut acara, dan kumpulkan EXP. Mau langsung ke ${s[0]}?</p>
        <div class="baris"><button class="btn" type="button" id="kS">Antar ke ${s[0]}</button><button class="btn putih" type="button" id="kN">Nanti</button></div></div>`, {
        pasang(i) { i.querySelector('#kS').onclick = () => { tutupKartu(); pindah(s[1], s[2], s[3]); }; i.querySelector('#kN').onclick = tutupKartu; } }); }, 2500);
    }
    Prog.lapor('tur_daftar');
    if (dir) Hadir.direkturMasuk();
  }
  K._resmiLama = !!(a || dir);
  $('chatI').placeholder = resmi() ? 'Tulis pesan… (Enter)' : '👀 Daftar dulu untuk ikut ngobrol';
  pasangKarakterSaya(); perbaruiTombolProfil(); posWaktu = 0; Prog.segarArah();
  if (!resmi()) L.pergi();
}
function perbaruiTombolProfil() {
  const d = K.daftarku;
  $('btnProfil').textContent = resmi() ? (TUJUAN[prof?.tj]?.ikon || '👤') + ' ' + (prof?.n || '') : d && d.status === 'menunggu' ? '⏳ Ditinjau' : '📝 Daftar';
}
$('btnProfil').onclick = () => (resmi() ? Sosial.bukaProfilSaya() : bukaDaftar());

// ---- loker: ganti penampilan (pakaian per item, dikelompokkan per jenis, pria / wanita)
function bukaLoker() {
  if (!resmi()) { bukaDaftar(); return; }
  const lama = { ...saya.look };
  const kamLama = { yaw: kam.yaw, pitch: kam.pitch, jarak: kam.jarak };
  // hadapkan karakter ke tengah ruang loker supaya kamera (di depannya) tidak menembus dinding
  if (lokasiDi(saya.x, saya.z) === 'loker') { berdiri(); saya.r = Math.PI / 2; }
  kam.yaw = saya.r + Math.PI; kam.pitch = 0.12; kam.jarak = 4.2; kam.y = innerWidth < 900 ? 0.6 : 1.1;
  const dir = K.peran[L.uid] === 'direktur', staf = !!K.peran[L.uid];
  const TAB = [['at', '👕 Atasan'], ['bw', '👖 Bawahan'], ['sp', '👟 Sepatu'], ['aks', '🎀 Aksesoris'], ['rmb', '💇 Rambut & Kulit'], ['wrn', '🎨 Warna']];
  const AWAL = { at: 'kaos', bw: 'chino', sp: 'sneakers' };
  let tab = 'at';
  const cocok = x => (x.g === 'u' || x.g === saya.look.s) && (!x.khusus || (x.khusus === 'staf' && staf) || (x.khusus === 'direktur' && dir));
  const syarat = x => x.khusus ? (x.khusus === 'direktur' ? '👑' : '🪪') : x.dm ? '💠' + x.dm : x.vip ? '💎' : x.lv > 1 ? 'Lv' + x.lv : '';
  const tombol = x => {
    const kunci = !Prog.bolehBarang(x.id), on = saya.look[x.slot] === x.id;
    return `<button type="button" data-id="${x.id}" class="${on ? 'on' : ''} ${kunci ? 'kunci' : ''}">${esc(x.nama)}${syarat(x) ? ` <small>${kunci ? '🔒 ' : ''}${syarat(x)}</small>` : ''}</button>`;
  };
  const grupJenis = slot => {
    const l = PAKAIAN.filter(x => x.slot === slot && cocok(x)), jenis = [...new Set(l.map(x => x.jenis))];
    return jenis.map(j => `<h4>${esc(j)}</h4><div class="sw teks">${l.filter(x => x.jenis === j).map(tombol).join('')}</div>`).join('');
  };
  const swatch = (k, daftar, label) => `<div class="sw">${daftar.map((w, i) => `<button type="button" data-w="${k}" data-i="${i}" class="${saya.look[k] === i ? 'on' : ''}" style="background:${w}" aria-label="${label} ${i + 1}"></button>`).join('')}</div>`;
  const isiTab = () => {
    const at = BARANG[saya.look.at] || {};
    if (tab === 'aks') return SLOT_AKS.map(s => `<h4>${SLOT[s].ikon} ${SLOT[s].nama}</h4><div class="sw teks"><button type="button" data-kosong="${s}" class="${saya.look[s] ? '' : 'on'}">Tanpa</button>${PAKAIAN.filter(x => x.slot === s && cocok(x)).map(tombol).join('')}</div>`).join('');
    if (tab === 'rmb') return `<h4>Gaya rambut</h4><div class="sw teks">${RAMBUT.map((r, i) => `<button type="button" data-w="r" data-i="${i}" class="${saya.look.r === i ? 'on' : ''}">${esc(r)}</button>`).join('')}</div>
      <h4>Warna rambut</h4>${swatch('w', WARNA_RAMBUT, 'Warna rambut')}<h4>Warna kulit</h4>${swatch('k', KULIT, 'Warna kulit')}`;
    if (tab === 'wrn') return `<h4>Warna atasan ${at.warna ? '' : '<small class="kecil">(atasan ini warnanya tetap)</small>'}</h4>${swatch('wa', WARNA_BAJU, 'Warna atasan')}
      <h4>Warna bawahan</h4>${swatch('wb', WARNA_CELANA, 'Warna bawahan')}<p class="kecil">Warna atasan juga dipakai untuk hijab & kupluk.</p>`;
    return (dir && ['at', 'bw', 'sp'].includes(tab) ? '<p class="kecil">👑 Sebagai Direktur kamu selalu tampil dengan <b>Jas Direktur, celana bahan & pantofel</b>. Pilihan di sini tersimpan untuk nanti; aksesoris tetap bebas.</p>' : '')
      + (tab === 'bw' && at.gaun ? '<p class="kecil">👗 Dress yang kamu pakai menutupi bawahan.</p>' : '') + grupJenis(tab);
  };
  bukaKartu(`<h2>Ruang Loker 👔 <small class="kecil">Level ${Prog.level()}</small></h2>
    <div class="sw teks tab lokerGender"><button type="button" data-s="l">👨 Pria</button><button type="button" data-s="p">👩 Wanita</button></div>
    <div class="sw teks tab" id="lT">${TAB.map(([k, n]) => `<button type="button" data-tab="${k}">${n}</button>`).join('')}</div>
    <div class="lokerIsi" id="lP"></div>
    <div class="baris"><button class="btn" type="button" id="lS">Simpan</button><button class="btn putih" type="button" id="lA">Acak 🎲</button></div>`, {
    bawah: true,
    pasang(isi) {
      const P = isi.querySelector('#lP');
      const pasangUlang = () => { prof.look = { ...saya.look }; pasangKarakterSaya(); saya.g.position.set(saya.x, 0, saya.z); saya.g.rotation.y = saya.r; };
      const gambar = () => {
        const top = P.scrollTop;
        P.innerHTML = isiTab(); P.scrollTop = top;
        isi.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
        isi.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === saya.look.s));
        P.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
          const x = BARANG[b.dataset.id];
          if (!Prog.bolehBarang(x.id)) {
            if (x.dm) { Bayar.bukaBeliBarang(x.id); return; }
            toast(x.vip ? `${x.nama} khusus pemegang Kartu Eksekutif 💎` : `${x.nama} terbuka di Level ${x.lv}. Kumpulkan EXP dari tugas & acara, atau beli EXP di Toko.`, 3600);
            return;
          }
          saya.look[x.slot] = SLOT_AKS.includes(x.slot) && saya.look[x.slot] === x.id ? '' : x.id;
          pasangUlang(); gambar();
        });
        P.querySelectorAll('[data-kosong]').forEach(b => b.onclick = () => { saya.look[b.dataset.kosong] = ''; pasangUlang(); gambar(); });
        P.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { saya.look[b.dataset.w] = +b.dataset.i; pasangUlang(); gambar(); });
      };
      isi.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; P.scrollTop = 0; gambar(); });
      isi.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
        const s = b.dataset.s; if (s === saya.look.s) return;
        saya.look.s = s;
        for (const slot of Object.keys(SLOT)) { const x = BARANG[saya.look[slot]]; if (x && x.g !== 'u' && x.g !== s) saya.look[slot] = AWAL[slot] || ''; }
        pasangUlang(); gambar();
      });
      isi.querySelector('#lA').onclick = () => { saya.look = lookAcakV2(Math.floor(Math.random() * 1e7), saya.look.s); pasangUlang(); gambar(); };
      isi.querySelector('#lS').onclick = () => { simpanProfil(prof); lama.simpan = true; posWaktu = 0; tutupKartu(); toast('Penampilan baru tersimpan ✨'); Prog.lapor('tur_loker'); };
      gambar();
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
  const don = '<button class="btn putih" type="button" id="rDon">🎁 Donasi</button>';
  const tim = Object.entries(K.peran).map(([u, p]) => ({ p, n: (K.tamu.find(t => t.uid === u) || {}).n || (lain.get(u) || {}).nama || 'Tanpa nama' }));
  const dir = tim.filter(t => t.p === 'direktur').map(t => esc(t.n)).join(', ') || '—';
  const staf = tim.filter(t => t.p === 'staf').map(t => esc(t.n)).join(', ') || '—';
  bukaKartu(`<h2>Selamat datang di ${esc(CFG.namaPT)}!</h2>
    <p>Kantor tempat orang datang untuk <b>💘 cari jodoh</b>, <b>🤝 cari teman</b>, atau sekadar <b>💬 curhat</b>.</p>
    <div class="peta">
      <div><b>💘 Kafe Jodoh</b><span>Pantry di timur. Mesin kopi bisa menyarankan teman ngopi.</span></div>
      <div><b>🤝 Meja Nongkrong</b><span>Tengah kantor. Duduk di meja topik favoritmu.</span></div>
      <div><b>💬 Taman Curhat</b><span>Timur laut. Papan curhat anonim + air mancur harapan.</span></div>
      <div><b>👑 Ruang Direktur</b><span>Sebelah lobi. Kirim saran untuk Direktur di sini.</span></div>
    </div>
    <p class="kecil"><b>🪪 Butuh bantuan?</b> Karyawan berseragam pink dengan tali ID biru siap jelasin tiap fitur. Ketuk mereka atau dekati lalu tekan <b>Tanya</b>. Tamu memakai lencana <b>TAMU</b> di dada.</p>
    <p class="kecil"><b>Cara berinteraksi:</b> ketuk orang lain → Sapa, 💌 Ajak ngobrol (pribadi, harus diterima), atau ❤ Suka (kalau saling suka jadi <i>match</i>). Ada tombol Laporkan dan Sembunyikan kalau ada yang mengganggu.</p>
    <p class="kecil"><b>Cara main:</b> WASD/panah untuk jalan (Shift lari) · seret layar untuk putar kamera · <b>E</b> untuk aksi · <b>Enter</b> untuk chat. Di HP: geser sisi kiri bawah untuk jalan.</p>
    <p class="kecil">👑 Direktur: ${dir}<br>🛡 Staf: ${staf}</p>
    <div class="baris">${resmi() ? '' : '<button class="btn" type="button" id="rD">📝 Daftar jadi tamu</button>'}<a class="btn putih" href="../idcard/index.html">Kartu Tamu</a>${ig}${don}</div>`, {
    pasang(isi) { const b = isi.querySelector('#rD'); if (b) b.onclick = bukaDaftar; isi.querySelector('#rDon').onclick = () => Bayar.bukaDonasi(); },
  });
}
function bukaMading() {
  const m = K.mading || CFG.mading;
  bukaKartu(`<h2>📌 Mading Kantor</h2>${m.map(x => `<p><b>${esc(x.judul)}</b><br>${esc(x.isi)}</p>`).join('') || '<p>Belum ada pengumuman.</p>'}`);
}
const bisaModerasi = () => !!(L && K.peran[L.uid]);

// ---- papan rapat
function bukaPapan() {
  const daftar = (K.papanList || []).slice(-10).reverse();
  bukaKartu(`<h2>Papan Rapat ✍</h2>
    <p>Tulisanmu tampil di papan untuk semua orang (6 tulisan terbaru).</p>
    <form id="fP"><label for="pI">Tulisanmu</label><textarea id="pI" maxlength="80" rows="2" placeholder="contoh: Agenda hari ini: berani nyapa duluan"></textarea>
    <p class="err" id="pE"></p><div class="baris"><button class="btn" type="submit">Tulis</button></div></form>
    ${daftar.length ? `<div class="daftar">${daftar.map(p => `<div><span>“${esc(p.m)}” <small>— ${esc(p.n)}</small></span>${bisaModerasi() ? `<button type="button" class="mini merah" data-hapus="papan/${esc(p.k)}">Hapus</button>` : ''}</div>`).join('')}</div>` : ''}`, {
    pasang(isi) {
      isi.querySelectorAll('[data-hapus]').forEach(b => b.onclick = async () => { try { await L.hapus(b.dataset.hapus); toast('Tulisan dihapus'); bukaPapan(); } catch (e) { toast('Gagal menghapus.'); } });
      isi.querySelector('#fP').onsubmit = e => {
        e.preventDefault();
        if (!resmi()) { bukaDaftar(); return; }
        const t = bersih(isi.querySelector('#pI').value, 80);
        if (t.length < 2) { isi.querySelector('#pE').textContent = 'Tulis sesuatu dulu.'; return; }
        if (Date.now() - LS.get('papanT', 0) < 30000) { isi.querySelector('#pE').textContent = 'Tunggu 30 detik sebelum menulis lagi.'; return; }
        LS.set('papanT', Date.now());
        L.papan(prof.n, t); tutupKartu(); toast('Tulisanmu sudah di papan ✔'); Prog.lapor('papan');
      };
    },
  });
}

// ---- buku tamu
function bukaBukuTamu() {
  const urut = K.tamu || [];
  const no = urut.findIndex(k => k.uid === L?.uid) + 1;
  let filter = '';
  bukaKartu(`<h2>📖 Buku Tamu</h2>
    <p><b>${fmt(urut.length)}</b> tamu sudah datang.${no ? ` Kamu tamu ke-<b>${fmt(no)}</b> 🎉` : ''}</p>
    <div class="sw teks tab" id="bF"><button type="button" data-f="" class="on">Semua</button>${Object.entries(TUJUAN).map(([k, v]) => `<button type="button" data-f="${k}">${v.ikon} ${v.nama}</button>`).join('')}</div>
    <label for="cI">Cari nama</label><input id="cI" placeholder="ketik nama…">
    <div class="daftarNama" id="cL"></div>`, {
    pasang(isi) {
      const Lst = isi.querySelector('#cL'), q = () => isi.querySelector('#cI').value.trim().toLowerCase();
      const tampil = () => {
        const h = urut.map((k, i) => ({ ...k, no: i + 1 })).filter(k => (!filter || k.tj === filter) && (!q() || k.n.toLowerCase().includes(q()) || (k.ig || '').includes(q()))).slice(-120).reverse();
        Lst.innerHTML = h.length ? h.map(k => `<div>#${fmt(k.no)} ${TUJUAN[k.tj]?.ikon || ''} ${esc(k.n)} ${k.ig ? `<small>@${esc(k.ig)}</small>` : ''}</div>`).join('') : '<div>Tidak ketemu.</div>';
      };
      isi.querySelector('#cI').oninput = tampil;
      isi.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; isi.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); tampil(); });
      tampil();
    },
  });
}

// ---- mesin kopi jodoh
const RAMALAN = [
  'Kopi susu: hari ini ada yang diam-diam memperhatikanmu.', 'Americano: pahit di awal, manis di akhir. Kayak kisahmu nanti.',
  'Latte: jangan cuma nunggu dia chat duluan.', 'Espresso: kecil tapi nendang. Berani sapa orang baru hari ini!',
  'Kopi tubruk: jodohmu sederhana, tapi tulus.', 'Cappuccino: banyak busa, banyak drama. Hati-hati.',
  'Kopi gula aren: yang manis-manis datang minggu ini.', 'Teh tawar: kamu belum siap, dan itu juga tidak apa-apa.',
];
function bukaKopi() {
  const r = acak(RAMALAN);
  const kandidat = [...lain.values(), ...(L?.mode === 'lokal' ? bot : [])].filter(o => o.tj === 'jodoh' && !K.sembunyi.has(o.uid));
  const pilih = kandidat.sort(() => Math.random() - 0.5).slice(0, 3);
  bukaKartu(`<h2>☕ Mesin Kopi Jodoh</h2><p style="font-size:18px"><b>${esc(r)}</b></p>
    ${pilih.length ? `<p>Tamu yang juga sedang 💘 cari jodoh:</p><div class="daftar">${pilih.map((o, i) => `<div><span>${esc(o.nama)} ${o.s ? `<small>· ${esc(o.s)}</small>` : ''}<br><small>${esc(o.b || '')}</small></span><button type="button" class="mini" data-i="${i}">Lihat</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu lain yang sedang cari jodoh. Coba lagi nanti!</p>'}
    <div class="baris"><button class="btn" type="button" id="kL">Bikin lagi</button></div>`, {
    pasang(isi) {
      isi.querySelector('#kL').onclick = bukaKopi;
      isi.querySelectorAll('[data-i]').forEach(b => b.onclick = () => Sosial.bukaProfil(pilih[+b.dataset.i]));
    },
  });
  if (prof) bicara(saya, '☕ ' + r.split(':')[0]);
  Prog.lapor('kopi');
}

// ---- air mancur
const HARAPAN = [
  'Koinmu tenggelam dengan anggun. Harapanmu tercatat di HRD langit.', 'Plung! Katanya, yang lempar koin di sini bakal disapa orang baru.',
  'Koinnya memantul… semesta minta kamu usaha dulu.', 'Air mancur berbisik: “sabar, dia lagi otw.”',
  'Koin mendarat di tengah hati. Pertanda baik!', 'Harapan diterima. Estimasi pengiriman: rahasia perusahaan.',
];
function bukaKoin() {
  Prog.lapor('koin');
  const n = (LS.get('koin', 0) || 0) + 1; LS.set('koin', n);
  airLompat = 1;
  bukaKartu(`<h2>🪙 Air Mancur Harapan</h2><p style="font-size:18px"><b>${esc(acak(HARAPAN))}</b></p><p class="kecil">Kamu sudah melempar ${fmt(n)} koin.</p>`);
}
let airLompat = 0;

// ---------------------------------------------------------------- BENDA INTERAKTIF
function keKursiMeja(m) {
  if (!m) return;
  const k = kursi.filter(k => !k.oleh && Math.hypot(k.x - m.x, k.z - m.z) < 1.9).sort((a, b) => Math.hypot(a.x - saya.x, a.z - saya.z) - Math.hypot(b.x - saya.x, b.z - saya.z))[0];
  if (!k) { pindah(m.x, m.z + 2.2, Math.PI); toast('Kursinya penuh, coba meja lain ya.'); return; }
  pindah(k.x + Math.sin(k.r) * 0.9, k.z + Math.cos(k.r) * 0.9, k.r + Math.PI);
  duduk(k);
}
function siramTanaman(daun) {
  const h = 'siram_' + new Date().toDateString(), n = (LS.get(h, 0) || 0) + 1; LS.set(h, n);
  let t = 0; const iv = setInterval(() => { t += 0.05; daun.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.25); if (t >= 1) { clearInterval(iv); daun.scale.setScalar(1); } }, 30);
  bicara(saya, acak(['🌱 Tumbuh yang subur ya!', '💦 Segar!', '🪴 Tanaman bahagia, kantor bahagia']));
  toast(`🪴 Tanaman disiram! Kamu sudah menyiram ${n} tanaman hari ini.`);
}
function ambilMinum() { bicara(saya, acak(['💧 Glek glek… segar!', '💧 Minum dulu biar nggak dehidrasi', '💧 Air putih, sahabat sejati'])); toast('💧 Kamu minum segelas air. Jangan lupa minum 8 gelas sehari!'); }
const CAMILAN = ['🍫 Cokelat batangan (ada tulisan "punya Bu Wati")', '🧃 Jus jeruk dingin', '🍦 Es krim stroberi', '🍮 Puding cokelat', '🍉 Semangka potong', '🥛 Susu kotak', '🍰 Kue ulang tahun sisa kemarin', '🧋 Es kopi susu titipan Mas Raka'];
function bukaKulkas() {
  const c = acak(CAMILAN);
  bicara(saya, 'Nemu ' + c.split(' (')[0] + '!');
  bukaKartu(`<h2>🧊 Kulkas Pantry</h2><p style="font-size:18px">Kamu nemu: <b>${esc(c)}</b></p><p class="kecil">Ambil secukupnya ya, jangan lupa bilang makasih ke yang punya 😄</p><div class="baris"><button class="btn" type="button" id="kB">Buka lagi</button></div>`, { pasang(i) { i.querySelector('#kB').onclick = bukaKulkas; } });
}
let microwaveJalan = false;
function pakaiMicrowave() {
  if (microwaveJalan) return;
  microwaveJalan = true; bicara(saya, '🍱 Panasin bekal dulu…');
  let n = 3; toast(`🍱 Memanaskan… ${n}`);
  const iv = setInterval(() => { n--; if (n > 0) toast(`🍱 Memanaskan… ${n}`); else { clearInterval(iv); microwaveJalan = false; toast('🔔 Ting! Makanan sudah hangat. Selamat makan 😋', 3200); bicara(saya, '🔔 Ting! Selamat makan 😋'); } }, 1000);
}
function bukaArsip() {
  const t = K.tamu || [], per = Object.keys(TUJUAN).map(k => [k, t.filter(x => x.tj === k).length]);
  bukaKartu(`<h2>🗄 Arsip Kantor</h2><p><b>${fmt(t.length)}</b> tamu tercatat di buku tamu.</p>
    <div class="daftar">${per.map(([k, n]) => `<div><span>${TUJUAN[k].ikon} ${esc(TUJUAN[k].nama)}</span><b>${fmt(n)}</b></div>`).join('')}<div><span>👥 Sedang di kantor</span><b>${fmt(lain.size + 1)}</b></div><div><span>🪪 Karyawan bertugas</span><b>${fmt(Karyawan.daftar().filter(o => !o.kurir).length)}</b></div></div>
    <p class="kecil">Arsip rahasia lainnya dikunci Direktur 🔐</p>`);
}
const MOCKTAIL = [['🍹 Love Potion', 'stroberi, leci & soda'], ['🍸 Golden Hour', 'mangga, markisa & madu'], ['🥂 Sparkling Rose', 'mawar, lemon & soda'], ['🧉 Blue Lagoon', 'jeruk biru & lemon'], ['☕ Affogato', 'es krim & espresso']];
function bukaBar() {
  bukaKartu(`<h2>🍹 Bar Lounge</h2><p class="kecil">Semua minuman tanpa alkohol, gratis untuk pemegang Kartu Eksekutif 💎</p>
    <div class="daftar">${MOCKTAIL.map(([n, k], i) => `<div><span><b>${n}</b><br><small>${k}</small></span><button type="button" class="mini" data-m="${i}">Pesan</button></div>`).join('')}</div>`, {
    pasang(isi) { isi.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const [n] = MOCKTAIL[+b.dataset.m]; tutupKartu(); bicara(saya, `${n}, cheers! 🥂`); toast(`${n} siap! Selamat menikmati ✨`); }); },
  });
}
// tanda "Awas Lantai Basah" dari OB
function rambuBasah(x, z, detik = 12) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const m = new THREE.Mesh(GEO, M('#ffd23f')); m.scale.set(0.42, 0.62, 0.03); m.position.set(0, 0.3, s * 0.1); m.rotation.x = s * 0.28; m.castShadow = true; g.add(m); }
  const tanda = kanvas(128, 128, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1420'; c.font = FB(22, 900); c.textAlign = 'center'; c.fillText('AWAS', w / 2, 40); c.fillText('LICIN', w / 2, 70); c.font = '34px sans-serif'; c.fillText('🧽', w / 2, 112); });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), new THREE.MeshBasicMaterial({ map: tanda.t })); p.position.set(0, 0.34, s * 0.12); p.rotation.set(s * 0.28, s > 0 ? 0 : Math.PI, 0); g.add(p); }
  g.position.set(x, 0, z); scene.add(g);
  setTimeout(() => scene.remove(g), detik * 1000);
}
// 📸 foto: kamera di depan karakter, karakter melambai, hasil bisa disimpan / dibagikan.
// Dirender ke render target sendiri (4:5, ukuran IG) lalu dibaca piksel demi piksel,
// supaya hasilnya tidak hitam di Safari/iPhone.
const kamFoto = new THREE.PerspectiveCamera(46, 4 / 5, 0.1, 300);
let fotoUrl = '';
function ambilFoto(judul, latar) {
  if (!saya.g) return;
  berdiri();
  if (latar) { saya.r = Math.atan2(saya.x - latar[0], saya.z - latar[1]); saya.g.rotation.y = saya.r; }
  saya.g.position.set(saya.x, 0, saya.z);
  for (let i = 0; i < 12; i++) pose(saya.g, 5, 0.06);
  const d = 4.8, W = 864, H = 1080;
  kamFoto.position.set(saya.x + Math.sin(saya.r) * d, 1.55, saya.z + Math.cos(saya.r) * d);
  kamFoto.lookAt(saya.x, 1.5, saya.z);
  let blob = null;
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  try {
    renderer.setRenderTarget(rt); renderer.render(scene, kamFoto);
    const px = new Uint8Array(W * H * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
    renderer.setRenderTarget(null);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), img = x.createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4); // balik atas-bawah
    x.putImageData(img, 0, 0);
    // bingkai merek
    x.fillStyle = 'rgba(42,20,32,.82)'; x.fillRect(0, H - 92, W, 92);
    x.fillStyle = '#ff4f7b'; x.font = FD(40); x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('❤ ' + CFG.namaPT, 28, H - 58, W - 56);
    x.fillStyle = '#fff6ef'; x.font = FB(24, 800); x.fillText(`${judul} · ${location.host || 'jodohonline.company'}`, 28, H - 24, W - 56);
    fotoUrl && URL.revokeObjectURL(fotoUrl);
    c.toBlob(bl => { blob = bl; tampil(); }, 'image/jpeg', 0.9);
  } catch (e) { console.warn(e); renderer.setRenderTarget(null); toast('Kamera gagal dipakai di perangkat ini.'); }
  rt.dispose();
  saya.lambai = 2.5;
  function tampil() {
    if (!blob) { toast('Kamera gagal dipakai di perangkat ini.'); return; }
    fotoUrl = URL.createObjectURL(blob);
    const file = new File([blob], 'jodohonline-foto.jpg', { type: 'image/jpeg' });
    const bisaShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    bukaKartu(`<h2>📸 ${esc(judul)}</h2><img class="fotoHasil" src="${fotoUrl}" alt="Fotomu di kantor PT Mencari Cinta Sejati">
      <div class="baris">${bisaShare ? '<button class="btn" type="button" id="fB">📤 Simpan / Bagikan</button>' : ''}<a class="btn ${bisaShare ? 'putih' : ''}" href="${fotoUrl}" download="jodohonline-foto.jpg">💾 Unduh</a><button class="btn putih" type="button" id="fU">Foto lagi</button></div>
      <p class="kecil">Di HP bisa juga <b>tekan lama fotonya → Simpan ke Foto</b>. Bagikan ke IG Story & tag @${esc(CFG.instagramNama || CFG.instagram || '')} ya!</p>`, {
      pasang(i) {
        i.querySelector('#fU').onclick = () => { tutupKartu(); setTimeout(() => ambilFoto(judul, latar), 100); };
        const fb = i.querySelector('#fB');
        if (fb) fb.onclick = () => navigator.share({ files: [file], title: CFG.namaPT, text: 'Fotoku di kantor ' + CFG.namaPT + ' 💘' }).catch(() => {});
      },
    });
  }
}

// ---------------------------------------------------------------- LOKASI
Object.entries(LOKASI).forEach(([k, l]) => {
  const b = document.createElement('button'); b.className = 'pill' + (l.vip ? ' emas' : ''); b.type = 'button'; b.textContent = l.nama;
  b.onclick = () => { Prog.pergiKe(k); b.blur(); };
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
function berdiri() { if (saya.duduk) { saya.duduk.oleh = null; saya.duduk = null; saya.a = 0; saya.meja = ''; } }
function kursiDekat() {
  let best = null, bd = 1.0;
  for (const k of kursi) {
    if (k.oleh && k.oleh !== saya) continue;
    if ([...lain.values()].some(o => o.ta === 2 && Math.hypot(o.tx - k.x, o.tz - k.z) < 0.3)) continue;
    const d = Math.hypot(k.x - saya.x, k.z - saya.z);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}
function duduk(k) {
  saya.duduk = k; k.oleh = saya; saya.x = k.x; saya.z = k.z; saya.r = k.r; saya.a = 2; posWaktu = 0;
  const m = MEJA.find(m => Math.abs(m.x - k.x) < 1.6 && Math.abs(m.z - k.z) < 1.8);
  saya.meja = m ? m.topik : '';
  if (m) {
    Prog.lapor('meja');
    const teman = [...lain.values(), ...(L?.mode === 'lokal' ? bot : [])].filter(o => o.mj === m.topik).length;
    toast(`Kamu nongkrong di meja ${m.topik}. ${teman ? teman + ' orang lain juga di sini, sapa yuk!' : 'Mulai obrolan atau ikut kegiatan mejanya!'}`, 3600);
    Meja.bukaMeja(TOPIK.indexOf(m.topik), m.topik);
    return;
  }
  const mb = MEJA_BUNDAR.find(m => Math.hypot(m.x - k.x, m.z - k.z) < 1.6);
  if (mb) { saya.meja = mb.topik; Meja.bukaMeja(mb.i, mb.topik); }
}
let aksiSekarang = null;
function perbaruiAksi() {
  let pilih = null, bd = 1e9;
  for (const t of titikAksi) { const d = Math.hypot(t.x - saya.x, t.z - saya.z); if (d < t.r && d < bd) { bd = d; pilih = t; } }
  // karyawan terdekat (kalau tidak sedang di depan benda lain, atau benar-benar di sebelahnya)
  const kw = Karyawan.terdekat(saya.x, saya.z, pilih ? 1.3 : 2.6);
  if (kw && !kw.kurir) pilih = { label: `Tanya ${kw.n} ${kw.ikon}`, aksi: () => Karyawan.ketuk(kw) };
  if (!pilih && !saya.duduk) { const k = kursiDekat(); if (k) pilih = { label: 'Duduk', aksi: () => duduk(k) }; }
  if (!pilih && saya.duduk && saya.meja) { const mt = saya.meja, i = TOPIK.indexOf(mt), mb = MEJA_BUNDAR.find(m => m.topik === mt); pilih = { label: 'Buka meja ' + mt, aksi: () => Meja.bukaMeja(i >= 0 ? i : mb.i, mt) }; }
  if (!pilih && saya.duduk) pilih = { label: 'Berdiri', aksi: () => { berdiri(); posWaktu = 0; } };
  if (pilih?.label !== aksiSekarang?.label) {
    const b = $('aksi');
    if (pilih) { b.innerHTML = `${esc(pilih.label)}<kbd>E</kbd>`; b.hidden = false; } else b.hidden = true;
  }
  aksiSekarang = pilih;
}
$('aksi').onclick = () => { if (aksiSekarang) aksiSekarang.aksi(); canvas.focus(); };

// ---------------------------------------------------------------- PENGUMUMAN, TUTUP & USIR
function tampilPengumuman(p) {
  if (!p || !p.m || !L) return;
  if (L.db.now() - (p.t || 0) > 6 * 3600e3) return;
  if (LS.get('umumT', 0) >= p.t) return;
  const el = $('umum');
  el.querySelector('span').textContent = '📢 ' + p.m;
  el.hidden = false;
  el.querySelector('button').onclick = () => { el.hidden = true; LS.set('umumT', p.t); };
  tulisLog('', '📢 Pengumuman Direktur: ' + p.m, 'sys');
}
function cekTirai() {
  if (!L) return;
  const t = $('tirai'), b = K.ban, s = K.setelan || {};
  let pesan = '';
  if (b && b.sampai > L.db.now()) pesan = `<h2>🚪 Kamu sedang dikeluarkan dari kantor</h2><p>${b.sampai > L.db.now() + 3650 * 86400e3 ? 'Akses kamu diblokir oleh pengelola.' : 'Kamu bisa masuk lagi setelah ' + esc(tanggalJam(b.sampai)) + ' WIB.'}</p>${b.alasan ? `<p class="kecil">Alasan: ${esc(b.alasan)}</p>` : ''}`;
  else if (s.tutup && !K.peran[L.uid]) pesan = `<h2>🔒 Kantor sedang tutup</h2><p>${esc(s.pesan || 'Kantor sedang istirahat sebentar. Coba lagi nanti ya!')}</p>`;
  K.terkunci = !!pesan;
  t.hidden = !pesan;
  $('undangan').hidden = !!pesan;
  if (pesan && !$('kartu').hidden) tutupKartu();
  if (pesan) { t.querySelector('.isi').innerHTML = pesan + '<p class="kecil"><a href="../index.html">← Kembali ke beranda</a></p>'; L.pergi(); }
  else posWaktu = 0;
}

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
let waktuLangit = -1e9, cekT = 0;
function langkah() {
  const dt = Math.min(jam.getDelta(), 0.05), t = performance.now();
  const mengetik = document.activeElement && document.activeElement.matches('input,textarea,select');
  const modal = modalTengah() || !$('tirai').hidden;

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
  } else if (!saya.duduk) { saya.lambai = Math.max(0, (saya.lambai || 0) - dt); saya.a = saya.lambai > 0 ? 5 : 0; }

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
  if (L?.mode === 'lokal') for (const o of bot) {
    updateBot(o, dt);
    o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.r; pose(o.g, o.a, dt);
  }
  Karyawan.update(dt);
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
  if (t - cekT > 1000) {
    cekT = t;
    Prog.cekPosisi(saya.x, saya.z);
    if (L && lokasiDi(saya.x, saya.z) === 'lounge' && !Prog.vipSaya() && !K.peran[L.uid]) { pindah(0, -51.8, 0); toast('Kartu Eksekutifmu sudah tidak aktif.'); }
  }
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

  const db = await bukaDB({ kantor: true });
  L = buatLayanan(db);
  mulaiChat = db.now();
  Object.assign(K, { L, saya, pindah, bicara, bukaDaftar, hitungOnline, berdiri, teksLabel, gayaPeran, resmi });
  Object.defineProperty(K, 'prof', { get: () => prof, set: v => { prof = v; } });
  K.segarkanOrang = () => { pasangKarakterSaya(); sinkronLain(K.onlineTerakhir); };
  window.__kantor = { L, saya, lain, bot, pindah, K }; // untuk debugging
  const urutKunci = o => Object.entries(o || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ ...v, k }));
  db.on('online', o => { K.onlineTerakhir = o; sinkronLain(o); Meja.orangBerubah(); Hadir.onlineBerubah(); });
  db.on('chat', terimaChat, { limit: 30 });
  db.on('papan', o => { K.papanList = urutKunci(o); isiPapan = K.papanList; papanKV.ulang(); }, { limit: 10 });
  db.on('curhat', o => { K.curhatList = urutKunci(o); curhatKV.ulang(); Sosial.curhatBerubah(); }, { limit: 30 });
  db.on('tamu', o => {
    const l = Object.values(o || {}).filter(k => k && k.n).map(k => ({ ...k, n: bersih(k.n, 20), ig: igBersih(k.ig), tj: tujuanAman(k.tj) }));
    K.tamu = l.sort((a, b) => (a.t || 0) - (b.t || 0)); dindingKV.ulang();
  });
  db.on('peran', o => { K.peran = o || {}; Direktur.perbaruiPeran(); terapkanAkses(); K.segarkanOrang(); cekTirai(); Hadir.perbaruiPeran(); });
  db.on('anggota/' + L.uid, o => { K.anggotaSaya = o; terapkanAkses(); });
  db.on('pendaftaran/' + L.uid, o => { K.daftarku = o; perbaruiTombolProfil(); Prog.segarArah(); });
  db.on('mading', o => { const m = Array.isArray(o) ? o : (o ? Object.values(o) : null); K.mading = m && m.length ? m.filter(Boolean) : null; teksMading.ulang(); });
  db.on('pengumuman', tampilPengumuman);
  db.on('setelan', o => { K.setelan = o || {}; cekTirai(); });
  db.on('ban/' + L.uid, o => { K.ban = o; cekTirai(); });
  setInterval(cekTirai, 30000);
  db.hapusSaatPutus('online/' + L.uid);
  if (L.mode === 'lokal') buatBot();
  Karyawan.mulai({
    scene, kursi, NAV, MEJA, jalur, simpulTerdekat, saya, pindah, bicara, labelNama, buatKarakter, pose, rambuBasah,
    fitur: {
      resepsionis: bukaResepsionis, daftar: bukaDaftar, kopi: bukaKopi, curhat: () => Sosial.bukaCurhat(), koin: bukaKoin,
      loker: () => { if (lokasiDi(saya.x, saya.z) !== 'loker') pindah(-20, 7, -Math.PI / 2); bukaLoker(); }, toko: () => Prog.bukaHub('toko'), tugas: () => Prog.bukaHub('tugas'), acara: () => Prog.bukaHub('acara'),
      peringkat: () => Prog.bukaHub('peringkat'), papan: bukaPapan, bukuTamu: bukaBukuTamu, saran: () => Direktur.bukaMeja(), lounge: () => Prog.pergiKe('lounge'),
      arcade: () => Game.bukaArcade(), patung: () => pindah(-14, 29.4, Math.PI), keMeja: i => keKursiMeja(MEJA[i]), mejaKafe: () => keKursiMeja(MEJA_BUNDAR[0]),
    },
  });
  K.efekLokal = Hadir.efekLokal; K.bukaPanel = Direktur.bukaPanel; K.panggilKaryawan = () => Karyawan.panggil(saya);
  Sosial.mulai(); Direktur.mulai(); Prog.mulai(); Hadir.mulai();
  hitungOnline();
  setTimeout(() => {
    Bayar.kembaliDariBayar();
    if (resmi()) tulisLog('', `Selamat datang kembali, ${prof?.n || ''}!`, 'sys');
    else if (location.hash === '#daftar' || !K.daftarku) { if ($('kartu').hidden) bukaDaftar(); }
    else tulisLog('', K.daftarku.status === 'menunggu' ? '⏳ Pendaftaranmu sedang ditinjau Direktur.' : 'Pendaftaranmu belum diterima. Ketuk tombol di kanan atas untuk melihat catatan.', 'sys');
  }, 1200);
}
mulai().catch(e => {
  console.error(e);
  $('loading').innerHTML = '<div style="padding:20px">Maaf, kantor gagal dibuka di perangkat ini.<br><small>Coba buka lewat Chrome atau Safari terbaru.</small></div>';
});
