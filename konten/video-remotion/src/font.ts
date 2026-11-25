import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Font lokal: judul (Lilita One), subtitle (Nunito), tampilan Instagram/TikTok (Roboto)
export const fontSiap = Promise.all([
  loadFont({family: 'Lilita', url: staticFile('font/lilita.woff2'), weight: '400'}),
  loadFont({family: 'Nunito', url: staticFile('font/nunito-latin-800-normal.woff2'), weight: '800'}),
  loadFont({family: 'Nunito', url: staticFile('font/nunito-latin-900-normal.woff2'), weight: '900'}),
  loadFont({family: 'Roboto', url: staticFile('font/roboto-latin-400-normal.woff2'), weight: '400'}),
  loadFont({family: 'Roboto', url: staticFile('font/roboto-latin-500-normal.woff2'), weight: '500'}),
  loadFont({family: 'Roboto', url: staticFile('font/roboto-latin-700-normal.woff2'), weight: '700'}),
]);

export const EMOJI = "'Noto Color Emoji', 'Apple Color Emoji', sans-serif";
export const JUDUL = `Lilita, ${EMOJI}`;
export const TEKS = `Nunito, ${EMOJI}`;
export const IG = `Roboto, ${EMOJI}`;
