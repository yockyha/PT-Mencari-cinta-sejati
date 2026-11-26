// =====================================================================
//  Grup obrolan antar-tamu (teks + stiker).
//  - Buat grup, undang tamu (harus diterima), keluar, keluarkan anggota
//  - Batas: tamu biasa 10 anggota & 2 grup, VIP 30 & 5, VVIP 100 & 10
//  - Direktur bisa melihat & masuk semua grup (moderasi)
//  Data: grup/<id>, grupPesan/<id>, grupku/<uid>/<id>, grupUndangan/<uid>/<id>
// =====================================================================
import { LS, bersih, esc, fmt } from '../js/common.js?v=202611260636';
import { TS, kunciBaru } from '../js/db.js?v=202611260636';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, jam, tanggalJam } from './ui.js?v=202611260636';
import * as Prog from './progres.js?v=202611260636';
import * as Stiker from './stiker.js?v=202611260636';

const IKON = ['👥', '🎮', '🎵', '🍜', '✈️', '💘', '📚', '⚽', '🐱', '☕', '🎬', '🌙'];
const BATAS = { '': { anggota: 10, grup: 2 }, vip: { anggota: 30, grup: 5 }, vvip: { anggota: 100, grup: 10 } };
const batas = () => (K.peran[K.L.uid] === 'direktur' ? { anggota: 999, grup: 99 } : BATAS[Prog.tingkat(K.L.uid)] || BATAS['']);
const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk ikut grup.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const direktur = () => K.peran[K.L.uid] === 'direktur';

let grupku = {}, undangan = {}, terbuka = null, lepasRuang = null, lepasInfo = null, layar = '';
export const jumlahBaru = () => Object.entries(grupku).filter(([g, v]) => v && v.t > (LS.get('grupBaca', {})?.[g] || 0)).length + Object.keys(undangan).length;

export function mulai() {
  const L = K.L, db = L.db;
  db.on('grupku/' + L.uid, o => { const lama = grupku; grupku = o || {}; for (const [g, v] of Object.entries(grupku)) if (v && lama[g] && v.t !== lama[g].t && g !== terbuka && v.dari !== L.uid) toast(`👥 Pesan baru di ${bersih(v.nama, 30)}`); K.segarBadge && K.segarBadge(); if (layar === 'daftar') K.bukaObrolanTab && K.bukaObrolanTab('grup'); });
  db.on('grupUndangan/' + L.uid, o => {
    const lama = undangan; undangan = o || {};
    for (const [g, v] of Object.entries(undangan)) if (v && !lama[g]) { toast(`👥 ${bersih(v.dari, 30)} mengundangmu ke grup ${bersih(v.nama, 30)}`, 4200); tulisLog('', `👥 Undangan grup: ${bersih(v.nama, 30)}`, 'sys'); }
    K.segarBadge && K.segarBadge();
    if (layar === 'daftar') K.bukaObrolanTab && K.bukaObrolanTab('grup');
  });
}

