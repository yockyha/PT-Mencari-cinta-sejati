// =====================================================================
//  Katalog pakaian & aksesoris (Ruang Loker).
//  Penampilan (look) v2: { v:2, s:'l'|'p', k, r, w, at, wa, bw, wb, sp, kp, mt, tl, lh, tg, ef }
//   s  = model tubuh (l laki-laki, p perempuan); k/r/w = kulit, gaya & warna rambut (indeks)
//   at/bw/sp = id atasan, bawahan, sepatu; wa/wb = indeks warna atasan & bawahan
//   kp/mt/tl/lh/tg/ef = id aksesoris kepala, mata, telinga, leher, tangan, efek ('' = tidak pakai)
//  Syarat barang: lv (level), vip (Kartu Eksekutif), dm (harga Diamond; id = kunci katalog),
//  khusus ('staf' | 'direktur' | 'npc') = seragam yang tidak bisa dipakai tamu.
//  gacha = edisi Amplop Cinta (hanya dari amplop). season = hadiah Season Pass Premium.
//  g: 'u' semua, 'l' laki-laki, 'p' perempuan.
// =====================================================================
export const SLOT = {
  at: { nama: 'Atasan', ikon: '👕' }, bw: { nama: 'Bawahan', ikon: '👖' }, sp: { nama: 'Sepatu', ikon: '👟' },
  kp: { nama: 'Kepala', ikon: '🎩' }, mt: { nama: 'Mata', ikon: '👓' }, tl: { nama: 'Telinga', ikon: '💎' },
  lh: { nama: 'Leher', ikon: '📿' }, tg: { nama: 'Tangan', ikon: '⌚' }, ef: { nama: 'Efek', ikon: '✨' }, pt: { nama: 'Hewan peliharaan', ikon: '🐾' },
};
export const SLOT_AKS = ['kp', 'mt', 'tl', 'lh', 'tg', 'ef', 'pt'];
export const WARNA_BAJU = ['#ff4f7b', '#ffffff', '#3a6ea5', '#2f9e6e', '#f2b33d', '#8e5cc9', '#2b2d42', '#ff8fab', '#c0392b', '#8fd3ff', '#b9f3c9', '#e8d5b5'];
export const WARNA_CELANA = ['#2b2d42', '#4a4e69', '#6b4f3a', '#1d3557', '#cfc6b8', '#3a6ea5', '#7a7f8a', '#ff8fab', '#ffffff', '#2f6e4e'];
export const KULIT = ['#f6d2b8', '#e8b48f', '#c98e62', '#a36a43', '#6f4428'];
export const RAMBUT = ['Pendek', 'Panjang', 'Kuncir', 'Botak', 'Keriting', 'Cepol', 'Poni', 'Spike'];
export const WARNA_RAMBUT = ['#1b1b1b', '#4a2f1f', '#8a5a2b', '#d9a441', '#c0392b', '#ff8fab', '#8e5cc9', '#c8ccd2'];

