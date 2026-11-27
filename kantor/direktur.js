// =====================================================================
//  Ruang & Panel Direktur: kendali pemilik PT atas kantor.
//  Semua tindakan juga dijaga database.rules.json di server, jadi
//  tamu biasa tidak bisa memakainya walau mengutak-atik browser.
// =====================================================================
import { CFG, TUJUAN, LOKASI, fmt, esc, bersih, kodeTamu } from '../js/common.js?v=202611270824';
import * as Prog from './progres.js?v=202611270824';
import { $, K, toast, bukaKartu, tutupKartu, tanggalJam } from './ui.js?v=202611270824';
import * as Hadir from './hadir.js?v=202611270824';
import * as Speed from './speeddating.js?v=202611270824';
import { TS, kunciBaru } from '../js/db.js?v=202611270824';

let laporan = {}, saran = {}, larangan = {}, pesanan = {}, lepas = [], tabAktif = '';
const peranku = () => K.L && K.peran[K.L.uid];
const direktur = () => peranku() === 'direktur';
const namaDari = uid => (K.lain.get(uid) || {}).nama || (K.tamu.find(t => t.uid === uid) || {}).n || (K.bot.find(b => b.uid === uid) || {}).nama || uid.slice(0, 8);
const gagal = e => { console.warn(e); toast('Gagal: kamu tidak punya izin untuk tindakan ini.', 3200); };

export function mulai() {
  $('btnPanel').onclick = () => bukaPanel();
  K.segarPanel = () => segar();
  perbaruiPeran();
}

export function perbaruiPeran() {
  if (!K.L) return;
  const p = peranku();
  $('btnPanel').hidden = !p;
  $('btnPanel').textContent = p === 'direktur' ? '👑 Panel' : '🛡 Panel';
  lepas.forEach(f => f && f()); lepas = [];
  if (p) {
    const db = K.L.db;
    lepas.push(db.on('laporan', o => { laporan = o || {}; segar(); }, { limit: 50 }));
    lepas.push(db.on('saran', o => { saran = o || {}; segar(); }, { limit: 50 }));
    lepas.push(db.on('ban', o => { larangan = o || {}; segar(); }));
    if (p === 'direktur') lepas.push(db.on('pesanan', o => {
      // pesanan otomatis (Midtrans) lunas sendiri, jadi tidak perlu ditampilkan di sini
      o = Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v && v.metode !== 'otomatis'));
      const baru = Object.keys(o || {}).filter(k => !pesanan[k]).length;
      if (baru && Object.keys(pesanan).length) toast(`💳 ${baru} pesanan baru masuk`);
      pesanan = o || {}; segar(); tandaPanel();
    }));
  }
}
function tandaPanel() { const n = Object.keys(pesanan).length + Object.keys(laporan).length; const b = $('btnPanel'); b.textContent = (direktur() ? '👑 Panel' : '🛡 Panel') + (n ? ` (${n})` : ''); }
const segar = () => { if (!$('kartu').hidden && document.querySelector('#kartu .panelDir')) bukaPanel(tabAktif); };

// ---------------------------------------------------------------- MEJA DIREKTUR
export function bukaMeja() {
  if (peranku()) { bukaPanel(); return; }
  const dir = Object.entries(K.peran).filter(([, p]) => p === 'direktur').map(([u]) => namaDari(u));
  bukaKartu(`<h2>👑 Ruang Direktur</h2>
    <p>Direktur Utama: <b>${esc(dir.join(', ') || 'belum ada')}</b>. Punya saran, kritik, atau ide acara untuk kantor? Tulis di sini, langsung dibaca Direktur.</p>
    <form id="sF"><label for="sT">Saran untuk Direktur</label><textarea id="sT" maxlength="300" rows="3" placeholder="contoh: Bikin acara speed dating Jumat malam dong!"></textarea>
    <p class="err" id="sE"></p><div class="baris"><button class="btn" type="submit">Kirim saran</button></div></form>
    <p class="kecil masukDir">Kamu Direktur? <a href="../dashboard/index.html">Masuk lewat Dashboard Direktur →</a></p>`, {
    pasang(isi) {
      isi.querySelector('#sF').onsubmit = e => {
        e.preventDefault();
        if (!K.resmi()) { K.bukaDaftar(); return; }
        const t = bersih(isi.querySelector('#sT').value, 300);
        if (t.length < 5) { isi.querySelector('#sE').textContent = 'Tulis sedikit lebih panjang ya.'; return; }
        K.L.saran(K.prof.n, t); tutupKartu(); toast('Saranmu sudah sampai di meja Direktur 🙏');
      };
    },
  });
}

// ---------------------------------------------------------------- PANEL
const TAB = [['kuasa', '👑 Kuasa', true], ['sapa', '👋 Sapaan', true], ['ringkas', 'Ringkasan'], ['acara', 'Acara', true], ['pesanan', 'Pesanan', true], ['orang', 'Pengunjung'], ['laporan', 'Laporan'], ['konten', 'Konten'], ['siaran', 'Siaran', true], ['tim', 'Tim', true], ['akun', 'Akun']];

