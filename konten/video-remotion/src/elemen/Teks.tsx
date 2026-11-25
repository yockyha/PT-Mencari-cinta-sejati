import type {CSSProperties} from 'react';
import {Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {JUDUL, TEKS} from '../font';

// Pecah "teks *sorot* teks" jadi bagian biasa & kuning
const sorot = (s: string) => s.split(/(\*[^*]+\*)/).map((b, i) => (b.startsWith('*') ? <span key={i} style={{color: '#ffd23f'}}>{b.slice(1, -1)}</span> : <span key={i}>{b}</span>));

const Muncul = ({children, style, pop}: {readonly children: React.ReactNode; readonly style?: CSSProperties; readonly pop?: boolean}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: interpolate(frame, [0, 0.12 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        scale: pop ? interpolate(frame, [0, 0.25 * fps], [0.6, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.spring({damping: 12})}) : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Subtitle ala TikTok: putih bergaris hitam, kata penting kuning (*kata*)
const SubInner = ({teks, style}: {readonly teks: string; readonly style?: CSSProperties}) => (
  <Muncul style={{top: 1250, padding: '0 150px', fontFamily: TEKS, fontWeight: 900, fontSize: 62, lineHeight: 1.18, color: 'white', WebkitTextStroke: '14px #111', paintOrder: 'stroke fill', ...style}}>{sorot(teks)}</Muncul>
);
export const Sub = Interactive.create({
  Component: SubInner,
  layout: 'none',
  schema: {teks: {type: 'string', default: '', description: 'Teks (*kata* = kuning)'}},
});

// Judul besar kuning
const JudulInner = ({teks, kecil, style}: {readonly teks: string; readonly kecil: string; readonly style?: CSSProperties}) => (
  <Muncul pop style={{top: 300, padding: '0 130px', fontFamily: JUDUL, fontSize: 96, lineHeight: 1.02, letterSpacing: 2, wordSpacing: '0.15em', color: '#ffd23f', textTransform: 'uppercase', WebkitTextStroke: '24px #111', paintOrder: 'stroke fill', ...style}}>
    {teks}
    {kecil ? <div style={{color: 'white', fontSize: 74, marginTop: 8}}>{kecil}</div> : null}
  </Muncul>
);
export const Judul = Interactive.create({
  Component: JudulInner,
  layout: 'none',
  schema: {teks: {type: 'string', default: '', description: 'Judul'}, kecil: {type: 'string', default: '', description: 'Baris kecil'}},
});

// Cap dibanting (BELUM DI-ACC / DI-ACC ✓)
const CapInner = ({teks, warna, style}: {readonly teks: string; readonly warna: string; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 700,
        left: 160,
        rotate: '-9deg',
        border: `16px solid ${warna}`,
        color: warna,
        background: 'rgba(255,255,255,0.92)',
        fontFamily: JUDUL,
        fontSize: 100,
        padding: '6px 48px',
        borderRadius: 26,
        letterSpacing: 3,
        scale: interpolate(frame, [0, 0.12 * fps, 0.22 * fps], [1.9, 0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        opacity: interpolate(frame, [0, 0.06 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        ...style,
      }}
    >
      {teks}
    </div>
  );
};
export const Cap = Interactive.create({
  Component: CapInner,
  layout: 'none',
  schema: {teks: {type: 'string', default: 'DI-ACC ✓', description: 'Tulisan cap'}, warna: {type: 'color', default: '#1f9d55', description: 'Warna'}},
});

// Chip pilihan (tujuan / ruangan); "nyala" = indeks chip yang menyala, dipisah koma
const ChipsInner = ({daftar, nyala, style}: {readonly daftar: string; readonly nyala: string; readonly style?: CSSProperties}) => {
  const on = nyala.split(',').map(Number);
  return (
    <div style={{position: 'absolute', top: 470, left: 130, right: 130, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', ...style}}>
      {daftar.split('|').map((c, i) => (
        <span key={c} style={{background: on.includes(i) ? '#ff4f7b' : '#fff6ef', color: on.includes(i) ? 'white' : '#111', border: '8px solid #111', borderRadius: 999, fontFamily: TEKS, fontWeight: 900, fontSize: 40, padding: '10px 30px', boxShadow: '0 8px 0 #111'}}>{c}</span>
      ))}
    </div>
  );
};
export const Chips = Interactive.create({
  Component: ChipsInner,
  layout: 'none',
  schema: {daftar: {type: 'string', default: 'A|B', description: 'Chip (pisah |)'}, nyala: {type: 'string', default: '0', description: 'Indeks menyala'}},
});

// Stiker miring (IT'S A MATCH)
const StikerInner = ({teks, style}: {readonly teks: string; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 170,
        right: 170,
        textAlign: 'center',
        background: '#ff4f7b',
        color: 'white',
        border: '12px solid #111',
        borderRadius: 56,
        fontFamily: JUDUL,
        fontSize: 84,
        padding: '24px 10px',
        rotate: '-4deg',
        boxShadow: '0 16px 0 #111',
        scale: interpolate(frame, [0, 0.14 * fps, 0.24 * fps], [1.8, 0.95, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        ...style,
      }}
    >
      {teks}
    </div>
  );
};
export const Stiker = Interactive.create({
  Component: StikerInner,
  layout: 'none',
  schema: {teks: {type: 'string', default: "IT'S A MATCH 💘", description: 'Tulisan'}},
});

// Label kecil nama akun di pojok
const AkunInner = ({teks, style}: {readonly teks: string; readonly style?: CSSProperties}) => (
  <div style={{position: 'absolute', top: 150, left: 130, background: 'rgba(17,17,17,0.72)', color: 'white', fontFamily: TEKS, fontWeight: 900, fontSize: 36, padding: '10px 28px', borderRadius: 999, ...style}}>{teks}</div>
);
export const Akun = Interactive.create({Component: AkunInner, layout: 'none', schema: {teks: {type: 'string', default: '@jodohonline.id', description: 'Akun'}}});
