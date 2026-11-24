// Utilitas bersama untuk semua halaman.
export const CFG = Object.assign({
  namaPT: 'PT Mencari Cinta Sejati', singkatan: 'PT MCS', instagram: '', donasi: '',
  kuota: 10000, firebase: null, mading: [],
}, window.PT_CONFIG || {});

// Tujuan tamu datang ke kantor
export const TUJUAN = {
  jodoh: { ikon: '💘', nama: 'Cari Jodoh', warna: '#ff4f7b' },
  teman: { ikon: '🤝', nama: 'Cari Teman', warna: '#3a8fd8' },
  curhat: { ikon: '💬', nama: 'Mau Curhat', warna: '#2f9e6e' },
};
export const tujuanAman = t => (TUJUAN[t] ? t : 'teman');

// Meja nongkrong per topik (area tengah kantor)
export const TOPIK = ['🎮 Gaming', '🎵 Musik', '🎬 Drakor & Film', '⚽ Olahraga', '🍜 Kuliner', '📚 Buku & Nulis', '✈️ Jalan-jalan', '🐱 Random'];

export const GENDER = { '': 'Rahasia', co: 'Cowok', ce: 'Cewek' };

export const STATUS = ['Jomblo', 'Lagi PDKT', 'Digantung', 'Baru Putus', 'Rahasia'];

// localStorage yang aman (tidak error di mode privat)
export const LS = {
  get(k, d = null) { try { const v = localStorage.getItem('ptmcs_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ptmcs_' + k, JSON.stringify(v)); } catch (e) {} },
};

const KASAR = ['anjing','anjg','anjir','babi','kontol','kntl','memek','mmk','ngentot','ngewe','bangsat','bajingan',
  'goblok','goblog','tolol','kampret','jancok','jancuk','pepek','lonte','pelacur','fuck','shit','bitch','asu','tai','titit'];

const norm = s => s.toLowerCase().replace(/[0@]/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/[^a-z]/g, '');

export function kasar(s) {
  const n = norm(s || '');
  return KASAR.some(w => w.length > 3 ? n.includes(w) : new RegExp('(^|[^a-z])' + w + '([^a-z]|$)').test((s || '').toLowerCase()));
}

// Ganti kata kasar dengan ♥♥♥
export function sensor(s) {
  return (s || '').replace(/\S+/g, w => kasar(w) ? '♥'.repeat(Math.min(w.length, 5)) : w);
}

export const bersih = (s, max) => (s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
export const igBersih = s => (s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);

export function hash(s) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode('ptmcs:' + s)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

export const fmt = n => Number(n || 0).toLocaleString('id-ID');

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Profil karyawan yang tersimpan di browser ini
export function profil() { return LS.get('profil', null); }
export function simpanProfil(p) { LS.set('profil', p); }

// Jam Jakarta (0–24, desimal)
export function jamJakarta() {
  const d = new Date();
  return ((d.getUTCHours() + 7) % 24) + d.getUTCMinutes() / 60;
}

// ---------------------------------------------------------------- LEVEL & EXP
const AMBANG = [0, 40, 100, 200, 350, 550, 800, 1100, 1500, 2000];
export function levelDari(exp) {
  exp = Math.max(0, exp || 0);
  let lv = 1;
  for (let i = 0; i < AMBANG.length; i++) if (exp >= AMBANG[i]) lv = i + 1;
  if (exp >= AMBANG[AMBANG.length - 1]) lv = AMBANG.length + Math.floor((exp - AMBANG[AMBANG.length - 1]) / 600);
  return lv;
}
export function ambangLevel(lv) { return lv <= AMBANG.length ? AMBANG[lv - 1] : AMBANG[AMBANG.length - 1] + (lv - AMBANG.length) * 600; }

// Tanggal hari ini di WIB, contoh "20261124" (untuk tugas harian & peringkat)
export function hariIni() {
  const d = new Date(Date.now() + 7 * 3600e3);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
}

// Ruangan kantor: posisi tujuan + area (untuk acara & tugas kunjungan)
export const LOKASI = {
  lobi: { nama: '🚪 Lobi', x: 0, z: 17, r: Math.PI, area: [-14, 10, 14, 20] },
  kafe: { nama: '💘 Kafe Jodoh', x: 19.5, z: 2.5, r: Math.PI / 2, area: [14, -7, 24, 12] },
  meja: { nama: '🤝 Meja Nongkrong', x: 0, z: 1.5, r: Math.PI, area: [-15, -7, 14, 10] },
  taman: { nama: '💬 Taman Curhat', x: 18.5, z: -9.2, r: Math.PI, area: [14, -20, 24, -7] },
  rapat: { nama: '📋 Ruang Rapat', x: -12, z: -10, r: -Math.PI / 2 - 0.4, area: [-24, -20, -8, -7] },
  bukutamu: { nama: '📖 Buku Tamu', x: 3, z: -14.5, r: Math.PI, area: [-8, -20, 14, -7] },
  loker: { nama: '👔 Ruang Loker', x: -19, z: 7.5, r: -Math.PI / 2, area: [-24, 0, -15, 10] },
  direktur: { nama: '👑 Ruang Direktur', x: 16.8, z: 16, r: Math.PI / 2, area: [14, 12, 24, 20] },
  halaman: { nama: '🌳 Halaman', x: 0, z: 30, r: Math.PI, area: [-40, 20, 40, 50] },
  lounge: { nama: '💎 Lounge Eksekutif', x: 0, z: -62.5, r: Math.PI, area: [-12, -70, 12, -54], vip: true },
};
export function lokasiDi(x, z) {
  for (const [k, l] of Object.entries(LOKASI)) { const [x1, z1, x2, z2] = l.area; if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return k; }
  return '';
}

// Barang yang terbuka sesuai level (lv) atau khusus Kartu Eksekutif (vip)
export const OUTFIT = [
  { nama: 'Kemeja', lv: 1 }, { nama: 'Hoodie', lv: 2 }, { nama: 'Jaket Denim', lv: 3 }, { nama: 'Jas & Dasi', lv: 4 },
  { nama: 'Gaun Pesta', lv: 5 }, { nama: 'Jaket Kulit', lv: 6 }, { nama: 'Setelan Emas', vip: true },
];
export const AKSESORIS = [
  { nama: 'tidak ada', lv: 1 }, { nama: 'kacamata', lv: 1 }, { nama: 'topi', lv: 1 }, { nama: 'pita', lv: 1 }, { nama: 'headset', lv: 1 },
  { nama: 'kacamata hitam', lv: 2 }, { nama: 'bando kucing', lv: 3 }, { nama: 'mahkota bunga', lv: 5 }, { nama: 'sayap cupid', lv: 7 },
  { nama: 'aura hati', lv: 9 }, { nama: 'mahkota emas', vip: true }, { nama: 'halo', vip: true },
];
export const kodeTamu = uid => 'MCS-' + String(uid).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
