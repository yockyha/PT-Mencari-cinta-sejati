// Rekaman untuk video #5 (Date Night malam ini): Papan Informasi LED, jadwal acara Date Night,
// hujan hati di lobi, Taman Cinta yang sudah dibuka (bianglala), dan kembang api penutup.
// Jalankan situs versi terbaru di http://localhost:8765 lalu:
//   node rekam-aplikasi-5.js <folder-keluaran> [papan,jadwal,hujan,taman,raja]
const { chromium } = require('playwright'); const fs = require('fs');
const { sesi, maju, rekam, ev } = require('./rekam-aplikasi-4.js');
const OUT = process.argv[2], HANYA = (process.argv[3] || '').split(',').filter(Boolean);
const ingin = n => !HANYA.length || HANYA.includes(n);
const V = require('fs').readFileSync('/tmp/claude-0/-home-user-PT-Mencari-cinta-sejati/b6f39f92-0519-5b23-874c-9957b4f02bef/scratchpad/situs/kantor/index.html', 'utf8').match(/kantor\.js\?v=(\d+)/)[1];
const JAM = '2026-11-27T19:20:00+07:00';

// Jadwal Date Night sama persis dengan data asli (paket acara Direktur, 27 Nov)
const isiDateNight = () => {
  const L = __kantor.L, j = (h, m) => new Date(`2026-11-27T${h}:${m}:00+07:00`).getTime(), t = L.db.now();
  const A = [
    ['a1', '👗 Date Night · Dandan Kencan', 'Pakai outfit kencan terbaikmu di Ruang Loker (dress code: merah/pink/formal), lalu foto di Photobooth lobi.', 'loker', j(19, 30), 30, 20],
    ['a2', '🎉 Date Night · Pembukaan', 'Sambutan Direktur di lobi + hujan hati.', 'lobi', j(20, '00'), 15, 20],
    ['a3', '☕ Date Night · Speed Dating', '3 menit ngobrol berdua per ronde, beri ❤ kalau cocok.', 'kafe', j(20, 15), 45, 60],
    ['a4', '🎲 Date Night · Truth or Dare Berdua', 'Ajak match-mu duduk di meja nongkrong, buka tab Seru.', 'meja', j(21, '00'), 30, 40],
    ['a5', '🎡 Date Night · Kencan di Taman Cinta', 'Pembukaan perdana Taman Cinta! Naik bianglala berdua.', 'plaza', j(21, 30), 30, 50],
    ['a6', '👑 Date Night · Raja & Ratu Kencan', 'Pasangan terpilih dapat hadiah Diamond dari Direktur!', 'lobi', j(22, '00'), 30, 40],
  ];
  const upd = {};
  for (const [k, judul, isi, lokasi, mulai, durasi, exp] of A) upd['acara/' + k] = { judul, isi, lokasi, mulai, durasi, exp, oleh: 'udir', t };
  upd['papanInfo/dn'] = { j: '💘 DATE NIGHT · MALAM INI', m: 'Jumat 19.30 WIB. Dandan kencan, speed dating, truth or dare, Taman Cinta buka perdana, Raja & Ratu Kencan!', ik: '💘', w: 'pink', pin: true, t };
  return L.db.update('', upd);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const baru = async () => { const s = await sesi(b, { jam: JAM }); await ev(s, isiDateNight); await maju(s, 1500); return s; };
  if (ingin('papan')) {
    const s = await baru();
    await ev(s, () => { const K = __kantor; K.pindah(4, 34, Math.PI * 0.85); K.saya.g.visible = false; });
    await maju(s, 1500);
    await rekam(s, 'papan', 4, async (i, t) => { await ev(s, ([t]) => Object.assign(__kantor.kam, { yaw: Math.PI * 0.85 + 0.15 - t * 0.05, pitch: 0.12, jarak: 9 - t * 0.9, y: 2.4 }), [t]); });
    await s.ctx.close();
  }
  if (ingin('jadwal')) {
    const s = await baru();
    await rekam(s, 'jadwal', 4, async (i) => {
      if (i === 0) await ev(s, ([V]) => import('/kantor/progres.js?v=' + V).then(m => m.bukaHub('acara')), [V]);
      if (i > 40) await ev(s, ([k]) => { const e = document.querySelector('#kartu .isi') || document.querySelector('#kartu'); if (e) e.scrollTop = k * 6; }, [i - 40]);
    });
    await s.ctx.close();
  }
  if (ingin('hujan')) {
    const s = await baru();
    await ev(s, () => { const K = __kantor; K.pindah(-4, 16, Math.PI * 0.9); Object.assign(K.kam, { yaw: Math.PI * 0.9 + 0.5, pitch: 0.42, jarak: 11 }); });
    await maju(s, 1500);
    // efek CSS berjalan dengan waktu nyata, jadi dipicu sedikit-sedikit tiap frame agar hujannya terlihat terus
    await rekam(s, 'hujan', 4.5, async (i) => { if (i >= 3) await ev(s, () => __kantor.K.efekLokal('hati', 5)); });
    await s.ctx.close();
  }
  if (ingin('taman')) {
    const s = await baru();
    await ev(s, () => __kantor.L.setelan({ gedung_tamanCinta: 'buka' }));
    await ev(s, () => { const K = __kantor; K.pindah(-58, 14, -Math.PI / 2); });
    await maju(s, 3000);
    await rekam(s, 'taman5', 5, async (i, t) => { await ev(s, ([t]) => Object.assign(__kantor.kam, { yaw: -Math.PI / 2 - 0.5 + t * 0.2, pitch: 0.18 + t * 0.02, jarak: 14 - t * 0.8, y: 3 }), [t]); });
    await s.ctx.close();
  }
  if (ingin('raja')) {
    const s = await baru();
    await ev(s, () => { const K = __kantor; K.pindah(0, 12, Math.PI); Object.assign(K.kam, { yaw: -0.15, pitch: 0.28, jarak: 7 }); });
    await maju(s, 1500);
    await rekam(s, 'raja', 4, async (i) => { if (i >= 3) await ev(s, () => __kantor.K.efekLokal('kembangapi', 4)); });
    await s.ctx.close();
  }
  await b.close();
})();
