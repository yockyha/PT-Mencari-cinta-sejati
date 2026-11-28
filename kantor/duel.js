// =====================================================================
//  MAIN BARENG (realtime): duel 1 lawan 1 & kuis kelompok.
//   ⚔️ Duel (tantang siapa saja: dari profil, obrolan pribadi, meja, Game Center)
//      ❌⭕ XOX Cinta (3×3) · 🔴 Empat Hati (Connect Four 7×6) · ✊ Suit (best of 3)
//   ⚡ Kuis Kilat: semua yang di meja/kafe/grup berebut menjawab paling cepat, 5 ronde
//  Pemenang dapat EXP sedikit (duel +5, kuis kilat +8; maks. 10 kemenangan berhadiah per hari).
//  Data: duel/<id>, duelUndang/<uid>/<id>, kilat/<room>, kilatIkut/<room>/<uid>, kilatJawab/<room>/<ronde>/<uid>
// =====================================================================
import { LS, bersih, esc, fmt, hariIni } from '../js/common.js?v=202611280725';
import { TS, kunciBaru } from '../js/db.js?v=202611280725';
import { K, toast, bukaKartu, tutupKartu, tulisLog } from './ui.js?v=202611280725';
import * as Prog from './progres.js?v=202611280725';
import * as Musik from './musik.js?v=202611280725';
import { SOAL } from './aktivitas.js?v=202611280725';

const acak = a => a[Math.floor(Math.random() * a.length)];
const kocok = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk main bareng.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const saya = () => K.L.uid, namaSaya = () => bersih((K.prof && K.prof.n) || 'Tamu', 30);
const kini = () => (K.L.db.now ? K.L.db.now() : Date.now());
function hadiahMenang(kunci, n, label) {
  if (LS.get(kunci, 0)) return 0; LS.set(kunci, 1);
  const k = 'menangHadiah_' + hariIni(), kali = (LS.get(k, 0) || 0) + 1; LS.set(k, kali);
  if (kali > 10) return 0;
  Prog.hadiah(n, label); return n;
}

export const GAME = {
  xox: { nama: '❌⭕ XOX Cinta', ket: 'Tiga sejajar menang', awal: () => '-'.repeat(9) },
  empat: { nama: '🔴 Empat Hati', ket: 'Empat sejajar menang (Connect Four)', awal: () => '-'.repeat(42) },
  suit: { nama: '✊ Suit', ket: 'Batu, gunting, kertas · best of 3', awal: () => '' },
};

// ---------------------------------------------------------------- TANTANG
export function pilihGame(lawan, namaLawan) {
  if (!siap()) return;
  if (!lawan || lawan === saya()) return;
  if (lawan.startsWith('bot:')) { toast('Tamu NPC belum bisa diajak duel 😅'); return; }
  bukaKartu(`<h2>⚔️ Tantang ${esc(bersih(namaLawan, 30))}</h2><p class="kecil">Pilih game. Lawan dapat undangan & harus menerima dulu. Pemenang dapat +5 EXP.</p>
    <div class="kuasaGrid gameGrid">${Object.entries(GAME).map(([k, g]) => `<button type="button" data-j="${k}"><span class="gIkon">${g.nama.split(' ')[0]}</span>${esc(g.nama.split(' ').slice(1).join(' '))}<small>${esc(g.ket)}</small></button>`).join('')}</div>`, {
    pasang(el) { el.querySelectorAll('[data-j]').forEach(b => b.onclick = () => tantang(lawan, namaLawan, b.dataset.j)); },
  });
}
export async function tantang(lawan, namaLawan, j) {
  if (!siap()) return;
  const id = 'd' + kunciBaru(), me = saya();
  try {
    await K.L.db.set('duel/' + id, { j, host: me, lawan, ln: bersih(namaLawan, 30), p: { [me]: namaSaya() }, st: 'undang', b: GAME[j].awal(), g: me, t: TS });
    await K.L.db.set(`duelUndang/${lawan}/${id}`, { n: namaSaya(), j, dari: me, t: TS });
    toast(`⚔️ Tantangan ${GAME[j].nama} terkirim ke ${bersih(namaLawan, 20)}. Tunggu dia menerima…`, 3500);
    bukaDuel(id);
  } catch (e) { console.warn(e); toast('Gagal mengirim tantangan.'); }
}

