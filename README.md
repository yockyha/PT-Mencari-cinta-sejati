# PT Mencari Cinta Sejati 💌

Kantor virtual 3D tempat orang datang sebagai **tamu** untuk **💘 cari jodoh**, **🤝 cari teman**, atau sekadar **💬 curhat**. Pemilik situs memegang kendali sebagai **👑 Direktur Utama**.

🌐 **Situs:** <https://jodohonline.company> · kantor: <https://jodohonline.company/kantor/> · daftar: <https://jodohonline.company/kantor/#daftar> · dashboard: <https://jodohonline.company/dashboard/>

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
- **📖 Buku Tamu**: monitor LIVE, nama semua tamu turun bergantian seperti hujan (makin ramai makin cepat)
- **👔 Ruang Loker**: ganti penampilan
- **👑 Ruang Direktur** (suite mewah): lounge tamu (sofa kulit, akuarium), meja Direktur (kursi singgasana, globe), kamar pribadi (kasur king, TV, mini bar, treadmill). Direktur bisa kerja, tidur, nonton TV, bikin kopi, olahraga. **Tamu harus mengetuk pintu dulu**; Direktur mengizinkan (30 menit / 2 jam), menolak, mengundang, atau membuka ruangan untuk semua (Panel → Kuasa → 🚪 Pintu Ruanganmu)
- **🎡 Taman Cinta** (gedung baru di barat kantor): air mancur harapan, Bioskop Cinta, bianglala (bisa dinaiki), kedai es krim/boba/sosis. Sebelum jadwal buka tampil sebagai proyek pembangunan dengan hitung mundur

### 🏗️ Menambah gedung baru
Semua gedung tambahan ada di `kantor/gedung.js` (daftar `GEDUNG`). Tiap gedung punya `mulai` & `selesai` (jadwal pembangunan), `area`, `gerbang`, daftar `fasilitas`, dan fungsi `bangun`. Selama belum selesai otomatis tampil pagar seng, crane, perancah, pekerja, dan papan hitung mundur; bangunannya "naik" sesuai progres. Direktur bisa menekan **⚡ Buka sekarang** di papan proyek. Tambahkan juga satu lokasi di `LOKASI` (`js/common.js`) dengan `gedung: '<id>'` supaya muncul tombol pintasannya.

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

### Pembayaran: QRIS & transfer BCA/BRI
Dipakai untuk **💠 Diamond**, **Kartu Eksekutif/EXP**, dan **🎁 donasi**. Uang masuk langsung ke QRIS/rekeningmu, tanpa potongan.

1. Isi di `config.js` → `pembayaran`:
   - `qris`: path gambar QRIS (unggah ke folder `pembayaran/`, lihat `pembayaran/README.md`)
   - `bank`: nomor rekening & atas nama **BCA** dan **BRI** (kosongkan yang tidak dipakai)
2. Pembeli memilih paket → memilih **QRIS / BCA / BRI** → membayar **nominal unik** (harga + Rp1–499, mis. Rp10.330) → menekan *Saya sudah bayar*
3. Di **Dashboard → Toko & Pesanan**, cocokkan nominal unik dengan mutasi rekening/QRIS → **Setujui**. Diamond/paket langsung masuk, pembeli dapat notifikasi; donasi tercatat di **Papan Donatur**

Cara manual ini tetap tersedia sebagai cadangan. Supaya **tidak perlu standby menyetujui**, aktifkan pembayaran otomatis di bawah.

### 🛡️ Aturan Firebase (otomatis)
Aturan keamanan ditulis per fitur di `alat/aturan/` (lihat `alat/aturan/README.md`) dan digabung menjadi `database.rules.json`.
Setiap merge ke `main` yang mengubah aturan **dipasang ke Firebase otomatis** oleh GitHub Actions,
asalkan secret `FIREBASE_DB_SECRET` sudah diisi di GitHub → Settings → Secrets and variables → Actions.

