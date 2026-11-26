// =====================================================================
//  Suara: pesan suara (voice note) di obrolan pribadi & telepon suara
//  untuk pasangan yang saling match atau obrolan pribadi yang sudah diterima.
//  - Voice note: maks. 30 detik, audio disimpan terpisah di suaraDm/<ruang>/<id>
//    dan baru diunduh saat diputar; dihapus otomatis setelah 7 hari.
//  - Telepon: WebRTC langsung antar-perangkat (tidak lewat server, tidak direkam).
//    Sinyal pembuka lewat telepon/<penerima> & sinyal/<ruang>. Server TURN dari /api/turn.
// =====================================================================
import { bersih, esc } from '../js/common.js?v=202611261448';
import { TS } from '../js/db.js?v=202611261448';
import { $, K, toast } from './ui.js?v=202611261448';

export const MAKS_DETIK = 30;
const UMUR_SUARA = 7 * 24 * 3600e3;
const MAKS_TELEPON = 30 * 60e3;
const DERING_MAKS = 35e3;

// ---------------------------------------------------------------- VOICE NOTE
export const bisaRekam = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

function tipeRekam() {
  for (const t of ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}
const keBase64 = blob => new Promise((ok, gagal) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = gagal; r.readAsDataURL(blob); });

// Mulai merekam. Mengembalikan pengendali { selesai(): Promise<{d,tp,dur}>, batal() }.
export async function mulaiRekam(onDetik) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const tipe = tipeRekam();
  const rec = new MediaRecorder(stream, { ...(tipe ? { mimeType: tipe } : {}), audioBitsPerSecond: 24000 });
  const potong = []; const t0 = Date.now();
  rec.ondataavailable = e => { if (e.data && e.data.size) potong.push(e.data); };
  let berhenti; const selesaiRekam = new Promise(r => { berhenti = r; }); rec.onstop = () => berhenti();
  rec.start(250);
  const jam = setInterval(() => { const d = (Date.now() - t0) / 1000; onDetik && onDetik(d); if (d >= MAKS_DETIK) stop(); }, 200);
  const stop = () => { clearInterval(jam); if (rec.state !== 'inactive') rec.stop(); stream.getTracks().forEach(t => t.stop()); };
  return {
    async selesai() {
      stop(); await selesaiRekam;
      const dur = Math.min(MAKS_DETIK, Math.round((Date.now() - t0) / 100) / 10);
      const blob = new Blob(potong, { type: (rec.mimeType || tipe || 'audio/webm').split(';')[0] });
      return { d: await keBase64(blob), tp: blob.type || 'audio/webm', dur };
    },
    batal() { stop(); },
  };
}

// Kirim voice note: pesan berisi penanda + audio di simpul terpisah
export async function kirimSuara(L, r, n, rekaman) {
  if (!rekaman.d || rekaman.d.length > 160000) throw new Error('rekaman terlalu besar');
  const id = L.db.push(`suaraDm/${r}`, { uid: L.uid, d: rekaman.d, tp: rekaman.tp, t: TS });
  L.db.push(`dm/${r}/pesan`, { uid: L.uid, n, m: '🎤 Pesan suara', t: TS, sv: { id, dur: rekaman.dur } });
  L.db.update(`dmku/${L.uid}/${r}`, { t: TS, baru: false }).catch(() => {});
  L.db.update(`dmku/${L.lawan(r)}/${r}`, { t: TS, baru: true }).catch(() => {});
}

// Hapus audio voice note yang umurnya lebih dari 7 hari (tanpa mengunduhnya)
export function bersihkanSuaraLama(L, r, pesan) {
  const batas = L.db.now() - UMUR_SUARA;
  for (const m of pesan) if (m.sv && m.sv.id && m.t && m.t < batas) L.db.set(`suaraDm/${r}/${m.sv.id}`, null).catch(() => {});
}

const durTeks = d => `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, '0')}`;
export const htmlSuara = m => `<button type="button" class="vn" data-vn="${esc(m.sv.id)}" aria-label="Putar pesan suara ${durTeks(m.sv.dur || 0)}"><b>▶</b><i><u></u></i><small>${durTeks(m.sv.dur || 0)}</small></button>`;

