// =====================================================================
//  Aktivitas bareng: Truth or Dare (meja), Kuis & Tebak Lagu (Ruang Rapat),
//  Lomba Makan Kerupuk, Raja/Ratu Hati mingguan, Kuis "Seberapa Kenal Kamu?",
//  Lempar Bunga, dan Peluk (harus disetujui dua-duanya).
// =====================================================================
import { LS, bersih, esc, fmt, hariIni } from '../js/common.js?v=202611280851';
import { TS } from '../js/db.js?v=202611280851';
import { $, K, toast, bukaKartu, tutupKartu, tulisLog } from './ui.js?v=202611280851';
import * as Prog from './progres.js?v=202611280851';

const acak = a => a[Math.floor(Math.random() * a.length)];
const kocok = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk ikut.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
// minggu ISO, contoh "2026W48" (WIB)
export function mingguIni(t = Date.now()) {
  const d = new Date(t + 7 * 3600e3); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const awal = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return d.getUTCFullYear() + 'W' + String(Math.ceil(((d - awal) / 864e5 + 1) / 7)).padStart(2, '0');
}

// ---------------------------------------------------------------- TRUTH OR DARE
// soal dibagi 3 level: santai (umum), baper (cinta & perasaan), berani (lebih personal, tetap sopan)
const TRUTH = {"santai": ["Makanan yang bisa kamu makan tiap hari tanpa bosan?", "Film atau drama yang paling sering kamu tonton ulang?", "Hal paling random yang kamu cari di Google minggu ini?", "Kebiasaan aneh yang jarang orang tahu?", "Lagu yang diam-diam kamu suka tapi malu ngaku?", "Hal kecil yang bikin harimu langsung bagus?", "Kalau jadi hewan, kamu mau jadi apa & kenapa?", "Aplikasi yang paling sering kamu buka setelah bangun tidur?", "Pernah salah kirim chat ke orang? Ceritain!", "Hobi baru yang pengen kamu coba tahun ini?", "Kota impian yang pengen kamu tinggali?", "Hal paling nekat yang pernah kamu lakukan?", "Kalau menang lotre 1 miliar, hal pertama yang kamu beli?", "Panggilan kesayangan dari keluarga yang paling memalukan?", "Superpower yang paling kamu mau?", "Pernah pura-pura sibuk biar nggak diajak ngobrol? Kapan?", "Makanan paling aneh yang pernah kamu coba?", "Satu kebiasaan buruk yang pengen kamu hentikan?", "Kalau hidupmu jadi film, judulnya apa?", "Siapa artis yang menurutmu mirip kamu?", "Barang termahal yang pernah kamu beli buat dirimu sendiri?", "Pernah ketiduran di tempat aneh? Di mana?", "Emoji yang paling sering kamu pakai?", "Hal yang paling kamu syukuri minggu ini?", "Kalau bisa ulang satu momen, momen apa?", "Kebiasaan sebelum tidur yang nggak bisa kamu tinggalin?", "Mimpi paling aneh yang masih kamu ingat?", "Kalau bisa makan malam dengan tokoh terkenal, siapa?", "Bakat terpendam yang jarang orang tahu?", "Kamu tim kopi atau tim teh? Jelaskan alasannya!"], "baper": ["Tipe idealmu dalam 3 kata?", "Hal paling romantis yang pernah dilakukan orang buat kamu?", "Kamu lebih suka ditembak langsung atau lewat chat?", "Bahasa cintamu apa: kata-kata, waktu, hadiah, sentuhan, atau bantuan?", "Pernah suka sama teman sendiri?", "Hal kecil yang bikin kamu langsung ilfeel?", "Lagu yang selalu bikin kamu ingat seseorang?", "Kencan impianmu seperti apa?", "Pernah ghosting orang? Kenapa?", "Pernah di-PHP-in? Gimana rasanya?", "Siapa orang terakhir yang kamu stalk IG-nya? (sebut inisial aja)", "Pesan paling manis yang pernah kamu terima?", "Kalau dia telat balas chat, kamu tipe sabar atau overthinking?", "Hal yang paling kamu cari dari pasangan?", "Pernah jatuh cinta pada pandangan pertama?", "Red flag yang paling kamu hindari?", "Green flag yang langsung bikin kamu tertarik?", "Panggilan sayang yang menurutmu paling lucu?", "Kamu lebih suka LDR atau jarak dekat tapi jarang ketemu?", "Momen paling baper yang pernah kamu alami?", "Kalau crush-mu ada di kantor ini, kamu berani nyapa duluan?", "Hadiah paling berkesan yang pernah kamu kasih ke seseorang?", "Kamu tipe yang ngasih kode atau langsung to the point?", "Hal yang bikin kamu yakin seseorang serius sama kamu?", "Pernah nulis surat cinta? Isinya kira-kira apa?", "Kalau ketemu mantan di jalan, kamu sapa atau pura-pura nggak lihat?", "Umur berapa kamu pengen menikah?", "Hal paling bucin yang pernah kamu lakukan?", "Kamu lebih suka dikasih bunga atau makanan?", "Satu kalimat buat jodohmu di masa depan?"], "berani": ["Chat paling memalukan yang pernah kamu kirim?", "Kapan terakhir kamu nangis & kenapa?", "Hal yang paling kamu takutkan dalam hubungan?", "Rahasia kecil yang belum pernah kamu ceritain ke siapa pun di sini?", "Kebohongan kecil terakhir yang kamu lakukan?", "Hal yang paling kamu sesali tahun ini?", "Siapa di kantor ini yang menurutmu paling asik diajak ngobrol?", "Kalau harus pilih satu orang di meja ini buat diajak makan malam, siapa?", "Pernah naksir dua orang sekaligus?", "Kesan pertamamu ke orang yang duduk di sebelahmu?", "Hal yang paling sering bikin kamu insecure?", "Pernah stalking mantan sampai foto lama? Jujur!", "Kebiasaanmu yang paling bikin pasangan kesal?", "Kalau bisa bilang satu hal ke mantan tanpa konsekuensi, apa?", "Hal paling cemburu yang pernah kamu rasakan?", "Pernah ditolak? Gimana kamu bangkit lagi?", "Hal yang paling kamu banggakan dari dirimu?", "Pernah pura-pura suka sesuatu biar disukai orang?", "Siapa yang paling sering kamu chat minggu ini? (inisial aja)", "Satu hal yang pengen kamu ubah dari dirimu?", "Pernah iri sama hubungan orang lain? Kenapa?", "Alasan sebenarnya kamu daftar di kantor jodoh ini?", "Hal terberat yang pernah kamu lewati & bikin kamu lebih kuat?", "Kalau malam ini harus nembak seseorang, kamu bakal bilang apa?", "Pernah salah paham soal perasaan orang? Ceritain!", "Hal yang paling kamu rindukan dari masa lalu?", "Kalau boleh jujur, kamu lagi naksir seseorang sekarang?", "Kesalahan dalam hubungan yang nggak mau kamu ulangi?", "Pernah ngerasa kesepian di tengah keramaian? Kapan?", "Hal yang paling susah kamu maafkan?"]};
const DARE = {"santai": ["Kirim emoji yang menggambarkan dirimu sekarang", "Pakai emote joget 5 detik 💃", "Ceritain lelucon paling garing yang kamu tahu", "Ganti mood-mu jadi \"🥳 Lagi happy\" selama 10 menit", "Tulis pantun singkat buat meja ini", "Kasih rekomendasi lagu ke meja ini 🎵", "Ketik nama lengkap artis favoritmu pakai mata tertutup", "Ceritain hari ini dalam 3 emoji", "Tirukan suara hewan favoritmu lewat chat (pakai huruf!)", "Kirim stiker paling lucu yang kamu punya", "Lambaikan tangan ke 3 orang yang lewat 👋", "Tulis kalimat motivasi buat semua yang di meja ini", "Sebut 5 makanan berawalan huruf B dalam 20 detik", "Ganti outfit di Ruang Loker lalu pamer di meja ini", "Siram tanaman terdekat 🪴 lalu laporan di sini", "Ceritain fakta unik yang jarang orang tahu", "Ambil minum di dispenser lalu bilang \"segar!\" di chat", "Buat tebak-tebakan buat meja ini", "Jelaskan film favoritmu pakai emoji saja", "Pakai kacamata hitam di Ruang Loker selama 5 menit 😎", "Ketik alfabet A sampai J secepat mungkin tanpa salah", "Ceritain resep andalanmu dalam 3 langkah", "Main Tangkap Hati sekali lalu laporkan skormu di sini 🎮"], "baper": ["Puji orang di sebelahmu dengan tulus", "Sebut 3 hal yang kamu suka dari dirimu", "Tulis gombalan paling manis buat meja ini", "Ajak satu orang di kantor ngobrol pribadi", "Kirim stiker favoritmu di obrolan pribadi teman", "Lempar bunga 🌸 ke seseorang di kantor", "Kirim pesan semangat ke orang terakhir yang chat kamu", "Tulis puisi 2 baris tentang cinta", "Ceritain kencan impianmu dalam satu kalimat", "Kasih nama panggilan lucu ke orang di sebelahmu", "Ajak satu orang ke Kafe Jodoh buat ngopi bareng ☕", "Tulis menfess manis (tanpa nama) buat seseorang", "Sebut satu hal baik dari setiap orang di meja ini", "Kirim lagu yang cocok buat orang di sebelahmu", "Ceritain momen paling lucu waktu PDKT", "Tulis \"terima kasih\" untuk seseorang yang berjasa di hidupmu", "Ceritain alasan kenapa kamu layak dicintai", "Kasih semangat ke orang yang paling pendiam di meja ini", "Tulis gombalan versi makanan 🍜", "Ceritain momen kamu paling bahagia tahun ini"], "berani": ["Nyanyikan reff lagu favoritmu lewat chat (tulis liriknya!)", "Ganti mood jadi \"😳 Malu-malu\" sampai ronde berikutnya", "Ajak orang yang belum kamu kenal ngobrol pribadi sekarang", "Tulis status \"Aku siap ketemu jodoh!\" di chat umum", "Ceritain pengalaman paling memalukan yang masih kamu ingat", "Kirim pesan \"Kamu keren hari ini\" ke orang yang baru kamu kenal", "Tulis 3 kelebihanmu tanpa merendah", "Tunjuk satu orang di meja ini buat jadi partner Speed Dating berikutnya", "Pakai emote malu 10 detik di depan semua orang 🙈", "Jawab satu TRUTH tambahan dari orang yang memutar botol", "Ajak satu orang foto bareng di Photobooth 📸", "Tulis pengakuan lucu yang belum pernah kamu ceritain", "Pilih satu orang di meja ini dan sebut kenapa dia menarik", "Biarkan orang di sebelahmu memilih mood-mu 10 menit", "Kirim pesan sapaan ke Direktur lewat tombol Sapa Direktur 👑", "Ceritain kebiasaan anehmu waktu jatuh cinta", "Tantang orang di sebelahmu main Kuis Cinta & bandingkan skor"]};
export const LEVEL_TOD = { santai: '😄 Santai', baper: '💗 Baper', berani: '🔥 Berani' };
export const jumlahSoalTod = () => Object.values(TRUTH).flat().length + Object.values(DARE).flat().length;
export function putarBotol(mejaId, peserta, level = 'santai') {
  if (!siap()) return;
  const t = Date.now(); if (t - (putarBotol.t || 0) < 15000) { toast('Botolnya masih berputar… tunggu sebentar.'); return; }
  putarBotol.t = t;
  const l = peserta.length ? peserta : [{ uid: K.L.uid, nama: K.prof.n }];
  if (!TRUTH[level]) level = 'santai';
  // hindari soal yang sama berulang dalam satu sesi
  const pakai = putarBotol.pakai || (putarBotol.pakai = new Set());
  const jenis = Math.random() < 0.5 ? 'TRUTH' : 'DARE', kolam = (jenis === 'TRUTH' ? TRUTH : DARE)[level];
  let pil = kolam.filter(s => !pakai.has(s)); if (!pil.length) { kolam.forEach(s => pakai.delete(s)); pil = kolam; }
  const kena = acak(l), soal = acak(pil); pakai.add(soal);
  K.L.db.push('mejaChat/' + mejaId, { uid: K.L.uid, n: bersih(K.prof.n, 30), m: `🍾 [${LEVEL_TOD[level].split(' ')[1]}] ${bersih(kena.nama, 20)} → ${jenis}: ${soal}`.slice(0, 160), t: TS });
  K.emote && K.emote(9, 2);
  return { kena, jenis, soal };
}

