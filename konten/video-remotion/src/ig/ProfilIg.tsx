import type {CSSProperties} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Interactive, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {Avatar, Ketuk, Sensor} from './Ikon';

// Halaman profil gaya Instagram (tema terang). Tombol Ikuti diketuk pada detik `ketukDetik`.
const ProfilIgInner = ({akun, nama, bio, tautan, postingan, pengikut, mengikuti, ketukDetik, sensor, style}: {
  readonly akun: string; readonly nama: string; readonly bio: string; readonly tautan: string;
  readonly postingan: string; readonly pengikut: number; readonly mengikuti: string; readonly ketukDetik: number; readonly sensor: boolean; readonly style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sudah = frame >= ketukDetik * fps;
  const stat = (n: string | number, l: string) => (
    <div style={{textAlign: 'center'}}><div style={{fontSize: 44, fontWeight: 700}}><Sensor aktif={sensor}>{n}</Sensor></div><div style={{fontSize: 34}}>{l}</div></div>
  );
  const kisi = ['foto/halaman.png', 'foto/meja.png', 'foto/karakter.png', 'foto/rapat.png', 'foto/toko.png', 'foto/airmancur.png'];
  return (
    <AbsoluteFill
      style={{
        background: 'white',
        fontFamily: IG,
        color: '#000',
        translate: interpolate(frame, [0, 0.35 * fps], ['0px 1920px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
        ...style,
      }}
    >
      <div style={{height: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 44px 10px', fontSize: 34, fontWeight: 500}}><span>11.00</span><span>●●● 5G ▮</span></div>
      <div style={{display: 'flex', alignItems: 'center', gap: 28, padding: '20px 40px', fontSize: 48, fontWeight: 700}}><span style={{fontSize: 56}}>‹</span>{akun}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 50, padding: '20px 40px'}}>
        <div style={{padding: 8, borderRadius: '50%', background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf)'}}>
          <div style={{padding: 6, borderRadius: '50%', background: 'white'}}><Avatar nama={akun} ukuran={190} warna="#ff4f7b" /></div>
        </div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'space-around'}}>
          {stat(postingan, 'postingan')}{stat((pengikut + (sudah ? 1 : 0)).toLocaleString('id-ID'), 'pengikut')}{stat(mengikuti, 'mengikuti')}
        </div>
      </div>
      <div style={{padding: '0 40px', fontSize: 38, lineHeight: 1.35}}>
        <div style={{fontWeight: 700}}>{nama}</div>
        <div style={{whiteSpace: 'pre-line'}}>{bio}</div>
        <div style={{color: '#00376b', fontWeight: 500}}>🔗 {tautan}</div>
      </div>
      <div style={{display: 'flex', gap: 18, padding: '34px 40px'}}>
        <div style={{flex: 1, textAlign: 'center', borderRadius: 18, padding: '22px 0', fontSize: 38, fontWeight: 700, background: sudah ? '#efefef' : '#0095f6', color: sudah ? '#000' : 'white'}}>{sudah ? 'Mengikuti ⌄' : 'Ikuti'}</div>
        <div style={{flex: 1, textAlign: 'center', borderRadius: 18, padding: '22px 0', fontSize: 38, fontWeight: 700, background: '#efefef'}}>Kirim pesan</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginTop: 20}}>
        {kisi.map(k => <Img key={k} src={staticFile(k)} style={{width: '100%', aspectRatio: '3/4', objectFit: 'cover'}} />)}
      </div>
      <Ketuk x={290} y={735} kemajuan={(frame - ketukDetik * fps + 4) / (0.4 * fps)} />
    </AbsoluteFill>
  );
};
export const ProfilIg = Interactive.create({
  Component: ProfilIgInner,
  layout: 'none',
  schema: {
    akun: {type: 'string', default: 'jodohonline.id', description: 'Username'},
    nama: {type: 'string', default: 'jodohonline 💘', description: 'Nama'},
    bio: {type: 'string', default: 'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑', description: 'Bio'},
    tautan: {type: 'string', default: 'jodohonline.company', description: 'Tautan bio'},
    postingan: {type: 'string', default: '1', description: 'Jumlah postingan (isi angka asli)'},
    pengikut: {type: 'number', hiddenFromList: false, default: 0, min: 0, integer: true, description: 'Jumlah pengikut (isi angka asli)'},
    mengikuti: {type: 'string', default: '0', description: 'Jumlah mengikuti (isi angka asli)'},
    sensor: {type: 'boolean', default: true, description: 'Sensor angka'},
    ketukDetik: {type: 'number', hiddenFromList: false, default: 1.1, min: 0, step: 0.1, description: 'Detik tombol Ikuti diketuk'},
  },
});
