// Rekam layar aplikasi frame demi frame (jam virtual Playwright, 30 fps), lalu jadikan mp4.
const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean), BASE = 'http://localhost:8765';
const FPS = 30, DT = 1000 / FPS;
const NAMA = ['raka','sinta_','dimas.p','nadia.r','kevin','joko','ayu.ln','bagas','citra','fajar_','gilang','hana','intan.s','januar','kirana','lutfi','maya','nanda','oki','putri.a','rizky','salsa','tegar','umi','vino','wulan','yoga','zahra','bima','dewi.k'];
async function buka(b, { uid, nama, look, resmi, dir, hash = '', ui = true, jamSendiri = false }) {
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 2, hasTouch: false });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route('**/kantor/kantor.js*', async r => { let t = await (await r.fetch()).text(); t = t.replace('window.__kantor = { L, saya, lain, bot, pindah, K, kam };', 'window.__kantor = { L, saya, lain, bot, pindah, K, kam, bukaLoker, bukaDaftar, tombol };'); r.fulfill({ body: t, contentType: 'application/javascript' }); });
  await ctx.addInitScript(({ uid, nama, look, NAMA, resmi, dir }) => {
    const t = Date.now(), tamu = {}, anggota = {};
    NAMA.forEach((n, i) => { tamu['t' + i] = { uid: 't' + i, n, tj: ['jodoh', 'teman', 'curhat'][i % 3], t: t - 1e6 + i }; anggota['t' + i] = { n, tj: tamu['t' + i].tj, sejak: t }; });
    const db = { peran: dir ? { [uid]: 'direktur' } : {}, anggota: resmi ? { ...anggota, [uid]: { n: nama, tj: 'jodoh', sejak: t } } : anggota, tamu, diamond: { [uid]: 330 }, milik: { [uid]: { o7: true, o8: true, o9: true, a12: true, a13: true, a14: true } }, exp: { [uid]: { n: 1600 } },
      papan: { a1: { uid: 'x', n: 'Direktur', m: 'NONTON BARENG JUMAT 20.00', t } } };
    localStorage.setItem('ptmcs_uid_utama', JSON.stringify(uid)); localStorage.setItem('ptmcs_db', JSON.stringify(db));
    if (resmi) localStorage.setItem('ptmcs_profil', JSON.stringify({ n: nama, tj: 'jodoh', s: 'Jomblo', look }));
  }, { uid, nama, look, NAMA, resmi, dir });
  if (jamSendiri) await ctx.addInitScript(() => {
    let vt = performance.now(); const q = [];
    performance.now = () => vt;
    window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__langkah = ms => { vt += ms; const c = q.splice(0); for (const f of c) { try { f(vt); } catch (e) { console.error(e); } } };
  });
  else await ctx.clock.install({ time: new Date('2026-11-25T11:00:00+07:00') });
  ctx.__jam = jamSendiri;
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(BASE + '/kantor/index.html' + hash);
  const ff = async ms => ctx.__jam ? (await p.evaluate(m => window.__langkah && window.__langkah(m), ms), await p.waitForTimeout(5)) : ctx.clock.fastForward(ms);
  for (let i = 0; i < 80; i++) { await ff(200); if (i > 10 && await p.evaluate(() => !!(window.__kantor && window.__kantor.L))) break; }
  for (let i = 0; i < 20; i++) await ff(100);
  if (!ui) await p.addStyleTag({ content: '#top,#tempat,#arah,#log,#chatF,#aksi,#undangan,#umum,#joy,#bantuJoy,#toast,#tirai,#loading{display:none!important}' });
  await p.addStyleTag({ content: '#loading{display:none!important} .ajak{display:none!important}' });
  return { ctx, p };
}
async function rekam(s, nama, detik, aksi = async () => {}) {
  const dir = `${OUT}/f_${nama}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(detik * FPS), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await aksi(i, i / FPS);
    if (s.ctx.__jam) await s.p.evaluate(m => window.__langkah(m), DT); else await s.ctx.clock.fastForward(DT);
    await s.p.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libx264 -crf 15 -preset fast -pix_fmt yuv420p ${OUT}/${nama}.mp4`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok', nama, n, 'frame', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
async function maju(s, ms) { for (let t = 0; t < ms; t += 50) { if (s.ctx.__jam) { await s.p.evaluate(m => window.__langkah(m), 50); await s.p.waitForTimeout(5); } else await s.ctx.clock.fastForward(50); } }
const ingin = n => !HANYA.length || HANYA.includes(n);
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const lerp = (a, b, x) => a + (b - a) * x;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  // ===== Direktur: sinematik tanpa UI
  if (['drone', 'ruang', 'direktur'].some(ingin)) {
    const s = await buka(b, { uid: 'udir', nama: 'Direktur', look: { o: 6, k: 1, b: 0, c: 0, r: 0, w: 0, a: 10 }, resmi: true, dir: true, ui: false });
    await s.p.addStyleTag({ content: '#kartu{display:none!important}' }); await maju(s, 8000);
    const cam = (x, z, pitch, jarak, y, yaw) => s.p.evaluate(([x, z, pitch, jarak, y, yaw]) => { const K = __kantor; K.pindah(x, z, Math.PI); K.saya.g.visible = false; Object.assign(K.kam, { pitch, jarak, y, ...(yaw != null ? { yaw } : {}) }); }, [x, z, pitch, jarak, y, yaw]);
    if (ingin('drone')) await rekam(s, 'drone', 4.5, async (i, t) => { const k = ease(Math.min(1, t / 4.5)); await cam(0, lerp(44, 26, k), lerp(0.8, 0.42, k), lerp(36, 18, k), lerp(4, 2, k), Math.PI); });
    if (ingin('ruang')) {
      const R = [['kafe', 19.5, 4.5, 0.5, 9], ['meja', 0, 7, 0.55, 12], ['taman', 18.5, -8.5, 0.55, 8], ['lounge', 0, -56, 0.45, 9]];
      for (const [n, x, z, pi, j] of R) await rekam(s, 'r_' + n, 1.5, async (i, t) => { await cam(x, z, pi, lerp(j + 2, j - 1, t / 1.5), 1, Math.PI + lerp(-0.25, 0.25, t / 1.5)); });
    }
    if (ingin('direktur')) await rekam(s, 'direktur', 3.5, async (i, t) => { await s.p.evaluate(([t]) => { const K = __kantor; K.pindah(19.8, 16, -Math.PI / 2); K.saya.g.visible = true; Object.assign(K.kam, { yaw: Math.PI / 2 + Math.sin(t * 0.6) * 0.35, pitch: 0.12, jarak: 4.4 - t * 0.25, y: 1.3 }); }, [t]); });
    await s.ctx.close();
  }
  // ===== Tamu Rina: rekaman layar asli dengan UI
  if (['jalan', 'chat', 'loker', 'game'].some(ingin)) {
    const s = await buka(b, { uid: 'urina', nama: 'Rina', look: { o: 8, k: 2, b: 1, c: 3, r: 2, w: 1, a: 13 }, resmi: true, jamSendiri: HANYA.length === 1 && HANYA[0] === 'game' });
    await maju(s, 1500);
    await s.p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; }); await maju(s, 6000);
    await s.p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; document.querySelectorAll('#toast').forEach(x => x.hidden = true); });
    if (ingin('jalan')) {
      await s.p.evaluate(() => { const K = __kantor; K.pindah(10, 4, Math.PI / 2); K.kam.yaw = Math.PI / 2 + 0.3; });
      await rekam(s, 'jalan', 3.5, async (i, t) => { await s.p.evaluate(([t]) => { const K = __kantor; K.tombol.KeyW = t < 3.1; K.tombol.KeyD = t > 0.8 && t < 1.4; }, [t]); });
      await s.p.evaluate(() => { __kantor.tombol.KeyW = false; __kantor.tombol.KeyD = false; });
    }
    if (ingin('chat')) {
      await s.p.evaluate(() => { const K = __kantor; K.pindah(19.2, 3.5, Math.PI); Object.assign(K.kam, { yaw: 0.25, pitch: 0.32, jarak: 7 }); });
      const pesan = 'ada yg suka drakor juga? 👀';
      await rekam(s, 'chat', 4, async (i, t) => {
        if (i === 6) await s.p.focus('#chatI');
        const nk = Math.min(pesan.length, Math.max(0, Math.floor((t - 0.3) * 14)));
        if (i > 6 && t < 2.6) await s.p.evaluate(([v]) => { document.getElementById('chatI').value = v; }, [[...pesan].slice(0, nk).join('')]);
        if (i === Math.round(2.6 * FPS)) { await s.p.evaluate(([v]) => { document.getElementById('chatI').value = v; }, [pesan]); await s.p.press('#chatI', 'Enter'); await s.p.evaluate(() => document.activeElement.blur()); }
      });
    }
    if (ingin('loker')) {
      await s.p.evaluate(() => { const K = __kantor; K.pindah(-19, 7.5, -Math.PI / 2); K.bukaLoker(); });
      await maju(s, 400);
      const klik = async sel => { const e = await s.p.$(sel); if (e) await e.click({ force: true }); };
      await rekam(s, 'loker', 4.5, async (i, t) => {
        if (i === 18) await klik('#lP [data-k="o"][data-i="7"]');
        if (i === 42) await klik('#lP [data-k="o"][data-i="9"]');
        if (i === 66) await klik('#lP [data-k="o"][data-i="8"]');
        if (i === 90) { await klik('[data-tab="a"]'); }
        if (i === 104) await klik('#lP [data-k="a"][data-i="13"]');
      });
      await s.p.evaluate(() => { document.getElementById('kartu').hidden = true; });
    }
    if (ingin('game')) {
      await s.p.evaluate(() => import('/kantor/game.js').then(G => G.bukaArcade())); await maju(s, 300);
      await s.p.click('#gM', { force: true }); await maju(s, 1500);
      const box = await s.p.evaluate(() => { const r = document.getElementById('gC').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
      await rekam(s, 'game', 4, async (i, t) => { await s.p.evaluate(([x, y]) => document.getElementById('gC').dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true })), [box.x + box.w * (0.5 + 0.38 * Math.sin(t * 2.6)), box.y + box.h * 0.85]); });
    }
    await s.ctx.close();
  }
  // ===== Pengunjung baru: isi formulir
  if (ingin('formulir')) {
    const s = await buka(b, { uid: 'ubaru', hash: '#daftar' });
    await maju(s, 1500);
    const ketik = async (sel, teks, i0, i, cps = 16) => { if (i >= i0) { const n = Math.min(teks.length, Math.floor((i - i0) / FPS * cps)); await s.p.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; }, [sel, [...teks].slice(0, n).join('')]); } };
    await rekam(s, 'formulir', 9.5, async (i, t) => {
      if (i === 0) await s.p.evaluate(() => document.querySelector('#kartu').scrollTop = 0);
      if (i === 5) await s.p.click('input[name=tj][value=jodoh]', { force: true });
      if (i >= 14 && i < 40) await ketik('#dN', 'Rina', 14, i);
      if (i >= 40 && i < 60) await ketik('#dU', '23', 40, i);
      if (i >= 60 && i < 90) await ketik('#dK', 'Bandung', 60, i);
      if (i >= 90 && i < 120) await s.p.evaluate(([k]) => { const e = document.querySelector('.syaratFollow'); const box = document.querySelector('#kartu .isi') || document.querySelector('#kartu'); e.scrollIntoView({ block: 'center' }); }, [i]);
      if (i >= 120 && i < 160) await ketik('#dI', '@rina.jodoh', 120, i);
      if (i === 165) await s.p.evaluate(() => document.querySelector('#dB').scrollIntoView({ block: 'center' }));
      if (i >= 168 && i < 200) await ketik('#dB', 'suka kopi & drakor', 168, i, 22);
      if (i >= 200 && i < 216) await ketik('#dA2', 'pengen cari teman ngobrol', 200, i, 30);
      if (i === 216) await s.p.evaluate(() => document.querySelector('#dF').scrollIntoView({ block: 'center' }));
      if (i === 220) await s.p.click('#dF', { force: true });
      if (i === 226) await s.p.click('#dA', { force: true });
      if (i === 236) await s.p.click('#fD button[type=submit]', { force: true });
    });
    await s.ctx.close();
  }
  await b.close();
})();
