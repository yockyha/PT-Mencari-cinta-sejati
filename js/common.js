// Utilitas bersama untuk semua halaman.
import PAKET from '../paket.js?v=202611270821';
export { TINGKAT_DONASI, tingkatDonasi, ucapanDonasi, namaPapan } from '../paket.js?v=202611270821';
import { PAKAIAN, SLOT } from './pakaian.js?v=202611270821';
export const CFG = Object.assign({
  namaPT: 'PT Mencari Cinta Sejati', singkatan: 'PT MCS', instagram: '', instagramNama: '', tiktok: '', wajibFollow: null,
  kuota: 10000, firebase: null, mading: [], domainLogin: 'ptmcs.id', direkturDemo: null,
  pendaftaran: { umurMin: 18, umurMinJodoh: 18 }, toko: { paket: [] },
  pembayaran: { qris: '', bank: [], kodeUnik: true }, diamond: { paket: [] }, donasi: { min: 5000, saran: [] },
}, window.PT_CONFIG || {});
// Harga paket selalu dari paket.js (sama dengan yang dipakai server pembayaran)
CFG.diamond = { paket: PAKET.diamond };
CFG.donasi = PAKET.donasi;
CFG.toko = { ...(CFG.toko || {}), paket: PAKET.toko };
export const LANGGANAN = PAKET.langganan;
export { PAKET };

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
// Format username: Instagram 1–30 (huruf kecil, angka, titik, garis bawah; tanpa titik di awal/akhir & titik ganda),
// TikTok 2–24 (huruf, angka, titik, garis bawah; tidak diakhiri titik)
export const igSah = u => /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$/.test(u || '') && !/^[0-9._]+$/.test(u);
export const ttBersih = s => (s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 24);
export const ttSah = u => /^(?!.*\.$)[a-z0-9._]{2,24}$/.test(u || '') && !/^[0-9._]+$/.test(u);
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
// Profil disimpan terpisah untuk mode tamu & mode Direktur (satu browser bisa dipakai keduanya)
const kunciProfil = () => (LS.get('modeKantor') === 'direktur' ? 'profilDir' : 'profil');
export function profil() { return LS.get(kunciProfil(), null); }
export function simpanProfil(p) { LS.set(kunciProfil(), p); }

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
  direktur: { nama: '👑 Ruang Direktur', x: 16.8, z: 16, r: Math.PI / 2, area: [14, 12, 34, 20] }, // suite: lounge tamu, kantor, kamar
  halaman: { nama: '🌳 Halaman', x: 0, z: 30, r: Math.PI, area: [-40, 20, 40, 50] },
  plaza: { nama: '🎡 Taman Cinta', x: -30.2, z: 22, r: -Math.PI / 2, area: [-80, -26, -32, 26], gedung: 'tamanCinta' },
  lounge: { nama: '💎 Lounge Eksekutif', x: 0, z: -62.5, r: Math.PI, area: [-12, -70, 12, -54], vip: true },
};
export function lokasiDi(x, z) {
  for (const [k, l] of Object.entries(LOKASI)) { const [x1, z1, x2, z2] = l.area; if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return k; }
  return '';
}

// Barang yang terbuka sesuai level (lv) atau khusus Kartu Eksekutif (vip)
// Pakaian & aksesoris ada di js/pakaian.js. Barang Diamond (id = kunci katalog & daftar milik):
export const BARANG_DIAMOND = PAKAIAN.filter(x => x.dm).map(x => ({ id: x.id, nama: x.nama, harga: x.dm, jenis: SLOT[x.slot].nama }));
export const rupiah = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export const IKON_DM = '💠';
export const kodeTamu = uid => 'MCS-' + String(uid).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();

// Username dashboard → email Firebase (yocky → yocky@ptmcs.id)
export const emailDari = u => { u = String(u || '').trim().toLowerCase(); return u.includes('@') ? u : `${u}@${CFG.domainLogin || 'ptmcs.id'}`; };
