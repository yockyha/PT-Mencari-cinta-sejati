// =====================================================================
//  Karyawan kantor (NPC): pemandu tiap fitur, satpam, OB, dan kurir ojol.
//  - Saat ada tamu di dekatnya: kembali ke posnya, menyapa, dan bisa
//    diketuk untuk penjelasan fitur + tombol pintasan.
//  - Saat sepi: ngobrol sesama karyawan, ngopi, pesan makan online
//    (kurir datang ke lobi), istirahat, beres-beres; OB ngepel & menyapu.
//  Disimulasikan di tiap perangkat (tidak lewat database).
// =====================================================================
import { CFG, LOKASI, esc } from '../js/common.js?v=202611260555';
import { K, toast, bukaKartu, tutupKartu } from './ui.js?v=202611260555';

const acak = a => a[Math.floor(Math.random() * a.length)];
const jarak = (a, x, z) => Math.hypot(a.x - x, a.z - z);
const sudutLerp = (a, b, t) => { const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; };
let D = null;          // dependensi dari kantor.js
const semua = [];      // karyawan aktif (termasuk kurir)
export const daftar = () => semua;

// ---------------------------------------------------------------- DATA KARYAWAN
const S = (o) => ({ v: 2, k: 1, r: 0, w: 0, wa: 0, wb: 3, kp: '', mt: '', tl: '', lh: '', tg: '', ef: '', ...o });
const STAF = [
  { id: 'ayu', n: 'Mbak Ayu', jab: 'Resepsionis', ikon: '💁‍♀️', fitur: 'resepsionis', look: S({ s: 'p', at: 'seragam', bw: 'rokPanjang', sp: 'flat', r: 5, w: 1, k: 1, tl: 'antingMutiara' }), pos: [0, 11.95], r: 0, posA: 6, duduk: true,
    sapa: ['Selamat datang di PT Mencari Cinta Sejati! Ketuk aku kalau butuh info 😊', 'Halo! Mau aku antar keliling kantor?'], kegiatan: ['pesanMakan', 'telepon'] },
  { id: 'bambang', n: 'Pak Bambang', jab: 'Satpam', ikon: '👮', fitur: 'satpam', look: S({ s: 'l', at: 'satpam', bw: 'bahan', wb: 3, sp: 'pantofel', r: 3, k: 2, mt: 'hitam' }), pos: [3.4, 22.2], r: 0,
    sapa: ['Selamat datang! Silakan masuk, jangan lupa ke resepsionis ya 🫡', 'Aman terkendali! Ada yang ganggu, lapor ke saya.'], kegiatan: ['patroli', 'patroli', 'ngobrol'] },
  { id: 'raka', n: 'Mas Raka', jab: 'Barista Kafe Jodoh', ikon: '☕', fitur: 'barista', look: S({ s: 'l', at: 'celemek', bw: 'jeans', wb: 0, sp: 'kanvas', r: 7, w: 2, k: 1 }), pos: [21.5, 2.0], r: Math.PI / 2,
    sapa: ['Mau kopi jodoh? Siapa tahu ketemu yang manis ☕💘', 'Selamat datang di Kafe Jodoh!'], kegiatan: ['antarKopi', 'ngobrol', 'bersihMeja'] },
  { id: 'nadia', n: 'Kak Nadia', jab: 'Konselor Taman Curhat', ikon: '🌷', fitur: 'konselor', look: S({ s: 'p', at: 'kardigan', wa: 10, bw: 'rokPanjang', wb: 4, sp: 'flat', kp: 'hijab', k: 2 }), pos: [16.7, -10.4], r: Math.PI,
    sapa: ['Lagi ada yang dipikirin? Cerita aja di papan curhat, anonim kok 🤗', 'Taman ini tempat aman buat cerita.'], kegiatan: ['dudukTaman', 'ngobrol', 'pesanMakan'] },
  { id: 'dimas', n: 'Bang Dimas', jab: 'Host Meja Nongkrong', ikon: '🤝', fitur: 'host', look: S({ s: 'l', at: 'seragam', bw: 'chino', wb: 1, sp: 'sneakers', r: 4, w: 0, k: 3, tl: 'headset' }), pos: [0.6, 1.5], r: Math.PI,
    sapa: ['Mau nongkrong? Ada 8 meja topik, pilih yang kamu suka! 🎮🎵🍜', 'Sini duduk, kenalan sama yang lain!'], kegiatan: ['dudukMeja', 'ngobrol', 'ngopi'] },
  { id: 'sari', n: 'Mbak Sari', jab: 'Stylist Ruang Loker', ikon: '👗', fitur: 'stylist', look: S({ s: 'p', at: 'blazer', wa: 7, bw: 'rokLipit', wb: 0, sp: 'heels', r: 1, w: 3, k: 0, mt: 'bulat', lh: 'kalung' }), pos: [-16.6, 2.2], r: -0.9,
    sapa: ['Mau ganti gaya? Banyak baju baru, makin tinggi level makin banyak yang kebuka ✨', 'Outfit kamu hari ini lucu!'], kegiatan: ['lipatBaju', 'ngobrol', 'ngopi'] },
  { id: 'laras', n: 'Kak Laras', jab: 'HRD · Tugas & Acara', ikon: '📋', fitur: 'hrd', look: S({ s: 'p', at: 'seragam', bw: 'kulot', wb: 0, sp: 'flat', r: 2, w: 1, k: 1 }), bawa: 'map', pos: [-7.6, 12.6], r: Math.PI,
    sapa: ['Udah cek tugas harian? Lumayan buat naik level 📈', 'Ada acara seru nanti, cek jadwalnya ya!'], kegiatan: ['updateMading', 'ngobrol', 'pesanMakan'] },
  { id: 'hendra', n: 'Pak Hendra', jab: 'Notulen Ruang Rapat', ikon: '📝', fitur: 'notulen', look: S({ s: 'l', at: 'kemeja', wa: 9, bw: 'bahan', wb: 1, sp: 'pantofel', r: 0, w: 7, k: 1, lh: 'dasi', mt: 'kacamata' }), pos: [-20.9, -13.5], r: Math.PI / 2, posA: 6, duduk: true,
    sapa: ['Silakan tulis agenda di papan rapat 📝', 'Rapat perasaan dimulai!'], kegiatan: ['minum', 'ngobrol'] },
  { id: 'citra', n: 'Mbak Citra', jab: 'Sekretaris Direktur', ikon: '👩‍💼', fitur: 'sekretaris', look: S({ s: 'p', at: 'blazer', wa: 6, bw: 'rokPendek', wb: 0, sp: 'heels', r: 6, w: 0, k: 0, tl: 'antingBulat' }), bawa: 'map', pos: [12.9, 14.3], r: -Math.PI / 2,
    sapa: ['Mau kasih saran ke Direktur? Lewat saya bisa 😊', 'VIP bisa buka Lounge di lantai atas lho 💎'], kegiatan: ['antarBerkas', 'ngobrol', 'pesanMakan'] },
  { id: 'bayu', n: 'Mas Bayu', jab: 'Game Master', ikon: '🎮', fitur: 'game', look: S({ s: 'l', at: 'seragam', bw: 'jogger', wb: 0, sp: 'lari', r: 7, w: 5, k: 2, kp: 'topi' }), pos: [-9.8, 17.9], r: -Math.PI / 2,
    sapa: ['Berani lawan rekor Tangkap Hati hari ini? 💗', 'Main game dapat EXP lho!'], kegiatan: ['mainGame', 'ngobrol', 'ngopi'] },
  { id: 'wati', n: 'Bu Wati', jab: 'Office Girl', ikon: '🧽', fitur: 'ob', ob: true, look: S({ s: 'p', at: 'ob', bw: 'bahan', wb: 3, sp: 'sandal', kp: 'hijab', wa: 2, k: 3 }), bawa: 'pel', pos: [-6.5, -5], r: 0,
    sapa: ['Permisi ya, lagi ngepel 🙏 Hati-hati licin!', 'Kantor harus kinclong biar tamunya betah ✨'], kegiatan: ['ngepel', 'ngepel', 'ngobrol'] },
  { id: 'ujang', n: 'Mas Ujang', jab: 'Office Boy', ikon: '🧹', fitur: 'ob', ob: true, look: S({ s: 'l', at: 'ob', bw: 'bahan', wb: 3, sp: 'sandal', kp: 'topiOb', r: 0, k: 2 }), bawa: 'sapu', pos: [11.5, -5], r: 0,
    sapa: ['Mangga, silakan lewat 🙏', 'Mau kopi? Nanti saya buatin, hehe.'], kegiatan: ['nyapu', 'nyapu', 'kopiDirektur', 'ngobrol'] },
];
const NAMA_POS = { ayu: 'Lobi', bambang: 'Pintu masuk', raka: 'Kafe Jodoh', nadia: 'Taman Curhat', dimas: 'Meja Nongkrong', sari: 'Ruang Loker', laras: 'Lobi (papan acara)', hendra: 'Ruang Rapat', citra: 'Depan Ruang Direktur', bayu: 'Mesin arcade lobi' };
export const posKaryawan = () => STAF.filter(s => NAMA_POS[s.id]).map(s => ({ id: s.id, n: s.n, jab: s.jab, ikon: s.ikon, tempat: NAMA_POS[s.id] }));

