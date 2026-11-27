// =====================================================================
//  Speed Dating 💘 (acara Direktur, mis. Jumat malam di Kafe Jodoh)
//  - Tamu "Cari Jodoh" masuk antrean (sdAntre/<uid>)
//  - Direktur memulai ronde (manual atau otomatis): peserta dipasangkan acak,
//    ngobrol berdua 3 menit (sdChat/<a_b>), lalu memilih ❤ atau ✕.
//    ❤ = Suka biasa: kalau saling ❤ langsung match & obrolan pribadi terbuka.
//  Data ronde: speedDating = { buka, ronde: { no, mulai, durasi, pasangan: {uid: lawan} } }
// =====================================================================
import { LS, bersih, esc, fmt } from '../js/common.js?v=202611270848';
import { TS } from '../js/db.js?v=202611270848';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, jam } from './ui.js?v=202611270848';
import * as Seru from './seru.js?v=202611270848';

const PEMANTIK = ['Kalau weekend ideal kamu kayak apa?', 'Makanan yang bikin kamu bahagia?', 'Lagu yang lagi sering kamu puter?', 'Kencan pertama impianmu?', 'Hal kecil yang bikin kamu jatuh hati?', 'Kamu tipe chat duluan atau nunggu?', 'Tempat liburan impianmu?', 'Satu hal yang orang jarang tahu tentang kamu?', 'Love language kamu apa?', 'Kopi atau teh?'];
const DURASI = 180;
let sd = {}, antre = {}, ruangKu = '', lepasChat = null, sudahPilih = {}, bukaLama = null;
const L_ = () => K.L;
const sayaJodoh = () => K.prof && K.prof.tj === 'jodoh';
const ruang = (a, b) => [a, b].sort().join('_');
const sisa = () => { const r = sd.ronde; return r ? Math.max(0, Math.round((r.mulai + (r.durasi || DURASI) * 1000 - L_().db.now()) / 1000)) : 0; };
const namaUid = u => (K.lain.get(u) || {}).nama || (K.tamu.find(t => t.uid === u) || {}).n || 'Teman';

export function mulai() {
  const L = L_();
  L.db.on('speedDating', v => {
    sd = v || {};
    if (bukaLama === false && sd.buka && sayaJodoh() && K.resmi()) { toast('💘 Speed Dating dibuka di Kafe Jodoh! Buka menu ⭐ → Harian untuk ikut.', 5000); tulisLog('', '💘 Speed Dating dibuka!', 'sys'); }
    bukaLama = !!sd.buka;
    cekRonde();
    K.segarPanel && K.segarPanel();
  });
  L.db.on('sdAntre', v => { antre = v || {}; if (layar === 'info') buka(); K.segarPanel && K.segarPanel(); });
  setInterval(tik, 1000);
}

// ---------------------------------------------------------------- PESERTA
let layar = '';
export function buka() {
  const L = L_(), ikut = !!antre[L.uid], n = Object.keys(antre).length;
  layar = 'info';
  bukaKartu(`<h2>💘 Speed Dating</h2>
    <p>Kenalan cepat <b>3 menit</b> berdua di Kafe Jodoh, lalu ganti pasangan. Di akhir tiap ronde pilih <b>❤</b> atau <b>✕</b>. Kalau kalian saling ❤, langsung <b>match</b> dan obrolan pribadi terbuka.</p>
    ${sd.buka ? `<p>🟢 <b>Sedang dibuka</b> · ${fmt(n)} orang di antrean${sd.ronde ? ` · ronde ${fmt(sd.ronde.no)}` : ''}</p>` : '<p>🔴 Belum dibuka. Pantau pengumuman Direktur (biasanya <b>Jumat malam</b>).</p>'}
    ${!K.resmi() ? '' : !sayaJodoh() ? '<p class="kecil">Speed Dating khusus tamu 💘 Cari Jodoh.</p>' : sd.buka ? `<div class="baris"><button class="btn ${ikut ? 'putih' : ''}" type="button" id="sdI">${ikut ? 'Keluar antrean' : '💘 Ikut antrean'}</button>${ruangKu ? '<button class="btn" type="button" id="sdR">Buka ruang ronde</button>' : ''}</div>` : ''}
    <p class="kecil">Tetap sopan. Ada tombol laporkan di profil setiap orang.</p>`, {
    tutup() { if (layar === 'info') layar = ''; },
    pasang(i) {
      const b = i.querySelector('#sdI');
      if (b) b.onclick = async () => {
        try {
          if (ikut) await L.db.set('sdAntre/' + L.uid, null);
          else { await L.db.set('sdAntre/' + L.uid, { n: bersih(K.prof.n, 30), g: K.prof.g || '', t: TS }); L.db.hapusSaatPutus('sdAntre/' + L.uid); toast('Kamu masuk antrean 💘 Tunggu ronde dimulai.'); K.pindah && K.pindah(19.5, 2.5, Math.PI / 2); }
        } catch (e) { toast('Gagal. Pastikan kamu tamu Cari Jodoh.'); }
      };
      const r = i.querySelector('#sdR'); if (r) r.onclick = bukaRuang;
    },
  });
}

