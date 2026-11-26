// =====================================================================
//  Komunitas & status: Kamar Saya, Gelar/Lencana & Jabatan, Season Pass,
//  Pasangan Minggu Ini, Kisah Sukses, Nobar (Rabu), Lagu Hari Ini,
//  acara musiman, dan kode undangan.
// =====================================================================
import { LS, bersih, esc, fmt, kasar, sensor, kodeTamu, levelDari } from '../js/common.js?v=202611261340';
import { TS, kunciBaru } from '../js/db.js?v=202611261340';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, tanggalJam } from './ui.js?v=202611261340';
import * as Prog from './progres.js?v=202611261340';

const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk ikut.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const dir = () => !!(K.L && K.peran[K.L.uid] === 'direktur');

// ---------------------------------------------------------------- JABATAN (sesuai level)
export const JABATAN = [[1, '🎫 Tamu'], [5, '🧑‍💼 Karyawan Magang'], [10, '💼 Karyawan Tetap'], [15, '📈 Supervisor Cinta'], [20, '🏆 Manajer Cinta'], [30, '💎 Direktur Muda']];
export const jabatanDari = lv => JABATAN.filter(([l]) => lv >= l).pop()[1];

// ---------------------------------------------------------------- LENCANA & GELAR
export async function lencanaSaya() {
  const L = K.L, uid = L.uid, l = [];
  const st = K.streakSaya ? K.streakSaya() : 0;
  if (st >= 7) l.push(['konsisten', '🔥 Konsisten', `Streak ${st} hari`]);
  if (Object.keys(K.match || {}).length) l.push(['jodoh', '💘 Pencari Jodoh Sejati', 'Pernah match']);
  const dm = Object.keys((await L.db.get('dmku/' + uid).catch(() => null)) || {}).length;
  if (dm >= 5) l.push(['teman', '🤝 Teman Semua Orang', `${dm} obrolan pribadi`]);
  const peluk = (K.curhatList || []).filter(c => c.peluk && c.peluk[uid]).length;
  if (peluk >= 3) l.push(['pendengar', '🤗 Pendengar Curhat', `${peluk} pelukan`]);
  const foto = (K.Foto ? K.Foto.daftarGaleri() : []).filter(g => g.uid === uid).length;
  if (foto >= 3) l.push(['fotografer', '📸 Fotografer Kantor', `${foto} foto`]);
  const bunga = Object.keys((await L.db.get('bunga/' + uid).catch(() => null)) || {}).length;
  if (bunga >= 5) l.push(['idola', '💐 Idola Kantor', `${bunga} bunga`]);
  if (K.rajaHati && K.rajaHati.uid === uid) l.push(['raja', K.prof.g === 'ce' ? '👑 Ratu Hati' : '👑 Raja Hati', 'Juara Tangkap Hati minggu lalu']);
  if (Prog.vvipSaya()) l.push(['vvip', '✨ Tamu VVIP', '']); else if (Prog.vipSaya()) l.push(['vip', '💎 Tamu VIP', '']);
  if (Prog.level() >= 10) l.push(['senior', '⭐ Tamu Senior', `Level ${Prog.level()}`]);
  return l;
}
export async function bukaLencana() {
  if (!siap()) return;
  const l = await lencanaSaya(), pakai = K.prof.gl || '';
  bukaKartu(`<h2>🏅 Lencana & Gelar</h2><p>Jabatan: <b>${esc(jabatanDari(Prog.level()))}</b> <small class="kecil">(naik tiap level 5, 10, 15, 20, 30)</small></p>
    <p class="kecil">Pilih satu gelar untuk ditampilkan di profilmu.</p>
    ${l.length ? `<div class="daftar">${l.map(([id, n, k]) => `<div><span><b>${esc(n)}</b>${k ? `<br><small>${esc(k)}</small>` : ''}</span><button type="button" class="mini ${pakai === n ? '' : 'putih'}" data-g="${esc(n)}">${pakai === n ? 'Dipakai' : 'Pakai'}</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada lencana. Coba: streak 7 hari, dapat match, ngobrol dengan 5 orang, peluk 3 curhat, unggah 3 foto, atau dapat 5 bunga!</p>'}
    <p class="kecil">Belum terbuka: 🔥 Konsisten · 💘 Pencari Jodoh Sejati · 🤝 Teman Semua Orang · 🤗 Pendengar Curhat · 📸 Fotografer · 💐 Idola Kantor · 👑 Raja/Ratu Hati · ⭐ Tamu Senior</p>`, {
    pasang(i) { i.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { K.prof.gl = K.prof.gl === b.dataset.g ? '' : b.dataset.g; K.simpanProfil(); bukaLencana(); }); },
  });
}

// ---------------------------------------------------------------- KAMAR SAYA
export const DINDING = ['#ffe1e9', '#e8f4ff', '#fff3c4', '#e6ffe8', '#f1e6ff', '#2a1420', '#ffd9c2', '#d7f0f0'];
export const LANTAI = ['#c99a6b', '#8a6a52', '#e9dccf', '#9fb6c9', '#ffffff', '#3b2b3f'];
export const PERABOT = ['', '🛏️', '🛋️', '🪴', '📺', '🎸', '🖼️', '🧸', '💡', '📚', '🐱', '🎮', '☕', '🪞', '🌸', '🎧', '🏆', '🕯️', '🎀', '💻'];
const RUANG = 12; // 4×3 petak
export async function bukaKamar(uid = K.L.uid, nama = K.prof?.n) {
  const L = K.L, milik = uid === L.uid;
  let k = (await L.db.get('kamar/' + uid).catch(() => null)) || {};
  const it = Array.isArray(k.it) ? k.it : [];
  let pilih = 1;
  const gambar = () => `<div class="kamar" style="--dinding:${DINDING[k.wp | 0] || DINDING[0]};--lantai:${LANTAI[k.lt | 0] || LANTAI[0]}">${Array.from({ length: RUANG }, (_, i) => `<button type="button" class="petak" data-p="${i}" ${milik ? '' : 'disabled'}>${PERABOT[it[i] | 0] || ''}</button>`).join('')}</div>`;
  bukaKartu(`<h2>🏠 Kamar ${esc(bersih(nama, 20))}</h2><div id="kmR">${gambar()}</div>
    ${milik ? `<h4>Perabot (pilih lalu ketuk petak)</h4><div class="sw teks" id="kmP">${PERABOT.map((p, i) => `<button type="button" data-i="${i}" class="${i === pilih ? 'on' : ''}">${p || '🧹 Kosongkan'}</button>`).join('')}</div>
    <h4>Dinding</h4><div class="sw" id="kmD">${DINDING.map((w, i) => `<button type="button" data-w="${i}" style="background:${w}" class="${(k.wp | 0) === i ? 'on' : ''}" aria-label="Dinding ${i + 1}"></button>`).join('')}</div>
    <h4>Lantai</h4><div class="sw" id="kmL">${LANTAI.map((w, i) => `<button type="button" data-l="${i}" style="background:${w}" class="${(k.lt | 0) === i ? 'on' : ''}" aria-label="Lantai ${i + 1}"></button>`).join('')}</div>
    <div class="baris"><button class="btn" type="button" id="kmS">Simpan kamar</button></div>` : '<p class="kecil">Kamu sedang berkunjung. Hias kamarmu sendiri di Profil → 🏠 Kamar.</p>'}`, {
    pasang(el) {
      if (!milik) return;
      const segar = () => { el.querySelector('#kmR').innerHTML = gambar(); pasangPetak(); };
      const pasangPetak = () => el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { it[+b.dataset.p] = pilih; segar(); });
      pasangPetak();
      el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { pilih = +b.dataset.i; el.querySelectorAll('[data-i]').forEach(x => x.classList.toggle('on', x === b)); });
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { k.wp = +b.dataset.w; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); segar(); });
      el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { k.lt = +b.dataset.l; el.querySelectorAll('[data-l]').forEach(x => x.classList.toggle('on', x === b)); segar(); });
      el.querySelector('#kmS').onclick = () => { if (!siap()) return; L.db.set('kamar/' + uid, { wp: k.wp | 0, lt: k.lt | 0, it: Array.from({ length: RUANG }, (_, i) => it[i] | 0), t: TS }).then(() => toast('Kamar tersimpan 🏠')).catch(() => toast('Gagal menyimpan.')); };
    },
  });
}

