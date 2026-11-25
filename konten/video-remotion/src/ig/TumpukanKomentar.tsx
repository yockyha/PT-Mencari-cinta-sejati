import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {Avatar, Hati, Sensor} from './Ikon';

const WARNA = ['#e1306c', '#5851db', '#f77737', '#2ab27b', '#3a8fd8', '#b06ab3'];

// Komentar penonton yang bermunculan satu per satu (intro "banyak yang nanya…").
// "komentar": baris "user|teks" dipisah baris baru; muncul tiap `jeda` detik.
const TumpukanKomentarInner = ({komentar, jeda, sensor, style}: {readonly komentar: string; readonly jeda: number; readonly sensor: boolean; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const daftar = komentar.split('\n').filter(Boolean).map((b) => b.split('|'));
  return (
    <div style={{position: 'absolute', inset: 0, fontFamily: IG, ...style}}>
      {daftar.map(([u, teks], i) => {
        const f = frame - i * jeda * fps;
        if (f < 0) return null;
        return (
          <div
            key={u + i}
            style={{
              position: 'absolute',
              top: 300 + i * 172,
              left: i % 2 ? 150 : 90,
              right: i % 2 ? 90 : 150,
              display: 'flex',
              gap: 22,
              alignItems: 'center',
              background: 'white',
              color: '#161823',
              borderRadius: 30,
              padding: '22px 28px',
              boxShadow: '0 14px 36px rgba(0,0,0,0.30)',
              rotate: `${i % 2 ? 1.8 : -1.8}deg`,
              scale: String(interpolate(f, [0, 0.25 * fps], [0.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({damping: 13})})),
              opacity: interpolate(f, [0, 0.08 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}
          >
            <Sensor aktif={sensor}><Avatar nama={u} ukuran={76} warna={WARNA[i % WARNA.length]} /></Sensor>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 30, color: '#8a8b91', fontWeight: 500}}><Sensor aktif={sensor}><b style={{color: '#161823'}}>{u}</b></Sensor> · {i + 1}m</div>
              <div style={{fontSize: 42, fontWeight: 500, lineHeight: 1.22, marginTop: 2}}>{teks}</div>
            </div>
            <Hati ukuran={40} />
          </div>
        );
      })}
    </div>
  );
};
export const TumpukanKomentar = Interactive.create({
  Component: TumpukanKomentarInner,
  layout: 'none',
  schema: {
    komentar: {type: 'string', default: 'penonton1|cara daftarnya gimana kak? 🙏\npenonton2|linknya mana min??', description: 'Komentar (user|teks per baris)'},
    jeda: {type: 'number', hiddenFromList: false, default: 0.7, min: 0.1, step: 0.05, description: 'Jeda antar komentar (detik)'},
    sensor: {type: 'boolean', default: true, description: 'Sensor nama penonton'},
  },
});
