// =====================================================================
//  Kehadiran Direktur & fitur khusus Direktur:
//   - semua tamu diberi tahu saat Direktur masuk kantor, karyawan menyambut
//   - tamu bisa "Sapa Direktur" (sapaan khusus, bukan pesan pribadi)
//   - Direktur diberi tahu saat ada tamu masuk & saat ada sapaan
//   - efek untuk semua orang (hujan hati, kembang api, hujan bunga,
//     undangan berkumpul) yang hanya bisa dipicu Direktur
// =====================================================================
import { LOKASI, LS, bersih, esc, fmt } from '../js/common.js?v=202611262230';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog } from './ui.js?v=202611262230';
import * as Musik from './musik.js?v=202611262230';
import * as Prog from './progres.js?v=202611262230';
import * as Karyawan from './karyawan.js?v=202611262230';

export const SAPA = {
  halo: { ikon: '👋', teks: 'Halo, Direktur!' },
  hormat: { ikon: '🙇', teks: 'Memberi hormat untuk Direktur' },
  bunga: { ikon: '💐', teks: 'Mengirim bunga untuk Direktur' },
  kopi: { ikon: '☕', teks: 'Mentraktir kopi untuk Direktur' },
  makasih: { ikon: '🙏', teks: 'Terima kasih, Direktur!' },
  semangat: { ikon: '💪', teks: 'Semangat terus, Direktur!' },
};
export const BALAS = [['😊', 'Sama-sama, senang kamu di sini!'], ['👍', 'Mantap, selamat bersenang-senang!'], ['❤️', 'Makasih banyak, semoga cepat ketemu jodohnya!'], ['🫡', 'Siap! Jaga sikap & tetap sopan ya']];
const EFEK = {
  hati: { emoji: ['💗', '💖', '💘', '❤️', '💕'], teks: 'menebar hujan hati 💗' },
  kembangapi: { emoji: ['🎆', '🎇', '✨', '🎉', '🎊'], teks: 'menyalakan kembang api 🎆' },
  bunga: { emoji: ['🌸', '💐', '🌷', '🌺', '🌼'], teks: 'menebar hujan bunga 🌸' },
};

const saya = () => K.L && K.L.uid;
const sayaDirektur = () => K.L && K.peran[K.L.uid] === 'direktur';
// "Direktur Yocky"; kalau namanya sudah mengandung kata Direktur, tidak diulang
const namaDir = o => (o && o.nama) || '';
const sebut = o => { const n = namaDir(o); return /direktur/i.test(n) ? n : ('Direktur ' + n).trim(); };
let awal = true, dirLama = new Set(), tamuLama = new Set(), efekLihat = 0, sapaLihat = {}, lepasSapa = null, mulaiT = Date.now();
let sapaan = {};
export const daftarSapaan = () => sapaan;

export function mulai() {
  const db = K.L.db;
  mulaiT = db.now();
  efekLihat = LS.get('efekT', 0) || 0;
  db.on('efek', e => tampilEfek(e));
  $('btnSapa').onclick = () => bukaSapa();
  perbaruiPeran();
}

// dipanggil saat daftar peran berubah
export function perbaruiPeran() {
  if (!K.L) return;
  if (sayaDirektur() && !lepasSapa) {
    lepasSapa = K.L.db.on('sapaDir', o => {
      sapaan = o || {};
      for (const [uid, s] of Object.entries(sapaan)) {
        if (!s || !s.t || s.dibalas || s.t < mulaiT - 5000 || sapaLihat[uid] === s.t) continue;
        sapaLihat[uid] = s.t;
        munculSapa(uid, s);
      }
      K.segarPanel && K.segarPanel();
    });
  } else if (!sayaDirektur() && lepasSapa) { lepasSapa(); lepasSapa = null; sapaan = {}; }
  onlineBerubah();
}