// ---------------------------------------------------------------- UNDANGAN MASUK
let undangan = {}, awalUnd = true;
export function mulai() {
  const L = K.L;
  L.db.on('duelUndang/' + L.uid, o => {
    const lama = undangan; undangan = o || {};
    if (!awalUnd) for (const [id, v] of Object.entries(undangan)) if (v && !lama[id] && kini() - (v.t || 0) < 300000) {
      Musik.sfx('notif'); tulisLog('', `⚔️ ${bersih(v.n, 20)} menantangmu main ${GAME[v.j]?.nama || 'game'}!`, 'sys');
      if (document.getElementById('kartu').hidden) kartuUndangan(id, v); else toast(`⚔️ ${bersih(v.n, 20)} menantangmu main ${GAME[v.j]?.nama || ''}! Buka 🎮 Game Center → Main Bareng`, 5000);
    }
    awalUnd = false;
  });
}
function kartuUndangan(id, v) {
  bukaKartu(`<div class="match"><div class="hatiBesar">⚔️</div><h2>Ditantang!</h2><p><b>${esc(bersih(v.n, 30))}</b> menantangmu main <b>${esc(GAME[v.j]?.nama || '')}</b>.</p>
    <div class="baris"><button class="btn" type="button" id="duT">✅ Terima</button><button class="btn putih" type="button" id="duN">Tolak</button></div></div>`, {
    pasang(el) { el.querySelector('#duT').onclick = () => terima(id); el.querySelector('#duN').onclick = () => tolak(id); },
  });
}
async function terima(id) {
  if (!siap()) return;
  try {
    await K.L.db.update('duel/' + id, { [`p/${saya()}`]: namaSaya(), st: 'main' });
    await K.L.db.set(`duelUndang/${saya()}/${id}`, null);
    bukaDuel(id);
  } catch (e) { toast('Tantangan sudah kedaluwarsa.'); K.L.db.set(`duelUndang/${saya()}/${id}`, null).catch(() => {}); tutupKartu(); }
}
async function tolak(id) {
  await K.L.db.update('duel/' + id, { st: 'tolak' }).catch(() => {});
  await K.L.db.set(`duelUndang/${saya()}/${id}`, null).catch(() => {});
  tutupKartu(); toast('Tantangan ditolak.');
}

// ---------------------------------------------------------------- PAPAN DUEL
const GARIS3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function menangXox(b) { for (const [a, c, d] of GARIS3) if (b[a] !== '-' && b[a] === b[c] && b[a] === b[d]) return [a, c, d]; return null; }
function menangEmpat(b) {
  const at = (r, c) => (r >= 0 && r < 6 && c >= 0 && c < 7 ? b[r * 7 + c] : '-');
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) { const v = at(r, c); if (v === '-') continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) { const sel = [0, 1, 2, 3].map(k => [r + dr * k, c + dc * k]); if (sel.every(([rr, cc]) => at(rr, cc) === v)) return sel.map(([rr, cc]) => rr * 7 + cc); } }
  return null;
}
const SUIT = { b: '✊', g: '✌️', k: '✋' }, NAMA_SUIT = { b: 'Batu', g: 'Gunting', k: 'Kertas' };
const kalah = { b: 'g', g: 'k', k: 'b' }; // b mengalahkan g, dst.
function skorSuit(d) {
  const [a, c] = Object.keys(d.p || {}), s = { [a]: 0, [c]: 0 }, riwayat = [];
  for (const r of Object.keys(d.r || {}).sort((x, y) => +x - +y)) { const v = d.r[r]; if (!v || !v[a] || !v[c]) continue; const w = v[a] === v[c] ? null : kalah[v[a]] === v[c] ? a : c; if (w) s[w]++; riwayat.push({ r, [a]: v[a], [c]: v[c], w }); }
  return { s, riwayat, ronde: riwayat.length + 1 };
}

