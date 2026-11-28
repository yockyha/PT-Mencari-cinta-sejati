// =====================================================================
//  Foto profil & Dinding Foto (galeri di lobi).
//  Foto dikompres di perangkat (JPEG) lalu disimpan di Realtime Database:
//   fotoProfil/<uid>        foto profil 256×256 (±15 KB)
//   galeri/<id>             info foto + thumbnail kecil (untuk dinding & daftar)
//   galeriData/<id>         foto ukuran penuh (maks. ±960 px), diunduh saat dibuka
//   galeriKu/<uid>          waktu unggah terakhir (dibatasi 1 foto / menit oleh aturan Firebase)
// =====================================================================
import { LS, bersih, esc, fmt, kasar, sensor } from '../js/common.js?v=202611270858';
import { TS, kunciBaru } from '../js/db.js?v=202611270858';
import { $, K, toast, bukaKartu, tutupKartu, tanggalJam } from './ui.js?v=202611270858';
import * as Prog from './progres.js?v=202611270858';

const siap = () => { if (!K.resmi()) { toast('👀 Daftar dulu untuk memakai foto.'); K.bukaDaftar(); return false; } if (K.terkunci) { toast('Kamu belum bisa berinteraksi sekarang.'); return false; } return true; };
const staf = () => !!(K.L && K.peran[K.L.uid]);
const batasHarian = () => (staf() ? 99 : Prog.vvipSaya() ? 20 : Prog.vipSaya() ? 10 : 3);

