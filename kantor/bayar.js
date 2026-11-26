// =====================================================================
//  Toko & pembayaran: top up Diamond, Lemari Diamond (beli outfit),
//  VIP/EXP, donasi, papan donatur, dan status pesanan.
//  Pembayaran otomatis (Midtrans: QRIS/VA BCA/BRI/e-wallet) langsung masuk,
//  atau manual: QRIS/transfer BCA/BRI dengan NOMINAL UNIK, lalu
//  diverifikasi Direktur di Dashboard (Toko & Pesanan).
// =====================================================================
import { PAKAIAN, SLOT } from '../js/pakaian.js?v=202611260350';
import { LANGGANAN } from '../js/common.js?v=202611260350';
import { CFG, LS, esc, fmt, bersih, rupiah, IKON_DM, kodeTamu, hash } from '../js/common.js?v=202611260350';
import { K, toast, bukaKartu, tutupKartu, tanggalJam } from './ui.js?v=202611260350';
import * as P from './progres.js?v=202611260350';

const BAYAR = () => CFG.pembayaran || {};
const resmi = () => !!(K.resmi && K.resmi());

// Metode pembayaran yang benar-benar diisi di config.js
// Pembayaran otomatis (Midtrans) hanya jalan di mode online, lewat /api/bayar/buat
// Aktif bila config.js memilih 'midtrans' ATAU server melaporkan kunci Midtrans sudah dipasang di Cloudflare
let serverSiap = false;
export function cekServer() {
  if (!K.L || K.L.mode !== 'online') return;
  fetch('/api/bayar/status', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => { serverSiap = !!(d && d.aktif); }).catch(() => {});
}
export const otomatisAktif = () => (BAYAR().otomatis === 'midtrans' || serverSiap) && K.L && K.L.mode === 'online' && !!K.L.db.idToken;

export function metodeAktif() {
  const b = BAYAR(), m = [];
  if (otomatisAktif()) m.push({ id: 'otomatis', nama: '⚡ Bayar otomatis', ket: 'QRIS, transfer bank (VA), GoPay & e-wallet. Langsung masuk tanpa menunggu', otomatis: true });
  if (b.qris) m.push({ id: 'qris', nama: 'QRIS', ket: 'Scan dari m-banking atau e-wallet apa pun' });
  for (const x of b.bank || []) if (x && x.nomor) m.push({ id: String(x.bank).toLowerCase(), nama: 'Transfer ' + x.bank, ket: `${x.nomor} a.n. ${x.atasNama || ''}`, data: x });
  if (CFG.toko && CFG.toko.linkBayar) m.push({ id: 'lain', nama: 'Lainnya', ket: 'Saweria / Trakteer / dll.' });
  return m.filter(x => ['otomatis', 'qris', 'bca', 'bri', 'lain'].includes(x.id));
}
export const tokoBuka = () => metodeAktif().length > 0;

// Nominal unik per pesanan (Rp1–Rp499) supaya mudah dicocokkan di mutasi rekening
function kodeUnik() { return BAYAR().kodeUnik === false ? 0 : 1 + (hash(K.L.uid + ':' + Date.now()) % 499); }

const pesananKu = () => (LS.get('pesananKu', []) || []).slice(-20);

