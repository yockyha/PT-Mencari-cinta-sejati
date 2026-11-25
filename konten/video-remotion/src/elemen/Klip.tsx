import {Video} from '@remotion/media';
import type {CSSProperties} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Interactive, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Rekaman layar asli dari aplikasi (mp4)
const RekamanInner = ({src, mulai, kecepatan, style}: {readonly src: string; readonly mulai: number; readonly kecepatan: number; readonly style?: CSSProperties}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={style}>
      <Video src={staticFile(src)} trimBefore={Math.round(mulai * fps)} playbackRate={kecepatan} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
export const Rekaman = Interactive.create({
  Component: RekamanInner,
  layout: 'none',
  schema: {
    src: {type: 'asset', assetType: 'video', default: 'klip/drone.mp4', description: 'Rekaman'},
    mulai: {type: 'number', hiddenFromList: false, default: 0, min: 0, step: 0.1, description: 'Mulai dari detik'},
    kecepatan: {type: 'number', hiddenFromList: false, default: 1, min: 0.25, max: 2, step: 0.05, description: 'Kecepatan'},
  },
});

// Gambar diam dari aplikasi dengan gerak kamera pelan (push-in)
const FotoInner = ({src, zoom, style}: {readonly src: string; readonly zoom: number; readonly style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{overflow: 'hidden', ...style}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, durationInFrames], [1, zoom], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.67, 1)}),
        }}
      />
    </AbsoluteFill>
  );
};
export const Foto = Interactive.create({
  Component: FotoInner,
  layout: 'none',
  schema: {
    src: {type: 'asset', assetType: 'image', default: 'foto/meja.png', description: 'Gambar'},
    zoom: {type: 'number', hiddenFromList: false, default: 1.08, min: 1, max: 1.5, step: 0.01, description: 'Zoom akhir'},
  },
});