const DIALOG = [
  ['Udah makan siang belum?', 'Belum nih, pesen online yuk? 📱', 'Boleh, aku mau nasi padang 🍛', 'Sip, nanti aku pesenin!'],
  ['Tamu hari ini rame ya?', 'Iya, tadi ada yang match di Kafe Jodoh 💘', 'Wah, Direktur pasti seneng tuh'],
  ['Kamu udah coba mesin kopi jodoh?', 'Udah, katanya jodohku sederhana tapi tulus 😌', 'Cieee…'],
  ['Laporan tamu baru udah beres?', 'Udah dong, tinggal di-ACC Direktur ✅', 'Mantap!'],
  ['AC-nya dingin banget ya 🥶', 'Biar hati nggak panas liat mantan', 'Hahaha bisa aja'],
  ['Papan curhat rame hari ini', 'Semoga semua tamu dapet yang terbaik ya 🤍', 'Aamiin'],
  ['Weekend mau ke mana?', 'Mau cari ide di meja Jalan-jalan ✈️', 'Ajak-ajak dong!'],
  ['Seragam baru kita kece ya 💗', 'Pink-nya bikin semangat kerja!', 'Setuju!'],
  ['Wifi kantor lancar?', 'Lancar. Yang buffering cuma perasaan 😅', 'Klasik…'],
  ['Karyawan boleh cari jodoh juga nggak sih?', 'Daftar jadi tamu dulu 🤭', 'Wkwk iya juga'],
  ['Tadi Direktur lewat, pakai jas baru!', 'Iya, keren banget pakai dasi emas 👔', 'Wibawanya beda'],
  ['Lantai lobi udah dipel?', 'Udah kinclong, sampai bisa ngaca ✨', 'Makasih banyak!'],
];
const MAKANAN = ['nasi padang 🍛', 'mie ayam 🍜', 'ayam geprek 🍗', 'martabak 🥞', 'seblak 🌶️', 'sate ayam 🍢', 'bakso 🍲', 'es kopi susu 🧋'];

