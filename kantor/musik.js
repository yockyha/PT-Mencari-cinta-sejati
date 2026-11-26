// =====================================================================
//  MUSIK LATAR & EFEK SUARA: semuanya disintesis langsung di browser
//  (Web Audio API). Tidak ada file lagu: ringan, bebas hak cipta, dan
//  lagunya sedikit berbeda tiap putaran supaya tidak membosankan.
//
//  Lagu (berganti otomatis sesuai lokasi, dengan crossfade):
//    ceria  : lobi, halaman depan, Taman Cinta  (pop chiptune riang)
//    santai : ruangan kantor & saat main game   (lo-fi santai)
//    malam  : Lounge Eksekutif & suite Direktur (bossa jazzy)
//  Efek suara: sfx('duduk' | 'pesan' | 'chat' | 'level' | ...)
//  Browser hanya mengizinkan suara setelah pemain mengetuk/menekan
//  sesuatu, jadi audio baru menyala pada interaksi pertama.
// =====================================================================

const SIMPAN = 'ptmcs_audio';
export const atur = (() => {
  const d = { m: true, mv: 0.5, s: true, sv: 0.75 };
  try { return { ...d, ...(JSON.parse(localStorage.getItem(SIMPAN)) || {}) }; } catch { return d; }
})();
const simpan = () => { try { localStorage.setItem(SIMPAN, JSON.stringify(atur)); } catch { /* mode privat */ } };

const volM = () => (atur.m ? atur.mv * 0.85 * (redam ? 0.2 : 1) : 0);
let redam = false;
let ctx = null, master = null, busM = null, busS = null, gema = null, noise = null;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------------------------------------------------------------- MULAI (setelah interaksi pertama)
function siapkan() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC();
  buatGraf();
  setInterval(jadwal, 25);
  return true;
}
function buatGraf() {
  const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -14; komp.ratio.value = 4; komp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(komp);
  busM = ctx.createGain(); busM.gain.value = volM(); busM.connect(master);
  busS = ctx.createGain(); busS.gain.value = atur.s ? atur.sv : 0; busS.connect(master);
  // gema ruangan (impuls buatan)
  gema = ctx.createConvolver(); const pj = ctx.sampleRate * 1.6, ib = ctx.createBuffer(2, pj, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ib.getChannelData(c); for (let i = 0; i < pj; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / pj, 2.6); }
  gema.buffer = ib; const gG = ctx.createGain(); gG.gain.value = 0.22; gema.connect(gG).connect(master);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}
// Render lagu / efek suara ke AudioBuffer tanpa memutarnya (untuk pengujian & pratinjau)
export async function rekam(kunci, detik = 16, efek = null) {
  const simpanCtx = [ctx, master, busM, busS, gema, noise, jalan], simpanAtur = { ...atur };
  ctx = new OfflineAudioContext(2, Math.round(44100 * detik), 44100); Object.assign(atur, { m: true, s: true });
  buatGraf();
  if (efek) { let u = 0.2; for (const e of efek) { const f = SFX[e]; if (f) f(busS, u, {}); u += 1.4; } }
  else {
    const L = LAGU[kunci], bus = ctx.createGain(); bus.connect(busM);
    const J = { kunci, L, bus, step: 0, bar: 0, put: 0, t: 0.05, s16: 60 / L.bpm / 4 };
    while (J.t < detik - 0.5) { J.L.langkah(J, J.t + (J.step % 2 ? J.s16 * L.swing : 0), J.bar, J.step, J.put, acak); J.t += J.s16; J.step++; if (J.step >= 16) { J.step = 0; J.bar++; if (J.bar % L.akord.length === 0) J.put++; } }
  }
  const hasil = await ctx.startRendering();
  [ctx, master, busM, busS, gema, noise, jalan] = simpanCtx; Object.assign(atur, simpanAtur);
  return hasil;
}
export function pasang() {
  const mulai = () => { if (siapkan()) { ['pointerdown', 'keydown', 'touchstart'].forEach(e => removeEventListener(e, mulai, true)); } };
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, mulai, true));
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  // klik halus untuk tombol antarmuka
  addEventListener('click', e => { if (e.target.closest && e.target.closest('button, .btn, .pill, .mini, a.btn')) sfx('klik'); }, true);
}
export const aktif = () => !!ctx;