// ---------------------------------------------------------------- SEASON PASS (musim = bulan)
export const musimIni = () => { const d = new Date((K.L ? K.L.db.now() : Date.now()) + 7 * 3600e3); return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0'); };
export const HARGA_PREMIUM = 100;
const TIER = 10, POIN_PER_TIER = 8;
export async function bukaSeason() {
  if (!siap()) return;
  const L = K.L, ms = musimIni();
  const [klaim, premium] = await Promise.all([L.db.get(`seasonKlaim/${L.uid}/${ms}`).catch(() => null), L.db.get(`seasonPremium/${L.uid}/${ms}`).catch(() => null)]);
  const poin = Prog.poinMusim(ms), tier = Math.min(TIER, Math.floor(poin / POIN_PER_TIER));
  const K_ = klaim || {}, prem = !!premium || dir();
  const hadiah = t => ({ bebas: `+${20 + t * 10} EXP`, premium: t === 5 ? '🧥 Jaket Season' : t === 10 ? '🎩 Topi Season' : `+${20 + t * 10} EXP` });
  bukaKartu(`<h2>🎟️ Season Pass ${ms.slice(4)}/${ms.slice(0, 4)}</h2>
    <p>Poin musim ini: <b>${fmt(poin)}</b> (1 poin = 1 tugas harian selesai) · Tier <b>${tier}/${TIER}</b></p>
    <div class="bilah"><i style="width:${Math.min(100, poin / (TIER * POIN_PER_TIER) * 100)}%"></i></div>
    <table class="season"><tr><th>Tier</th><th>Gratis</th><th>Premium ${prem ? '✅' : '🔒'}</th></tr>
    ${Array.from({ length: TIER }, (_, i) => i + 1).map(t => { const h = hadiah(t), buka = t <= tier; return `<tr class="${buka ? 'buka' : ''}"><td>${t}</td>
      <td>${h.bebas} ${buka ? (K_['b' + t] ? '✔' : `<button type="button" class="mini" data-k="b${t}">Ambil</button>`) : ''}</td>
      <td>${h.premium} ${buka && prem ? (K_['p' + t] ? '✔' : `<button type="button" class="mini" data-k="p${t}">Ambil</button>`) : ''}</td></tr>`; }).join('')}</table>
    ${prem ? '' : `<div class="baris"><button class="btn" type="button" id="ssP">🔓 Buka Premium · 💠 ${HARGA_PREMIUM}</button></div><p class="kecil">Premium: EXP tambahan tiap tier + Jaket Season (tier 5) & Topi Season (tier 10) edisi terbatas.</p>`}`, {
    pasang(el) {
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        const k = b.dataset.k, t = +k.slice(1), h = hadiah(t)[k[0] === 'b' ? 'bebas' : 'premium'];
        b.disabled = true;
        try {
          const upd = { [`seasonKlaim/${L.uid}/${ms}/${k}`]: true };
          const item = k === 'p5' ? 'ssJaket' : k === 'p10' ? 'ssTopi' : '';
          if (item && !Prog.punyaBarang(item)) upd[`milik/${L.uid}/${item}`] = true;
          await L.db.update('', upd);
          if (!item) Prog.hadiah(20 + t * 10, `🎟️ Season tier ${t}`); else toast(`🎉 ${h} jadi milikmu! Pakai di Ruang Loker.`, 4000);
          bukaSeason();
        } catch (e) { console.warn(e); toast('Gagal mengambil hadiah.'); b.disabled = false; }
      });
      const p = el.querySelector('#ssP');
      if (p) p.onclick = async () => {
        const saldo = Prog.saldoDiamond();
        if (saldo < HARGA_PREMIUM) { toast('Diamond kamu kurang. Top up di Toko ya.'); Prog.bukaHub('toko'); return; }
        try { await L.db.update('', { [`seasonPremium/${L.uid}/${ms}`]: TS, [`diamond/${L.uid}`]: saldo - HARGA_PREMIUM }); toast('🎟️ Season Premium aktif!'); K.efekLokal && K.efekLokal('kembangapi'); bukaSeason(); }
        catch (e) { toast('Gagal membuka Premium.'); }
      };
    },
  });
}

