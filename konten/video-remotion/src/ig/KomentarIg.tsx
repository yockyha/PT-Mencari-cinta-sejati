import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {Avatar, Hati, Ketuk, Sensor} from './Ikon';

const WARNA = ['#e1306c', '#5851db', '#f77737', '#2ab27b', '#3a8fd8', '#b06ab3'];
const Baris = ({u, teks, waktu, suka, i, baru, sensor = false}: {readonly u: string; readonly teks: string; readonly waktu: string; readonly suka: number; readonly i: number; readonly baru?: boolean; readonly sensor?: boolean}) => (
  <div style={{display: 'flex', gap: 26, padding: '22px 40px', background: baru ? '#fff8d6' : 'transparent'}}>
    <Sensor aktif={sensor}><Avatar nama={u} ukuran={84} warna={WARNA[i % WARNA.length]} /></Sensor>
    <div style={{flex: 1}}>
      <div style={{fontSize: 32}}><Sensor aktif={sensor}><b style={{fontWeight: 700}}>{u}</b></Sensor> <span style={{color: '#737373'}}>{waktu}</span></div>
      <div style={{fontSize: 40, marginTop: 4}}><Sensor aktif={sensor}>{teks}</Sensor></div>
      <div style={{fontSize: 30, color: '#737373', marginTop: 8, fontWeight: 500}}>Balas</div>
    </div>
    <div style={{textAlign: 'center', color: '#737373', fontSize: 28}}><Hati ukuran={38} />{suka ? <div><Sensor aktif={sensor}>{suka}</Sensor></div> : null}</div>
  </div>
);

// Lembar komentar gaya Instagram. "komentar": baris "user|teks|waktu|suka" dipisah baris baru.
// Kata `ketik` diketik di kolom bawah mulai `ketikDetik`, lalu terkirim dan muncul paling atas.
const KomentarIgInner = ({komentar, ketik, ketikDetik, akunSaya, sensor, style}: {
  readonly komentar: string; readonly ketik: string; readonly ketikDetik: number; readonly akunSaya: string; readonly sensor: boolean; readonly style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const n = Math.max(0, Math.min(ketik.length, Math.floor((t - ketikDetik) * 9)));
  const kirimT = ketikDetik + ketik.length / 9 + 0.35;
  const terkirim = t >= kirimT;
  const daftar = komentar.split('\n').filter(Boolean).map(b => b.split('|'));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 1240,
        background: 'white',
        borderRadius: '44px 44px 0 0',
        fontFamily: IG,
        color: '#000',
        overflow: 'hidden',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.35)',
        translate: interpolate(frame, [0, 0.35 * fps], ['0px 1300px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
        ...style,
      }}
    >
      <div style={{width: 110, height: 10, borderRadius: 9, background: '#dbdbdb', margin: '22px auto 10px'}} />
      <div style={{textAlign: 'center', fontSize: 40, fontWeight: 700, paddingBottom: 20, borderBottom: '2px solid #efefef'}}>Komentar</div>
      <div style={{opacity: 1}}>
        {terkirim ? (
          <div style={{opacity: interpolate(t, [kirimT, kirimT + 0.2], [0, 1], {extrapolateRight: 'clamp'})}}>
            <Baris u={akunSaya} teks={ketik} waktu="Baru saja" suka={0} i={5} baru />
          </div>
        ) : null}
        {daftar.map(([u, teks, waktu, suka], i) => <Baris key={u + i} u={u} teks={teks} waktu={waktu} suka={Number(suka) || 0} i={i} sensor={sensor} />)}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, background: 'white', borderTop: '2px solid #efefef', padding: '24px 34px 60px', display: 'flex', alignItems: 'center', gap: 24}}>
        <Avatar nama={akunSaya} ukuran={84} warna={WARNA[5]} />
        <div style={{flex: 1, border: '2px solid #dbdbdb', borderRadius: 999, padding: '22px 34px', fontSize: 38, color: n && !terkirim ? '#000' : '#737373', display: 'flex', justifyContent: 'space-between'}}>
          <span>{n && !terkirim ? ketik.slice(0, n) + (frame % 16 < 8 ? '|' : '') : 'Tambahkan komentar…'}</span>
          {n === ketik.length && !terkirim ? <b style={{color: '#0095f6'}}>Kirim</b> : null}
        </div>
      </div>
      <Ketuk x={950} y={1110} kemajuan={(t - (kirimT - 0.15)) / 0.4} />
    </div>
  );
};
export const KomentarIg = Interactive.create({
  Component: KomentarIgInner,
  layout: 'none',
  schema: {
    komentar: {type: 'string', default: 'dimas.p|DAFTAR|1m|2\nnadia.r|DAFTAR 🙋‍♀️|3m|5\nayu.ln|daftar kak, cari teman curhat|5m|1', description: 'Komentar (user|teks|waktu|suka per baris)'},
    ketik: {type: 'string', default: 'DAFTAR', description: 'Yang diketik penonton'},
    ketikDetik: {type: 'number', hiddenFromList: false, default: 0.5, min: 0, step: 0.1, description: 'Mulai mengetik (detik)'},
    akunSaya: {type: 'string', default: 'kamu', description: 'Nama pengetik'},
    sensor: {type: 'boolean', default: true, description: 'Sensor komentar orang lain'},
  },
});