// ---------------------------------------------------------------- PEMBUATAN
function pasangModel(o) {
  const lama = o.g;
  o.g = D.buatKarakter(o.look, { peran: 'karyawan', bawa: o.bawaKini || '' });
  o.g.add(D.labelNama(`${o.ikon} ${o.n} · ${o.jab}`, o.kurir ? '' : 'staf'));
  if (lama) { if (o.gel) { lama.remove(o.gel); o.g.add(o.gel); } D.scene.remove(lama); }
  o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.r;
  D.scene.add(o.g);
}
function pakai(o, bawa) { if (o.bawaKini === bawa) return; o.bawaKini = bawa; pasangModel(o); }

export function mulai(dep) {
  D = dep;
  STAF.forEach((d, i) => {
    const o = { ...d, karyawan: true, x: d.pos[0], z: d.pos[1], a: d.posA || 0, posR: d.r, tugas: [], gel: null, gelT: 0, sapaT: 0, idleT: 15 + i * 6 + Math.random() * 20, bawaKini: d.bawa || '' };
    // karyawan yang kerja sambil duduk: pakai kursi di posnya (atau kursi khusus yang tidak bisa diduduki tamu)
    if (d.duduk) { const k = kursiDekat(d.pos[0], d.pos[1], 0.6, false) || { x: d.pos[0], z: d.pos[1], r: d.r, y: 0.47 }; k.oleh = o; o.kursiPos = k; o.kursi = k; o.x = k.x; o.z = k.z; o.r = k.r; }
    pasangModel(o); semua.push(o);
  });
}

function kursiDekat(x, z, maks = 30, bebas = true) {
  let best = null, bd = maks;
  for (const k of D.kursi) { if (bebas && k.oleh) continue; const d = Math.hypot(k.x - x, k.z - z); if (d < bd) { bd = d; best = k; } }
  return best;
}
const pemain = () => D.saya;
const pemainDekat = (x, z, r) => jarak(pemain(), x, z) < r || [...K.lain.values()].some(o => jarak(o, x, z) < r);

// ---------------------------------------------------------------- RENCANA (daftar langkah)
// langkah: {ke:[x,z]} jalan lewat jalur, {lurus:[[x,z],...]} jalan lurus, {tunggu:dt, a, bicara, hadap:[x,z]|o}, {fn}, {kumpul}, {sampai: () => bool}
function ke(x, z) { return { ke: [x, z] }; }
function tunggu(t, a = 0, bicara = '', hadap = null) { return { tunggu: t, a, bicara, hadap }; }
function dudukDi(k, t, a = 2, bicara = '') { return { duduk: k, tunggu: t, a, bicara }; }
const pulang = o => [ke(o.pos[0], o.pos[1]), { fn: o => { o.r = o.posR ?? o.r; } }];

function bebas(o) { return !o.tugas.length && !o.kurir; }
function partnerBebas(o) {
  const l = semua.filter(p => p !== o && bebas(p) && !p.duduk && !p.kurir && !pemainDekat(p.pos[0], p.pos[1], 12));
  return l.sort((a, b) => jarak(a, o.x, o.z) - jarak(b, o.x, o.z))[0];
}

