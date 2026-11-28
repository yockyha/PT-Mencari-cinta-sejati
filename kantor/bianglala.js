// =====================================================================
//  🎡 BIANGLALA TAMAN CINTA: bukan cuma duduk!
//  • Naik sendiri / ajak seseorang naik berdua di gondola yang sama
//  • 💬 Obrolan berdua di dalam gondola (hanya kalian berdua yang bisa baca)
//  • 🔭 Teropong: zoom & lihat sekeliling kantor dari atas
//  • ✨ Momen di puncak: efek hati (+3 EXP sekali sehari bila berdua)
//  • 🎆 Kembang api dari puncak: dilihat semua tamu (1x / 2 menit)
//  • 🏮 Lampion harapan: diterbangkan dari gondola, terlihat semua tamu
//  • 📸 Foto pemandangan dari atas
//  Posisi roda sama di semua perangkat (sudut dihitung dari jam server),
//  jadi tamu lain melihatmu duduk di gondola yang benar.
//  Data: ajakBL/<penerima>/<pengirim> · gondolaObrol/<uidA_uidB> · lampion · kembangApi
// =====================================================================
import { esc, bersih, LS, hariIni, sensor, kasar } from '../js/common.js?v=202611280952';
import { TS } from '../js/db.js?v=202611280952';
import { K, toast, bukaKartu, tutupKartu, kartuTerbuka, jam } from './ui.js?v=202611280952';
import * as Musik from './musik.js?v=202611280952';
import * as Prog from './progres.js?v=202611280952';

export const RODA = { x: -70, z: 14, y: 7.4, r: 6.2, laju: 0.12, n: 8 };
export const LAMA_NAIK = 157;                 // 3 putaran (detik)
const kini = () => (K.L ? K.L.db.now() : Date.now());
export const sudutRoda = () => (kini() / 1000 * RODA.laju) % (Math.PI * 2);
// posisi dunia gondola ke-i (tanpa perlu objek 3D; sama dengan gedung.js)
export function posGondola(i, sisi = 0) {
  const a = i / RODA.n * Math.PI * 2 + sudutRoda();
  // roda menghadap timur: sumbu lokal x roda = sumbu -z dunia
  return { x: RODA.x, y: RODA.y + Math.sin(a) * RODA.r, z: RODA.z - Math.cos(a) * RODA.r + (sisi ? 0.32 : -0.32) };
}
const gondolaTerbawah = () => { let b = 0, y = 1e9; for (let i = 0; i < RODA.n; i++) { const p = posGondola(i); if (p.y < y) { y = p.y; b = i; } } return b; };
const ruangDua = (a, b) => [a, b].sort().join('_');

let D = null;                 // { THREE, scene, camera, naik(), mulaiNaik(o), turun(), ambilFoto(j,l,o) }
const ST = { ajakan: {}, lampion: [], kembang: {}, lihatKembang: 0, obrolan: [], ruang: '', lepasObrol: null, kartuObrol: false, puncak: false, mulaiRide: 0, mitraLama: '' };

export function pasang(dep) { D = dep; }

// ---------------------------------------------------------------- DATA
export function mulai() {
  const L = K.L, db = L.db;
  db.on('ajakBL/' + L.uid, v => {
    const lama = ST.ajakan; ST.ajakan = v || {};
    for (const [dari, a] of Object.entries(ST.ajakan)) if (a && !lama[dari] && kini() - (a.t || 0) < 180000) kartuAjakan(dari, a);
  });
  ST.lihatKembang = kini();
  db.on('lampion', v => { ST.lampion = Object.entries(v || {}).filter(([, x]) => x && x.t).map(([k, x]) => ({ ...x, k })).sort((a, b) => a.t - b.t).slice(-25); }, { limit: 25 });
  db.on('kembangApi', v => {
    ST.kembang = v || {};
    for (const [uid, k] of Object.entries(ST.kembang)) if (k && k.t > ST.lihatKembang && kini() - k.t < 20000) { ST.lihatKembang = Math.max(ST.lihatKembang, k.t); pertunjukan(k, uid); }
  });
}