export function bukaPanel(tab = tabAktif || (direktur() ? 'kuasa' : 'ringkas')) {
  if (!peranku()) { bukaMeja(); return; }
  tabAktif = tab;
  if (!direktur() && (tab === 'kuasa' || tab === 'sapa')) tab = 'ringkas';
  tabAktif = tab;
  const isiTab = { kuasa, sapa: tabSapa, ringkas, acara: tabAcara, pesanan: tabPesanan, orang, laporan: tabLaporan, konten, siaran, tim, akun }[tab]();
  bukaKartu(`<div class="panelDir"><h2>${direktur() ? '👑 Panel Direktur' : '🛡 Panel Staf'}</h2>
    <div class="sw teks tab">${TAB.filter(t => !t[2] || direktur()).map(([k, n]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}${k === 'sapa' && sapaBaru() ? ` (${sapaBaru()})` : ''}${k === 'laporan' && Object.keys(laporan).length ? ` (${Object.keys(laporan).length})` : ''}${k === 'pesanan' && Object.keys(pesanan).length ? ` (${Object.keys(pesanan).length})` : ''}</button>`).join('')}</div>
    <div id="pIsi">${isiTab.html}</div></div>`, {
    pasang(isi) {
      isi.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => bukaPanel(b.dataset.tab));
      isiTab.pasang && isiTab.pasang(isi);
    },
  });
}

// ---------------------------------------------------------------- KUASA DIREKTUR (khusus Direktur)
const sapaBaru = () => Object.values(Hadir.daftarSapaan()).filter(s => s && !s.dibalas).length;
let bagiT = 0;
function kuasa() {
  const tamu = semuaOrang().filter(o => !o.npc && !K.peran[o.uid]);
  return {
    html: `<p class="kecil">Fitur ini hanya bisa dipakai Direktur. Efek & undangan langsung muncul di layar semua orang yang sedang di kantor.</p>
      <div class="kuasaGrid">
        <button type="button" data-k="hati">💗 Hujan hati<small>Semua layar dihujani hati</small></button>
        <button type="button" data-k="kembangapi">🎆 Kembang api<small>Rayakan momen spesial</small></button>
        <button type="button" data-k="bunga">🌸 Hujan bunga<small>Sambut tamu baru</small></button>
        <button type="button" data-k="exp">🎁 Bagi 20 EXP<small>Untuk ${fmt(tamu.length)} tamu yang online</small></button>
        <button type="button" data-k="karyawan">🫡 Panggil karyawan<small>Semua karyawan berkumpul di sekitarmu</small></button>
        <button type="button" data-k="loker">👔 Lemari Direktur<small>Semua baju terbuka untukmu</small></button>
        <button type="button" data-k="info">📢 Papan Informasi<small>Tulis info untuk semua tamu</small></button>
        <button type="button" data-k="pintu">🚪 Pintu Ruanganmu<small>Ketukan tamu, izin masuk, buka/tutup</small></button>
        <button type="button" data-k="suite">🛏️ Ke suite Direktur<small>Kerja, tidur, nonton TV, olahraga</small></button>
      </div>
      ${Speed.htmlKendali()}
      <h3>🎉 Dekorasi musiman</h3><select id="msS">${[['otomatis', 'Otomatis sesuai tanggal'], ['tidak', 'Tanpa dekorasi'], ['valentine', '💘 Valentine'], ['ramadan', '🌙 Ramadan'], ['17an', '🇮🇩 17 Agustus'], ['halloween', '🎃 Halloween'], ['natal', '🎄 Natal & Tahun Baru']].map(([k, n]) => `<option value="${k}" ${(K.setelan?.musim || 'otomatis') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <div id="kmDir"><p class="kecil">Memuat…</p></div>
      <h3>📣 Kumpulkan tamu</h3>
      <p class="kecil">Kirim undangan ke semua tamu online untuk datang ke satu tempat.</p>
      <div class="sw teks">${Object.entries(LOKASI).filter(([, l]) => !l.vip).map(([k, l]) => `<button type="button" data-lok="${k}">${esc(l.nama)}</button>`).join('')}</div>
      <h3>🚀 Datangi tamu</h3>
      ${tamu.length ? `<div class="daftar">${tamu.map(o => `<div><span>${TUJUAN[o.tj]?.ikon || ''} ${esc(o.nama)}${o.mj ? ` <small>· ${esc(o.mj)}</small>` : ''}</span><button type="button" class="mini" data-ke="${esc(o.uid)}">Datangi</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu online.</p>'}`,
    pasang(isi) {
      isi.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        const k = b.dataset.k;
        if (['hati', 'kembangapi', 'bunga'].includes(k)) { Hadir.kirimEfek(k).then(() => tutupKartu()).catch(gagal); return; }
        if (k === 'karyawan') { tutupKartu(); K.panggilKaryawan(); toast('🫡 Karyawan sedang menuju ke tempatmu'); return; }
        if (k === 'loker') { tutupKartu(); Prog.pergiKe('loker'); return; }
        if (k === 'pintu') { K.panelPintuDir(); return; }
        if (k === 'info') { K.bukaPapanInfo(); return; }
        if (k === 'suite') { tutupKartu(); K.pindah(25.5, 18.2, Math.PI); return; }
        if (k === 'exp') {
          if (!tamu.length) { toast('Belum ada tamu online.'); return; }
          if (Date.now() - bagiT < 600000) { toast('Bagi EXP bisa lagi 10 menit setelah yang terakhir.'); return; }
          bagiT = Date.now(); b.disabled = true;
          let ok = 0;
          for (const o of tamu) {
            try {
              const cur = await K.L.db.get('exp/' + o.uid);
              await K.L.db.set('exp/' + o.uid, { n: ((cur && cur.n) || 0) + 20, t: TS });
              await K.L.kirimNotif(o.uid, '🎁 Direktur membagikan +20 EXP untukmu! Terima kasih sudah meramaikan kantor 💖', 'hadiah');
              ok++;
            } catch (e) { console.warn(e); }
          }
          toast(`🎁 +20 EXP terkirim ke ${ok} tamu`); Hadir.efekLokal('hati', 30); b.disabled = false;
        }
      });
      Speed.pasangKendali(isi);
      isi.querySelector('#msS').onchange = e => K.L.setelan({ musim: e.target.value }).then(() => toast('Dekorasi diperbarui 🎉')).catch(gagal);
      K.Komunitas.htmlDirektur().then(h => { const b = isi.querySelector('#kmDir'); if (b) { b.innerHTML = h; K.Komunitas.pasangDirektur(b); } });
      isi.querySelectorAll('[data-lok]').forEach(b => b.onclick = () => Hadir.kirimEfek('kumpul', b.dataset.lok).then(() => { tutupKartu(); Prog.pergiKe(b.dataset.lok); }).catch(gagal));
      isi.querySelectorAll('[data-ke]').forEach(b => b.onclick = () => { const o = K.lain.get(b.dataset.ke); if (!o) return; tutupKartu(); K.pindah(o.x + 1.4, o.z + 1.4); toast(`🚀 Kamu mendatangi ${o.nama}`); });
    },
  };
}

