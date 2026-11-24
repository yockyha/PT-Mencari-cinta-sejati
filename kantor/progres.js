// =====================================================================
//  Progres tamu: EXP & level, tugas (Tur Kantor + harian), petunjuk
//  arah, acara terjadwal, peringkat, toko (EXP & Kartu Eksekutif),
//  dan notifikasi dari Direktur.
// =====================================================================
import { CFG, TUJUAN, LOKASI, OUTFIT, AKSESORIS, LS, esc, fmt, bersih, levelDari, ambangLevel, hariIni, lokasiDi, kodeTamu } from '../js/common.js';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, tanggalJam, kartuTerbuka } from './ui.js';

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
  { id: 'chat', nama: 'Kirim 3 pesan di chat', exp: 10, target: 3 },
  { id: 'ajak', nama: 'Ajak 1 orang ngobrol pribadi', exp: 15 },
  { id: 'peluk', nama: 'Peluk 1 curhat di papan curhat', exp: 10, ke: 'taman' },
  { id: 'papan', nama: 'Tulis di papan Ruang Rapat', exp: 10, ke: 'rapat' },
  { id: 'game', nama: 'Main Tangkap Hati di mesin arcade lobi', exp: 15, ke: 'lobi' },
  { id: 'koin', nama: 'Lempar koin di air mancur harapan', exp: 5, ke: 'taman' },
];
const kunciHarian = id => `h${hariIni()}_${id}`;

// ---------------------------------------------------------------- STATUS
const P = { exp: 0, beli: 0, selesai: new Set(), acara: {}, ikut: {}, hadir: {}, skorHari: {}, expSemua: {}, beliSemua: {} };
export const totalExp = () => (P.exp || 0) + (P.beli || 0);
export const level = () => levelDari(totalExp());
export const isVip = uid => !!(K.vip && K.vip[uid] && K.vip[uid].sampai > (K.L ? K.L.db.now() : Date.now()));
export const vipSaya = () => K.L && isVip(K.L.uid);
export const bolehOutfit = i => { const o = OUTFIT[i]; return !!o && (o.vip ? vipSaya() : level() >= o.lv); };
export const bolehAks = i => { const o = AKSESORIS[i]; return !!o && (o.vip ? vipSaya() : level() >= o.lv); };
const menunggu = new Set(); // tugas yang EXP-nya sedang dikirim
const sudah = k => P.selesai.has(k) || menunggu.has(k);
export const selesai = id => sudah(id.startsWith('tur_') ? id : kunciHarian(id));
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');

