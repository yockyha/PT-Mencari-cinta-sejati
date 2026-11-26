// Rekaman untuk video #4 (fitur-fitur baru): speed dating + kecocokan, menfess, truth or dare, kerupuk,
// Amplop Cinta, ketuk pintu Ruang Direktur, Taman Cinta (proyek), dan potongan cepat.
// Jalankan situs versi terbaru di http://localhost:8765 lalu:
//   node rekam-aplikasi-4.js <folder-keluaran> [nama,nama,...]   (nama "cek" = hanya screenshot)
const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean), BASE = 'http://localhost:8765';
const FPS = 30, DT = 1000 / FPS;
const ingin = n => !HANYA.length || HANYA.includes(n);
const NAMA = ['raka', 'sinta_', 'dimas.p', 'nadia.r', 'kevin', 'joko', 'ayu.ln', 'bagas', 'citra', 'fajar_', 'gilang', 'hana'];

async function sesi(b, { jam = '2026-11-26T20:00:00+07:00' } = {}) {
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route('**/kantor/kantor.js*', async r => { let t = await (await r.fetch()).text(); t = t.replace('window.__kantor = { L, saya, lain, bot, pindah, K, kam };', 'window.__kantor = { L, saya, lain, bot, pindah, K, kam, tombol };'); r.fulfill({ body: t, contentType: 'application/javascript' }); });
  await ctx.addInitScript(({ NAMA }) => {
    const t = Date.now(), tamu = {}, anggota = {}, uid = 'urina';
    NAMA.forEach((n, i) => { tamu['t' + i] = { uid: 't' + i, n, tj: ['jodoh', 'teman', 'curhat'][i % 3], t: t - 1e6 + i }; anggota['t' + i] = { n, tj: tamu['t' + i].tj, sejak: t }; });
    const db = { anggota: { ...anggota, [uid]: { n: 'Rina', tj: 'jodoh', sejak: t } }, tamu, diamond: { [uid]: 330 }, exp: { [uid]: { n: 1600 } } };
    localStorage.setItem('ptmcs_uid_utama', JSON.stringify(uid)); localStorage.setItem('ptmcs_db', JSON.stringify(db));
    localStorage.setItem('ptmcs_profil', JSON.stringify({ n: 'Rina', tj: 'jodoh', s: 'Jomblo', g: 'ce', zd: 4, mb: 'ENFP', ll: 1, look: { o: 8, k: 2, b: 1, c: 3, r: 2, w: 1, a: 13 } }));
  }, { NAMA });
  await ctx.clock.install({ time: new Date(jam) });
  await ctx.clock.pauseAt(new Date(new Date(jam).getTime() + 1000)); // jam hanya maju lewat fastForward (bukan waktu nyata)
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(BASE + '/kantor/index.html');
  for (let i = 0; i < 80; i++) { await ctx.clock.fastForward(200); if (i > 10 && await p.evaluate(() => !!(window.__kantor && window.__kantor.L))) break; }
  const s = { ctx, p };
  await maju(s, 2000);
  await p.addStyleTag({ content: '#loading{display:none!important} .ajak{display:none!important}' });
  await tutup(s); await maju(s, 5000); await tutup(s);
  return s;
}
async function maju(s, ms) { for (let t = 0; t < ms; t += 50) await s.ctx.clock.fastForward(50); }
const tutup = s => s.p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; document.querySelectorAll('#toast').forEach(x => x.hidden = true); });
async function rekam(s, nama, detik, aksi = async () => {}) {
  const dir = `${OUT}/f_${nama}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(detik * FPS);
  for (let i = 0; i < n; i++) {
    await aksi(i, i / FPS);
    await s.ctx.clock.fastForward(DT);
    await s.p.screenshot({ path: `${dir}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  execSync(`ffmpeg -v error -y -framerate ${FPS} -i ${dir}/%04d.jpg -c:v libx264 -crf 15 -preset fast -pix_fmt yuv420p ${OUT}/${nama}.mp4`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok', nama);
}
const foto = (s, nama) => s.p.screenshot({ path: `${OUT}/${nama}.png` }).then(() => console.log('foto', nama));
const klik = (s, sel) => s.p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return false; e.click(); return true; }, sel).then(ok => { if (!ok) console.log('klik gagal', sel, 'tidak ada'); });
const ev = (s, f, a) => s.p.evaluate(f, a).catch(e => console.log('eval gagal', e.message.split('\n')[0]));

