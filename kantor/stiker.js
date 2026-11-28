// =====================================================================
//  Stiker karakter (ala stiker grup WA): karakter kantor + tulisan.
//  Gambar dibuat di perangkat (render 3D kecil + teks), jadi tidak ada
//  file gambar yang perlu diunduh. Pesan hanya menyimpan id stiker.
//  Paket: f_ gratis, v_ VIP (VIP & VVIP), w_ VVIP. Direktur: semua.
// =====================================================================
import * as THREE from 'three';
import { esc } from '../js/common.js?v=202611280918';
import { K, toast } from './ui.js?v=202611280918';
import { buatKarakter, pose } from './karakter.js?v=202611280918';

const S = o => ({ v: 2, k: 1, r: 0, w: 0, wa: 0, wb: 0, at: 'kaos', bw: 'chino', sp: 'sneakers', kp: '', mt: '', tl: '', lh: '', tg: '', ef: '', ...o });
// [id, tulisan, penampilan, pose (0 diam, 4 minum/makan, 5 melambai), peran, bawaan, warna tulisan]
const DAFTAR = [
  ['f_halo', 'Halo gaes! 👋', S({ s: 'p', at: 'seragam', bw: 'rokPanjang', wb: 3, r: 5, w: 1, tl: 'antingMutiara' }), 5, 'karyawan'],
  ['f_siap', 'SIAP 86! 💪', S({ s: 'l', at: 'satpam', bw: 'bahan', wb: 3, r: 3, k: 2, mt: 'hitam' }), 5, 'karyawan'],
  ['f_wkwk', 'WKWKWK 😂', S({ s: 'l', at: 'kaosGaris', wa: 4, r: 4, k: 2 }), 4],
  ['f_gas', 'GASSS 🔥', S({ s: 'l', at: 'hoodie', wa: 8, r: 7, w: 2, kp: 'topi' }), 5],
  ['f_otw', 'OTW BOSKU 🛵', S({ s: 'l', at: 'ojol', bw: 'jeans', kp: 'helm', k: 2 }), 5, 'karyawan', 'box'],
  ['f_makasih', 'Makasih ya 🙏', S({ s: 'p', at: 'kardigan', wa: 10, bw: 'rokPanjang', wb: 4, kp: 'hijab', k: 2 }), 0, 'karyawan'],
  ['f_ngopi', 'Ngopi dulu ☕', S({ s: 'l', at: 'celemek', r: 7, w: 2 }), 4, 'karyawan', 'kopi'],
  ['f_sabar', 'Sabar… lagi ngepel 🧽', S({ s: 'p', at: 'ob', bw: 'bahan', wb: 3, kp: 'hijab', wa: 2, k: 3 }), 3, 'karyawan', 'pel'],
  ['f_baper', 'Baper aku 🥺', S({ s: 'p', at: 'blusPita', wa: 7, r: 1, w: 3 }), 0],
  ['f_mantap', 'MANTAP 👍', S({ s: 'l', at: 'seragam', r: 4, k: 3, tl: 'headset' }), 5, 'karyawan'],
  ['f_cie', 'Cieee 😏', S({ s: 'p', at: 'blazer', wa: 7, r: 1, w: 3, mt: 'bulat' }), 0, 'karyawan'],
  ['f_bobo', 'Met bobo 🌙', S({ s: 'p', at: 'sweater', wa: 9, r: 6, w: 0 }), 0],
  ['v_jomblo', 'Jomblo bahagia 😎', S({ s: 'l', at: 'kulit', bw: 'jeans', r: 7, mt: 'hitam' }), 5],
  ['v_mabar', 'Mabar yuk 🎮', S({ s: 'l', at: 'o9', r: 4, tl: 'headset' }), 5],
  ['v_pdkt', 'Lagi PDKT nih 💘', S({ s: 'l', at: 'kemeja', wa: 1, lh: 'dasiKupu', tg: 'buket' }), 0],
  ['v_slay', 'SLAY ✨', S({ s: 'p', at: 'gaun', wa: 5, r: 1, w: 4, tl: 'antingBulat' }), 5],
  ['v_sultan', 'Sultan mah bebas 💎', S({ s: 'l', at: 'emas', mt: 'hitam' }), 5],
  ['v_peluk', 'Peluk jauh 🤗', S({ s: 'p', at: 'o8', r: 2, w: 5 }), 0],
  ['w_acc', 'DI-ACC! ✅', S({ s: 'l', r: 0 }), 5, 'direktur'],
  ['w_bos', 'Kerja bagus! 👑', S({ s: 'l', r: 0 }), 0, 'direktur', 'map'],
  ['w_nikah', 'Kapan nikah? 💍', S({ s: 'l', at: 'o7' }), 0],
  ['w_cupid', 'Panah asmara 💘', S({ s: 'p', at: 'dressBunga', wa: 1, ef: 'sayap', r: 2, w: 3 }), 5],
  ['w_ratu', 'Ratu hari ini 👑', S({ s: 'p', at: 'kebaya', wa: 4, kp: 'mahkota' }), 5],
  ['w_aura', 'Auranya beda ✨', S({ s: 'l', at: 'jas', wa: 6, ef: 'aura', mt: 'hitam' }), 0],
];
export const STIKER = Object.fromEntries(DAFTAR.map(([id, teks, look, a, peran, bawa]) => [id, { id, teks, look, a, peran: peran || 'pengunjung', bawa: bawa || '' }]));
export const PAKET = [
  { awalan: 'f_', nama: 'Gratis', ikon: '😀' },
  { awalan: 'v_', nama: 'VIP', ikon: '💎' },
  { awalan: 'w_', nama: 'VVIP', ikon: '👑' },
];