function tabSapa() {
  const l = Object.entries(Hadir.daftarSapaan()).filter(([, s]) => s && s.t).sort((a, b) => b[1].t - a[1].t);
  return {
    html: `<p class="kecil">Sapaan dari tamu (satu terbaru per tamu). Balas dengan satu ketukan; balasanmu muncul sebagai kartu di layar tamu.</p>
      ${l.length ? `<div class="daftar">${l.map(([u, s]) => { const sp = Hadir.SAPA[s.j] || Hadir.SAPA.halo; return `<div><span>${sp.ikon} <b>${esc(bersih(s.n, 30))}</b> <small>${esc(sp.teks)} · ${esc(tanggalJam(s.t))}</small>${s.dibalas ? ' <small>✅ dibalas</small>' : ''}</span><span class="baris kecil" style="margin:0">${Hadir.BALAS.map(([e], i) => `<button type="button" class="mini putih" data-u="${esc(u)}" data-b="${i}">${e}</button>`).join('')}<button type="button" class="mini merah" data-hapus="${esc(u)}">×</button></span></div>`; }).join('')}</div>` : '<p>Belum ada sapaan.</p>'}`,
    pasang(isi) {
      const S = Hadir.daftarSapaan();
      isi.querySelectorAll('[data-b]').forEach(b => b.onclick = () => Hadir.balasSapa(b.dataset.u, S[b.dataset.u], +b.dataset.b));
      isi.querySelectorAll('[data-hapus]').forEach(b => b.onclick = () => K.L.db.set('sapaDir/' + b.dataset.hapus, null).catch(gagal));
    },
  };
}

function semuaOrang() {
  const L = K.L;
  return [...K.lain.values(), ...(L.mode === 'lokal' ? K.bot.filter(b => !b.diusir) : [])];
}

function ringkas() {
  const o = semuaOrang();
  const per = Object.keys(TUJUAN).map(t => `<div class="angka"><b>${fmt(o.filter(x => x.tj === t).length)}</b><span>${TUJUAN[t].ikon} ${TUJUAN[t].nama}</span></div>`).join('');
  const tutup = K.setelan?.tutup;
  return {
    html: `<div class="angkaGrid">
        <div class="angka"><b>${fmt(o.length + 1)}</b><span>orang di kantor</span></div>${per}
        <div class="angka"><b>${fmt(K.tamu.length)}</b><span>total tamu</span></div>
        <div class="angka"><b>${fmt(Object.keys(laporan).length)}</b><span>laporan</span></div>
        <div class="angka"><b>${fmt(Object.keys(saran).length)}</b><span>saran</span></div>
        <div class="angka"><b>${fmt(Object.values(larangan).filter(b => b && b.sampai > K.L.db.now()).length)}</b><span>sedang diusir</span></div>
        <div class="angka"><b>${fmt(Prog.daftarAcara().nanti.length)}</b><span>acara mendatang</span></div>
        ${direktur() ? `<div class="angka"><b>${fmt(Object.keys(pesanan).length)}</b><span>pesanan menunggu</span></div>` : ''}
      </div>
      <p>Status kantor: <b>${tutup ? '🔒 Tutup' : '🟢 Buka'}</b>${K.L.mode === 'lokal' ? ' · <span class="kecil">mode lokal (demo)</span>' : ''}</p>
      ${direktur() ? `<div class="baris"><button class="btn ${tutup ? '' : 'putih'}" type="button" id="tT">${tutup ? 'Buka kantor' : 'Tutup kantor sementara'}</button></div>` : ''}`,
    pasang(isi) {
      const b = isi.querySelector('#tT');
      if (b) b.onclick = () => K.L.setelan({ tutup: !tutup, pesan: K.setelan?.pesan || 'Kantor sedang istirahat sebentar. Coba lagi nanti ya!' }).then(() => { toast(tutup ? 'Kantor dibuka 🟢' : 'Kantor ditutup 🔒'); bukaPanel('ringkas'); }).catch(gagal);
    },
  };
}

