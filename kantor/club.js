// =====================================================================
//  🪩 Y.H.A CLUB: klub malam besar di lahan timur kantor (gedung baru).
//  Dibangun lewat sistem GEDUNG (kantor/gedung.js): sebelum jadwal buka
//  tampil sebagai proyek pembangunan, Direktur bisa "⚡ Buka sekarang".
//
//  Isi: eksterior gelap + papan neon, lampu sorot ke langit, karpet merah
//  & tali antrean; dance floor LED, lampu sorot & laser bergerak, disco
//  ball, asap; panggung + booth DJ + layar LED; table biasa & VIP table
//  (obrolan khusus table); bar mocktail; tombol 💃 Joget.
//
//  🎧 DJ YouTube: Direktur / DJ yang ditunjuk menempel link YouTube
//  (video atau playlist). Lagu disimpan di club/lagu {id, list, judul, t}
//  lalu semua tamu di dalam club memutarnya di detik yang sama lewat
//  YouTube IFrame Player API. Tamu bisa request lagu (club/antre).
//  💌 Layar Ucapan (shoutout wall ala club mewah): Direktur bebas, VIP/VVIP
//  pakai kuota harian, tamu biasa bayar per ucapan (paket.js → layar).
//  Data: club/lagu · club/dj/<uid> · club/antre/<id> · clubMeja/<meja>/<id> · clubLayar/<id> · clubLayarKuota/<uid>/<hari>
// =====================================================================
import { esc, bersih, LS, hariIni, sensor, kasar, PAKET, rupiah } from '../js/common.js?v=202611280851';
import { TS } from '../js/db.js?v=202611280851';
import { K, toast, bukaKartu, tutupKartu, jam } from './ui.js?v=202611280851';
import * as Musik from './musik.js?v=202611280851';
import * as Prog from './progres.js?v=202611280851';
import * as Bayar from './bayar.js?v=202611280851';

// ---------------------------------------------------------------- TATA LETAK
export const AREA = [40, -22, 88, 28];          // lahan (pagar proyek)
const BX1 = 44, BX2 = 84, BZ1 = -18, BZ2 = 18;   // gedung
const PINTU = { x: 64, z: BZ2, lebar: 4 };      // pintu selatan, menghadap halaman
const PANGGUNG = { x: 64, z: -14 };
export const dalam = (x, z) => x > BX1 && x < BX2 && z > BZ1 && z < BZ2;
const MEJA_CLUB = [
  { id: 't1', nama: 'Table 1', x: 79, z: -1 }, { id: 't2', nama: 'Table 2', x: 79, z: 5 }, { id: 't3', nama: 'Table 3', x: 79, z: 11 },
  { id: 't4', nama: 'Table 4', x: 50, z: 13 },
  { id: 'vip1', nama: 'VIP Table 1', x: 79, z: -13, vip: true }, { id: 'vip2', nama: 'VIP Table 2', x: 79, z: -7.5, vip: true },
];
const MOCKTAIL = [['🍓', 'Strawberry Love Fizz', '#ff4f7b'], ['🍋', 'Lemon Crush Jomblo', '#ffd23f'], ['🫐', 'Blue Lagoon Baper', '#3fa9f5'], ['🥭', 'Mango Match Sunrise', '#ff9f1c']];

let G = null, A = null;            // grup gedung & alat bangun dari gedung.js
const ST = { lagu: null, dj: {}, antre: {}, mejaBuka: null, lepasMeja: null, ucapan: [], ucapanBaru: 0 };
const bolehDJ = () => !!(K.L && (K.peran[K.L.uid] === 'direktur' || ST.dj[K.L.uid]));