function cekRonde() {
  const L = L_(), r = sd.ronde, lawan = r && r.pasangan && r.pasangan[L.uid];
  const baru = lawan ? ruang(L.uid, lawan) + '#' + r.no : '';
  if (baru && baru !== ruangKu && sisa() > 0) { ruangKu = baru; bukaRuang(); tulisLog('', `💘 Ronde ${r.no}: kamu berpasangan dengan ${namaUid(lawan)}`, 'sys'); }
  if (!baru && ruangKu) ruangKu = '';
  if (r && antre[L.uid] && !lawan && sd.buka && r.no !== cekRonde.istirahat && sisa() > 0) { cekRonde.istirahat = r.no; toast('☕ Ronde ini kamu istirahat dulu (jumlah peserta ganjil).', 4000); }
}

function bukaRuang() {
  const L = L_(), r = sd.ronde; if (!r) return;
  const lawan = r.pasangan && r.pasangan[L.uid]; if (!lawan) return;
  const room = ruang(L.uid, lawan), o = K.lain.get(lawan) || { uid: lawan, nama: namaUid(lawan) };
  layar = 'ruang';
  bukaKartu(`<div class="kepalaRuang"><h2>${K.Foto ? K.Foto.htmlAvatar(lawan, o.nama, 'kecil') : ''}${esc(o.nama)}</h2><b class="sdWaktu" id="sdW">3:00</b></div>
    <p class="kecil">💘 Ronde ${fmt(r.no)} · Pemantik: <b id="sdP">${esc(PEMANTIK[r.no % PEMANTIK.length])}</b></p>
    ${Seru.htmlKecocokan(o)}
    <div class="dmIsi sdIsi" id="sdC"><p class="kecil">Sapa duluan!</p></div>
    <form class="dmForm" id="sdF" autocomplete="off"><input id="sdT" maxlength="200" placeholder="Tulis pesan…"><button class="btn" type="submit">Kirim</button></form>`, {
    tutup() { lepasChat && lepasChat(); lepasChat = null; if (layar === 'ruang') layar = ''; },
    pasang(i) {
      K.Foto && K.Foto.isiAvatar(i);
      const box = i.querySelector('#sdC');
      lepasChat = L.db.on('sdChat/' + room, v => {
        const l = Object.values(v || {}).sort((a, b) => a.t - b.t);
        box.innerHTML = l.length ? l.map(m => `<div class="dm ${m.uid === L.uid ? 'saya' : ''}"><span>${esc(m.m)}</span><small>${esc(jam(m.t))}</small></div>`).join('') : '<p class="kecil">Sapa duluan!</p>';
        box.scrollTop = box.scrollHeight;
      }, { limit: 50 });
      i.querySelector('#sdF').onsubmit = e => {
        e.preventDefault();
        const inp = i.querySelector('#sdT'), t = bersih(inp.value, 200);
        if (!t || sisa() <= 0) return; inp.value = '';
        L.db.push('sdChat/' + room, { uid: L.uid, n: bersih(K.prof.n, 30), m: t, t: TS });
      };
    },
  });
}

