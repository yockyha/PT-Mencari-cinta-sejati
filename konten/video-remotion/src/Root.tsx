import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import {JodohVideo} from './JodohVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="JodohOnline" component={JodohVideo} durationInFrames={1665} fps={30} width={1080} height={1920} />
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