// ---------------------------------------------------------------- KOMPRES
function muatGambar(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak bisa dibaca')); };
    img.decoding = 'async'; img.src = url;
  });
}
// persegi: potong tengah jadi kotak; maks: sisi terpanjang; batas: panjang maksimum data URL
export function kompres(img, { maks = 960, persegi = false, batas = 200000, kualitas = 0.8 } = {}) {
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (persegi) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
  const skala = Math.min(1, maks / Math.max(sw, sh));
  const c = document.createElement('canvas'); c.width = Math.round(sw * skala); c.height = Math.round(sh * skala);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  let q = kualitas, d = c.toDataURL('image/jpeg', q);
  while (d.length > batas && q > 0.35) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
  if (d.length > batas) return '';
  return d;
}
// Input file harus menempel di halaman: Safari iPhone/iPad tidak mengirim event 'change'
// untuk input yang tidak ada di DOM, sehingga foto yang dipilih "hilang" begitu saja.
function pilihFile() {
  document.querySelectorAll('input.pilihFoto').forEach(x => x.remove()); // sisa pemilihan sebelumnya
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.className = 'pilihFoto';
    i.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(i);
    let beres = false;
    const ambil = () => { if (beres) return; const f = i.files && i.files[0]; if (!f) return; beres = true; setTimeout(() => i.remove(), 1500); res(f); };
    i.addEventListener('change', ambil); i.addEventListener('input', ambil);
    i.click();
  });
}
const fileGambar = f => !!f && (/^image\//.test(f.type || '') || (!f.type && /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(f.name || '')));

// ---------------------------------------------------------------- FOTO PROFIL
const cache = {}; // uid -> { p: Promise<url|''>, t }  (diambil ulang setelah 2 menit supaya foto baru orang lain ikut terlihat)
export function fotoProfil(uid, segar = false) {
  if (!K.L || !uid || uid.startsWith('bot:')) return Promise.resolve('');
  const c = cache[uid];
  if (!c || segar || Date.now() - c.t > 120000) cache[uid] = { p: K.L.db.get(`fotoProfil/${uid}/d`).then(v => (typeof v === 'string' && v.startsWith('data:image/jpeg') ? v : ''), () => ''), t: Date.now() };
  return cache[uid].p;
}
// <img data-av="uid"> di dalam el diisi foto profilnya (atau inisial bila tidak ada)
export function isiAvatar(el) {
  el.querySelectorAll('[data-av]:not([data-av-ok])').forEach(a => {
    a.setAttribute('data-av-ok', '1');
    fotoProfil(a.dataset.av).then(u => { if (u) { a.style.backgroundImage = `url("${u}")`; a.classList.add('ada'); } });
  });
}
export const htmlAvatar = (uid, nama, kelas = '') => `<span class="avatar ${kelas}" data-av="${esc(uid)}" aria-hidden="true">${esc((bersih(nama, 20) || '?').slice(0, 1).toUpperCase())}</span>`;

export async function gantiFotoProfil(selesai) {
  if (!siap()) return;
  const f = await pilihFile(); if (!f) return;
  if (!fileGambar(f)) { toast('Pilih file gambar (JPG/PNG) ya.'); return; }
  toast('⏳ Memproses foto…', 8000);
  try {
    const img = await muatGambar(f);
    const d = kompres(img, { maks: 256, persegi: true, batas: 40000, kualitas: 0.82 });
    if (!d) { toast('Fotonya terlalu besar. Coba foto lain.'); return; }
    bukaKartu(`<h2>📷 Foto profil baru</h2><div class="avatarPratinjau" style="background-image:url('${d}')"></div>
      <p class="kecil">Pakai foto yang sopan. Foto profil terlihat oleh tamu lain. Foto yang melanggar aturan akan dihapus Direktur.</p>
      <div class="baris"><button class="btn" type="button" id="fpS">Pakai foto ini</button><button class="btn putih" type="button" id="fpB">Batal</button></div>`, {
      pasang(i) {
        i.querySelector('#fpB').onclick = () => (selesai ? selesai() : tutupKartu());
        i.querySelector('#fpS').onclick = async () => {
          const b = i.querySelector('#fpS'); b.disabled = true; b.textContent = '⏳ Menyimpan…';
          try {
            await K.L.db.set('fotoProfil/' + K.L.uid, { d, t: TS });
            cache[K.L.uid] = { p: Promise.resolve(d), t: Date.now() };
            segarkanAvatar(K.L.uid, d);
            toast('Foto profil diperbarui ✨'); Prog.lapor('fotoProfil');
            selesai ? selesai() : tutupKartu();
          } catch (e) {
            console.warn('fotoProfil', e);
            b.disabled = false; b.textContent = 'Pakai foto ini';
            toast(/permission|denied/i.test(String(e && (e.code || e.message))) ? 'Foto belum bisa disimpan: akunmu belum di-ACC atau sedang dibatasi.' : 'Gagal menyimpan foto. Periksa koneksi lalu coba lagi.', 4500);
          }
        };
      },
    });
  } catch (e) { toast('Gambar tidak bisa dibaca. Coba foto lain atau format JPG/PNG.', 4000); }
}
export async function hapusFotoProfil(uid = K.L.uid) {
  await K.L.db.set('fotoProfil/' + uid, null);
  cache[uid] = { p: Promise.resolve(''), t: Date.now() };
  segarkanAvatar(uid, '');
}
// perbarui semua avatar milik uid yang sedang tampil di layar
function segarkanAvatar(uid, d) {
  document.querySelectorAll(`[data-av="${CSS.escape(uid)}"]`).forEach(a => { a.style.backgroundImage = d ? `url("${d}")` : ''; a.classList.toggle('ada', !!d); });
}

// ---------------------------------------------------------------- DINDING FOTO (GALERI)
let galeri = [];
const gambarThumb = {}; // id -> HTMLImageElement (untuk dinding 3D)
export const daftarGaleri = () => galeri;
export function mulai() {
  K.L.db.on('galeri', o => {
    galeri = Object.entries(o || {}).filter(([, v]) => v && v.th).map(([k, v]) => ({ ...v, k })).sort((a, b) => (a.t || 0) - (b.t || 0));
    for (const g of galeri.slice(-6)) if (!gambarThumb[g.k]) { const im = new Image(); im.onload = () => K.gambarDindingFoto && K.gambarDindingFoto(); im.src = g.th; gambarThumb[g.k] = im; }
    K.gambarDindingFoto && K.gambarDindingFoto();
    if (layar === 'galeri') gambarGaleri();
  }, { limit: 30 });
}
export const thumbDinding = () => galeri.slice(-6).reverse().map(g => ({ ...g, img: gambarThumb[g.k] })).filter(g => g.img && g.img.complete);

let layar = '';
export function bukaGaleri() {
  layar = 'galeri';
  bukaKartu(`<h2>🖼️ Dinding Foto</h2>
    <p class="kecil">Bagikan momen seru: foto liburan, makanan, hewan peliharaan, atau karya kamu. Hanya untuk tamu resmi. Tetap sopan ya!</p>
    <div class="baris" style="margin-top:4px"><button class="btn" type="button" id="gU">＋ Unggah foto</button></div>
    <div class="gridFoto" id="gL"></div>`, {
    tutup() { if (layar === 'galeri') layar = ''; },
    pasang(isi) { isi.querySelector('#gU').onclick = () => bukaUnggah(); gambarGaleri(); },
  });
}
function gambarGaleri() {
  const el = document.querySelector('#kartu #gL'); if (!el) return;
  const l = galeri.filter(g => !K.sembunyi.has(g.uid)).slice().reverse();
  el.innerHTML = l.length ? l.map(g => `<button type="button" class="kotakFoto" data-id="${esc(g.k)}"><img src="${g.th}" alt="${esc(bersih(g.c, 60) || 'Foto dari ' + bersih(g.n, 16))}" loading="lazy"><span>❤ ${fmt(g.s ? Object.keys(g.s).length : 0)} · ${esc(bersih(g.n, 16))}</span></button>`).join('')
    : '<p class="kecil">Belum ada foto. Jadilah yang pertama!</p>';
  el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => bukaFoto(b.dataset.id));
}

