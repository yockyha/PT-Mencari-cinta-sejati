# Video promosi jodohonline (Remotion)

Video vertikal 1080×1920 untuk IG Reels & TikTok @jodohonline.id.

## Alur kerja konten

Setiap video adalah **data timeline** (JSON): klip, foto, teks, elemen ala Instagram/TikTok,
efek suara dan voice-over, masing-masing dengan waktu mulai, durasi, posisi dan animasi.

- **Studio Konten** (halaman Claude, https://claude.ai/artifact/De3q3zdfHstSKTfNTbV1gp) menyimpan
  timeline tiap video di database halaman (`timeline/<idVideo>`) dan menyediakan editor ala CapCut
  (tombol **✂️ Edit video**): pratinjau langsung, timeline seret-tarik, potong, properti, ekspor MP4.
- Komposisi **`VideoData`** (`src/data/VideoData.tsx`) merender timeline itu. Editor Studio dan render
  CLI memakai komponen yang sama, jadi hasilnya identik.
- `src/data/timeline-v1.json` = timeline video #1.

### Membuat video baru (untuk Claude)
1. Rekam klip aplikasi (`rekam-aplikasi.js`), simpan ke `public/klip/`, foto ke `public/foto/`.
2. Susun timeline JSON (lihat `src/data/jenis.ts`), simpan sebagai `src/data/timeline-vN.json`.
3. Terbitkan media baru ke Studio Konten (folder `media/` artifact) dan tulis
   `timeline/vN` + `video/vN` (judul, hook, caption, status) lewat database halaman.
4. Render: `npx remotion render VideoData out/vN.mp4 --props=props.json` dengan
   `props.json` = `{"timeline": <isi timeline>}`, lalu unggah hasilnya sebagai video lembar kerja.

### Revisi dari Studio
Baca `video/<id>.catatan` dan `timeline/<id>` (yang mungkin sudah diedit pemilik), kerjakan,
render ulang, perbarui lembar kerja, isi `dirender` = waktu render bila `mintaRender` ada.

## Isi folder

- `src/data/`: timeline, tipe data, komposisi `VideoData`, penerjemah path aset
- `src/ig/`: tampilan ala Instagram/TikTok (balasan komentar, profil + tombol Ikuti, kolom komentar, browser HP)
- `src/elemen/`, `src/JodohVideo.tsx`: versi pertama video (komposisi `JodohOnline`, bisa diedit di Remotion Studio)
- `src/Cover.tsx`: cover/thumbnail (komposisi diam `Cover`)
- `editor/`: editor ala CapCut untuk Studio Konten. Bundle:
  `npx esbuild editor/Editor.tsx --bundle --minify --format=iife --jsx=automatic --define:process.env.NODE_ENV='"production"' --outfile=editor.js`
- `public/`: rekaman aplikasi, foto, efek suara (ElevenLabs), voice-over, font
- `.claude/skills/`: Remotion Agent Skills resmi & ElevenLabs sound-effects

## Edit & render di komputer sendiri

```bash
npm i
npm run dev                      # Remotion Studio
npx remotion render VideoData out/video.mp4 --license-key=free-license
npx remotion still Cover out/cover.png --license-key=free-license
```

Lisensi Remotion: gratis untuk perorangan dan tim sampai 3 orang.