// ---------------------------------------------------------------- DAFTAR GRUP (dipasang di kartu Obrolan)
export function htmlDaftar() {
  const L = K.L;
  const l = Object.entries(grupku).filter(([, v]) => v).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  const baca = LS.get('grupBaca', {}) || {};
  const und = Object.entries(undangan).filter(([, v]) => v);
  return `${und.length ? `<h3>📨 Undangan grup</h3><div class="daftar">${und.map(([g, v]) => `<div><span>${esc(v.ikon || '👥')} <b>${esc(bersih(v.nama, 30))}</b><br><small>dari ${esc(bersih(v.dari, 30))}</small></span><span class="baris kecil" style="margin:0"><button type="button" class="mini" data-gy="${esc(g)}">Gabung</button><button type="button" class="mini putih" data-gt="${esc(g)}">Tolak</button></span></div>`).join('')}</div>` : ''}
    <div class="baris" style="margin-top:6px"><button class="btn" type="button" id="gBuat">＋ Buat grup${bolehBuatGrup() ? '' : ' 🔒'}</button>${direktur() ? '<button class="btn putih" type="button" id="gSemua">👑 Semua grup</button>' : ''}</div>
    ${l.length ? `<div class="daftar" style="margin-top:10px">${l.map(([g, v]) => `<div class="baris-ruang" data-g="${esc(g)}"><span>${v.t > (baca[g] || 0) && v.dari !== L.uid ? '<i class="titik"></i>' : ''}${esc(v.ikon || '👥')} <b>${esc(bersih(v.nama, 30))}</b><br><small>${v.m ? esc(bersih(v.m, 40)) + ' · ' : ''}${v.t ? esc(tanggalJam(v.t)) : ''}</small></span><button type="button" class="mini">Buka</button></div>`).join('')}</div>`
      : `<p class="kecil">Belum ada grup. ${bolehBuatGrup() ? 'Buat grup lalu undang teman dari kantor, atau tunggu undangan.' : 'Membuat grup butuh 💎 VIP atau Level 7. Sambil itu, kamu bisa diundang teman ke grup mereka.'}</p>`}`;
}
export function pasangDaftar(isi) {
  layar = 'daftar';
  isi.querySelector('#gBuat').onclick = () => bukaBuat();
  const sm = isi.querySelector('#gSemua'); if (sm) sm.onclick = () => bukaSemua();
  isi.querySelectorAll('[data-g]').forEach(d => d.onclick = () => bukaGrup(d.dataset.g));
  isi.querySelectorAll('[data-gy]').forEach(b => b.onclick = () => gabung(b.dataset.gy));
  isi.querySelectorAll('[data-gt]').forEach(b => b.onclick = () => K.L.db.set(`grupUndangan/${K.L.uid}/${b.dataset.gt}`, null));
}
export const lepasDaftar = () => { if (layar === 'daftar') layar = ''; };

// ---------------------------------------------------------------- BUAT GRUP
// Membuat grup: VIP/VVIP, level 7 ke atas, atau Direktur (dijaga juga oleh aturan Firebase)
export const bolehBuatGrup = () => direktur() || Prog.vipSaya() || Prog.level() >= 7;
function bukaBuat() {
  if (!siap()) return;
  if (!bolehBuatGrup()) {
    bukaKartu(`<h2>👥 Buat grup</h2><p>Membuat grup obrolan khusus tamu <b>💎 VIP / 👑 VVIP</b> atau yang sudah mencapai <b>Level 7</b>. Levelmu sekarang <b>${Prog.level()}</b>.</p>
      <p class="kecil">Kamu tetap bisa bergabung ke grup lewat undangan teman.</p>
      <div class="baris"><button class="btn" type="button" id="bV">💎 Jadi VIP</button><button class="btn putih" type="button" id="bT">✅ Kumpulkan EXP</button></div>`, {
      pasang(i) { i.querySelector('#bV').onclick = () => K.bukaLangganan(); i.querySelector('#bT').onclick = () => Prog.bukaHub('tugas'); },
    });
    return;
  }
  const milik = Object.values(grupku).filter(v => v && v.pemilik === K.L.uid).length, b = batas();
  if (milik >= b.grup) { toast(`Kamu sudah punya ${milik} grup. ${Prog.vvipSaya() ? '' : 'Jadi VIP/VVIP untuk bikin lebih banyak grup.'}`, 4000); return; }
  let ikon = '👥';
  bukaKartu(`<h2>👥 Buat grup</h2>
    <label for="gN">Nama grup</label><input id="gN" maxlength="30" placeholder="contoh: Geng Mabar Malam">
    <label>Ikon</label><div class="sw teks" id="gI">${IKON.map(i => `<button type="button" data-i="${i}" class="${i === ikon ? 'on' : ''}">${i}</button>`).join('')}</div>
    <p class="kecil">Maksimal ${fmt(b.anggota)} anggota. Anggota baru harus menerima undangan dulu. Direktur dapat memantau grup demi keamanan.</p>
    <p class="err" id="gE"></p><div class="baris"><button class="btn" type="button" id="gOk">Buat</button></div>`, {
    pasang(isi) {
      isi.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { ikon = x.dataset.i; isi.querySelectorAll('[data-i]').forEach(y => y.classList.toggle('on', y === x)); });
      isi.querySelector('#gOk').onclick = async () => {
        const nama = bersih(isi.querySelector('#gN').value, 30);
        if (nama.length < 3) { isi.querySelector('#gE').textContent = 'Nama grup minimal 3 huruf.'; return; }
        const L = K.L, g = 'g' + kunciBaru(), n = bersih(K.prof.n, 30);
        try {
          await L.db.update('', {
            [`grup/${g}`]: { nama, ikon, pemilik: L.uid, t: TS, anggota: { [L.uid]: n } },
            [`grupku/${L.uid}/${g}`]: { nama, ikon, pemilik: L.uid, t: TS, m: 'Grup dibuat', dari: L.uid },
          });
          toast(`Grup ${nama} dibuat 🎉 Undang teman-temanmu!`);
          bukaGrup(g, true);
        } catch (e) { console.warn(e); isi.querySelector('#gE').textContent = 'Gagal membuat grup.'; }
      };
    },
  });
}

