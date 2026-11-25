# Video promosi jodohonline (Remotion)

Video vertikal 1080×1920, 55,5 detik, mengikuti voice-over `public/vo.mp3`.

## Isi

- `public/klip/`: rekaman layar asli aplikasi (kantor 3D, chat, loker, game, formulir)
- `public/foto/`: screenshot asli aplikasi & beranda situs
- `src/JodohVideo.tsx`: urutan 13 adegan, subtitle, efek suara
- `src/ig/`: tampilan ala Instagram/TikTok (balasan komentar, profil + tombol Ikuti, kolom komentar "DAFTAR", browser HP)
- `src/elemen/`: judul, subtitle, cap, chip, klip
- `.claude/skills/`: Remotion Agent Skills resmi (github.com/remotion-dev/skills)

## Edit & render

```bash
npm i
npm run dev                      # buka Remotion Studio, edit teks/waktu langsung
npx remotion render JodohOnline out/jodohonline.mp4 --license-key=free-license
```

Sebelum posting, ganti angka `postingan`, `pengikut`, `mengikuti` di komponen `ProfilIg`
(adegan 11 & 13) dengan angka asli akun @jodohonline.id, dan ganti komentar contoh di
`KomentarIg` dengan komentar asli begitu sudah ada.

Lisensi Remotion: gratis untuk perorangan dan tim sampai 3 orang.
