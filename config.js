// =============================================================
//  KONFIGURASI PT MENCARI CINTA SEJATI
//  Ubah file ini saja untuk menyesuaikan situs.
// =============================================================
window.PT_CONFIG = {
  // Nama & akun sosial perusahaan
  namaPT: 'PT Mencari Cinta Sejati',
  singkatan: 'PT MCS',
  instagram: 'ptmencaricintasejati', // tanpa @ ; kosongkan jika belum ada
  donasi: '',                        // contoh: 'https://saweria.co/namamu' ; kosongkan untuk menyembunyikan

  // Target tamu angkatan pertama (untuk bar di halaman Kartu Tamu)
  kuota: 10000,

  // PIN "Direktur demo" — HANYA untuk mode lokal (firebase: null) supaya kamu bisa
  // mencoba Panel Direktur. Di mode online, Direktur masuk dengan email & password
  // Firebase (lihat README). Kosongkan '' untuk mematikan.
  pinDemo: '1234',

  // ---------------------------------------------------------
  //  MODE ONLINE (multiplayer) — pakai Firebase Realtime Database.
  //  Biarkan null untuk MODE LOKAL: kantor tetap bisa dijelajahi,
  //  diisi karyawan NPC, dan tab lain di browser yang sama ikut terlihat.
  //  Cara mengisi: lihat README.md bagian "Mengaktifkan mode online".
  // ---------------------------------------------------------
  firebase: null,
  /* contoh:
  firebase: {
    apiKey: "AIza...",
    authDomain: "proyekmu.firebaseapp.com",
    databaseURL: "https://proyekmu-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "proyekmu",
    appId: "1:123:web:abc"
  },
  */

  // Pengumuman di Mading HRD (baris terbaru di atas)
  mading: [
    { judul: 'Selamat datang, tamu!', isi: 'Mau cari jodoh, cari teman, atau sekadar curhat, semua diterima di sini.' },
    { judul: 'Jam buka', isi: 'Senin–Minggu, 24 jam. Resepsionis siap membantu.' },
    { judul: 'Aturan kantor', isi: 'Sopan, tidak melecehkan, tidak spam, dan jangan sebar data pribadi orang lain. Pelanggar dikeluarkan Satpam.' },
  ],
};
