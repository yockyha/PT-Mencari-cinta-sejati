// =====================================================================
//  Progres tamu: EXP & level, tugas (Tur Kantor + harian), petunjuk
//  arah, acara terjadwal, peringkat, toko (EXP & VIP),
//  dan notifikasi dari Direktur.
// =====================================================================
import { CFG, TUJUAN, LOKASI, LS, esc, fmt, bersih, levelDari, ambangLevel, hariIni, lokasiDi, kodeTamu } from '../js/common.js?v=202611280848';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, tanggalJam, kartuTerbuka } from './ui.js?v=202611280848';
import * as Musik from './musik.js?v=202611280848';
import * as Bayar from './bayar.js?v=202611280848';
import { PAKAIAN, BARANG, SLOT, lookV2 } from '../js/pakaian.js?v=202611280848';

// ---------------------------------------------------------------- DATA TUGAS
const RUANG_TUJUAN = { jodoh: 'kafe', teman: 'meja', curhat: 'taman' };
export const TUR = [
  { id: 'tur_daftar', nama: 'Isi buku tamu', exp: 20 },
  { id: 'tur_ruang', nama: 'Kunjungi ruangan sesuai tujuanmu', exp: 20 },
  { id: 'tur_sapa', nama: 'Kirim pesan pertamamu di chat', exp: 15 },
  { id: 'tur_profil', nama: 'Ketuk tamu lain untuk melihat profilnya', exp: 10 },
  { id: 'tur_loker', nama: 'Ganti penampilan di Ruang Loker', exp: 15, ke: 'loker' },
  { id: 'tur_kartu', nama: 'Cetak Kartu Tamu (lewat printer di Meja Nongkrong)', exp: 20 },
];
export const HARIAN = [
  { id: 'kopi', nama: 'Bikin kopi di Mesin Kopi Jodoh', exp: 10, ke: 'kafe' },
  { id: 'meja', nama: 'Duduk di salah satu Meja Nongkrong', exp: 10, ke: 'meja' },
  { id: 'mejaSeru', nama: 'Ikut kegiatan Meja Nongkrong (ngobrol, papan, atau Pilih Mana)', exp: 10, ke: 'meja' },
  { id: 'chat', nama: 'Kirim 3 pesan di chat', exp: 10, target: 3 },
  { id: 'ajak', nama: 'Ajak 1 orang ngobrol pribadi', exp: 15 },
  { id: 'peluk', nama: 'Peluk 1 curhat di papan curhat', exp: 10, ke: 'taman' },
  { id: 'papan', nama: 'Tulis di papan Ruang Rapat', exp: 10, ke: 'rapat' },
  { id: 'game', nama: 'Main Tangkap Hati di mesin arcade lobi', exp: 15, ke: 'lobi' },
  { id: 'koin', nama: 'Lempar koin di air mancur harapan', exp: 5, ke: 'taman' },
  { id: 'joget', nama: 'Joget 1 menit di Y.H.A Club', exp: 15, ke: 'club', gedung: 'yhaClub' },
];
const kunciHarian = id => `h${hariIni()}_${id}`;
// tugas di gedung baru baru muncul setelah gedungnya dibuka
const harianAktif = () => HARIAN.filter(t => !t.gedung || !K.gedungBuka || K.gedungBuka(t.gedung));