// ---------------------------------------------------------------- NAIK
export function bukaNaik() {
  if (D.naik()) { bukaHUDKartu(); return; }
  const L = K.L, resmi = K.resmi && K.resmi();
  const online = [...K.lain.values()].filter(o => o.uid && o.uid !== (L && L.uid)).slice(0, 40);
  bukaKartu(`<h2>🎡 Bianglala Taman Cinta</h2>
    <p>Satu kali naik = 3 putaran (±2,5 menit). Di atas kamu bisa pakai <b>🔭 teropong</b>, <b>🏮 menerbangkan lampion harapan</b>, menyalakan <b>🎆 kembang api</b> dari puncak, dan <b>💬 ngobrol berdua</b> kalau naik bareng.</p>
    <div class="baris"><button class="btn" type="button" id="blS">🎡 Naik sekarang</button></div>
    ${resmi ? `<h3>💑 Ajak seseorang naik berdua</h3>${online.length ? `<input id="blC" placeholder="cari nama…" autocomplete="off"><div class="daftar" id="blD">${online.map(o => `<div data-nm="${esc((o.nama || '').toLowerCase())}"><span><b>${esc(o.nama || 'Tamu')}</b><br><small>${o.bg >= 0 ? '🎡 sedang naik bianglala' : esc(K.lokasiNama ? K.lokasiNama(o.tx, o.tz) : '')}</small></span><button type="button" class="mini" data-ajak="${esc(o.uid)}" data-n="${esc(o.nama || 'Tamu')}">💌 Ajak</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu lain yang online.</p>'}
    <p class="kecil">Yang kamu ajak akan langsung duduk di gondola yang sama denganmu kalau dia menerima.</p>` : ''}`, {
    pasang(el) {
      el.querySelector('#blS').onclick = () => { tutupKartu(); naik(gondolaTerbawah(), 0); };
      const c = el.querySelector('#blC'); if (c) c.oninput = () => { const q = c.value.trim().toLowerCase(); el.querySelectorAll('#blD>div').forEach(d => { d.hidden = q && !d.dataset.nm.includes(q); }); };
      el.querySelectorAll('[data-ajak]').forEach(b => b.onclick = () => { tutupKartu(); const g = gondolaTerbawah(); naik(g, 0); ajak(b.dataset.ajak, b.dataset.n, g); });
    },
  });
}
function naik(gi, sisi) {
  if (D.naik()) D.turun(true);
  D.mulaiNaik({ cx: RODA.x, cz: RODA.z, lama: LAMA_NAIK, gi, sisi, pos: () => posGondola(gi, sisi) });
  ST.puncak = false; ST.mulaiRide = performance.now();
  Musik.sfx('duduk');
  toast('🎡 Naik bianglala! Menu bianglala ada di atas layar. Gerak = turun.', 4200);
}
async function ajak(uid, n, gi) {
  try { await K.L.db.set(`ajakBL/${uid}/${K.L.uid}`, { n: bersih((K.prof && K.prof.n) || 'Tamu', 30), g: gi, t: TS }); toast(`💌 Ajakan terkirim ke ${n}. Tunggu dia naik ke gondolamu ya!`, 4000); }
  catch (e) { toast('Ajakan gagal dikirim.'); }
}
function kartuAjakan(dari, a) {
  Musik.sfx('notif');
  if (kartuTerbuka()) { toast(`🎡 ${a.n} mengajakmu naik bianglala berdua! Buka Taman Cinta → Bianglala.`, 6000); }
  bukaKartu(`<h2>🎡 Ajakan naik bianglala</h2><p><b>${esc(a.n)}</b> mengajakmu naik bianglala <b>berdua</b> di gondola yang sama 💞</p>
    <div class="baris"><button class="btn" type="button" id="ajY">💞 Ayo naik bareng</button><button class="btn putih" type="button" id="ajN">Nanti dulu</button></div>`, {
    pasang(el) {
      const hapus = () => K.L.db.set(`ajakBL/${K.L.uid}/${dari}`, null).catch(() => {});
      el.querySelector('#ajN').onclick = () => { hapus(); tutupKartu(); };
      el.querySelector('#ajY').onclick = () => {
        hapus(); tutupKartu();
        const o = K.lain.get(dari);
        if (!K.gedungBuka || K.gedungBuka('tamanCinta')) { K.pindah(RODA.x + 4, RODA.z, -Math.PI / 2); setTimeout(() => naik(o && o.bg >= 0 ? o.bg : a.g, 1), 60); }
        else toast('Taman Cinta belum dibuka.');
      };
    },
  });
}

// ---------------------------------------------------------------- HUD saat naik
function hud() {
  let h = document.getElementById('hudBL'); if (h) return h;
  h = document.createElement('div'); h.id = 'hudBL'; h.hidden = true;
  h.innerHTML = `<style>
    #hudBL{position:fixed;left:50%;bottom:calc(74px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:35;max-width:calc(100vw - 16px);background:#2a1420e6;border:2px solid #ff8fab;border-radius:14px;padding:6px 8px;color:#fff;font:800 12px Nunito,sans-serif;box-shadow:0 6px 18px #0007}
    #hudBL[hidden]{display:none}#hudBL .ju{text-align:center;margin:0 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #hudBL .br{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none}#hudBL .br::-webkit-scrollbar{display:none}
    #hudBL button{flex:0 0 auto;border:0;border-radius:9px;padding:6px 9px;font:800 12px Nunito,sans-serif;cursor:pointer;background:#ff4f7b;color:#fff}
    #hudBL button.p{background:#ffffff22}#hudBL button.redup{opacity:.5}
    #teropong{position:fixed;inset:0;z-index:36;touch-action:none;cursor:grab}#teropong svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    #teropong .ui{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;background:#000b;border-radius:14px;padding:8px 12px;color:#fff;font:800 13px Nunito,sans-serif}
    #teropong .ui input{width:130px;accent-color:#ffd23f}#teropong .ui button{border:0;border-radius:9px;padding:6px 10px;font:800 12px Nunito,sans-serif;background:#ffd23f;color:#1b1220;cursor:pointer}
    #teropong .tip{position:absolute;top:70px;left:50%;transform:translateX(-50%);color:#fff;font:800 13px Nunito,sans-serif;text-shadow:0 1px 4px #000;background:#0006;border-radius:10px;padding:4px 10px}</style>
    <p class="ju" id="hudJ">🎡 Di atas bianglala</p>
    <div class="br"><button type="button" id="hT">🔭 Teropong</button><button type="button" id="hO">💬 Ngobrol berdua</button><button type="button" id="hA">💌 Ajak</button><button type="button" id="hL">🏮 Lampion</button><button type="button" id="hK">🎆 Kembang api</button><button type="button" id="hF">📸 Foto</button><button type="button" class="p" id="hX">⬇️ Turun</button></div>`;
  document.body.append(h);
  h.querySelector('#hT').onclick = bukaTeropong;
  h.querySelector('#hO').onclick = bukaObrolan;
  h.querySelector('#hA').onclick = bukaAjakDariAtas;
  h.querySelector('#hL').onclick = bukaLampion;
  h.querySelector('#hK').onclick = nyalakanKembang;
  h.querySelector('#hF').onclick = () => D.ambilFoto('Pemandangan dari Bianglala', null, { dariKamera: true });
  h.querySelector('#hX').onclick = () => D.turun();
  return h;
}
function bukaHUDKartu() { toast('Kamu sedang di atas bianglala. Pakai menu di atas layar 🎡'); }
export const mitra = () => { const n = D && D.naik(); if (!n) return null; for (const o of K.lain.values()) if (o.bg === n.gi) return o; return null; };
const diPuncak = n => posGondola(n.gi, n.sisi).y > RODA.y + RODA.r * 0.55;

let hudT = 0;
export function update(dt, t) {
  const n = D && D.naik();
  const h = hud();
  if (!n) { if (!h.hidden) { h.hidden = true; tutupTeropong(); } if (ST.ruang) lepasObrolan(); }
  else {
    h.hidden = false;
    if (t - hudT > 400) {
      hudT = t;
      const m = mitra(), atas = diPuncak(n), sisa = Math.max(0, LAMA_NAIK - (performance.now() - ST.mulaiRide) / 1000);
      h.querySelector('#hudJ').textContent = (m ? `💞 Berdua dengan ${m.nama}` : '🎡 Di atas bianglala') + (atas ? ' · ✨ di puncak!' : '') + ` · ${Math.floor(sisa / 60)}:${String(Math.floor(sisa % 60)).padStart(2, '0')}`;
      h.querySelector('#hO').hidden = !m; h.querySelector('#hA').hidden = !!m;
      h.querySelector('#hK').classList.toggle('redup', !atas);
      if (m && m.uid !== ST.mitraLama) { ST.mitraLama = m.uid; toast(`💞 ${m.nama} duduk di sebelahmu! Ketuk 💬 untuk ngobrol berdua.`, 4500); Musik.sfx('match'); }
      if (m) dengarObrolan(m); else if (ST.ruang) lepasObrolan();
      const pucuk = posGondola(n.gi, n.sisi).y > RODA.y + RODA.r * 0.93;
      if (pucuk && !ST.puncak) { ST.puncak = true; momenPuncak(m); }
      if (!atas) ST.puncak = false;
    }
  }
  animasiLampion(dt);
  animasiKembang(dt);
}

function momenPuncak(m) {
  Musik.sfx('hati');
  if (m) {
    K.efekLokal && K.efekLokal('hati', 30);
    const k = 'blPuncak_' + hariIni();
    if (!LS.get(k, 0)) { LS.set(k, 1); Prog.hadiah(3, '🎡 Momen di puncak berdua'); toast(`✨ Di puncak bianglala berdua dengan ${m.nama}! +3 EXP 💞`, 4500); }
    else toast(`✨ Di puncak bianglala berdua dengan ${m.nama} 💞`, 3500);
  } else toast('✨ Kamu di puncak! Coba 🔭 teropong atau nyalakan 🎆 kembang api.', 4000);
}

// ---------------------------------------------------------------- 💌 ajak dari atas
function bukaAjakDariAtas() {
  const n = D.naik(); if (!n) return;
  const online = [...K.lain.values()].filter(o => o.uid && o.bg < 0).slice(0, 40);
  bukaKartu(`<h2>💌 Ajak naik ke gondolamu</h2>${online.length ? `<div class="daftar">${online.map(o => `<div><span><b>${esc(o.nama || 'Tamu')}</b></span><button type="button" class="mini" data-ajak="${esc(o.uid)}" data-n="${esc(o.nama || 'Tamu')}">💌 Ajak</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu lain yang online.</p>'}`, {
    pasang(el) { el.querySelectorAll('[data-ajak]').forEach(b => b.onclick = () => { tutupKartu(); ajak(b.dataset.ajak, b.dataset.n, n.gi); }); },
  });
}

// ---------------------------------------------------------------- 💬 OBROLAN GONDOLA
function dengarObrolan(m) {
  const r = ruangDua(K.L.uid, m.uid); if (ST.ruang === r) return;
  lepasObrolan(); ST.ruang = r; ST.obrolan = [];
  let awal = true;
  ST.lepasObrol = K.L.db.on('gondolaObrol/' + r, v => {
    const l = Object.entries(v || {}).filter(([, x]) => x && x.m).map(([k, x]) => ({ ...x, k })).sort((a, b) => a.t - b.t).slice(-30);
    const baru = l.filter(x => !ST.obrolan.some(y => y.k === x.k));
    ST.obrolan = l;
    if (!awal) for (const x of baru) if (x.uid !== K.L.uid) { Musik.sfx('chat'); if (!ST.kartuObrol) toast(`💬 ${x.n}: ${x.m}`, 4000); }
    awal = false;
    if (ST.kartuObrol) gambarObrolan();
  }, { limit: 30 });
}
function lepasObrolan() { if (typeof ST.lepasObrol === 'function') ST.lepasObrol(); ST.lepasObrol = null; ST.ruang = ''; ST.obrolan = []; }
function gambarObrolan() {
  const w = document.getElementById('goL'); if (!w) return;
  w.innerHTML = ST.obrolan.length ? ST.obrolan.map(x => `<p class="${x.uid === K.L.uid ? 'aku' : ''}"><b>${esc(x.n)}</b> ${esc(x.m)} <small>${esc(jam(x.t))}</small></p>`).join('') : '<p class="kecil">Belum ada obrolan. Sapa duluan! 👋</p>';
  w.scrollTop = w.scrollHeight;
}
const PEMBUKA = ['Pemandangannya bagus ya 😍', 'Kamu takut ketinggian nggak? 😆', 'Kalau di puncak, mau bikin harapan apa?', 'Btw kamu suka nonton film apa?', 'Senang bisa naik bareng kamu 💞'];
function bukaObrolan() {
  const m = mitra(); if (!m) { toast('Ajak seseorang dulu supaya bisa ngobrol berdua.'); return; }
  ST.kartuObrol = true; dengarObrolan(m);
  bukaKartu(`<h2>💬 Obrolan gondola</h2><p class="kecil">Hanya kamu & <b>${esc(m.nama)}</b> yang bisa membaca obrolan ini.</p>
    <div id="goL" class="obrolGondola"></div>
    <div class="chipBaris">${PEMBUKA.map((t, i) => `<button type="button" class="chip" data-pb="${i}">${esc(t)}</button>`).join('')}</div>
    <form id="goF" class="baris"><input id="goI" maxlength="120" placeholder="Tulis pesan…" autocomplete="off" style="flex:1"><button class="btn" type="submit">Kirim</button></form>`, {
    bawah: true,
    tutup() { ST.kartuObrol = false; },
    pasang(el) {
      gambarObrolan();
      const kirim = async t => {
        t = bersih(t, 120); if (!t) return;
        if (kasar(t)) { toast('Pakai kata-kata yang sopan ya 🙏'); return; }
        try { await K.L.db.push('gondolaObrol/' + ST.ruang, { uid: K.L.uid, n: bersih(K.prof?.n || 'Tamu', 30), m: sensor(t), t: TS }); } catch (e) { toast('Pesan gagal terkirim.'); }
      };
      el.querySelector('#goF').onsubmit = e => { e.preventDefault(); const i = el.querySelector('#goI'); kirim(i.value); i.value = ''; };
      el.querySelectorAll('[data-pb]').forEach(b => b.onclick = () => kirim(PEMBUKA[+b.dataset.pb]));
    },
  });
}

// ---------------------------------------------------------------- 🔭 TEROPONG
let tr = null;
function bukaTeropong() {
  if (tr) return;
  const n = D.naik(); if (!n) return;
  tr = { yaw: Math.PI / 2 + 0.15, pitch: -0.22, zoom: 4, fov0: D.camera.fov };
  const o = document.createElement('div'); o.id = 'teropong';
  o.innerHTML = `<svg aria-hidden="true"><defs><mask id="trM"><rect width="100%" height="100%" fill="#fff"/><circle cx="38%" cy="50%" r="24%" fill="#000"/><circle cx="62%" cy="50%" r="24%" fill="#000"/></mask></defs>
    <rect width="100%" height="100%" fill="#050308" mask="url(#trM)"/><circle cx="38%" cy="50%" r="24%" fill="none" stroke="#000" stroke-width="10"/><circle cx="62%" cy="50%" r="24%" fill="none" stroke="#000" stroke-width="10"/></svg>
    <div class="tip">🔭 Geser layar untuk melihat sekeliling</div>
    <div class="ui"><span>🔍</span><input type="range" id="trZ" min="1.5" max="10" step="0.5" value="4" aria-label="Perbesaran teropong"><span id="trN">4×</span><button type="button" id="trX">✕ Selesai</button></div>`;
  document.body.append(o);
  let seret = null;
  o.addEventListener('pointerdown', e => { if (e.target.closest('.ui')) return; seret = { x: e.clientX, y: e.clientY }; o.setPointerCapture(e.pointerId); o.style.cursor = 'grabbing'; });
  o.addEventListener('pointermove', e => {
    if (!seret || !tr) return;
    const k = 0.005 / tr.zoom * 2;
    tr.yaw += (e.clientX - seret.x) * k; tr.pitch = Math.max(-1.2, Math.min(0.6, tr.pitch + (e.clientY - seret.y) * k));
    seret = { x: e.clientX, y: e.clientY };
  });
  const lepas = () => { seret = null; o.style.cursor = 'grab'; };
  o.addEventListener('pointerup', lepas); o.addEventListener('pointercancel', lepas);
  o.addEventListener('wheel', e => { e.preventDefault(); ubahZoom(tr.zoom * (e.deltaY < 0 ? 1.15 : 0.87)); }, { passive: false });
  const z = o.querySelector('#trZ'); z.oninput = () => ubahZoom(+z.value);
  o.querySelector('#trX').onclick = tutupTeropong;
  tr.kunci = e => { if (!tr) return; const s = 0.03; if (e.key === 'ArrowLeft') tr.yaw += s; else if (e.key === 'ArrowRight') tr.yaw -= s; else if (e.key === 'ArrowUp') tr.pitch = Math.min(0.6, tr.pitch + s); else if (e.key === 'ArrowDown') tr.pitch = Math.max(-1.2, tr.pitch - s); else if (e.key === 'Escape') tutupTeropong(); else return; e.preventDefault(); e.stopPropagation(); };
  addEventListener('keydown', tr.kunci, true);
  document.getElementById('hudBL').hidden = true;
  Musik.sfx('klik');
}
function ubahZoom(v) { if (!tr) return; tr.zoom = Math.max(1.5, Math.min(10, v)); const z = document.getElementById('trZ'); if (z) z.value = tr.zoom; const n = document.getElementById('trN'); if (n) n.textContent = tr.zoom.toFixed(1).replace('.0', '') + '×'; }
function tutupTeropong() {
  if (!tr) return;
  removeEventListener('keydown', tr.kunci, true);
  D.camera.fov = tr.fov0; D.camera.updateProjectionMatrix(); tr = null;
  const o = document.getElementById('teropong'); if (o) o.remove();
}
export const teropongAktif = () => !!tr;
// dipanggil kantor.js tiap frame; true = kamera diatur teropong
export function kamera(camera) {
  const n = tr && D.naik(); if (!n) { if (tr) tutupTeropong(); return false; }
  const p = posGondola(n.gi, n.sisi), cp = Math.cos(tr.pitch), dx = Math.sin(tr.yaw) * cp, dy = Math.sin(tr.pitch), dz = Math.cos(tr.yaw) * cp;
  camera.position.set(p.x + dx * 0.8, p.y + 0.4 + dy * 0.8, p.z + dz * 0.8);
  camera.lookAt(camera.position.x + dx, camera.position.y + dy, camera.position.z + dz);
  const f = tr.fov0 / tr.zoom; if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); }
  return true;
}

// ---------------------------------------------------------------- 🏮 LAMPION HARAPAN
function bukaLampion() {
  const terbaru = ST.lampion.slice(-8).reverse();
  bukaKartu(`<h2>🏮 Lampion Harapan</h2><p>Tulis harapanmu, lalu terbangkan lampion dari gondola. Semua tamu bisa melihat lampionmu terbang di langit Taman Cinta ✨</p>
    <label for="lpM">Harapanku (boleh dikosongkan)</label><input id="lpM" maxlength="60" placeholder="contoh: semoga ketemu jodoh tahun ini 💍">
    <label class="cek"><input type="checkbox" id="lpR"> 🤫 Rahasiakan harapanku (hanya namaku yang terlihat)</label>
    <div class="baris"><button class="btn" type="button" id="lpT">🏮 Terbangkan</button></div>
    ${terbaru.length ? `<h3>✨ Harapan terbaru</h3><div class="daftar">${terbaru.map(x => `<div><span><b>🏮 ${esc(x.n)}</b><br><small>${x.m ? esc(x.m) : '<i>harapan rahasia</i>'}</small></span><small>${esc(jam(x.t))}</small></div>`).join('')}</div>` : ''}`, {
    pasang(el) {
      el.querySelector('#lpT').onclick = async () => {
        if (!(K.resmi && K.resmi())) { K.bukaDaftar && K.bukaDaftar(); return; }
        const m = bersih(el.querySelector('#lpM').value, 60), rahasia = el.querySelector('#lpR').checked;
        if (m && kasar(m)) { toast('Pakai kata-kata yang baik ya 🙏'); return; }
        const id = K.L.db.kunci(), isi = { uid: K.L.uid, n: bersih(K.prof?.n || 'Tamu', 30), t: TS };
        if (m && !rahasia) isi.m = sensor(m);
        try {
          await K.L.db.update('', { ['lampion/' + id]: isi, ['lampionT/' + K.L.uid]: TS });
          tutupKartu(); Musik.sfx('hati'); toast('🏮 Lampionmu terbang tinggi! Semoga harapanmu terkabul ✨', 4500);
        } catch (e) { toast('Tunggu 1 menit sebelum menerbangkan lampion lagi ya.'); }
      };
    },
  });
}
const lampion3D = new Map();          // k -> { g, x0, z0, t }
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
function labelSprite(teks, warna = '#ffe9b0') {
  const { THREE } = D, c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const x = c.getContext('2d'); x.font = 'bold 40px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#2a1420b0'; const w = Math.min(500, x.measureText(teks).width + 40); x.beginPath(); x.roundRect ? x.roundRect((512 - w) / 2, 14, w, 68, 30) : x.rect((512 - w) / 2, 14, w, 68); x.fill();
  x.fillStyle = warna; x.fillText(teks, 256, 50, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true })); s.scale.set(3.2, 0.6, 1); return s;
}
function buatLampion(x) {
  const { THREE } = D, g = new THREE.Group();
  const badan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.62, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#ff9a3c', side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
  const api = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff2a8' })); api.position.y = -0.2;
  g.add(badan, api);
  const lb = labelSprite(x.m ? `🏮 ${x.n}: ${x.m}` : `🏮 ${x.n}`); lb.position.y = 0.85; g.add(lb);
  D.scene.add(g);
  const h = hash(x.k);
  return { g, x0: RODA.x + ((h & 255) / 255 - 0.5) * 6, z0: RODA.z + (((h >> 8) & 255) / 255 - 0.5) * 8, t: x.t, fase: (h & 1023) / 160 };
}
function animasiLampion() {
  if (!D) return;
  const now = kini(), ada = new Set();
  for (const x of ST.lampion) {
    const umur = (now - x.t) / 1000; if (umur < -5 || umur > 150) continue;
    ada.add(x.k);
    let o = lampion3D.get(x.k); if (!o) { o = buatLampion(x); lampion3D.set(x.k, o); }
    const u = Math.max(0, umur);
    o.g.position.set(o.x0 + u * 0.05 + Math.sin(u * 0.4 + o.fase) * 0.6, RODA.y + RODA.r + 0.5 + u * 0.13, o.z0 + Math.cos(u * 0.3 + o.fase) * 0.6);
    o.g.children[0].material.opacity = u > 130 ? Math.max(0, (150 - u) / 20) : 0.95;
  }
  for (const [k, o] of lampion3D) if (!ada.has(k)) { D.scene.remove(o.g); o.g.traverse(m => { if (m.material) { m.material.map && m.material.map.dispose(); m.material.dispose(); } if (m.geometry) m.geometry.dispose(); }); lampion3D.delete(k); }
}