// ---------------------------------------------------------------- TAB TOKO
export function tabToko() {
  const dir = P.direkturSaya(), saldo = P.saldoDiamond();
  const barang = PAKAIAN.filter(x => x.dm);
  const dp = (CFG.diamond && CFG.diamond.paket) || [], pk = (CFG.toko && CFG.toko.paket) || [];
  const donatur = Object.entries(P.daftarDonatur()).filter(([, d]) => d && d.tampil !== false).sort((a, b) => (b[1].total || 0) - (a[1].total || 0)).slice(0, 10);
  const buka = tokoBuka();
  return {
    html: `<div class="saldoDm"><span>${IKON_DM}</span><div><b>${dir ? '∞' : fmt(saldo)}</b><small>Diamond kamu</small></div></div>
      ${buka ? '' : '<p class="kecil">💤 Pembayaran belum dibuka. Direktur sedang menyiapkan QRIS & rekening.</p>'}
      <h3>${IKON_DM} Top up Diamond</h3>
      <div class="gridPaket">${dp.map(p => `<button type="button" class="paketDm" data-dm="${esc(p.id)}" ${buka ? '' : 'disabled'}><b>${IKON_DM} ${fmt(p.diamond)}</b><span>${rupiah(p.harga)}</span>${p.ket ? `<small>${esc(p.ket)}</small>` : ''}</button>`).join('')}</div>
      <h3>👗 Lemari Diamond</h3>
      <div class="daftar">${barang.map(x => { const punya = P.punyaBarang(x.id); return `<div><span><b>${esc(x.nama)}</b> <small>${SLOT[x.slot].ikon} ${esc(x.jenis)}</small><br><small>${punya ? '✅ sudah kamu miliki · pakai di Ruang Loker' : `${IKON_DM} ${fmt(x.dm)}`}</small></span>${punya ? '' : `<button type="button" class="mini" data-barang="${esc(x.id)}">Beli</button>`}</div>`; }).join('')}</div>
      <h3 id="langganan">💎 VIP & 👑 VVIP</h3>
      ${dir ? '<p class="kecil">👑 Direktur otomatis mendapat semua fitur VVIP.</p>' : P.vipSaya() ? `<p>Kamu <b>${P.vvipSaya() ? 'VVIP 👑' : 'VIP 💎'}</b> sampai <b>${esc(tanggalJam(K.vip[K.L.uid].sampai))}</b> WIB</p>` : ''}
      <div class="gridLangganan">${LANGGANAN.map(l => `<div class="kartuLangganan ${l.id}"><b>${l.ikon} ${esc(l.nama)}</b><span>${IKON_DM} ${fmt(l.diamond)} / ${l.hari} hari</span>
        <ul>${P.MANFAAT[l.id].map(m => `<li>${esc(m)}</li>`).join('')}</ul>
        ${dir ? '' : `<button type="button" class="btn ${l.id === 'vvip' ? '' : 'putih'}" data-langganan="${l.id}" ${l.id === 'vip' && P.vvipSaya() ? 'disabled' : ''}>${IKON_DM} ${P.tingkat(K.L.uid) === l.id ? 'Perpanjang' : l.id === 'vvip' && P.vipSaya() ? 'Upgrade' : 'Beli'} pakai Diamond</button>${(() => { const pu = pk.find(p => p.id === l.paketUang); return pu && !(l.id === 'vip' && P.vvipSaya()) ? `<button type="button" class="btn putih" data-paket="${esc(pu.id)}" ${buka ? '' : 'disabled'}>💳 Bayar ${rupiah(pu.harga)}</button>` : ''; })()}`}</div>`).join('')}</div>
      <p class="kecil">Bayar langsung (💳) atau pakai Diamond: ${IKON_DM} 300 = paket Rp25.000, ${IKON_DM} 650 = paket Rp50.000.</p>
      <h3>⭐ EXP</h3>
      <div class="daftar">${pk.filter(p => !p.sembunyi).map(p => `<div><span><b>${esc(p.nama)}</b> · ${rupiah(p.harga)}<br><small>${esc(p.ket || '')}</small></span><button type="button" class="mini" data-paket="${esc(p.id)}" ${buka ? '' : 'disabled'}>Beli</button></div>`).join('')}</div>
      <h3>🎁 Donasi</h3>
      <p class="kecil">Dukung kantor supaya tetap gratis dan makin seru. Nominal bebas.</p>
      <div class="baris"><button class="btn" type="button" id="tDonasi" ${buka ? '' : 'disabled'}>Donasi sekarang</button></div>
      ${donatur.length ? `<h3>🏅 Papan Donatur</h3><ol class="peringkat">${donatur.map(([u, d]) => `<li class="${u === K.L.uid ? 'saya' : ''}"><span>${esc(bersih(d.n, 20))}</span><b>${rupiah(d.total)}</b></li>`).join('')}</ol>` : ''}
      <h3>🧾 Pesananku</h3><div id="pKu"><p class="kecil">${pesananKu().length ? 'Memuat…' : 'Belum ada pesanan.'}</p></div>
      <p class="kecil">Kode tamu kamu: <code>${esc(kodeTamu(K.L.uid))}</code></p>`,
    pasang(el) {
      el.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => { const p = dp.find(x => x.id === b.dataset.dm); bukaBayar({ jenis: 'diamond', paket: p.id, nama: `${fmt(p.diamond)} Diamond`, harga: p.harga }); });
      el.querySelectorAll('[data-paket]').forEach(b => b.onclick = () => { const p = pk.find(x => x.id === b.dataset.paket); bukaBayar({ jenis: 'paket', paket: p.id, nama: p.nama, harga: p.harga }); });
      el.querySelectorAll('[data-barang]').forEach(b => b.onclick = () => bukaBeliBarang(b.dataset.barang));
      el.querySelectorAll('[data-langganan]').forEach(b => b.onclick = () => bukaBeliLangganan(b.dataset.langganan));
      const d = el.querySelector('#tDonasi'); if (d) d.onclick = bukaDonasi;
      muatPesananKu(el.querySelector('#pKu'));
    },
  };
}

