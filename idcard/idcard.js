import { CFG, TUJUAN, STATUS, bersih, igBersih, kasar, hash, fmt, esc, profil, simpanProfil } from '../js/common.js?v=202611251741';
import { bukaDB } from '../js/db.js?v=202611251741';
import { buatLayanan } from '../js/layanan.js?v=202611251741';

const $ = id => document.getElementById(id);
const cv = $('kartu'), x = cv.getContext('2d');
const W = cv.width, H = cv.height;
let foto = null, nomor = null, siap = false, L = null, daftar = [];

$('div').innerHTML = Object.entries(TUJUAN).map(([k, v]) => `<option value="${k}">${v.ikon} ${esc(v.nama)}</option>`).join('');
$('st').innerHTML = STATUS.map(d => `<option>${esc(d)}</option>`).join('');
$('kaki').innerHTML = `${esc(CFG.namaPT)} · perusahaan fiktif untuk seru-seruan` + (CFG.instagram ? ` · <a href="https://www.instagram.com/${encodeURIComponent(CFG.instagram)}/" target="_blank" rel="noopener">@${esc(CFG.instagram)}</a>` : '');

const p = profil();
if (p) {
  $('nama').value = p.n || ''; $('ig').value = p.ig ? '@' + p.ig : '';
  if (p.tj) $('div').value = p.tj; if (p.s) $('st').value = p.s;
}

function data() {
  return { n: bersih($('nama').value, 20), ig: igBersih($('ig').value), tj: $('div').value, s: $('st').value };
}
function nik(d) {
  const h = hash((d.n + '|' + d.ig).toLowerCase()).toString(16).toUpperCase().padStart(8, '0');
  return `MCS-${new Date().getFullYear()}-${h.slice(0, 4)}-${h.slice(4)}`;
}
function bulat(X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function hati(cx, cy, s) {
  x.beginPath(); x.moveTo(cx, cy + s * 0.9);
  x.bezierCurveTo(cx - s * 1.3, cy, cx - s * 0.9, cy - s * 1.1, cx, cy - s * 0.45);
  x.bezierCurveTo(cx + s * 0.9, cy - s * 1.1, cx + s * 1.3, cy, cx, cy + s * 0.9); x.fill();
}

function gambar() {
  const d = data();
  x.clearRect(0, 0, W, H);
  // dasar
  x.fillStyle = '#fff6ef'; bulat(0, 0, W, H, 40); x.fill();
  // motif hati samar
  x.fillStyle = 'rgba(255,79,123,.07)';
  for (let i = 0; i < 40; i++) hati(40 + (i * 137) % W, 300 + ((i * 263) % (H - 300)), 14 + (i % 4) * 6);
  // pita atas
  x.fillStyle = '#ff4f7b'; bulat(0, 0, W, 250, [40, 40, 0, 0]); x.fill();
  x.fillStyle = '#2a1420'; x.fillRect(0, 250, W, 10);
  x.fillStyle = '#fff6ef'; bulat(W / 2 - 70, 34, 140, 26, 13); x.fill(); // lubang lanyard
  x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = '700 50px Fredoka, Nunito, sans-serif'; x.fillText('❤ ' + CFG.namaPT.toUpperCase(), W / 2, 130, W - 60);
  x.font = '900 24px Nunito, sans-serif'; x.fillStyle = '#ffe1e9'; x.fillText('KARTU TAMU RESMI', W / 2, 180);
  x.font = '800 20px Nunito, sans-serif'; x.fillText('Cari jodoh · cari teman · curhat', W / 2, 214);

  // foto
  const fx = W / 2 - 150, fy = 300, fw = 300, fh = 340;
  x.save(); bulat(fx, fy, fw, fh, 28); x.fillStyle = '#ffd9e2'; x.fill(); x.clip();
  if (foto) {
    const s = Math.max(fw / foto.width, fh / foto.height), iw = foto.width * s, ih = foto.height * s;
    x.drawImage(foto, fx + (fw - iw) / 2, fy + (fh - ih) / 2, iw, ih);
  } else {
    x.fillStyle = '#ff8fab'; hati(W / 2, fy + fh / 2 - 10, 80);
    x.fillStyle = '#8a6b77'; x.font = '800 20px Nunito, sans-serif'; x.fillText('tanpa foto', W / 2, fy + fh - 30);
  }
  x.restore();
  x.lineWidth = 8; x.strokeStyle = '#2a1420'; bulat(fx, fy, fw, fh, 28); x.stroke();

  // nama
  x.fillStyle = '#2a1420'; x.font = '700 64px Fredoka, Nunito, sans-serif';
  x.fillText(d.n || 'Nama Kamu', W / 2, 720, W - 80);
  x.font = '800 28px Nunito, sans-serif'; x.fillStyle = '#8a6b77';
  x.fillText(d.ig ? '@' + d.ig : ' ', W / 2, 760, W - 80);

  // divisi & status
  x.font = '900 28px Nunito, sans-serif';
  const T = TUJUAN[d.tj] || TUJUAN.teman;
  const dv = T.ikon + ' Tujuan: ' + T.nama, dw = Math.min(W - 80, x.measureText(dv).width + 44);
  x.fillStyle = T.warna; bulat((W - dw) / 2, 790, dw, 54, 27); x.fill();
  x.fillStyle = '#fff'; x.fillText(dv, W / 2, 827, W - 110);
  x.font = '800 24px Nunito, sans-serif'; x.fillStyle = '#8a6b77';
  x.fillText(d.tj === 'jodoh' ? 'Status hati: ' + d.s : d.tj === 'curhat' ? 'Siap didengar, siap mendengar' : 'Terbuka untuk teman baru', W / 2, 884, W - 80);

  // garis info
  x.textAlign = 'left'; x.fillStyle = '#2a1420';
  x.font = '700 22px "JetBrains Mono", ui-monospace, monospace';
  x.fillText('NIK      ' + nik(d), 60, 950);
  x.fillText('NO.      ' + (nomor ? 'Tamu ke-' + fmt(nomor) : '—'), 60, 984);
  x.fillText('BERLAKU  ' + (d.tj === 'jodoh' ? 'Sampai ketemu jodoh' : d.tj === 'curhat' ? 'Sampai hati lega' : 'Selamanya, namanya juga teman'), 60, 1018);

  // barcode
  let h = hash(nik(d)), bx = 60;
  while (bx < W - 230) { const w = 2 + (h & 3) * 2; x.fillRect(bx, 1040, w, 50); bx += w + 3 + ((h >> 2) & 1) * 3; h = (h >>> 3) | ((h & 7) << 29); if (!h) h = 0x9e3779b9; }
  // tanda tangan HRD
  x.strokeStyle = '#3a6ea5'; x.lineWidth = 3; x.beginPath();
  x.moveTo(W - 200, 1070); x.bezierCurveTo(W - 180, 1020, W - 160, 1090, W - 140, 1050); x.bezierCurveTo(W - 120, 1020, W - 100, 1080, W - 70, 1040); x.stroke();
  x.fillStyle = '#8a6b77'; x.font = '800 14px Nunito, sans-serif'; x.textAlign = 'center'; x.fillText('Direktur Utama', W - 135, 1100);
}

function tampilKuota() {
  const n = daftar.length;
  $('kT').textContent = `${fmt(n)} / ${fmt(CFG.kuota)}`;
  $('kB').style.width = Math.max(0.4, Math.min(100, n / CFG.kuota * 100)).toFixed(2) + '%';
}

['nama', 'ig', 'div', 'st'].forEach(id => $(id).addEventListener('input', () => { nomor = null; siap = false; $('unduh').disabled = true; $('bagi').hidden = true; gambar(); }));
$('foto').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const url = URL.createObjectURL(f), img = new Image();
  img.onload = () => { foto = img; gambar(); };
  img.onerror = () => { $('status').className = 'status no'; $('status').textContent = 'Foto tidak bisa dibaca. Coba foto lain.'; };
  img.src = url;
});