function orang() {
  const o = semuaOrang();
  const now = K.L.db.now();
  const diusir = Object.entries(larangan).filter(([, b]) => b && b.sampai > now);
  return {
    html: `<p class="kecil">Ketuk nama untuk melihat profil. Usir = keluar sementara, Blokir = tidak bisa masuk lagi.</p>
      ${o.length ? `<div class="daftar">${o.map(x => {
        const pr = x.npc ? x.peran : K.peran[x.uid];
        return `<div><span><button type="button" class="tautan" data-lihat="${esc(x.uid)}">${pr === 'direktur' ? '👑' : pr === 'staf' ? '🛡' : TUJUAN[x.tj]?.ikon || ''} ${esc(x.nama)}</button></span>${pr ? '' : `<button type="button" class="mini" data-mod="${esc(x.uid)}">Tindak</button>`}</div>`;
      }).join('')}</div>` : '<p>Belum ada pengunjung lain.</p>'}
      <h3>Sedang dikeluarkan</h3>
      ${diusir.length ? `<div class="daftar">${diusir.map(([u, b]) => `<div><span>${esc(b.n || namaDari(u))}<br><small>${b.sampai > now + 3650 * 86400e3 ? 'diblokir' : 'sampai ' + esc(tanggalJam(b.sampai))} · ${esc(b.alasan || '')}</small></span><button type="button" class="mini putih" data-ampun="${esc(u)}">Ampuni</button></div>`).join('')}</div>` : '<p class="kecil">Tidak ada.</p>'}`,
    pasang(isi) {
      isi.querySelectorAll('[data-lihat]').forEach(b => b.onclick = () => import('./sosial.js?v=202611270824').then(S => S.bukaProfil(o.find(x => x.uid === b.dataset.lihat))));
      isi.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => bukaModerasiOrang(o.find(x => x.uid === b.dataset.mod)));
      isi.querySelectorAll('[data-ampun]').forEach(b => b.onclick = () => {
        const u = b.dataset.ampun;
        K.L.ampuni(u).then(() => { const bt = K.bot.find(x => x.uid === u); if (bt) { bt.diusir = false; bt.g.visible = true; } toast('Sudah diampuni.'); }).catch(gagal);
      });
    },
  };
}

export function bukaModerasiOrang(o) {
  if (!o || !peranku()) return;
  const nama = o.nama || o.n, staf = K.peran[o.uid] === 'staf';
  bukaKartu(`<h2>🛡 Tindak ${esc(nama)}</h2>
    <label for="mA">Alasan</label><input id="mA" maxlength="100" placeholder="contoh: spam chat" value="Melanggar aturan kantor">
    <div class="baris">
      <button class="btn putih" type="button" data-m="10">Usir 10 menit</button>
      <button class="btn putih" type="button" data-m="1440">Usir 1 hari</button>
      <button class="btn" type="button" data-m="blokir">Blokir permanen</button>
    </div>
    ${direktur() && !o.npc ? `<h3>Hadiah</h3><div class="baris"><button class="btn putih" type="button" data-exp="50">🎁 +50 EXP</button><button class="btn putih" type="button" data-vip="30">💎 VIP 30 hari</button></div>
    <p class="kecil">Kode tamu: <code>${esc(kodeTamu(o.uid))}</code></p>` : ''}
    ${direktur() && !o.npc ? `<h3>Jabatan</h3><div class="baris"><button class="btn putih" type="button" id="mS">${staf ? 'Cabut jabatan staf' : 'Angkat jadi Staf 🛡'}</button></div><p class="kecil">Staf bisa mengusir tamu, menghapus pesan, dan membaca laporan. Hanya Direktur yang bisa membuat pengumuman, mengubah mading, menutup kantor, dan mengatur tim.</p>` : ''}
    <div class="baris"><button class="btn putih" type="button" id="mK">← Kembali ke panel</button></div>`, {
    pasang(isi) {
      isi.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
        const menit = b.dataset.m === 'blokir' ? 60 * 24 * 365 * 100 : +b.dataset.m;
        const alasan = bersih(isi.querySelector('#mA').value, 100) || 'Melanggar aturan kantor';
        const selesai = () => { toast(`${nama} dikeluarkan dari kantor 🚪`); bukaPanel('orang'); };
        if (o.npc) { K.L.db.set('ban/' + o.uid, { sampai: K.L.db.now() + menit * 60000, alasan, n: nama, oleh: K.L.uid }); o.diusir = true; o.g.visible = false; if (o.duduk) o.duduk.oleh = null; K.hitungOnline(); selesai(); return; }
        K.L.usir(o.uid, menit, alasan, nama).then(selesai).catch(gagal);
      });
      isi.querySelectorAll('[data-exp]').forEach(b => b.onclick = () => K.L.beriExp(o.uid, +b.dataset.exp).then(() => K.L.kirimNotif(o.uid, `Kamu dapat hadiah ${b.dataset.exp} EXP dari Direktur! 🎁`)).then(() => toast('Hadiah terkirim 🎁')).catch(gagal));
      isi.querySelectorAll('[data-vip]').forEach(b => b.onclick = () => K.L.beriVip(o.uid, +b.dataset.vip).then(() => K.L.kirimNotif(o.uid, `VIP kamu aktif ${b.dataset.vip} hari. Selamat menikmati Lounge Eksekutif! 💎`)).then(() => toast('VIP diaktifkan 💎')).catch(gagal));
      const s = isi.querySelector('#mS');
      if (s) s.onclick = () => K.L.setPeran(o.uid, staf ? null : 'staf').then(() => { toast(staf ? 'Jabatan staf dicabut.' : `${nama} sekarang Staf 🛡`); bukaPanel('tim'); }).catch(gagal);
      isi.querySelector('#mK').onclick = () => bukaPanel('orang');
    },
  });
}

