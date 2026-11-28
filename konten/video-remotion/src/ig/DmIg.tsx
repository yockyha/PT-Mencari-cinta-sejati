import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {Avatar, Sensor} from './Ikon';

const WARNA = ['#e1306c', '#5851db', '#f77737', '#2ab27b', '#3a8fd8', '#b06ab3'];
const klamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const muncul = (f: number, fps: number) => ({
  opacity: interpolate(f, [0, 0.08 * fps], [0, 1], klamp),
  scale: String(interpolate(f, [0, 0.22 * fps], [0.6, 1], {...klamp, easing: Easing.spring({damping: 13})})),
});

const Panah = () => (
  <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
);
const Telepon = () => (
  <svg width={50} height={50} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={1.8} strokeLinejoin="round"><path d="M5 4h3.5l1.5 4.5-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
const Kamera = () => (
  <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={1.8} strokeLinejoin="round"><rect x="2.5" y="6" width="13" height="12" rx="3" /><path d="M15.5 10.5l6-3.5v10l-6-3.5z" /></svg>
);
const Tulis = () => (
  <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={1.8} strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg>
);

// Kotak masuk DM Instagram: obrolan baru masuk satu per satu dari atas.
// "pesan": baris "user|teks|waktu" dipisah baris baru; muncul tiap `jeda` detik.
const KotakDmInner = ({akun, pesan, jeda, sensor, style}: {readonly akun: string; readonly pesan: string; readonly jeda: number; readonly sensor: boolean; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const daftar = pesan.split('\n').filter(Boolean).map((b) => b.split('|'));
  const masuk = daftar.filter((_, i) => frame >= i * jeda * fps).length;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'white', fontFamily: IG, color: '#000', ...style}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 26, padding: '120px 44px 30px'}}>
        <Panah />
        <div style={{flex: 1, fontSize: 50, fontWeight: 700}}>{akun} <span style={{fontSize: 34}}>⌄</span></div>
        <Tulis />
      </div>
      <div style={{margin: '0 44px 30px', background: '#efefef', borderRadius: 22, padding: '20px 30px', fontSize: 36, color: '#737373'}}>🔍 Cari</div>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 44px 22px', fontSize: 38, fontWeight: 700}}>
        <span>Pesan</span>
        <span style={{color: '#0095f6'}}>Permintaan ({Math.max(0, masuk)})</span>
      </div>
      {daftar.map(([u, teks, waktu], i) => {
        const f = frame - i * jeda * fps;
        if (f < 0) return null;
        // obrolan terbaru selalu paling atas: posisi = jumlah yang masuk setelahnya
        const posisi = masuk - 1 - i;
        const top = 520 + posisi * 176;
        return (
          <div key={u + i} style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', alignItems: 'center', gap: 28, padding: '20px 44px', background: f < 0.5 * fps ? '#f3f8ff' : 'white', transition: 'none', ...muncul(f, fps)}}>
            <Sensor aktif={sensor}><Avatar nama={u} ukuran={120} warna={WARNA[i % WARNA.length]} /></Sensor>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 40, fontWeight: 700}}><Sensor aktif={sensor}>{u}</Sensor></div>
              <div style={{fontSize: 37, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{teks} <span style={{color: '#737373', fontWeight: 400}}>· {waktu || 'baru'}</span></div>
            </div>
            <div style={{width: 22, height: 22, borderRadius: '50%', background: '#0095f6'}} />
          </div>
        );
      })}
    </div>
  );
};
export const KotakDm = Interactive.create({
  Component: KotakDmInner,
  layout: 'none',
  schema: {
    akun: {type: 'string', default: 'jodohonline.company', description: 'Akun pemilik kotak masuk'},
    pesan: {type: 'string', default: 'penonton1|kak udah di-ACC, terus ngapain? 😭|1m\npenonton2|bingung mau ngapain di kantornya|2m', description: 'Pesan (user|teks|waktu per baris)'},
    jeda: {type: 'number', hiddenFromList: false, default: 0.5, min: 0.1, step: 0.05, description: 'Jeda antar pesan (detik)'},
    sensor: {type: 'boolean', default: true, description: 'Sensor nama pengirim'},
  },
});

