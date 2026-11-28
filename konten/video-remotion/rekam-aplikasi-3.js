// Rekaman untuk video #3 (abis jadi tamu ngapain): popup match → obrolan pribadi berisi pesan suara → telepon.
// Jalankan situs di http://localhost:8765 (mis. `python3 -m http.server 8765` di akar repo), lalu:
//   node rekam-aplikasi-3.js <folder-keluaran>
const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.argv[2], BASE = 'http://localhost:8765';
const FPS = 30, DT = 1000 / FPS;
const NAMA = ['raka', 'sinta_', 'dimas.p', 'nadia.r', 'kevin', 'joko', 'ayu.ln', 'bagas', 'citra', 'fajar_', 'gilang', 'hana'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 2, permissions: ['microphone'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route('**/kantor/kantor.js*', async r => { let t = await (await r.fetch()).text(); t = t.replace('window.__kantor = { L, saya, lain, bot, pindah, K };', 'window.__kantor = { L, saya, lain, bot, pindah, K, kam };'); r.fulfill({ body: t, contentType: 'application/javascript' }); });
  await ctx.addInitScript(({ NAMA }) => {
    const t = Date.now(), tamu = {}, anggota = {}, uid = 'urina', lawan = 't2', r = [uid, lawan].sort().join('_');
    NAMA.forEach((n, i) => { tamu['t' + i] = { uid: 't' + i, n, tj: ['jodoh', 'teman', 'curhat'][i % 3], t: t - 1e6 + i }; anggota['t' + i] = { n, tj: tamu['t' + i].tj, sejak: t }; });
    const pesan = {
      a1: { uid: lawan, n: 'dimas.p', m: 'Wah kita match! 😳 Halo~', t: t - 300000 },
      a2: { uid, n: 'Rina', m: 'haii 🙈 kamu suka drakor juga?', t: t - 240000 },
      a3: { uid: lawan, n: 'dimas.p', m: '🎤 Pesan suara', t: t - 180000, sv: { id: 'v1', dur: 9 } },
      a4: { uid, n: 'Rina', m: '🎤 Pesan suara', t: t - 60000, sv: { id: 'v2', dur: 6 } },
      a5: { uid: lawan, n: 'dimas.p', m: 'telpon aja yuk biar enak 😆', t: t - 20000 },
    };
    const db = { anggota: { ...anggota, [uid]: { n: 'Rina', tj: 'jodoh', sejak: t } }, tamu, diamond: { [uid]: 330 }, exp: { [uid]: { n: 1600 } },
      dm: { [r]: { ok: true, pesan } }, dmku: { [uid]: { [r]: { n: 'dimas.p', u: lawan, t, baru: false } } } };
    localStorage.setItem('ptmcs_uid_utama', JSON.stringify(uid)); localStorage.setItem('ptmcs_db', JSON.stringify(db));
    localStorage.setItem('ptmcs_profil', JSON.stringify({ n: 'Rina', tj: 'jodoh', s: 'Jomblo', look: { o: 8, k: 2, b: 1, c: 3, r: 2, w: 1, a: 13 } }));
  }, { NAMA });
  await ctx.clock.install({ time: new Date('2026-11-25T20:00:00+07:00') });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(BASE + '/kantor/index.html');
  const maju = async ms => { for (let t = 0; t < ms; t += 50) await ctx.clock.fastForward(50); };
  for (let i = 0; i < 80; i++) { await ctx.clock.fastForward(200); if (i > 10 && await p.evaluate(() => !!(window.__kantor && window.__kantor.L))) break; }
  await maju(2000);
  await p.addStyleTag({ content: '#loading{display:none!important} .ajak{display:none!important}' });
  await p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; document.querySelectorAll('#toast').forEach(x => x.hidden = true); const K = __kantor; K.pindah(19.2, 3.5, Math.PI); Object.assign(K.kam, { yaw: 0.25, pitch: 0.32, jarak: 7 }); });
  await maju(4000);
  await p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; document.querySelectorAll('#toast').forEach(x => x.hidden = true); });

  const nama = 'match', dir = `${OUT}/f_${nama}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(5.5 * FPS);
  for (let i = 0; i < n; i++) {
    if (i === 3) await p.evaluate(() => __kantor.L.db.set('match/urina', { t2: { n: 'dimas.p', t: Date.now() } }));
    if (i === 42) await p.click('#xM', { force: true }).catch(e => console.log('xM', e.message));
    if (i === 105) await p.click('#rC', { force: true }).catch(e => console.log('rC', e.message));
    await ctx.clock.fastForward(DT);
    await p.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libx264 -crf 15 -preset fast -pix_fmt yuv420p ${OUT}/${nama}.mp4`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok', nama);
  await b.close();
})();
