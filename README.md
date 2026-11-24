# PT Mencari Cinta Sejati 💌

Kantor virtual 3D tempat orang datang sebagai **tamu** untuk **💘 cari jodoh**, **🤝 cari teman**, atau sekadar **💬 curhat**. Pemilik situs memegang kendali sebagai **👑 Direktur Utama**.

## Konsep

| Siapa | Bisa apa |
|---|---|
| **👀 Pengunjung** (belum disetujui) | Hanya lihat-lihat: jalan keliling, lihat papan, jadwal, buku tamu. Tidak terlihat orang lain, tidak bisa chat/interaksi/EXP (dikunci server). Bisa mengisi **formulir pendaftaran** |
| **Tamu resmi** (disetujui Direktur) | Chat, ajak ngobrol pribadi, ❤ suka & match, curhat, ikut acara, tugas & EXP, toko, Kartu Tamu |
| **🛡 Staf** (diangkat Direktur) | Semua yang tamu bisa + usir/blokir tamu, hapus konten, baca laporan & saran |
| **👑 Direktur** (pemilik) | Semuanya, lewat **Dashboard Direktur** + di dalam kantor: EXP tak terbatas, semua outfit & aksesoris, semua fitur Eksekutif |

### Alur pendaftaran
1. Pengunjung masuk kantor (atau tautan `kantor/index.html#daftar`) → formulir muncul
2. Isi: tujuan (💘 jodoh / 🤝 teman / 💬 curhat), nama panggilan, umur, jenis kelamin (opsional), kota, status hati (khusus jodoh), Instagram (opsional), tentang aku, alasan bergabung, centang pernyataan
3. Umur minimal diatur di `config.js` → `pendaftaran` (bawaan 13, Cari Jodoh 18)
4. Status "⏳ sedang ditinjau" tampil di layar pengunjung
5. Direktur menerima (sebagai Tamu atau Staf) atau menolak dengan catatan di Dashboard → pengunjung langsung dapat kabar di layar

### Dashboard Direktur (`/dashboard/`)
Login username + kata sandi. Isinya:
- **Ringkasan**: angka utama, anggota per tujuan, aktivitas langsung, buka/tutup kantor & pendaftaran, tautan pendaftaran
- **Pendaftaran**: kartu tiap pendaftar → Terima sebagai Tamu / Staf, Tolak + catatan, Terima semua
- **Anggota**: cari & filter; per orang: ubah nama/tujuan, beri/atur EXP, Kartu Eksekutif, angkat staf, usir/blokir/ampuni, cabut keanggotaan, kirim pesan
- **Online**: siapa di kantor sekarang dan di ruangan mana
- **Aktivitas**: semua kejadian, chat, papan, curhat (lengkap dengan penulisnya) + hapus
- **Acara**: jadwalkan (dengan template), lihat siapa ikut & hadir
- **Toko & Pesanan**: setujui/tolak pembelian, riwayat & pendapatan
- **Laporan & Saran**
- **Siaran & Pengaturan**: pengumuman, mading, pesan tutup kantor/pendaftaran
- **Data**: lihat & ubah langsung isi database (JSON) + unduh cadangan
- Tombol **🏢 Masuk kantor** untuk masuk ke dunia 3D sebagai Direktur

🔒 Isi obrolan pribadi antar-tamu sengaja tidak bisa dibaca siapa pun selain dua orang di dalamnya, termasuk Direktur.

### Ruangan
- **Lobi**: resepsionis (info & aturan), mading kantor, sofa
- **💘 Kafe Jodoh** (pantry): Mesin Kopi Jodoh memberi ramalan + menyarankan tamu lain yang juga cari jodoh
- **🤝 Meja Nongkrong**: 8 meja topik (Gaming, Musik, Drakor & Film, Olahraga, Kuliner, Buku, Jalan-jalan, Random). Duduk di meja = minatmu terlihat di profil
- **💬 Taman Curhat**: papan curhat anonim (pelukan 🤗 + balasan) dan air mancur harapan
- **📋 Ruang Rapat**: papan tulis bersama
- **📖 Buku Tamu**: semua tamu yang pernah datang
- **👔 Ruang Loker**: ganti penampilan
- **👑 Ruang Direktur**: kotak saran untuk Direktur + pintu masuk Panel Direktur