const B = (id, nama, slot, jenis, g, syarat = {}, x = {}) => ({ id, nama, slot, jenis, g, ...syarat, ...x });
export const PAKAIAN = [
  // ---------------- ATASAN
  B('kaos', 'Kaos Polos', 'at', 'Kaos', 'u', { lv: 1 }, { warna: true }),
  B('kaosGaris', 'Kaos Garis', 'at', 'Kaos', 'u', { lv: 1 }, { warna: true }),
  B('kaosHati', 'Kaos Sablon Hati', 'at', 'Kaos', 'u', { lv: 2 }, { warna: true }),
  B('crop', 'Crop Top', 'at', 'Kaos', 'p', { lv: 2 }, { warna: true }),
  B('kaosOversize', 'Kaos Oversize', 'at', 'Kaos', 'u', { lv: 3 }, { warna: true }),
  B('polo', 'Kaos Polo', 'at', 'Kaos', 'l', { lv: 2 }, { warna: true }),
  B('kemeja', 'Kemeja', 'at', 'Kemeja & Blus', 'u', { lv: 1 }, { warna: true }),
  B('blus', 'Blus', 'at', 'Kemeja & Blus', 'p', { lv: 1 }, { warna: true }),
  B('flanel', 'Kemeja Flanel', 'at', 'Kemeja & Blus', 'u', { lv: 2 }, { warna: true }),
  B('blusPita', 'Blus Pita', 'at', 'Kemeja & Blus', 'p', { lv: 3 }, { warna: true }),
  B('batik', 'Kemeja Batik', 'at', 'Kemeja & Blus', 'l', { lv: 4 }, { warna: true }),
  B('hoodie', 'Hoodie', 'at', 'Hoodie & Sweater', 'u', { lv: 2 }, { warna: true }),
  B('sweater', 'Sweater Rajut', 'at', 'Hoodie & Sweater', 'u', { lv: 3 }, { warna: true }),
  B('kardigan', 'Kardigan', 'at', 'Hoodie & Sweater', 'p', { lv: 3 }, { warna: true }),
  B('o8', 'Hoodie Hati', 'at', 'Hoodie & Sweater', 'u', { dm: 80 }),
  B('denim', 'Jaket Denim', 'at', 'Jaket', 'u', { lv: 3 }),
  B('bomber', 'Jaket Bomber', 'at', 'Jaket', 'u', { lv: 5 }, { warna: true }),
  B('kulit', 'Jaket Kulit', 'at', 'Jaket', 'u', { lv: 6 }),
  B('o9', 'Jaket Varsity', 'at', 'Jaket', 'u', { dm: 100 }),
  B('jas', 'Jas & Dasi', 'at', 'Formal', 'l', { lv: 4 }, { warna: true }),
  B('blazer', 'Blazer', 'at', 'Formal', 'p', { lv: 4 }, { warna: true }),
  B('o7', 'Jas Pengantin', 'at', 'Formal', 'l', { dm: 120 }),
  B('emas', 'Setelan Emas', 'at', 'Formal', 'u', { vip: true }),
  B('dressSantai', 'Dress Santai', 'at', 'Dress & Gaun', 'p', { lv: 1 }, { warna: true, gaun: 'pendek' }),
  B('dressBunga', 'Dress Bunga', 'at', 'Dress & Gaun', 'p', { lv: 2 }, { warna: true, gaun: 'pendek' }),
  B('gaun', 'Gaun Pesta', 'at', 'Dress & Gaun', 'p', { lv: 5 }, { warna: true, gaun: 'panjang' }),
  B('kebaya', 'Kebaya', 'at', 'Dress & Gaun', 'p', { lv: 6 }, { warna: true, gaun: 'kebaya' }),
  B('ssJaket', 'Jaket Season', 'at', 'Jaket', 'u', { season: true }),
  B('gcHoodieNeon', 'Hoodie Neon', 'at', 'Hoodie & Sweater', 'u', { gacha: true }),
  B('seragam', 'Seragam Karyawan', 'at', 'Seragam', 'u', { khusus: 'staf' }),
  B('jasDir', 'Jas Direktur', 'at', 'Seragam', 'u', { khusus: 'direktur' }),
  B('ob', 'Seragam OB', 'at', 'Seragam', 'u', { khusus: 'npc' }),
  B('satpam', 'Seragam Satpam', 'at', 'Seragam', 'u', { khusus: 'npc' }),
  B('ojol', 'Jaket Ojol', 'at', 'Seragam', 'u', { khusus: 'npc' }),
  B('celemek', 'Celemek Barista', 'at', 'Seragam', 'u', { khusus: 'npc' }),
  // ---------------- BAWAHAN
  B('chino', 'Celana Chino', 'bw', 'Celana Panjang', 'u', { lv: 1 }, { warna: true }),
  B('jeans', 'Jeans', 'bw', 'Celana Panjang', 'u', { lv: 1 }, { warna: true }),
  B('jogger', 'Jogger', 'bw', 'Celana Panjang', 'u', { lv: 2 }, { warna: true }),
  B('bahan', 'Celana Bahan', 'bw', 'Celana Panjang', 'u', { lv: 3 }, { warna: true }),
  B('cargo', 'Celana Cargo', 'bw', 'Celana Panjang', 'u', { lv: 4 }, { warna: true }),
  B('sobek', 'Jeans Sobek', 'bw', 'Celana Panjang', 'u', { lv: 5 }, { warna: true }),
  B('kulot', 'Kulot', 'bw', 'Celana Panjang', 'p', { lv: 2 }, { warna: true }),
  B('pendek', 'Celana Pendek', 'bw', 'Celana Pendek', 'u', { lv: 1 }, { warna: true }),
  B('pendekCargo', 'Celana Pendek Cargo', 'bw', 'Celana Pendek', 'l', { lv: 3 }, { warna: true }),
  B('rokPendek', 'Rok Pendek', 'bw', 'Rok', 'p', { lv: 1 }, { warna: true }),
  B('rokPanjang', 'Rok Panjang', 'bw', 'Rok', 'p', { lv: 1 }, { warna: true }),
  B('rokLipit', 'Rok Lipit', 'bw', 'Rok', 'p', { lv: 3 }, { warna: true }),
  B('rokJeans', 'Rok Jeans', 'bw', 'Rok', 'p', { lv: 4 }),
  B('sarung', 'Sarung', 'bw', 'Sarung', 'l', { lv: 3 }, { warna: true }),
  // ---------------- SEPATU
  B('sneakers', 'Sneakers', 'sp', 'Kasual', 'u', { lv: 1 }),
  B('kanvas', 'Sepatu Kanvas', 'sp', 'Kasual', 'u', { lv: 1 }),
  B('sandal', 'Sandal Jepit', 'sp', 'Kasual', 'u', { lv: 1 }),
  B('lari', 'Sepatu Lari', 'sp', 'Olahraga', 'u', { lv: 3 }),
  B('flat', 'Flat Shoes', 'sp', 'Formal', 'p', { lv: 2 }),
  B('pantofel', 'Pantofel', 'sp', 'Formal', 'l', { lv: 4 }),
  B('heels', 'Hak Tinggi', 'sp', 'Formal', 'p', { lv: 4 }),
  B('boots', 'Boots', 'sp', 'Boots', 'u', { lv: 5 }),
  B('sepatuEmas', 'Sepatu Emas', 'sp', 'Spesial', 'u', { vip: true }),
  // ---------------- AKSESORIS
  B('topi', 'Topi', 'kp', 'Topi', 'u', { lv: 1 }),
  B('kupluk', 'Kupluk', 'kp', 'Topi', 'u', { lv: 2 }),
  B('a14', 'Topi Pesta', 'kp', 'Topi', 'u', { dm: 40 }),
  B('hijab', 'Hijab', 'kp', 'Hijab & Rambut', 'p', { lv: 1 }, { warna: true }),
  B('pita', 'Pita', 'kp', 'Hijab & Rambut', 'p', { lv: 1 }),
  B('bando', 'Bando Kucing', 'kp', 'Hijab & Rambut', 'u', { lv: 3 }),
  B('bunga', 'Mahkota Bunga', 'kp', 'Mahkota', 'u', { lv: 5 }),
  B('mahkota', 'Mahkota Emas', 'kp', 'Mahkota', 'u', { vip: true }),
  B('halo', 'Halo', 'kp', 'Mahkota', 'u', { vip: true }),
  B('ssTopi', 'Topi Season', 'kp', 'Topi', 'u', { season: true }),
  B('gcBandoHati', 'Bando Hati', 'kp', 'Hijab & Rambut', 'u', { gacha: true }),
  B('helm', 'Helm', 'kp', 'Topi', 'u', { khusus: 'npc' }),
  B('topiOb', 'Topi Kerja', 'kp', 'Topi', 'u', { khusus: 'npc' }),
  B('kacamata', 'Kacamata', 'mt', 'Kacamata', 'u', { lv: 1 }),
  B('hitam', 'Kacamata Hitam', 'mt', 'Kacamata', 'u', { lv: 2 }),
  B('bulat', 'Kacamata Bulat', 'mt', 'Kacamata', 'u', { lv: 4 }),
  B('a12', 'Kacamata Hati', 'mt', 'Kacamata', 'u', { dm: 60 }),
  B('gcKacamataBintang', 'Kacamata Bintang', 'mt', 'Kacamata', 'u', { gacha: true }),
  B('headset', 'Headset', 'tl', 'Audio', 'u', { lv: 1 }),
  B('antingBulat', 'Anting Bulat', 'tl', 'Anting', 'p', { lv: 2 }),
  B('tindik', 'Anting Tindik', 'tl', 'Anting', 'l', { lv: 3 }),
  B('antingMutiara', 'Anting Mutiara', 'tl', 'Anting', 'p', { lv: 4 }),
  B('kalung', 'Kalung', 'lh', 'Kalung', 'u', { lv: 2 }),
  B('kalungHati', 'Kalung Hati', 'lh', 'Kalung', 'u', { lv: 4 }),
  B('syal', 'Syal', 'lh', 'Syal & Dasi', 'u', { lv: 3 }),
  B('dasi', 'Dasi', 'lh', 'Syal & Dasi', 'l', { lv: 4 }),
  B('dasiKupu', 'Dasi Kupu-kupu', 'lh', 'Syal & Dasi', 'l', { lv: 5 }),
  B('gelang', 'Gelang', 'tg', 'Perhiasan', 'u', { lv: 1 }),
  B('jam', 'Jam Tangan', 'tg', 'Perhiasan', 'u', { lv: 2 }),
  B('totebag', 'Tote Bag', 'tg', 'Tas', 'p', { lv: 2 }),
  B('tasSelempang', 'Tas Selempang', 'tg', 'Tas', 'u', { lv: 3 }),
  B('buket', 'Buket Bunga', 'tg', 'Bawaan', 'u', { lv: 6 }),
  B('sayap', 'Sayap Cupid', 'ef', 'Efek', 'u', { lv: 7 }),
  B('aura', 'Aura Hati', 'ef', 'Efek', 'u', { lv: 9 }),
  B('a13', 'Balon Hati', 'ef', 'Efek', 'u', { dm: 90 }),
  B('gcSayapKupu', 'Sayap Kupu-kupu', 'ef', 'Efek', 'u', { gacha: true }),
  // hewan peliharaan yang mengikuti karakter
  B('pKelinci', 'Kelinci', 'pt', 'Hewan', 'u', { lv: 8 }),
  B('pAyam', 'Ayam Jago', 'pt', 'Hewan', 'u', { lv: 12 }),
  B('pKucing', 'Kucing Oranye', 'pt', 'Hewan', 'u', { dm: 80 }),
  B('pAnjing', 'Anjing Corgi', 'pt', 'Hewan', 'u', { dm: 80 }),
];
export const BARANG = Object.fromEntries(PAKAIAN.map(x => [x.id, x]));

