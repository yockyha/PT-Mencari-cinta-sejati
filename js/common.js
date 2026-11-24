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
