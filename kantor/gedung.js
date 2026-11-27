// =====================================================================
//  GEDUNG BARU di sekitar kantor (bisa ditambah terus).
//  Tiap gedung punya jadwal: sebelum `selesai` tampil sebagai proyek
//  pembangunan (pagar seng, crane, perancah, papan hitung mundur) dan
//  bangunannya "naik" pelan-pelan sesuai progres. Setelah `selesai`
//  semua fasilitas terbuka otomatis untuk semua tamu.
//
//  Menambah gedung baru: tambahkan satu objek di daftar GEDUNG di bawah
//  (id, nama, jadwal, area, fungsi bangun) dan satu lokasi di LOKASI
//  (js/common.js) bila perlu tombol pintasan.
//  Direktur bisa membuka lebih cepat / mengikuti jadwal lewat papan proyek.
// =====================================================================
import { esc } from '../js/common.js?v=202611270848';
import { K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611270848';
import * as Musik from './musik.js?v=202611270848';

export const GEDUNG = [
  {
    id: 'tamanCinta', nama: '🎡 Taman Cinta', ikon: '🎡',
    mulai: '2026-11-26T14:30:00+07:00', selesai: '2026-11-28T14:30:00+07:00',
    area: [-80, -26, -32, 26],                       // x1, z1, x2, z2
    gerbang: { x: -31.2, z: 22 },                     // titik masuk (sisi timur)
    fasilitas: ['⛲ Air mancur harapan', '🎬 Bioskop Cinta', '🎡 Bianglala', '🍦 Kedai es krim & 🍿 popcorn', '🪑 Taman duduk & lampu taman'],
    bangun: bangunTamanCinta,
  },
];

let D = null;                 // dependensi dari kantor.js
const aktif = [];             // { def, jadi: Group, proyek: Group, pagar: [], status, ... }
const t0 = s => new Date(s).getTime();
export const progres = def => {
  const o = K.setelan && K.setelan['gedung_' + def.id];
  if (o === 'buka') return 1;
  return Math.max(0, Math.min(1, (Date.now() - t0(def.mulai)) / (t0(def.selesai) - t0(def.mulai))));
};
export const sudahBuka = id => { const g = GEDUNG.find(x => x.id === id); return !g || progres(g) >= 1; };
const sisaTeks = ms => {
  if (ms <= 0) return 'sebentar lagi';
  const h = Math.floor(ms / 86400e3), j = Math.floor(ms % 86400e3 / 3600e3), m = Math.floor(ms % 3600e3 / 60e3), d = Math.floor(ms % 60e3 / 1000);
  return (h ? h + ' hari ' : '') + String(j).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(d).padStart(2, '0');
};
const sisa = def => (K.setelan && K.setelan['gedung_' + def.id] === 'buka' ? 0 : Math.max(0, t0(def.selesai) - Date.now()));

// ---------------------------------------------------------------- PASANG SEMUA GEDUNG
export function pasang(dep) {
  D = dep;
  for (const def of GEDUNG) {
    const g = { def, jadi: new D.THREE.Group(), proyek: new D.THREE.Group(), naik: [], tampilJadi: [], tabJadi: [], aksi: [], anim: [], buka: null };
    D.scene.add(g.jadi); D.scene.add(g.proyek);
    def.bangun(g);
    bangunProyek(g);
    aktif.push(g);
    terapkan(g, true);
  }
}

// helper bangun (mesh masuk ke grup tertentu)
function kotakKe(grup, w, h, d, x, y, z, warna, { tab = null, mat = null } = {}) {
  const m = new D.THREE.Mesh(D.GEO, mat || D.M(warna)); m.scale.set(w, h, d); m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true; grup.add(m);
  if (tab) { const b = { x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, _asli: null }; b._asli = { ...b }; tab.push(b); D.tabrak.push(b); }
  return m;
}
function papan(grup, lebar, tinggi, kv, x, y, z, rotY = 0) {
  const m = new D.THREE.Mesh(new D.THREE.PlaneGeometry(lebar, tinggi), new D.THREE.MeshBasicMaterial({ map: kv.t, toneMapped: false, side: D.THREE.DoubleSide }));
  m.position.set(x, y, z); m.rotation.y = rotY; grup.add(m); return m;
}
const nonaktifkan = (b, mati) => { if (mati) { b.x1 = b.x2 = 9999; } else Object.assign(b, b._asli); };

// sembunyikan / tampilkan sesuai progres
function terapkan(g, awal = false) {
  const p = progres(g.def), buka = p >= 1;
  const s = buka ? 1 : Math.max(0.06, 0.12 + p * 0.8);
  for (const n of g.naik) { n.m.scale.y = n.penuh * s; if (!n.grup) n.m.position.y = n.dasar + n.penuh * s / 2; }
  for (const m of g.tampilJadi) m.visible = buka;
  for (const b of g.tabJadi) nonaktifkan(b, false);
  g.proyek.visible = !buka;
  for (const b of g.tabPagar || []) nonaktifkan(b, buka);
  if (g.buka === false && buka && !awal) { toast(`🎉 ${g.def.nama} resmi dibuka! Yuk main ke sana 🥳`, 6500); K.efekLokal && K.efekLokal('kembangapi', 60); }
  g.buka = buka;
}

// ---------------------------------------------------------------- TIAP FRAME
let cekT = 0;
export function update(dt, t, saya) {
  if (!D) return;
  if (t - cekT > 1000) { cekT = t; for (const g of aktif) { terapkan(g); if (g.papanKv && Math.hypot(saya.x - g.def.gerbang.x, saya.z - g.def.gerbang.z) < 45) g.papanKv.ulang(); } }
  for (const g of aktif) {
    const [x1, z1, x2, z2] = g.def.area, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    if (Math.hypot(saya.x - cx, saya.z - cz) > 90) continue;
    for (const f of g.anim) f(dt, t, g.buka);
  }
}
// titik aksi yang hanya aktif saat gedung sudah buka
const aksiBuka = (g, a) => D.titikAksi.push({ ...a, syarat: () => g.buka && (!a.syarat || a.syarat()) });

// ---------------------------------------------------------------- PROYEK PEMBANGUNAN (umum untuk semua gedung)
function bangunProyek(g) {
  const { def } = g, P = g.proyek, [x1, z1, x2, z2] = def.area;
  g.tabPagar = [];
  // pagar seng keliling dengan gambar proyek
  const seng = D.kanvas(512, 200, (c, w, h) => {
    c.fillStyle = '#2a6fb5'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd23f'; for (let i = -2; i < 12; i++) { c.beginPath(); c.moveTo(i * 60, h); c.lineTo(i * 60 + 30, h); c.lineTo(i * 60 + 70, h - 26); c.lineTo(i * 60 + 40, h - 26); c.fill(); }
    c.fillStyle = '#fff'; c.font = D.FD(40); c.textAlign = 'center'; c.fillText('🏗️ SEDANG DIBANGUN', w / 2, 72);
    c.font = D.FB(26, 900); c.fillText(def.nama.toUpperCase() + ' · PT MCS', w / 2, 118, w - 20);
  });
  const tinggi = 2.2, sisi = [[x1, z1, x2, z1], [x1, z2, x2, z2], [x1, z1, x1, z2], [x2, z1, x2, z2]];
  for (const [ax, az, bx, bz] of sisi) {
    const pjg = Math.hypot(bx - ax, bz - az), arahX = ax !== bx, n = Math.ceil(pjg / 5.5);
    for (let i = 0; i < n; i++) {
      const s = pjg / n, c = -pjg / 2 + s * (i + 0.5);
      const x = arahX ? (ax + bx) / 2 + c : ax, z = arahX ? az : (az + bz) / 2 + c;
      kotakKe(P, arahX ? s : 0.1, tinggi, arahX ? 0.1 : s, x, 0, z, '#2a6fb5', { tab: g.tabPagar });
      papan(P, s - 0.15, tinggi - 0.2, seng, x + (arahX ? 0 : (ax === x2 ? 0.07 : -0.07)), tinggi / 2, z + (arahX ? (az === z2 ? 0.07 : -0.07) : 0), arahX ? 0 : Math.PI / 2);
    }
  }
  // papan hitung mundur besar di gerbang
  const { x: gx, z: gz } = def.gerbang;
  for (const dz of [-1.8, 1.8]) kotakKe(P, 0.2, 4.6, 0.2, gx + 0.4, 0, gz + dz, '#5b5f6a');
  g.papanKv = D.kanvas(800, 420, (c, w, h) => {
    const p = progres(def), ms = sisa(def);
    c.fillStyle = '#1b1220'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffd23f'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
    c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.font = D.FD(54); c.fillText('🏗️ ' + def.nama.replace(/^\S+\s/, '').toUpperCase(), w / 2, 72, w - 40);
    c.fillStyle = '#fff'; c.font = D.FB(26, 800); c.fillText(def.fasilitas.slice(0, 3).map(f => f.split(' ').slice(1).join(' ')).join(' · '), w / 2, 116, w - 40);
    c.fillStyle = '#3a2b40'; D.bulat(c, 60, 160, w - 120, 50, 25); c.fill();
    const gr = c.createLinearGradient(60, 0, w - 60, 0); gr.addColorStop(0, '#ff4f7b'); gr.addColorStop(1, '#ffd23f');
    c.fillStyle = gr; D.bulat(c, 60, 160, Math.max(50, (w - 120) * p), 50, 25); c.fill();
    c.fillStyle = '#fff'; c.font = D.FB(28, 900); c.fillText(Math.floor(p * 100) + '% selesai', w / 2, 195);
    c.fillStyle = '#ffb3c6'; c.font = D.FB(26, 800); c.fillText('DIBUKA DALAM', w / 2, 262);
    c.fillStyle = '#fff'; c.font = D.FD(64); c.fillText(sisaTeks(ms), w / 2, 336);
    c.fillStyle = '#8f7a99'; c.font = D.FB(22, 800); c.fillText('Mohon maaf atas ketidaknyamanannya 🙏 · ketuk papan untuk info', w / 2, 388, w - 40);
  });
  papan(P, 3.4, 1.8, g.papanKv, gx + 0.55, 3.3, gz, Math.PI / 2);
  D.titikAksi.push({ x: gx + 1.4, z: gz, r: 2.6, label: '🏗️ Lihat progres ' + def.nama, aksi: () => bukaProyek(def), syarat: () => !g.buka });
  // crane menara
  const cx = (x1 + x2) / 2 - 6, cz = (z1 + z2) / 2 - 8;
  for (let y = 0; y < 16; y += 2) { kotakKe(P, 0.7, 2, 0.08, cx, y, cz - 0.35, '#ffd23f'); kotakKe(P, 0.7, 2, 0.08, cx, y, cz + 0.35, '#ffd23f'); kotakKe(P, 0.08, 2, 0.7, cx - 0.35, y, cz, '#ffd23f'); kotakKe(P, 0.08, 2, 0.7, cx + 0.35, y, cz, '#ffd23f'); kotakKe(P, 0.7, 0.08, 0.7, cx, y, cz, '#e0b020'); }
  const lengan = new D.THREE.Group(); lengan.position.set(cx, 16, cz); P.add(lengan);
  kotakKe(lengan, 16, 0.5, 0.6, 4, 0, 0, '#ffd23f'); kotakKe(lengan, 3, 1.2, 1.4, -4.2, -0.2, 0, '#5b5f6a'); kotakKe(lengan, 1.2, 1.2, 1.2, 0, 0.5, 0, '#2a6fb5');
  const tali = kotakKe(lengan, 0.04, 6, 0.04, 9, -6, 0, '#333'); const kait = kotakKe(lengan, 0.9, 0.5, 0.9, 9, -6.5, 0, '#c0392b');
  g.anim.push((dt, t, buka) => { if (buka) return; lengan.rotation.y = Math.sin(t / 9000) * 1.4; const k = 5 + Math.sin(t / 2500) * 2; tali.scale.y = k; tali.position.y = -k; kait.position.y = -k - 0.5; });
  // perancah, tumpukan bata, molen, kerucut, lampu kedip
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { kotakKe(P, 0.08, 5.6, 0.08, x1 + 8 + i * 2.2, 0, z1 + 4 + j * 0.01, '#9aa3ad'); }
  for (let y = 1.4; y < 5.6; y += 1.4) kotakKe(P, 7, 0.08, 0.9, x1 + 11.3, y, z1 + 4.4, '#c99a6b');
  for (let i = 0; i < 3; i++) kotakKe(P, 1.2, 0.5 - i * 0.12, 0.8, x2 - 6 + i * 0.1, i * 0.5, z1 + 6, '#c0603a');
  const pasir = new D.THREE.Mesh(new D.THREE.ConeGeometry(1.4, 1.2, 10), D.M('#e2c58f')); pasir.position.set(x2 - 9, 0.6, z1 + 7); P.add(pasir);
  const molen = new D.THREE.Mesh(new D.THREE.CylinderGeometry(0.5, 0.75, 1.5, 12), D.M('#ff8a3d')); molen.rotation.z = Math.PI / 2.6; molen.position.set(x2 - 12, 1.1, z1 + 9); P.add(molen);
  kotakKe(P, 1.4, 0.5, 1.0, x2 - 12, 0, z1 + 9, '#5b5f6a');
  g.anim.push((dt, t, buka) => { if (!buka) molen.rotation.y += dt * 2; });
  for (let i = 0; i < 6; i++) { const k = new D.THREE.Mesh(new D.THREE.ConeGeometry(0.22, 0.6, 8), D.M(i % 2 ? '#ffffff' : '#ff8a3d')); k.position.set(gx + 1.6, 0.3, gz - 3.5 + i * 1.4); P.add(k); }
  const kedip = [];
  for (const dz of [-2.2, 2.2]) { const l = new D.THREE.Mesh(new D.THREE.SphereGeometry(0.16, 8, 6), new D.THREE.MeshBasicMaterial({ color: '#ff9900' })); l.position.set(gx + 0.4, 4.75, gz + dz); P.add(l); kedip.push(l); }
  g.anim.push((dt, t, buka) => { if (!buka) for (const l of kedip) l.visible = Math.sin(t / 250) > 0; });
  // pekerja proyek (berhelm kuning)
  if (D.buatKarakter) {
    const titik = [[x1 + 10, z1 + 6.2, 0], [x2 - 8, z1 + 5, Math.PI], [cx + 3, cz + 4, -Math.PI / 2], [x1 + 14, z2 - 8, Math.PI / 2]];
    titik.forEach(([x, z, r], i) => {
      const ch = D.buatKarakter({ v: 2, s: 'l', k: i % 3, r: i, w: i % 5, at: 'kaos', wa: 6, bw: 'jeans', wb: 0, sp: 'boots' }, { peran: 'karyawan' });
      ch.updateMatrixWorld(true);
      const kp = ch.userData.kepala, kotakKepala = new D.THREE.Box3().setFromObject(kp), tg = kotakKepala.max.y - kp.getWorldPosition(new D.THREE.Vector3()).y;
      const helm = new D.THREE.Mesh(new D.THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), D.M('#ffd23f')); helm.scale.set(1.25, 0.9, 1.25); helm.position.y = tg - 0.06; kp.add(helm);
      ch.position.set(x, 0, z); ch.rotation.y = r; P.add(ch);
      g.anim.push((dt, t, buka) => { if (!buka) D.pose(ch, i % 2 ? 3 : 4, dt); });
    });
  }
}

