// =====================================================================
//  GAME CENTER: kumpulan game supaya tamu betah.
//   🃏 Kartu Jodoh   : memori, cari 8 pasang kartu (papan juara mingguan)
//   🐍 Ular Cinta    : ular makan hati, makin panjang makin cepat (papan juara mingguan)
//   🔤 Kata Cinta    : tebak kata 5 huruf, 1 teka-teki yang sama untuk semua orang tiap hari
//   🎡 Roda Hoki     : putar sekali sehari, hadiah EXP
//  Skor tersimpan di lomba/<jenis>/<periode>/<uid> (dijaga aturan Firebase: hanya bisa naik).
//  EXP hanya diberikan untuk 3 permainan pertama tiap game per hari.
// =====================================================================
import { LS, bersih, esc, fmt, hariIni } from '../js/common.js?v=202611280851';
import { TS } from '../js/db.js?v=202611280851';
import { K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611280851';
import * as Prog from './progres.js?v=202611280851';
import * as Musik from './musik.js?v=202611280851';
import { mingguIni } from './aktivitas.js?v=202611280851';

const acak = a => a[Math.floor(Math.random() * a.length)];
const kocok = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk main.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const namaSaya = () => bersih((K.prof && K.prof.n) || 'Tamu', 20);
// EXP: 3 permainan pertama per game per hari
function beriExp(game, n, label) {
  const k = `main_${game}_${hariIni()}`, kali = (LS.get(k, 0) || 0) + 1; LS.set(k, kali);
  if (kali <= 3 && n > 0) { Prog.hadiah(n, label); return n; }
  return 0;
}
async function simpanSkor(jenis, periode, skor) {
  const s = Math.max(0, Math.min(200, Math.round(skor)));
  const lama = await K.L.db.get(`lomba/${jenis}/${periode}/${K.L.uid}`).catch(() => null);
  if (lama && lama.s >= s) return false;
  await K.L.db.set(`lomba/${jenis}/${periode}/${K.L.uid}`, { s, n: namaSaya(), t: TS }).catch(() => {});
  return true;
}
async function papanJuara(jenis, periode, n = 5) {
  return Object.values((await K.L.db.get(`lomba/${jenis}/${periode}`).catch(() => null)) || {}).filter(v => v && v.n).sort((a, b) => b.s - a.s).slice(0, n);
}
const htmlJuara = top => top.length ? `<ol class="peringkat">${top.map(v => `<li><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada skor. Jadilah juara pertama!</p>';

// ---------------------------------------------------------------- GAME CENTER
export const DAFTAR = [
  { id: 'tangkap', ikon: '💗', nama: 'Tangkap Hati', ket: 'Tangkap hati yang jatuh, hindari 💔', buka: () => K.Game && K.Game.bukaArcade() },
  { id: 'memori', ikon: '🃏', nama: 'Kartu Jodoh', ket: 'Cari 8 pasang kartu secepatnya', buka: () => bukaMemori() },
  { id: 'ular', ikon: '🐍', nama: 'Ular Cinta', ket: 'Makan hati, jangan nabrak!', buka: () => bukaUlar() },
  { id: 'kata', ikon: '🔤', nama: 'Kata Cinta Harian', ket: 'Tebak 1 kata baru tiap hari', buka: () => bukaKata() },
  { id: 'roda', ikon: '🎡', nama: 'Roda Hoki', ket: 'Putar sekali sehari, hadiah EXP', buka: () => bukaRoda() },
  { id: 'kuis', ikon: '🧠', nama: 'Kuis Cinta & Tebak Lagu', ket: 'Juara mingguan', buka: () => K.Aktivitas && K.Aktivitas.bukaKuis() },
  { id: 'kerupuk', ikon: '🍘', nama: 'Lomba Kerupuk', ket: 'Ketuk secepatnya!', buka: () => K.Aktivitas && K.Aktivitas.bukaKerupuk() },
];
export function bukaCenter() {
  const roda = LS.get('roda_' + hariIni(), 0), kata = (LS.get('kata_' + hariIni(), null) || {}).selesai;
  bukaKartu(`<h2>🎮 Game Center</h2><p class="kecil">⚔️ Tantang tamu lain duel XOX / Empat Hati / Suit, atau main ⚡ Kuis Kilat rame-rame di meja, kafe & grup. Game sendiri juga ada: kumpulkan EXP (3 permainan pertama tiap game per hari), dan rebut papan juara!</p>
    <div class="kuasaGrid gameGrid">${DAFTAR.map(g => `<button type="button" data-g="${g.id}"><span class="gIkon">${g.ikon}</span>${esc(g.nama)}<small>${esc(g.id === 'roda' ? (roda ? '✅ Sudah diputar hari ini' : '🎁 Belum diputar hari ini!') : g.id === 'kata' ? (kata ? '✅ Teka-teki hari ini selesai' : '🆕 Teka-teki hari ini menunggu') : g.ket)}</small></button>`).join('')}</div>
    <div class="baris"><button class="btn" type="button" id="gcB">⚔️ Main Bareng / Tantang</button><button class="btn putih" type="button" id="gcJ">🏆 Papan juara</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const g = DAFTAR.find(x => x.id === b.dataset.g); tutupKartu(); setTimeout(g.buka, 60); });
      el.querySelector('#gcJ').onclick = bukaJuara;
      el.querySelector('#gcB').onclick = () => K.Duel && K.Duel.bukaMainBareng();
    },
  });
}
async function bukaJuara() {
  const mg = mingguIni(), hr = hariIni();
  const [m, u, k] = await Promise.all([papanJuara('memori', mg), papanJuara('ular', mg), papanJuara('kata', hr)]);
  bukaKartu(`<h2>🏆 Papan Juara</h2>
    <h3>🃏 Kartu Jodoh <small class="kecil">minggu ini</small></h3>${htmlJuara(m)}
    <h3>🐍 Ular Cinta <small class="kecil">minggu ini</small></h3>${htmlJuara(u)}
    <h3>🔤 Kata Cinta <small class="kecil">hari ini</small></h3>${htmlJuara(k)}
    <div class="baris"><button class="btn" type="button" id="gcK">← Game Center</button></div>`, { pasang(el) { el.querySelector('#gcK').onclick = bukaCenter; } });
}

// ---------------------------------------------------------------- 🃏 KARTU JODOH (memori)
const KARTU = ['💘', '🌹', '💍', '🍫', '🧸', '💌', '🎀', '☕'];
export function bukaMemori() {
  if (!siap()) return;
  const isi = kocok([...KARTU, ...KARTU]);
  let buka = [], cocok = new Set(), langkah = 0, mulai = 0, tm = null, kunci = false;
  Musik.paksakan('santai');
  bukaKartu(`<h2>🃏 Kartu Jodoh</h2><p class="kecil">Buka 2 kartu, cari pasangannya. Makin cepat & makin sedikit langkah, skor makin tinggi!</p>
    <div class="memoriInfo"><span id="mmW">⏱ 0 dtk</span><span id="mmL">👆 0 langkah</span><span id="mmP">💞 0/8</span></div>
    <div class="memori" id="mmG">${isi.map((e, i) => `<button type="button" class="mKartu" data-i="${i}" aria-label="Kartu ${i + 1}"><span class="depan">${e}</span><span class="belakang">💗</span></button>`).join('')}</div>`, {
    tutup() { clearInterval(tm); Musik.paksakan(null); },
    pasang(el) {
      const waktu = () => (mulai ? (Date.now() - mulai) / 1000 : 0);
      tm = setInterval(() => { const w = el.querySelector('#mmW'); if (w) w.textContent = `⏱ ${Math.floor(waktu())} dtk`; }, 250);
      el.querySelectorAll('.mKartu').forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        if (kunci || cocok.has(i) || buka.includes(i)) return;
        if (!mulai) mulai = Date.now();
        b.classList.add('buka'); buka.push(i); Musik.sfx('klik');
        if (buka.length < 2) return;
        langkah++; el.querySelector('#mmL').textContent = `👆 ${langkah} langkah`;
        const [a, c] = buka;
        if (isi[a] === isi[c]) {
          cocok.add(a); cocok.add(c); buka = []; Musik.sfx('tangkap', { besar: true, jeda: 0 });
          el.querySelectorAll(`[data-i="${a}"],[data-i="${c}"]`).forEach(x => x.classList.add('cocok'));
          el.querySelector('#mmP').textContent = `💞 ${cocok.size / 2}/8`;
          if (cocok.size === isi.length) { clearInterval(tm); setTimeout(() => selesaiMemori(waktu(), langkah), 500); }
        } else {
          kunci = true;
          setTimeout(() => { el.querySelectorAll(`[data-i="${a}"],[data-i="${c}"]`).forEach(x => x.classList.remove('buka')); buka = []; kunci = false; }, 750);
        }
      });
    },
  });
}
async function selesaiMemori(detik, langkah) {
  Musik.paksakan(null); Musik.sfx('selesai');
  const skor = Math.max(10, Math.min(200, Math.round(220 - detik * 2 - Math.max(0, langkah - 8) * 4)));
  const exp = beriExp('memori', 10, '🃏 Kartu Jodoh'), mg = mingguIni();
  const rekor = await simpanSkor('memori', mg, skor), top = await papanJuara('memori', mg);
  bukaKartu(`<div class="match"><div class="hatiBesar">🃏</div><h2>Skor ${fmt(skor)}</h2>
    <p>${Math.round(detik)} detik · ${langkah} langkah${exp ? ` · +${exp} EXP` : ''}${rekor ? '<br>🏆 Rekor barumu minggu ini!' : ''}</p>
    <h3>Juara minggu ini</h3>${htmlJuara(top)}
    <div class="baris"><button class="btn" type="button" id="gU">Main lagi</button><button class="btn putih" type="button" id="gC">🎮 Game lain</button></div></div>`, {
    pasang(el) { el.querySelector('#gU').onclick = bukaMemori; el.querySelector('#gC').onclick = bukaCenter; },
  });
}

// ---------------------------------------------------------------- 🐍 ULAR CINTA
let ularMain = false;
export function bukaUlar() {
  if (!siap()) return;
  bukaKartu(`<h2>🐍 Ular Cinta</h2><p>Arahkan ular memakan <b>💗 (+1)</b> dan <b>💖 (+3)</b>. Jangan menabrak dinding atau badan sendiri. Makin panjang, makin cepat!</p>
    <p class="kecil">Kontrol: geser layar, tombol panah di bawah, atau ← ↑ → ↓ / WASD.</p>
    <div class="baris"><button class="btn" type="button" id="uM">Mulai main</button></div>`, { pasang(el) { el.querySelector('#uM').onclick = () => { tutupKartu(); mainUlar(); }; } });
}
function mainUlar() {
  if (ularMain) return; ularMain = true;
  Musik.paksakan('santai');
  const lapis = document.createElement('div'); lapis.id = 'game';
  lapis.innerHTML = `<div class="gAtas"><span id="uS">💗 0</span><span id="uP">🐍 3</span><button type="button" id="uX" aria-label="Berhenti">✕</button></div><canvas id="uC"></canvas>
    <div class="dpad"><button type="button" data-d="0,-1" aria-label="Atas">▲</button><div><button type="button" data-d="-1,0" aria-label="Kiri">◀</button><button type="button" data-d="1,0" aria-label="Kanan">▶</button></div><button type="button" data-d="0,1" aria-label="Bawah">▼</button></div>`;
  document.body.appendChild(lapis);
  const cv = lapis.querySelector('#uC'), x = cv.getContext('2d'), N = 18;
  let W = 0, H = 0, sel = 0, ox = 0, oy = 0;
  const ukur = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); sel = Math.floor(Math.min(W, H) / N); ox = (W - sel * N) / 2; oy = (H - sel * N) / 2; };
  ukur(); addEventListener('resize', ukur);
  let ular = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }], arah = { x: 1, y: 0 }, antre = [], skor = 0, makan = null, selang = 170, t0 = 0, akhir = false;
  const taruh = () => { let p; do p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N), b: Math.random() < 0.15 }; while (ular.some(s => s.x === p.x && s.y === p.y)); makan = p; };
  taruh();
  const belok = (dx, dy) => { const akhirA = antre.length ? antre[antre.length - 1] : arah; if (akhirA.x === -dx && akhirA.y === -dy) return; if (akhirA.x === dx && akhirA.y === dy) return; if (antre.length < 3) antre.push({ x: dx, y: dy }); };
  const kd = e => { const m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code]; if (m) { e.preventDefault(); e.stopPropagation(); belok(...m); } if (e.key === 'Escape') selesai(true); };
  addEventListener('keydown', kd, true);
  let sx = 0, sy = 0;
  cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  cv.addEventListener('pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; if (Math.abs(dx) > Math.abs(dy)) belok(Math.sign(dx), 0); else belok(0, Math.sign(dy)); });
  lapis.querySelectorAll('[data-d]').forEach(b => b.onpointerdown = e => { e.preventDefault(); belok(...b.dataset.d.split(',').map(Number)); });
  lapis.querySelector('#uX').onclick = () => selesai(true);
  function gambar() {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1420'); g.addColorStop(1, '#4a1f36'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { x.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.07)'; x.fillRect(ox + i * sel, oy + j * sel, sel, sel); }
    x.strokeStyle = '#ff4f7b'; x.lineWidth = 3; x.strokeRect(ox, oy, sel * N, sel * N);
    x.font = `${sel * 0.85}px system-ui, "Apple Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const mx = ox + makan.x * sel + sel / 2, my = oy + makan.y * sel + sel / 2, den = 1 + Math.sin(performance.now() / 180) * 0.12;
    x.fillStyle = makan.b ? 'rgba(255,210,63,.55)' : 'rgba(255,79,123,.55)'; x.beginPath(); x.arc(mx, my, sel * 0.5 * den, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.fillText(makan.b ? '💖' : '💗', mx, my + 1);
    ular.forEach((s, i) => { x.fillStyle = i === 0 ? '#ffd23f' : `hsl(${340 - i * 3},85%,${62 - Math.min(20, i)}%)`; x.beginPath(); x.roundRect(ox + s.x * sel + 1, oy + s.y * sel + 1, sel - 2, sel - 2, sel * 0.3); x.fill(); });
    const k = ular[0]; x.fillStyle = '#2a1420'; x.fillRect(ox + k.x * sel + sel * 0.3, oy + k.y * sel + sel * 0.3, sel * 0.14, sel * 0.14); x.fillRect(ox + k.x * sel + sel * 0.58, oy + k.y * sel + sel * 0.3, sel * 0.14, sel * 0.14);
  }
  function langkah(t) {
    if (akhir) return;
    if (!t0) t0 = t;
    if (t - t0 >= selang) {
      t0 = t;
      if (antre.length) arah = antre.shift();
      const k = { x: ular[0].x + arah.x, y: ular[0].y + arah.y };
      if (k.x < 0 || k.y < 0 || k.x >= N || k.y >= N || ular.some(s => s.x === k.x && s.y === k.y)) { Musik.sfx('rusak'); if (navigator.vibrate) navigator.vibrate(120); return selesai(false); }
      ular.unshift(k);
      if (k.x === makan.x && k.y === makan.y) { const n = makan.b ? 3 : 1; skor += n; for (let i = 1; i < n; i++) ular.push({ ...ular[ular.length - 1] }); Musik.sfx('tangkap', { besar: makan.b, jeda: 0 }); selang = Math.max(70, 170 - skor * 2.5); taruh(); }
      else ular.pop();
      lapis.querySelector('#uS').textContent = '💗 ' + skor; lapis.querySelector('#uP').textContent = '🐍 ' + ular.length;
      gambar();
    }
    requestAnimationFrame(langkah);
  }
  gambar(); requestAnimationFrame(langkah);
  function selesai(batal) {
    if (akhir) return; akhir = true; ularMain = false;
    removeEventListener('keydown', kd, true); removeEventListener('resize', ukur); lapis.remove(); Musik.paksakan(null);
    if (batal) { toast('Permainan dihentikan.'); return; }
    hasilUlar(skor);
  }
}
async function hasilUlar(skor) {
  Musik.sfx('selesai');
  const exp = beriExp('ular', Math.min(15, Math.ceil(skor / 2)), '🐍 Ular Cinta'), mg = mingguIni();
  const rekor = await simpanSkor('ular', mg, skor), top = await papanJuara('ular', mg);
  bukaKartu(`<div class="match"><div class="hatiBesar">🐍</div><h2>Skor ${fmt(skor)}</h2><p>${exp ? `+${exp} EXP` : ''}${rekor ? '<br>🏆 Rekor barumu minggu ini!' : ''}</p>
    <h3>Juara minggu ini</h3>${htmlJuara(top)}
    <div class="baris"><button class="btn" type="button" id="gU">Main lagi</button><button class="btn putih" type="button" id="gC">🎮 Game lain</button></div></div>`, {
    pasang(el) { el.querySelector('#gU').onclick = () => { tutupKartu(); mainUlar(); }; el.querySelector('#gC').onclick = bukaCenter; },
  });
}

// ---------------------------------------------------------------- 🔤 KATA CINTA HARIAN (tebak kata 5 huruf)
const KATA = ['CINTA', 'RINDU', 'KASIH', 'MANIS', 'SETIA', 'PELUK', 'JODOH', 'BUNGA', 'MAWAR', 'CANDA', 'SENJA', 'PESAN', 'KENAL', 'TEMAN', 'DEKAT', 'MALAM', 'BULAN', 'INDAH', 'GEMAS', 'RAMAH',
  'CERIA', 'MESRA', 'PUISI', 'DANSA', 'JANJI', 'TULUS', 'SABAR', 'RUMAH', 'TEDUH', 'HUJAN', 'LANGIT', 'TAMAN', 'MUSIK', 'KAGUM', 'MANJA', 'RESTU', 'NIKAH', 'CERAH', 'WANGI', 'BAPER',
  'BUCIN', 'KOPIS', 'SURAT', 'LAGUM', 'BINTANG', 'DOAKU', 'SAHUT', 'SAPAAN', 'IKHLAS', 'MIMPI', 'HARAP', 'PAGIH', 'SENYUM', 'MAKAN', 'JALAN', 'PANTAI', 'BAHAGIA', 'TAWAR', 'LUCU', 'RAYU'].filter(k => /^[A-Z]{5}$/.test(k) && !['KOPIS', 'LAGUM', 'PAGIH'].includes(k));
const kataHariIni = () => { const h = hariIni(), n = String(h).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7); return KATA[n % KATA.length]; };
const nilai = (tebak, jawab) => {
  const hasil = Array(5).fill('x'), sisa = {};
  for (let i = 0; i < 5; i++) { if (tebak[i] === jawab[i]) hasil[i] = 'h'; else sisa[jawab[i]] = (sisa[jawab[i]] || 0) + 1; }
  for (let i = 0; i < 5; i++) if (hasil[i] !== 'h' && sisa[tebak[i]]) { hasil[i] = 'k'; sisa[tebak[i]]--; }
  return hasil;
};
export function bukaKata() {
  if (!siap()) return;
  const h = hariIni(), kunci = 'kata_' + h, jawab = kataHariIni();
  const st = LS.get(kunci, null) || { tebak: [], selesai: false, menang: false };
  let ketik = '';
  const warnaHuruf = () => { const w = {}; for (const t of st.tebak) nilai(t, jawab).forEach((c, i) => { const hu = t[i]; if (c === 'h' || (c === 'k' && w[hu] !== 'h') || (c === 'x' && !w[hu])) w[hu] = c; }); return w; };
  const gambar = el => {
    const baris = [...st.tebak.map(t => [t, nilai(t, jawab)]), ...(st.selesai ? [] : [[ketik.padEnd(5, ' '), null]])];
    while (baris.length < 6) baris.push(['     ', null]);
    el.querySelector('#kaG').innerHTML = baris.slice(0, 6).map(([t, n]) => `<div class="kaBaris">${[...t].map((c, i) => `<span class="${n ? 'k' + n[i].toUpperCase() : c.trim() ? 'isi' : ''}">${esc(c.trim())}</span>`).join('')}</div>`).join('');
    const w = warnaHuruf();
    el.querySelector('#kaK').innerHTML = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'].map(r => `<div>${[...r].map(c => `<button type="button" data-c="${c}" class="${w[c] ? 'k' + w[c].toUpperCase() : ''} ${c === '↵' || c === '⌫' ? 'lebar' : ''}">${c === '↵' ? 'Tebak' : c}</button>`).join('')}</div>`).join('');
    el.querySelectorAll('#kaK [data-c]').forEach(b => b.onclick = () => tekan(b.dataset.c, el));
    el.querySelector('#kaH').innerHTML = st.selesai ? `<p><b>${st.menang ? `🎉 Benar! Kata hari ini: ${jawab}` : `😢 Kata hari ini: ${jawab}`}</b></p>
      <div class="baris"><button class="btn" type="button" id="kaB">📋 Salin hasil</button><button class="btn putih" type="button" id="kaJ">🏆 Juara hari ini</button></div><p class="kecil">Kata baru besok pukul 00.00 WIB.</p>` : '<p class="kecil">🟩 huruf & posisi benar · 🟨 huruf ada tapi posisi salah · ⬛ huruf tidak ada</p>';
    const b = el.querySelector('#kaB'); if (b) b.onclick = () => { const teks = `🔤 Kata Cinta ${h} ${st.menang ? st.tebak.length : 'X'}/6\n` + st.tebak.map(t => nilai(t, jawab).map(c => ({ h: '🟩', k: '🟨', x: '⬛' }[c])).join('')).join('\n') + '\njodohonline.company'; navigator.clipboard && navigator.clipboard.writeText(teks).then(() => toast('✅ Hasil tersalin, bagikan ke teman!'), () => toast(teks, 6000)); };
    const j = el.querySelector('#kaJ'); if (j) j.onclick = async () => { const top = await papanJuara('kata', h, 10); bukaKartu(`<h2>🏆 Kata Cinta · Juara hari ini</h2>${htmlJuara(top)}<p class="kecil">Skor: menang di tebakan ke-1 = 120, ke-6 = 20.</p><div class="baris"><button class="btn" type="button" id="kaK2">← Kembali</button></div>`, { pasang(e) { e.querySelector('#kaK2').onclick = bukaKata; } }); };
  };
  const tekan = async (c, el) => {
    if (st.selesai) return;
    if (c === '⌫') ketik = ketik.slice(0, -1);
    else if (c === '↵') {
      if (ketik.length < 5) { toast('Isi 5 huruf dulu.'); return; }
      st.tebak.push(ketik); ketik = '';
      if (st.tebak[st.tebak.length - 1] === jawab) { st.selesai = st.menang = true; Musik.sfx('level'); }
      else if (st.tebak.length >= 6) { st.selesai = true; Musik.sfx('rusak'); } else Musik.sfx('klik');
      LS.set(kunci, st);
      if (st.selesai) {
        const seri = st.menang ? (LS.get('kataSeri', 0) || 0) + 1 : 0; LS.set('kataSeri', seri);
        if (st.menang) { const exp = beriExp('kata', 10, '🔤 Kata Cinta'); await simpanSkor('kata', h, (7 - st.tebak.length) * 20); toast(`🎉 Benar!${exp ? ` +${exp} EXP` : ''} Seri menang: ${seri} hari 🔥`, 4000); }
      }
    } else if (ketik.length < 5 && /^[A-Z]$/.test(c)) ketik += c;
    gambar(el);
  };
  let kartuKata = null;
  bukaKartu(`<h2>🔤 Kata Cinta Harian</h2><p class="kecil">Tebak kata 5 huruf dalam 6 kesempatan. Semua tamu dapat kata yang sama hari ini. Seri menangmu: <b>${fmt(LS.get('kataSeri', 0) || 0)} hari 🔥</b></p>
    <div class="kataGrid" id="kaG"></div><div id="kaH"></div><div class="kataKeyboard" id="kaK"></div>`, {
    tutup() { removeEventListener('keydown', kd, true); },
    pasang(el) { gambar(el); kartuKata = el; addEventListener('keydown', kd, true); },
  });
  function kd(e) { if (!kartuKata || !document.body.contains(kartuKata)) return; const k = e.key.toUpperCase(); if (k === 'ENTER') { e.preventDefault(); tekan('↵', kartuKata); } else if (k === 'BACKSPACE') { e.preventDefault(); tekan('⌫', kartuKata); } else if (/^[A-Z]$/.test(k)) { e.preventDefault(); tekan(k, kartuKata); } }
}

// ---------------------------------------------------------------- 🎡 RODA HOKI (sekali sehari)
const HADIAH = [{ n: 5, w: '#ff8fab' }, { n: 10, w: '#ffd23f' }, { n: 15, w: '#8fd3ff' }, { n: 20, w: '#b9f3c9' }, { n: 10, w: '#d7b8ff' }, { n: 30, w: '#ff4f7b' }, { n: 5, w: '#ffe08a' }, { n: 50, w: '#d4a017' }];
const PELUANG = [22, 20, 14, 10, 18, 8, 6, 2]; // persen, sesuai urutan HADIAH
export function bukaRoda() {
  if (!siap()) return;
  const kunci = 'roda_' + hariIni(), sudah = LS.get(kunci, 0);
  bukaKartu(`<h2>🎡 Roda Hoki</h2><p class="kecil">Putar sekali tiap hari, gratis. Hadiahnya EXP, ada peluang dapat <b>50 EXP</b>!</p>
    <div class="rodaWadah"><canvas id="rdC" width="320" height="320"></canvas><div class="rodaPanah">▼</div></div>
    <div class="baris"><button class="btn" type="button" id="rdP" ${sudah ? 'disabled' : ''}>${sudah ? `✅ Hari ini dapat +${sudah} EXP` : '🎡 Putar!'}</button><button class="btn putih" type="button" id="rdG">🎮 Game lain</button></div>
    ${sudah ? '<p class="kecil">Balik lagi besok ya, roda direset pukul 00.00 WIB.</p>' : ''}`, {
    pasang(el) {
      const cv = el.querySelector('#rdC'), x = cv.getContext('2d'), n = HADIAH.length, R = 150;
      let sudut = 0;
      const lukis = () => {
        x.clearRect(0, 0, 320, 320); x.save(); x.translate(160, 160); x.rotate(sudut);
        HADIAH.forEach((h, i) => { const a0 = i / n * Math.PI * 2 - Math.PI / 2 - Math.PI / n, a1 = a0 + Math.PI * 2 / n; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R, a0, a1); x.closePath(); x.fillStyle = h.w; x.fill(); x.strokeStyle = '#2a1420'; x.lineWidth = 3; x.stroke();
          x.save(); x.rotate((a0 + a1) / 2); x.fillStyle = '#2a1420'; x.font = '900 20px Nunito, sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(`+${h.n}`, R - 14, 0); x.restore(); });
        x.restore(); x.beginPath(); x.arc(160, 160, 26, 0, 7); x.fillStyle = '#2a1420'; x.fill(); x.fillStyle = '#fff'; x.font = '22px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('💗', 160, 161);
      };
      lukis();
      el.querySelector('#rdG').onclick = bukaCenter;
      el.querySelector('#rdP').onclick = () => {
        if (LS.get(kunci, 0)) return;
        let r = Math.random() * 100, pilih = 0; for (let i = 0; i < n; i++) { r -= PELUANG[i]; if (r <= 0) { pilih = i; break; } }
        const hadiah = HADIAH[pilih].n; LS.set(kunci, hadiah); // dicatat dulu supaya tidak bisa diputar ulang
        const b = el.querySelector('#rdP'); b.disabled = true; b.textContent = '🎡 Berputar…';
        const akhir = Math.PI * 2 * 6 - pilih / n * Math.PI * 2, awal = sudut, t0 = performance.now(), lama = 4200;
        let tik = -1;
        const putar = t => {
          const p = Math.min(1, (t - t0) / lama), e = 1 - Math.pow(1 - p, 4); sudut = awal + (akhir - awal) * e; lukis();
          const seg = Math.floor((sudut / (Math.PI * 2 / n))); if (seg !== tik) { tik = seg; Musik.sfx('klik'); }
          if (p < 1) return requestAnimationFrame(putar);
          Prog.hadiah(hadiah, '🎡 Roda Hoki'); Musik.sfx(hadiah >= 30 ? 'level' : 'hadiah'); K.efekLokal && K.efekLokal(hadiah >= 30 ? 'kembangapi' : 'hati', 30);
          b.textContent = `🎉 +${hadiah} EXP!`; toast(`🎡 Roda Hoki: kamu dapat +${hadiah} EXP!`, 4000);
        };
        requestAnimationFrame(putar);
      };
    },
  });
}