// ---------------------------------------------------------------- STATUS
const P = { diamond: 0, milik: {}, donatur: {}, exp: 0, beli: 0, selesai: new Set(), acara: {}, ikut: {}, hadir: {}, skorHari: {}, expSemua: {}, beliSemua: {} };
// Direktur: EXP tak terbatas, semua barang terbuka, otomatis Eksekutif
export const direkturSaya = () => !!(K.L && K.peran[K.L.uid] === 'direktur');
export const totalExp = () => (direkturSaya() ? Infinity : (P.exp || 0) + (P.beli || 0));
export const level = () => (direkturSaya() ? 99 : levelDari(totalExp()));
// tingkat langganan: '' | 'vip' | 'vvip'. Direktur = vvip (semua fitur terbuka)
export const tingkat = uid => {
  if (K.peran && K.peran[uid] === 'direktur') return 'vvip';
  const v = K.vip && K.vip[uid];
  return v && v.sampai > (K.L ? K.L.db.now() : Date.now()) ? (v.tingkat === 'vvip' ? 'vvip' : 'vip') : '';
};
export const isVip = uid => !!tingkat(uid);
export const isVvip = uid => tingkat(uid) === 'vvip';
export const vipSaya = () => K.L && isVip(K.L.uid);
export const vvipSaya = () => K.L && isVvip(K.L.uid);
K.tingkat = tingkat;
export const punyaBarang = id => direkturSaya() || !!P.milik[id];
export const saldoDiamond = () => P.diamond || 0;
export const daftarDonatur = () => P.donatur || {};
// Seragam (khusus) hanya untuk perannya: 'staf' → staf & Direktur, 'direktur' → Direktur, 'npc' → karyawan NPC saja
const bolehKhusus = o => direkturSaya() || (o.khusus === 'staf' ? !!(K.L && K.peran[K.L.uid]) : false); // Direktur boleh memakai semua pakaian, termasuk seragam karyawan
const boleh = o => !!o && (o.khusus ? bolehKhusus(o) : direkturSaya() || (o.dm || o.gacha || o.season ? punyaBarang(o.id) : o.vip ? vipSaya() : level() >= o.lv));
export const bolehBarang = id => !id || boleh(BARANG[id]);
// penampilan yang boleh dikirim ke orang lain: barang terkunci diganti bawaan
export function lookAman(look) {
  const l = lookV2(look);
  const awal = { at: 'kaos', bw: 'chino', sp: 'sneakers' };
  for (const s of Object.keys(SLOT)) if (l[s] && !boleh(BARANG[l[s]])) l[s] = awal[s] || '';
  return l;
}
const resmi = () => !!(K.resmi && K.resmi());
const menunggu = new Set(); // tugas yang EXP-nya sedang dikirim
const sudah = k => P.selesai.has(k) || menunggu.has(k);
export const selesai = id => sudah(id.startsWith('tur_') ? id : kunciHarian(id));
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');

// ---------------------------------------------------------------- MULAI
let levelLama = null;
export function mulai() {
  const L = K.L, db = L.db;
  db.on('exp/' + L.uid, v => { P.exp = (v && v.n) || 0; segarLevel(); });
  let dmLama = null;
  db.on('diamond/' + L.uid, v => { P.diamond = v || 0; if (dmLama !== null && P.diamond > dmLama) toast(`💠 +${fmt(P.diamond - dmLama)} Diamond masuk!`, 3600); dmLama = P.diamond; });
  db.on('milik/' + L.uid, v => { P.milik = v || {}; K.segarkanOrang && K.segarkanOrang(); });
  db.on('donatur', v => { P.donatur = v || {}; });
  db.on('expBeli/' + L.uid, v => { const lama = P.beli; P.beli = v || 0; if (lama && P.beli > lama) toast(`🎁 +${fmt(P.beli - lama)} EXP dari Direktur!`, 3600); segarLevel(); });
  db.on('tugas/' + L.uid, v => { P.selesai = new Set(Object.keys(v || {})); segarArah(); });
  db.on('vip', v => { const lama = tingkat(L.uid); K.vip = v || {}; const kini = tingkat(L.uid); if (kini && kini !== lama && (lama === '' || kini === 'vvip') && levelLama !== null && !direkturSaya()) rayakanVip(kini); K.segarkanOrang && K.segarkanOrang(); segarArah(); });
  db.on('acara', v => { P.acara = v || {}; segarArah(); K.gambarJadwal && K.gambarJadwal(); });
  db.on('ikutAcara', v => { P.ikut = v || {}; });
  db.on('hadirAcara', v => { P.hadir = v || {}; segarArah(); });
  db.on('exp', v => { P.expSemua = v || {}; });
  db.on('expBeli', v => { P.beliSemua = v || {}; });
  db.on('skor/' + hariIni(), v => { P.skorHari = v || {}; });
  db.on('notif/' + L.uid, v => {
    for (const [id, n] of Object.entries(v || {})) {
      if (!n) continue;
      if (['bayar', 'donasi'].includes(n.j)) tulisLog('', '📬 ' + bersih(n.m, 200), 'sys'); else tulisLog('👑 Direktur:', bersih(n.m, 200), 'dir');
      tampilNotif(n);
      L.hapusNotif(id);
    }
  });
  $('btnLv').onclick = () => bukaHub();
  $('arah').onclick = () => { if (arahSekarang && arahSekarang.aksi) arahSekarang.aksi(); };
  if (LS.get('kartuDicetak', false)) setTimeout(() => lapor('tur_kartu'), 4000);
  setInterval(() => { segarArah(); pengingatAcara(); }, 5000);
}