// ---------------------------------------------------------------- BANGUN (dipanggil gedung.js)
export function bangun(g, alat) {
  G = g; A = alat;
  const { D, kotakKe, papan, aksiBuka } = alat, { THREE, M } = D, J = g.jadi;
  const tampil = m => { g.tampilJadi.push(m); return m; };
  const naik = m => { g.naik.push({ m, penuh: m.scale.y, dasar: m.position.y - m.scale.y / 2, grup: !!m.isGroup }); return m; };
  const neon = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });

  // lantai lahan, jalan setapak dari depan kantor, karpet merah
  D.lantai(AREA[0], AREA[1], AREA[2], AREA[3], '#7b8a6a', 0.02);
  D.lantai(4, 28.6, PINTU.x + 2, 31.4, '#e9dccf', 0.025);
  D.lantai(PINTU.x - 2, BZ2, PINTU.x + 2, 31.4, '#e9dccf', 0.026);
  D.lantai(BX1, BZ1, BX2, BZ2, '#120d18', 0.03);
  tampil(kotakKe(J, 2.6, 0.03, 9, PINTU.x, 0.03, BZ2 + 4.6, '#b3122e'));
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = PINTU.x + s * 1.8, z = BZ2 + 1.4 + i * 1.8;
    tampil(kotakKe(J, 0.12, 0.9, 0.12, x, 0, z, '#d4a017'));
    tampil(kotakKe(J, 0.2, 0.08, 0.2, x, 0.9, z, '#ffd23f'));
    if (i < 4) { const tali = tampil(kotakKe(J, 0.05, 0.05, 1.8, x, 0.72, z + 0.9, '#8b0f2a')); tali.scale.y = 0.05; }
  }

  // dinding gedung (gelap, tanpa atap supaya kamera bisa melihat ke dalam) + pintu selatan
  const TB = 5.2, warnaDinding = '#1d1428';
  const dinding = (ax, az, bx, bz) => naik(kotakKe(J, Math.abs(bx - ax) || 0.4, TB, Math.abs(bz - az) || 0.4, (ax + bx) / 2, 0, (az + bz) / 2, warnaDinding, { tab: g.tabJadi }));
  dinding(BX1, BZ1, BX2, BZ1); dinding(BX1, BZ1, BX1, BZ2); dinding(BX2, BZ1, BX2, BZ2);
  dinding(BX1, BZ2, PINTU.x - PINTU.lebar / 2, BZ2); dinding(PINTU.x + PINTU.lebar / 2, BZ2, BX2, BZ2);
  // list neon di puncak dinding
  for (const [w, d, x, z] of [[BX2 - BX1, 0.25, (BX1 + BX2) / 2, BZ2 + 0.22], [BX2 - BX1, 0.25, (BX1 + BX2) / 2, BZ1 - 0.22], [0.25, BZ2 - BZ1, BX1 - 0.22, 0], [0.25, BZ2 - BZ1, BX2 + 0.22, 0]]) {
    const m = new THREE.Mesh(D.GEO, neon('#ff2fb3')); m.scale.set(w, 0.12, d); m.position.set(x, TB - 0.2, z); J.add(tampil(m));
  }
  // papan neon "Y.H.A CLUB" di atas pintu
  const papanNeon = D.kanvas(1024, 256, (c, w, h) => {
    const t = performance.now() / 1000, n = 0.75 + 0.25 * Math.sin(t * 6) * Math.sin(t * 1.3);
    c.fillStyle = '#0b0710'; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = D.FD(170);
    c.shadowColor = '#ff2fb3'; c.shadowBlur = 40 * n; c.fillStyle = `rgba(255,120,220,${n})`; c.fillText('Y.H.A CLUB', w / 2, h / 2 + 6, w - 40);
    c.shadowColor = '#3fd0ff'; c.shadowBlur = 20; c.strokeStyle = '#3fd0ff'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
  });
  tampil(papan(J, 11, 2.75, papanNeon, PINTU.x, TB + 1.2, BZ2 + 0.32));
  for (const dx of [-5.6, 5.6]) tampil(kotakKe(J, 0.2, 2.9, 0.2, PINTU.x + dx, TB - 0.2, BZ2 + 0.3, '#2a1f33'));
  g.anim.push((dt, t, buka) => { if (buka && t - (g.neonT || 0) > 90) { g.neonT = t; papanNeon.ulang(); } });

  // lampu sorot ke langit (berayun)
  const sorot = [];
  for (const [x, z] of [[BX1 + 2, BZ2 + 3], [BX2 - 2, BZ2 + 3], [BX1 + 2, BZ1 - 2], [BX2 - 2, BZ1 - 2]]) {
    tampil(kotakKe(J, 1, 0.8, 1, x, 0, z, '#33333d'));
    const poros = new THREE.Group(); poros.position.set(x, 0.9, z); J.add(tampil(poros));
    const sinar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 2.2, 36, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    sinar.position.y = 18; poros.add(sinar); sorot.push({ poros, f: Math.random() * 6 });
  }
  g.anim.push((dt, t, buka) => { if (!buka) return; for (const s of sorot) { s.poros.rotation.z = Math.sin(t / 1400 + s.f) * 0.45; s.poros.rotation.x = Math.cos(t / 1700 + s.f) * 0.35; } });

  // ---- PANGGUNG + BOOTH DJ + LAYAR LED
  const pg = PANGGUNG;
  naik(kotakKe(J, 22, 0.6, 6, pg.x, 0, BZ1 + 3, '#2a2233', { tab: null }));
  for (let i = 0; i < 6; i++) tampil(kotakKe(J, 22, 0.06, 0.06, pg.x, 0.6, BZ1 + 6 - i * 0.02, '#ff2fb3'));
  tampil(kotakKe(J, 6, 1.1, 1.2, pg.x, 0.6, pg.z + 0.4, '#111', { tab: g.tabJadi }));                 // meja DJ
  tampil(kotakKe(J, 5.8, 0.08, 1.0, pg.x, 1.7, pg.z + 0.4, '#3fd0ff'));
  for (const dx of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24), M('#2b2b33')); p.position.set(pg.x + dx, 1.74, pg.z + 0.4); J.add(tampil(p)); g.anim.push((dt, t, buka) => { if (buka) p.rotation.y += dt * 4; }); }
  for (const dx of [-10, 10]) { tampil(kotakKe(J, 1.6, 3.2, 1.4, pg.x + dx, 0.6, pg.z + 1, '#0e0e12', { tab: g.tabJadi })); for (const dy of [1.4, 2.8]) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), M('#3a3a44')); sp.rotation.x = Math.PI / 2; sp.position.set(pg.x + dx, 0.6 + dy, pg.z + 1.72); J.add(tampil(sp)); } }
  // truss lampu di atas panggung
  tampil(kotakKe(J, 22, 0.3, 0.3, pg.x, 6.4, pg.z + 2, '#555a66'));
  for (const dx of [-11, 11]) tampil(kotakKe(J, 0.3, 6.4, 0.3, pg.x + dx, 0, pg.z + 2, '#555a66'));
  ST.layar = D.kanvas(1024, 400, gambarLayar);
  tampil(papan(J, 20, 7.8, ST.layar, pg.x, 7.4, BZ1 + 0.3));
  g.anim.push((dt, t, buka) => { if (buka && t - (g.layarT || 0) > 120) { g.layarT = t; ST.layar.ulang(); } });

  // ---- DANCE FLOOR LED
  const ubin = [], UK = 1.5, NX = 12, NZ = 9, LX = pg.x - NX * UK / 2, LZ = -9.5;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(UK - 0.06, UK - 0.06), new THREE.MeshBasicMaterial({ color: '#330033', toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(LX + (i + 0.5) * UK, 0.045, LZ + (j + 0.5) * UK); J.add(tampil(m)); ubin.push({ m, i, j });
  }
  ST.lantaiTengah = { x: pg.x, z: LZ + NZ * UK / 2 };
  const warna = new THREE.Color();
  g.anim.push((dt, t, buka) => {
    if (!buka || t - (g.ubinT || 0) < 120) return; g.ubinT = t;
    const ketuk = Math.floor(t / (60000 / 124)), pola = Math.floor(ketuk / 16) % 3;
    for (const u of ubin) {
      const h = pola === 0 ? ((u.i + u.j) * 0.07 + t / 3000) % 1 : pola === 1 ? (((u.i + ketuk) % 4) < 2 ? 0.88 : 0.55) : (Math.hypot(u.i - NX / 2, u.j - NZ / 2) * 0.1 - t / 900) % 1;
      const terang = pola === 1 ? 0.5 : 0.35 + 0.25 * (((u.i * 7 + u.j * 3 + ketuk) % 5) === 0 ? 1 : 0);
      u.m.material.color.copy(warna.setHSL((h + 1) % 1, 0.9, terang));
    }
  });
  aksiBuka(g, { x: ST.lantaiTengah.x, z: ST.lantaiTengah.z, r: 6, label: '💃 Joget', aksi: joget });

  // disco ball + titik-titik cahaya
  const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 2), new THREE.MeshStandardMaterial({ color: '#dfe6f0', metalness: 1, roughness: 0.15, flatShading: true }));
  bola.position.set(ST.lantaiTengah.x, 7.2, ST.lantaiTengah.z); J.add(tampil(bola));
  tampil(kotakKe(J, 0.04, 1.6, 0.04, bola.position.x, 7.9, bola.position.z, '#888'));
  const kilau = [];
  for (let i = 0; i < 40; i++) { const k = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), neon('#ffffff')); k.rotation.x = -Math.PI / 2; J.add(tampil(k)); kilau.push({ k, a: i * 2.399, r: 2 + (i % 8) * 1.1 }); }
  g.anim.push((dt, t, buka) => {
    if (!buka) return; bola.rotation.y += dt * 0.8;
    for (const o of kilau) { const a = o.a + t / 1500; o.k.position.set(bola.position.x + Math.cos(a) * o.r, 0.06, bola.position.z + Math.sin(a) * o.r * 0.8); }
  });

  // lampu sorot panggung (kerucut berwarna) & laser
  const lampu = [];
  for (let i = 0; i < 6; i++) {
    const poros = new THREE.Group(); poros.position.set(pg.x - 9 + i * 3.6, 6.2, pg.z + 2); J.add(tampil(poros));
    const kr = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 18, 1, true), new THREE.MeshBasicMaterial({ color: '#ff3fbf', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    kr.position.y = -3; poros.add(kr); lampu.push({ poros, kr, f: i * 1.1 });
  }
  const laser = [];
  for (let i = 0; i < 8; i++) {
    const poros = new THREE.Group(); poros.position.set(pg.x + (i % 2 ? 4 : -4), 1.8, pg.z + 1); J.add(tampil(poros));
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 26), neon(['#00ff9c', '#ff2fb3', '#3fd0ff', '#ffe14d'][i % 4])); s.position.z = 13; poros.add(s); laser.push({ poros, f: i * 0.8 });
  }
  g.anim.push((dt, t, buka) => {
    if (!buka) return;
    for (const l of lampu) { l.poros.rotation.x = 0.35 + Math.sin(t / 900 + l.f) * 0.4; l.poros.rotation.z = Math.cos(t / 1100 + l.f) * 0.5; l.kr.material.color.setHSL(((t / 4000) + l.f / 6) % 1, 1, 0.55); }
    for (const l of laser) { l.poros.rotation.y = Math.sin(t / 700 + l.f) * 0.7; l.poros.rotation.x = -0.05 + Math.sin(t / 1300 + l.f) * 0.08; l.poros.visible = Math.floor(t / 2000 + l.f) % 3 !== 0; }
  });
  // asap tipis di dance floor
  const asap = [];
  for (let i = 0; i < 26; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), new THREE.MeshBasicMaterial({ color: '#d9d2ff', transparent: true, opacity: 0.08, depthWrite: false })); J.add(tampil(a)); asap.push({ a, x: LX + Math.random() * NX * UK, z: LZ + Math.random() * NZ * UK, f: Math.random() * 6 }); }
  g.anim.push((dt, t, buka) => { if (!buka) return; for (const o of asap) { o.a.position.set(o.x + Math.sin(t / 3000 + o.f) * 1.5, 0.5 + Math.sin(t / 2000 + o.f) * 0.2, o.z + Math.cos(t / 3500 + o.f) * 1.2); o.a.scale.setScalar(1 + 0.3 * Math.sin(t / 1800 + o.f)); } });

  // ---- BAR MOCKTAIL (sisi barat)
  naik(kotakKe(J, 1.2, 1.1, 16, BX1 + 4.2, 0, 1, '#3a1f2e', { tab: g.tabJadi }));
  tampil(kotakKe(J, 1.4, 0.1, 16.2, BX1 + 4.2, 1.1, 1, '#d4a017'));
  tampil(kotakKe(J, 0.3, 2.6, 16, BX1 + 0.6, 1.2, 1, '#241a2e'));
  for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), neon(['#ff4f7b', '#ffd23f', '#3fa9f5', '#7cff9c', '#ff9f1c'][i % 5])); b.position.set(BX1 + 0.8, 1.7 + (i % 2) * 1.0, -6 + Math.floor(i / 2) * 1.6); J.add(tampil(b)); }
  const papanBar = D.kanvas(512, 96, (c, w, h) => { c.fillStyle = '#0b0710'; c.fillRect(0, 0, w, h); c.font = D.FD(58); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#7cff9c'; c.shadowColor = '#7cff9c'; c.shadowBlur = 18; c.fillText('🍹 MOCKTAIL BAR', w / 2, h / 2 + 4, w - 20); });
  tampil(papan(J, 7, 1.3, papanBar, BX1 + 0.78, 4.2, 1, Math.PI / 2));
  for (let i = 0; i < 6; i++) { const z = -5 + i * 2.4, x = BX1 + 5.4; const kursi = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.85, 12), M('#b3122e')); kursi.position.set(x, 0.42, z); J.add(tampil(kursi)); D.kursi.push({ x, z, r: -Math.PI / 2, y: 0.85, syaratDuduk: () => g.buka }); }
  aksiBuka(g, { x: BX1 + 5.6, z: 1, r: 3.2, label: '🍹 Pesan mocktail', aksi: bukaBar });

  // ---- TABLE & SOFA (biasa + VIP)
  for (const m of MEJA_CLUB) {
    const emas = m.vip;
    if (emas) naik(kotakKe(J, 7, 0.3, 4.8, m.x, 0, m.z, '#3b2a10'));
    const y0 = emas ? 0.3 : 0;
    tampil(kotakKe(J, 1.6, 0.6, 1.0, m.x, y0, m.z, emas ? '#d4a017' : '#2b2b33', { tab: g.tabJadi }));
    const lilin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), neon(emas ? '#ffe14d' : '#ff4f7b')); lilin.position.set(m.x, y0 + 0.7, m.z); J.add(tampil(lilin));
    for (const s of [-1, 1]) {
      const sx = m.x + s * 1.55;
      tampil(kotakKe(J, 0.9, 0.45, 2.2, sx, y0, m.z, emas ? '#5b1530' : '#3a2a55'));
      tampil(kotakKe(J, 0.25, 0.9, 2.2, sx + s * 0.4, y0, m.z, emas ? '#5b1530' : '#3a2a55'));
      for (const dz of [-0.55, 0.55]) D.kursi.push({ x: sx, z: m.z + dz, r: s > 0 ? -Math.PI / 2 : Math.PI / 2, y: y0 + 0.47, syaratDuduk: () => g.buka && (!emas || Prog.vipSaya()), aksiDuduk: () => bukaTable(m) });
    }
    if (emas) { const pk = D.kanvas(320, 64, (c, w, h) => { c.fillStyle = '#d4a017'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b1220'; c.font = D.FD(40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💎 VIP', w / 2, h / 2 + 2); }); tampil(papan(J, 1.6, 0.32, pk, m.x, y0 + 1.25, m.z + 1.4)); }
    aksiBuka(g, { x: m.x - 2.6, z: m.z, r: 1.6, label: `${emas ? '💎' : '🛋️'} ${m.nama}`, aksi: () => bukaTable(m), syarat: () => !(K.saya && K.saya.duduk) });
  }
  // 💌 LAYAR UCAPAN raksasa di dinding timur (menghadap dance floor)
  ST.layarUcapan = D.kanvas(1280, 640, gambarUcapan);
  tampil(kotakKe(J, 0.3, 5.6, 19.4, BX2 - 0.5, 1.4, 0, '#0a0a0d'));
  tampil(papan(J, 18.6, 9.3, ST.layarUcapan, BX2 - 0.68, 4.2, 0, -Math.PI / 2));
  g.anim.push((dt, t, buka) => { if (buka && t - (g.ucapT || 0) > 110) { g.ucapT = t; ST.layarUcapan.ulang(); } });
  aksiBuka(g, { x: 73.5, z: 0.5, r: 3.0, label: '💌 Kirim ucapan ke layar', aksi: bukaUcapan });
  aksiBuka(g, { x: PINTU.x - 3, z: BZ2 + 2.5, r: 2.0, label: '💌 Kirim ucapan ke layar club', aksi: bukaUcapan });
  // panel DJ & request lagu di depan panggung
  aksiBuka(g, { x: pg.x, z: pg.z + 4.6, r: 2.4, label: '🎧 Panel DJ / request lagu', aksi: bukaPanelDJ });
  aksiBuka(g, { x: PINTU.x + 3, z: BZ2 + 2.5, r: 2.2, label: '📸 Foto di depan Y.H.A Club', aksi: () => D.ambilFoto('Foto di Y.H.A Club', [PINTU.x, BZ2 + 1]) });
}

