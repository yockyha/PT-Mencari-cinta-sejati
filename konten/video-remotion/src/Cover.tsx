import type {CSSProperties} from 'react';
import {AbsoluteFill, Img, Interactive, staticFile} from 'remotion';
import './fontStudio';
import {JUDUL, TEKS} from './font';

// Cover video (thumbnail) Reels/TikTok. Konsep & tulisan sama untuk semua video; latar & tokoh beda tiap video (bahan dari rekam-cover.js). Teks penting ada di area tengah 3:4 (y 240–1680) supaya aman di grid profil.
const CoverInner = ({baris1, baris2, baris3, sub, label, latar = 'foto/halaman.png', tokoh = 'foto/direktur.png', style}: {
  readonly baris1: string; readonly baris2: string; readonly baris3: string; readonly sub: string; readonly label: string; readonly latar?: string; readonly tokoh?: string; readonly style?: CSSProperties;
}) => {
  const tebal = (warna: string, ukuran: number): CSSProperties => ({fontFamily: JUDUL, fontSize: ukuran, lineHeight: 0.98, color: warna, WebkitTextStroke: '30px #111', paintOrder: 'stroke fill', letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap'});
  return (
    <AbsoluteFill style={{backgroundColor: '#111', ...style}}>
      <Img src={staticFile(latar)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: '1.15'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(42,20,32,0.55) 0%, rgba(42,20,32,0) 38%, rgba(214,48,94,0.15) 60%, rgba(42,20,32,0.75) 100%)'}} />
      <AbsoluteFill style={{background: 'repeating-conic-gradient(from 0deg at 50% 62%, rgba(255,255,255,0.10) 0 8deg, transparent 8deg 16deg)'}} />
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: '#ff4f7b', color: 'white', border: '10px solid #111', borderRadius: 999, padding: '12px 44px', fontFamily: JUDUL, fontSize: 54, letterSpacing: 3, boxShadow: '0 10px 0 #111', rotate: '-2deg'}}>{label}</span>
      </div>
      <div style={{position: 'absolute', top: 500, left: 50, right: 50, textAlign: 'center', rotate: '-3deg'}}>
        <div style={tebal('white', 150)}>{baris1}</div>
        <div style={tebal('#ffd23f', 172)}>{baris2}</div>
        <div style={{...tebal('#ff7aa0', 136), marginTop: 6}}>{baris3}</div>
      </div>
      <Img src={staticFile(tokoh)} style={{position: 'absolute', left: '50%', top: 930, width: 1060, translate: '-50% 0', filter: 'drop-shadow(0 26px 30px rgba(0,0,0,0.55))'}} />
      <div style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{display: 'inline-block', background: 'white', color: '#111', border: '10px solid #111', borderRadius: 34, padding: '18px 40px', fontFamily: TEKS, fontWeight: 900, fontSize: 52, whiteSpace: 'nowrap', boxShadow: '0 12px 0 #111', rotate: '2deg'}}>{sub}</span>
      </div>
    </AbsoluteFill>
  );
};
export const Cover = Interactive.create({
  Component: CoverInner,
  layout: 'none',
  schema: {
    label: {type: 'string', default: '💘 PT MENCARI CINTA SEJATI', description: 'Label atas'},
    baris1: {type: 'string', default: 'Kantor', description: 'Hook baris 1'},
    baris2: {type: 'string', default: 'Khusus', description: 'Hook baris 2'},
    baris3: {type: 'string', default: 'Cari Jodoh?!', description: 'Hook baris 3'},
    sub: {type: 'string', default: 'Masuknya harus di-ACC Direktur 👑', description: 'Teks bawah'},
    latar: {type: 'string', default: 'foto/halaman.png', description: 'Gambar latar (beda tiap video)'},
    tokoh: {type: 'string', default: 'foto/direktur.png', description: 'Karakter transparan 1600×1600 (beda tiap video)'},
  },
});