function segarLevel() {
  const lv = level();
  $('btnLv').textContent = direkturSaya() ? '👑 Lv ∞' : `⭐ Lv ${lv}`;
  if (levelLama !== null && lv > levelLama && !direkturSaya()) naikLevel(lv);
  levelLama = lv;
  K.segarkanOrang && K.segarkanOrang();
}

function naikLevel(lv) {
  Musik.sfx('level');
  const buka = PAKAIAN.filter(o => o.lv === lv && !o.khusus).map(o => SLOT[o.slot].ikon + ' ' + o.nama);
  tulisLog('', `⭐ Naik ke Level ${lv}!`, 'sys');
  if (kartuTerbuka()) { toast(`⭐ Naik ke Level ${lv}!${buka.length ? ' Barang baru terbuka di Ruang Loker.' : ''}`, 4000); return; }
  bukaKartu(`<div class="match"><div class="hatiBesar">⭐</div><h2>Naik ke Level ${lv}!</h2>
    ${buka.length ? `<p>Barang baru terbuka:<br><b>${buka.map(esc).join('<br>')}</b></p>` : '<p>Terus kumpulkan EXP untuk membuka outfit dan aksesoris baru.</p>'}
    <div class="baris"><button class="btn" type="button" id="lvL">Coba di Ruang Loker</button><button class="btn putih" type="button" id="lvN">Nanti</button></div></div>`, {
    pasang(i) { i.querySelector('#lvL').onclick = () => { tutupKartu(); pergiKe('loker'); }; i.querySelector('#lvN').onclick = tutupKartu; },
  });
}
// Keuntungan tiap tingkat (dipakai toko & kartu perayaan)
export const MANFAAT = {
  vip: ['💘 Lihat siapa yang diam-diam menyukaimu', '🍸 Masuk Lounge Eksekutif lewat lift lobi', '👔 Barang emas: Setelan, Sepatu, Mahkota Emas & Halo', '😎 Paket stiker VIP', '👥 Bikin grup obrolan (sampai 30 anggota, 5 grup)', '💎 Nama & lencana VIP'],
  vvip: ['✅ Semua keuntungan VIP', '🪪 Lihat nama lengkap, Instagram & TikTok tamu tanpa minta izin', '👑 Paket stiker VVIP (termasuk stiker Direktur)', '👥 Grup sampai 100 anggota & bikin 10 grup', '💌 Sapa Direktur tanpa jeda 5 menit', '✨ Cincin ungu di kaki, nama VVIP & paling atas di daftar online'],
};
function rayakanVip(t = 'vip') {
  const nama = t === 'vvip' ? 'VVIP 👑' : 'VIP 💎';
  K.efekLokal && K.efekLokal('kembangapi');
  if (kartuTerbuka()) { toast(`${nama} aktif! Selamat menikmati.`, 4500); return; }
  bukaKartu(`<div class="match"><div class="hatiBesar">${t === 'vvip' ? '👑' : '💎'}</div><h2>${nama} aktif!</h2>
    <ul class="manfaat">${MANFAAT[t].map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    <div class="baris"><button class="btn" type="button" id="vL">Ke Lounge Eksekutif</button><button class="btn putih" type="button" id="vN">Nanti</button></div></div>`, {
    pasang(i) { i.querySelector('#vL').onclick = () => { tutupKartu(); pergiKe('lounge'); }; i.querySelector('#vN').onclick = tutupKartu; },
  });
}

// ---------------------------------------------------------------- EXP (antrean, karena server membatasi 1 tulis / 3 detik)
const antre = [];
let jalan = false;
function tambah(jumlah, kunci, label) {
  let sisa = jumlah, pertama = true;
  while (sisa > 0 || pertama) { const n = Math.min(60, sisa); antre.push({ n, kunci: pertama ? kunci : null, label: pertama ? label : null, total: jumlah }); sisa -= n; pertama = false; }
  if (!jalan) proses();
}
async function proses() {
  jalan = true;
  while (antre.length) {
    const a = antre.shift();
    try {
      if (a.kunci && P.selesai.has(a.kunci)) { menunggu.delete(a.kunci); continue; }
      await K.L.tambahExp(a.n, a.kunci);
      if (a.kunci) { P.selesai.add(a.kunci); menunggu.delete(a.kunci); }
      if (a.label) toast(`+${a.total} EXP · ${a.label}`, 2600);
    } catch (e) { console.warn('exp', e); if (a.kunci) menunggu.delete(a.kunci); }
    await new Promise(r => setTimeout(r, 3200));
  }
  jalan = false;
}