const KEGIATAN = {
  ngobrol(o) {
    const p = partnerBebas(o); if (!p) return null;
    const mx = (o.x + p.x) / 2, mz = (o.z + p.z) / 2;
    const n = D.simpulTerdekat(mx, mz), [nx, nz] = D.NAV[n];
    const kumpul = { n: 2, tiba: 0 };
    const dlg = acak(DIALOG);
    const susun = (aku, dia, giliran, dx) => {
      const l = [ke(nx + dx, nz), { kumpul }, tunggu(0.6, 0, '', dia)];
      dlg.forEach((k, i) => l.push(tunggu(3.4, i % 2 === giliran ? 0 : 0, i % 2 === giliran ? k : '', dia)));
      if (dlg === DIALOG[0] && giliran === 1) l.push({ fn: aku => { aku.tugas.push(...KEGIATAN.pesanMakan(aku, true)); } });
      return l;
    };
    p.tugas = [...susun(p, o, 1, 0.55), ...pulang(p)];
    return [...susun(o, p, 0, -0.55)];
  },
  ngopi(o) {
    const k = kursiDekat(18, 2.5, 7);
    return [ke(21.4, 0.6), tunggu(3, 0, '☕ Ngopi dulu ah', [23.1, 1]), ...(k ? [dudukDi(k, 14, 4, 'Kopi sore paling enak 😌')] : [tunggu(10, 4)])];
  },
  pesanMakan(o, dariObrolan) {
    const m = acak(MAKANAN);
    const pesanan = { tiba: false, diambil: false, untuk: o };
    const l = [tunggu(2.5, 4, `📱 Pesen ${m} online ah…`), { fn: () => kirimKurir(pesanan, m) }];
    if (o.duduk) return [...l, { sampai: () => pesanan.tiba }, tunggu(2.5, 5, 'Makasih Bang! ⭐⭐⭐⭐⭐'), { fn: () => { pesanan.diambil = true; } }, tunggu(18, 4, `Nyam… ${m} enak banget!`)];
    const k = () => kursiDekat(18, 2.5, 8);
    return [...l, tunggu(dariObrolan ? 6 : 10, 0), ke(-0.9, 14.6), { sampai: () => pesanan.tiba }, tunggu(2.2, 5, 'Makasih Bang! ⭐⭐⭐⭐⭐'), { fn: o => { pesanan.diambil = true; pakai(o, 'paket'); } },
      ke(19.6, 2.5), { fn: o => { const kk = k(); o.tugas.unshift(kk ? dudukDi(kk, 20, 4, `Nyam… ${m} enak banget! 😋`) : tunggu(14, 4)); } },
      { fn: o => pakai(o, o.bawa || '') }];
  },
  telepon(o) { return [tunggu(5, 4, acak(['📞 Halo, PT Mencari Cinta Sejati, ada yang bisa dibantu?', '📞 Baik, nanti saya sampaikan ke Direktur ya.', '📞 Pendaftaran tamu bisa lewat jodohonline.company/daftar ya kak!']))]; },
  patroli(o) { return [ke(0, 16.5), tunggu(2, 0, 'Lobi aman 👍'), ke(-8, 12.5), tunggu(1.5), ke(8, 12.5), tunggu(1.5, 0, 'Semua aman terkendali 🫡')]; },
  antarKopi(o) {
    const k = kursiDekat(18, -2.5, 9, false);
    return [{ fn: o => pakai(o, 'nampan') }, ke(k ? k.x + 0.6 : 17, k ? k.z : -1.2), tunggu(2.5, 0, 'Kopi spesial, silakan ☕'), { fn: o => pakai(o, '') }];
  },
  bersihMeja(o) { return [ke(17.2, 6.4), tunggu(5, 3, 'Lap meja dulu biar kinclong ✨'), ke(17.2, -1.4), tunggu(4, 3)]; },
  dudukTaman(o) {
    const k = kursiDekat(16, -13.5, 3) || kursiDekat(22, -13.5, 3);
    return k ? [dudukDi(k, 18, 2, acak(['Hmm, hari ini banyak yang curhat…', 'Udara taman seger banget 🌿']))] : null;
  },
  dudukMeja(o) {
    const l = D.MEJA.map(m => kursiDekat(m.x, m.z, 1.9)).filter(Boolean);
    const k = acak(l); if (!k) return null;
    const m = D.MEJA.find(m => Math.abs(m.x - k.x) < 1.6 && Math.abs(m.z - k.z) < 1.8);
    return [dudukDi(k, 18, 6, m ? `Meja ${m.topik} lagi sepi nih, sini gabung!` : '')];
  },
  lipatBaju(o) { return [ke(-22.6, 3.2), tunggu(6, 3, 'Lipet baju dulu 👕'), ke(-22.6, 7.6), tunggu(4, 3, 'Koleksi baru udah dateng ✨')]; },
  updateMading(o) { return [ke(10, 11.4), tunggu(5, 3, 'Update mading dulu 📌', [10, 10.15]), ke(-10, 11.6), tunggu(4, 0, 'Jadwal acara aman ✅', [-10, 10.15])]; },
  minum(o) { return [ke(-12.6, -4.4), tunggu(4, 4, 'Glek… 💧 segar', [-13, -5.2])]; },
  antarBerkas(o) { return [ke(16.5, 16), tunggu(4, 0, 'Pak/Bu Direktur, ini berkas tamu baru 📁', [20.6, 16])]; },
  mainGame(o) { return [ke(-11.5, 17.6), tunggu(8, 6, acak(['Rekor baru!! 🎮', 'Dikit lagi tembus 200 poin…']), [-11.5, 19.2])]; },
  ngepel(o) {
    const n = acak(['lobi', 'lobiB', 'lobiT', 'aisle', 'tengah', 'tengahB', 'tengahT', 'utara', 'utaraB', 'dinding', 'pantry', 'rapat2', 'loker']);
    const [x, z] = D.NAV[n];
    return [ke(x + (Math.random() - 0.5) * 2, z + (Math.random() - 0.5) * 2), { fn: o => D.rambuBasah(o.x + 0.8, o.z, 14) }, tunggu(9, 3, acak(['Awas licin ya! 🧽', 'Lantai kinclong ✨', 'Permisi, lagi ngepel 🙏']))];
  },
  nyapu(o) {
    const n = acak(['lobi', 'lobiB', 'lobiT', 'aisle', 'tengahT2', 'tengahB2', 'utaraT', 'dinding2', 'pantryS', 'taman', 'direkturPintu']);
    const [x, z] = D.NAV[n];
    return [ke(x + (Math.random() - 0.5) * 2, z + (Math.random() - 0.5) * 2), tunggu(8, 3, acak(['Sapu dulu biar bersih 🧹', 'Siapa nih buang bungkus permen sembarangan…', '']))];
  },
  kopiDirektur(o) { return [{ fn: o => pakai(o, 'nampan') }, ke(16.5, 16), tunggu(3, 0, 'Kopinya, Direktur ☕', [20.6, 16]), { fn: o => pakai(o, o.bawa) }]; },
};