// ---------------------------------------------------------------- 🎆 KEMBANG API
async function nyalakanKembang() {
  const n = D.naik(); if (!n) return;
  if (!diPuncak(n)) { toast('🎆 Kembang api hanya bisa dinyalakan dari puncak. Tunggu gondolamu sampai atas ya!'); return; }
  if (!(K.resmi && K.resmi())) { K.bukaDaftar && K.bukaDaftar(); return; }
  try { await K.L.db.set('kembangApi/' + K.L.uid, { n: bersih(K.prof?.n || 'Tamu', 30), t: TS }); toast('🎆 Dor! Kembang apimu menghiasi langit, dilihat semua tamu!', 4000); }
  catch (e) { toast('Kembang api sedang diisi ulang (1x tiap 2 menit).'); }
}
const ledakan = [];
function pertunjukan(k, uid) {
  if (!D) return;
  const s = K.saya, jauh = s ? Math.hypot(s.x - RODA.x, s.z - RODA.z) : 999;
  if (jauh < 120) Musik.sfx('kembangapi', { jeda: 500 });
  if (uid !== K.L.uid && s && jauh < 60) toast(`🎆 ${k.n} menyalakan kembang api dari puncak bianglala!`, 3500);
  for (let i = 0; i < 6; i++) setTimeout(() => ledak(RODA.x + (Math.random() - 0.5) * 16, RODA.y + RODA.r + 8 + Math.random() * 9, RODA.z + (Math.random() - 0.5) * 16), i * 450 + Math.random() * 200);
  const lb = labelSprite(`🎆 dari ${k.n}`, '#ffd23f'); lb.scale.set(7, 1.3, 1); lb.position.set(RODA.x, RODA.y + RODA.r + 6, RODA.z); D.scene.add(lb);
  setTimeout(() => { D.scene.remove(lb); lb.material.map.dispose(); lb.material.dispose(); }, 4500);
}
function ledak(x, y, z) {
  const { THREE } = D, N = 90, pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) {
    pos.set([x, y, z], i * 3);
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), v = 5 + Math.random() * 2.5;
    vel.push([Math.sin(b) * Math.cos(a) * v, Math.cos(b) * v, Math.sin(b) * Math.sin(a) * v]);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const warna = new THREE.Color().setHSL(Math.random(), 1, 0.55);
  const mat = new THREE.PointsMaterial({ color: warna, size: 0.55, transparent: true, opacity: 1, depthWrite: false });
  const p = new THREE.Points(geo, mat); D.scene.add(p);
  ledakan.push({ p, vel, umur: 0 });
}
function animasiKembang(dt) {
  for (let i = ledakan.length - 1; i >= 0; i--) {
    const l = ledakan[i]; l.umur += dt;
    const a = l.p.geometry.attributes.position;
    for (let j = 0; j < l.vel.length; j++) { const v = l.vel[j]; v[1] -= 3.2 * dt; v[0] *= 0.985; v[2] *= 0.985; a.array[j * 3] += v[0] * dt; a.array[j * 3 + 1] += v[1] * dt; a.array[j * 3 + 2] += v[2] * dt; }
    a.needsUpdate = true; l.p.material.opacity = Math.max(0, 1 - l.umur / 2.2);
    if (l.umur > 2.2) { D.scene.remove(l.p); l.p.geometry.dispose(); l.p.material.dispose(); ledakan.splice(i, 1); }
  }
}