// ---------------------------------------------------------------- MULAI
let levelLama = null;
export function mulai() {
  const L = K.L, db = L.db;
  db.on('exp/' + L.uid, v => { P.exp = (v && v.n) || 0; segarLevel(); });
  db.on('expBeli/' + L.uid, v => { const lama = P.beli; P.beli = v || 0; if (lama && P.beli > lama) toast(`🎁 +${fmt(P.beli - lama)} EXP dari Direktur!`, 3600); segarLevel(); });
  db.on('tugas/' + L.uid, v => { P.selesai = new Set(Object.keys(v || {})); segarArah(); });
  db.on('vip', v => { const lama = vipSaya(); K.vip = v || {}; if (!lama && vipSaya() && levelLama !== null) rayakanVip(); K.segarkanOrang && K.segarkanOrang(); segarArah(); });
  db.on('acara', v => { P.acara = v || {}; segarArah(); K.gambarJadwal && K.gambarJadwal(); });
  db.on('ikutAcara', v => { P.ikut = v || {}; });
  db.on('hadirAcara', v => { P.hadir = v || {}; segarArah(); });
  db.on('exp', v => { P.expSemua = v || {}; });
  db.on('expBeli', v => { P.beliSemua = v || {}; });
  db.on('skor/' + hariIni(), v => { P.skorHari = v || {}; });
  db.on('notif/' + L.uid, v => {
    for (const [id, n] of Object.entries(v || {})) {
      if (!n) continue;
      tulisLog('', '📬 ' + bersih(n.m, 200), 'sys');
      bukaKartu(`<h2>📬 Pesan dari Direktur</h2><p>${esc(bersih(n.m, 200))}</p><div class="baris"><button class="btn" type="button" id="nOk">Oke</button></div>`, { pasang(i) { i.querySelector('#nOk').onclick = tutupKartu; } });
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
  $('btnLv').textContent = `⭐ Lv ${lv}`;
  if (levelLama !== null && lv > levelLama) naikLevel(lv);
  levelLama = lv;
  K.segarkanOrang && K.segarkanOrang();
}

function naikLevel(lv) {
  const buka = [...OUTFIT.filter(o => o.lv === lv).map(o => '👕 ' + o.nama), ...AKSESORIS.filter(o => o.lv === lv).map(o => '✨ ' + o.nama)];
  tulisLog('', `⭐ Naik ke Level ${lv}!`, 'sys');
  if (kartuTerbuka()) { toast(`⭐ Naik ke Level ${lv}!${buka.length ? ' Barang baru terbuka di Ruang Loker.' : ''}`, 4000); return; }
  bukaKartu(`<div class="match"><div class="hatiBesar">⭐</div><h2>Naik ke Level ${lv}!</h2>
    ${buka.length ? `<p>Barang baru terbuka:<br><b>${buka.map(esc).join('<br>')}</b></p>` : '<p>Terus kumpulkan EXP untuk membuka outfit dan aksesoris baru.</p>'}
    <div class="baris"><button class="btn" type="button" id="lvL">Coba di Ruang Loker</button><button class="btn putih" type="button" id="lvN">Nanti</button></div></div>`, {
    pasang(i) { i.querySelector('#lvL').onclick = () => { tutupKartu(); pergiKe('loker'); }; i.querySelector('#lvN').onclick = tutupKartu; },
  });
}
function rayakanVip() {
  if (kartuTerbuka()) { toast('💎 Kartu Eksekutif aktif! Lounge Eksekutif sudah terbuka untukmu.', 4500); return; }
  bukaKartu(`<div class="match"><div class="hatiBesar">💎</div><h2>Kartu Eksekutif aktif!</h2>
    <p>Sekarang kamu bisa melihat siapa yang menyukaimu, masuk Lounge Eksekutif lewat lift lobi, dan memakai Setelan Emas, Mahkota Emas & Halo.</p>
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

export function hadiah(n, label) { if (K.L && n > 0) tambah(n, null, label); }

// Laporkan aktivitas: otomatis memberi EXP bila tugas terkait belum selesai
export function lapor(id, n = 1) {
  if (!K.L || !K.prof || !K.prof.tj || K.terkunci) return;
  const tur = TUR.find(t => t.id === id);
  if (tur) { if (!sudah(id)) { menunggu.add(id); tambah(tur.exp, id, '✅ ' + tur.nama); segarArah(); } return; }
  const h = HARIAN.find(t => t.id === id);
  if (!h) return;
  const k = kunciHarian(id);
  if (sudah(k)) return;
  if (h.target) { const kh = 'hit_' + k; const c = (LS.get(kh, 0) || 0) + n; LS.set(kh, c); if (c < h.target) return; }
  menunggu.add(k); tambah(h.exp, k, '✅ ' + h.nama); segarArah();
}

// ---------------------------------------------------------------- POSISI: kunjungan ruangan & absen acara
export function cekPosisi(x, z) {
  if (!K.L || !K.prof || !K.prof.tj || K.terkunci) return;
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
  if (l.vip && !vipSaya()) { bukaHub('toko'); toast('Lounge Eksekutif khusus pemegang Kartu Eksekutif 💎'); return; }
  K.pindah(l.x, l.z, l.r);
}

// ---------------------------------------------------------------- PETUNJUK ARAH
let arahSekarang = null;
export function segarArah() {
  const el = $('arah'); if (!el || !K.L) return;
  let a = null;
  const live = acaraLive().find(([id]) => !(P.hadir[id] && P.hadir[id][K.L.uid]));
  if (!K.prof || !K.prof.tj) a = { t: '👉 Langkah pertama: isi buku tamu', aksi: () => K.bukaDaftar() };
  else if (live) a = { t: `🔴 LIVE: ${bersih(live[1].judul, 40)} di ${LOKASI[live[1].lokasi]?.nama || ''} · Datang →`, aksi: () => pergiKe(live[1].lokasi), live: true };
  else {
    const tur = TUR.find(t => !sudah(t.id));
    if (tur) a = { t: `👉 Langkah berikutnya: ${tur.nama} (+${tur.exp} EXP)`, aksi: () => aksiTugas(tur) };
    else {
      const h = HARIAN.find(t => !sudah(kunciHarian(t.id)));
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
  if (t.id === 'tur_ruang') return pergiKe(RUANG_TUJUAN[K.prof.tj]);
  if (t.id === 'tur_kartu') { location.href = '../idcard/index.html'; return; }
  if (t.id === 'tur_sapa') { $('chatI').focus(); toast('Ketik pesan lalu tekan Enter 👋'); return; }
  if (t.id === 'tur_profil') { toast('Ketuk karakter tamu lain di sekitarmu 👆'); return; }
  if (t.id === 'ajak') { toast('Ketuk tamu lain, lalu pilih 💌 Ajak ngobrol'); return; }
  if (t.id === 'chat') { $('chatI').focus(); return; }
  if (t.ke) pergiKe(t.ke);
}

// ---------------------------------------------------------------- PUSAT TAMU (hub)
const TAB = [['tugas', '📋 Tugas'], ['acara', '📅 Acara'], ['peringkat', '🏆 Peringkat'], ['toko', '💎 Toko']];
export function bukaHub(tab = 'tugas') {
  if (!K.prof || !K.prof.tj) { K.bukaDaftar(); return; }
  const lv = level(), ex = totalExp(), a = ambangLevel(lv), b = ambangLevel(lv + 1);
  const isi = { tugas: tabTugas, acara: tabAcara, peringkat: tabPeringkat, toko: tabToko }[tab]();
  bukaKartu(`<div class="hub"><h2>⭐ Level ${lv}${vipSaya() ? ' <span class="pillTj" style="--w:#b8860b">💎 Eksekutif</span>' : ''}</h2>
    <div class="bilah" role="progressbar" aria-valuemin="${a}" aria-valuemax="${b}" aria-valuenow="${ex}"><i style="width:${Math.min(100, (ex - a) / (b - a) * 100).toFixed(1)}%"></i></div>
    <p class="kecil">${fmt(ex)} EXP · ${fmt(b - ex)} EXP lagi ke Level ${lv + 1}</p>
    <div class="sw teks tab">${TAB.map(([k, n]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div>${isi.html}</div></div>`, {
    pasang(el) { el.querySelectorAll('[data-tab]').forEach(x => x.onclick = () => bukaHub(x.dataset.tab)); isi.pasang && isi.pasang(el); },
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
      <div class="daftar">${HARIAN.map(t => barisTugas(t, sudah(kunciHarian(t.id)), t.id)).join('')}</div>
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
      <div class="baris kecil"><span>👥 ${jml(P.ikut, id)} ikut${sedang ? ` · ${jml(P.hadir, id)} hadir` : ''}</span>
      ${sedang ? `<button type="button" class="mini" data-datang="${esc(a.lokasi)}">Datang sekarang</button>` : `<button type="button" class="mini ${P.ikut[id]?.[uid] ? 'putih' : ''}" data-ikut="${esc(id)}">${P.ikut[id]?.[uid] ? '✓ Ikut (batal)' : 'Ikut'}</button>`}</div></div>`;
  return {
    html: `${live.length ? live.map(x => kartu(x, true)).join('') : ''}
      ${nanti.length ? `<h3>Akan datang</h3>${nanti.slice(0, 8).map(x => kartu(x, false)).join('')}` : (live.length ? '' : '<p>Belum ada acara terjadwal. Pantau terus, Direktur sering bikin acara seru!</p>')}
      <p class="kecil">Tekan <b>Ikut</b> untuk diingatkan 10 menit sebelum mulai. Datang ke ruangannya saat acara berlangsung untuk absen otomatis & dapat EXP.</p>`,
    pasang(el) {
      el.querySelectorAll('[data-ikut]').forEach(b => b.onclick = () => { const id = b.dataset.ikut, ya = !(P.ikut[id] && P.ikut[id][uid]); K.L.ikutAcara(id, ya).then(() => { (P.ikut[id] ||= {})[uid] = ya || undefined; if (!ya) delete P.ikut[id][uid]; toast(ya ? 'Kamu akan diingatkan sebelum acara mulai ⏰' : 'Batal ikut.'); bukaHub('acara'); }).catch(() => toast('Gagal. Coba lagi.')); });
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
    html: `<h3>🎮 Juara Tangkap Hati hari ini</h3>
      ${skor.length ? `<ol class="peringkat">${skor.map(([u, v]) => `<li class="${u === me ? 'saya' : ''}"><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada yang main hari ini. Jadilah juara pertama di mesin arcade lobi!</p>'}
      <h3>⭐ Tamu dengan level tertinggi</h3>
      ${lv.length ? `<ol class="peringkat">${lv.map(x => `<li class="${x.u === me ? 'saya' : ''}"><span>${isVip(x.u) ? '💎 ' : ''}${esc(namaUid(x.u))}</span><b>Lv ${levelDari(x.e)}</b></li>`).join('')}</ol>` : '<p class="kecil">Belum ada data.</p>'}`,
  };
}

function tabToko() {
  const T = CFG.toko || { paket: [] }, buka = !!T.linkBayar, uid = K.L.uid;
  const v = K.vip && K.vip[uid];
  return {
    html: `<div class="vipKartu"><b>💎 Kartu Eksekutif</b>
        <ul><li>💘 Lihat <b>siapa</b> yang diam-diam menyukaimu</li><li>🍸 Akses <b>Lounge Eksekutif</b> lewat lift lobi</li><li>👔 Setelan Emas, Mahkota Emas & Halo</li><li>✨ Nama emas 💎 dan ajakan ngobrol yang menonjol</li></ul>
        ${vipSaya() ? `<p>Aktif sampai <b>${esc(tanggalJam(v.sampai))}</b> WIB</p>` : ''}</div>
      <h3>Paket</h3>
      <div class="daftar">${(T.paket || []).map(p => `<div><span><b>${esc(p.nama)}</b> · ${rp(p.harga)}<br><small>${esc(p.ket || '')}</small></span><button type="button" class="mini" data-beli="${esc(p.id)}" ${buka ? '' : 'disabled'}>Beli</button></div>`).join('')}</div>
      ${buka ? '' : `<p class="kecil">Toko belum dibuka. ${CFG.instagram ? `Pantau info di <a href="https://www.instagram.com/${encodeURIComponent(CFG.instagram)}/" target="_blank" rel="noopener">@${esc(CFG.instagram)}</a>.` : ''}</p>`}
      <p class="kecil">Kode tamu kamu: <code>${esc(kodeTamu(uid))}</code></p>`,
    pasang(el) { el.querySelectorAll('[data-beli]').forEach(b => b.onclick = () => bukaBeli((T.paket || []).find(p => p.id === b.dataset.beli))); },
  };
}

function bukaBeli(p) {
  if (!p) return;
  const T = CFG.toko, kode = kodeTamu(K.L.uid);
  bukaKartu(`<h2>💳 ${esc(p.nama)} · ${rp(p.harga)}</h2>
    <ol class="langkah">
      <li>Salin kode tamu kamu: <code id="bK">${esc(kode)}</code> <button type="button" class="mini putih" id="bS">Salin</button></li>
      <li>${esc(T.caraBayar || 'Bayar lewat link berikut dan tulis kode tamu di pesan.')}<br><a class="btn putih" href="${esc(T.linkBayar)}" target="_blank" rel="noopener">Buka halaman pembayaran ↗</a></li>
      <li>Setelah bayar, tekan tombol di bawah. Direktur akan mengecek dan mengaktifkan paketmu (biasanya beberapa menit sampai beberapa jam).</li>
    </ol>
    <div class="baris"><button class="btn" type="button" id="bB">Saya sudah bayar</button></div>
    <p class="kecil">Paket aktif otomatis di akunmu begitu disetujui. Akun tamu terikat ke browser ini, jadi jangan hapus data browser sebelum paket aktif.</p>`, {
    pasang(el) {
      el.querySelector('#bS').onclick = () => { navigator.clipboard?.writeText(kode).then(() => toast('Kode tamu disalin ✔')).catch(() => { const r = document.createRange(); r.selectNode(el.querySelector('#bK')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Tekan salin di HP-mu'); }); };
      el.querySelector('#bB').onclick = () => {
        if (Date.now() - LS.get('pesanT', 0) < 60000) { toast('Pesananmu sudah terkirim, tunggu dicek Direktur ya.'); return; }
        LS.set('pesanT', Date.now());
        K.L.pesan(p.id, K.prof.n, kode);
        tutupKartu(); toast('Pesanan terkirim ke Direktur 🙏 Kamu akan dapat kabar di sini.', 4000);
      };
    },
  });
}
