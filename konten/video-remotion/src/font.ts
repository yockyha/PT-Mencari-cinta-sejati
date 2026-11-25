import {loadFont} from '@remotion/fonts';

// Font lokal: judul (Lilita One), subtitle (Nunito), tampilan Instagram/TikTok (Roboto).
// `peta` mengubah path di folder public jadi URL (staticFile di Remotion, "media/…" di editor).
let sudah: Promise<unknown> | null = null;
export const muatFont = (peta: (p: string) => string) =>
  (sudah ??= Promise.all([
    loadFont({family: 'Lilita', url: peta('font/lilita.woff2'), weight: '400'}),
    loadFont({family: 'Nunito', url: peta('font/nunito-latin-800-normal.woff2'), weight: '800'}),
    loadFont({family: 'Nunito', url: peta('font/nunito-latin-900-normal.woff2'), weight: '900'}),
    loadFont({family: 'Roboto', url: peta('font/roboto-latin-400-normal.woff2'), weight: '400'}),
    loadFont({family: 'Roboto', url: peta('font/roboto-latin-500-normal.woff2'), weight: '500'}),
    loadFont({family: 'Roboto', url: peta('font/roboto-latin-700-normal.woff2'), weight: '700'}),
  ]));

export const EMOJI = "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
export const JUDUL = `Lilita, ${EMOJI}`;
export const TEKS = `Nunito, ${EMOJI}`;
export const IG = `Roboto, ${EMOJI}`;
