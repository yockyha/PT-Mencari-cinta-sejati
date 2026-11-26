// Bagian bersama halaman info: menu, kaki, kontak, dan tabel harga dari paket.js.
import PAKET from '../paket.js?v=202611260649';

const c = window.PT_CONFIG || {};
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
const MENU = [['harga', 'Produk & Harga'], ['syarat', 'Syarat & Ketentuan'], ['refund', 'Pengembalian Dana'], ['kontak', 'Kontak']];
const ini = document.body.dataset.hal;

document.querySelector('nav').innerHTML = MENU.map(([h, n]) =>
  `<a href="${h}.html"${h === ini ? ' aria-current="page"' : ''}>${n}</a>`).join('');
document.querySelector('footer').innerHTML =
  `© ${new Date().getFullYear()} ${c.namaPT || 'PT Mencari Cinta Sejati'} · ` +
  MENU.map(([h, n]) => `<a href="${h}.html">${n}</a>`).join('·') + ' · <a href="../index.html">Beranda</a>';

// Kontak
const isiKontak = [];
if (c.kontak?.email) isiKontak.push(['Email', `<a href="mailto:${c.kontak.email}">${c.kontak.email}</a>`]);
if (c.kontak?.wa) isiKontak.push(['WhatsApp', `<a href="https://wa.me/${c.kontak.wa}" target="_blank" rel="noopener">+${c.kontak.wa}</a>`]);
if (c.instagram) isiKontak.push(['Instagram', `<a href="https://www.instagram.com/${c.instagram}/" target="_blank" rel="noopener">@${c.instagramNama || c.instagram}</a> (DM)`]);
if (c.tiktok) isiKontak.push(['TikTok', `<a href="https://www.tiktok.com/@${c.tiktok}" target="_blank" rel="noopener">@${c.tiktok}</a>`]);
document.querySelectorAll('[data-kontak]').forEach(el => {
  el.innerHTML = '<table>' + isiKontak.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('') + '</table>';
});

// Tabel harga
const tabel = (judul, baris) => `<div class="kartu"><h2 style="margin-top:0">${judul}</h2><table>
  <tr><th>Produk</th><th>Keterangan</th><th class="harga">Harga</th></tr>
  ${baris.map(([n, k, h]) => `<tr><td>${n}</td><td>${k || ''}</td><td class="harga">${h}</td></tr>`).join('')}</table></div>`;
const elHarga = document.querySelector('[data-harga]');
if (elHarga) {
  const toko = PAKET.toko.filter(p => !p.sembunyi);
  const vip = PAKET.toko.filter(p => p.tingkat);
  elHarga.innerHTML =
    tabel('💠 Diamond (mata uang dalam game)', PAKET.diamond.map(p => [`${p.diamond} Diamond`, p.ket || 'Untuk membeli outfit, aksesoris & langganan', rp(p.harga)])) +
    tabel('👑 Keanggotaan (berlaku 30 hari)', vip.map(p => [p.nama,
      p.tingkat === 'vvip' ? 'Semua keuntungan VIP + dapat melihat data sosial media tamu, batas anggota grup lebih besar' : 'Lencana VIP, bisa membuat grup, outfit & fitur khusus',
      rp(p.harga)]).concat(PAKET.langganan.map(l => [`${l.nama} (dengan Diamond)`, `Dibayar ${l.diamond} 💠`, `${l.diamond} 💠`]))) +
    tabel('⭐ Paket EXP', toko.map(p => [p.nama, p.ket, rp(p.harga)])) +
    tabel('💝 Donasi', [['Donasi sukarela', 'Mendukung biaya server & pengembangan', `mulai ${rp(PAKET.donasi.min)}`]]);
}
