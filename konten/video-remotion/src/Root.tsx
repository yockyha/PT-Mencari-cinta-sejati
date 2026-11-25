import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import './fontStudio';
import {VideoData} from './data/VideoData';
import type {Timeline} from './data/jenis';
import timelineV1 from './data/timeline-v1.json';
import {JodohVideo} from './JodohVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="JodohOnline" component={JodohVideo} durationInFrames={1665} fps={30} width={1080} height={1920} />
      <Composition
        id="VideoData"
        component={VideoData}
        durationInFrames={1665}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{timeline: timelineV1 as unknown as Timeline}}
        calculateMetadata={({props}) => ({durationInFrames: props.timeline.durasi, fps: props.timeline.fps, width: props.timeline.lebar, height: props.timeline.tinggi})}
      />
      <Still
        id="Cover"
        component={Cover}
        width={1080}
        height={1920}
        defaultProps={{label: '💘 PT MENCARI CINTA SEJATI', baris1: 'Kantor', baris2: 'Khusus', baris3: 'Cari Jodoh?!', sub: 'Masuknya harus di-ACC Direktur 👑'}}
      />
    </>
  );
};