// poin Season Pass = jumlah tugas harian selesai di bulan itu (kunci tugas: h<YYYYMMDD>_<id>)
export const poinMusim = ms => [...P.selesai].filter(k => k.startsWith('h' + ms)).length;
export function hadiah(n, label) { if (K.L && n > 0) tambah(n, null, label); }

// Laporkan aktivitas: otomatis memberi EXP bila tugas terkait belum selesai
export function lapor(id, n = 1) {
  if (!K.L || !K.prof || !K.prof.tj || K.terkunci || !resmi() || direkturSaya()) return;
  const tur = TUR.find(t => t.id === id);
  if (tur) { if (!sudah(id)) { menunggu.add(id); tambah(tur.exp, id, '✅ ' + tur.nama); segarArah(); } return; }
  const h = HARIAN.find(t => t.id === id);
  if (!h) return;
  const k = kunciHarian(id);
  if (sudah(k)) return;
  if (h.target) { const kh = 'hit_' + k; const c = (LS.get(kh, 0) || 0) + n; LS.set(kh, c); if (c < h.target) return; }
  menunggu.add(k); tambah(h.exp, k, '✅ ' + h.nama); segarArah();
}

// Kartu notifikasi sesuai jenisnya; juga notifikasi sistem HP/komputer bila tab sedang di belakang
function tampilNotif(n) {
  Musik.sfx(n.j === 'bayar' || n.j === 'donasi' ? 'bayar' : n.j === 'hadiah' ? 'hadiah' : 'notif');
  const m = esc(bersih(n.m, 200));
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try { new Notification(n.j === 'acc' ? '🎉 Kamu di-ACC Direktur!' : n.j === 'balasSapa' ? '👑 Direktur membalas sapaanmu' : '📬 Pesan dari Direktur', { body: bersih(n.m, 200), icon: '../favicon.svg' }); } catch (e) {}
  }
  if (n.j === 'acc') {
    const tj = K.prof && K.prof.tj, ke = RUANG_TUJUAN[tj];
    K.efekLokal && K.efekLokal('kembangapi');
    return bukaKartu(`<div class="match"><div class="hatiBesar">🎉</div><h2>Kamu di-ACC Direktur!</h2><p>${m}</p>
      <p class="kecil">Sekarang kamu bisa chat, ajak ngobrol pribadi, ikut acara, ganti baju di Ruang Loker, dan kumpulkan EXP.</p>
      <div class="baris">${ke ? `<button class="btn" type="button" id="nKe">Antar ke ${esc(LOKASI[ke].nama)}</button>` : ''}<button class="btn putih" type="button" id="nOk">Oke</button></div></div>`, {
      pasang(i) { i.querySelector('#nOk').onclick = tutupKartu; const b = i.querySelector('#nKe'); if (b) b.onclick = () => { tutupKartu(); pergiKe(ke); }; },
    });
  }
  const judul = n.j === 'balasSaran' ? '💡 Direktur membalas saranmu' : n.j === 'saranDiterima' ? '💡 Saranmu diterima Direktur' : n.j === 'balasSapa' ? '👑 Direktur membalas sapaanmu' : n.j === 'hadiah' ? '🎁 Hadiah dari Direktur' : n.j === 'bayar' ? '✅ Pembayaran berhasil' : n.j === 'donasi' ? '💖 Donasi diterima' : '📬 Pesan dari Direktur';
  if (n.j === 'hadiah' || n.j === 'balasSapa' || n.j === 'donasi') K.efekLokal && K.efekLokal('hati', 30);
  if (n.j === 'bayar') K.efekLokal && K.efekLokal('kembangapi', 50);
  const dariDir = !['bayar', 'donasi'].includes(n.j);
  if (dariDir) return bukaKartu(`<div class="suratDir"><div class="mahkotaDir">👑</div><small class="dirTag">SURAT DARI DIREKTUR UTAMA</small>
      <h2>${judul.replace(/^\S+\s/, '')}</h2>${n.s ? `<p class="kutipSaran">Saranmu: “${esc(bersih(n.s, 120))}”</p>` : ''}<p class="isiSurat">${m}</p><p class="ttdDir">— ${esc(bersih(CFG.namaDirektur || 'Direktur', 30))}<br><small>Direktur Utama ${esc(CFG.namaPT || '')}</small></p>
      <div class="baris"><button class="btn emas" type="button" id="nOk">Terima kasih, Direktur 🙏</button></div></div>`, { gaya: 'dir', pasang(i) { i.querySelector('#nOk').onclick = tutupKartu; } });
  bukaKartu(`<h2>${judul}</h2><p style="font-size:18px">${m}</p><div class="baris"><button class="btn" type="button" id="nOk">Oke</button></div>`, { pasang(i) { i.querySelector('#nOk').onclick = tutupKartu; } });
}