async function gabung(g) {
  if (!siap()) return;
  const L = K.L, u = undangan[g];
  try {
    await L.db.set(`grup/${g}/anggota/${L.uid}`, bersih(K.prof.n, 30));
    await L.db.set(`grupku/${L.uid}/${g}`, { nama: bersih(u?.nama, 30) || 'Grup', ikon: u?.ikon || '👥', pemilik: u?.pemilik || '', t: TS, m: 'Kamu bergabung', dari: L.uid });
    await L.db.set(`grupUndangan/${L.uid}/${g}`, null);
    kirim(g, `👋 ${bersih(K.prof.n, 30)} bergabung`, '', true);
    bukaGrup(g);
  } catch (e) { console.warn(e); toast('Gagal bergabung. Mungkin grupnya sudah dihapus.'); L.db.set(`grupUndangan/${L.uid}/${g}`, null).catch(() => {}); }
}

// ---------------------------------------------------------------- RUANG GRUP
export function bukaGrup(g, undangLangsung = false) {
  const L = K.L;
  let info = null;
  bukaKartu(`<div class="kepalaRuang"><button type="button" class="mini putih" id="gB">← Obrolan</button><h2 id="gJ">👥 …</h2><button type="button" class="mini" id="gA" aria-label="Anggota">👤</button></div>
    <div class="dmIsi" id="gIsi" aria-live="polite"><p class="kecil">Memuat…</p></div>
    <div class="pemilihStiker" id="gSt" hidden></div>
    <form id="gF" class="dmForm" autocomplete="off"><button class="btn putih" type="button" id="gSb" aria-label="Stiker">😀</button><input id="gT" maxlength="300" placeholder="Tulis pesan ke grup…" enterkeyhint="send" aria-label="Pesan grup"><button class="btn" type="submit">Kirim</button></form>
    <p class="kecil tautan" id="gKet"></p>`, {
    tutup() { lepasRuang && lepasRuang(); lepasInfo && lepasInfo(); lepasRuang = lepasInfo = null; terbuka = null; layar = ''; },
    pasang(isi) {
      layar = 'ruang'; terbuka = g;
      const box = isi.querySelector('#gIsi');
      const tandaiBaca = () => { const b = LS.get('grupBaca', {}) || {}; b[g] = L.db.now(); LS.set('grupBaca', b); K.segarBadge && K.segarBadge(); };
      lepasInfo = L.db.on('grup/' + g, o => {
        info = o;
        if (!o) { box.innerHTML = '<p class="kecil">Grup ini sudah dihapus atau kamu bukan anggota lagi.</p>'; L.db.set(`grupku/${L.uid}/${g}`, null).catch(() => {}); return; }
        const n = Object.keys(o.anggota || {}).length;
        isi.querySelector('#gJ').textContent = `${o.ikon || '👥'} ${bersih(o.nama, 30)}`;
        isi.querySelector('#gKet').innerHTML = `${fmt(n)} anggota · ${o.anggota && o.anggota[L.uid] ? '<button type="button" id="gK">Keluar grup</button>' : '👑 Kamu melihat sebagai Direktur'}`;
        const k = isi.querySelector('#gK'); if (k) k.onclick = () => keluar(g, o);
        if (undangLangsung) { undangLangsung = false; bukaAnggota(g, o); }
      });
      lepasRuang = L.db.on('grupPesan/' + g, o => {
        const msgs = Object.entries(o || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ ...v, k })).filter(m => !K.sembunyi.has(m.uid));
        box.innerHTML = msgs.length ? msgs.map(m => m.sis ? `<p class="kecil sistem">${esc(m.m)}</p>` : `<div class="dm ${m.uid === L.uid ? 'saya' : ''} ${m.st ? 'stikerPesan' : ''}">${m.uid === L.uid ? '' : `<small><b>${esc(bersih(m.n, 30))}</b></small>`}${m.st ? Stiker.html(m.st) : `<span>${esc(m.m)}</span>`}<small>${esc(jam(m.t))}${direktur() && m.uid !== L.uid ? ` · <button type="button" class="tautan" data-hp="${esc(m.k)}">hapus</button>` : ''}</small></div>`).join('')
          : '<p class="kecil">Belum ada pesan. Sapa anggota grup!</p>';
        Stiker.isiGambar(box);
        box.querySelectorAll('[data-hp]').forEach(b => b.onclick = () => L.db.set(`grupPesan/${g}/${b.dataset.hp}`, null).catch(() => toast('Gagal menghapus.')));
        box.scrollTop = box.scrollHeight;
        tandaiBaca();
      }, { limit: 60 });
      isi.querySelector('#gB').onclick = () => K.bukaObrolanTab('grup');
      isi.querySelector('#gA').onclick = () => info && bukaAnggota(g, info);
      Stiker.pasangPemilih(isi.querySelector('#gSb'), isi.querySelector('#gSt'), id => kirim(g, '[stiker]', id));
      let terakhir = 0;
      isi.querySelector('#gF').onsubmit = e => {
        e.preventDefault();
        const inp = isi.querySelector('#gT'), t = bersih(inp.value, 300);
        if (!t || !siap() || Date.now() - terakhir < 800) return;
        terakhir = Date.now(); inp.value = '';
        kirim(g, t);
      };
    },
  });
}

