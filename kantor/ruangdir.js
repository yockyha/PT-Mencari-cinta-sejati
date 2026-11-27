// =====================================================================
//  RUANG DIREKTUR: pintu berizin.
//  Tamu harus mengetuk pintu dulu; Direktur mengizinkan (30 menit / 2 jam)
//  atau menolak. Direktur juga bisa membuka ruangan untuk semua orang.
//  Data: ketukDir/<uid> {n,t} · izinDir/<uid> {sampai,n} · setelan/ruangDir
// =====================================================================
import { esc, bersih } from '../js/common.js?v=202611270821';
import { TS } from '../js/db.js?v=202611270821';
import { K, toast, bukaKartu, tutupKartu, tanggalJam } from './ui.js?v=202611270821';
import * as Musik from './musik.js?v=202611270821';

let izinSaya = null, ketukan = {}, izinSemua = {}, ketukSaya = 0, awalKetuk = true;
const dir = () => !!(K.L && K.peran[K.L.uid] === 'direktur');
export const terbukaUntukSemua = () => !!(K.setelan && K.setelan.ruangDir === 'buka');

// Boleh masuk: Direktur, ruangan dibuka untuk semua, atau punya izin yang belum habis
export function bolehMasuk() {
  if (!K.L) return false;
  if (dir() || terbukaUntukSemua()) return true;
  return !!(izinSaya && izinSaya.sampai > Date.now());
}
export const sisaIzin = () => (izinSaya && izinSaya.sampai > Date.now() ? izinSaya.sampai - Date.now() : 0);

export function mulai() {
  const L = K.L; if (!L) return;
  let izinLama = null;
  L.db.on('izinDir/' + L.uid, v => {
    const baru = v && v.sampai > Date.now();
    // tunggu sebentar: tulisan yang ditolak server (bukan dari Direktur) ikut hilang
    if (baru && !(izinLama && izinLama.sampai >= v.sampai)) setTimeout(() => { if (izinSaya && izinSaya.sampai === v.sampai) { toast(`🚪 Direktur membukakan pintu! Silakan masuk ke Ruang Direktur (${menit(v.sampai - Date.now())}).`, 6000); K.efekLokal && K.efekLokal('hati', 25); } }, 1500);
    izinLama = izinSaya = v;
  });
  // Direktur: pantau ketukan pintu & izin aktif (peran bisa termuat belakangan)
  const tunggu = () => (dir() ? pantauDirektur(L) : setTimeout(tunggu, 3000));
  tunggu();
}
function pantauDirektur(L) {
  L.db.on('ketukDir', v => {
    const lama = ketukan; ketukan = v || {};
    if (!awalKetuk) for (const [uid, k] of Object.entries(ketukan)) if (k && !lama[uid]) adaKetukan(uid, k);
    awalKetuk = false;
  });
  L.db.on('izinDir', v => { izinSemua = v || {}; });
}