// Tab Harian: streak, amplop, menfess, speed dating, mood
function tabHarian() {
  const st = K.streakSaya ? K.streakSaya() : 0, h = ((Math.max(1, st) - 1) % 7) + 1;
  return {
    html: `<div class="kotakHarian"><b>🔥 Streak ${fmt(st)} hari</b><div class="streakBaris">${[1, 2, 3, 4, 5, 6, 7].map(i => `<span class="${st && i <= h ? 'on' : ''}">${i === 7 ? '💠' : '🔥'}<small>H${i}</small></span>`).join('')}</div><p class="kecil">Check-in otomatis tiap kamu datang. Tiap kelipatan 7 hari: +20 💠 Diamond.</p></div>
      <div class="kuasaGrid">
        <button type="button" data-h="game">🎮 Game Center<small>7 game + papan juara</small></button>
        <button type="button" data-h="amplop">🎁 Amplop Cinta<small>1× gratis tiap hari, isinya acak</small></button>
        <button type="button" data-h="menfess">📮 Menfess<small>Kirim pesan anonim</small></button>
        <button type="button" data-h="speed">💘 Speed Dating<small>Kenalan 3 menit, pilih ❤</small></button>
        <button type="button" data-h="mood">😶‍🌫️ Mood<small>Tampil di atas kepalamu</small></button>
        <button type="button" data-h="season">🎟️ Season Pass<small>Hadiah tiap tier bulan ini</small></button>
        <button type="button" data-h="kuis">🧠 Kuis & Tebak Lagu<small>Juara mingguan</small></button>
        <button type="button" data-h="kerupuk">🍘 Lomba Kerupuk<small>Ketuk secepatnya!</small></button>
        <button type="button" data-h="lencana">🏅 Lencana & Jabatan<small>Pamerkan gelarmu</small></button>
        <button type="button" data-h="kamar">🏠 Kamar Saya<small>Hias kamarmu sendiri</small></button>
        <button type="button" data-h="kisah">💞 Kisah Sukses<small>Pasangan dari kantor ini</small></button>
        <button type="button" data-h="undang">🎟️ Ajak Teman<small>Berdua dapat 50 💠</small></button>
      </div>`,
    pasang(el) { el.querySelectorAll('[data-h]').forEach(b => b.onclick = () => K.bukaHarian && K.bukaHarian(b.dataset.h)); },
  };
}

// ---------------------------------------------------------------- POSISI: kunjungan ruangan & absen acara
export function cekPosisi(x, z) {
  if (!K.L || !K.prof || !K.prof.tj || K.terkunci || !resmi()) return;
  const lok = lokasiDi(x, z);
  if (lok && lok === RUANG_TUJUAN[K.prof.tj]) lapor('tur_ruang');
  for (const [id, a] of acaraLive()) {
    if (a.lokasi !== lok || (P.hadir[id] && P.hadir[id][K.L.uid])) continue;
    (P.hadir[id] ||= {})[K.L.uid] = true;
    K.L.hadirAcara(id).then(() => {
      tulisLog('', `🎉 Kamu hadir di acara "${bersih(a.judul, 60)}"!`, 'sys');
      if (a.exp > 0) tambah(Math.min(200, a.exp), 'acara_' + id, '🎉 Hadir di ' + bersih(a.judul, 40));
    }).catch(() => { delete P.hadir[id][K.L.uid]; });
  }
}