// ---------------------------------------------------------------- INSTRUMEN
function env(g, t, a, puncak, lama, akhir = 0.0008) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(puncak, t + a); g.gain.exponentialRampToValueAtTime(akhir, t + a + lama); }
function nada(bus, t, f, lama, vol, { tipe = 'triangle', a = 0.006, lp = 0, det = 0, gema: kirim = 0.25, vib = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipe; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det;
  let ujung = o;
  if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + lama + a + 0.1); }
  if (lp) { const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp; ujung.connect(f2); ujung = f2; }
  ujung.connect(g); env(g, t, a, vol, lama); g.connect(bus);
  if (kirim) { const s = ctx.createGain(); s.gain.value = kirim; g.connect(s).connect(gema); }
  o.start(t); o.stop(t + a + lama + 0.05);
}
function bunyiNoise(bus, t, lama, vol, { hp = 0, bp = 0, lp = 0, q = 1 } = {}) {
  const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = noise;
  let u = s; for (const [tp, fq] of [['highpass', hp], ['bandpass', bp], ['lowpass', lp]]) if (fq) { const f = ctx.createBiquadFilter(); f.type = tp; f.frequency.value = fq; f.Q.value = q; u.connect(f); u = f; }
  u.connect(g); env(g, t, 0.002, vol, lama); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + lama + 0.05);
}
function tendang(bus, t, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.003, vol, 0.22); o.connect(g).connect(bus); o.start(t); o.stop(t + 0.3); }
const lonceng = (bus, t, f, vol, lama = 1.1) => { nada(bus, t, f, lama, vol, { tipe: 'sine', gema: 0.45 }); nada(bus, t, f * 2.76, lama * 0.35, vol * 0.28, { tipe: 'sine', gema: 0.3 }); };
function epiano(bus, t, f, lama, vol) { nada(bus, t, f, lama, vol, { tipe: 'sine', a: 0.01, gema: 0.35 }); nada(bus, t, f * 2, lama * 0.45, vol * 0.22, { tipe: 'sine', a: 0.005, gema: 0.2 }); nada(bus, t, f, lama * 0.9, vol * 0.18, { tipe: 'triangle', det: 7, lp: 1600, gema: 0.2 }); }

