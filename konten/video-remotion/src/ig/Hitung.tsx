import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {JUDUL, TEKS} from '../font';

// Angka besar yang berhitung naik (mis. jumlah anggota), dengan teks kecil di atas & label di bawah.
const HitungInner = ({dari, ke, detik, atas, label, y, style}: {readonly dari: number; readonly ke: number; readonly detik: number; readonly atas: string; readonly label: string; readonly y: number; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = interpolate(frame, [0.15 * fps, (0.15 + detik) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.8, 0.3, 1)});
  const n = Math.round(dari + (ke - dari) * k);
  const selesai = k >= 1;
  const denyut = selesai ? interpolate(frame - (0.15 + detik) * fps, [0, 4, 10], [1.25, 0.95, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const garis = (t: number): CSSProperties => ({WebkitTextStroke: `${t}px #111`, paintOrder: 'stroke fill'});
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', ...style}}>
      {atas ? <div style={{display: 'inline-block', background: '#ff4f7b', color: 'white', border: '10px solid #111', borderRadius: 999, padding: '10px 40px', fontFamily: TEKS, fontWeight: 900, fontSize: 52, boxShadow: '0 10px 0 #111', rotate: '-2deg'}}>{atas}</div> : null}
      <div style={{fontFamily: JUDUL, fontSize: 380, lineHeight: 1, color: '#ffd23f', letterSpacing: 4, marginTop: 10, scale: String(denyut), fontVariantNumeric: 'tabular-nums', ...garis(36)}}>{n}{selesai ? '+' : ''}</div>
      {label ? <div style={{fontFamily: JUDUL, fontSize: 96, color: 'white', marginTop: -10, textTransform: 'uppercase', letterSpacing: 2, ...garis(24)}}>{label}</div> : null}
    </div>
  );
};
export const Hitung = Interactive.create({
  Component: HitungInner,
  layout: 'none',
  schema: {
    dari: {type: 'number', hiddenFromList: false, default: 0, min: 0, step: 1, description: 'Mulai dari'},
    ke: {type: 'number', hiddenFromList: false, default: 119, min: 0, step: 1, description: 'Sampai'},
    detik: {type: 'number', hiddenFromList: false, default: 1.6, min: 0.1, step: 0.1, description: 'Lama berhitung (detik)'},
    atas: {type: 'string', default: 'baru buka sehari', description: 'Teks kecil di atas'},
    label: {type: 'string', default: 'orang join 💘', description: 'Label di bawah angka'},
    y: {type: 'number', hiddenFromList: false, default: 420, min: 0, step: 10, description: 'Posisi atas (px)'},
  },
});