// ---------------------------------------------------------------- ACARA
const kini = () => (K.L ? K.L.db.now() : Date.now());
function acaraLive() { const t = kini(); return Object.entries(P.acara).filter(([, a]) => a && t >= a.mulai && t <= a.mulai + a.durasi * 60000); }
function acaraNanti() { const t = kini(); return Object.entries(P.acara).filter(([, a]) => a && a.mulai > t).sort((a, b) => a[1].mulai - b[1].mulai); }
export const daftarAcara = () => ({ live: acaraLive(), nanti: acaraNanti() });
export const statAcara = id => ({ ikut: Object.keys(P.ikut[id] || {}).length, hadir: Object.keys(P.hadir[id] || {}).length });
export const semuaAcara = () => Object.entries(P.acara).filter(([, a]) => a).sort((a, b) => b[1].mulai - a[1].mulai);
const diingatkan = new Set();
function pengingatAcara() {
  if (!K.L) return;
  for (const [id, a] of acaraNanti()) {
    const sisa = a.mulai - kini();
    if (sisa < 10 * 60000 && P.ikut[id] && P.ikut[id][K.L.uid] && !diingatkan.has(id)) {
      diingatkan.add(id);
      toast(`⏰ "${bersih(a.judul, 40)}" mulai ${Math.max(1, Math.round(sisa / 60000))} menit lagi di ${LOKASI[a.lokasi]?.nama || ''}`, 5000);
    }
  }
  for (const [id, a] of acaraLive()) if (!diingatkan.has('live_' + id)) { diingatkan.add('live_' + id); tulisLog('', `🔴 Acara "${bersih(a.judul, 60)}" sedang berlangsung di ${LOKASI[a.lokasi]?.nama || ''}!`, 'sys'); }
}
export function pergiKe(lok) {
  const l = LOKASI[lok]; if (!l) return;
  if (l.vip && !vipSaya()) { bukaHub('toko'); toast('Lounge Eksekutif khusus VIP & VVIP 💎'); return; }
  if (l.gedung && K.gedungBuka && !K.gedungBuka(l.gedung)) { K.pindah(l.x, l.z, l.r); K.lihatProyek && K.lihatProyek(l.gedung); return; }
  if (lok === 'direktur' && K.bolehRuangDir && !K.bolehRuangDir()) { K.pindah(12.5, 16, -Math.PI / 2); K.ketukDir && K.ketukDir(); return; }
  K.pindah(l.x, l.z, l.r);
}

// ---------------------------------------------------------------- PETUNJUK ARAH
let arahSekarang = null;
export function segarArah() {
  const el = $('arah'); if (!el || !K.L) return;
  let a = null;
  const live = acaraLive().find(([id]) => !(P.hadir[id] && P.hadir[id][K.L.uid]));
  if (!resmi()) a = K.daftarku && K.daftarku.status === 'menunggu'
    ? { t: '⏳ Pendaftaranmu sedang ditinjau Direktur. Sambil menunggu, silakan lihat-lihat.', aksi: () => K.bukaDaftar() }
    : K.daftarku && K.daftarku.status === 'ditolak'
      ? { t: '📝 Pendaftaranmu belum diterima. Ketuk untuk melihat catatan & kirim ulang →', aksi: () => K.bukaDaftar() }
      : { t: '👀 Kamu sedang lihat-lihat. Daftar jadi tamu untuk ngobrol & ikut acara →', aksi: () => K.bukaDaftar() };
  else if (direkturSaya()) a = { t: '👑 Mode Direktur · buka Dashboard untuk kendali penuh →', aksi: () => { location.href = '../dashboard/index.html'; } };
  else if (live) a = { t: `🔴 LIVE: ${bersih(live[1].judul, 40)} di ${LOKASI[live[1].lokasi]?.nama || ''} · Datang →`, aksi: () => pergiKe(live[1].lokasi), live: true };
  else {
    const tur = TUR.find(t => !sudah(t.id));
    if (tur) a = { t: `👉 Langkah berikutnya: ${tur.nama} (+${tur.exp} EXP)`, aksi: () => aksiTugas(tur) };
    else {
      const h = harianAktif().find(t => !sudah(kunciHarian(t.id)));
      const [id, nx] = acaraNanti()[0] || [];
      if (nx && nx.mulai - kini() < 3 * 3600e3) a = { t: `📅 ${bersih(nx.judul, 40)} · ${tanggalJam(nx.mulai)} di ${LOKASI[nx.lokasi]?.nama || ''}`, aksi: () => bukaHub('acara') };
      else if (h) a = { t: `⭐ Tugas harian: ${h.nama} (+${h.exp} EXP)`, aksi: () => aksiTugas(h) };
      else a = { t: '🎉 Semua tugas hari ini beres! Lihat acara & peringkat →', aksi: () => bukaHub('acara') };
    }
  }
  arahSekarang = a;
  el.textContent = a.t; el.hidden = false; el.classList.toggle('live', !!a.live);
}
function aksiTugas(t) {
  if (t.id === 'tur_ruang') return pergiKe(RUANG_TUJUAN[K.prof?.tj] || 'lobi');
  if (t.id === 'tur_kartu') { location.href = '../idcard/index.html'; return; }
  if (t.id === 'tur_sapa') { $('chatI').focus(); toast('Ketik pesan lalu tekan Enter 👋'); return; }
  if (t.id === 'tur_profil') { toast('Ketuk karakter tamu lain di sekitarmu 👆'); return; }
  if (t.id === 'ajak') { toast('Ketuk tamu lain, lalu pilih 💌 Ajak ngobrol'); return; }
  if (t.id === 'chat') { $('chatI').focus(); return; }
  if (t.ke) pergiKe(t.ke);
}