module.exports = { sesi, maju, tutup, rekam, foto, klik, ev, FPS };

if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  if (HANYA.includes('cek')) {
    const s = await sesi(b);
    const H = k => ev(s, k => __kantor.K.bukaHarian(k), k);
    // speed dating: buka ronde berpasangan dengan dimas.p
    await ev(s, () => { const L = __kantor.L, t = L.db.now(); L.db.set('speedDating', { buka: true, ronde: { no: 1, mulai: t, durasi: 180, pasangan: { urina: 't2', t2: 'urina' } } }); });
    await maju(s, 1500); await foto(s, 'c_speed');
    await tutup(s); await H('menfess'); await maju(s, 600); await foto(s, 'c_menfess');
    await klik(s, '#mfT'); await maju(s, 600); await foto(s, 'c_menfess_tulis');
    await tutup(s); await H('amplop'); await maju(s, 600); await foto(s, 'c_amplop');
    await klik(s, '#aG'); await maju(s, 1500); await foto(s, 'c_amplop_buka');
    await tutup(s); await H('kerupuk'); await maju(s, 600); await foto(s, 'c_kerupuk');
    await tutup(s); await H('kuis'); await maju(s, 600); await foto(s, 'c_kuis');
    await tutup(s); await H('kamar'); await maju(s, 600); await foto(s, 'c_kamar');
    await tutup(s); await H('season'); await maju(s, 600); await foto(s, 'c_season');
    await tutup(s); await ev(s, () => __kantor.K.Komunitas.bukaNobar()); await maju(s, 600); await foto(s, 'c_nobar');
    await tutup(s); await ev(s, () => { const K = __kantor; K.pindah(16.8, 16, Math.PI / 2); Object.assign(K.kam, { yaw: Math.PI / 2 + 0.4, pitch: 0.25, jarak: 6 }); }); await maju(s, 1500); await foto(s, 'c_pintudir');
    await ev(s, () => import('/kantor/ruangdir.js?v=202611260740').then(m => m.ketuk())); await maju(s, 600); await foto(s, 'c_ketuk');
    await tutup(s); await ev(s, () => { const K = __kantor; K.pindah(-30.2, 22, -Math.PI / 2); Object.assign(K.kam, { yaw: -Math.PI / 2 - 0.2, pitch: 0.35, jarak: 14 }); }); await maju(s, 2500); await foto(s, 'c_taman');
    await ev(s, () => { const K = __kantor; K.pindah(0, 1.5, Math.PI); Object.assign(K.kam, { yaw: 0.2, pitch: 0.4, jarak: 8 }); }); await maju(s, 1500); await foto(s, 'c_meja');
  }
  const V = '202611260740';
  // 1 speed dating: kecocokan + obrolan, timer habis → pilih ❤
  if (ingin('speed')) {
    const s = await sesi(b);
    for (let k = 0; k < 40 && !(await s.p.evaluate(() => __kantor.K.lain.has('t2'))); k++) await maju(s, 250);
    console.log('t2 ada:', await s.p.evaluate(() => __kantor.K.lain.has('t2')));
    await ev(s, () => { const m = __kantor.K.lain, get0 = m.get.bind(m), data = { zd: 8, mb: 'INFP', ll: 1, tj: 'jodoh' };
      m.get = k => { const o = get0(k); if (k !== 't2') return o; return o ? Object.assign(o, data) : { uid: 't2', nama: 'dimas.p', ...data }; }; });
    await ev(s, () => { const L = __kantor.L, t = L.db.now(); L.db.set('speedDating', { buka: true, ronde: { no: 1, mulai: t - 4000, durasi: 180, pasangan: { urina: 't2', t2: 'urina' } } }); });
    await maju(s, 400);
    const P = ['hai! kamu suka kopi juga? ☕', 'iyaa tim kopi susu 😆', 'kencan pertama impianmu apa?', 'nonton + makan boba sih 🥹'];
    await rekam(s, 'sd', 7.5, async (i) => {
      const k = [6, 36, 70, 100].indexOf(i);
      if (k >= 0) await ev(s, ([m, k]) => { const L = __kantor.L; L.db.push('sdChat/t2_urina', { uid: k % 2 ? 'urina' : 't2', n: k % 2 ? 'Rina' : 'dimas.p', m, t: L.db.now() }); }, [P[k], k]);
      if (i === 150) await ev(s, () => { const L = __kantor.L; L.db.set('speedDating/ronde/mulai', L.db.now() - 181000); });
      if (i === 205) await klik(s, '#vY');
    });
    await s.ctx.close();
  }
  // 2 menfess: daftar → tulis → terkirim
  if (ingin('menfess')) {
    const s = await sesi(b);
    await ev(s, () => { const L = __kantor.L, t = L.db.now(); L.db.update('', {
      'menfess/a1': { m: 'buat yang duduk di meja Drakor tadi malem, ketawamu lucu banget 😳', ke: '', keN: '', t: t - 3600e3, s: { t1: true, t3: true, t5: true } },
      'menfess/a2': { m: 'kamu yang pake hoodie pink di Kafe Jodoh… boleh kenalan? 🙈', ke: 'urina', keN: 'Rina', t: t - 600e3, s: { t2: true } },
      'menfessKu/urina/a2': { t: t - 600e3 } }); });
    await maju(s, 600);
    const teks = 'kamu yang suka nyanyi di Kafe Jodoh, suaramu bikin adem 🥹';
    await rekam(s, 'menfess', 6, async (i) => {
      if (i === 0) await ev(s, () => __kantor.K.bukaHarian('menfess'));
      if (i === 40) await klik(s, '#mfT');
      if (i > 50 && i <= 130) await ev(s, ([v]) => { const e = document.querySelector('#mfM'); if (e) e.value = v; }, [[...teks].slice(0, Math.round((i - 50) / 80 * [...teks].length)).join('')]);
      if (i === 140) await klik(s, '#mfK2');
    });
    await s.ctx.close();
  }
  // 3 truth or dare di meja
  if (ingin('tod')) {
    const s = await sesi(b);
    await ev(s, () => { const K = __kantor; K.pindah(0, 1.5, Math.PI); Object.assign(K.kam, { yaw: 0.2, pitch: 0.4, jarak: 8 }); });
    await maju(s, 800);
    await rekam(s, 'tod', 4, async (i) => {
      if (i === 0) await ev(s, ([V]) => import('/kantor/meja.js?v=' + V).then(m => m.bukaMeja(2, '🎬 Drakor & Film', 'seru')), [V]);
      if (i === 35) await klik(s, '#sTd');
    });
    await s.ctx.close();
  }
  // 4 lomba makan kerupuk
  if (ingin('kerupuk')) {
    const s = await sesi(b);
    await rekam(s, 'kerupuk', 5, async (i) => {
      if (i === 0) await ev(s, () => __kantor.K.bukaHarian('kerupuk'));
      if (i === 20) await klik(s, '#krM');
      if (i > 26 && i % 2 === 0) await ev(s, () => { const e = document.querySelector('#krB'); if (e) e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
    });
    await s.ctx.close();
  }
  // 5 Amplop Cinta (hadiah barang langka)
  if (ingin('amplop')) {
    const s = await sesi(b);
    await rekam(s, 'amplop', 4.5, async (i) => {
      if (i === 0) await ev(s, () => __kantor.K.bukaHarian('amplop'));
      if (i === 25) { await ev(s, () => { Math.random = () => 0.05; }); await klik(s, '#aG'); }
    });
    await s.ctx.close();
  }
  // 6 ketuk pintu Ruang Direktur
  if (ingin('ketuk')) {
    const s = await sesi(b);
    await ev(s, () => { const K = __kantor; K.pindah(16.8, 16, Math.PI / 2); Object.assign(K.kam, { yaw: Math.PI / 2 + 0.4, pitch: 0.25, jarak: 6 }); });
    await maju(s, 1500);
    await rekam(s, 'ketuk', 4, async (i) => {
      if (i === 30) await ev(s, ([V]) => import('/kantor/ruangdir.js?v=' + V).then(m => m.ketuk()), [V]);
      if (i === 75) await klik(s, '#kT');
    });
    await s.ctx.close();
  }
  // 7 Taman Cinta (proyek + hitung mundur), kamera berputar
  if (ingin('taman')) {
    const s = await sesi(b);
    await ev(s, () => { const K = __kantor; K.pindah(-30.2, 22, -Math.PI / 2); K.saya.g.visible = true; });
    await maju(s, 2000);
    await rekam(s, 'taman', 4.5, async (i, t) => { await ev(s, ([t]) => Object.assign(__kantor.kam, { yaw: -Math.PI / 2 - 0.6 + t * 0.22, pitch: 0.42 - t * 0.03, jarak: 16 - t * 1.2 }), [t]); });
    await s.ctx.close();
  }
  await b.close();
})();