function tabLaporan() {
  const lp = Object.entries(laporan).sort((a, b) => (b[1]?.t || 0) - (a[1]?.t || 0));
  const sr = Object.entries(saran).sort((a, b) => (b[1]?.t || 0) - (a[1]?.t || 0));
  return {
    html: `<h3>🚩 Laporan</h3>${lp.length ? `<div class="daftar">${lp.map(([k, v]) => `<div><span><b>${esc(v.n || namaDari(v.target))}</b> dilaporkan<br><small>${esc(v.alasan)} · ${esc(tanggalJam(v.t))} · oleh ${esc(namaDari(v.dari))}</small></span>
        <span class="tombolKecil"><button type="button" class="mini" data-usir="${esc(k)}">Usir 1 hari</button><button type="button" class="mini putih" data-hl="${esc(k)}">Selesai</button></span></div>`).join('')}</div>` : '<p class="kecil">Tidak ada laporan. Kantor aman 👍</p>'}
      <h3>💡 Saran untuk Direktur</h3>${sr.length ? `<div class="daftar">${sr.map(([k, v]) => `<div><span>“${esc(v.m)}”<br><small>${esc(v.n || '')} · ${esc(tanggalJam(v.t))}</small></span><button type="button" class="mini putih" data-hs="${esc(k)}">Arsipkan</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada saran.</p>'}`,
    pasang(isi) {
      isi.querySelectorAll('[data-hl]').forEach(b => b.onclick = () => K.L.hapus('laporan/' + b.dataset.hl).catch(gagal));
      isi.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => K.L.hapus('saran/' + b.dataset.hs).catch(gagal));
      isi.querySelectorAll('[data-usir]').forEach(b => b.onclick = () => {
        const v = laporan[b.dataset.usir]; if (!v) return;
        const bt = K.bot.find(x => x.uid === v.target);
        if (bt) { bt.diusir = true; bt.g.visible = false; }
        K.L.usir(v.target, 1440, 'Dilaporkan: ' + v.alasan, v.n || namaDari(v.target))
          .then(() => K.L.hapus('laporan/' + b.dataset.usir)).then(() => toast('Pengunjung dikeluarkan 1 hari.')).catch(gagal);
      });
    },
  };
}

function konten() {
  const chat = (K.chatList || []).slice(-15).reverse();
  const papan = (K.papanList || []).slice(-10).reverse();
  const cl = (K.curhatList || []).slice(-10).reverse();
  const baris = (p, teks, sub) => `<div><span>${teks}<br><small>${sub}</small></span><button type="button" class="mini merah" data-h="${esc(p)}">Hapus</button></div>`;
  return {
    html: `<h3>Chat terbaru</h3>${chat.length ? `<div class="daftar">${chat.map(c => baris('chat/' + c.k, `<b>${esc(bersih(c.n, 20))}</b> ${esc(c.m)}`, esc(tanggalJam(c.t)))).join('')}</div>` : '<p class="kecil">Kosong.</p>'}
      <h3>Papan rapat</h3>${papan.length ? `<div class="daftar">${papan.map(c => baris('papan/' + c.k, `“${esc(c.m)}” — ${esc(c.n)}`, esc(tanggalJam(c.t)))).join('')}</div>` : '<p class="kecil">Kosong.</p>'}
      <h3>Papan curhat</h3>${cl.length ? `<div class="daftar">${cl.map(c => baris('curhat/' + c.k, `“${esc(c.m)}”`, esc(tanggalJam(c.t)))).join('')}</div>` : '<p class="kecil">Kosong.</p>'}`,
    pasang(isi) { isi.querySelectorAll('[data-h]').forEach(b => b.onclick = () => K.L.hapus(b.dataset.h).then(() => { toast('Dihapus'); b.closest('div').remove(); }).catch(gagal)); },
  };
}

function siaran() {
  const m = K.mading || CFG.mading;
  const isiM = [0, 1, 2].map(i => m[i] || { judul: '', isi: '' });
  return {
    html: `<h3>📢 Pengumuman ke semua orang</h3>
      <p class="kecil">Muncul sebagai spanduk di layar semua orang yang ada di kantor (berlaku 6 jam).</p>
      <textarea id="uT" maxlength="200" rows="2" placeholder="contoh: Jumat jam 8 malam ada speed dating di Kafe Jodoh!"></textarea>
      <div class="baris"><button class="btn" type="button" id="uK">Umumkan</button></div>
      <h3>📌 Isi mading</h3>
      ${isiM.map((x, i) => `<div class="madingEdit"><input id="mj${i}" maxlength="50" placeholder="Judul ${i + 1}" value="${esc(x.judul)}"><textarea id="mi${i}" maxlength="140" rows="2" placeholder="Isi ${i + 1}">${esc(x.isi)}</textarea></div>`).join('')}
      <div class="baris"><button class="btn putih" type="button" id="mS">Simpan mading</button></div>
      <h3>🔒 Pesan saat kantor tutup</h3>
      <input id="tP" maxlength="140" value="${esc(K.setelan?.pesan || 'Kantor sedang istirahat sebentar. Coba lagi nanti ya!')}">
      <div class="baris"><button class="btn putih" type="button" id="tS">Simpan pesan</button></div>`,
    pasang(isi) {
      isi.querySelector('#uK').onclick = () => {
        const t = bersih(isi.querySelector('#uT').value, 200);
        if (t.length < 3) { toast('Tulis pengumumannya dulu.'); return; }
        K.L.umumkan(t).then(() => { toast('Pengumuman terkirim 📢'); isi.querySelector('#uT').value = ''; }).catch(gagal);
      };
      isi.querySelector('#mS').onclick = () => {
        const l = [0, 1, 2].map(i => ({ judul: bersih(isi.querySelector('#mj' + i).value, 50), isi: bersih(isi.querySelector('#mi' + i).value, 140) })).filter(x => x.judul || x.isi);
        K.L.simpanMading(l).then(() => toast('Mading diperbarui 📌')).catch(gagal);
      };
      isi.querySelector('#tS').onclick = () => K.L.setelan({ pesan: bersih(isi.querySelector('#tP').value, 140) }).then(() => toast('Tersimpan')).catch(gagal);
    },
  };
}

function tim() {
  const l = Object.entries(K.peran);
  return {
    html: `<p class="kecil">Angkat staf dari tab Pengunjung → Tindak → Angkat jadi Staf. Direktur ditambahkan lewat Firebase Console (lihat README).</p>
      <div class="daftar">${l.map(([u, p]) => `<div><span>${p === 'direktur' ? '👑' : '🛡'} ${esc(namaDari(u))}${u === K.L.uid ? ' <small>(kamu)</small>' : ''}<br><small>${p === 'direktur' ? 'Direktur' : 'Staf'}</small></span>${p === 'staf' ? `<button type="button" class="mini putih" data-cabut="${esc(u)}">Cabut</button>` : ''}</div>`).join('') || '<div>Belum ada tim.</div>'}</div>`,
    pasang(isi) { isi.querySelectorAll('[data-cabut]').forEach(b => b.onclick = () => K.L.setPeran(b.dataset.cabut, null).then(() => { toast('Jabatan dicabut.'); bukaPanel('tim'); }).catch(gagal)); },
  };
}

function akun() {
  const db = K.L.db;
  return {
    html: `<p>Jabatan: <b>${direktur() ? '👑 Direktur Utama' : '🛡 Staf'}</b></p>
      <p class="kecil">Mode: ${db.mode === 'lokal' ? 'lokal (demo, hanya di browser ini)' : 'online (Firebase)'}${db.email ? `<br>Email: ${esc(db.email)}` : ''}<br>UID: <code>${esc(db.uid)}</code></p>
      ${direktur() ? `<div class="baris"><a class="btn" href="../dashboard/index.html">Buka Dashboard Direktur</a></div>` : ''}`,
  };
}

// ---------------------------------------------------------------- ACARA
const TEMPLAT = [
  { judul: 'Speed Dating Malam Minggu', isi: 'Kenalan cepat 5 menit per orang. Datang ke Kafe Jodoh, duduk, dan sapa yang di sebelahmu!', lokasi: 'kafe', durasi: 60, exp: 50 },
  { judul: 'Mabar Bareng', isi: 'Cari teman main game. Kumpul di meja Gaming, bagikan ID game kalian.', lokasi: 'meja', durasi: 90, exp: 40 },
  { judul: 'Sesi Curhat Bareng', isi: 'Ruang aman untuk cerita. Tulis di papan curhat, saling peluk dan kuatkan.', lokasi: 'taman', durasi: 60, exp: 40 },
  { judul: 'Kuis Cinta', isi: 'Direktur kasih pertanyaan di chat, yang jawab paling cepat menang hadiah EXP.', lokasi: 'rapat', durasi: 45, exp: 50 },
  { judul: 'Turnamen Tangkap Hati', isi: 'Skor tertinggi hari ini dapat hadiah dari Direktur!', lokasi: 'lobi', durasi: 60, exp: 30 },
  { judul: 'Malam Eksekutif', isi: 'Nongkrong santai khusus VIP & VVIP.', lokasi: 'lounge', durasi: 90, exp: 40 },
  { judul: 'Senin Curhat Massal', isi: 'Direktur membacakan curhat anonim pilihan. Tulis curhatmu di Taman Curhat!', lokasi: 'taman', durasi: 60, exp: 40 },
  { judul: 'Rabu Nobar', isi: 'Nonton bareng di layar Ruang Rapat sambil ramai-ramai di chat.', lokasi: 'rapat', durasi: 120, exp: 40 },
  { judul: 'Jumat Speed Dating', isi: 'Kenalan 3 menit per orang. Ikut antrean di menu ⭐ → Harian → Speed Dating.', lokasi: 'kafe', durasi: 90, exp: 60 },
  { judul: 'Minggu: Pasangan Minggu Ini', isi: 'Pengumuman pasangan match yang setuju ditampilkan. Kumpul di lobi!', lokasi: 'lobi', durasi: 30, exp: 30 },
  { judul: 'Lomba Makan Kerupuk 17-an', isi: 'Lomba virtual: menu ⭐ → Harian → Lomba Kerupuk. Juara harian dapat hadiah!', lokasi: 'lobi', durasi: 60, exp: 40 },
  { judul: 'Bukber Virtual', isi: 'Buka puasa bareng di Kafe Jodoh, cerita menu bukamu hari ini.', lokasi: 'kafe', durasi: 60, exp: 40 },
];
function keWib(ms) { const d = new Date(ms + 7 * 3600e3); return d.toISOString().slice(0, 16); }
function dariWib(v) { const [t, j] = v.split('T'); const [y, m, d] = t.split('-').map(Number); const [h, mi] = j.split(':').map(Number); return Date.UTC(y, m - 1, d, h - 7, mi); }

// PAKET ACARA: satu klik menjadwalkan rangkaian sesi sekaligus (menit dari jam mulai)
const PAKET_ACARA = {
  dateNight: {
    nama: '💘 Date Night: Kencan Buta Kantor Cinta',
    info: { j: '💘 DATE NIGHT malam ini!', ik: '💘', w: 'pink', m: 'Kencan buta se-kantor! Dandan di Ruang Loker, Speed Dating di Kafe Jodoh, Truth or Dare berdua, naik bianglala di Taman Cinta, sampai penobatan Raja & Ratu Kencan. Total 230 EXP + hadiah Diamond untuk pasangan terbaik. Datang ya!' },
    sesi: [
      { m: 0, judul: '👗 Date Night · Dandan Kencan', isi: 'Pakai outfit kencan terbaikmu di Ruang Loker (dress code: merah/pink/formal), lalu foto di Photobooth lobi. Outfit terbaik dipuji Direktur!', lokasi: 'loker', durasi: 30, exp: 20 },
      { m: 30, judul: '🎉 Date Night · Pembukaan', isi: 'Sambutan Direktur di lobi + hujan hati. Penjelasan aturan main malam ini. Jangan telat, yang hadir langsung dapat EXP!', lokasi: 'lobi', durasi: 15, exp: 20 },
      { m: 45, judul: '☕ Date Night · Speed Dating', isi: 'Masuk antrean di ⭐ → Harian → Speed Dating. 3 menit ngobrol berdua per ronde, beri ❤ kalau cocok. Saling ❤ = match!', lokasi: 'kafe', durasi: 45, exp: 60 },
      { m: 90, judul: '🎲 Date Night · Truth or Dare Berdua', isi: 'Ajak match-mu duduk di meja nongkrong, buka tab Seru: Truth or Dare, Pilih Mana, dan kartu obrolan. Kenalan lebih dalam!', lokasi: 'meja', durasi: 30, exp: 40 },
      { m: 120, judul: '🎡 Date Night · Kencan di Taman Cinta', isi: 'Pembukaan perdana Taman Cinta khusus malam ini! Naik bianglala berdua, lempar koin harapan di air mancur, popcorn di bioskop.', lokasi: 'plaza', durasi: 30, exp: 50 },
      { m: 150, judul: '👑 Date Night · Raja & Ratu Kencan', isi: 'Penobatan pasangan terbaik malam ini + foto bareng di lobi. Pasangan terpilih dapat hadiah Diamond dari Direktur!', lokasi: 'lobi', durasi: 30, exp: 40 },
    ],
  },
};
function tabAcara() {
  const now = K.L.db.now();
  const awal = keWib(Math.ceil((now + 30 * 60000) / 3600e3) * 3600e3);
  const daftar = Prog.semuaAcara().filter(([, a]) => a.mulai + a.durasi * 60000 > now - 86400e3).slice(0, 12);
  return {
    html: `<h3>💘 Paket acara</h3>
      <div class="kotakInfo"><b>${esc(PAKET_ACARA.dateNight.nama)}</b>
        <p class="kecil">6 sesi berurutan (2,5 jam, total 230 EXP): ${PAKET_ACARA.dateNight.sesi.map(s => esc(s.judul.split(' · ')[1])).join(' → ')}.</p>
        <div class="dua"><div><label for="pkT">Tanggal</label><input id="pkT" type="date" value="${keWib(now + 86400e3).slice(0, 10)}"></div>
        <div><label for="pkJ">Jam mulai (WIB)</label><input id="pkJ" type="time" value="19:30"></div></div>
        <label class="cek"><input type="checkbox" id="pkI" checked> 📢 Pasang pengumuman (disematkan) di Papan Informasi</label>
        <div class="baris"><button class="btn" type="button" id="pkB">💘 Jadwalkan Date Night</button></div></div>
      <h3>➕ Buat acara</h3>
      <p class="kecil">Template cepat:</p>
      <div class="sw teks">${TEMPLAT.map((t, i) => `<button type="button" data-t="${i}">${esc(t.judul)}</button>`).join('')}</div>
      <form id="aF">
        <label for="aJ">Judul</label><input id="aJ" maxlength="60" required placeholder="contoh: Speed Dating Malam Minggu">
        <label for="aI">Keterangan</label><textarea id="aI" maxlength="200" rows="2"></textarea>
        <div class="dua">
          <div><label for="aL">Tempat</label><select id="aL">${Object.entries(LOKASI).map(([k, l]) => `<option value="${k}">${esc(l.nama)}</option>`).join('')}</select></div>
          <div><label for="aW">Mulai (WIB)</label><input id="aW" type="datetime-local" value="${awal}" required></div>
          <div><label for="aD">Durasi</label><select id="aD">${[15, 30, 45, 60, 90, 120, 180].map(m => `<option value="${m}" ${m === 60 ? 'selected' : ''}>${m} menit</option>`).join('')}</select></div>
          <div><label for="aE">Hadiah EXP hadir</label><input id="aE" type="number" min="0" max="200" step="5" value="40"></div>
        </div>
        <p class="err" id="aX"></p>
        <div class="baris"><button class="btn" type="submit">Jadwalkan acara</button></div>
      </form>
      <h3>📅 Acara</h3>
      ${daftar.length ? `<div class="daftar">${daftar.map(([id, a]) => {
        const st = Prog.statAcara(id), live = now >= a.mulai && now <= a.mulai + a.durasi * 60000, lewat = now > a.mulai + a.durasi * 60000;
        return `<div><span>${live ? '🔴 ' : lewat ? '✔️ ' : '📅 '}<b>${esc(a.judul)}</b><br><small>${esc(LOKASI[a.lokasi]?.nama || '')} · ${esc(new Date(a.mulai).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }))} · ${a.durasi}m · 🎁${a.exp} · 👥 ${st.ikut} ikut · ✅ ${st.hadir} hadir</small></span><button type="button" class="mini merah" data-hapus="${esc(id)}">Hapus</button></div>`;
      }).join('')}</div>` : '<p class="kecil">Belum ada acara.</p>'}`,
    pasang(isi) {
      isi.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
        const t = TEMPLAT[+b.dataset.t];
        isi.querySelector('#aJ').value = t.judul; isi.querySelector('#aI').value = t.isi; isi.querySelector('#aL').value = t.lokasi;
        isi.querySelector('#aD').value = t.durasi; isi.querySelector('#aE').value = t.exp;
      });
      isi.querySelector('#pkB').onclick = async () => {
        const P = PAKET_ACARA.dateNight, mulai = dariWib(isi.querySelector('#pkT').value + 'T' + isi.querySelector('#pkJ').value);
        if (!isFinite(mulai) || mulai < K.L.db.now()) { toast('Pilih tanggal & jam yang belum lewat.'); return; }
        if (!confirm(`Jadwalkan ${P.sesi.length} sesi Date Night mulai ${new Date(mulai).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB?`)) return;
        try {
          for (const s of P.sesi) await K.L.buatAcara({ judul: s.judul, isi: s.isi, lokasi: s.lokasi, mulai: mulai + s.m * 60000, durasi: s.durasi, exp: s.exp });
          if (isi.querySelector('#pkI').checked) {
            const jam = new Date(mulai).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
            await K.L.db.set('papanInfo/' + kunciBaru(), { ...P.info, j: '💘 DATE NIGHT · ' + jam.split(' pukul')[0], m: `${jam} WIB. ` + P.info.m, pin: true, t: TS });
          }
          toast('💘 Date Night terjadwal! Semua tamu bisa melihatnya.'); Hadir.kirimEfek('hati').catch(() => {});
          setTimeout(() => bukaPanel('acara'), 500);
        } catch (e) { gagal(e); }
      };
      isi.querySelectorAll('[data-hapus]').forEach(b => b.onclick = () => K.L.hapus('acara/' + b.dataset.hapus).then(() => { toast('Acara dihapus'); bukaPanel('acara'); }).catch(gagal));
      isi.querySelector('#aF').onsubmit = e => {
        e.preventDefault();
        const X = isi.querySelector('#aX');
        const judul = bersih(isi.querySelector('#aJ').value, 60), mulai = dariWib(isi.querySelector('#aW').value);
        const durasi = +isi.querySelector('#aD').value, exp = Math.max(0, Math.min(200, Math.round(+isi.querySelector('#aE').value || 0)));
        if (judul.length < 3) { X.textContent = 'Judul minimal 3 huruf.'; return; }
        if (!isFinite(mulai)) { X.textContent = 'Isi waktu mulai.'; return; }
        if (mulai + durasi * 60000 < K.L.db.now()) { X.textContent = 'Waktu acara sudah lewat.'; return; }
        K.L.buatAcara({ judul, isi: bersih(isi.querySelector('#aI').value, 200), lokasi: isi.querySelector('#aL').value, mulai, durasi, exp });
        toast('Acara dijadwalkan 📅 Semua tamu bisa melihatnya.');
        setTimeout(() => bukaPanel('acara'), 400);
      };
    },
  };
}