// dipanggil kantor.js setiap daftar orang online berubah
export function onlineBerubah() {
  if (!K.L) return;
  const orang = [...K.lain.values()];
  const dir = orang.filter(o => K.peran[o.uid] === 'direktur');
  const dirKini = new Set(dir.map(o => o.uid));
  // tombol sapa: untuk tamu resmi saat Direktur ada di kantor
  $('btnSapa').hidden = !(dir.length && K.resmi && K.resmi() && !sayaDirektur());
  if (!sayaDirektur()) {
    for (const o of dir) if (!dirLama.has(o.uid)) {
      if (awal) { toast(`👑 ${sebut(o)} sedang ada di kantor. Sapa yuk!`, 4200); }
      else banner(o);
      tulisLog('', `👑 ${sebut(o)} ${awal ? 'sedang ada di kantor' : 'memasuki kantor!'}`, 'sys');
      Karyawan.sambut(o);
    }
  } else {
    // Direktur: kabar tamu yang masuk
    const tamu = orang.filter(o => !K.peran[o.uid]);
    if (!awal) {
      const baru = tamu.filter(o => !tamuLama.has(o.uid));
      if (baru.length) {
        toast(baru.length === 1 ? `🟢 ${baru[0].nama} masuk kantor` : `🟢 ${baru.length} tamu masuk kantor`, 3200);
        baru.forEach(o => tulisLog('', `🟢 ${o.nama} masuk kantor`, 'sys'));
      }
    }
    tamuLama = new Set(tamu.map(o => o.uid));
  }
  dirLama = dirKini;
  if (orang.length || K.onlineTerakhir) awal = false;
}

// Direktur sendiri baru masuk: sambutan + ringkasan
let disambut = false;
export function direkturMasuk() {
  if (disambut || !sayaDirektur()) return;
  disambut = true;
  Karyawan.sambut(K.saya);
  setTimeout(() => {
    const tamu = [...K.lain.values()].filter(o => !K.peran[o.uid]);
    const sp = Object.values(sapaan).filter(s => s && !s.dibalas).length;
    if (!$('kartu').hidden) { toast(`👑 Selamat datang, Direktur! ${tamu.length} tamu sedang online.`, 4000); return; }
    bukaKartu(`<div class="match"><div class="hatiBesar">👑</div><h2>Selamat datang, Direktur!</h2>
      <p>Semua karyawan sudah siap. Kehadiranmu diumumkan ke semua tamu yang sedang online.</p>
      <div class="angkaGrid"><div class="angka"><b>${fmt(tamu.length)}</b><span>tamu online</span></div><div class="angka"><b>${fmt(sp)}</b><span>sapaan baru</span></div></div>
      <div class="baris"><button class="btn" type="button" id="dK">👑 Kuasa Direktur</button><button class="btn putih" type="button" id="dT">Nanti</button></div></div>`, {
      pasang(i) { i.querySelector('#dK').onclick = () => K.bukaPanel && K.bukaPanel('kuasa'); i.querySelector('#dT').onclick = tutupKartu; },
    });
  }, 1500);
}

function banner(o) {
  const b = $('dirDatang');
  b.querySelector('span').textContent = `👑 ${sebut(o)} memasuki kantor!`;
  b.hidden = false; b.classList.remove('keluar');
  const tb = b.querySelector('button');
  tb.hidden = !(K.resmi && K.resmi());
  tb.onclick = () => { b.hidden = true; bukaSapa(); };
  clearTimeout(banner.t);
  banner.t = setTimeout(() => { b.classList.add('keluar'); setTimeout(() => { b.hidden = true; }, 400); }, 7000);
}

// ---------------------------------------------------------------- SAPA DIREKTUR (tamu)
export function bukaSapa() {
  if (!K.resmi()) { K.bukaDaftar(); return; }
  const tunggu = Prog.vvipSaya() ? 0 : (LS.get('sapaT', 0) || 0) + 300000 - Date.now();
  bukaKartu(`<h2>👋 Sapa Direktur</h2>
    <p class="kecil">Sapaan langsung muncul di layar Direktur, dan Direktur bisa membalasnya. Ini bukan pesan pribadi. ${Prog.vvipSaya() ? 'Sebagai VVIP kamu bisa menyapa kapan saja 👑' : 'Kirim sekali tiap 5 menit ya.'}</p>
    <div class="sapaGrid">${Object.entries(SAPA).map(([k, s]) => `<button type="button" data-s="${k}" ${tunggu > 0 ? 'disabled' : ''}><b>${s.ikon}</b><span>${esc(s.teks)}</span></button>`).join('')}</div>
    ${tunggu > 0 ? `<p class="err">Kamu baru saja menyapa. Coba lagi ${Math.ceil(tunggu / 60000)} menit lagi.</p>` : ''}`, {
    pasang(isi) {
      isi.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => {
        const j = b.dataset.s;
        try {
          await K.L.sapaDirektur(bersih(K.prof.n, 30), j);
          LS.set('sapaT', Date.now());
          tutupKartu();
          K.bicara(K.saya, `${SAPA[j].ikon} ${SAPA[j].teks}`); K.saya.lambai = 3;
          toast('Sapaanmu sudah sampai di Direktur 👑');
          Prog.lapor('sapaDir');
        } catch (e) { toast('Belum bisa menyapa sekarang. Tunggu 5 menit sejak sapaan terakhir.', 3600); }
      });
    },
  });
}

