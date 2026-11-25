import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {Avatar, Sensor} from './Ikon';

// Stiker "Membalas komentar" gaya video balasan komentar
const BalasKomentarInner = ({pengguna, komentar, sensor, style}: {readonly pengguna: string; readonly komentar: string; readonly sensor: boolean; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 150,
        right: 150,
        background: 'white',
        borderRadius: 34,
        padding: '26px 32px',
        boxShadow: '0 14px 40px rgba(0,0,0,0.28)',
        fontFamily: IG,
        color: '#161823',
        scale: interpolate(frame, [0, 0.3 * fps], [0.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({damping: 14})}),
        opacity: interpolate(frame, [0, 0.1 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        ...style,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <Sensor aktif={sensor}><Avatar nama={pengguna} ukuran={64} warna="#b06ab3" /></Sensor>
        <div style={{fontSize: 32, color: '#8a8b91', fontWeight: 500}}>
          Membalas komentar <Sensor aktif={sensor}><b style={{color: '#161823'}}>{pengguna}</b></Sensor>
        </div>
      </div>
      <div style={{fontSize: 44, fontWeight: 500, marginTop: 14, lineHeight: 1.25}}>{komentar}</div>
    </div>
  );
};
export const BalasKomentar = Interactive.create({
  Component: BalasKomentarInner,
  layout: 'none',
  schema: {
    pengguna: {type: 'string', default: 'nadia.r', description: 'Nama pengomentar'},
    komentar: {type: 'string', default: 'ini web apa sih? 😭', description: 'Komentar'},
    sensor: {type: 'boolean', default: true, description: 'Sensor nama pengomentar'},
  },
});
