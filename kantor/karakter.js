// =====================================================================
//  Karakter 3D: tubuh, pakaian per item (atasan, bawahan, sepatu,
//  aksesoris), tanda pengenal (tamu / karyawan / Direktur), bawaan
//  (pel, kotak ojol, kopi, dll) dan pose (diam, jalan, duduk, ngepel,
//  makan, melambai, ngetik).
// =====================================================================
import * as THREE from 'three';
import { BARANG, WARNA_BAJU, WARNA_CELANA, KULIT, RAMBUT, WARNA_RAMBUT, lookV2 } from '../js/pakaian.js?v=202611260636';

const GEO = new THREE.BoxGeometry(1, 1, 1);
const _mat = {};
export const M = (c, o = {}) => _mat[c + JSON.stringify(o)] ||= new THREE.MeshLambertMaterial({ color: c, ...o });

export function bentukHati(s, warna) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -1); sh.bezierCurveTo(-0.2, -0.75, -1.2, -0.35, -1.2, 0.3); sh.bezierCurveTo(-1.2, 0.9, -0.45, 1.15, 0, 0.6);
  sh.bezierCurveTo(0.45, 1.15, 1.2, 0.9, 1.2, 0.3); sh.bezierCurveTo(1.2, -0.35, 0.2, -0.75, 0, -1);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3, curveSegments: 16 });
  g.center();
  const m = new THREE.Mesh(g, M(warna)); m.scale.setScalar(s); m.castShadow = true;
  return m;
}
const _hati = {};
function hatiKecil(s, warna) { const k = s + warna; const h = (_hati[k] ||= bentukHati(s, warna)).clone(); h.castShadow = false; return h; }

// warna lebih gelap / terang
const ubah = (hex, f) => { const c = new THREE.Color(hex); if (f < 1) c.multiplyScalar(f); else c.lerp(new THREE.Color('#ffffff'), f - 1); return '#' + c.getHexString(); };

/**
 * look: penampilan (v2 atau lama). opsi.peran: 'tamu' | 'staf' | 'direktur' | 'karyawan' | 'pengunjung'
 * opsi.bawa: 'pel' | 'sapu' | 'box' | 'kopi' | 'paket' | 'nampan' | 'laptop' | 'map'
 */
