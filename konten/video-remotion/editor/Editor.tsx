// Editor video ala CapCut untuk Studio Konten jodohonline.
// Pratinjau = Remotion Player dengan komposisi VideoData yang sama persis dengan render CLI.
import {Player, type PlayerRef} from '@remotion/player';
import {canRenderMediaOnWeb, renderMediaOnWeb} from '@remotion/web-renderer';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AsetContext} from '../src/data/aset';
import type {Lapis, LapisTeks, Suara, Timeline} from '../src/data/jenis';
import timelineV1 from '../src/data/timeline-v1.json';
import {BAWAAN, VideoData} from '../src/data/VideoData';
import {muatFont} from '../src/font';
import pustakaBawaan from './pustaka.json';
import {CSS} from './gaya';

type Db = any; // namespace claude.use('db')
type Media = {src: string; nama: string; detik?: number};
type Pustaka = {klip: Media[]; foto: Media[]; sfx: Media[]; vo: Media[]};
type Pilih = {jenis: 'lapis' | 'sfx' | 'vo'; id: string} | null;

const peta = (p: string) => (/^(https?:|\/_blob\/|blob:|data:)/.test(p) ? p : 'media/' + p);
const Komposisi = ({timeline}: {timeline: Timeline}) => (
  <AsetContext.Provider value={peta}>
    <VideoData timeline={timeline} />
  </AsetContext.Provider>
);
const kosong = (): Timeline => ({versi: 1, fps: 30, lebar: 1080, tinggi: 1920, durasi: 450, vo: null, lapis: [], sfx: []});
const salinan = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);
const detik = (f: number, fps: number) => (f / fps).toFixed(1).replace('.', ',') + ' d';
const jam = (f: number, fps: number) => { const s = f / fps; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor((s % 1) * 10))}`; };

const LABEL: Record<string, string> = {video: '🎬', foto: '🖼', tanya: '🙋', balas: '💬', profil: '👤', komentar: '🗨', browser: '🌐', sub: 'Aa', judul: 'T', cap: '🔖', stiker: '⭐', chips: '🏷', akun: '@'};
const NAMA_JENIS: Record<string, string> = {video: 'Klip video', foto: 'Foto', tanya: 'Tumpukan komentar', balas: 'Balasan komentar', profil: 'Profil Instagram', komentar: 'Kolom komentar', browser: 'Browser HP', sub: 'Subtitle', judul: 'Judul', cap: 'Cap', stiker: 'Stiker', chips: 'Chip', akun: 'Nama akun'};
const labelLapis = (l: Lapis) => (l.track === 'teks' ? (l as LapisTeks).teks.replace(/\*/g, '') : l.nama || NAMA_JENIS[l.jenis]);

function ujung(tl: Timeline) {
  return Math.max(30, ...tl.lapis.map((l) => l.mulai + l.durasi), ...tl.sfx.map((s) => s.mulai + s.durasi));
}

// ---------------------------------------------------------------- APP
function App({videoId, judul, db, assets, downloads, tutup}: {videoId: string; judul: string; db: Db; assets: any; downloads: any; tutup: () => void}) {
  const [tl, setTl] = useState<Timeline | null>(null);
  const riwayat = useRef<{lalu: Timeline[]; depan: Timeline[]}>({lalu: [], depan: []});
  const [pilih, setPilih] = useState<Pilih>(null);
  const [frame, setFrame] = useState(0);
  const [main, setMain] = useState(false);
  const [zoom, setZoom] = useState(3);
  const [status, setStatus] = useState('Memuat…');
  const [ekspor, setEkspor] = useState<{p: number; teks: string} | null>(null);
  const [pustaka, setPustaka] = useState<Pustaka>(pustakaBawaan as Pustaka);
  const player = useRef<PlayerRef>(null);
  const awal = useRef(true);
  const batal = useRef<AbortController | null>(null);

  // muat timeline & pustaka unggahan
  useEffect(() => {
    muatFont(peta);
    let hidup = true;
    (async () => {
      try {
        const s = await db.doc('timeline/' + videoId).get();
        const data = s.exists ? (s.data().tl as Timeline) : videoId === 'v1' ? (salinan(timelineV1) as unknown as Timeline) : kosong();
        if (hidup) { setTl(data); setStatus(s.exists ? 'Tersimpan' : 'Belum disimpan'); }
      } catch (e) { if (hidup) { setTl(videoId === 'v1' ? (salinan(timelineV1) as unknown as Timeline) : kosong()); setStatus('Tidak bisa memuat data tersimpan'); } }
      try { const p = await db.doc('pustaka/unggahan').get(); if (p.exists && hidup) { const u = p.data(); setPustaka((x) => ({...x, klip: [...x.klip, ...(u.klip || [])], foto: [...x.foto, ...(u.foto || [])], sfx: [...x.sfx, ...(u.sfx || [])]})); } } catch (e) { /* abaikan */ }
    })();
    return () => { hidup = false; };
  }, [db, videoId]);

  // simpan otomatis (jeda 1,2 d setelah perubahan terakhir)
  useEffect(() => {
    if (!tl) return;
    if (awal.current) { awal.current = false; return; }
    setStatus('Menyimpan…');
    const t = setTimeout(async () => {
      try { await db.doc('timeline/' + videoId).set({tl, diubah: Date.now()}); setStatus('Tersimpan ✔'); }
      catch (e: any) { setStatus(e?.code === 'invalid_argument' ? 'Hanya bisa melihat' : 'Gagal menyimpan'); }
    }, 1200);
    return () => clearTimeout(t);
  }, [tl, db, videoId]);

  // ubah timeline; catat=true menyimpan langkah untuk Undo
  const ubah = useCallback((fn: (t: Timeline) => void, catat = true) => {
    setTl((lama) => {
      if (!lama) return lama;
      const baru = salinan(lama);
      fn(baru);
      if (catat) { riwayat.current.lalu.push(lama); if (riwayat.current.lalu.length > 80) riwayat.current.lalu.shift(); riwayat.current.depan = []; }
      return baru;
    });
  }, []);
  const undo = useCallback(() => setTl((t) => { const p = riwayat.current.lalu.pop(); if (!p || !t) return t; riwayat.current.depan.push(t); return p; }), []);
  const redo = useCallback(() => setTl((t) => { const n = riwayat.current.depan.pop(); if (!n || !t) return t; riwayat.current.lalu.push(t); return n; }), []);

  // sinkron playhead
  useEffect(() => {
    const p = player.current; if (!p) return;
    const fu = (e: any) => setFrame(e.detail.frame), pl = () => setMain(true), pa = () => setMain(false);
    p.addEventListener('frameupdate', fu); p.addEventListener('play', pl); p.addEventListener('pause', pa);
    return () => { p.removeEventListener('frameupdate', fu); p.removeEventListener('play', pl); p.removeEventListener('pause', pa); };
  }, [tl !== null]);
  const lompat = useCallback((f: number) => { if (!tl) return; const x = Math.max(0, Math.min(tl.durasi - 1, Math.round(f))); player.current?.seekTo(x); setFrame(x); }, [tl]);

  const item = useMemo(() => {
    if (!tl || !pilih) return null;
    if (pilih.jenis === 'lapis') return tl.lapis.find((l) => l.id === pilih.id) || null;
    if (pilih.jenis === 'sfx') return tl.sfx.find((s) => s.id === pilih.id) || null;
    return tl.vo;
  }, [tl, pilih]);

  const hapus = useCallback(() => {
    if (!pilih) return;
    ubah((t) => { if (pilih.jenis === 'lapis') t.lapis = t.lapis.filter((l) => l.id !== pilih.id); else if (pilih.jenis === 'sfx') t.sfx = t.sfx.filter((s) => s.id !== pilih.id); else t.vo = null; });
    setPilih(null);
  }, [pilih, ubah]);
  const duplikat = useCallback(() => {
    if (!pilih || pilih.jenis === 'vo') return;
    const id = uid(pilih.jenis === 'sfx' ? 's' : 'x');
    ubah((t) => {
      if (pilih.jenis === 'lapis') { const i = t.lapis.findIndex((l) => l.id === pilih.id); if (i < 0) return; const c = {...salinan(t.lapis[i]), id, mulai: t.lapis[i].mulai + t.lapis[i].durasi}; t.lapis.splice(i + 1, 0, c); }
      else { const s = t.sfx.find((x) => x.id === pilih.id); if (s) t.sfx.push({...salinan(s), id, mulai: s.mulai + s.durasi}); }
    });
    setPilih({jenis: pilih.jenis, id});
  }, [pilih, ubah]);
  // potong di playhead (seperti tombol Split di CapCut)
  const potong = useCallback(() => {
    if (!tl || !pilih || pilih.jenis === 'vo') return;
    const daftar: (Lapis | Suara)[] = pilih.jenis === 'lapis' ? tl.lapis : tl.sfx;
    const x = daftar.find((l) => l.id === pilih.id); if (!x) return;
    const potongDi = frame - x.mulai; if (potongDi <= 0 || potongDi >= x.durasi) { setStatus('Geser playhead ke tengah klip yang dipilih untuk memotong'); return; }
    const id = uid('p');
    ubah((t) => {
      const arr: any[] = pilih.jenis === 'lapis' ? t.lapis : t.sfx; const i = arr.findIndex((l) => l.id === pilih.id); const a = arr[i];
      const b = {...salinan(a), id, mulai: a.mulai + potongDi, durasi: a.durasi - potongDi};
      if ('trim' in a || a.jenis === 'video' || pilih.jenis === 'sfx') b.trim = (a.trim || 0) + (potongDi / t.fps) * (a.kecepatan || 1);
      if (a.masuk) b.masuk = 'none';
      a.durasi = potongDi; arr.splice(i + 1, 0, b);
    });
    setPilih({jenis: pilih.jenis, id});
  }, [tl, pilih, frame, ubah]);

  // tambah dari pustaka
  const tambahLapis = useCallback((l: Omit<Lapis, 'id' | 'mulai'> & {mulai?: number}) => {
    const id = uid('n');
    ubah((t) => { const baru = {...l, id, mulai: l.mulai ?? frame} as Lapis; t.lapis.push(baru); t.durasi = Math.max(t.durasi, baru.mulai + baru.durasi); });
    setPilih({jenis: 'lapis', id});
  }, [frame, ubah]);
  const tambahSfx = useCallback((m: Media) => {
    const id = uid('s');
    ubah((t) => { t.sfx.push({id, src: m.src, nama: m.nama, mulai: frame, durasi: Math.max(6, Math.round((m.detik || 1) * t.fps)), volume: 0.4}); });
    setPilih({jenis: 'sfx', id});
  }, [frame, ubah]);
  const pasangVo = useCallback((m: Media) => { ubah((t) => { t.vo = {src: m.src, volume: 1}; t.durasi = Math.max(t.durasi, Math.round((m.detik || 0) * t.fps)); }); setPilih({jenis: 'vo', id: 'vo'}); }, [ubah]);

  // unggah media sendiri
  const unggah = useCallback(async (file: File) => {
    if (!assets) return;
    const jenis = file.type.startsWith('video/') ? 'klip' : file.type.startsWith('image/') ? 'foto' : file.type.startsWith('audio/') ? 'sfx' : null;
    if (!jenis) { setStatus('Format belum didukung. Pakai MP4, PNG/JPG, atau MP3.'); return; }
    setStatus('Mengunggah ' + file.name + '…');
    try {
      const detikMedia = await new Promise<number>((ok) => {
        if (jenis === 'foto') return ok(0);
        const el = document.createElement(jenis === 'klip' ? 'video' : 'audio'); el.preload = 'metadata'; el.onloadedmetadata = () => ok(el.duration || 0); el.onerror = () => ok(0); el.src = URL.createObjectURL(file);
      });
      const r = await assets.upload(file, file.type === 'audio/mpeg' || file.type === 'audio/mp3' ? undefined : undefined);
      const m: Media = {src: '/_blob/' + r.id, nama: file.name.replace(/\.[^.]+$/, '').slice(0, 40), detik: Math.round(detikMedia * 100) / 100};
      setPustaka((p) => ({...p, [jenis]: [...(p as any)[jenis], m]}));
      const d = await db.doc('pustaka/unggahan').get(); const u = d.exists ? d.data() : {};
      await db.doc('pustaka/unggahan').set({...u, [jenis]: [...(u[jenis] || []), m]});
      setStatus('Terunggah ✔ ' + m.nama);
    } catch (e: any) { setStatus(e?.code === 'too_large' ? 'File terlalu besar (maks. 20 MB)' : e?.code === 'unsupported_type' ? 'Jenis file tidak didukung' : 'Gagal mengunggah'); }
  }, [assets, db]);

  // ekspor MP4 di browser
  const mulaiEkspor = useCallback(async () => {
    if (!tl) return;
    const ctrl = new AbortController(); batal.current = ctrl;
    setEkspor({p: 0, teks: 'Menyiapkan…'});
    try {
      let container: 'mp4' | 'webm' = 'mp4', videoCodec: 'h264' | 'vp9' = 'h264';
      let cek = await canRenderMediaOnWeb({container, videoCodec, width: tl.lebar, height: tl.tinggi});
      if (!cek.canRender) { container = 'webm'; videoCodec = 'vp9'; cek = await canRenderMediaOnWeb({container, videoCodec, width: tl.lebar, height: tl.tinggi}); }
      if (!cek.canRender) throw new Error(cek.issues.map((i) => i.message).join(' '));
      const {getBlob} = await renderMediaOnWeb({
        composition: {component: Komposisi as any, id: 'VideoData', width: tl.lebar, height: tl.tinggi, fps: tl.fps, durationInFrames: tl.durasi},
        inputProps: {timeline: tl} as any, container, videoCodec, videoBitrate: 'medium', licenseKey: 'free-license', signal: ctrl.signal,
        onProgress: (p: any) => setEkspor({p: p.progress, teks: `Merender ${Math.round(p.progress * 100)}%`}),
      } as any);
      const blob = await getBlob();
      setEkspor({p: 1, teks: 'Menyimpan hasil…'});
      const nama = `jodohonline-${videoId}.${container}`;
      let pesan = `Selesai: ${(blob.size / 1048576).toFixed(1)} MB (${container.toUpperCase()}).`;
      if (assets && blob.size < 20 * 1048576) {
        const r = await assets.upload(blob, {type: container === 'mp4' ? 'video/mp4' : 'video/webm'});
        await db.doc('video/' + videoId).update({videoAsset: r.id, diubah: Date.now()});
        pesan += ' Video di lembar kerja sudah diganti.';
      }
      if (downloads) { try { await downloads.save({filename: nama, data: blob}); } catch (e) { /* ditolak penonton */ } }
      setEkspor({p: 1, teks: pesan});
    } catch (e: any) {
      if (ctrl.signal.aborted) setEkspor(null);
      else setEkspor({p: 0, teks: 'Ekspor gagal di browser ini: ' + (e?.message || e) + ' — pakai Chrome terbaru, atau klik "Minta Claude render".'});
    }
  }, [tl, assets, db, downloads, videoId]);
  const mintaRender = useCallback(async () => {
    try { await db.doc('video/' + videoId).update({mintaRender: Date.now()}); setStatus('Permintaan render tercatat. Bilang ke Claude: "render video ' + videoId + ' dari Studio Konten".'); }
    catch (e) { setStatus('Gagal mencatat permintaan'); }
  }, [db, videoId]);

  // pintasan keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t && t.closest('input,textarea,select')) return;
      if (e.key === ' ') { e.preventDefault(); player.current?.toggle(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (pilih) { e.preventDefault(); hapus(); } }
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) potong();
      else if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplikat(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lompat(frame - (e.shiftKey ? 30 : 1)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lompat(frame + (e.shiftKey ? 30 : 1)); }
      else if (e.key === 'Escape') setPilih(null);
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [pilih, frame, hapus, potong, duplikat, undo, redo, lompat]);

  if (!tl) return <div className="je-muat">Memuat editor…</div>;
  return (
    <div className="je-app">
      <header className="je-atas">
        <button type="button" className="je-btn" onClick={tutup}>← Studio</button>
        <b className="je-judul">{judul}</b>
        <span className="je-status" role="status">{status}</span>
        <span className="je-sela" />
        <button type="button" className="je-btn" onClick={undo} title="Batalkan (Ctrl+Z)">↶</button>
        <button type="button" className="je-btn" onClick={redo} title="Ulangi (Ctrl+Y)">↷</button>
        <button type="button" className="je-btn" onClick={mintaRender}>Minta Claude render</button>
        <button type="button" className="je-btn je-utama" onClick={mulaiEkspor} disabled={!!ekspor && ekspor.p < 1 && !ekspor.teks.startsWith('Ekspor gagal')}>Ekspor MP4</button>
      </header>
      <div className="je-tengah">
        <PanelPustaka pustaka={pustaka} tl={tl} frame={frame} tambahLapis={tambahLapis} tambahSfx={tambahSfx} pasangVo={pasangVo} unggah={assets ? unggah : null} />
        <div className="je-pratinjau">
          <Pratinjau tl={tl} player={player} pilih={pilih} ubah={ubah} />
          <div className="je-kontrol">
            <button type="button" className="je-btn" onClick={() => lompat(0)} aria-label="Ke awal">⏮</button>
            <button type="button" className="je-btn je-main" onClick={() => player.current?.toggle()} aria-label={main ? 'Jeda' : 'Putar'}>{main ? '⏸' : '▶'}</button>
            <span className="je-waktu">{jam(frame, tl.fps)} / {jam(tl.durasi, tl.fps)}</span>
          </div>
        </div>
        <Inspektur tl={tl} pilih={pilih} item={item} ubah={ubah} pustaka={pustaka} hapus={hapus} duplikat={duplikat} potong={potong} frame={frame} />
      </div>
      <Garis tl={tl} frame={frame} zoom={zoom} setZoom={setZoom} pilih={pilih} setPilih={setPilih} lompat={lompat} ubah={ubah} />
      {ekspor ? (
        <div className="je-modal" role="dialog" aria-label="Ekspor video">
          <div className="je-kotak">
            <b>Ekspor video</b>
            <div className="je-bar"><i style={{width: `${Math.round(ekspor.p * 100)}%`}} /></div>
            <p>{ekspor.teks}</p>
            <div className="je-baris">
              {ekspor.p < 1 && !ekspor.teks.startsWith('Ekspor gagal') ? <button type="button" className="je-btn" onClick={() => batal.current?.abort()}>Batalkan</button> : <button type="button" className="je-btn je-utama" onClick={() => setEkspor(null)}>Tutup</button>}
            </div>
            <small>Biarkan tab ini tetap terbuka selama merender.</small>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- PRATINJAU (+ geser teks langsung di layar)
function Pratinjau({tl, player, pilih, ubah}: {tl: Timeline; player: React.RefObject<PlayerRef | null>; pilih: Pilih; ubah: (fn: (t: Timeline) => void, catat?: boolean) => void}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [lebar, setLebar] = useState(300);
  useEffect(() => { const el = wadah.current; if (!el) return; const ro = new ResizeObserver(() => setLebar(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  const s = lebar / tl.lebar;
  const l = pilih?.jenis === 'lapis' ? (tl.lapis.find((x) => x.id === pilih.id) as LapisTeks | undefined) : undefined;
  const teks = l && (l as any).track === 'teks' ? l : null;
  const y = teks ? teks.y ?? BAWAAN[teks.jenis].y : 0;
  const tinggi = teks ? (teks.ukuran ?? BAWAAN[teks.jenis].ukuran) * (teks.jenis === 'judul' && teks.kecil ? 2.1 : 1.35) + 30 : 0;
  const seret = (e: React.PointerEvent) => {
    if (!teks) return;
    e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const y0 = e.clientY, awalY = y; let pertama = true;
    const gerak = (ev: PointerEvent) => { const ny = Math.round(Math.max(0, Math.min(tl.tinggi - 60, awalY + (ev.clientY - y0) / s))); ubah((t) => { const x = t.lapis.find((q) => q.id === teks.id) as LapisTeks; if (x) x.y = ny; }, pertama); pertama = false; };
    const lepas = () => { removeEventListener('pointermove', gerak); removeEventListener('pointerup', lepas); };
    addEventListener('pointermove', gerak); addEventListener('pointerup', lepas);
  };
  return (
    <div className="je-layar" ref={wadah}>
      <Player ref={player as any} component={Komposisi as any} inputProps={{timeline: tl}} durationInFrames={Math.max(1, tl.durasi)} fps={tl.fps} compositionWidth={tl.lebar} compositionHeight={tl.tinggi} style={{width: '100%', aspectRatio: `${tl.lebar} / ${tl.tinggi}`}} acknowledgeRemotionLicense clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} />
      <div className="je-zona" style={{top: '6%', bottom: '20%', left: '9%', right: '14%'}} aria-hidden="true" />
      {teks ? <div className="je-pegangan" style={{top: y * s - 4, height: tinggi * s}} onPointerDown={seret} title="Seret naik-turun untuk memindah teks"><span>↕ seret</span></div> : null}
    </div>
  );
}

// ---------------------------------------------------------------- PUSTAKA
function PanelPustaka({pustaka, tl, frame, tambahLapis, tambahSfx, pasangVo, unggah}: {pustaka: Pustaka; tl: Timeline; frame: number; tambahLapis: (l: any) => void; tambahSfx: (m: Media) => void; pasangVo: (m: Media) => void; unggah: ((f: File) => void) | null}) {
  const [tab, setTab] = useState<'media' | 'teks' | 'elemen' | 'audio'>('media');
  const fps = tl.fps;
  const masukkan = useRef<HTMLInputElement>(null);
  const TEKS: [string, any][] = [
    ['Subtitle', {track: 'teks', jenis: 'sub', teks: 'Tulis *subtitle* di sini', durasi: 60}],
    ['Judul besar', {track: 'teks', jenis: 'judul', teks: 'Judul', kecil: '', durasi: 75}],
    ['Cap BELUM DI-ACC', {track: 'teks', jenis: 'cap', teks: 'BELUM DI-ACC', warna: '#e23b3b', durasi: 45}],
    ['Cap DI-ACC ✓', {track: 'teks', jenis: 'cap', teks: 'DI-ACC ✓', warna: '#1f9d55', durasi: 45}],
    ['Stiker', {track: 'teks', jenis: 'stiker', teks: "IT'S A MATCH 💘", durasi: 40}],
    ['Chip pilihan', {track: 'teks', jenis: 'chips', teks: 'PILIHAN A|PILIHAN B', nyala: '0', durasi: 60}],
    ['Nama akun', {track: 'teks', jenis: 'akun', teks: '@jodohonline.company', durasi: 150, masuk: 'none'}],
  ];
  const bio = 'Kantor virtual buat cari jodoh, cari teman & curhat\nDaftar → di-ACC Direktur 👑';
  const ELEMEN: [string, any][] = [
    ['Tumpukan komentar penonton', {track: 'elemen', jenis: 'tanya', durasi: 150, masuk: 'none', props: {komentar: 'penonton1|cara daftarnya gimana kak? 🙏\npenonton2|linknya mana min??\npenonton3|harus bayar gak sih?', jeda: 0.7, sensor: true}}],
    ['Balasan komentar', {track: 'elemen', jenis: 'balas', durasi: 90, masuk: 'none', props: {pengguna: 'penonton', komentar: 'tulis pertanyaan penonton', sensor: true}}],
    ['Profil Instagram + Ikuti', {track: 'elemen', jenis: 'profil', durasi: 75, masuk: 'geser-atas', props: {akun: 'jodohonline.company', nama: 'jodohonline 💘', bio, tautan: 'jodohonline.company', postingan: '1', pengikut: 0, mengikuti: '0', ketukDetik: 1.2, sensor: true}}],
    ['Kolom komentar + ketik', {track: 'elemen', jenis: 'komentar', durasi: 75, props: {komentar: 'akun1|DAFTAR|1m|2\nakun2|DAFTAR|3m|1', ketik: 'DAFTAR', ketikDetik: 0.3, akunSaya: 'kamu', sensor: true}}],
    ['Browser HP', {track: 'elemen', jenis: 'browser', durasi: 66, props: {alamat: 'jodohonline.company', halaman: 'foto/beranda.png'}}],
  ];
  return (
    <aside className="je-pustaka" aria-label="Pustaka">
      <div className="je-tab" role="tablist">
        {(['media', 'teks', 'elemen', 'audio'] as const).map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{{media: 'Media', teks: 'Teks', elemen: 'Elemen', audio: 'Audio'}[t]}</button>)}
      </div>
      <p className="je-petunjuk">Klik untuk menaruh di posisi playhead ({jam(frame, fps)}).</p>
      {tab === 'media' ? (
        <div className="je-daftar">
          {unggah ? <><button type="button" className="je-btn je-penuh" onClick={() => masukkan.current?.click()}>⬆ Unggah video / foto / audio</button><input ref={masukkan} type="file" accept="video/mp4,video/webm,image/png,image/jpeg,image/webp,audio/mpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); e.target.value = ''; }} /></> : null}
          <h4>Klip</h4>
          {pustaka.klip.map((m) => <button key={m.src} type="button" className="je-media" onClick={() => tambahLapis({track: 'gambar', jenis: 'video', src: m.src, nama: m.nama, durasi: Math.max(15, Math.round((m.detik || 3) * fps)), masuk: 'none'})}><video src={peta(m.src)} muted preload="metadata" /><span>{m.nama}<small>{m.detik ? m.detik.toFixed(1) + ' d' : ''}</small></span></button>)}
          <h4>Foto</h4>
          {pustaka.foto.map((m) => <button key={m.src} type="button" className="je-media" onClick={() => tambahLapis({track: 'gambar', jenis: 'foto', src: m.src, nama: m.nama, durasi: 60, zoom: 1.06, masuk: 'none'})}><img src={peta(m.src)} alt="" loading="lazy" /><span>{m.nama}</span></button>)}
        </div>
      ) : tab === 'teks' ? (
        <div className="je-daftar">{TEKS.map(([n, l]) => <button key={n} type="button" className="je-preset" onClick={() => tambahLapis(l)}><i>{LABEL[l.jenis]}</i>{n}</button>)}</div>
      ) : tab === 'elemen' ? (
        <div className="je-daftar">{ELEMEN.map(([n, l]) => <button key={n} type="button" className="je-preset" onClick={() => tambahLapis(l)}><i>{LABEL[l.jenis]}</i>{n}</button>)}</div>
      ) : (
        <div className="je-daftar">
          <h4>Efek suara</h4>
          {pustaka.sfx.map((m) => <div key={m.src} className="je-sfx"><button type="button" className="je-dengar" onClick={() => { const a = new Audio(peta(m.src)); a.volume = 0.6; a.play().catch(() => {}); }} aria-label={'Dengar ' + m.nama}>▶</button><button type="button" className="je-preset" onClick={() => tambahSfx(m)}>{m.nama}</button></div>)}
          <h4>Voice-over</h4>
          {pustaka.vo.map((m) => <button key={m.src} type="button" className="je-preset" onClick={() => pasangVo(m)}>🎙 {m.nama}</button>)}
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------- INSPEKTUR
function Angka({label, nilai, set, min, max, step = 1, id}: {label: string; nilai: number; set: (v: number) => void; min?: number; max?: number; step?: number; id: string}) {
  return <label className="je-f" htmlFor={id}><span>{label}</span><input id={id} type="number" value={Number.isFinite(nilai) ? nilai : 0} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} /></label>;
}
function Geser({label, nilai, set, min, max, step = 1, id, satuan = ''}: {label: string; nilai: number; set: (v: number) => void; min: number; max: number; step?: number; id: string; satuan?: string}) {
  return <label className="je-f" htmlFor={id}><span>{label} <em>{nilai}{satuan}</em></span><input id={id} type="range" value={nilai} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} /></label>;
}
function Inspektur({tl, pilih, item, ubah, pustaka, hapus, duplikat, potong, frame}: {tl: Timeline; pilih: Pilih; item: any; ubah: (fn: (t: Timeline) => void, catat?: boolean) => void; pustaka: Pustaka; hapus: () => void; duplikat: () => void; potong: () => void; frame: number}) {
  const fps = tl.fps;
  // ubah satu field item terpilih (pengetikan beruntun digabung jadi satu langkah Undo)
  const kunciTerakhir = useRef('');
  const set = (k: string, v: unknown) => {
    const kunci = (pilih?.id || '') + k, catat = kunciTerakhir.current !== kunci; kunciTerakhir.current = kunci;
    ubah((t) => {
      const x: any = pilih?.jenis === 'lapis' ? t.lapis.find((l) => l.id === pilih.id) : pilih?.jenis === 'sfx' ? t.sfx.find((s) => s.id === pilih.id) : t.vo;
      if (!x) return;
      if (k.startsWith('props.')) x.props[k.slice(6)] = v; else if (v === undefined) delete x[k]; else x[k] = v;
      if (k === 'mulai' || k === 'durasi') t.durasi = Math.max(t.durasi, (x.mulai || 0) + (x.durasi || 0));
    }, catat);
  };
  if (!pilih || !item) {
    return (
      <aside className="je-inspektur" aria-label="Properti">
        <h3>Proyek</h3>
        <Angka id="je-durasi" label="Durasi video (detik)" nilai={+(tl.durasi / fps).toFixed(2)} step={0.1} min={1} set={(v) => ubah((t) => { t.durasi = Math.max(1, Math.round(v * fps)); })} />
        <button type="button" className="je-btn je-penuh" onClick={() => ubah((t) => { t.durasi = ujung(t); })}>Pas-kan durasi ke isi timeline</button>
        <p className="je-petunjuk">Pilih klip di timeline untuk mengubah teks, posisi, waktu, dan animasinya.</p>
        <h3>Pintasan</h3>
        <ul className="je-pintas"><li><kbd>Spasi</kbd> putar/jeda</li><li><kbd>S</kbd> potong di playhead</li><li><kbd>Ctrl</kbd>+<kbd>D</kbd> duplikat</li><li><kbd>Delete</kbd> hapus</li><li><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> batal / ulang</li><li><kbd>←</kbd> <kbd>→</kbd> geser 1 frame (<kbd>Shift</kbd> 1 detik)</li></ul>
      </aside>
    );
  }
  const waktu = pilih.jenis !== 'vo' ? (
    <div className="je-dua">
      <Angka id="je-mulai" label="Mulai (detik)" nilai={+(item.mulai / fps).toFixed(2)} step={0.05} min={0} set={(v) => set('mulai', Math.max(0, Math.round(v * fps)))} />
      <Angka id="je-dur" label="Durasi (detik)" nilai={+(item.durasi / fps).toFixed(2)} step={0.05} min={0.1} set={(v) => set('durasi', Math.max(1, Math.round(v * fps)))} />
    </div>
  ) : null;
  const animasi = pilih.jenis === 'lapis' ? (
    <div className="je-dua">
      <label className="je-f" htmlFor="je-masuk"><span>Animasi masuk</span><select id="je-masuk" value={item.masuk ?? 'bawaan'} onChange={(e) => set('masuk', e.target.value === 'bawaan' ? undefined : e.target.value)}><option value="bawaan">Bawaan</option><option value="none">Tanpa</option><option value="fade">Muncul pelan</option><option value="pop">Pop</option><option value="banting">Banting</option><option value="geser-atas">Geser dari bawah</option><option value="geser-kiri">Geser dari kanan</option></select></label>
      <label className="je-f" htmlFor="je-keluar"><span>Animasi keluar</span><select id="je-keluar" value={item.keluar ?? 'none'} onChange={(e) => set('keluar', e.target.value)}><option value="none">Tanpa</option><option value="fade">Hilang pelan</option></select></label>
    </div>
  ) : null;
  const aksi = (
    <div className="je-baris">
      {pilih.jenis !== 'vo' ? <button type="button" className="je-btn" onClick={potong} title="S">✂ Potong</button> : null}
      {pilih.jenis !== 'vo' ? <button type="button" className="je-btn" onClick={duplikat} title="Ctrl+D">⧉ Duplikat</button> : null}
      <button type="button" className="je-btn je-bahaya" onClick={hapus} title="Delete">🗑 Hapus</button>
    </div>
  );
  let isi: React.ReactNode = null;
  if (pilih.jenis === 'vo') isi = <><Geser id="je-vol" label="Volume" nilai={Math.round(item.volume * 100)} min={0} max={200} satuan="%" set={(v) => set('volume', v / 100)} /><label className="je-f" htmlFor="je-vosrc"><span>Rekaman</span><select id="je-vosrc" value={item.src} onChange={(e) => set('src', e.target.value)}>{[...pustaka.vo, ...pustaka.sfx].map((m) => <option key={m.src} value={m.src}>{m.nama}</option>)}</select></label></>;
  else if (pilih.jenis === 'sfx') isi = <><label className="je-f" htmlFor="je-sfx"><span>Suara</span><select id="je-sfx" value={item.src} onChange={(e) => set('src', e.target.value)}>{pustaka.sfx.map((m) => <option key={m.src} value={m.src}>{m.nama}</option>)}</select></label><Geser id="je-vol" label="Volume" nilai={Math.round(item.volume * 100)} min={0} max={200} satuan="%" set={(v) => set('volume', v / 100)} /></>;
  else if (item.track === 'gambar') {
    isi = item.jenis === 'video' ? <>
      <label className="je-f" htmlFor="je-src"><span>Klip</span><select id="je-src" value={item.src} onChange={(e) => set('src', e.target.value)}>{pustaka.klip.map((m) => <option key={m.src} value={m.src}>{m.nama}</option>)}</select></label>
      <div className="je-dua"><Angka id="je-trim" label="Mulai dari detik ke-" nilai={item.trim || 0} step={0.1} min={0} set={(v) => set('trim', Math.max(0, v))} /><Angka id="je-cepat" label="Kecepatan" nilai={item.kecepatan || 1} step={0.05} min={0.25} max={3} set={(v) => set('kecepatan', v)} /></div>
      <Geser id="je-gelap" label="Gelapkan" nilai={Math.round((item.gelap || 0) * 100)} min={0} max={90} satuan="%" set={(v) => set('gelap', v / 100)} />
    </> : <>
      <label className="je-f" htmlFor="je-src"><span>Foto</span><select id="je-src" value={item.src} onChange={(e) => set('src', e.target.value)}>{pustaka.foto.map((m) => <option key={m.src} value={m.src}>{m.nama}</option>)}</select></label>
      <Geser id="je-zoom" label="Zoom akhir" nilai={Math.round((item.zoom || 1) * 100)} min={100} max={150} satuan="%" set={(v) => set('zoom', v / 100)} />
    </>;
  } else if (item.track === 'teks') {
    const b = BAWAAN[item.jenis as LapisTeks['jenis']];
    isi = <>
      <label className="je-f" htmlFor="je-teks"><span>{item.jenis === 'chips' ? 'Pilihan (pisah dengan |)' : 'Teks'}{item.jenis === 'sub' ? ' — *kata* jadi kuning' : ''}</span><textarea id="je-teks" rows={3} value={item.teks} onChange={(e) => set('teks', e.target.value)} /></label>
      {item.jenis === 'judul' ? <label className="je-f" htmlFor="je-kecil"><span>Baris kecil</span><input id="je-kecil" value={item.kecil || ''} onChange={(e) => set('kecil', e.target.value)} /></label> : null}
      {item.jenis === 'chips' ? <label className="je-f" htmlFor="je-nyala"><span>Yang menyala (urutan mulai 0, pisah koma)</span><input id="je-nyala" value={item.nyala || ''} onChange={(e) => set('nyala', e.target.value)} /></label> : null}
      <Geser id="je-y" label="Posisi dari atas" nilai={item.y ?? b.y} min={0} max={1860} step={5} satuan="px" set={(v) => set('y', v)} />
      {item.jenis === 'cap' || item.jenis === 'akun' ? <Geser id="je-x" label={item.kanan != null ? 'Jarak dari kanan' : 'Jarak dari kiri'} nilai={item.kanan ?? item.x ?? b.x ?? 0} min={0} max={900} step={5} satuan="px" set={(v) => set(item.kanan != null ? 'kanan' : 'x', v)} /> : null}
      <Geser id="je-ukuran" label="Ukuran huruf" nilai={item.ukuran ?? b.ukuran} min={20} max={200} satuan="px" set={(v) => set('ukuran', v)} />
      {item.jenis === 'cap' || item.jenis === 'stiker' ? <Geser id="je-miring" label="Kemiringan" nilai={item.miring ?? (item.jenis === 'cap' ? -9 : -4)} min={-30} max={30} satuan="°" set={(v) => set('miring', v)} /> : null}
      {item.jenis !== 'chips' ? <label className="je-f" htmlFor="je-warna"><span>Warna</span><input id="je-warna" type="color" value={item.warna || ({sub: '#ffffff', judul: '#ffd23f', cap: '#1f9d55', stiker: '#ff4f7b', akun: '#ffffff'} as any)[item.jenis] || '#ffffff'} onChange={(e) => set('warna', e.target.value)} /></label> : null}
      <p className="je-petunjuk">Tip: seret kotak kuning di layar pratinjau untuk memindah teks naik-turun.</p>
    </>;
  } else {
    isi = <>{Object.entries(item.props as Record<string, unknown>).map(([k, v]) => typeof v === 'boolean'
      ? <label key={k} className="je-cek" htmlFor={'je-p-' + k}><input id={'je-p-' + k} type="checkbox" checked={v} onChange={(e) => set('props.' + k, e.target.checked)} /> {k === 'sensor' ? 'Sensor (buramkan nama & angka)' : k === 'sudahIkut' ? 'Sudah mengikuti sejak awal' : k}</label>
      : typeof v === 'number' ? <Angka key={k} id={'je-p-' + k} label={k === 'ketukDetik' ? 'Detik diketuk' : k === 'ketikDetik' ? 'Mulai mengetik (detik)' : k === 'jeda' ? 'Jeda antar komentar (detik)' : k} nilai={v} step={k.endsWith('Detik') ? 0.1 : 1} set={(n) => set('props.' + k, n)} />
      : <label key={k} className="je-f" htmlFor={'je-p-' + k}><span>{k === 'komentar' ? (item.jenis === 'komentar' ? 'Komentar (user|teks|waktu|suka per baris)' : 'Komentar (user|teks per baris)') : k === 'target' ? 'Yang diketuk (ikuti / tautan)' : k}</span>{String(v).includes('\n') || String(v).length > 40 ? <textarea id={'je-p-' + k} rows={4} value={String(v)} onChange={(e) => set('props.' + k, e.target.value)} /> : <input id={'je-p-' + k} value={String(v)} onChange={(e) => set('props.' + k, e.target.value)} />}</label>)}</>;
  }
  return (
    <aside className="je-inspektur" aria-label="Properti">
      <h3>{pilih.jenis === 'vo' ? '🎙 Voice-over' : pilih.jenis === 'sfx' ? '🔊 ' + (item.nama || 'Efek suara') : LABEL[item.jenis] + ' ' + NAMA_JENIS[item.jenis]}</h3>
      {pilih.jenis === 'lapis' && item.track !== 'teks' ? <label className="je-f" htmlFor="je-nama"><span>Nama di timeline</span><input id="je-nama" value={item.nama || ''} onChange={(e) => set('nama', e.target.value)} /></label> : null}
      {waktu}
      {isi}
      {animasi}
      {aksi}
      <p className="je-petunjuk">Playhead di {detik(frame, fps)}.</p>
    </aside>
  );
}

// ---------------------------------------------------------------- TIMELINE
type Balok = {id: string; jenis: 'lapis' | 'sfx' | 'vo'; mulai: number; durasi: number; label: string; kelas: string};
function susun(balok: Balok[]) {
  const baris: number[] = []; const hasil: (Balok & {baris: number})[] = [];
  for (const b of [...balok].sort((a, c) => a.mulai - c.mulai)) {
    let r = baris.findIndex((akhir) => akhir <= b.mulai); if (r < 0) { r = baris.length; baris.push(0); }
    baris[r] = b.mulai + b.durasi; hasil.push({...b, baris: r});
  }
  return {hasil, jumlah: Math.max(1, baris.length)};
}
function Garis({tl, frame, zoom, setZoom, pilih, setPilih, lompat, ubah}: {tl: Timeline; frame: number; zoom: number; setZoom: (z: number) => void; pilih: Pilih; setPilih: (p: Pilih) => void; lompat: (f: number) => void; ubah: (fn: (t: Timeline) => void, catat?: boolean) => void}) {
  const pxf = zoom / 2; // piksel per frame
  const total = Math.max(tl.durasi, ujung(tl)) + 90;
  const TRACK: [string, string, Balok[]][] = [
    ['teks', '🔤 Teks', tl.lapis.filter((l) => l.track === 'teks').map((l) => ({id: l.id, jenis: 'lapis' as const, mulai: l.mulai, durasi: l.durasi, label: labelLapis(l), kelas: 'je-k-teks je-j-' + l.jenis}))],
    ['elemen', '📱 Elemen', tl.lapis.filter((l) => l.track === 'elemen').map((l) => ({id: l.id, jenis: 'lapis' as const, mulai: l.mulai, durasi: l.durasi, label: labelLapis(l), kelas: 'je-k-elemen'}))],
    ['gambar', '🎬 Gambar', tl.lapis.filter((l) => l.track === 'gambar').map((l) => ({id: l.id, jenis: 'lapis' as const, mulai: l.mulai, durasi: l.durasi, label: (LABEL[l.jenis] || '') + ' ' + labelLapis(l), kelas: 'je-k-gambar'}))],
    ['sfx', '🔊 Efek suara', tl.sfx.map((s) => ({id: s.id, jenis: 'sfx' as const, mulai: s.mulai, durasi: s.durasi, label: s.nama || s.src, kelas: 'je-k-sfx'}))],
    ['vo', '🎙 Voice-over', tl.vo ? [{id: 'vo', jenis: 'vo' as const, mulai: 0, durasi: tl.durasi, label: tl.vo.src, kelas: 'je-k-vo'}] : []],
  ];
  const tepi = useMemo(() => [0, ...tl.lapis.flatMap((l) => [l.mulai, l.mulai + l.durasi]), ...tl.sfx.flatMap((s) => [s.mulai, s.mulai + s.durasi])], [tl]);
  const tarik = (e: React.PointerEvent, b: Balok, mode: 'geser' | 'kiri' | 'kanan') => {
    e.stopPropagation(); setPilih({jenis: b.jenis, id: b.id});
    if (b.jenis === 'vo') return;
    e.preventDefault();
    const x0 = e.clientX; let pertama = true;
    const asal: any = b.jenis === 'lapis' ? tl.lapis.find((l) => l.id === b.id) : tl.sfx.find((s) => s.id === b.id);
    const adaTrim = b.jenis === 'sfx' || asal?.jenis === 'video', trimAwal = asal?.trim || 0, kec = asal?.kecepatan || 1;
    const jepret = (f: number, sendiri: number[]) => { const c = [frame, ...tepi.filter((t) => !sendiri.includes(t))]; for (const t of c) if (Math.abs(t - f) * pxf < 7) return t; return f; };
    const gerak = (ev: PointerEvent) => {
      const df = Math.round((ev.clientX - x0) / pxf); if (!df && pertama) return;
      ubah((t) => {
        const x: any = b.jenis === 'lapis' ? t.lapis.find((l) => l.id === b.id) : t.sfx.find((s) => s.id === b.id); if (!x) return;
        const akhir = b.mulai + b.durasi, sendiri = [b.mulai, akhir];
        if (mode === 'geser') { let m = Math.max(0, b.mulai + df); const mj = jepret(m, sendiri), aj = jepret(m + b.durasi, sendiri); if (mj !== m) m = mj; else if (aj !== m + b.durasi) m = aj - b.durasi; x.mulai = Math.max(0, m); }
        if (mode === 'kiri') { const m = Math.min(akhir - 3, Math.max(0, jepret(b.mulai + df, sendiri))); x.mulai = m; x.durasi = akhir - m; if (adaTrim) x.trim = Math.max(0, trimAwal + ((m - b.mulai) / t.fps) * kec); }
        if (mode === 'kanan') { const a = Math.max(b.mulai + 3, jepret(akhir + df, sendiri)); x.durasi = a - b.mulai; }
        t.durasi = Math.max(t.durasi, x.mulai + x.durasi);
      }, pertama);
      pertama = false;
    };
    const lepas = () => { removeEventListener('pointermove', gerak); removeEventListener('pointerup', lepas); };
    addEventListener('pointermove', gerak); addEventListener('pointerup', lepas);
  };
  const seretKepala = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement, kiri = el.getBoundingClientRect().left;
    const ke = (cx: number) => lompat((cx - kiri) / pxf);
    ke(e.clientX);
    const gerak = (ev: PointerEvent) => ke(ev.clientX);
    const lepas = () => { removeEventListener('pointermove', gerak); removeEventListener('pointerup', lepas); };
    addEventListener('pointermove', gerak); addEventListener('pointerup', lepas);
  };
  const langkahLabel = zoom >= 4 ? 1 : zoom >= 2 ? 2 : 5;
  return (
    <section className="je-garis" aria-label="Timeline">
      <div className="je-garisAtas">
        <span>Timeline · {tl.lapis.length + tl.sfx.length} item</span>
        <label className="je-zoom" htmlFor="je-zoom">Zoom <input id="je-zoom" type="range" min={0.6} max={8} step={0.2} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
      </div>
      <div className="je-gulir">
        <div className="je-label">
          <div className="je-penggaris-l" />
          {TRACK.map(([k, n, b]) => <div key={k} className="je-namaTrack" style={{height: susun(b).jumlah * 30 + 8}}>{n}</div>)}
        </div>
        <div className="je-isi" style={{width: total * pxf}} onPointerDown={(e) => { if (e.target === e.currentTarget) setPilih(null); }}>
          <div className="je-penggaris" onPointerDown={seretKepala}>
            {Array.from({length: Math.ceil(total / tl.fps / langkahLabel) + 1}, (_, i) => <span key={i} style={{left: i * langkahLabel * tl.fps * pxf}}>{i * langkahLabel}d</span>)}
          </div>
          {TRACK.map(([k, , b]) => {
            const {hasil, jumlah} = susun(b);
            return (
              <div key={k} className="je-track" style={{height: jumlah * 30 + 8}} onPointerDown={(e) => { if (e.target === e.currentTarget) setPilih(null); }}>
                {hasil.map((x) => (
                  <div key={x.id} className={'je-klip ' + x.kelas + (pilih?.id === x.id ? ' je-aktif' : '')} style={{left: x.mulai * pxf, width: Math.max(4, x.durasi * pxf), top: 4 + x.baris * 30}} onPointerDown={(e) => tarik(e, x, 'geser')} title={`${x.label} · ${detik(x.mulai, tl.fps)} → ${detik(x.mulai + x.durasi, tl.fps)}`}>
                    {x.jenis !== 'vo' ? <i className="je-h je-hk" onPointerDown={(e) => tarik(e, x, 'kiri')} /> : null}
                    <span>{x.label}</span>
                    {x.jenis !== 'vo' ? <i className="je-h je-hn" onPointerDown={(e) => tarik(e, x, 'kanan')} /> : null}
                  </div>
                ))}
              </div>
            );
          })}
          <div className="je-akhir" style={{left: tl.durasi * pxf}} title="Akhir video" />
          <div className="je-kepala" style={{left: frame * pxf}} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- API untuk halaman Studio Konten
declare global { interface Window { JodohEditor: any } }
window.JodohEditor = {
  buka(o: {videoId: string; judul: string; db: Db; assets: any; downloads: any; tutup?: () => void}) {
    if (!document.getElementById('je-gaya')) { const s = document.createElement('style'); s.id = 'je-gaya'; s.textContent = CSS; document.head.append(s); }
    const host = document.createElement('div'); host.className = 'je-root'; document.body.append(host);
    document.documentElement.style.overflow = 'hidden';
    const root = createRoot(host);
    const tutup = () => { root.unmount(); host.remove(); document.documentElement.style.overflow = ''; o.tutup?.(); };
    root.render(<App videoId={o.videoId} judul={o.judul} db={o.db} assets={o.assets} downloads={o.downloads} tutup={tutup} />);
  },
};