async function muatPesananKu(box) {
  const ids = pesananKu(); if (!box || !ids.length) return;
  const hasil = await Promise.all(ids.map(id => K.L.db.get('pesanan/' + id).then(v => [id, v]).catch(() => [id, null])));
  const masih = hasil.filter(([, v]) => v);
  LS.set('pesananKu', masih.map(([id]) => id));
  box.innerHTML = masih.length
    ? `<div class="daftar">${masih.reverse().map(([, v]) => `<div><span><b>${esc(v.nama || v.paket)}</b> · ${rupiah(v.nominal)}<br><small>${esc(namaMetode(v.metode))} · ${esc(tanggalJam(v.t))}</small></span>${v.metode === 'otomatis'
      ? (linkBayar()[v.kode] ? `<a class="mini" href="${esc(linkBayar()[v.kode])}" target="_blank" rel="noopener">Lanjut bayar ↗</a>` : '<span class="pillTj" style="--w:#c8901a">⏳ Menunggu bayar</span>')
      : '<span class="pillTj" style="--w:#c8901a">⏳ Diverifikasi</span>'}</div>`).join('')}</div>
       <p class="kecil">Pesanan yang sudah lunas/disetujui/ditolak hilang dari daftar ini, dan kamu mendapat pesan di sini. Pembayaran otomatis yang tidak dibayar dalam 60 menit dibatalkan sendiri.</p>`
    : '<p class="kecil">Tidak ada pesanan yang menunggu. Semua pesananmu sudah diproses.</p>';
}
const linkBayar = () => LS.get('linkBayar', {}) || {};
const namaMetode = id => ({ otomatis: 'Otomatis', qris: 'QRIS', bca: 'Transfer BCA', bri: 'Transfer BRI', lain: 'Lainnya' }[id] || id);

// ---------------------------------------------------------------- ALUR BAYAR
// item: { jenis, paket, nama, harga, pesan?, tampil? }
export function bukaBayar(item) {
  if (!resmi()) { K.bukaDaftar(); return; }
  const metode = metodeAktif();
  if (!metode.length) { toast('Pembayaran belum dibuka. Coba lagi nanti ya.'); return; }
  bukaKartu(`<h2>💳 ${esc(item.nama)}</h2><p>Harga: <b>${rupiah(item.harga)}</b>. Pilih cara bayar:</p>
    <div class="metode">${metode.map(m => `<button type="button" data-m="${m.id}"><b>${esc(m.nama)}</b><small>${esc(m.ket)}</small></button>`).join('')}</div>`, {
    pasang(el) { el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const m = metode.find(x => x.id === b.dataset.m); if (m.otomatis) bayarOtomatis(item, b); else langkahBayar(item, m); }); },
  });
}

