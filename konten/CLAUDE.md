# Aturan produksi konten jodohonline

- **Semua gambar & klip untuk video baru WAJIB direkam dari situs versi TERBARU** (`origin/main`), bukan dipakai ulang dari stok lama di `video-remotion/public/`. Permintaan pemilik (27 Nov 2026): tampilan kantor/home sering berubah, jadi stok lama cepat usang.
  - Sebelum membuat video: `git fetch origin`, ekstrak `origin/main` ke folder situs di scratchpad, jalankan `python3 -m http.server 8765` di sana.
  - Rekam ulang stok umum dengan `node video-remotion/rekam-stok.js <folder>` lalu salin ke `public/klip` & `public/foto`, plus rekaman khusus fitur (`rekam-aplikasi-N.js`).
  - Cover: latar & tokoh juga dari situs terbaru (`rekam-cover.js`).
- Cover: konsep & tulisan sama untuk semua video; yang beda tiap video hanya **latar** dan **tokoh** (lihat README video-remotion).
- Sebelum mengerjakan video baru, laporkan dulu **ide & narasi** ke pemilik untuk disetujui.
- Narasi gaya Gen Z memakai **gue/lu** bila diminta; jangan sebut harga VIP/VVIP kecuali diminta.
- Akun: Instagram **@jodohonline.company**, TikTok **@jodohonline.id**.
- Data angka (jumlah tamu, dll.) harus data asli dari Firebase (`/anggota` publik); pendaftar yang menunggu ACC hanya bisa dibaca Direktur.
- VO dibuat pemilik (ElevenLabs akun sendiri) lalu dikirim; waktu adegan dipas ke jeda VO (`silencedetect`).

## Status stok (`video-remotion/public/`)
- Diperbarui 28 Nov 2026 (video 8, `rekam-aplikasi-8.js`): klip `tc_drone`, `tc_koin`, `tc_bioskop` (Taman Cinta malam), `cl_luar`, `cl_dance`, `cl_dj`, `cl_bar`, `cl_vip`, `cl_layar` (Y.H.A Club), serta rekam ulang `jadwal`, `hujan`, `raja`, `sd`, `tod`, `loker`; foto `latar-club`, `tokoh-club`.
- Diperbarui dari situs terbaru 27 Nov 2026: klip `drone`, `jalan`, `r_kafe`, `r_meja`, `r_taman`, `r_lounge`, `loker`, `pintudir` (pintu Ruang Direktur + GUARD); foto `meja`, `karakter`, `tugas`, `toko`, `beranda`.
- Masih versi LAMA (rekam ulang dulu sebelum dipakai): `direktur.mp4` (perlu sesi sebagai Direktur, karena Direktur hanya tampil saat online), `chat.mp4`, `game.mp4`, `diterima.mp4`, `dash_acc.mp4`, `formulir.mp4`, foto `levelup`, `rapat`, `airmancur`, `halaman`, `formulir`, `direktur.png` (tokoh cover lama).