function kirim(g, m, st = '', sistem = false) {
  const L = K.L, n = bersih(K.prof.n, 30);
  const d = { uid: L.uid, n, m, t: TS, ...(st ? { st } : {}), ...(sistem ? { sis: true } : {}) };
  return L.db.push(`grupPesan/${g}`, d) && perbaruiDaftarAnggota(g, st ? `${n}: [stiker]` : sistem ? m : `${n}: ${m}`);
}
// perbarui ringkasan di daftar grup milik semua anggota (masing-masing di grupku/<uid>)
async function perbaruiDaftarAnggota(g, ringkas) {
  const L = K.L;
  const o = await L.db.get('grup/' + g).catch(() => null); if (!o) return true;
  const upd = {};
  for (const u of Object.keys(o.anggota || {})) upd[`grupku/${u}/${g}`] = { nama: o.nama, ikon: o.ikon || '👥', pemilik: o.pemilik, t: TS, m: bersih(ringkas, 60), dari: L.uid };
  L.db.update('', upd).catch(e => console.warn('grupku', e));
  return true;
}

// ---------------------------------------------------------------- ANGGOTA
function bukaAnggota(g, o) {
  const L = K.L, pemilik = o.pemilik === L.uid, anggota = Object.entries(o.anggota || {}), b = batas();
  const calon = [...K.lain.values()].filter(x => !x.npc && !o.anggota?.[x.uid] && !K.sembunyi.has(x.uid) && x.tj);
  bukaKartu(`<h2>${esc(o.ikon || '👥')} ${esc(bersih(o.nama, 30))}</h2>
    <h3>Anggota (${fmt(anggota.length)}/${fmt(b.anggota)})</h3>
    <div class="daftar">${anggota.map(([u, n]) => `<div><span>${u === o.pemilik ? '👑 ' : ''}${esc(bersih(n, 30))}${u === L.uid ? ' <small>(kamu)</small>' : ''}</span>${(pemilik || direktur()) && u !== L.uid ? `<button type="button" class="mini merah" data-kick="${esc(u)}">Keluarkan</button>` : ''}</div>`).join('')}</div>
    ${o.anggota?.[L.uid] || direktur() ? `<h3>Undang tamu yang sedang di kantor</h3>
    ${calon.length ? `<div class="daftar">${calon.map(x => `<div><span>${esc(x.nama)}</span><button type="button" class="mini" data-ud="${esc(x.uid)}">Undang</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu lain yang online untuk diundang.</p>'}` : ''}
    <div class="baris"><button class="btn putih" type="button" id="aK">← Kembali ke grup</button>${pemilik || direktur() ? '<button class="btn merah" type="button" id="aH">Hapus grup</button>' : ''}</div>`, {
    pasang(isi) {
      isi.querySelector('#aK').onclick = () => bukaGrup(g);
      isi.querySelectorAll('[data-ud]').forEach(bt => bt.onclick = async () => {
        if (!siap()) return;
        if (anggota.length >= b.anggota) { toast(`Grup sudah penuh (${b.anggota} anggota).`); return; }
        try {
          await L.db.set(`grupUndangan/${bt.dataset.ud}/${g}`, { nama: o.nama, ikon: o.ikon || '👥', pemilik: o.pemilik, dari: bersih(K.prof.n, 30), t: TS });
          bt.disabled = true; bt.textContent = 'Terundang ✔';
        } catch (e) { toast('Gagal mengundang.'); }
      });
      isi.querySelectorAll('[data-kick]').forEach(bt => bt.onclick = async () => {
        const n = o.anggota[bt.dataset.kick];
        if (!confirm(`Keluarkan ${n} dari grup?`)) return;
        await L.db.update('', { [`grup/${g}/anggota/${bt.dataset.kick}`]: null, [`grupku/${bt.dataset.kick}/${g}`]: null }).catch(() => toast('Gagal.'));
        kirim(g, `🚪 ${bersih(n, 30)} dikeluarkan dari grup`, '', true);
        bukaAnggota(g, { ...o, anggota: Object.fromEntries(anggota.filter(([u]) => u !== bt.dataset.kick)) });
      });
      const h = isi.querySelector('#aH');
      if (h) h.onclick = async () => {
        if (!confirm('Hapus grup ini beserta semua pesannya?')) return;
        try { await L.db.update('', { [`grup/${g}`]: null, [`grupPesan/${g}`]: null, [`grupku/${L.uid}/${g}`]: null }); tutupKartu(); toast('Grup dihapus.'); } catch (e) { toast('Gagal menghapus grup.'); }
      };
    },
  });
}

async function keluar(g, o) {
  if (!confirm(`Keluar dari grup ${o.nama}?`)) return;
  const L = K.L;
  try {
    await kirim(g, `🚪 ${bersih(K.prof.n, 30)} keluar dari grup`, '', true);
    await L.db.update('', { [`grup/${g}/anggota/${L.uid}`]: null, [`grupku/${L.uid}/${g}`]: null });
    tutupKartu(); toast('Kamu keluar dari grup.');
  } catch (e) { toast('Gagal keluar grup.'); }
}

// ---------------------------------------------------------------- DIREKTUR: SEMUA GRUP
async function bukaSemua() {
  const semua = await K.L.db.get('grup').catch(() => null) || {};
  const l = Object.entries(semua).filter(([, v]) => v).sort((a, b) => (b[1].t || 0) - (a[1].t || 0));
  bukaKartu(`<h2>👑 Semua grup (${fmt(l.length)})</h2><p class="kecil">Sebagai Direktur kamu bisa membuka, memantau, dan menghapus grup mana pun.</p>
    ${l.length ? `<div class="daftar">${l.map(([g, v]) => `<div><span>${esc(v.ikon || '👥')} <b>${esc(bersih(v.nama, 30))}</b><br><small>${fmt(Object.keys(v.anggota || {}).length)} anggota · dibuat ${esc(tanggalJam(v.t))}</small></span><button type="button" class="mini" data-g="${esc(g)}">Buka</button></div>`).join('')}</div>` : '<p>Belum ada grup.</p>'}`, {
    pasang(isi) { isi.querySelectorAll('[data-g]').forEach(b => b.onclick = () => bukaGrup(b.dataset.g)); },
  });
}
