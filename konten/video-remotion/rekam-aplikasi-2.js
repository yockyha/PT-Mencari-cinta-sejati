// Rekaman untuk video #2 (cara daftar): Dashboard Direktur menerima pendaftar, popup "resmi jadi tamu", foto formulir.
const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean), BASE = 'http://localhost:8765';
const FPS = 30, DT = 1000 / FPS;
const ingin = n => !HANYA.length || HANYA.includes(n);
const NAMA = ['raka', 'sinta_', 'dimas.p', 'nadia.r', 'kevin', 'joko', 'ayu.ln', 'bagas', 'citra', 'fajar_', 'gilang', 'hana'];

function seed({ uid, daftar, profil }) {
  return ({ uid, daftar, profil, NAMA }) => {
    const t = Date.now(), tamu = {}, anggota = {};
    NAMA.forEach((n, i) => { tamu['t' + i] = { uid: 't' + i, n, tj: ['jodoh', 'teman', 'curhat'][i % 3], t: t - 1e6 + i }; anggota['t' + i] = { n, tj: tamu['t' + i].tj, sejak: t }; });
    const db = { anggota, tamu, exp: { [uid]: { n: 1600 } } };
    if (daftar) db.pendaftaran = { [uid]: { uid, n: 'Rina', tj: 'jodoh', umur: 23, g: 'ce', kota: 'Bandung', s: 'Jomblo', ig: 'rina.jodoh', b: 'suka kopi & drakor', alasan: 'pengen cari teman ngobrol', ikut: true, status: 'menunggu', t: t - 120000 } };
    localStorage.setItem('ptmcs_uid_utama', JSON.stringify(uid)); localStorage.setItem('ptmcs_db', JSON.stringify(db));
    if (profil) localStorage.setItem('ptmcs_profil', JSON.stringify({ n: 'Rina', tj: 'jodoh', s: 'Jomblo', look: { o: 8, k: 2, b: 1, c: 3, r: 2, w: 1, a: 13 } }));
  };
}
async function konteks(b, dsf) {
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: dsf });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route('**/kantor/kantor.js', async r => { let t = await (await r.fetch()).text(); t = t.replace('window.__kantor = { L, saya, lain, bot, pindah, K };', 'window.__kantor = { L, saya, lain, bot, pindah, K, kam };'); r.fulfill({ body: t, contentType: 'application/javascript' }); });
  return ctx;
}
async function rekam(ctx, p, nama, detik, aksi = async () => {}) {
  const dir = `${OUT}/f_${nama}`; fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(detik * FPS), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await aksi(i, i / FPS);
    await ctx.clock.fastForward(DT);
    await p.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libx264 -crf 15 -preset fast -pix_fmt yuv420p ${OUT}/${nama}.mp4`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok', nama, n, 'frame', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
const maju = async (ctx, ms) => { for (let t = 0; t < ms; t += 50) await ctx.clock.fastForward(50); };
const sembunyi = '#loading{display:none!important} .ajak{display:none!important}';

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  // ---- foto formulir bagian atas (untuk browser HP di langkah 3)
  if (ingin('fotoform')) {
    const ctx = await konteks(b, 3); await ctx.addInitScript(seed({ uid: 'ubaru' }), { uid: 'ubaru', NAMA });
    const p = await ctx.newPage(); await p.goto(BASE + '/kantor/index.html#daftar'); await p.waitForTimeout(9000);
    await p.addStyleTag({ content: sembunyi }); await p.evaluate(() => { const k = document.querySelector('#kartu'); if (k) k.scrollTop = 0; }); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + '/formulir.png' }); console.log('ok fotoform'); await ctx.close();
  }
  // ---- Dashboard: Direktur menekan "Terima sebagai Tamu"
  if (ingin('dash')) {
    const ctx = await konteks(b, 2); await ctx.addInitScript(seed({ uid: 'ubaru', daftar: true }), { uid: 'ubaru', daftar: true, NAMA });
    await ctx.clock.install({ time: new Date('2026-11-25T11:00:00+07:00') });
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto(BASE + '/dashboard/index.html'); await maju(ctx, 2000);
    await p.fill('#lU', 'direktur'); await p.fill('#lP', 'cintasejati'); await p.press('#lP', 'Enter'); await maju(ctx, 2500);
    const ke = await p.$('[data-ke="daftar"]'); if (ke) { await ke.click({ force: true }); await maju(ctx, 800); }
    await p.evaluate(() => { const c = document.querySelector('article.pendaftar'); if (c) c.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); });
    await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) if (el.children.length === 0 && /mode lokal/.test(el.textContent)) el.textContent = el.textContent.replace(/\s*·?\s*mode lokal \(demo\)/, ''); });
    await maju(ctx, 300);
    await p.screenshot({ path: OUT + '/dash-cek.png' });
    await rekam(ctx, p, 'dash_acc', 4.5, async (i) => {
      if (i === 45) { const t = await p.$('article.pendaftar [data-a="tamu"]'); if (t) await t.click({ force: true }); }
    });
    await ctx.close();
  }
  // ---- Kantor: pendaftar menerima kabar "Kamu resmi jadi tamu!"
  if (ingin('diterima')) {
    const ctx = await konteks(b, 2); await ctx.addInitScript(seed({ uid: 'ubaru', daftar: true, profil: true }), { uid: 'ubaru', daftar: true, profil: true, NAMA });
    await ctx.clock.install({ time: new Date('2026-11-25T11:00:00+07:00') });
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto(BASE + '/kantor/index.html');
    for (let i = 0; i < 80; i++) { await ctx.clock.fastForward(200); if (i > 10 && await p.evaluate(() => !!(window.__kantor && window.__kantor.L))) break; }
    await p.addStyleTag({ content: sembunyi });
    await maju(ctx, 3000);
    await p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; const K = window.__kantor; K.pindah(0, 12, Math.PI); Object.assign(K.kam, { yaw: 0, pitch: 0.3, jarak: 6.5, y: 1.2 }); });
    await maju(ctx, 1500);
    await rekam(ctx, p, 'diterima', 4.5, async (i) => {
      if (i === 20) await p.evaluate(() => { const L = window.__kantor.L; L.db.set('anggota/' + L.uid, { n: 'Rina', tj: 'jodoh', sejak: Date.now() }); L.db.set('pendaftaran/' + L.uid, null); });
    });
    await ctx.close();
  }
  await b.close();
})();