// layar LED panggung: judul lagu + visualizer
function gambarLayar(c, w, h) {
  const t = performance.now() / 1000, l = ST.lagu;
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#12061f'); gr.addColorStop(1, '#05030a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 48; i++) {
    const v = l ? (0.25 + 0.75 * Math.abs(Math.sin(t * (2 + (i % 5)) + i * 0.7)) * (0.6 + 0.4 * Math.sin(t * 7.8))) : 0.08;
    c.fillStyle = `hsl(${(i * 7 + t * 60) % 360},100%,60%)`; c.fillRect(20 + i * 20.6, h - 30 - v * 170, 14, v * 170);
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#ff7ad9'; c.font = 'bold 54px Fredoka, Nunito, sans-serif'; c.fillText('Y.H.A CLUB', w / 2, 60);
  c.fillStyle = '#ffffff'; c.font = 'bold 40px Nunito, sans-serif';
  c.fillText(l ? '🎧 ' + (l.judul || 'Lagu pilihan DJ') : '🎧 DJ lagi siap-siap…', w / 2, 140, w - 60);
  c.fillStyle = '#8fd3ff'; c.font = 'bold 26px Nunito, sans-serif'; c.fillText(l ? `DJ ${l.n || ''} · request lagu di depan panggung` : 'Request lagumu di depan panggung 🎶', w / 2, 192, w - 60);
}

