// Rekaman untuk video #8 (recap Taman Cinta + Date Night semalam, teaser peresmian Y.H.A Club 20.00 WIB).
// Jalankan situs versi terbaru di http://localhost:8765 lalu:
//   node rekam-aplikasi-8.js <folder-keluaran> [tc_drone,tc_koin,tc_bioskop,cl_luar,cl_dance,cl_dj,cl_bar,cl_vip,cl_layar] [cek]
// "cek" = hanya screenshot tiap adegan (cepat) untuk memeriksa sudut kamera.
const { chromium } = require('playwright'); const fs = require('fs');
const { sesi, maju, rekam, ev, klik, tutup } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean), CEK = process.argv[4] === 'cek';
const ingin = n => !HANYA.length || HANYA.includes(n);
const MALAM_TC = '2026-11-27T21:35:00+07:00', MALAM_CL = '2026-11-28T20:02:00+07:00';

// tamu lain (data presence lokal) supaya tempat terlihat ramai; a = animasi (7 = joget)
const LOOK = [
  { s: 'p', at: 'gaun', wa: 5, r: 1, w: 4 }, { s: 'l', at: 'kemeja', wa: 1, lh: 'dasiKupu' }, { s: 'p', at: 'blusPita', wa: 7, r: 3, w: 3 },
  { s: 'l', at: 'hoodie', wa: 8, r: 7, w: 2 }, { s: 'p', at: 'gaun', wa: 2, r: 5, w: 1 }, { s: 'l', at: 'kaos', wa: 3, r: 4, kp: 'topi' },
  { s: 'p', at: 'kaos', wa: 6, r: 2, w: 5 }, { s: 'l', at: 'kemeja', wa: 4, r: 6 },
];
const NAMA = ['raka', 'sinta_', 'dimas.p', 'nadia.r', 'kevin', 'joko', 'ayu.ln', 'bagas'];
const ramai = (s, titik) => ev(s, ([titik, LOOK, NAMA]) => {
  const L = __kantor.L, t = L.db.now(), upd = {};
  titik.forEach(([x, z, r, a], i) => { upd['online/t' + i] = { n: NAMA[i % NAMA.length], tj: 'jodoh', x, z, r, a, t, l: { v: 2, k: 1 + (i % 3), bw: 'chino', sp: 'sneakers', ...LOOK[i % LOOK.length] } }; });
  return L.db.update('', upd);
}, [titik, LOOK, NAMA]);
const kam = (s, o) => ev(s, ([o]) => Object.assign(__kantor.kam, o), [o]);
async function adegan(s, nama, detik, aksi) {
  if (!CEK) return rekam(s, nama, detik, aksi);
  const n = Math.round(detik * 30);
  for (let i = 0; i < n; i++) { await aksi(i, i / 30); if (i % 6 === 0) await s.ctx.clock.fastForward(200); }
  await s.p.screenshot({ path: `${OUT}/cek-${nama}.png` }); console.log('cek', nama);
}
const rapi = s => s.p.addStyleTag({ content: '#arah,#clubPemutar{display:none!important}' });
const tekanE = s => s.p.keyboard.press('e');
const ketik = (s, sel, teks, k) => ev(s, ([sel, v]) => { const e = document.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); } }, [sel, [...teks].slice(0, k).join('')]);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const tc = async () => { const s = await sesi(b, { jam: MALAM_TC }); await rapi(s); await ev(s, () => __kantor.L.setelan({ gedung_tamanCinta: 'buka' })); await maju(s, 1500); return s; };
  const club = async () => {
    const s = await sesi(b, { jam: MALAM_CL }); await rapi(s);
    await ev(s, () => __kantor.L.setelan({ gedung_yhaClub: 'buka' }));
    await ev(s, () => { const L = __kantor.L; return L.db.set('club/lagu', { id: 'dQw4w9WgXcQ', list: '', judul: 'Y.H.A Club Opening Night Mix', ulang: true, n: 'DJ Rendi', oleh: L.uid, t: L.db.now() }); });
    await maju(s, 1500); return s;
  };

  // 🎡 Taman Cinta malam: kamera mengitari bianglala & air mancur
  if (ingin('tc_drone')) {
    const s = await tc();
    await ramai(s, [[-56, 10, 0, 5], [-55, 10.6, Math.PI, 0], [-63, 16, 1, 0], [-62.3, 16.6, -2, 5], [-50, 0, 2, 0], [-66, 8, 0, 0]]);
    await ev(s, () => { const K = __kantor; K.pindah(-58, 12, -Math.PI / 2); K.saya.g.visible = false; });
    await maju(s, 2500);
    await adegan(s, 'tc_drone', 5, async (i, t) => { await kam(s, { yaw: -Math.PI / 2 - 0.9 + t * 0.22, pitch: 0.3 - t * 0.02, jarak: 24 - t * 1.6, y: 5 }); });
    await s.ctx.close();
  }
  // 🪙 lempar koin harapan di air mancur
  if (ingin('tc_koin')) {
    const s = await tc();
    await ramai(s, [[-49.5, 6, -1.2, 0], [-58.5, 1.5, 1, 5]]);
    await ev(s, () => { const K = __kantor; K.pindah(-54, 9.2, 0); });
    await maju(s, 2000); await kam(s, { yaw: Math.PI + 0.5, pitch: 0.22, jarak: 6.5, y: 1.6 }); await maju(s, 800);
    const teks = 'semoga cepet ketemu jodoh 💍';
    await adegan(s, 'tc_koin', 5.5, async (i, t) => {
      await kam(s, { yaw: Math.PI + 0.5 - t * 0.08, pitch: 0.22, jarak: 6.5 - t * 0.2, y: 1.6 });
      if (i === 6) await tekanE(s);
      if (i > 20 && i <= 70) await ketik(s, '#hpT', teks, Math.round((i - 20) / 50 * [...teks].length));
      if (i === 80) await klik(s, '#hpL');
    });
    await s.ctx.close();
  }
  // 🎬 bioskop + popcorn
  if (ingin('tc_bioskop')) {
    const s = await tc();
    await ramai(s, [[-70, -16, Math.PI / 2, 2], [-70, -14.2, Math.PI / 2, 2], [-72, -17, Math.PI / 2, 2], [-72, -13, Math.PI / 2, 2]]);
    await ev(s, () => { const K = __kantor; K.pindah(-59.8, -17.6, -Math.PI / 2); });
    await maju(s, 2000);
    await adegan(s, 'tc_bioskop', 4.5, async (i, t) => {
      await kam(s, { yaw: -Math.PI / 2 + 0.7 - t * 0.12, pitch: 0.25, jarak: 7 - t * 0.4, y: 1.8 });
      if (i === 25) await tekanE(s);
    });
    await s.ctx.close();
  }
  // 🪩 Y.H.A Club: eksterior neon, kamera mendekat ke pintu
  if (ingin('cl_luar')) {
    const s = await club();
    await ramai(s, [[63, 22, Math.PI, 0], [65, 23.4, Math.PI, 0], [62.4, 25, Math.PI, 0], [66, 26, Math.PI, 5], [60, 30, 0.5, 5]]);
    await ev(s, () => { const K = __kantor; K.pindah(64, 31, Math.PI); K.saya.g.visible = false; });
    await maju(s, 2500);
    await adegan(s, 'cl_luar', 5, async (i, t) => { await kam(s, { yaw: Math.PI + 0.35 - t * 0.1, pitch: 0.18 - t * 0.015, jarak: 26 - t * 2.4, y: 4.5 - t * 0.3 }); });
    await s.ctx.close();
  }
  // 💃 dance floor penuh, DJ di panggung, laser & disco ball
  if (ingin('cl_dance')) {
    const s = await club();
    const T = []; for (let i = 0; i < 8; i++) T.push([58 + (i % 4) * 3.6 + (i > 3 ? 1.6 : 0), -6 + Math.floor(i / 4) * 3.4, Math.PI + (i % 3 - 1) * 0.4, 7]);
    await ramai(s, T);
    await ev(s, () => { const K = __kantor; K.pindah(64, -1, Math.PI); });
    await maju(s, 2500); await ev(s, () => __kantor.K.emote(7, 60));
    await adegan(s, 'cl_dance', 5.5, async (i, t) => { await kam(s, { yaw: Math.PI - 0.6 + t * 0.22, pitch: 0.2, jarak: 11 - t * 0.6, y: 2.4 }); });
    await s.ctx.close();
  }
  // 🎧 panel DJ: tempel link YouTube → putar untuk semua
  if (ingin('cl_dj')) {
    const s = await club();
    await ev(s, () => { const L = __kantor.L; return L.db.set('club/lagu', null); });
    await ev(s, () => { const K = __kantor; K.pindah(64, -9.4, Math.PI); });
    await maju(s, 2000); await kam(s, { yaw: Math.PI, pitch: 0.12, jarak: 5, y: 2.2 });
    const link = 'https://youtu.be/dQw4w9WgXcQ';
    await adegan(s, 'cl_dj', 5, async (i) => {
      if (i === 5) await tekanE(s);
      if (i > 22 && i <= 60) await ketik(s, '#djL', link, Math.round((i - 22) / 38 * link.length));
      if (i === 64) await ev(s, () => { const e = document.querySelector('#djJ'); if (e) e.value = 'Y.H.A Club Opening Night Mix'; });
      if (i === 72) await klik(s, '#djP');
      if (i === 100) await tutup(s);
    });
    await s.ctx.close();
  }
  // 🍹 mocktail bar
  if (ingin('cl_bar')) {
    const s = await club();
    await ramai(s, [[49.6, 3.6, -Math.PI / 2, 0], [49.6, -2, -Math.PI / 2, 5]]);
    await ev(s, () => { const K = __kantor; K.pindah(49.6, 1, -Math.PI / 2); });
    await maju(s, 2000); await kam(s, { yaw: -Math.PI / 2 + 0.5, pitch: 0.2, jarak: 5, y: 1.8 });
    await adegan(s, 'cl_bar', 4.5, async (i, t) => {
      await kam(s, { yaw: -Math.PI / 2 + 0.5 - t * 0.12, pitch: 0.2, jarak: 5 - t * 0.3, y: 1.8 });
      if (i === 5) await tekanE(s);
      if (i === 40) await klik(s, '#kartu [data-m="0"]');
    });
    await s.ctx.close();
  }
  // 💎 VIP table
  if (ingin('cl_vip')) {
    const s = await club();
    await ramai(s, [[78.2, -13.8, -Math.PI / 2, 0], [78.2, -12.2, -Math.PI / 2, 5], [78.2, -8.2, -Math.PI / 2, 0], [78.2, -6.8, -Math.PI / 2, 0]]);
    await ev(s, () => { const K = __kantor; K.pindah(73, -10, Math.PI / 2); K.saya.g.visible = false; });
    await maju(s, 2000);
    await adegan(s, 'cl_vip', 4, async (i, t) => { await kam(s, { yaw: Math.PI / 2 + 0.5 - t * 0.2, pitch: 0.22, jarak: 7 - t * 0.5, y: 2 }); });
    await s.ctx.close();
  }
  // 💌 layar ucapan: tulis ucapan → tayang di layar raksasa
  if (ingin('cl_layar')) {
    const s = await club();
    await ev(s, () => { const K = __kantor; K.pindah(73.5, 0.5, -Math.PI / 2); });
    await maju(s, 2000); await kam(s, { yaw: -Math.PI / 2, pitch: 0.15, jarak: 5, y: 2.4 });
    const ke = 'kamu yang pake gaun merah', m = 'Joget bareng yuk nanti jam 8? 🥹💃';
    await adegan(s, 'cl_layar', 8, async (i, t) => {
      if (i === 5) await tekanE(s);
      if (i > 20 && i <= 50) await ketik(s, '#ucKe', ke, Math.round((i - 20) / 30 * ke.length));
      if (i > 54 && i <= 100) await ketik(s, '#ucM', m, Math.round((i - 54) / 46 * [...m].length));
      if (i === 106) await klik(s, '#ucT [data-t="pink"]');
      if (i === 124) await klik(s, '#ucKirim');
      if (i === 136) await ev(s, () => { const b = document.getElementById('clubBanner'); if (b) b.hidden = true; document.querySelectorAll('#toast').forEach(x => x.hidden = true); const K = __kantor; K.pindah(66, 0.5, Math.PI / 2); K.saya.g.visible = false; });
      if (i >= 136) await kam(s, { yaw: Math.PI / 2, pitch: 0.04, jarak: 3.5 + (i - 136) / 108 * 1.5, y: 4.2 });
    });
    await s.ctx.close();
  }
  await b.close();
})();