// ---------------------------------------------------------------- KURIR OJOL
function kirimKurir(pesanan, makanan) {
  setTimeout(() => {
    const o = { id: 'ojol' + Date.now(), n: 'Bang Ojol', jab: 'Kurir', ikon: '🛵', kurir: true, karyawan: true,
      look: S({ s: 'l', at: 'ojol', bw: 'jeans', wb: 0, sp: 'sneakers', kp: 'helm', k: 2 }), x: 1.6, z: 47, r: Math.PI, a: 0, tugas: [], gel: null, gelT: 0, sapaT: 0, bawaKini: 'box', pos: [1.6, 47] };
    const tujuan = [0.6, 15.2];
    o.tugas = [{ lurus: [[1.2, 30], [0, 23]] }, ke(...tujuan), tunggu(1.5, 5, `Paket atas nama ${pesanan.untuk.n}! ${makanan}`, pesanan.untuk), { fn: () => { pesanan.tiba = true; } },
      { sampai: () => pesanan.diambil, batas: 40 }, tunggu(2, 5, 'Makasih, jangan lupa bintang 5 ya! 🙏'), ke(0, 23), { lurus: [[1.2, 30], [1.6, 47]] }, { fn: o => { o.hapus = true; } }];
    pasangModel(o); semua.push(o);
  }, 9000 + Math.random() * 6000);
}

// ---------------------------------------------------------------- UPDATE PER FRAME
export function update(dt) {
  if (!D) return;
  const p = pemain();
  for (let i = semua.length - 1; i >= 0; i--) {
    const o = semua[i];
    if (o.hapus) { D.scene.remove(o.g); semua.splice(i, 1); continue; }
    langkah(o, dt);
    o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.r;
    D.pose(o.g, o.a, dt, 1, !!o.kursi && o.a !== 1);
    if (o.gel) { o.gelT -= dt; if (o.gelT <= 0) { o.g.remove(o.gel); o.gel.material.map.dispose(); o.gel = null; } }
    // sapa tamu yang mendekat
    o.sapaT -= dt;
    if (!o.kurir && o.sapaT <= 0 && jarak(p, o.x, o.z) < 3.6 && !o.gel) { o.sapaT = 75; D.bicara(o, acak(o.sapa)); }
  }
}

function hadapKe(o, x, z, dt) { o.r = sudutLerp(o.r, Math.atan2(x - o.x, z - o.z), Math.min(1, dt * 6)); }
function lepasKursi(o) { if (o.kursi) { if (o.kursi !== o.kursiPos) o.kursi.oleh = null; o.kursi = null; } }