function tik() {
  if (!K.L) return;
  const w = document.querySelector('#kartu #sdW');
  if (w) { const s = sisa(); w.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; w.classList.toggle('mepet', s <= 30); }
  // ronde selesai → pilih ❤ / ✕ (sekali per ronde)
  const L = L_(), r = sd.ronde;
  if (r && r.pasangan && r.pasangan[L.uid] && sisa() <= 0 && !sudahPilih[r.no] && r.mulai) {
    sudahPilih[r.no] = true;
    const lawan = r.pasangan[L.uid], nama = namaUid(lawan);
    bukaKartu(`<div class="match"><div class="hatiBesar">⏰</div><h2>Waktu habis!</h2><p>Bagaimana kesanmu dengan <b>${esc(nama)}</b>? Pilihanmu rahasia. Kalau kalian saling ❤, langsung match!</p>
      <div class="baris"><button class="btn" type="button" id="vY">❤ Suka</button><button class="btn putih" type="button" id="vN">✕ Lewati</button></div></div>`, {
      pasang(i) {
        i.querySelector('#vN').onclick = () => { tutupKartu(); toast('Oke! Tunggu ronde berikutnya ya.'); };
        i.querySelector('#vY').onclick = async () => {
          try {
            const cocok = await L.suka(lawan, K.prof.n, nama);
            const set = new Set(LS.get('sukaKu', [])); set.add(lawan); LS.set('sukaKu', [...set]);
            tutupKartu(); if (!cocok) toast(`❤ Terkirim diam-diam. Semoga ${nama} juga memilihmu!`, 3600);
          } catch (e) { toast('Gagal. Coba lagi.'); }
        };
      },
    });
  }
  // Direktur: ronde otomatis
  if (otomatis && K.peran[L.uid] === 'direktur' && sd.buka) {
    const habis = !r || L.db.now() > r.mulai + (r.durasi || DURASI) * 1000 + 25000;
    if (habis && Object.keys(antre).length >= 2 && Date.now() - otoT > 10000) { otoT = Date.now(); mulaiRonde(); }
  }
}

// ---------------------------------------------------------------- DIREKTUR
let otomatis = LS.get('sdOtomatis', false), otoT = 0;
const riwayatPasangan = new Set();
export async function mulaiRonde() {
  const L = L_();
  // hanya peserta yang sedang online
  const l = Object.keys(antre).filter(u => K.lain.has(u));
  if (l.length < 2) { toast('Minimal 2 peserta online di antrean.'); return; }
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  // utamakan pasangan cowok–cewek & yang belum pernah dipasangkan
  const g = u => (antre[u] && antre[u].g) || '';
  const pasangan = {}, sisaL = [...l];
  while (sisaL.length >= 2) {
    const a = sisaL.shift();
    let bi = sisaL.findIndex(b => !riwayatPasangan.has(ruang(a, b)) && g(a) && g(b) && g(a) !== g(b));
    if (bi < 0) bi = sisaL.findIndex(b => !riwayatPasangan.has(ruang(a, b)));
    if (bi < 0) bi = 0;
    const b = sisaL.splice(bi, 1)[0];
    pasangan[a] = b; pasangan[b] = a; riwayatPasangan.add(ruang(a, b));
  }
  const no = ((sd.ronde && sd.ronde.no) || 0) + 1;
  try { await L.db.set('speedDating/ronde', { no, mulai: TS, durasi: DURASI, pasangan }); toast(`💘 Ronde ${no} dimulai: ${Object.keys(pasangan).length / 2} pasangan`); }
  catch (e) { toast('Gagal memulai ronde.'); }
}
export function htmlKendali() {
  const n = Object.keys(antre).length, on = Object.keys(antre).filter(u => K.lain.has(u)).length;
  return `<h3>💘 Speed Dating</h3>
    <p class="kecil">${sd.buka ? '🟢 Dibuka' : '🔴 Ditutup'} · antrean ${fmt(n)} (${fmt(on)} online)${sd.ronde ? ` · ronde ${fmt(sd.ronde.no)}${sisa() ? ` (sisa ${sisa()} dtk)` : ' selesai'}` : ''}</p>
    <div class="baris"><button class="btn ${sd.buka ? 'putih' : ''}" type="button" id="sdBuka">${sd.buka ? 'Tutup' : 'Buka'} Speed Dating</button>
    ${sd.buka ? `<button class="btn" type="button" id="sdMulai">▶ Mulai ronde (3 mnt)</button><label class="cek" style="margin:0"><input type="checkbox" id="sdOto" ${otomatis ? 'checked' : ''}> Ronde otomatis</label>` : ''}</div>`;
}
export function pasangKendali(el) {
  const L = L_();
  const b = el.querySelector('#sdBuka');
  if (b) b.onclick = async () => {
    try {
      if (sd.buka) await L.db.set('speedDating', { buka: false });
      else { await L.db.set('speedDating', { buka: true }); await L.umumkan('💘 Speed Dating dibuka di Kafe Jodoh! Tamu Cari Jodoh: buka menu ⭐ → Harian → Speed Dating.'); }
    } catch (e) { toast('Gagal.'); }
  };
  const m = el.querySelector('#sdMulai'); if (m) m.onclick = mulaiRonde;
  const o = el.querySelector('#sdOto'); if (o) o.onchange = () => { otomatis = o.checked; LS.set('sdOtomatis', otomatis); toast(otomatis ? 'Ronde berjalan otomatis selama panel ini/kantor terbuka' : 'Ronde otomatis dimatikan'); };
}
