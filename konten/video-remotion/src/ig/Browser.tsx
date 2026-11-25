import type {CSSProperties} from 'react';
import {AbsoluteFill, Img, interpolate, Interactive, useCurrentFrame, useVideoConfig} from 'remotion';
import {IG} from '../font';
import {useAset} from '../data/aset';
import {Gembok} from './Ikon';

// Browser HP: alamat diketik, halaman dimuat (screenshot asli beranda)
const BrowserInner = ({alamat, halaman, style}: {readonly alamat: string; readonly halaman: string; readonly style?: CSSProperties}) => {
  const aset = useAset();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const n = Math.min(alamat.length, Math.floor(t * 22));
  const muat = t - alamat.length / 22 - 0.15;
  return (
    <AbsoluteFill style={{background: 'white', fontFamily: IG, ...style}}>
      <div style={{height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 44px 8px', fontSize: 34, fontWeight: 500}}><span>11.00</span><span>●●● 5G ▮</span></div>
      <div style={{margin: '14px 30px', background: '#f1f3f4', borderRadius: 999, padding: '22px 34px', display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, color: '#202124'}}>
        {muat > 0 ? <Gembok /> : null}
        <span>{alamat.slice(0, n)}{muat <= 0 && frame % 16 < 8 ? '|' : ''}</span>
      </div>
      <div style={{height: 8, background: '#e8eaed'}}>
        <div style={{height: '100%', background: '#1a73e8', width: `${interpolate(muat, [0, 0.5], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, opacity: muat > 0.55 ? 0 : 1}} />
      </div>
      <div style={{position: 'absolute', top: 222, left: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: interpolate(muat, [0.25, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <Img src={aset(halaman)} style={{width: '100%'}} />
      </div>
    </AbsoluteFill>
  );
};
export const Browser = Interactive.create({
  Component: BrowserInner,
  layout: 'none',
  schema: {
    alamat: {type: 'string', default: 'jodohonline.company', description: 'Alamat'},
    halaman: {type: 'asset', assetType: 'image', default: 'foto/beranda.png', description: 'Screenshot halaman'},
  },
});
