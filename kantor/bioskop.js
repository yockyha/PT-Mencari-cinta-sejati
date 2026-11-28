// =====================================================================
//  🎬 BIOSKOP CINTA (Taman Cinta): nonton film bareng, sinkron untuk
//  semua tamu di dalam bioskop.
//  • Katalog film pendek (±5 menit, Blender Open Movies, lisensi CC).
//  • Tamu boleh memutar film katalog saat layar sedang kosong, atau
//    menonton sendiri (tidak sinkron).
//  • Direktur: tambah film YouTube apa saja, putar sekarang, jadwal
//    penayangan (otomatis diputar & diumumkan), hentikan tayangan.
//  Data: bioskop/film/<id> {v,j,d,s} · bioskop/jadwal/<id> {f,mulai,n}
//        bioskop/tayang {f,mulai,akhir,uid,n}
//  Catatan: kunci katalog di bawah harus sama dengan regex di
//  alat/aturan/69_bioskop.py (KATALOG_ID).
// =====================================================================
import { esc, bersih, LS } from '../js/common.js?v=202611280851';
import { K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611280851';
import * as Musik from './musik.js?v=202611280851';

export const AREA = [-78, -24, -62, -6];        // x1, z1, x2, z2 (sama dengan gedung.js)
export const PINTU = { x: -60.2, z: -15, r: -Math.PI / 2 };
// d = durasi tayang (detik), s = mulai dari detik ke-
export const KATALOG = {
  bbb: { v: 'aqz-KE-bpKQ', j: 'Big Buck Bunny', g: '😂 Komedi', d: 300, s: 0, ket: 'Kelinci raksasa yang baik hati membalas tiga hewan usil.' },
  agent: { v: 'mN0zPOpADL4', j: 'Agent 327: Operation Barbershop', g: '🕵️ Aksi', d: 232, s: 0, ket: 'Agen rahasia menyamar di tempat cukur yang mencurigakan.' },
  coffee: { v: 'PVGeM40dABA', j: 'Coffee Run', g: '☕ Komedi', d: 185, s: 0, ket: 'Perjalanan kopi pagi yang makin lama makin kacau.' },
  hero: { v: 'pKmSdY56VtY', j: 'HERO', g: '⚔️ Petualangan', d: 239, s: 0, ket: 'Pertarungan pahlawan dengan gaya lukisan tangan.' },
  charge: { v: 'UXqq0ZvbOnk', j: 'CHARGE', g: '💥 Aksi', d: 242, s: 0, ket: 'Pencuri energi di kota masa depan yang sedang mati lampu.' },
  wingit: { v: 'u9lj-c29dxI', j: 'Wing It!', g: '🚀 Komedi', d: 255, s: 0, ket: 'Kucing & anjing membangun roket dari barang bekas.' },
  llama: { v: 'SkVqJ1SGeL0', j: 'Caminandes 3: Llamigos', g: '🦙 Komedi', d: 152, s: 0, ket: 'Llama lucu berebut buah beri dengan seekor penguin.' },
  spring: { v: 'WhWc3b3KhnY', j: 'Spring', g: '🌸 Fantasi', d: 300, s: 0, ket: 'Gadis gembala & anjingnya bertemu roh hutan.' },
  sintel: { v: 'eRsGyueVLvQ', j: 'Sintel (cuplikan 5 menit)', g: '🐉 Drama', d: 300, s: 0, ket: 'Kisah persahabatan seorang gadis dan naga kecilnya.' },
  sprite: { v: '_cMxraX_5RE', j: 'Sprite Fright (cuplikan)', g: '👻 Horor-komedi', d: 300, s: 0, ket: 'Liburan remaja di hutan berubah jadi teror makhluk jamur.' },
};

const ST = { film: {}, jadwal: {}, tayang: null, kartu: false, diumumkan: new Set(), pribadi: null };
const dir = () => !!(K.L && K.peran[K.L.uid] === 'direktur');
const kini = () => (K.L ? K.L.db.now() : Date.now());
export const filmDari = f => KATALOG[f] || ST.film[f] || null;
const thumb = v => `https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
const mmss = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const jamWIB = t => new Date(t).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
export const dalam = (x, z) => x >= AREA[0] && x <= AREA[2] && z >= AREA[1] && z <= AREA[3];

// tayangan aktif (jadwal Direktur diutamakan)
export function aktif() {
  const t = kini();
  let best = null;
  for (const [id, j] of Object.entries(ST.jadwal)) {
    const f = j && filmDari(j.f); if (!f) continue;
    if (j.mulai <= t && t < j.mulai + f.d * 1000 && (!best || j.mulai > best.mulai)) best = { id, f: j.f, film: f, mulai: j.mulai, akhir: j.mulai + f.d * 1000, sumber: 'jadwal', n: j.n || 'Direktur' };
  }
  if (best) return best;
  const y = ST.tayang, f = y && filmDari(y.f);
  if (f && y.mulai <= t + 5000 && t < y.akhir) return { f: y.f, film: f, mulai: y.mulai, akhir: y.akhir, sumber: 'tayang', n: y.n || 'Tamu' };
  return null;
}
const berikutnya = () => Object.entries(ST.jadwal).filter(([, j]) => j && filmDari(j.f) && j.mulai > kini()).sort((a, b) => a[1].mulai - b[1].mulai);
// putaran yang dilihat pemain ini (menonton sendiri diutamakan)
function putaranSaya() {
  const p = ST.pribadi;
  if (p && Date.now() < p.akhir) return { ...p, pribadi: true };
  ST.pribadi = null;
  return aktif();
}
export const nyala = () => !!(K.saya && yt && ytSiap && suaraOk && !tersembunyi && putaranSaya() && (ST.pribadi || dalam(K.saya.x, K.saya.z)));

// ---------------------------------------------------------------- DATA
export function mulai() {
  const db = K.L.db;
  db.on('bioskop/film', v => { ST.film = v || {}; if (ST.kartu) buka(); });
  db.on('bioskop/jadwal', v => { ST.jadwal = v || {}; if (ST.kartu) buka(); });
  db.on('bioskop/tayang', v => { ST.tayang = v && v.f ? v : null; if (ST.kartu) buka(); });
  setInterval(atur, 1000);
}

// pengumuman otomatis saat jadwal dimulai / 5 menit sebelumnya (untuk semua yang online)
function cekJadwal() {
  const t = kini();
  for (const [id, j] of Object.entries(ST.jadwal)) {
    const f = j && filmDari(j.f); if (!f) continue;
    const k5 = id + '_5', k0 = id + '_0';
    if (!ST.diumumkan.has(k5) && j.mulai - t <= 300000 && j.mulai - t > 240000) { ST.diumumkan.add(k5); toast(`🎬 5 menit lagi "${f.j}" tayang di Bioskop Cinta (Taman Cinta). Siapkan popcorn! 🍿`, 6000); }
    if (!ST.diumumkan.has(k0) && t >= j.mulai && t < j.mulai + 60000) { ST.diumumkan.add(k0); ST.diumumkan.add(k5); toast(`🎬 Film "${f.j}" MULAI tayang di Bioskop Cinta! Yuk ke Taman Cinta 🍿`, 7000); Musik.sfx('notif'); }
    if (t >= j.mulai + f.d * 1000) { ST.diumumkan.add(k5); ST.diumumkan.add(k0); }
  }
  // jadwal yang sudah lewat 1 hari dibersihkan oleh Direktur
  if (dir()) for (const [id, j] of Object.entries(ST.jadwal)) if (j && j.mulai < t - 86400e3) K.L.db.set('bioskop/jadwal/' + id, null).catch(() => {});
}

// ---------------------------------------------------------------- 📺 PEMUTAR YOUTUBE
let yt = null, ytSiap = false, ytMuat = null, suaraOk = false, besar = LS.get('bioskopBesar', true), tersembunyi = false, dimuat = '', volUser = LS.get('bioskopVol', 90);
function muatAPI() {
  return (ytMuat ||= new Promise(res => {
    if (window.YT && window.YT.Player) return res();
    const lama = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { lama && lama(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s);
  }));
}
function wadah() {
  let w = document.getElementById('bioskopPemutar'); if (w) return w;
  w = document.createElement('div'); w.id = 'bioskopPemutar'; w.hidden = true;
  w.innerHTML = `<style>
    #bioskopPemutar{position:fixed;z-index:41;background:#0d0a12;border:2px solid #ffd23f;border-radius:14px;padding:6px;color:#fff;font:700 12px Nunito,sans-serif;box-shadow:0 10px 30px #000b;transition:width .2s}
    #bioskopPemutar[hidden]{display:none}
    #bioskopPemutar.besar{left:50%;top:64px;transform:translateX(-50%);width:min(94vw,760px)}
    #bioskopPemutar.kecil{right:8px;top:118px;width:220px}
    #bioskopPemutar .yt{position:relative;width:100%;aspect-ratio:16/9;border-radius:9px;overflow:hidden;background:#000}
    #bioskopPemutar .yt iframe,#bioskopPemutar .yt>div{position:absolute;inset:0;width:100%!important;height:100%!important}
    #bioskopPemutar .jd{margin:6px 2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}
    #bioskopPemutar .bar{height:4px;border-radius:3px;background:#ffffff22;overflow:hidden;margin:0 2px 6px}#bioskopPemutar .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff4f7b,#ffd23f);width:0}
    #bioskopPemutar .br{display:flex;gap:6px;align-items:center;flex-wrap:wrap}#bioskopPemutar input{flex:1;min-width:60px;accent-color:#ffd23f}
    #bioskopPemutar button{border:0;border-radius:8px;padding:5px 9px;font:800 12px Nunito,sans-serif;cursor:pointer;background:#ffd23f;color:#1b1220}
    #bioskopPemutar button.p{background:#ffffff1f;color:#fff}</style>
    <div class="yt"><div id="bioskopYT"></div></div><div class="jd" id="bioskopJudul">🎬 Bioskop Cinta</div><div class="bar"><i id="bioskopBar"></i></div>
    <div class="br"><button type="button" id="bioskopSuara">🔊 Nyalakan suara</button><input type="range" id="bioskopVol" min="0" max="100" aria-label="Volume film">
    <button type="button" class="p" id="bioskopUkuran">⤢</button><button type="button" class="p" id="bioskopX" aria-label="Sembunyikan layar">✕</button></div>`;
  document.body.append(w);
  w.className = besar ? 'besar' : 'kecil';
  const v = w.querySelector('#bioskopVol'); v.value = volUser; v.oninput = () => { volUser = +v.value; LS.set('bioskopVol', volUser); if (yt && ytSiap) yt.setVolume(volUser); };
  w.querySelector('#bioskopSuara').onclick = nyalakanSuara;
  w.querySelector('#bioskopUkuran').onclick = () => { besar = !besar; LS.set('bioskopBesar', besar); w.className = besar ? 'besar' : 'kecil'; };
  w.querySelector('#bioskopX').onclick = () => { tersembunyi = true; w.hidden = true; if (yt && ytSiap) yt.mute(); toast('Layar disembunyikan. Ketuk "🎬 Nonton film" di depan layar untuk menonton lagi.'); };
  return w;
}
function nyalakanSuara() {
  suaraOk = true; tersembunyi = false;
  if (yt && ytSiap) { yt.unMute(); yt.setVolume(volUser); yt.playVideo(); sinkron(true); }
  const b = document.getElementById('bioskopSuara'); if (b) b.hidden = true;
}
async function siapkan() {
  if (yt) return;
  wadah(); await muatAPI(); if (yt) return;
  yt = new window.YT.Player('bioskopYT', {
    width: 320, height: 180, playerVars: { playsinline: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
    events: {
      onReady: () => { ytSiap = true; if (suaraOk) { yt.unMute(); yt.setVolume(volUser); } else yt.mute(); dimuat = ''; atur(); },
      onStateChange: e => { if (e.data === 0) { const p = putaranSaya(); if (p && p.pribadi) ST.pribadi = null; dimuat = 'selesai:' + (p ? p.f + p.mulai : ''); judul('🎬 Film selesai. Terima kasih sudah menonton! 🍿'); } },
      onError: e => { if ([100, 101, 150, 153].includes(e.data)) toast('🎬 Film ini tidak bisa diputar di luar YouTube (dibatasi pemiliknya). Pilih film lain ya.', 5000); },
    },
  });
}
const judul = s => { const j = document.getElementById('bioskopJudul'); if (j) j.textContent = s; };
function muat(p) {
  const kunci = p.f + p.mulai;
  if (dimuat === kunci || dimuat === 'selesai:' + kunci) return;
  dimuat = kunci;
  const pos = p.film.s + Math.max(0, (p.pribadi ? Date.now() : kini()) - p.mulai) / 1000;
  yt.loadVideoById({ videoId: p.film.v, startSeconds: Math.floor(pos), endSeconds: p.film.s + p.film.d });
  if (suaraOk) { yt.unMute(); yt.setVolume(volUser); } else yt.mute();
  judul(`${p.pribadi ? '👤' : '🎬'} ${p.film.j}`);
}
// sinkron dengan waktu mulai di database (toleransi 3 detik)
function sinkron(paksa = false) {
  const p = putaranSaya(); if (!p || !yt || !ytSiap || !yt.getCurrentTime || dimuat !== p.f + p.mulai) return;
  const target = p.film.s + ((p.pribadi ? Date.now() : kini()) - p.mulai) / 1000;
  if (target >= p.film.s + p.film.d) return;
  if (paksa || Math.abs(yt.getCurrentTime() - target) > 3) yt.seekTo(target, true);
}
let aturN = 0;
function atur() {
  const s = K.saya; if (!s || !K.L) return;
  cekJadwal();
  const p = putaranSaya(), di = dalam(s.x, s.z), tampil = !!p && (p.pribadi || di) && !tersembunyi;
  if (!di && !p?.pribadi) tersembunyi = false;              // keluar bioskop: lain kali tampil lagi
  if (tampil && !yt) { siapkan(); return; }
  const w = document.getElementById('bioskopPemutar');
  if (w) w.hidden = !tampil;
  if (!yt || !ytSiap) return;
  if (!tampil) { if (yt.getPlayerState && [1, 3].includes(yt.getPlayerState())) yt.pauseVideo(); if (!p) dimuat = ''; return; }
  muat(p);
  if (dimuat.startsWith('selesai:')) return;
  if (![1, 3].includes(yt.getPlayerState())) yt.playVideo();
  if (suaraOk) { if (yt.isMuted && yt.isMuted()) yt.unMute(); } else yt.mute();
  const b = document.getElementById('bioskopSuara'); if (b) b.hidden = suaraOk;
  const lewat = ((p.pribadi ? Date.now() : kini()) - p.mulai) / 1000;
  const bar = document.getElementById('bioskopBar'); if (bar) bar.style.width = Math.min(100, lewat / p.film.d * 100) + '%';
  judul(`${p.pribadi ? '👤 Nonton sendiri · ' : '🎬 '}${p.film.j} · ${mmss(lewat)} / ${mmss(p.film.d)}`);
  if (++aturN % 5 === 0) sinkron();
}

// ---------------------------------------------------------------- 🖥️ LAYAR 3D
const gambarCache = {};
function gambar(v) {
  if (gambarCache[v]) return gambarCache[v];
  const img = new Image(); img.crossOrigin = 'anonymous'; img.src = thumb(v); img.siap = false; img.onload = () => { img.siap = true; }; img.onerror = () => { img.gagal = true; };
  return (gambarCache[v] = img);
}
export function gambarLayar(c, w, h) {
  const t = performance.now() / 1000, p = aktif(), nx = berikutnya()[0];
  const gr = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.4); gr.addColorStop(0, '#2c2040'); gr.addColorStop(1, '#07060a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if (p) {
    const img = gambar(p.film.v);
    if (img.siap) { const ih = h - 70, iw = ih * 4 / 3; try { c.drawImage(img, (w - iw) / 2, 8, iw, ih); } catch (e) { img.siap = false; } }
    c.fillStyle = '#0009'; c.fillRect(0, h - 92, w, 92);
    c.fillStyle = '#ffd23f'; c.font = 'bold 30px Nunito, sans-serif'; c.fillText('▶ SEDANG TAYANG · ' + p.film.j, w / 2, h - 52, w - 40);
    const lewat = (kini() - p.mulai) / 1000;
    c.fillStyle = '#ffffff33'; c.fillRect(40, h - 30, w - 80, 8); c.fillStyle = '#ff4f7b'; c.fillRect(40, h - 30, (w - 80) * Math.min(1, lewat / p.film.d), 8);
    return;
  }
  c.fillStyle = '#ff4f7b'; c.font = 'bold 52px Fredoka, Nunito, sans-serif'; c.fillText('🎬 BIOSKOP CINTA', w / 2, 90);
  c.fillStyle = '#fff'; c.font = 'bold 34px Nunito, sans-serif';
  c.fillText(nx ? `Berikutnya: ${filmDari(nx[1].f).j}` : 'Layar kosong: pilih film di loket 🎟️', w / 2, 190, w - 60);
  c.fillStyle = '#8fd3ff'; c.font = 'bold 26px Nunito, sans-serif';
  c.fillText(nx ? `${jamWIB(nx[1].mulai)} WIB · gratis untuk semua tamu` : 'Siapa saja boleh memutar film untuk semua penonton', w / 2, 250, w - 60);
  for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(255,${200 + (i * 3) % 55},120,${0.4 + 0.4 * Math.sin(t * 3 + i)})`; c.beginPath(); c.arc(30 + i * 43, h - 30, 6, 0, 7); c.fill(); }
}