function langkah(o, dt) {
  const p = pemain();
  // pemandu kembali ke pos saat tamu datang
  if (!o.ob && !o.kurir && o.tugas.length && !o.dipanggil && pemainDekat(o.pos[0], o.pos[1], 9) && jarak(o, o.pos[0], o.pos[1]) > 1) {
    if (!o.tugas.some(t => t.kumpul || t.sampai)) { lepasKursi(o); o.tugas = [...pulang(o)]; o.dipanggil = true; D.bicara(o, 'Eh ada tamu! Sebentar ya 🏃'); }
  }
  const t = o.tugas[0];
  if (!t) {
    o.dipanggil = false;
    if (!o.kurir && jarak(o, o.pos[0], o.pos[1]) > 0.35) { o.tugas.push(...pulang(o)); return; }
    // jaga pos
    if (o.kursiPos) { o.kursiPos.oleh = o; o.kursi = o.kursiPos; o.x = o.kursiPos.x; o.z = o.kursiPos.z; o.r = sudutLerp(o.r, o.kursiPos.r, Math.min(1, dt * 6)); o.a = o.posA || 2; }
    else { o.a = 0; if (jarak(p, o.x, o.z) < 6) hadapKe(o, p.x, p.z, dt); else o.r = sudutLerp(o.r, o.posR, Math.min(1, dt * 3)); }
    o.idleT -= dt;
    if (o.idleT <= 0) {
      o.idleT = 25 + Math.random() * 35;
      if (o.ob || !pemainDekat(o.pos[0], o.pos[1], 12)) {
        const keg = KEGIATAN[acak(o.kegiatan)];
        const l = keg && keg(o);
        if (l && l.length) o.tugas = [...l, ...pulang(o)];
      }
    }
    return;
  }
  if (t.ke || t.lurus) {
    if (!t.rute) {
      if (t.ke && jarak(o, t.ke[0], t.ke[1]) < 0.35) { o.tugas.shift(); return; }
      if (o.kursi && o.kursi === o.kursiPos) { o.kursiPos.oleh = null; }
      lepasKursi(o);
      t.rute = t.lurus ? t.lurus.slice() : [...D.jalur(D.simpulTerdekat(o.x, o.z), D.simpulTerdekat(t.ke[0], t.ke[1])).map(n => D.NAV[n]), t.ke];
    }
    const [tx, tz] = t.rute[0];
    const dx = tx - o.x, dz = tz - o.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { t.rute.shift(); if (!t.rute.length) { o.tugas.shift(); o.a = 0; if (o.kursiPos && jarak(o, o.kursiPos.x, o.kursiPos.z) < 0.4) { o.kursiPos.oleh = o; o.kursi = o.kursiPos; } } return; }
    const v = (o.kurir ? 2.6 : 1.9) * dt;
    o.x += dx / d * Math.min(v, d); o.z += dz / d * Math.min(v, d);
    o.r = sudutLerp(o.r, Math.atan2(dx, dz), Math.min(1, dt * 8)); o.a = 1;
    return;
  }
  if (t.kumpul) { if (!t.sudah) { t.sudah = true; t.kumpul.tiba++; } o.a = 0; if (t.kumpul.tiba >= t.kumpul.n) o.tugas.shift(); else if ((t.batasT = (t.batasT || 0) + dt) > 40) o.tugas = []; return; }
  if (t.sampai) { o.a = o.kursi ? (o.posA || 2) : 0; if (t.sampai() || (t.batas && (t.batasT = (t.batasT || 0) + dt) > t.batas)) o.tugas.shift(); return; }
  if (t.fn && t.tunggu === undefined) { o.tugas.shift(); t.fn(o); return; }
  if (t.tunggu !== undefined) {
    if (!t.mulai) {
      t.mulai = true;
      if (t.duduk) { if (t.duduk.oleh && t.duduk.oleh !== o) { o.tugas.shift(); return; } lepasKursi(o); t.duduk.oleh = o; o.kursi = t.duduk; o.x = t.duduk.x; o.z = t.duduk.z; o.r = t.duduk.r; }
      if (t.bicara) D.bicara(o, t.bicara);
    }
    o.a = t.a;
    if (t.hadap) { const h = Array.isArray(t.hadap) ? t.hadap : [t.hadap.x, t.hadap.z]; hadapKe(o, h[0], h[1], dt); }
    t.tunggu -= dt;
    if (t.tunggu <= 0) { o.tugas.shift(); if (t.duduk) lepasKursi(o); if (o.kursi && !o.tugas.some(x => x.tunggu !== undefined && !x.ke)) {} }
  }
}