// ---------------------------------------------------------------- LAGU
// tiap lagu: bpm, swing (0–0.3), birama berisi akord, dan fungsi langkah(t, birama, step, putaran, acak)
const C = (...n) => n;
const LAGU = {
  ceria: {
    nama: '🎵 Ceria · Lobi Cinta', bpm: 116, swing: 0.04,
    akord: [C(48, 60, 64, 67), C(43, 59, 62, 67), C(45, 60, 64, 69), C(41, 60, 65, 69), C(48, 60, 64, 67), C(43, 59, 62, 67), C(41, 60, 65, 69), C(43, 59, 62, 65)],
    melodi: [
      [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 79, 2], [10, 76, 2], [12, 74, 4]],
      [[0, 74, 2], [2, 71, 2], [4, 74, 2], [6, 79, 4], [12, 74, 4]],
      [[0, 76, 2], [2, 81, 2], [4, 84, 4], [8, 83, 2], [10, 81, 2], [12, 76, 4]],
      [[0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 79, 6]],
      [[0, 76, 2], [2, 79, 2], [4, 76, 2], [6, 72, 2], [8, 74, 2], [10, 76, 2], [12, 79, 4]],
      [[0, 83, 2], [2, 81, 2], [4, 79, 4], [8, 74, 4], [12, 71, 4]],
      [[0, 81, 2], [2, 79, 2], [4, 77, 2], [6, 76, 2], [8, 77, 2], [10, 81, 2], [12, 84, 4]],
      [[0, 83, 4], [4, 86, 4], [8, 79, 8]],
    ],
    langkah(B, t, b, s, put, r) {
      const a = this.akord[b % 8], akar = a[0], sp = B.s16;
      // drum
      if (s % 8 === 0 || (s === 11 && r() < 0.5)) tendang(B.bus, t, 0.5);
      if (s === 4 || s === 12) bunyiNoise(B.bus, t, 0.12, 0.16, { bp: 1900, q: 0.8 });
      if (s % 2 === 0) bunyiNoise(B.bus, t, s === 14 ? 0.12 : 0.03, s === 14 ? 0.06 : 0.045, { hp: 7500 });
      // bass memantul
      if ([0, 4, 8, 12].includes(s)) nada(B.bus, t, hz(akar + (s === 4 || s === 12 ? 12 : 0)), sp * 1.7, 0.3, { tipe: 'triangle', lp: 900, gema: 0 });
      if (s === 10) nada(B.bus, t, hz(akar + 7), sp * 1.5, 0.22, { tipe: 'triangle', lp: 900, gema: 0 });
      // genjrengan ukulele di ketukan lemah
      if (s % 4 === 2) a.slice(1).forEach((n, i) => nada(B.bus, t + i * 0.012, hz(n + 12), sp * 1.6, 0.06, { tipe: 'triangle', lp: 3200, gema: 0.2 }));
      // melodi (putaran 0 & 2 & 3), glockenspiel arpeggio (putaran 1 & 2)
      const v = put % 4;
      if (v !== 1) for (const [st, n, pj] of this.melodi[b % 8]) if (st === s) nada(B.bus, t, hz(n + (v === 3 && r() < 0.25 ? 12 : 0)), sp * pj * 0.9, 0.085, { tipe: 'square', lp: 2600, vib: 3, gema: 0.3 });
      if ((v === 1 || v === 2) && s % 2 === 0) lonceng(B.bus, t, hz(a[1 + (s / 2) % 3] + 24), v === 1 ? 0.07 : 0.035, 0.5);
    },
  },
  santai: {
    nama: '☕ Santai · Lo-fi Kantor', bpm: 76, swing: 0.2,
    akord: [C(41, 57, 60, 64, 69), C(40, 55, 59, 62, 67), C(38, 53, 57, 60, 64), C(36, 52, 55, 59, 64)],
    langkah(B, t, b, s, put, r) {
      const a = this.akord[b % 4], sp = B.s16;
      if (s === 0 || s === 10 || (s === 7 && r() < 0.35)) tendang(B.bus, t, 0.32);
      if (s === 4 || s === 12) bunyiNoise(B.bus, t, 0.09, 0.07, { bp: 1200, q: 1.2, lp: 4000 });
      if (s % 2 === 0) bunyiNoise(B.bus, t, 0.025, 0.022 + (s % 4 === 2 ? 0.01 : 0), { hp: 6500 });
      if (r() < 0.06) bunyiNoise(B.bus, t, 0.01, 0.02, { bp: 3000 }); // derak piringan hitam
      if (s === 0) { nada(B.bus, t, hz(a[0] - 12 + 12), sp * 7, 0.34, { tipe: 'sine', lp: 600, gema: 0 }); a.slice(1).forEach((n, i) => epiano(B.bus, t + i * 0.018, hz(n), sp * 14, 0.055)); }
      if (s === 10) { nada(B.bus, t, hz(a[0] + 7), sp * 5, 0.24, { tipe: 'sine', lp: 600, gema: 0 }); a.slice(2).forEach((n, i) => epiano(B.bus, t + i * 0.02, hz(n), sp * 5, 0.035)); }
      // melodi lembut, dibuat acak dari nada akord + pentatonik (beda tiap putaran)
      if (put % 3 !== 2 && [2, 6, 9, 13].includes(s) && r() < 0.55) {
        const pil = [...a.slice(1), 72, 74, 76, 79, 81].map(n => n < 67 ? n + 12 : n);
        nada(B.bus, t, hz(pil[Math.floor(r() * pil.length)]), sp * (2 + Math.floor(r() * 3)), 0.07, { tipe: 'sine', a: 0.02, vib: 4, gema: 0.5 });
      }
    },
  },
  malam: {
    nama: '🌙 Malam · Bossa Lounge', bpm: 92, swing: 0.08,
    akord: [C(38, 53, 57, 60, 64), C(43, 53, 57, 59, 64), C(36, 52, 55, 59, 62), C(45, 55, 58, 61, 64)],
    langkah(B, t, b, s, put, r) {
      const a = this.akord[b % 4], sp = B.s16;
      if ([0, 3, 6, 10, 13].includes(s)) a.slice(1).forEach((n, i) => nada(B.bus, t + i * 0.01, hz(n), sp * (s === 0 ? 2.5 : 1.6), 0.045, { tipe: 'triangle', lp: 2400, gema: 0.3 }));
      if (s === 0 || s === 8) nada(B.bus, t, hz(a[0]), sp * 2.6, 0.32, { tipe: 'sine', lp: 700, gema: 0 });
      if (s === 6 || s === 14) nada(B.bus, t, hz(a[0] + 7), sp * 1.6, 0.26, { tipe: 'sine', lp: 700, gema: 0 });
      if ([0, 3, 6, 10, 12].includes(s)) bunyiNoise(B.bus, t, 0.02, 0.05, { bp: 2600, q: 4 }); // klave
      bunyiNoise(B.bus, t, 0.03, s % 2 ? 0.012 : 0.02, { hp: 8000 }); // shaker
      if (s === 0) tendang(B.bus, t, 0.22);
      if (put % 2 === 0 && [4, 8, 12, 14].includes(s) && r() < 0.5) {
        const pil = a.slice(1).map(n => n + 12);
        nada(B.bus, t, hz(pil[Math.floor(r() * pil.length)]), sp * 3, 0.06, { tipe: 'sine', a: 0.03, vib: 5, gema: 0.55 });
      }
    },
  },
};
export const namaLagu = k => (LAGU[k] || {}).nama || '';