// Pasang pemutar voice note di dalam kotak obrolan
let sedangDiputar = null;
export function pasangPemutar(L, r, box) {
  box.querySelectorAll('[data-vn]').forEach(b => b.onclick = async () => {
    if (sedangDiputar && sedangDiputar.tombol === b) { sedangDiputar.audio.pause(); return; }
    if (sedangDiputar) sedangDiputar.audio.pause();
    b.querySelector('b').textContent = '…';
    try {
      const v = await L.db.get(`suaraDm/${r}/${b.dataset.vn}`);
      if (!v || !v.d) { b.querySelector('b').textContent = '✕'; b.querySelector('small').textContent = 'kedaluwarsa'; return; }
      const audio = new Audio(`data:${v.tp || 'audio/webm'};base64,${v.d}`);
      const bar = b.querySelector('u');
      sedangDiputar = { tombol: b, audio };
      audio.ontimeupdate = () => { if (audio.duration && isFinite(audio.duration)) bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`; };
      audio.onpause = audio.onended = () => { b.querySelector('b').textContent = '▶'; if (audio.ended) bar.style.width = '0%'; if (sedangDiputar && sedangDiputar.audio === audio) sedangDiputar = null; };
      audio.onplay = () => { b.querySelector('b').textContent = '❚❚'; };
      await audio.play();
    } catch (e) { b.querySelector('b').textContent = '▶'; toast('Pesan suara tidak bisa diputar di perangkat ini.'); }
  });
}

// ---------------------------------------------------------------- TELEPON
let panggilan = null; // { r, lawan, nama, peran: 'pemanggil'|'penerima', pc, stream, lepas: [], mulai, timer }
export const sedangTelepon = () => !!panggilan;

async function iceServers(L) {
  const cadangan = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  if (L.mode !== 'online') return cadangan;
  try {
    const idToken = await L.db.idToken();
    const res = await fetch('/api/turn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }) });
    const j = await res.json();
    return Array.isArray(j.iceServers) && j.iceServers.length ? j.iceServers : cadangan;
  } catch (e) { return cadangan; }
}

function layar(html) {
  let el = $('telepon');
  if (!el) { el = document.createElement('div'); el.id = 'telepon'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite'); document.body.append(el); }
  el.innerHTML = html; el.hidden = false; return el;
}
function tutupLayar() { const el = $('telepon'); if (el) { el.hidden = true; el.innerHTML = ''; } }
const inisial = n => esc((bersih(n, 20) || '?').slice(0, 1).toUpperCase());
const durasi = ms => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// Nada dering/nada sambung sederhana (WebAudio)
let nada = null;
function mulaiNada(jenis) {
  hentikanNada();
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bunyi = () => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = jenis === 'dering' ? 660 : 440; g.gain.value = 0.06; o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (jenis === 'dering' ? 0.35 : 0.9)); if (jenis === 'dering' && navigator.vibrate) navigator.vibrate(300); };
    bunyi(); nada = { ctx, int: setInterval(bunyi, jenis === 'dering' ? 1200 : 3000) };
  } catch (e) { nada = null; }
}
function hentikanNada() { if (nada) { clearInterval(nada.int); nada.ctx.close().catch(() => {}); nada = null; } }

function tampilan(status, { masuk = false } = {}) {
  const p = panggilan; if (!p) return;
  const el = layar(`<div class="tlpKotak">
      <div class="tlpFoto">${inisial(p.nama)}</div>
      <b class="tlpNama">${esc(p.nama)}</b>
      <span class="tlpStatus" id="tlpS">${esc(status)}</span>
      <div class="tlpTombol">
        ${masuk ? '<button type="button" class="tlpBulat tlpHijau" id="tlpA" aria-label="Angkat">📞</button><button type="button" class="tlpBulat tlpMerah" id="tlpT" aria-label="Tolak">✕</button>'
          : `<button type="button" class="tlpBulat" id="tlpM" aria-label="Bisukan mikrofon" aria-pressed="false">🎙️</button><button type="button" class="tlpBulat tlpMerah" id="tlpT" aria-label="Tutup telepon">✕</button>`}
      </div>
      <small class="tlpCatatan">Telepon langsung antar-perangkat, tidak direkam. Maks. 30 menit.</small>
    </div><audio id="tlpAudio" autoplay playsinline></audio>`);
  const t = el.querySelector('#tlpT'); if (t) t.onclick = () => (masuk ? tolakMasuk() : akhiri('Telepon ditutup'));
  const a = el.querySelector('#tlpA'); if (a) a.onclick = () => angkat();
  const m = el.querySelector('#tlpM'); if (m) m.onclick = () => {
    const aktif = p.stream && p.stream.getAudioTracks()[0]; if (!aktif) return;
    aktif.enabled = !aktif.enabled; m.setAttribute('aria-pressed', String(!aktif.enabled)); m.textContent = aktif.enabled ? '🎙️' : '🔇';
  };
  if (p.remote) el.querySelector('#tlpAudio').srcObject = p.remote;
}
const setStatus = s => { const el = $('tlpS'); if (el) el.textContent = s; };

async function siapkanKoneksi(L, peran) {
  const p = panggilan;
  p.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const pc = new RTCPeerConnection({ iceServers: await iceServers(L) });
  p.pc = pc;
  p.stream.getTracks().forEach(t => pc.addTrack(t, p.stream));
  pc.ontrack = e => { p.remote = e.streams[0]; const au = $('tlpAudio'); if (au) au.srcObject = p.remote; };
  const sisiSaya = peran === 'pemanggil' ? 'iceA' : 'iceB';
  pc.onicecandidate = e => { if (e.candidate) L.db.push(`sinyal/${p.r}/${sisiSaya}`, e.candidate.toJSON()); };
  pc.onconnectionstatechange = () => {
    if (!panggilan || panggilan.pc !== pc) return;
    if (pc.connectionState === 'connected' && !p.mulai) {
      hentikanNada(); p.mulai = Date.now();
      p.timer = setInterval(() => { const d = Date.now() - p.mulai; setStatus(durasi(d)); if (d >= MAKS_TELEPON) akhiri('Batas 30 menit tercapai'); }, 1000);
    }
    if (pc.connectionState === 'failed') akhiri('Sambungan gagal. Coba lagi, atau pakai WiFi.');
  };
  // ikuti sinyal dari lawan
  const sisiLawan = peran === 'pemanggil' ? 'iceB' : 'iceA';
  const dipakai = new Set();
  p.proses = async s => {
    if (!panggilan || panggilan.pc !== pc) return;
    if (!s) { if (p.tersambungPernah) akhiri('Telepon selesai'); return; }
    p.tersambungPernah = true;
    if (s.akhir) { akhiri('Telepon selesai'); return; }
    if (peran === 'pemanggil' && s.answer && !pc.currentRemoteDescription && !p.pasangJawaban) {
      p.pasangJawaban = true;
      try { await pc.setRemoteDescription(s.answer); setStatus('Menyambungkan…'); } catch (e) { console.warn(e); }
    }
    if (pc.currentRemoteDescription) for (const [k, c] of Object.entries(s[sisiLawan] || {})) {
      if (dipakai.has(k)) continue; dipakai.add(k);
      pc.addIceCandidate(c).catch(e => console.warn('ice', e));
    }
  };
  p.lepas.push(L.db.on(`sinyal/${p.r}`, s => p.proses(s)));
  return pc;
}

// Pemanggil
export async function telepon(L, lawan, nama, namaSaya) {
  if (panggilan) { toast('Kamu sedang menelepon.'); return; }
  if (!window.RTCPeerConnection || !navigator.mediaDevices) { toast('Browser ini belum mendukung telepon. Pakai Chrome atau Safari terbaru.'); return; }
  const r = L.ruang(L.uid, lawan);
  panggilan = { r, lawan, nama, peran: 'pemanggil', lepas: [] };
  tampilan('Menyiapkan mikrofon…');
  try {
    await L.db.set(`sinyal/${r}`, null).catch(() => {});
    const pc = await siapkanKoneksi(L, 'pemanggil');
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    await L.db.set(`sinyal/${r}/offer`, { type: offer.type, sdp: offer.sdp });
    await L.db.set(`telepon/${lawan}`, { dari: L.uid, n: bersih(namaSaya, 20), r, t: TS, st: 'dering' });
    setStatus('Memanggil…'); mulaiNada('sambung');
    panggilan.lepas.push(L.db.on(`telepon/${lawan}`, v => {
      if (!panggilan || panggilan.r !== r) return;
      if (v && v.st === 'tolak') akhiri(`${nama} menolak panggilan`);
      else if (v && v.st === 'angkat') setStatus('Menyambungkan…');
      else if (!v && !panggilan.mulai && panggilan.diangkatPernah !== true && panggilan.dibuat) akhiri('Panggilan berakhir');
      if (v) panggilan.dibuat = true;
      if (v && v.st === 'angkat') panggilan.diangkatPernah = true;
    }));
    panggilan.tunggu = setTimeout(() => { if (panggilan && !panggilan.mulai) akhiri(`${nama} tidak mengangkat`); }, DERING_MAKS);
  } catch (e) {
    console.warn(e);
    akhiri(e && e.name === 'NotAllowedError' ? 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser.' : 'Telepon gagal dimulai.');
  }
}

// Penerima: dipanggil saat telepon/<saya> berubah
export function pantauPanggilanMasuk(L) {
  L.db.on(`telepon/${L.uid}`, v => {
    if (!v || v.st !== 'dering') { if (panggilan && panggilan.peran === 'penerima' && !panggilan.mulai && !v) akhiri('Panggilan dibatalkan'); return; }
    if (panggilan) { if (panggilan.r !== v.r) L.db.update(`telepon/${L.uid}`, { st: 'tolak' }).catch(() => {}); return; }
    if (L.db.now() - (v.t || 0) > DERING_MAKS) return; // panggilan basi
    if (K.sembunyi && K.sembunyi.has(v.dari)) { L.db.update(`telepon/${L.uid}`, { st: 'tolak' }).catch(() => {}); return; }
    panggilan = { r: v.r, lawan: v.dari, nama: bersih(v.n, 20) || 'Teman', peran: 'penerima', lepas: [] };
    tampilan('Panggilan suara masuk…', { masuk: true });
    mulaiNada('dering');
    panggilan.tunggu = setTimeout(() => { if (panggilan && !panggilan.mulai && panggilan.peran === 'penerima') akhiri('Panggilan tak terjawab'); }, DERING_MAKS);
  });
}

async function angkat() {
  const p = panggilan, L = K.L; if (!p) return;
  hentikanNada(); tampilan('Menyambungkan…');
  try {
    const pc = await siapkanKoneksi(L, 'penerima');
    let offer = null;
    for (let i = 0; i < 20 && !offer; i++) { offer = await L.db.get(`sinyal/${p.r}/offer`); if (!offer) await new Promise(r => setTimeout(r, 300)); }
    if (!offer) throw new Error('offer hilang');
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await L.db.set(`sinyal/${p.r}/answer`, { type: answer.type, sdp: answer.sdp });
    await L.db.update(`telepon/${L.uid}`, { st: 'angkat' });
    await p.proses(await L.db.get(`sinyal/${p.r}`)); // proses kandidat yang datang sebelum diangkat
  } catch (e) {
    console.warn(e);
    akhiri(e && e.name === 'NotAllowedError' ? 'Izin mikrofon ditolak.' : 'Gagal mengangkat telepon.');
  }
}

function tolakMasuk() {
  const L = K.L;
  L.db.update(`telepon/${L.uid}`, { st: 'tolak' }).catch(() => {});
  setTimeout(() => L.db.set(`telepon/${L.uid}`, null).catch(() => {}), 1500);
  akhiri('Panggilan ditolak', { diam: true });
}

export function akhiri(pesan, { diam = false } = {}) {
  const p = panggilan, L = K.L; if (!p) return;
  panggilan = null;
  hentikanNada(); clearTimeout(p.tunggu); clearInterval(p.timer);
  p.lepas.forEach(f => { try { f && f(); } catch (e) {} });
  try { p.pc && p.pc.close(); } catch (e) {}
  if (p.stream) p.stream.getTracks().forEach(t => t.stop());
  // beri tahu lawan, lalu bersihkan sinyal
  L.db.set(`sinyal/${p.r}/akhir`, true).catch(() => {});
  setTimeout(() => L.db.set(`sinyal/${p.r}`, null).catch(() => {}), 2500);
  if (p.peran === 'pemanggil') L.db.set(`telepon/${p.lawan}`, null).catch(() => {});
  else L.db.set(`telepon/${L.uid}`, null).catch(() => {});
  const lama = p.mulai ? ` · ${durasi(Date.now() - p.mulai)}` : '';
  tutupLayar();
  if (!diam) toast(`📞 ${pesan}${lama}`, 3200);
}