// ---------------------------------------------------------------- DATA (dipanggil kantor.js setelah login)
export function mulai() {
  const db = K.L.db;
  db.on('club/lagu', v => { const lama = ST.lagu; ST.lagu = v && (v.id || v.list) ? v : null; if (!lama || !ST.lagu || lama.id !== ST.lagu.id || lama.list !== ST.lagu.list || lama.t !== ST.lagu.t) muatLagu(); if (ST.panel) bukaPanelDJ(); });
  db.on('club/dj', v => { ST.dj = v || {}; });
  db.on('club/antre', v => { ST.antre = v || {}; if (ST.panel) bukaPanelDJ(); });
  let awal = true;
  db.on('clubLayar', v => {
    const l = Object.entries(v || {}).filter(([, x]) => x && x.m).map(([k, x]) => ({ ...x, k })).sort((a, b) => (b.t || 0) - (a.t || 0));
    const terbaru = l[0];
    if (!awal && terbaru && (!ST.ucapan[0] || terbaru.t > ST.ucapan[0].t)) { ST.ucapanBaru = performance.now(); bannerUcapan(terbaru); }
    ST.ucapan = l.slice(0, 30); awal = false;
    if (ST.formUcapan) segarDaftarUcapan();
  }, { limit: 30 });
  setInterval(atur, 500);
  setInterval(hitungJoget, 1000);
}

