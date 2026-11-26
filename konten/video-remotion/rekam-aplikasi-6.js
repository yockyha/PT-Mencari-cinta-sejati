// Rekaman untuk video #6 (grup obrolan untuk Lv.7+ / VIP / VVIP): bikin grup, chat + stiker, terima undangan.
// Jalankan situs versi terbaru di http://localhost:8765 lalu:
//   node rekam-aplikasi-6.js <folder-keluaran> [gbuat,gchat,gundang]
const { chromium } = require('playwright'); const fs = require('fs');
const { sesi, maju, rekam, ev, klik } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean);
const ingin = n => !HANYA.length || HANYA.includes(n);
const JAM = '2026-11-28T20:00:00+07:00';

// Rina = tamu VVIP Lv.9 (boleh bikin grup & pakai semua paket stiker)
const siapkan = () => { const L = __kantor.L, t = L.db.now(); return L.db.update('', { 'vip/urina': { tingkat: 'vvip', sampai: t + 30 * 86400e3 } }); };
const ketik = (s, sel, teks, i, i0, i1) => {
  if (i < i0 || i > i1) return;
  const n = Math.round((i - i0) / (i1 - i0) * [...teks].length);
  return ev(s, ([sel, v]) => { const e = document.querySelector(sel); if (e) e.value = v; }, [sel, [...teks].slice(0, n).join('')]);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const baru = async () => { const s = await sesi(b, { jam: JAM }); await ev(s, siapkan); await maju(s, 1200); return s; };

  // 1 bikin grup: tab Grup → ＋ Buat grup → nama "Pejuang Jomblo" + ikon 💘 → Buat
  if (ingin('gbuat')) {
    const s = await baru();
    await rekam(s, 'gbuat', 6, async (i) => {
      if (i === 0) await ev(s, () => __kantor.K.bukaObrolanTab('grup'));
      if (i === 24) await klik(s, '#gBuat');
      await ketik(s, '#gN', 'Pejuang Jomblo', i, 40, 90);
      if (i === 100) await klik(s, '#gI [data-i="💘"]');
      if (i === 125) await klik(s, '#gOk');
    });
    await s.ctx.close();
  }
  // 2 chat grup rame + stiker karakter
  if (ingin('gchat')) {
    const s = await baru();
    await ev(s, () => {
      const L = __kantor.L, t = L.db.now(), g = 'gdemo';
      const anggota = { urina: 'Rina', t2: 'dimas.p', t3: 'nadia.r', t6: 'ayu.ln', t9: 'fajar_' };
      return L.db.update('', {
        ['grup/' + g]: { nama: 'Pejuang Jomblo', ikon: '💘', pemilik: 'urina', t, anggota },
        ['grupku/urina/' + g]: { nama: 'Pejuang Jomblo', ikon: '💘', pemilik: 'urina', t, m: 'Grup dibuat', dari: 'urina' },
        ['grupPesan/' + g + '/a1']: { uid: 'urina', n: 'Rina', m: 'Rina membuat grup Pejuang Jomblo 💘', t: t - 60000, sis: true },
        ['grupPesan/' + g + '/a2']: { uid: 't2', n: 'dimas.p', m: 'akhirnya ada grup buat kita 😭', t: t - 50000 },
        ['grupPesan/' + g + '/a3']: { uid: 't3', n: 'nadia.r', m: 'nama grupnya relate parah', t: t - 40000 },
      });
    });
    await maju(s, 400);
    const push = (uid, n, m, st) => ev(s, ([uid, n, m, st]) => { const L = __kantor.L; L.db.push('grupPesan/gdemo', { uid, n, m, t: L.db.now(), ...(st ? { st } : {}) }); }, [uid, n, m, st]);
    await rekam(s, 'gchat', 6.5, async (i) => {
      if (i === 0) await ev(s, () => import('/kantor/grup.js?v=202611262240').then(m => m.bukaGrup('gdemo')));
      if (i === 25) await push('t6', 'ayu.ln', 'malam ini mabar ga? 🎮');
      if (i === 45) await push('t9', 'fajar_', '', 'f_gas');
      if (i === 70) await push('t2', 'dimas.p', '', 'v_jomblo');
      if (i === 100) await klik(s, '#gSb');
      if (i === 130) await klik(s, '#gSt [data-p="v_"]');
      if (i === 160) await klik(s, '#gSt [data-id="v_slay"]');
    });
    await s.ctx.close();
  }
  // 3 terima undangan grup dari teman
  if (ingin('gundang')) {
    const s = await baru();
    await ev(s, () => {
      const L = __kantor.L, t = L.db.now(), g = 'gmabar';
      return L.db.update('', {
        ['grup/' + g]: { nama: 'Mabar Tengah Malem', ikon: '🎮', pemilik: 't2', t, anggota: { t2: 'dimas.p', t9: 'fajar_' } },
        ['grupUndangan/urina/' + g]: { nama: 'Mabar Tengah Malem', ikon: '🎮', dari: 'dimas.p', pemilik: 't2', t },
      });
    });
    await maju(s, 600);
    await rekam(s, 'gundang', 4.5, async (i) => {
      if (i === 0) await ev(s, () => __kantor.K.bukaObrolanTab('grup'));
      if (i === 60) await klik(s, '[data-gy="gmabar"]');
    });
    await s.ctx.close();
  }
  await b.close();
})();
