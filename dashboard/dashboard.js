// =====================================================================
//  DASHBOARD DIREKTUR — kendali penuh PT Mencari Cinta Sejati.
//  Login username + kata sandi → ringkasan, persetujuan pendaftar,
//  anggota, online, aktivitas, acara, toko, laporan, siaran & data.
// =====================================================================
import { CFG, TUJUAN, LOKASI, GENDER, BARANG_DIAMOND, IKON_DM, esc, fmt, bersih, levelDari, hariIni, lokasiDi, kodeTamu } from '../js/common.js?v=202611251546';
import { bukaDB } from '../js/db.js?v=202611251546';
import { buatLayanan } from '../js/layanan.js?v=202611251546';

const $ = id => document.getElementById(id);
let db = null, L = null;
const S = {}; // semua data langsung dari database
const MENU = [
  ['ringkas', '📊', 'Ringkasan'], ['daftar', '📝', 'Pendaftaran'], ['anggota', '👥', 'Anggota'], ['online', '🟢', 'Online'],
  ['aktivitas', '💬', 'Aktivitas'], ['acara', '📅', 'Acara'], ['toko', '💳', 'Toko & Pesanan'], ['laporan', '🚩', 'Laporan & Saran'],
  ['siaran', '📢', 'Siaran & Pengaturan'], ['data', '🗂', 'Data'],
];
let bagian = (location.hash || '').slice(1) || 'ringkas';
if (!MENU.some(m => m[0] === bagian)) bagian = 'ringkas';
let pilihAnggota = null, filterDaftar = 'menunggu', subAktivitas = 'feed', nodeData = 'anggota';

// ---------------------------------------------------------------- util
let toastT;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2800); }
const kini = () => (db ? db.now() : Date.now());
const ent = o => Object.entries(o || {}).filter(([, v]) => v !== null && v !== undefined);
const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const tgl = t => (t ? new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '—');
function lalu(t) {
  if (!t) return '';
  const d = Math.max(0, kini() - t) / 1000;
  if (d < 60) return 'baru saja'; if (d < 3600) return Math.floor(d / 60) + ' mnt lalu'; if (d < 86400) return Math.floor(d / 3600) + ' jam lalu';
  return tgl(t);
}
const pillTj = tj => TUJUAN[tj] ? `<span class="pill" style="--w:${TUJUAN[tj].warna}">${TUJUAN[tj].ikon} ${TUJUAN[tj].nama}</span>` : '';
const nama = uid => (S.anggota?.[uid]?.n) || (S.tamu?.[uid]?.n) || (S.pendaftaran?.[uid]?.n) || (S.online?.[uid]?.n) || (uid === L?.uid ? 'Direktur' : 'Tamu ' + String(uid).slice(-4));
const expOf = uid => ((S.exp?.[uid]?.n) || 0) + (S.expBeli?.[uid] || 0);
const vipAktif = uid => (S.vip?.[uid]?.sampai || 0) > kini();
const diusir = uid => (S.ban?.[uid]?.sampai || 0) > kini();
const onlineAktif = () => ent(S.online).filter(([, p]) => !p.t || kini() - p.t < 120000);
const gagal = e => { console.warn(e); toast('Gagal: ' + (e && e.message ? e.message.replace(/^.*PERMISSION_DENIED.*$/, 'izin ditolak server') : 'coba lagi')); };
const paket = id => [...(CFG.toko?.paket || []), ...(CFG.diamond?.paket || []).map(p => ({ ...p, nama: `${p.diamond} Diamond` }))].find(p => p.id === id) || (id === 'donasi' ? { id, nama: 'Donasi', harga: 0 } : null);
const METODE = { otomatis: '⚡ Otomatis', qris: 'QRIS', bca: 'BCA', bri: 'BRI', lain: 'Lainnya' };

// ---------------------------------------------------------------- MULAI
(async function mulai() {
  db = await bukaDB({ anonim: false });
  $('lInfo').innerHTML = db.mode === 'lokal'
    ? `<b>Mode lokal (demo).</b> Login memakai <code>direkturDemo</code> di <code>config.js</code>${CFG.direkturDemo ? ` (username <code>${esc(CFG.direkturDemo.username)}</code>)` : ''}. Data hanya tersimpan di browser ini.`
    : `Username = bagian depan email akun Direktur di Firebase Authentication (contoh <code>yocky</code> untuk <code>yocky@${esc(CFG.domainLogin)}</code>), atau ketik email lengkap.`;
  if (db.masukDashboard && db.uid && (await db.get('peran/' + db.uid).catch(() => null)) === 'direktur') return masukApp();
  tampilLogin();
})().catch(e => { console.error(e); document.body.innerHTML = '<p style="padding:24px">Dashboard gagal dimuat. Coba muat ulang.</p>'; });

function tampilLogin() {
  $('app').hidden = true; $('login').hidden = false;
  $('fLogin').onsubmit = async e => {
    e.preventDefault();
    const E = $('lE'); E.textContent = 'Memeriksa…';
    try {
      const uid = await db.masuk($('lU').value, $('lP').value);
      const peran = await db.get('peran/' + uid).catch(() => null);
      if (peran !== 'direktur') {
        await db.keluar();
        E.innerHTML = `Akun ini belum terdaftar sebagai Direktur. Di Firebase → Realtime Database, tambahkan <code>peran/${esc(uid)}</code> = <code>"direktur"</code>.`;
        return;
      }
      E.textContent = ''; $('lP').value = '';
      masukApp();
    } catch (err) { console.warn(err); E.textContent = 'Username atau kata sandi salah.'; }
  };
}

function masukApp() {
  L = buatLayanan(db);
  $('login').hidden = true; $('app').hidden = false;
  $('mode').textContent = db.mode === 'lokal' ? 'langsung · mode lokal (demo)' : 'langsung · online';
  const node = ['pendaftaran', 'anggota', 'tamu', 'online', 'peran', 'ban', 'exp', 'expBeli', 'vip', 'papan', 'curhatPemilik', 'laporan', 'saran',
    'pesanan', 'riwayat', 'acara', 'ikutAcara', 'hadirAcara', 'setelan', 'mading', 'pengumuman', 'diamond', 'milik', 'donatur', 'katalog'];
  let onlineT = 0, onlineTunda = null;
  for (const n of node) db.on(n, v => {
    S[n] = v || {};
    if (n !== 'online') return jadwalGambar();
    if (!['online', 'ringkas'].includes(bagian)) { navigasi(); return; }
    const sisa = 3000 - (Date.now() - onlineT);
    if (sisa <= 0) { onlineT = Date.now(); jadwalGambar(); }
    else if (!onlineTunda) onlineTunda = setTimeout(() => { onlineTunda = null; onlineT = Date.now(); jadwalGambar(); }, sisa);
  });
  db.on('chat', v => { S.chat = v || {}; jadwalGambar(); }, { limit: 200 });
  db.on('curhat', v => { S.curhat = v || {}; jadwalGambar(); }, { limit: 100 });
  db.on('skor/' + hariIni(), v => { S.skor = v || {}; jadwalGambar(); });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (MENU.some(m => m[0] === h)) { bagian = h; gambar(true); } });
  $('isi').addEventListener('focusout', () => setTimeout(() => { if (kotor) gambar(); }, 50));
  setInterval(() => gambar(), 30000);
  gambar(true);
}

