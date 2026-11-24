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

  // ---------------------------------------------------------
  //  LOGIN DASHBOARD DIREKTUR (/dashboard/)
  //  Mode online: buat akun di Firebase Authentication dengan email
  //  <username>@<domainLogin>, contoh: yocky@ptmcs.id. Di dashboard
  //  cukup ketik username "yocky" (atau email lengkap) + kata sandi.
  //  direkturDemo HANYA berlaku di mode lokal (firebase: null) untuk mencoba.
  //  Hapus/ganti sebelum dipublikasikan.
  // ---------------------------------------------------------
  domainLogin: 'ptmcs.id',
  direkturDemo: { username: 'direktur', password: 'cintasejati' },

  // Pendaftaran tamu
  pendaftaran: {
    umurMin: 13,        // umur minimal untuk Cari Teman / Mau Curhat
    umurMinJodoh: 18,   // umur minimal untuk Cari Jodoh
  },

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

  // ---------------------------------------------------------
  //  TOKO: jual EXP & Kartu Eksekutif (VIP).
  //  Pembayaran diverifikasi manual oleh Direktur di Panel → Pesanan.
  //  linkBayar: halaman tempat tamu membayar (Saweria, Trakteer, dll.).
  //  Kosongkan linkBayar untuk menutup toko sementara.
  // ---------------------------------------------------------
  toko: {
    linkBayar: '',
    caraBayar: 'Bayar lewat link di bawah, lalu tulis KODE TAMU kamu di kolom pesan supaya Direktur bisa mencocokkan pembayaranmu.',
    paket: [
      { id: 'vip30', nama: 'Kartu Eksekutif 30 hari', harga: 5000, vipHari: 30, ket: 'Lihat siapa yang menyukaimu, Lounge Eksekutif, outfit & nama emas' },
      { id: 'exp100', nama: '100 EXP', harga: 5000, exp: 100, ket: 'Langsung naik ±2 level untuk pemula' },
      { id: 'exp300', nama: '300 EXP', harga: 12000, exp: 300, ket: 'Buka Jas & Dasi, Gaun Pesta, dan lainnya' },
      { id: 'exp1000', nama: '1.000 EXP', harga: 35000, exp: 1000, ket: 'Buka hampir semua outfit & aksesoris' },
    ],
  },

  // Pengumuman di Mading (baris terbaru di atas)
  mading: [
    { judul: 'Selamat datang, tamu!', isi: 'Mau cari jodoh, cari teman, atau sekadar curhat, semua diterima di sini.' },
    { judul: 'Jam buka', isi: 'Senin–Minggu, 24 jam. Resepsionis siap membantu.' },
    { judul: 'Aturan kantor', isi: 'Sopan, tidak melecehkan, tidak spam, dan jangan sebar data pribadi orang lain. Pelanggar dikeluarkan Satpam.' },
  ],
};
