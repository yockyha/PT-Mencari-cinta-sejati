// =====================================================================
//  Interaksi antar-tamu: profil, ajak ngobrol (pribadi), suka & match,
//  papan curhat, daftar orang di kantor, lapor & sembunyikan.
// =====================================================================
import { TUJUAN, GENDER, LS, bersih, esc, fmt, kasar, igBersih, kodeTamu } from '../js/common.js?v=202611270824';
import { TS } from '../js/db.js?v=202611270824';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, jam, tanggalJam } from './ui.js?v=202611270824';
import * as Musik from './musik.js?v=202611270824';
import * as Prog from './progres.js?v=202611270824';
import * as Suara from './suara.js?v=202611270824';
import * as Grup from './grup.js?v=202611270824';
import * as Stiker from './stiker.js?v=202611270824';
import * as Foto from './foto.js?v=202611270824';
import * as Seru from './seru.js?v=202611270824';

const acak = a => a[Math.floor(Math.random() * a.length)];
const siap = () => { if (!K.resmi()) { toast('👀 Kamu masih pengunjung. Daftar dulu untuk berinteraksi.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const orangDariUid = uid => K.lain.get(uid) || K.bot.find(b => b.uid === uid);
const pillTujuan = tj => TUJUAN[tj] ? `<span class="pillTj" style="--w:${TUJUAN[tj].warna}">${TUJUAN[tj].ikon} ${TUJUAN[tj].nama}</span>` : '';

let ruangTerbuka = null, lepasRuang = null, layar = '', jumlahDmBaru = 0;
function segarBadge() { const n = jumlahDmBaru + Grup.jumlahBaru(); const b = $('badge'); b.textContent = n; b.hidden = !n; }
let rooms = {}, undangan = {}, sudahMatch = new Set(LS.get('matchLihat', []));

// ---------------------------------------------------------------- MULAI
export function mulai() {
  const L = K.L, db = L.db;
  (LS.get('sembunyi', []) || []).forEach(u => K.sembunyi.add(u));
  $('btnObrolan').onclick = () => bukaObrolan();

  db.on('undangan/' + L.uid, o => { undangan = o || {}; gambarUndangan(); });
  db.on('dmku/' + L.uid, o => {
    const lama = rooms; rooms = o || {};
    let belum = 0;
    for (const [r, v] of Object.entries(rooms)) {
      if (!v) continue;
      if (v.baru && r !== ruangTerbuka) {
        belum++;
        if (lama[r] && v.t !== lama[r].t && !K.sembunyi.has(v.u)) toast(`💌 Pesan baru dari ${bersih(v.n, 20)}`);
      }
    }
    jumlahDmBaru = belum; segarBadge();
    if (layar === 'daftar') bukaObrolan();
  });
  K.segarBadge = segarBadge; K.bukaObrolanTab = tab => bukaObrolan(null, tab);
  Grup.mulai();
  Suara.pantauPanggilanMasuk(L);
  db.on('izinIgMinta/' + L.uid, o => { mintaIg = o || {}; gambarMintaIg(); });
  pantauIzin();
  db.on('match/' + L.uid, o => {
    K.match = o || {};
    for (const [u, v] of Object.entries(o || {})) {
      if (sudahMatch.has(u) || !v) continue;
      sudahMatch.add(u); LS.set('matchLihat', [...sudahMatch]);
      rayakanMatch(u, bersih(v.n, 20));
    }
  });
  let disukaiLama = null;
  db.on('jumlahSuka/' + L.uid, o => {
    const n = Math.max(0, o || 0);
    if (disukaiLama !== null && n > disukaiLama) toast('💘 Seseorang diam-diam menyukaimu!', 3200);
    disukaiLama = n; K.disukai = n;
  });

  // mode lokal: salah satu NPC mengajak ngobrol supaya fiturnya bisa dicoba
  if (L.mode === 'lokal') setTimeout(function ajak() {
    if (!K.resmi() || !K.prof || K.terkunci) { setTimeout(ajak, 15000); return; }
    const kandidat = K.bot.filter(b => !b.peran && b.tj === K.prof.tj && !rooms[L.ruang(L.uid, b.uid)]);
    const b = acak(kandidat.length ? kandidat : K.bot.filter(b => !b.peran));
    if (b) L.db.set(`undangan/${L.uid}/${b.uid}`, { n: b.nama, t: TS });
  }, 40000);
}

// ---------------------------------------------------------------- UNDANGAN
function gambarUndangan() {
  const el = $('undangan'), L = K.L;
  const daftar = Object.entries(undangan).filter(([u, v]) => v && !K.sembunyi.has(u) && L.db.now() - (v.t || 0) < 3600e3).slice(-3);
  el.innerHTML = daftar.map(([u, v]) => {
    const o = orangDariUid(u);
    return `<div class="ajak ${Prog.isVip(u) ? 'vip' : ''}" data-u="${esc(u)}">${Prog.isVip(u) ? '<b class="vipTag">💎 Tamu VIP</b>' : ''}<span>💌 <b>${esc(bersih(v.n, 20))}</b>${o && o.tj ? ` <small>${TUJUAN[o.tj].ikon} ${TUJUAN[o.tj].nama}</small>` : ''}<br>ngajak kamu ngobrol</span>
      <button type="button" class="mini" data-a="ya">Terima</button><button type="button" class="mini putih" data-a="tidak">Tolak</button></div>`;
  }).join('');
  el.querySelectorAll('.ajak').forEach(d => {
    const u = d.dataset.u, n = bersih(undangan[u]?.n, 20);
    d.querySelector('[data-a=ya]').onclick = async () => {
      if (!siap()) return;
      try {
        const r = await L.terima(u, K.prof.n, n);
        if (u.startsWith('bot:')) botBalas(r, u, 'sapa');
        bukaObrolan(r);
      } catch (e) { toast('Gagal menerima ajakan. Coba lagi.'); }
    };
    d.querySelector('[data-a=tidak]').onclick = () => L.tolak(u);
  });
}

// ---------------------------------------------------------------- PROFIL
export function bukaProfil(o) {
  if (!o) return;
  const L = K.L, uid = o.uid, nama = o.nama || o.n;
  const peran = o.npc ? o.peran : K.peran[uid];
  const r = L.ruang(L.uid, uid), adaRuang = !!rooms[r];
  const sukaKu = new Set(LS.get('sukaKu', []));
  const bisaSuka = o.tj === 'jodoh' && K.prof?.tj === 'jodoh';
  Prog.lapor('tur_profil');
  bukaKartu(`<div class="kepalaProfil">${o.npc ? '' : Foto.htmlAvatar(uid, nama, 'besar')}<h2>${peran === 'direktur' ? '👑 ' : peran === 'staf' ? '🛡 ' : ''}${esc(nama)}</h2></div>
    <p>${pillTujuan(o.tj)} ${peran ? `<span class="pillTj" style="--w:${peran === 'direktur' ? '#c8901a' : '#3a6ea5'}">${peran === 'direktur' ? 'Direktur Utama' : (o.jabatan || 'Staf kantor')}</span>` : ''}</p>
    <p>${o.gd ? `${GENDER[o.gd]}<br>` : ''}${o.s && o.tj === 'jodoh' ? `💗 Status: <b>${esc(o.s)}</b><br>` : ''}${o.mj ? `🪑 Lagi nongkrong di meja <b>${esc(o.mj)}</b><br>` : ''}${o.b ? `“${esc(o.b)}”<br>` : ''}<span id="pIg"></span>
    ${o.npc ? '<br><span class="kecil">Tamu NPC (mode lokal)</span>' : ''}</p>
    ${o.npc ? '' : `<p class="kecil">${esc(K.Komunitas.jabatanDari(o.lv || 1))}${o.gl ? ` · 🏅 ${esc(o.gl)}` : ''}${K.Aktivitas.gelarRaja(uid, o.gd) ? ` · ${K.Aktivitas.gelarRaja(uid, o.gd)}` : ''}</p>` + Seru.htmlKepribadian(o) + Seru.htmlKecocokan(o)}
    <div class="baris">
      <button class="btn putih" type="button" id="pS">👋 Sapa</button>
      <button class="btn" type="button" id="pA">${adaRuang ? '💬 Buka obrolan' : '💌 Ajak ngobrol'}</button>
      ${bisaSuka ? `<button class="btn putih" type="button" id="pL">${sukaKu.has(uid) ? '💔 Batal suka' : '❤ Suka'}</button>` : ''}
      <button class="btn putih" type="button" id="pD">🚶 Datangi</button>
      ${o.npc ? '' : '<button class="btn putih" type="button" id="pBg">💐 Lempar bunga <small id="pBgN"></small></button><button class="btn putih" type="button" id="pPk">🤗 Peluk</button><button class="btn putih" type="button" id="pKm">🏠 Kamar</button>'}
      ${(adaRuang || (K.match && K.match[uid])) && !o.npc ? '<button class="btn" type="button" id="pT">📞 Telepon</button>' : ''}
    </div>
    <p class="kecil tautan"><button type="button" id="pR">🚩 Laporkan</button> · <button type="button" id="pH">🙈 Sembunyikan</button>${K.peran[L.uid] && !peran ? ' · <button type="button" id="pM">🛡 Moderasi</button> · <button type="button" id="pFH">Hapus foto profil</button>' : ''}</p>
    ${bisaSuka ? '<p class="kecil">❤ Suka itu rahasia. Kalau kalian saling suka, dua-duanya dapat kabar <b>match</b> dan obrolan langsung terbuka.</p>' : ''}`, {
    pasang(isi) {
      isi.querySelector('#pS').onclick = () => { if (!siap()) return; tutupKartu(); $('chatI').value = `Halo ${nama}! `; $('chatI').focus(); };
      isi.querySelector('#pD').onclick = () => { tutupKartu(); K.pindah(o.x + 1.2, o.z + 1.2); };
      const pbg = isi.querySelector('#pBg');
      if (pbg) {
        K.Aktivitas.jumlahBunga(uid).then(n => { const e = isi.querySelector('#pBgN'); if (e && n) e.textContent = `(${n})`; });
        pbg.onclick = () => K.Aktivitas.lemparBunga(o);
        isi.querySelector('#pPk').onclick = () => { tutupKartu(); K.Aktivitas.mintaPeluk(o); };
        isi.querySelector('#pKm').onclick = () => K.Komunitas.bukaKamar(uid, nama);
      }
      const pt = isi.querySelector('#pT'); if (pt) pt.onclick = () => { if (!siap()) return; tutupKartu(); Suara.telepon(L, uid, nama, K.prof.n); };
      isi.querySelector('#pA').onclick = () => {
        if (!siap()) return;
        if (adaRuang) { bukaObrolan(r); return; }
        const kapan = LS.get('ajakT', {}) || {};
        if (Date.now() - (kapan[uid] || 0) < 120000) { toast('Ajakanmu sudah terkirim, tunggu dijawab ya.'); return; }
        kapan[uid] = Date.now(); LS.set('ajakT', kapan);
        L.undang(uid, K.prof.n).then(() => {
          toast(`💌 Ajakan ngobrol terkirim ke ${nama}`); tutupKartu(); Prog.lapor('ajak');
          if (o.npc) setTimeout(() => botTerima(o), 1600);
        }).catch(() => toast('Ajakan gagal terkirim.'));
      };
      const pl = isi.querySelector('#pL');
      if (pl) pl.onclick = async () => {
        if (!siap()) return;
        const set = new Set(LS.get('sukaKu', []));
        if (set.has(uid)) { set.delete(uid); LS.set('sukaKu', [...set]); L.batalSuka(uid); toast('Suka dibatalkan.'); tutupKartu(); return; }
        set.add(uid); LS.set('sukaKu', [...set]);
        try {
          if (o.npc && Math.random() < 0.6) await L.db.update('', { [`suka/${L.uid}/${uid}`]: TS, [`jumlahSuka/${L.uid}`]: (K.disukai || 0) + 1 });
          const cocok = await L.suka(uid, K.prof.n, nama);
          tutupKartu();
          if (!cocok) toast(`❤ Kamu menyukai ${nama}. Dia tidak tahu, kecuali dia juga menyukaimu.`, 3600);
          else if (o.npc) setTimeout(() => botBalas(L.ruang(L.uid, uid), uid, 'match'), 1200);
        } catch (e) { toast('Gagal. Coba lagi.'); }
      };
      if (!o.npc) muatIg(o, isi.querySelector('#pIg'));
      Foto.isiAvatar(isi);
      const ik = isi.querySelector('[data-isikep]'); if (ik) ik.onclick = () => K.bukaDaftar();
      const av = isi.querySelector('.kepalaProfil [data-av]'); if (av) av.onclick = () => { if (av.classList.contains('ada')) Foto.fotoProfil(uid).then(u => u && bukaKartu(`<h2>${esc(nama)}</h2><img class="fotoBesar" src="${u}" alt="Foto profil ${esc(nama)}">`)); };
      const pmH = isi.querySelector('#pFH'); if (pmH) pmH.onclick = () => Foto.hapusFotoProfil(uid).then(() => { toast('Foto profil dihapus.'); tutupKartu(); });
      isi.querySelector('#pR').onclick = () => bukaLapor(o);
      isi.querySelector('#pH').onclick = () => {
        K.sembunyi.add(uid); LS.set('sembunyi', [...K.sembunyi]);
        if (o.npc) o.g.visible = false;
        K.segarkanOrang(); gambarUndangan(); tutupKartu();
        toast(`${nama} disembunyikan. Chat & ajakannya tidak akan muncul lagi.`, 3200);
      };
      const pm = isi.querySelector('#pM'); if (pm) pm.onclick = () => import('./direktur.js?v=202611270824').then(D => D.bukaModerasiOrang(o));
    },
  });
}

// ---------------------------------------------------------------- INSTAGRAM & IZIN
const tautanIg = ig => `📷 <a href="https://www.instagram.com/${encodeURIComponent(ig)}/" target="_blank" rel="noopener">@${esc(ig)}</a>`;
const tautanTt = tt => `🎵 <a href="https://www.tiktok.com/@${encodeURIComponent(tt)}" target="_blank" rel="noopener">@${esc(tt)}</a>`;
// Data pribadi (nama lengkap, Instagram, TikTok): terlihat oleh Direktur, VVIP & yang diizinkan
async function muatIg(o, el) {
  const L = K.L, uid = o.uid;
  const hasil = await L.db.get('profilPribadi/' + uid).then(v => ({ ok: true, v: v || {} }), () => ({ ok: false }));
  if (!el.isConnected) return;
  if (hasil.ok) {
    const v = hasil.v, ig = igBersih(v.ig || ''), tt = String(v.tt || '').replace(/[^a-z0-9._]/g, ''), nl = bersih(v.nl || '', 60);
    if (!ig && !tt && !nl) return;
    const kenapa = K.peran[L.uid] === 'direktur' ? 'kamu Direktur' : Prog.vvipSaya() ? 'kamu VVIP 👑' : 'kamu diizinkan';
    el.innerHTML = `<span class="dataPribadi">${nl ? `🪪 ${esc(nl)}<br>` : ''}${ig ? tautanIg(ig) + '<br>' : ''}${tt ? tautanTt(tt) + '<br>' : ''}<small class="kecil">🔓 Data pribadi · terlihat karena ${kenapa}</small></span>`;
    return;
  }
  const diminta = (LS.get('mintaIg', {}) || {})[uid];
  el.innerHTML = `🔒 Nama lengkap & akun sosmed disembunyikan ${diminta ? '<small>· menunggu izin…</small>' : '<button type="button" class="mini putih" id="pIgM">Minta izin lihat</button>'}<br><small class="kecil">Direktur & VVIP 👑 bisa langsung melihat.</small>`;
  const b = el.querySelector('#pIgM');
  if (b) b.onclick = async () => {
    if (!siap()) return;
    try {
      await L.mintaIzinIg(uid, bersih(K.prof.n, 30));
      const m = LS.get('mintaIg', {}) || {}; m[uid] = Date.now(); LS.set('mintaIg', m);
      pantauIzin();
      b.replaceWith(Object.assign(document.createElement('small'), { textContent: '· permintaan terkirim, menunggu izin…' }));
      toast(`Permintaan terkirim ke ${o.nama} 📨`);
    } catch (e) { toast('Gagal mengirim permintaan.'); }
  };
}
// pemilik: permintaan izin masuk
let mintaIg = {};
function gambarMintaIg() {
  const L = K.L;
  const l = Object.entries(mintaIg).filter(([u, v]) => v && !K.sembunyi.has(u));
  for (const [u, v] of l) {
    if (gambarMintaIg.lihat?.[u] === v.t) continue;
    (gambarMintaIg.lihat ||= {})[u] = v.t;
    if (!K.L || $('kartu').hidden === false) { toast(`🔒 ${bersih(v.n, 30)} minta izin melihat data pribadimu. Buka profilmu untuk menjawab.`, 4500); continue; }
    bukaKartu(`<h2>🔒 Minta izin</h2><p><b>${esc(bersih(v.n, 30))}</b> ingin melihat <b>nama lengkap, Instagram & TikTok</b>-mu.</p>
      <div class="baris"><button class="btn" type="button" id="iY">Izinkan</button><button class="btn putih" type="button" id="iT">Tolak</button></div>`, {
      pasang(i) {
        i.querySelector('#iY').onclick = () => L.izinkanIg(u, true).then(() => { tutupKartu(); toast(`${bersih(v.n, 30)} sekarang bisa melihat data pribadimu 🔓`); });
        i.querySelector('#iT').onclick = () => L.izinkanIg(u, false).then(() => { tutupKartu(); toast('Permintaan ditolak.'); });
      },
    });
  }
}
// peminta: kabari bila sudah diizinkan
const pantauIzinAktif = {};
function pantauIzin() {
  const L = K.L, m = LS.get('mintaIg', {}) || {};
  for (const [u, t] of Object.entries(m)) {
    if (pantauIzinAktif[u] || Date.now() - t > 7 * 86400e3) continue;
    pantauIzinAktif[u] = L.db.on(`izinIg/${u}/${L.uid}`, v => {
      if (v !== true) return;
      const mm = LS.get('mintaIg', {}) || {}; delete mm[u]; LS.set('mintaIg', mm);
      const o = orangDariUid(u), n = o?.nama || (K.tamu.find(x => x.uid === u) || {}).n || 'Seseorang';
      toast(`🔓 ${n} mengizinkanmu melihat data pribadinya`, 4500); tulisLog('', `🔓 ${n} mengizinkanmu melihat data pribadinya`, 'sys');
      pantauIzinAktif[u](); delete pantauIzinAktif[u];
    });
  }
}

function bukaLapor(o) {
  const nama = o.nama || o.n;
  const alasan = ['Kata-kata kasar', 'Pelecehan', 'Spam', 'Penipuan / minta uang', 'Menyebar data pribadi', 'Lainnya'];
  bukaKartu(`<h2>🚩 Laporkan ${esc(nama)}</h2><p>Laporan dikirim ke Direktur & Staf. Identitasmu tidak ditunjukkan ke yang dilaporkan.</p>
    <form id="fL">${alasan.map((a, i) => `<label class="cek"><input type="radio" name="al" value="${esc(a)}" ${i ? '' : 'checked'}> ${esc(a)}</label>`).join('')}
    <label for="lD">Ceritakan singkat (opsional)</label><textarea id="lD" maxlength="80" rows="2"></textarea>
    <div class="baris"><button class="btn" type="submit">Kirim laporan</button></div></form>`, {
    pasang(isi) {
      isi.querySelector('#fL').onsubmit = e => {
        e.preventDefault();
        if (!siap()) return;
        const al = isi.querySelector('input[name=al]:checked').value, d = bersih(isi.querySelector('#lD').value, 80);
        K.L.lapor(o.uid, nama, d ? `${al}: ${d}` : al);
        tutupKartu(); toast('Laporan terkirim. Terima kasih sudah menjaga kantor 🙏', 3200);
      };
    },
  });
}

export function bukaProfilSaya() {
  const p = K.prof, L = K.L;
  bukaKartu(`<div class="kepalaProfil">${Foto.htmlAvatar(L.uid, p.n, 'besar')}<div><h2>${TUJUAN[p.tj].ikon} ${esc(p.n)}</h2><span class="baris kecil" style="margin:0"><button type="button" class="mini" id="mFG">📷 Ganti foto</button><button type="button" class="mini putih" id="mFH">Hapus</button></span></div></div>
    <p>${pillTujuan(p.tj)} ${K.peran[L.uid] ? `<span class="pillTj" style="--w:${K.peran[L.uid] === 'direktur' ? '#c8901a' : '#3a6ea5'}">${K.peran[L.uid] === 'direktur' ? '👑 Direktur Utama' : '🛡 Staf'}</span>` : ''}</p>
    ${p.b ? `<p>“${esc(p.b)}”</p>` : ''}
    ${Seru.htmlKepribadian(p) || '<p class="kecil">✨ Isi zodiak, MBTI & love language di <b>Ubah data</b> supaya kecocokanmu dengan tamu lain terlihat.</p>'}
    <p>⭐ Level <b>${Prog.level()}</b> · ${fmt(Prog.totalExp())} EXP ${Prog.vvipSaya() ? '· <span class="pillTj" style="--w:#7b3ec9">👑 VVIP</span>' : Prog.vipSaya() ? '· <span class="pillTj" style="--w:#b8860b">💎 VIP</span>' : ''} <button type="button" class="mini" id="mVip">${Prog.vipSaya() ? 'Langganan' : '💎 Jadi VIP / VVIP'}</button></p>
    ${p.tj === 'jodoh' ? `<p>💘 <b>${fmt(K.disukai || 0)}</b> orang diam-diam menyukaimu.</p><div id="mPenyuka">${Prog.vipSaya() ? '<p class="kecil">Memuat…</p>' : '<p class="kecil">Mau tahu siapa saja? <button type="button" class="mini" id="mV">💎 Lihat dengan VIP</button></p>'}</div>` : ''}
    <div id="mIzin"><p class="kecil">🔒 Data pribadimu (nama lengkap, Instagram, TikTok) hanya terlihat Direktur & VVIP.</p></div>
    <div class="baris"><button class="btn" type="button" id="mU">Ubah data</button><button class="btn putih" type="button" id="mO">💬 Obrolan</button><a class="btn putih" href="../idcard/index.html">Kartu Tamu</a></div>
    <div class="baris"><button class="btn putih" type="button" id="mLc">🏅 Lencana</button><button class="btn putih" type="button" id="mKm">🏠 Kamarku</button><button class="btn putih" type="button" id="mUg">🎟️ Ajak teman</button></div>
    <p class="kecil">${esc(K.Komunitas.jabatanDari(Prog.level()))}${p.gl ? ` · 🏅 ${esc(p.gl)}` : ''} · Kode undanganmu: <b>${esc(kodeTamu(L.uid))}</b></p>
    ${K.sembunyi.size ? `<p class="kecil tautan">${K.sembunyi.size} orang kamu sembunyikan. <button type="button" id="mS">Tampilkan lagi</button></p>` : ''}`, {
    pasang(isi) {
      isi.querySelector('#mU').onclick = () => K.bukaDaftar();
      isi.querySelector('#mVip').onclick = () => K.bukaLangganan();
      Foto.isiAvatar(isi);
      isi.querySelector('#mFG').onclick = () => Foto.gantiFotoProfil(bukaProfilSaya);
      isi.querySelector('#mFH').onclick = () => Foto.hapusFotoProfil().then(() => { toast('Foto profil dihapus.'); bukaProfilSaya(); });
      const iz = isi.querySelector('#mIzin');
      if (iz) L.db.get('izinIg/' + L.uid).then(o => {
        const u = Object.keys(o || {});
        if (!u.length) { iz.innerHTML = '<p class="kecil">🔒 Data pribadimu (nama lengkap, Instagram, TikTok) hanya terlihat Direktur & VVIP. Belum ada tamu lain yang kamu izinkan.</p>'; return; }
        iz.innerHTML = `<p class="kecil">🔓 Tamu yang boleh melihat data pribadimu:</p><div class="daftar">${u.map(x => `<div><span>${esc((K.tamu.find(t => t.uid === x) || {}).n || orangDariUid(x)?.nama || 'Tamu')}</span><button type="button" class="mini merah" data-cabut="${esc(x)}">Cabut</button></div>`).join('')}</div>`;
        iz.querySelectorAll('[data-cabut]').forEach(b => b.onclick = () => L.izinkanIg(b.dataset.cabut, false).then(() => { b.closest('div').remove(); toast('Izin dicabut.'); }));
      }).catch(() => {});
      const mv = isi.querySelector('#mV'); if (mv) mv.onclick = () => Prog.bukaHub('toko');
      const box = isi.querySelector('#mPenyuka');
      if (box && Prog.vipSaya()) L.db.get('suka/' + L.uid).then(o => {
        const u = Object.keys(o || {});
        box.innerHTML = u.length ? `<div class="daftar">${u.map(x => { const t = K.tamu.find(t => t.uid === x) || K.bot.find(b => b.uid === x) || {}; return `<div><span>💘 ${esc(t.n || t.nama || 'Tamu')}</span><button type="button" class="mini" data-lihat="${esc(x)}">Lihat</button></div>`; }).join('')}</div>` : '<p class="kecil">Belum ada. Sering-sering mampir ke Kafe Jodoh ya!</p>';
        box.querySelectorAll('[data-lihat]').forEach(b => b.onclick = () => { const o = orangDariUid(b.dataset.lihat); if (o) bukaProfil(o); else toast('Orangnya sedang tidak di kantor.'); });
      }).catch(() => { box.innerHTML = '<p class="kecil">Gagal memuat.</p>'; });
      isi.querySelector('#mO').onclick = () => bukaObrolan();
      isi.querySelector('#mLc').onclick = () => K.Komunitas.bukaLencana();
      isi.querySelector('#mKm').onclick = () => K.Komunitas.bukaKamar();
      isi.querySelector('#mUg').onclick = () => K.Komunitas.bukaUndang();
      const s = isi.querySelector('#mS');
      if (s) s.onclick = () => { K.sembunyi.clear(); LS.set('sembunyi', []); K.bot.forEach(b => { if (!b.diusir) b.g.visible = true; }); K.segarkanOrang(); tutupKartu(); toast('Semua orang ditampilkan lagi.'); };
    },
  });
}

// ---------------------------------------------------------------- MATCH
function rayakanMatch(uid, nama) {
  const L = K.L, r = L.ruang(L.uid, uid);
  tulisLog('', `💘 Match! Kamu dan ${nama} saling suka.`, 'sys');
  Musik.sfx('match');
  bukaKartu(`<div class="match"><div class="hatiBesar">💘</div><h2>It's a match!</h2><p>Kamu dan <b>${esc(nama)}</b> saling suka. Obrolan pribadi kalian sudah terbuka.</p>
    <div class="baris"><button class="btn" type="button" id="xM">Mulai ngobrol</button><button class="btn putih" type="button" id="xN">Nanti</button></div></div>`, {
    pasang(isi) { isi.querySelector('#xM').onclick = () => bukaObrolan(r); isi.querySelector('#xN').onclick = tutupKartu; },
  });
}

// ---------------------------------------------------------------- OBROLAN PRIBADI
let tabObrolan = 'pribadi';
export function bukaObrolan(r, tab) {
  if (!K.resmi()) { K.bukaDaftar(); return; }
  if (r) return bukaRuang(r);
  if (tab) tabObrolan = tab;
  const L = K.L;
  const daftar = Object.entries(rooms).filter(([, v]) => v && !K.sembunyi.has(v.u)).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  const nG = Grup.jumlahBaru();
  bukaKartu(`<h2>💬 Obrolan</h2>
    <div class="sw teks tab"><button type="button" data-ot="pribadi" class="${tabObrolan === 'pribadi' ? 'on' : ''}">💌 Pribadi${jumlahDmBaru ? ` (${jumlahDmBaru})` : ''}</button><button type="button" data-ot="grup" class="${tabObrolan === 'grup' ? 'on' : ''}">👥 Grup${nG ? ` (${nG})` : ''}</button></div>
    ${tabObrolan === 'grup' ? Grup.htmlDaftar() : daftar.length ? `<div class="daftar">${daftar.map(([rr, v]) => `<div class="baris-ruang" data-r="${esc(rr)}"><span>${v.baru ? '<i class="titik"></i>' : ''}${Foto.htmlAvatar(v.u, v.n, 'kecil')}<b>${esc(bersih(v.n, 20))}</b><br><small>${v.t ? esc(tanggalJam(v.t)) : ''}</small></span><button type="button" class="mini">Buka</button></div>`).join('')}</div>`
    : '<p>Belum ada obrolan. Ketuk orang lain di kantor, lalu pilih <b>💌 Ajak ngobrol</b>. Kalau dia menerima, obrolan pribadi kalian muncul di sini.</p>'}`, {
    tutup() { if (layar === 'daftar') layar = ''; Grup.lepasDaftar(); },
    pasang(isi) {
      isi.querySelectorAll('[data-ot]').forEach(b => b.onclick = () => bukaObrolan(null, b.dataset.ot));
      if (tabObrolan === 'grup') Grup.pasangDaftar(isi);
      else { Foto.isiAvatar(isi); isi.querySelectorAll('[data-r]').forEach(d => d.onclick = () => bukaRuang(d.dataset.r)); }
    },
  });
  layar = 'daftar';
}

function bukaRuang(r) {
  const L = K.L, info = rooms[r] || {};
  const u = L.lawan(r), nama = bersih(info.n || orangDariUid(u)?.nama || 'Teman', 20);
  // telepon: pasangan yang saling match ATAU obrolan pribadi yang sudah diterima kedua pihak (ruang ini)
  const bisaTelp = !u.startsWith('bot:');
  bukaKartu(`<div class="kepalaRuang"><button type="button" class="mini putih" id="rB">← Obrolan</button><h2>${Foto.htmlAvatar(u, nama, 'kecil')}${esc(nama)} <small class="dmStreak" id="rStk"></small></h2>${bisaTelp ? '<button type="button" class="mini" id="rC" aria-label="Telepon">📞</button>' : ''}</div>
    <div class="dmIsi" id="rI" aria-live="polite"><p class="kecil">Memuat…</p></div>
    <div class="pemilihStiker" id="rSt" hidden></div>
    <form id="rF" class="dmForm" autocomplete="off"><button class="btn putih" type="button" id="rSb" aria-label="Stiker">😀</button><input id="rT" maxlength="300" placeholder="Tulis pesan…" enterkeyhint="send" aria-label="Pesan pribadi">${Suara.bisaRekam() ? '<button class="btn putih" type="button" id="rV" aria-label="Rekam pesan suara">🎤</button>' : ''}<button class="btn" type="submit">Kirim</button></form>
    <div class="dmRekam" id="rR" hidden><span class="dmMerah"></span><b id="rRd">0:00</b><small>/ 0:${Suara.MAKS_DETIK}</small><button type="button" class="mini putih" id="rRb">Batal</button><button type="button" class="mini" id="rRk">Kirim 🎤</button></div>
    ${K.match && K.match[u] ? '<p class="kecil tautan">💘 Kalian match: <button type="button" id="rKk">🎯 Kuis Kenal</button> · <button type="button" id="rKs">💌 Kisah Sukses</button> · <button type="button" id="rPm">💑 Pasangan Minggu Ini</button></p>' : ''}
    <p class="kecil tautan">Obrolan ini hanya bisa dibaca kalian berdua. <button type="button" id="rX">Tutup obrolan</button></p>`, {
    tutup() { if (lepasRuang) lepasRuang(); lepasRuang = null; ruangTerbuka = null; layar = ''; },
    pasang(isi) {
      layar = 'ruang'; ruangTerbuka = r;
      L.bacaDm(r);
      Foto.isiAvatar(isi);
      const box = isi.querySelector('#rI');
      let dibersihkan = false;
      lepasRuang = L.db.on(`dm/${r}/pesan`, o => {
        const msgs = Object.entries(o || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
        box.innerHTML = msgs.length ? msgs.map(m => `<div class="dm ${m.uid === L.uid ? 'saya' : ''}">${m.sv && m.sv.id ? Suara.htmlSuara(m) : m.st ? Stiker.html(m.st) : `<span>${esc(m.m)}</span>`}<small>${esc(jam(m.t))}</small></div>`).join('') : '<p class="kecil">Belum ada pesan. Sapa duluan!</p>';
        Suara.pasangPemutar(L, r, box);
        Stiker.isiGambar(box);
        // streak ngobrol: hari berturut-turut (sampai hari ini/kemarin) yang dua-duanya mengirim pesan
        const hari = t => Math.floor((t + 7 * 3600e3) / 864e5), per = new Map();
        for (const m of msgs) { const h = hari(m.t || 0); const s = per.get(h) || new Set(); s.add(m.uid); per.set(h, s); }
        let h = hari(L.db.now()), n = 0; if (!(per.get(h)?.size >= 2)) h--; while (per.get(h)?.size >= 2) { n++; h--; }
        const stk = isi.querySelector('#rStk'); if (stk) stk.textContent = n >= 2 ? `🔥${n}` : '';
        if (!dibersihkan) { dibersihkan = true; Suara.bersihkanSuaraLama(L, r, msgs); }
        box.scrollTop = box.scrollHeight;
        L.bacaDm(r);
      }, { limit: 60 });
      isi.querySelector('#rB').onclick = () => bukaObrolan();
      Stiker.pasangPemilih(isi.querySelector('#rSb'), isi.querySelector('#rSt'), id => { if (!siap()) return; L.kirimDm(r, K.prof.n, '[stiker]', id); if (u.startsWith('bot:')) botBalas(r, u, 'balas'); });
      const rc = isi.querySelector('#rC'); if (rc) rc.onclick = () => { if (!siap()) return; Suara.telepon(L, u, nama, K.prof.n); };
      // ---- rekam pesan suara
      const rv = isi.querySelector('#rV'), form = isi.querySelector('#rF'), bar = isi.querySelector('#rR');
      let rek = null;
      const kembali = () => { rek = null; bar.hidden = true; form.hidden = false; };
      if (rv) rv.onclick = async () => {
        if (!siap() || rek) return;
        try {
          rek = await Suara.mulaiRekam(d => { isi.querySelector('#rRd').textContent = `0:${String(Math.floor(d)).padStart(2, '0')}`; if (d >= Suara.MAKS_DETIK) isi.querySelector('#rRk').click(); });
          form.hidden = true; bar.hidden = false; isi.querySelector('#rRd').textContent = '0:00';
        } catch (e) { rek = null; toast(e && e.name === 'NotAllowedError' ? 'Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser.' : 'Mikrofon tidak bisa dipakai di perangkat ini.', 3600); }
      };
      isi.querySelector('#rRb').onclick = () => { if (rek) rek.batal(); kembali(); };
      isi.querySelector('#rRk').onclick = async () => {
        if (!rek || rek === 'mengirim') return;
        const r0 = rek; rek = 'mengirim';
        try {
          const hasil = await r0.selesai();
          if (hasil.dur < 0.8) { toast('Rekaman terlalu pendek.'); kembali(); return; }
          await Suara.kirimSuara(L, r, K.prof.n, hasil);
          if (u.startsWith('bot:')) botBalas(r, u, 'balas');
        } catch (e) { console.warn(e); toast('Pesan suara gagal terkirim.'); }
        kembali();
      };
      const kirimTeks = t => L.kirimDm(r, K.prof.n, t);
      const kk = isi.querySelector('#rKk'); if (kk) kk.onclick = () => K.Aktivitas.bukaKuisKenal(u, nama, kirimTeks);
      const ks = isi.querySelector('#rKs'); if (ks) ks.onclick = () => K.Komunitas.tulisKisah(u, nama);
      const pm = isi.querySelector('#rPm'); if (pm) pm.onclick = () => { if (confirm(`Setuju kalian berdua (${K.prof.n} & ${nama}) ditampilkan sebagai Pasangan Minggu Ini? Hanya tampil kalau ${nama} juga setuju & dipilih Direktur.`)) K.Komunitas.setujuPasangan(u, true).catch(() => toast('Gagal.')); };
      isi.querySelector('#rX').onclick = () => { L.tutupDm(r); tutupKartu(); toast('Obrolan ditutup dari daftarmu.'); };
      let terakhir = 0;
      isi.querySelector('#rF').onsubmit = e => {
        e.preventDefault();
        const inp = isi.querySelector('#rT'), t = bersih(inp.value, 300);
        if (!t || !siap()) return;
        if (Date.now() - terakhir < 800) return;
        terakhir = Date.now(); inp.value = '';
        L.kirimDm(r, K.prof.n, t);
        if (u.startsWith('bot:')) botBalas(r, u, 'balas');
      };
      if (matchMedia('(hover:hover)').matches) setTimeout(() => isi.querySelector('#rT').focus(), 60);
    },
  });
}

// ---------------------------------------------------------------- NPC (mode lokal)
const BOT_KATA = {
  jodoh: ['Hehe, kamu lucu juga 😄', 'Suka kopi apa? Aku tim kopi susu.', 'Kapan-kapan ngopi bareng di Kafe Jodoh yuk.', 'Kamu tipe yang chat duluan atau nunggu?'],
  teman: ['Wah seru! Kamu suka main apa?', 'Gas mabar kapan-kapan.', 'Kamu dari kota mana?', 'Sini gabung di meja nongkrong!'],
  curhat: ['Aku dengerin kok, cerita aja 🤗', 'Peluk jauh ya.', 'Kamu nggak sendirian kok.', 'Pelan-pelan aja, nggak usah buru-buru.'],
};
function botTerima(o) {
  const L = K.L, r = L.ruang(L.uid, o.uid);
  L.db.set(`dm/${r}/ok`, true);
  L.db.set(`dmku/${L.uid}/${r}`, { n: o.nama, u: o.uid, t: TS, baru: true });
  L.db.set(`undangan/${o.uid}/${L.uid}`, null);
  botBalas(r, o.uid, 'sapa');
  toast(`${o.nama} menerima ajakanmu 💬`);
}
function botBalas(r, u, jenis) {
  const L = K.L, o = orangDariUid(u); if (!o) return;
  const teks = jenis === 'sapa' ? `Hai ${K.prof?.n || ''}! Makasih udah ngajak ngobrol 😊` : jenis === 'match' ? 'Wah kita match! 😳 Halo~' : acak(BOT_KATA[o.tj] || BOT_KATA.teman);
  setTimeout(() => {
    L.db.push(`dm/${r}/pesan`, { uid: u, n: o.nama, m: teks, t: TS });
    L.db.update(`dmku/${L.uid}/${r}`, { n: o.nama, u, t: TS, baru: ruangTerbuka !== r });
  }, 1200 + Math.random() * 1500);
}

// ---------------------------------------------------------------- PAPAN CURHAT
let curhatBuka = null;
export function bukaCurhat() {
  bukaKartu(`<h2>💬 Papan Curhat</h2>
    <p class="kecil">Tulis apa saja yang mengganjal. <b>Namamu tidak ditampilkan.</b> Yang lain bisa kasih pelukan 🤗 atau balasan yang menguatkan.</p>
    <form id="cF"><textarea id="cT" maxlength="300" rows="3" placeholder="Aku lagi…" aria-label="Isi curhat"></textarea>
    <p class="err" id="cE"></p><div class="baris"><button class="btn" type="submit">Kirim curhat anonim</button></div></form>
    <div id="cL"></div>`, {
    tutup() { if (layar === 'curhat') layar = ''; curhatBuka = null; },
    pasang(isi) {
      isi.querySelector('#cF').onsubmit = e => {
        e.preventDefault();
        if (!siap()) return;
        const t = bersih(isi.querySelector('#cT').value, 300), E = isi.querySelector('#cE');
        if (t.length < 5) { E.textContent = 'Ceritakan sedikit lebih panjang ya.'; return; }
        if (Date.now() - LS.get('curhatT', 0) < 60000) { E.textContent = 'Tunggu 1 menit sebelum curhat lagi.'; return; }
        LS.set('curhatT', Date.now());
        K.L.curhat(t); isi.querySelector('#cT').value = ''; E.textContent = '';
        toast('Curhatmu sudah di papan. Semoga lebih lega 🤗');
      };
    },
  });
  layar = 'curhat'; gambarCurhat();
}
export function curhatBerubah() { if (layar === 'curhat') gambarCurhat(); }
function gambarCurhat() {
  const el = document.querySelector('#kartu #cL'); if (!el) return;
  const L = K.L, mod = !!K.peran[L.uid];
  const list = (K.curhatList || []).slice(-20).reverse();
  if (!list.length) { el.innerHTML = '<p class="kecil">Belum ada curhat. Kamu bisa jadi yang pertama.</p>'; return; }
  const draf = el.querySelector('.balasIn')?.value || '';
  el.innerHTML = list.map(c => {
    const pk = c.peluk ? Object.keys(c.peluk).length : 0, saya = !!(c.peluk && c.peluk[L.uid]);
    const bl = Object.entries(c.balas || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return `<div class="curhat" data-k="${esc(c.k)}"><p>“${esc(c.m)}”</p><small>${esc(tanggalJam(c.t))}</small>
      <div class="baris kecil"><button type="button" class="mini ${saya ? '' : 'putih'}" data-a="peluk">🤗 ${pk}</button><button type="button" class="mini putih" data-a="balas">💬 ${bl.length} balasan</button>${mod ? '<button type="button" class="mini merah" data-a="hapus">Hapus</button>' : ''}</div>
      ${curhatBuka === c.k ? `<div class="balasan">${bl.map(([bk, b]) => `<p><b>${esc(bersih(b.n, 20))}</b> ${esc(b.m)}${mod ? ` <button type="button" class="mini merah" data-hb="${esc(bk)}">×</button>` : ''}</p>`).join('') || '<p class="kecil">Belum ada balasan.</p>'}
        <form class="dmForm" data-f="1"><input class="balasIn" maxlength="160" placeholder="Balas dengan baik…" aria-label="Balasan"><button class="btn" type="submit">Balas</button></form></div>` : ''}</div>`;
  }).join('');
  if (draf) { const bi = el.querySelector('.balasIn'); if (bi) bi.value = draf; }
  el.querySelectorAll('.curhat').forEach(d => {
    const k = d.dataset.k, c = list.find(x => x.k === k);
    d.querySelector('[data-a=peluk]').onclick = () => { if (!siap()) return; const ya = !(c.peluk && c.peluk[L.uid]); L.peluk(k, ya); if (ya) Prog.lapor('peluk'); };
    d.querySelector('[data-a=balas]').onclick = () => { curhatBuka = curhatBuka === k ? null : k; gambarCurhat(); };
    const h = d.querySelector('[data-a=hapus]'); if (h) h.onclick = () => L.hapus('curhat/' + k).then(() => toast('Curhat dihapus')).catch(() => toast('Gagal menghapus.'));
    d.querySelectorAll('[data-hb]').forEach(b => b.onclick = () => L.hapus(`curhat/${k}/balas/${b.dataset.hb}`).catch(() => toast('Gagal menghapus.')));
    const f = d.querySelector('[data-f]');
    if (f) f.onsubmit = e => {
      e.preventDefault(); if (!siap()) return;
      const inp = f.querySelector('input'), t = bersih(inp.value, 160);
      if (!t) return;
      if (kasar(t)) { toast('Balas dengan kata-kata yang baik ya.'); return; }
      inp.value = ''; L.balasCurhat(k, K.prof.n, t);
    };
  });
}

// ---------------------------------------------------------------- SIAPA SAJA DI KANTOR
export function bukaDaftarOnline() {
  const L = K.L;
  const semua = [...K.lain.values(), ...(L?.mode === 'lokal' ? K.bot.filter(b => !b.diusir) : [])].filter(o => !K.sembunyi.has(o.uid));
  const urut = o => (K.peran[o.uid] === 'direktur' ? 0 : Prog.isVvip(o.uid) ? 1 : Prog.isVip(o.uid) ? 2 : 3);
  const grup = Object.keys(TUJUAN).map(tj => [tj, semua.filter(o => o.tj === tj).sort((a, b) => urut(a) - urut(b))]);
  bukaKartu(`<h2>👥 Di kantor sekarang</h2>
    <p>${fmt(semua.length + 1)} orang, termasuk kamu.${L?.mode === 'lokal' ? ' <span class="kecil">Mode lokal: yang terlihat hanya NPC dan tab lain di browser ini.</span>' : ''}</p>
    ${grup.map(([tj, l]) => `<h3>${TUJUAN[tj].ikon} ${TUJUAN[tj].nama} <small>(${l.length})</small></h3>${l.length ? `<div class="daftar">${l.map((o, i) => `<div><span>${o.npc ? '' : Foto.htmlAvatar(o.uid, o.nama, 'kecil')}${K.peran[o.uid] === 'direktur' ? '👑 ' : (o.npc ? o.peran : K.peran[o.uid]) ? '🛡 ' : Prog.isVvip(o.uid) ? '✨VVIP ' : Prog.isVip(o.uid) ? '💎 ' : ''}${esc(o.nama)}${o.mj ? ` <small>· ${esc(o.mj)}</small>` : ''}</span><button type="button" class="mini" data-u="${esc(o.uid)}">Lihat</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada.</p>'}`).join('')}`, {
    pasang(isi) { Foto.isiAvatar(isi); isi.querySelectorAll('[data-u]').forEach(b => b.onclick = () => bukaProfil(semua.find(o => o.uid === b.dataset.u))); },
  });
}