// Isi obrolan DM: gelembung kiri (penonton) & kanan (kita), tiap pesan didahului titik "sedang mengetik".
// "pesan": baris "kiri|teks" atau "kanan|teks"; pesan ke-i muncul di detik i × jeda.
const Titik = ({frame}: {readonly frame: number}) => (
  <div style={{display: 'inline-flex', gap: 10, background: '#efefef', borderRadius: 40, padding: '26px 32px'}}>
    {[0, 1, 2].map((k) => <div key={k} style={{width: 18, height: 18, borderRadius: '50%', background: '#8e8e8e', opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame / 4) - k))}} />)}
  </div>
);
const ObrolanDmInner = ({pengguna, pesan, jeda, sensor, style}: {readonly pengguna: string; readonly pesan: string; readonly jeda: number; readonly sensor: boolean; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const daftar = pesan.split('\n').filter(Boolean).map((b) => {
    const [sisi, ...t] = b.split('|');
    return {kanan: sisi.trim() === 'kanan', teks: t.join('|')};
  });
  const ketikDetik = Math.min(0.45, jeda * 0.55);
  const tampil = daftar.filter((_, i) => frame >= (i * jeda) * fps);
  const berikut = daftar[tampil.length];
  const mengetik = berikut && !berikut.kanan && frame >= (tampil.length * jeda - ketikDetik) * fps;
  return (
    <div style={{position: 'absolute', inset: 0, background: 'white', fontFamily: IG, color: '#000', ...style}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, padding: '120px 40px 28px', borderBottom: '2px solid #efefef'}}>
        <Panah />
        <Sensor aktif={sensor}><Avatar nama={pengguna} ukuran={96} warna={WARNA[1]} /></Sensor>
        <div style={{flex: 1}}>
          <div style={{fontSize: 42, fontWeight: 700}}><Sensor aktif={sensor}>{pengguna}</Sensor></div>
          <div style={{fontSize: 32, color: '#737373'}}>Aktif sekarang</div>
        </div>
        <Telepon /><Kamera />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, bottom: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 16, padding: '0 40px 30px'}}>
        {tampil.map((p, i) => {
          const f = frame - i * jeda * fps;
          return (
            <div key={i} style={{alignSelf: p.kanan ? 'flex-end' : 'flex-start', maxWidth: '78%', display: 'flex', gap: 16, alignItems: 'flex-end', transformOrigin: p.kanan ? 'right bottom' : 'left bottom', ...muncul(f, fps)}}>
              {!p.kanan ? <Sensor aktif={sensor}><Avatar nama={pengguna} ukuran={64} warna={WARNA[1]} /></Sensor> : null}
              <div style={{fontSize: 46, lineHeight: 1.28, padding: '24px 34px', borderRadius: 44, background: p.kanan ? 'linear-gradient(135deg,#a033ff,#5b51f5 55%,#2a8bff)' : '#efefef', color: p.kanan ? 'white' : '#000'}}>{p.teks}</div>
            </div>
          );
        })}
        {mengetik ? <div style={{display: 'flex', gap: 16, alignItems: 'flex-end'}}><Sensor aktif={sensor}><Avatar nama={pengguna} ukuran={64} warna={WARNA[1]} /></Sensor><Titik frame={frame} /></div> : null}
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, bottom: 70, display: 'flex', alignItems: 'center', gap: 20, background: '#efefef', borderRadius: 999, padding: '18px 22px'}}>
        <div style={{width: 76, height: 76, borderRadius: '50%', background: '#3d5afe', display: 'grid', placeItems: 'center', fontSize: 38}}>📷</div>
        <div style={{flex: 1, fontSize: 38, color: '#737373'}}>Kirim pesan…</div>
      </div>
    </div>
  );
};
export const ObrolanDm = Interactive.create({
  Component: ObrolanDmInner,
  layout: 'none',
  schema: {
    pengguna: {type: 'string', default: 'penonton1', description: 'Nama lawan bicara'},
    pesan: {type: 'string', default: 'kiri|kak aku udah di-ACC 🥹\nkiri|terus abis join ngapain ya?\nkanan|sini aku jelasin 👇', description: 'Pesan (kiri|teks atau kanan|teks per baris)'},
    jeda: {type: 'number', hiddenFromList: false, default: 0.8, min: 0.1, step: 0.05, description: 'Jeda antar pesan (detik)'},
    sensor: {type: 'boolean', default: true, description: 'Sensor nama lawan bicara'},
  },
});
