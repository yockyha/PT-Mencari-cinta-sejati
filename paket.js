// =====================================================================
//  DAFTAR PAKET & HARGA (satu-satunya sumber harga)
//  Dipakai oleh tampilan toko DAN server pembayaran otomatis
//  (functions/), jadi harga tidak bisa diakali dari browser.
//  Ubah harga di sini saja.
// =====================================================================
export default {
  // Paket Diamond (💠) untuk membeli outfit & aksesoris khusus
  diamond: [
    { id: 'dm50', diamond: 50, harga: 5000 },
    { id: 'dm110', diamond: 110, harga: 10000, ket: 'Bonus 10 💠' },
    { id: 'dm300', diamond: 300, harga: 25000, ket: 'Bonus 50 💠' },
    { id: 'dm650', diamond: 650, harga: 50000, ket: 'Bonus 150 💠' },
  ],
  // Paket lain yang dibayar dengan uang
  toko: [
    // tidak dijual lagi (diganti VIP/VVIP dengan Diamond); tetap ada supaya pesanan lama bisa diproses
    { id: 'vip30', nama: 'Kartu Eksekutif 30 hari', harga: 5000, vipHari: 30, sembunyi: true, ket: 'Lihat siapa yang menyukaimu, Lounge Eksekutif, outfit & nama emas' },
    // VIP/VVIP dibayar langsung dengan uang (tampil di kartu VIP/VVIP di Toko). Sama dengan 300/650 Diamond.
    { id: 'vip30d', nama: 'VIP 30 hari', harga: 25000, vipHari: 30, tingkat: 'vip', sembunyi: true },
    { id: 'vvip30d', nama: 'VVIP 30 hari', harga: 50000, vipHari: 30, tingkat: 'vvip', sembunyi: true },
    { id: 'exp100', nama: '100 EXP', harga: 5000, exp: 100, ket: 'Langsung naik ±2 level untuk pemula' },
    { id: 'exp300', nama: '300 EXP', harga: 12000, exp: 300, ket: 'Buka Jas & Dasi, Gaun Pesta, dan lainnya' },
    { id: 'exp1000', nama: '1.000 EXP', harga: 35000, exp: 1000, ket: 'Buka hampir semua outfit & aksesoris' },
  ],
  // Langganan dibeli dengan Diamond (30 hari). 300 💠 = paket Rp25.000, 650 💠 = paket Rp50.000
  langganan: [
    { id: 'vip', nama: 'VIP', ikon: '💎', diamond: 300, hari: 30, paketUang: 'vip30d' },
    { id: 'vvip', nama: 'VVIP', ikon: '👑', diamond: 650, hari: 30, paketUang: 'vvip30d' },
  ],
  // Donasi (nominal bebas)
  donasi: { min: 5000, maks: 10000000, saran: [10000, 25000, 50000, 100000] },
};

// Hitung item pesanan dari data yang dikirim pembeli. Mengembalikan null bila tidak sah.
export function hitungItem(P, { jenis, paket, nominal }) {
  if (jenis === 'diamond') { const p = P.diamond.find(x => x.id === paket); return p ? { jenis, paket: p.id, nama: `${p.diamond} Diamond`, harga: p.harga, diamond: p.diamond } : null; }
  if (jenis === 'paket') { const p = P.toko.find(x => x.id === paket); return p ? { jenis, paket: p.id, nama: p.nama, harga: p.harga, exp: p.exp || 0, vipHari: p.vipHari || 0, tingkat: p.tingkat || '' } : null; }
  if (jenis === 'donasi') { const n = Math.round(+nominal || 0); return n >= P.donasi.min && n <= P.donasi.maks ? { jenis, paket: 'donasi', nama: 'Donasi', harga: n } : null; }
  return null;
}

// Narasi donasi: arti nominal (tampil saat memilih) & ucapan terima kasih (notifikasi setelah lunas).
// Dipakai tampilan donasi DAN server, jadi kata-katanya cukup diubah di sini. Ucapan maks. ±170 huruf.
export const TINGKAT_DONASI = [
  { min: 100000, ikon: '👑', gelar: 'Pahlawan Kantor', arti: 'Biaya server sebulan penuh + modal fitur baru. Kantor ini berdiri karena orang sepertimu.' },
  { min: 50000, ikon: '💐', gelar: 'Sponsor Kantor', arti: 'Biaya server seminggu tertutup. Lampu kantor tetap nyala buat semua tamu.' },
  { min: 25000, ikon: '🎉', gelar: 'Pendukung Acara', arti: 'Cukup buat modal satu acara: Speed Dating, Nobar, atau kuis berhadiah.' },
  { min: 10000, ikon: '🍰', gelar: 'Teman Baik Kantor', arti: 'Setara camilan sore satu divisi. Server & domain aman beberapa hari.' },
  { min: 0, ikon: '☕', gelar: 'Penyemangat Kantor', arti: 'Setara traktir kopi tim kantor. Server tetap nyala seharian.' },
];
export const tingkatDonasi = n => TINGKAT_DONASI.find(t => n >= t.min);
export function ucapanDonasi(n) {
  const t = tingkatDonasi(n), rpS = 'Rp' + Number(n).toLocaleString('id-ID');
  return `${t.ikon} Donasi ${rpS} diterima! Kamu resmi jadi ${t.gelar} PT MCS. Seluruh karyawan & tamu berterima kasih, semoga cinta sejatimu cepat ketemu 💖`;
}

// Nama yang tampil di Papan Donasi (nt = nama pilihan donatur; tampil=false → anonim)
export const ANONIM_DONASI = 'Orang Baik 🤍';
export const namaPapan = v => (v && v.tampil === false ? ANONIM_DONASI : String((v && (v.nt || v.n)) || 'Tamu').trim().slice(0, 20) || 'Tamu');