let lepasDuel = null;
export function bukaDuel(id) {
  const L = K.L, me = saya();
  let d = null, sudahSelesai = false;
  lepasDuel && lepasDuel();
  bukaKartu(`<div class="duelKepala"><h2 id="dvJ">⚔️ Duel</h2><p class="kecil" id="dvS">Memuat…</p></div><div id="dvP" class="duelPapan"></div><div id="dvB"></div>`, {
    tutup() { lepasDuel && lepasDuel(); lepasDuel = null; Musik.paksakan(null); },
    pasang(el) {
      Musik.paksakan('santai');
      lepasDuel = L.db.on('duel/' + id, v => {
        d = v;
        if (!d) { el.querySelector('#dvS').textContent = 'Duel ini sudah tidak ada.'; el.querySelector('#dvP').innerHTML = ''; return; }
        const p = Object.keys(d.p || {}), lawan = d.host === me ? d.lawan : d.host, nLawan = (d.p || {})[lawan] || d.ln || 'Lawan';
        el.querySelector('#dvJ').textContent = `${GAME[d.j].nama}`;
        let status = '';
        if (d.st === 'undang') status = `⏳ Menunggu ${bersih(nLawan, 20)} menerima tantangan…`;
        else if (d.st === 'tolak') status = `🙅 ${bersih(nLawan, 20)} menolak tantangan.`;
        else if (d.st === 'selesai') status = d.w === 'seri' ? '🤝 Seri!' : d.w === me ? '🏆 Kamu menang!' : `😢 ${bersih(nLawan, 20)} menang.`;
        else if (d.j !== 'suit') status = d.g === me ? '👉 Giliranmu!' : `⏳ Giliran ${bersih(nLawan, 20)}…`;
        el.querySelector('#dvS').innerHTML = `${esc(namaSaya())} <b>vs</b> ${esc(bersih(nLawan, 20))} · ${esc(status)}`;
        gambarPapan(el, d, me);
        if (d.st === 'selesai' && !sudahSelesai) {
          sudahSelesai = true;
          if (d.w === me) { const n = hadiahMenang('duelMenang_' + id, 5, '⚔️ Menang duel'); Musik.sfx('level'); K.efekLokal && K.efekLokal('kembangapi', 40); if (n) toast(`🏆 Menang! +${n} EXP`); }
          else if (d.w === 'seri') Musik.sfx('selesai'); else Musik.sfx('rusak');
        }
        el.querySelector('#dvB').innerHTML = d.st === 'selesai' || d.st === 'tolak' ? `<div class="baris"><button class="btn" type="button" id="dvU">🔁 Main lagi</button><button class="btn putih" type="button" id="dvL">🎮 Game lain</button></div>`
          : d.st === 'undang' && d.host === me ? '<div class="baris"><button class="btn putih" type="button" id="dvX">Batalkan tantangan</button></div>' : '<p class="kecil">Kamu boleh menutup kartu ini; duel tetap berjalan. Buka lagi dari 🎮 Game Center → Main Bareng.</p>';
        const u = el.querySelector('#dvU'); if (u) u.onclick = () => tantang(lawan, nLawan, d.j);
        const g2 = el.querySelector('#dvL'); if (g2) g2.onclick = () => pilihGame(lawan, nLawan);
        const x = el.querySelector('#dvX'); if (x) x.onclick = async () => { await L.db.set(`duelUndang/${d.lawan}/${id}`, null).catch(() => {}); await L.db.set('duel/' + id, null).catch(() => {}); tutupKartu(); };
      });
    },
  });
  function gambarPapan(el, d, me) {
    const P = el.querySelector('#dvP'), main = d.st === 'main', giliranku = main && d.g === me;
    const simbol = uid => (uid === d.host ? (d.j === 'xox' ? '❌' : '❤️') : (d.j === 'xox' ? '⭕' : '💛'));
    if (d.j === 'xox') {
      const w = menangXox(d.b) || [];
      P.className = 'duelPapan xox';
      P.innerHTML = [...d.b].map((c, i) => `<button type="button" data-i="${i}" class="${w.includes(i) ? 'garisMenang' : ''}" ${!giliranku || c !== '-' ? 'disabled' : ''}>${c === 'H' ? '❌' : c === 'L' ? '⭕' : ''}</button>`).join('');
      P.querySelectorAll('[data-i]').forEach(b => b.onclick = () => langkahXox(d, +b.dataset.i));
    } else if (d.j === 'empat') {
      const w = menangEmpat(d.b) || [];
      P.className = 'duelPapan empat';
      P.innerHTML = `<div class="empatKolom">${[0, 1, 2, 3, 4, 5, 6].map(c => `<button type="button" data-c="${c}" ${!giliranku || d.b[c] !== '-' ? 'disabled' : ''} aria-label="Kolom ${c + 1}">▼</button>`).join('')}</div>
        <div class="empatGrid">${[...d.b].map((c, i) => `<span class="${w.includes(i) ? 'garisMenang' : ''}">${c === 'H' ? '❤️' : c === 'L' ? '💛' : ''}</span>`).join('')}</div>`;
      P.querySelectorAll('[data-c]').forEach(b => b.onclick = () => langkahEmpat(d, +b.dataset.c));
    } else {
      const { s, riwayat, ronde } = skorSuit(d), lawan = d.host === me ? d.lawan : d.host, rKini = (d.r || {})[ronde] || {};
      P.className = 'duelPapan suit';
      P.innerHTML = `<div class="suitSkor"><b>${fmt(s[me] || 0)}</b><span>skor</span><b>${fmt(s[lawan] || 0)}</b></div>
        ${riwayat.length ? `<div class="suitRiwayat">${riwayat.map(x => `<span>R${x.r}: ${SUIT[x[me]]} vs ${SUIT[x[lawan]]} ${x.w === me ? '✅' : x.w ? '❌' : '🤝'}</span>`).join('')}</div>` : ''}
        ${main ? (rKini[me] ? `<p>Kamu pilih <b>${SUIT[rKini[me]]} ${NAMA_SUIT[rKini[me]]}</b>. ${rKini[lawan] ? '' : '⏳ Menunggu lawan memilih…'}</p>`
          : `<p><b>Ronde ${ronde}</b>: pilih senjatamu!</p><div class="suitPilih">${Object.entries(SUIT).map(([k, e]) => `<button type="button" data-s="${k}">${e}<small>${NAMA_SUIT[k]}</small></button>`).join('')}</div>`) : ''}`;
      P.querySelectorAll('[data-s]').forEach(b => b.onclick = () => langkahSuit(d, ronde, b.dataset.s));
      // siapa pun yang melihat skor 2 menutup duel (nilai sama, aman ditulis dua kali)
      if (main && (s[me] >= 2 || s[lawan] >= 2)) K.L.db.update('duel/' + id, { st: 'selesai', w: s[me] >= 2 ? me : lawan }).catch(() => {});
    }
  }
  async function langkahXox(d, i) {
    if (d.st !== 'main' || d.g !== me || d.b[i] !== '-') return;
    const tanda = me === d.host ? 'H' : 'L', b = d.b.slice(0, i) + tanda + d.b.slice(i + 1), lawan = d.host === me ? d.lawan : d.host;
    const w = menangXox(b) ? me : !b.includes('-') ? 'seri' : null;
    Musik.sfx('klik');
    await K.L.db.update('duel/' + id, { b, g: lawan, ...(w ? { st: 'selesai', w } : {}) }).catch(() => toast('Gagal. Coba lagi.'));
  }
  async function langkahEmpat(d, c) {
    if (d.st !== 'main' || d.g !== me) return;
    let r = 5; while (r >= 0 && d.b[r * 7 + c] !== '-') r--; if (r < 0) return;
    const i = r * 7 + c, tanda = me === d.host ? 'H' : 'L', b = d.b.slice(0, i) + tanda + d.b.slice(i + 1), lawan = d.host === me ? d.lawan : d.host;
    const w = menangEmpat(b) ? me : !b.includes('-') ? 'seri' : null;
    Musik.sfx('tangkap', { jeda: 0 });
    await K.L.db.update('duel/' + id, { b, g: lawan, ...(w ? { st: 'selesai', w } : {}) }).catch(() => toast('Gagal. Coba lagi.'));
  }
  async function langkahSuit(d, ronde, s) { if (d.st !== 'main') return; Musik.sfx('klik'); await K.L.db.set(`duel/${id}/r/${ronde}/${me}`, s).catch(() => toast('Gagal. Coba lagi.')); }
}