// ---------------------------------------------------------------- SAPAAN MASUK (Direktur)
function munculSapa(uid, s) {
  const sp = SAPA[s.j] || SAPA.halo;
  tulisLog('', `${sp.ikon} ${bersih(s.n, 30)}: ${sp.teks}`, 'sys');
  const el = document.createElement('div');
  el.className = 'sapaMasuk';
  el.innerHTML = `<b>${sp.ikon}</b><div><strong>${esc(bersih(s.n, 30))}</strong><span>${esc(sp.teks)}</span>
    <p>${BALAS.map(([e], i) => `<button type="button" data-b="${i}" aria-label="Balas ${e}">${e}</button>`).join('')}</p></div><button type="button" class="x" aria-label="Tutup">✕</button>`;
  $('sapaWadah').appendChild(el);
  const hapus = () => { el.classList.add('keluar'); setTimeout(() => el.remove(), 350); };
  el.querySelector('.x').onclick = hapus;
  el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { balasSapa(uid, s, +b.dataset.b); hapus(); });
  setTimeout(hapus, 20000);
  const o = K.lain.get(uid); if (o) K.bicara(o, `${sp.ikon} ${sp.teks}`);
  efekLokal('hati', 14);
}
export function balasSapa(uid, s, i) {
  const [e, t] = BALAS[i];
  return Promise.all([
    K.L.kirimNotif(uid, `${e} ${t}`, 'balasSapa'),
    K.L.db.set(`sapaDir/${uid}/dibalas`, true),
  ]).then(() => toast(`Balasan terkirim ke ${bersih(s.n, 30)} ${e}`)).catch(() => toast('Gagal mengirim balasan.'));
}

// ---------------------------------------------------------------- EFEK UNTUK SEMUA
function tampilEfek(e) {
  if (!e || !e.t || e.t <= efekLihat || K.L.db.now() - e.t > 60000) return;
  efekLihat = e.t; LS.set('efekT', e.t);
  const n0 = bersih(e.n, 30), n = /direktur/i.test(n0) ? n0.replace(/^direktur\s*/i, '') : n0, D_ = n ? 'Direktur ' + n : 'Direktur';
  if (e.jenis === 'kumpul') {
    const l = LOKASI[e.lok]; if (!l) return;
    tulisLog('', `📣 ${D_} mengundang semua ke ${l.nama}`, 'sys');
    if (sayaDirektur()) { toast(`📣 Undangan ke ${l.nama} terkirim`); return; }
    bukaKartu(`<div class="match"><div class="hatiBesar">📣</div><h2>Undangan dari Direktur</h2><p><b>${esc(D_)}</b> mengundang semua tamu ke <b>${esc(l.nama)}</b>. Yuk kumpul!</p>
      <div class="baris"><button class="btn" type="button" id="kS">Ke sana sekarang</button><button class="btn putih" type="button" id="kN">Nanti</button></div></div>`, {
      pasang(i) { i.querySelector('#kS').onclick = () => { tutupKartu(); Prog.pergiKe(e.lok); }; i.querySelector('#kN').onclick = tutupKartu; },
    });
    return;
  }
  const ef = EFEK[e.jenis]; if (!ef) return;
  efekLokal(e.jenis);
  toast(`👑 ${D_} ${ef.teks}`, 4200);
  tulisLog('', `👑 ${D_} ${ef.teks}`, 'sys');
}
export function efekLokal(jenis, jumlah = 70) {
  Musik.sfx(jenis === 'kembangapi' ? 'kembangapi' : 'hati', { jeda: 800 });
  const ef = EFEK[jenis] || EFEK.hati, w = $('efekWadah');
  for (let i = 0; i < jumlah; i++) {
    const s = document.createElement('span');
    s.textContent = ef.emoji[i % ef.emoji.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.fontSize = 18 + Math.random() * 26 + 'px';
    s.style.animationDuration = 3.5 + Math.random() * 3 + 's';
    s.style.animationDelay = Math.random() * 2.5 + 's';
    w.appendChild(s);
    setTimeout(() => s.remove(), 9000);
  }
}
export const kirimEfek = (jenis, lok = '') => K.L.efek(jenis, bersih(K.prof?.n || 'Direktur', 30), lok);
