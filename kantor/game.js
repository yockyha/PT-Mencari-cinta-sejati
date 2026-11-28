// =====================================================================
//  Mini-game "Tangkap Hati": 30 detik menangkap hati yang jatuh.
//  💗 +1 · 💖 +3 · 💔 −2. EXP diberikan untuk 3 permainan pertama tiap hari.
// =====================================================================
import { LS, fmt, bersih, hariIni } from '../js/common.js?v=202611280202';
import { $, K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611280202';
import * as Musik from './musik.js?v=202611280202';
import * as P from './progres.js?v=202611280202';

const DURASI = 30;
let main = false;

export function bukaArcade() {
  if (!K.resmi()) { toast('👀 Daftar jadi tamu dulu untuk main.'); K.bukaDaftar(); return; }
  const kali = LS.get('game_' + hariIni(), 0) || 0;
  bukaKartu(`<h2>🎮 Tangkap Hati</h2>
    <p>Tangkap hati yang jatuh selama ${DURASI} detik. <b>💗 +1</b>, <b>💖 +3</b>, hindari <b>💔 −2</b>.</p>
    <p class="kecil">Geser jari/mouse atau pakai ← → untuk menggerakkan keranjang. ${kali < 3 ? `Dapat EXP di ${3 - kali} permainan lagi hari ini.` : 'EXP hari ini sudah maksimal, tapi skor tetap masuk peringkat.'}</p>
    <div class="baris"><button class="btn" type="button" id="gM">Mulai main</button><button class="btn putih" type="button" id="gP">🏆 Peringkat</button></div>`, {
    pasang(el) { el.querySelector('#gM').onclick = () => { tutupKartu(); mulai(); }; el.querySelector('#gP').onclick = () => P.bukaHub('peringkat'); },
  });
}

function mulai() {
  if (main) return;
  main = true; Musik.paksakan('santai');
  const lapis = document.createElement('div');
  lapis.id = 'game';
  lapis.innerHTML = `<div class="gAtas"><span id="gS">0</span><span id="gT">${DURASI}</span><button type="button" id="gX" aria-label="Berhenti">✕</button></div><canvas id="gC" aria-label="Arena Tangkap Hati"></canvas>`;
  document.body.appendChild(lapis);
  const cv = lapis.querySelector('#gC'), x = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  const ukur = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  ukur(); addEventListener('resize', ukur);

  const bk = { x: W / 2, w: Math.min(120, W * 0.28) };
  let skor = 0, sisa = DURASI, benda = [], spawn = 0, t0 = performance.now(), akhir = false, kiri = false, kanan = false, kilat = [];
  const gerak = e => { const r = cv.getBoundingClientRect(); bk.x = Math.max(bk.w / 2, Math.min(W - bk.w / 2, e.clientX - r.left)); };
  cv.addEventListener('pointermove', gerak); cv.addEventListener('pointerdown', gerak);
  const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'a') kiri = true; if (e.key === 'ArrowRight' || e.key === 'd') kanan = true; if (e.key === 'Escape') selesai(true); };
  const ku = e => { if (e.key === 'ArrowLeft' || e.key === 'a') kiri = false; if (e.key === 'ArrowRight' || e.key === 'd') kanan = false; };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
  lapis.querySelector('#gX').onclick = () => selesai(true);

  let akhirT = performance.now();
  function langkah(t) {
    if (akhir) return;
    const dt = Math.min(0.05, (t - akhirT) / 1000); akhirT = t;
    sisa = Math.max(0, DURASI - (t - t0) / 1000);
    if (kiri) bk.x -= 520 * dt; if (kanan) bk.x += 520 * dt;
    bk.x = Math.max(bk.w / 2, Math.min(W - bk.w / 2, bk.x));
    const cepat = 1 + (1 - sisa / DURASI) * 1.4;
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 0.55 / cepat;
      const r = Math.random();
      benda.push({ x: 20 + Math.random() * (W - 40), y: -30, v: (140 + Math.random() * 90) * cepat, j: r < 0.12 ? '💖' : r < 0.35 ? '💔' : '💗' });
    }
    const yb = H - 46;
    for (const b of benda) {
      b.y += b.v * dt;
      if (!b.kena && b.y > yb - 18 && b.y < yb + 20 && Math.abs(b.x - bk.x) < bk.w / 2 + 10) {
        b.kena = true; const d = b.j === '💖' ? 3 : b.j === '💔' ? -2 : 1;
        skor = Math.max(0, skor + d); kilat.push({ x: b.x, y: yb - 30, t: 0.7, s: (d > 0 ? '+' : '') + d });
        if (d < 0 && navigator.vibrate) navigator.vibrate(60);
        Musik.sfx(d < 0 ? 'rusak' : 'tangkap', { besar: d > 1, jeda: 30 });
      }
    }
    benda = benda.filter(b => !b.kena && b.y < H + 40);
    // gambar
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1420'); g.addColorStop(1, '#5b2440');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.font = '34px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const b of benda) x.fillText(b.j, b.x, b.y);
    x.fillStyle = '#ff4f7b'; x.strokeStyle = '#fff6ef'; x.lineWidth = 3;
    x.beginPath(); x.roundRect(bk.x - bk.w / 2, yb - 14, bk.w, 30, 10); x.fill(); x.stroke();
    x.fillStyle = '#fff6ef'; x.font = '900 15px Nunito, sans-serif'; x.fillText('🧺 ' + (bersih(K.prof?.n, 12) || ''), bk.x, yb + 1);
    for (const k of kilat) { k.t -= dt; k.y -= 40 * dt; x.globalAlpha = Math.max(0, k.t / 0.7); x.fillStyle = k.s.startsWith('-') ? '#ff8a8a' : '#ffd23f'; x.font = '900 22px Nunito, sans-serif'; x.fillText(k.s, k.x, k.y); }
    x.globalAlpha = 1; kilat = kilat.filter(k => k.t > 0);
    lapis.querySelector('#gS').textContent = '💗 ' + skor;
    lapis.querySelector('#gT').textContent = '⏱ ' + Math.ceil(sisa);
    if (sisa <= 0) { selesai(false); return; }
    requestAnimationFrame(langkah);
  }
  requestAnimationFrame(langkah);

  function selesai(batal) {
    if (akhir) return;
    akhir = true; main = false; Musik.paksakan(null); if (!batal) Musik.sfx('selesai');
    removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); removeEventListener('resize', ukur);
    lapis.remove();
    if (batal) { toast('Permainan dihentikan.'); return; }
    hasil(skor);
  }
}