### ⚡ Pembayaran otomatis (Midtrans): diamond langsung masuk
Pembeli memilih **⚡ Bayar otomatis** → halaman bayar Midtrans (semua metode yang aktif di akun Midtrans-mu: QRIS, VA bank, GoPay, dll.) → begitu lunas, Midtrans mengabari server situs (`/api/bayar/notifikasi`) dan **Diamond / VIP (Rp25.000) / VVIP (Rp50.000) / EXP / donasi (nominal bebas, min. Rp5.000) masuk sendiri dalam beberapa detik**. Tidak dibayar dalam 60 menit → batal sendiri. Uang masuk ke saldo Midtrans, lalu dicairkan ke rekeningmu (biaya Midtrans ± 0,7% QRIS, ± Rp4.000 per VA).

Keamanan: harga dihitung server dari `paket.js` (bukan dari browser), notifikasi dicek tanda tangan SHA-512 Midtrans, nominal dicocokkan, dan setiap pesanan hanya bisa dilunasi **sekali** (notifikasi ganda tidak dobel).

**Pasang (sekali saja, ±20 menit):**
1. **Daftar Midtrans** di <https://dashboard.midtrans.com/register>. Mulai di mode **Sandbox** (uang mainan) untuk mencoba. Untuk uang sungguhan, lengkapi verifikasi bisnis (KTP + rekening) lalu pindah ke **Production**
2. Midtrans → **Settings → Access Keys** → salin **Server Key** (`SB-Mid-server-…` di Sandbox)
3. Firebase Console → ⚙️ **Project settings → Service accounts → Database secrets** → **Show** → salin secret-nya
4. Cloudflare → **Workers & Pages → pt-mencari-cinta-sejati → Settings → Variables and Secrets** → tambahkan (tipe **Secret** untuk yang rahasia):

   | Nama | Isi |
   |---|---|
   | `MIDTRANS_SERVER_KEY` | Server Key dari langkah 2 (Secret) |
   | `MIDTRANS_PRODUCTION` | `false` untuk Sandbox, `true` untuk uang sungguhan |
   | `FIREBASE_DB_SECRET` | secret dari langkah 3 (Secret) |
   | `FIREBASE_DB_URL` | `databaseURL` dari `config.js` |
   | `FIREBASE_API_KEY` | `apiKey` dari `config.js` |
5. Midtrans → **Settings → Payment → Notification URL** → isi `https://<situsmu>/api/bayar/notifikasi` (mis. `https://jodohonline.company/api/bayar/notifikasi`), simpan
6. Cloudflare → **Deployments** → deployment terbaru → **Retry deployment** (variabel baru baru terpakai setelah deploy ulang). Tombol **⚡ Bayar otomatis** muncul sendiri begitu server siap; cek di `https://<situsmu>/api/bayar/status` (harus `"aktif": true`). Tidak perlu mengubah `config.js`
7. Coba beli Diamond di kantor → pilih ⚡ Bayar otomatis → di Sandbox bayar pakai simulator <https://simulator.sandbox.midtrans.com> → diamond masuk sendiri

**Jangan pernah** menaruh Server Key atau Database secret di `config.js` / GitHub. Keduanya hanya di variabel Cloudflare. Pembayaran otomatis hanya jalan di situs online (bukan mode offline).

### 🎙️ Pesan suara & 📞 telepon
- **Pesan suara** di obrolan pribadi: tombol 🎤, maks. 30 detik. Audio disimpan terpisah (`suaraDm`) dan baru diunduh saat diputar; dihapus otomatis setelah 7 hari.
- **Telepon suara** khusus pasangan yang **saling match** (tombol 📞 di profil & obrolan). WebRTC langsung antar-perangkat, tidak direkam, maks. 30 menit.
- **Server TURN** (agar telepon tetap tersambung di data seluler), pilih salah satu dan isi di Cloudflare Pages → Settings → Variables and Secrets (tipe Secret), lalu deploy ulang:
  - **Metered Open Relay** (gratis 20 GB/bulan, tanpa kartu): daftar di https://www.metered.ca/tools/openrelay/ → isi `METERED_APP` (nama aplikasi, bagian depan `<nama>.metered.live`) dan `METERED_API_KEY`.
  - **Cloudflare Realtime** (gratis 1.000 GB/bulan, perlu metode pembayaran): `TURN_KEY_ID` dan `TURN_KEY_API_TOKEN`.
  - Tanpa itu, telepon tetap jalan lewat STUN (umumnya lancar di WiFi).