// ---------------------------------------------------------------- PASANGAN MINGGU INI & KISAH SUKSES
const ruangDua = (a, b) => [a, b].sort().join('_');
export async function setujuPasangan(lawan, ya) {
  await K.L.db.set(`pasanganSetuju/${ruangDua(K.L.uid, lawan)}/${K.L.uid}`, ya ? true : null);
  toast(ya ? '💑 Kamu setuju ditampilkan sebagai Pasangan Minggu Ini (kalau dia juga setuju & dipilih Direktur).' : 'Persetujuan dibatalkan.', 4200);
}
export function bukaKisah() {
  K.L.db.get('kisah').then(o => {
    const l = Object.entries(o || {}).filter(([, v]) => v && v.ok).sort((a, b) => b[1].t - a[1].t);
    const p = K.pasanganMinggu;
    bukaKartu(`<h2>💞 Kisah Sukses</h2>
      ${p && p.na ? `<div class="cocok"><b>💑 Pasangan Minggu Ini</b><p style="font-size:18px;margin:6px 0">${esc(p.na)} & ${esc(p.nb)}</p><small class="kecil">dipilih Direktur ${esc(tanggalJam(p.t))}</small></div>` : ''}
      ${l.length ? l.map(([, v]) => `<div class="curhat"><p><b>${esc(bersih(v.na, 30))} & ${esc(bersih(v.nb, 30))}</b><br>“${esc(v.cerita)}”</p><small>${esc(tanggalJam(v.t))}</small></div>`).join('') : '<p class="kecil">Belum ada kisah sukses. Semoga kamu yang pertama! 💘</p>'}
      <p class="kecil">Sudah jadian lewat kantor? Kirim kisahmu dari obrolan pribadi dengan pasangan match-mu (tombol 💌).</p>`);
  }).catch(() => toast('Gagal memuat kisah.'));
}
export function tulisKisah(lawan, namaLawan) {
  if (!siap()) return;
  bukaKartu(`<h2>💌 Kirim Kisah Sukses</h2><p class="kecil">Cerita singkat bagaimana kalian kenal di kantor ini. Akan tampil setelah disetujui Direktur. Pastikan ${esc(namaLawan)} setuju ya!</p>
    <textarea id="ksT" maxlength="300" rows="4" placeholder="Kami ketemu di Meja Musik, terus…"></textarea>
    <label class="cek"><input type="checkbox" id="ksOk"> ${esc(namaLawan)} sudah setuju kisah ini ditampilkan</label>
    <p class="err" id="ksE"></p><div class="baris"><button class="btn" type="button" id="ksK">Kirim</button></div>`, {
    pasang(el) {
      el.querySelector('#ksK').onclick = async () => {
        const t = bersih(el.querySelector('#ksT').value, 300), E = el.querySelector('#ksE');
        if (t.length < 20) { E.textContent = 'Ceritakan sedikit lebih panjang ya.'; return; }
        if (kasar(t)) { E.textContent = 'Pakai kata-kata yang lebih sopan ya.'; return; }
        if (!el.querySelector('#ksOk').checked) { E.textContent = 'Pastikan pasanganmu setuju dulu.'; return; }
        try { await K.L.db.set('kisah/' + kunciBaru(), { a: K.L.uid, b: lawan, na: bersih(K.prof.n, 30), nb: bersih(namaLawan, 30), cerita: sensor(t), ok: false, t: TS }); tutupKartu(); toast('Kisahmu terkirim ke Direktur 💞'); }
        catch (e) { E.textContent = 'Gagal mengirim. Kisah hanya bisa dikirim pasangan yang sudah match.'; }
      };
    },
  });
}
// Direktur: moderasi kisah & pilih pasangan minggu ini
export async function htmlDirektur() {
  const L = K.L;
  const [kisah, setuju] = await Promise.all([L.db.get('kisah').catch(() => null), L.db.get('pasanganSetuju').catch(() => null)]);
  const kl = Object.entries(kisah || {}).filter(([, v]) => v).sort((a, b) => b[1].t - a[1].t);
  const ps = Object.entries(setuju || {}).filter(([r, v]) => v && r.split('_').every(u => v[u]));
  const nama = u => (K.tamu.find(t => t.uid === u) || {}).n || (K.lain.get(u) || {}).nama || u.slice(0, 6);
  const nobar = (K.setelan && K.setelan.nobar) || {};
  return `<h3>📺 Nobar (Rabu)</h3><p class="kecil">Layar di Ruang Rapat menampilkan judulnya; tamu ketuk untuk menonton (YouTube) sambil chat.</p>
    <input id="nbJ" maxlength="60" placeholder="Judul, mis. Nobar: Film Romantis" value="${esc(nobar.judul || '')}"><input id="nbU" maxlength="200" placeholder="Link YouTube" value="${esc(nobar.url || '')}">
    <div class="baris"><button class="btn" type="button" id="nbS">Pasang & umumkan</button>${nobar.url ? '<button class="btn putih" type="button" id="nbH">Hapus</button>' : ''}</div>
    <h3>💑 Pasangan Minggu Ini</h3>${ps.length ? `<div class="daftar">${ps.map(([r]) => { const [a, b] = r.split('_'); return `<div><span>${esc(nama(a))} & ${esc(nama(b))}</span><button type="button" class="mini" data-pm="${esc(r)}">Umumkan</button></div>`; }).join('')}</div>` : '<p class="kecil">Belum ada pasangan match yang sama-sama setuju ditampilkan.</p>'}
    <h3>💞 Kisah Sukses</h3>${kl.length ? `<div class="daftar">${kl.map(([id, v]) => `<div><span><b>${esc(v.na)} & ${esc(v.nb)}</b> ${v.ok ? '✅' : '⏳'}<br><small>${esc(bersih(v.cerita, 120))}</small></span><span class="baris kecil" style="margin:0">${v.ok ? '' : `<button type="button" class="mini" data-ks="${esc(id)}">Tampilkan</button>`}<button type="button" class="mini merah" data-kh="${esc(id)}">Hapus</button></span></div>`).join('')}</div>` : '<p class="kecil">Belum ada kiriman.</p>'}`;
}
export function pasangDirektur(el) {
  const L = K.L;
  const nb = el.querySelector('#nbS');
  if (nb) nb.onclick = async () => {
    const judul = bersih(el.querySelector('#nbJ').value, 60), url = String(el.querySelector('#nbU').value || '').trim();
    if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//.test(url)) { toast('Pakai link YouTube (https://youtube.com/… atau https://youtu.be/…).'); return; }
    await L.setelan({ nobar: { judul: judul || 'Nobar bareng', url, t: L.db.now() } }); await L.umumkan(`📺 ${judul || 'Nobar bareng'} di Ruang Rapat! Ketuk layar besar untuk ikut nonton.`); toast('Nobar dipasang 📺');
  };
  const nh = el.querySelector('#nbH'); if (nh) nh.onclick = () => L.setelan({ nobar: null }).then(() => toast('Nobar dihapus'));
  el.querySelectorAll('[data-pm]').forEach(b => b.onclick = async () => {
    const [a, c] = b.dataset.pm.split('_'), nama = u => (K.tamu.find(t => t.uid === u) || {}).n || (K.lain.get(u) || {}).nama || 'Tamu';
    await L.db.set('pasanganMinggu', { a, b: c, na: nama(a), nb: nama(c), t: TS });
    await L.umumkan(`💑 Pasangan Minggu Ini: ${nama(a)} & ${nama(c)}! Selamat ya 💘`);
    K.kirimEfek && K.kirimEfek('hati'); toast('Diumumkan 💑');
  });
  el.querySelectorAll('[data-ks]').forEach(b => b.onclick = () => L.db.set(`kisah/${b.dataset.ks}/ok`, true).then(() => { toast('Kisah ditampilkan 💞'); K.segarPanel && K.segarPanel(); }));
  el.querySelectorAll('[data-kh]').forEach(b => b.onclick = () => L.db.set('kisah/' + b.dataset.kh, null).then(() => { toast('Kisah dihapus'); K.segarPanel && K.segarPanel(); }));
}
export function bukaNobar() {
  const n = (K.setelan && K.setelan.nobar) || null;
  if (!n || !n.url) { bukaKartu('<h2>📺 Layar Nobar</h2><p>Belum ada nobar. Pantau jadwal acara: biasanya <b>Rabu malam</b> Direktur memasang film/video untuk ditonton bareng.</p>'); return; }
  bukaKartu(`<h2>📺 ${esc(n.judul)}</h2><p>Tonton bareng di YouTube, lalu ngobrol di chat kantor sambil nonton!</p>
    <div class="baris"><a class="btn" href="${esc(n.url)}" target="_blank" rel="noopener">▶ Tonton sekarang</a><button class="btn putih" type="button" id="nbC">💬 Chat</button></div>`, {
    pasang(el) { el.querySelector('#nbC').onclick = () => { tutupKartu(); $('chatI').focus(); }; },
  });
}