// ---------------------------------------------------------------- PESANAN (toko)
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
function tabPesanan() {
  const list = Object.entries(pesanan).filter(([, v]) => v && v.metode !== 'otomatis').sort((a, b) => a[1].t - b[1].t);
  const met = { otomatis: '⚡ Otomatis', qris: 'QRIS', bca: 'BCA', bri: 'BRI', lain: 'Lainnya' };
  return {
    html: `<p class="kecil">Cocokkan <b>nominal unik</b> dengan mutasi rekening/QRIS kamu. Setujui hanya jika uangnya sudah masuk. Kelola lengkap di Dashboard Direktur.</p>
      ${list.length ? `<div class="daftar">${list.map(([id, v]) => `<div><span><b>${esc(v.nama || v.paket)}</b> · <b>${rp(v.nominal || (K.L.cariPaket(v) || {}).harga || 0)}</b><br><small>${esc(bersih(v.n, 20))} · ${esc(met[v.metode] || '-')} · <code>${esc(v.kode || '')}</code> · ${esc(new Date(v.t).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))}</small></span>
        <span class="tombolKecil"><button type="button" class="mini" data-ok="${esc(id)}">Setujui</button><button type="button" class="mini putih" data-no="${esc(id)}">Tolak</button></span></div>`).join('')}</div>` : '<p>Tidak ada pesanan yang menunggu.</p>'}`,
    pasang(isi) {
      isi.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => { const v = pesanan[b.dataset.ok]; if (!v) return; b.disabled = true; try { await K.L.setujuiPesanan(b.dataset.ok, v); toast('Pesanan disetujui ✔'); } catch (e) { gagal(e); b.disabled = false; } });
      isi.querySelectorAll('[data-no]').forEach(b => b.onclick = async () => { const v = pesanan[b.dataset.no]; if (!v) return; try { await K.L.tolakPesanan(b.dataset.no, v); toast('Pesanan ditolak.'); } catch (e) { gagal(e); } });
    },
  };
}