$('f').addEventListener('submit', async e => {
  e.preventDefault();
  const d = data(), st = $('status');
  if (d.n.length < 2) { st.className = 'status no'; st.textContent = 'Nama minimal 2 huruf.'; return; }
  if (kasar(d.n) || kasar(d.ig)) { st.className = 'status no'; st.textContent = 'Pakai nama yang lebih sopan ya.'; return; }
  st.className = 'status'; st.textContent = 'Mengambil nomor karyawan…';
  $('buat').disabled = true;
  const lama = profil() || {};
  simpanProfil({ ...lama, ...d });
  try {
    if (L) {
      await L.daftarTamu({ ...(profil() || {}), ...d });
      await new Promise(r => setTimeout(r, 600));
      const urut = [...daftar].sort((a, b) => (a.t || 0) - (b.t || 0));
      const i = urut.findIndex(k => k.uid === L.uid);
      nomor = i >= 0 ? i + 1 : null;
    }
  } catch (err) { console.warn(err); }
  $('buat').disabled = false;
  gambar(); siap = true;
  try { localStorage.setItem('ptmcs_kartuDicetak', 'true'); } catch (e) {}
  $('unduh').disabled = false;
  $('bagi').hidden = !navigator.canShare;
  st.className = 'status ok';
  st.textContent = nomor ? `Selamat! Kamu tamu ke-${fmt(nomor)}. Namamu sudah tercatat di Buku Tamu.` : 'Kartu tamu siap diunduh.';
});

function blob() { return new Promise(r => cv.toBlob(r, 'image/png')); }
const namaFile = () => `kartu-tamu-${(data().n || 'karyawan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
$('unduh').addEventListener('click', async () => {
  const b = await blob(); const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = namaFile(); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});
$('bagi').addEventListener('click', async () => {
  const f = new File([await blob()], namaFile(), { type: 'image/png' });
  const isi = { files: [f], title: 'Kartu Tamu ' + CFG.namaPT, text: `Aku resmi tamu ${CFG.namaPT}! ${(TUJUAN[data().tj] || TUJUAN.teman).ikon} Yuk mampir ke kantornya.` };
  if (navigator.canShare && navigator.canShare(isi)) navigator.share(isi).catch(() => {});
  else $('unduh').click();
});

(async () => {
  gambar();
  try { await Promise.race([Promise.all(['700 50px Fredoka', '900 24px Nunito', '800 24px Nunito', '700 22px "JetBrains Mono"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 3000))]); } catch (e) {}
  gambar();
  tampilKuota();
  try {
    L = buatLayanan(await bukaDB());
    L.db.on('tamu', o => { daftar = Object.values(o || {}).filter(k => k && k.n); tampilKuota(); });
    let ang = null, peran = null;
    const cek = () => {
      const ok = !!(ang || peran);
      $('buat').disabled = !ok;
      if (ok && ang) { $('nama').value = ang.n; $('div').value = ang.tj; $('nama').readOnly = true; $('div').disabled = true; gambar(); }
      $('status').className = ok ? 'status' : 'status no';
      $('status').innerHTML = ok ? '' : 'Kartu Tamu hanya untuk tamu resmi. <a href="../kantor/index.html#daftar">Daftar dulu di kantor →</a> lalu tunggu persetujuan Direktur.';
    };
    L.db.on('anggota/' + L.uid, o => { ang = o; cek(); });
    L.db.on('peran/' + L.uid, o => { peran = o; cek(); });
  } catch (e) { console.warn(e); }
})();
