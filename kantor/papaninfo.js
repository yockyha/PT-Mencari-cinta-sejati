// =====================================================================
//  PAPAN INFORMASI: layar LED raksasa di halaman depan (dekat pintu masuk).
//  Semua orang bisa membaca; hanya Direktur yang menulis, menyematkan,
//  dan menghapus info. Info bergantian otomatis seperti slide, dengan
//  lampu LED berjalan, jam WIB, dan teks berjalan di bawah.
//  Data: papanInfo/<id> { j: judul, m: isi, ik: ikon, w: warna, pin, t }
// =====================================================================
import { esc, bersih } from '../js/common.js?v=202611280725';
import { TS, kunciBaru } from '../js/db.js?v=202611280725';
import { K, toast, bukaKartu, tutupKartu, tanggalJam } from './ui.js?v=202611280725';

export const TEMA = {
  pink: { nama: 'Pink', c: '#ff4f7b' }, emas: { nama: 'Emas', c: '#ffd23f' }, biru: { nama: 'Biru', c: '#3a9bdc' },
  hijau: { nama: 'Hijau', c: '#2fb57a' }, ungu: { nama: 'Ungu', c: '#9b5cf0' }, merah: { nama: 'Merah (penting)', c: '#e63946' },
};
const IKON = ['📢', '🎉', '💘', '📅', '🎁', '⚠️', '🆕', '🎬', '🏆', '☕', '🔥', '💡'];
let INFO = {}, awal = true;
const dir = () => !!(K.L && K.peran[K.L.uid] === 'direktur');
export const daftar = () => Object.entries(INFO || {}).filter(([, v]) => v && v.j).sort((a, b) => (b[1].pin ? 1 : 0) - (a[1].pin ? 1 : 0) || (b[1].t || 0) - (a[1].t || 0));

export function mulai(ubah) {
  K.L.db.on('papanInfo', v => {
    const lama = INFO; INFO = v || {};
    if (!awal) for (const [id, d] of Object.entries(INFO)) if (d && !lama[id] && Date.now() - (d.t || 0) < 120000)
      setTimeout(() => { if (INFO[id] && !dir()) { toast(`📢 Info baru di Papan Informasi: ${INFO[id].j}`, 6500); } }, 1500); // tunggu: tulisan yang ditolak server ikut hilang
    awal = false; ubah && ubah();
  });
}