// ---------------------------------------------------------------- RENDER
let antre = false, kotor = false, ditekan = false;
// Selama tombol mouse/jari ditekan, tunda gambar ulang supaya klik tidak hilang karena tombol diganti
addEventListener('pointerdown', () => { ditekan = true; }, true);
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => { ditekan = false; if (kotor) setTimeout(() => { if (kotor && !ditekan && !sibukMengetik()) gambar(); }, 120); }, true);
function jadwalGambar() { if (antre) return; antre = true; setTimeout(() => { antre = false; gambar(); }, 250); }
function sibukMengetik() { const a = document.activeElement; return a && $('isi').contains(a) && a.matches('input,textarea,select'); }
function gambar(paksa = false) {
  navigasi();
  if (!paksa && (sibukMengetik() || ditekan)) { kotor = true; return; }
  kotor = false;
  const m = MENU.find(x => x[0] === bagian);
  $('judul').textContent = m[1] + ' ' + m[2];
  const y = scrollY;
  const v = { ringkas, daftar: vDaftar, anggota: vAnggota, online: vOnline, aktivitas: vAktivitas, acara: vAcara, toko: vToko, laporan: vLaporan, siaran: vSiaran, data: vData }[bagian]();
  $('isi').innerHTML = v.html;
  v.pasang && v.pasang($('isi'));
  if (!paksa) scrollTo(0, y);
}
function navigasi() {
  const nMenunggu = ent(S.pendaftaran).filter(([, d]) => d.status === 'menunggu').length;
  const hitung = { daftar: nMenunggu, toko: ent(S.pesanan).length, laporan: ent(S.laporan).length, online: onlineAktif().length };
  $('samping').innerHTML = `<div class="merek"><i>👑</i><div><b>${esc(CFG.namaPT)}</b><small>Dashboard Direktur</small></div></div>
    ${MENU.map(([k, ik, n]) => `<button type="button" class="nav ${k === bagian ? 'on' : ''}" data-b="${k}"><span>${ik}</span><span>${n}</span>${hitung[k] ? `<span class="jml">${hitung[k]}</span>` : ''}</button>`).join('')}
    <div class="bawah"><a class="btn emas" href="../kantor/index.html" target="_blank" rel="noopener">🏢 Masuk kantor</a><button class="btn putih" type="button" id="bKeluar">Keluar</button></div>`;
  $('samping').querySelectorAll('[data-b]').forEach(b => b.onclick = () => { bagian = b.dataset.b; history.replaceState(null, '', '#' + bagian); gambar(true); scrollTo(0, 0); });
  $('bKeluar').onclick = async () => { await db.keluar().catch(() => {}); location.reload(); };
}

// ---------------------------------------------------------------- 📊 RINGKASAN
function aktivitasTerbaru(maks = 40) {
  const f = [];
  for (const [u, d] of ent(S.pendaftaran)) f.push({ t: d.t, ik: '📝', h: `<b>${esc(d.n)}</b> mendaftar ${pillTj(d.tj)} ${d.status === 'ditolak' ? '· ditolak' : ''}` });
  for (const [u, a] of ent(S.anggota)) if (a.sejak) f.push({ t: a.sejak, ik: '✅', h: `<b>${esc(a.n)}</b> diterima menjadi anggota` });
  for (const [, c] of ent(S.chat)) f.push({ t: c.t, ik: '💬', h: `<b>${esc(bersih(c.n, 20))}</b>: ${esc(c.m)}` });
  for (const [, c] of ent(S.papan)) f.push({ t: c.t, ik: '📋', h: `<b>${esc(c.n)}</b> menulis di papan: “${esc(c.m)}”` });
  for (const [k, c] of ent(S.curhat)) f.push({ t: c.t, ik: '🤗', h: `Curhat baru${S.curhatPemilik?.[k] ? ` dari <b>${esc(nama(S.curhatPemilik[k]))}</b>` : ''}: “${esc(c.m)}”` });
  for (const [, l] of ent(S.laporan)) f.push({ t: l.t, ik: '🚩', h: `<b>${esc(nama(l.dari))}</b> melaporkan <b>${esc(l.n)}</b>: ${esc(l.alasan)}` });
  for (const [, s] of ent(S.saran)) f.push({ t: s.t, ik: '💡', h: `Saran dari <b>${esc(s.n || nama(s.dari))}</b>: ${esc(s.m)}` });
  for (const [, p] of ent(S.pesanan)) f.push({ t: p.t, ik: p.jenis === 'donasi' ? '🎁' : '💳', h: `<b>${esc(p.n)}</b> ${p.jenis === 'donasi' ? 'berdonasi' : 'memesan ' + esc(p.nama || paket(p.paket)?.nama || p.paket)} · ${rp(p.nominal || 0)} via ${esc(METODE[p.metode] || '-')}` });
  for (const [, r] of ent(S.riwayat)) f.push({ t: r.t, ik: '💰', h: `Pembelian <b>${esc(r.nama || r.paket)}</b> oleh ${esc(r.n)} disetujui (${rp(r.harga)})` });
  for (const [id, h] of ent(S.hadirAcara)) for (const [u, t] of ent(h)) f.push({ t, ik: '🎉', h: `<b>${esc(nama(u))}</b> hadir di ${esc(S.acara?.[id]?.judul || 'acara')}` });
  return f.filter(x => x.t).sort((a, b) => b.t - a.t).slice(0, maks);
}
const feedHtml = f => f.length ? `<ul class="feed">${f.map(x => `<li><span class="ik">${x.ik}</span><span class="isi">${x.h}</span><time>${esc(lalu(x.t))}</time></li>`).join('')}</ul>` : '<p class="kosong">Belum ada aktivitas.</p>';

