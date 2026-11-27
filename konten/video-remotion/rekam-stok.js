// Rekam ulang STOK klip & foto umum dari situs versi TERBARU (jalankan sebelum tiap video baru).
// Situs terbaru di http://localhost:8765, lalu:  node rekam-stok.js <folder-keluaran> [nama,...]
// Klip: drone, jalan, r_kafe, r_meja, r_taman, r_lounge, direktur, loker
// Foto: karakter, meja, tugas, levelup, toko, beranda (tanpa UI kecuali yang memang kartu aplikasi)
const { chromium } = require('playwright'); const fs = require('fs');
const { sesi, maju, rekam, ev, foto } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean);
const ingin = n => !HANYA.length || HANYA.includes(n);
const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const TANPA_UI = 'body *{visibility:hidden!important} canvas{visibility:visible!important}';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const V = fs.readFileSync('/tmp/claude-0/-home-user-PT-Mencari-cinta-sejati/b6f39f92-0519-5b23-874c-9957b4f02bef/scratchpad/situs/kantor/index.html', 'utf8').match(/kantor\.js\?v=(\d+)/)[1];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const s = await sesi(b, { jam: '2026-11-28T16:30:00+07:00' });
  await ev(s, () => __kantor.L.setelan({ gedung_tamanCinta: 'buka' }));
  await maju(s, 1500);
  const cam = (x, z, pitch, jarak, y, yaw) => ev(s, ([x, z, pitch, jarak, y, yaw]) => { const K = __kantor; K.pindah(x, z, Math.PI); K.saya.g.visible = false; Object.assign(K.kam, { pitch, jarak, y, ...(yaw != null ? { yaw } : {}) }); }, [x, z, pitch, jarak, y, yaw]);

  // ---- sinematik tanpa UI
  const gaya = await s.p.addStyleTag({ content: TANPA_UI });
  if (ingin('drone')) await rekam(s, 'drone', 4.5, async (i, t) => { const k = ease(Math.min(1, t / 4.5)); await cam(0, lerp(46, 28, k), lerp(0.8, 0.42, k), lerp(38, 19, k), lerp(4, 2, k), Math.PI); });
  for (const [n, x, z, pi, j] of [['kafe', 19.5, 4.5, 0.5, 9], ['meja', 0, 7, 0.55, 12], ['taman', 18.5, -8.5, 0.55, 8], ['lounge', 0, -56, 0.45, 9]]) {
    if (ingin('r_' + n)) await rekam(s, 'r_' + n, 1.5, async (i, t) => { await cam(x, z, pi, lerp(j + 2, j - 1, t / 1.5), 1, Math.PI + lerp(-0.25, 0.25, t / 1.5)); });
  }
  if (ingin('meja')) { await cam(0, 1.5, 0.62, 14, 1.6, Math.PI + 0.15); await maju(s, 1500); await foto(s, 'meja'); }
  await gaya.evaluate(e => e.remove());
  await ev(s, () => { __kantor.K.saya.g.visible = true; });

  // ---- dengan UI (rekaman layar asli)
  if (ingin('jalan')) {
    await ev(s, () => { const K = __kantor; K.pindah(10, 4, Math.PI / 2); Object.assign(K.kam, { yaw: Math.PI / 2 + 0.3, pitch: 0.3, jarak: 7 }); });
    await maju(s, 1200);
    await rekam(s, 'jalan', 3.5, async (i, t) => { await ev(s, ([t]) => { const K = __kantor; K.tombol && (K.tombol.KeyW = t < 3.1, K.tombol.KeyD = t > 0.8 && t < 1.4); }, [t]); });
  }
  if (ingin('direktur')) {
    await ev(s, () => { const K = __kantor; K.pindah(19.8, 16, -Math.PI / 2); Object.assign(K.kam, { yaw: Math.PI / 2, pitch: 0.12, jarak: 4.4, y: 1.3 }); });
    await maju(s, 1200);
    await rekam(s, 'direktur', 3.5, async (i, t) => { await ev(s, ([t]) => Object.assign(__kantor.kam, { yaw: Math.PI / 2 + Math.sin(t * 0.6) * 0.35, jarak: 4.4 - t * 0.25 }), [t]); });
  }
  if (ingin('karakter')) { await ev(s, () => { const K = __kantor; K.pindah(0, 12, Math.PI); Object.assign(K.kam, { yaw: 0.2, pitch: 0.18, jarak: 4.2, y: 1.2 }); }); await maju(s, 1200); await foto(s, 'karakter'); }
  if (ingin('loker')) {
    await ev(s, () => { const K = __kantor; K.pindah(-19, 7.5, -Math.PI / 2); K.bukaLoker(); });
    await maju(s, 600);
    await rekam(s, 'loker', 4.5, async (i) => {
      const k = (sel) => ev(s, ([sel]) => { const e = document.querySelector(sel); if (e) e.click(); }, [sel]);
      if (i === 18) await k('#lP [data-k="o"][data-i="7"]');
      if (i === 42) await k('#lP [data-k="o"][data-i="9"]');
      if (i === 66) await k('#lP [data-k="o"][data-i="8"]');
    });
  }
  for (const [nama, tab] of [['tugas', 'tugas'], ['toko', 'toko']]) {
    if (!ingin(nama)) continue;
    await ev(s, ([V, tab]) => import('/kantor/progres.js?v=' + V).then(m => m.bukaHub(tab)), [V, tab]);
    await maju(s, 600); await foto(s, nama); await ev(s, () => { const k = document.getElementById('kartu'); if (k) k.hidden = true; });
  }
  if (ingin('beranda')) {
    const p = await s.ctx.newPage(); await p.goto('http://localhost:8765/index.html');
    for (let i = 0; i < 20; i++) await s.ctx.clock.fastForward(200);
    await p.screenshot({ path: `${OUT}/beranda.png` }); console.log('foto beranda'); await p.close();
  }
  await b.close();
})();