### Interaksi antar-tamu
- **Ketuk orang lain** → profil (tujuan, status, bio, meja tempat dia nongkrong)
- **👋 Sapa** di chat umum
- **💌 Ajak ngobrol** → dia dapat notifikasi *Terima/Tolak*. Obrolan pribadi hanya terbuka kalau diterima, dan hanya bisa dibaca berdua
- **❤ Suka** (khusus sesama tamu Cari Jodoh, 18+) → rahasia; kalau saling suka jadi **match** dan obrolan langsung terbuka. Tamu bisa melihat *berapa* orang yang menyukainya, tapi bukan siapa
- **🚩 Laporkan** & **🙈 Sembunyikan** untuk yang mengganggu

### Tugas, EXP & level
- **Tur Kantor** (sekali, untuk tamu baru): isi buku tamu, kunjungi ruangan sesuai tujuan, kirim chat pertama, lihat profil orang, ganti penampilan, cetak Kartu Tamu
- **Tugas harian** (reset tengah malam WIB): bikin kopi, duduk di meja nongkrong, 3 chat, ajak ngobrol, peluk curhat, tulis papan, main Tangkap Hati, lempar koin
- **Petunjuk arah** di kiri atas selalu menunjukkan langkah berikutnya (atau acara yang sedang LIVE) dan bisa diketuk untuk langsung ke sana
- **🎮 Tangkap Hati**: mesin arcade di lobi, 30 detik, ada peringkat harian
- **Level** membuka outfit (Hoodie, Jaket Denim, Jas & Dasi, Gaun Pesta, Jaket Kulit) dan aksesoris (kacamata hitam, bando kucing, mahkota bunga, sayap cupid, aura hati) di Ruang Loker

### Acara terjadwal
Direktur membuat acara di **Panel → Acara** (ada template: Speed Dating, Mabar, Sesi Curhat, Kuis Cinta, Turnamen Tangkap Hati, Malam Eksekutif). Tamu melihatnya di papan jadwal lobi dan tab Acara, bisa menekan **Ikut** untuk diingatkan 10 menit sebelumnya. Saat acara berlangsung muncul spanduk 🔴 LIVE; tamu yang datang ke ruangannya otomatis tercatat hadir (dicek waktu server) dan mendapat EXP.

### Toko: jual EXP & Kartu Eksekutif
- Paket diatur di `config.js` → `toko.paket` (bawaan: Kartu Eksekutif 30 hari Rp5.000, 100/300/1.000 EXP)
- **Kartu Eksekutif** membuka: lihat *siapa* yang menyukaimu, Lounge Eksekutif (lewat lift lobi), Setelan Emas, Mahkota Emas, Halo, nama emas 💎, dan ajakan ngobrol yang menonjol
- Alur bayar (manual, tanpa server): tamu menyalin **kode tamu** → bayar di `toko.linkBayar` (Saweria/Trakteer/dll.) dengan kode di pesan → tekan *Saya sudah bayar* → kamu mencocokkan di **Panel → Pesanan** → *Setujui* → EXP/VIP langsung aktif dan tamu dapat notifikasi
- Toko tertutup selama `linkBayar` kosong
- Kalau ramai, alur ini bisa diotomatiskan dengan webhook pembayaran + Cloudflare Worker/Cloud Function yang menulis ke Firebase

Semua aturan di atas dijaga di server lewat `database.rules.json`, bukan cuma di tampilan. **Batasan yang perlu diketahui:** EXP dari tugas dicatat oleh browser tamu (dibatasi maksimal 60 EXP per 3 detik), jadi tamu yang paham teknis bisa mengakali EXP *tugas*. Ini hanya berpengaruh ke barang kosmetik. EXP yang **dibeli**, Kartu Eksekutif, dan daftar "siapa yang menyukaimu" sepenuhnya dikunci server dan hanya bisa diberikan Direktur.

## Struktur

```
index.html            beranda
kantor/index.html     kantor 3D
kantor/kantor.js      dunia 3D, karakter, gerak, chat, ruangan
kantor/sosial.js      profil, ajak ngobrol, obrolan pribadi, suka & match, curhat
kantor/direktur.js    Ruang & Panel Direktur (acara, pesanan, moderasi)
kantor/progres.js     EXP, level, tugas, petunjuk arah, acara, peringkat, toko
kantor/game.js        mini-game Tangkap Hati
kantor/ui.js          alat UI bersama
dashboard/            Dashboard Direktur (login, persetujuan, kendali penuh)
idcard/               generator Kartu Tamu
js/db.js              lapisan data: Firebase (online) atau tiruan lokal
js/layanan.js         semua operasi data (chat, undangan, usir, dll.)
js/common.js          tujuan, topik meja, filter kata kasar, utilitas
config.js             ← file yang perlu diubah
database.rules.json   aturan keamanan Firebase Realtime Database
```