async function bukaUnggah() {
  if (!siap()) return;
  const kunci = 'unggah_' + new Date().toDateString(), sudah = LS.get(kunci, 0) || 0;
  if (sudah >= batasHarian()) { toast(`Batas unggah hari ini ${batasHarian()} foto.${Prog.vipSaya() ? '' : ' VIP bisa 10, VVIP 20 foto per hari.'}`, 4000); return; }
  const f = await pilihFile(); if (!f) return;
  if (!fileGambar(f)) { toast('Pilih file gambar (JPG/PNG) ya.'); return; }
  toast('⏳ Memproses foto…', 8000);
  let img;
  try { img = await muatGambar(f); } catch (e) { toast('Gambar tidak bisa dibaca. Coba format JPG/PNG.'); return; }
  const besar = kompres(img, { maks: 960, batas: 200000, kualitas: 0.78 }), kecil = kompres(img, { maks: 300, batas: 28000, kualitas: 0.7 });
  if (!besar || !kecil) { toast('Fotonya terlalu besar. Coba foto lain.'); return; }
  bukaKartu(`<h2>＋ Unggah ke Dinding Foto</h2><img class="fotoBesar" src="${besar}" alt="Pratinjau foto">
    <label for="uC">Keterangan (opsional)</label><input id="uC" maxlength="100" placeholder="contoh: Sunset di Pantai Parangtritis 🌅">
    <label class="cek"><input type="checkbox" id="uOk"> Foto ini milikku / boleh kubagikan, sopan, dan tidak menampilkan data pribadi orang lain</label>
    <p class="err" id="uE"></p>
    <div class="baris"><button class="btn" type="button" id="uK">Unggah</button><button class="btn putih" type="button" id="uB">Batal</button></div>
    <p class="kecil">Sisa unggahan hari ini: ${fmt(batasHarian() - sudah)} foto.</p>`, {
    pasang(i) {
      i.querySelector('#uB').onclick = bukaGaleri;
      i.querySelector('#uK').onclick = async () => {
        const c = bersih(i.querySelector('#uC').value, 100), E = i.querySelector('#uE');
        if (!i.querySelector('#uOk').checked) { E.textContent = 'Centang pernyataan dulu ya.'; return; }
        if (kasar(c)) { E.textContent = 'Pakai kata-kata yang lebih sopan ya.'; return; }
        E.textContent = 'Mengunggah…'; i.querySelector('#uK').disabled = true;
        const L = K.L, id = kunciBaru();
        try {
          await L.db.update('', {
            [`galeri/${id}`]: { uid: L.uid, n: bersih(K.prof.n, 30), c: sensor(c), th: kecil, t: TS },
            [`galeriData/${id}`]: { d: besar },
            [`galeriKu/${L.uid}`]: TS,
          });
          LS.set(kunci, sudah + 1);
          toast('Foto terpasang di Dinding Foto 🖼️'); Prog.lapor('galeri');
          bukaGaleri();
        } catch (e) { console.warn(e); E.textContent = 'Gagal mengunggah. Tunggu 1 menit setelah unggahan terakhir, lalu coba lagi.'; i.querySelector('#uK').disabled = false; }
      };
    },
  });
}

async function bukaFoto(id) {
  const g = galeri.find(x => x.k === id); if (!g) return;
  const L = K.L, milik = g.uid === L.uid, s = g.s ? Object.keys(g.s).length : 0, suka = !!(g.s && g.s[L.uid]);
  bukaKartu(`<div class="kepalaRuang"><button type="button" class="mini putih" id="fB">← Dinding</button><h2>${htmlAvatar(g.uid, g.n, 'kecil')} ${esc(bersih(g.n, 30))}</h2></div>
    <img class="fotoBesar" id="fI" src="${g.th}" alt="${esc(bersih(g.c, 100) || 'Foto')}">
    ${g.c ? `<p>${esc(g.c)}</p>` : ''}<p class="kecil">${esc(tanggalJam(g.t))}</p>
    <div class="baris"><button class="btn ${suka ? '' : 'putih'}" type="button" id="fS">❤ ${fmt(s)}</button>${milik || staf() ? '<button class="btn merah" type="button" id="fH">Hapus</button>' : '<button class="btn putih" type="button" id="fL">🚩 Laporkan</button>'}</div>`, {
    pasang(i) {
      isiAvatar(i);
      L.db.get(`galeriData/${id}/d`).then(d => { const im = i.querySelector('#fI'); if (d && im) im.src = d; }).catch(() => {});
      i.querySelector('#fB').onclick = bukaGaleri;
      i.querySelector('#fS').onclick = () => { if (!siap()) return; L.db.set(`galeri/${id}/s/${L.uid}`, suka ? null : true).then(() => bukaFoto(id)).catch(() => toast('Gagal.')); };
      const h = i.querySelector('#fH');
      if (h) h.onclick = async () => { if (!confirm('Hapus foto ini?')) return; try { await L.db.update('', { [`galeri/${id}`]: null, [`galeriData/${id}`]: null }); toast('Foto dihapus.'); bukaGaleri(); } catch (e) { toast('Gagal menghapus.'); } };
      const lp = i.querySelector('#fL');
      if (lp) lp.onclick = () => { if (!siap()) return; L.lapor(g.uid, g.n, 'Foto tidak pantas di Dinding Foto: ' + id); toast('Laporan terkirim ke Direktur 🙏'); };
    },
  });
}
