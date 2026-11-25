import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile, Track} from 'remotion';
import './fontStudio';
import {Foto, Rekaman} from './elemen/Klip';
import {Akun, Cap, Chips, Judul, Stiker, Sub} from './elemen/Teks';
import {BalasKomentar} from './ig/BalasKomentar';
import {Browser} from './ig/Browser';
import {KomentarIg} from './ig/KomentarIg';
import {ProfilIg} from './ig/ProfilIg';

// Video promosi jodohonline: 13 adegan mengikuti voice-over (vo.mp3, 55,5 detik).
// Waktu adegan dalam frame (30 fps) sesuai jeda di voice-over.
const ATAS = {top: 330};
const BAWAH = {top: 1330};

export const JodohVideo = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      <Track name="Adegan">
        <Sequence name="1 Hook: balasan komentar" from={0} durationInFrames={120}>
          <Rekaman name="Rekaman drone kantor" src="klip/drone.mp4" mulai={0} kecepatan={1} />
          <BalasKomentar name="Stiker balasan komentar" from={9} durationInFrames={111} pengguna="nadia.r" komentar="ini web apa sih? kok bisa jalan-jalan di kantor 😭" sensor />
          <Sub name="Sub 1a" from={0} durationInFrames={45} teks="Ada *kantor* yang isinya" />
          <Sub name="Sub 1b" from={45} durationInFrames={45} teks="orang-orang lagi *cari jodoh.*" />
          <Sub name="Sub 1c" from={90} durationInFrames={30} teks="*Serius.*" />
        </Sequence>
        <Sequence name="2 Buka dari HP" from={120} durationInFrames={168}>
          <Browser name="Browser HP" from={0} durationInFrames={66} alamat="jodohonline.company" halaman="foto/beranda.png" />
          <Rekaman name="Rekaman jalan di kantor" from={66} durationInFrames={102} src="klip/jalan.mp4" mulai={0} kecepatan={1} />
          <Sub name="Sub 2a" from={0} durationInFrames={66} teks="Namanya *jodohonline.*" style={BAWAH} />
          <Sub name="Sub 2b" from={66} durationInFrames={69} teks="Kantor 3D, buka dari *HP*," />
          <Sub name="Sub 2c" from={135} durationInFrames={33} teks="gak perlu *download.*" />
        </Sequence>
        <Sequence name="3 Tujuan" from={288} durationInFrames={105}>
          <Foto name="Meja nongkrong" src="foto/meja.png" zoom={1.1} />
          <Judul name="Judul tujuan" from={0} durationInFrames={105} teks="Datang buat apa?" kecil="" />
          <Chips name="Chip jodoh" from={6} durationInFrames={30} daftar="💘 CARI JODOH|🤝 CARI TEMAN|💬 MAU CURHAT" nyala="0" />
          <Chips name="Chip teman" from={36} durationInFrames={24} daftar="💘 CARI JODOH|🤝 CARI TEMAN|💬 MAU CURHAT" nyala="0,1" />
          <Chips name="Chip curhat" from={60} durationInFrames={45} daftar="💘 CARI JODOH|🤝 CARI TEMAN|💬 MAU CURHAT" nyala="0,1,2" />
          <Sub name="Sub 3a" from={0} durationInFrames={36} teks="Mau cari *jodoh,*" />
          <Sub name="Sub 3b" from={36} durationInFrames={24} teks="cari *teman,*" />
          <Sub name="Sub 3c" from={60} durationInFrames={45} teks="atau pengen *curhat?*" />
        </Sequence>
        <Sequence name="4 Karakter & loker" from={393} durationInFrames={162}>
          <Foto name="Karakter" from={0} durationInFrames={30} src="foto/karakter.png" zoom={1.06} />
          <Rekaman name="Rekaman ganti outfit" from={30} durationInFrames={132} src="klip/loker.mp4" mulai={0} kecepatan={1} />
          <Sub name="Sub 4a" from={0} durationInFrames={60} teks="Masuk pakai *karakter sendiri.*" style={ATAS} />
          <Sub name="Sub 4b" from={60} durationInFrames={102} teks="Rambut, baju, aksesoris, *bebas!*" style={ATAS} />
        </Sequence>
        <Sequence name="5 Ruangan" from={555} durationInFrames={144}>
          <Rekaman name="Kafe Jodoh" from={0} durationInFrames={33} src="klip/r_kafe.mp4" mulai={0} kecepatan={1} />
          <Rekaman name="Meja Nongkrong" from={33} durationInFrames={36} src="klip/r_meja.mp4" mulai={0} kecepatan={1} />
          <Rekaman name="Taman Curhat" from={69} durationInFrames={33} src="klip/r_taman.mp4" mulai={0} kecepatan={1} />
          <Rekaman name="Lounge" from={102} durationInFrames={42} src="klip/r_lounge.mp4" mulai={0} kecepatan={1} />
          <Chips name="Chip kafe" from={0} durationInFrames={33} daftar="KAFE JODOH|MEJA NONGKRONG|TAMAN CURHAT|LOUNGE 💎" nyala="0" style={ATAS} />
          <Chips name="Chip meja" from={33} durationInFrames={36} daftar="KAFE JODOH|MEJA NONGKRONG|TAMAN CURHAT|LOUNGE 💎" nyala="1" style={ATAS} />
          <Chips name="Chip taman" from={69} durationInFrames={33} daftar="KAFE JODOH|MEJA NONGKRONG|TAMAN CURHAT|LOUNGE 💎" nyala="2" style={ATAS} />
          <Chips name="Chip lounge" from={102} durationInFrames={42} daftar="KAFE JODOH|MEJA NONGKRONG|TAMAN CURHAT|LOUNGE 💎" nyala="3" style={ATAS} />
          <Sub name="Sub 5a" from={0} durationInFrames={33} teks="*Kafe Jodoh,*" />
          <Sub name="Sub 5b" from={33} durationInFrames={36} teks="*Meja Nongkrong,*" />
          <Sub name="Sub 5c" from={69} durationInFrames={33} teks="*Taman Curhat,*" />
          <Sub name="Sub 5d" from={102} durationInFrames={42} teks="sampai *Lounge Eksekutif!*" />
        </Sequence>
        <Sequence name="6 Ngobrol & match" from={699} durationInFrames={90}>
          <Rekaman name="Rekaman chat" src="klip/chat.mp4" mulai={0.5} kecepatan={1} />
          <Stiker name="Stiker match" from={64} durationInFrames={26} teks="IT'S A MATCH 💘" />
          <Sub name="Sub 6a" from={0} durationInFrames={64} teks="Ngobrol, saling suka…" />
          <Sub name="Sub 6b" from={64} durationInFrames={26} teks="*MATCH!*" />
        </Sequence>
        <Sequence name="7 Tugas, game, level" from={789} durationInFrames={106}>
          <Foto name="Daftar tugas" from={0} durationInFrames={36} src="foto/tugas.png" zoom={1.04} />
          <Rekaman name="Rekaman game" from={36} durationInFrames={37} src="klip/game.mp4" mulai={2.7} kecepatan={1} />
          <Foto name="Naik level" from={73} durationInFrames={33} src="foto/levelup.png" zoom={1.05} />
          <Sub name="Sub 7a" from={0} durationInFrames={36} teks="Kerjain *tugas,*" style={BAWAH} />
          <Sub name="Sub 7b" from={36} durationInFrames={37} teks="main game *Tangkap Hati,*" style={BAWAH} />
          <Sub name="Sub 7c" from={73} durationInFrames={33} teks="*naik level!*" style={BAWAH} />
        </Sequence>
        <Sequence name="8 Outfit spesial" from={895} durationInFrames={98}>
          <Foto name="Toko diamond" src="foto/toko.png" zoom={1.06} />
          <Sub name="Sub 8a" from={0} durationInFrames={57} teks="Jas pengantin, *hoodie hati,*" style={BAWAH} />
          <Sub name="Sub 8b" from={57} durationInFrames={41} teks="*balon hati…*" style={BAWAH} />
        </Sequence>
        <Sequence name="9 Acara" from={993} durationInFrames={66}>
          <Foto name="Ruang rapat" src="foto/rapat.png" zoom={1.08} />
          <Judul name="Judul acara" from={0} durationInFrames={66} teks="Acara bareng" kecil="Direktur" />
          <Sub name="Sub 9" from={0} durationInFrames={66} teks="Plus *acara seru* bareng Direktur." />
        </Sequence>
        <Sequence name="10 Tapi gak bisa asal masuk" from={1059} durationInFrames={135}>
          <Rekaman name="Rekaman Direktur" src="klip/direktur.mp4" mulai={0} kecepatan={0.78} />
          <Judul name="Judul tapi" from={0} durationInFrames={135} teks="Tapi…" kecil="gak bisa asal masuk" />
          <Cap name="Cap belum di-ACC" from={78} durationInFrames={57} teks="BELUM DI-ACC" warna="#e23b3b" style={{top: 1010}} />
          <Sub name="Sub 10a" from={0} durationInFrames={78} teks="Tapi… *gak bisa asal masuk.*" />
          <Sub name="Sub 10b" from={78} durationInFrames={57} teks="Harus *di-ACC Direktur* dulu." />
        </Sequence>
        <Sequence name="11 Syarat: follow, komen, formulir" from={1194} durationInFrames={258}>
          <Foto name="Air mancur" from={0} durationInFrames={33} src="foto/airmancur.png" zoom={1.1} />
          <Judul name="Judul syarat" from={0} durationInFrames={33} teks="Syarat wajib" kecil="" />
          <ProfilIg name="Profil IG (follow)" from={33} durationInFrames={66} akun="jodohonline.company" nama="jodohonline 💘" bio={'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑'} tautan="jodohonline.company" postingan="1" pengikut={0} mengikuti="0" ketukDetik={1.1} sensor />
          <Rekaman name="Reels di balik komentar" from={99} durationInFrames={66} src="klip/drone.mp4" mulai={2.5} kecepatan={0.6} style={{filter: 'brightness(0.55)'}} />
          <KomentarIg name="Komentar IG (DAFTAR)" from={99} durationInFrames={66} komentar={'dimas.p|DAFTAR|1m|2\nnadia.r|DAFTAR 🙋‍♀️|3m|5\nayu.ln|daftar kak, cari teman curhat|5m|1\nraka|DAFTAR|8m|0'} ketik="DAFTAR" ketikDetik={0.3} akunSaya="kamu" sensor />
          <Rekaman name="Rekaman isi formulir" from={165} durationInFrames={93} src="klip/formulir.mp4" mulai={3.3} kecepatan={1} />
          <Sub name="Sub 11a" from={0} durationInFrames={33} teks="*Syaratnya:*" />
          <Sub name="Sub 11b" from={33} durationInFrames={66} teks="*Follow* @jodohonline.company," style={BAWAH} />
          <Sub name="Sub 11c" from={99} durationInFrames={66} teks={'komen *"DAFTAR"* di video ini,'} style={ATAS} />
          <Sub name="Sub 11d" from={165} durationInFrames={93} teks="isi formulir di *jodohonline.company*" style={BAWAH} />
        </Sequence>
        <Sequence name="12 Di-ACC" from={1452} durationInFrames={76}>
          <Rekaman name="Rekaman kirim formulir" src="klip/formulir.mp4" mulai={6.9} kecepatan={1} />
          <Cap name="Cap di-ACC" from={48} durationInFrames={28} teks="DI-ACC ✓" warna="#1f9d55" style={{left: 'auto', right: 150, top: 520}} />
          <Sub name="Sub 12a" from={0} durationInFrames={48} teks="Udah follow & komen?" style={BAWAH} />
          <Sub name="Sub 12b" from={48} durationInFrames={28} teks="*Di-ACC!*" style={BAWAH} />
        </Sequence>
        <Sequence name="13 Penutup: follow" from={1528} durationInFrames={137}>
          <ProfilIg name="Profil IG (penutup)" akun="jodohonline.company" nama="jodohonline 💘" bio={'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑'} tautan="jodohonline.company" postingan="1" pengikut={0} mengikuti="0" ketukDetik={3.05} sensor />
          <Sub name="Sub 13a" from={0} durationInFrames={92} teks="Gak follow, gak komen, *gak di-ACC.*" style={BAWAH} />
          <Sub name="Sub 13b" from={92} durationInFrames={45} teks="*Follow sekarang!*" style={BAWAH} />
        </Sequence>
      </Track>
      <Track name="Nama akun">
        <Akun name="Nama akun (awal)" from={0} durationInFrames={120} teks="@jodohonline.company" />
        <Akun name="Nama akun (kantor)" from={186} durationInFrames={1041} teks="@jodohonline.company" />
        <Akun name="Nama akun (formulir)" from={1359} durationInFrames={169} teks="@jodohonline.company" />
      </Track>
      <Audio name="Voice-over" src={staticFile('vo.mp3')} />
      <Track name="Efek suara">
        <Audio name="Pop stiker balasan" from={9} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.35} />
        <Audio name="Whoosh ke browser" from={117} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Ketik alamat" from={121} durationInFrames={30} src={staticFile('sfx/ketik.mp3')} volume={1.0} />
        <Audio name="Whoosh ke kantor" from={184} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Whoosh tujuan" from={286} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Pop chip jodoh" from={294} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.3} />
        <Audio name="Pop chip teman" from={324} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.3} />
        <Audio name="Pop chip curhat" from={348} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.3} />
        <Audio name="Whoosh karakter" from={391} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Ketuk outfit 1" from={441} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.35} />
        <Audio name="Ketuk outfit 2" from={465} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.35} />
        <Audio name="Ketuk outfit 3" from={489} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.35} />
        <Audio name="Ketuk tab aksesoris" from={513} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.35} />
        <Audio name="Ketuk balon hati" from={527} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.35} />
        <Audio name="Whoosh kafe" from={553} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Whoosh meja" from={586} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.22} />
        <Audio name="Whoosh taman" from={622} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.22} />
        <Audio name="Whoosh lounge" from={655} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.22} />
        <Audio name="Ketik chat" from={699} durationInFrames={45} src={staticFile('sfx/ketik.mp3')} volume={1.0} />
        <Audio name="Notif chat terkirim" from={761} durationInFrames={22} src={staticFile('sfx/notif.mp3')} volume={0.3} />
        <Audio name="Kilau match" from={763} durationInFrames={28} src={staticFile('sfx/match.mp3')} volume={0.8} />
        <Audio name="Whoosh tugas" from={787} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Whoosh game" from={823} durationInFrames={15} src={staticFile('sfx/whoosh.mp3')} volume={0.22} />
        <Audio name="Level up" from={862} durationInFrames={33} src={staticFile('sfx/levelup.mp3')} volume={0.3} />
        <Audio name="Whoosh outfit spesial" from={893} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Pop diamond" from={900} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.25} />
        <Audio name="Whoosh acara" from={991} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Rem Tapi" from={1059} durationInFrames={24} src={staticFile('sfx/rem.mp3')} volume={0.25} />
        <Audio name="Cap merah" from={1137} durationInFrames={18} src={staticFile('sfx/cap.mp3')} volume={0.45} />
        <Audio name="Whoosh syarat" from={1192} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Geser profil" from={1227} durationInFrames={18} src={staticFile('sfx/geser.mp3')} volume={0.8} />
        <Audio name="Ketuk Ikuti" from={1259} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.45} />
        <Audio name="Notif mengikuti" from={1262} durationInFrames={22} src={staticFile('sfx/notif.mp3')} volume={0.3} />
        <Audio name="Geser komentar" from={1293} durationInFrames={18} src={staticFile('sfx/geser.mp3')} volume={0.8} />
        <Audio name="Ketik DAFTAR" from={1302} durationInFrames={24} src={staticFile('sfx/ketik.mp3')} volume={1.0} />
        <Audio name="Ketuk kirim" from={1328} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.45} />
        <Audio name="Pop komentar masuk" from={1333} durationInFrames={15} src={staticFile('sfx/pop.mp3')} volume={0.3} />
        <Audio name="Whoosh formulir" from={1357} durationInFrames={18} src={staticFile('sfx/whoosh.mp3')} volume={0.3} />
        <Audio name="Ketik username" from={1380} durationInFrames={40} src={staticFile('sfx/ketik.mp3')} volume={1.0} />
        <Audio name="Ketuk centang 1" from={1465} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.4} />
        <Audio name="Ketuk centang 2" from={1471} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.4} />
        <Audio name="Ketuk kirim formulir" from={1481} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.45} />
        <Audio name="Notif terkirim" from={1484} durationInFrames={22} src={staticFile('sfx/notif.mp3')} volume={0.3} />
        <Audio name="Cap hijau" from={1500} durationInFrames={18} src={staticFile('sfx/cap.mp3')} volume={0.45} />
        <Audio name="Geser profil penutup" from={1528} durationInFrames={18} src={staticFile('sfx/geser.mp3')} volume={0.8} />
        <Audio name="Ketuk Ikuti penutup" from={1619} durationInFrames={12} src={staticFile('sfx/ketuk.mp3')} volume={0.45} />
        <Audio name="Notif penutup" from={1622} durationInFrames={25} src={staticFile('sfx/notif.mp3')} volume={0.3} />
      </Track>
    </AbsoluteFill>
  );
};