// ---------------------------------------------------------------- PUSAT TAMU (hub)
const TAB = [['harian', '🎁 Harian'], ['tugas', '📋 Tugas'], ['acara', '📅 Acara'], ['peringkat', '🏆 Peringkat'], ['toko', '💎 Toko']];
export function bukaHub(tab = 'tugas') {
  const lv = level(), ex = totalExp(), a = ambangLevel(lv), b = ambangLevel(lv + 1);
  const isi = { harian: tabHarian, tugas: tabTugas, acara: tabAcara, peringkat: tabPeringkat, toko: tabToko }[tab]();
  const atas = direkturSaya()
    ? `<h2>👑 Level ∞ <span class="pillTj" style="--w:#b8860b">Direktur</span></h2><div class="bilah"><i style="width:100%"></i></div><p class="kecil">EXP tak terbatas · semua outfit & aksesoris terbuka</p>`
    : !resmi()
      ? `<h2>👀 Pengunjung</h2><p class="kecil">Lihat-lihat dulu. <button type="button" class="mini" id="hD">📝 Daftar jadi tamu</button> untuk mengerjakan tugas, ikut acara, dan kumpulkan EXP.</p>`
      : `<h2>⭐ Level ${lv}${vipSaya() ? ' <span class="pillTj" style="--w:#b8860b">💎 VIP</span>' : ''}</h2>
    <div class="bilah" role="progressbar" aria-valuemin="${a}" aria-valuemax="${b}" aria-valuenow="${ex}"><i style="width:${Math.min(100, (ex - a) / (b - a) * 100).toFixed(1)}%"></i></div>
    <p class="kecil">${fmt(ex)} EXP · ${fmt(b - ex)} EXP lagi ke Level ${lv + 1}</p>`;
  bukaKartu(`<div class="hub">${atas}
    <div class="sw teks tab">${TAB.map(([k, n]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div>${isi.html}</div></div>`, {
    pasang(el) { el.querySelectorAll('[data-tab]').forEach(x => x.onclick = () => bukaHub(x.dataset.tab)); const hd = el.querySelector('#hD'); if (hd) hd.onclick = () => K.bukaDaftar(); isi.pasang && isi.pasang(el); },
  });
}

function barisTugas(t, sudah, kunci) {
  return `<div class="${sudah ? 'beres' : ''}"><span>${sudah ? '✅' : '⬜'} ${esc(t.nama)} <small>+${t.exp} EXP</small></span>${sudah ? '' : `<button type="button" class="mini" data-tg="${esc(kunci)}">Kerjakan</button>`}</div>`;
}
function tabTugas() {
  const turSisa = TUR.filter(t => !sudah(t.id)).length;
  return {
    html: `${turSisa ? `<h3>🧭 Tur Kantor <small>(${TUR.length - turSisa}/${TUR.length})</small></h3><div class="daftar">${TUR.map(t => barisTugas(t, sudah(t.id), t.id)).join('')}</div>` : ''}
      <h3>☀️ Tugas harian <small>(reset tiap tengah malam WIB)</small></h3>
      <div class="daftar">${harianAktif().map(t => barisTugas(t, sudah(kunciHarian(t.id)), t.id)).join('')}</div>
      <p class="kecil">EXP membuka outfit & aksesoris baru di Ruang Loker. Hadir di acara Direktur juga memberi EXP.</p>`,
    pasang(el) { el.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { tutupKartu(); aksiTugas([...TUR, ...HARIAN].find(t => t.id === b.dataset.tg)); }); },
  };
}

