// =====================================================================
//  Meja Nongkrong: tiap meja topik punya kegiatan sendiri.
//   💬 Ngobrol  : obrolan grup khusus meja itu + siapa yang lagi duduk
//   📌 Papan    : kegiatan khas topik (cari mabar, playlist, rekomendasi
//                 tontonan, ajak olahraga, peta kuliner, cerita berantai,
//                 bucket list destinasi, hot take)
//   🎲 Seru     : "Pilih Mana?" harian (voting), kartu pemantik obrolan,
//                 + permainan khusus (putar destinasi, roda random, dll)
//  Data: mejaChat/<meja>, mejaPapan/<meja>, mejaVote/<meja>/<hari>/<uid>
// =====================================================================
import { LS, bersih, esc, hariIni, sensor } from '../js/common.js?v=202611260437';
import { TS } from '../js/db.js?v=202611260437';
import { K, toast, bukaKartu, tutupKartu, jam, tanggalJam } from './ui.js?v=202611260437';
import * as Prog from './progres.js?v=202611260437';
import * as Sosial from './sosial.js?v=202611260437';

const acak = a => a[Math.floor(Math.random() * a.length)];
const cari = q => encodeURIComponent(q);

// ---------------------------------------------------------------- ISI TIAP MEJA (urutan = TOPIK di common.js)
const MEJA = [
  { id: 'gaming', papan: '🎮 Cari Mabar', ajak: 'Lagi cari teman main? Pasang di sini, yang lain bisa langsung ngajak.',
    f: [['Game', 'Mobile Legends, Valorant, Roblox…', 40], ['Rank / mode', 'Epic, ranked, santai aja…', 40], ['Main jam berapa?', 'Malam ini jam 8, ID: 12345', 120]],
    suka: '🙋 Ikut', tombol: 'Pasang ajakan',
    pilih: [['Mabar sama teman', 'Push rank solo'], ['Game HP', 'Game PC/konsol'], ['Mode cerita', 'Mode multiplayer'], ['Jadi support', 'Jadi carry'], ['Main sampai subuh', 'Tidur cukup, main besok'], ['Skin keren', 'Skill dewa'], ['Game horor', 'Game santai']],
    pemantik: ['Game pertama yang bikin kamu ketagihan apa?', 'Hero/karakter andalanmu siapa?', 'Pernah rage quit gara-gara apa? 😂', 'Game apa yang pengen kamu mainin bareng pacar/gebetan?', 'Kalau hidupmu jadi game, genrenya apa?', 'Momen paling epic kamu pas main?', 'Tim kamu toxic, kamu ngapain?', 'Rekomendasi game buat pemula dong!'] },
  { id: 'musik', papan: '🎵 Playlist Meja', ajak: 'Bagikan lagu yang lagi kamu puter. Yang lain tinggal ketuk ▶ buat dengerin.',
    f: [['Judul lagu', 'contoh: Tak Segampang Itu', 50], ['Penyanyi', 'contoh: Anggi Marito', 40], ['Kenapa suka? (opsional)', 'pas buat galau sore-sore', 120]],
    suka: '🎧 Suka', tombol: 'Tambah ke playlist', putar: true,
    pilih: [['Lagu galau', 'Lagu semangat'], ['Konser', 'Dengerin di kamar'], ['Indie lokal', 'K-pop'], ['Karaoke bareng', 'Nyanyi di kamar mandi'], ['Lirik dalem', 'Beat enak'], ['Lagu lama', 'Lagu baru'], ['Dangdut koplo', 'Jazz santai']],
    pemantik: ['Lagu yang paling sering kamu repeat minggu ini?', 'Lagu yang ngingetin kamu sama seseorang? 👀', 'Konser impian kamu siapa?', 'Lagu buat dinyanyiin pas karaoke?', 'Genre yang diam-diam kamu suka tapi malu ngaku?', 'Kalau hidupmu film, soundtrack-nya lagu apa?', 'Lagu yang cocok buat nembak gebetan?', 'Penyanyi yang suaranya paling bikin adem?'] },
  { id: 'drakor', papan: '🍿 Rekomendasi Tontonan', ajak: 'Lagi nonton apa? Kasih rekomendasi + review singkat (tanpa spoiler ya!).',
    f: [['Judul', 'contoh: Queen of Tears', 50], ['Genre / tempat nonton', 'romcom · Netflix', 40], ['Review singkat (tanpa spoiler)', 'Episode 1 aja udah nangis 😭', 140]],
    suka: '🍿 Mau nonton', tombol: 'Rekomendasikan',
    pilih: [['Drakor', 'Film Indonesia'], ['Romcom', 'Thriller'], ['Maraton semalam', 'Satu episode sehari'], ['Nonton di bioskop', 'Nonton di kasur'], ['Ending bahagia', 'Ending bikin nangis'], ['Anime', 'Sitkom'], ['Nonton sendiri', 'Nonton bareng']],
    pemantik: ['Drakor/film yang bikin kamu nangis paling parah?', 'Karakter fiksi yang jadi tipe idealmu?', 'Film yang bisa kamu tonton berulang-ulang?', 'Second lead syndrome terparah kamu?', 'Rekomendasi tontonan buat first date?', 'Plot twist paling nggak terduga yang pernah kamu tonton?', 'Kalau hidupmu drakor, judulnya apa?', 'Aktor/aktris yang bikin kamu salting?'] },
  { id: 'olahraga', papan: '🏃 Ajak Olahraga Bareng', ajak: 'Cari teman jogging, futsal, badminton, gym? Pasang ajakannya di sini.',
    f: [['Olahraga', 'jogging, futsal, badminton…', 40], ['Kota & kapan', 'Bandung · Minggu pagi', 50], ['Catatan', 'santai, pemula juga boleh', 120]],
    suka: '💪 Ikut', tombol: 'Pasang ajakan',
    pilih: [['Olahraga pagi', 'Olahraga malam'], ['Gym', 'Lari di luar'], ['Futsal', 'Badminton'], ['Nonton bola', 'Main bola'], ['Diet ketat', 'Cheat day tiap hari'], ['Yoga', 'Boxing'], ['Olahraga sendiri', 'Olahraga bareng']],
    pemantik: ['Olahraga favorit kamu apa?', 'Tim/atlet yang kamu dukung?', 'Pernah ikut lomba lari/fun run?', 'Target olahraga kamu tahun ini?', 'Olahraga yang pengen kamu coba tapi belum berani?', 'Lebih suka jadi pemain atau suporter?', 'Kebiasaan sehat yang lagi kamu bangun?', 'Momen olahraga paling memalukan? 😂'] },
  { id: 'kuliner', papan: '🍜 Peta Kuliner', ajak: 'Bagikan makanan/tempat makan favorit di kotamu. Ketuk 📍 buat buka di peta.',
    f: [['Makanan / tempat', 'contoh: Mie Gacoan, Seblak Jeletot', 50], ['Kota', 'contoh: Surabaya', 40], ['Kenapa wajib coba?', 'Pedesnya nagih, harganya murah', 120]],
    suka: '🤤 Mau coba', tombol: 'Tambah ke peta', peta: true,
    pilih: [['Bakso', 'Mie ayam'], ['Pedas level 10', 'Nggak pedas sama sekali'], ['Kopi', 'Teh'], ['Masak sendiri', 'Pesan online'], ['Bubur diaduk', 'Bubur nggak diaduk'], ['Martabak manis', 'Martabak telor'], ['Makan di warung', 'Makan di kafe']],
    pemantik: ['Makanan yang bisa bikin mood kamu balik?', 'Jajanan masa kecil favorit kamu?', 'Tempat makan paling hits di kotamu?', 'Makanan aneh yang pernah kamu coba?', 'Kalau first date, mau makan di mana?', 'Kamu tim nasi atau tim mie?', 'Menu andalan kalau kamu masak?', 'Minuman wajib kamu tiap hari?'] },
  { id: 'buku', papan: '✍️ Cerita Berantai', ajak: 'Satu orang satu kalimat. Lanjutkan ceritanya dan lihat jadinya kayak apa!', cerita: true,
    f: [['Lanjutkan ceritanya (1–2 kalimat)', 'Tiba-tiba lampu kantor mati, dan…', 160]],
    suka: '❤️', tombol: 'Tambah kalimat',
    pilih: [['Buku fisik', 'E-book'], ['Novel', 'Komik'], ['Baca di kafe', 'Baca sebelum tidur'], ['Nulis diary', 'Nulis puisi'], ['Fiksi', 'Pengembangan diri'], ['Ending terbuka', 'Ending jelas'], ['Baca bukunya dulu', 'Nonton filmnya dulu']],
    pemantik: ['Buku yang mengubah cara pandang kamu?', 'Kutipan favorit kamu?', 'Penulis yang karyanya selalu kamu tunggu?', 'Kalau nulis buku, judulnya apa?', 'Karakter buku yang paling mirip kamu?', 'Buku yang bikin kamu begadang?', 'Lebih suka baca atau dengerin podcast?', 'Rekomendasi buku buat yang lagi patah hati?'] },
  { id: 'jalan', papan: '🗺️ Bucket List Destinasi', ajak: 'Tempat yang pernah kamu datangi atau pengen banget kamu kunjungi. Ketuk 📍 buat lihat petanya.',
    f: [['Destinasi', 'contoh: Labuan Bajo', 50], ['Kota / negara', 'contoh: NTT, Indonesia', 40], ['Tips / kenapa wajib ke sana', 'Sunset di Bukit Sylvia juara!', 140]],
    suka: '✈️ Mau ke sana', tombol: 'Tambah ke bucket list', peta: true, putarDestinasi: true,
    pilih: [['Pantai', 'Gunung'], ['Liburan mewah', 'Backpacker'], ['Jalan sendiri', 'Jalan bareng teman'], ['Itinerary rapi', 'Spontan aja'], ['Kota besar', 'Desa yang tenang'], ['Kemping', 'Hotel'], ['Kuliner dulu', 'Foto-foto dulu']],
    pemantik: ['Tempat terindah yang pernah kamu datangi?', 'Destinasi impian kamu?', 'Liburan paling berkesan sama siapa?', 'Kalau dapat tiket gratis hari ini, mau ke mana?', 'Barang wajib yang selalu kamu bawa pas traveling?', 'Pengalaman nyasar paling lucu?', 'Honeymoon impian di mana? 👀', 'Kota yang pengen kamu tinggali suatu hari?'] },
  { id: 'random', papan: '🔥 Hot Take', ajak: 'Tulis pendapat random kamu. Yang setuju tinggal ketuk 🔥.',
    f: [['Hot take kamu', 'contoh: Nasi padang lebih enak dibungkus', 160]],
    suka: '🔥 Setuju', tombol: 'Lempar hot take', roda: true,
    pilih: [['Bisa terbang', 'Bisa menghilang'], ['Kucing', 'Anjing'], ['Pagi', 'Malam'], ['Chat duluan', 'Nunggu di-chat'], ['Liburan tanpa HP', 'Di rumah dengan WiFi'], ['Kaya tapi sendiri', 'Sederhana tapi bahagia bareng'], ['Tau masa depan', 'Ubah masa lalu']],
    pemantik: ['Kebiasaan aneh kamu yang orang lain jarang tau?', 'Kalau bisa punya satu kekuatan super, apa?', 'Hal kecil yang bikin kamu senyum hari ini?', 'Fakta random tentang kamu?', 'Emoji yang paling sering kamu pakai?', 'Kalau jadi hewan, kamu hewan apa?', 'Hal yang pengen kamu coba sebelum umur 30?', 'Red flag paling nggak masuk akal menurut kamu?'] },
  // meja bundar (bukan meja topik): Kafe Jodoh & Lounge Eksekutif
  { id: 'kafe', papan: '💌 Cari Teman Ngopi', ajak: 'Lagi pengen ngopi bareng? Pasang ajakannya, yang tertarik tinggal ketuk ☕.',
    f: [['Mau ngopi apa?', 'kopi susu gula aren', 40], ['Kota / kapan', 'Jakarta · Sabtu sore', 50], ['Pesan singkat', 'Cari teman ngobrol santai, bukan buat ghosting 😆', 140]],
    suka: '☕ Ikut ngopi', tombol: 'Pasang ajakan',
    pilih: [['Kencan di kafe', 'Kencan di taman'], ['Chat lama dulu', 'Langsung ketemu'], ['Dia yang traktir', 'Bayar sendiri-sendiri'], ['Telepon', 'Video call'], ['Cinta pandangan pertama', 'Tumbuh pelan-pelan'], ['Pasangan humoris', 'Pasangan romantis'], ['LDR', 'Satu kota']],
    pemantik: ['Kencan pertama impian kamu kayak apa?', 'Love language kamu apa?', 'Red flag yang langsung bikin ilfeel?', 'Green flag yang bikin klepek-klepek?', 'Kamu tipe yang chat duluan atau nunggu?', 'Hal kecil yang bikin kamu jatuh hati?', 'Tempat ngopi favorit di kotamu?', 'Lagu yang cocok buat kisah cintamu sekarang?'] },
  { id: 'lounge', papan: '🥂 Toast Eksekutif', ajak: 'Angkat gelas! Tulis harapan atau ucapan baik untuk sesama tamu.',
    f: [['Ucapan / harapan kamu', 'Semoga semua yang di sini ketemu jodohnya tahun ini 🥂', 160]], suka: '🥂 Cheers', tombol: 'Angkat gelas',
    pilih: [['Makan malam mewah', 'Street food'], ['Liburan ke Eropa', 'Keliling Indonesia'], ['Rumah di kota', 'Villa di gunung'], ['Pesta besar', 'Makan malam berdua'], ['Mobil sport', 'Motor klasik'], ['Kerja keras', 'Kerja cerdas'], ['Jam tangan', 'Sepatu']],
    pemantik: ['Pencapaian yang paling kamu banggakan tahun ini?', 'Kalau sukses besar, hal pertama yang kamu lakukan?', 'Siapa orang yang paling berjasa di hidupmu?', 'Mimpi besar kamu 5 tahun lagi?', 'Kemewahan kecil yang selalu kamu nikmati?', 'Nasihat terbaik yang pernah kamu terima?', 'Makan malam dengan tokoh siapa saja, pilih siapa?', 'Apa arti sukses buat kamu?'] },
];
const DESTINASI = ['Raja Ampat, Papua Barat Daya', 'Labuan Bajo, NTT', 'Danau Toba, Sumatera Utara', 'Bromo, Jawa Timur', 'Ubud, Bali', 'Nusa Penida, Bali', 'Belitung', 'Karimunjawa, Jawa Tengah', 'Dieng, Jawa Tengah', 'Kawah Ijen, Jawa Timur', 'Pulau Derawan, Kalimantan Timur', 'Tana Toraja, Sulawesi Selatan', 'Wakatobi, Sulawesi Tenggara', 'Bukittinggi, Sumatera Barat', 'Yogyakarta', 'Lombok, NTB', 'Sumba, NTT', 'Ranu Kumbolo, Jawa Timur', 'Kepulauan Seribu, Jakarta', 'Bandung', 'Malang', 'Kyoto, Jepang', 'Seoul, Korea Selatan', 'Bangkok, Thailand', 'Singapura', 'Kuala Lumpur, Malaysia', 'Hanoi, Vietnam', 'Istanbul, Turki', 'Paris, Prancis', 'Swiss'];
const RODA = ['Sebutin 3 hal yang kamu syukuri hari ini di obrolan meja 🙏', 'Ceritain makanan terakhir yang kamu makan 🍽️', 'Kasih pujian tulus ke orang yang lagi duduk di sini 💖', 'Tulis emoji yang menggambarkan mood kamu sekarang', 'Rekomendasiin satu lagu ke meja ini 🎵', 'Ceritain mimpi teraneh yang pernah kamu alami 😴', 'Sebutin tipe ideal kamu dalam 3 kata 👀', 'Tanya satu pertanyaan random ke orang di meja ini ❓', 'Ceritain hal paling memalukan minggu ini 🙈', 'Kalau dapat Rp10 juta sekarang, buat apa? 💸', 'Tulis "hai" ke orang yang belum pernah kamu sapa 👋', 'Sebutin film yang kamu tonton terakhir 🎬'];