// tingkat langganan pemain: '' | 'vip' | 'vvip' (Direktur dianggap vvip)
export function tingkatSaya() { return K.tingkat ? K.tingkat(K.L && K.L.uid) : ''; }
export function bolehStiker(id) {
  if (!STIKER[id]) return false;
  const t = tingkatSaya();
  return id.startsWith('f_') || (id.startsWith('v_') && !!t) || (id.startsWith('w_') && t === 'vvip');
}

// ---------------------------------------------------------------- RENDER
let rnd = null, adegan = null, kam = null;
const cache = {}, antre = {};
function siapkan() {
  if (adegan) return;
  rnd = K.renderer;
  adegan = new THREE.Scene();
  adegan.add(new THREE.HemisphereLight(0xffffff, 0xe0c2b8, 1.6));
  const m = new THREE.DirectionalLight(0xfff3e6, 1.8); m.position.set(1.5, 3, 4); adegan.add(m);
  kam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  kam.position.set(0, 1.55, 3.6); kam.lookAt(0, 1.25, 0);
}
function bikin(id) {
  const st = STIKER[id]; if (!st || !K.renderer) return '';
  siapkan();
  const W = 256;
  const g = buatKarakter(st.look, { peran: st.peran, bawa: st.bawa });
  g.rotation.y = -0.25;
  for (let i = 0; i < 20; i++) pose(g, st.a, 0.08);
  adegan.add(g);
  const rt = new THREE.WebGLRenderTarget(W, W, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const warnaLama = rnd.getClearColor(new THREE.Color()), alfaLama = rnd.getClearAlpha();
  let url = '';
  try {
    rnd.setRenderTarget(rt); rnd.setClearColor(0x000000, 0); rnd.clear(); rnd.render(adegan, kam);
    const px = new Uint8Array(W * W * 4);
    rnd.readRenderTargetPixels(rt, 0, 0, W, W, px);
    const c = document.createElement('canvas'); c.width = W; c.height = W;
    const x = c.getContext('2d'), img = x.createImageData(W, W);
    for (let y = 0; y < W; y++) img.data.set(px.subarray((W - 1 - y) * W * 4, (W - y) * W * 4), y * W * 4);
    // garis putih tipis di sekeliling karakter (gaya stiker)
    const k = document.createElement('canvas'); k.width = W; k.height = W; k.getContext('2d').putImageData(img, 0, 0);
    x.globalCompositeOperation = 'source-over';
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [-3, 3], [3, -3]]) x.drawImage(k, dx, dy);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, W);
    x.globalCompositeOperation = 'source-over'; x.drawImage(k, 0, 0);
    // tulisan
    x.font = `900 ${st.teks.length > 14 ? 26 : 32}px Fredoka, Nunito, sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    const y = W - 30;
    x.save(); x.translate(W / 2, y); x.rotate(-0.05);
    x.lineWidth = 9; x.strokeStyle = '#2a1420'; x.strokeText(st.teks, 0, 0, W - 16);
    x.fillStyle = id.startsWith('w_') ? '#ffd23f' : id.startsWith('v_') ? '#8fd3ff' : '#ffffff'; x.fillText(st.teks, 0, 0, W - 16);
    x.restore();
    url = c.toDataURL('image/png');
  } catch (e) { console.warn('stiker', e); }
  rnd.setRenderTarget(null); rnd.setClearColor(warnaLama, alfaLama);
  rt.dispose(); adegan.remove(g);
  return url;
}
// gambar stiker (dibuat sekali, lalu diambil dari cache); disebar per frame supaya tidak tersendat
export function gambar(id) {
  if (cache[id]) return Promise.resolve(cache[id]);
  return (antre[id] ||= new Promise(res => requestAnimationFrame(() => { cache[id] = bikin(id); res(cache[id]); })));
}
// HTML untuk pesan stiker; src diisi oleh isiGambar()
export const html = id => STIKER[id] ? `<img class="stiker" data-st="${esc(id)}" alt="Stiker: ${esc(STIKER[id].teks)}" width="128" height="128">` : `<span>${esc(id)}</span>`;
export function isiGambar(el) {
  el.querySelectorAll('img[data-st]:not([src])').forEach(img => gambar(img.dataset.st).then(u => { if (u) img.src = u; }));
}

// ---------------------------------------------------------------- PEMILIH STIKER
// Panel pilihan di bawah kolom pesan. onPilih(id) dipanggil saat stiker diketuk.
export function pasangPemilih(tombol, wadah, onPilih) {
  let terbuka = false, tab = 'f_';
  const isi = () => {
    const t = tingkatSaya();
    wadah.innerHTML = `<div class="sw teks tab">${PAKET.map(p => `<button type="button" data-p="${p.awalan}" class="${p.awalan === tab ? 'on' : ''}">${p.ikon} ${p.nama}</button>`).join('')}</div>
      <div class="gridStiker">${DAFTAR.filter(([id]) => id.startsWith(tab)).map(([id]) => `<button type="button" data-id="${id}" class="${bolehStiker(id) ? '' : 'kunci'}">${html(id)}${bolehStiker(id) ? '' : '<b>🔒</b>'}</button>`).join('')}</div>
      ${tab !== 'f_' && !bolehStiker(tab === 'v_' ? 'v_jomblo' : 'w_acc') ? `<p class="kecil">Paket ini khusus ${tab === 'v_' ? 'VIP & VVIP' : 'VVIP'}. <button type="button" class="mini" id="stBeli">${tab === 'v_' ? '💎 Jadi VIP' : '👑 Jadi VVIP'}</button></p>` : ''}`;
    isiGambar(wadah);
    wadah.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { tab = b.dataset.p; isi(); });
    wadah.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (!bolehStiker(id)) { toast(id.startsWith('w_') ? 'Stiker ini khusus VVIP 👑' : 'Stiker ini khusus VIP & VVIP 💎'); return; }
      onPilih(id); tutup();
    });
    const bl = wadah.querySelector('#stBeli'); if (bl) bl.onclick = () => K.bukaLangganan && K.bukaLangganan();
    void t;
  };
  const tutup = () => { terbuka = false; wadah.hidden = true; };
  tombol.onclick = () => { terbuka = !terbuka; wadah.hidden = !terbuka; if (terbuka) isi(); };
  wadah.hidden = true;
  return { tutup };
}
