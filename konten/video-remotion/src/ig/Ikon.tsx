// Ikon garis sederhana (gaya aplikasi sosial)
export const Hati = ({ukuran = 40, isi = false}: {readonly ukuran?: number; readonly isi?: boolean}) => (
  <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill={isi ? '#ff3040' : 'none'} stroke={isi ? '#ff3040' : '#262626'} strokeWidth={1.8}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2.1 0 3.5 1.2 5 3 1.5-1.8 2.9-3 5-3 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);
export const Gembok = ({ukuran = 30}: {readonly ukuran?: number}) => (
  <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth={2}>
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
// Avatar bulat berwarna dengan inisial
export const Avatar = ({nama, ukuran, warna}: {readonly nama: string; readonly ukuran: number; readonly warna: string}) => (
  <div style={{width: ukuran, height: ukuran, borderRadius: '50%', flex: 'none', background: warna, color: 'white', display: 'grid', placeItems: 'center', fontSize: ukuran * 0.42, fontWeight: 700}}>{nama === 'jodohonline.company' ? '💘' : nama[0].toUpperCase()}</div>
);
// Titik sentuhan jari
export const Ketuk = ({x, y, kemajuan}: {readonly x: number; readonly y: number; readonly kemajuan: number}) =>
  kemajuan <= 0 || kemajuan >= 1 ? null : (
    <div style={{position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.55)', border: '6px solid rgba(0,0,0,0.25)', scale: String(0.6 + kemajuan * 0.6), opacity: 1 - kemajuan}} />
  );

// Sensor ala screenshot: isi diburamkan (dipakai untuk angka & komentar yang belum ada)
export const Sensor = ({aktif, children}: {readonly aktif: boolean; readonly children: React.ReactNode}) =>
  aktif ? <span style={{filter: 'blur(14px)', display: 'inline-block'}}>{children}</span> : <>{children}</>;
