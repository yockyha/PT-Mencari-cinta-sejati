// Bahan cover: latar bersih (tanpa UI) dan karakter 3D berlatar transparan, dirender dari aplikasi.
// Jalankan situs versi terbaru di http://localhost:8765 lalu:  node rekam-cover.js <folder-keluaran>
// Hasil: latar-<nama>.png (1215×2160) & tokoh-<nama>.png (1600×1600, transparan)
const { chromium } = require('playwright'); const fs = require('fs');
const { sesi, maju, ev } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean);
const ingin = n => !HANYA.length || HANYA.includes(n);

// Tiap cover: latar (posisi & kamera) + tokoh (karakter, pose, posisi)
const COVER = {
  datenight: {
    latar: { x: -56, z: 14, yaw: -Math.PI / 2 - 0.15, pitch: 0.16, jarak: 17, y: 3.5 },
    tokoh: [
      { look: { s: 'p', at: 'gaun', wa: 5, r: 1, w: 4, tl: 'antingBulat' }, a: 5, x: -0.42, ry: 0.45 },
      { look: { s: 'l', at: 'kemeja', wa: 1, lh: 'dasiKupu', tg: 'buket' }, a: 0, x: 0.42, ry: -0.45 },
    ],
  },
  grup: {
    latar: { x: 0, z: 1.5, yaw: 0.15, pitch: 0.62, jarak: 13, y: 1.6 },
    tokoh: [
      { look: { s: 'l', at: 'hoodie', wa: 8, r: 7, w: 2, kp: 'topi' }, a: 5, x: -0.7, ry: 0.35 },
      { look: { s: 'p', at: 'blusPita', wa: 7, r: 1, w: 3 }, a: 0, x: 0, ry: 0, z: 0.15 },
      { look: { s: 'l', at: 'o9', r: 4, tl: 'headset' }, a: 5, x: 0.7, ry: -0.35 },
    ],
  },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const V = fs.readFileSync('/tmp/claude-0/-home-user-PT-Mencari-cinta-sejati/b6f39f92-0519-5b23-874c-9957b4f02bef/scratchpad/situs/kantor/index.html', 'utf8').match(/kantor\.js\?v=(\d+)/)[1];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const s = await sesi(b, { jam: '2026-11-28T16:30:00+07:00' });
  await ev(s, () => __kantor.L.setelan({ gedung_tamanCinta: 'buka' }));
  await maju(s, 1500);
  for (const [nama, C] of Object.entries(COVER)) {
    if (!ingin(nama)) continue;
    // latar bersih: sembunyikan semua UI, sisakan kanvas 3D
    await ev(s, ([c]) => { const K = __kantor; K.pindah(c.x, c.z, c.yaw); K.saya.g.visible = false; Object.assign(K.kam, { yaw: c.yaw, pitch: c.pitch, jarak: c.jarak, y: c.y }); }, [C.latar]);
    const gaya = await s.p.addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
    await maju(s, 2500);
    const kanvas = await s.p.$('canvas');
    await s.p.screenshot({ path: `${OUT}/latar-${nama}.png`, clip: await kanvas.boundingBox() });
    await gaya.evaluate(e => e.remove());
    console.log('ok latar', nama);
    // tokoh: render karakter ke target transparan 1600×1600
    const url = await s.p.evaluate(async ([V, tokoh]) => {
      const THREE = await import('three');
      const { buatKarakter, pose } = await import('/kantor/karakter.js?v=' + V);
      const K = __kantor.K, rnd = K.renderer, W = 1600;
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xffffff, 0xe0c2b8, 1.6));
      const m = new THREE.DirectionalLight(0xfff3e6, 1.8); m.position.set(1.5, 3, 4); sc.add(m);
      const lebar = tokoh.length > 2 ? 2.6 : 2.1;
      const kam = new THREE.PerspectiveCamera(30, 1, 0.1, 40); kam.position.set(0, 1.3, lebar * 2.5); kam.lookAt(0, 1.0, 0);
      const S = o => ({ v: 2, k: 1, r: 0, w: 0, wa: 0, wb: 0, at: 'kaos', bw: 'chino', sp: 'sneakers', kp: '', mt: '', tl: '', lh: '', tg: '', ef: '', ...o });
      for (const t of tokoh) {
        const g = buatKarakter(S(t.look), { peran: 'pengunjung' });
        g.position.set(t.x, 0, t.z || 0); g.rotation.y = t.ry;
        for (let i = 0; i < 20; i++) pose(g, t.a, 0.08);
        sc.add(g);
      }
      const rt = new THREE.WebGLRenderTarget(W, W, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
      rnd.setRenderTarget(rt); rnd.setClearColor(0x000000, 0); rnd.clear(); rnd.render(sc, kam);
      const px = new Uint8Array(W * W * 4); rnd.readRenderTargetPixels(rt, 0, 0, W, W, px); rnd.setRenderTarget(null);
      const c = document.createElement('canvas'); c.width = W; c.height = W; const x = c.getContext('2d'), img = x.createImageData(W, W);
      for (let y = 0; y < W; y++) img.data.set(px.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
      x.putImageData(img, 0, 0);
      return c.toDataURL('image/png');
    }, [V, C.tokoh]);
    fs.writeFileSync(`${OUT}/tokoh-${nama}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log('ok tokoh', nama);
  }
  await b.close();
})();
