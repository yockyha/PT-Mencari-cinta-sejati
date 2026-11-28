// =====================================================================
//  Fitur seru: streak harian, kecocokan (zodiak/MBTI/love language),
//  mood di atas kepala, emote karakter, Amplop Cinta (gacha), Menfess.
// =====================================================================
import { LS, bersih, esc, fmt, kasar, sensor, hariIni } from '../js/common.js?v=202611280725';
import { TS, kunciBaru } from '../js/db.js?v=202611280725';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog, tanggalJam } from './ui.js?v=202611280725';
import * as Prog from './progres.js?v=202611280725';

const acak = a => a[Math.floor(Math.random() * a.length)];
const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk ikut.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };

// ---------------------------------------------------------------- DATA KEPRIBADIAN
export const ZODIAK = ['♈ Aries', '♉ Taurus', '♊ Gemini', '♋ Cancer', '♌ Leo', '♍ Virgo', '♎ Libra', '♏ Scorpio', '♐ Sagitarius', '♑ Capricorn', '♒ Aquarius', '♓ Pisces'];
export const MBTI = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
export const LOVE = ['💬 Kata-kata manis', '⏰ Waktu berkualitas', '🎁 Hadiah', '🤝 Bantuan nyata', '🤗 Sentuhan fisik'];
export const MOOD = ['', '🎧 Lagi galau', '☕ Butuh teman ngopi', '🔍 Open to chat', '📚 Lagi sibuk', '😴 Ngantuk', '🥳 Lagi happy', '💘 Lagi kasmaran', '🎮 Cari mabar', '🍜 Lagi laper'];
const ELEMEN = z => [0, 1, 2, 3][z % 4]; // 0 api, 1 tanah, 2 udara, 3 air
const NAMA_EL = ['api 🔥', 'tanah 🌱', 'udara 🌬️', 'air 🌊'];

