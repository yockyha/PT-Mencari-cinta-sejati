// Alat UI bersama + status bersama (K) untuk modul-modul kantor.
import { esc } from '../js/common.js?v=202611260150';

export const $ = id => document.getElementById(id);

// Status bersama yang diisi kantor.js: L (layanan), saya, prof, lain, bot, peran, tamu, pindah(), bicara() ...
export const K = { peran: {}, tamu: [], lain: new Map(), bot: [], sembunyi: new Set() };

let toastT;
export function toast(t, lama = 2600) {
  const el = $('toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), lama);
}

let saatTutup = null;
export function bukaKartu(html, { bawah = false, pasang, tutup } = {}) {
  const k = $('kartu'), isi = k.querySelector('.isi');
  if (saatTutup) { const f = saatTutup; saatTutup = null; f(); }
  isi.innerHTML = `<button class="x" type="button" aria-label="Tutup">✕</button>` + html;
  k.classList.toggle('bawah', bawah);
  k.hidden = false;
  isi.scrollTop = 0;
  isi.querySelector('.x').onclick = tutupKartu;
  saatTutup = tutup || null;
  pasang && pasang(isi);
  const f = isi.querySelector('input:not([type=checkbox]):not([type=radio]),textarea');
  if (f && !bawah && matchMedia('(hover:hover)').matches) setTimeout(() => f.focus(), 50);
  return isi;
}
export function tutupKartu() {
  $('kartu').hidden = true;
  if (saatTutup) { const f = saatTutup; saatTutup = null; f(); }
  $('c').focus();
}
export const kartuTerbuka = () => !$('kartu').hidden;
export const modalTengah = () => !$('kartu').hidden && !$('kartu').classList.contains('bawah');

export function tulisLog(nama, teks, jenis = '') {
  const log = $('log');
  const p = document.createElement('p');
  if (jenis) p.className = jenis;
  p.innerHTML = jenis === 'sys' ? esc(teks) : `<b>${esc(nama)}</b> ${esc(teks)}`;
  log.appendChild(p);
  while (log.children.length > 6) log.firstChild.remove();
  setTimeout(() => p.classList.add('pudar'), 14000);
  setTimeout(() => p.remove(), 15500);
}

export const jam = t => { try { return new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }); } catch (e) { return ''; } };
export const tanggalJam = t => { try { return new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }); } catch (e) { return ''; } };
