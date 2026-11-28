// POST /api/bayar/buat  →  membuat pesanan & halaman bayar Midtrans
// Body: { idToken, jenis: 'diamond'|'paket'|'donasi'|'layar', paket, nominal?, pesan?, tampil?, ke?, tema?, nt? }
import PAKET, { hitungItem, dataLayar } from '../../../paket.js';
import { buatDb, uidDariToken, TS } from '../../../server/firebase.js';
import { buatTransaksi } from '../../../server/midtrans.js';

const balas = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  try {
    if (!env.MIDTRANS_SERVER_KEY) return balas({ error: 'Pembayaran otomatis belum diaktifkan.' }, 503);
    const b = await request.json().catch(() => ({}));
    const uid = await uidDariToken(env, b.idToken);
    if (!uid) return balas({ error: 'Sesi tidak sah. Muat ulang halaman lalu coba lagi.' }, 401);
    const db = buatDb(env);
    const [anggota, peran, ban] = await Promise.all([db.get('anggota/' + uid), db.get('peran/' + uid), db.get('ban/' + uid)]);
    if (!anggota && !peran) return balas({ error: 'Hanya tamu resmi yang bisa membeli.' }, 403);
    if (ban && ban.sampai > Date.now()) return balas({ error: 'Akunmu sedang dikeluarkan dari kantor.' }, 403);
    const it = hitungItem(PAKET, b);
    if (!it) return balas({ error: 'Paket atau nominal tidak sah.' }, 400);
    const n = String((anggota && anggota.n) || 'Direktur').slice(0, 30);
    const orderId = 'MCS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();
    await db.set('pesanan/' + orderId, {
      uid, n, paket: it.paket, jenis: it.jenis, nama: it.nama, nominal: it.harga, metode: 'otomatis', kode: orderId, status: 'menunggu', t: TS,
      ...(it.jenis === 'layar' ? dataLayar(PAKET, b, n) : {}),
      ...(it.jenis === 'donasi' ? { pesan: String(b.pesan || '').slice(0, 100), tampil: b.tampil !== false, nt: String(b.nt || n).trim().slice(0, 20) } : {}),
    });
    const asal = new URL(request.url).origin;
    const trx = await buatTransaksi(env, { orderId, harga: it.harga, nama: it.nama, paket: it.paket, pelanggan: n, kembaliKe: asal + '/kantor/?bayar=selesai' });
    return balas({ orderId, redirect_url: trx.redirect_url, token: trx.token });
  } catch (e) {
    console.error('buat', e);
    return balas({ error: 'Gagal membuat pembayaran. Coba lagi sebentar.' }, 500);
  }
}