export function buatKarakter(look, { peran = 'tamu', bawa = '', tingkat = '' } = {}) {
  const L = lookV2(look);
  if (peran === 'direktur') Object.assign(L, { at: 'jasDir', bw: 'bahan', wb: 0, sp: 'pantofel' });
  const P = L.s === 'p';
  const g = new THREE.Group();
  const tubuh = new THREE.Group(); g.add(tubuh);
  const part = (w, h, d, x, y, z, m, p = tubuh) => { const me = new THREE.Mesh(GEO, m); me.scale.set(w, h, d); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const silinder = (rt, rb, h, x, y, z, m, p = tubuh, seg = 12) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const bola = (r, x, y, z, m, p = tubuh) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); me.position.set(x, y, z); p.add(me); return me; };

  const kulit = M(KULIT[L.k]), rmb = M(WARNA_RAMBUT[L.w]);
  const wa = WARNA_BAJU[L.wa], wb = WARNA_CELANA[L.wb];
  const AT = L.at, BW = L.bw, SP = L.sp;
  const at = BARANG[AT] || {};
  const lebar = P ? 0.52 : 0.58, bahu = P ? 0.35 : 0.38, kakiX = P ? 0.12 : 0.13, depan = 0.168;

  // ------------------------------------------------ ATASAN: bahan badan & lengan
  const fix = {
    o8: '#ff8fab', gcHoodieNeon: '#2bd9a8', ssJaket: '#1d3557', denim: '#4a6fa5', kulit: '#1f1f24', o9: '#b5232f', o7: '#f7f3ee', emas: '#d4a017',
    seragam: '#ff4f7b', jasDir: '#1a1a22', ob: '#2c3e66', satpam: '#f2f2f2', ojol: '#16a34a', celemek: '#2b2d42',
  };
  const warnaAtas = fix[AT] || wa;
  const badan = AT === 'emas' ? M('#d4a017', { emissive: 0x3a2800 }) : M(warnaAtas);
  // panjang lengan: 'pendek' (lengan kaos), 'panjang', 'tanpa' (gaun)
  const lenganJenis = { kaos: 'pendek', kaosGaris: 'pendek', kaosHati: 'pendek', crop: 'pendek', kaosOversize: 'pendek', polo: 'pendek', blus: 'pendek', batik: 'pendek', blusPita: 'pendek', dressSantai: 'pendek', dressBunga: 'pendek', seragam: 'pendek', ob: 'pendek', satpam: 'pendek', gaun: 'tanpa' }[AT] || 'panjang';
  const gaun = at.gaun || '';

  // ------------------------------------------------ BAWAHAN
  const jenisBw = gaun ? 'gaun' : BW;
  const rok = ['rokPendek', 'rokPanjang', 'rokLipit', 'rokJeans', 'sarung'].includes(jenisBw) || gaun;
  const warnaBawah = BW === 'rokJeans' ? '#4a6fa5' : BW === 'jeans' || BW === 'sobek' ? (L.wb === 0 ? '#3d5a8a' : wb) : wb;
  const cel = M(warnaBawah);
  const pendek = ['pendek', 'pendekCargo'].includes(jenisBw);

  // ------------------------------------------------ KAKI + SEPATU
  const kaki = [];
  for (const sx of [-kakiX, kakiX]) {
    const k = new THREE.Group(); k.position.set(sx, 0.78, 0); tubuh.add(k);
    const lebarKaki = BW === 'kulot' && !gaun ? 0.27 : 0.23;
    if (rok) part(0.19, 0.72, 0.21, 0, -0.36, 0, kulit, k);
    else if (pendek) { part(lebarKaki, 0.36, 0.25, 0, -0.18, 0, cel, k); part(0.19, 0.38, 0.21, 0, -0.55, 0, kulit, k); }
    else part(lebarKaki, 0.72, 0.25, 0, -0.36, 0, cel, k);
    if (!rok) {
      if (BW === 'jogger') part(0.24, 0.08, 0.26, 0, -0.66, 0, M(ubah(warnaBawah, 0.75)), k);
      if (BW === 'cargo' || BW === 'pendekCargo') part(0.04, 0.16, 0.16, sx > 0 ? 0.13 : -0.13, BW === 'cargo' ? -0.32 : -0.2, 0, M(ubah(warnaBawah, 0.8)), k);
      if (BW === 'sobek') { part(0.12, 0.06, 0.02, 0, -0.38, 0.126, M(ubah(warnaBawah, 1.5)), k); part(0.08, 0.04, 0.02, 0.02, -0.2, 0.126, M(ubah(warnaBawah, 1.5)), k); }
      if (BW === 'bahan') part(0.015, 0.7, 0.02, 0, -0.36, 0.126, M(ubah(warnaBawah, 0.7)), k);
    }
    // sepatu
    const tinggiHak = SP === 'heels' ? 0.06 : 0;
    if (SP === 'sandal') { part(0.19, 0.06, 0.24, 0, -0.71, 0.04, kulit, k); part(0.24, 0.04, 0.34, 0, -0.76, 0.04, M('#2b2d42'), k); part(0.2, 0.03, 0.03, 0, -0.7, 0.1, M('#ff4f7b'), k); }
    else if (SP === 'boots') { part(0.26, 0.28, 0.3, 0, -0.64, 0.02, M('#6b4630'), k); part(0.27, 0.06, 0.36, 0, -0.76, 0.04, M('#3b2618'), k); }
    else if (SP === 'heels') { part(0.21, 0.08, 0.3, 0, -0.71 + tinggiHak, 0.06, M('#c0392b'), k); part(0.06, 0.1, 0.06, 0, -0.74, -0.07, M('#c0392b'), k); }
    else {
      const w = { sneakers: '#ffffff', kanvas: '#2b2d42', lari: '#ff6b35', flat: '#d35470', pantofel: '#111114', sepatuEmas: '#ffd23f' }[SP] || '#2a2a2a';
      const sp = part(0.25, 0.1, 0.34, 0, -0.74, 0.04, SP === 'sepatuEmas' ? M(w, { emissive: 0x4a3500 }) : M(w), k);
      if (SP === 'flat') sp.scale.y = 0.07;
      if (SP === 'sneakers') part(0.26, 0.04, 0.2, 0, -0.73, 0.02, M('#ff4f7b'), k);
      if (SP === 'kanvas' || SP === 'lari') part(0.26, 0.035, 0.35, 0, -0.78, 0.04, M('#ffffff'), k);
      if (SP === 'pantofel') part(0.2, 0.02, 0.1, 0, -0.69, 0.13, M('#3a3a44'), k);
    }
    kaki.push(k);
  }

  // ------------------------------------------------ BADAN
  const lebarBadan = AT === 'kaosOversize' ? lebar + 0.06 : lebar;
  if (AT === 'crop') { part(lebar, 0.4, 0.33, 0, 1.26, 0, badan); part(lebar - 0.04, 0.3, 0.31, 0, 0.92, 0, kulit); }
  else part(lebarBadan, AT === 'kaosOversize' ? 0.76 : 0.68, 0.33, 0, AT === 'kaosOversize' ? 1.08 : 1.12, 0, badan);
  // ikat pinggang / pinggang
  if (!gaun && !rok) part(lebar + 0.02, 0.1, 0.35, 0, 0.8, 0, BW === 'bahan' || BW === 'chino' ? M('#2a1420') : cel);
  // rok & gaun
  if (rok) {
    const dSkirt = gaun === 'panjang' || gaun === 'kebaya' || BW === 'rokPanjang' || BW === 'sarung' ? 0.72 : BW === 'rokLipit' ? 0.4 : 0.34;
    const mSkirt = gaun === 'kebaya' ? M('#6b3f22') : gaun ? badan : cel;
    const atasR = lebar / 2 + 0.03, bawahR = gaun === 'panjang' ? 0.46 : dSkirt > 0.5 ? 0.38 : 0.37;
    silinder(atasR, bawahR, dSkirt, 0, 0.84 - dSkirt / 2, 0, mSkirt, tubuh, BW === 'rokLipit' ? 10 : 16);
    if (BW === 'sarung' && !gaun) for (const y of [0.7, 0.45, 0.25]) silinder(atasR + (0.84 - y) * 0.05 + 0.005, atasR + (0.84 - y + 0.05) * 0.05 + 0.005, 0.05, 0, y, 0, M(ubah(warnaBawah, 0.6)), tubuh, 16);
    if (gaun === 'kebaya') for (let i = 0; i < 6; i++) bola(0.025, Math.sin(i * 2.1) * 0.3, 0.7 - i * 0.09, 0.33 + (i % 2) * 0.03, M('#e8c07a'));
    if (gaun === 'panjang') for (let i = 0; i < 8; i++) bola(0.018, Math.sin(i * 1.7) * 0.3, 0.75 - i * 0.08, 0.36 + i * 0.012, M('#ffffff', { emissive: 0x555555 }));
    if (AT === 'dressBunga') for (let i = 0; i < 6; i++) bola(0.03, Math.sin(i * 2.3) * 0.25, 0.65 - (i % 3) * 0.1, 0.32, M(['#ffffff', '#ffd23f'][i % 2]));
  }

  // ------------------------------------------------ DETAIL ATASAN
  const putih = M('#ffffff');
  switch (AT) {
    case 'kaosGaris': for (const y of [0.95, 1.12, 1.29]) part(lebar + 0.01, 0.05, 0.34, 0, y, 0, M(ubah(wa, L.wa === 1 ? 0.5 : 1.7))); break;
    case 'kaosHati': { const h = hatiKecil(0.09, wa === '#ff4f7b' ? '#ffffff' : '#ff4f7b'); h.position.set(0, 1.18, depan + 0.03); tubuh.add(h); break; }
    case 'polo': part(0.3, 0.06, 0.36, 0, 1.43, 0, M(ubah(wa, 0.8))); part(0.03, 0.14, 0.02, 0, 1.35, depan + 0.002, putih); break;
    case 'kemeja': case 'flanel':
      part(0.14, 0.07, 0.05, -0.08, 1.43, 0.15, AT === 'flanel' ? M(ubah(wa, 0.6)) : putih); part(0.14, 0.07, 0.05, 0.08, 1.43, 0.15, AT === 'flanel' ? M(ubah(wa, 0.6)) : putih);
      for (let i = 0; i < 4; i++) part(0.025, 0.025, 0.02, 0, 1.33 - i * 0.14, depan + 0.002, M(ubah(wa, 0.7)));
      if (AT === 'flanel') { const g2 = M(ubah(wa, 0.55)); for (const x of [-0.16, 0.16]) part(0.04, 0.66, 0.335, x, 1.12, 0, g2); for (const y of [0.98, 1.24]) part(lebar + 0.005, 0.04, 0.335, 0, y, 0, g2); }
      break;
    case 'blus': case 'blusPita':
      part(0.22, 0.05, 0.02, 0, 1.42, depan + 0.002, putih);
      if (AT === 'blusPita') { part(0.1, 0.07, 0.04, -0.06, 1.38, depan + 0.02, M('#2a1420')); part(0.1, 0.07, 0.04, 0.06, 1.38, depan + 0.02, M('#2a1420')); }
      break;
    case 'batik': { const c = [M('#6b3f22'), M('#e8c07a')]; for (let i = 0; i < 12; i++) part(0.06, 0.06, 0.02, -0.2 + (i % 4) * 0.13, 0.92 + Math.floor(i / 4) * 0.18, depan + 0.002, c[i % 2]); part(0.14, 0.07, 0.05, -0.08, 1.43, 0.15, M(ubah(wa, 0.7))); part(0.14, 0.07, 0.05, 0.08, 1.43, 0.15, M(ubah(wa, 0.7))); break; }
    case 'hoodie': case 'o8': case 'gcHoodieNeon':
      part(0.5, 0.34, 0.16, 0, 1.52, -0.22, badan); part(0.36, 0.15, 0.02, 0, 0.98, depan, M('#2a1420', { transparent: true, opacity: 0.25 }));
      part(0.02, 0.18, 0.02, -0.06, 1.33, depan + 0.005, putih); part(0.02, 0.18, 0.02, 0.06, 1.33, depan + 0.005, putih);
      if (AT === 'o8') { const h = hatiKecil(0.07, '#ff4f7b'); h.position.set(-0.15, 1.3, 0.18); tubuh.add(h); }
      if (AT === 'gcHoodieNeon') { part(0.36, 0.05, 0.02, 0, 1.02, depan + 0.004, M('#f5ff3b', { emissive: 0x555500 })); part(0.36, 0.05, 0.02, 0, 1.2, depan + 0.004, M('#ff4fd8', { emissive: 0x550044 })); }
      break;
    case 'sweater': part(lebar + 0.02, 0.08, 0.35, 0, 0.82, 0, M(ubah(wa, 0.8))); part(0.3, 0.06, 0.35, 0, 1.43, 0, M(ubah(wa, 0.8))); break;
    case 'kardigan': part(0.2, 0.64, 0.02, 0, 1.12, depan, putih); for (let i = 0; i < 3; i++) part(0.03, 0.03, 0.02, 0.11, 1.3 - i * 0.16, depan + 0.006, M(ubah(wa, 0.7))); break;
    case 'denim': part(0.2, 0.64, 0.02, 0, 1.12, depan, putih); for (const x of [-0.17, 0.17]) part(0.1, 0.08, 0.02, x, 1.28, depan + 0.002, M('#3a5a8a')); break;
    case 'ssJaket': part(0.3, 0.07, 0.35, 0, 1.43, 0, M('#d4a017', { emissive: 0x3a2800 })); part(0.02, 0.6, 0.025, 0, 1.12, depan + 0.004, M('#d4a017')); part(0.12, 0.12, 0.02, -0.15, 1.28, depan + 0.004, M('#ffd23f', { emissive: 0x553300 })); break;
    case 'bomber': part(0.3, 0.07, 0.35, 0, 1.43, 0, M('#2b2d42')); part(lebar + 0.02, 0.08, 0.35, 0, 0.82, 0, M('#2b2d42')); part(0.02, 0.6, 0.025, 0, 1.12, depan + 0.004, M('#c0c4cc')); part(0.08, 0.1, 0.02, -0.17, 1.3, depan + 0.002, M('#ff6b35')); break;
    case 'kulit': part(0.2, 0.64, 0.02, 0, 1.12, depan, M(wa)); part(0.02, 0.6, 0.025, 0.11, 1.12, 0.172, M('#c0c4cc')); break;
    case 'o9': part(lebar + 0.02, 0.06, 0.34, 0, 1.43, 0, M('#fff6ef')); part(lebar + 0.02, 0.06, 0.34, 0, 0.83, 0, M('#fff6ef')); part(0.1, 0.12, 0.02, 0.15, 1.28, depan, M('#ffd23f')); break;
    case 'jas': case 'blazer': case 'jasDir': {
      const kemeja = AT === 'jasDir' ? putih : putih;
      part(0.16, 0.42, 0.02, 0, 1.24, depan, kemeja);
      for (const sx of [-1, 1]) { const l = part(0.07, 0.36, 0.025, sx * 0.1, 1.26, depan + 0.006, M(ubah(warnaAtas, AT === 'jasDir' ? 1.3 : 0.8))); l.rotation.z = sx * 0.25; }
      if (AT !== 'blazer') part(0.07, 0.36, 0.025, 0, 1.2, 0.18, AT === 'jasDir' ? M('#d4a017') : M('#c0392b'));
      if (AT === 'jasDir') { part(0.09, 0.05, 0.02, -0.17, 1.3, depan + 0.006, M('#d4a017')); part(0.025, 0.025, 0.02, 0, 1.0, depan + 0.006, M('#d4a017')); part(0.025, 0.025, 0.02, 0, 0.9, depan + 0.006, M('#d4a017')); }
      else part(0.025, 0.025, 0.02, 0, 0.98, depan + 0.006, M('#2a1420'));
      break;
    }
    case 'o7': part(0.1, 0.36, 0.02, 0, 1.24, depan, putih); part(0.16, 0.07, 0.035, 0, 1.39, 0.18, M('#ff4f7b')); part(0.06, 0.06, 0.03, -0.17, 1.3, 0.172, M('#ff4f7b')); break;
    case 'emas': part(0.16, 0.42, 0.02, 0, 1.24, depan, M('#fff6ef')); part(0.12, 0.08, 0.03, 0, 1.38, 0.18, M('#ff4f7b')); break;
    case 'gaun': part(0.6, 0.04, 0.34, 0, 1.4, 0, M(ubah(wa, 1.4))); break;
    case 'kebaya': for (let i = 0; i < 3; i++) part(0.03, 0.03, 0.02, 0, 1.32 - i * 0.14, depan + 0.002, M('#e8c07a')); part(0.24, 0.5, 0.02, 0, 1.15, depan - 0.001, M(ubah(wa, 1.4))); break;
    case 'dressSantai': case 'dressBunga': part(lebar + 0.01, 0.05, 0.34, 0, 0.88, 0, M(ubah(wa, 0.8))); break;
    case 'seragam': { part(0.3, 0.06, 0.36, 0, 1.43, 0, putih); part(0.03, 0.14, 0.02, 0, 1.35, depan + 0.002, putih); const h = hatiKecil(0.045, '#ffffff'); h.position.set(0.15, 1.3, depan + 0.02); tubuh.add(h); break; }
    case 'ob': for (const y of [1.0, 1.06]) part(lebar + 0.01, 0.03, 0.34, 0, y, 0, M('#ffd23f', { emissive: 0x332200 })); part(0.14, 0.07, 0.05, -0.08, 1.43, 0.15, M('#1d2b4a')); part(0.14, 0.07, 0.05, 0.08, 1.43, 0.15, M('#1d2b4a')); break;
    case 'satpam': for (const sx of [-1, 1]) part(0.14, 0.04, 0.2, sx * 0.24, 1.47, 0, M('#1d3557')); part(0.08, 0.09, 0.02, -0.15, 1.3, depan + 0.003, M('#d4a017')); part(0.1, 0.03, 0.02, 0.15, 1.33, depan + 0.003, M('#1d3557')); for (let i = 0; i < 4; i++) part(0.025, 0.025, 0.02, 0, 1.33 - i * 0.14, depan + 0.002, M('#999')); break;
    case 'ojol': for (const y of [1.02, 1.3]) part(lebar + 0.01, 0.04, 0.34, 0, y, 0, M('#0f6b31')); part(0.3, 0.07, 0.35, 0, 1.43, 0, M('#0f6b31')); break;
    case 'celemek': part(0.42, 0.85, 0.02, 0, 0.98, depan + 0.003, M('#8a5a2b')); part(0.2, 0.02, 0.02, 0, 1.15, depan + 0.01, M('#5b3a2a')); { const h = hatiKecil(0.04, '#ffffff'); h.position.set(0, 1.32, depan + 0.02); tubuh.add(h); } break;
  }

  // ------------------------------------------------ TANDA PENGENAL
  if (peran === 'staf' || peran === 'karyawan') {
    part(0.04, 0.3, 0.02, -0.09, 1.3, 0.172, M('#3a6ea5')); part(0.04, 0.3, 0.02, 0.09, 1.3, 0.172, M('#3a6ea5'));
    part(0.17, 0.21, 0.03, 0, 1.1, 0.178, putih); part(0.17, 0.06, 0.035, 0, 1.18, 0.18, M('#3a6ea5')); part(0.07, 0.07, 0.035, 0, 1.08, 0.181, M('#f6d2b8'));
  } else if (peran === 'direktur') {
    const cincin = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.72, 32), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
    cincin.rotation.x = -Math.PI / 2; cincin.position.y = 0.03; g.add(cincin);
    const h = hatiKecil(0.04, '#ffd23f'); h.position.set(0.17, 1.32, depan + 0.02); tubuh.add(h);
  } else if (peran === 'tamu') {
    part(0.13, 0.09, 0.02, -0.15, 1.3, depan + 0.012, putih); part(0.13, 0.03, 0.025, -0.15, 1.33, depan + 0.014, M('#ff4f7b'));
  }

  // VVIP: cincin ungu di kaki
  if (tingkat === 'vvip' && peran !== 'direktur') {
    const c = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#b36bff', transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    c.rotation.x = -Math.PI / 2; c.position.y = 0.03; g.add(c);
  }

  // ------------------------------------------------ LENGAN
  const lengan = [];
  const kerah = lenganJenis === 'pendek' ? 0.24 : 0;
  for (const sx of [-bahu, bahu]) {
    const a = new THREE.Group(); a.position.set(sx, 1.42, 0); tubuh.add(a);
    const lebarL = AT === 'kaosOversize' ? 0.2 : 0.17;
    if (lenganJenis === 'tanpa') part(0.14, 0.6, 0.17, 0, -0.28, 0, kulit, a);
    else if (lenganJenis === 'pendek') { part(lebarL + 0.01, kerah, 0.21, 0, -kerah / 2 + 0.02, 0, AT === 'ob' ? M('#2c3e66') : badan, a); part(0.14, 0.6 - kerah, 0.17, 0, -0.28 - kerah / 2, 0, kulit, a); if (AT === 'ob') part(lebarL + 0.02, 0.03, 0.22, 0, -kerah + 0.05, 0, M('#ffd23f', { emissive: 0x332200 }), a); }
    else {
      const mL = AT === 'o9' ? M('#fff6ef') : AT === 'kebaya' ? M(ubah(wa, 1.25)) : badan;
      part(0.17, 0.6, 0.2, 0, -0.28, 0, mL, a);
      if (AT === 'sweater' || AT === 'bomber') part(0.18, 0.07, 0.21, 0, -0.55, 0, M(AT === 'bomber' ? '#2b2d42' : ubah(wa, 0.8)), a);
      if (AT === 'ojol') part(0.18, 0.05, 0.21, 0, -0.3, 0, M('#ffd23f'), a);
      if (AT === 'jas' || AT === 'jasDir' || AT === 'blazer') part(0.17, 0.05, 0.2, 0, -0.56, 0, putih, a);
    }
    part(0.15, 0.12, 0.17, 0, -0.63, 0, kulit, a);
    lengan.push(a);
  }

  // ------------------------------------------------ KEPALA
  const kepala = new THREE.Group(); kepala.position.y = 1.46; tubuh.add(kepala);
  part(0.46, 0.46, 0.44, 0, 0.25, 0, kulit, kepala);
  part(0.07, 0.09, 0.02, -0.1, 0.27, 0.225, M('#2a1420'), kepala);
  part(0.07, 0.09, 0.02, 0.1, 0.27, 0.225, M('#2a1420'), kepala);
  if (P) { part(0.09, 0.02, 0.02, -0.11, 0.33, 0.226, M('#2a1420'), kepala); part(0.09, 0.02, 0.02, 0.11, 0.33, 0.226, M('#2a1420'), kepala); }
  part(0.09, 0.04, 0.02, -0.16, 0.17, 0.225, M('#ff9aa8'), kepala);
  part(0.09, 0.04, 0.02, 0.16, 0.17, 0.225, M('#ff9aa8'), kepala);
  part(0.1, 0.03, 0.02, 0, 0.12, 0.225, M(P ? '#d1495b' : '#b0302b'), kepala);
  const KP = L.kp, hijab = KP === 'hijab';
  const gaya = RAMBUT[L.r];
  if (hijab) {
    const mh = M(wa === '#ffffff' ? '#f3e6ea' : ubah(wa, 1.25));
    part(0.52, 0.16, 0.5, 0, 0.53, -0.01, mh, kepala); part(0.52, 0.62, 0.12, 0, 0.24, -0.24, mh, kepala);
    part(0.06, 0.52, 0.46, -0.25, 0.3, 0, mh, kepala); part(0.06, 0.52, 0.46, 0.25, 0.3, 0, mh, kepala);
    part(0.5, 0.1, 0.06, 0, 0.47, 0.21, mh, kepala); part(0.52, 0.12, 0.2, 0, -0.02, 0.14, mh, kepala);
    part(0.68, 0.22, 0.42, 0, -0.08, -0.01, mh, kepala);
  } else if (gaya !== 'Botak') {
    part(0.5, 0.14, 0.48, 0, 0.53, -0.01, rmb, kepala);
    part(0.5, 0.3, 0.1, 0, 0.36, -0.22, rmb, kepala);
    part(0.06, 0.22, 0.44, -0.24, 0.39, 0, rmb, kepala); part(0.06, 0.22, 0.44, 0.24, 0.39, 0, rmb, kepala);
    if (gaya !== 'Poni') part(0.5, 0.08, 0.1, 0, 0.45, 0.2, rmb, kepala);
    if (gaya === 'Panjang') { part(0.52, 0.62, 0.12, 0, 0.08, -0.24, rmb, kepala); part(0.08, 0.5, 0.3, -0.25, 0.15, -0.06, rmb, kepala); part(0.08, 0.5, 0.3, 0.25, 0.15, -0.06, rmb, kepala); }
    if (gaya === 'Kuncir') { part(0.18, 0.18, 0.18, 0, 0.42, -0.34, rmb, kepala); part(0.12, 0.34, 0.12, 0, 0.2, -0.38, rmb, kepala); }
    if (gaya === 'Keriting') for (let i = 0; i < 7; i++) part(0.17, 0.17, 0.17, Math.cos(i) * 0.2, 0.58 + (i % 2) * 0.05, Math.sin(i * 1.7) * 0.18, rmb, kepala);
    if (gaya === 'Cepol') bola(0.15, 0, 0.66, -0.12, rmb, kepala);
    if (gaya === 'Poni') { part(0.5, 0.14, 0.08, 0, 0.42, 0.21, rmb, kepala); part(0.52, 0.4, 0.12, 0, 0.18, -0.24, rmb, kepala); }
    if (gaya === 'Spike') for (let i = 0; i < 5; i++) { const s = part(0.1, 0.2, 0.1, -0.18 + i * 0.09, 0.66, 0.02 - (i % 2) * 0.1, rmb, kepala); s.rotation.z = (i - 2) * 0.2; }
  }
  // kepala
  if (KP === 'topi') { part(0.52, 0.16, 0.5, 0, 0.6, 0, M('#ff4f7b'), kepala); part(0.48, 0.04, 0.24, 0, 0.53, 0.32, M('#ff4f7b'), kepala); }
  if (KP === 'ssTopi') { const em = M('#d4a017', { emissive: 0x3a2800 }); part(0.52, 0.16, 0.5, 0, 0.6, 0, M('#1d3557'), kepala); part(0.48, 0.04, 0.24, 0, 0.53, 0.32, M('#1d3557'), kepala); part(0.14, 0.1, 0.02, 0, 0.62, 0.255, em, kepala); }
  if (KP === 'kupluk') { part(0.52, 0.22, 0.5, 0, 0.6, 0, M(ubah(wa, 0.9)), kepala); part(0.54, 0.07, 0.52, 0, 0.5, 0, M(ubah(wa, 0.7)), kepala); bola(0.07, 0, 0.75, 0, M('#ffffff'), kepala); }
  if (KP === 'pita') { part(0.14, 0.12, 0.06, -0.1, 0.62, 0.1, M('#ff4f7b'), kepala); part(0.14, 0.12, 0.06, 0.1, 0.62, 0.1, M('#ff4f7b'), kepala); part(0.06, 0.08, 0.08, 0, 0.62, 0.1, M('#d35470'), kepala); }
  if (KP === 'bando') { part(0.46, 0.04, 0.06, 0, 0.56, 0.02, M('#2a1420'), kepala); for (const sx of [-1, 1]) { const e = part(0.13, 0.16, 0.06, sx * 0.17, 0.66, 0.02, M('#ff8fab'), kepala); e.rotation.z = -sx * 0.35; } }
  if (KP === 'bunga') for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; part(0.1, 0.1, 0.1, Math.sin(a) * 0.25, 0.56, Math.cos(a) * 0.24, M(['#ff4f7b', '#ffd23f', '#ffffff'][i % 3]), kepala); }
  if (KP === 'gcBandoHati') { part(0.46, 0.04, 0.06, 0, 0.56, 0.02, M('#c0392b'), kepala); for (const sx of [-1, 1]) { const h = hatiKecil(0.075, '#ff2f5b'); h.position.set(sx * 0.15, 0.7, 0.03); kepala.add(h); } }
  if (KP === 'mahkota') { const emas = M('#ffd23f', { emissive: 0x4a3500 }); part(0.5, 0.1, 0.48, 0, 0.6, 0, emas, kepala); for (const [x, z] of [[-0.18, 0.18], [0.18, 0.18], [0, 0.2], [-0.18, -0.18], [0.18, -0.18]]) part(0.08, 0.16, 0.08, x, 0.72, z, emas, kepala); part(0.07, 0.07, 0.03, 0, 0.62, 0.25, M('#ff4f7b'), kepala); }
  if (KP === 'halo') { const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 28), M('#ffe066', { emissive: 0x806000 })); h.rotation.x = Math.PI / 2; h.position.y = 0.82; kepala.add(h); }
  if (KP === 'a14') { const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.36, 14), M('#8e5cc9')); c.position.set(0.06, 0.66, 0); c.rotation.z = -0.25; kepala.add(c); bola(0.05, 0.105, 0.84, 0, M('#ffd23f'), kepala); }
  if (KP === 'helm') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), M('#16a34a')); h.position.y = 0.36; kepala.add(h); part(0.44, 0.12, 0.04, 0, 0.36, 0.27, M('#1b1b1b', { transparent: true, opacity: 0.6 }), kepala); }
  if (KP === 'topiOb') { part(0.52, 0.14, 0.5, 0, 0.6, 0, M('#2c3e66'), kepala); part(0.48, 0.04, 0.22, 0, 0.53, 0.31, M('#2c3e66'), kepala); }
  // mata
  const MT = L.mt;
  if (MT === 'kacamata') { part(0.15, 0.12, 0.03, -0.11, 0.27, 0.24, M('#2a1420'), kepala); part(0.15, 0.12, 0.03, 0.11, 0.27, 0.24, M('#2a1420'), kepala); part(0.08, 0.03, 0.03, 0, 0.29, 0.24, M('#2a1420'), kepala); }
  if (MT === 'hitam') part(0.4, 0.11, 0.03, 0, 0.27, 0.24, M('#111111'), kepala);
  if (MT === 'bulat') for (const sx of [-0.11, 0.11]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 6, 18), M('#b08d57')); t.position.set(sx, 0.27, 0.235); kepala.add(t); }
  if (MT === 'gcKacamataBintang') { for (const sx of [-0.11, 0.11]) for (const r of [0, Math.PI / 4]) { const p = part(0.11, 0.11, 0.025, sx, 0.27, 0.24, M('#ffd23f', { emissive: 0x553300 }), kepala); p.rotation.z = r; } part(0.06, 0.025, 0.03, 0, 0.29, 0.24, M('#2a1420'), kepala); }
  if (MT === 'a12') { for (const sx of [-0.11, 0.11]) { const h = hatiKecil(0.065, '#ff4f7b'); h.position.set(sx, 0.27, 0.24); kepala.add(h); } part(0.06, 0.025, 0.03, 0, 0.29, 0.24, M('#2a1420'), kepala); }
  // telinga
  const TL = L.tl;
  if (TL === 'headset') { part(0.56, 0.05, 0.08, 0, 0.6, 0, M('#2b2d42'), kepala); part(0.08, 0.16, 0.16, -0.27, 0.3, 0, M('#2b2d42'), kepala); part(0.08, 0.16, 0.16, 0.27, 0.3, 0, M('#2b2d42'), kepala); part(0.03, 0.03, 0.2, -0.27, 0.18, 0.15, M('#2b2d42'), kepala); }
  if (TL === 'antingBulat' && !hijab) for (const sx of [-0.245, 0.245]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 14), M('#ffd23f', { emissive: 0x333300 })); t.position.set(sx, 0.1, 0.02); t.rotation.y = Math.PI / 2; kepala.add(t); }
  if (TL === 'antingMutiara' && !hijab) for (const sx of [-0.245, 0.245]) bola(0.03, sx, 0.13, 0.02, M('#ffffff', { emissive: 0x444444 }), kepala);
  if (TL === 'tindik') part(0.03, 0.03, 0.03, 0.245, 0.17, 0.02, M('#c0c4cc'), kepala);
  // leher
  const LH = L.lh;
  if (LH === 'kalung' || LH === 'kalungHati') {
    for (const sx of [-1, 1]) { const r = part(0.012, 0.14, 0.012, sx * 0.06, 1.39, depan + 0.01, M('#ffd23f')); r.rotation.z = sx * 0.5; }
    if (LH === 'kalungHati') { const h = hatiKecil(0.04, '#ff4f7b'); h.position.set(0, 1.32, depan + 0.02); tubuh.add(h); } else bola(0.022, 0, 1.33, depan + 0.015, M('#ffd23f'));
  }
  if (LH === 'syal') { part(0.48, 0.11, 0.38, 0, 1.47, 0, M('#c0392b')); part(0.1, 0.32, 0.04, 0.12, 1.3, depan + 0.02, M('#c0392b')); }
  if (LH === 'dasi' && !['jas', 'jasDir'].includes(AT)) { part(0.07, 0.34, 0.025, 0, 1.22, depan + 0.012, M('#3a6ea5')); part(0.08, 0.05, 0.03, 0, 1.4, depan + 0.012, M('#3a6ea5')); }
  if (LH === 'dasiKupu') { part(0.08, 0.07, 0.035, -0.05, 1.4, depan + 0.012, M('#2a1420')); part(0.08, 0.07, 0.035, 0.05, 1.4, depan + 0.012, M('#2a1420')); }
  // tangan (di lengan kiri / kanan)
  const TG = L.tg;
  if (TG === 'jam') { part(0.17, 0.05, 0.19, 0, -0.54, 0, M('#2a1420'), lengan[0]); part(0.06, 0.06, 0.04, 0, -0.54, 0.1, M('#ffffff'), lengan[0]); }
  if (TG === 'gelang') part(0.17, 0.035, 0.19, 0, -0.55, 0, M('#ff4f7b'), lengan[1]);
  if (TG === 'totebag') { part(0.03, 0.35, 0.03, 0, -0.35, 0.06, M('#e8d5b5'), lengan[1]); part(0.32, 0.36, 0.08, 0.13, -0.6, 0, M('#e8d5b5'), lengan[1]); const h = hatiKecil(0.04, '#ff4f7b'); h.position.set(0.2, -0.58, 0.05); lengan[1].add(h); }
  if (TG === 'tasSelempang') { const t = part(0.04, 0.85, 0.02, 0, 1.12, depan + 0.025, M('#6b4630')); t.rotation.z = 0.62; part(0.22, 0.16, 0.08, 0.25, 0.86, 0.14, M('#8a5a2b')); }
  if (TG === 'buket') { silinder(0.05, 0.02, 0.2, 0, -0.72, 0.1, M('#2f9e6e'), lengan[1]); for (let i = 0; i < 5; i++) bola(0.05, Math.sin(i * 1.3) * 0.06, -0.6, 0.1 + Math.cos(i * 1.3) * 0.06, M(['#ff4f7b', '#ffd23f', '#ffffff'][i % 3]), lengan[1]); }
  // efek
  const EF = L.ef;
  let sayap = null, aura = null, balon = null;
  if (EF === 'sayap' || EF === 'gcSayapKupu') {
    sayap = [];
    for (const sx of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(sx * 0.12, 1.3, -0.18); tubuh.add(w);
      const kupu = EF === 'gcSayapKupu';
      part(0.05, kupu ? 0.5 : 0.4, kupu ? 0.46 : 0.5, 0, kupu ? 0.05 : 0, -0.25, M(kupu ? '#8e5cc9' : '#ffffff', kupu ? { emissive: 0x220033 } : {}), w); part(0.05, 0.26, 0.3, 0, -0.22, -0.3, M(kupu ? '#ffb3e6' : '#ffe1e9'), w);
      w.rotation.y = sx * 0.5; sayap.push(w);
    }
  }
  if (EF === 'aura') {
    aura = new THREE.Group(); aura.position.y = 1.2; g.add(aura);
    for (let i = 0; i < 3; i++) { const h = hatiKecil(0.13, '#ff4f7b'); const a = i / 3 * Math.PI * 2; h.position.set(Math.sin(a) * 0.62, Math.sin(a * 2) * 0.15, Math.cos(a) * 0.62); aura.add(h); }
  }
  if (EF === 'a13') {
    balon = new THREE.Group(); balon.position.set(0.42, 0.95, 0); g.add(balon);
    const tali = part(0.012, 1.25, 0.012, 0, 0.62, 0, M('#ffffff'), balon); tali.castShadow = false;
    const h = hatiKecil(0.24, '#ff4f7b'); h.position.y = 1.4; balon.add(h);
  }

  // ------------------------------------------------ HEWAN PELIHARAAN (di samping kanan karakter)
  let pet = null;
  if (L.pt) {
    pet = new THREE.Group(); pet.position.set(0.72, 0, -0.25); g.add(pet);
    const p = (w, h, d, x, y, z, c, o = {}) => part(w, h, d, x, y, z, M(c, o), pet);
    if (L.pt === 'pKucing' || L.pt === 'pAnjing') {
      const c = L.pt === 'pKucing' ? '#f0a14a' : '#d9a066', c2 = L.pt === 'pKucing' ? '#ffffff' : '#fff6ef';
      p(0.22, 0.2, 0.42, 0, 0.22, 0, c); p(0.06, 0.16, 0.06, -0.07, 0.07, 0.14, c); p(0.06, 0.16, 0.06, 0.07, 0.07, 0.14, c); p(0.06, 0.16, 0.06, -0.07, 0.07, -0.14, c); p(0.06, 0.16, 0.06, 0.07, 0.07, -0.14, c);
      p(0.22, 0.2, 0.2, 0, 0.36, 0.26, c); p(0.14, 0.08, 0.02, 0, 0.32, 0.365, c2);
      p(0.03, 0.03, 0.02, -0.05, 0.39, 0.362, '#2a1420'); p(0.03, 0.03, 0.02, 0.05, 0.39, 0.362, '#2a1420');
      for (const sx of [-1, 1]) { const e = p(0.07, L.pt === 'pKucing' ? 0.09 : 0.12, 0.04, sx * 0.07, 0.5, 0.24, c); e.rotation.z = sx * (L.pt === 'pKucing' ? 0.2 : 0.5); }
      const ek = p(0.05, 0.05, L.pt === 'pKucing' ? 0.3 : 0.12, 0, 0.32, -0.32, c); ek.rotation.x = L.pt === 'pKucing' ? -0.7 : -0.3;
    } else if (L.pt === 'pKelinci') {
      p(0.22, 0.22, 0.26, 0, 0.14, 0, '#ffffff'); p(0.18, 0.18, 0.18, 0, 0.32, 0.1, '#ffffff');
      for (const sx of [-1, 1]) { p(0.05, 0.22, 0.03, sx * 0.05, 0.5, 0.08, '#ffffff'); p(0.03, 0.15, 0.035, sx * 0.05, 0.5, 0.09, '#ffb3c6'); }
      p(0.03, 0.03, 0.02, -0.04, 0.34, 0.19, '#2a1420'); p(0.03, 0.03, 0.02, 0.04, 0.34, 0.19, '#2a1420'); bola(0.05, 0, 0.16, -0.15, M('#ffffff'), pet);
    } else if (L.pt === 'pAyam') {
      p(0.2, 0.22, 0.28, 0, 0.24, 0, '#ffffff'); p(0.14, 0.16, 0.14, 0, 0.42, 0.1, '#ffffff'); p(0.03, 0.1, 0.08, 0, 0.53, 0.1, '#e1251b');
      p(0.05, 0.04, 0.06, 0, 0.42, 0.2, '#ffd23f'); p(0.03, 0.12, 0.03, -0.05, 0.07, 0, '#ffd23f'); p(0.03, 0.12, 0.03, 0.05, 0.07, 0, '#ffd23f'); p(0.18, 0.16, 0.06, 0, 0.32, -0.16, '#2f6e2f');
    }
  }

  // ------------------------------------------------ BAWAAN
  const kanan = lengan[1];
  if (bawa === 'pel') { part(0.04, 1.3, 0.04, 0, -0.45, 0.12, M('#b08d57'), kanan); part(0.32, 0.1, 0.14, 0, -1.12, 0.12, M('#8fd3ff'), kanan); }
  if (bawa === 'sapu') { part(0.04, 1.2, 0.04, 0, -0.45, 0.12, M('#b08d57'), kanan); part(0.3, 0.2, 0.08, 0, -1.08, 0.12, M('#d9a441'), kanan); }
  if (bawa === 'box') { part(0.5, 0.48, 0.42, 0, 1.22, -0.4, M('#16a34a')); part(0.36, 0.1, 0.02, 0, 1.3, -0.62, M('#ffffff')); }
  if (bawa === 'kopi') { silinder(0.055, 0.045, 0.14, 0, -0.66, 0.12, M('#ffffff'), kanan); silinder(0.06, 0.06, 0.03, 0, -0.58, 0.12, M('#8a5a2b'), kanan); }
  if (bawa === 'paket') { part(0.24, 0.26, 0.16, 0, -0.78, 0.08, M('#c8a46e'), kanan); part(0.1, 0.06, 0.02, 0, -0.7, 0.17, M('#16a34a'), kanan); }
  if (bawa === 'nampan') { part(0.42, 0.03, 0.3, 0, -0.62, 0.22, M('#c0c4cc'), kanan); silinder(0.05, 0.04, 0.12, 0.08, -0.55, 0.22, M('#ffffff'), kanan); }
  if (bawa === 'map') part(0.24, 0.3, 0.04, 0, -0.62, 0.1, M('#3a6ea5'), kanan);
  if (bawa === 'laptop') { part(0.4, 0.03, 0.28, 0, -0.66, 0.24, M('#c0c4cc'), kanan); }

  g.userData = { kaki, lengan, tubuh, kepala, sayap, aura, balon, pet, fase: Math.random() * 6 };
  return g;
}

