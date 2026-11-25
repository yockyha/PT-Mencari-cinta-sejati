import {Audio, Video} from '@remotion/media';
import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {JUDUL, TEKS} from '../font';
import {BalasKomentar} from '../ig/BalasKomentar';
import {Browser} from '../ig/Browser';
import {KomentarIg} from '../ig/KomentarIg';
import {ProfilIg} from '../ig/ProfilIg';
import {TumpukanKomentar} from '../ig/TumpukanKomentar';
import {useAset} from './aset';
import type {Lapis, LapisGambar, LapisTeks, Masuk, Keluar, Timeline} from './jenis';

// Video yang sepenuhnya digerakkan data timeline (dipakai editor Studio Konten dan render CLI).
const klamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Animasi masuk/keluar untuk satu lapis
const Anim = ({masuk = 'fade', keluar = 'none', children, asal}: {readonly masuk?: Masuk; readonly keluar?: Keluar; readonly children: ReactNode; readonly asal?: string}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  let opacity = 1, scale = 1, tx = 0, ty = 0;
  if (masuk === 'fade') opacity = interpolate(f, [0, 5], [0, 1], klamp);
  if (masuk === 'pop') { opacity = interpolate(f, [0, 4], [0, 1], klamp); scale = interpolate(f, [0, 8], [0.6, 1], {...klamp, easing: Easing.spring({damping: 12})}); }
  if (masuk === 'banting') { opacity = interpolate(f, [0, 2], [0, 1], klamp); scale = interpolate(f, [0, 4, 7], [1.9, 0.94, 1], klamp); }
  if (masuk === 'geser-atas') ty = interpolate(f, [0, 10], [1920, 0], {...klamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  if (masuk === 'geser-kiri') tx = interpolate(f, [0, 10], [1080, 0], {...klamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  if (keluar === 'fade') opacity *= interpolate(f, [d - 6, d], [1, 0], klamp);
  return <AbsoluteFill style={{opacity, scale: String(scale), translate: `${tx}px ${ty}px`, transformOrigin: asal || 'center'}}>{children}</AbsoluteFill>;
};

const sorot = (s: string) => s.split(/(\*[^*]+\*)/).map((b, i) => (b.startsWith('*') ? <span key={i} style={{color: '#ffd23f'}}>{b.slice(1, -1)}</span> : <span key={i}>{b}</span>));

const Gambar = ({l}: {readonly l: LapisGambar}) => {
  const aset = useAset();
  const f = useCurrentFrame();
  const {fps, durationInFrames: d} = useVideoConfig();
  if (l.jenis === 'video') {
    return (
      <AbsoluteFill style={{filter: l.gelap ? `brightness(${1 - l.gelap})` : undefined}}>
        <Video src={aset(l.src)} trimBefore={Math.round((l.trim || 0) * fps)} playbackRate={l.kecepatan || 1} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={aset(l.src)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f, [0, d], [1, l.zoom || 1.06], {...klamp, easing: Easing.bezier(0.33, 0, 0.67, 1)}))}} />
    </AbsoluteFill>
  );
};

const garis = (tebal: number): CSSProperties => ({WebkitTextStroke: `${tebal}px #111`, paintOrder: 'stroke fill'});
export const BAWAAN: Record<LapisTeks['jenis'], {y: number; ukuran: number; x?: number}> = {
  sub: {y: 1250, ukuran: 62}, judul: {y: 300, ukuran: 96}, cap: {y: 700, ukuran: 100, x: 160}, stiker: {y: 360, ukuran: 84}, chips: {y: 470, ukuran: 40}, akun: {y: 150, ukuran: 36, x: 130},
};

const Teks = ({l}: {readonly l: LapisTeks}) => {
  const b = BAWAAN[l.jenis], y = l.y ?? b.y, u = l.ukuran ?? b.ukuran;
  if (l.jenis === 'sub') return <div style={{position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', padding: '0 150px', fontFamily: TEKS, fontWeight: 900, fontSize: u, lineHeight: 1.18, color: l.warna || 'white', wordSpacing: '0.08em', ...garis(u * 0.23)}}>{sorot(l.teks)}</div>;
  if (l.jenis === 'judul') return (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', padding: '0 130px', fontFamily: JUDUL, fontSize: u, lineHeight: 1.02, letterSpacing: 2, wordSpacing: '0.15em', color: l.warna || '#ffd23f', textTransform: 'uppercase', ...garis(u * 0.25)}}>
      {l.teks}{l.kecil ? <div style={{color: 'white', fontSize: u * 0.77, marginTop: 8}}>{l.kecil}</div> : null}
    </div>
  );
  if (l.jenis === 'cap') {
    const w = l.warna || '#1f9d55';
    return <div style={{position: 'absolute', top: y, ...(l.kanan != null ? {right: l.kanan} : {left: l.x ?? b.x}), rotate: `${l.miring ?? -9}deg`, border: `${u * 0.16}px solid ${w}`, color: w, background: 'rgba(255,255,255,0.92)', fontFamily: JUDUL, fontSize: u, padding: '6px 48px', borderRadius: 26, letterSpacing: 3, whiteSpace: 'nowrap'}}>{l.teks}</div>;
  }
  if (l.jenis === 'stiker') return <div style={{position: 'absolute', top: y, left: 170, right: 170, textAlign: 'center', background: l.warna || '#ff4f7b', color: 'white', border: '12px solid #111', borderRadius: 56, fontFamily: JUDUL, fontSize: u, padding: '24px 10px', rotate: `${l.miring ?? -4}deg`, boxShadow: '0 16px 0 #111'}}>{l.teks}</div>;
  if (l.jenis === 'chips') {
    const on = (l.nyala || '').split(',').filter(Boolean).map(Number);
    return (
      <div style={{position: 'absolute', top: y, left: 130, right: 130, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center'}}>
        {l.teks.split('|').map((c, i) => <span key={c + i} style={{background: on.includes(i) ? (/💎/.test(c) ? '#d4a017' : '#ff4f7b') : '#fff6ef', color: on.includes(i) && !/💎/.test(c) ? 'white' : '#111', border: '8px solid #111', borderRadius: 999, fontFamily: TEKS, fontWeight: 900, fontSize: u, padding: '10px 30px', boxShadow: '0 8px 0 #111'}}>{c}</span>)}
      </div>
    );
  }
  return <div style={{position: 'absolute', top: y, left: l.x ?? b.x, background: 'rgba(17,17,17,0.72)', color: 'white', fontFamily: TEKS, fontWeight: 900, fontSize: u, padding: '10px 28px', borderRadius: 999}}>{l.teks}</div>;
};

const Elemen = ({l}: {readonly l: Extract<Lapis, {track: 'elemen'}>}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = l.props as any;
  if (l.jenis === 'balas') return <BalasKomentar {...p} />;
  if (l.jenis === 'profil') return <ProfilIg {...p} />;
  if (l.jenis === 'komentar') return <KomentarIg {...p} />;
  if (l.jenis === 'tanya') return <TumpukanKomentar {...p} />;
  return <Browser {...p} />;
};

const urutan = {gambar: 0, elemen: 1, teks: 2} as const;

export const VideoData = ({timeline}: {readonly timeline: Timeline}) => {
  const aset = useAset();
  const lapis = timeline.lapis.map((l, i) => ({l, i})).sort((a, b) => urutan[a.l.track] - urutan[b.l.track] || a.i - b.i);
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {lapis.map(({l}) => (
        <Sequence key={l.id} name={l.nama || l.jenis} from={l.mulai} durationInFrames={Math.max(1, l.durasi)} layout="absolute-fill">
          {l.track === 'gambar' ? (
            <Anim masuk={l.masuk ?? 'none'} keluar={l.keluar}><Gambar l={l} /></Anim>
          ) : l.track === 'elemen' ? (
            <Anim masuk={l.masuk ?? 'none'} keluar={l.keluar}><Elemen l={l} /></Anim>
          ) : (
            <Anim masuk={l.masuk ?? (l.jenis === 'cap' || l.jenis === 'stiker' ? 'banting' : l.jenis === 'judul' ? 'pop' : 'fade')} keluar={l.keluar} asal={`${l.jenis === 'cap' ? (l.kanan != null ? 1080 - l.kanan - 280 : (l.x ?? 160) + 280) : 540}px ${(l.y ?? BAWAAN[l.jenis].y) + 60}px`}><Teks l={l} /></Anim>
          )}
        </Sequence>
      ))}
      {timeline.vo ? <Audio src={aset(timeline.vo.src)} volume={timeline.vo.volume} /> : null}
      {timeline.sfx.map((s) => (
        <Sequence key={s.id} name={s.nama || s.src} from={s.mulai} durationInFrames={Math.max(1, s.durasi)} layout="none">
          <Audio src={aset(s.src)} volume={s.volume} trimBefore={s.trim ? Math.round(s.trim * timeline.fps) : undefined} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