// ---------------------------------------------------------------- PENJADWAL
let tujuan = 'ceria', paksa = null, jalan = null; // jalan: { kunci, bus, step, bar, put, t, s16, berhenti }
let benih = 1;
const acak = () => { benih = (benih * 16807) % 2147483647; return benih / 2147483647; };
export function lokasi(kunci) { tujuan = kunci; }
export function paksakan(kunci) { paksa = kunci; } // mis. saat mini game; null = ikut lokasi
export const lagu = () => paksa || tujuan;

function jadwal() {
  if (!ctx || ctx.state !== 'running') return;
  const mau = lagu();
  if (!jalan || jalan.kunci !== mau) {
    if (jalan) { // crossfade: lagu lama memudar lalu dilepas
      const lama = jalan, g = lama.bus.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
      setTimeout(() => { try { lama.bus.disconnect(); } catch { /* */ } }, 1800);
    }
    const L = LAGU[mau], bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.4); bus.connect(busM);
    jalan = { kunci: mau, L, bus, step: 0, bar: 0, put: 0, t: ctx.currentTime + 0.08, s16: 60 / L.bpm / 4 };
  }
  if (!atur.m) { jalan.t = Math.max(jalan.t, ctx.currentTime); return; }
  const J = jalan;
  while (J.t < ctx.currentTime + 0.14) {
    const geser = J.step % 2 ? J.s16 * J.L.swing : 0;
    if (J.t + geser > ctx.currentTime - 0.01) J.L.langkah(J, J.t + geser, J.bar, J.step, J.put, acak);
    J.t += J.s16; J.step++;
    if (J.step >= 16) { J.step = 0; J.bar++; if (J.bar % J.L.akord.length === 0) J.put++; }
  }
}

