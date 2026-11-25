import {createContext, useContext} from 'react';
import {staticFile} from 'remotion';

// Penerjemah path aset: di Remotion Studio/CLI pakai staticFile, di editor Studio Konten pakai "media/…" atau "/_blob/<id>"
export type PemetaAset = (path: string) => string;
export const AsetContext = createContext<PemetaAset>((p) => (/^(https?:|\/_blob\/|blob:|data:)/.test(p) ? p : staticFile(p)));
export const useAset = () => useContext(AsetContext);
