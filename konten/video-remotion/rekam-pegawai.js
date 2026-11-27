// Video #7 (perkenalan pegawai kantor): render tokoh tiap pegawai (PNG transparan) + rekam kegiatannya.
// Kegiatan pegawai di aplikasi acak, jadi dipicu langsung lewat modul karyawan.js yang "diintip" saat rekaman
// (tanpa mengubah situs). Situs terbaru di http://localhost:8765, lalu:
//   node rekam-pegawai.js <folder> [tokoh,ayu,bambang,ob,raka,cepat,direktur,ojol,ngobrol]
const { chromium } = require('playwright'); const fs = require('fs');
const { maju, rekam, ev } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean);
const ingin = n => !HANYA.length || HANYA.includes(n);
const SITUS = '/tmp/claude-0/-home-user-PT-Mencari-cinta-sejati/b6f39f92-0519-5b23-874c-9957b4f02bef/scratchpad/situs';
const V = fs.readFileSync(SITUS + '/kantor/index.html', 'utf8').match(/kantor\.js\?v=(\d+)/)[1];
const TANPA_UI = 'body *{visibility:hidden!important} canvas{visibility:visible!important}';

async function sesi(b) {
  const ctx = await b.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: 2 });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await ctx.route('**/kantor/kantor.js*', async r => { let t = await (await r.fetch()).text(); t = t.replace('window.__kantor = { L, saya, lain, bot, pindah, K, kam };', 'window.__kantor = { L, saya, lain, bot, pindah, K, kam };'); r.fulfill({ body: t, contentType: 'application/javascript' }); });
  // intip modul karyawan: ekspos kegiatan & kurir, dan saklar agar pegawai tidak "balik ke pos" karena kamera kita
  await ctx.route('**/kantor/karyawan.js*', async r => {
    let t = await (await r.fetch()).text();
    t = t.replace('const pemainDekat = (x, z, r) => jarak(', 'const pemainDekat = (x, z, r) => window.__tanpaTamu ? false : jarak(');
    t += '\nwindow.__kry = { KEGIATAN, kirimKurir, semua, ke, tunggu, pulang, get D() { return D; } };\n';
    r.fulfill({ body: t, contentType: 'application/javascript' });
  });
  await ctx.addInitScript(() => {
    const t = Date.now(), uid = 'urina';
    const db = { anggota: { [uid]: { n: 'Rina', tj: 'jodoh', sejak: t } }, tamu: {}, exp: { [uid]: { n: 1600 } } };
    localStorage.setItem('ptmcs_uid_utama', JSON.stringify(uid)); localStorage.setItem('ptmcs_db', JSON.stringify(db));
    localStorage.setItem('ptmcs_profil', JSON.stringify({ n: 'Rina', tj: 'jodoh', s: 'Jomblo', look: { o: 8, k: 2, b: 1, c: 3, r: 2, w: 1, a: 13 } }));
    window.__tanpaTamu = true;
  });
  await ctx.clock.install({ time: new Date('2026-11-28T10:00:00+07:00') });
  await ctx.clock.pauseAt(new Date('2026-11-28T10:00:01+07:00'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/kantor/index.html');
  for (let i = 0; i < 80; i++) { await ctx.clock.fastForward(200); if (i > 10 && await p.evaluate(() => !!(window.__kantor && window.__kantor.L && window.__kry))) break; }
  const s = { ctx, p };
  await maju(s, 3000);
  await p.evaluate(() => { const k = document.getElementById('kartu'); if (k) k.hidden = true; });
  // semua pegawai diam dulu (kegiatan acak dimatikan), kita yang memicu
  await p.evaluate(() => { for (const o of __kry.semua) { o.idleT = 1e9; o.tugas = []; } });
  return s;
}
// kamera: pemain disembunyikan di titik (x,z); kamera mengorbit pemain
const kamera = (s, x, z, yaw, pitch, jarak, y = 1.4) => ev(s, ([x, z, yaw, pitch, jarak, y]) => { const K = __kantor; K.pindah(x, z, yaw); K.saya.g.visible = false; if (K.saya.label) K.saya.label.visible = false; Object.assign(K.kam, { yaw, pitch, jarak, y }); }, [x, z, yaw, pitch, jarak, y]);
// pegawai ke titik tertentu seketika
const taruh = (s, id, x, z, r) => ev(s, ([id, x, z, r]) => { const o = __kry.semua.find(o => o.id === id); if (!o) return; if (o.kursi) { o.kursi.oleh = null; o.kursi = null; } o.x = x; o.z = z; if (r != null) o.r = r; }, [id, x, z, r]);
// beri tugas (daftar langkah dari fungsi kegiatan atau buatan sendiri)
const tugas = (s, id, kode) => ev(s, ([id, kode]) => { const o = __kry.semua.find(o => o.id === id); if (!o) return; const K = __kry; o.tugas = new Function('o', 'K', 'return ' + kode)(o, K) || []; }, [id, kode]);

module.exports = { sesi, maju, kamera, taruh, tugas };
if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const s = await sesi(b);

  // ---- 1. tokoh tiap pegawai (PNG transparan 1000×1000)
  if (ingin('tokoh')) {
    const hasil = await s.p.evaluate(async ([V]) => {
      const THREE = await import('three');
      const { buatKarakter, pose } = await import('/kantor/karakter.js?v=' + V);
      const K = __kantor.K, rnd = K.renderer, W = 1000, out = {};
      const daftar = [...__kry.semua.filter(o => !o.kurir).map(o => ({ id: o.id, look: o.look, peran: o.pengawal ? 'pengawal' : 'karyawan', bawa: o.bawa || '', a: o.id === 'bambang' || o.id === 'guard1' ? 0 : 5 })),
        { id: 'ojol', look: { v: 2, k: 2, r: 0, w: 0, wa: 0, wb: 0, s: 'l', at: 'ojol', bw: 'jeans', sp: 'sneakers', kp: 'helm', mt: '', tl: '', lh: '', tg: '', ef: '' }, peran: 'karyawan', bawa: 'box', a: 5 }];
      for (const t of daftar) {
        const sc = new THREE.Scene();
        sc.add(new THREE.HemisphereLight(0xffffff, 0xe0c2b8, 1.6));
        const m = new THREE.DirectionalLight(0xfff3e6, 1.8); m.position.set(1.5, 3, 4); sc.add(m);
        const kam = new THREE.PerspectiveCamera(30, 1, 0.1, 40); kam.position.set(0, 1.25, 4.3); kam.lookAt(0, 1.0, 0);
        const g = buatKarakter(t.look, { peran: t.peran, bawa: t.bawa });
        if (t.peran === 'pengawal') g.userData.tubuh && g.userData.tubuh.scale.set(1.22, 1.06, 1.22);
        g.rotation.y = -0.3; for (let i = 0; i < 20; i++) pose(g, t.a, 0.08); sc.add(g);
        const rt = new THREE.WebGLRenderTarget(W, W, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
        rnd.setRenderTarget(rt); rnd.setClearColor(0x000000, 0); rnd.clear(); rnd.render(sc, kam);
        const px = new Uint8Array(W * W * 4); rnd.readRenderTargetPixels(rt, 0, 0, W, W, px); rnd.setRenderTarget(null); rt.dispose();
        const c = document.createElement('canvas'); c.width = W; c.height = W; const x = c.getContext('2d'), img = x.createImageData(W, W);
        for (let y = 0; y < W; y++) img.data.set(px.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
        x.putImageData(img, 0, 0); out[t.id] = c.toDataURL('image/png');
      }
      return out;
    }, [V]);
    for (const [id, url] of Object.entries(hasil)) fs.writeFileSync(`${OUT}/pegawai-${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log('ok tokoh', Object.keys(hasil).join(','));
  }

  const gaya = await s.p.addStyleTag({ content: TANPA_UI });

  // ---- 2. Mbak Ayu: angkat telepon di meja resepsionis
  if (ingin('ayu')) {
    await kamera(s, -6.25, 14, -Math.PI / 2, 0.2, 5, 1.3); await maju(s, 800);
    await rekam(s, 'p_ayu', 4.5, async (i) => { if (i === 8) await tugas(s, 'ayu', `[K.tunggu(6, 4, '📞 Halo, PT Mencari Cinta Sejati, ada yang bisa dibantu?')]`); });
  }
  // ---- 3. Pak Bambang patroli di lobi
  if (ingin('bambang')) {
    await taruh(s, 'bambang', 3, 18.5, Math.PI); await kamera(s, 0.5, 15.5, Math.PI - 0.25, 0.22, 6.5); await maju(s, 600);
    await rekam(s, 'p_bambang', 5, async (i) => { if (i === 2) await tugas(s, 'bambang', `[K.ke(0, 16.5), K.tunggu(2.5, 0, 'Lobi aman 👍'), K.ke(-5, 13)]`); });
  }
  // ---- 4. Bu Wati ngepel (+ rambu basah) & Mas Ujang nyapu
  if (ingin('ob')) {
    await taruh(s, 'wati', -1.7, 13.4, Math.PI); await taruh(s, 'ujang', 1.7, 13.0, Math.PI);
    await tugas(s, 'wati', `[{ fn: o => K.D.rambuBasah(o.x + 0.9, o.z - 0.6, 14) }, K.tunggu(12, 3, 'Awas licin ya! 🧽')]`);
    await tugas(s, 'ujang', `[K.tunggu(2.2, 3, ''), K.tunggu(10, 3, 'Sapu dulu biar bersih 🧹')]`);
    await kamera(s, 0, 13.2, Math.PI, 0.2, 7.2, 1.3); await maju(s, 300);
    await rekam(s, 'p_ob', 5);
  }
  // ---- 5. Mas Raka antar kopi (nampan) di Kafe Jodoh
  if (ingin('raka')) {
    await kamera(s, 21.5, 2.0, Math.PI, 0.2, 6.5, 1.3); await maju(s, 400);
    await rekam(s, 'p_raka', 5, async (i) => { if (i === 2) await tugas(s, 'raka', `K.KEGIATAN.antarKopi(o)`); });
  }
  // ---- 6. potongan cepat: Kak Nadia, Bang Dimas, Mbak Sari, Mas Bayu (kamera ditambat ke posisi pegawai setelah kegiatannya jalan)
  if (ingin('cepat')) {
    for (const [id, kode, yaw, pre, jarak] of [
      ['nadia', `K.KEGIATAN.dudukTaman(o)`, Math.PI, null, 5],
      ['dimas', `K.KEGIATAN.dudukMeja(o)`, Math.PI, null, 5],
      ['sari', `[K.tunggu(6, 3, 'Lipet baju dulu 👕'), K.tunggu(4, 3, 'Koleksi baru udah dateng ✨')]`, -Math.PI / 2 + 0.5, [-22.6, 3.2], 4.6],
      ['bayu', `[K.tunggu(8, 6, 'Rekor baru!! 🎮', [-11.5, 19.2])]`, -0.6, [-11.5, 17.6], 4.4],
    ]) {
      if (HANYA.length > 1 && HANYA.includes('-' + id)) continue;
      if (pre) await taruh(s, id, pre[0], pre[1]);
      await tugas(s, id, kode);
      await ev(s, ([id]) => { const o = __kry.semua.find(o => o.id === id); const k = o.tugas[0] && o.tugas[0].duduk; if (k) { o.x = k.x; o.z = k.z; } }, [id]);
      await maju(s, 1200);
      await ev(s, ([id, yaw, jarak]) => { const o = __kry.semua.find(o => o.id === id); const K = __kantor; K.pindah(o.x, o.z, yaw); K.saya.g.visible = false; Object.assign(K.kam, { yaw, pitch: 0.2, jarak, y: 1.3 }); }, [id, yaw, jarak]);
      await maju(s, 300);
      await rekam(s, 'p_' + id, 2.5);
    }
  }
  // ---- 7. pintu Ruang Direktur: 2 GUARD, Mbak Citra antar berkas, Mas Ujang antar kopi
  if (ingin('direktur')) {
    await taruh(s, 'citra', 13.2, 14.2); await taruh(s, 'ujang', 12.6, 17.4);
    await kamera(s, 16.0, 16.0, -Math.PI / 2, 0.18, 6.5, 1.3); await maju(s, 300);
    await rekam(s, 'p_direktur', 5, async (i) => {
      if (i === 2) await tugas(s, 'citra', `[K.ke(16.3, 15.4), K.tunggu(4, 0, 'Pak/Bu Direktur, ini berkas tamu baru 📁', [20.6, 16])]`);
      if (i === 20) await tugas(s, 'ujang', `[{ fn: o => { o.bawaKini = ''; } }, K.ke(16.3, 16.8), K.tunggu(3, 0, 'Kopinya, Direktur ☕', [20.6, 16])]`);
    });
  }
  // ---- 8. Bang Ojol antar pesanan Mbak Ayu ke lobi
  if (ingin('ojol')) {
    await ev(s, () => { const ayu = __kry.semua.find(o => o.id === 'ayu'); ayu.tugas = __kry.KEGIATAN.pesanMakan(ayu); });
    await kamera(s, 0.6, 18.5, Math.PI + 0.1, 0.2, 9, 1.4);
    // tunggu kurir muncul & mendekat ke halaman depan
    for (let k = 0; k < 400; k++) { await maju(s, 100); const z = await s.p.evaluate(() => { const o = __kry.semua.find(o => o.kurir); return o ? o.z : 99; }); if (z < 31) break; }
    await rekam(s, 'p_ojol', 9, async (i, t) => { await ev(s, ([t]) => { const o = __kry.semua.find(o => o.kurir); if (o) Object.assign(__kantor.kam, { yaw: Math.PI + 0.1 - Math.min(0.5, t * 0.06) }); }, [t]); });
  }
  // ---- 9. ngobrol berdua dekat pos Kak Laras (lobi barat), lalu tamu muncul → "Eh ada tamu! Sebentar ya 🏃"
  if (ingin('ngobrol')) {
    await taruh(s, 'laras', -6.6, 9.2, -1.4); await taruh(s, 'bayu', -8.0, 9.4, 1.4);
    await kamera(s, -7.3, 11.4, 0.15, 0.28, 6.2, 1.3); await maju(s, 300);
    const ob = (id, l) => tugas(s, id, '[' + l.map(([t, k, h]) => `K.tunggu(${t}, 0, ${JSON.stringify(k)}, ${JSON.stringify(h)})`).join(',') + ']');
    await ob('laras', [[2.6, 'Tamu hari ini rame ya?', [-8.0, 9.4]], [2.6, '', [-8.0, 9.4]], [2.6, 'Wah, Direktur pasti seneng tuh', [-8.0, 9.4]], [8, '', [-8.0, 9.4]]]);
    await ob('bayu', [[2.6, '', [-6.6, 9.2]], [2.6, 'Iya, tadi ada yang match di Kafe Jodoh 💘', [-6.6, 9.2]], [10, '', [-6.6, 9.2]]]);
    await rekam(s, 'p_ngobrol', 9, async (i) => {
      if (i === 190) await ev(s, () => { window.__tanpaTamu = false; __kantor.K.saya.g.visible = true; });
    });
  }
  await gaya.evaluate(e => e.remove());
  await b.close();
})();