// ---------------------------------------------------------------- LAGU HARI INI (Kafe Jodoh)
export function laguHariIni() {
  const hit = new Map();
  const tambah = (lg, n) => { lg = bersih(lg, 40); if (!lg) return; const k = lg.toLowerCase(); const v = hit.get(k) || { lg, n: 0, siapa: [] }; v.n++; if (n) v.siapa.push(n); hit.set(k, v); };
  if (K.prof && K.prof.lg) tambah(K.prof.lg, K.prof.n);
  for (const o of K.lain.values()) tambah(o.lg, o.nama);
  return [...hit.values()].sort((a, b) => b.n - a.n);
}
export function bukaLagu() {
  const l = laguHariIni();
  bukaKartu(`<h2>🎵 Lagu Hari Ini di Kafe Jodoh</h2><p class="kecil">Diambil dari lagu favorit tamu yang sedang di kantor. Isi lagu favoritmu di Profil → Ubah data.</p>
    ${l.length ? `<div class="daftar">${l.slice(0, 10).map((v, i) => `<div><span>${i ? '' : '🏆 '}<b>${esc(v.lg)}</b><br><small>${esc(v.siapa.slice(0, 3).join(', '))}${v.siapa.length > 3 ? '…' : ''}</small></span><a class="mini putih" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(v.lg)}">▶ Putar</a></div>`).join('')}</div>` : '<p>Belum ada yang mengisi lagu favorit.</p>'}`);
}