// Buat transaksi di server lalu buka halaman bayar Midtrans. Diamond masuk
// sendiri begitu Midtrans mengabari server bahwa pembayaran lunas.
async function bayarOtomatis(item, tombol) {
  if (Date.now() - LS.get('pesanT', 0) < 15000) { toast('Tunggu sebentar sebelum membuat pesanan baru ya.'); return; }
  LS.set('pesanT', Date.now());
  tombol.disabled = true; tombol.querySelector('small').textContent = 'Menyiapkan halaman bayar…';
  const jendela = window.open('', '_blank'); // dibuka saat klik supaya tidak diblokir browser
  try {
    const r = await fetch('/api/bayar/buat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      idToken: await K.L.db.idToken(), jenis: item.jenis, paket: item.paket, nominal: item.harga,
      ...(item.jenis === 'donasi' ? { pesan: item.pesan || '', tampil: item.tampil !== false } : {}) }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.redirect_url) throw new Error(d.error || 'Gagal membuat pembayaran.');
    LS.set('pesananKu', [...pesananKu(), d.orderId]);
    LS.set('linkBayar', Object.fromEntries([...Object.entries(linkBayar()).slice(-19), [d.orderId, d.redirect_url]]));
    if (jendela) jendela.location.href = d.redirect_url;
    tutupKartu();
    bukaKartu(`<div class="match"><div class="hatiBesar">⚡</div><h2>Selesaikan pembayaran</h2><p>${esc(item.nama)} · <b>${rupiah(item.harga)}</b><br>Halaman bayar ${jendela ? 'sudah terbuka di tab baru' : 'siap dibuka'}. Pilih QRIS, VA BCA/BRI, atau e-wallet.<br><b>Begitu lunas, ${item.jenis === 'donasi' ? 'namamu masuk Papan Donatur' : 'langsung masuk ke akunmu'}</b>. Tidak perlu menunggu Direktur.</p>
      <div class="baris"><a class="btn" href="${esc(d.redirect_url)}" ${jendela ? 'target="_blank" rel="noopener"' : ''}>Buka halaman bayar ↗</a><button class="btn putih" type="button" id="bO">Tutup</button></div>
      <p class="kecil">Kode pesanan: <code>${esc(d.orderId)}</code>. Berlaku 60 menit.</p></div>`, { pasang(x) { x.querySelector('#bO').onclick = tutupKartu; } });
  } catch (e) {
    if (jendela) jendela.close();
    LS.set('pesanT', 0);
    tombol.disabled = false; tombol.querySelector('small').textContent = 'Coba lagi';
    toast('⚠️ ' + e.message + (metodeAktif().length > 1 ? ' Kamu juga bisa pakai cara manual.' : ''), 4200);
  }
}

// Dipanggil kantor saat kembali dari halaman Midtrans (?bayar=selesai)
export function kembaliDariBayar() {
  const q = new URLSearchParams(location.search);
  if (q.get('bayar') !== 'selesai') return;
  history.replaceState(null, '', location.pathname + location.hash);
  const st = q.get('transaction_status');
  toast(st === 'settlement' || st === 'capture' ? '✅ Pembayaran berhasil! Diamond/paketmu masuk dalam beberapa detik.'
    : st === 'pending' ? '⏳ Pembayaran belum selesai. Selesaikan dulu ya, nanti masuk otomatis.'
      : '🧾 Terima kasih! Kalau sudah bayar, item masuk otomatis dalam beberapa detik.', 5200);
}