function bukaProyek(def) {
  const g = aktif.find(x => x.def === def), p = progres(def), dir = K.L && K.peran[K.L.uid] === 'direktur';
  bukaKartu(`<h2>🏗️ ${esc(def.nama)} sedang dibangun</h2>
    <p>Gedung baru PT Mencari Cinta Sejati untuk tempat main semua tamu. Progres <b>${Math.floor(p * 100)}%</b>, dibuka dalam <b>${esc(sisaTeks(sisa(def)))}</b>.</p>
    <p><b>Fasilitas yang akan hadir:</b></p><ul class="manfaat">${def.fasilitas.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    <p class="kecil">Jadwal buka: ${esc(new Date(def.selesai).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }))} WIB. Pantau terus, begitu jadi langsung bisa dimasuki!</p>
    ${dir ? `<div class="baris"><button class="btn" type="button" id="gB">⚡ Buka sekarang (Direktur)</button><button class="btn putih" type="button" id="gJ">↩️ Ikuti jadwal</button></div>` : ''}`, {
    pasang(el) {
      if (!dir) return;
      el.querySelector('#gB').onclick = () => K.L.setelan({ ['gedung_' + def.id]: 'buka' }).then(() => { tutupKartu(); toast('⚡ Pembangunan dipercepat!'); });
      el.querySelector('#gJ').onclick = () => K.L.setelan({ ['gedung_' + def.id]: null }).then(() => { tutupKartu(); toast('Kembali mengikuti jadwal.'); });
    },
  });
  if (g) g.papanKv.ulang();
}
export const lihatProyek = id => { const g = GEDUNG.find(x => x.id === id); if (g) bukaProyek(g); };