// Penampilan versi lama (o = outfit, a = aksesoris, b/c = warna) → v2
const LAMA_O = ['kemeja', 'hoodie', 'denim', 'jas', 'gaun', 'kulit', 'emas', 'o7', 'o8', 'o9'];
const LAMA_A = [null, ['mt', 'kacamata'], ['kp', 'topi'], ['kp', 'pita'], ['tl', 'headset'], ['mt', 'hitam'], ['kp', 'bando'], ['kp', 'bunga'], ['ef', 'sayap'], ['ef', 'aura'], ['kp', 'mahkota'], ['kp', 'halo'], ['mt', 'a12'], ['ef', 'a13'], ['kp', 'a14']];
const int = (v, n, d = 0) => (Number.isInteger(v) && v >= 0 && v < n ? v : d);
const KOSONG = { kp: '', mt: '', tl: '', lh: '', tg: '', ef: '', pt: '' };

// =====================================================================
//  SETELAN DIREKTUR: satu set lengkap (atasan + bawahan + sepatu + detail), khusus Direktur.
//  look.dx = id setelan · '' = setelan bawaan (klasik) · 'bebas' = pakai pakaian biasa.
//  cA/cB/cS = warna atasan/bawahan/sepatu · cK kemeja · cL kerah · dasi: panjang|kupu|tanpa · cD warna dasi
//  kancing emas · saku (sapu tangan) · garis (pinstripe) · kilau (berkilau) · turtle (kerah tinggi)
//  bahu (sweater diikat di bahu) · rantai (kalung emas) · bwP (bawahan versi wanita) · g:'p' khusus karakter wanita
// =====================================================================
export const SETELAN_DIR = [
  // ---- Jas formal
  { id: 'klasik', nama: 'Jas Hitam Klasik', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#1a1a22', cK: '#ffffff', dasi: 'panjang', cD: '#d4a017', cB: '#1a1a22', bw: 'bahan', sp: 'pantofel', kancing: 1 },
  { id: 'emas', nama: 'Setelan Emas Kerajaan', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#d4a017', kilau: 1, cL: '#ffe27a', cK: '#1a1a22', dasi: 'kupu', cD: '#ffe27a', cB: '#b8890f', bw: 'bahan', bwP: 'rokPanjang', sp: 'sepatuEmas', rantai: 1 },
  { id: 'putih', nama: 'Setelan Putih Elegan', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#f5f3ee', cL: '#e6dfd2', cK: '#ffffff', dasi: 'kupu', cD: '#1a1a22', cB: '#f5f3ee', bw: 'bahan', bwP: 'rokPanjang', sp: 'pantofel', cS: '#f2f2f2', saku: '#d4a017' },
  { id: 'tuxedo', nama: 'Tuxedo Gala', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#111114', cL: '#34343f', cK: '#ffffff', dasi: 'kupu', cD: '#111114', cB: '#111114', bw: 'bahan', sp: 'pantofel', saku: '#ffffff' },
  { id: 'navy', nama: 'Navy Eksekutif', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#1d2b4a', cK: '#ffffff', dasi: 'panjang', cD: '#b5232f', cB: '#1d2b4a', bw: 'bahan', sp: 'pantofel', cS: '#5a3a22', saku: '#b5232f' },
  { id: 'pinstripe', nama: 'Pinstripe Wall Street', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#454a54', garis: '#9aa0ab', cK: '#dbe9ff', dasi: 'panjang', cD: '#3a6ea5', cB: '#454a54', bw: 'bahan', sp: 'pantofel' },
  { id: 'maroon', nama: 'Beludru Maroon', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#6b1530', cL: '#1a1a22', cK: '#1a1a22', dasi: 'tanpa', cB: '#1a1a22', bw: 'bahan', sp: 'pantofel', saku: '#d4a017', rantai: 1 },
  { id: 'zamrud', nama: 'Zamrud Mewah', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#0f5132', cK: '#ffffff', dasi: 'kupu', cD: '#d4a017', cB: '#0f5132', bw: 'bahan', sp: 'pantofel', kancing: 1 },
  { id: 'pinkCinta', nama: 'Setelan Pink Cinta', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#ff4f7b', cK: '#ffffff', dasi: 'panjang', cD: '#ffffff', cB: '#ffffff', bw: 'bahan', bwP: 'rokPanjang', sp: 'pantofel', cS: '#ffffff' },
  { id: 'krem', nama: 'Krem Musim Panas', kat: '🎩 Jas Formal', at: 'jasDir', cA: '#e8d5b5', cK: '#ffffff', dasi: 'panjang', cD: '#8a5a2b', cB: '#e8d5b5', bw: 'bahan', sp: 'pantofel', cS: '#6b4630', mt: 'hitam' },
  // ---- Santai ala orang kaya
  { id: 'golf', nama: 'Golf Sultan', kat: '🛥️ Santai Sultan', at: 'polo', cA: '#f7f3ee', bahu: '#1d3557', cB: '#e8d5b5', bw: 'chino', sp: 'pantofel', cS: '#6b4630', mt: 'hitam', tg: 'jam' },
  { id: 'kapten', nama: 'Kapten Kapal Pesiar', kat: '🛥️ Santai Sultan', at: 'blazer', cA: '#1d2b4a', kancing: 1, cK: '#ffffff', dasi: 'tanpa', cB: '#f5f3ee', bw: 'chino', sp: 'pantofel', cS: '#6b4630', mt: 'hitam' },
  { id: 'resor', nama: 'Resor Linen Bali', kat: '🛥️ Santai Sultan', at: 'kemeja', cA: '#f3ead8', cB: '#ffffff', bw: 'chino', sp: 'pantofel', cS: '#b08d57', mt: 'hitam', rantai: 1 },
  { id: 'turtleneck', nama: 'Turtleneck Miliarder', kat: '🛥️ Santai Sultan', at: 'blazer', cA: '#b08d57', turtle: '#1a1a22', cK: '#1a1a22', dasi: 'tanpa', cB: '#1a1a22', bw: 'bahan', sp: 'pantofel', tg: 'jam' },
  { id: 'kasmir', nama: 'Sweater Kasmir', kat: '🛥️ Santai Sultan', at: 'sweater', cA: '#e8d5b5', turtle: '#ffffff', cB: '#4a4e57', bw: 'chino', sp: 'pantofel', cS: '#6b4630', tg: 'jam' },
  { id: 'italia', nama: 'Jaket Kulit Italia', kat: '🛥️ Santai Sultan', at: 'kulit', cA: '#5a3a22', cB: '#2b2d42', bw: 'jeans', sp: 'boots', mt: 'hitam', rantai: 1 },
  { id: 'tenis', nama: 'Klub Tenis', kat: '🛥️ Santai Sultan', at: 'polo', cA: '#ffffff', bahu: '#2f9e6e', cB: '#ffffff', bw: 'pendek', sp: 'sneakers', mt: 'hitam' },
  { id: 'batikSultan', nama: 'Batik Sultan', kat: '🛥️ Santai Sultan', at: 'batik', cA: '#6b3f22', cB: '#1a1a22', bw: 'bahan', sp: 'pantofel', rantai: 1 },
  // ---- Gaun malam (karakter wanita)
  { id: 'gaunEmas', nama: 'Gaun Malam Emas', kat: '👗 Gaun Malam', g: 'p', at: 'gaun', cA: '#d4a017', kilau: 1, sp: 'heels', cS: '#d4a017', rantai: 1 },
  { id: 'gaunPutih', nama: 'Gaun Putih Gala', kat: '👗 Gaun Malam', g: 'p', at: 'gaun', cA: '#f5f3ee', sp: 'heels', cS: '#f2f2f2', tl: 'antingMutiara' },
  { id: 'gaunMerah', nama: 'Gaun Karpet Merah', kat: '👗 Gaun Malam', g: 'p', at: 'gaun', cA: '#b5232f', sp: 'heels', cS: '#1a1a22', rantai: 1 },
];
export const SETELAN_DIR_ID = Object.fromEntries(SETELAN_DIR.map(s => [s.id, s]));
// setelan yang berlaku untuk penampilan Direktur (null = pakaian biasa)
export const setelanDir = l => (l && l.dx === 'bebas' ? null : SETELAN_DIR_ID[(l && l.dx) || 'klasik'] || SETELAN_DIR_ID.klasik);

export function lookV2(l, gender = '') {
  l = l && typeof l === 'object' ? l : {};
  if (l.v === 2) {
    const o = { v: 2, s: l.s === 'p' ? 'p' : 'l', k: int(l.k, KULIT.length), r: int(l.r, RAMBUT.length), w: int(l.w, WARNA_RAMBUT.length), wa: int(l.wa, WARNA_BAJU.length), wb: int(l.wb, WARNA_CELANA.length) };
    for (const s of ['at', 'bw', 'sp', ...SLOT_AKS]) { const it = BARANG[l[s]]; o[s] = it && it.slot === s ? it.id : ''; }
    if (l.dx === 'bebas' || SETELAN_DIR.some(x => x.id === l.dx)) o.dx = l.dx; // setelan Direktur
    if (!o.at) o.at = 'kaos'; if (!o.bw) o.bw = 'chino'; if (!o.sp) o.sp = 'sneakers';
    return o;
  }
  // migrasi dari penampilan lama
  const at = LAMA_O[int(l.o, LAMA_O.length)];
  const s = gender === 'ce' || at === 'gaun' || (l.r === 1 && gender !== 'co') ? 'p' : 'l';
  const o = { v: 2, s, k: int(l.k, KULIT.length), r: int(l.r, 5), w: int(l.w, 6), at, wa: int(l.b, 8), bw: 'chino', wb: int(l.c, 5), sp: at === 'jas' || at === 'o7' ? 'pantofel' : 'sneakers', ...KOSONG };
  if (at === 'jas') o.lh = 'dasi';
  const a = LAMA_A[int(l.a, LAMA_A.length)]; if (a) o[a[0]] = a[1];
  return o;
}

// Penampilan acak dari barang gratis level 1
export function lookAcakV2(seed, s) {
  let x = seed >>> 0 || 1;
  const r = n => { x = (x * 1103515245 + 12345) >>> 0; return (x >>> 8) % n; };
  s = s || (r(2) ? 'p' : 'l');
  const pilih = slot => { const l = PAKAIAN.filter(p => p.slot === slot && p.lv === 1 && (p.g === 'u' || p.g === s)); return l[r(l.length)].id; };
  const o = { v: 2, s, k: r(KULIT.length), r: s === 'p' ? [1, 2, 5, 6][r(4)] : [0, 4, 7, 0][r(4)], w: r(4), at: pilih('at'), wa: r(WARNA_BAJU.length), bw: pilih('bw'), wb: r(6), sp: pilih('sp'), ...KOSONG };
  if (r(3) === 0) o.mt = 'kacamata';
  return o;
}