// ---------------------------------------------------------------- STATUS
let buka = null;       // { m, i, tab }
let lepas = [];
let D = { chat: [], papan: [], vote: {} };
const siap = () => { if (!K.resmi()) { toast('👀 Kamu masih pengunjung. Daftar dulu untuk ikut kegiatan meja.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const urut = o => Object.entries(o || {}).filter(([, v]) => v && typeof v === 'object').sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => ({ ...v, k }));
const nama = () => (K.prof && K.prof.n) || 'Tamu';
const hariKe = () => Math.floor((K.L ? K.L.db.now() : Date.now()) / 864e5 + 7 / 24);

export const dataMeja = i => MEJA[i];

// Orang yang sedang duduk di meja ini (online + bot di mode lokal)
function diMeja(topik) {
  return [...K.lain.values(), ...(K.L?.mode === 'lokal' ? K.bot : [])].filter(o => o.mj === topik);
}

// ---------------------------------------------------------------- BUKA / TUTUP
export function bukaMeja(i, topik, tab) {
  const m = MEJA[i]; if (!m || !K.L) return;
  tutupLangganan();
  buka = { m, i, topik, tab: tab || (LS.get('mejaTab') || 'ngobrol') };
  D = { chat: [], papan: [], vote: {} };
  const db = K.L.db;
  lepas.push(db.on('mejaChat/' + m.id, o => { D.chat = urut(o); if (buka?.tab === 'ngobrol') gambar(); }, { limit: 40 }));
  lepas.push(db.on('mejaPapan/' + m.id, o => { D.papan = urut(o); if (buka?.tab === 'papan') gambar(); }, { limit: 40 }));
  lepas.push(db.on(`mejaVote/${m.id}/${hariIni()}`, o => { D.vote = o || {}; if (buka?.tab === 'seru') gambar(); }));
  bukaKartu(`<h2>Meja ${esc(topik)}</h2>
    <div class="sw teks tab" id="mT">
      <button type="button" data-tab="ngobrol">💬 Ngobrol</button>
      <button type="button" data-tab="papan">${esc(m.papan)}</button>
      <button type="button" data-tab="seru">🎲 Seru</button>
    </div>
    <div id="mI"></div>
    <div class="baris"><button class="btn putih" type="button" id="mB">🚶 Berdiri dari meja</button></div>`, {
    tutup() { tutupLangganan(); buka = null; },
    pasang(isi) {
      isi.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { buka.tab = b.dataset.tab; LS.set('mejaTab', buka.tab); gambar(); });
      isi.querySelector('#mB').onclick = () => { tutupKartu(); K.berdiri && K.berdiri(); };
    },
  });
  gambar();
}
function tutupLangganan() { lepas.forEach(f => { try { f && f(); } catch (e) {} }); lepas = []; }
export const terbuka = () => !!buka;
// dipanggil kantor.js saat ada orang datang/pergi dari meja
export function orangBerubah() { if (buka && buka.tab === 'ngobrol') gambarOrang(); }

function gambar() {
  const el = document.querySelector('#kartu #mI'); if (!el || !buka) return;
  document.querySelectorAll('#kartu #mT [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === buka.tab));
  if (buka.tab === 'ngobrol') return gambarNgobrol(el);
  if (buka.tab === 'papan') return gambarPapan(el);
  return gambarSeru(el);
}

// ---------------------------------------------------------------- 💬 NGOBROL
function gambarNgobrol(el) {
  const ada = el.querySelector('#mC');
  if (!ada) {
    el.innerHTML = `<p class="kecil" id="mO"></p>
      <div class="dmIsi mejaIsi" id="mC" aria-live="polite"></div>
      <form class="dmForm" id="mF"><input id="mX" maxlength="160" placeholder="Ngobrol soal ${esc(buka.topik.replace(/^\S+\s/, ''))}…" aria-label="Pesan untuk meja"><button class="btn" type="submit">Kirim</button></form>`;
    el.querySelector('#mF').onsubmit = e => {
      e.preventDefault();
      const inp = el.querySelector('#mX');
      if (kirimChat(inp.value)) inp.value = '';
    };
  }
  gambarOrang();
  const C = el.querySelector('#mC'), uid = K.L.uid;
  const bawah = C.scrollHeight - C.scrollTop - C.clientHeight < 40;
  const list = D.chat.filter(c => !K.sembunyi.has(c.uid));
  C.innerHTML = list.length
    ? list.map(c => `<div class="dm ${c.uid === uid ? 'saya' : ''}"><small>${c.uid === uid ? '' : `<b>${esc(bersih(c.n, 20))}</b> · `}${esc(jam(c.t))}</small><span>${esc(c.m)}</span></div>`).join('')
    : `<p class="kecil">Belum ada obrolan di meja ini. Buka dengan pertanyaan, misalnya:<br><b>“${esc(acak(buka.m.pemantik))}”</b></p>`;
  if (bawah || !ada) C.scrollTop = C.scrollHeight;
}
function gambarOrang() {
  const el = document.querySelector('#kartu #mO'); if (!el || !buka) return;
  const org = diMeja(buka.topik).filter(o => !K.sembunyi.has(o.uid));
  el.innerHTML = org.length
    ? `🪑 Lagi duduk di sini: ${org.slice(0, 8).map((o, i) => `<button type="button" class="mini putih" data-o="${i}">${esc(bersih(o.nama, 16))}</button>`).join(' ')}${org.length > 8 ? ` +${org.length - 8}` : ''}`
    : '🪑 Baru kamu yang duduk di sini. Obrolan meja tetap bisa dibaca orang yang mampir nanti.';
  el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => Sosial.bukaProfil(org[+b.dataset.o]));
}
function kirimChat(t) {
  if (!siap()) return false;
  t = bersih(t, 160);
  if (!t) return false;
  if (Date.now() - (LS.get('mejaChatT', 0) || 0) < 2500) { toast('Pelan-pelan ya, tunggu sebentar.'); return false; }
  LS.set('mejaChatT', Date.now());
  K.L.db.push('mejaChat/' + buka.m.id, { uid: K.L.uid, n: nama(), m: sensor(t), t: TS });
  Prog.lapor('mejaSeru');
  return true;
}

// ---------------------------------------------------------------- 📌 PAPAN (kegiatan khas meja)
function gambarPapan(el) {
  const m = buka.m, uid = K.L.uid, mod = !!K.peran[uid];
  const draf = [...el.querySelectorAll('#pF [data-f]')].map(x => x.value);
  const list = D.papan.filter(p => !K.sembunyi.has(p.uid));
  let isiList;
  if (m.cerita) {
    // cerita berantai: tampilkan sebagai satu paragraf, kalimat terbaru di akhir
    const kal = list.slice(-25);
    isiList = kal.length
      ? `<div class="cerita"><p>${kal.map(p => `<span title="${esc(bersih(p.n, 20))}">${esc(p.c)}</span>`).join(' ')}</p>
          <small class="kecil">Ditulis bareng oleh: ${[...new Set(kal.map(p => bersih(p.n, 16)))].map(esc).join(', ')}</small></div>
          ${mod ? `<details class="kecil"><summary>Moderasi kalimat</summary><div class="daftar">${kal.slice().reverse().map(p => `<div><span>“${esc(p.c)}” <small>— ${esc(p.n)}</small></span><button type="button" class="mini merah" data-hapus="${esc(p.k)}">Hapus</button></div>`).join('')}</div></details>` : ''}`
      : '<p class="kecil">Ceritanya belum dimulai. Tulis kalimat pembuka!</p>';
  } else {
    isiList = list.length
      ? `<div class="daftar mejaPapan">${list.slice().reverse().map(p => {
          const s = p.s ? Object.keys(p.s).length : 0, saya = !!(p.s && p.s[uid]);
          const q = [p.a, p.b].filter(Boolean).join(' ');
          const org = K.lain.get(p.uid);
          return `<div data-k="${esc(p.k)}"><span>${p.a ? `<b>${esc(p.a)}</b>` : ''}${p.b ? ` · ${esc(p.b)}` : ''}${p.c ? `<br>${p.a ? '' : '“'}${esc(p.c)}${p.a ? '' : '”'}` : ''}<br><small>${esc(bersih(p.n, 20))} · ${esc(tanggalJam(p.t))}</small>
            <span class="baris kecil">
              <button type="button" class="mini ${saya ? '' : 'putih'}" data-a="suka">${esc(m.suka)} ${s}</button>
              ${m.putar && q ? `<a class="mini putih" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${cari(q)}">▶ YouTube</a><a class="mini putih" target="_blank" rel="noopener" href="https://open.spotify.com/search/${cari(q)}">Spotify</a>` : ''}
              ${m.peta && q ? `<a class="mini putih" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${cari(q)}">📍 Peta</a>` : ''}
              ${org && p.uid !== uid ? '<button type="button" class="mini putih" data-a="profil">👤 Sapa</button>' : ''}
              ${p.uid === uid || mod ? '<button type="button" class="mini merah" data-a="hapus">Hapus</button>' : ''}
            </span></span></div>`;
        }).join('')}</div>`
      : '<p class="kecil">Masih kosong. Jadilah yang pertama!</p>';
  }
  el.innerHTML = `<p class="kecil">${esc(m.ajak)}</p>
    <form id="pF">${m.f.map(([l, ph, n], i) => `<label for="pf${i}">${esc(l)}</label>${n > 60 ? `<textarea id="pf${i}" data-f="${i}" maxlength="${n}" rows="2" placeholder="${esc(ph)}"></textarea>` : `<input id="pf${i}" data-f="${i}" maxlength="${n}" placeholder="${esc(ph)}">`}`).join('')}
    <p class="err" id="pE"></p><div class="baris" style="margin-top:4px"><button class="btn" type="submit">${esc(m.tombol)}</button></div></form>
    <div id="pL" style="margin-top:12px">${isiList}</div>`;
  el.querySelectorAll('#pF [data-f]').forEach((x, i) => { if (draf[i]) x.value = draf[i]; });
  el.querySelector('#pF').onsubmit = e => {
    e.preventDefault();
    if (!siap()) return;
    const v = [...el.querySelectorAll('#pF [data-f]')].map((x, i) => bersih(x.value, m.f[i][2]));
    const E = el.querySelector('#pE');
    let d;
    if (m.f.length === 1) { if (v[0].length < 4) { E.textContent = 'Tulis sedikit lebih panjang ya.'; return; } d = { a: '', b: '', c: sensor(v[0]) }; }
    else { if (v[0].length < 2) { E.textContent = `Isi “${m.f[0][0]}” dulu ya.`; return; } d = { a: sensor(v[0]), b: sensor(v[1] || ''), c: sensor(v[2] || '') }; }
    if (Date.now() - (LS.get('mejaPapanT', 0) || 0) < 20000) { E.textContent = 'Tunggu 20 detik sebelum menulis lagi.'; return; }
    LS.set('mejaPapanT', Date.now());
    K.L.db.push('mejaPapan/' + m.id, { uid, n: nama(), ...d, t: TS });
    el.querySelectorAll('#pF [data-f]').forEach(x => { x.value = ''; });
    toast('Terpasang ✔'); Prog.lapor('mejaSeru');
  };
  el.querySelectorAll('[data-hapus]').forEach(b => b.onclick = () => hapus(b.dataset.hapus));
  el.querySelectorAll('.mejaPapan > div').forEach(r => {
    const p = list.find(x => x.k === r.dataset.k); if (!p) return;
    r.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'hapus') return hapus(p.k);
      if (a === 'profil') { const o = K.lain.get(p.uid); if (o) Sosial.bukaProfil(o); return; }
      if (!siap()) return;
      const ya = !(p.s && p.s[uid]);
      K.L.db.set(`mejaPapan/${m.id}/${p.k}/s/${uid}`, ya ? true : null).catch(() => toast('Gagal. Coba lagi.'));
      if (ya) Prog.lapor('mejaSeru');
    });
  });
}
function hapus(k) {
  if (!confirm('Hapus tulisan ini?')) return;
  K.L.db.set(`mejaPapan/${buka.m.id}/${k}`, null).then(() => toast('Dihapus')).catch(() => toast('Gagal menghapus.'));
}

