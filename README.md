# PT Mencari Cinta Sejati 💌

Kantor virtual 3D untuk para pencari cinta. *Kantor tanpa gaji, bonusnya jodoh.*

Pengunjung bisa:
- **Masuk kantor virtual** (`/kantor/`): jalan-jalan di dunia 3D, ngobrol lewat chat dan gelembung kata, duduk di kursi, dan mengetuk karyawan lain untuk melihat profilnya.
  - **Lobi**: resepsionis, mading HRD, lift (hiasan)
  - **Area Kerja**: 8 meja divisi (Divisi PDKT, HRD *Hati Rindu Dia*, Divisi Overthinking, dan lainnya), printer untuk ID Card
  - **Pantry**: Mesin Kopi Jodoh yang memberi ramalan dan saran teman ngopi
  - **Ruang Rapat Perasaan**: papan tulis bersama yang bisa ditulisi semua orang
  - **Dinding Karyawan**: nama semua karyawan yang sudah mendaftar, bisa dicari
  - **Taman Curhat**: air mancur hati untuk melempar koin harapan
  - **Ruang Loker**: ganti kulit, baju, celana, rambut, dan aksesoris
  - Langit mengikuti jam WIB (pagi, senja, malam)
- **Buat ID Card karyawan** (`/idcard/`): kartu PNG dengan nomor karyawan, NIK, dan barcode, siap dibagikan ke story. Foto hanya diproses di browser dan tidak diunggah.

Tidak ada password. Identitas cukup nama panggilan (username IG opsional, hanya untuk ditampilkan).

## Struktur

```
index.html          beranda
kantor/             kantor 3D (three.js dari CDN)
idcard/             generator ID card
js/common.js        utilitas, daftar divisi, filter kata kasar
js/net.js           jaringan: Firebase (online) atau lokal
config.js           ← satu-satunya file yang perlu diubah
database.rules.json aturan keamanan Firebase Realtime Database
```

Situs ini statis: tidak ada build step dan tidak ada server.

## Menjalankan di komputer

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

Harus lewat server, bukan dibuka sebagai `file://`, karena halaman memakai ES module.

## Mode lokal vs online

Selama `firebase: null` di `config.js`, situs berjalan dalam **mode lokal**:
- kantor diisi 7 karyawan NPC yang berkeliling, duduk, dan bicara
- tab lain di browser yang sama ikut terlihat (lewat BroadcastChannel)
- papan rapat dan dinding karyawan disimpan di browser masing-masing

### Mengaktifkan mode online (multiplayer)

1. Buat proyek di <https://console.firebase.google.com>.
2. **Build → Authentication → Sign-in method** → aktifkan **Anonymous**.
3. **Build → Realtime Database** → buat database (pilih lokasi Singapura `asia-southeast1`).
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

## Hosting

Bisa di mana saja yang menyajikan file statis:
- **Cloudflare Pages / Workers**: hubungkan repo ini, build command kosong, output directory `/`.
- **GitHub Pages**: Settings → Pages → Deploy from branch.
- **Netlify / Vercel**: drag-and-drop folder ini.

## Kustomisasi cepat

- Nama PT, Instagram, link donasi, kuota, isi mading: `config.js`
- Daftar divisi dan status hati: `js/common.js`
- Kalimat NPC, ramalan kopi, harapan air mancur: `kantor/kantor.js` (cari `KALIMAT`, `RAMALAN`, `HARAPAN`)