function ringkas() {
  const ang = ent(S.anggota), menunggu = ent(S.pendaftaran).filter(([, d]) => d.status === 'menunggu').length;
  const pendapatan = ent(S.riwayat).reduce((a, [, r]) => a + (r.harga || 0), 0);
  const nanti = ent(S.acara).filter(([, a]) => a.mulai + a.durasi * 60000 > kini()).length;
  const st = S.setelan || {};
  return {
    html: `<div class="grid">
      <div class="angka sorot tombol" data-ke="daftar"><b>${fmt(menunggu)}</b><span>📝 pendaftar menunggu</span></div>
      <div class="angka tombol" data-ke="online"><b>${fmt(onlineAktif().length)}</b><span>🟢 online sekarang</span></div>
      <div class="angka tombol" data-ke="anggota"><b>${fmt(ang.length)}</b><span>👥 anggota resmi</span></div>
      <div class="angka tombol" data-ke="toko"><b>${fmt(ent(S.pesanan).filter(([, v]) => v.metode !== 'otomatis').length)}</b><span>💳 pesanan menunggu</span></div>
      <div class="angka tombol" data-ke="toko"><b>${rp(pendapatan)}</b><span>💰 total pendapatan</span></div>
      <div class="angka tombol" data-ke="laporan"><b>${fmt(ent(S.laporan).length)}</b><span>🚩 laporan</span></div>
      <div class="angka tombol" data-ke="acara"><b>${fmt(nanti)}</b><span>📅 acara mendatang</span></div>
      <div class="angka"><b>${fmt(ent(S.vip).filter(([u]) => vipAktif(u)).length)}</b><span>💎 Eksekutif aktif</span></div>
    </div>
    <div class="panel"><h3>Anggota per tujuan</h3><div class="tiga">${Object.entries(TUJUAN).map(([k, t]) => `<div class="angka"><b>${fmt(ang.filter(([, a]) => a.tj === k).length)}</b><span>${t.ikon} ${t.nama}</span></div>`).join('')}</div></div>
    <div class="dua">
      <div class="panel"><h3>Aktivitas terbaru <small>langsung</small></h3>${feedHtml(aktivitasTerbaru(14))}</div>
      <div class="panel"><h3>Kendali cepat</h3>
        <p>Kantor: <b>${st.tutup ? '🔒 Tutup' : '🟢 Buka'}</b> · Pendaftaran: <b>${st.daftarTutup ? '🔒 Ditutup' : '🟢 Dibuka'}</b></p>
        <div class="baris">
          <button class="btn ${st.tutup ? 'hijau' : 'putih'}" type="button" id="qK">${st.tutup ? 'Buka kantor' : 'Tutup kantor'}</button>
          <button class="btn ${st.daftarTutup ? 'hijau' : 'putih'}" type="button" id="qD">${st.daftarTutup ? 'Buka pendaftaran' : 'Tutup pendaftaran'}</button>
          <a class="btn emas" href="../kantor/index.html" target="_blank" rel="noopener">🏢 Masuk kantor sebagai Direktur</a>
        </div>
        <h3 style="margin-top:16px">Tautan pendaftaran</h3>
        <p class="kecil">Bagikan tautan ini. Pengunjung langsung melihat formulir pendaftaran.</p>
        <div class="baris"><code id="tDaftar">${esc(new URL('../kantor/index.html#daftar', location.href).href)}</code><button class="btn putih kecil" type="button" id="qS">Salin</button></div>
      </div>
    </div>`,
    pasang(el) {
      el.querySelectorAll('[data-ke]').forEach(x => x.onclick = () => { bagian = x.dataset.ke; history.replaceState(null, '', '#' + bagian); gambar(true); });
      el.querySelector('#qK').onclick = () => L.setelan({ tutup: !st.tutup }).then(() => toast(st.tutup ? 'Kantor dibuka 🟢' : 'Kantor ditutup 🔒')).catch(gagal);
      el.querySelector('#qD').onclick = () => L.setelan({ daftarTutup: !st.daftarTutup }).then(() => toast(st.daftarTutup ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup')).catch(gagal);
      el.querySelector('#qS').onclick = () => navigator.clipboard?.writeText(el.querySelector('#tDaftar').textContent).then(() => toast('Tautan disalin ✔')).catch(() => toast('Salin manual tautannya ya'));
    },
  };
}

// ---------------------------------------------------------------- 📝 PENDAFTARAN
function vDaftar() {
  const semua = ent(S.pendaftaran).sort((a, b) => (a[1].t || 0) - (b[1].t || 0));
  const list = semua.filter(([, d]) => d.status === filterDaftar);
  const jml = s => semua.filter(([, d]) => d.status === s).length;
  const kartu = ([u, d]) => `<article class="pendaftar ${d.status === 'menunggu' ? 'baru' : ''}" data-u="${esc(u)}">
      <div class="baris" style="justify-content:space-between"><h4>${esc(d.n)}</h4>${pillTj(d.tj)}</div>
      <dl>
        <dt>Umur</dt><dd>${esc(d.umur)} tahun${d.tj === 'jodoh' && d.umur < (CFG.pendaftaran?.umurMinJodoh || 18) ? ' ⚠️' : ''}</dd>
        <dt>Kelamin</dt><dd>${esc(GENDER[d.g] || 'Rahasia')}</dd>
        <dt>Kota</dt><dd>${esc(d.kota)}</dd>
        ${d.s ? `<dt>Status hati</dt><dd>${esc(d.s)}</dd>` : ''}
        <dt>Instagram</dt><dd>${d.ig ? `<a href="https://www.instagram.com/${encodeURIComponent(d.ig)}/" target="_blank" rel="noopener">@${esc(d.ig)}</a>` : '—'}</dd>
        ${CFG.wajibFollow ? `<dt>Follow & komen</dt><dd>${d.ikut ? `☑️ mengaku sudah${d.ig ? ` · <a href="https://www.instagram.com/${encodeURIComponent(d.ig)}/" target="_blank" rel="noopener">cek profilnya</a>` : ''}` : '⚠️ belum'}<br><span class="kecil">Cek di daftar follower & komen "${esc(CFG.wajibFollow.komen || 'DAFTAR')}" sebelum ACC</span></dd>` : ''}
        <dt>Masuk</dt><dd>${esc(tgl(d.t))}</dd>
        <dt>Kode</dt><dd><code>${esc(kodeTamu(u))}</code></dd>
      </dl>
      <div><span class="kecil">Tentang dia</span><blockquote>${esc(d.b)}</blockquote></div>
      <div><span class="kecil">Alasan bergabung</span><blockquote>${esc(d.alasan)}</blockquote></div>
      ${d.status === 'ditolak' && d.alasanTolak ? `<p class="kecil">Catatan penolakan: ${esc(d.alasanTolak)}</p>` : ''}
      <div class="baris">
        <button class="btn hijau kecil" type="button" data-a="tamu">✅ Terima sebagai Tamu</button>
        <button class="btn putih kecil" type="button" data-a="staf">🛡 Terima sebagai Staf</button>
        ${d.status === 'menunggu' ? `<button class="btn merah kecil" type="button" data-a="tolak">❌ Tolak</button>` : `<button class="btn putih kecil" type="button" data-a="hapus">Hapus</button>`}
      </div>
      <div class="baris" data-tolak hidden><input placeholder="Alasan penolakan (dikirim ke pendaftar)" maxlength="160"><button class="btn merah kecil" type="button" data-a="kirimTolak">Kirim</button></div>
    </article>`;
  return {
    html: `<div class="tab"><button type="button" data-f="menunggu" class="${filterDaftar === 'menunggu' ? 'on' : ''}">⏳ Menunggu (${jml('menunggu')})</button><button type="button" data-f="ditolak" class="${filterDaftar === 'ditolak' ? 'on' : ''}">❌ Ditolak (${jml('ditolak')})</button></div>
      ${filterDaftar === 'menunggu' && list.length > 1 ? `<div class="baris" style="margin-bottom:12px"><button class="btn hijau kecil" type="button" id="terimaSemua">✅ Terima semua (${list.length}) sebagai Tamu</button></div>` : ''}
      ${list.length ? `<div class="daftarKartu">${list.map(kartu).join('')}</div>` : `<p class="kosong">${filterDaftar === 'menunggu' ? 'Tidak ada pendaftar yang menunggu. 🎉' : 'Tidak ada pendaftaran yang ditolak.'}</p>`}
      <div class="panel"><h3>Format pendaftaran</h3>
        <p class="kecil">Pengunjung yang belum diterima hanya bisa melihat-lihat: tidak terlihat orang lain, tidak bisa chat, ngobrol, ikut acara, atau mengumpulkan EXP (dikunci di server). Formulir yang mereka isi:</p>
        <ol class="kecil" style="line-height:1.7"><li>Tujuan datang: 💘 Cari Jodoh / 🤝 Cari Teman / 💬 Mau Curhat</li><li>Nama panggilan (2–20 huruf)</li><li>Umur (min. ${CFG.pendaftaran?.umurMin || 13}; Cari Jodoh min. ${CFG.pendaftaran?.umurMinJodoh || 18})</li><li>Jenis kelamin (opsional) & kota</li><li>Status hati (khusus Cari Jodoh)</li><li>Instagram (opsional, untuk verifikasi)</li><li>Tentang aku (10–100 huruf) & alasan bergabung (10–200 huruf)</li><li>Pernyataan data benar & janji sopan</li></ol>
      </div>`,
    pasang(el) {
      el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filterDaftar = b.dataset.f; gambar(true); });
      const tb = el.querySelector('#terimaSemua');
      if (tb) tb.onclick = async () => { tb.disabled = true; for (const [u, d] of list) await L.terimaPendaftar(u, d, 'tamu').catch(gagal); toast(`${list.length} pendaftar diterima ✅`); };
      el.querySelectorAll('.pendaftar').forEach(k => {
        const u = k.dataset.u, d = S.pendaftaran[u];
        k.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
          const a = b.dataset.a;
          if (a === 'tolak') { k.querySelector('[data-tolak]').hidden = false; k.querySelector('[data-tolak] input').focus(); return; }
          b.disabled = true;
          try {
            if (a === 'tamu' || a === 'staf') { await L.terimaPendaftar(u, d, a); toast(`${d.n} diterima sebagai ${a === 'staf' ? 'Staf 🛡' : 'Tamu ✅'}`); }
            if (a === 'kirimTolak') { await L.tolakPendaftar(u, k.querySelector('[data-tolak] input').value || 'Data belum lengkap atau tidak sesuai.'); await L.kirimNotif(u, 'Pendaftaranmu belum diterima. Buka kantor untuk melihat catatan Direktur.').catch(() => {}); kotor = false; toast('Pendaftaran ditolak'); gambar(true); }
            if (a === 'hapus') { await L.hapus('pendaftaran/' + u); toast('Dihapus'); }
          } catch (e) { gagal(e); b.disabled = false; }
        });
      });
    },
  };
}