// ---------------------------------------------------------------- 🎲 SERU
function gambarSeru(el) {
  const m = buka.m, uid = K.L.uid;
  const [a, b] = m.pilih[hariKe() % m.pilih.length];
  const v = Object.values(D.vote || {}), na = v.filter(x => x === 'a').length, nb = v.filter(x => x === 'b').length, tot = na + nb;
  const saya = D.vote[uid];
  const pa = tot ? Math.round(na / tot * 100) : 0, pb = tot ? 100 - pa : 0;
  const tombolPilih = (k, t, n, p) => `<button type="button" class="pilihMana ${saya === k ? 'on' : ''}" data-v="${k}"><b>${esc(t)}</b>${saya ? `<span class="bar" style="--p:${p}%"></span><small>${p}% · ${n} suara</small>` : ''}</button>`;
  el.innerHTML = `<h3>🤔 Pilih Mana? <small class="kecil">(ganti tiap hari)</small></h3>
    <div class="pilihDua">${tombolPilih('a', a, na, pa)}<span>atau</span>${tombolPilih('b', b, nb, pb)}</div>
    <p class="kecil">${saya ? 'Pilihanmu sudah tercatat. Bahas alasannya di 💬 Ngobrol!' : 'Pilih dulu buat lihat hasil voting orang-orang.'}</p>
    <h3>🍾 Truth or Dare</h3><p class="kecil">Putar botol: salah satu yang duduk di meja ini kena TRUTH atau DARE, hasilnya muncul di obrolan meja.</p>
    <div class="baris"><button class="btn" type="button" id="sTd">🍾 Putar botol</button></div>
    <h3>💡 Kartu Pemantik</h3>
    <div class="kartuPemantik" id="sK">${esc(acak(m.pemantik))}</div>
    <div class="baris"><button class="btn putih" type="button" id="sG">🔀 Ganti</button><button class="btn" type="button" id="sT">Tanya di obrolan meja</button></div>
    ${m.putarDestinasi ? `<h3>🎡 Putar Destinasi</h3><p class="kecil">Bingung mau liburan ke mana? Biar roda yang pilih!</p>
      <div class="kartuPemantik besar" id="sD">✈️ ?</div><div class="baris"><button class="btn" type="button" id="sP">Putar!</button><a class="btn putih" id="sM" target="_blank" rel="noopener" hidden>📍 Lihat di peta</a></div>` : ''}
    ${m.roda ? `<h3>🎡 Roda Tantangan Random</h3><p class="kecil">Putar dan kerjakan tantangan ringannya di obrolan meja.</p>
      <div class="kartuPemantik besar" id="sR">🎲 ?</div><div class="baris"><button class="btn" type="button" id="sP">Putar!</button></div>` : ''}`;
  el.querySelectorAll('[data-v]').forEach(t => t.onclick = () => {
    if (!siap()) return;
    const k = t.dataset.v;
    K.L.db.set(`mejaVote/${m.id}/${hariIni()}/${uid}`, k).catch(() => toast('Gagal memilih. Coba lagi.'));
    if (!saya) Prog.lapor('mejaSeru');
  });
  el.querySelector('#sTd').onclick = () => { const h = K.Aktivitas.putarBotol(m.id, [{ uid: uid, nama: K.prof?.n || 'Aku' }, ...diMeja(buka.topik)]); if (h) { buka.tab = 'ngobrol'; gambar(); } };
  const kartu = el.querySelector('#sK');
  el.querySelector('#sG').onclick = () => { let t; do t = acak(m.pemantik); while (t === kartu.textContent && m.pemantik.length > 1); kartu.textContent = t; };
  el.querySelector('#sT').onclick = () => { if (kirimChat('❓ ' + kartu.textContent)) { buka.tab = 'ngobrol'; gambar(); } };
  const P = el.querySelector('#sP');
  if (P) P.onclick = () => {
    const isi = m.putarDestinasi ? DESTINASI : RODA, out = el.querySelector(m.putarDestinasi ? '#sD' : '#sR');
    P.disabled = true; let n = 0; const jml = 14 + Math.floor(Math.random() * 8);
    const putar = () => {
      out.textContent = acak(isi); out.classList.toggle('kedip');
      if (++n < jml) return setTimeout(putar, 40 + n * 12);
      P.disabled = false; out.classList.remove('kedip'); out.classList.add('dapat');
      setTimeout(() => out.classList.remove('dapat'), 700);
      if (m.putarDestinasi) { const M = el.querySelector('#sM'); M.href = 'https://www.google.com/maps/search/' + cari(out.textContent); M.hidden = false; }
      else Prog.lapor('mejaSeru');
    };
    putar();
  };
}