// ---------------------------------------------------------------- GAMBAR LAYAR LED
function bungkus(c, teks, maks) {
  const out = [];
  for (const par of String(teks).split('\n')) {
    let b = '';
    for (const k of par.split(' ')) { const t = b ? b + ' ' + k : k; if (c.measureText(t).width > maks && b) { out.push(b); b = k; } else b = t; }
    out.push(b);
  }
  return out;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const FD = (px) => `700 ${px}px Fredoka, Nunito, sans-serif`, FB = (px, w = 800) => `${w} ${px}px Nunito, sans-serif`;

export function gambar(c, w, h) {
  const now = performance.now() / 1000, l = daftar();
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#160c1c'); g.addColorStop(1, '#2a1420'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  // lampu LED berjalan di bingkai
  const keliling = [], sel = 26;
  for (let x = 13; x < w; x += sel) keliling.push([x, 13], [w - x, h - 13]);
  for (let y = 13 + sel; y < h - 13; y += sel) keliling.push([w - 13, y], [13, h - y]);
  keliling.forEach(([x, y], i) => { const n = (Math.sin(i * 0.55 - now * 7) + 1) / 2; c.fillStyle = n > 0.6 ? (i % 2 ? '#ffd23f' : '#ff4f7b') : '#3a2430'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); });
  // kepala: judul + jam WIB
  c.fillStyle = '#ff4f7b'; rr(c, 34, 32, w - 68, 74, 18); c.fill();
  c.fillStyle = '#fff'; c.font = FD(44); c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('📢 PAPAN INFORMASI', 58, 70);
  c.textAlign = 'right'; c.font = FB(30, 900);
  let jam = ''; try { jam = new Date().toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }); } catch { /* */ }
  c.fillText((Math.floor(now * 2) % 2 ? '● ' : '○ ') + jam + ' WIB', w - 58, 70);
  // isi: slide bergantian
  const Y0 = 128, H0 = h - Y0 - 112;
  if (!l.length) {
    c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.font = FD(64); c.fillText('💘 Selamat datang!', w / 2, Y0 + 120);
    c.fillStyle = '#fff'; c.font = FB(36, 800); c.fillText('Info & pengumuman dari Direktur akan tampil di sini.', w / 2, Y0 + 210, w - 120);
    c.fillStyle = '#ffb3c6'; c.font = FB(30, 800); c.fillText('Pantau terus ya ✨', w / 2, Y0 + 270);
  } else {
    const DUR = 9, idx = Math.floor(now / DUR) % l.length, fase = (now % DUR) / DUR;
    const geser = fase < 0.07 ? (1 - fase / 0.07) : 0, gx = Math.pow(geser, 2) * w;
    const [, d] = l[idx], warna = (TEMA[d.w] || TEMA.pink).c;
    c.save(); c.translate(gx, 0);
    c.fillStyle = 'rgba(255,246,239,.06)'; rr(c, 48, Y0, w - 96, H0, 26); c.fill();
    c.fillStyle = warna; rr(c, 48, Y0, 16, H0, 8); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '120px system-ui, sans-serif';
    const bob = Math.sin(now * 3) * 6; c.fillText(d.ik || '📢', 170, Y0 + H0 / 2 - 20 + bob);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = warna; c.font = FD(58);
    const jb = bungkus(c, d.j, w - 400).slice(0, 2); jb.forEach((s, i) => c.fillText(s, 290, Y0 + 80 + i * 64, w - 380));
    c.fillStyle = '#fff6ef'; c.font = FB(36, 800);
    const ib = bungkus(c, d.m || '', w - 400), maks = jb.length > 1 ? 4 : 5;
    ib.slice(0, maks).forEach((s, i) => c.fillText(i === maks - 1 && ib.length > maks ? s + '…' : s, 290, Y0 + 80 + jb.length * 64 + 16 + i * 46, w - 380));
    c.font = FB(26, 800); c.fillStyle = '#c9a9b8';
    c.fillText(`${d.pin ? '📌 Disematkan · ' : ''}${tanggalJam(d.t)} · dari 👑 Direktur`, 290, Y0 + H0 - 26, w - 380);
    c.restore();
    // titik halaman + bar waktu
    l.forEach((_, i) => { c.fillStyle = i === idx ? '#ffd23f' : '#5a4050'; c.beginPath(); c.arc(w / 2 - (l.length - 1) * 14 + i * 28, Y0 + H0 + 22, i === idx ? 9 : 6, 0, 7); c.fill(); });
    c.fillStyle = warna; c.fillRect(48, Y0 + H0 - 4, (w - 96) * fase, 4);
  }
  // teks berjalan
  const YB = h - 72;
  c.fillStyle = '#0b0710'; rr(c, 34, YB, w - 68, 46, 12); c.fill();
  c.save(); c.beginPath(); c.rect(40, YB, w - 80, 46); c.clip();
  c.fillStyle = '#ffd23f'; c.font = FB(28, 900); c.textBaseline = 'middle'; c.textAlign = 'left';
  const jalan = (l.length ? l.map(([, d]) => `${d.ik || '📢'} ${d.j}`).join('   ✦   ') : 'PT MENCARI CINTA SEJATI · buka 24 jam · cari jodoh, cari teman, atau curhat') + '   ✦   ketuk papan ini untuk membaca semua info   ✦   ';
  const tw = c.measureText(jalan).width, off = (now * 120) % tw;
  for (let x = 40 - off; x < w; x += tw) c.fillText(jalan, x, YB + 24);
  c.restore();
  // kilau layar
  const kil = c.createLinearGradient(0, 0, w, h); kil.addColorStop(0, 'rgba(255,255,255,.05)'); kil.addColorStop(0.5, 'rgba(255,255,255,0)'); c.fillStyle = kil; c.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------- KARTU: baca semua info + editor Direktur
