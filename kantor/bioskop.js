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
import { esc, bersih, LS } from '../js/common.js?v=202611280918';
import { K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611280918';
import * as Musik from './musik.js?v=202611280918';

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
export const nyala = () => !!(yt && ytSiap && suaraOk && menayangkan && !tersembunyi);

// ---------------------------------------------------------------- DATA
export function mulai() {
  const db = K.L.db;
  db.on('bioskop/film', v => { ST.film = v || {}; if (ST.kartu) buka(); });
  db.on('bioskop/jadwal', v => { ST.jadwal = v || {}; if (ST.kartu) buka(); });
  db.on('bioskop/tayang', v => { ST.tayang = v && v.f ? v : null; if (ST.kartu) buka(); });
  setInterval(atur, 1000);
  pasangGestur();
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

// ---------------------------------------------------------------- 📺 FILM DI LAYAR BIOSKOP
// Video YouTube (iframe) diletakkan TEPAT di posisi layar 3D dengan transformasi CSS 3D,
// di BELAKANG kanvas WebGL. Bagian layar di kanvas digambar transparan ("lubang"), jadi
// film tampil di layar bioskop dan tetap tertutup kepala penonton di depannya.
let yt = null, ytSiap = false, ytMuat = null, suaraOk = false, tersembunyi = false, dimuat = '', volUser = LS.get('bioskopVol', 90);
let L3 = null;                // { box, cam, obj, jangkar, lubang, w, h }
const LEBAR_PX = 596, TINGGI_PX = 335;      // 5,96 × 3,35 m (16:9), 1 m = 100 px
function muatAPI() {
  return (ytMuat ||= new Promise(res => {
    if (window.YT && window.YT.Player) return res();
    const lama = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { lama && lama(); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.append(s);
  }));
}
// dipanggil gedung.js saat membangun bioskop: posisi tengah layar & arah hadap
export function pasang3D(THREE, grup, x, y, z, rotY) {
  const lubang = new THREE.Mesh(new THREE.PlaneGeometry(LEBAR_PX / 100, TINGGI_PX / 100),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending, toneMapped: false }));
  lubang.position.set(x, y, z); lubang.rotation.y = rotY; lubang.visible = false; lubang.renderOrder = 10; grup.add(lubang);
  const jangkar = new THREE.Object3D(); jangkar.position.set(x, y, z); jangkar.rotation.y = rotY; jangkar.scale.setScalar(0.01); jangkar.updateMatrixWorld(true);
  const box = document.createElement('div'); box.id = 'bioskop3D';
  box.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;visibility:hidden';
  const cam = document.createElement('div'); cam.style.cssText = 'position:absolute;left:0;top:0;transform-style:preserve-3d';
  const obj = document.createElement('div'); obj.style.cssText = `position:absolute;left:0;top:0;width:${LEBAR_PX}px;height:${TINGGI_PX}px;background:#000;overflow:hidden;backface-visibility:hidden`;
  obj.innerHTML = '<div id="bioskopYT" style="width:100%;height:100%"></div>';
  cam.append(obj); box.append(cam);
  const c = document.getElementById('c'); c.parentNode.insertBefore(box, c);   // di belakang kanvas
  L3 = { box, cam, obj, jangkar, lubang, w: 0, h: 0, fov: 0 };
}
const ep = v => (Math.abs(v) < 1e-10 ? 0 : v);
// dipanggil kantor.js setiap frame setelah render (proyeksi seperti CSS3DRenderer)
export function render(camera) {
  if (!L3) return;
  const tampil = lubangAktif();
  L3.lubang.visible = tampil;
  L3.box.style.visibility = tampil ? 'visible' : 'hidden';
  if (!tampil) return;
  const w = innerWidth, h = innerHeight;
  const fov = camera.projectionMatrix.elements[5] * h / 2;
  if (L3.fov !== fov) { L3.fov = fov; L3.box.style.perspective = fov + 'px'; }
  if (L3.w !== w || L3.h !== h) { L3.w = w; L3.h = h; L3.cam.style.width = w + 'px'; L3.cam.style.height = h + 'px'; }
  const e = camera.matrixWorldInverse.elements;
  L3.cam.style.transform = `translateZ(${fov}px) matrix3d(${ep(e[0])},${ep(-e[1])},${ep(e[2])},${ep(e[3])},${ep(e[4])},${ep(-e[5])},${ep(e[6])},${ep(e[7])},${ep(e[8])},${ep(-e[9])},${ep(e[10])},${ep(e[11])},${ep(e[12])},${ep(-e[13])},${ep(e[14])},${ep(e[15])}) translate(${w / 2}px,${h / 2}px)`;
  const o = L3.jangkar.matrixWorld.elements;
  L3.obj.style.transform = `translate(-50%,-50%) matrix3d(${ep(o[0])},${ep(o[1])},${ep(o[2])},${ep(o[3])},${ep(-o[4])},${ep(-o[5])},${ep(-o[6])},${ep(-o[7])},${ep(o[8])},${ep(o[9])},${ep(o[10])},${ep(o[11])},${ep(o[12])},${ep(o[13])},${ep(o[14])},${ep(o[15])})`;
}
let menayangkan = false;      // ada film & pemain di dalam bioskop & pemutar siap
const lubangAktif = () => menayangkan && !tersembunyi && ytSiap && !dimuat.startsWith('selesai:');

// panel kecil: judul, progres, suara (tidak menutupi layar)
function kontrol() {
  let w = document.getElementById('bioskopKontrol'); if (w) return w;
  w = document.createElement('div'); w.id = 'bioskopKontrol'; w.hidden = true;
  w.innerHTML = `<style>
    #bioskopKontrol{position:fixed;right:8px;top:118px;z-index:30;width:210px;background:#140c1cee;border:2px solid #ffd23f;border-radius:12px;padding:7px;color:#fff;font:700 12px Nunito,sans-serif;box-shadow:0 6px 18px #0008}
    #bioskopKontrol[hidden]{display:none}#bioskopKontrol .jd{margin:0 2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #bioskopKontrol .bar{height:4px;border-radius:3px;background:#ffffff22;overflow:hidden;margin:0 2px 6px}#bioskopKontrol .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff4f7b,#ffd23f);width:0}
    #bioskopKontrol .br{display:flex;gap:6px;align-items:center}#bioskopKontrol input{flex:1;min-width:50px;accent-color:#ffd23f}
    #bioskopKontrol button{border:0;border-radius:8px;padding:5px 8px;font:800 12px Nunito,sans-serif;cursor:pointer;background:#ffd23f;color:#1b1220}
    #bioskopKontrol button.p{background:#ffffff1f;color:#fff}#bioskopKontrol .tip{margin:6px 2px 0;color:#ffd9a8;font-size:11px}</style>
    <div class="jd" id="bioskopJudul">🎬 Bioskop Cinta</div><div class="bar"><i id="bioskopBar"></i></div>
    <div class="br"><button type="button" id="bioskopSuara">🔊 Suara</button><input type="range" id="bioskopVol" min="0" max="100" aria-label="Volume film"><button type="button" class="p" id="bioskopX" title="Matikan film untukku" aria-label="Matikan film untukku">✕</button></div>
    <p class="tip" id="bioskopTip">💺 Duduk di kursi merah untuk menonton</p>`;
  document.body.append(w);
  const v = w.querySelector('#bioskopVol'); v.value = volUser; v.oninput = () => { volUser = +v.value; LS.set('bioskopVol', volUser); if (yt && ytSiap) yt.setVolume(volUser); };
  w.querySelector('#bioskopSuara').onclick = () => (suaraOk && yt && ytSiap && !yt.isMuted() ? (suaraOk = false, yt.mute()) : nyalakanSuara());
  w.querySelector('#bioskopX').onclick = () => { tersembunyi = true; if (yt && ytSiap) yt.pauseVideo(); toast('Film dimatikan untukmu. Ketuk "🎬 Nonton film" di depan layar untuk menonton lagi.', 4000); };
  return w;
}
function nyalakanSuara() {
  suaraOk = true; tersembunyi = false;
  if (yt && ytSiap) { yt.unMute(); yt.setVolume(volUser); yt.playVideo(); sinkron(true); }
}
// ketukan / tombol apa pun di dalam bioskop = izin memutar suara (aturan autoplay browser)
function pasangGestur() {
  const f = () => { if (menayangkan && !suaraOk && !tersembunyi) nyalakanSuara(); };
  addEventListener('pointerdown', f, true); addEventListener('keydown', f, true);
}
async function siapkan() {
  if (yt || !L3) return;
  kontrol(); await muatAPI(); if (yt) return;
  yt = new window.YT.Player('bioskopYT', {
    width: LEBAR_PX, height: TINGGI_PX, playerVars: { playsinline: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, fs: 0 },
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
  const p = putaranSaya(), di = dalam(s.x, s.z);
  if (!di) tersembunyi = false;                         // keluar bioskop: lain kali tampil lagi
  menayangkan = !!p && di;
  if (menayangkan && !yt) { siapkan(); return; }
  const w = document.getElementById('bioskopKontrol');
  if (w) w.hidden = !menayangkan;
  if (!yt || !ytSiap) return;
  if (!menayangkan || tersembunyi) { if (yt.getPlayerState && [1, 3].includes(yt.getPlayerState())) yt.pauseVideo(); if (!p) dimuat = ''; return; }
  muat(p);
  if (dimuat.startsWith('selesai:')) return;
  if (![1, 3].includes(yt.getPlayerState())) yt.playVideo();
  if (suaraOk) { if (yt.isMuted && yt.isMuted()) yt.unMute(); } else yt.mute();
  const b = document.getElementById('bioskopSuara'); if (b) b.textContent = suaraOk ? '🔇 Bisukan' : '🔊 Nyalakan suara';
  const tip = document.getElementById('bioskopTip'); if (tip) tip.textContent = !suaraOk ? '🔊 Ketuk layar di mana saja untuk suara' : s.duduk ? '🍿 Selamat menonton!' : '💺 Duduk di kursi merah untuk menonton';
  const lewat = ((p.pribadi ? Date.now() : kini()) - p.mulai) / 1000;
  const bar = document.getElementById('bioskopBar'); if (bar) bar.style.width = Math.min(100, lewat / p.film.d * 100) + '%';
  judul(`${p.pribadi ? '👤 ' : '🎬 '}${p.film.j} · ${mmss(lewat)} / ${mmss(p.film.d)}`);
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
// bawa pemain ke kursi penonton kosong (barisan tengah) lalu duduk menghadap layar
function masukDuduk() {
  if (K.saya && K.saya.duduk && dalam(K.saya.x, K.saya.z)) return;
  if (K.dudukDi) { if (K.dudukDi(x => dalam(x.x, x.z) && x.syaratDuduk, { jarak: 3.2, pitch: 0.1 })) return; }  // kamera dekat: layar terlihat penuh
  if (!dalam(K.saya.x, K.saya.z)) K.pindah(PINTU.x - 3, PINTU.z, PINTU.r);
}
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
    ST.pribadi = null; tersembunyi = false; nyalakanSuara(); tutupKartu(); masukDuduk();
    toast(`🎬 "${film.j}" diputar di layar untuk semua penonton! Duduk di kursi merah ya 🍿`, 4000);
  } catch (e) { toast('Layar baru saja dipakai orang lain. Coba lagi sebentar.'); }
}
function tontonSendiri(f) {
  const film = filmDari(f); if (!film) return;
  ST.pribadi = { f, film, mulai: Date.now(), akhir: Date.now() + film.d * 1000 };
  tersembunyi = false; nyalakanSuara(); tutupKartu(); masukDuduk();
  toast(`👤 Menonton "${film.j}" sendiri di layar bioskop (hanya kamu yang melihat).`, 4000);
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
      const T = el.querySelector('#bsT'); if (T) T.onclick = () => { ST.pribadi = null; tersembunyi = false; nyalakanSuara(); tutupKartu(); masukDuduk(); };
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
        if (putar) { const m = kini(); await L.db.set('bioskop/tayang', { f: id, mulai: m, akhir: m + dur * 1000, uid: L.uid, n: bersih(K.prof?.n || 'Direktur', 30) }); ST.pribadi = null; nyalakanSuara(); tutupKartu(); masukDuduk(); toast(`🎬 "${j || 'Film'}" diputar sekarang di layar Bioskop Cinta!`); }
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
