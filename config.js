// =============================================================
//  KONFIGURASI PT MENCARI CINTA SEJATI
//  Ubah file ini saja untuk menyesuaikan situs.
// =============================================================
window.PT_CONFIG = {
  // Nama & akun sosial perusahaan
  namaPT: 'PT Mencari Cinta Sejati',
  singkatan: 'PT MCS',
  instagram: 'ptmencaricintasejati', // tanpa @ ; kosongkan jika belum ada

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
  direkturDemo: null, // dimatikan: situs sudah memakai Firebase (mode online)

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
  firebase: {
    apiKey: "AIzaSyDRzE1RCfgW5jObialv6uKEBvxBaHxCQtI",
    authDomain: "pt-mencari-cinta-sejati.firebaseapp.com",
    databaseURL: "https://pt-mencari-cinta-sejati-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pt-mencari-cinta-sejati",
    storageBucket: "pt-mencari-cinta-sejati.firebasestorage.app",
    messagingSenderId: "815630034062",
    appId: "1:815630034062:web:5ec317491df13ee82755df",
  },
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
  // ---------------------------------------------------------
  //  PEMBAYARAN (dipakai untuk Diamond, Kartu Eksekutif/EXP, dan donasi)
  //  Pembeli membayar ke rekening/QRIS kamu dengan NOMINAL UNIK,
  //  lalu kamu cocokkan di mutasi rekening dan klik Setujui di Dashboard.
  //  Metode yang dikosongkan otomatis disembunyikan.
  // ---------------------------------------------------------
  pembayaran: {
    // QRIS: unggah gambar QR kamu ke folder pembayaran/ (mis. pembayaran/qris.png) lalu isi path-nya.
    qris: '',
    qrisNama: '',           // nama merchant yang tertulis di QRIS
    bank: [
      { bank: 'BCA', nomor: '', atasNama: '' },
      { bank: 'BRI', nomor: '', atasNama: '' },
    ],
    kodeUnik: true,         // tambah Rp1–Rp499 unik supaya transfer mudah dikenali

    // PEMBAYARAN OTOMATIS (diamond langsung masuk tanpa perlu disetujui)
    // 'midtrans' = aktif. Kunci rahasia TIDAK ditaruh di sini, tapi di
    // Cloudflare Pages → Settings → Variables (lihat README bagian Midtrans).
    // Kosongkan '' untuk memakai cara manual (QRIS/rekening di atas).
    otomatis: '',
  },

  // Harga paket Diamond, Kartu Eksekutif/EXP, dan donasi ada di paket.js

  toko: {
    linkBayar: '',          // opsional: link Saweria/Trakteer sebagai metode "Lainnya"
    caraBayar: 'Bayar lewat link di bawah, lalu tulis KODE TAMU kamu di kolom pesan supaya Direktur bisa mencocokkan pembayaranmu.',
  },

  // Pengumuman di Mading (baris terbaru di atas)
  mading: [
    { judul: 'Selamat datang, tamu!', isi: 'Mau cari jodoh, cari teman, atau sekadar curhat, semua diterima di sini.' },
    { judul: 'Jam buka', isi: 'Senin–Minggu, 24 jam. Resepsionis siap membantu.' },
    { judul: 'Aturan kantor', isi: 'Sopan, tidak melecehkan, tidak spam, dan jangan sebar data pribadi orang lain. Pelanggar dikeluarkan Satpam.' },
  ],
};

// ---------------------------------------------------------
//  MODE OFFLINE OTOMATIS
//  Saat situs dibuka dari komputer sendiri (localhost / 127.0.0.1),
//  misalnya lewat jalankan-offline.bat, situs memakai MODE LOKAL:
//  tanpa internet & tanpa Firebase, data tersimpan di browser itu saja,
//  dan Dashboard Direktur memakai akun demo di bawah ini.
//  Tambahkan ?online=1 di alamat untuk tetap memakai Firebase dari localhost.
//  Di hosting (Cloudflare Pages) blok ini tidak berpengaruh.
// ---------------------------------------------------------
(function () {
  var lokal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (lokal && !/[?&]online=1/.test(location.search)) {
    window.PT_CONFIG.firebase = null;
    window.PT_CONFIG.direkturDemo = { username: 'direktur', password: 'cintasejati' };
    window.PT_CONFIG.modeOffline = true;
  }
})();