// ---------------------------------------------------------------- KETUK: PANDUAN FITUR
const PANDUAN = {
  resepsionis: o => ({ isi: `<p>Selamat datang di <b>${esc(CFG.namaPT)}</b>! Di sini kamu bisa <b>💘 cari jodoh</b>, <b>🤝 cari teman</b>, atau <b>💬 curhat</b>.</p>
      <p class="kecil">Tiap ruangan punya karyawan yang siap bantu. Ketuk mereka buat penjelasan fitur:</p>
      <div class="daftar">${posKaryawan().filter(k => k.id !== 'ayu').map(k => `<div><span>${k.ikon} <b>${esc(k.n)}</b> · ${esc(k.jab)}<br><small>📍 ${esc(k.tempat)}</small></span><button type="button" class="mini" data-antar="${k.id}">Antar</button></div>`).join('')}</div>`,
    tombol: [['🗺️ Info kantor', 'resepsionis'], ...(K.resmi && !K.resmi() ? [['📝 Daftar jadi tamu', 'daftar']] : [])] }),
  satpam: () => ({ isi: `<p>Saya jaga biar kantor tetap aman dan nyaman. Ingat ya:</p>
      <ul><li>Ada yang ganggu? Ketuk orangnya → <b>🚩 Laporkan</b> atau <b>🙈 Sembunyikan</b>.</li><li>Obrolan pribadi cuma bisa dibaca kalian berdua, Direktur juga nggak bisa baca.</li><li>Jangan kasih nomor HP, alamat, atau data pribadi ke orang yang baru dikenal.</li><li>Telepon cuma bisa kalau obrolan pribadi sudah saling diterima. Kamu bebas menolak.</li></ul>`, tombol: [['🗺️ Info kantor', 'resepsionis']] }),
  barista: () => ({ isi: `<p>Ini <b>Kafe Jodoh</b>, tempatnya yang 💘 cari jodoh.</p>
      <ul><li><b>☕ Mesin Kopi Jodoh</b>: ramalan cinta + saran tamu yang juga lagi cari jodoh.</li><li>Duduk di <b>meja bundar kafe</b> buat ngobrol bareng, pasang ajakan ngopi, dan main "Pilih Mana?".</li><li>Ketuk tamu lain → <b>❤ Suka</b>. Kalau saling suka, jadi <b>match</b> dan bisa telepon 📞.</li></ul>`, tombol: [['☕ Bikinin kopi jodoh', 'kopi'], ['🪑 Antar ke meja kafe', 'mejaKafe']] }),
  konselor: () => ({ isi: `<p>Taman ini <b>ruang aman</b>. Kamu bisa:</p><ul><li>Tulis di <b>💬 Papan Curhat</b>, namamu tidak ditampilkan.</li><li>Kasih <b>🤗 pelukan</b> atau balasan yang menguatkan ke curhat orang lain.</li><li>Lempar koin di <b>🪙 air mancur harapan</b>.</li></ul><p class="kecil">Kalau lagi berat banget, jangan dipendam sendiri ya. Ngobrol sama orang terdekat atau tenaga profesional 🤍</p>`,
    tombol: [['💬 Buka papan curhat', 'curhat'], ['🪙 Lempar koin', 'koin']] }),
  host: () => ({ isi: `<p>Duduk di salah satu <b>meja topik</b> dan langsung kebuka panel meja: obrolan grup, papan kegiatan khas topik, dan permainan "Pilih Mana?".</p>
      <div class="sw teks">${D.MEJA.map((m, i) => `<button type="button" data-meja="${i}">${esc(m.topik)}</button>`).join('')}</div>`, tombol: [] }),
  stylist: () => ({ isi: `<p>Lemari di sini dibagi per jenis: <b>atasan</b> (kaos, kemeja, hoodie, jaket, formal, dress), <b>bawahan</b> (celana, rok, sarung), <b>sepatu</b>, dan <b>aksesoris</b> (kepala, kacamata, anting, kalung, tas, efek). Ada pilihan <b>👨 Pria</b> & <b>👩 Wanita</b>.</p>
      <ul><li>🔒 Barang terkunci terbuka sesuai <b>level</b>. Naik level dengan tugas harian, acara, dan game.</li><li>💠 Barang Diamond bisa dibeli di Toko.</li><li>💎 Barang emas khusus VIP & VVIP.</li></ul>`, tombol: [['👔 Buka lemari', 'loker'], ['💠 Lemari Diamond', 'toko']] }),
  hrd: () => ({ isi: `<p>Kumpulkan <b>EXP</b> buat naik level dan buka baju baru:</p><ul><li>✅ <b>Tugas harian</b>: ngopi, duduk di meja, chat, peluk curhat, main game, dll.</li><li>📅 <b>Acara</b> dari Direktur: hadir di lokasi saat acara berlangsung.</li><li>🏆 <b>Peringkat</b> tamu & skor game harian.</li></ul>`,
    tombol: [['✅ Tugas harian', 'tugas'], ['📅 Jadwal acara', 'acara'], ['🏆 Peringkat', 'peringkat']] }),
  notulen: () => ({ isi: `<p>Ruang Rapat Perasaan: tulis agenda, kata-kata semangat, atau salam di <b>papan rapat</b>. Semua orang bisa baca. Di koridor ada <b>📖 buku tamu</b> berisi semua tamu yang sudah datang.</p>`,
    tombol: [['✍ Tulis di papan rapat', 'papan'], ['📖 Lihat buku tamu', 'bukuTamu']] }),
  sekretaris: () => ({ isi: `<p>Saya bantu urusan dengan Direktur:</p><ul><li>💡 Kirim <b>saran</b> atau masukan untuk Direktur.</li><li>💎 <b>VIP</b>: lihat siapa yang menyukaimu, akses Lounge Eksekutif, dan barang emas.</li><li>💠 Top up <b>Diamond</b> & lemari Diamond di Toko.</li></ul>`,
    tombol: [['💡 Kirim saran', 'saran'], ['🛍️ Toko & VIP', 'toko'], ['💎 Ke Lounge', 'lounge']] }),
  game: () => ({ isi: `<p><b>💗 Tangkap Hati</b>: tangkap hati yang jatuh pakai keranjang, hindari 💔. Skor tertinggi tiap hari masuk peringkat, dan main sekali sehari dapat EXP!</p>`, tombol: [['🎮 Main sekarang', 'arcade'], ['🏆 Peringkat', 'peringkat']] }),
  ob: o => ({ isi: `<p>${esc(acak(['Kantor harus bersih biar tamunya betah. Saya pel dari pagi lho! 🧽', 'Kalau lihat lantai basah, hati-hati ya. Nanti kepeleset kayak jatuh cinta 😆', 'Ssst… saya kasih tahu rahasia kantor ya.']))}</p>
      <p><b>🤫 Rahasia kantor:</b></p><ul><li>🧊 Buka <b>kulkas pantry</b>, siapa tahu ada camilan.</li><li>🍱 <b>Microwave</b> & 💧 <b>dispenser</b> bisa dipakai.</li><li>🪴 <b>Siram tanaman</b> di dalam kantor.</li><li>📸 Foto di <b>patung hati</b> depan kantor, hasilnya bisa disimpan!</li></ul>`, tombol: [['📸 Antar ke patung hati', 'patung']] }),
};