// ---------------------------------------------------------------- 🎟️ KARTU BIOSKOP
async function putarDiLayar(f) {
  const L = K.L, film = filmDari(f); if (!film) return;
  if (!(K.resmi && K.resmi())) { K.bukaDaftar && K.bukaDaftar(); return; }
  const a = aktif();
  if (a && !dir()) { toast(`Layar sedang memutar "${a.film.j}". Tunggu selesai, atau tonton sendiri ya.`); return; }
  const nx = berikutnya()[0];
  if (nx && !dir() && nx[1].mulai - kini() < film.d * 1000) { toast(`Sebentar lagi ada jadwal tayang "${filmDari(nx[1].f).j}". Tonton sendiri dulu ya.`); return; }
  const m = kini();
  try {
    await L.db.set('bioskop/tayang', { f, mulai: m, akhir: m + film.d * 1000, uid: L.uid, n: bersih((K.prof && K.prof.n) || 'Tamu', 30) });
    ST.pribadi = null; tersembunyi = false; nyalakanSuara(); tutupKartu();
    toast(`🎬 "${film.j}" diputar untuk semua penonton di Bioskop Cinta!`);
    if (!dalam(K.saya.x, K.saya.z)) K.pindah(PINTU.x - 3, PINTU.z, PINTU.r);
  } catch (e) { toast('Layar baru saja dipakai orang lain. Coba lagi sebentar.'); }
}
function tontonSendiri(f) {
  const film = filmDari(f); if (!film) return;
  ST.pribadi = { f, film, mulai: Date.now(), akhir: Date.now() + film.d * 1000 };
  tersembunyi = false; nyalakanSuara(); tutupKartu();
  toast(`👤 Menonton "${film.j}" sendiri. Tutup layar dengan ✕ kapan saja.`);
}
function urai(link) {
  const s = String(link || '').trim(); let id = '';
  try {
    const u = new URL(s.startsWith('http') ? s : 'https://' + s);
    if (/youtu\.be$/.test(u.hostname)) id = u.pathname.slice(1, 12);
    else if (/youtube\.com$/.test(u.hostname.replace(/^(www|m|music)\./, ''))) id = u.searchParams.get('v') || (u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/) || [])[2] || '';
    const tt = u.searchParams.get('t'); if (tt) return { id: /^[\w-]{11}$/.test(id) ? id : '', t: parseInt(tt, 10) || 0 };
  } catch (e) { if (/^[\w-]{11}$/.test(s)) id = s; }
  return { id: /^[\w-]{11}$/.test(id) ? id : '', t: 0 };
}
const opsiFilm = pilih => [...Object.entries(KATALOG), ...Object.entries(ST.film).filter(([, v]) => v)].map(([k, v]) => `<option value="${esc(k)}"${k === pilih ? ' selected' : ''}>${esc(v.j)} (${mmss(v.d)})</option>`).join('');
const inputWaktu = t => { const d = new Date(t - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

export function buka() {
  const L = K.L; if (!L) return;
  ST.kartu = true;
  const p = aktif(), nx = berikutnya(), d = dir(), di = K.saya && dalam(K.saya.x, K.saya.z);
  const kartuFilm = ([k, v], khusus) => `<div class="filmK"><img src="${esc(thumb(v.v))}" alt="" loading="lazy"><div><b>${esc(v.j)}</b><small>${esc(v.g || '🎞️ Film pilihan Direktur')} · ${mmss(v.d)}</small>${v.ket ? `<small class="ket">${esc(v.ket)}</small>` : ''}
    <span class="baris kecil"><button type="button" class="mini" data-putar="${esc(k)}">▶️ Putar di layar</button><button type="button" class="mini putih" data-sendiri="${esc(k)}">👤 Tonton sendiri</button>${khusus && d ? `<button type="button" class="mini putih" data-hapusf="${esc(k)}">🗑️</button>` : ''}</span></div></div>`;
  const awalJadwal = inputWaktu(Math.ceil((Date.now() + 30 * 60000) / 900000) * 900000);
  bukaKartu(`<h2>🎬 Bioskop Cinta</h2>
    ${p ? `<div class="tayangK"><img src="${esc(thumb(p.film.v))}" alt=""><div><small>▶ SEDANG TAYANG</small><b>${esc(p.film.j)}</b><small>menit ${mmss((kini() - p.mulai) / 1000)} dari ${mmss(p.film.d)} · ${p.sumber === 'jadwal' ? 'jadwal Direktur' : 'diputar ' + esc(p.n)}</small>
      <span class="baris kecil"><button type="button" class="btn" id="bsT">${di ? '▶️ Tonton sekarang' : '🚶 Ke bioskop & tonton'}</button>${d ? '<button type="button" class="btn putih" id="bsS">⏹️ Hentikan</button>' : ''}</span></div></div>`
    : '<p>Layar sedang kosong. Pilih film di bawah untuk diputar ke <b>semua penonton</b> di bioskop, atau tonton sendiri.</p>'}
    <h3>🗓️ Jadwal penayangan</h3>
    ${nx.length ? `<div class="daftar">${nx.slice(0, 12).map(([id, j]) => `<div><span><b>${esc(filmDari(j.f).j)}</b><br><small>${esc(jamWIB(j.mulai))} WIB · ${mmss(filmDari(j.f).d)}</small></span>${d ? `<button type="button" class="mini putih" data-hapusj="${esc(id)}">✕</button>` : '<span class="kecil">🎟️ gratis</span>'}</div>`).join('')}</div>` : '<p class="kecil">Belum ada jadwal. Pantau pengumuman Direktur ya!</p>'}
    <h3>🎞️ Pilihan film (±5 menit)</h3>
    <div class="filmDaftar">${Object.entries(ST.film).filter(([, v]) => v).map(e => kartuFilm(e, true)).join('')}${Object.entries(KATALOG).map(e => kartuFilm(e, false)).join('')}</div>
    <p class="kecil">Film pendek dari Blender Open Movies (lisensi Creative Commons), diputar lewat YouTube.</p>
    ${d ? `<div class="dirBioskop">
      <h3>👑 Tambah film dari YouTube</h3>
      <label for="bfL">Link YouTube</label><input id="bfL" placeholder="https://youtu.be/…">
      <label for="bfJ">Judul (kosongkan = otomatis dari YouTube)</label><input id="bfJ" maxlength="60" placeholder="contoh: Film pendek romantis">
      <div class="baris"><span style="flex:1"><label for="bfD">Durasi tayang (menit)</label><input id="bfD" type="number" min="1" max="10" value="5"></span><span style="flex:1"><label for="bfS">Mulai dari menit ke-</label><input id="bfS" type="number" min="0" step="0.5" value="0"></span></div>
      <p class="err" id="bfE"></p>
      <div class="baris"><button class="btn" type="button" id="bfP">▶️ Simpan & putar sekarang</button><button class="btn putih" type="button" id="bfK">💾 Simpan ke daftar</button></div>
      <h3>👑 Buat jadwal tayang</h3>
      <label for="bjF">Film</label><select id="bjF">${opsiFilm('')}</select>
      <label for="bjW">Waktu tayang</label><input id="bjW" type="datetime-local" value="${awalJadwal}">
      <label class="cek"><input type="checkbox" id="bjU" checked> 📢 Umumkan ke semua tamu</label>
      <p class="err" id="bjE"></p>
      <div class="baris"><button class="btn" type="button" id="bjS">🗓️ Jadwalkan</button></div></div>` : ''}`, {
    gaya: d ? 'dir' : undefined,
    tutup() { ST.kartu = false; },
    pasang(el) {
      const T = el.querySelector('#bsT'); if (T) T.onclick = () => { ST.pribadi = null; tersembunyi = false; nyalakanSuara(); tutupKartu(); if (!dalam(K.saya.x, K.saya.z)) K.pindah(PINTU.x - 3, PINTU.z, PINTU.r); };
      const S = el.querySelector('#bsS'); if (S) S.onclick = async () => { const a = aktif(); if (a && a.sumber === 'jadwal') await L.db.set('bioskop/jadwal/' + a.id, null); await L.db.set('bioskop/tayang', null); toast('⏹️ Tayangan dihentikan.'); };
      el.querySelectorAll('[data-putar]').forEach(b => b.onclick = () => putarDiLayar(b.dataset.putar));
      el.querySelectorAll('[data-sendiri]').forEach(b => b.onclick = () => tontonSendiri(b.dataset.sendiri));
      el.querySelectorAll('[data-hapusj]').forEach(b => b.onclick = () => L.db.set('bioskop/jadwal/' + b.dataset.hapusj, null).then(() => toast('Jadwal dihapus.')));
      el.querySelectorAll('[data-hapusf]').forEach(b => b.onclick = () => L.db.set('bioskop/film/' + b.dataset.hapusf, null).then(() => toast('Film dihapus dari daftar.')));
      if (!d) return;
      const simpan = async putar => {
        const E = el.querySelector('#bfE'), u = urai(el.querySelector('#bfL').value);
        if (!u.id) { E.textContent = 'Link YouTube tidak dikenali.'; return; }
        const dur = Math.round(Math.max(1, Math.min(10, +el.querySelector('#bfD').value || 5)) * 60), s = Math.round(Math.max(0, +el.querySelector('#bfS').value || 0) * 60) || u.t;
        let j = bersih(el.querySelector('#bfJ').value, 60);
        if (!j) { E.textContent = 'Mengambil judul dari YouTube…'; try { const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + u.id)); if (r.ok) j = bersih((await r.json()).title || '', 60); } catch (e) { /* abaikan */ } }
        const id = 'yt' + Date.now().toString(36);
        try { await L.db.set('bioskop/film/' + id, { v: u.id, j: j || 'Film pilihan Direktur', d: dur, s }); } catch (e) { E.textContent = 'Gagal menyimpan film.'; return; }
        E.textContent = '';
        if (putar) { const m = kini(); await L.db.set('bioskop/tayang', { f: id, mulai: m, akhir: m + dur * 1000, uid: L.uid, n: bersih(K.prof?.n || 'Direktur', 30) }); ST.pribadi = null; nyalakanSuara(); tutupKartu(); toast(`🎬 "${j || 'Film'}" diputar sekarang di Bioskop Cinta!`); }
        else toast('💾 Film ditambahkan ke daftar bioskop.');
      };
      el.querySelector('#bfP').onclick = () => simpan(true);
      el.querySelector('#bfK').onclick = () => simpan(false);
      el.querySelector('#bjS').onclick = async () => {
        const E = el.querySelector('#bjE'), f = el.querySelector('#bjF').value, film = filmDari(f), t = new Date(el.querySelector('#bjW').value).getTime();
        if (!film) { E.textContent = 'Pilih film dulu.'; return; }
        if (!t || t < Date.now() - 60000) { E.textContent = 'Pilih waktu yang akan datang.'; return; }
        const bentrok = Object.values(ST.jadwal).find(j => j && filmDari(j.f) && t < j.mulai + filmDari(j.f).d * 1000 && j.mulai < t + film.d * 1000);
        if (bentrok) { E.textContent = `Bentrok dengan "${filmDari(bentrok.f).j}" (${jamWIB(bentrok.mulai)}).`; return; }
        await L.db.push('bioskop/jadwal', { f, mulai: t, n: bersih(K.prof?.n || 'Direktur', 30) });
        if (el.querySelector('#bjU').checked) L.umumkan(`🎬 Nonton bareng "${film.j}" ${jamWIB(t)} WIB di Bioskop Cinta, Taman Cinta! Gratis, ajak gebetanmu 🍿`).catch(() => {});
        toast('🗓️ Jadwal tayang dibuat!');
      };
    },
  });
}