// ---------------------------------------------------------------- EFEK SUARA
let klikT = 0, terakhir = {};
export function sfx(nama, opsi = {}) {
  if (!ctx || !atur.s || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.01, now = performance.now();
  if (nama === 'klik') { if (now - klikT < 60) return; klikT = now; }
  if (terakhir[nama] && now - terakhir[nama] < (opsi.jeda ?? 90)) return; terakhir[nama] = now;
  const S = busS, f = SFX[nama]; if (f) f(S, t, opsi);
}
const SFX = {
  klik: (S, t) => nada(S, t, 1200, 0.03, 0.05, { tipe: 'sine', gema: 0 }),
  duduk: (S, t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.18); env(g, t, 0.005, 0.32, 0.2); o.connect(g).connect(S); o.start(t); o.stop(t + 0.3); bunyiNoise(S, t, 0.12, 0.08, { lp: 700 }); nada(S, t + 0.12, 660, 0.08, 0.06, { tipe: 'sine', gema: 0 }); },
  berdiri: (S, t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.14); env(g, t, 0.005, 0.18, 0.15); o.connect(g).connect(S); o.start(t); o.stop(t + 0.2); },
  pesan: (S, t) => { lonceng(S, t, hz(88), 0.16, 0.9); lonceng(S, t + 0.14, hz(84), 0.14, 1.1); },
  minum: (S, t) => { for (let i = 0; i < 3; i++) { const o = ctx.createOscillator(), g = ctx.createGain(), u = t + i * 0.2; o.type = 'sine'; o.frequency.setValueAtTime(260, u); o.frequency.exponentialRampToValueAtTime(520, u + 0.09); env(g, u, 0.01, 0.16, 0.1); o.connect(g).connect(S); o.start(u); o.stop(u + 0.15); } },
  makan: (S, t) => { for (let i = 0; i < 4; i++) bunyiNoise(S, t + i * 0.16, 0.05, 0.12, { bp: 2500 + i * 300, q: 2 }); },
  bayar: (S, t) => { bunyiNoise(S, t, 0.08, 0.12, { hp: 3000 }); lonceng(S, t + 0.05, hz(96), 0.14, 0.6); lonceng(S, t + 0.13, hz(100), 0.16, 1.0); },
  chat: (S, t) => { nada(S, t, 700, 0.05, 0.08, { tipe: 'sine', gema: 0.1 }); nada(S, t + 0.06, 1050, 0.07, 0.08, { tipe: 'sine', gema: 0.1 }); },
  masuk: (S, t) => nada(S, t, 880, 0.09, 0.05, { tipe: 'sine', gema: 0.2 }),
  notif: (S, t) => [0, 4, 7, 12].forEach((d, i) => lonceng(S, t + i * 0.08, hz(76 + d), 0.08, 0.7)),
  level: (S, t) => { [72, 76, 79, 84].forEach((n, i) => nada(S, t + i * 0.11, hz(n), 0.18, 0.13, { tipe: 'square', lp: 3000, gema: 0.3 })); [84, 88, 91].forEach(n => nada(S, t + 0.48, hz(n), 0.7, 0.08, { tipe: 'triangle', gema: 0.5 })); },
  match: (S, t) => [79, 83, 86, 91, 95].forEach((n, i) => lonceng(S, t + i * 0.07, hz(n), 0.08, 0.8)),
  hati: (S, t) => [84, 88, 91, 96].forEach((n, i) => lonceng(S, t + i * 0.09 + Math.random() * 0.03, hz(n), 0.05, 0.9)),
  kembangapi: (S, t) => { for (let i = 0; i < 6; i++) { const u = t + i * 0.28 + Math.random() * 0.1; bunyiNoise(S, u, 0.35, 0.16, { lp: 1800 }); for (let k = 0; k < 5; k++) bunyiNoise(S, u + 0.3 + k * 0.05 + Math.random() * 0.05, 0.03, 0.05, { hp: 5000 }); } },
  jepret: (S, t) => { bunyiNoise(S, t, 0.03, 0.25, { hp: 2000 }); bunyiNoise(S, t + 0.07, 0.05, 0.2, { bp: 3000 }); },
  koin: (S, t) => { lonceng(S, t, hz(98), 0.12, 0.4); lonceng(S, t + 0.08, hz(103), 0.12, 0.5); bunyiNoise(S, t + 0.45, 0.35, 0.12, { lp: 1500 }); },
  tangkap: (S, t, o) => nada(S, t, hz(o.besar ? 88 : 81), 0.1, 0.12, { tipe: 'square', lp: 4000, gema: 0.15 }),
  rusak: (S, t) => { const o2 = ctx.createOscillator(), g = ctx.createGain(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(200, t); o2.frequency.exponentialRampToValueAtTime(60, t + 0.25); env(g, t, 0.005, 0.12, 0.25); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; o2.connect(f).connect(g).connect(S); o2.start(t); o2.stop(t + 0.3); },
  selesai: (S, t) => [79, 76, 79, 84].forEach((n, i) => nada(S, t + i * 0.13, hz(n), 0.2, 0.12, { tipe: 'square', lp: 2800, gema: 0.3 })),
  pintu: (S, t) => bunyiNoise(S, t, 0.45, 0.09, { bp: 800, q: 0.7 }),
  ketuk: (S, t) => { for (const d of [0, 0.18]) { tendang(S, t + d, 0.35); bunyiNoise(S, t + d, 0.04, 0.12, { bp: 1200 }); } },
  tidur: (S, t) => [76, 72, 67].forEach((n, i) => nada(S, t + i * 0.35, hz(n), 0.6, 0.08, { tipe: 'sine', gema: 0.6, vib: 3 })),
  lambai: (S, t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(1600, t + 0.15); o.frequency.exponentialRampToValueAtTime(1200, t + 0.3); env(g, t, 0.02, 0.07, 0.3); o.connect(g).connect(S); o.start(t); o.stop(t + 0.4); },
  menari: (S, t) => [0, 0.15, 0.3].forEach((d, i) => nada(S, t + d, hz(72 + i * 4), 0.1, 0.08, { tipe: 'square', lp: 2500 })),
  emote: (S, t) => nada(S, t, 600, 0.08, 0.07, { tipe: 'sine', gema: 0.15 }),
  microwave: (S, t) => { [0, 0.25, 0.5].forEach(d => nada(S, t + d, 1800, 0.1, 0.06, { tipe: 'square', lp: 4000, gema: 0 })); lonceng(S, t + 0.85, hz(93), 0.14, 0.8); },
  kulkas: (S, t) => { bunyiNoise(S, t, 0.25, 0.08, { lp: 600 }); lonceng(S, t + 0.25, hz(100), 0.05, 0.3); },
  siram: (S, t) => bunyiNoise(S, t, 0.8, 0.07, { bp: 4000, q: 0.5 }),
  hadiah: (S, t) => [72, 79, 84, 88, 91].forEach((n, i) => lonceng(S, t + i * 0.06, hz(n), 0.07, 0.6)),
};

// ---------------------------------------------------------------- PENGATURAN
export function setel(o) {
  Object.assign(atur, o); simpan();
  if (!ctx) return;
  const n = ctx.currentTime;
  busM.gain.setTargetAtTime(volM(), n, 0.15);
  busS.gain.setTargetAtTime(atur.s ? atur.sv : 0, n, 0.05);
}
// kecilkan musik sementara (mis. saat telepon / memutar pesan suara)
export function redamkan(ya) {
  if (ya === redam) return; redam = ya;
  if (ctx) busM.gain.setTargetAtTime(volM(), ctx.currentTime, 0.2);
}