// ---------------------------------------------------------------- 🎡 TAMAN CINTA
function bangunTamanCinta(g) {
  const J = g.jadi, { THREE, M } = D, [x1, z1, x2, z2] = g.def.area;
  const tampil = m => { g.tampilJadi.push(m); return m; };
  const naik = (m) => { g.naik.push({ m, penuh: m.scale.y, dasar: m.position.y - m.scale.y / 2, grup: !!m.isGroup }); return m; };
  // lantai plaza & jalan dari kantor
  D.lantai(x1, z1, x2, z2, '#d9e8c4', 0.02);
  D.lantai(x1 + 2, -4, x2 - 2, 12, '#efe3d6', 0.03);
  D.lantai(x2 - 16, 12, x2 - 2, 25, '#efe3d6', 0.03);
  D.lantai(x2, 20, -4, 24, '#e9dccf', 0.025);                 // jalan setapak dari depan kantor
  // gerbang lengkung "TAMAN CINTA"
  const { x: gx, z: gz } = g.def.gerbang;
  for (const dz of [-2.6, 2.6]) kotakKe(J, 0.5, 4.2, 0.5, gx - 0.8, 0, gz + dz, '#d35470', { tab: g.tabJadi });
  tampil(kotakKe(J, 0.6, 0.7, 6, gx - 0.8, 4.2, gz, '#ff4f7b'));
  tampil(papan(J, 5, 0.6, D.kanvas(600, 80, (c, w, h) => { c.fillStyle = '#ff4f7b'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = D.FD(54); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎡 TAMAN CINTA', w / 2, h / 2 + 3, w - 20); }), gx - 0.48, 4.55, gz, Math.PI / 2));

  // ⛲ AIR MANCUR HARAPAN (tengah plaza)
  const fx = -54, fz = 4;
  const kolam = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.2, 0.6, 32), M('#e8e2da')); kolam.position.set(fx, 0.3, fz); J.add(kolam);
  const air = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.1, 32), new THREE.MeshBasicMaterial({ color: 0x5fc3f0, transparent: true, opacity: 0.8 })); air.position.set(fx, 0.62, fz); J.add(tampil(air));
  naik(kotakKe(J, 0.6, 1.6, 0.6, fx, 0, fz, '#e8e2da'));
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 0.3, 24), M('#e8e2da')); t2.position.set(fx, 1.7, fz); J.add(tampil(t2));
  const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.25, 20), M('#e8e2da')); t3.position.set(fx, 2.7, fz); J.add(tampil(t3));
  kotakKe(J, 0.3, 1, 0.3, fx, 1.8, fz, '#e8e2da');
  const hati = D.bentukHati(0.55, '#ff4f7b'); hati.position.set(fx, 3.5, fz); J.add(tampil(hati));
  const tab = { x1: fx - 3.9, x2: fx + 3.9, z1: fz - 3.9, z2: fz + 3.9 }; tab._asli = { ...tab }; D.tabrak.push(tab); g.tabJadi.push(tab);
  const tetes = [], matAir = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.85 }), geoT = new THREE.SphereGeometry(0.07, 6, 4);
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(geoT, matAir); J.add(tampil(m)); tetes.push({ m, f: Math.random(), a: (i / 90) * Math.PI * 2 + Math.random() * 0.2, tier: i % 3 }); }
  let ciprat = 0;
  g.anim.push((dt, t, buka) => {
    if (!buka) return;
    hati.rotation.y += dt; ciprat = Math.max(0, ciprat - dt);
    for (const d of tetes) {
      d.f += dt * (0.55 + ciprat * 0.4); if (d.f > 1) d.f -= 1;
      const R = d.tier === 0 ? 3.2 : d.tier === 1 ? 1.4 : 0.6, y0 = d.tier === 0 ? 3.1 : d.tier === 1 ? 2.75 : 1.85, H = d.tier === 0 ? 1.6 : 0.7;
      d.m.position.set(fx + Math.cos(d.a) * R * d.f, y0 + H * 4 * d.f * (1 - d.f) - (y0 - (d.tier === 0 ? 0.55 : 1.8)) * d.f * d.f, fz + Math.sin(d.a) * R * d.f);
    }
  });
  aksiBuka(g, { x: fx, z: fz + 5.2, r: 2.2, label: '🪙 Lempar koin & buat harapan', aksi: () => bukaHarapan(() => { ciprat = 3; }) });
  aksiBuka(g, { x: fx, z: fz - 5.2, r: 2.0, label: '📸 Foto di air mancur', aksi: () => D.ambilFoto('Foto di Air Mancur Harapan', [fx, fz]) });
  // bangku & lampu taman keliling air mancur
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + Math.PI / 6, bx = fx + Math.cos(a) * 7, bz = fz + Math.sin(a) * 7, r = Math.atan2(fx - bx, fz - bz);
    const bangku = new THREE.Group(); bangku.position.set(bx, 0, bz); bangku.rotation.y = r; J.add(tampil(bangku));
    kotakKe(bangku, 1.8, 0.1, 0.5, 0, 0.42, 0, '#c99a6b'); kotakKe(bangku, 1.8, 0.45, 0.08, 0, 0.5, -0.24, '#c99a6b');
    for (const dx of [-0.75, 0.75]) kotakKe(bangku, 0.08, 0.42, 0.45, dx, 0, 0, '#3a3f4a');
    for (const dx of [-0.45, 0.45]) D.kursi.push({ x: bx + Math.cos(r) * dx, z: bz - Math.sin(r) * dx, r, y: 0.45 });
    const lx = fx + Math.cos(a + 0.5) * 9.5, lz = fz + Math.sin(a + 0.5) * 9.5;
    naik(kotakKe(J, 0.12, 3, 0.12, lx, 0, lz, '#2a1420'));
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff2c4' })); bola.position.set(lx, 3.1, lz); J.add(tampil(bola));
  }
  // taman bunga
  for (const [bx, bz] of [[-40, -14], [-40, 16], [-66, 22], [-46, -22]]) for (let i = 0; i < 10; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshBasicMaterial({ color: ['#ff4f7b', '#ffd23f', '#ff8fab', '#c39bff'][i % 4] }));
    b.position.set(bx + (i % 5) * 0.6 - 1.2, 0.25, bz + Math.floor(i / 5) * 0.6); J.add(tampil(b));
  }

  // 🎬 BIOSKOP CINTA (sisi barat daya)
  const BX1 = -78, BX2 = -62, BZ1 = -24, BZ2 = -6, TB = 4.2;
  const dindingB = (ax, az, bx, bz) => naik(kotakKe(J, Math.abs(bx - ax) || 0.3, TB, Math.abs(bz - az) || 0.3, (ax + bx) / 2, 0, (az + bz) / 2, '#3d2a4f', { tab: g.tabJadi }));
  D.lantai(BX1, BZ1, BX2, BZ2, '#3a1f2e', 0.035);
  dindingB(BX1, BZ1, BX2, BZ1); dindingB(BX1, BZ2, BX2, BZ2); dindingB(BX1, BZ1, BX1, BZ2);
  dindingB(BX2, BZ1, BX2, -16.6); dindingB(BX2, -13.4, BX2, BZ2);  // pintu masuk timur
  tampil(kotakKe(J, 0.5, 1.2, 9, BX2 + 0.3, TB - 0.4, -15, '#ff4f7b'));
  tampil(papan(J, 8.4, 1.0, D.kanvas(800, 96, (c, w, h) => { c.fillStyle = '#1b1220'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23f'; c.font = D.FD(60); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎬 BIOSKOP CINTA', w / 2, h / 2 + 3, w - 30); }), BX2 + 0.58, TB + 0.2, -15, Math.PI / 2));
  // layar (judul Nobar dari Direktur)
  const layar = D.kanvas(800, 400, (c, w, h) => {
    const n = K.setelan && K.setelan.nobar, t = performance.now() / 1000;
    const gr = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.4); gr.addColorStop(0, '#2c2040'); gr.addColorStop(1, '#07060a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.fillStyle = '#ff4f7b'; c.font = D.FD(52); c.fillText('🎬 BIOSKOP CINTA', w / 2, 90);
    c.fillStyle = '#fff'; c.font = D.FB(36, 900); c.fillText(n && n.url ? n.judul : 'Segera tayang: Film pilihan Direktur', w / 2, 200, w - 60);
    c.fillStyle = '#8fd3ff'; c.font = D.FB(26, 800); c.fillText(n && n.url ? 'Ketuk "Nonton film" untuk menonton bareng' : 'Duduk santai dulu, popcorn di depan 🍿', w / 2, 270, w - 60);
    for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,${200 + (i * 3) % 55},120,${0.4 + 0.4 * Math.sin(t * 3 + i)})`; c.beginPath(); c.arc(30 + i * 43, h - 30, 6, 0, 7); c.fill(); }
  });
  tampil(papan(J, 11, 5.5 * 0.5 + 0.6, layar, BX1 + 0.4, 2.3, -15, Math.PI / 2));
  for (let baris = 0; baris < 4; baris++) for (let i = 0; i < 7; i++) {
    const x = BX1 + 6 + baris * 2.2, z = -21 + i * 1.0 + (i >= 4 ? 0.8 : 0);
    const k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = -Math.PI / 2; J.add(tampil(k));
    kotakKe(k, 0.6, 0.42, 0.6, 0, 0, 0, '#c0392b'); kotakKe(k, 0.6, 0.7, 0.14, 0, 0.42, -0.28, '#a52a1e');
    D.kursi.push({ x, z, r: -Math.PI / 2, y: 0.45, syaratDuduk: () => g.buka });
  }
  aksiBuka(g, { x: BX1 + 4, z: -15, r: 2.0, label: '🎬 Nonton film', aksi: () => K.Komunitas && K.Komunitas.bukaNobar ? K.Komunitas.bukaNobar() : toast('Belum ada film diputar.') });
  kotakKe(J, 1.4, 1.0, 0.7, BX2 + 2.2, 0, -19, '#ffd23f', { tab: g.tabJadi }); kotakKe(J, 1.5, 0.12, 0.8, BX2 + 2.2, 1.0, -19, '#c0392b');
  aksiBuka(g, { x: BX2 + 2.2, z: -17.6, r: 1.4, label: '🍿 Beli popcorn', aksi: () => { K.emote && K.emote(4, 5); toast('🍿 Popcorn karamel siap! Selamat menonton 🎬'); } });
  g.anim.push((dt, t, buka) => { if (buka && t - (g.layarT || 0) > 150) { g.layarT = t; layar.ulang(); } });

  // 🎡 BIANGLALA (barat laut)
  const wx = -70, wz = 14, WR = 6.2, WY = 7.4;
  const kaki = new THREE.Group(); kaki.position.set(wx, 0, wz); kaki.rotation.y = Math.PI / 2; J.add(kaki); g.naik.push({ m: kaki, penuh: 1, grup: true });
  for (const dz of [-1.2, 1.2]) for (const s of [-1, 1]) { const b = kotakKe(kaki, 0.3, 8.2, 0.3, s * 1.9, 0, dz, '#f2f2f2'); b.rotation.z = s * 0.24; b.position.x = s * 0.95; }
  const roda = new THREE.Group(); roda.position.set(wx, WY, wz); roda.rotation.y = Math.PI / 2; J.add(tampil(roda)); // menghadap timur (gerbang)
  for (const dz of [-0.9, 0.9]) { const ci = new THREE.Mesh(new THREE.TorusGeometry(WR, 0.12, 8, 48), M('#ff4f7b')); ci.position.z = dz; roda.add(ci); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, j = kotakKe(roda, 0.08, WR, 0.08, 0, 0, 0, '#ffffff'); j.position.set(Math.cos(a) * WR / 2, Math.sin(a) * WR / 2, 0); j.rotation.z = a - Math.PI / 2; }
  const gondola = [];
  for (let i = 0; i < 8; i++) {
    const gd = new THREE.Group(); roda.add(gd);
    kotakKe(gd, 1.1, 0.9, 1.4, 0, -1.0, 0, ['#ffd23f', '#8fd3ff', '#b9f3c9', '#ff8fab'][i % 4]); kotakKe(gd, 1.2, 0.1, 1.5, 0, -0.05, 0, '#2a1420');
    gondola.push({ gd, a: i / 8 * Math.PI * 2 });
  }
  const lampuR = []; for (let i = 0; i < 24; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff2c4' })); roda.add(b); lampuR.push({ b, a: i / 24 * Math.PI * 2 }); }
  g.gondola = gondola;
  let sudut = 0;
  g.anim.push((dt, t, buka) => {
    if (buka) sudut += dt * 0.12;
    for (const o of gondola) o.gd.position.set(Math.cos(o.a + sudut) * WR, Math.sin(o.a + sudut) * WR, 0);
    for (const o of lampuR) { o.b.position.set(Math.cos(o.a + sudut) * WR, Math.sin(o.a + sudut) * WR, 1.0); o.b.material.color.setHSL(((o.a / 6.28) + t / 4000) % 1, 0.8, 0.7); }
  });
  const tb = { x1: wx - 1.6, x2: wx + 1.6, z1: wz - 2.4, z2: wz + 2.4 }; tb._asli = { ...tb }; D.tabrak.push(tb); g.tabJadi.push(tb);
  aksiBuka(g, { x: wx + 4, z: wz, r: 2.4, label: '🎡 Naik bianglala', aksi: () => naikBianglala(g, wx, wz, WY, WR) });
  aksiBuka(g, { x: wx + 7, z: wz + 3, r: 2.0, label: '📸 Foto di bianglala', aksi: () => D.ambilFoto('Foto di Bianglala Taman Cinta', [wx, wz]) });

  // 🍦 KEDAI (sisi utara)
  const kedai = (x, z, nama, warna, aksi) => {
    naik(kotakKe(J, 3, 1.1, 1.4, x, 0, z, '#fff6ef', { tab: g.tabJadi }));
    for (const dx of [-1.4, 1.4]) naik(kotakKe(J, 0.1, 2.6, 0.1, x + dx, 0, z - 0.6, '#2a1420'));
    const atap = tampil(kotakKe(J, 3.4, 0.25, 1.9, x, 2.6, z - 0.2, warna)); atap.rotation.x = -0.15;
    tampil(papan(J, 2.8, 0.45, D.kanvas(400, 64, (c, w, h) => { c.fillStyle = warna; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = D.FD(40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nama, w / 2, h / 2 + 2, w - 16); }), x, 2.25, z + 0.68));
    aksiBuka(g, { x, z: z + 1.6, r: 1.5, label: nama, aksi });
  };
  kedai(-44, 20, '🍦 Es Krim Cinta', '#ff8fab', () => { K.emote && K.emote(4, 5); toast('🍦 ' + ['Es krim stroberi cinta 🍓', 'Es krim cokelat patah hati yang manis lagi 🍫', 'Es krim vanila jodoh 💍'][Math.floor(Math.random() * 3)]); });
  kedai(-50, 20, '🧋 Boba Kasmaran', '#8e5cc9', () => { K.emote && K.emote(4, 5); toast('🧋 Boba brown sugar, manisnya kayak kamu 😉'); });
  kedai(-56, 20, '🌭 Sosis Bakar', '#ff8a3d', () => { K.emote && K.emote(4, 5); toast('🌭 Sosis bakar hangat, cocok buat makan bareng gebetan!'); });
}

function bukaHarapan(cipratkan) {
  bukaKartu(`<h2>🪙 Air Mancur Harapan</h2><p>Lempar koin, lalu tulis harapanmu dalam hati (tidak disimpan & tidak dilihat siapa pun).</p>
    <label for="hpT">Harapanku…</label><input id="hpT" maxlength="80" placeholder="contoh: semoga cepat ketemu jodoh 💍">
    <div class="baris"><button class="btn" type="button" id="hpL">🪙 Lempar koin</button></div>`, {
    pasang(el) {
      el.querySelector('#hpL').onclick = () => {
        tutupKartu(); cipratkan(); Musik.sfx('koin'); K.emote && K.emote(5, 1.6);
        setTimeout(() => toast(['✨ Koin masuk tepat di tengah! Harapanmu tercatat oleh semesta 💖', '✨ Plung! Semoga harapanmu segera terkabul 🌟', '✨ Air mancur berkilau. Pertanda baik! 💫'][Math.floor(Math.random() * 3)], 4200), 700);
        K.efekLokal && K.efekLokal('hati', 20);
      };
    },
  });
}

// naik bianglala: kamera ikut gondola selama satu putaran singkat
function naikBianglala(g, wx, wz, WY, WR) {
  if (D.naik && D.naik()) return;
  toast('🎡 Naik bianglala! Nikmati pemandangan kantor dari atas (gerak untuk turun).', 4200);
  // naik gondola yang paling bawah, ikut berputar satu putaran penuh
  const v = new D.THREE.Vector3();
  const pilih = g.gondola.reduce((a, o) => (o.gd.getWorldPosition(v).y < a.y ? { o, y: v.y } : a), { o: null, y: 1e9 }).o;
  D.mulaiNaik({ cx: wx, cz: wz, lama: 52, pos: () => pilih.gd.getWorldPosition(new D.THREE.Vector3()) });
}