### 💠 Diamond & Lemari Diamond
- Paket Diamond diatur di `paket.js` → `diamond` (bawaan 50/110/300/650 Diamond, Rp5rb–50rb)
- Barang khusus Diamond (outfit: Jas Pengantin, Hoodie Hati, Jaket Varsity; aksesoris: kacamata hati, balon hati, topi pesta) diatur di `js/common.js` (`dm` = harga)
- **Sekali saja (dan setiap mengubah harga):** Dashboard → Toko & Pesanan → **Terbitkan harga barang Diamond**. Harga di database inilah yang dipakai server untuk memotong diamond
- Membeli barang dikunci server: diamond terpotong persis sebesar harga dan barang tercatat dalam satu transaksi. Saldo diamond hanya bisa ditambah Direktur

### Kartu Eksekutif & EXP (dibayar dengan uang)
- Paket diatur di `paket.js` → `toko` (bawaan: Kartu Eksekutif 30 hari Rp5.000, 100/300/1.000 EXP)
- **Kartu Eksekutif** membuka: lihat *siapa* yang menyukaimu, Lounge Eksekutif (lewat lift lobi), Setelan Emas, Mahkota Emas, Halo, nama emas 💎, dan ajakan ngobrol yang menonjol

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
vendor/               three.js (pustaka 3D) disimpan lokal
jalankan-offline.*    peluncur offline (.bat Windows, .ps1 server, .sh Mac/Linux)
idcard/               generator Kartu Tamu
js/db.js              lapisan data: Firebase (online) atau tiruan lokal
js/layanan.js         semua operasi data (chat, undangan, usir, dll.)
js/common.js          tujuan, topik meja, filter kata kasar, utilitas
config.js             ← file yang perlu diubah
paket.js              harga Diamond, Kartu Eksekutif/EXP & batas donasi (dipakai situs + server)
functions/api/bayar/  server pembayaran otomatis (Cloudflare Pages Functions)
server/               kode server: Midtrans, Firebase REST, proses pelunasan
database.rules.json   aturan keamanan Firebase Realtime Database
```

## Menjalankan di komputer (offline)

Bisa dijalankan **tanpa internet dan tanpa Firebase**. Saat dibuka dari `localhost`, situs otomatis memakai mode lokal: data tersimpan di browser itu saja, dan Dashboard Direktur memakai akun demo (`direktur` / `cintasejati`).

**Windows:** klik dua kali **`jalankan-offline.bat`**. Server kecil (PowerShell bawaan Windows, tanpa install apa pun) menyala dan browser terbuka otomatis di `http://localhost:8080/`. Tutup jendela hitamnya untuk berhenti.

**Mac / Linux:** `sh jalankan-offline.sh` lalu buka `http://localhost:8080/` (butuh `python3`).

Alamat yang bisa dibuka:
- `http://localhost:8080/` – beranda
- `http://localhost:8080/kantor/` – kantor 3D (tab kedua = tamu lain, untuk mencoba interaksi)
- `http://localhost:8080/dashboard/` – Dashboard Direktur

Catatan:
- three.js disimpan di `vendor/three.module.js`, jadi kantor 3D tidak perlu internet.
- Tanpa internet, font Google tidak termuat dan diganti font bawaan sistem. Tampilan sedikit berbeda, fungsi tetap sama.
- Mau mengetes versi online (Firebase) dari komputer sendiri? Tambahkan `?online=1` di alamat, misalnya `http://localhost:8080/kantor/?online=1`.
- Data mode offline tidak tercampur dengan data di situs online.

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
5. Domain sendiri: situs ini memakai **jodohonline.company** (Cloudflare Pages → Custom domains). Alamat `pt-mencari-cinta-sejati-bas.pages.dev` tetap jalan sebagai cadangan.

## Kustomisasi cepat

- Nama PT, Instagram, link donasi, kuota, isi mading: `config.js`
- Tujuan, topik meja, status hati, level, outfit & aksesoris: `js/common.js`
- Daftar tugas: `kantor/progres.js` (cari `TUR` dan `HARIAN`)
- Paket toko & link pembayaran: `config.js` → `toko`
- Kalimat NPC, ramalan kopi, harapan air mancur: `kantor/kantor.js` (cari `KALIMAT`, `RAMALAN`, `HARAPAN`)
- Balasan NPC di obrolan pribadi: `kantor/sosial.js` (cari `BOT_KATA`)