// Kecocokan dua orang (o: {zd (zodiak), mb, ll, tj}) → { skor, alasan[] } atau null kalau datanya kurang
export function kecocokan(a, b) {
  const nilai = [], alasan = [];
  const z1 = Number.isInteger(a.zd) ? a.zd : -1, z2 = Number.isInteger(b.zd) ? b.zd : -1;
  if (z1 >= 0 && z2 >= 0) {
    const e1 = ELEMEN(z1), e2 = ELEMEN(z2);
    let s = 62;
    if (z1 === z2) { s = 82; alasan.push(`Sama-sama ${ZODIAK[z1].split(' ')[1]}: saling ngerti tanpa banyak kata`); }
    else if (e1 === e2) { s = 92; alasan.push(`Elemen ${NAMA_EL[e1]} yang sama, nyambung banget`); }
    else if ((e1 === 0 && e2 === 2) || (e1 === 2 && e2 === 0)) { s = 86; alasan.push('Api & udara: saling menyalakan semangat'); }
    else if ((e1 === 1 && e2 === 3) || (e1 === 3 && e2 === 1)) { s = 86; alasan.push('Tanah & air: saling menumbuhkan'); }
    else alasan.push('Zodiak beda karakter: bisa saling melengkapi');
    nilai.push(s);
  }
  const m1 = MBTI.includes(a.mb) ? a.mb : '', m2 = MBTI.includes(b.mb) ? b.mb : '';
  if (m1 && m2) {
    let s = 55;
    if (m1[1] === m2[1]) { s += 14; alasan.push(m1[1] === 'N' ? 'Sama-sama suka ngobrol hal random & mimpi besar' : 'Sama-sama realistis & suka hal nyata'); }
    if (m1[2] === m2[2]) { s += 8; alasan.push(m1[2] === 'F' ? 'Dua-duanya pakai hati 🥺' : 'Dua-duanya logis, debatnya seru'); }
    if (m1[0] !== m2[0]) { s += 10; alasan.push('Introvert + ekstrovert: yang satu ngajak, yang satu nemenin'); } else if (m1[0] === 'I') alasan.push('Sama-sama introvert: overthinking bareng 😆');
    if (m1[3] !== m2[3]) { s += 8; alasan.push('Satu suka rencana, satu spontan: hidup jadi seimbang'); }
    if (m1 === m2) alasan.push(`Sama-sama ${m1}, kayak ngaca`);
    nilai.push(Math.min(98, s));
  }
  if (Number.isInteger(a.ll) && Number.isInteger(b.ll) && a.ll >= 0 && b.ll >= 0) {
    nilai.push(a.ll === b.ll ? 95 : 70);
    alasan.push(a.ll === b.ll ? `Love language sama: ${LOVE[a.ll]}` : 'Love language beda: perlu saling belajar 💡');
  }
  if (!nilai.length) return null;
  let skor = Math.round(nilai.reduce((x, y) => x + y, 0) / nilai.length);
  if (a.tj && a.tj === b.tj) skor = Math.min(99, skor + 3);
  return { skor, alasan: alasan.slice(0, 3) };
}
export const dataSaya = () => ({ zd: K.prof?.zd, mb: K.prof?.mb, ll: K.prof?.ll, tj: K.prof?.tj });
export function htmlKecocokan(o) {
  if (!K.prof || o.uid === K.L?.uid) return '';
  const k = kecocokan(dataSaya(), o);
  if (!k) {
    const lengkap = Number.isInteger(K.prof.zd) || K.prof.mb;
    return `<p class="kecil">✨ ${lengkap ? 'Dia belum mengisi zodiak/MBTI.' : '<button type="button" class="tautan" data-isikep>Isi zodiak & MBTI-mu</button> untuk melihat kecocokan.'}</p>`;
  }
  return `<div class="cocok"><b>Kecocokan ${k.skor}% ${k.skor >= 85 ? '💞' : k.skor >= 70 ? '💗' : '🤝'}</b><div class="bilah"><i style="width:${k.skor}%"></i></div><ul>${k.alasan.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
}
export function htmlKepribadian(o) {
  const l = [Number.isInteger(o.zd) && o.zd >= 0 ? ZODIAK[o.zd] : '', MBTI.includes(o.mb) ? '🧠 ' + o.mb : '', Number.isInteger(o.ll) && o.ll >= 0 ? LOVE[o.ll] : '', o.lg ? '🎵 ' + esc(bersih(o.lg, 40)) : ''].filter(Boolean);
  return l.length ? `<p class="kecil kepribadian">${l.map(x => `<span>${x}</span>`).join('')}</p>` : '';
}

// ---------------------------------------------------------------- STREAK HARIAN
// streak/<uid> = { n, t } dijaga aturan Firebase: lanjut bila 12–54 jam sejak check-in terakhir, selain itu mulai dari 1
let streak = { n: 0, t: 0 };
export const streakSaya = () => streak.n || 0;
export function mulai() {
  const L = K.L;
  L.db.on('streak/' + L.uid, v => { streak = v || { n: 0, t: 0 }; K.segarkanOrang && K.segarkanOrang(); });
  L.db.on('menfessKu/' + L.uid, o => {
    const lama = LS.get('menfessLihat', 0) || 0;
    const baru = Object.values(o || {}).filter(v => v && v.t > lama);
    if (baru.length) { toast(`💌 Kamu dapat ${baru.length} menfess baru! Cek di Kotak Menfess.`, 4500); tulisLog('', '💌 Ada menfess baru untukmu', 'sys'); }
    menfessUntukku = o || {};
  });
  L.db.on('menfess', o => { menfess = Object.entries(o || {}).filter(([, v]) => v && v.m).map(([k, v]) => ({ ...v, k })).sort((a, b) => b.t - a.t); if (layar === 'menfess') gambarMenfess(); }, { limit: 40 });
}
export async function cekStreak() {
  if (!K.resmi() || K.peran[K.L.uid] === 'direktur') return;
  const L = K.L, kini = L.db.now();
  const v = (await L.db.get('streak/' + L.uid).catch(() => null)) || null;
  if (v && hariDari(v.t) === hariDari(kini)) return; // sudah check-in hari ini
  if (v && kini - v.t < 12 * 3600e3) return;          // terlalu dekat (aturan server)
  const lanjut = v && kini - v.t < 54 * 3600e3;
  const n = lanjut ? (v.n || 0) + 1 : 1;
  const upd = { [`streak/${L.uid}`]: { n, t: TS } };
  let dm = 0;
  if (n % 7 === 0) { const saldo = (await L.db.get('diamond/' + L.uid).catch(() => 0)) || 0; dm = 20; upd[`diamond/${L.uid}`] = saldo + dm; }
  try { await L.db.update('', upd); } catch (e) { console.warn('streak', e); return; }
  const exp = 10 + Math.min(n, 7) * 5;
  Prog.hadiah(exp, `🔥 Check-in hari ke-${n}`);
  K.efekLokal && K.efekLokal(n % 7 === 0 ? 'kembangapi' : 'hati', n % 7 === 0 ? 60 : 24);
  setTimeout(() => {
    if (!$('kartu').hidden) { toast(`🔥 Streak ${n} hari! +${exp} EXP${dm ? ` & +${dm} 💠` : ''}`, 4000); return; }
    bukaKartu(`<div class="match"><div class="hatiBesar">🔥</div><h2>Streak ${n} hari!</h2>
      <p>Hadiah check-in hari ini: <b>+${exp} EXP</b>${dm ? ` dan <b>+${dm} 💠 Diamond</b>` : ''}.</p>
      <div class="streakBaris">${[1, 2, 3, 4, 5, 6, 7].map(i => { const h = ((n - 1) % 7) + 1; return `<span class="${i <= h ? 'on' : ''}">${i === 7 ? '💠' : '🔥'}<small>H${i}</small></span>`; }).join('')}</div>
      <p class="kecil">Datang tiap hari biar apinya nggak padam. Tiap kelipatan 7 hari dapat 20 Diamond!</p>
      <div class="baris"><button class="btn" type="button" id="sOk">Mantap!</button></div></div>`, { pasang(i) { i.querySelector('#sOk').onclick = tutupKartu; } });
  }, 1800);
}
const hariDari = t => { const d = new Date(t + 7 * 3600e3); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };

// ---------------------------------------------------------------- MOOD & EMOTE
export const EMOTE = [[5, '👋', 'Dadah'], [7, '💃', 'Joget'], [8, '🙈', 'Malu'], [9, '👏', 'Tepuk tangan'], [10, '🫶', 'Love']];
export function pasangEmote() {
  const b = $('btnEmote'), m = $('menuEmote');
  m.innerHTML = EMOTE.map(([a, i, n]) => `<button type="button" data-a="${a}" title="${n}">${i}</button>`).join('') + `<button type="button" data-mood title="Ganti mood">😶‍🌫️</button>`;
  b.onclick = () => { m.hidden = !m.hidden; };
  m.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { if (!K.resmi()) { toast('Daftar dulu untuk pakai emote.'); return; } K.emote(+x.dataset.a, 3.2); m.hidden = true; });
  m.querySelector('[data-mood]').onclick = () => { m.hidden = true; bukaMood(); };
}
export function bukaMood() {
  if (!siap()) return;
  const kini = K.prof.md | 0;
  bukaKartu(`<h2>😶‍🌫️ Mood kamu</h2><p class="kecil">Muncul di samping namamu di atas kepala, biar orang tahu mau diajak ngapain.</p>
    <div class="sw teks">${MOOD.map((m, i) => `<button type="button" data-m="${i}" class="${i === kini ? 'on' : ''}">${m || 'Tanpa mood'}</button>`).join('')}</div>`, {
    pasang(i) { i.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { K.prof.md = +b.dataset.m; K.simpanProfil(); K.segarkanOrang(); tutupKartu(); toast(+b.dataset.m ? `Mood: ${MOOD[+b.dataset.m]}` : 'Mood dihapus'); }); },
  });
}

// ---------------------------------------------------------------- AMPLOP CINTA (gacha)
export const HARGA_AMPLOP = 30;
const BARANG_GACHA = ['gcHoodieNeon', 'gcBandoHati', 'gcKacamataBintang', 'gcSayapKupu'];
let amplop = null;
export async function bukaAmplop() {
  if (!siap()) return;
  const L = K.L;
  amplop = (await L.db.get('amplop/' + L.uid).catch(() => null)) || {};
  const kini = L.db.now(), gratis = !amplop.tg || kini - amplop.tg >= 20 * 3600e3;
  const milik = BARANG_GACHA.filter(id => Prog.punyaBarang(id));
  bukaKartu(`<h2>🎁 Amplop Cinta</h2>
    <p>Buka amplop, isinya acak: <b>EXP</b> atau <b>barang edisi Amplop</b> yang tidak dijual di mana pun (Hoodie Neon, Bando Hati, Kacamata Bintang, Sayap Kupu-kupu).</p>
    <div class="amplop" id="aB">💌</div>
    <p class="kecil">Koleksi edisi Amplop: ${fmt(milik.length)}/${BARANG_GACHA.length} · Saldo 💠 ${fmt(Prog.saldoDiamond())}</p>
    <div class="baris">${gratis ? '<button class="btn" type="button" id="aG">Buka gratis hari ini</button>' : `<button class="btn" type="button" id="aD">Buka · 💠 ${HARGA_AMPLOP}</button>`}</div>
    ${gratis ? '' : `<p class="kecil">Amplop gratis berikutnya ${esc(tanggalJam(amplop.tg + 20 * 3600e3))} WIB.</p>`}`, {
    pasang(i) {
      const g = i.querySelector('#aG'), d = i.querySelector('#aD');
      if (g) g.onclick = () => buka(true, i);
      if (d) d.onclick = () => buka(false, i);
    },
  });
}
async function buka(gratis, isi) {
  const L = K.L;
  if (!gratis && Prog.saldoDiamond() < HARGA_AMPLOP) { toast('Diamond kamu kurang. Top up di Toko ya.'); Prog.bukaHub('toko'); return; }
  isi.querySelectorAll('button').forEach(b => { b.disabled = true; });
  // hadiah acak (kosmetik & EXP)
  const r = Math.random(), belum = BARANG_GACHA.filter(id => !Prog.punyaBarang(id));
  let h = r < 0.18 && belum.length ? { item: acak(belum) } : r < 0.5 ? { exp: 50 } : { exp: 20 };
  const upd = { [`amplop/${L.uid}`]: { t: TS, tg: gratis ? TS : amplop.tg || 0, n: (amplop.n || 0) + 1 } };
  if (!gratis) { const saldo = (await L.db.get('diamond/' + L.uid).catch(() => 0)) || 0; upd[`diamond/${L.uid}`] = saldo - HARGA_AMPLOP; }
  if (h.item) upd[`milik/${L.uid}/${h.item}`] = true;
  const el = isi.querySelector('#aB'); el.classList.add('goyang');
  try { await L.db.update('', upd); } catch (e) { console.warn(e); toast('Amplop gagal dibuka. Coba lagi.'); el.classList.remove('goyang'); isi.querySelectorAll('button').forEach(b => { b.disabled = false; }); return; }
  if (h.exp) Prog.hadiah(h.exp, '🎁 Amplop Cinta');
  setTimeout(() => {
    el.classList.remove('goyang'); el.classList.add('terbuka');
    K.efekLokal && K.efekLokal(h.item ? 'kembangapi' : 'hati', h.item ? 60 : 20);
    const B = h.item && K.BARANG ? K.BARANG[h.item] : null;
    el.innerHTML = h.item ? `🎉<small>${esc(B ? B.nama : h.item)}</small>` : `⭐<small>+${h.exp} EXP</small>`;
    isi.querySelector('.baris').innerHTML = `${h.item ? '<button class="btn" type="button" id="aL">Pakai di Ruang Loker</button>' : ''}<button class="btn ${h.item ? 'putih' : ''}" type="button" id="aU">Buka lagi</button>`;
    const al = isi.querySelector('#aL'); if (al) al.onclick = () => { tutupKartu(); Prog.pergiKe('loker'); };
    isi.querySelector('#aU').onclick = bukaAmplop;
    if (h.item) tulisLog('', `🎉 Dapat ${B ? B.nama : h.item} dari Amplop Cinta!`, 'sys');
  }, 1100);
}

// ---------------------------------------------------------------- MENFESS
let menfess = [], menfessUntukku = {}, layar = '';
export function bukaMenfess(tab = 'semua') {
  layar = 'menfess';
  LS.set('menfessLihat', K.L.db.now());
  bukaKartu(`<h2>📮 Kotak Menfess</h2>
    <p class="kecil">Kirim pesan <b>anonim</b> ke semua orang atau ke tamu tertentu. Namamu tidak ditampilkan, kecuali kamu memilih mengungkapnya. Tetap sopan: Direktur bisa melihat pengirim menfess yang dilaporkan.</p>
    <div class="baris" style="margin-top:4px"><button class="btn" type="button" id="mfT">✍️ Tulis menfess</button></div>
    <div class="sw teks tab" style="margin-top:10px"><button type="button" data-t="semua" class="${tab === 'semua' ? 'on' : ''}">Semua</button><button type="button" data-t="aku" class="${tab === 'aku' ? 'on' : ''}">Untukku (${fmt(Object.keys(menfessUntukku).length)})</button></div>
    <div id="mfL" data-tab="${tab}"></div>`, {
    tutup() { if (layar === 'menfess') layar = ''; },
    pasang(i) { i.querySelector('#mfT').onclick = bukaTulis; i.querySelectorAll('[data-t]').forEach(b => b.onclick = () => bukaMenfess(b.dataset.t)); gambarMenfess(); },
  });
}
const milikku = () => new Set(LS.get('menfessKu', []) || []);
function gambarMenfess() {
  const el = document.querySelector('#kartu #mfL'); if (!el) return;
  const L = K.L, mod = !!K.peran[L.uid], tab = el.dataset.tab, punya = milikku();
  const l = menfess.filter(m => tab !== 'aku' || m.ke === L.uid);
  el.innerHTML = l.length ? l.map(m => {
    const s = m.s ? Object.keys(m.s).length : 0, saya = !!(m.s && m.s[L.uid]);
    return `<div class="curhat menfess" data-k="${esc(m.k)}"><p><small>${m.ke ? `💌 untuk <b>${esc(bersih(m.keN, 30))}</b>` : '📢 untuk semua'} · ${m.n ? `dari <b>${esc(bersih(m.n, 30))}</b>` : 'dari 🤫 seseorang'}</small><br>“${esc(m.m)}”</p><small>${esc(tanggalJam(m.t))}</small>
      <div class="baris kecil"><button type="button" class="mini ${saya ? '' : 'putih'}" data-a="s">💗 ${fmt(s)}</button>${punya.has(m.k) && !m.n ? '<button type="button" class="mini putih" data-a="u">🙋 Ungkap diriku</button>' : ''}${punya.has(m.k) || mod ? '<button type="button" class="mini merah" data-a="h">Hapus</button>' : '<button type="button" class="mini putih" data-a="l">🚩</button>'}</div></div>`;
  }).join('') : `<p class="kecil">${tab === 'aku' ? 'Belum ada menfess untukmu.' : 'Belum ada menfess. Tulis yang pertama!'}</p>`;
  el.querySelectorAll('.menfess').forEach(d => {
    const m = l.find(x => x.k === d.dataset.k);
    d.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      const a = b.dataset.a;
      try {
        if (a === 's') { if (!siap()) return; await L.db.set(`menfess/${m.k}/s/${L.uid}`, m.s && m.s[L.uid] ? null : true); }
        if (a === 'u') { if (!confirm('Ungkap namamu di menfess ini?')) return; await L.db.set(`menfess/${m.k}/n`, bersih(K.prof.n, 30)); toast('Namamu sekarang terlihat 🙋'); }
        if (a === 'h') { if (!confirm('Hapus menfess ini?')) return; await L.db.update('', { [`menfess/${m.k}`]: null, ...(m.ke ? { [`menfessKu/${m.ke}/${m.k}`]: null } : {}) }); toast('Menfess dihapus.'); }
        if (a === 'l') { if (!siap()) return; L.lapor('menfess:' + m.k, 'Menfess', 'Menfess tidak pantas: “' + bersih(m.m, 60) + '”'); toast('Laporan terkirim ke Direktur 🙏'); }
      } catch (e) { toast('Gagal. Coba lagi.'); }
    });
  });
}
function bukaTulis() {
  if (!siap()) return;
  const L = K.L;
  const peta = new Map((K.tamu || []).map(t => [t.uid, { uid: t.uid, n: t.n }]));
  for (const o of K.lain.values()) if (o.nama) peta.set(o.uid, { uid: o.uid, n: o.nama });
  const calon = [...peta.values()].filter(t => t.uid !== L.uid && !K.sembunyi.has(t.uid)).slice(-300).reverse();
  bukaKartu(`<h2>✍️ Tulis menfess</h2>
    <label for="mfK">Untuk</label><input id="mfK" list="mfDaftar" placeholder="kosongkan = untuk semua · ketik nama tamu">
    <datalist id="mfDaftar">${calon.map(t => `<option value="${esc(t.n)}">`).join('')}</datalist>
    <label for="mfM">Pesan</label><textarea id="mfM" maxlength="280" rows="3" placeholder="contoh: buat yang pakai hoodie pink di Meja Gaming, senyummu bikin semangat 😳"></textarea>
    <p class="err" id="mfE"></p><div class="baris"><button class="btn" type="button" id="mfK2">Kirim anonim</button><button class="btn putih" type="button" id="mfB">Batal</button></div>
    <p class="kecil">Batas: 1 menfess tiap 10 menit. Tanpa kata kasar, tanpa data pribadi orang lain.</p>`, {
    pasang(i) {
      i.querySelector('#mfB').onclick = () => bukaMenfess();
      i.querySelector('#mfK2').onclick = async () => {
        const E = i.querySelector('#mfE'), m = bersih(i.querySelector('#mfM').value, 280), kN = bersih(i.querySelector('#mfK').value, 30);
        if (m.length < 5) { E.textContent = 'Tulis sedikit lebih panjang ya.'; return; }
        if (kasar(m)) { E.textContent = 'Pakai kata-kata yang lebih sopan ya.'; return; }
        let ke = '';
        if (kN) { const t = calon.find(x => x.n.toLowerCase() === kN.toLowerCase()); if (!t) { E.textContent = 'Nama tamu tidak ditemukan. Pilih dari daftar.'; return; } ke = t.uid; }
        const id = kunciBaru();
        try {
          await L.db.update('', {
            [`menfess/${id}`]: { m: sensor(m), ke, keN: ke ? kN : '', t: TS },
            [`menfessPengirim/${id}`]: L.uid,
            [`menfessT/${L.uid}`]: TS,
            ...(ke ? { [`menfessKu/${ke}/${id}`]: { t: TS } } : {}),
          });
          LS.set('menfessKu', [...milikku(), id].slice(-50));
          toast('Menfess terkirim diam-diam 🤫'); Prog.lapor('menfess');
          bukaMenfess();
        } catch (e) { console.warn(e); E.textContent = 'Gagal mengirim. Tunggu 10 menit sejak menfess terakhir.'; }
      };
    },
  });
}