function hasil(skor) {
  const hari = hariIni(), kunci = 'game_' + hari;
  const kali = (LS.get(kunci, 0) || 0) + 1; LS.set(kunci, kali);
  const exp = kali <= 3 ? Math.min(15, Math.ceil(skor / 3)) : 0;
  P.lapor('game');
  if (exp > 0) P.hadiah(exp, '🎮 Tangkap Hati');
  const terbaik = LS.get('skorTerbaik_' + hari, 0) || 0;
  if (skor > terbaik) { LS.set('skorTerbaik_' + hari, skor); K.L.skor(hari, K.prof.n.slice(0, 20), Math.min(300, skor)).catch(() => {}); }
  bukaKartu(`<div class="match"><div class="hatiBesar">💗</div><h2>Skor: ${fmt(skor)}</h2>
    <p>${skor > terbaik ? '🏆 Rekor barumu hari ini!' : `Rekormu hari ini: ${fmt(terbaik)}`}${exp ? `<br>+${exp} EXP` : ''}</p>
    <div class="baris"><button class="btn" type="button" id="gU">Main lagi</button><button class="btn putih" type="button" id="gP">🏆 Peringkat</button></div></div>`, {
    pasang(el) { el.querySelector('#gU').onclick = () => { tutupKartu(); mulai(); }; el.querySelector('#gP').onclick = () => P.bukaHub('peringkat'); },
  });
}