// ---------------------------------------------------------------- 🎧 PEMUTAR YOUTUBE (sinkron)
let yt = null, ytSiap = false, ytMuat = null, suaraOk = false, volUser = LS.get('clubVol', 80);
function muatAPI() {
  return (ytMuat ||= new Promise(res => {
    if (window.YT && window.YT.Player) return res();
    const lama = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { lama && lama(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s);
  }));
}
function wadah() {
  let w = document.getElementById('clubPemutar'); if (w) return w;
  w = document.createElement('div'); w.id = 'clubPemutar';
  w.innerHTML = `<style>
    #clubPemutar{position:fixed;right:8px;top:118px;z-index:40;width:190px;background:#140c1c;border:2px solid #ff2fb3;border-radius:12px;padding:6px;color:#fff;font:700 12px Nunito,sans-serif;box-shadow:0 6px 18px #0008}
    #clubPemutar[hidden]{display:none}#clubPemutar .yt{width:176px;height:99px;border-radius:8px;overflow:hidden;background:#000}
    #clubPemutar .jd{margin:5px 2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #clubPemutar .br{display:flex;gap:6px;align-items:center}#clubPemutar input{flex:1;accent-color:#ff2fb3}
    #clubPemutar button{border:0;border-radius:8px;padding:4px 8px;font:800 12px Nunito,sans-serif;cursor:pointer;background:#ff2fb3;color:#fff}</style>
    <div class="yt"><div id="clubYT"></div></div><div class="jd" id="clubJudul">🎧 Y.H.A Club</div>
    <div class="br"><button type="button" id="clubSuara">🔊 Nyalakan suara</button><input type="range" id="clubVol" min="0" max="100" aria-label="Volume musik club"></div>`;
  document.body.append(w);
  const v = w.querySelector('#clubVol'); v.value = volUser; v.oninput = () => { volUser = +v.value; LS.set('clubVol', volUser); };
  w.querySelector('#clubSuara').onclick = () => { suaraOk = true; if (yt && ytSiap) { yt.unMute(); yt.playVideo(); sinkron(true); } w.querySelector('#clubSuara').hidden = true; };
  return w;
}
async function muatLagu() {
  if (!ST.lagu) { if (yt && ytSiap) yt.stopVideo(); return; }
  if (!K.L || (!dekat() && !yt)) return;      // dimuat saat tamu mendekat club
  wadah(); await muatAPI();
  const l = ST.lagu, mulaiDetik = Math.max(0, (K.L.db.now() - (l.t || 0)) / 1000);
  const muatKe = p => { if (l.list) p.loadPlaylist({ list: l.list, listType: 'playlist', index: 0, startSeconds: Math.floor(mulaiDetik) }); else p.loadVideoById({ videoId: l.id, startSeconds: Math.floor(mulaiDetik) }); };
  if (yt && ytSiap) { muatKe(yt); return; }
  if (yt) return;
  yt = new window.YT.Player('clubYT', {
    width: 176, height: 99, playerVars: { playsinline: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
    events: {
      onReady: () => { ytSiap = true; yt.mute(); if (ST.lagu) muatKe(yt); },
      onStateChange: e => {
        if (e.data === 1) { // diputar: isi judul bila kosong (oleh DJ/Direktur)
          const d = yt.getVideoData ? yt.getVideoData() : null;
          if (d && d.title) { document.getElementById('clubJudul').textContent = '🎧 ' + d.title; if (ST.lagu && !ST.lagu.judul && bolehDJ()) K.L.db.update('club/lagu', { judul: bersih(d.title, 100) }).catch(() => {}); }
        }
        if (e.data === 0 && ST.lagu && ST.lagu.ulang !== false && !ST.lagu.list) { yt.seekTo(0, true); yt.playVideo(); }
      },
      onError: e => { if ([100, 101, 150].includes(e.data)) { toast('🎧 Lagu ini tidak bisa diputar di luar YouTube (dibatasi pemiliknya). Coba lagu lain ya.', 5000); } },
    },
  });
}
const dekat = () => { const s = K.saya; return !!(s && s.x > BX1 - 14 && s.x < BX2 + 14 && s.z > BZ1 - 14 && s.z < BZ2 + 16); };
// sinkronkan posisi lagu dengan waktu mulai di database (toleransi 3 detik)
function sinkron(paksa = false) {
  if (!yt || !ytSiap || !ST.lagu || ST.lagu.list || !yt.getDuration) return;
  const dur = yt.getDuration(); if (!dur) return;
  let target = (K.L.db.now() - (ST.lagu.t || 0)) / 1000;
  if (ST.lagu.ulang !== false) target %= dur; else if (target > dur) return;
  if (paksa || Math.abs(yt.getCurrentTime() - target) > 3) yt.seekTo(target, true);
}
let aturT = 0;
function atur() {
  const s = K.saya; if (!s || !G) return;
  const buka = G.buka, didalam = buka && dalam(s.x, s.z), sekitar = buka && dekat();
  const w = document.getElementById('clubPemutar');
  if (sekitar && ST.lagu && !yt) muatLagu();
  if (w) w.hidden = !(didalam && ST.lagu);
  if (!yt || !ytSiap) return;
  if (!ST.lagu || !sekitar) { if (yt.getPlayerState && yt.getPlayerState() === 1) yt.pauseVideo(); return; }
  if (yt.getPlayerState() !== 1 && yt.getPlayerState() !== 3) { yt.playVideo(); }
  // volume: makin keras dekat panggung, pelan di luar gedung
  const d = Math.hypot(s.x - PANGGUNG.x, s.z - PANGGUNG.z);
  const faktor = didalam ? Math.max(0.35, Math.min(1, 1.15 - d / 40)) : 0.12;
  if (suaraOk) { yt.unMute(); yt.setVolume(Math.round(volUser * faktor)); } else yt.mute();
  if (++aturT % 10 === 0) sinkron();
}
export const musikClubNyala = () => !!(G && G.buka && ST.lagu && K.saya && dalam(K.saya.x, K.saya.z));

// ---------------------------------------------------------------- PANEL DJ & REQUEST LAGU
function urai(link) {
  const s = String(link || '').trim(); let id = '', list = '';
  try {
    const u = new URL(s.startsWith('http') ? s : 'https://' + s);
    if (/youtu\.be$/.test(u.hostname)) id = u.pathname.slice(1, 12);
    else if (/youtube\.com$/.test(u.hostname.replace(/^(www|m|music)\./, ''))) {
      id = u.searchParams.get('v') || (u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/) || [])[2] || '';
      list = u.searchParams.get('list') || '';
    }
  } catch (e) { if (/^[\w-]{11}$/.test(s)) id = s; }
  return { id: /^[\w-]{11}$/.test(id) ? id : '', list: /^[\w-]{10,64}$/.test(list) ? list : '' };
}
function bukaPanelDJ() {
  const L = K.L; if (!L) return;
  const dj = bolehDJ(), dir = K.peran[L.uid] === 'direktur', l = ST.lagu;
  const antre = Object.entries(ST.antre).filter(([, v]) => v).sort((a, b) => (a[1].t || 0) - (b[1].t || 0));
  ST.panel = true;
  bukaKartu(`<h2>🎧 ${dj ? 'Panel DJ' : 'Request Lagu'} · Y.H.A Club</h2>
    <p>${l ? `Sedang diputar: <b>${esc(l.judul || 'Lagu YouTube')}</b>${l.n ? ` <small>· DJ ${esc(l.n)}</small>` : ''}` : 'Belum ada lagu diputar.'}</p>
    ${dj ? `<label for="djL">Link YouTube (video atau playlist)</label><input id="djL" placeholder="https://youtu.be/… atau https://www.youtube.com/playlist?list=…">
      <label class="cek"><input type="checkbox" id="djU" checked> 🔁 Ulang terus sampai diganti</label>
      <p class="err" id="djE"></p><div class="baris"><button class="btn" type="button" id="djP">▶️ Putar untuk semua</button>${l ? '<button class="btn putih" type="button" id="djS">⏹️ Hentikan</button>' : ''}</div>`
    : `<label for="rqL">Link YouTube lagu request</label><input id="rqL" placeholder="https://youtu.be/…"><label for="rqC">Catatan (opsional)</label><input id="rqC" maxlength="60" placeholder="contoh: buat yang lagi galau 😆">
      <p class="err" id="rqE"></p><div class="baris"><button class="btn" type="button" id="rqK">🙋 Kirim request</button></div>`}
    <h3 style="margin-top:12px">📝 Antrean request (${antre.length})</h3>
    ${antre.length ? `<div class="daftar">${antre.map(([k, v]) => `<div><span><b>${esc(bersih(v.c || 'Lagu request', 60))}</b><br><small>dari ${esc(bersih(v.n, 30))} · ${esc(jam(v.t))}</small></span>${dj ? `<span class="baris kecil" style="margin:0"><button type="button" class="mini" data-p="${esc(k)}">▶️</button><button type="button" class="mini putih" data-h="${esc(k)}">✕</button></span>` : ''}</div>`).join('')}</div>` : '<p class="kecil">Belum ada request.</p>'}
    ${dir ? `<h3 style="margin-top:12px">🎛️ DJ yang ditunjuk</h3><div class="daftar">${Object.keys(ST.dj).map(u => `<div><span>${esc(namaUid(u))}</span><button type="button" class="mini putih" data-cd="${esc(u)}">Cabut</button></div>`).join('') || '<p class="kecil">Belum ada. Ketuk tamu di dalam club untuk melihat profilnya, atau pilih di bawah.</p>'}</div>
      <label for="djT">Tunjuk DJ (nama tamu)</label><input id="djT" list="djDaftar" placeholder="ketik nama tamu"><datalist id="djDaftar">${(K.tamu || []).slice(-300).map(t => `<option value="${esc(t.n)}">`).join('')}</datalist>
      <div class="baris"><button class="btn putih" type="button" id="djTk">🎧 Jadikan DJ</button></div>` : ''}
    <p class="kecil">Musik diputar lewat YouTube dan terdengar oleh semua tamu di dalam club. Ketuk <b>🔊 Nyalakan suara</b> di pemutar kecil kiri bawah kalau belum terdengar.</p>`, {
    tutup() { ST.panel = false; },
    pasang(el) {
      const putar = async (v, nama) => {
        await L.db.set('club/lagu', { id: v.id || '', list: v.list || '', judul: bersih(nama || '', 100), ulang: el.querySelector('#djU') ? el.querySelector('#djU').checked : true, n: bersih(K.prof?.n || 'DJ', 30), oleh: L.uid, t: TS });
        suaraOk = true; toast('🎧 Lagu diputar untuk semua tamu di club!');
      };
      const p = el.querySelector('#djP'); if (p) p.onclick = async () => { const v = urai(el.querySelector('#djL').value); if (!v.id && !v.list) { el.querySelector('#djE').textContent = 'Link YouTube tidak dikenali.'; return; } try { await putar(v, ''); } catch (e) { el.querySelector('#djE').textContent = 'Gagal. Hanya Direktur/DJ yang boleh memutar lagu.'; } };
      const s = el.querySelector('#djS'); if (s) s.onclick = () => L.db.set('club/lagu', null).then(() => toast('⏹️ Musik dihentikan.'));
      const r = el.querySelector('#rqK'); if (r) r.onclick = async () => {
        const v = urai(el.querySelector('#rqL').value); if (!v.id) { el.querySelector('#rqE').textContent = 'Tempel link video YouTube ya.'; return; }
        try { L.db.push('club/antre', { uid: L.uid, n: bersih(K.prof?.n || 'Tamu', 30), id: v.id, c: bersih(el.querySelector('#rqC').value, 60), t: TS }); toast('🙋 Request terkirim ke DJ!'); el.querySelector('#rqL').value = ''; } catch (e) { el.querySelector('#rqE').textContent = 'Gagal mengirim request.'; }
      };
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = async () => { const v = ST.antre[b.dataset.p]; if (!v) return; await putar({ id: v.id }, ''); L.db.set('club/antre/' + b.dataset.p, null); });
      el.querySelectorAll('[data-h]').forEach(b => b.onclick = () => L.db.set('club/antre/' + b.dataset.h, null));
      el.querySelectorAll('[data-cd]').forEach(b => b.onclick = () => L.db.set('club/dj/' + b.dataset.cd, null).then(() => toast('DJ dicabut.')));
      const tk = el.querySelector('#djTk'); if (tk) tk.onclick = () => {
        const n = bersih(el.querySelector('#djT').value, 30).toLowerCase(), t = (K.tamu || []).find(x => (x.n || '').toLowerCase() === n);
        if (!t) { toast('Nama tamu tidak ditemukan.'); return; }
        L.db.set('club/dj/' + t.uid, true).then(() => toast(`🎧 ${t.n} sekarang DJ Y.H.A Club!`));
      };
    },
  });
}
const namaUid = u => ((K.tamu || []).find(t => t.uid === u) || {}).n || (K.lain.get(u) || {}).nama || u.slice(0, 6);