## Menjalankan di komputer

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

Harus lewat server, bukan dibuka sebagai `file://`, karena halaman memakai ES module.

## Mode lokal vs online

Selama `firebase: null` di `config.js`, situs berjalan dalam **mode lokal**:
- kantor diisi 7 tamu NPC yang berkeliling, duduk, bicara, bisa diajak ngobrol, dan bisa *match*
- **buka dua tab** di browser yang sama untuk mencoba interaksi antar-tamu (tab kedua dianggap tamu lain)
- data disimpan di browser masing-masing
- Dashboard Direktur bisa dicoba dengan akun demo (`direkturDemo` di `config.js`); tab kantor pertama di browser yang sama otomatis menjadi Direktur, tab kantor kedua menjadi pengunjung baru

### Mengaktifkan mode online (multiplayer)

1. Buat proyek di <https://console.firebase.google.com>.
2. **Build → Authentication → Sign-in method**: aktifkan **Anonymous** (untuk tamu) dan **Email/Password** (untuk Direktur).
3. **Build → Realtime Database**: buat database (lokasi Singapura `asia-southeast1`).
4. Di tab **Rules**, tempel isi `database.rules.json` lalu **Publish**.
5. **Project settings → Your apps → Web app**, salin konfigurasinya ke `config.js`:
   ```js
   firebase: {
     apiKey: "...",
     authDomain: "....firebaseapp.com",
     databaseURL: "https://....asia-southeast1.firebasedatabase.app",
     projectId: "...",
     appId: "..."
   },
   ```
6. Di Authentication → Settings → **Authorized domains**, tambahkan domain tempat situs di-hosting.

`apiKey` Firebase memang boleh terlihat publik. Keamanan data diatur oleh `database.rules.json`.

### Menjadikan dirimu Direktur (sekali saja)

1. Firebase Console → **Authentication → Users → Add user**: email `<username>@ptmcs.id` (domain sesuai `domainLogin` di `config.js`, contoh `yocky@ptmcs.id`) dan kata sandi.
2. Salin **User UID** akun itu.
3. **Realtime Database → Data**: tambahkan node `peran`, lalu di dalamnya kunci `<User UID>` dengan nilai `"direktur"` (pakai tanda kutip).
4. Buka `/dashboard/` → login dengan username `yocky` + kata sandi tadi. Dari dashboard, tekan **🏢 Masuk kantor** untuk masuk sebagai Direktur.

Di dalam kantor, tombol **👑 Panel** juga tersedia untuk kendali cepat. Staf diangkat dari Panel → Pengunjung → Tindak → *Angkat jadi Staf*.

Di mode lokal (tanpa Firebase), buka `/dashboard/` dan login dengan `direkturDemo` di `config.js` (bawaan username `direktur`, sandi `cintasejati`).

## Membuka untuk publik

1. **Aktifkan mode online** (bagian di atas). Tanpa ini, tiap pengunjung hanya melihat kantornya sendiri.
2. **Hosting gratis**, pilih salah satu:
   - **Cloudflare Pages**: Workers & Pages → Create → Pages → hubungkan repo GitHub ini (build command kosong, output `/`), atau *Upload assets* lalu unggah isi folder. Dapat alamat `namamu.pages.dev`.
   - **Netlify**: <https://app.netlify.com/drop>, seret folder proyek.
   - **GitHub Pages**: Settings → Pages → Deploy from branch.
3. Tambahkan domain hosting ke Firebase → Authentication → Settings → **Authorized domains**.
4. Isi `instagram`, `toko.linkBayar`, dan **hapus `direkturDemo`** di `config.js`.
5. (Opsional) Domain sendiri, misalnya `ptmencaricintasejati.id`, bisa disambungkan di Cloudflare/Netlify.

## Kustomisasi cepat

- Nama PT, Instagram, link donasi, kuota, isi mading: `config.js`
- Tujuan, topik meja, status hati, level, outfit & aksesoris: `js/common.js`
- Daftar tugas: `kantor/progres.js` (cari `TUR` dan `HARIAN`)
- Paket toko & link pembayaran: `config.js` → `toko`
- Kalimat NPC, ramalan kopi, harapan air mancur: `kantor/kantor.js` (cari `KALIMAT`, `RAMALAN`, `HARAPAN`)
- Balasan NPC di obrolan pribadi: `kantor/sosial.js` (cari `BOT_KATA`)
