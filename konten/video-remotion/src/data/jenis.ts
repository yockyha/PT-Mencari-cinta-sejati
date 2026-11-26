// Bentuk data timeline video. Semua waktu dalam frame (30 fps).
export type Masuk = 'none' | 'fade' | 'pop' | 'banting' | 'geser-atas' | 'geser-kiri';
export type Keluar = 'none' | 'fade';
type Dasar = {id: string; mulai: number; durasi: number; masuk?: Masuk; keluar?: Keluar; nama?: string};
export type LapisGambar = Dasar & ({jenis: 'video'; src: string; trim?: number; kecepatan?: number; gelap?: number} | {jenis: 'foto'; src: string; zoom?: number});
export type LapisElemen = Dasar & {jenis: 'balas' | 'profil' | 'komentar' | 'browser' | 'tanya' | 'kotakdm' | 'dm' | 'hitung'; props: Record<string, unknown>};
export type LapisTeks = Dasar & {
  jenis: 'sub' | 'judul' | 'cap' | 'stiker' | 'chips' | 'akun';
  teks: string; kecil?: string; y?: number; x?: number | null; kanan?: number | null; ukuran?: number; warna?: string; miring?: number; nyala?: string;
};
export type Lapis = (LapisGambar & {track: 'gambar'}) | (LapisElemen & {track: 'elemen'}) | (LapisTeks & {track: 'teks'});
export type Suara = {id: string; src: string; mulai: number; durasi: number; volume: number; nama?: string; trim?: number};
export type Timeline = {versi: 1; fps: number; lebar: number; tinggi: number; durasi: number; vo: {src: string; volume: number} | null; lapis: Lapis[]; sfx: Suara[]};
