import type {CSSProperties} from 'react';
import {Easing, Img, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAset} from '../data/aset';
import {JUDUL, TEKS} from '../font';

// Kartu perkenalan tokoh ("character intro"): latar bergaris warna tokoh, nomor urut besar,
// karakter melompat masuk, nama besar + chip jabatan + 2 baris keterangan.
// tokoh2 (opsional) untuk pasangan, mis. OB berdua / GUARD berdua.
const klamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const KartuKenalInner = ({tokoh, tokoh2, nama, jabatan, ikon, info, warna, nomor, judulAtas, style}: {
  readonly tokoh: string; readonly tokoh2: string; readonly nama: string; readonly jabatan: string; readonly ikon: string; readonly info: string;
  readonly warna: string; readonly nomor: string; readonly judulAtas: string; readonly style?: CSSProperties;
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const aset = useAset();
  const s = (d: number) => interpolate(f, [d * fps, (d + 0.35) * fps], [0, 1], {...klamp, easing: Easing.bezier(0.2, 1.4, 0.4, 1)});
  const masukTokoh = interpolate(f, [0, 0.4 * fps], [700, 0], {...klamp, easing: Easing.bezier(0.16, 1.3, 0.3, 1)});
  const geser = interpolate(f, [0, 3 * fps], [0, -60], klamp);
  const garis = (t: number): CSSProperties => ({WebkitTextStroke: `${t}px #111`, paintOrder: 'stroke fill'});
  const baris = info.split('\n').filter(Boolean);
  const dua = !!tokoh2;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: warna, ...style}}>
      <div style={{position: 'absolute', inset: -200, translate: `${geser}px 0`, background: 'repeating-linear-gradient(-35deg, rgba(255,255,255,0.13) 0 46px, transparent 46px 92px)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(90% 55% at 50% 52%, rgba(255,255,255,0.35), transparent 70%)'}} />
      <div style={{position: 'absolute', right: -30, top: 120, fontFamily: JUDUL, fontSize: 560, lineHeight: 1, color: 'rgba(255,255,255,0.16)'}}>{nomor}</div>
      {judulAtas ? (
        <div style={{position: 'absolute', top: 170, left: 70, scale: String(s(0.05)), transformOrigin: 'left center', background: '#111', color: 'white', borderRadius: 999, padding: '12px 34px', fontFamily: TEKS, fontWeight: 900, fontSize: 40}}>{judulAtas}</div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: dua ? 330 : 290, height: 1000, display: 'flex', justifyContent: 'center', translate: `0 ${masukTokoh}px`}}>
        <Img src={aset(tokoh)} style={{height: dua ? 900 : 1000, marginRight: dua ? -170 : 0, filter: 'drop-shadow(0 26px 22px rgba(0,0,0,0.35))'}} />
        {dua ? <Img src={aset(tokoh2)} style={{height: 900, marginLeft: -170, filter: 'drop-shadow(0 26px 22px rgba(0,0,0,0.35))'}} /> : null}
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 1210, textAlign: 'center'}}>
        <div style={{scale: String(s(0.25)), fontFamily: JUDUL, fontSize: nama.length > 16 ? 104 : 128, lineHeight: 1, color: 'white', textTransform: 'uppercase', letterSpacing: 2, ...garis(26)}}>{nama}</div>
        <div style={{marginTop: 18, scale: String(s(0.4))}}>
          <span style={{display: 'inline-block', background: '#ffd23f', color: '#111', border: '9px solid #111', borderRadius: 999, padding: '10px 36px', fontFamily: TEKS, fontWeight: 900, fontSize: 48, boxShadow: '0 9px 0 #111'}}>{ikon} {jabatan}</span>
        </div>
        <div style={{marginTop: 26, display: 'grid', gap: 12, justifyItems: 'center'}}>
          {baris.map((b, i) => (
            <div key={i} style={{opacity: s(0.55 + i * 0.15), translate: `0 ${(1 - s(0.55 + i * 0.15)) * 30}px`, background: 'rgba(255,255,255,0.95)', color: '#111', border: '7px solid #111', borderRadius: 24, padding: '10px 28px', fontFamily: TEKS, fontWeight: 900, fontSize: 40}}>{b}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
export const KartuKenal = Interactive.create({
  Component: KartuKenalInner,
  layout: 'none',
  schema: {
    tokoh: {type: 'string', default: 'foto/pegawai-ayu.png', description: 'Gambar tokoh transparan'},
    tokoh2: {type: 'string', default: '', description: 'Tokoh kedua (opsional)'},
    nama: {type: 'string', default: 'Mbak Ayu', description: 'Nama'},
    jabatan: {type: 'string', default: 'Resepsionis', description: 'Jabatan'},
    ikon: {type: 'string', default: '💁‍♀️', description: 'Ikon jabatan'},
    info: {type: 'string', default: '📞 Angkat telepon\n🛵 Pesen makan online', description: 'Keterangan (1 baris per poin)'},
    warna: {type: 'string', default: '#ff4f7b', description: 'Warna latar'},
    nomor: {type: 'string', default: '01', description: 'Nomor urut'},
    judulAtas: {type: 'string', default: 'KENALIN 👋', description: 'Label kiri atas'},
  },
});