export const bukaPanel = () => bukaPanelDJ();
export const bukaBarKartu = () => bukaBar();

// ---------------------------------------------------------------- 💃 JOGET (tugas harian: joget 1 menit)
function joget() {
  if (!K.resmi || !K.resmi()) { K.bukaDaftar && K.bukaDaftar(); return; }
  K.emote && K.emote(7, 15);
  toast(['💃 Gas joget! Ikutin beat-nya~', '🕺 Mantap, lantai dansa makin rame!', '💃 Joget terus, jangan kasih kendor!'][Math.floor(Math.random() * 3)]);
}
function hitungJoget() {
  const s = K.saya; if (!s || !G || !G.buka || !dalam(s.x, s.z) || s.emoteA !== 7 || !(s.emoteT > 0)) return;
  const k = 'joget_' + hariIni(), n = (LS.get(k, 0) || 0) + 1; LS.set(k, n);
  if (n === 60) { Prog.lapor('joget'); toast('🔥 Udah joget 1 menit di Y.H.A Club! Tugas harian selesai.', 3500); }
}

// ---------------------------------------------------------------- 🍹 BAR MOCKTAIL
let gelas = null;
function bukaBar() {
  bukaKartu(`<h2>🍹 Mocktail Bar</h2><p class="kecil">Semua minuman di Y.H.A Club <b>tanpa alkohol</b>. Pilih satu, gratis buat tamu!</p>
    <div class="daftar">${MOCKTAIL.map(([e, n], i) => `<div><span>${e} <b>${esc(n)}</b></span><button type="button" class="mini" data-m="${i}">Pesan</button></div>`).join('')}</div>`, {
    pasang(el) { el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { tutupKartu(); minum(MOCKTAIL[+b.dataset.m]); }); },
  });
}
function minum([e, n, warna]) {
  const s = K.saya, D = A && A.D; if (!s || !D) return;
  if (gelas && gelas.parent) gelas.parent.remove(gelas);
  const kanan = s.g && s.g.userData && s.g.userData.lengan && s.g.userData.lengan[1];
  if (kanan) {
    gelas = new D.THREE.Group();
    const kaca = new D.THREE.Mesh(new D.THREE.CylinderGeometry(0.07, 0.05, 0.18, 10), new D.THREE.MeshStandardMaterial({ color: warna, transparent: true, opacity: 0.85 }));
    const sedotan = new D.THREE.Mesh(new D.THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), new D.THREE.MeshBasicMaterial({ color: '#ffffff' })); sedotan.position.set(0.03, 0.1, 0); sedotan.rotation.z = 0.3;
    gelas.add(kaca, sedotan); gelas.position.set(0, -0.64, 0.12); kanan.add(gelas);
    setTimeout(() => { if (gelas && gelas.parent) gelas.parent.remove(gelas); }, 90000);
  }
  K.emote && K.emote(4, 3); Musik.sfx('minum');
  toast(`${e} ${n} siap! Cheers 🥂 (tanpa alkohol)`, 3200);
}

// ---------------------------------------------------------------- 🛋️ OBROLAN TABLE (seperti Meja Nongkrong)
function bukaTable(m) {
  const L = K.L; if (!L) return;
  if (m.vip && !Prog.vipSaya()) { toast('💎 VIP Table khusus tamu VIP & VVIP.'); return; }
  if (ST.lepasMeja) ST.lepasMeja();
  bukaKartu(`<h2>${m.vip ? '💎' : '🛋️'} ${esc(m.nama)} · Y.H.A Club</h2>
    <p class="kecil">Obrolan khusus table ini. Semua yang duduk di sini bisa ikut ngobrol${m.vip ? ' (khusus VIP & VVIP)' : ''}.</p>
    <div class="dmIsi" id="tbI"><p class="kecil">Memuat…</p></div>
    <form class="dmForm" id="tbF" autocomplete="off"><input id="tbT" maxlength="160" placeholder="Tulis pesan di table…"><button class="btn" type="submit">Kirim</button></form>`, {
    tutup() { if (ST.lepasMeja) ST.lepasMeja(); ST.lepasMeja = null; },
    pasang(el) {
      const box = el.querySelector('#tbI');
      ST.lepasMeja = L.db.on('clubMeja/' + m.id, o => {
        const l = Object.values(o || {}).sort((a, b) => a.t - b.t);
        box.innerHTML = l.length ? l.map(x => `<div class="dm ${x.uid === L.uid ? 'saya' : ''}">${x.uid === L.uid ? '' : `<small><b>${esc(bersih(x.n, 30))}</b></small>`}<span>${esc(x.m)}</span><small>${esc(jam(x.t))}</small></div>`).join('') : '<p class="kecil">Belum ada obrolan. Sapa yang satu table!</p>';
        box.scrollTop = box.scrollHeight;
      }, { limit: 40 });
      el.querySelector('#tbF').onsubmit = e => {
        e.preventDefault(); const i = el.querySelector('#tbT'), t = bersih(i.value, 160); if (!t) return; i.value = '';
        try { L.db.push('clubMeja/' + m.id, { uid: L.uid, n: bersih(K.prof?.n || 'Tamu', 30), m: t, t: TS }); } catch (er) { toast('Gagal mengirim.'); }
      };
    },
  });
}