// ---------------------------------------------------------------- 👥 ANGGOTA
let cari = '', fTj = '', fPeran = '';
function vAnggota() {
  const semua = ent(S.anggota).map(([u, a]) => ({ u, ...a, peran: S.peran?.[u] || 'tamu', exp: expOf(u) }));
  for (const [u, p] of ent(S.peran)) if (!S.anggota?.[u]) semua.push({ u, n: nama(u), tj: '', peran: p, exp: 0 });
  const on = new Set(onlineAktif().map(([u]) => u));
  const list = semua.filter(a => (!cari || (a.n || '').toLowerCase().includes(cari) || kodeTamu(a.u).toLowerCase().includes(cari)) && (!fTj || a.tj === fTj) && (!fPeran || a.peran === fPeran))
    .sort((a, b) => (b.sejak || 0) - (a.sejak || 0));
  return {
    html: `<div class="alat">
        <input id="aC" placeholder="Cari nama atau kode tamu…" value="${esc(cari)}" aria-label="Cari anggota">
        <select id="aT" aria-label="Filter tujuan"><option value="">Semua tujuan</option>${Object.entries(TUJUAN).map(([k, t]) => `<option value="${k}" ${fTj === k ? 'selected' : ''}>${t.ikon} ${t.nama}</option>`).join('')}</select>
        <select id="aP" aria-label="Filter peran"><option value="">Semua peran</option>${['tamu', 'staf', 'direktur'].map(p => `<option ${fPeran === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      </div>
      <p class="kecil">${fmt(list.length)} dari ${fmt(semua.length)} anggota · ketuk baris untuk mengelola</p>
      <div class="tabelWrap"><table><thead><tr><th>Nama</th><th>Tujuan</th><th>Peran</th><th>Level</th><th>EXP</th><th>Eksekutif</th><th>Status</th><th>Sejak</th></tr></thead><tbody>
      ${list.map(a => `<tr data-u="${esc(a.u)}" class="${pilihAnggota === a.u ? 'pilih' : ''}"><td><b>${esc(a.n)}</b><br><code>${esc(kodeTamu(a.u))}</code></td><td>${pillTj(a.tj)}</td><td>${a.peran === 'direktur' ? '👑 Direktur' : a.peran === 'staf' ? '🛡 Staf' : 'Tamu'}</td>
        <td class="angkaK">${a.peran === 'direktur' ? '∞' : levelDari(a.exp)}</td><td class="angkaK">${a.peran === 'direktur' ? '∞' : fmt(a.exp)}</td><td>${vipAktif(a.u) ? '💎 s/d ' + esc(tgl(S.vip[a.u].sampai)) : '—'}</td>
        <td>${diusir(a.u) ? '🚪 diusir' : on.has(a.u) ? '🟢 online' : '—'}</td><td>${esc(tgl(a.sejak))}</td></tr>`).join('') || '<tr><td colspan="8" class="kosong">Belum ada anggota.</td></tr>'}
      </tbody></table></div>
      ${pilihAnggota ? detailAnggota(pilihAnggota) : ''}`,
    pasang(el) {
      const c = el.querySelector('#aC'); c.oninput = () => { cari = c.value.trim().toLowerCase(); kotor = false; gambar(true); const n = $('aC'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      el.querySelector('#aT').onchange = e => { fTj = e.target.value; gambar(true); };
      el.querySelector('#aP').onchange = e => { fPeran = e.target.value; gambar(true); };
      el.querySelectorAll('tbody tr[data-u]').forEach(r => r.onclick = () => { pilihAnggota = pilihAnggota === r.dataset.u ? null : r.dataset.u; gambar(true); const d = el.querySelector('.detail') || $('isi').querySelector('.detail'); d && d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
      pasangDetail(el);
    },
  };
}
function detailAnggota(u) {
  const a = S.anggota?.[u] || { n: nama(u), tj: 'teman' }, peran = S.peran?.[u] || 'tamu', ban = S.ban?.[u];
  const dir = peran === 'direktur';
  return `<section class="detail" data-du="${esc(u)}">
    <div class="baris" style="justify-content:space-between"><h3>${dir ? '👑 ' : peran === 'staf' ? '🛡 ' : ''}${esc(a.n)}</h3><button class="btn putih kecil" type="button" data-d="tutup">Tutup</button></div>
    <p class="kecil">UID <code>${esc(u)}</code> · Kode tamu <code>${esc(kodeTamu(u))}</code></p>
    <div class="seksi"><h4>Data</h4><div class="baris"><input data-i="n" maxlength="20" value="${esc(a.n)}" style="flex:1 1 160px" aria-label="Nama"><select data-i="tj" style="flex:0 1 180px" aria-label="Tujuan">${Object.entries(TUJUAN).map(([k, t]) => `<option value="${k}" ${a.tj === k ? 'selected' : ''}>${t.ikon} ${t.nama}</option>`).join('')}</select><button class="btn kecil" type="button" data-d="simpan">Simpan</button></div></div>
    ${dir ? '<div class="seksi"><p>Direktur punya EXP tak terbatas, semua outfit, dan semua fitur Eksekutif.</p></div>' : `
    <div class="seksi"><h4>EXP · Level ${levelDari(expOf(u))}</h4>
      <p class="kecil">Dari tugas: ${fmt(S.exp?.[u]?.n || 0)} · Dibeli/hadiah: ${fmt(S.expBeli?.[u] || 0)}</p>
      <div class="baris"><button class="btn putih kecil" type="button" data-exp="50">+50</button><button class="btn putih kecil" type="button" data-exp="100">+100</button><button class="btn putih kecil" type="button" data-exp="500">+500</button>
      <input data-i="expSet" type="number" min="0" placeholder="Atur EXP bonus" style="width:150px" aria-label="Atur EXP bonus"><button class="btn kecil" type="button" data-d="expSet">Atur</button></div></div>
    <div class="seksi"><h4>${IKON_DM} Diamond · saldo ${fmt(S.diamond?.[u] || 0)}</h4>
      <p class="kecil">Barang dimiliki: ${esc(Object.keys(S.milik?.[u] || {}).map(id => (BARANG_DIAMOND.find(x => x.id === id) || {}).nama || id).join(', ') || '—')}</p>
      <div class="baris"><button class="btn putih kecil" type="button" data-dm="50">+50</button><button class="btn putih kecil" type="button" data-dm="100">+100</button><button class="btn putih kecil" type="button" data-dm="500">+500</button>
      <input data-i="dmSet" type="number" min="0" placeholder="Atur saldo" style="width:130px" aria-label="Atur saldo diamond"><button class="btn kecil" type="button" data-d="dmSet">Atur</button></div></div>
    <div class="seksi"><h4>Kartu Eksekutif ${vipAktif(u) ? `· aktif s/d ${esc(tgl(S.vip[u].sampai))}` : ''}</h4>
      <div class="baris"><button class="btn putih kecil" type="button" data-vip="7">+7 hari</button><button class="btn putih kecil" type="button" data-vip="30">+30 hari</button><button class="btn putih kecil" type="button" data-vip="365">+1 tahun</button>${vipAktif(u) ? '<button class="btn merah kecil" type="button" data-d="vipCabut">Cabut</button>' : ''}</div></div>
    <div class="seksi"><h4>Jabatan</h4><div class="baris"><button class="btn ${peran === 'staf' ? 'putih' : ''} kecil" type="button" data-d="${peran === 'staf' ? 'jadiTamu' : 'jadiStaf'}">${peran === 'staf' ? 'Jadikan tamu biasa' : 'Angkat jadi Staf 🛡'}</button></div></div>
    <div class="seksi"><h4>Tindakan ${ban && ban.sampai > kini() ? `· 🚪 diusir s/d ${esc(tgl(ban.sampai))} (${esc(ban.alasan || '')})` : ''}</h4>
      <div class="baris"><input data-i="alasan" maxlength="100" placeholder="Alasan" value="Melanggar aturan kantor" style="flex:1 1 200px" aria-label="Alasan">
      <button class="btn putih kecil" type="button" data-usir="10">Usir 10 mnt</button><button class="btn putih kecil" type="button" data-usir="1440">Usir 1 hari</button><button class="btn merah kecil" type="button" data-usir="blokir">Blokir</button>
      ${ban && ban.sampai > kini() ? '<button class="btn hijau kecil" type="button" data-d="ampun">Ampuni</button>' : ''}</div>
      <div class="baris" style="margin-top:8px"><button class="btn merah kecil" type="button" data-d="cabut">Cabut keanggotaan</button><span class="kecil">Kembali jadi pengunjung (harus daftar ulang)</span></div></div>`}
    <div class="seksi"><h4>Kirim pesan dari Direktur</h4><div class="baris"><input data-i="pesan" maxlength="200" placeholder="Pesan muncul di layarnya" style="flex:1 1 240px" aria-label="Pesan"><button class="btn kecil" type="button" data-d="pesan">Kirim</button></div></div>
  </section>`;
}
function pasangDetail(el) {
  const d = el.querySelector('.detail'); if (!d) return;
  const u = d.dataset.du, a = S.anggota?.[u] || { n: nama(u) }, i = k => d.querySelector(`[data-i="${k}"]`);
  const jalankan = (p, pesan) => p.then(() => { kotor = false; toast(pesan); }).catch(gagal);
  d.querySelectorAll('[data-exp]').forEach(b => b.onclick = () => jalankan(L.beriExp(u, +b.dataset.exp).then(() => L.kirimNotif(u, `Kamu dapat ${b.dataset.exp} EXP dari Direktur 🎁`)), `+${b.dataset.exp} EXP ✔`));
  d.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => jalankan(L.beriDiamond(u, +b.dataset.dm).then(() => L.kirimNotif(u, `Kamu dapat ${b.dataset.dm} Diamond dari Direktur 🎁`)), `+${b.dataset.dm} Diamond ✔`));
  d.querySelectorAll('[data-vip]').forEach(b => b.onclick = () => jalankan(L.beriVip(u, +b.dataset.vip).then(() => L.kirimNotif(u, `Kartu Eksekutif kamu diperpanjang ${b.dataset.vip} hari 💎`)), 'Kartu Eksekutif diperpanjang 💎'));
  d.querySelectorAll('[data-usir]').forEach(b => b.onclick = () => {
    const m = b.dataset.usir === 'blokir' ? 60 * 24 * 365 * 100 : +b.dataset.usir;
    jalankan(L.usir(u, m, i('alasan').value || 'Melanggar aturan kantor', a.n), `${a.n} dikeluarkan 🚪`);
  });
  d.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    const k = b.dataset.d;
    if (k === 'tutup') { pilihAnggota = null; gambar(true); }
    if (k === 'simpan') { const n = bersih(i('n').value, 20); if (n.length < 2) return toast('Nama minimal 2 huruf'); jalankan(L.ubahAnggota(u, { n, tj: i('tj').value }), 'Data anggota disimpan ✔'); }
    if (k === 'dmSet') { const n = +i('dmSet').value; if (!(n >= 0)) return toast('Isi angka diamond'); jalankan(L.setDiamond(u, n), 'Saldo diamond diatur ✔'); }
    if (k === 'expSet') { const n = +i('expSet').value; if (!(n >= 0)) return toast('Isi angka EXP'); jalankan(L.setExpBeli(u, n), 'EXP bonus diatur ✔'); }
    if (k === 'vipCabut') jalankan(db.set('vip/' + u, { sampai: kini() }), 'Kartu Eksekutif dicabut');
    if (k === 'jadiStaf') jalankan(L.setPeran(u, 'staf').then(() => L.kirimNotif(u, 'Kamu diangkat menjadi Staf 🛡')), `${a.n} sekarang Staf 🛡`);
    if (k === 'jadiTamu') jalankan(L.setPeran(u, null), `${a.n} kembali jadi tamu`);
    if (k === 'ampun') jalankan(L.ampuni(u), 'Sudah diampuni');
    if (k === 'cabut') { if (b.dataset.yakin !== '1') { b.dataset.yakin = '1'; b.textContent = 'Yakin? Ketuk lagi'; return; } jalankan(L.cabutAnggota(u), `Keanggotaan ${a.n} dicabut`); pilihAnggota = null; }
    if (k === 'pesan') { const m = bersih(i('pesan').value, 200); if (!m) return; jalankan(L.kirimNotif(u, m), 'Pesan terkirim 📬'); i('pesan').value = ''; }
  });
}

// ---------------------------------------------------------------- 🟢 ONLINE
function vOnline() {
  const on = onlineAktif().sort((a, b) => (a[1].n || '').localeCompare(b[1].n || ''));
  return {
    html: `<p class="kecil">Orang yang sedang berada di kantor (diperbarui langsung). ${db.mode === 'lokal' ? 'Mode lokal: NPC tidak tercatat di sini, hanya tab-tab browser ini.' : ''}</p>
      <div class="tabelWrap"><table><thead><tr><th>Nama</th><th>Tujuan</th><th>Lokasi</th><th>Kegiatan</th><th>Level</th><th></th></tr></thead><tbody>
      ${on.map(([u, p]) => { const lok = LOKASI[lokasiDi(p.x, p.z)]; return `<tr data-u="${esc(u)}"><td><b>${S.peran?.[u] === 'direktur' ? '👑 ' : S.peran?.[u] === 'staf' ? '🛡 ' : ''}${esc(p.n)}</b></td><td>${pillTj(p.tj)}</td><td>${esc(lok ? lok.nama : 'di jalan')}</td><td>${p.a === 2 ? '🪑 duduk' : p.a === 1 ? '🚶 jalan' : '🧍 diam'}${p.mj ? ' · ' + esc(p.mj) : ''}</td><td class="angkaK">${S.peran?.[u] === 'direktur' ? '∞' : esc(p.lv || 1)}</td><td><button class="btn putih kecil" type="button" data-kelola="${esc(u)}">Kelola</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="kosong">Belum ada yang online.</td></tr>'}
      </tbody></table></div>`,
    pasang(el) { el.querySelectorAll('[data-kelola]').forEach(b => b.onclick = e => { e.stopPropagation(); pilihAnggota = b.dataset.kelola; bagian = 'anggota'; history.replaceState(null, '', '#anggota'); gambar(true); }); },
  };
}

// ---------------------------------------------------------------- 💬 AKTIVITAS
function vAktivitas() {
  const urut = o => ent(o).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  const baris = (path, kiri, kanan) => `<li><span class="isi">${kiri}</span><time>${esc(kanan)}</time><button class="btn merah kecil" type="button" data-h="${esc(path)}">Hapus</button></li>`;
  const isi = {
    feed: () => feedHtml(aktivitasTerbaru(80)),
    chat: () => `<ul class="feed">${urut(S.chat).map(([k, c]) => baris('chat/' + k, `<b>${esc(bersih(c.n, 20))}</b> ${esc(c.m)}`, lalu(c.t))).join('') || '<li class="kosong">Belum ada chat.</li>'}</ul>`,
    papan: () => `<ul class="feed">${urut(S.papan).map(([k, c]) => baris('papan/' + k, `“${esc(c.m)}” — <b>${esc(c.n)}</b>`, lalu(c.t))).join('') || '<li class="kosong">Kosong.</li>'}</ul>`,
    curhat: () => `<p class="kecil">Penulis curhat hanya terlihat oleh Direktur & Staf; tamu lain tetap melihatnya anonim.</p><ul class="feed">${urut(S.curhat).map(([k, c]) => baris('curhat/' + k, `“${esc(c.m)}”<br><span class="kecil">oleh ${esc(S.curhatPemilik?.[k] ? nama(S.curhatPemilik[k]) : '?')} · 🤗 ${Object.keys(c.peluk || {}).length} · 💬 ${Object.keys(c.balas || {}).length}</span>${ent(c.balas).map(([bk, b]) => `<br>↳ <b>${esc(bersih(b.n, 20))}</b> ${esc(b.m)} <button class="btn merah kecil" type="button" data-h="curhat/${esc(k)}/balas/${esc(bk)}">×</button>`).join('')}`, lalu(c.t))).join('') || '<li class="kosong">Kosong.</li>'}</ul>`,
  };
  return {
    html: `<div class="tab">${[['feed', 'Semua'], ['chat', 'Chat'], ['papan', 'Papan rapat'], ['curhat', 'Curhat']].map(([k, n]) => `<button type="button" data-s="${k}" class="${subAktivitas === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="panel" style="margin-top:0">${isi[subAktivitas]()}</div>
      <p class="kecil">🔒 Isi obrolan pribadi antar-tamu tidak bisa dibaca siapa pun selain dua orang di dalamnya, termasuk Direktur. Gunakan laporan dari tamu untuk menindak pelanggaran.</p>`,
    pasang(el) {
      el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { subAktivitas = b.dataset.s; gambar(true); });
      el.querySelectorAll('[data-h]').forEach(b => b.onclick = () => L.hapus(b.dataset.h).then(() => toast('Dihapus')).catch(gagal));
    },
  };
}

// ---------------------------------------------------------------- 📅 ACARA
const TEMPLAT = [
  { judul: 'Speed Dating Malam Minggu', isi: 'Kenalan cepat 5 menit per orang. Datang ke Kafe Jodoh, duduk, dan sapa yang di sebelahmu!', lokasi: 'kafe', durasi: 60, exp: 50 },
  { judul: 'Mabar Bareng', isi: 'Cari teman main game. Kumpul di meja Gaming, bagikan ID game kalian.', lokasi: 'meja', durasi: 90, exp: 40 },
  { judul: 'Sesi Curhat Bareng', isi: 'Ruang aman untuk cerita. Tulis di papan curhat, saling peluk dan kuatkan.', lokasi: 'taman', durasi: 60, exp: 40 },
  { judul: 'Kuis Cinta', isi: 'Direktur kasih pertanyaan di chat, yang jawab paling cepat menang hadiah EXP.', lokasi: 'rapat', durasi: 45, exp: 50 },
  { judul: 'Turnamen Tangkap Hati', isi: 'Skor tertinggi hari ini dapat hadiah dari Direktur!', lokasi: 'lobi', durasi: 60, exp: 30 },
  { judul: 'Malam Eksekutif', isi: 'Nongkrong santai khusus pemegang Kartu Eksekutif.', lokasi: 'lounge', durasi: 90, exp: 40 },
];
const keWib = ms => new Date(ms + 7 * 3600e3).toISOString().slice(0, 16);
function dariWib(v) { const [t, j] = String(v).split('T'); if (!j) return NaN; const [y, m, d] = t.split('-').map(Number); const [h, mi] = j.split(':').map(Number); return Date.UTC(y, m - 1, d, h - 7, mi); }
function vAcara() {
  const now = kini();
  const list = ent(S.acara).sort((a, b) => b[1].mulai - a[1].mulai);
  const status = a => now < a.mulai ? '📅 akan datang' : now <= a.mulai + a.durasi * 60000 ? '🔴 LIVE' : '✔️ selesai';
  return {
    html: `<div class="dua">
      <div class="panel" style="margin-top:0"><h3>➕ Jadwalkan acara</h3>
        <div class="baris" style="margin-bottom:8px">${TEMPLAT.map((t, i) => `<button class="btn putih kecil" type="button" data-t="${i}">${esc(t.judul)}</button>`).join('')}</div>
        <form id="aF">
          <label for="aJ">Judul</label><input id="aJ" maxlength="60" required>
          <label for="aI">Keterangan</label><textarea id="aI" maxlength="200" rows="2"></textarea>
          <div class="dua" style="gap:10px">
            <div><label for="aL">Tempat</label><select id="aL">${Object.entries(LOKASI).map(([k, l]) => `<option value="${k}">${esc(l.nama)}</option>`).join('')}</select></div>
            <div><label for="aW">Mulai (WIB)</label><input id="aW" type="datetime-local" value="${keWib(Math.ceil((now + 30 * 60000) / 3600e3) * 3600e3)}" required></div>
            <div><label for="aD">Durasi</label><select id="aD">${[15, 30, 45, 60, 90, 120, 180, 240].map(m => `<option value="${m}" ${m === 60 ? 'selected' : ''}>${m} menit</option>`).join('')}</select></div>
            <div><label for="aE">Hadiah EXP hadir</label><input id="aE" type="number" min="0" max="200" step="5" value="40"></div>
          </div>
          <p class="err" id="aX"></p>
          <button class="btn" type="submit">Jadwalkan</button>
        </form></div>
      <div class="panel" style="margin-top:0"><h3>Daftar acara</h3>
        ${list.length ? `<ul class="feed">${list.map(([id, a]) => {
          const ikut = Object.keys(S.ikutAcara?.[id] || {}), hadir = Object.keys(S.hadirAcara?.[id] || {});
          return `<li><span class="isi"><b>${esc(a.judul)}</b> <span class="kecil">${status(a)}</span><br><span class="kecil">${esc(LOKASI[a.lokasi]?.nama || '')} · ${esc(tgl(a.mulai))} · ${a.durasi} mnt · 🎁 ${a.exp} EXP</span><br>
            <span class="kecil">👥 Ikut (${ikut.length}): ${esc(ikut.map(nama).join(', ') || '—')}<br>✅ Hadir (${hadir.length}): ${esc(hadir.map(nama).join(', ') || '—')}</span></span>
            <button class="btn merah kecil" type="button" data-hapus="${esc(id)}">Hapus</button></li>`;
        }).join('')}</ul>` : '<p class="kosong">Belum ada acara.</p>'}
      </div></div>`,
    pasang(el) {
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = TEMPLAT[+b.dataset.t]; el.querySelector('#aJ').value = t.judul; el.querySelector('#aI').value = t.isi; el.querySelector('#aL').value = t.lokasi; el.querySelector('#aD').value = t.durasi; el.querySelector('#aE').value = t.exp; });
      el.querySelectorAll('[data-hapus]').forEach(b => b.onclick = () => L.hapus('acara/' + b.dataset.hapus).then(() => toast('Acara dihapus')).catch(gagal));
      el.querySelector('#aF').onsubmit = e => {
        e.preventDefault();
        const X = el.querySelector('#aX'), judul = bersih(el.querySelector('#aJ').value, 60), mulai = dariWib(el.querySelector('#aW').value);
        const durasi = +el.querySelector('#aD').value, exp = Math.max(0, Math.min(200, Math.round(+el.querySelector('#aE').value || 0)));
        if (judul.length < 3) { X.textContent = 'Judul minimal 3 huruf.'; return; }
        if (!isFinite(mulai)) { X.textContent = 'Isi waktu mulai.'; return; }
        if (mulai + durasi * 60000 < kini()) { X.textContent = 'Waktu acara sudah lewat.'; return; }
        L.buatAcara({ judul, isi: bersih(el.querySelector('#aI').value, 200), lokasi: el.querySelector('#aL').value, mulai, durasi, exp });
        document.activeElement && document.activeElement.blur(); kotor = false;
        toast('Acara dijadwalkan 📅'); setTimeout(() => gambar(true), 300);
      };
    },
  };
}

// ---------------------------------------------------------------- 💳 TOKO
function vToko() {
  const semua = ent(S.pesanan).sort((a, b) => a[1].t - b[1].t);
  const ps = semua.filter(([, v]) => v.metode !== 'otomatis'), pOto = semua.filter(([, v]) => v.metode === 'otomatis');
  const rw = ent(S.riwayat).sort((a, b) => b[1].t - a[1].t);
  const total = rw.reduce((a, [, r]) => a + (r.harga || 0), 0);
  const bln = t => new Date(t + 7 * 3600e3).toISOString().slice(0, 7);
  const bulanIni = rw.filter(([, r]) => bln(r.t) === bln(kini())).reduce((a, [, r]) => a + (r.harga || 0), 0);
  const perMetode = Object.keys(METODE).map(m => [m, rw.filter(([, r]) => r.metode === m).reduce((a, [, r]) => a + (r.harga || 0), 0)]).filter(([, v]) => v);
  const donasi = rw.filter(([, r]) => r.jenis === 'donasi').reduce((a, [, r]) => a + (r.harga || 0), 0);
  const B = CFG.pembayaran || {}, metode = [B.otomatis === 'midtrans' ? '⚡ Otomatis (Midtrans)' : null, B.qris ? 'QRIS' : null, ...(B.bank || []).filter(x => x && x.nomor).map(x => x.bank), CFG.toko?.linkBayar ? 'Lainnya' : null].filter(Boolean);
  const kat = S.katalog || {}, katBeda = BARANG_DIAMOND.filter(x => !kat[x.id] || kat[x.id].harga !== x.harga);
  const donatur = ent(S.donatur).sort((a, b) => (b[1].total || 0) - (a[1].total || 0));
  const dmBeredar = ent(S.diamond).reduce((a, [, v]) => a + (+v || 0), 0);
  return {
    html: `<div class="grid"><div class="angka sorot"><b>${fmt(ps.length)}</b><span>pesanan menunggu</span></div><div class="angka"><b>${rp(bulanIni)}</b><span>pendapatan bulan ini</span></div><div class="angka"><b>${rp(total)}</b><span>total pendapatan</span></div><div class="angka"><b>${rp(donasi)}</b><span>🎁 total donasi</span></div><div class="angka"><b>${fmt(dmBeredar)}</b><span>${IKON_DM} diamond beredar</span></div></div>
      <div class="panel"><h3>Metode pembayaran aktif <small>${metode.length ? esc(metode.join(' · ')) : 'belum ada'}</small></h3>
        ${B.otomatis === 'midtrans' ? `<p class="kecil">⚡ <b>Pembayaran otomatis aktif.</b> Pesanan lewat Midtrans langsung lunas sendiri, tidak perlu disetujui. ${pOto.length ? `${fmt(pOto.length)} tamu sedang di halaman bayar.` : ''} Uang masuk ke saldo Midtrans kamu, lalu dicairkan ke rekening.</p>` : '<p class="kecil">💡 Mau diamond masuk otomatis tanpa perlu menyetujui? Aktifkan Midtrans (lihat README bagian <b>Pembayaran otomatis</b>).</p>'}
        ${metode.length ? '<p class="kecil">Atur QRIS & rekening di <code>config.js</code> → <code>pembayaran</code>.</p>' : '<p><b>⚠️ Toko masih tertutup.</b> Isi <code>pembayaran.qris</code> dan/atau nomor rekening BCA/BRI di <code>config.js</code>, lalu merge ke <code>main</code>.</p>'}
        ${katBeda.length ? `<p><b>⚠️ Harga barang Diamond belum diterbitkan</b> (${katBeda.length} barang). Tanpa ini, tamu tidak bisa membeli barang dengan Diamond.</p><button class="btn" type="button" id="kT">Terbitkan harga barang Diamond</button>` : `<p class="kecil">✅ Harga ${BARANG_DIAMOND.length} barang Diamond sudah terbit.</p>`}
      </div>
      ${pOto.length ? `<div class="panel"><h3>⚡ Menunggu dibayar (otomatis) <small>${fmt(pOto.length)}</small></h3><p class="kecil">Tidak perlu diapa-apakan: lunas → masuk sendiri, tidak dibayar 60 menit → batal sendiri.</p><ul class="feed">${pOto.slice(-20).reverse().map(([, v]) => `<li><span class="isi"><b>${esc(v.nama || v.paket)}</b><br><span class="kecil">${esc(bersih(v.n, 20))} · <code>${esc(v.kode)}</code></span></span><b>${rp(v.nominal)}</b><time>${esc(tgl(v.t))}</time></li>`).join('')}</ul></div>` : ''}
      <div class="panel"><h3>Pesanan manual menunggu</h3>
        <p class="kecil">Buka mutasi rekening / riwayat QRIS, cari <b>nominal unik</b> di bawah (sampai 3 digit terakhir), lalu Setujui. Diamond/paket masuk otomatis ke akun pembeli.</p>
        ${ps.length ? `<ul class="feed">${ps.map(([id, v]) => `<li><span class="isi"><b>${esc(v.nama || paket(v.paket)?.nama || v.paket)}</b> ${v.jenis === 'donasi' ? '🎁' : ''}<br><span class="kecil">${esc(bersih(v.n, 20))} · <code>${esc(v.kode || kodeTamu(v.uid))}</code> · ${esc(tgl(v.t))}${v.pesan ? ` · “${esc(v.pesan)}”` : ''}</span></span>
          <span class="nominal"><b>${rp(v.nominal || paket(v.paket)?.harga || 0)}</b><small>${esc(METODE[v.metode] || '-')}</small></span>
          <span class="baris"><button class="btn hijau kecil" type="button" data-ok="${esc(id)}">Setujui</button><button class="btn putih kecil" type="button" data-no="${esc(id)}">Tolak</button></span></li>`).join('')}</ul>` : '<p class="kosong">Tidak ada pesanan yang menunggu.</p>'}
      </div>
      <div class="dua">
        <div class="panel"><h3>Riwayat penjualan ${perMetode.length ? `<small>${perMetode.map(([m, v]) => `${METODE[m]} ${rp(v)}`).join(' · ')}</small>` : ''}</h3>${rw.length ? `<ul class="feed">${rw.slice(0, 60).map(([, r]) => `<li><span class="isi"><b>${esc(r.nama || r.paket)}</b> · ${rp(r.harga)}<br><span class="kecil">${esc(r.n)} · ${esc(METODE[r.metode] || '-')}</span></span><time>${esc(tgl(r.t))}</time></li>`).join('')}</ul>` : '<p class="kosong">Belum ada penjualan.</p>'}</div>
        <div class="panel"><h3>🏅 Donatur</h3>${donatur.length ? `<ul class="feed">${donatur.map(([, d]) => `<li><span class="isi"><b>${esc(d.n)}</b> ${d.tampil === false ? '<span class="kecil">(anonim di papan)</span>' : ''}<br><span class="kecil">${fmt(d.kali || 1)}× donasi</span></span><b>${rp(d.total)}</b></li>`).join('')}</ul>` : '<p class="kosong">Belum ada donatur.</p>'}
          <h3 style="margin-top:14px">Paket yang dijual</h3><ul class="feed">${[...(CFG.diamond?.paket || []).map(p => ({ nama: `${IKON_DM} ${p.diamond} Diamond`, harga: p.harga, ket: p.ket })), ...(CFG.toko?.paket || [])].map(p => `<li><span class="isi"><b>${esc(p.nama)}</b> · ${rp(p.harga)}<br><span class="kecil">${esc(p.ket || '')}</span></span></li>`).join('')}</ul>
          <h3 style="margin-top:14px">Barang Diamond</h3><ul class="feed">${BARANG_DIAMOND.map(x => `<li><span class="isi"><b>${esc(x.nama)}</b> <span class="kecil">${esc(x.jenis)}</span></span><b>${IKON_DM} ${fmt(x.harga)}</b></li>`).join('')}</ul>
          <p class="kecil">Ubah paket & harga di <code>config.js</code> (paket) dan <code>js/common.js</code> (barang). Setelah mengubah harga barang, tekan "Terbitkan harga" lagi.</p></div>
      </div>`,
    pasang(el) {
      const kt = el.querySelector('#kT'); if (kt) kt.onclick = () => L.terbitkanKatalog(BARANG_DIAMOND).then(() => toast('Harga barang Diamond terbit ✔')).catch(gagal);
      el.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => { const v = S.pesanan[b.dataset.ok]; if (!v) return; b.disabled = true; try { await L.setujuiPesanan(b.dataset.ok, v); toast('Pesanan disetujui ✔'); } catch (e) { gagal(e); b.disabled = false; } });
      el.querySelectorAll('[data-no]').forEach(b => b.onclick = async () => { const v = S.pesanan[b.dataset.no]; if (!v) return; try { await L.tolakPesanan(b.dataset.no, v); toast('Pesanan ditolak'); } catch (e) { gagal(e); } });
    },
  };
}

// ---------------------------------------------------------------- 🚩 LAPORAN & SARAN
function vLaporan() {
  const lp = ent(S.laporan).sort((a, b) => b[1].t - a[1].t), sr = ent(S.saran).sort((a, b) => b[1].t - a[1].t);
  return {
    html: `<div class="dua">
      <div class="panel" style="margin-top:0"><h3>🚩 Laporan <small>${lp.length}</small></h3>${lp.length ? `<ul class="feed">${lp.map(([k, v]) => `<li><span class="isi"><b>${esc(v.n || nama(v.target))}</b> dilaporkan<br><span class="kecil">${esc(v.alasan)} · oleh ${esc(nama(v.dari))} · ${esc(lalu(v.t))}</span></span>
        <span class="baris"><button class="btn putih kecil" type="button" data-kelola="${esc(v.target)}">Kelola</button><button class="btn kecil" type="button" data-usir="${esc(k)}">Usir 1 hari</button><button class="btn putih kecil" type="button" data-hl="${esc(k)}">Selesai</button></span></li>`).join('')}</ul>` : '<p class="kosong">Tidak ada laporan. Kantor aman 👍</p>'}</div>
      <div class="panel" style="margin-top:0"><h3>💡 Saran untuk Direktur <small>${sr.length}</small></h3>${sr.length ? `<ul class="feed">${sr.map(([k, v]) => `<li><span class="isi">“${esc(v.m)}”<br><span class="kecil">${esc(v.n || nama(v.dari))} · ${esc(lalu(v.t))}</span></span><button class="btn putih kecil" type="button" data-hs="${esc(k)}">Arsipkan</button></li>`).join('')}</ul>` : '<p class="kosong">Belum ada saran.</p>'}</div>
    </div>`,
    pasang(el) {
      el.querySelectorAll('[data-hl]').forEach(b => b.onclick = () => L.hapus('laporan/' + b.dataset.hl).then(() => toast('Laporan selesai')).catch(gagal));
      el.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => L.hapus('saran/' + b.dataset.hs).then(() => toast('Saran diarsipkan')).catch(gagal));
      el.querySelectorAll('[data-kelola]').forEach(b => b.onclick = () => { pilihAnggota = b.dataset.kelola; bagian = 'anggota'; history.replaceState(null, '', '#anggota'); gambar(true); });
      el.querySelectorAll('[data-usir]').forEach(b => b.onclick = () => { const v = S.laporan[b.dataset.usir]; if (!v) return; L.usir(v.target, 1440, 'Dilaporkan: ' + v.alasan, v.n || nama(v.target)).then(() => L.hapus('laporan/' + b.dataset.usir)).then(() => toast('Dikeluarkan 1 hari 🚪')).catch(gagal); });
    },
  };
}

// ---------------------------------------------------------------- 📢 SIARAN & PENGATURAN
function vSiaran() {
  const st = S.setelan || {};
  const m = Array.isArray(S.mading) ? S.mading : Object.values(S.mading || {});
  const isiM = [0, 1, 2].map(i => (m.length ? m : CFG.mading)[i] || { judul: '', isi: '' });
  const um = S.pengumuman;
  return {
    html: `<div class="dua">
      <div class="panel" style="margin-top:0"><h3>📢 Pengumuman</h3>
        <p class="kecil">Muncul sebagai spanduk di layar semua orang di kantor (6 jam).${um && um.m ? `<br>Terakhir: “${esc(um.m)}” · ${esc(lalu(um.t))}` : ''}</p>
        <textarea id="uT" maxlength="200" rows="3" placeholder="contoh: Jumat jam 8 malam ada speed dating di Kafe Jodoh!"></textarea>
        <div class="baris" style="margin-top:8px"><button class="btn" type="button" id="uK">Umumkan</button></div></div>
      <div class="panel" style="margin-top:0"><h3>⚙️ Pengaturan kantor</h3>
        <label for="tP">Kantor ${st.tutup ? '🔒 tutup' : '🟢 buka'} · pesan saat tutup</label>
        <input id="tP" maxlength="140" value="${esc(st.pesan || 'Kantor sedang istirahat sebentar. Coba lagi nanti ya!')}">
        <label for="dP">Pendaftaran ${st.daftarTutup ? '🔒 ditutup' : '🟢 dibuka'} · pesan saat ditutup</label>
        <input id="dP" maxlength="140" value="${esc(st.pesanDaftar || 'Direktur sedang tidak menerima tamu baru. Coba lagi nanti ya!')}">
        <div class="baris" style="margin-top:10px">
          <button class="btn putih" type="button" id="sS">Simpan pesan</button>
          <button class="btn ${st.tutup ? 'hijau' : 'merah'}" type="button" id="sK">${st.tutup ? 'Buka kantor' : 'Tutup kantor'}</button>
          <button class="btn ${st.daftarTutup ? 'hijau' : 'putih'}" type="button" id="sD">${st.daftarTutup ? 'Buka pendaftaran' : 'Tutup pendaftaran'}</button>
        </div></div>
    </div>
    <div class="panel"><h3>📌 Mading kantor</h3>
      ${isiM.map((x, i) => `<div class="dua" style="gap:8px;margin-bottom:8px"><input id="mj${i}" maxlength="50" placeholder="Judul ${i + 1}" value="${esc(x.judul)}" aria-label="Judul ${i + 1}"><input id="mi${i}" maxlength="140" placeholder="Isi ${i + 1}" value="${esc(x.isi)}" aria-label="Isi ${i + 1}"></div>`).join('')}
      <button class="btn putih" type="button" id="mS">Simpan mading</button></div>`,
    pasang(el) {
      el.querySelector('#uK').onclick = () => { const t = bersih(el.querySelector('#uT').value, 200); if (t.length < 3) return toast('Tulis pengumumannya dulu'); L.umumkan(t).then(() => { el.querySelector('#uT').value = ''; kotor = false; toast('Pengumuman terkirim 📢'); }).catch(gagal); };
      el.querySelector('#sS').onclick = () => L.setelan({ pesan: bersih(el.querySelector('#tP').value, 140), pesanDaftar: bersih(el.querySelector('#dP').value, 140) }).then(() => { kotor = false; toast('Tersimpan ✔'); }).catch(gagal);
      el.querySelector('#sK').onclick = () => L.setelan({ tutup: !st.tutup }).then(() => toast(st.tutup ? 'Kantor dibuka 🟢' : 'Kantor ditutup 🔒')).catch(gagal);
      el.querySelector('#sD').onclick = () => L.setelan({ daftarTutup: !st.daftarTutup }).then(() => toast('Tersimpan ✔')).catch(gagal);
      el.querySelector('#mS').onclick = () => { const l = [0, 1, 2].map(i => ({ judul: bersih(el.querySelector('#mj' + i).value, 50), isi: bersih(el.querySelector('#mi' + i).value, 140) })).filter(x => x.judul || x.isi); L.simpanMading(l).then(() => { kotor = false; toast('Mading diperbarui 📌'); }).catch(gagal); };
    },
  };
}

// ---------------------------------------------------------------- 🗂 DATA (lihat & ubah langsung)
const NODE_DATA = ['anggota', 'pendaftaran', 'tamu', 'peran', 'exp', 'expBeli', 'diamond', 'milik', 'donatur', 'katalog', 'vip', 'ban', 'acara', 'ikutAcara', 'hadirAcara', 'chat', 'papan', 'curhat', 'laporan', 'saran', 'pesanan', 'riwayat', 'setelan', 'mading', 'pengumuman'];
function vData() {
  const nilai = S[nodeData] ?? {};
  return {
    html: `<div class="panel" style="margin-top:0"><h3>Lihat & ubah data</h3>
      <p class="kecil">Untuk perubahan yang tidak ada tombolnya. Isi harus JSON yang valid dan tetap mematuhi aturan server. Obrolan pribadi tidak termasuk.</p>
      <div class="alat"><select id="dN" aria-label="Pilih data">${NODE_DATA.map(n => `<option ${n === nodeData ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <button class="btn putih" type="button" id="dU">Unduh cadangan semua data (.json)</button></div>
      <textarea class="json" id="dJ" spellcheck="false" aria-label="Isi data JSON">${esc(JSON.stringify(nilai, null, 2))}</textarea>
      <p class="err" id="dE"></p>
      <div class="baris"><label style="margin:0;text-transform:none;letter-spacing:0;display:flex;gap:6px;align-items:center;color:var(--teks)"><input type="checkbox" id="dY" style="width:auto"> Saya yakin mengganti seluruh isi <b>${esc(nodeData)}</b></label><button class="btn" type="button" id="dS">Simpan perubahan</button><button class="btn putih" type="button" id="dR">Muat ulang</button></div></div>`,
    pasang(el) {
      el.querySelector('#dN').onchange = e => { nodeData = e.target.value; kotor = false; gambar(true); };
      el.querySelector('#dR').onclick = () => { kotor = false; gambar(true); };
      el.querySelector('#dU').onclick = () => {
        const b = new Blob([JSON.stringify(Object.fromEntries(NODE_DATA.map(n => [n, S[n] ?? null])), null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `cadangan-ptmcs-${hariIni()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      };
      el.querySelector('#dS').onclick = async () => {
        const E = el.querySelector('#dE');
        if (!el.querySelector('#dY').checked) { E.textContent = 'Centang konfirmasi dulu.'; return; }
        let v; try { v = JSON.parse(el.querySelector('#dJ').value); } catch (e) { E.textContent = 'JSON tidak valid: ' + e.message; return; }
        try { await db.set(nodeData, v); E.textContent = ''; kotor = false; toast(`Data ${nodeData} disimpan ✔`); gambar(true); }
        catch (e) { E.textContent = 'Ditolak server: ' + e.message; }
      };
    },
  };
}