// ---------------------------------------------------------------- ACARA MUSIMAN
// otomatis sesuai tanggal (WIB) atau dipilih Direktur (setelan/musim)
export const MUSIM = { '': 'Tanpa dekorasi', valentine: '💘 Valentine', ramadan: '🌙 Ramadan', '17an': '🇮🇩 17 Agustus', halloween: '🎃 Halloween', natal: '🎄 Natal & Tahun Baru' };
export function musimAktif() {
  const s = K.setelan && K.setelan.musim;
  if (s && s !== 'otomatis') return s === 'tidak' ? '' : s;
  const d = new Date((K.L ? K.L.db.now() : Date.now()) + 7 * 3600e3), m = d.getUTCMonth() + 1, t = d.getUTCDate();
  if (m === 2 && t <= 15) return 'valentine';
  if (m === 8) return '17an';
  if (m === 10 && t >= 20) return 'halloween';
  if ((m === 12 && t >= 15) || (m === 1 && t <= 5)) return 'natal';
  return '';
}

// ---------------------------------------------------------------- KODE UNDANGAN
export function bukaUndang() {
  if (!siap()) return;
  const kode = kodeTamu(K.L.uid), link = `${location.origin}/kantor/?ref=${kode}#daftar`;
  bukaKartu(`<h2>🎟️ Ajak teman</h2><p>Bagikan kode undanganmu. Kalau temanmu daftar pakai kode ini dan <b>di-ACC Direktur</b>, kalian <b>berdua dapat 50 💠 Diamond</b>!</p>
    <div class="kartuPemantik besar">${esc(kode)}</div>
    <div class="baris"><button class="btn" type="button" id="ugB">📤 Bagikan link</button><button class="btn putih" type="button" id="ugS">Salin</button></div>
    <p class="kecil">${esc(link)}</p>`, {
    pasang(el) {
      const teks = `Yuk gabung di kantor virtual PT Mencari Cinta Sejati 💘 Daftar pakai kode undanganku ${kode}: ${link}`;
      el.querySelector('#ugB').onclick = () => (navigator.share ? navigator.share({ text: teks }).catch(() => {}) : navigator.clipboard.writeText(teks).then(() => toast('Link disalin ✔')));
      el.querySelector('#ugS').onclick = () => navigator.clipboard.writeText(teks).then(() => toast('Disalin ✔')).catch(() => toast(kode));
    },
  });
}

export function mulai() {
  const L = K.L;
  L.db.on('pasanganMinggu', v => { const lama = K.pasanganMinggu; K.pasanganMinggu = v; if (lama && v && v.t !== lama.t) { toast(`💑 Pasangan Minggu Ini: ${v.na} & ${v.nb}!`, 5000); K.efekLokal && K.efekLokal('hati', 40); } });
}