// ---------------------------------------------------------------- MAIN BARENG (dari Game Center)
export async function bukaMainBareng() {
  if (!siap()) return;
  const online = [...K.lain.values()].filter(o => o.uid && !o.uid.startsWith('bot:') && !K.sembunyi.has(o.uid));
  const und = Object.entries(undangan).filter(([, v]) => v);
  bukaKartu(`<h2>⚔️ Main Bareng</h2><p class="kecil">Tantang tamu yang online main XOX, Empat Hati, atau Suit. Mau main rame-rame? Duduk di meja nongkrong / kafe atau buka grup, lalu mulai <b>⚡ Kuis Kilat</b>.</p>
    ${und.length ? `<h3>📨 Tantangan untukmu</h3><div class="daftar">${und.map(([id, v]) => `<div><span><b>${esc(bersih(v.n, 30))}</b><br><small>${esc(GAME[v.j]?.nama || '')}</small></span><span class="baris kecil" style="margin:0"><button type="button" class="mini" data-tr="${esc(id)}">Terima</button><button type="button" class="mini putih" data-tl="${esc(id)}">Tolak</button></span></div>`).join('')}</div>` : ''}
    <h3>👥 Tamu online</h3>${online.length ? `<div class="daftar">${online.map(o => `<div><span>${esc(bersih(o.nama, 30))}${o.mj ? ` <small>· di meja ${esc(o.mj)}</small>` : ''}</span><button type="button" class="mini" data-td="${esc(o.uid)}" data-n="${esc(o.nama)}">⚔️ Tantang</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada tamu lain yang online. Ajak temanmu masuk kantor!</p>'}
    <div class="baris"><button class="btn putih" type="button" id="mbK">← Game Center</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => terima(b.dataset.tr));
      el.querySelectorAll('[data-tl]').forEach(b => b.onclick = () => tolak(b.dataset.tl).then(bukaMainBareng));
      el.querySelectorAll('[data-td]').forEach(b => b.onclick = () => pilihGame(b.dataset.td, b.dataset.n));
      el.querySelector('#mbK').onclick = () => K.bukaGameCenter && K.bukaGameCenter();
    },
  });
}

// ---------------------------------------------------------------- ⚡ KUIS KILAT (kelompok)
const EKSTRA = [
  ['🎬 Tebak film: 🚢 🧊 💔', ['Titanic', 'Frozen', 'Moana', 'Avatar'], 0], ['🎬 Tebak film: 🦁 👑', ['The Lion King', 'Madagascar', 'Zootopia', 'Tarzan'], 0],
  ['🎬 Tebak film: 👻 🏠 😱 (horor Indonesia)', ['Pengabdi Setan', 'Dilan 1990', 'Laskar Pelangi', 'Habibie & Ainun'], 0], ['🎬 Tebak film: 🏍️ 💌 1990', ['Dilan 1990', 'Ada Apa dengan Cinta?', 'Galih dan Ratna', 'Milea'], 0],
  ['🎬 Tebak film: ✈️ 👨‍🔧 ❤️ 👩 (kisah nyata Indonesia)', ['Habibie & Ainun', 'Sang Pencerah', 'Soekarno', 'Kartini'], 0], ['🎬 Tebak film: 🌈 📚 🏫 Belitung', ['Laskar Pelangi', 'Negeri 5 Menara', 'Sang Pemimpi', 'Denias'], 0],
  ['🍜 Makanan khas Padang yang terkenal?', ['Rendang', 'Gudeg', 'Pempek', 'Rawon'], 0], ['🍜 Pempek berasal dari kota…', ['Palembang', 'Medan', 'Makassar', 'Bandung'], 0],
  ['🍜 Gudeg identik dengan kota…', ['Yogyakarta', 'Surabaya', 'Jakarta', 'Bali'], 0], ['🌏 Ibu kota Jepang?', ['Tokyo', 'Kyoto', 'Osaka', 'Seoul'], 0],
  ['🌏 Pulau Dewata adalah julukan untuk…', ['Bali', 'Lombok', 'Jawa', 'Bangka'], 0], ['🌏 Candi Buddha terbesar di dunia?', ['Borobudur', 'Prambanan', 'Angkor Wat', 'Mendut'], 0],
  ['🧠 5 × 7 + 5 = ?', ['40', '35', '45', '60'], 0], ['🧠 Hewan tercepat di darat?', ['Cheetah', 'Kuda', 'Singa', 'Rusa'], 0],
  ['🧠 Planet terdekat dengan Matahari?', ['Merkurius', 'Venus', 'Mars', 'Bumi'], 0], ['🧠 Jumlah hari dalam tahun kabisat?', ['366', '365', '364', '360'], 0],
  ['💘 Warna yang identik dengan cinta?', ['Merah muda', 'Abu-abu', 'Cokelat', 'Hitam'], 0], ['💘 "Love language" ada berapa menurut Gary Chapman?', ['5', '3', '4', '7'], 0],
  ['🎵 Lagu "Kangen" populer dibawakan oleh…', ['Dewa 19', 'Noah', 'Sheila on 7', 'Padi'], 0], ['🎵 Penyanyi "Sempurna"?', ['Andra and The Backbone', 'Tulus', 'Raisa', 'Rossa'], 0],
];
const SOAL_KILAT = [...SOAL, ...EKSTRA];
export const kamarMeja = id => 'm_' + id, kamarGrup = g => 'g_' + g;
let kilatHost = null; // { room, tm } penjalan ronde (hanya di perangkat host)

export function bukaKilat(room, judul) {
  if (!siap()) return;
  const L = K.L, me = saya();
  let st = null, ikut = {}, jawab = {}, lepas = [];
  L.db.set(`kilatIkut/${room}/${me}`, { n: namaSaya(), t: TS }).catch(() => {});
  bukaKartu(`<h2>⚡ Kuis Kilat <small class="kecil">${esc(judul)}</small></h2><div id="kkI"><p class="kecil">Memuat…</p></div>`, {
    tutup() { lepas.forEach(f => f && f()); lepas = []; Musik.paksakan(null); },
    pasang(el) {
      Musik.paksakan('santai');
      const gambar = () => {
        const I = el.querySelector('#kkI'); if (!I) return;
        const peserta = Object.entries(ikut).filter(([, v]) => v && kini() - (v.t || 0) < 1800000);
        if (!st || st.st === 'selesai' || kini() - (st.t || 0) > 1800000) {
          const skorAkhir = st && st.st === 'selesai' ? Object.entries(st.skor || {}).sort((a, b) => b[1].s - a[1].s) : [];
          I.innerHTML = `${skorAkhir.length ? `<h3>🏆 Hasil terakhir</h3><ol class="peringkat">${skorAkhir.map(([u, v]) => `<li class="${u === me ? 'saya' : ''}"><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : ''}
            <p>5 soal, semua peserta berebut menjawab. <b>Jawaban benar paling cepat</b> dapat poin. Juara dapat +8 EXP!</p>
            <h3>👥 Siap main (${peserta.length})</h3><p>${peserta.map(([, v]) => esc(bersih(v.n, 20))).join(', ') || '-'}</p>
            <div class="baris"><button class="btn" type="button" id="kkM" ${peserta.length < 2 ? 'disabled' : ''}>⚡ Mulai Kuis Kilat</button></div>
            <p class="kecil">${peserta.length < 2 ? 'Butuh minimal 2 orang. Ajak teman di sini buka ⚡ Kuis Kilat juga!' : 'Siapa pun yang memulai jadi pembawa acara.'}</p>`;
          const m = I.querySelector('#kkM'); if (m) m.onclick = () => mulaiKilat(room, peserta.length);
          return;
        }
        const [q, ops] = SOAL_KILAT[st.q] || ['…', []], urut = st.urut || [0, 1, 2, 3];
        const papan = Object.entries(st.skor || {}).sort((a, b) => b[1].s - a[1].s);
        const sudah = jawab[me], sisa = Math.max(0, 12 - (kini() - (st.mulai || 0)) / 1000);
        I.innerHTML = `<div class="memoriInfo"><span>Ronde ${st.ronde}/${st.jml}</span><span id="kkW">${st.st === 'soal' ? `⏱ ${Math.ceil(sisa)} dtk` : '⏸'}</span><span>🎤 ${esc(bersih(st.hn, 14))}</span></div>
          <div class="bilah"><i id="kkB" style="width:${st.st === 'soal' ? sisa / 12 * 100 : 0}%"></i></div>
          <p style="font-size:19px"><b>${esc(q)}</b></p>
          ${st.st === 'jeda' ? `<p class="kilatHasil">${st.pr ? `⚡ <b>${esc(bersih(st.pr, 20))}</b> paling cepat benar!` : '⏰ Tidak ada yang benar.'} Jawaban: <b>${esc(ops[st.k] || '')}</b></p>` : ''}
          <div class="pilihEmpat">${urut.map(j => `<button type="button" class="btn putih ${st.st === 'jeda' && j === st.k ? 'benar' : ''} ${sudah && sudah.j === j ? (st.st === 'jeda' ? (j === st.k ? 'benar' : 'salah') : 'dipilih') : ''}" data-j="${j}" ${st.st !== 'soal' || sudah ? 'disabled' : ''}>${esc(ops[j])}</button>`).join('')}</div>
          ${papan.length ? `<ol class="peringkat kecilP">${papan.map(([u, v]) => `<li class="${u === me ? 'saya' : ''}"><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>` : ''}`;
        I.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { b.disabled = true; Musik.sfx('klik'); L.db.set(`kilatJawab/${room}/${st.ronde}/${me}`, { j: +b.dataset.j, n: namaSaya(), t: TS }).catch(() => {}); });
      };
      let ronLama = null, selesaiLama = false, lepasJ = null;
      lepas.push(L.db.on('kilat/' + room, v => {
        st = v;
        if (st && st.ronde !== ronLama) { ronLama = st.ronde; jawab = {}; lepasJ && lepasJ(); lepasJ = L.db.on(`kilatJawab/${room}/${st.ronde}`, o => { jawab = o || {}; gambar(); }); }
        if (st && st.st === 'selesai' && !selesaiLama && kini() - (st.t || 0) < 120000) {
          selesaiLama = true; const urut = Object.entries(st.skor || {}).sort((a, b) => b[1].s - a[1].s);
          if (urut.length && urut[0][0] === me && urut[0][1].s > 0) { const n = hadiahMenang(`kilat_${room}_${st.mulaiGame}`, 8, '⚡ Juara Kuis Kilat'); Musik.sfx('level'); K.efekLokal && K.efekLokal('kembangapi', 40); toast(`🏆 Kamu juara Kuis Kilat!${n ? ` +${n} EXP` : ''}`, 4000); }
          else Musik.sfx('selesai');
        }
        if (st && st.st !== 'selesai') selesaiLama = false;
        if (st && st.host === me && st.st !== 'selesai') jalankanHost(room);
        gambar();
      }));
      lepas.push(() => lepasJ && lepasJ());
      lepas.push(L.db.on('kilatIkut/' + room, v => { ikut = v || {}; gambar(); }));
      // hitung mundur: hanya angka & bilah yang diperbarui (tombol jawaban tidak digambar ulang supaya ketukan tidak meleset)
      const tik = setInterval(() => {
        if (!st || st.st !== 'soal') return;
        const sisa = Math.max(0, 12 - (kini() - (st.mulai || 0)) / 1000), w = el.querySelector('#kkW'), b = el.querySelector('#kkB');
        if (w) w.textContent = `⏱ ${Math.ceil(sisa)} dtk`; if (b) b.style.width = (sisa / 12 * 100) + '%';
      }, 250); lepas.push(() => clearInterval(tik));
    },
  });
}
async function mulaiKilat(room) {
  const L = K.L, me = saya(), qs = kocok([...SOAL_KILAT.keys()]).slice(0, 5);
  try {
    await L.db.set(`kilatJawab/${room}`, null).catch(() => {});
    await L.db.set('kilat/' + room, { host: me, hn: namaSaya(), st: 'soal', ronde: 1, jml: 5, qs, q: qs[0], k: SOAL_KILAT[qs[0]][2], urut: kocok([0, 1, 2, 3]), mulai: TS, mulaiGame: Date.now(), skor: {}, t: TS });
    Musik.sfx('notif');
  } catch (e) { console.warn(e); toast('Kuis Kilat sedang dipandu orang lain. Tunggu sampai selesai ya.'); }
}
// penjalan ronde: hanya di perangkat host; menilai jawaban tercepat & lanjut ronde
function jalankanHost(room) {
  if (kilatHost && kilatHost.room === room) return;
  if (kilatHost) clearInterval(kilatHost.tm);
  const L = K.L;
  let sibuk = false;
  const tm = setInterval(async () => {
    if (sibuk) return; sibuk = true;
    try {
      const st = await L.db.get('kilat/' + room);
      if (!st || st.host !== saya() || st.st === 'selesai') { clearInterval(tm); kilatHost = null; return; }
      const umur = (kini() - (st.mulai || 0)) / 1000;
      if (st.st === 'soal') {
        const j = (await L.db.get(`kilatJawab/${room}/${st.ronde}`)) || {};
        const benar = Object.entries(j).filter(([, v]) => v && v.j === st.k).sort((a, b) => (a[1].t || 0) - (b[1].t || 0));
        const semuaJawab = Object.keys(j).length >= Object.keys((await L.db.get('kilatIkut/' + room)) || {}).length;
        if (benar.length || umur > 12 || semuaJawab) {
          const upd = { st: 'jeda', mulai: TS, pr: benar.length ? bersih(benar[0][1].n, 20) : '' };
          if (benar.length) { const [u, v] = benar[0], lama = (st.skor || {})[u]; upd[`skor/${u}`] = { n: bersih(v.n, 20), s: ((lama && lama.s) || 0) + 1 }; }
          await L.db.update('kilat/' + room, upd);
        }
      } else if (st.st === 'jeda' && umur > 3) {
        if (st.ronde >= st.jml) await L.db.update('kilat/' + room, { st: 'selesai', t: TS });
        else { const q = st.qs[st.ronde]; await L.db.update('kilat/' + room, { st: 'soal', ronde: st.ronde + 1, q, k: SOAL_KILAT[q][2], urut: kocok([0, 1, 2, 3]), mulai: TS }); }
      }
    } catch (e) { console.warn('kilat', e); }
    sibuk = false;
  }, 700);
  kilatHost = { room, tm };
}
