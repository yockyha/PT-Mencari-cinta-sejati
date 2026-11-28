// Memasukkan barang ke akun pembeli setelah pembayaran lunas.
import PAKET, { hitungItem, ucapanDonasi, namaPapan, dataLayar } from '../paket.js';
import { TS } from './firebase.js';

const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');

// Klaim pesanan secara atomik supaya notifikasi ganda tidak memberi barang dua kali.
export async function klaim(db, id) {
  const r = await db.atomik('pesanan/' + id, v => (v && v.status === 'menunggu' ? { ...v, status: 'diproses' } : undefined));
  return r.ok ? r.baru : null;
}

export async function lunasi(db, id, v, metodeBayar) {
  const it = hitungItem(PAKET, v);
  if (!it) throw new Error('Paket tidak dikenal: ' + v.paket);
  const sekarang = Date.now();
  let pesan;
  if (it.jenis === 'diamond') {
    await db.atomik('diamond/' + v.uid, x => (+x || 0) + it.diamond);
    pesan = `💠 ${it.diamond} Diamond sudah masuk ke akunmu. Selamat belanja di Lemari Diamond!`;
  } else if (it.jenis === 'layar') {
    const d = dataLayar(PAKET, v, v.n);
    await db.push('clubLayar', { uid: v.uid, n: d.nt || 'Seseorang 🤫', ke: d.ke, m: d.pesan || '💖', tema: d.tema, via: 'bayar', t: TS });
    pesan = '🪩 Ucapanmu sudah tampil di layar Y.H.A Club! Masuk ke club buat lihat 💌';
  } else if (it.jenis === 'donasi') {
    await db.push('papanDonasi', { n: namaPapan(v), nominal: it.harga, m: String(v.pesan || '').slice(0, 100), t: TS });
    await db.atomik('donatur/' + v.uid, x => ({ n: namaPapan({ ...v, tampil: true }), total: ((x && x.total) || 0) + it.harga, kali: ((x && x.kali) || 0) + 1, tampil: v.tampil !== false, t: sekarang }));
    pesan = ucapanDonasi(it.harga);
  } else {
    if (it.exp) await db.atomik('expBeli/' + v.uid, x => (+x || 0) + it.exp);
    // tingkat: paket VVIP menaikkan ke vvip; paket VIP tidak menurunkan VVIP yang masih aktif
    let tingkatAkhir = '';
    if (it.vipHari) tingkatAkhir = (await db.atomik('vip/' + v.uid, x => {
      const aktif = x && x.sampai > sekarang;
      const tingkat = it.tingkat === 'vvip' || (aktif && x.tingkat === 'vvip') ? 'vvip' : 'vip';
      return { sampai: Math.max(sekarang, (x && x.sampai) || 0) + it.vipHari * 86400e3, tingkat };
    })).baru.tingkat;
    if (it.tingkat) pesan = tingkatAkhir === 'vvip' && it.tingkat === 'vip' ? `👑 Masa aktif VVIP-mu bertambah ${it.vipHari} hari. Terima kasih!` : `${tingkatAkhir === 'vvip' ? '👑 VVIP' : '💎 VIP'} kamu aktif ${it.vipHari} hari. Selamat menikmati semua fiturnya!`;
    else pesan = `Pembelian ${it.nama} berhasil. Terima kasih sudah mendukung kantor! 💖`;
  }
  await db.push('riwayat', { uid: v.uid, n: v.n, paket: it.paket, jenis: it.jenis, nama: it.nama, harga: it.harga, metode: 'otomatis', bayar: String(metodeBayar || '').slice(0, 30), kode: id, oleh: 'otomatis', t: TS });
  await db.push('notif/' + v.uid, { m: pesan, t: TS, j: it.jenis === 'donasi' ? 'donasi' : 'bayar' });
  await db.hapus('pesanan/' + id);
}

export async function batalkan(db, id, v, alasan) {
  await db.hapus('pesanan/' + id);
  await db.push('notif/' + v.uid, { m: alasan || `Pembayaran ${v.nama || ''} ${rp(v.nominal)} dibatalkan atau kedaluwarsa. Silakan pesan lagi kapan saja.`, t: TS });
}
