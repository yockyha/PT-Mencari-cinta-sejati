# PT Mencari Cinta Sejati 💌

Kantor virtual 3D tempat orang datang sebagai **tamu** untuk **💘 cari jodoh**, **🤝 cari teman**, atau sekadar **💬 curhat**. Pemilik situs memegang kendali sebagai **👑 Direktur Utama**.

## Konsep

| Siapa | Bisa apa |
|---|---|
| **Tamu** | Isi buku tamu (nama, tujuan, status, bio; tanpa password), jalan-jalan, chat umum, ajak ngobrol pribadi, kasih ❤, curhat anonim, lapor & sembunyikan orang |
| **🛡 Staf** (diangkat Direktur) | Semua yang tamu bisa + usir/blokir tamu, hapus chat/papan/curhat, baca laporan & saran |
| **👑 Direktur** (pemilik) | Semua yang staf bisa + pengumuman ke semua orang, ubah mading, buka/tutup kantor, angkat/cabut staf |

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

Semua aturan ini dijaga di server lewat `database.rules.json`, bukan cuma di tampilan.

## Struktur

```
index.html            beranda
kantor/index.html     kantor 3D
kantor/kantor.js      dunia 3D, karakter, gerak, chat, ruangan
kantor/sosial.js      profil, ajak ngobrol, obrolan pribadi, suka & match, curhat
kantor/direktur.js    Ruang & Panel Direktur
kantor/ui.js          alat UI bersama
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
- Panel Direktur bisa dicoba dengan **PIN demo** (`pinDemo` di `config.js`, bawaan `1234`) di Ruang Direktur → *Masuk sebagai Direktur*

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

1. Firebase Console → **Authentication → Users → Add user**: isi email & kata sandi untukmu.
2. Salin **User UID** akun itu.
3. **Realtime Database → Data**: tambahkan node `peran`, lalu di dalamnya kunci `<User UID>` dengan nilai `"direktur"` (pakai tanda kutip).
4. Buka kantor → **👑 Ruang Direktur** → *Masuk sebagai Direktur* → isi email & kata sandi tadi.

Setelah itu tombol **👑 Panel** muncul di pojok kanan atas. Staf diangkat dari Panel → Pengunjung → Tindak → *Angkat jadi Staf*.

## Hosting

Bisa di mana saja yang menyajikan file statis:
- **Cloudflare Pages / Workers**: hubungkan repo ini, build command kosong, output directory `/`.
- **GitHub Pages**: Settings → Pages → Deploy from branch.
- **Netlify / Vercel**: drag-and-drop folder ini.

## Kustomisasi cepat

- Nama PT, Instagram, link donasi, kuota, isi mading: `config.js`
- Tujuan, topik meja, dan status hati: `js/common.js`
- Kalimat NPC, ramalan kopi, harapan air mancur: `kantor/kantor.js` (cari `KALIMAT`, `RAMALAN`, `HARAPAN`)
- Balasan NPC di obrolan pribadi: `kantor/sosial.js` (cari `BOT_KATA`)