// ---------------------------------------------------------------- KUIS (Tebak Lagu + Teka-teki Cinta)
export const SOAL = [
  ['🎵 Tebak judul lagu: 🌻 🌷 🏡', ['Lihat Kebunku', 'Kupu-Kupu', 'Pelangi-Pelangi', 'Balonku'], 0],
  ['🎵 Tebak judul lagu: 🧢 ⚪ 3️⃣', ['Topi Saya Bundar', 'Balonku', 'Burung Kakak Tua', 'Naik Delman'], 0],
  ['🎵 Tebak judul lagu: 🌙 🎶 💤', ['Lagu Tidur', 'Nina Bobo', 'Bintang Kecil', 'Pelangi'], 1],
  ['🎵 Tebak judul lagu: ⭐ 🔅 👶', ['Bintang Kecil', 'Matahari', 'Pelangi', 'Bulan'], 0],
  ['🎵 Tebak judul lagu: 🌈 🌈 🎨', ['Pelangi-Pelangi', 'Warna', 'Cerah', 'Lukisan'], 0],
  ['🎵 Tebak judul lagu: 🚂 🚃 💨', ['Naik Kereta Api', 'Naik Delman', 'Kring Kring Sepeda', 'Becak'], 0],
  ['🎵 Tebak judul lagu: 🐔 🐣 🎤', ['Tek Kotek Kotek', 'Burung Kakak Tua', 'Cicak di Dinding', 'Balonku'], 0],
  ['🎵 Tebak judul lagu: 🎈 5️⃣ 💥', ['Balonku', 'Topi Saya Bundar', 'Naik Delman', 'Lihat Kebunku'], 0],
  ['🎵 Tebak judul lagu: 🦎 🧱 👀', ['Cicak di Dinding', 'Kupu-Kupu', 'Burung Hantu', 'Semut'], 0],
  ['🎵 Tebak judul lagu: 🐴 🛒 🏙️', ['Naik Delman', 'Naik Kereta Api', 'Kring Kring Sepeda', 'Becak'], 0],
  ['💘 Teka-teki: Apa yang makin diisi makin ringan?', ['Hati yang bahagia', 'Ember', 'Dompet', 'Balon'], 3],
  ['💘 Teka-teki: Bahasa cinta yang ditunjukkan lewat waktu bersama disebut…', ['Quality time', 'Gift', 'Service', 'Touch'], 0],
  ['💘 Teka-teki: Kalau dia balas chat 3 hari kemudian, itu namanya…', ['Slow response', 'Fast response', 'Spam', 'Typo'], 0],
  ['💘 Teka-teki: Huruf apa yang paling romantis?', ['U (you)', 'Z', 'Q', 'X'], 0],
  ['💘 Teka-teki: Orang yang nggak pernah kasih kabar tapi tiba-tiba muncul disebut…', ['Ghosting', 'Hantu', 'Zombie', 'Spam'], 2],
  ['💘 Teka-teki: Bunga yang identik dengan cinta?', ['Mawar merah', 'Kaktus', 'Kamboja', 'Bunga bangkai'], 0],
  ['💘 Teka-teki: Hari kasih sayang jatuh pada tanggal…', ['14 Februari', '1 Januari', '17 Agustus', '25 Desember'], 0],
  ['💘 Teka-teki: Istilah untuk orang yang kasih harapan tapi nggak serius?', ['PHP', 'PDKT', 'LDR', 'HTS'], 0],
  ['💘 Teka-teki: Hubungan tanpa status disingkat…', ['HTS', 'LDR', 'PDKT', 'BUCIN'], 0],
  ['💘 Teka-teki: Budak cinta disingkat…', ['Bucin', 'Bocil', 'Baper', 'Bacot'], 0],
];
export async function bukaKuis() {
  if (!siap()) return;
  const soal = kocok(SOAL).slice(0, 8);
  let i = 0, skor = 0, benar = 0, mulaiT = 0, tm = null;
  const tampil = () => {
    if (i >= soal.length) return selesai();
    const [q, ops, k] = soal[i], urut = kocok(ops.map((o, j) => [o, j]));
    mulaiT = Date.now();
    bukaKartu(`<h2>🧠 Kuis Cinta & Tebak Lagu <small class="kecil">${i + 1}/${soal.length}</small></h2><div class="bilah"><i id="kzW" style="width:100%"></i></div>
      <p style="font-size:20px"><b>${esc(q)}</b></p><div class="pilihEmpat">${urut.map(([o, j]) => `<button type="button" class="btn putih" data-j="${j}">${esc(o)}</button>`).join('')}</div><p class="kecil">Skor: ${fmt(skor)}</p>`, {
      tutup() { clearInterval(tm); },
      pasang(el) {
        const w = el.querySelector('#kzW');
        tm = setInterval(() => { const s = 1 - (Date.now() - mulaiT) / 15000; w.style.width = Math.max(0, s * 100) + '%'; if (s <= 0) { clearInterval(tm); i++; tampil(); } }, 100);
        el.querySelectorAll('[data-j]').forEach(b => b.onclick = () => {
          clearInterval(tm);
          const ok = +b.dataset.j === k;
          b.classList.add(ok ? 'benar' : 'salah'); el.querySelector(`[data-j="${k}"]`).classList.add('benar');
          if (ok) { benar++; skor += 10 + Math.max(0, Math.round(10 - (Date.now() - mulaiT) / 1500)); }
          el.querySelectorAll('[data-j]').forEach(x => { x.disabled = true; });
          setTimeout(() => { i++; tampil(); }, 900);
        });
      },
    });
  };
  const selesai = async () => {
    const mg = mingguIni(), kunci = 'kuis_' + hariIni(), kali = (LS.get(kunci, 0) || 0) + 1; LS.set(kunci, kali);
    const exp = kali <= 3 ? benar * 3 : 0;
    if (exp) Prog.hadiah(exp, '🧠 Kuis');
    const lama = await K.L.db.get(`lomba/kuis/${mg}/${K.L.uid}`).catch(() => null);
    let rekor = false;
    if (!lama || skor > lama.s) { rekor = true; await K.L.db.set(`lomba/kuis/${mg}/${K.L.uid}`, { s: Math.min(200, skor), n: bersih(K.prof.n, 20), t: TS }).catch(() => {}); }
    const top = Object.values((await K.L.db.get(`lomba/kuis/${mg}`).catch(() => null)) || {}).sort((a, b) => b.s - a.s).slice(0, 5);
    bukaKartu(`<div class="match"><div class="hatiBesar">🧠</div><h2>Skor ${fmt(skor)}</h2><p>Benar ${benar}/${soal.length}${exp ? ` · +${exp} EXP` : ''}${rekor ? '<br>🏆 Rekor barumu minggu ini!' : ''}</p>
      <h3>Juara minggu ini</h3><ol class="peringkat">${top.map(v => `<li><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>
      <div class="baris"><button class="btn" type="button" id="kzU">Main lagi</button></div></div>`, { pasang(el) { el.querySelector('#kzU').onclick = bukaKuis; } });
  };
  tampil();
}

// ---------------------------------------------------------------- LOMBA MAKAN KERUPUK (17-an)
export function bukaKerupuk() {
  if (!siap()) return;
  let ketuk = 0, sisa = 10, main = false, tm = null;
  bukaKartu(`<h2>🇮🇩 Lomba Makan Kerupuk</h2><p class="kecil">Ketuk kerupuknya secepat mungkin selama 10 detik! 8 ketukan = 1 kerupuk habis.</p>
    <div class="kerupuk" id="krB" role="button" tabindex="0">🍘</div><p style="text-align:center"><b id="krS">0 kerupuk</b> · <span id="krW">10</span> detik</p>
    <div class="baris"><button class="btn" type="button" id="krM">Mulai!</button></div>`, {
    tutup() { clearInterval(tm); },
    pasang(el) {
      const B = el.querySelector('#krB');
      const tap = () => { if (!main) return; ketuk++; B.style.transform = `scale(${1 - (ketuk % 8) * 0.07})`; el.querySelector('#krS').textContent = Math.floor(ketuk / 8) + ' kerupuk'; };
      B.onpointerdown = tap;
      el.querySelector('#krM').onclick = e => {
        if (main) return; main = true; e.target.disabled = true; ketuk = 0; sisa = 10;
        tm = setInterval(async () => {
          sisa--; el.querySelector('#krW').textContent = sisa;
          if (sisa > 0) return;
          clearInterval(tm); main = false;
          const s = Math.min(60, Math.floor(ketuk / 8)), hari = hariIni();
          const lama = await K.L.db.get(`lomba/kerupuk/${hari}/${K.L.uid}`).catch(() => null);
          if (!lama || s > lama.s) await K.L.db.set(`lomba/kerupuk/${hari}/${K.L.uid}`, { s, n: bersih(K.prof.n, 20), t: TS }).catch(() => {});
          if (!LS.get('kerupuk_' + hari)) { LS.set('kerupuk_' + hari, 1); Prog.hadiah(Math.min(20, s * 2), '🍘 Lomba Kerupuk'); }
          const top = Object.values((await K.L.db.get(`lomba/kerupuk/${hari}`).catch(() => null)) || {}).sort((a, b) => b.s - a.s).slice(0, 5);
          bukaKartu(`<div class="match"><div class="hatiBesar">🍘</div><h2>${s} kerupuk!</h2><h3>Juara hari ini</h3><ol class="peringkat">${top.map(v => `<li><span>${esc(bersih(v.n, 20))}</span><b>${fmt(v.s)}</b></li>`).join('')}</ol>
            <div class="baris"><button class="btn" type="button" id="krU">Main lagi</button></div></div>`, { pasang(x) { x.querySelector('#krU').onclick = bukaKerupuk; } });
        }, 1000);
      };
    },
  });
}

// ---------------------------------------------------------------- RAJA / RATU HATI MINGGUAN
// pemenang = skor Tangkap Hati tertinggi minggu lalu (dari skor harian)
export async function muatRajaHati() {
  const t = K.L.db.now(), mgLalu = mingguIni(t - 7 * 864e5), simpan = LS.get('rajaHati');
  if (simpan && simpan.mg === mgLalu) { K.rajaHati = simpan; return; }
  let best = null;
  for (let d = 1; d <= 14; d++) {
    const tt = t - d * 864e5; if (mingguIni(tt) !== mgLalu) continue;
    const dt = new Date(tt + 7 * 3600e3), hari = dt.getUTCFullYear() + String(dt.getUTCMonth() + 1).padStart(2, '0') + String(dt.getUTCDate()).padStart(2, '0');
    const o = await K.L.db.get('skor/' + hari).catch(() => null);
    for (const [u, v] of Object.entries(o || {})) if (v && (!best || v.s > best.s)) best = { uid: u, s: v.s, n: bersih(v.n, 20) };
  }
  K.rajaHati = { mg: mgLalu, ...(best || {}) }; LS.set('rajaHati', K.rajaHati);
  K.segarkanOrang && K.segarkanOrang();
}
export const gelarRaja = (uid, gd) => (K.rajaHati && K.rajaHati.uid === uid ? (gd === 'ce' ? '👑 Ratu Hati' : '👑 Raja Hati') : '');

// ---------------------------------------------------------------- KUIS "SEBERAPA KENAL KAMU?" (pasangan match)
export const KENAL = [
  ['Makanan favoritku?', ['🍜 Mie', '🍛 Nasi padang', '🍕 Pizza', '🍣 Sushi']],
  ['Kalau weekend aku lebih suka…', ['🛌 Rebahan', '🏞️ Jalan-jalan', '🎮 Main game', '☕ Nongkrong']],
  ['Aku tim…', ['☕ Kopi', '🍵 Teh', '🧋 Boba', '🥤 Soda']],
  ['Hewan favoritku?', ['🐱 Kucing', '🐶 Anjing', '🐰 Kelinci', '🐠 Ikan']],
  ['Love language-ku?', ['💬 Kata-kata', '⏰ Waktu', '🎁 Hadiah', '🤗 Sentuhan']],
];
export async function bukaKuisKenal(lawan, namaLawan, kirimDm) {
  if (!siap()) return;
  const L = K.L;
  const milikku = await L.db.get('kenal/' + L.uid).catch(() => null);
  const punyaDia = await L.db.get('kenal/' + lawan).then(v => v, () => null);
  bukaKartu(`<h2>🎯 Seberapa Kenal Kamu?</h2><p class="kecil">Isi jawaban tentang dirimu, lalu tebak jawaban ${esc(namaLawan)}. Hanya pasangan match yang bisa melihat jawabanmu.</p>
    <div class="baris"><button class="btn ${milikku ? 'putih' : ''}" type="button" id="kkI">${milikku ? '✏️ Ubah jawabanku' : '📝 Isi jawabanku'}</button><button class="btn" type="button" id="kkT" ${punyaDia ? '' : 'disabled'}>🎯 Tebak ${esc(namaLawan)}</button></div>
    ${punyaDia ? '' : `<p class="kecil">${esc(namaLawan)} belum mengisi jawabannya. Ajak dia isi dulu ya!</p>`}`, {
    pasang(el) {
      el.querySelector('#kkI').onclick = () => isiKenal(milikku, () => bukaKuisKenal(lawan, namaLawan, kirimDm));
      el.querySelector('#kkT').onclick = () => tebakKenal(punyaDia, namaLawan, kirimDm);
    },
  });
}
function isiKenal(lama, kembali) {
  const pilih = (lama && lama.j) || [];
  bukaKartu(`<h2>📝 Jawabanku</h2>${KENAL.map(([q, ops], i) => `<p><b>${esc(q)}</b></p><div class="sw teks" data-q="${i}">${ops.map((o, j) => `<button type="button" data-j="${j}" class="${pilih[i] === j ? 'on' : ''}">${esc(o)}</button>`).join('')}</div>`).join('')}
    <div class="baris"><button class="btn" type="button" id="kkS">Simpan</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-q]').forEach(g => g.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { pilih[+g.dataset.q] = +b.dataset.j; g.querySelectorAll('[data-j]').forEach(x => x.classList.toggle('on', x === b)); }));
      el.querySelector('#kkS').onclick = async () => {
        if (KENAL.some((_, i) => !Number.isInteger(pilih[i]))) { toast('Jawab semua pertanyaan dulu ya.'); return; }
        await K.L.db.set('kenal/' + K.L.uid, { j: pilih.slice(0, KENAL.length), t: TS }).then(() => toast('Jawaban tersimpan ✔')).catch(() => toast('Gagal menyimpan.'));
        kembali();
      };
    },
  });
}
function tebakKenal(dia, namaLawan, kirimDm) {
  const tebak = [];
  bukaKartu(`<h2>🎯 Tebak ${esc(namaLawan)}</h2>${KENAL.map(([q, ops], i) => `<p><b>${esc(q.replace('ku', ' ' + namaLawan).replace('aku', namaLawan))}</b></p><div class="sw teks" data-q="${i}">${ops.map((o, j) => `<button type="button" data-j="${j}">${esc(o)}</button>`).join('')}</div>`).join('')}
    <div class="baris"><button class="btn" type="button" id="kkC">Cek jawaban</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-q]').forEach(g => g.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { tebak[+g.dataset.q] = +b.dataset.j; g.querySelectorAll('[data-j]').forEach(x => x.classList.toggle('on', x === b)); }));
      el.querySelector('#kkC').onclick = () => {
        if (KENAL.some((_, i) => !Number.isInteger(tebak[i]))) { toast('Tebak semua dulu ya.'); return; }
        const b = KENAL.filter((_, i) => tebak[i] === dia.j[i]).length;
        const kata = b === 5 ? 'Soulmate banget! 💞' : b >= 3 ? 'Udah lumayan kenal 😊' : 'Perlu ngobrol lebih banyak nih 😆';
        kirimDm && kirimDm(`🎯 Aku dapat ${b}/5 di kuis "Seberapa Kenal Kamu?" tentang kamu. ${kata}`);
        K.efekLokal && K.efekLokal('hati', b * 10);
        bukaKartu(`<div class="match"><div class="hatiBesar">🎯</div><h2>${b}/5 benar</h2><p>${kata}</p><p class="kecil">Hasilnya sudah dikirim ke obrolan kalian.</p></div>`);
      };
    },
  });
}

// ---------------------------------------------------------------- LEMPAR BUNGA
export async function lemparBunga(o) {
  if (!siap() || o.npc) return;
  const L = K.L;
  try {
    await L.db.set(`bunga/${o.uid}/${L.uid}`, TS);
    K.bicara(K.saya, `💐 untuk ${bersih(o.nama, 16)}!`); K.emote && K.emote(5, 2);
    toast(`💐 Bunga terlempar ke ${o.nama}!`); Prog.lapor('bunga');
  } catch (e) { toast('Kamu sudah melempar bunga ke dia hari ini 💐'); }
}
export const jumlahBunga = uid => K.L.db.get('bunga/' + uid).then(v => Object.keys(v || {}).length).catch(() => 0);

// ---------------------------------------------------------------- PELUK (persetujuan dua pihak)
export async function mintaPeluk(o) {
  if (!siap() || o.npc) return;
  try { await K.L.db.set(`aksiReq/${o.uid}/${K.L.uid}`, { j: 'peluk', n: bersih(K.prof.n, 30), t: TS }); toast(`🤗 Ajakan peluk terkirim ke ${o.nama}. Tunggu jawabannya ya.`); }
  catch (e) { toast('Gagal mengirim ajakan.'); }
}
export function mulai() {
  const L = K.L;
  // ajakan masuk
  L.db.on('aksiReq/' + L.uid, o => {
    for (const [dari, v] of Object.entries(o || {})) {
      if (!v || L.db.now() - v.t > 60000 || K.sembunyi.has(dari)) { L.db.set(`aksiReq/${L.uid}/${dari}`, null).catch(() => {}); continue; }
      const nama = bersih(v.n, 30);
      bukaKartu(`<div class="match"><div class="hatiBesar">🤗</div><h2>${esc(nama)} ingin memelukmu</h2><p class="kecil">Peluk virtual hanya terjadi kalau kamu setuju.</p>
        <div class="baris"><button class="btn" type="button" id="pkY">Peluk balik 🤗</button><button class="btn putih" type="button" id="pkN">Nanti dulu</button></div></div>`, {
        pasang(el) {
          const jawab = ok => { L.db.set(`aksiReq/${L.uid}/${dari}`, null).catch(() => {}); L.db.set(`aksiJawab/${dari}/${L.uid}`, { ok, t: TS }).catch(() => {}); tutupKartu(); if (ok) peluk(dari, false); };
          el.querySelector('#pkY').onclick = () => jawab(true); el.querySelector('#pkN').onclick = () => jawab(false);
        },
      });
    }
  });
  // jawaban atas ajakanku
  L.db.on('aksiJawab/' + L.uid, o => {
    for (const [ke, v] of Object.entries(o || {})) {
      L.db.set(`aksiJawab/${L.uid}/${ke}`, null).catch(() => {});
      if (!v || L.db.now() - v.t > 60000) continue;
      const n = (K.lain.get(ke) || {}).nama || 'Dia';
      if (v.ok) { toast(`🤗 ${n} menerima pelukanmu!`); peluk(ke, true); } else toast(`${n} belum mau dipeluk sekarang. Tetap sopan ya 🙏`);
    }
  });
  muatRajaHati().catch(() => {});
}
function peluk(uid, datangi) {
  const o = K.lain.get(uid);
  if (o && datangi) { const r = Math.atan2(o.x - K.saya.x, o.z - K.saya.z); K.pindah(o.x - Math.sin(r) * 0.75, o.z - Math.cos(r) * 0.75, r); }
  else if (o) K.saya.r = Math.atan2(o.x - K.saya.x, o.z - K.saya.z);
  K.emote && K.emote(11, 4);
  K.efekLokal && K.efekLokal('hati', 26);
  tulisLog('', `🤗 Kamu berpelukan dengan ${(o && o.nama) || 'teman'}`, 'sys');
}