// ---------------------------------------------------------------- 💌 LAYAR UCAPAN (shoutout wall)
const TEMA = {
  emas: { a: '#f7d774', b: '#b8860b', c: '#fff6d5', g: '#ffb300', nama: '✨ Gold Luxe' },
  pink: { a: '#ff7ac8', b: '#c2185b', c: '#ffe0f0', g: '#ff2fb3', nama: '💗 Pink Neon' },
  biru: { a: '#7fe3ff', b: '#0077b6', c: '#e0f8ff', g: '#00b4ff', nama: '🧊 Blue Ice' },
  ungu: { a: '#c9a2ff', b: '#6a1b9a', c: '#f1e6ff', g: '#9d4dff', nama: '🔮 Royal Purple' },
};
const LENCANA = { dir: '👑 DIREKTUR', vvip: '👑 VVIP', vip: '💎 VIP', bayar: '💌 SPECIAL' };
// ucapan yang sedang tayang: ucapan baru tampil dulu 15 detik, lalu bergantian tiap 12 detik
function ucapanTayang() {
  const l = ST.ucapan; if (!l.length) return null;
  if (performance.now() - ST.ucapanBaru < 15000) return l[0];
  return l[Math.floor(Date.now() / 12000) % Math.min(l.length, 12)];
}
function bungkus(c, teks, maks, baris) {
  const kata = String(teks).split(' '), hasil = []; let b = '';
  for (const k of kata) { const coba = b ? b + ' ' + k : k; if (c.measureText(coba).width > maks && b) { hasil.push(b); b = k; } else b = coba; }
  if (b) hasil.push(b);
  if (hasil.length > baris) { hasil.length = baris; hasil[baris - 1] = hasil[baris - 1].replace(/.{0,2}$/, '…'); }
  return hasil;
}
function gambarUcapan(c, w, h, contoh) {
  const D = A && A.D, FD = n => (D ? D.FD(n) : `bold ${n}px sans-serif`), FB = (n, b = 800) => (D ? D.FB(n, b) : `${b} ${n}px sans-serif`);
  const t = performance.now() / 1000, u = contoh || ucapanTayang(), T = TEMA[(u && u.tema) || 'emas'] || TEMA.emas;
  // latar hitam mewah + cahaya tema
  c.fillStyle = '#050307'; c.fillRect(0, 0, w, h);
  const rg = c.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h / 2, w * 0.7); rg.addColorStop(0, T.g + '55'); rg.addColorStop(1, '#00000000'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
  // sapuan cahaya diagonal
  const x0 = ((t * 260) % (w * 2)) - w * 0.5, sg = c.createLinearGradient(x0, 0, x0 + 260, h); sg.addColorStop(0, '#ffffff00'); sg.addColorStop(0.5, '#ffffff16'); sg.addColorStop(1, '#ffffff00'); c.fillStyle = sg; c.fillRect(0, 0, w, h);
  // gemerlap
  for (let i = 0; i < 60; i++) { const x = (i * 197.3) % w, y = (i * 113.7) % h, k = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); c.fillStyle = `rgba(255,255,255,${0.15 + 0.75 * k * k})`; const r = 1 + 2.2 * k; c.beginPath(); c.moveTo(x, y - r * 3); c.lineTo(x + r, y); c.lineTo(x, y + r * 3); c.lineTo(x - r, y); c.closePath(); c.fill(); }
  // bingkai ganda emas + ornamen sudut
  const fg = c.createLinearGradient(0, 0, w, h); fg.addColorStop(0, T.a); fg.addColorStop(0.5, T.c); fg.addColorStop(1, T.b);
  c.strokeStyle = fg; c.lineWidth = 10; c.strokeRect(18, 18, w - 36, h - 36); c.lineWidth = 3; c.strokeRect(34, 34, w - 68, h - 68);
  c.fillStyle = fg; for (const [x, y] of [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34]]) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-14, -14, 28, 28); c.restore(); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (!u) {
    c.shadowColor = T.g; c.shadowBlur = 30; c.fillStyle = fg; c.font = FD(110); c.fillText('Y.H.A CLUB', w / 2, h * 0.34);
    c.shadowBlur = 0; c.fillStyle = '#fff'; c.font = FB(44, 900); c.fillText('✦  SHOUTOUT WALL  ✦', w / 2, h * 0.52);
    c.fillStyle = T.c; c.font = FB(32, 800); c.fillText('Kirim ucapanmu ke layar ini 💌', w / 2, h * 0.67);
    c.fillStyle = '#bfb3c9'; c.font = FB(26, 800); c.fillText('👑 VVIP & 💎 VIP gratis tiap hari · tamu lain ' + rupiah(PAKET.layar.harga) + ' / ucapan', w / 2, h * 0.79, w - 120);
    return;
  }
  // label atas + lencana
  c.fillStyle = T.c; c.font = FB(30, 900); c.fillText('✦  SPECIAL MESSAGE  ✦', w / 2, 82);
  const lc = LENCANA[u.via] || LENCANA.bayar; c.font = FB(26, 900); const lw = c.measureText(lc).width + 44;
  c.fillStyle = fg; c.beginPath(); c.roundRect ? c.roundRect(w / 2 - lw / 2, 104, lw, 44, 22) : c.rect(w / 2 - lw / 2, 104, lw, 44); c.fill(); c.fillStyle = '#120a14'; c.fillText(lc, w / 2, 127);
  // untuk siapa
  c.fillStyle = '#d9cfe3'; c.font = FB(30, 800); c.fillText(u.ke ? 'TO' : 'FOR EVERYONE IN', w / 2, 192);
  const ke = u.ke || 'Y.H.A CLUB'; let uk = 104; c.font = FD(uk); while (c.measureText(ke).width > w - 160 && uk > 50) { uk -= 6; c.font = FD(uk); }
  const pulsa = 0.85 + 0.15 * Math.sin(t * 3); c.shadowColor = T.g; c.shadowBlur = 36 * pulsa; c.fillStyle = fg; c.fillText(ke, w / 2, 262);
  // pesan
  c.shadowBlur = 16; c.shadowColor = T.g; c.fillStyle = '#ffffff'; let pk = 46; c.font = FB(pk, 900);
  let bs = bungkus(c, `“${u.m}”`, w - 200, 3); while (bs.length > 2 && pk > 34) { pk -= 4; c.font = FB(pk, 900); bs = bungkus(c, `“${u.m}”`, w - 200, 3); }
  bs.forEach((b, i) => c.fillText(b, w / 2, 368 + (i - (bs.length - 1) / 2) * (pk + 12)));
  // dari siapa
  c.shadowBlur = 0; c.fillStyle = T.c; c.font = FB(34, 900); c.fillText('— from ' + (u.n || 'Seseorang 🤫') + ' —', w / 2, h - 118, w - 160);
  c.fillStyle = '#8f8499'; c.font = FD(30); c.fillText('Y.H.A CLUB', w / 2, h - 66);
}
// banner mewah di layar tamu saat ucapan baru tayang (hanya yang berada di dalam / dekat club)
function bannerUcapan(u) {
  if (!K.saya || !dekat()) return;
  let b = document.getElementById('clubBanner');
  if (!b) {
    b = document.createElement('div'); b.id = 'clubBanner';
    b.innerHTML = '<style>#clubBanner{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:60;min-width:260px;max-width:min(92vw,520px);background:#07040a;border:3px solid #f7d774;border-radius:16px;padding:10px 16px;color:#fff;text-align:center;font:800 14px Nunito,sans-serif;box-shadow:0 0 28px #ffb30088;transition:opacity .4s}#clubBanner[hidden]{display:none}#clubBanner b{display:block;font:400 22px Fredoka,Nunito,sans-serif;color:#f7d774;margin:2px 0}#clubBanner small{color:#cbbfd6}</style><div id="cbI"></div>';
    document.body.append(b);
  }
  const T = TEMA[u.tema] || TEMA.emas; b.style.borderColor = T.a; b.style.boxShadow = `0 0 28px ${T.g}99`;
  b.querySelector('#cbI').innerHTML = `<small>💌 Ucapan baru di layar Y.H.A Club</small><b style="color:${T.a}">${esc(u.ke ? 'To: ' + u.ke : 'Untuk semua')}</b>“${esc(u.m)}”<br><small>— ${esc(u.n || 'Seseorang')}</small>`;
  b.hidden = false; b.style.opacity = 1; Musik.sfx('hadiah');
  clearTimeout(bannerUcapan.t); bannerUcapan.t = setTimeout(() => { b.style.opacity = 0; setTimeout(() => { b.hidden = true; }, 450); }, 6500);
}