// a: 0 diam, 1 jalan, 2 duduk, 3 ngepel/menyapu, 4 makan/minum, 5 melambai, 6 ngetik (duduk)
export function pose(ch, a, dt, cepat = 1, paksaDuduk = false) {
  const u = ch.userData;
  if (a === 1) u.fase += dt * 9 * cepat; else u.fase += dt;
  const s = a === 1 ? Math.sin(u.fase) * 0.7 : 0;
  const lerp = (o, v) => o + (v - o) * Math.min(1, dt * 14 || 1);
  const duduk = a === 2 || a === 6 || paksaDuduk;
  u.kaki[0].rotation.x = lerp(u.kaki[0].rotation.x, duduk ? -Math.PI / 2 : s);
  u.kaki[1].rotation.x = lerp(u.kaki[1].rotation.x, duduk ? -Math.PI / 2 : -s);
  let l0 = duduk ? -0.5 : -s * 0.8, l1 = duduk ? -0.5 : s * 0.8, z1 = 0;
  if (a === 3) { const w = Math.sin(u.fase * 3); l0 = -0.7 + w * 0.25; l1 = -0.9 + w * 0.3; }
  if (a === 4) { const w = (Math.sin(u.fase * 1.6) + 1) / 2; l1 = -0.4 - w * 1.9; }
  if (a === 5) { l1 = -Math.PI * 0.92; z1 = 0.25 + Math.sin(u.fase * 9) * 0.35; }
  if (a === 6) { const w = Math.sin(u.fase * 14) * 0.08; l0 = -1.05 + w; l1 = -1.05 - w; }
  let z0 = 0, putar = 0, tunduk = 0, loncat = 0;
  if (a === 7) { const w = Math.sin(u.fase * 7); l0 = -2.6 + w * 0.5; l1 = -2.6 - w * 0.5; z0 = -0.3; z1 = 0.3; putar = w * 0.35; loncat = Math.abs(Math.sin(u.fase * 7)) * 0.1; }
  if (a === 8) { l0 = -2.3; l1 = -2.3; z0 = 0.35; z1 = -0.35; tunduk = 0.35; }
  if (a === 9) { const w = Math.abs(Math.sin(u.fase * 12)); l0 = -1.3; l1 = -1.3; z0 = -0.25 + w * 0.3; z1 = 0.25 - w * 0.3; }
  if (a === 10) { l0 = -2.9; l1 = -2.9; z0 = 0.45; z1 = -0.45; }
  if (a === 11) { l0 = -1.45; l1 = -1.45; z0 = -0.55; z1 = 0.55; }
  u.lengan[0].rotation.x = lerp(u.lengan[0].rotation.x, l0);
  u.lengan[1].rotation.x = lerp(u.lengan[1].rotation.x, l1);
  u.lengan[1].rotation.z = lerp(u.lengan[1].rotation.z, z1);
  u.lengan[0].rotation.z = lerp(u.lengan[0].rotation.z, z0);
  u.tubuh.rotation.y = lerp(u.tubuh.rotation.y, putar);
  u.kepala.rotation.x = lerp(u.kepala.rotation.x, tunduk);
  u.tubuh.position.y = lerp(u.tubuh.position.y, duduk ? -0.31 : (a === 1 ? Math.abs(Math.cos(u.fase)) * 0.05 : loncat));
  u.tubuh.rotation.x = lerp(u.tubuh.rotation.x, a === 3 ? 0.18 : 0);
  if (a === 0) u.kepala.rotation.y = Math.sin(u.fase * 0.4) * 0.15; else u.kepala.rotation.y = lerp(u.kepala.rotation.y, 0);
  if (u.sayap) { const f = Math.sin(performance.now() / 170) * 0.3; u.sayap[0].rotation.y = -0.5 - f; u.sayap[1].rotation.y = 0.5 + f; }
  if (u.aura) u.aura.rotation.y += (dt || 0.016) * 1.6;
  if (u.pet) { u.pet.position.y = a === 1 ? Math.abs(Math.sin(u.fase * 1.3)) * 0.08 : 0; u.pet.rotation.y = a === 1 ? 0 : Math.sin(u.fase * 0.5) * 0.4; }
  if (u.balon) { const t = performance.now() / 900; u.balon.rotation.z = Math.sin(t) * 0.12; u.balon.rotation.x = Math.cos(t * 0.7) * 0.08; }
}