function langkahBayar(item, m) {
  const b = BAYAR(), kode = kodeTamu(K.L.uid);
  const unik = m.id === 'lain' ? 0 : kodeUnik();
  const total = item.harga + unik;
  const salin = (teks, label) => `<span class="salinBaris"><code>${esc(teks)}</code><button type="button" class="mini putih" data-salin="${esc(teks)}">Salin${label ? ' ' + label : ''}</button></span>`;
  const isi = m.id === 'qris'
    ? `<div class="qris"><img src="../${esc(b.qris)}" alt="Kode QRIS ${esc(b.qrisNama || '')}"><small>${esc(b.qrisNama || '')}</small></div>
       <ol class="langkah"><li>Buka m-banking atau e-wallet (BCA, BRI, GoPay, OVO, DANA, ShopeePay, dll.) → <b>Scan QRIS</b>.</li><li>Masukkan nominal <b>persis</b>: ${salin(String(total), 'nominal')}</li><li>Selesaikan pembayaran, lalu tekan tombol di bawah.</li></ol>`
    : m.id === 'lain'
      ? `<ol class="langkah"><li>Buka halaman pembayaran: <a class="btn putih" href="${esc(CFG.toko.linkBayar)}" target="_blank" rel="noopener">Buka ↗</a></li><li>Bayar <b>${rupiah(total)}</b> dan tulis kode tamu ${salin(kode)} di kolom pesan.</li><li>Tekan tombol di bawah.</li></ol>`
      : `<div class="rekening"><b>${esc(m.data.bank)}</b>${salin(m.data.nomor, 'rekening')}<small>a.n. ${esc(m.data.atasNama || '')}</small></div>
         <ol class="langkah"><li>Transfer <b>persis</b>: ${salin(String(total), 'nominal')}</li><li>Di berita transfer, tulis kode tamu: ${salin(kode)} (opsional)</li><li>Setelah berhasil, tekan tombol di bawah.</li></ol>`;
  bukaKartu(`<h2>${esc(m.nama)} · ${esc(item.nama)}</h2>
    <div class="totalBayar"><small>Total yang harus dibayar</small><b>${rupiah(total)}</b>${unik ? `<small>${rupiah(item.harga)} + kode unik ${unik}. Transfer persis sampai 3 digit terakhir supaya cepat dikenali.</small>` : ''}</div>
    ${isi}
    <div class="baris"><button class="btn" type="button" id="bB">✅ Saya sudah bayar</button><button class="btn putih" type="button" id="bK">← Ganti cara bayar</button></div>
    <p class="kecil">Diamond/paket aktif setelah Direktur mencocokkan pembayaranmu (biasanya beberapa menit sampai beberapa jam). Jangan hapus data browser sebelum pesanan disetujui.</p>`, {
    pasang(el) {
      el.querySelectorAll('[data-salin]').forEach(x => x.onclick = () => navigator.clipboard?.writeText(x.dataset.salin).then(() => toast('Disalin ✔')).catch(() => toast('Salin manual: ' + x.dataset.salin)));
      el.querySelector('#bK').onclick = () => bukaBayar(item);
      el.querySelector('#bB').onclick = () => {
        if (Date.now() - LS.get('pesanT', 0) < 30000) { toast('Pesananmu barusan sudah terkirim, tunggu sebentar ya.'); return; }
        LS.set('pesanT', Date.now());
        const id = K.L.pesan({ paket: item.paket, jenis: item.jenis, nama: item.nama.slice(0, 40), metode: m.id, nominal: total, kode, n: K.prof.n.slice(0, 30), ...(item.jenis === 'donasi' ? { pesan: item.pesan || '', tampil: item.tampil !== false } : {}) });
        LS.set('pesananKu', [...pesananKu(), id]);
        tutupKartu();
        bukaKartu(`<div class="match"><div class="hatiBesar">🧾</div><h2>Pesanan terkirim!</h2><p>${esc(item.nama)} · <b>${rupiah(total)}</b> via ${esc(m.nama)}.<br>Direktur akan mencocokkan pembayaranmu. Kamu dapat pesan di sini begitu disetujui.</p><div class="baris"><button class="btn" type="button" id="bO">Oke</button></div></div>`, { pasang(x) { x.querySelector('#bO').onclick = tutupKartu; } });
      };
    },
  });
}

