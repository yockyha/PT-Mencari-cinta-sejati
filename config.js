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

  // Kuota karyawan angkatan pertama (untuk bar di halaman ID Card)
  kuota: 10000,

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
    { judul: 'Selamat datang, karyawan baru!', isi: 'Kantor ini tidak punya gaji, tapi tunjangan harapan dibayar tiap hari.' },
    { judul: 'Jam kerja', isi: 'Senin–Minggu, 24 jam. Lembur perasaan tidak dihitung.' },
    { judul: 'Larangan', isi: 'Dilarang ghosting rekan kerja. Dilarang spam chat. Saling jaga sopan santun.' },
  ],
};