function tabAcara() {
  const { live, nanti } = daftarAcara(), uid = K.L.uid;
  const jml = (o, id) => Object.keys((o[id]) || {}).length;
  const kartu = ([id, a], sedang) => `<div class="acara ${sedang ? 'live' : ''}"><b>${sedang ? '🔴 LIVE · ' : ''}${esc(a.judul)}</b>
      <small>${esc(LOKASI[a.lokasi]?.nama || '')} · ${esc(tanggalJam(a.mulai))} WIB · ${a.durasi} menit${a.exp ? ` · 🎁 ${a.exp} EXP` : ''}</small>
      ${a.isi ? `<p>${esc(a.isi)}</p>` : ''}
      ${/date night/i.test(a.judul) ? '<div class="baris"><button type="button" class="mini putih" data-tpl>📸 Template Story</button></div>' : ''}
      <div class="baris kecil"><span>👥 ${jml(P.ikut, id)} ikut${sedang ? ` · ${jml(P.hadir, id)} hadir` : ''}</span>
      ${sedang ? `<button type="button" class="mini" data-datang="${esc(a.lokasi)}">Datang sekarang</button>` : `<button type="button" class="mini ${P.ikut[id]?.[uid] ? 'putih' : ''}" data-ikut="${esc(id)}">${P.ikut[id]?.[uid] ? '✓ Ikut (batal)' : 'Ikut'}</button>`}</div></div>`;
  return {
    html: `${live.length ? live.map(x => kartu(x, true)).join('') : ''}
      ${nanti.length ? `<h3>Akan datang</h3>${nanti.slice(0, 8).map(x => kartu(x, false)).join('')}` : (live.length ? '' : '<p>Belum ada acara terjadwal. Pantau terus, Direktur sering bikin acara seru!</p>')}
      <p class="kecil">Tekan <b>Ikut</b> untuk diingatkan 10 menit sebelum mulai. Datang ke ruangannya saat acara berlangsung untuk absen otomatis & dapat EXP.</p>`,
    pasang(el) {
      el.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => window.open('../template/', '_blank', 'noopener'));
      el.querySelectorAll('[data-ikut]').forEach(b => b.onclick = () => { if (!resmi()) { K.bukaDaftar(); return; } const id = b.dataset.ikut, ya = !(P.ikut[id] && P.ikut[id][uid]); K.L.ikutAcara(id, ya).then(() => { (P.ikut[id] ||= {})[uid] = ya || undefined; if (!ya) delete P.ikut[id][uid]; toast(ya ? 'Kamu akan diingatkan sebelum acara mulai ⏰' : 'Batal ikut.'); bukaHub('acara'); }).catch(() => toast('Gagal. Coba lagi.')); });
      el.querySelectorAll('[data-datang]').forEach(b => b.onclick = () => { tutupKartu(); pergiKe(b.dataset.datang); });
    },
  };
}

function namaUid(uid) { return (K.tamu.find(t => t.uid === uid) || {}).n || (K.lain.get(uid) || {}).nama || 'Tamu'; }
function tabPeringkat() {
  const skor = Object.entries(P.skorHari).filter(([, v]) => v).sort((a, b) => b[1].s - a[1].s).slice(0, 10);
  const semua = new Set([...Object.keys(P.expSemua), ...Object.keys(P.beliSemua)]);
  const lv = [...semua].map(u => ({ u, e: ((P.expSemua[u] || {}).n || 0) + (P.beliSemua[u] || 0) })).sort((a, b) => b.e - a.e).slice(0, 10);
  const me = K.L.uid;
  return {
    html: `${K.rajaHati && K.rajaHati.uid ? `<div class="cocok"><b>👑 Raja/Ratu Hati minggu ini: ${esc(bersih(K.rajaHati.n, 20))}</b><br><small class="kecil">Skor Tangkap Hati tertinggi minggu lalu (${fmt(K.rajaHati.s)})</small></div>` : ''}
      <h3>🧠 Juara Kuis minggu ini</h3><div id="pkKuis"><p class="kecil">Memuat…</p></div>
      <h3>🎮 Juara Tangkap Hati hari ini</h3>
      ${skor.length ? `<ol class="peringkat">${skor.map(([u, v]) => `<li class="${u === me ? 'saya' : ''}"><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada yang main hari ini. Jadilah juara pertama di mesin arcade lobi!</p>'}
      <h3>⭐ Tamu dengan level tertinggi</h3>
      ${lv.length ? `<ol class="peringkat">${lv.map(x => `<li class="${x.u === me ? 'saya' : ''}"><span>${isVip(x.u) ? '💎 ' : ''}${esc(namaUid(x.u))}</span><b>Lv ${levelDari(x.e)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada data.</p>'}`,
    pasang(el) {
      const box = el.querySelector('#pkKuis');
      K.L.db.get('lomba/kuis/' + K.Aktivitas.mingguIni(K.L.db.now())).then(o => { const l = Object.entries(o || {}).sort((a, b) => b[1].s - a[1].s).slice(0, 5); box.innerHTML = l.length ? `<ol class="peringkat">${l.map(([u, v]) => `<li class="${u === me ? 'saya' : ''}"><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada. Main kuis di Ruang Rapat!</p>'; }).catch(() => { box.innerHTML = ''; });
    },
  };
}

const tabToko = () => Bayar.tabToko();