// ---------------------------------------------------------------- DONASI
export function bukaDonasi() {
  if (!resmi()) { K.bukaDaftar(); return; }
  const D = CFG.donasi || {}, min = D.min || 5000;
  bukaKartu(`<h2>🎁 Donasi untuk kantor</h2><p>Donasimu dipakai untuk biaya server dan acara. Terima kasih! 💖</p>
    <div class="sw teks">${(D.saran || []).map(n => `<button type="button" data-n="${n}">${rupiah(n)}</button>`).join('')}</div>
    <label for="dN">Nominal (min. ${rupiah(min)})</label><input id="dN" type="number" inputmode="numeric" min="${min}" step="1000" value="${(D.saran || [])[0] || min}">
    <label for="dP">Pesan (opsional)</label><input id="dP" maxlength="100" placeholder="contoh: semangat terus kantornya!">
    <label class="cek"><input type="checkbox" id="dT" checked> Tampilkan namaku di Papan Donatur</label>
    <p class="err" id="dE"></p><div class="baris"><button class="btn" type="button" id="dL">Lanjut bayar →</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { el.querySelector('#dN').value = b.dataset.n; });
      el.querySelector('#dL').onclick = () => {
        const n = Math.round(+el.querySelector('#dN').value || 0);
        if (n < min) { el.querySelector('#dE').textContent = `Minimal ${rupiah(min)}.`; return; }
        if (n > 10000000) { el.querySelector('#dE').textContent = 'Maksimal Rp10.000.000 per donasi.'; return; }
        bukaBayar({ jenis: 'donasi', paket: 'donasi', nama: 'Donasi', harga: n, pesan: bersih(el.querySelector('#dP').value, 100), tampil: el.querySelector('#dT').checked });
      };
    },
  });
}

// ---------------------------------------------------------------- BELI VIP / VVIP DENGAN DIAMOND
export function bukaBeliLangganan(id) {
  if (!resmi()) { K.bukaDaftar(); return; }
  const l = LANGGANAN.find(x => x.id === id); if (!l) return;
  if (id === 'vip' && P.vvipSaya()) { toast('Kamu sudah VVIP 👑'); return; }
  const saldo = P.saldoDiamond(), cukup = saldo >= l.diamond, upgrade = id === 'vvip' && P.tingkat(K.L.uid) === 'vip';
  bukaKartu(`<h2>${l.ikon} ${esc(l.nama)} · ${l.hari} hari</h2>
    <p>Harga: <b>${IKON_DM} ${fmt(l.diamond)}</b> · Saldo kamu: <b>${IKON_DM} ${fmt(saldo)}</b></p>
    <ul class="manfaat">${P.MANFAAT[id].map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    ${upgrade ? '<p class="kecil">Sisa masa VIP-mu tetap dihitung: masa aktif VVIP ditambahkan setelahnya.</p>' : ''}
    <p class="kecil">${cukup ? 'Masa aktif langsung bertambah setelah dibeli.' : `Diamond kamu kurang ${fmt(l.diamond - saldo)}. Top up dulu yuk.`}</p>
    <div class="baris">${cukup ? `<button class="btn" type="button" id="lB">Beli ${IKON_DM} ${fmt(l.diamond)}</button>` : '<button class="btn" type="button" id="lT">Top up Diamond</button>'}<button class="btn putih" type="button" id="lN">Batal</button></div>`, {
    pasang(el) {
      el.querySelector('#lN').onclick = tutupKartu;
      const t = el.querySelector('#lT'); if (t) t.onclick = () => P.bukaHub('toko');
      const b = el.querySelector('#lB');
      if (b) b.onclick = async () => {
        b.disabled = true;
        try {
          const r = await K.L.beliLangganan(id, l.diamond, l.hari);
          if (!r.ok) { toast('Diamond kamu kurang.'); b.disabled = false; return; }
          tutupKartu(); toast(`${l.ikon} ${l.nama} aktif sampai ${tanggalJam(r.sampai)} WIB`, 4000);
        } catch (e) { console.warn(e); toast('Pembelian gagal. Coba lagi.'); b.disabled = false; }
      };
    },
  });
}

// ---------------------------------------------------------------- BELI BARANG DENGAN DIAMOND
export function bukaBeliBarang(id) {
  if (!resmi()) { K.bukaDaftar(); return; }
  const x = PAKAIAN.find(b => b.id === id && b.dm); if (!x) return;
  if (P.punyaBarang(id)) { toast(`${x.nama} sudah kamu miliki. Pakai di Ruang Loker 👔`); return; }
  const saldo = P.saldoDiamond(), cukup = saldo >= x.dm;
  bukaKartu(`<h2>👗 ${esc(x.nama)}</h2>
    <p>Harga: <b>${IKON_DM} ${fmt(x.dm)}</b> · Saldo kamu: <b>${IKON_DM} ${fmt(saldo)}</b></p>
    <p class="kecil">${cukup ? 'Setelah dibeli, barang ini jadi milikmu selamanya dan bisa dipakai di Ruang Loker.' : `Diamond kamu kurang ${fmt(x.dm - saldo)}. Top up dulu yuk.`}</p>
    <div class="baris">${cukup ? `<button class="btn" type="button" id="xB">Beli ${IKON_DM} ${fmt(x.dm)}</button>` : '<button class="btn" type="button" id="xT">Top up Diamond</button>'}<button class="btn putih" type="button" id="xN">Batal</button></div>`, {
    pasang(el) {
      el.querySelector('#xN').onclick = tutupKartu;
      const t = el.querySelector('#xT'); if (t) t.onclick = () => P.bukaHub('toko');
      const b = el.querySelector('#xB');
      if (b) b.onclick = async () => {
        b.disabled = true;
        try {
          const r = await K.L.beliBarang(id, x.dm);
          if (!r.ok) { toast('Diamond kamu kurang.'); b.disabled = false; return; }
          tutupKartu(); toast(`✨ ${x.nama} jadi milikmu! Pakai di Ruang Loker.`, 3600);
        } catch (e) { console.warn(e); toast('Pembelian gagal. Coba lagi.'); b.disabled = false; }
      };
    },
  });
}