export function buka(opsi = {}) {
  const l = daftar(), d = dir();
  bukaKartu(`<h2>📢 Papan Informasi</h2>
    ${d ? `<details class="kotakInfo" ${l.length && !opsi.tulis ? '' : 'open'}><summary><b>✍️ Tulis info baru</b></summary>
      <label for="piJ">Judul</label><input id="piJ" maxlength="60" placeholder="contoh: Speed Dating Jumat malam!">
      <label for="piM">Isi info</label><textarea id="piM" maxlength="400" rows="3" placeholder="Tulis detail infonya di sini…"></textarea>
      <label>Ikon</label><div class="sw teks" id="piI">${IKON.map((k, i) => `<button type="button" data-ik="${k}" class="${i ? '' : 'on'}">${k}</button>`).join('')}</div>
      <label>Warna</label><div class="sw teks" id="piW">${Object.entries(TEMA).map(([k, v], i) => `<button type="button" data-w="${k}" class="${i ? '' : 'on'}" style="border-color:${v.c}">${esc(v.nama)}</button>`).join('')}</div>
      <label class="cek"><input type="checkbox" id="piP"> 📌 Sematkan (selalu tampil paling depan)</label>
      <p class="err" id="piE"></p><div class="baris"><button class="btn" type="button" id="piK">📢 Pasang di papan</button></div></details>` : ''}
    <small class="dirTag">👑 RESMI DARI DIREKTUR UTAMA</small>
    ${l.length ? `<div class="daftar infoList">${l.map(([id, v]) => `<div style="border-left:6px solid ${(TEMA[v.w] || TEMA.pink).c};padding-left:10px"><span><b>${esc(v.ik || '📢')} ${esc(v.j)}</b>${v.pin ? ' <small>📌</small>' : ''}<br>${esc(v.m || '').replace(/\n/g, '<br>')}<br><small>${esc(tanggalJam(v.t))}</small></span>${d ? `<span class="aksiInfo"><button type="button" class="mini putih" data-pin="${esc(id)}" title="Sematkan / lepas">${v.pin ? '📍 Lepas' : '📌'}</button> <button type="button" class="mini putih" data-hps="${esc(id)}" aria-label="Hapus">🗑</button></span>` : ''}</div>`).join('')}</div>`
      : '<p class="kecil">Belum ada info. Pantau terus ya ✨</p>'}`, {
    gaya: 'dir',
    pasang(el) {
      if (!d) return;
      let ik = IKON[0], w = 'pink';
      el.querySelectorAll('[data-ik]').forEach(b => b.onclick = () => { ik = b.dataset.ik; el.querySelectorAll('[data-ik]').forEach(x => x.classList.toggle('on', x === b)); });
      el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { w = b.dataset.w; el.querySelectorAll('[data-w]').forEach(x => x.classList.toggle('on', x === b)); });
      el.querySelector('#piK').onclick = async () => {
        const j = bersih(el.querySelector('#piJ').value, 60), m = String(el.querySelector('#piM').value || '').trim().slice(0, 400);
        if (j.length < 3) { el.querySelector('#piE').textContent = 'Judulnya minimal 3 huruf.'; return; }
        try {
          await K.L.db.set('papanInfo/' + kunciBaru(), { j, m, ik, w, pin: el.querySelector('#piP').checked, t: TS });
          toast('📢 Info terpasang di papan!'); K.efekLokal && K.efekLokal('bunga', 25); setTimeout(() => buka({ tulis: true }), 300);
        } catch { el.querySelector('#piE').textContent = 'Gagal memasang info.'; }
      };
      el.querySelectorAll('[data-hps]').forEach(b => b.onclick = async () => { if (!confirm('Hapus info ini dari papan?')) return; await K.L.hapus('papanInfo/' + b.dataset.hps); toast('Info dihapus.'); setTimeout(buka, 300); });
      el.querySelectorAll('[data-pin]').forEach(b => b.onclick = async () => { const v = INFO[b.dataset.pin]; if (!v) return; await K.L.db.set('papanInfo/' + b.dataset.pin + '/pin', !v.pin); setTimeout(buka, 300); });
    },
  });
}