// formulir kirim ucapan: Direktur bebas · VIP/VVIP kuota harian · tamu biasa bayar
const kunciKuota = () => 'clubLayarKuota/' + K.L.uid;   // {n, t0}: kuota jendela 24 jam
async function bukaUcapan() {
  const L = K.L; if (!L) return;
  if (!K.resmi || !K.resmi()) { K.bukaDaftar && K.bukaDaftar(); return; }
  const dir = K.peran[L.uid] === 'direktur', tk = Prog.tingkat(L.uid), P = PAKET.layar;
  const batas = tk === 'vvip' ? P.kuotaVvip : tk === 'vip' ? P.kuotaVip : 0;
  const q = batas ? await L.db.get(kunciKuota()).catch(() => null) : null, kad = !q || !q.t0 || L.db.now() - q.t0 >= 864e5;
  const pakai = kad ? 0 : (q.n || 0), sisa = Math.max(0, batas - pakai);
  let tema = 'emas';
  ST.formUcapan = true;
  bukaKartu(`<h2>💌 Layar Ucapan · Y.H.A Club</h2>
    <p class="kecil">Ucapanmu tayang di layar raksasa club, gaya shoutout club mewah. ${dir ? '<b>👑 Direktur: tanpa batas.</b>' : batas ? `<b>${tk === 'vvip' ? '👑 VVIP' : '💎 VIP'}: sisa kuota gratis (per 24 jam) ${sisa}/${batas}.</b>` : `Tamu biasa: <b>${rupiah(P.harga)} per ucapan</b> (VIP & VVIP gratis tiap hari).`}</p>
    <canvas id="ucPrev" width="640" height="320" style="width:100%;border-radius:12px;display:block;background:#000"></canvas>
    <label for="ucKe">Untuk (opsional)</label><input id="ucKe" maxlength="${P.maksUntuk}" placeholder="contoh: Rina, geng Pejuang Jomblo, semua yang jomblo">
    <label for="ucM">Pesan</label><textarea id="ucM" maxlength="${P.maksPesan}" rows="2" placeholder="contoh: Happy birthday bestie! Semoga cepet ketemu jodoh 🎂💖"></textarea>
    <label>Tema</label><div class="sw teks" id="ucT">${Object.entries(TEMA).map(([k, v]) => `<button type="button" data-t="${k}" class="${k === tema ? 'on' : ''}">${v.nama}</button>`).join('')}</div>
    <label class="cek"><input type="checkbox" id="ucN" checked> Tampilkan namaku (kalau tidak, tampil sebagai "Seseorang 🤫")</label>
    <p class="err" id="ucE"></p>
    <div class="baris">${dir ? '<button class="btn" type="button" id="ucKirim">🪩 Tayangkan sekarang</button>' : sisa ? `<button class="btn" type="button" id="ucKirim">${tk === 'vvip' ? '👑' : '💎'} Kirim gratis (${sisa}/${batas})</button>` : ''}${dir ? '' : `<button class="btn ${sisa ? 'putih' : ''}" type="button" id="ucBayar">💳 Kirim · ${rupiah(P.harga)}</button>`}</div>
    <h3 style="margin-top:12px">🕘 Ucapan terbaru</h3><div class="daftar" id="ucDaftar"></div>`, {
    tutup() { ST.formUcapan = false; clearInterval(ST.prevT); },
    pasang(el) {
      const isi = () => ({ ke: bersih(el.querySelector('#ucKe').value, P.maksUntuk), m: sensor(bersih(el.querySelector('#ucM').value, P.maksPesan)), tema, tampil: el.querySelector('#ucN').checked });
      const cv = el.querySelector('#ucPrev'), cx = cv.getContext('2d');
      const prev = () => { const d = isi(); cx.save(); cx.scale(0.5, 0.5); gambarUcapan(cx, 1280, 640, { ke: d.ke, m: d.m || 'Tulis pesanmu di bawah ✍️', tema, n: d.tampil ? (K.prof?.n || 'Kamu') : 'Seseorang 🤫', via: dir ? 'dir' : batas ? tk : 'bayar' }); cx.restore(); };
      prev(); clearInterval(ST.prevT); ST.prevT = setInterval(prev, 120);
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tema = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); });
      const cek = () => { const d = isi(), E = el.querySelector('#ucE'); if (d.m.length < 3) { E.textContent = 'Tulis pesan minimal 3 huruf ya.'; return null; } if (kasar(el.querySelector('#ucM').value) || kasar(d.ke)) { E.textContent = 'Pakai kata-kata yang lebih sopan ya 🙏'; return null; } E.textContent = ''; return d; };
      const kirim = el.querySelector('#ucKirim');
      if (kirim) kirim.onclick = async () => {
        const d = cek(); if (!d) return; kirim.disabled = true;
        const data = { uid: L.uid, n: d.tampil ? bersih(K.prof?.n || 'Tamu', 20) : 'Seseorang 🤫', ke: d.ke, m: d.m, tema: d.tema, via: dir ? 'dir' : tk, h: hariIni(), t: TS };
        try {
          const k = L.db.kunci('clubLayar');
          await L.db.update('', dir ? { ['clubLayar/' + k]: data } : { ['clubLayar/' + k]: data, [kunciKuota()]: kad ? { n: 1, t0: TS } : { n: pakai + 1, t0: q.t0 } });
          tutupKartu(); toast('🪩 Ucapanmu tayang di layar Y.H.A Club!', 3500);
        } catch (e) { kirim.disabled = false; el.querySelector('#ucE').textContent = 'Gagal mengirim. Kuota mungkin sudah habis, coba kirim berbayar.'; }
      };
      const by = el.querySelector('#ucBayar');
      if (by) by.onclick = () => { const d = cek(); if (!d) return; tutupKartu(); Bayar.bukaBayar({ jenis: 'layar', paket: 'layar', nama: 'Ucapan di Layar Y.H.A Club', harga: P.harga, pesan: d.m, ke: d.ke, tema: d.tema, tampil: d.tampil, nt: bersih(K.prof?.n || 'Tamu', 20) }); };
      segarDaftarUcapan();
    },
  });
}
function segarDaftarUcapan() {
  const el = document.querySelector('#kartu #ucDaftar'); if (!el) return;
  const staf = K.L && K.peran[K.L.uid];
  el.innerHTML = ST.ucapan.length ? ST.ucapan.slice(0, 10).map(u => `<div><span><b>${esc(u.ke || 'Untuk semua')}</b> · “${esc(u.m)}”<br><small>${esc(LENCANA[u.via] || '💌')} · ${esc(u.n || '')} · ${esc(jam(u.t))}</small></span>${staf ? `<button type="button" class="mini putih" data-hu="${esc(u.k)}" aria-label="Hapus ucapan">✕</button>` : ''}</div>`).join('') : '<p class="kecil">Belum ada ucapan. Jadi yang pertama!</p>';
  el.querySelectorAll('[data-hu]').forEach(b => b.onclick = () => { if (confirm('Hapus ucapan ini dari layar?')) K.L.db.set('clubLayar/' + b.dataset.hu, null).then(() => toast('Ucapan dihapus.')); });
}
export const bukaLayarUcapan = () => bukaUcapan();