export function ketuk(o) {
  if (o.kurir) { D.bicara(o, 'Lagi antar pesanan, permisi ya! 🛵'); return; }
  const pd = PANDUAN[o.fitur](o);
  D.bicara(o, acak(o.sapa));
  bukaKartu(`<h2>${o.ikon} ${esc(o.n)}</h2><p class="kecil" style="margin-top:-6px">🪪 Karyawan ${esc(CFG.namaPT)} · ${esc(o.jab)}</p>
    ${pd.isi}<div class="baris">${pd.tombol.map(([l, k]) => `<button class="btn ${k === pd.tombol[0][1] ? '' : 'putih'}" type="button" data-f="${k}">${l}</button>`).join('')}</div>`, {
    pasang(isi) {
      isi.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { tutupKartu(); D.fitur[b.dataset.f] && D.fitur[b.dataset.f](); });
      isi.querySelectorAll('[data-antar]').forEach(b => b.onclick = () => { const s = STAF.find(x => x.id === b.dataset.antar); tutupKartu(); D.pindah(s.pos[0] + Math.sin(s.r) * 1.6, s.pos[1] + Math.cos(s.r) * 1.6, s.r + Math.PI); toast(`Ini ${s.n}, ketuk untuk tanya-tanya 😊`); });
      isi.querySelectorAll('[data-meja]').forEach(b => b.onclick = () => { tutupKartu(); D.fitur.keMeja(+b.dataset.meja); });
    },
  });
}

// ---------------------------------------------------------------- MENYAMBUT DIREKTUR
// karyawan di sekitar berhenti sebentar, menghadap & menyapa Direktur
export function sambut(t) {
  if (!D || !t) return;
  for (const o of semua) {
    if (o.kurir || jarak(o, t.x, t.z) > 18) continue;
    o.tugas.unshift(tunggu(2.8, 5, acak(['Selamat datang, Direktur! 🙇', 'Pagi, Direktur! 🫡', 'Siap, Direktur! Semua aman 👍', 'Wah, Direktur datang! ✨']), t));
  }
}
// Direktur memanggil semua karyawan berkumpul di sekitarnya
export function panggil(t) {
  if (!D || !t) return;
  const l = semua.filter(o => !o.kurir);
  l.forEach((o, i) => {
    const a = (i / l.length) * Math.PI * 2;
    lepasKursi(o); if (o.kursiPos) o.kursiPos.oleh = null;
    o.tugas = [ke(t.x + Math.sin(a) * 2.6, t.z + Math.cos(a) * 2.6), tunggu(6, 5, acak(['Siap, Direktur! 🫡', 'Hadir! 🙋', 'Ada tugas apa, Direktur?', 'Siap laksanakan! 💪']), t)];
    o.dipanggil = true;
  });
}

// karyawan terdekat untuk tombol aksi
export function terdekat(x, z, r = 2.2) {
  let best = null, bd = r;
  for (const o of semua) { const d = jarak(o, x, z); if (d < bd) { bd = d; best = o; } }
  return best;
}