const menit = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.round(m / 60)} jam` : `${Math.max(1, m)} menit`; };

function adaKetukan(uid, k) {
  toast(`🚪 Tok tok! ${k.n} mengetuk pintu ruanganmu.`, 5000);
  Musik.sfx('ketuk');
  if (!document.getElementById('kartu').hidden) return; // jangan menimpa kartu yang sedang dibuka
  kartuKetukan(uid, k);
}
function kartuKetukan(uid, k) {
  bukaKartu(`<h2>🚪 Ada yang mengetuk</h2><p><b>${esc(k.n)}</b> ingin masuk ke Ruang Direktur.</p>
    <div class="baris"><button class="btn" type="button" data-iz="30">✅ Izinkan 30 menit</button><button class="btn putih" type="button" data-iz="120">✅ 2 jam</button><button class="btn putih" type="button" id="kTolak">❌ Tolak</button></div>`, {
    pasang(el) {
      el.querySelectorAll('[data-iz]').forEach(b => b.onclick = () => izinkan(uid, k.n, +b.dataset.iz).then(tutupKartu));
      el.querySelector('#kTolak').onclick = () => tolak(uid).then(tutupKartu);
    },
  });
}

export async function izinkan(uid, n, mnt = 30) {
  const L = K.L, sampai = Date.now() + mnt * 60000;
  await L.db.set('izinDir/' + uid, { sampai, n: bersih(n || 'Tamu', 30) });
  await L.hapus('ketukDir/' + uid).catch(() => {});
  L.kirimNotif(uid, `🚪 Direktur mengizinkanmu masuk ke Ruang Direktur selama ${menit(mnt * 60000)}. Silakan masuk!`);
  toast(`✅ ${n} boleh masuk ${menit(mnt * 60000)}`);
}
export async function tolak(uid) {
  await K.L.hapus('ketukDir/' + uid).catch(() => {});
  K.L.kirimNotif(uid, '🚪 Direktur sedang sibuk dan belum bisa menerima tamu di ruangannya. Coba lagi nanti ya 🙏');
  toast('Ketukan ditolak.');
}
export async function cabut(uid) { await K.L.hapus('izinDir/' + uid); toast('Izin dicabut.'); }

// Tamu mengetuk pintu
export function ketuk() {
  const L = K.L;
  if (!L || !(K.resmi && K.resmi())) { K.bukaDaftar && K.bukaDaftar(); return; }
  if (bolehMasuk()) { toast('Pintunya sudah terbuka untukmu. Silakan masuk 🚪'); return; }
  const direkturOnline = [...K.lain.values()].some(o => K.peran[o.uid] === 'direktur');
  bukaKartu(`<h2>🚪 Ruang Direktur</h2>
    <p>Ruangan ini privat. Ketuk pintu dulu, nanti Direktur yang memutuskan boleh masuk atau tidak.</p>
    <p class="kecil">${direkturOnline ? '🟢 Direktur sedang ada di kantor.' : '⚪ Direktur sedang tidak di kantor. Ketukanmu tetap tersimpan dan akan dilihat saat Direktur datang.'}</p>
    <div class="baris"><button class="btn" type="button" id="kT">✊ Tok tok, ketuk pintu</button><button class="btn putih" type="button" id="kB">Batal</button></div>`, {
    pasang(el) {
      el.querySelector('#kB').onclick = tutupKartu;
      el.querySelector('#kT').onclick = async () => {
        if (Date.now() - ketukSaya < 60000) { toast('Sudah diketuk. Tunggu jawaban Direktur ya (bisa ketuk lagi 1 menit lagi).'); return; }
        try {
          await L.db.set('ketukDir/' + L.uid, { n: bersih((K.prof && K.prof.n) || 'Tamu', 30), t: TS });
          ketukSaya = Date.now(); tutupKartu(); toast('✊ Tok tok! Ketukanmu sampai. Tunggu Direktur membukakan pintu.', 4200);
        } catch { toast('Baru saja mengetuk. Tunggu sebentar ya.'); }
      };
    },
  });
}

// Panel Direktur: atur pintu, ketukan, izin aktif
export function bukaPanelIzin() {
  if (!dir()) { ketuk(); return; }
  const kt = Object.entries(ketukan).filter(([, k]) => k), iz = Object.entries(izinSemua).filter(([, v]) => v && v.sampai > Date.now());
  const tamuOn = [...K.lain.values()].filter(o => !K.peran[o.uid] && !(izinSemua[o.uid] && izinSemua[o.uid].sampai > Date.now()));
  bukaKartu(`<h2>🚪 Pintu Ruang Direktur</h2>
    <div class="sw teks"><button type="button" data-p="izin" class="${terbukaUntukSemua() ? '' : 'on'}">🔒 Perlu izin</button><button type="button" data-p="buka" class="${terbukaUntukSemua() ? 'on' : ''}">🔓 Terbuka untuk semua</button></div>
    <h3>✊ Ketukan (${kt.length})</h3>
    ${kt.length ? `<div class="daftar">${kt.map(([u, k]) => `<div><span><b>${esc(k.n)}</b><br><small>${esc(tanggalJam(k.t))}</small></span><span><button type="button" class="mini" data-iz="${esc(u)}">Izinkan</button> <button type="button" class="mini putih" data-tl="${esc(u)}">Tolak</button></span></div>`).join('')}</div>` : '<p class="kecil">Belum ada yang mengetuk.</p>'}
    <h3>✅ Sedang diizinkan (${iz.length})</h3>
    ${iz.length ? `<div class="daftar">${iz.map(([u, v]) => `<div><span><b>${esc(v.n || 'Tamu')}</b><br><small>sisa ${menit(v.sampai - Date.now())}</small></span><button type="button" class="mini putih" data-cb="${esc(u)}">Cabut</button></div>`).join('')}</div>` : '<p class="kecil">Belum ada.</p>'}
    ${tamuOn.length ? `<h3>💌 Undang tamu yang online</h3><div class="daftar">${tamuOn.slice(0, 30).map(o => `<div><span>${esc(o.nama)}</span><button type="button" class="mini" data-ud="${esc(o.uid)}" data-n="${esc(o.nama)}">Undang</button></div>`).join('')}</div>` : ''}`, {
    pasang(el) {
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => K.L.setelan({ ruangDir: b.dataset.p }).then(() => { toast(b.dataset.p === 'buka' ? '🔓 Ruanganmu terbuka untuk semua tamu' : '🔒 Tamu harus mengetuk dulu'); setTimeout(bukaPanelIzin, 300); }));
      el.querySelectorAll('[data-iz]').forEach(b => b.onclick = () => izinkan(b.dataset.iz, ketukan[b.dataset.iz]?.n, 30).then(() => setTimeout(bukaPanelIzin, 300)));
      el.querySelectorAll('[data-tl]').forEach(b => b.onclick = () => tolak(b.dataset.tl).then(() => setTimeout(bukaPanelIzin, 300)));
      el.querySelectorAll('[data-cb]').forEach(b => b.onclick = () => cabut(b.dataset.cb).then(() => setTimeout(bukaPanelIzin, 300)));
      el.querySelectorAll('[data-ud]').forEach(b => b.onclick = () => izinkan(b.dataset.ud, b.dataset.n, 30).then(() => setTimeout(bukaPanelIzin, 300)));
    },
  });
}
export const jumlahKetukan = () => Object.values(ketukan).filter(Boolean).length;
